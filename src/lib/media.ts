import { isMissingSupabaseTableError, isSupabaseNetworkError, supabase } from './supabase';

interface LoadedMediaArticle {
  groupSlug: string;
  articleSlug: string;
  title: string;
  date: string;
  excerpt: string;
  bodyParagraphs: string[];
  htmlContent?: string;
  featuredImage: string;
  galleryImages: string[];
  iframeUrl: string;
  sourceUrl: string;
  kind: 'article' | 'video';
  videoPlacement?: 'top' | 'bottom';
  videoMode?: 'embed' | 'external';
}

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const extractSlugParts = (slug: string) => {
  const [groupSlug = '', ...articleParts] = slug.split('-');
  return {
    groupSlug,
    articleSlug: articleParts.join('-'),
  };
};

const inferVideoIframeUrl = (content?: string | null) => {
  if (!content) return '';
  const match =
    content.match(/src=["']([^"']*youtube\.com\/embed\/[^"']+)["']/i) ||
    content.match(/src=["']([^"']*youtube\.com\/v\/[^"']+)["']/i) ||
    content.match(/src=["']([^"']*youtu\.be\/[^"']+)["']/i);
  return match?.[1] || '';
};

const buildMediaArticle = (article: {
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  published_at?: string | null;
}): LoadedMediaArticle => {
  const { groupSlug, articleSlug } = extractSlugParts(article.slug);
  const htmlContent = article.content || '';
  return {
    groupSlug,
    articleSlug,
    title: article.title,
    date: formatDate(article.published_at),
    excerpt: article.excerpt || '',
    bodyParagraphs: [],
    htmlContent,
    featuredImage: article.featured_image || '',
    galleryImages: [],
    iframeUrl: inferVideoIframeUrl(htmlContent),
    sourceUrl: '',
    kind: groupSlug === '78' ? 'video' : 'article',
    videoPlacement: groupSlug === '78' ? 'top' : undefined,
    videoMode: groupSlug === '78' ? 'embed' : undefined,
  };
};

export const loadMediaArticles = async (): Promise<LoadedMediaArticle[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('slug, title, excerpt, content, featured_image, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) {
      return [];
    }
    throw error;
  }

  const uniqueArticles = new Map<string, LoadedMediaArticle>();
  (data || []).forEach((article) => {
    const next = buildMediaArticle(article as {
      slug: string;
      title: string;
      excerpt?: string | null;
      content?: string | null;
      featured_image?: string | null;
      published_at?: string | null;
    });
    const key = `${next.groupSlug}-${next.articleSlug}`;
    if (!uniqueArticles.has(key)) {
      uniqueArticles.set(key, next);
    }
  });

  return Array.from(uniqueArticles.values());
};

export const loadMediaArticle = async (groupSlug: string, articleSlug: string) => {
  const articles = await loadMediaArticles();
  return articles.find((article) => article.groupSlug === groupSlug && article.articleSlug === articleSlug) || null;
};
