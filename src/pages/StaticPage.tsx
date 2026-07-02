import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
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
    new Date(dateStr).toLocaleDateString(
      pickByLang(currentLanguage, 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'),
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

  const seoTitle = page?.title ? page.title.split('|')[0].trim() : 'Sonpin';

  useSEO({
    title: seoTitle,
    description: page?.meta_description || t('static.seo.description', 'Sonpin 的品牌資訊與政策說明。'),
    keywords: `${page?.title || 'Sonpin'},Sonpin`,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee]">
      <SiteHeader />

      <main className="flex-1 pt-24">
        {loading && (
          <div className="flex items-center justify-center py-40">
            <div className="w-8 h-8 border-2 border-[#8e6448] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && notFound && (
          <div className="container mx-auto px-6 py-40 text-center">
            <h1 className="text-3xl font-light text-[#2b221d] mb-4">
              {t('static.not_found.title', '找不到頁面')}
            </h1>
            <p className="text-[#9f8a7b] mb-8">
              {t('static.not_found.description', '這個頁面目前不存在，請回到首頁繼續瀏覽。')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8e6448] text-[#fffaf2] rounded-full hover:bg-[#6d4f3d] transition-colors text-sm"
            >
              {t('common.home', '首頁')}
              <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {!loading && page && (
          <>
            <section className="bg-gradient-to-br from-[#2b221d] via-[#5f4636] to-[#8e6448] text-[#fffaf2] py-20">
              <div className="container mx-auto px-6">
                {translating && (
                  <div className="mb-4 inline-flex items-center rounded-full border border-[#eadfd1]/30 bg-white/10 px-3 py-1 text-[11px] tracking-[0.18em] text-[#fffaf2]">
                    {t('common.translating', '翻譯中')}
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#9f8a7b] text-sm mb-6">
                  <Link to="/" className="hover:text-[#cfa87a] transition-colors">
                    {t('common.home', '首頁')}
                  </Link>
                  <ChevronRight size={14} />
                  <span className="text-[#eadfd1]">{page.title}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-light tracking-wide">{page.title}</h1>
                {page.meta_description && (
                  <p className="mt-4 text-[#f4ecdf] max-w-2xl font-light leading-relaxed">
                    {page.meta_description}
                  </p>
                )}
                <p className="mt-6 text-[#9f8a7b] text-sm">
                  {t('static.updated_at', '最後更新：')}
                  {formatDate(page.updated_at)}
                </p>
              </div>
            </section>

            <div className="container mx-auto px-6 py-16 max-w-4xl">
              {page.sections.map((section, index) => (
                <div
                  key={index}
                  className={`mb-12 ${section.type === 'intro' ? 'pb-12 border-b border-[#eadfd1]' : ''}`}
                >
                  {section.type === 'intro' ? (
                    <div className="bg-[#f4ecdf] border border-[#eadfd1] rounded-2xl p-8">
                      <h2 className="text-2xl font-light text-[#2b221d] mb-4">{section.title}</h2>
                      <p className="text-[#6d4f3d] leading-relaxed font-light text-lg whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-1 bg-[#cfa87a] rounded-full flex-shrink-0 mt-1" style={{ minHeight: '1.5rem' }} />
                        <h2 className="text-xl font-medium text-[#2b221d]">{section.title}</h2>
                      </div>
                      <div className="ml-5 text-[#6d4f3d] leading-relaxed font-light whitespace-pre-line">
                        {formatContent(section.content)}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-16 pt-8 border-t border-[#eadfd1] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-[#9f8a7b] font-light">
                  {t('static.more_pages', '相關頁面')}
                </p>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  <Link
                    to="/privacy"
                    className={`text-sm transition-colors ${
                      slug === 'privacy'
                        ? 'text-[#8e6448] font-medium'
                        : 'text-[#9f8a7b] hover:text-[#8e6448]'
                    }`}
                  >
                    {t('footer.privacy', '隱私權政策')}
                  </Link>
                  <span className="text-[#eadfd1]">|</span>
                  <Link
                    to="/terms"
                    className={`text-sm transition-colors ${
                      slug === 'terms'
                        ? 'text-[#8e6448] font-medium'
                        : 'text-[#9f8a7b] hover:text-[#8e6448]'
                    }`}
                  >
                    {t('footer.terms', '服務條款')}
                  </Link>
                  <span className="text-[#eadfd1]">|</span>
                  <Link
                    to="/shipping"
                    className={`text-sm transition-colors ${
                      slug === 'shipping'
                        ? 'text-[#8e6448] font-medium'
                        : 'text-[#9f8a7b] hover:text-[#8e6448]'
                    }`}
                  >
                    {t('footer.shipping', '配送說明')}
                  </Link>
                  <span className="text-[#eadfd1]">|</span>
                  <Link
                    to="/returns"
                    className={`text-sm transition-colors ${
                      slug === 'returns'
                        ? 'text-[#8e6448] font-medium'
                        : 'text-[#9f8a7b] hover:text-[#8e6448]'
                    }`}
                  >
                    {t('footer.returns', '退換貨政策')}
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
