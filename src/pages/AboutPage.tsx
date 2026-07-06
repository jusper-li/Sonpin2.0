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

const ABOUT_VIDEO_URL = 'https://www.youtube.com/embed/xJyJpzDpTlA?rel=0';

const ABOUT_IMAGES = [
  '/sonpin-images/20180730135352.jpg',
  '/sonpin-images/20180730135448.jpg',
];

const bankTransferNotice = `閮頃撠?嚗?2-2338-0018
頧董?銵?瘞貉??銵??祈?? ?銵誨蝣潘?807
頧董撣唾?嚗?05-001-0014900-4
?嗅?嚗?????∩遢???砍
蝯梁楊嚗?7522811

(PS. 頧董?甈曉????潭???~???乩???:00~17:00??靘蝣箄?嚗誑靘踹鞎剁????`;

const ABOUT_FALLBACK: StaticPageData = {
  slug: 'about',
  title: '?瘛?',
  meta_description: '??????????????????',
  sections: [
    {
      type: 'intro',
      title: '????',
      content:
        '??????????????????????????????????????????',
    },
    {
      type: 'section',
      title: '??蝺?絲',
      content:
        '???????????????????????????????????????',
    },
    {
      type: 'section',
      title: '?舀狡鞈?',
      content: bankTransferNotice,
    },
  ],
  updated_at: '2026-07-03T00:00:00+00:00',
};

export default function AboutPage() {
  const { currentLanguage, t } = useLanguage();
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData>(ABOUT_FALLBACK);
  const [, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  useSEO({
    title: '?瘛?',
    description: page.meta_description,
    keywords: '?瘛?,????,??蝺?絲,瘛???,?祈銝偌撣',
    schema: breadcrumbSchema([
      { name: '擐?', url: window.location.origin },
      { name: '?瘛?', url: `${window.location.origin}/about` },
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
                擐?
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700">?瘛?</span>
            </div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#8e6448]/80">About</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-[0.16em] text-stone-900 md:text-6xl">
              ?瘛?
            </h1>
            <p className="mt-7 max-w-2xl text-sm font-light leading-8 text-stone-500">{page.meta_description}</p>
          </div>
        </section>

        <section className="container mx-auto px-6 py-10">
          <div className="grid gap-4 md:grid-cols-2">
            {ABOUT_IMAGES.map((src, index) => (
              <figure key={src} className="overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#fffaf2] shadow-sm">
                <img src={src} alt={`瘛?隞晶?抒? ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </figure>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-6 py-10">
          <div className="mb-4 overflow-hidden rounded-3xl border border-[#eadfd1] bg-[#2b221d] shadow-sm">
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src={ABOUT_VIDEO_URL}
                title="瘛?隞晶敶梁?"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {intro && (
          <section className="border-b border-[#eadfd1] bg-[#f4ecdf]">
            <div className="container mx-auto max-w-4xl px-6 py-16">
              {translating && (
                <div className="mb-4 inline-flex items-center rounded-full border border-[#eadfd1] bg-[#fffaf2] px-3 py-1 text-[11px] tracking-[0.18em] text-[#8e6448]">
                  {t('common.translating', '???')}
                </div>
              )}
              <p className="text-center text-lg leading-relaxed text-[#6d4f3d] md:text-xl">{intro.content}</p>
            </div>
          </section>
        )}

        <section className="container mx-auto max-w-5xl px-6 py-20">
          <div className="space-y-16">
            {rest.map((section, index) => (
              <div key={section.title} className={`flex flex-col gap-8 md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
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

      <DeferredSiteFooter />
    </div>
  );
}
