import { loadBlogData, normalizeBlogSlug } from './blog';
import { isSupabaseContentEnabled, isMissingSupabaseTableError, isSupabaseNetworkError } from './supabase';
import { MEDIA_ARTICLES, type MediaArticle } from '../data/mediaContent';

interface LoadedMediaArticle extends MediaArticle {
  htmlContent?: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const buildHtmlFromParagraphs = (paragraphs: string[]) =>
  paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');

const normalizeMediaPathSlug = (value?: string) => {
  if (!value) return '';

  try {
    const url = new URL(value);
    return normalizeBlogSlug(url.pathname);
  } catch {
    return normalizeBlogSlug(value);
  }
};

const buildMediaMatchKeys = (article: {
  slug?: string;
  title?: string;
  excerpt?: string;
  sourceUrl?: string;
  source_url?: string;
  groupSlug?: string;
  articleSlug?: string;
}) => {
  const keys = new Set<string>();

  if (article.slug) keys.add(article.slug.trim());
  if (article.articleSlug) keys.add(article.articleSlug.trim());
  if (article.groupSlug && article.articleSlug) {
    keys.add(`${article.groupSlug.trim()}-${article.articleSlug.trim()}`);
    keys.add(`media-${article.groupSlug.trim()}-${article.articleSlug.trim()}`);
  }
  if (article.title) keys.add(normalizeBlogSlug(article.title));
  if (article.excerpt) keys.add(normalizeBlogSlug(article.excerpt));
  if (article.sourceUrl) keys.add(normalizeMediaPathSlug(article.sourceUrl));
  if (article.source_url) keys.add(normalizeMediaPathSlug(article.source_url));

  return Array.from(keys).filter(Boolean);
};

export const loadMediaArticles = async (): Promise<LoadedMediaArticle[]> => {
  if (!isSupabaseContentEnabled) {
    const uniqueArticles = new Map<string, LoadedMediaArticle>();
    MEDIA_ARTICLES.forEach((article) => {
      const key = `${article.groupSlug}-${article.articleSlug}`;
      if (!uniqueArticles.has(key)) {
        uniqueArticles.set(key, {
          ...article,
          htmlContent: buildHtmlFromParagraphs(article.bodyParagraphs),
        });
      }
    });

    return Array.from(uniqueArticles.values());
  }

  try {
    const { articles } = await loadBlogData({ publishedOnly: true });
    const byMatchKey = new Map<string, (typeof articles)[number]>();

    articles.forEach((article) => {
      buildMediaMatchKeys(article).forEach((key) => {
        if (!byMatchKey.has(key)) {
          byMatchKey.set(key, article);
        }
      });
    });

    const resolved = MEDIA_ARTICLES.map((localArticle) => {
      const dbArticle =
        buildMediaMatchKeys(localArticle)
          .map((key) => byMatchKey.get(key))
          .find((article): article is (typeof articles)[number] => Boolean(article)) || null;
      if (!dbArticle) {
        return {
          ...localArticle,
          htmlContent: buildHtmlFromParagraphs(localArticle.bodyParagraphs),
        };
      }

      const mergedParagraphs =
        dbArticle.content?.trim() ? [dbArticle.content] : localArticle.bodyParagraphs;

      return {
        ...localArticle,
        title: dbArticle.title || localArticle.title,
        date: formatDate(dbArticle.published_at) || localArticle.date,
        excerpt: dbArticle.excerpt || localArticle.excerpt,
        featuredImage: localArticle.featuredImage || dbArticle.featured_image || '',
        htmlContent: dbArticle.content?.trim() || buildHtmlFromParagraphs(mergedParagraphs),
      };
    });

    const uniqueArticles = new Map<string, LoadedMediaArticle>();
    resolved.forEach((article) => {
      const key = `${article.groupSlug}-${article.articleSlug}`;
      if (!uniqueArticles.has(key)) {
        uniqueArticles.set(key, article);
      }
    });

    return Array.from(uniqueArticles.values());
  } catch (error) {
    if (!isMissingSupabaseTableError(error) && !isSupabaseNetworkError(error)) {
      console.warn('Using bundled media content:', error);
    }

    const uniqueArticles = new Map<string, LoadedMediaArticle>();
    MEDIA_ARTICLES.forEach((article) => {
      const key = `${article.groupSlug}-${article.articleSlug}`;
      if (!uniqueArticles.has(key)) {
        uniqueArticles.set(key, {
          ...article,
          htmlContent: buildHtmlFromParagraphs(article.bodyParagraphs),
        });
      }
    });

    return Array.from(uniqueArticles.values());
  }
};

export const loadMediaArticle = async (groupSlug: string, articleSlug: string) => {
  const articles = await loadMediaArticles();
  return articles.find((article) => article.groupSlug === groupSlug && article.articleSlug === articleSlug) || null;
};
