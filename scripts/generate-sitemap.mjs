import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const baseUrl = 'https://sonpin.tw';
const fallbackProductsPath = path.join(projectRoot, 'src', 'data', 'fallbackProducts.ts');
const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');

const source = fs.readFileSync(fallbackProductsPath, 'utf8');
const productsSection = source.split('export const FALLBACK_PRODUCTS = [')[1] || '';

const slugMatches = [...productsSection.matchAll(/slug:\s*'([^']+)'/g)];
const productSlugs = Array.from(new Set(slugMatches.map((m) => m[1]).filter(Boolean)));

const staticUrls = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/products', changefreq: 'daily', priority: '0.95' },
  { loc: '/products/6', changefreq: 'daily', priority: '0.9' },
  { loc: '/products/7', changefreq: 'daily', priority: '0.9' },
  { loc: '/about', changefreq: 'weekly', priority: '0.8' },
  { loc: '/story', changefreq: 'weekly', priority: '0.8' },
  { loc: '/culture', changefreq: 'weekly', priority: '0.8' },
  { loc: '/process', changefreq: 'weekly', priority: '0.8' },
  { loc: '/service', changefreq: 'weekly', priority: '0.8' },
  { loc: '/store', changefreq: 'weekly', priority: '0.8' },
  { loc: '/media', changefreq: 'weekly', priority: '0.8' },
  { loc: '/contact', changefreq: 'weekly', priority: '0.7' },
  { loc: '/faq', changefreq: 'weekly', priority: '0.7' },
  { loc: '/shipping', changefreq: 'monthly', priority: '0.6' },
  { loc: '/returns', changefreq: 'monthly', priority: '0.6' },
  { loc: '/privacy', changefreq: 'monthly', priority: '0.5' },
  { loc: '/terms', changefreq: 'monthly', priority: '0.5' },
  { loc: '/order-query', changefreq: 'weekly', priority: '0.7' },
  { loc: '/remittance-notice', changefreq: 'weekly', priority: '0.7' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.7' },
];

const serviceUrls = [
  '/service/72',
  '/service/73',
];

const mediaCategoryUrls = [
  '/media/78',
  '/media/79',
];

const mediaDetailUrls = [
  '/media/78/77',
  '/media/78/80',
  '/media/78/81',
  '/media/78/82',
  '/media/78/84',
  '/media/78/85',
  '/media/78/86',
  '/media/78/87',
  '/media/78/88',
  '/media/78/115',
  '/media/79/40',
  '/media/79/66',
  '/media/79/83',
  '/media/79/90',
  '/media/79/91',
  '/media/79/92',
  '/media/79/93',
  '/media/79/231',
];

const categoryPathBySlug = new Map([
  ['main-products', '6'],
  ['other-products', '7'],
]);

const productUrls = [...new Set(productSlugs)].map((slug) => {
  const productMatch = source.match(new RegExp(String.raw`slug:\s*'${slug}'[\s\S]*?category_id:\s*'([^']+)'`));
  const categorySlug = productMatch?.[1] || 'main-products';
  const categoryPath = categoryPathBySlug.get(categorySlug) || '6';

  return {
    loc: `/products/${categoryPath}/${slug}`,
    changefreq: 'weekly',
    priority: '0.8',
  };
});

const legacyProductUrls = productSlugs.map((slug) => ({
  loc: `/product/${slug}`,
  changefreq: 'weekly',
  priority: '0.8',
}));

const allUrls = [
  ...staticUrls,
  ...serviceUrls.map((loc) => ({ loc, changefreq: 'weekly', priority: '0.75' })),
  ...mediaCategoryUrls.map((loc) => ({ loc, changefreq: 'weekly', priority: '0.75' })),
  ...mediaDetailUrls.map((loc) => ({ loc, changefreq: 'weekly', priority: '0.7' })),
  ...productUrls,
  ...legacyProductUrls,
];

const urlXml = allUrls
  .map(
    ({ loc, changefreq, priority }) => `  <url>
    <loc>${baseUrl}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlXml}
</urlset>
`;

fs.writeFileSync(sitemapPath, xml, 'utf8');
console.log(`sitemap generated: ${allUrls.length} urls`);

