import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-supabase-api-key, content-type, accept",
};

type KnowledgeItem = {
  question?: string | null;
  answer?: string | null;
  keywords?: string[] | string | null;
};

type HistoryItem = {
  sender_type: "user" | "bot" | "admin";
  message: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sseResponse(reply: string, headers: Record<string, string> = {}) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: reply })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        ...headers,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    },
  );
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function normalizeKeywords(keywords: KnowledgeItem["keywords"]) {
  if (Array.isArray(keywords)) {
    return keywords;
  }

  if (typeof keywords === "string") {
    return keywords
      .split(/[,，、;\n\r]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function findKnowledgeMatch(message: string, knowledge: KnowledgeItem[]) {
  const normalized = message.toLowerCase();

  for (const item of knowledge) {
    const keywords = normalizeKeywords(item.keywords);
    const haystack = [item.question, ...keywords].filter(Boolean).join(" ").toLowerCase();

    if (haystack && haystack.split(/\s+/).some((token) => token && normalized.includes(token))) {
      return item.answer?.trim() || null;
    }
  }

  return null;
}

function fallbackReply(message: string, knowledge: KnowledgeItem[]) {
  const normalized = message.toLowerCase();
  const matchedAnswer = findKnowledgeMatch(message, knowledge);

  if (matchedAnswer) {
    return `${matchedAnswer}\n\n如果你需要，我也可以幫你整理成更完整的說明。`;
  }

  if (hasAny(normalized, ["運費", "宅配", "shipping", "delivery"])) {
    return "可以，運費會依商品設定的級距自動計算，也可以疊加不同商品的運費。若你提供商品名稱，我可以幫你說明適用的運費規則。";
  }

  if (hasAny(normalized, ["禮盒", "gift", "送禮", "伴手禮", "禮品"])) {
    return "如果是送禮用途，我可以幫你整理適合的禮盒與推薦組合，也可以直接依預算和場合幫你篩選。";
  }

  if (hasAny(normalized, ["付款", "金流", "payment", "轉帳"])) {
    return "目前付款方式以銀行轉帳為主。如果你要，我也可以幫你補上結帳流程與轉帳注意事項。";
  }

  if (hasAny(normalized, ["退貨", "退款", "return", "refund"])) {
    return "退換貨規則會依商品與狀況判斷，如果你告訴我是哪一筆訂單或哪個商品，我可以先幫你整理處理方向。";
  }

  return "我是小 M AI 客服，可以協助你查詢商品、運費、付款、門市與退換貨資訊。你也可以直接告訴我商品名稱或頁面內容，我會幫你整理重點。";
}

async function readBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const payload = await readBody(req);
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    const sessionId = typeof payload?.session_id === "string" ? payload.session_id.trim() : "";

    if (!message || !sessionId) {
      return jsonResponse({ error: "message and session_id are required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const openaiKey = Deno.env.get("OPENAI_API_KEY")?.trim();

    let knowledge: KnowledgeItem[] = [];
    let history: HistoryItem[] = [];

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const [{ data: kbData, error: kbError }, { data: historyData, error: historyError }] = await Promise.all([
        supabase
          .from("knowledge_base")
          .select("question, answer, keywords")
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .limit(60),
        supabase
          .from("chat_messages")
          .select("sender_type, message")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true })
          .limit(12),
      ]);

      if (kbError) {
        console.error("ai-chat knowledge lookup failed", kbError);
      }

      if (historyError) {
        console.error("ai-chat history lookup failed", historyError);
      }

      knowledge = (kbData || []) as KnowledgeItem[];
      history = (historyData || []) as HistoryItem[];
    }

    if (!openaiKey) {
      return sseResponse(fallbackReply(message, knowledge), {
        "X-AI-Mode": "fallback-missing-openai-key",
      });
    }

    const kbContext = knowledge.length
      ? knowledge.map((item) => `Q: ${item.question || ""}\nA: ${item.answer || ""}`).join("\n\n")
      : "目前沒有可用的知識庫條目。";

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content:
          "你是淞品土雞的 AI 客服，請用繁體中文回答，語氣自然、簡潔、清楚。優先根據知識庫內容回答；若資料不足，先承認不確定並提供下一步建議。回答盡量控制在 150 字以內。以下是知識庫內容：\n\n" +
          kbContext,
      },
    ];

    for (const item of history) {
      messages.push({
        role: item.sender_type === "user" ? "user" : "assistant",
        content: item.message,
      });
    }

    messages.push({ role: "user", content: message });

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.6,
        max_tokens: 350,
        stream: true,
      }),
    });

    if (!openaiRes.ok || !openaiRes.body) {
      const errorText = await openaiRes.text().catch(() => "");
      console.error("OpenAI chat request failed", openaiRes.status, errorText);
      return sseResponse(fallbackReply(message, knowledge), {
        "X-AI-Mode": "fallback-openai-error",
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          const reader = openaiRes.body!.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;

                const data = line.slice(6).trim();
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content ?? "";
                  if (delta) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                  }
                } catch {
                  // Ignore partial or non-JSON event chunks from the upstream stream.
                }
              }
            }
          } catch (error) {
            console.error("AI chat stream failed", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: fallbackReply(message, knowledge) })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally {
            controller.close();
          }
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      },
    );
  } catch (error) {
    console.error("AI chat error:", error);
    return sseResponse("目前 AI 客服暫時無法完整回應，請稍後再試，或切換真人客服。", {
      "X-AI-Mode": "fallback-function-error",
    });
  }
});
