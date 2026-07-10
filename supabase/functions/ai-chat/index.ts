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

type ProductItem = {
  name?: string | null;
  slug?: string | null;
  summary?: string | null;
  description?: string | null;
  price?: number | null;
  sale_price?: number | null;
  member_price?: number | null;
  stock?: number | null;
  is_featured?: boolean | null;
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

function isProductTopicQuestion(message: string) {
  const normalized = normalizeText(message);
  return hasAny(normalized, [
    "商品",
    "產品",
    "禮盒",
    "送禮",
    "推薦",
    "哪款",
    "哪個",
    "雞湯",
    "滴雞精",
    "雞肉",
    "全雞",
    "伴手禮",
    "禮物",
    "價格",
    "價錢",
    "售價",
    "庫存",
  ]);
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

function fallbackReply(message: string, knowledge: KnowledgeItem[], products: ProductItem[] = []) {
  const matchedAnswer = findKnowledgeMatch(message, knowledge);
  if (matchedAnswer) return matchedAnswer;

  if (isProductTopicQuestion(message)) {
    if (products.length) {
      const picks = pickTopProductsForQuery(message, products).slice(0, 3).map((item, index) => {
        const price =
          item.sale_price != null
            ? `特價 NT$${formatPrice(item.sale_price)}`
            : item.price != null
              ? `售價 NT$${formatPrice(item.price)}`
              : "";
        const url = item.slug ? `${SITE_ORIGIN}/product/${item.slug}` : "";
        return `${index + 1}. ${item.name || "商品"}${price ? `｜${price}` : ""}${url ? `｜${url}` : ""}`;
      }).join("\n");

      return `我先幫你整理目前可參考的商品：\n${picks}\n\n如果你要送禮、家用或想找滴雞精／全雞，我也可以再幫你縮小推薦。`;
    }

    return "我目前可以協助你看商品、送禮推薦、價格與商品頁資訊。請再告訴我你想找的類型，例如雞湯、滴雞精、禮盒或全雞，我可以直接幫你整理。";
  }

  if (isSiteTopicQuestion(message)) {
    return "我目前可以根據本站資料回答。請告訴我你想查的是商品、門市、FAQ、運費、付款、關於、製程、媒體或會員相關內容，我可以直接幫你整理。";
  }

  return "我可以回答本站內容，也可以協助你找商品。請直接告訴我你想查的品項、用途或預算。";
}

function buildProductRecommendationReply(message: string, products: ProductItem[]) {
  if (!products.length) {
    return "我目前暫時抓不到商品資料，你可以先告訴我想找雞湯、滴雞精、禮盒或全雞，我再幫你縮小範圍。";
  }

  const sortedProducts = pickTopProductsForQuery(message, products);
  const picks = sortedProducts.slice(0, 3).map((item, index) => {
    const reason = cleanSnippet(item.summary || item.description || "適合參考的商品", 36);
    const price =
      item.sale_price != null
        ? `特價 NT$${formatPrice(item.sale_price)}`
        : item.price != null
          ? `售價 NT$${formatPrice(item.price)}`
          : "價格請洽客服";
    const url = item.slug ? `${SITE_ORIGIN}/product/${item.slug}` : "";
    return `${index + 1}. ${item.name || "商品"}｜${reason}｜${price}${url ? `｜${url}` : ""}`;
  });

  return `我先幫你挑了 3 個可參考的商品：\n${picks.join("\n")}\n\n如果你要，我也可以再依「送禮、家用、預算、雞湯／滴雞精」繼續幫你縮小。`;
}

function scoreProductForQuery(message: string, item: ProductItem) {
  const normalized = normalizeText(message);
  const text = normalizeText([item.name, item.summary, item.description].filter(Boolean).join(" "));
  let score = 0;

  const scoreByTerms = (terms: string[], points: number) => {
    if (terms.some((term) => normalized.includes(term) && text.includes(term))) {
      score += points;
    }
  };

  scoreByTerms(["滴雞精", "雞精"], 8);
  scoreByTerms(["禮盒", "送禮", "伴手禮", "禮物"], 6);
  scoreByTerms(["全雞", "雞肉", "煙燻", "鹽水"], 5);
  scoreByTerms(["雞湯"], 4);
  scoreByTerms(["價格", "價錢", "售價", "預算"], 2);
  scoreByTerms(["庫存"], 1);

  if (normalized.includes("人氣") && (item.is_featured || text.includes("熱銷") || text.includes("熱門"))) {
    score += 4;
  }

  if (normalized.includes("送禮") && (text.includes("禮盒") || text.includes("送禮") || text.includes("節慶"))) {
    score += 4;
  }

  if (normalized.includes("家用") && (text.includes("全雞") || text.includes("日常") || text.includes("家庭"))) {
    score += 3;
  }

  if (normalized.includes("長輩") && (text.includes("滴雞精") || text.includes("禮盒") || text.includes("滋補"))) {
    score += 4;
  }

  if (normalized.includes("企業") && text.includes("禮盒")) {
    score += 4;
  }

  if (normalized.includes("現場") && (text.includes("鹽水") || text.includes("煙燻"))) {
    score += 2;
  }

  if (normalized.includes("推薦") || normalized.includes("好")) {
    score += item.is_featured ? 2 : 0;
  }

  return score;
}

function pickTopProductsForQuery(message: string, products: ProductItem[]) {
  return [...products]
    .map((item) => ({ item, score: scoreProductForQuery(message, item) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
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

function formatPrice(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(value);
}

function formatProductContext(products: ProductItem[]) {
  if (!products.length) return "（無商品資料）";

  return products
    .slice(0, 10)
    .map((item, index) => {
      const title = cleanSnippet(item.name || "", 80);
      const summary = cleanSnippet(item.summary || item.description || "", 160);
      const price =
        item.sale_price != null
          ? `特價 NT$${formatPrice(item.sale_price)}`
          : item.price != null
            ? `售價 NT$${formatPrice(item.price)}`
            : "";
      const memberPrice = item.member_price != null ? `會員價 NT$${formatPrice(item.member_price)}` : "";
      const stock = item.stock != null ? `庫存 ${item.stock}` : "";
      const slug = item.slug ? `/${item.slug}` : "";
      const url = slug ? `${SITE_ORIGIN}/product${slug}` : "";

      return [
        `${index + 1}. ${title}${item.slug ? ` (${item.slug})` : ""}`,
        summary,
        [price, memberPrice, stock].filter(Boolean).join("｜"),
        url ? `商品頁：${url}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
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
    let products: ProductItem[] = [];
    let history: HistoryItem[] = [];
    let semanticMatches: SemanticMatch[] = [];

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const [
        { data: kbData, error: kbError },
        { data: productData, error: productError },
        { data: historyData, error: historyError },
      ] = await Promise.all([
        supabase
          .from("knowledge_base")
          .select("question, answer, keywords")
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .limit(KNOWLEDGE_CONTEXT_LIMIT),
        supabase
          .from("products")
          .select("name, slug, summary, description, price, sale_price, member_price, stock, is_featured")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("chat_messages")
          .select("sender_type, message")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true })
          .limit(12),
      ]);

      if (kbError) console.error("ai-chat knowledge lookup failed", kbError);
      if (productError) console.error("ai-chat product lookup failed", productError);
      if (historyError) console.error("ai-chat history lookup failed", historyError);

      knowledge = (kbData || []) as KnowledgeItem[];
      products = (productData || []) as ProductItem[];
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

    if (isProductTopicQuestion(message) && products.length) {
      return sseResponse(buildProductRecommendationReply(message, products), {
        "X-AI-Mode": "product-fast-path",
      });
    }

    if (!openaiKey) {
      return sseResponse(fallbackReply(message, knowledge, products), {
        "X-AI-Mode": "fallback-missing-openai-key",
      });
    }

    const semanticContext = formatSemanticContext(semanticMatches);
    const kbContext = formatKnowledgeContext(knowledge);
    const productContext = formatProductContext(products);
    const productGuidance = isProductTopicQuestion(message)
      ? "使用者正在詢問商品相關問題，請優先依商品清單回答。務必直接推薦 1-3 個合適商品，格式可用：商品名稱、簡短推薦原因、價格、商品頁連結；只有在資訊真的不足時才追問 1 個重點。"
      : "若後續對話轉到商品相關問題，請優先依商品清單回答。務必直接推薦 1-3 個合適商品，格式可用：商品名稱、簡短推薦原因、價格、商品頁連結；只有在資訊真的不足時才追問 1 個重點。";

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content:
          `${siteContentLanguageNote()}\n\n` +
          `【站內內容】\n${semanticContext}\n\n` +
          `【知識庫】\n${kbContext}\n\n` +
          `【商品清單】\n${productContext}\n\n` +
          `${productGuidance}`,
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
      return sseResponse(fallbackReply(message, knowledge, products), {
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
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: fallbackReply(message, knowledge, products) })}\n\n`));
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
