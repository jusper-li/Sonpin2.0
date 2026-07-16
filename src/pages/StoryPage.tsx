import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import StaticContent from '../components/StaticContent';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';

interface StaticPageData extends TranslatableStaticPage {}

const FALLBACK_HERO = 'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=1600';

const STORY_FALLBACK: StaticPageData = {
  slug: 'story',
  title: '品牌故事',
  meta_description: '了解松品土雞的起點、理念與成長歷程。',
  sections: [
    {
      type: 'intro',
      title: '品牌故事',
      content: '松品土雞從在地食材與安心製程出發，一步一步累積成為值得信任的品牌。',
    },
    {
      type: 'section',
      title: '起點',
      content: '我們從家族熟悉的農牧經驗開始，理解食材來源、飼養方式與消費者真正關心的安心感。',
    },
    {
      type: 'section',
      title: '理念',
      content: '把每一份土雞商品都做得穩定、透明、好入口，讓日常料理與節慶送禮都能更有餘裕。',
    },
    {
      type: 'section',
      title: '成長',
      content: '透過線上線下的持續累積，我們希望把更好的土雞品牌體驗帶給更多家庭。',
    },
  ],
  updated_at: '2026-07-03T00:00:00+00:00',
};

export default function StoryPage() {
  const { currentLanguage, t } = useLanguage();
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData | null>(STORY_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

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
          .eq('slug', 'story')
          .eq('is_published', true)
          .maybeSingle();

        if (data) {
          setSourcePage(data as StaticPageData);
          setPage(data as StaticPageData);
        }
      } catch {
        // Keep fallback.
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
  const storyChapters = sections.filter((section) => section.type !== 'intro');
  const heroImage = page?.images?.find((image) => image.slot === 'hero');

  const seoTitle = page?.title ? page.title.split('|')[0].trim() : '品牌故事';

  useSEO({
    title: seoTitle,
    description: page?.meta_description || '了解松品土雞的起點、理念與成長歷程。',
    keywords: '品牌故事,松品土雞,品牌理念,成長歷程',
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative h-[55vh] min-h-[420px] overflow-hidden bg-[var(--sonpin-primary-warm)]">
          <img
            src={heroImage?.url || FALLBACK_HERO}
            alt={heroImage?.alt || '品牌故事主視覺'}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--sonpin-ink)]/50 via-transparent to-[var(--sonpin-primary)]/40" />
          <div className="relative container mx-auto flex h-full flex-col justify-end px-6 pb-16">
            <div className="mb-4 flex items-center gap-2 text-xs tracking-[0.1em] text-[var(--sonpin-primary-border)]">
              <Link to="/" className="transition-colors hover:text-[var(--sonpin-surface)]">
                首頁
              </Link>
              <ChevronRight size={12} />
              <span className="text-[var(--sonpin-primary-border)]">品牌故事</span>
            </div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-[var(--sonpin-background)]">
              Brand Story
            </p>
            <h1 className="text-5xl font-light tracking-wide text-[var(--sonpin-surface)] md:text-7xl">
              {loading ? '品牌故事' : (page?.title || '品牌故事')}
            </h1>
          </div>
        </section>

        {intro && (
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--sonpin-primary)]" />
            <div className="relative container mx-auto max-w-3xl px-6 py-20 text-center">
              {translating && (
                <div className="mb-4 inline-flex items-center rounded-full border border-[var(--sonpin-primary-border)]/60 bg-[var(--sonpin-surface)]/15 px-3 py-1 text-[11px] tracking-[0.18em] text-[var(--sonpin-surface)]">
                  翻譯中…
                </div>
              )}
              <div className="mx-auto mb-8 h-px w-16 bg-[var(--sonpin-primary-border)]" />
              <h2 className="mb-6 text-2xl font-light leading-relaxed text-[var(--sonpin-surface)] md:text-3xl">
                {intro.title}
              </h2>
              <StaticContent value={intro.content} className="text-base font-light leading-relaxed text-[var(--sonpin-surface)] md:text-lg" />
              <div className="mx-auto mt-8 h-px w-16 bg-[var(--sonpin-primary-border)]" />
            </div>
          </section>
        )}

        <section className="container mx-auto max-w-4xl px-6 py-24">
          <div className="relative">
            <div className="absolute bottom-0 top-0 left-4 w-px bg-[var(--sonpin-background)] md:left-1/2 md:-translate-x-1/2" />

            {storyChapters.map((section, index) => (
              <div
                key={`${section.title}-${index}`}
                className={`relative mb-20 flex flex-col gap-8 md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                  <div className="pl-12 md:pl-0">
                    <div className="mb-3 inline-block rounded-full bg-[var(--sonpin-background)] px-3 py-1 text-xs font-medium tracking-[0.3em] text-[var(--sonpin-primary)]">
                      章節 {index + 1}
                    </div>
                    <h2 className="mb-5 text-2xl font-light leading-snug text-[var(--sonpin-ink)] md:text-3xl">
                      {section.title}
                    </h2>
                    <StaticContent value={section.content} className="font-light leading-relaxed text-[var(--sonpin-primary-soft)]" />
                  </div>
                </div>

                <div className="absolute left-0 top-2 md:hidden">
                  <div className="ml-2 h-4 w-4 rounded-full border-4 border-[var(--sonpin-surface)] bg-[var(--sonpin-primary-warm)] shadow-md" />
                </div>
                <div className="hidden md:flex md:w-0 items-start justify-center relative">
                  <div className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-[var(--sonpin-surface)] bg-[var(--sonpin-primary-warm)] shadow-md" />
                </div>

                <div className="md:w-1/2" />
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)]">
          <div className="container mx-auto max-w-5xl px-6 py-20">
            <div className="grid gap-8 text-center md:grid-cols-3">
              <div className="group">
                <div className="mb-2 text-5xl font-light text-[var(--sonpin-primary)] transition-transform duration-300 group-hover:scale-110">2018</div>
                <div className="text-sm font-light text-[var(--sonpin-primary-muted)]">創立</div>
              </div>
              <div className="group">
                <div className="mb-2 text-5xl font-light text-[var(--sonpin-primary)] transition-transform duration-300 group-hover:scale-110">8+</div>
                <div className="text-sm font-light text-[var(--sonpin-primary-muted)]">合作夥伴</div>
              </div>
              <div className="group">
                <div className="mb-2 text-5xl font-light text-[var(--sonpin-primary)] transition-transform duration-300 group-hover:scale-110">100K+</div>
                <div className="text-sm font-light text-[var(--sonpin-primary-muted)]">顧客支持</div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--sonpin-background)] py-20">
          <div className="container mx-auto max-w-2xl px-6 text-center">
            <h2 className="mb-6 text-3xl font-light text-[var(--sonpin-ink)]">想更了解我們嗎？</h2>
            <p className="mb-10 font-light leading-relaxed text-[var(--sonpin-primary-muted)]">
              歡迎到商品頁看看我們的土雞禮盒與常溫滴雞精，也可以前往客服中心與我們聯絡。
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--sonpin-ink)] px-8 py-4 text-sm font-medium text-[var(--sonpin-surface)] transition-colors hover:bg-[var(--sonpin-primary)]"
              >
                前往選購
                <ChevronRight size={16} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--sonpin-primary-border)] px-8 py-4 text-sm font-light text-[var(--sonpin-primary-soft)] transition-colors hover:border-[var(--sonpin-primary-warm)]"
              >
                關於淞品
              </Link>
            </div>
          </div>
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
