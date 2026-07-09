import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { getStaticPageFallback, StaticPageSection } from '../data/staticPages';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import { pickByLang } from '../lib/language';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';

interface StaticPageData extends TranslatableStaticPage {
  slug: string;
  sections: StaticPageSection[];
  updated_at: string;
}

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

  const formatContent = (content: string) =>
    content.split('\n').map((line, index, arr) => (
      <span key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </span>
    ));

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(pickByLang(currentLanguage, 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const seoTitle = page?.title ? page.title.split('|')[0].trim() : 'Static Page';

  useSEO({
    title: seoTitle,
    description: page?.meta_description || t('static.seo.description', 'Static page details and information.'),
    keywords: `${page?.title || 'Static Page'},static,page,information`,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee]">
      <SiteHeader />

      <main className="flex-1 pt-24">
        {loading && (
          <div className="flex items-center justify-center py-40">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8e6448] border-t-transparent" />
          </div>
        )}

        {!loading && notFound && (
          <div className="container mx-auto px-6 py-40 text-center">
            <h1 className="mb-4 text-3xl font-light text-[#2b221d]">
              {t('static.not_found.title', 'Page not found')}
            </h1>
            <p className="mb-8 text-[#9f8a7b]">
              {t('static.not_found.description', 'The page you requested could not be found.')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#8e6448] px-6 py-3 text-sm text-[#fffaf2] transition-colors hover:bg-[#6d4f3d]"
            >
              {t('common.home', 'Home')}
              <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {!loading && page && (
          <>
            <section className="bg-gradient-to-br from-[#2b221d] via-[#5f4636] to-[#8e6448] py-20 text-[#fffaf2]">
              <div className="container mx-auto px-6">
                {translating && (
                  <div className="mb-4 inline-flex items-center rounded-full border border-[#eadfd1]/30 bg-white/10 px-3 py-1 text-[11px] tracking-[0.18em] text-[#fffaf2]">
                    {t('static.translating', 'Translating...')}
                  </div>
                )}
                <div className="mb-6 flex items-center gap-2 text-sm text-[#9f8a7b]">
                  <Link to="/" className="transition-colors hover:text-[#cfa87a]">
                    {t('common.home', 'Home')}
                  </Link>
                  <ChevronRight size={14} />
                  <span className="text-[#eadfd1]">{page.title}</span>
                </div>
                <h1 className="text-4xl font-light tracking-wide md:text-5xl">{page.title}</h1>
                {page.meta_description && (
                  <p className="mt-4 max-w-2xl font-light leading-relaxed text-[#f4ecdf]">
                    {page.meta_description}
                  </p>
                )}
                <p className="mt-6 text-sm text-[#9f8a7b]">
                  {t('static.updated_at', 'Updated: ')}
                  {formatDate(page.updated_at)}
                </p>
              </div>
            </section>

            <div className="container mx-auto max-w-4xl px-6 py-16">
              {page.sections.map((section, index) => (
                <div key={index} className={`mb-12 ${section.type === 'intro' ? 'border-b border-[#eadfd1] pb-12' : ''}`}>
                  {section.type === 'intro' ? (
                    <div className="rounded-2xl border border-[#eadfd1] bg-[#f4ecdf] p-8">
                      <h2 className="mb-4 text-2xl font-light text-[#2b221d]">{section.title}</h2>
                      <p className="whitespace-pre-line text-lg font-light leading-relaxed text-[#6d4f3d]">
                        {section.content}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 flex items-start gap-4">
                        <div className="mt-1 h-6 w-1 flex-shrink-0 rounded-full bg-[#cfa87a]" />
                        <h2 className="text-xl font-medium text-[#2b221d]">{section.title}</h2>
                      </div>
                      <div className="ml-5 whitespace-pre-line font-light leading-relaxed text-[#6d4f3d]">
                        {formatContent(section.content)}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#eadfd1] pt-8 sm:flex-row">
                <p className="text-sm font-light text-[#9f8a7b]">{t('static.more_pages', 'More pages')}</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link to="/privacy" className="text-sm text-[#9f8a7b] transition-colors hover:text-[#8e6448]">
                    {t('static.more_pages.privacy', 'Privacy Policy')}
                  </Link>
                  <span className="text-[#eadfd1]">|</span>
                  <Link to="/terms" className="text-sm text-[#9f8a7b] transition-colors hover:text-[#8e6448]">
                    {t('static.more_pages.terms', 'Terms of Service')}
                  </Link>
                  <span className="text-[#eadfd1]">|</span>
                  <Link to="/shipping" className="text-sm text-[#9f8a7b] transition-colors hover:text-[#8e6448]">
                    {t('static.more_pages.shipping', 'Shipping Info')}
                  </Link>
                  <span className="text-[#eadfd1]">|</span>
                  <Link to="/returns" className="text-sm text-[#9f8a7b] transition-colors hover:text-[#8e6448]">
                    {t('static.more_pages.returns', 'Returns Policy')}
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
