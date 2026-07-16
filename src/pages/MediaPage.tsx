import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Film, Newspaper } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { loadMediaArticles } from '../lib/media';

const defaultGroupSlug = '79';
const HIDDEN_MEDIA_LIST_ARTICLES: Record<string, Set<string>> = {
  '79': new Set(['66', '40']),
};

const mediaGroupMeta = [
  {
    slug: '79',
    title: '報章雜誌',
    description: '新聞、報導、平面媒體內容。',
    icon: Newspaper,
  },
  {
    slug: '78',
    title: '影音報導',
    description: '影片、專訪、影音內容。',
    icon: Film,
  },
];

export default function MediaPage() {
  const { categorySlug } = useParams();
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const isVideoPage = categorySlug === '78' || pathname.replace(/\/+$/, '') === '/media/78';
  const groupSlug = isVideoPage ? '78' : defaultGroupSlug;
  const [allArticles, setAllArticles] = useState<Awaited<ReturnType<typeof loadMediaArticles>>>([]);
  const [articles, setArticles] = useState<Awaited<ReturnType<typeof loadMediaArticles>>>([]);

  const pageTitle = t('media.list.title', '相關報導');
  const pageDescription = t('media.list.description', '淞品土雞相關報導與新聞公告');

  useSEO({
    title: pageTitle,
    description: pageDescription,
    keywords: t('media.list.keywords', '相關報導,報章雜誌,影音報導,淞品土雞'),
    schema: breadcrumbSchema([
      { name: t('common.home', '首頁'), url: window.location.origin },
      { name: pageTitle, url: `${window.location.origin}${isVideoPage ? '/media/78' : '/media'}` },
    ]),
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const data = await loadMediaArticles();
      if (cancelled) return;
      setAllArticles(data);
      const hiddenSlugs = HIDDEN_MEDIA_LIST_ARTICLES[groupSlug] || new Set<string>();
      setArticles(data.filter((article) => article.groupSlug === groupSlug && !hiddenSlugs.has(article.articleSlug)));
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [groupSlug]);

  const pageArticles = useMemo(
    () =>
      articles.map((article) => ({
        ...article,
        title: t(`media.article.${article.groupSlug}.${article.articleSlug}.title`, article.title),
        excerpt: t(`media.article.${article.groupSlug}.${article.articleSlug}.excerpt`, article.excerpt || article.title),
      })),
    [articles, t],
  );

  const activeGroup = mediaGroupMeta.find((group) => group.slug === groupSlug) || mediaGroupMeta[0];
  const activeGroupIcon = activeGroup.icon;
  const groupCounts = mediaGroupMeta.reduce<Record<string, number>>((acc, group) => {
    acc[group.slug] = allArticles.filter((article) => article.groupSlug === group.slug).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)] text-stone-800">
      <SiteHeader />

      <main className="flex-1 pt-20">
        <section className="border-b border-[var(--sonpin-primary-border)] bg-[linear-gradient(135deg,var(--sonpin-background)_0%,var(--sonpin-background)_44%,var(--sonpin-surface)_100%)]">
          <div className="container mx-auto px-6 py-16 md:py-24">
            <nav className="mb-8 flex items-center gap-2 text-xs tracking-[0.18em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-700">
                {t('common.home', '首頁')}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">{pageTitle}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
              <div>
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--sonpin-primary)]/80">
                  {pageTitle}
                </p>
                <h1 className="max-w-3xl text-3xl font-light leading-tight tracking-[0.12em] text-stone-900 md:text-4xl">
                  {pageTitle}
                </h1>
                <p className="mt-5 max-w-2xl text-sm font-light leading-8 text-stone-500">{pageDescription}</p>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--sonpin-primary-border)] bg-white/80 p-5 shadow-[0_12px_30px_-24px_rgba(53,30,13,0.3)]">
                <p className="text-[11px] uppercase tracking-[0.28em] text-stone-400">Current Category</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sonpin-primary)] text-white">
                    <activeGroupIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-medium tracking-[0.08em] text-stone-900">{activeGroup.title}</p>
                    <p className="text-sm text-stone-500">目前有 {articles.length} 筆內容</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          <div className="mb-8 grid gap-3 md:grid-cols-2">
            {mediaGroupMeta.map((group) => {
              const isActive = group.slug === groupSlug;
              const count = groupCounts[group.slug] || 0;

              return (
                <Link
                  key={group.slug}
                  to={group.slug === '78' ? '/media/78' : '/media'}
                  className={`flex items-center gap-4 rounded-3xl border p-5 transition-all duration-300 ${
                    isActive
                      ? 'border-[var(--sonpin-primary)] bg-[var(--sonpin-primary)] text-white shadow-[0_18px_35px_-18px_rgba(53,30,13,0.45)]'
                      : 'border-[var(--sonpin-primary-border)] bg-white/75 text-stone-700 hover:-translate-y-0.5 hover:border-[var(--sonpin-primary)] hover:bg-white hover:shadow-[0_14px_30px_-22px_rgba(53,30,13,0.25)]'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActive ? 'bg-white/20' : 'bg-[var(--sonpin-primary-border)]/30'}`}>
                    <group.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[var(--sonpin-primary)]'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-medium tracking-[0.08em]">{group.title}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--sonpin-primary-border)]/40 text-stone-700'}`}>
                        {count}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm leading-6 ${isActive ? 'text-white/75' : 'text-stone-500'}`}>
                      {group.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pageArticles.map((article) => {
              const cardImage = article.featuredImage || article.galleryImages[0] || '/sonpin-images/153285188512.jpg';
              return (
                <Link
                  key={`${article.groupSlug}-${article.articleSlug}`}
                  to={`/media/${article.groupSlug}/${article.articleSlug}`}
                  className="group block overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-stone-200 hover:shadow-[0_24px_58px_-26px_rgba(41,37,36,0.18)]"
                >
                  <div className="aspect-[4/3] bg-stone-100">
                    <img src={cardImage} alt={article.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <div className="p-5">
                    <div className="mb-3 text-[11px] tracking-[0.18em] text-stone-400">{article.date}</div>
                    <h2 className="text-base leading-7 text-stone-800 transition-colors group-hover:text-amber-800">
                      {article.title}
                    </h2>
                    {article.excerpt && <p className="mt-3 text-sm leading-7 text-stone-500">{article.excerpt}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
