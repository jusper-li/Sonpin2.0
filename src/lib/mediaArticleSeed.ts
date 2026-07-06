import { MEDIA_ARTICLES, type MediaArticle } from '../data/mediaContent';

export interface MediaArticleSeedRow {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildVideoEmbed = (article: MediaArticle) => {
  if (article.kind !== 'video' || !article.iframeUrl) return '';
  return `
    <div class="my-6 overflow-hidden rounded-2xl border border-[#eadfd1] bg-black">
      <iframe
        src="${escapeHtml(article.iframeUrl)}"
        title="${escapeHtml(article.title)}"
        width="100%"
        height="315"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    </div>
  `;
};

const buildArticleHtml = (article: MediaArticle) => {
  const intro = article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : '';
  const body = article.bodyParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
  const video = buildVideoEmbed(article);

  if (article.kind === 'video' && article.videoPlacement === 'top') {
    return `${intro}${video}${body}`;
  }

  if (article.kind === 'video' && article.videoPlacement === 'bottom') {
    return `${intro}${body}${video}`;
  }

  return `${intro}${body}`;
};

export const buildMediaArticleSeedRows = (): MediaArticleSeedRow[] =>
  MEDIA_ARTICLES.map((article) => ({
    title: article.title,
    slug: `${article.groupSlug}-${article.articleSlug}`,
    content: buildArticleHtml(article),
    excerpt: article.excerpt,
    featured_image: article.featuredImage || null,
    status: 'published',
    published_at: `${article.date}T00:00:00.000+08:00`,
  }));
