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

const ABOUT_IMAGES = ['/sonpin-images/20180730135352.jpg', '/sonpin-images/20180730135448.jpg'];

export default function AboutPage() {
  const { currentLanguage, t } = useLanguage();
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  useSEO({
    title: page?.title || '關於淞品',
    description: page?.meta_description || '認識淞品土雞專賣店的品牌起點、經營理念與堅持。',
    keywords: '關於淞品,品牌故事,淞品土雞,土雞專賣店',
    schema: breadcrumbSchema([
      { name: '首頁', url: window.location.origin },
      { name: '關於淞品', url: `${window.location.origin}/about` },
    ]),
  });

  useEffect(() => {
    const loadPage = async () => {
      if (!isSupabaseContentEnabled) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('static_pages')
          .select('*')
          .eq('slug', 'about')
          .eq('is_published', true)
          .maybeSingle();

        if (data) {
          setSourcePage(data as StaticPageData);
          setPage(data as StaticPageData);
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

  const sections = page?.sections || [];
  const intro = sections.find((section) => section.type === 'intro');
  const rest = sections.filter((section) => section.type !== 'intro');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
        <SiteHeader />
        <main className="flex-1">
          <section className="container mx-auto px-6 py-24 text-stone-500">載入中...</section>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
        <SiteHeader />
        <main className="flex-1">
          <section className="container mx-auto px-6 py-24 text-stone-500">找不到關於淞品的內容。</section>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[var(--sonpin-primary-border)] bg-[linear-gradient(135deg,var(--sonpin-background)_0%,var(--sonpin-background)_44%,var(--sonpin-surface)_100%)]">
          <div className="container mx-auto px-6 py-16 md:py-24">
            <div className="mb-8 flex items-center gap-2 text-xs tracking-[0.18em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-700">
                首頁
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">關於淞品</span>
            </div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--sonpin-primary)]/80">About</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              {page.title}
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">{page.meta_description}</p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-10">
          <div className="grid gap-4 md:grid-cols-2">
            {ABOUT_IMAGES.map((src, index) => (
              <figure key={src} className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm">
                <img src={src} alt={`關於淞品圖片 ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </figure>
            ))}
          </div>
        </section>

        {intro && (
          <section className="border-b border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)]">
            <div className="container mx-auto max-w-4xl px-6 py-16">
              {translating && (
                <div className="mb-4 inline-flex items-center rounded-full border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-3 py-1 text-[11px] tracking-[0.18em] text-[var(--sonpin-primary)]">
                  翻譯中
                </div>
              )}
              <p className="text-center text-lg leading-relaxed text-[var(--sonpin-primary-soft)] md:text-xl">{intro.content}</p>
            </div>
          </section>
        )}

        <section className="container mx-auto max-w-5xl px-6 py-20">
          <div className="space-y-16">
            {rest.map((section, index) => (
              <div key={section.title} className={`flex flex-col gap-8 md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="md:w-1/3">
                  <div className="flex h-full min-h-[68px] flex-col justify-center rounded-3xl bg-[#2b221d] px-4 py-3 text-[var(--sonpin-surface)]">
                    <h2 className="text-lg font-medium tracking-[0.05em] md:text-xl">{section.title}</h2>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="whitespace-pre-line leading-relaxed text-[var(--sonpin-primary-soft)]">{section.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
