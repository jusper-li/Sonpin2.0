import { isMissingSupabaseTableError, isSupabaseNetworkError, supabase } from './supabase';
import { getMediaArticle } from '../data/mediaContent';

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

const MEDIA_GROUP_ORDER: Record<string, string[]> = {
  '79': ['231', '91', '92', '90', '93', '83'],
  '78': ['115', '86', '80', '87', '88', '85', '81', '77', '84', '82'],
};

const inferVideoIframeUrl = (content?: string | null) => {
  if (!content) return '';
  const match =
    content.match(/src=["']([^"']*youtube\.com\/embed\/[^"']+)["']/i) ||
    content.match(/src=["']([^"']*youtube\.com\/v\/[^"']+)["']/i) ||
    content.match(/src=["']([^"']*youtu\.be\/[^"']+)["']/i);
  return match?.[1] || '';
};

const hasVideoEmbed = (content?: string | null) => {
  if (!content) return false;
  return /<(iframe|object|embed)\b/i.test(content);
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
  const localArticle = getMediaArticle(groupSlug, articleSlug);
  const localHtmlContent = localArticle?.htmlContent || '';
  const resolvedHtmlContent =
    hasVideoEmbed(localHtmlContent) && !hasVideoEmbed(htmlContent)
      ? htmlContent
        ? `${localHtmlContent}\n\n${htmlContent}`
        : localHtmlContent
      : localHtmlContent.length > htmlContent.length
        ? localHtmlContent
        : htmlContent || localHtmlContent || '';
  return {
    groupSlug,
    articleSlug,
    title: article.title || localArticle?.title || '',
    date: formatDate(article.published_at),
    excerpt: article.excerpt || localArticle?.excerpt || '',
    bodyParagraphs: [],
    htmlContent: resolvedHtmlContent,
    featuredImage: article.featured_image || localArticle?.featuredImage || '',
    galleryImages: [],
    iframeUrl: inferVideoIframeUrl(resolvedHtmlContent),
    sourceUrl: localArticle?.sourceUrl || '',
    kind: localArticle?.kind || (groupSlug === '78' ? 'video' : 'article'),
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

  const sorted = Array.from(uniqueArticles.values()).sort((a, b) => {
    const groupOrderA = MEDIA_GROUP_ORDER[a.groupSlug] || [];
    const groupOrderB = MEDIA_GROUP_ORDER[b.groupSlug] || [];
    const groupIndexA = groupOrderA.indexOf(a.articleSlug);
    const groupIndexB = groupOrderB.indexOf(b.articleSlug);

    if (a.groupSlug === b.groupSlug && groupIndexA !== -1 && groupIndexB !== -1 && groupIndexA !== groupIndexB) {
      return groupIndexA - groupIndexB;
    }

    if (a.groupSlug !== b.groupSlug) {
      if (a.groupSlug === '79') return -1;
      if (b.groupSlug === '79') return 1;
      if (a.groupSlug === '78') return -1;
      if (b.groupSlug === '78') return 1;
      return b.date.localeCompare(a.date);
    }

    if (groupIndexA !== -1 && groupIndexB !== -1) {
      return groupIndexA - groupIndexB;
    }

    return b.date.localeCompare(a.date);
  });

  return sorted;
};

export const loadMediaArticle = async (groupSlug: string, articleSlug: string) => {
  const articles = await loadMediaArticles();
  return articles.find((article) => article.groupSlug === groupSlug && article.articleSlug === articleSlug) || null;
};
