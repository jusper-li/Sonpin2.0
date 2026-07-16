import { isSupabaseContentEnabled, supabase } from './supabase';

export interface StaticPageNavItem {
  slug: string;
  label: string;
  href: string;
}

const DEFAULT_STATIC_PAGE_LABELS: Record<string, string> = {
  about: '關於淞品',
  story: '品牌故事',
  contact: '客服中心',
  privacy: '隱私權政策',
  terms: '服務條款',
  shipping: '購物須知',
  returns: '退換貨政策',
};

export const DEFAULT_STATIC_PAGE_NAV_ITEMS: StaticPageNavItem[] = Object.entries(DEFAULT_STATIC_PAGE_LABELS).map(([slug, label]) => ({
  slug,
  label,
  href: `/${slug}`,
}));

const hasRenderableName = (value?: string | null) => {
  const trimmed = value?.trim() || '';
  if (!trimmed) return false;
  return /[\p{Letter}\p{Number}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(trimmed);
};

type StaticPageRow = {
  slug?: string | null;
  title?: string | null;
  is_published?: boolean | null;
};

export const buildStaticPageNavItems = (pages: StaticPageRow[] = []): StaticPageNavItem[] => {
  const items = pages
    .filter((page) => page.slug?.trim())
    .filter((page) => page.is_published !== false)
    .map((page) => {
      const slug = page.slug!.trim().replace(/^\/+/, '').replace(/\/+$/, '');
      const fallbackLabel = DEFAULT_STATIC_PAGE_LABELS[slug] || slug;
      const title = page.title?.trim() || '';
      const label = hasRenderableName(title) ? title : fallbackLabel;
      return {
        slug,
        label,
        href: `/${slug}`,
      };
    });

  const merged = new Map<string, StaticPageNavItem>();
  DEFAULT_STATIC_PAGE_NAV_ITEMS.forEach((item) => merged.set(item.slug, item));
  items.forEach((item) => merged.set(item.slug, item));

  return Array.from(merged.values());
};

export const loadStaticPageNavItems = async (): Promise<StaticPageNavItem[]> => {
  if (!isSupabaseContentEnabled) {
    return DEFAULT_STATIC_PAGE_NAV_ITEMS;
  }

  try {
    const { data, error } = await supabase
      .from('static_pages')
      .select('slug, title, is_published')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return buildStaticPageNavItems((data || []) as StaticPageRow[]);
  } catch {
    return DEFAULT_STATIC_PAGE_NAV_ITEMS;
  }
};

