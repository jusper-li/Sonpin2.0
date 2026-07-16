import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import StaticContent from '../components/StaticContent';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { useLanguage } from '../contexts/LanguageContext';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';

interface StaticPageData extends TranslatableStaticPage {}

const ABOUT_IMAGES = ['/sonpin-images/20180730135352.jpg', '/sonpin-images/20180730135448.jpg'];

const ABOUT_FALLBACK: StaticPageData = {
  slug: 'about',
  title: '關於淞品',
  meta_description: '認識淞品土雞專賣店的品牌理念、故事與堅持。',
  sections: [
    {
      type: 'intro',
      title: '關於淞品',
      content: '淞品土雞專賣店以安心食材、穩定品質與貼心服務為核心，持續提供適合送禮與日常享用的優質雞品。',
    },
  ],
  updated_at: '2026-07-03T00:00:00+00:00',
};

export default function AboutPage() {
  const { currentLanguage, t } = useLanguage();
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData>(ABOUT_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  useSEO({
    title: page?.title || '關於淞品',
    description: page?.meta_description || '認識淞品土雞專賣店的品牌理念、故事與堅持。',
    keywords: '關於淞品,品牌故事,淞品土雞,土雞專賣店',
    schema: breadcrumbSchema([
      { name: '首頁', url: window.location.origin },
      { name: '關於淞品', url: `${window.location.origin}/about` },
    ]),
  });

  useEffect(() => {
    const loadPage = async () => {
      if (!isSupabaseContentEnabled) {
        setPage(ABOUT_FALLBACK);
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
        } else {
          setPage(ABOUT_FALLBACK);
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
  const galleryImages = (page?.images || []).filter((image) => image.slot.startsWith('gallery')).slice(0, 2);
  const aboutImages =
    galleryImages.length > 0
      ? galleryImages
      : ABOUT_IMAGES.map((url, index) => ({ slot: `gallery-${index + 1}`, url, alt: `關於淞品圖片 ${index + 1}` }));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
        <SiteHeader />
        <main className="flex-1">
          <section className="container mx-auto px-6 py-24 text-stone-500">載入中…</section>
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
            {translating && <p className="mt-4 text-xs tracking-[0.18em] text-stone-400">翻譯中…</p>}
          </div>
        </section>

        <section className="container mx-auto px-6 py-10">
          <div className="grid gap-4 md:grid-cols-2">
            {aboutImages.map((image, index) => (
              <figure key={`${image.url}-${index}`} className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm">
                <img src={image.url} alt={image.alt || `關於淞品圖片 ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </figure>
            ))}
          </div>
        </section>

        {intro && (
          <section className="border-b border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)]">
            <div className="container mx-auto max-w-4xl px-6 py-16">
              <StaticContent
                value={intro.content}
                className="text-center text-lg leading-relaxed text-[var(--sonpin-primary-soft)] md:text-xl"
              />
            </div>
          </section>
        )}

        <section className="container mx-auto max-w-5xl px-6 py-20">
          <div className="space-y-16">
            {rest.map((section, index) => (
              <div key={section.title} className={`flex flex-col gap-8 md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="md:w-1/3">
                  <div className="flex h-full min-h-[68px] flex-col justify-center rounded-3xl bg-[var(--sonpin-ink)] px-4 py-3 text-[var(--sonpin-surface)]">
                    <h2 className="text-lg font-medium tracking-[0.05em] md:text-xl">{section.title}</h2>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <StaticContent value={section.content} className="leading-relaxed text-[var(--sonpin-primary-soft)]" />
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
