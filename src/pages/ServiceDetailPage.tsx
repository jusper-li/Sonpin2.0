import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { loadServiceArticle, type ServiceArticleRow } from '../lib/serviceArticleStore';
import { buildServiceArticleRows } from '../lib/serviceArticleSeed';
import { translateHtmlContentWithT } from '../lib/productPageLiveTranslation';

export default function ServiceDetailPage() {
  const { slug = '' } = useParams();
  const { t } = useLanguage();
  const [article, setArticle] = useState<ServiceArticleRow | null>(() => buildServiceArticleRows().find((item) => item.slug === slug) || null);
  const [loading, setLoading] = useState(true);

  const translatedTitle = article ? t(`service.article.${article.slug}.title`, article.title) : t('service.detail.fallbackTitle', '老饕分享');
  const translatedExcerpt = article ? t(`service.article.${article.slug}.excerpt`, article.excerpt || article.title) : '';

  const renderedContent = useMemo(() => {
    if (!article) return '';
    return translateHtmlContentWithT(stripServiceMeta(article.content), t, `service.article.${article.slug}`);
  }, [article, t]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const item = await loadServiceArticle(slug);
      if (!alive) return;
      setArticle(item);
      setLoading(false);
    };

    void run();

    return () => {
      alive = false;
    };
  }, [slug]);

  useSEO({
    title: translatedTitle,
    description: translatedExcerpt || t('service.detail.description', '淞品土雞的老饕分享與料理內容。'),
    schema: article
      ? breadcrumbSchema([
          { name: t('common.home', '首頁'), url: window.location.origin },
          { name: t('service.list.title', '老饕分享'), url: `${window.location.origin}/service` },
          { name: translatedTitle, url: window.location.href },
        ])
      : undefined,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--sonpin-background)] text-stone-800">
        <SiteHeader />
        <main className="container mx-auto px-6 py-24">
          <p className="text-sm text-stone-500">{t('service.detail.loading', '載入中...')}</p>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[var(--sonpin-background)] text-stone-800">
        <SiteHeader />
        <main className="container mx-auto px-6 py-24">
          <p className="text-sm text-stone-500">{t('service.detail.notFound', '找不到這篇文章。')}</p>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

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
              <Link to="/service" className="transition-colors hover:text-stone-700">
                {t('service.list.title', '老饕分享')}
              </Link>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--sonpin-primary)]/80">
              {t('service.detail.kicker', 'Article')}
            </p>
            <h1 className="max-w-4xl text-3xl font-light leading-tight tracking-[0.06em] text-stone-900 md:text-4xl">
              {translatedTitle}
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-6 py-14">
          <article className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm">
            <img src={article.featured_image || '/sonpin-images/153285217452.jpg'} alt={translatedTitle} className="h-auto w-full object-cover" loading="lazy" />
            <div className="p-6 md:p-8">
              <div className="overflow-hidden rounded-2xl bg-stone-50">
                <div className="prose prose-stone max-w-none p-6" dangerouslySetInnerHTML={{ __html: renderedContent }} />
              </div>
            </div>
          </article>
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}

function stripServiceMeta(content: string) {
  return content
    .replace(/^<div class="service-article"><figure><img[^>]*><\/figure>/, '<div class="service-article">')
    .replace(/<div class="service-article__meta">[\s\S]*?<\/div>/, '')
    .replace(/^<div class="service-article">/, '<div class="service-article"><div class="space-y-5">')
    .replace(/<\/div><\/div>$/, '</div></div>');
}
