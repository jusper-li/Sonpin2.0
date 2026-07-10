import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-supabase-api-key, content-type, accept",
};

const AI_MODEL = "gpt-5.4-mini";
const EMBEDDING_MODEL = "text-embedding-3-small";
const SITE_MATCH_THRESHOLD = 0.68;
const SITE_MATCH_COUNT = 6;
const KNOWLEDGE_CONTEXT_LIMIT = 24;
const SITE_ORIGIN = "https://sonpin.netlify.app";

type KnowledgeItem = {
  question?: string | null;
  answer?: string | null;
  keywords?: string[] | string | null;
};

type HistoryItem = {
  sender_type: "user" | "bot" | "admin";
  message: string;
};

type SemanticMatch = {
  source_table?: string | null;
  source_title?: string | null;
  source_slug?: string | null;
  content_type?: string | null;
  content_text?: string | null;
  metadata?: Record<string, unknown> | null;
  similarity?: number | null;
};

function getMatchUrl(match: SemanticMatch) {
  const metadata = match.metadata || {};
  const explicitUrl =
    typeof metadata.source_url === "string"
      ? metadata.source_url.trim()
      : typeof metadata.canonical_url === "string"
        ? metadata.canonical_url.trim()
        : typeof metadata.url === "string"
          ? metadata.url.trim()
          : "";

  if (explicitUrl) return explicitUrl;

  const slug = (match.source_slug || "").trim();
  const table = (match.source_table || "").trim();

  if (table === "products" && slug) return `${SITE_ORIGIN}/product/${slug}`;
  if (table === "articles" && slug) return `${SITE_ORIGIN}/service/${slug}`;
  if (table === "faqs") return `${SITE_ORIGIN}/faq`;
  if (table === "stores") return `${SITE_ORIGIN}/store`;
  if (table === "homepage_sections") return SITE_ORIGIN;
  if (table === "categories" && slug) {
    if (slug === "main-products") return `${SITE_ORIGIN}/products/6`;
    if (slug === "other-products") return `${SITE_ORIGIN}/products/7`;
    return `${SITE_ORIGIN}/products/${slug}`;
  }
  if (table === "static_pages" && slug) return `${SITE_ORIGIN}/${slug}`;
  if (table === "seo_settings") {
    const pagePath = typeof metadata.page_path === "string" ? metadata.page_path.trim() : "";
    if (pagePath) return pagePath.startsWith("http") ? pagePath : `${SITE_ORIGIN}${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}`;
  }

  return "";
}

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

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function normalizeKeywords(keywords: KnowledgeItem["keywords"]) {
  if (Array.isArray(keywords)) return keywords;
  if (typeof keywords === "string") {
    return keywords
      .split(/[,，\n\r|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function findKnowledgeMatch(message: string, knowledge: KnowledgeItem[]) {
  const normalized = normalizeText(message);

  for (const item of knowledge) {
    const keywords = normalizeKeywords(item.keywords);
    const haystack = [item.question, ...keywords].filter(Boolean).join(" ").toLowerCase();

    if (haystack && haystack.split(/\s+/).some((token) => token && normalized.includes(token))) {
      return item.answer?.trim() || null;
    }
  }

  return null;
}

function isSiteTopicQuestion(message: string) {
  const normalized = normalizeText(message);
  return hasAny(normalized, [
    "商品",
    "產品",
    "門市",
    "店面",
    "faq",
    "常見問題",
    "運費",
    "付款",
    "結帳",
    "about",
    "關於",
    "製程",
    "process",
    "media",
    "文章",
    "老饕",
    "食譜",
    "shipping",
    "退貨",
    "隱私",
    "會員",
    "客服",
    "禮盒",
    "分類",
    "商品分類",
  ]);
}

function fallbackReply(message: string, knowledge: KnowledgeItem[]) {
  const matchedAnswer = findKnowledgeMatch(message, knowledge);
  if (matchedAnswer) return matchedAnswer;

  if (isSiteTopicQuestion(message)) {
    return "我目前只能根據本站資料回答。請告訴我你想查的是商品、門市、FAQ、運費、付款、關於、製程、媒體或會員相關內容，我可以直接幫你整理。";
  }

  return "我只能回答本站內容，請詢問商品、門市、服務、FAQ、運費、付款、關於、製程或媒體相關問題。";
}

function cleanSnippet(text: string, limit = 280) {
  const cleaned = text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1)}…`;
}

function formatKnowledgeContext(knowledge: KnowledgeItem[]) {
  if (!knowledge.length) return "（無知識庫資料）";

  return knowledge
    .slice(0, KNOWLEDGE_CONTEXT_LIMIT)
    .map((item, index) => {
      const question = cleanSnippet(item.question || "", 180);
      const answer = cleanSnippet(item.answer || "", 360);
      return `${index + 1}. Q: ${question}\nA: ${answer}`;
    })
    .join("\n\n");
}

function formatSemanticContext(matches: SemanticMatch[]) {
  if (!matches.length) return "（無向量命中）";

  return matches
    .map((match, index) => {
      const title = match.source_title || "未命名內容";
      const table = match.source_table || "content";
      const type = match.content_type || "page";
      const slug = match.source_slug ? ` / ${match.source_slug}` : "";
      const similarity = typeof match.similarity === "number" ? ` ${(match.similarity * 100).toFixed(1)}%` : "";
      const snippet = cleanSnippet(match.content_text || "", 360);
      const url = getMatchUrl(match);
      const linkLine = url ? `\n參考連結：${url}` : "";
      return `${index + 1}. [${table}:${type}] ${title}${slug}${similarity}\n${snippet}${linkLine}`;
    })
    .join("\n\n");
}

function siteContentLanguageNote() {
  return [
    "請用繁體中文回答，並優先依據站內內容作答。",
    "如果有可對應的站內頁面，請在回答最後加上「參考連結：網址」，讓使用者可以直接點開查看內容。",
    "回答請以清楚、實用、可直接給顧客看的方式呈現。",
  ].join(" ");
}

async function readBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

async function getEmbedding(openaiKey: string, text: string) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenAI embeddings request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;

  if (!Array.isArray(embedding) || !embedding.length) {
    throw new Error("OpenAI embeddings response was empty");
  }

  return embedding as number[];
}

async function getSemanticMatches(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[],
) {
  const { data, error } = await supabase.rpc("match_site_content", {
    query_embedding: queryEmbedding,
    match_threshold: SITE_MATCH_THRESHOLD,
    match_count: SITE_MATCH_COUNT,
  });

  if (error) {
    console.error("ai-chat semantic lookup failed", error);
    return [];
  }

  return (data || []) as SemanticMatch[];
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
    let semanticMatches: SemanticMatch[] = [];

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const [{ data: kbData, error: kbError }, { data: historyData, error: historyError }] = await Promise.all([
        supabase
          .from("knowledge_base")
          .select("question, answer, keywords")
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .limit(KNOWLEDGE_CONTEXT_LIMIT),
        supabase
          .from("chat_messages")
          .select("sender_type, message")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true })
          .limit(12),
      ]);

      if (kbError) console.error("ai-chat knowledge lookup failed", kbError);
      if (historyError) console.error("ai-chat history lookup failed", historyError);

      knowledge = (kbData || []) as KnowledgeItem[];
      history = (historyData || []) as HistoryItem[];

      if (openaiKey) {
        try {
          const queryEmbedding = await getEmbedding(openaiKey, message);
          semanticMatches = await getSemanticMatches(supabase, queryEmbedding);
        } catch (error) {
          console.error("ai-chat semantic retrieval failed", error);
        }
      }
    }

    if (!openaiKey) {
      return sseResponse(fallbackReply(message, knowledge), {
        "X-AI-Mode": "fallback-missing-openai-key",
      });
    }

    const semanticContext = formatSemanticContext(semanticMatches);
    const kbContext = formatKnowledgeContext(knowledge);

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content:
          `${siteContentLanguageNote()}\n\n` +
          `【站內內容】\n${semanticContext}\n\n` +
          `【知識庫】\n${kbContext}`,
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
        temperature: 0.2,
        max_completion_tokens: 450,
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
                  // Ignore non-JSON stream fragments.
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
    return sseResponse("我目前無法完成回覆，請稍後再試。", {
      "X-AI-Mode": "fallback-function-error",
    });
  }
});
