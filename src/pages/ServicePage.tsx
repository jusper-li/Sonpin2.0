import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { loadServiceArticles, type ServiceArticleRow } from '../lib/serviceArticleStore';
import { buildServiceArticleRows } from '../lib/serviceArticleSeed';

export default function ServicePage() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<ServiceArticleRow[]>(() => buildServiceArticleRows());
  const [loading, setLoading] = useState(true);

  const translatedTitle = t('service.list.title', '老饕分享');
  const translatedDescription = t('service.list.description', '淞品土雞的料理靈感、食用方式與品牌故事。');

  useSEO({
    title: translatedTitle,
    description: translatedDescription,
    keywords: t('service.list.keywords', '老饕分享,料理,品牌故事'),
    schema: breadcrumbSchema([
      { name: t('common.home', '首頁'), url: window.location.origin },
      { name: translatedTitle, url: `${window.location.origin}/service` },
    ]),
  });

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const items = await loadServiceArticles();
      if (!alive) return;
      setArticles(items);
      setLoading(false);
    };

    void run();

    return () => {
      alive = false;
    };
  }, []);

  const translatedArticles = useMemo(
    () =>
      articles.map((item) => ({
        ...item,
        title: t(`service.article.${item.slug}.title`, item.title),
        excerpt: t(`service.article.${item.slug}.excerpt`, item.excerpt || item.title),
      })),
    [articles, t],
  );

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
              <span className="text-stone-700">{translatedTitle}</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--sonpin-primary)]/80">
              {t('service.list.kicker', 'Service Articles')}
            </p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              {translatedTitle}
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          {loading ? (
            <div className="rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-6 py-12 text-center text-sm text-stone-500">
              {t('service.list.loading', '載入中...')}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {translatedArticles.map((item) => (
                <Link
                  key={item.slug}
                  to={`/service/${item.slug}`}
                  className="group overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm transition-all hover:-translate-y-1 hover:border-stone-300"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                    <img
                      src={item.featured_image || '/sonpin-images/153285217452.jpg'}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm leading-7 text-stone-700 line-clamp-2">{item.title}</p>
                    {item.excerpt && <p className="mt-2 text-xs leading-6 text-stone-400 line-clamp-2">{item.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
