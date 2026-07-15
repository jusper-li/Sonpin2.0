import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';

interface StaticPageData extends TranslatableStaticPage {}

export default function StoryPage() {
  const { currentLanguage, t } = useLanguage();
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData | null>(null);
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
          setSourcePage(data);
          setPage(data);
        }
      } catch {
        // Keep fallback state.
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

  const formatContent = (content: string) =>
    content.split('\n').map((line, index, arr) => (
      <span key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </span>
    ));

  const sections = page?.sections || [];
  const intro = sections.find((section) => section.type === 'intro');
  const storyChapters = sections.filter((section) => section.type !== 'intro');

  const seoTitle = page?.title
    ? page.title.split('|')[0].trim()
    : t('story.seo.title', '品牌故事');

  useSEO({
    title: seoTitle,
    description: page?.meta_description || t('story.seo.description', '了解淞品土雞的品牌起點、理念與成長歷程。'),
    keywords: t('story.seo.keywords', '品牌故事,淞品土雞,理念'),
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative h-[55vh] min-h-[420px] bg-[var(--sonpin-primary-warm)] overflow-hidden">
          <img
            src="https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt={t('story.hero.alt', '品牌故事')}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--sonpin-ink)]/50 via-transparent to-[var(--sonpin-primary)]/40" />
          <div className="relative h-full flex flex-col justify-end pb-16 px-6 container mx-auto">
            <div className="flex items-center gap-2 text-xs text-[var(--sonpin-primary-border)] tracking-[0.1em] mb-4">
              <Link to="/" className="hover:text-[var(--sonpin-surface)] transition-colors">
                {t('common.home', '首頁')}
              </Link>
              <ChevronRight size={12} />
              <span className="text-[var(--sonpin-primary-border)]">{t('story.breadcrumb', '品牌故事')}</span>
            </div>
            <p className="text-[var(--sonpin-background)] text-xs tracking-[0.3em] uppercase mb-3 font-medium">
              {t('story.eyebrow', 'Brand Story')}
            </p>
            <h1 className="text-5xl md:text-7xl font-light text-[var(--sonpin-surface)] tracking-wide">
              {loading ? t('story.loading', '品牌故事') : (page?.title || t('story.title', '品牌故事'))}
            </h1>
          </div>
        </section>

        {intro && (
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--sonpin-primary)]" />
            <div className="relative container mx-auto px-6 py-20 max-w-3xl text-center">
              {translating && (
                <div className="mb-4 inline-flex items-center rounded-full border border-[var(--sonpin-primary-border)]/60 bg-[var(--sonpin-surface)]/15 px-3 py-1 text-[11px] tracking-[0.18em] text-[var(--sonpin-surface)]">
                  {t('common.translating', '翻譯中...')}
                </div>
              )}
              <div className="w-16 h-px bg-[var(--sonpin-primary-border)] mx-auto mb-8" />
              <h2 className="text-2xl md:text-3xl font-light text-[var(--sonpin-surface)] leading-relaxed mb-6">
                {intro.title}
              </h2>
              <p className="text-[var(--sonpin-surface)] font-light leading-relaxed text-base whitespace-pre-line">
                {intro.content}
              </p>
              <div className="w-16 h-px bg-[var(--sonpin-primary-border)] mx-auto mt-8" />
            </div>
          </section>
        )}

        <section className="container mx-auto px-6 py-24 max-w-4xl">
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-[var(--sonpin-background)] transform md:-translate-x-1/2" />

            {storyChapters.map((section, index) => (
              <div
                key={index}
                className={`relative flex flex-col md:flex-row gap-8 mb-20 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                  <div className="pl-12 md:pl-0">
                    <div className="inline-block text-xs tracking-[0.3em] uppercase text-[var(--sonpin-primary)] font-medium mb-3 bg-[var(--sonpin-background)] px-3 py-1 rounded-full">
                      {t('story.chapter', `第 ${index + 1} 章`)}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-light text-[var(--sonpin-ink)] mb-5 leading-snug">
                      {section.title}
                    </h2>
                    <p className="text-[var(--sonpin-primary-soft)] font-light leading-relaxed whitespace-pre-line">
                      {formatContent(section.content)}
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex md:w-0 items-start justify-center relative">
                  <div className="absolute left-1/2 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-[var(--sonpin-primary-warm)] border-4 border-[var(--sonpin-surface)] shadow-md" />
                </div>

                <div className="absolute left-0 top-2 md:hidden">
                  <div className="w-4 h-4 rounded-full bg-[var(--sonpin-primary-warm)] border-4 border-[var(--sonpin-surface)] shadow-md ml-2" />
                </div>

                <div className="md:w-1/2" />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[var(--sonpin-background)] border-t border-[var(--sonpin-primary-border)]">
          <div className="container mx-auto px-6 py-20 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="group">
                <div className="text-5xl font-light text-[var(--sonpin-primary)] mb-2 group-hover:scale-110 transition-transform duration-300">2018</div>
                <div className="text-sm text-[var(--sonpin-primary-muted)] font-light">{t('story.stats.started', '創立')}</div>
              </div>
              <div className="group">
                <div className="text-5xl font-light text-[var(--sonpin-primary)] mb-2 group-hover:scale-110 transition-transform duration-300">8+</div>
                <div className="text-sm text-[var(--sonpin-primary-muted)] font-light">{t('story.stats.partners', '合作夥伴')}</div>
              </div>
              <div className="group">
                <div className="text-5xl font-light text-[var(--sonpin-primary)] mb-2 group-hover:scale-110 transition-transform duration-300">100K+</div>
                <div className="text-sm text-[var(--sonpin-primary-muted)] font-light">{t('story.stats.customers', '顧客')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-[var(--sonpin-background)]">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <h2 className="text-3xl font-light text-[var(--sonpin-ink)] mb-6">
              {t('story.cta.title', '一起了解淞品土雞')}
            </h2>
            <p className="text-[var(--sonpin-primary-muted)] font-light mb-10 leading-relaxed">
              {t('story.cta.description', '從產地、養殖到餐桌，我們把每一個細節做好，讓您安心選擇。')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--sonpin-ink)] text-[var(--sonpin-surface)] rounded-full hover:bg-[var(--sonpin-primary)] transition-colors text-sm font-medium"
              >
                {t('story.cta.shop', '前往購物')}
                <ChevronRight size={16} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[var(--sonpin-primary-border)] text-[var(--sonpin-primary-soft)] rounded-full hover:border-[var(--sonpin-primary-warm)] transition-colors text-sm font-light"
              >
                {t('story.cta.about', '認識我們')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
