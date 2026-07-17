import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { isMissingSupabaseTableError, isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import { localBusinessSchema, organizationSchema, websiteSchema } from '../utils/schemaMarkup';
import { getOptimizedProductImage } from '../utils/optimizedImages';
import {
  HomepageSection,
  HomepageSectionContent,
  HomepageSubmenuItem,
} from '../data/homepageContent';
import {
  HOMEPAGE_HERO_BLOCKS_SETTING_KEY,
  HomepageHeroBlock,
  HomepageHeroProduct,
  mergeHomepageHeroProducts,
  normalizeHomepageHeroBlocks,
  ResolvedHomepageHeroBlock,
  resolveHomepageHeroBlock,
} from '../data/homepageHeroBlocks';

interface HomepageSectionRow {
  section_type: string;
  title: string;
  content?: HomepageSectionContent;
}

interface HomepageProductRow {
  id: string;
  name: string;
  slug: string;
  summary?: string;
  images?: string[];
  is_active?: boolean;
}

interface SectionVisual {
  media: string;
  objectPosition: string;
  accent: string;
}

interface ProductStagePalette {
  background: string;
  panel: string;
  accent: string;
  stripe: string;
  ink: string;
}

const PRODUCT_STAGE_PALETTES: ProductStagePalette[] = [
  {
    background: 'var(--sonpin-background)',
    panel: 'color-mix(in srgb, var(--sonpin-primary) 12%, var(--sonpin-surface))',
    accent: 'color-mix(in srgb, var(--sonpin-primary) 6%, var(--sonpin-surface))',
    stripe: 'var(--sonpin-primary)',
    ink: 'var(--sonpin-ink)',
  },
  {
    background: 'var(--sonpin-background)',
    panel: 'color-mix(in srgb, var(--sonpin-primary) 16%, var(--sonpin-surface))',
    accent: 'color-mix(in srgb, var(--sonpin-primary) 8%, var(--sonpin-surface))',
    stripe: 'var(--sonpin-primary-warm)',
    ink: 'var(--sonpin-ink)',
  },
  {
    background: 'var(--sonpin-surface)',
    panel: 'var(--sonpin-primary-warm)',
    accent: 'color-mix(in srgb, var(--sonpin-primary) 8%, var(--sonpin-surface))',
    stripe: 'var(--sonpin-primary)',
    ink: 'var(--sonpin-ink)',
  },
  {
    background: 'color-mix(in srgb, var(--sonpin-background) 90%, var(--sonpin-surface))',
    panel: 'color-mix(in srgb, var(--sonpin-primary) 20%, var(--sonpin-surface))',
    accent: 'color-mix(in srgb, var(--sonpin-primary) 10%, var(--sonpin-surface))',
    stripe: 'var(--sonpin-primary)',
    ink: 'var(--sonpin-ink)',
  },
  {
    background: 'color-mix(in srgb, var(--sonpin-background) 84%, var(--sonpin-surface))',
    panel: 'color-mix(in srgb, var(--sonpin-primary) 18%, var(--sonpin-surface))',
    accent: 'color-mix(in srgb, var(--sonpin-primary) 8%, var(--sonpin-surface))',
    stripe: 'var(--sonpin-primary)',
    ink: 'var(--sonpin-ink)',
  },
];

const FALLBACK_VISUALS: Record<string, SectionVisual> = {
  hero: {
    media: '/sonpin-images/175135830617.jpg',
    objectPosition: 'center center',
    accent: 'var(--sonpin-primary)',
  },
  shop: {
    media: '/sonpin-images/163081696885.jpg',
    objectPosition: 'center center',
    accent: 'var(--sonpin-primary-warm)',
  },
  story: {
    media: '/sonpin-images/20240618103536.jpg',
    objectPosition: 'center center',
    accent: 'var(--sonpin-primary-border)',
  },
  video: {
    media: '/sonpin-images/20250701175515.jpg',
    objectPosition: 'center center',
    accent: 'var(--sonpin-primary-warm)',
  },
  contact: {
    media: '/sonpin-images/153285217452.jpg',
    objectPosition: 'center center',
    accent: 'var(--sonpin-primary-muted)',
  },
  default: {
    media: '/sonpin-images/154399503735.jpg',
    objectPosition: 'center center',
    accent: 'var(--sonpin-primary-warm)',
  },
};

function StageImage({
  alt,
  eager = false,
  objectPosition,
  src,
}: {
  alt: string;
  eager?: boolean;
  objectPosition: string;
  src: string;
}) {
  const optimized = getOptimizedProductImage(src);
  const imagePriority = { fetchpriority: eager ? 'high' : 'low' } as {
    fetchpriority: 'high' | 'low';
  };

  return (
    <img
      {...imagePriority}
      src={optimized?.src || src}
      srcSet={optimized?.srcSet}
      sizes="100vw"
      alt={alt}
      className="h-full w-full max-w-none object-cover"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{ objectPosition, minHeight: '100%', minWidth: '100%' }}
    />
  );
}

const getStagePalette = (index: number) =>
  PRODUCT_STAGE_PALETTES[index % PRODUCT_STAGE_PALETTES.length];

const withRequestTimeout = <T,>(request: PromiseLike<T>, ms = 2600) =>
  Promise.race([
    request,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('Homepage request timed out')), ms);
    }),
  ]);

const isHomepageTimeoutError = (error: unknown) =>
  error instanceof Error && error.message === 'Homepage request timed out';

const getSectionTitle = (section?: HomepageSection) =>
  section?.content?.title || section?.title || '';

const getSectionSubmenu = (section?: HomepageSection): HomepageSubmenuItem[] =>
  section?.content?.submenu?.length ? section.content.submenu : section?.submenu || [];

const getSectionHref = (section?: HomepageSection) =>
  section?.content?.href || section?.content?.link || getSectionSubmenu(section)[0]?.href || '';

const getYouTubeEmbedUrl = (url?: string) => {
  const value = url?.trim();
  if (!value) return '';
  if (/youtube\.com\/embed\//i.test(value)) return value;

  const watchMatch = value.match(/[?&]v=([^&]+)/i);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0`;
  }

  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/i);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0`;
  }

  const embedMatch = value.match(/youtube\.com\/(?:v|embed)\/([^?&/]+)/i);
  if (embedMatch?.[1]) {
    return `https://www.youtube.com/embed/${embedMatch[1]}?rel=0`;
  }

  return value;
};

const getSectionVisual = (section?: HomepageSection, index = 0): SectionVisual => {
  const fallback = FALLBACK_VISUALS[section?.section_type || ''] || FALLBACK_VISUALS.default;

  return {
    ...fallback,
    media: section?.background_image || section?.content?.background_image || section?.content?.image || fallback.media,
    objectPosition: index % 2 === 0 ? fallback.objectPosition : 'center center',
  };
};

export default function Homepage() {
  const { currentLanguage, t } = useLanguage();
  const [activeSection, setActiveSection] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]));
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [heroBlocks, setHeroBlocks] = useState<HomepageHeroBlock[]>([]);
  const [heroProducts, setHeroProducts] = useState<HomepageHeroProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const sectionsRef = useRef<(HTMLElement | HTMLDivElement | null)[]>([]);
  const snapLockRef = useRef(false);
  const heroButtonLabels = {
    'zh-TW': '查看商品',
    en: 'View products',
    ja: '商品を見る',
    ko: '상품 보기',
  } as const;

  useSEO({
    title: '淞品土雞專賣店',
    description: '淞品土雞專賣店，提供安心、美味且適合送禮與自用的雞品與熟食。',
    keywords: '淞品土雞,土雞專賣店,雞品,熟食,送禮,自用',
    noSuffix: true,
    schema: [organizationSchema(), localBusinessSchema(), websiteSchema()],
  });

  useSEO({
    title: t('homepage.seo.title', '淞品土雞專賣店'),
    description: t(
      'homepage.seo.description',
      '淞品土雞專賣店，提供安心、美味且適合送禮與自用的雞品與熟食。',
    ),
    keywords: t('homepage.seo.keywords', '淞品土雞,土雞專賣店,雞品,熟食,送禮,自用'),
    noSuffix: true,
  });

  useEffect(() => {
    let cancelled = false;
    loadHomepageData(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.add('homepage-snap-enabled');
    body.classList.add('homepage-snap-enabled');
    return () => {
      root.classList.remove('homepage-snap-enabled');
      body.classList.remove('homepage-snap-enabled');
    };
  }, []);




  const loadHomepageData = async (isCancelled: () => boolean) => {
    if (!isSupabaseContentEnabled || isCancelled()) {
      setSections([]);
      setHeroBlocks([]);
      setHeroProducts([]);
      setLoading(false);
      return;
    }

    await Promise.allSettled([
      loadSections(isCancelled),
      loadHeroBlocks(isCancelled),
      loadHeroProducts(isCancelled),
    ]);
  };

  const loadSections = async (isCancelled: () => boolean) => {
    try {
      const { data, error } = await withRequestTimeout(
        supabase
          .from('homepage_sections')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      );

      if (error) throw error;
      if (isCancelled()) return;

      const transformedSections = ((data || []) as HomepageSectionRow[]).map((section) => ({
        id: section.section_type,
        label: section.content?.label || section.title,
        subtitle: section.content?.subtitle || '',
        title: section.content?.title || section.title,
        number: section.content?.number || '',
        submenu: section.content?.submenu || [],
        section_type: section.section_type,
        content: section.content || {},
        background_image: section.content?.background_image || section.content?.image || '',
        description: section.content?.description || '',
      }));

      setSections(transformedSections);
    } catch (error) {
      if (!isMissingSupabaseTableError(error) && !isHomepageTimeoutError(error)) {
        console.warn('Using fallback homepage sections:', error);
      }
      setSections([]);
    }
  };

  const loadHeroBlocks = async (isCancelled: () => boolean) => {
    try {
      const { data, error } = await withRequestTimeout(
        supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', HOMEPAGE_HERO_BLOCKS_SETTING_KEY)
          .maybeSingle()
      );

      if (error) throw error;
      if (isCancelled()) return;
      const nextBlocks = normalizeHomepageHeroBlocks(data?.setting_value);
      setHeroBlocks(nextBlocks);
    } catch (error) {
      if (!isMissingSupabaseTableError(error) && !isHomepageTimeoutError(error)) {
        console.warn('Using fallback homepage hero blocks:', error);
      }
      setHeroBlocks([]);
    }
  };

  const loadHeroProducts = async (isCancelled: () => boolean) => {
    try {
      const { data, error } = await withRequestTimeout(
        supabase
          .from('products')
          .select('id,name,slug,summary,images,is_active')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      );

      if (error) throw error;
      if (isCancelled()) return;
      const nextProducts = mergeHomepageHeroProducts((data || []) as HomepageProductRow[]);
      setHeroProducts(nextProducts);
    } catch (error) {
      if (!isMissingSupabaseTableError(error) && !isHomepageTimeoutError(error)) {
        console.warn('Using fallback homepage hero products:', error);
      }
      setHeroProducts([]);
    }
  };

  const stageSections = useMemo(() => {
    const products = heroProducts;
    const configuredBlocks = heroBlocks;
    const resolvedBlocks = configuredBlocks
      .filter((block) => block.is_active !== false)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((block) => resolveHomepageHeroBlock(block, products))
      .filter((block): block is ResolvedHomepageHeroBlock => Boolean(block));

    const displaySections = sections;
    const heroSection = displaySections.find((section) => section.section_type === 'hero') || null;
    const chapterSections = displaySections.filter((section) => section !== heroSection);

    if (resolvedBlocks.length > 0) {
      const heroProductSections = resolvedBlocks.map((block, index): HomepageSection => ({
        id: block.id,
        label: block.subtitle,
        subtitle: block.subtitle,
        title: block.title,
        number: String(index + 1).padStart(2, '0'),
        section_type: 'hero_product',
          content: {
            label: block.subtitle,
            subtitle: block.subtitle,
            title: block.title,
            number: String(index + 1).padStart(2, '0'),
            description: block.description,
            background_image: block.image,
            image: block.image,
            href: block.href,
            cta_label: '查看商品',
            submenu: [{ label: '查看商品', title: '查看商品', href: block.href }],
          },
          background_image: block.image,
          description: block.description,
        }));
      return heroSection ? [...heroProductSections, ...chapterSections] : [...heroProductSections, ...displaySections];
    }

    return heroSection ? [heroSection, ...chapterSections] : displaySections;
  }, [heroBlocks, heroProducts, sections]);

  const localizedStageSections = useMemo(
    () =>
      stageSections.map((section, index) => {
        const keyPrefix = `homepage.section.${section.section_type}.${section.id || index}`;
        const sourceSubmenu = section.content?.submenu?.length ? section.content.submenu : section.submenu || [];
        const localizedSubmenu = sourceSubmenu.map((item, itemIndex) => ({
          ...item,
          label: item.label ? t(`${keyPrefix}.submenu.${itemIndex}.label`, item.label) : item.label,
          title: item.title ? t(`${keyPrefix}.submenu.${itemIndex}.title`, item.title) : item.title,
        }));

        const translatedLabel = section.label ? t(`${keyPrefix}.label`, section.label) : section.label;
        const translatedSubtitle = section.subtitle ? t(`${keyPrefix}.subtitle`, section.subtitle) : section.subtitle;
        const translatedTitle = section.title ? t(`${keyPrefix}.title`, section.title) : section.title;
        const translatedDescription = section.description
          ? t(`${keyPrefix}.description`, section.description)
          : section.description;
        const translatedContentTitle = section.content?.title
          ? t(`${keyPrefix}.content.title`, section.content.title)
          : section.content?.title;
        const translatedContentLabel = section.content?.label
          ? t(`${keyPrefix}.content.label`, section.content.label)
          : section.content?.label;
        const translatedContentSubtitle = section.content?.subtitle
          ? t(`${keyPrefix}.content.subtitle`, section.content.subtitle)
          : section.content?.subtitle;
        const translatedContentDescription = section.content?.description
          ? t(`${keyPrefix}.content.description`, section.content.description)
          : section.content?.description;
        const translatedCtaLabel = t(
          `${keyPrefix}.content.cta_label`,
          section.content?.cta_label ||
            (section.section_type === 'hero_product'
              ? '查看商品'
              : section.section_type === 'video'
                ? '觀看影片'
                : '了解更多'),
        );

        return {
          ...section,
          label: translatedLabel || section.label,
          subtitle: translatedSubtitle || section.subtitle,
          title: translatedTitle || section.title,
          description: translatedDescription || section.description,
          submenu: localizedSubmenu,
          content: {
            ...section.content,
            label: translatedContentLabel || section.content?.label,
            subtitle: translatedContentSubtitle || section.content?.subtitle,
            title: translatedContentTitle || section.content?.title,
            description: translatedContentDescription || section.content?.description,
            cta_label: translatedCtaLabel,
            submenu: localizedSubmenu,
          },
        };
      }),
    [stageSections, t],
  );

  useEffect(() => {
    setActiveSection(0);
    setVisibleSections(new Set([0]));
    sectionsRef.current = [];
  }, [stageSections.length]);
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = sectionsRef.current.findIndex((ref) => ref === entry.target);
          if (entry.isIntersecting && index !== -1) {
            setActiveSection(index);
            setVisibleSections((prev) => new Set(prev).add(index));
          }
        });
      },
      { threshold: 0.38 }
    );

    const observedSections = [...sectionsRef.current];

    observedSections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      observedSections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
      observer.disconnect();
    };
  }, [loading, stageSections.length]);

  useEffect(() => {
    if (loading) return;

    const handleWheel = (event: WheelEvent) => {
      if (!document.documentElement.classList.contains('homepage-snap-enabled')) return;
      if (snapLockRef.current) {
        event.preventDefault();
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (Math.abs(event.deltaY) < 6) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const currentIndex = Math.max(0, Math.min(activeSection, sectionsRef.current.length - 1));
      const nextIndex = Math.max(0, Math.min(currentIndex + direction, sectionsRef.current.length - 1));

      if (nextIndex === currentIndex) return;

      const nextSection = sectionsRef.current[nextIndex];
      if (!nextSection) return;

      event.preventDefault();
      snapLockRef.current = true;
      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      window.setTimeout(() => {
        snapLockRef.current = false;
      }, 900);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeSection, loading, stageSections.length]);

  if (loading) {
    return (
      <div className="ym-home-loading relative flex h-screen items-center justify-center overflow-hidden text-[var(--sonpin-ink)]">
        <style>{`
          .ym-home-loading {
            background:
              linear-gradient(135deg, color-mix(in srgb, var(--sonpin-surface) 72%, transparent) 0%, color-mix(in srgb, var(--sonpin-primary-border) 78%, transparent) 22%, color-mix(in srgb, var(--sonpin-primary) 60%, transparent) 48%, color-mix(in srgb, var(--sonpin-surface) 90%, transparent) 73%, color-mix(in srgb, var(--sonpin-primary-warm) 68%, transparent) 100%),
              linear-gradient(180deg, color-mix(in srgb, var(--sonpin-background) 92%, white) 0%, color-mix(in srgb, var(--sonpin-primary-border) 64%, var(--sonpin-background)) 58%, color-mix(in srgb, var(--sonpin-primary-warm) 72%, var(--sonpin-primary)) 100%);
          }
          .ym-home-loading::before {
            content: '';
            position: absolute;
            inset: -42%;
            background: linear-gradient(115deg, transparent 35%, color-mix(in srgb, var(--sonpin-surface) 58%, transparent) 49%, transparent 63%);
            opacity: 0.45;
            transform: translateX(-16%) rotate(8deg);
            animation: ymLoadingSheen 4.6s ease-in-out infinite;
          }
          .ym-home-loading::after {
            content: '';
            position: absolute;
            inset: 0;
            background:
              repeating-linear-gradient(90deg, color-mix(in srgb, var(--sonpin-surface) 7%, transparent) 0 1px, transparent 1px 8px),
              linear-gradient(180deg, color-mix(in srgb, var(--sonpin-surface) 34%, transparent), color-mix(in srgb, var(--sonpin-primary) 12%, transparent));
            mix-blend-mode: soft-light;
            pointer-events: none;
          }
          .ym-home-loading-panel {
            position: relative;
            z-index: 1;
          }
          .ym-home-loading p {
            color: color-mix(in srgb, var(--sonpin-ink) 86%, transparent);
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.18em;
          }
          .ym-loading-ring {
            width: 34px;
            height: 34px;
            border-radius: 9999px;
            border: 1px solid color-mix(in srgb, var(--sonpin-primary) 16%, transparent);
            border-top-color: color-mix(in srgb, var(--sonpin-primary) 80%, transparent);
            border-right-color: color-mix(in srgb, var(--sonpin-surface) 76%, transparent);
            box-shadow:
              0 0 0 1px color-mix(in srgb, var(--sonpin-surface) 22%, transparent) inset,
              0 12px 34px color-mix(in srgb, var(--sonpin-primary) 18%, transparent);
            animation: ymLoadingSpin 1.05s linear infinite;
          }
          @keyframes ymLoadingSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes ymLoadingSheen {
            0% { transform: translateX(-24%) rotate(8deg); opacity: 0.18; }
            45% { opacity: 0.5; }
            100% { transform: translateX(24%) rotate(8deg); opacity: 0.18; }
          }
          @media (prefers-reduced-motion: reduce) {
            .ym-home-loading::before,
            .ym-loading-ring {
              animation: none;
            }
          }
        `}</style>
        <div className="ym-home-loading-panel text-center">
          <div className="ym-loading-ring mx-auto mb-4" />
          <p className="text-sm">{t('homepage.loading', 'Homepage content loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ym-homepage overflow-x-hidden bg-[var(--sonpin-surface)] text-[var(--sonpin-ink)]">
      <style>{`
        .ym-homepage header {
          background: transparent !important;
          border-bottom-color: transparent !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        .ym-homepage header img {
          filter: none !important;
        }
        .ym-homepage header nav a,
        .ym-homepage header nav button {
          color: var(--sonpin-surface) !important;
          filter: drop-shadow(0 1px 8px rgba(0, 0, 0, 0.32));
        }
        .homepage-page {
          min-height: 100vh;
          min-height: 100svh;
          min-height: 100dvh;
          background: var(--sonpin-background);
        }
        html.homepage-snap-enabled,
        body.homepage-snap-enabled {
          scroll-snap-type: y mandatory;
          scroll-padding-top: 0;
        }
        .homepage-page section,
        .homepage-page > div {
          scroll-margin-top: 0;
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }
        .ym-stage {
          background: var(--ym-bg);
          color: var(--ym-ink);
          contain: layout paint style;
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }
        .ym-stage::before,
        .ym-stage::after {
          display: none;
        }
        .ym-stage-media {
          inset: 0;
          height: 100vh;
          height: 100svh;
          height: 100dvh;
          box-shadow: none;
        }
        .ym-stage-media::after {
          content: '';
          pointer-events: none;
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(49, 38, 31, 0.2) 0%, rgba(251, 246, 238, 0.04) 30%, color-mix(in srgb, var(--ym-panel) 18%, transparent) 58%, rgba(46, 34, 27, 0.5) 100%),
            radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--ym-accent) 20%, transparent), transparent 34%),
            radial-gradient(circle at 82% 72%, color-mix(in srgb, var(--ym-stripe) 16%, transparent), transparent 38%);
        }
        .ym-stage-media img {
          transform: none;
          transition: transform 1.35s cubic-bezier(0.16, 1, 0.3, 1), filter 1.35s cubic-bezier(0.16, 1, 0.3, 1);
          filter: saturate(0.96) contrast(1.02) sepia(0.06);
          backface-visibility: hidden;
          will-change: transform;
        }
        .ym-stage.is-active .ym-stage-media img {
          transform: scale(1);
          filter: saturate(0.98) contrast(1.03) sepia(0.05);
        }
        .ym-stage-panel {
          inset: 0;
          min-height: 100vh;
          min-height: 100svh;
          min-height: 100dvh;
          align-items: flex-end;
          background: transparent;
          box-shadow: none;
          pointer-events: none;
        }
        .ym-stage-copy {
          width: min(92vw, 760px);
          min-height: 30vh;
          justify-content: flex-end;
          padding-bottom: calc(4.8rem + env(safe-area-inset-bottom));
          color: var(--sonpin-surface);
          text-shadow: 0 2px 18px rgba(36, 27, 21, 0.48);
        }
        .ym-stage-title {
          color: var(--sonpin-surface) !important;
          font-family: "Noto Serif TC", "Songti TC", "Noto Serif CJK TC", Georgia, serif;
          font-size: clamp(1.08rem, 2.1vw, 2rem) !important;
          font-weight: 540 !important;
          line-height: 1.58 !important;
          letter-spacing: 0.08em;
          text-align: center;
          text-wrap: balance;
          word-break: break-word;
        }
        .ym-stage-title-link {
          pointer-events: auto;
          max-width: min(82vw, 720px) !important;
          will-change: opacity, transform, filter, letter-spacing;
        }
        .ym-stage-actions {
          margin-top: 20px !important;
          display: grid;
          width: min(78vw, 560px);
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: end;
          gap: 16px;
        }
        .ym-stage-cta,
        .ym-stage-side-label {
          will-change: opacity, transform, filter, letter-spacing;
        }
        .ym-stage-cta {
          pointer-events: auto;
          height: 34px !important;
          min-width: 108px !important;
          border-color: color-mix(in srgb, var(--ym-stripe) 82%, var(--sonpin-surface)) !important;
          color: var(--sonpin-surface) !important;
          background: color-mix(in srgb, var(--ym-panel) 26%, transparent) !important;
          padding-inline: 16px !important;
          font-size: 11px !important;
          letter-spacing: 0.08em;
          text-shadow: 0 2px 14px rgba(36, 27, 21, 0.42);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--ym-accent) 18%, transparent) inset;
        }
        .ym-stage-cta:hover {
          background: color-mix(in srgb, var(--ym-stripe) 36%, rgba(255, 250, 242, 0.14)) !important;
          color: var(--sonpin-surface) !important;
        }
        .ym-stage-side-label {
          display: block;
          border-bottom: 1px solid color-mix(in srgb, var(--ym-stripe) 78%, var(--sonpin-surface));
          padding-bottom: 5px;
          color: var(--sonpin-surface);
          font-size: 9px;
          font-weight: 560;
          letter-spacing: 0.055em;
          line-height: 1;
          text-align: center;
          text-transform: lowercase;
          text-shadow: 0 2px 14px rgba(36, 27, 21, 0.46);
          white-space: nowrap;
        }
        .ym-stage.is-active .ym-stage-title-link {
          animation: ymBrandTitleIn 920ms cubic-bezier(0.18, 1, 0.22, 1) both;
        }
        .ym-stage.is-active .ym-stage-cta {
          animation: ymBrandButtonIn 760ms cubic-bezier(0.2, 1, 0.22, 1) 150ms both;
        }
        .ym-stage.is-active .ym-stage-side-label:first-child {
          animation: ymBrandLineLeftIn 780ms cubic-bezier(0.18, 1, 0.22, 1) 220ms both;
        }
        .ym-stage.is-active .ym-stage-side-label:last-child {
          animation: ymBrandLineRightIn 780ms cubic-bezier(0.18, 1, 0.22, 1) 220ms both;
        }
        @keyframes ymBrandTitleIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 18px, 0);
            filter: blur(5px);
            letter-spacing: 0.16em;
          }
          58% {
            opacity: 1;
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            filter: blur(0);
            letter-spacing: 0.08em;
          }
        }
        @keyframes ymBrandButtonIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 12px, 0) scale(0.96);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }
        @keyframes ymBrandLineLeftIn {
          0% {
            opacity: 0;
            transform: translate3d(-18px, 0, 0);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            filter: blur(0);
          }
        }
        @keyframes ymBrandLineRightIn {
          0% {
            opacity: 0;
            transform: translate3d(18px, 0, 0);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            filter: blur(0);
          }
        }
        .ym-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ym-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .ym-stage-side-label {
          display: block;
        }
        @media (min-width: 768px) {
          .ym-homepage header nav {
            padding-top: 20px !important;
          }
          .ym-stage-copy {
            padding-bottom: clamp(3rem, 7vh, 5.8rem);
          }
        }
        @media (max-width: 767px) {
          .ym-homepage header {
            height: 132px;
            pointer-events: none;
          }
          .ym-homepage header nav {
            padding: 18px 20px 0 !important;
          }
          .ym-homepage header nav > div {
            align-items: flex-start !important;
          }
          .ym-homepage header nav > div > a:first-child {
            pointer-events: auto;
            position: fixed;
            left: 21px;
            top: 21px;
          }
          .ym-homepage header nav > div > a:first-child img {
            height: 48px !important;
            filter: none !important;
          }
          .ym-homepage header nav > div > div:last-child {
            pointer-events: none;
            position: fixed;
            right: 16px;
            top: 18px;
            gap: 10px;
          }
          .ym-homepage header nav > div > div:last-child > a:first-child {
            display: none !important;
          }
        .ym-homepage header nav > div > div:last-child > a,
        .ym-homepage header nav > div > div:last-child > button {
          pointer-events: auto;
          color: var(--sonpin-surface) !important;
          filter: drop-shadow(0 1px 8px rgba(0, 0, 0, 0.32));
        }
        .ym-homepage header nav > div > div:last-child > div {
          pointer-events: auto;
        }
        .ym-homepage header nav > div > div:last-child > div > button {
          pointer-events: auto;
        }
        .ym-homepage header nav .ym-language-menu,
        .ym-homepage header nav .ym-language-menu button {
          color: var(--sonpin-ink) !important;
          filter: none !important;
          text-shadow: none !important;
        }
        .ym-homepage header nav .ym-language-menu button:hover {
          color: var(--sonpin-ink) !important;
        }
        .ym-homepage header nav > div > div:last-child > button:last-child {
          position: fixed;
          left: 14px;
          top: 92px;
        }
          .ym-stage-panel {
            padding: 0 24px calc(1.5rem + env(safe-area-inset-bottom));
          }
          .ym-stage-copy {
            width: 100%;
            max-width: 100%;
            min-height: 32vh;
            justify-content: flex-end;
            padding-bottom: calc(116px + env(safe-area-inset-bottom));
            color: var(--sonpin-surface);
            text-shadow: 0 2px 16px rgba(36, 27, 21, 0.48);
          }
          .ym-stage {
            height: 100vh !important;
            height: 100svh !important;
            height: 100dvh !important;
            min-height: 100svh;
          }
          .floating-ai-chat-button.floating-ai-chat-home {
            right: 18px;
            bottom: calc(1.15rem + env(safe-area-inset-bottom));
          }
          .floating-ai-chat-minimized.floating-ai-chat-home,
          .floating-ai-chat-window.floating-ai-chat-home {
            right: 12px;
            bottom: calc(1rem + env(safe-area-inset-bottom));
          }
          .floating-ai-chat-window.floating-ai-chat-home {
            max-height: min(76dvh, 520px);
          }
          .ym-stage .ym-reveal {
            opacity: 1;
            transform: none;
          }
          .ym-stage-copy a {
            pointer-events: auto;
          }
          .ym-stage-title-link {
            max-width: min(76vw, 328px) !important;
          }
          .ym-stage-title {
            color: var(--sonpin-surface) !important;
            font-family: "Noto Serif TC", "Songti TC", "Noto Serif CJK TC", Georgia, serif;
            font-size: clamp(0.88rem, 3.65vw, 1.14rem) !important;
            font-weight: 520 !important;
            line-height: 1.58 !important;
            letter-spacing: 0.075em;
            text-align: center;
          }
          .ym-stage-actions {
            margin-top: 16px !important;
            width: 100%;
            grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
            gap: 12px;
          }
          .ym-stage-cta {
            height: 33px !important;
            min-width: 96px !important;
            padding-inline: 15px !important;
            font-size: 11px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .homepage-page {
            scroll-behavior: auto;
          }
          .ym-stage-media img,
          .ym-reveal,
          .ym-stage-title-link,
          .ym-stage-cta,
          .ym-stage-side-label {
            transition: none;
            animation: none !important;
            transform: none;
            filter: none;
          }
        }
      `}</style>

      <SiteHeader />

      <main className="homepage-page">
        {localizedStageSections.map((section, index) => {
          const visual = getSectionVisual(section, index);
          const palette = getStagePalette(index);
          const title = getSectionTitle(section) || 'Sonpin';
          const href = getSectionHref(section) || '/shop';
          const youtubeEmbedUrl = getYouTubeEmbedUrl(section.content?.youtube || section.content?.video_url);
          const isVideoSection = section.section_type === 'video' && Boolean(youtubeEmbedUrl);
          const localizedTitle = title;
          const localizedSubtitle = section.subtitle || section.content?.subtitle || '';
          const localizedLabel = section.label || section.content?.label || '';
          const ctaLabel = section.content?.cta_label || (section.section_type === 'hero_product' ? '查看商品' : '了解更多');
          const localizedCtaLabel =
            section.section_type === 'hero_product'
              ? section.content?.cta_label || heroButtonLabels[currentLanguage as keyof typeof heroButtonLabels] || '查看商品'
              : section.section_type === 'video'
                ? section.content?.cta_label || '觀看影片'
              : ctaLabel;
          const isVisible = visibleSections.has(index) || index === 0;
          const shouldLoadImage = true;
          const sectionStyle = {
            '--ym-bg': palette.background,
            '--ym-panel': palette.panel,
            '--ym-accent': palette.accent,
            '--ym-stripe': palette.stripe,
            '--ym-ink': palette.ink,
          } as CSSProperties;

          return (
            <section
              key={`${section.id}-${index}-${visual.media}`}
              ref={(el) => (sectionsRef.current[index] = el)}
              id={section.id}
              className={`ym-stage relative h-screen w-full overflow-hidden ${activeSection === index ? 'is-active' : ''}`}
              style={sectionStyle}
            >
              {isVideoSection ? (
                <div className="ym-stage-media absolute inset-x-0 top-0 z-10 block overflow-hidden">
                  {shouldLoadImage ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 px-4">
                      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl">
                        <div className="aspect-video w-full">
                          <iframe
                            src={youtubeEmbedUrl}
                            title={section.content?.video_title || localizedTitle}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading={index === 0 ? 'eager' : 'lazy'}
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  to={href}
                  className="ym-stage-media absolute inset-x-0 top-0 z-10 block overflow-hidden"
                  aria-label={t('homepage.hero.aria', `Go to ${localizedTitle}`)}
                >
                  {shouldLoadImage ? (
                    <StageImage
                      key={visual.media}
                      src={visual.media}
                      alt={title}
                      objectPosition={visual.objectPosition}
                      eager
                    />
                  ) : null}
                </Link>
              )}
              <div className="ym-stage-panel absolute inset-x-0 bottom-0 z-20 flex items-center justify-center px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-10 text-center sm:px-8 md:pb-12 md:pt-12">
                <div className={`ym-stage-copy ym-reveal is-visible mx-auto flex max-w-4xl flex-col items-center ${isVisible ? 'is-active-copy' : ''}`}>
                  <Link to={href} className="ym-stage-title-link group block max-w-[22rem] sm:max-w-2xl md:max-w-4xl">
                    <h1
                      className={`ym-stage-title font-serif text-xl font-semibold leading-relaxed text-[var(--sonpin-ink)] transition-transform duration-300 group-hover:-translate-y-0.5 sm:text-2xl md:text-4xl ${
                        index === 0 ? '' : 'md:text-3xl'
                      }`}
                    >
                      {localizedTitle}
                    </h1>
                  </Link>

                  <div className="ym-stage-actions mt-4 flex w-full items-center justify-center md:mt-5">
                    <span className="ym-stage-side-label" aria-hidden="true">{localizedLabel || 'Songpin'}</span>
                    <Link
                      to={href}
                      className="ym-stage-cta inline-flex h-8 min-w-[104px] items-center justify-center border border-[var(--sonpin-ink)] bg-transparent px-5 text-sm font-medium text-[var(--sonpin-ink)] transition-colors duration-300 hover:bg-[var(--sonpin-ink)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--sonpin-ink)]/30"
                    >
                      {localizedCtaLabel}
                    </Link>
                    <span className="ym-stage-side-label" aria-hidden="true">{localizedSubtitle || 'Brand story'}</span>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        <div
          ref={(el) => (sectionsRef.current[stageSections.length] = el)}
          className="flex min-h-screen flex-col justify-end bg-white text-stone-900"
        >
          <DeferredSiteFooter />
        </div>
      </main>
    </div>
  );
}


