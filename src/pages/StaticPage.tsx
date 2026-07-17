import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import StaticContent from '../components/StaticContent';
import { getStaticPageFallback, StaticPageSection } from '../data/staticPages';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import { normalizeLang, pickByLang } from '../lib/language';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';

interface StaticPageData extends TranslatableStaticPage {
  slug: string;
  sections: StaticPageSection[];
  updated_at: string;
}

const localizeStaticText = (value: string, language: string) => {
  if (normalizeLang(language) !== 'zh-TW') return value;

  return value
    .replace(/Cookie 使用/g, '網站記錄使用')
    .replace(/Cookie 與網站分析/g, '網站記錄與流量分析')
    .replace(/\bCookie\b/g, '網站記錄')
    .replace(/\bPrivacy Policy\b/g, '隱私權政策')
    .replace(/\bTerms of Service\b/g, '服務條款')
    .replace(/\bShipping Info\b/g, '配送說明')
    .replace(/\bReturns Policy\b/g, '退換貨政策')
    .replace(/\bMore pages\b/g, '更多頁面');
};

export default function StaticPage() {
  const { currentLanguage, t } = useLanguage();
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, '');
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fallbackPage = getStaticPageFallback(slug) as StaticPageData | null;
    setSourcePage(fallbackPage);
    setPage(fallbackPage);
    setNotFound(!fallbackPage);
    setLoading(!fallbackPage);

    const loadPage = async () => {
      if (!isSupabaseContentEnabled) {
        setNotFound(!fallbackPage);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('static_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const nextPage = data as StaticPageData;
          setSourcePage(nextPage);
          setPage(nextPage);
          setNotFound(false);
        } else {
          setSourcePage(fallbackPage);
          setPage(fallbackPage);
          setNotFound(!fallbackPage);
        }
      } catch {
        setSourcePage(fallbackPage);
        setPage(fallbackPage);
        setNotFound(!fallbackPage);
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [slug]);

  useEffect(() => {
    const run = async () => {
      if (!sourcePage) return;
      if (!shouldTranslateStaticPage(currentLanguage)) {
        setPage(sourcePage);
        return;
      }

      setTranslating(true);
      try {
        const translated = await translateStaticPage(sourcePage, currentLanguage);
        setPage(translated as StaticPageData);
      } catch {
        setPage(sourcePage);
      } finally {
        setTranslating(false);
      }
    };

    void run();
  }, [currentLanguage, sourcePage]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(pickByLang(currentLanguage, 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const seoTitle = page?.title ? page.title.split('|')[0].trim() : 'Static Page';
  const pageTitle = page ? localizeStaticText(page.title, currentLanguage) : '';
  const pageDescription = page?.meta_description ? localizeStaticText(page.meta_description, currentLanguage) : '';

  useSEO({
    title: pageTitle || seoTitle,
    description: pageDescription || t('static.seo.description', '靜態頁面資訊。'),
    keywords: `${pageTitle || '靜態頁面'},靜態頁面,網站資訊`,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
      <SiteHeader />

      <main className="flex-1 pt-24">
        {loading && (
          <div className="flex items-center justify-center py-40">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--sonpin-primary)] border-t-transparent" />
          </div>
        )}

        {!loading && notFound && (
          <div className="container mx-auto px-6 py-40 text-center">
            <h1 className="mb-4 text-3xl font-light text-[var(--sonpin-ink)]">
              {t('static.not_found.title', '找不到頁面')}
            </h1>
            <p className="mb-8 text-[var(--sonpin-primary-muted)]">
              {t('static.not_found.description', '找不到你要查看的頁面。')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--sonpin-primary)] px-6 py-3 text-sm text-[var(--sonpin-surface)] transition-colors hover:bg-[var(--sonpin-primary-soft)]"
            >
              {t('common.home', '首頁')}
              <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {!loading && page && (
          <>
            <section className="bg-gradient-to-br from-[var(--sonpin-ink)] via-[var(--sonpin-primary-soft)] to-[var(--sonpin-primary)] py-20 text-[var(--sonpin-surface)]">
              <div className="container mx-auto px-6">
                {translating && (
                  <div className="mb-4 inline-flex items-center rounded-full border border-[var(--sonpin-primary-border)]/30 bg-white/10 px-3 py-1 text-[11px] tracking-[0.18em] text-[var(--sonpin-surface)]">
                    {t('static.translating', '翻譯中...')}
                  </div>
                )}
                <div className="mb-6 flex items-center gap-2 text-sm text-[var(--sonpin-primary-muted)]">
                  <Link to="/" className="transition-colors hover:text-[var(--sonpin-primary-warm)]">
                    {t('common.home', '首頁')}
                  </Link>
                  <ChevronRight size={14} />
                  <span className="text-[var(--sonpin-primary-border)]">{pageTitle}</span>
                </div>
                <h1 className="text-4xl font-light tracking-wide md:text-5xl">{pageTitle}</h1>
                {pageDescription && (
                  <p className="mt-4 max-w-2xl font-light leading-relaxed text-[var(--sonpin-background)]">
                    {pageDescription}
                  </p>
                )}
                <p className="mt-6 text-sm text-[var(--sonpin-primary-muted)]">
                  {t('static.updated_at', 'Updated: ')}
                  {formatDate(page.updated_at)}
                </p>
              </div>
            </section>

            <div className="container mx-auto max-w-4xl px-6 py-16">
              {page.sections.map((section, index) => (
                <div key={index} className={`mb-12 ${section.type === 'intro' ? 'border-b border-[var(--sonpin-primary-border)] pb-12' : ''}`}>
                  {section.type === 'intro' ? (
                    <div className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)] p-8">
                      <h2 className="mb-4 text-2xl font-light text-[var(--sonpin-ink)]">{localizeStaticText(section.title, currentLanguage)}</h2>
                      <StaticContent
                        value={localizeStaticText(section.content, currentLanguage)}
                        className="text-lg font-light leading-relaxed text-[var(--sonpin-primary-soft)]"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 flex items-start gap-4">
                        <div className="mt-1 h-6 w-1 flex-shrink-0 rounded-full bg-[var(--sonpin-primary-warm)]" />
                        <h2 className="text-xl font-medium text-[var(--sonpin-ink)]">{localizeStaticText(section.title, currentLanguage)}</h2>
                      </div>
                      <StaticContent
                        value={localizeStaticText(section.content, currentLanguage)}
                        className="ml-5 font-light leading-relaxed text-[var(--sonpin-primary-soft)]"
                      />
                    </div>
                  )}
                </div>
              ))}

            </div>
          </>
        )}
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
