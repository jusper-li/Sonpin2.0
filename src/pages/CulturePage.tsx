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

const CULTURE_IMAGE = '/sonpin-images/20250917152151.jpg';

const bankTransferNotice = `訂購專線：02-2338-0018
轉帳銀行：永豐銀行 萬華分行　銀行代碼：807
轉帳帳號：105-001-0014900-4
戶名：淞品生技股份有限公司
統編：27522811

(PS. 轉帳或匯款完成請於星期一至星期日上午 9:00~17:00 務必來電確認，以便出貨，感恩。)`;

const CULTURE_FALLBACK: StaticPageData = {
  slug: 'culture',
  title: '購物須知',
  meta_description: '淞品土雞專賣店購物須知與退換貨規範。',
  sections: [
    {
      type: 'intro',
      title: '購物須知',
      content:
        '依消費者保護法第 19 條規定，網路購物享有 7 天猶豫期，但猶豫期並非試用期。食品基於衛生安全考量，除商品本身瑕疵或內容與訂單不符外，已拆封、已食用、因保存不良導致變質，或因個人主觀因素（口感、色澤、香氣等）恕不接受退換。',
    },
    {
      type: 'section',
      title: '配送資訊',
      content:
        '請留意網路購物訂單以宅配配送為主，請耐心等候物流安排。若有門市自取需求，請先與我們聯繫確認門市現貨與取貨時間。',
    },
    {
      type: 'section',
      title: '轉帳資訊',
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
    title: '購物須知',
    description: page.meta_description,
    keywords: '購物須知,退換貨,配送資訊,匯款資訊,淞品土雞',
    schema: breadcrumbSchema([
      { name: '首頁', url: window.location.origin },
      { name: '購物須知', url: `${window.location.origin}/culture` },
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
              <span className="text-stone-700">購物須知</span>
            </div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[var(--sonpin-primary)]/80">Notice</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              購物須知
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">{page.meta_description}</p>
            {loading ? (
              <p className="mt-4 text-xs tracking-[0.18em] text-stone-400">Loading...</p>
            ) : translating ? (
              <p className="mt-4 text-xs tracking-[0.18em] text-stone-400">{t('common.translating', '翻譯中')}</p>
            ) : null}
          </div>
        </section>

        <section className="container mx-auto px-6 py-12">
          <div className="overflow-hidden rounded-3xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] shadow-sm">
            <img src={CULTURE_IMAGE} alt="購物須知照片" className="h-auto w-full object-cover" loading="lazy" />
          </div>
        </section>

        {intro && (
          <section className="border-b border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)]">
            <div className="container mx-auto max-w-4xl px-6 py-16">
              <h2 className="mb-4 text-center text-2xl font-light text-[var(--sonpin-ink)] md:text-3xl">{intro.title}</h2>
              <p className="whitespace-pre-line text-base leading-8 text-[var(--sonpin-primary-soft)] md:text-lg">{intro.content}</p>
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
