import { isSupabaseContentEnabled, supabase } from './supabase';
import { buildServiceArticleRows, SERVICE_ARTICLE_SLUGS, type ServiceArticleRow } from './serviceArticleSeed';

type DbArticleRow = {
  id?: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  status: string | null;
  published_at: string | null;
  views: number | null;
  created_at: string | null;
  updated_at: string | null;
};

const selectColumns = 'id,title,slug,content,excerpt,featured_image,status,published_at,views,created_at,updated_at';

const orderMap = new Map(SERVICE_ARTICLE_SLUGS.map((slug, index) => [slug, index]));

const normalizeRow = (row: DbArticleRow): ServiceArticleRow => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  content: row.content || '',
  excerpt: row.excerpt || '',
  featured_image: row.featured_image || null,
  status: row.status === 'draft' ? 'draft' : 'published',
  published_at: row.published_at || null,
  views: row.views || 0,
  created_at: row.created_at || null,
  updated_at: row.updated_at || null,
});

const sortRows = (rows: ServiceArticleRow[]) =>
  [...rows].sort((a, b) => (orderMap.get(a.slug) ?? 0) - (orderMap.get(b.slug) ?? 0));

export const loadServiceArticles = async (): Promise<ServiceArticleRow[]> => {
  const fallback = buildServiceArticleRows();

  if (!isSupabaseContentEnabled) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('articles')
      .select(selectColumns)
      .in('slug', SERVICE_ARTICLE_SLUGS);

    if (error) throw error;

    const rows = (data || []).map((row) => normalizeRow(row as DbArticleRow));
    if (rows.length === 0) {
      return fallback;
    }

    const fallbackMap = new Map(fallback.map((row) => [row.slug, row]));
    rows.forEach((row) => {
      fallbackMap.set(row.slug, row);
    });

    return sortRows(Array.from(fallbackMap.values()));
  } catch (error) {
    console.error('Failed to load service articles:', error);
    return fallback;
  }
};

export const loadServiceArticle = async (slug: string) => {
  const articles = await loadServiceArticles();
  return articles.find((article) => article.slug === slug) || null;
};

export const syncServiceArticlesToDb = async () => {
  const rows = buildServiceArticleRows();
  const { error } = await supabase.from('articles').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;
  return rows.length;
};

