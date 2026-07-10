import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-supabase-api-key, content-type, accept",
};

const AI_MODEL = "gpt-5.4-mini";

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
  const matchedAnswer = findKnowledgeMatch(message, knowledge);

  if (matchedAnswer) {
    return matchedAnswer;
  }

  const normalized = message.toLowerCase();

  if (hasAny(normalized, ["禮盒", "商品", "產品", "product", "main product", "other products", "分類", "主打", "其他"])) {
    return "是，禮盒屬於本站商品之一。你可以到商品頁查看分類、價格與詳細內容。";
  }

  if (hasAny(normalized, ["門市", "store", "店面", "地址", "電話", "營業時間"])) {
    return "可以，本站有門市資訊頁，可以查看各門市地址、電話與營業時間。";
  }

  if (hasAny(normalized, ["faq", "常見問題", "運費", "付款", "退貨", "退款", "出貨"])) {
    return "可以，這些都屬於本站資訊範圍，我可以依頁面內容幫你整理。";
  }

  if (hasAny(normalized, ["關於", "about", "品牌", "生產", "製程", "media", "新聞", "文章"])) {
    return "可以，本站有關於、製程與媒體文章內容。";
  }

  return "我只能回答本站內容，請詢問商品、門市、服務、FAQ、運費或付款等本站資訊。";
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
          "你是淞品土雞的 AI 客服，只能回答本站內容。請用繁體中文回答，語氣自然、簡潔、清楚。優先根據知識庫內容回答；如果問題屬於本站的商品、門市、FAQ、運費、付款、關於、製程或媒體內容，請直接根據本站資料回答；若問題明顯不屬於本站內容，才回覆「我只能回答本站內容」。回答盡量控制在 150 字以內。以下是知識庫內容：\n\n" +
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
        model: AI_MODEL,
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
