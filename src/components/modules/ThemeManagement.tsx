import { useEffect, useMemo, useState } from 'react';
import { Palette, RefreshCw, Save, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  DEFAULT_THEME_SETTINGS,
  normalizeThemeSettings,
  THEME_COLORS_SETTING_KEY,
  type ThemePageKey,
  type ThemePaletteDraft,
  type ThemeSettings,
} from '../../data/themeSettings';

interface SiteSettingRow {
  id: string | number;
  setting_key: string;
  setting_value: unknown;
}

type GlobalField = keyof ThemeSettings['global'];
type PageField = 'primary' | 'primaryWarm' | 'surface' | 'background';

const globalFields: { key: GlobalField; label: string; type?: string }[] = [
  { key: 'primary', label: '主色' },
  { key: 'primaryStrong', label: '深色主題' },
  { key: 'primarySoft', label: '柔和主色' },
  { key: 'primaryMuted', label: '次要文字' },
  { key: 'primaryWarm', label: '暖色點綴' },
  { key: 'primaryBorder', label: '邊框色' },
  { key: 'surface', label: '卡片底色' },
  { key: 'background', label: '頁面底色' },
  { key: 'ink', label: '主文字' },
  { key: 'muted', label: '次文字' },
];

const pageFields: { key: PageField; label: string }[] = [
  { key: 'primary', label: '主色' },
  { key: 'primaryWarm', label: '暖色點綴' },
  { key: 'surface', label: '卡片底色' },
  { key: 'background', label: '頁面底色' },
];

const pageLabels: Record<ThemePageKey, string> = {
  home: '首頁',
  shop: '商品分類頁',
  product: '商品詳情頁',
  blog: '文章分類頁',
  media: '影音分類頁',
  content: '內容與靜態頁',
};

const toDraft = (palette: ThemeSettings['global']): ThemePaletteDraft => ({
  primary: palette.primary,
  primaryStrong: palette.primaryStrong,
  primarySoft: palette.primarySoft,
  primaryMuted: palette.primaryMuted,
  primaryWarm: palette.primaryWarm,
  primaryBorder: palette.primaryBorder,
  surface: palette.surface,
  background: palette.background,
  ink: palette.ink,
  muted: palette.muted,
});

const makePageDraft = (palette: ThemePaletteDraft): ThemePaletteDraft => ({
  primary: palette.primary || DEFAULT_THEME_SETTINGS.global.primary,
  primaryWarm: palette.primaryWarm || DEFAULT_THEME_SETTINGS.global.primaryWarm,
  surface: palette.surface || DEFAULT_THEME_SETTINGS.global.surface,
  background: palette.background || DEFAULT_THEME_SETTINGS.global.background,
});

export default function ThemeManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [globalTheme, setGlobalTheme] = useState<ThemeSettings['global']>(DEFAULT_THEME_SETTINGS.global);
  const [pageThemes, setPageThemes] = useState<ThemeSettings['pages']>(DEFAULT_THEME_SETTINGS.pages);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('id,setting_key,setting_value,updated_at')
        .eq('setting_key', THEME_COLORS_SETTING_KEY)
        .maybeSingle();

      if (error) throw error;

      const row = data as (SiteSettingRow & { updated_at?: string | null }) | null;
      const settings = normalizeThemeSettings(row?.setting_value);
      setGlobalTheme(settings.global);
      setPageThemes(settings.pages);
      setUpdatedAt(row?.updated_at || null);
    } catch (error) {
      console.error('Failed to load theme settings:', error);
      setGlobalTheme(DEFAULT_THEME_SETTINGS.global);
      setPageThemes(DEFAULT_THEME_SETTINGS.pages);
      setUpdatedAt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const payload = useMemo<ThemeSettings>(
    () => ({
      global: normalizeThemeSettings({ global: globalTheme, pages: pageThemes }).global,
      pages: {
        home: makePageDraft(pageThemes.home),
        shop: makePageDraft(pageThemes.shop),
        product: makePageDraft(pageThemes.product),
        blog: makePageDraft(pageThemes.blog),
        media: makePageDraft(pageThemes.media),
        content: makePageDraft(pageThemes.content),
      },
    }),
    [globalTheme, pageThemes],
  );

  const updateGlobal = (key: GlobalField, value: string) => {
    setGlobalTheme((prev) => ({ ...prev, [key]: value }));
  };

  const updatePage = (page: ThemePageKey, key: PageField, value: string) => {
    setPageThemes((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [key]: value,
      },
    }));
  };

  const resetToDefault = () => {
    if (!confirm('要將色系恢復為預設值嗎？')) return;
    setGlobalTheme(DEFAULT_THEME_SETTINGS.global);
    setPageThemes(DEFAULT_THEME_SETTINGS.pages);
  };

  const save = async () => {
    setSaving(true);
    try {
      const normalized = normalizeThemeSettings(payload);
      const { data: existingRow, error: existingError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', THEME_COLORS_SETTING_KEY)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingRow?.id) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: normalized })
          .eq('id', existingRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([
          {
            setting_key: THEME_COLORS_SETTING_KEY,
            setting_value: normalized,
          },
        ]);
        if (error) throw error;
      }

      setGlobalTheme(normalized.global);
      setPageThemes(normalized.pages);
      setUpdatedAt(new Date().toISOString());
      window.localStorage.setItem('sonpin-theme-colors-cache-v1', JSON.stringify(normalized));
      alert('色系設定已儲存。');
    } catch (error) {
      console.error('Failed to save theme settings:', error);
      alert(`儲存色系失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  const previewStyle = {
    background: globalTheme.background,
    color: globalTheme.ink,
    borderColor: globalTheme.primaryBorder,
  } as const;

  if (loading) {
    return <div className="p-6">載入色系設定中…</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[rgba(53,30,13,0.1)] px-3 py-1 text-xs font-medium tracking-[0.2em] text-[var(--sonpin-primary)]">
            <Sparkles className="h-3.5 w-3.5" />
            THEME
          </div>
          <h1 className="text-3xl font-bold text-slate-900">色系管理</h1>
          <p className="mt-2 text-slate-600">
            統一調整全站主色、背景、文字與各分類頁色彩。
          </p>
          {updatedAt && <p className="mt-2 text-xs text-slate-400">最後更新：{new Date(updatedAt).toLocaleString('zh-TW')}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            重新載入
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Palette className="h-4 w-4" />
            還原預設
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--sonpin-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--sonpin-primary-strong)] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '儲存中…' : '儲存色系'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">全站色系</h2>
              <span className="rounded-full bg-[rgba(53,30,13,0.1)] px-3 py-1 text-xs font-medium text-[var(--sonpin-primary)]">Global</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {globalFields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>
                  <input
                    type="color"
                    value={globalTheme[field.key]}
                    onChange={(event) => updateGlobal(field.key, event.target.value)}
                    className="h-12 w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
                  />
                  <input
                    type="text"
                    value={globalTheme[field.key]}
                    onChange={(event) => updateGlobal(field.key, event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="#351E0D"
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            {(Object.entries(pageThemes) as [ThemePageKey, ThemePaletteDraft][]).map(([pageKey, palette]) => (
              <section key={pageKey} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">{pageLabels[pageKey]}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{pageKey}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {pageFields.map((field) => (
                    <label key={field.key} className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>
                      <input
                        type="color"
                        value={palette[field.key] || ''}
                        onChange={(event) => updatePage(pageKey, field.key, event.target.value)}
                        className="h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
                      />
                      <input
                        type="text"
                        value={palette[field.key] || ''}
                        onChange={(event) => updatePage(pageKey, field.key, event.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder={globalTheme[field.key === 'primaryWarm' ? 'primaryWarm' : 'primary'] || '#351E0D'}
                      />
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">即時預覽</h2>
            <div className="space-y-3 rounded-2xl border p-4" style={previewStyle}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: globalTheme.primary, color: globalTheme.surface }}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs tracking-[0.25em] uppercase" style={{ color: globalTheme.primary }}>
                    Sonpin
                  </p>
                  <p className="text-sm" style={{ color: globalTheme.muted }}>
                    新色系預覽
                  </p>
                </div>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: globalTheme.primaryBorder, background: globalTheme.surface }}>
                <p className="mb-2 text-sm font-medium" style={{ color: globalTheme.primary }}>
                  主按鈕
                </p>
                <div className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm" style={{ background: globalTheme.primary, color: globalTheme.surface }}>
                  立即套用
                </div>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: globalTheme.primaryBorder, background: globalTheme.background }}>
                <p className="mb-2 text-sm font-medium" style={{ color: globalTheme.primary }}>
                  分類頁面色彩
                </p>
                <p className="text-sm leading-7" style={{ color: globalTheme.muted }}>
                  商品、文章、影音、內容頁都會共用這套基底色，再依頁面設定個別微調。
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
