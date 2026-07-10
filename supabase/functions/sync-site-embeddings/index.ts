import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-supabase-api-key, content-type, accept",
};

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_BATCH_SIZE = 24;
const UPSERT_BATCH_SIZE = 50;

type VectorRecord = {
  source_table: string;
  source_id: string;
  source_slug: string;
  source_title: string;
  content_type: string;
  content_text: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
};

type RawRecord = Record<string, unknown>;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ");
}

function truncate(text: string, limit = 6000) {
  const cleaned = normalizeText(stripHtml(text));
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1)}…`;
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).filter(Boolean).join("\n");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries
      .map(([key, item]) => `${key}: ${asText(item)}`)
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function jsonToText(value: unknown) {
  return truncate(asText(value));
}

function buildRecord(
  sourceTable: string,
  row: RawRecord,
  options: {
    title?: string;
    slug?: string;
    contentType?: string;
    content?: string;
    metadata?: Record<string, unknown>;
    isActive?: boolean;
  } = {},
): VectorRecord | null {
  const sourceId = typeof row.id === "string" ? row.id : "";
  if (!sourceId) return null;

  const sourceTitle = normalizeText(options.title || String(row.title || row.name || row.question || row.setting_key || "未命名內容"));
  const contentText = truncate(options.content || "");
  if (!sourceTitle && !contentText) return null;

  return {
    source_table: sourceTable,
    source_id: sourceId,
    source_slug: normalizeText(options.slug || String(row.slug || row.page_path || row.setting_key || "")),
    source_title: sourceTitle,
    content_type: options.contentType || "page",
    content_text: contentText || sourceTitle,
    metadata: options.metadata || {},
    is_active: options.isActive ?? true,
  };
}

function buildProductText(row: RawRecord, categoryName = "") {
  return truncate([
    `商品名稱：${asText(row.name)}`,
    categoryName ? `分類：${categoryName}` : "",
    row.summary ? `摘要：${asText(row.summary)}` : "",
    row.description ? `簡介：${asText(row.description)}` : "",
    row.content ? `內容：${stripHtml(asText(row.content))}` : "",
    row.specifications ? `規格：${jsonToText(row.specifications)}` : "",
    row.seo_title ? `SEO 標題：${asText(row.seo_title)}` : "",
    row.seo_description ? `SEO 描述：${asText(row.seo_description)}` : "",
    row.seo_keywords ? `SEO 關鍵字：${asText(row.seo_keywords)}` : "",
    row.price != null ? `價格：${asText(row.price)}` : "",
    row.sale_price != null ? `特價：${asText(row.sale_price)}` : "",
    row.member_price != null ? `會員價：${asText(row.member_price)}` : "",
    row.stock != null ? `庫存：${asText(row.stock)}` : "",
    row.sku ? `SKU：${asText(row.sku)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildCategoryText(row: RawRecord) {
  return truncate([
    `分類名稱：${asText(row.name)}`,
    row.description ? `分類描述：${asText(row.description)}` : "",
    row.slug ? `Slug：${asText(row.slug)}` : "",
    row.parent_id ? `上層分類：${asText(row.parent_id)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildArticleText(row: RawRecord) {
  return truncate([
    `文章標題：${asText(row.title)}`,
    row.excerpt ? `摘要：${asText(row.excerpt)}` : "",
    row.content ? `內容：${stripHtml(asText(row.content))}` : "",
    row.status ? `狀態：${asText(row.status)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildFaqText(row: RawRecord) {
  return truncate([
    `問題：${asText(row.question)}`,
    `回答：${asText(row.answer)}`,
    row.category ? `分類：${asText(row.category)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildStoreText(row: RawRecord) {
  return truncate([
    `門市名稱：${asText(row.name)}`,
    row.city ? `城市：${asText(row.city)}` : "",
    row.address ? `地址：${asText(row.address)}` : "",
    row.phone ? `電話：${asText(row.phone)}` : "",
    row.email ? `Email：${asText(row.email)}` : "",
    row.opening_hours ? `營業時間：${asText(row.opening_hours)}` : "",
    row.location ? `地圖位置：${asText(row.location)}` : "",
    row.images ? `圖片：${jsonToText(row.images)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildStaticPageText(row: RawRecord) {
  return truncate([
    `頁面標題：${asText(row.title)}`,
    row.meta_description ? `Meta 描述：${asText(row.meta_description)}` : "",
    row.slug ? `Slug：${asText(row.slug)}` : "",
    row.sections ? `內容區塊：${jsonToText(row.sections)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildHomepageSectionText(row: RawRecord) {
  return truncate([
    `區塊類型：${asText(row.section_type)}`,
    `區塊標題：${asText(row.title)}`,
    row.content ? `區塊內容：${jsonToText(row.content)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildSeoText(row: RawRecord) {
  return truncate([
    `頁面：${asText(row.page_path)}`,
    row.title ? `SEO 標題：${asText(row.title)}` : "",
    row.description ? `SEO 描述：${asText(row.description)}` : "",
    row.keywords ? `關鍵字：${asText(row.keywords)}` : "",
    row.og_image ? `OG 圖片：${asText(row.og_image)}` : "",
    row.canonical_url ? `Canonical：${asText(row.canonical_url)}` : "",
    row.robots ? `Robots：${asText(row.robots)}` : "",
    row.schema_markup ? `Schema：${jsonToText(row.schema_markup)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildKnowledgeText(row: RawRecord) {
  return truncate([
    `問題：${asText(row.question)}`,
    `回答：${asText(row.answer)}`,
    row.keywords ? `關鍵字：${asText(row.keywords)}` : "",
    row.category ? `分類：${asText(row.category)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildSocialText(row: RawRecord) {
  return truncate([
    `平台：${asText(row.platform)}`,
    row.username ? `帳號：${asText(row.username)}` : "",
    row.url ? `網址：${asText(row.url)}` : "",
  ].filter(Boolean).join("\n"));
}

function buildSiteSettingText(row: RawRecord) {
  return truncate([
    `設定鍵：${asText(row.setting_key)}`,
    `設定值：${jsonToText(row.setting_value)}`,
  ].join("\n"));
}

async function fetchEmbeddingBatch(openaiKey: string, items: string[]) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: items,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenAI embeddings request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map((item: { embedding?: number[] }) => item.embedding).filter((embedding: unknown): embedding is number[] => Array.isArray(embedding));
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function collectRecords(supabase: ReturnType<typeof createClient>) {
  const [
    categoriesRes,
    productsRes,
    articlesRes,
    faqsRes,
    storesRes,
    homepageRes,
    pagesRes,
    seoRes,
    knowledgeRes,
    socialRes,
    siteSettingsRes,
  ] = await Promise.all([
    supabase.from("categories").select("id, name, slug, description, parent_id, is_active"),
    supabase.from("products").select("id, category_id, name, slug, summary, description, content, price, sale_price, member_price, stock, sku, specifications, seo_title, seo_description, seo_keywords, is_active, is_featured, is_hidden"),
    supabase.from("articles").select("id, title, slug, content, excerpt, featured_image, status, published_at, views"),
    supabase.from("faqs").select("id, question, answer, category, sort_order, is_active"),
    supabase.from("stores").select("id, name, city, address, phone, email, opening_hours, location, images, is_active"),
    supabase.from("homepage_sections").select("id, section_type, title, content, sort_order, is_active"),
    supabase.from("static_pages").select("id, slug, title, meta_description, sections, is_published"),
    supabase.from("seo_settings").select("id, page_path, title, description, keywords, og_image, canonical_url, robots, schema_markup"),
    supabase.from("knowledge_base").select("id, question, answer, keywords, category, priority, is_active"),
    supabase.from("social_accounts").select("id, platform, username, url, is_active"),
    supabase.from("site_settings").select("id, setting_key, setting_value"),
  ]);

  const categoryMap = new Map<string, string>();
  for (const row of categoriesRes.data || []) {
    if (row?.id && row?.name) {
      categoryMap.set(String(row.id), String(row.name));
    }
  }

  const records: VectorRecord[] = [];

  for (const row of productsRes.data || []) {
    const categoryName = row?.category_id ? categoryMap.get(String(row.category_id)) || "" : "";
    const content = buildProductText(row, categoryName);
    const record = buildRecord("products", row, {
      title: String(row.name || ""),
      slug: String(row.slug || ""),
      contentType: "product",
      content,
      metadata: {
        category_id: row.category_id || null,
        category_name: categoryName || null,
        price: row.price ?? null,
        sale_price: row.sale_price ?? null,
        member_price: row.member_price ?? null,
        stock: row.stock ?? null,
        sku: row.sku ?? null,
        is_featured: row.is_featured ?? null,
        is_hidden: row.is_hidden ?? null,
      },
      isActive: row.is_active !== false,
    });
    if (record) records.push(record);
  }

  for (const row of categoriesRes.data || []) {
    const record = buildRecord("categories", row, {
      title: String(row.name || ""),
      slug: String(row.slug || ""),
      contentType: "category",
      content: buildCategoryText(row),
      metadata: {
        description: row.description ?? null,
        parent_id: row.parent_id ?? null,
        is_active: row.is_active ?? null,
      },
      isActive: row.is_active !== false,
    });
    if (record) records.push(record);
  }

  for (const row of articlesRes.data || []) {
    const record = buildRecord("articles", row, {
      title: String(row.title || ""),
      slug: String(row.slug || ""),
      contentType: "article",
      content: buildArticleText(row),
      metadata: {
        excerpt: row.excerpt ?? null,
        featured_image: row.featured_image ?? null,
        status: row.status ?? null,
        published_at: row.published_at ?? null,
        views: row.views ?? null,
      },
      isActive: row.status === "published",
    });
    if (record) records.push(record);
  }

  for (const row of faqsRes.data || []) {
    const record = buildRecord("faqs", row, {
      title: String(row.question || ""),
      slug: String(row.category || ""),
      contentType: "faq",
      content: buildFaqText(row),
      metadata: {
        category: row.category ?? null,
        sort_order: row.sort_order ?? null,
      },
      isActive: row.is_active !== false,
    });
    if (record) records.push(record);
  }

  for (const row of storesRes.data || []) {
    const record = buildRecord("stores", row, {
      title: String(row.name || ""),
      slug: String(row.slug || row.city || ""),
      contentType: "store",
      content: buildStoreText(row),
      metadata: {
        city: row.city ?? null,
        address: row.address ?? null,
        phone: row.phone ?? null,
        email: row.email ?? null,
        opening_hours: row.opening_hours ?? null,
        location: row.location ?? null,
        images: row.images ?? null,
      },
      isActive: row.is_active !== false,
    });
    if (record) records.push(record);
  }

  for (const row of homepageRes.data || []) {
    const record = buildRecord("homepage_sections", row, {
      title: String(row.title || row.section_type || ""),
      slug: String(row.section_type || ""),
      contentType: "homepage_section",
      content: buildHomepageSectionText(row),
      metadata: {
        section_type: row.section_type ?? null,
        sort_order: row.sort_order ?? null,
      },
      isActive: row.is_active !== false,
    });
    if (record) records.push(record);
  }

  for (const row of pagesRes.data || []) {
    const sectionsText = jsonToText(row.sections);
    const record = buildRecord("static_pages", row, {
      title: String(row.title || ""),
      slug: String(row.slug || ""),
      contentType: "static_page",
      content: truncate([
        `頁面標題：${asText(row.title)}`,
        row.meta_description ? `Meta 描述：${asText(row.meta_description)}` : "",
        row.slug ? `Slug：${asText(row.slug)}` : "",
        sectionsText ? `內容區塊：${sectionsText}` : "",
      ].filter(Boolean).join("\n")),
      metadata: {
        meta_description: row.meta_description ?? null,
        is_published: row.is_published ?? null,
      },
      isActive: row.is_published === true,
    });
    if (record) records.push(record);
  }

  for (const row of seoRes.data || []) {
    const record = buildRecord("seo_settings", row, {
      title: String(row.title || row.page_path || ""),
      slug: String(row.page_path || ""),
      contentType: "seo",
      content: buildSeoText(row),
      metadata: {
        page_path: row.page_path ?? null,
        description: row.description ?? null,
        keywords: row.keywords ?? null,
        canonical_url: row.canonical_url ?? null,
        robots: row.robots ?? null,
      },
      isActive: true,
    });
    if (record) records.push(record);
  }

  for (const row of knowledgeRes.data || []) {
    const record = buildRecord("knowledge_base", row, {
      title: String(row.question || ""),
      slug: String(row.category || ""),
      contentType: "knowledge_base",
      content: buildKnowledgeText(row),
      metadata: {
        category: row.category ?? null,
        keywords: row.keywords ?? null,
        priority: row.priority ?? null,
      },
      isActive: row.is_active !== false,
    });
    if (record) records.push(record);
  }

  for (const row of socialRes.data || []) {
    const record = buildRecord("social_accounts", row, {
      title: String(row.platform || ""),
      slug: String(row.platform || ""),
      contentType: "social_account",
      content: buildSocialText(row),
      metadata: {
        platform: row.platform ?? null,
        username: row.username ?? null,
        url: row.url ?? null,
      },
      isActive: row.is_active !== false,
    });
    if (record) records.push(record);
  }

  for (const row of siteSettingsRes.data || []) {
    const record = buildRecord("site_settings", row, {
      title: String(row.setting_key || ""),
      slug: String(row.setting_key || ""),
      contentType: "site_setting",
      content: buildSiteSettingText(row),
      metadata: {
        setting_key: row.setting_key ?? null,
      },
      isActive: true,
    });
    if (record) records.push(record);
  }

  return {
    categories: categoriesRes.error ? [] : categoriesRes.data || [],
    records,
    errors: [
      categoriesRes.error,
      productsRes.error,
      articlesRes.error,
      faqsRes.error,
      storesRes.error,
      homepageRes.error,
      pagesRes.error,
      seoRes.error,
      knowledgeRes.error,
      socialRes.error,
      siteSettingsRes.error,
    ].filter(Boolean),
  };
}

async function upsertEmbeddings(
  supabase: ReturnType<typeof createClient>,
  records: VectorRecord[],
  embeddings: number[][],
) {
  const now = new Date().toISOString();
  const rows = records.map((record, index) => ({
    ...record,
    embedding: embeddings[index],
    embedding_model: EMBEDDING_MODEL,
    embedding_updated_at: now,
    updated_at: now,
  }));

  for (const batchRows of chunk(rows, UPSERT_BATCH_SIZE)) {
    const { error } = await supabase
      .from("site_content_embeddings")
      .upsert(batchRows, { onConflict: "source_table,source_id" });

    if (error) {
      throw error;
    }
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
    const payload = await req.json().catch(() => ({}));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const openaiKey =
      Deno.env.get("OPENAI_API_KEY")?.trim() ||
      (typeof payload?.openai_key === "string" ? payload.openai_key.trim() : "") ||
      req.headers.get("x-openai-api-key")?.trim() ||
      "";

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ error: "missing_supabase_credentials" }, 500);
    }

    if (!openaiKey) {
      return jsonResponse({ error: "missing_openai_api_key" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { records, errors } = await collectRecords(supabase);

    if (!records.length) {
      return jsonResponse({
        synced: 0,
        batches: 0,
        message: "no content rows found",
        source_errors: errors.map((error) => String(error)),
      });
    }

    const recordBatches = chunk(records, EMBEDDING_BATCH_SIZE);
    let synced = 0;

    for (const batchRecords of recordBatches) {
      const inputs = batchRecords.map((record) => record.content_text || record.source_title);
      const embeddings = await fetchEmbeddingBatch(openaiKey, inputs);

      if (embeddings.length !== batchRecords.length) {
        throw new Error(`Embedding count mismatch: expected ${batchRecords.length}, got ${embeddings.length}`);
      }

      await upsertEmbeddings(supabase, batchRecords, embeddings);
      synced += batchRecords.length;
    }

    return jsonResponse({
      synced,
      batches: recordBatches.length,
      embedding_model: EMBEDDING_MODEL,
      source_errors: errors.map((error) => String(error)),
    });
  } catch (error) {
    console.error("sync-site-embeddings error:", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
