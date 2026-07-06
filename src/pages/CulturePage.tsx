import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { useLanguage } from '../contexts/LanguageContext';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';

interface StaticPageData extends TranslatableStaticPage {}

const CULTURE_IMAGE = '/sonpin-images/20250917152151.jpg';

const bankTransferNotice = `訂購專�?�?2-2338-0018
轉帳?�行�?永�??��??�華?��? ?�行代碼�?807
轉帳帳�?�?05-001-0014900-4
?��?：�??��??�?�份?��??�司
統編�?7522811

(PS. 轉帳?�匯款�??��??��??��?~?��??��???:00~17:00?��?來電確�?，以便出貨�??�恩??`;

const CULTURE_FALLBACK: StaticPageData = {
  slug: 'culture',
  title: '購物?�知',
  meta_description: '淞�??��?購物?�知?�退?�貨規�??�匯款�?訊�?,
  sections: [
    {
      type: 'intro',
      title: '購物?�知',
      content:
        '?��?保�?�?9條�?定�?網路?�購?��?享�?7?�猶豫�??�?�貨之�??�。�??�公?�產?�為?�鮮?��??��?，除了�??�本身�??�疵?��??�內容�?訂單不符?�可?�貨�?，�?經�?封、�??��?消費?�造�?之�??��?形、失溫�?保�?不良導致變質，以?��??�人主�??��?（�?�?��大小、色澤、口?�、�??�歡?��?好�?）�??�收?��??��??��??��??�臨?��?消�??�無法退?�貨??,
    },
    {
      type: 'section',
      title: '?�送�???,
      content:
        '請注?��?網路購物訂單?��?後�?請耐�?等候�??�統一?�送�??�市�??�為?��??�送�?，無法�?定�?市�?貨。\n\n如�??�市購買�??��??��?市購買�??��??��??�購，�?謝�?\n\n?�公?�產?�已?��??��?責任?�。\n食�?業登?��??��?Q-127522811-00001-3??,
    },
    {
      type: 'section',
      title: '轉帳資�?',
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
    title: '購物?�知',
    description: page.meta_description,
    keywords: '購物?�知,?�?�貨,?�送�???轉帳資�?,淞�??��?',
    schema: breadcrumbSchema([
      { name: '首�?', url: window.location.origin },
      { name: '購物?�知', url: `${window.location.origin}/culture` },
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
    <div className="min-h-screen flex flex-col bg-[#fbf6ee]">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[#eadfd1] bg-[linear-gradient(135deg,#fbf6ee_0%,#f7efe5_44%,#fffaf2_100%)]">
          <div className="container mx-auto px-6 py-16 md:py-24">
            <div className="mb-8 flex items-center gap-2 text-xs tracking-[0.18em] text-stone-400">
              <Link to="/" className="transition-colors hover:text-stone-700">
                首�?
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">購物?�知</span>
            </div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">Notice</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              購物?�知
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">{page.meta_description}</p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-12">
          <div className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
            <img src={CULTURE_IMAGE} alt="購物?�知證�??�件" className="h-auto w-full object-cover" loading="lazy" />
          </div>
        </section>

        {intro && (
          <section className="border-b border-[#eadfd1] bg-[#f4ecdf]">
            <div className="container mx-auto max-w-4xl px-6 py-16">
              {translating && (
                <div className="mb-4 inline-flex items-center rounded-full border border-[#eadfd1] bg-[#fffaf2] px-3 py-1 text-[11px] tracking-[0.18em] text-[#8e6448]">
                  {t('common.translating', '翻譯�?)}
                </div>
              )}
              <h2 className="mb-4 text-center text-2xl font-light text-[#2b221d] md:text-3xl">{intro.title}</h2>
              <p className="whitespace-pre-line text-base leading-8 text-[#6d4f3d] md:text-lg">{intro.content}</p>
            </div>
          </section>
        )}

        <section className="container mx-auto max-w-5xl px-6 py-20">
          <div className="space-y-16">
            {rest.map((section) => (
              <div key={section.title} className="flex flex-col gap-8 md:flex-row">
                <div className="md:w-1/3">
                  <div className="flex h-full min-h-[68px] flex-col justify-center rounded-3xl bg-[#2b221d] px-4 py-3 text-[#fffaf2]">
                    <h2 className="text-lg font-medium tracking-[0.05em] md:text-xl">{section.title}</h2>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="whitespace-pre-line leading-relaxed text-[#6d4f3d]">{section.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

