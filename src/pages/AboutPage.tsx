import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Leaf } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { useLanguage } from '../contexts/LanguageContext';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';

interface StaticPageData extends TranslatableStaticPage {}

const bankTransferNotice = `訂購專線：02-2338-0018
轉帳銀行：永豐銀行 萬華分行 銀行代碼：807
轉帳帳號：105-001-0014900-4
戶名：淞品生技股份有限公司
統編：27522811

(PS. 轉帳或匯款完成請於星期二~星期日上午9:00~17:00務必來電確認，以便出貨，感恩。)`;

const ABOUT_FALLBACK: StaticPageData = {
  slug: 'about',
  title: '關於淞品',
  meta_description: '艋舺傳香十多年的淞品土雞，堅持台灣土雞與家傳料理法。',
  sections: [
    {
      type: 'intro',
      title: '品牌故事',
      content:
        '艋舺（現萬華），曾經是最繁華的地方，淞品雞肉在艋舺傳香了10幾年，是來過艋舺的人都不會錯過的美味。',
    },
    {
      type: 'section',
      title: '品牌緣起',
      content:
        '淞品商行位在萬華廟口三水市場內，每天不絕於耳用菜刀剁雞的聲音，從破曉的五六點一直到傍晚五六點都沒停過。\n\n淞品門口的排隊人潮也從來不曾間斷過，最出名的煙燻雞及鹹水雞是老闆的家傳秘方。\n\n我們堅持使用自養的台灣土雞，遵循家傳的料理法，淞品的味道10幾年沒變過，將來也不會變。\n\n我們傳承的不只是好口味，更是一份對美食精神的堅持。',
    },
    {
      type: 'section',
      title: '匯款資訊',
      content: bankTransferNotice,
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
    title: '關於淞品',
    description: page.meta_description,
    keywords: '關於淞品,品牌故事,品牌緣起,淞品土雞,萬華三水市場',
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
          setSourcePage(data);
          setPage(data);
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
        const translated = await translateStaticPage(sourcePage, currentLanguage);
        setPage(translated);
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
                首頁
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">關於淞品</span>
            </div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">About</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              關於淞品
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">
              {page.meta_description}
            </p>
          </div>
        </section>

        {intro && (
          <section className="border-b border-[#eadfd1] bg-[#f4ecdf]">
            <div className="container mx-auto max-w-4xl px-6 py-16">
              {translating && (
                <div className="mb-4 inline-flex items-center rounded-full border border-[#eadfd1] bg-[#fffaf2] px-3 py-1 text-[11px] tracking-[0.18em] text-[#8e6448]">
                  {t('common.translating', '翻譯中')}
                </div>
              )}
              <p className="text-center text-lg leading-relaxed text-[#6d4f3d] md:text-xl">
                {intro.content}
              </p>
            </div>
          </section>
        )}

        <section className="container mx-auto max-w-5xl px-6 py-20">
          <div className="space-y-16">
            {rest.map((section, index) => (
              <div key={section.title} className={`flex flex-col gap-8 md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="md:w-1/3">
                  <div className="flex h-full min-h-[180px] flex-col justify-between rounded-3xl bg-[#2b221d] p-8 text-[#fffaf2]">
                    <Leaf className="mb-4 h-8 w-8 text-[#f4ecdf]" />
                    <h2 className="text-2xl font-light">{section.title}</h2>
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
