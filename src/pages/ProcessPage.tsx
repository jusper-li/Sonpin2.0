import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { useLanguage } from '../contexts/LanguageContext';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';

interface StaticPageData extends TranslatableStaticPage {}

const PROCESS_IMAGES = ['/sonpin-images/153285065447.jpg', '/sonpin-images/153285183849.jpg'];
const PROCESS_VIDEOS = ['https://www.youtube.com/embed/27K4gLy_eDg', 'https://www.youtube.com/embed/yh1SyCxqLJk'];

const PROCESS_FALLBACK: StaticPageData = {
  slug: 'process',
  title: '生產製程',
  meta_description: '了解淞品土雞從飼養、加工到配送的一條龍生產流程。',
  sections: [],
  updated_at: '2026-07-03T00:00:00+00:00',
};

export default function ProcessPage() {
  const { currentLanguage, t } = useLanguage();
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData>(PROCESS_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  const translatedTitle = page.title || t('process.title', '生產製程');

  useSEO({
    title: translatedTitle,
    description: page.meta_description,
    keywords: t('process.seo.keywords', '生產製程,品牌故事,產地,加工,配送'),
    schema: breadcrumbSchema([
      { name: t('common.home', '首頁'), url: window.location.origin },
      { name: translatedTitle, url: `${window.location.origin}/process` },
    ]),
  });

  useEffect(() => {
    const loadPage = async () => {
      if (!isSupabaseContentEnabled) {
        setPage(PROCESS_FALLBACK);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('static_pages')
          .select('*')
          .eq('slug', 'process')
          .eq('is_published', true)
          .maybeSingle();

        if (data) {
          setSourcePage(data);
          setPage(data);
        } else {
          setPage(PROCESS_FALLBACK);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!sourcePage) return;
      if (!shouldTranslateStaticPage(currentLanguage)) {
        setPage(sourcePage);
        return;
      }

      setTranslating(true);
      try {
        setPage(await translateStaticPage(sourcePage, currentLanguage));
      } catch {
        setPage(sourcePage);
      } finally {
        setTranslating(false);
      }
    };

    void run();
  }, [currentLanguage, sourcePage]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee] text-stone-800">
      <SiteHeader />

      <main className="flex-1 pt-20">
        <section className="border-b border-[#eadfd1] bg-[linear-gradient(135deg,#fbf6ee_0%,#f7efe5_44%,#fffaf2_100%)]">
          <div className="container mx-auto px-6 py-16 md:py-24">
            <nav className="mb-8 flex items-center gap-2 text-xs tracking-[0.18em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-700">
                {t('common.home', '首頁')}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">{translatedTitle}</span>
            </nav>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Process</p>
            <h1 className="max-w-3xl text-3xl font-light leading-tight tracking-[0.12em] text-stone-900 md:text-4xl">
              {translatedTitle}
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">{page.meta_description}</p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-12">
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {PROCESS_IMAGES.map((src, index) => (
                <figure key={src} className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
                  <img
                    src={src}
                    alt={t('process.imageAlt', `生產製程圖片 ${index + 1}`)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </figure>
              ))}
            </div>

            <div className="space-y-4">
              {PROCESS_VIDEOS.map((src) => (
                <div key={src} className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#2b221d] shadow-sm">
                  <div className="aspect-video w-full">
                    <iframe
                      className="h-full w-full"
                      src={src}
                      title={t('process.videoTitle', '生產製程影片')}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {(loading || translating) && (
          <section className="container mx-auto px-6 py-10">
            <div className="inline-flex items-center rounded-full border border-[#eadfd1] bg-[#fffaf2] px-3 py-1 text-[11px] tracking-[0.18em] text-[#8e6448]">
              {loading ? t('common.loading', '載入中...') : t('common.translating', '翻譯中...')}
            </div>
          </section>
        )}
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
