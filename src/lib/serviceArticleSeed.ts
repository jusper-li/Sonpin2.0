import { SERVICE_SHARE_DETAILS, SERVICE_SHARES, type ServiceShareDetail } from '../data/serviceContent';

export type ServiceArticleRow = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  views?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const SERVICE_ARTICLE_SLUGS = SERVICE_SHARES.map((item) => item.slug);

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildArticleHtml = (detail: ServiceShareDetail) => {
  const meta = [
    detail.storeName ? `<p><strong>店名：</strong>${escapeHtml(detail.storeName)}</p>` : '',
    detail.phone ? `<p><strong>電話：</strong>${escapeHtml(detail.phone)}</p>` : '',
    detail.address ? `<p><strong>地址：</strong>${escapeHtml(detail.address)}</p>` : '',
  ]
    .filter(Boolean)
    .join('');

  const paragraphs = detail.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');

  return `
    <div class="service-article">
      ${detail.banner ? `<figure><img src="${escapeHtml(detail.banner)}" alt="${escapeHtml(detail.title)}" style="width:100%;height:auto;" /></figure>` : ''}
      <div class="service-article__meta">${meta}</div>
      ${detail.image ? `<figure><img src="${escapeHtml(detail.image)}" alt="${escapeHtml(detail.title)}" style="width:100%;height:auto;" /></figure>` : ''}
      <div class="service-article__body">${paragraphs}</div>
    </div>
  `.trim();
};

export const buildServiceArticleRows = (): ServiceArticleRow[] => {
  const now = new Date().toISOString();

  return SERVICE_SHARES.map((share) => {
    const detail = SERVICE_SHARE_DETAILS[share.slug];

    return {
      title: share.title,
      slug: share.slug,
      content: detail ? buildArticleHtml(detail) : `<p>${escapeHtml(share.excerpt)}</p>`,
      excerpt: share.excerpt,
      featured_image: share.image || null,
      status: 'published',
      published_at: now,
      views: 0,
      created_at: now,
      updated_at: now,
    };
  });
};

