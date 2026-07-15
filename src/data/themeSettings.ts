export const THEME_COLORS_SETTING_KEY = 'theme_colors';
export const THEME_COLOR_CACHE_KEY = 'sonpin-theme-colors-cache-v1';

export type ThemePalette = {
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  primaryMuted: string;
  primaryWarm: string;
  primaryBorder: string;
  surface: string;
  background: string;
  ink: string;
  muted: string;
};

export type ThemePaletteDraft = Partial<ThemePalette>;

export type ThemePageKey = 'home' | 'shop' | 'product' | 'blog' | 'media' | 'content';

export type ThemeSettings = {
  global: ThemePalette;
  pages: Record<ThemePageKey, ThemePaletteDraft>;
};

const DEFAULT_GLOBAL_THEME: ThemePalette = {
  primary: '#351e0d',
  primaryStrong: '#211208',
  primarySoft: '#6d4f3d',
  primaryMuted: '#9f8a7b',
  primaryWarm: '#8e6448',
  primaryBorder: '#d8c8b6',
  surface: '#fffaf2',
  background: '#fbf6ee',
  ink: '#2b221d',
  muted: '#6f5b4f',
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  global: DEFAULT_GLOBAL_THEME,
  pages: {
    home: {
      primary: '#351e0d',
      primaryWarm: '#8e6448',
      surface: '#fffaf2',
      background: '#fbf6ee',
    },
    shop: {
      primary: '#351e0d',
      primaryWarm: '#8e6448',
      surface: '#fffaf2',
      background: '#fbf6ee',
    },
    product: {
      primary: '#351e0d',
      primaryWarm: '#8e6448',
      surface: '#fffaf2',
      background: '#fbf6ee',
    },
    blog: {
      primary: '#351e0d',
      primaryWarm: '#8e6448',
      surface: '#fffaf2',
      background: '#fbf6ee',
    },
    media: {
      primary: '#351e0d',
      primaryWarm: '#8e6448',
      surface: '#fffaf2',
      background: '#fbf6ee',
    },
    content: {
      primary: '#351e0d',
      primaryWarm: '#8e6448',
      surface: '#fffaf2',
      background: '#fbf6ee',
    },
  },
};

const colorKeys: (keyof ThemePalette)[] = [
  'primary',
  'primaryStrong',
  'primarySoft',
  'primaryMuted',
  'primaryWarm',
  'primaryBorder',
  'surface',
  'background',
  'ink',
  'muted',
];

const pageKeys: ThemePageKey[] = ['home', 'shop', 'product', 'blog', 'media', 'content'];

const toHex = (value: unknown, fallback: string) => {
  const text = String(value ?? '').trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text) ? text : fallback;
};

export const normalizeThemeSettings = (value: unknown): ThemeSettings => {
  const raw = (value || {}) as Partial<ThemeSettings> & { pages?: Record<string, ThemePaletteDraft> };
  const global = {
    ...DEFAULT_GLOBAL_THEME,
    ...(raw.global || {}),
  } as ThemePalette;

  const normalizedGlobal = colorKeys.reduce((acc, key) => {
    acc[key] = toHex(global[key], DEFAULT_GLOBAL_THEME[key]);
    return acc;
  }, {} as ThemePalette);

  const pages = pageKeys.reduce((acc, key) => {
    const palette = raw.pages?.[key] || {};
    acc[key] = {
      primary: toHex(palette.primary, normalizedGlobal.primary),
      primaryStrong: toHex(palette.primaryStrong, normalizedGlobal.primaryStrong),
      primarySoft: toHex(palette.primarySoft, normalizedGlobal.primarySoft),
      primaryMuted: toHex(palette.primaryMuted, normalizedGlobal.primaryMuted),
      primaryWarm: toHex(palette.primaryWarm, normalizedGlobal.primaryWarm),
      primaryBorder: toHex(palette.primaryBorder, normalizedGlobal.primaryBorder),
      surface: toHex(palette.surface, normalizedGlobal.surface),
      background: toHex(palette.background, normalizedGlobal.background),
      ink: toHex(palette.ink, normalizedGlobal.ink),
      muted: toHex(palette.muted, normalizedGlobal.muted),
    };
    return acc;
  }, {} as Record<ThemePageKey, ThemePaletteDraft>);

  return {
    global: normalizedGlobal,
    pages,
  };
};

export const getThemePageKeyForPath = (pathname: string): ThemePageKey => {
  const normalized = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  if (normalized === '/' || normalized === '/home') return 'home';
  if (normalized.startsWith('/shop') || normalized.startsWith('/products')) return 'shop';
  if (normalized.startsWith('/blog')) return 'blog';
  if (normalized.startsWith('/media')) return 'media';
  if (
    normalized.startsWith('/contact') ||
    normalized.startsWith('/store') ||
    normalized.startsWith('/service') ||
    normalized.startsWith('/about') ||
    normalized.startsWith('/story') ||
    normalized.startsWith('/process') ||
    normalized.startsWith('/faq') ||
    normalized.startsWith('/privacy') ||
    normalized.startsWith('/terms') ||
    normalized.startsWith('/shipping') ||
    normalized.startsWith('/returns') ||
    normalized.startsWith('/member') ||
    normalized.startsWith('/cart') ||
    normalized.startsWith('/checkout')
  ) {
    return 'content';
  }

  return 'content';
};

export const resolveThemePalette = (settings: ThemeSettings, pathname: string): ThemePalette => {
  const pageKey = getThemePageKeyForPath(pathname);
  const pagePalette = settings.pages[pageKey] || {};

  return {
    ...settings.global,
    ...pagePalette,
  } as ThemePalette;
};

export const applyThemePalette = (palette: ThemePalette, target: HTMLElement | CSSStyleDeclaration = document.documentElement) => {
  const style = target instanceof HTMLElement ? target.style : target;
  style.setProperty('--sonpin-primary', palette.primary);
  style.setProperty('--sonpin-primary-strong', palette.primaryStrong);
  style.setProperty('--sonpin-primary-soft', palette.primarySoft);
  style.setProperty('--sonpin-primary-muted', palette.primaryMuted);
  style.setProperty('--sonpin-primary-warm', palette.primaryWarm);
  style.setProperty('--sonpin-primary-border', palette.primaryBorder);
  style.setProperty('--sonpin-surface', palette.surface);
  style.setProperty('--sonpin-background', palette.background);
  style.setProperty('--sonpin-ink', palette.ink);
  style.setProperty('--sonpin-muted', palette.muted);
};

export const getDefaultThemePage = (pageKey: ThemePageKey): ThemePaletteDraft => DEFAULT_THEME_SETTINGS.pages[pageKey];
