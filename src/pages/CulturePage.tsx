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

const CULTURE_IMAGE = '/sonpin-images/20250917152151.jpg';

const bankTransferNotice = `銀行：玉山銀行 808
帳號：1122-2338-0018
戶名：松品土雞專賣店

匯款完成後，請回到客服中心或聯絡我們通知確認。`;

const CULTURE_FALLBACK: StaticPageData = {
  slug: 'culture',
  title: '品牌文化',
  meta_description: '認識松品土雞的品牌理念、在地精神與文化故事。',
  sections: [
    {
      type: 'intro',
      title: '品牌文化',
      content:
        '松品土雞專注於提供安心、美味、適合送禮與自用的雞品與熟食，讓日常餐桌與節慶禮盒都能保有一份踏實與溫度。',
    },
    {
      type: 'section',
      title: '品牌精神',
      content:
        '我們相信好的食材來自誠實的製作與穩定的品質，因此從選料、處理到包裝都以嚴謹標準為核心，讓每一份商品都能安心送到顧客手上。',
    },
    {
      type: 'section',
      title: '匯款資訊',
      content: bankTransferNotice,
    },
  ],
  updated_at: '2026-07-03T00:00:00+00:00',
};

export default function CulturePage() {
  const { currentLanguage, t } = useLanguage();
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData>(CULTURE_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  useSEO({
    title: '品牌文化',
    description: page.meta_description,
    keywords: '品牌文化,品牌故事,匯款資訊,松品土雞',
    schema: breadcrumbSchema([
      { name: '首頁', url: window.location.origin },
      { name: '品牌文化', url: `${window.location.origin}/culture` },
    ]),
  });

  useEffect(() => {
    const loadPage = async () => {
      if (!isSupabaseContentEnabled) {
        setPage(CULTURE_FALLBACK);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('static_pages')
          .select('*')
          .eq('slug', 'culture')
          .eq('is_published', true)
          .maybeSingle();

        if (data) {
          setSourcePage(data);
          setPage(data);
        } else {
          setPage(CULTURE_FALLBACK);
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

  const sections = page.sections || [];
  const intro = sections.find((section) => section.type === 'intro');
  const rest = sections.filter((section) => section.type !== 'intro');
  const cultureImage = page?.images?.find((image) => image.slot === 'hero');

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
              <span className="text-stone-700">品牌文化</span>
            </div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--sonpin-primary)]/80">Notice</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              品牌文化
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">{page.meta_description}</p>
            {loading ? (
              <p className="mt-4 text-xs tracking-[0.18em] text-stone-400">Loading...</p>
            ) : translating ? (
              <p className="mt-4 text-xs tracking-[0.18em] text-stone-400">翻譯中…</p>
            ) : null}
          </div>
        </section>

        <section className="container mx-auto px-6 py-12">
          <div className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm">
            <img src={cultureImage?.url || CULTURE_IMAGE} alt={cultureImage?.alt || '品牌文化照片'} className="h-auto w-full object-cover" loading="lazy" />
          </div>
        </section>

        {intro && (
          <section className="border-b border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)]">
            <div className="container mx-auto max-w-4xl px-6 py-16">
              <h2 className="mb-4 text-center text-2xl font-light text-[var(--sonpin-ink)] md:text-3xl">{intro.title}</h2>
              <StaticContent
                value={intro.content}
                className="text-base leading-8 text-[var(--sonpin-primary-soft)] md:text-lg"
              />
            </div>
          </section>
        )}

        <section className="container mx-auto max-w-5xl px-6 py-20">
          <div className="space-y-16">
            {rest.map((section) => (
              <div key={section.title} className="flex flex-col gap-8 md:flex-row">
                <div className="md:w-1/3">
                  <div className="flex h-full min-h-[68px] flex-col justify-center rounded-3xl bg-[var(--sonpin-ink)] px-4 py-3 text-[var(--sonpin-surface)]">
                    <h2 className="text-lg font-medium tracking-[0.05em] md:text-xl">{section.title}</h2>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <StaticContent
                    value={section.content}
                    className="leading-relaxed text-[var(--sonpin-primary-soft)]"
                  />
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
