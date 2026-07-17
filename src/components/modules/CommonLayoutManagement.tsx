import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Globe, Image as ImageIcon, Menu as MenuIcon, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import ImageUpload from '../ImageUpload';
import { isSupabaseContentEnabled, supabase } from '../../lib/supabase';
import { DEFAULT_FOOTER_SETTINGS, DEFAULT_HEADER_SETTINGS, type FooterLinkGroup, type FooterSettings, type HeaderNavItem, type HeaderSettings } from '../../data/homepageContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { emitLayoutSettingsSync, subscribeLayoutSettingsSync } from '../../lib/layoutSettingsSync';

interface SiteSettingRow {
  id: string | number;
  setting_key: string;
  setting_value: unknown;
  updated_at?: string | null;
}

type HeaderTab = 'header' | 'footer';

const HEADER_SETTING_KEY = 'header';
const FOOTER_SETTING_KEY = 'footer';

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  if (typeof value === 'number') return value !== 0;
  return fallback;
};

const normalizeString = (value: unknown, fallback = '') => {
  const next = typeof value === 'string' ? value.trim() : '';
  return next || fallback;
};

const normalizeHeaderSettings = (value: unknown): HeaderSettings => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const navigationSource = Array.isArray(source.navigation) ? source.navigation : DEFAULT_HEADER_SETTINGS.navigation;

  const navigation = navigationSource
    .map((item) => {
      const record = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : {};
      return {
        label: normalizeString(record.label),
        href: normalizeString(record.href),
      };
    })
    .filter((item) => item.label && item.href);

  return {
    logo_text: normalizeString(source.logo_text, DEFAULT_HEADER_SETTINGS.logo_text),
    logo_image: normalizeString(source.logo_image, DEFAULT_HEADER_SETTINGS.logo_image),
    navigation: navigation.length > 0 ? navigation : DEFAULT_HEADER_SETTINGS.navigation,
    show_cart: normalizeBoolean(source.show_cart, DEFAULT_HEADER_SETTINGS.show_cart),
    show_language_selector: normalizeBoolean(source.show_language_selector, DEFAULT_HEADER_SETTINGS.show_language_selector),
  };
};

const normalizeFooterSettings = (value: unknown): FooterSettings => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const groupSource = Array.isArray(source.link_groups) ? source.link_groups : [];
  const socialSource = source.social_links && typeof source.social_links === 'object' ? (source.social_links as Record<string, unknown>) : {};

  const normalizeGroup = (group: unknown, fallbackGroup: FooterLinkGroup): FooterLinkGroup => {
    const groupRecord = group && typeof group === 'object' && !Array.isArray(group) ? (group as Record<string, unknown>) : {};
    const linksSource = Array.isArray(groupRecord.links) ? groupRecord.links : [];
    const links = Array.from({ length: Math.max(linksSource.length, fallbackGroup.links.length) }, (_, index) => {
      const link = linksSource[index];
      const fallbackLink = fallbackGroup.links[index];
      const linkRecord = link && typeof link === 'object' && !Array.isArray(link) ? (link as Record<string, unknown>) : {};
      return {
        label: normalizeString(linkRecord.label, fallbackLink?.label || ''),
        href: normalizeString(linkRecord.href, fallbackLink?.href || ''),
      };
    }).filter((link) => link.label || link.href);

    return {
      title: normalizeString(groupRecord.title, fallbackGroup.title),
      links: links.length > 0 ? links : fallbackGroup.links,
    };
  };

  const defaultGroups = DEFAULT_FOOTER_SETTINGS.link_groups;
  const mergedDefaultGroups = defaultGroups.map((fallbackGroup, index) => normalizeGroup(groupSource[index], fallbackGroup));
  const extraGroups = groupSource
    .slice(defaultGroups.length)
    .map((group) => normalizeGroup(group, { title: '', links: [{ label: '', href: '' }] }))
    .filter((group) => group.title || group.links.some((link) => link.label || link.href));

  const linkGroups = [...mergedDefaultGroups, ...extraGroups].filter((group) => group.title || group.links.some((link) => link.label || link.href));

  return {
    about_text: normalizeString(source.about_text, DEFAULT_FOOTER_SETTINGS.about_text),
    contact_email: normalizeString(source.contact_email, DEFAULT_FOOTER_SETTINGS.contact_email),
    contact_phone: normalizeString(source.contact_phone, DEFAULT_FOOTER_SETTINGS.contact_phone),
    social_links: {
      facebook: normalizeString(socialSource.facebook),
      instagram: normalizeString(socialSource.instagram),
      youtube: normalizeString(socialSource.youtube),
    },
    copyright_text: normalizeString(source.copyright_text, DEFAULT_FOOTER_SETTINGS.copyright_text),
    link_groups: linkGroups.length > 0 ? linkGroups : DEFAULT_FOOTER_SETTINGS.link_groups,
  };
};

const createEmptyNavItem = (): HeaderNavItem => ({ label: '', href: '' });

const createEmptyFooterLink = () => ({ label: '', href: '' });

const createEmptyFooterGroup = (): FooterLinkGroup => ({
  title: '',
  links: [createEmptyFooterLink()],
});

export default function CommonLayoutManagement() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<HeaderTab>('header');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(DEFAULT_HEADER_SETTINGS);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const [isLocalContent, setIsLocalContent] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    return subscribeLayoutSettingsSync((payload) => {
      if (payload.scope === 'header' || payload.scope === 'footer' || payload.scope === 'both') {
        void loadData();
      }
    });
  }, []);

  const loadData = async () => {
    setLoading(true);

    if (!isSupabaseContentEnabled) {
      setHeaderSettings(DEFAULT_HEADER_SETTINGS);
      setFooterSettings(DEFAULT_FOOTER_SETTINGS);
      setUpdatedAt(null);
      setIsLocalContent(true);
      setLoading(false);
      return;
    }

    try {
      const [headerResponse, footerResponse] = await Promise.all([
        supabase.from('site_settings').select('id,setting_key,setting_value,updated_at').eq('setting_key', HEADER_SETTING_KEY).maybeSingle(),
        supabase.from('site_settings').select('id,setting_key,setting_value,updated_at').eq('setting_key', FOOTER_SETTING_KEY).maybeSingle(),
      ]);

      if (headerResponse.error) throw headerResponse.error;
      if (footerResponse.error) throw footerResponse.error;

      const headerRow = headerResponse.data as SiteSettingRow | null;
      const footerRow = footerResponse.data as SiteSettingRow | null;

      setHeaderSettings(normalizeHeaderSettings(headerRow?.setting_value));
      setFooterSettings(normalizeFooterSettings(footerRow?.setting_value));
      setUpdatedAt(headerRow?.updated_at || footerRow?.updated_at || null);
      setIsLocalContent(false);
    } catch (error) {
      console.error('Failed to load common layout settings:', error);
      setHeaderSettings(DEFAULT_HEADER_SETTINGS);
      setFooterSettings(DEFAULT_FOOTER_SETTINGS);
      setUpdatedAt(null);
      setIsLocalContent(true);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    if (!confirm('確定要重設頁首與頁尾設定嗎？這會覆蓋目前的設定。')) return;
    setHeaderSettings(DEFAULT_HEADER_SETTINGS);
    setFooterSettings(DEFAULT_FOOTER_SETTINGS);
  };

  const save = async () => {
    setSaving(true);
    try {
      const normalizedHeader = normalizeHeaderSettings(headerSettings);
      const normalizedFooter = normalizeFooterSettings(footerSettings);

      const [headerExisting, footerExisting] = await Promise.all([
        supabase.from('site_settings').select('id').eq('setting_key', HEADER_SETTING_KEY).maybeSingle(),
        supabase.from('site_settings').select('id').eq('setting_key', FOOTER_SETTING_KEY).maybeSingle(),
      ]);

      if (headerExisting.error) throw headerExisting.error;
      if (footerExisting.error) throw footerExisting.error;

      if (headerExisting.data?.id) {
        const { error } = await supabase.from('site_settings').update({ setting_value: normalizedHeader }).eq('id', headerExisting.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([{ setting_key: HEADER_SETTING_KEY, setting_value: normalizedHeader }]);
        if (error) throw error;
      }

      if (footerExisting.data?.id) {
        const { error } = await supabase.from('site_settings').update({ setting_value: normalizedFooter }).eq('id', footerExisting.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([{ setting_key: FOOTER_SETTING_KEY, setting_value: normalizedFooter }]);
        if (error) throw error;
      }

      setHeaderSettings(normalizedHeader);
      setFooterSettings(normalizedFooter);
      setUpdatedAt(new Date().toISOString());
      emitLayoutSettingsSync('both');
      alert('頁首與頁尾設定已儲存。');
    } catch (error) {
      console.error('Failed to save common layout settings:', error);
      alert(`儲存失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  const updateHeader = (key: keyof HeaderSettings, value: string | boolean | HeaderNavItem[]) => {
    setHeaderSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateFooter = (key: keyof FooterSettings, value: FooterSettings[keyof FooterSettings]) => {
    setFooterSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateHeaderNavItem = (index: number, key: keyof HeaderNavItem, value: string) => {
    setHeaderSettings((current) => {
      const navigation = [...current.navigation];
      navigation[index] = { ...navigation[index], [key]: value };
      return { ...current, navigation };
    });
  };

  const moveHeaderNavItem = (index: number, direction: -1 | 1) => {
    setHeaderSettings((current) => {
      const navigation = [...current.navigation];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= navigation.length) return current;
      [navigation[index], navigation[nextIndex]] = [navigation[nextIndex], navigation[index]];
      return { ...current, navigation };
    });
  };

  const addHeaderNavItem = () => {
    setHeaderSettings((current) => ({ ...current, navigation: [...current.navigation, createEmptyNavItem()] }));
  };

  const removeHeaderNavItem = (index: number) => {
    setHeaderSettings((current) => ({ ...current, navigation: current.navigation.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const updateFooterGroup = (groupIndex: number, key: keyof FooterLinkGroup, value: string | FooterLinkGroup['links']) => {
    setFooterSettings((current) => {
      const link_groups = [...current.link_groups];
      link_groups[groupIndex] = { ...link_groups[groupIndex], [key]: value } as FooterLinkGroup;
      return { ...current, link_groups };
    });
  };

  const updateFooterLink = (groupIndex: number, linkIndex: number, key: 'label' | 'href', value: string) => {
    setFooterSettings((current) => {
      const link_groups = [...current.link_groups];
      const group = { ...link_groups[groupIndex] };
      const links = [...group.links];
      links[linkIndex] = { ...links[linkIndex], [key]: value };
      group.links = links;
      link_groups[groupIndex] = group;
      return { ...current, link_groups };
    });
  };

  const moveFooterGroup = (groupIndex: number, direction: -1 | 1) => {
    setFooterSettings((current) => {
      const link_groups = [...current.link_groups];
      const nextIndex = groupIndex + direction;
      if (nextIndex < 0 || nextIndex >= link_groups.length) return current;
      [link_groups[groupIndex], link_groups[nextIndex]] = [link_groups[nextIndex], link_groups[groupIndex]];
      return { ...current, link_groups };
    });
  };

  const moveFooterLink = (groupIndex: number, linkIndex: number, direction: -1 | 1) => {
    setFooterSettings((current) => {
      const link_groups = [...current.link_groups];
      const group = { ...link_groups[groupIndex] };
      const links = [...group.links];
      const nextIndex = linkIndex + direction;
      if (nextIndex < 0 || nextIndex >= links.length) return current;
      [links[linkIndex], links[nextIndex]] = [links[nextIndex], links[linkIndex]];
      group.links = links;
      link_groups[groupIndex] = group;
      return { ...current, link_groups };
    });
  };

  const addFooterGroup = () => {
    setFooterSettings((current) => ({ ...current, link_groups: [...current.link_groups, createEmptyFooterGroup()] }));
  };

  const removeFooterGroup = (groupIndex: number) => {
    setFooterSettings((current) => ({ ...current, link_groups: current.link_groups.filter((_, index) => index !== groupIndex) }));
  };

  const addFooterLink = (groupIndex: number) => {
    setFooterSettings((current) => {
      const link_groups = [...current.link_groups];
      const group = { ...link_groups[groupIndex] };
      group.links = [...group.links, createEmptyFooterLink()];
      link_groups[groupIndex] = group;
      return { ...current, link_groups };
    });
  };

  const removeFooterLink = (groupIndex: number, linkIndex: number) => {
    setFooterSettings((current) => {
      const link_groups = [...current.link_groups];
      const group = { ...link_groups[groupIndex] };
      group.links = group.links.filter((_, index) => index !== linkIndex);
      if (group.links.length === 0) group.links = [createEmptyFooterLink()];
      link_groups[groupIndex] = group;
      return { ...current, link_groups };
    });
  };

  const previewHeaderNav = useMemo(
    () => headerSettings.navigation.filter((item) => item.label.trim() || item.href.trim()),
    [headerSettings.navigation],
  );

  const previewFooterGroups = useMemo(
    () =>
      footerSettings.link_groups
        .map((group) => ({
          ...group,
          links: group.links.filter((link) => link.label.trim() || link.href.trim()),
        }))
        .filter((group) => group.title.trim() || group.links.length > 0),
    [footerSettings.link_groups],
  );

  if (loading) {
    return <div className="p-6">{t('common.loading', '載入中...')}</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[rgba(53,30,13,0.08)] px-3 py-1 text-xs font-medium tracking-[0.2em] text-[var(--sonpin-primary)]">
            <Globe className="h-3.5 w-3.5" />
            COMMON LAYOUT
          </div>
          <h1 className="text-3xl font-bold text-slate-900">共同頁首頁尾管理</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            這裡管理全站共用的頁首與頁尾內容，前台會直接同步讀取這份設定。
          </p>
          {updatedAt && <p className="mt-2 text-xs text-slate-400">最後更新：{new Date(updatedAt).toLocaleString('zh-TW')}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
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
            <MenuIcon className="h-4 w-4" />
            重設為預設
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--sonpin-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--sonpin-primary-strong)] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </div>

      {isLocalContent && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          目前使用的是本地預設資料。若要正式同步，請確認 Supabase 的 <code>site_settings</code> 已可寫入。
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
        <TabButton active={activeTab === 'header'} icon={MenuIcon} label="頁首設定" onClick={() => setActiveTab('header')} />
        <TabButton active={activeTab === 'footer'} icon={ImageIcon} label="頁尾設定" onClick={() => setActiveTab('footer')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          {activeTab === 'header' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle title="頁首內容" description="調整 Logo、主選單與右上角顯示項目。" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Logo 文字">
                  <input
                    type="text"
                    value={headerSettings.logo_text}
                    onChange={(event) => updateHeader('logo_text', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                  />
                </Field>
                <Field label="Logo 圖片">
                  <ImageUpload
                    value={headerSettings.logo_image}
                    onChange={(url) => updateHeader('logo_image', url)}
                    label="上傳或選擇 Logo 圖片"
                  />
                </Field>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">主選單</h3>
                    <p className="text-sm text-slate-500">可新增、刪除與調整顯示順序。</p>
                  </div>
                  <button
                    type="button"
                    onClick={addHeaderNavItem}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    新增選單
                  </button>
                </div>

                <div className="space-y-3">
                  {headerSettings.navigation.map((item, index) => (
                    <div key={`${item.href}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <Field label="顯示名稱">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(event) => updateHeaderNavItem(index, 'label', event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                          />
                        </Field>
                        <Field label="連結路徑">
                          <input
                            type="text"
                            value={item.href}
                            onChange={(event) => updateHeaderNavItem(index, 'href', event.target.value)}
                            placeholder="/about"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                          />
                        </Field>
                        <div className="flex items-end gap-2">
                          <button
                            type="button"
                            onClick={() => moveHeaderNavItem(index, -1)}
                            className="rounded-lg border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
                            aria-label="上移"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveHeaderNavItem(index, 1)}
                            className="rounded-lg border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
                            aria-label="下移"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeHeaderNavItem(index)}
                            className="rounded-lg border border-rose-200 p-3 text-rose-600 hover:bg-rose-50"
                            aria-label="刪除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <SwitchField
                  label="顯示購物車"
                  checked={headerSettings.show_cart}
                  onChange={(checked) => updateHeader('show_cart', checked)}
                />
                <SwitchField
                  label="顯示語系切換"
                  checked={headerSettings.show_language_selector}
                  onChange={(checked) => updateHeader('show_language_selector', checked)}
                />
              </div>
            </section>
          )}

          {activeTab === 'footer' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle title="頁尾內容" description="調整品牌簡介、聯絡資料、社群與頁尾連結群組。" />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="品牌介紹">
                  <textarea
                    value={footerSettings.about_text}
                    onChange={(event) => updateFooter('about_text', event.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                  />
                </Field>
                <div className="space-y-4">
                  <Field label="客服信箱">
                    <input
                      type="email"
                      value={footerSettings.contact_email}
                      onChange={(event) => updateFooter('contact_email', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                    />
                  </Field>
                  <Field label="客服電話">
                    <input
                      type="text"
                      value={footerSettings.contact_phone}
                      onChange={(event) => updateFooter('contact_phone', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-4 text-base font-semibold text-slate-900">社群連結</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {(['facebook', 'instagram', 'youtube'] as const).map((platform) => (
                    <Field key={platform} label={platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'YouTube'}>
                      <input
                        type="url"
                        value={footerSettings.social_links[platform] || ''}
                        onChange={(event) =>
                          updateFooter('social_links', {
                            ...footerSettings.social_links,
                            [platform]: event.target.value,
                          })
                        }
                        placeholder={`https://${platform}.com/...`}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                      />
                    </Field>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">頁尾連結群組</h3>
                    <p className="text-sm text-slate-500">每個群組都能自由新增連結，前台會直接同步。</p>
                  </div>
                  <button
                    type="button"
                    onClick={addFooterGroup}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    新增群組
                  </button>
                </div>

                <div className="space-y-4">
                  {footerSettings.link_groups.map((group, groupIndex) => (
                    <div key={`${group.title}-${groupIndex}`} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                          <Field label="群組標題">
                            <input
                              type="text"
                              value={group.title}
                              onChange={(event) => updateFooterGroup(groupIndex, 'title', event.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                            />
                          </Field>
                          <div className="flex items-end gap-2">
                            <button
                              type="button"
                              onClick={() => moveFooterGroup(groupIndex, -1)}
                              className="rounded-lg border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
                              aria-label="上移群組"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveFooterGroup(groupIndex, 1)}
                              className="rounded-lg border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
                              aria-label="下移群組"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFooterGroup(groupIndex)}
                              className="rounded-lg border border-rose-200 p-3 text-rose-600 hover:bg-rose-50"
                              aria-label="刪除群組"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {group.links.map((link, linkIndex) => (
                          <div key={`${groupIndex}-${linkIndex}`} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                            <Field label="連結名稱">
                              <input
                                type="text"
                                value={link.label}
                                onChange={(event) => updateFooterLink(groupIndex, linkIndex, 'label', event.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                              />
                            </Field>
                            <Field label="連結路徑">
                              <input
                                type="text"
                                value={link.href}
                                onChange={(event) => updateFooterLink(groupIndex, linkIndex, 'href', event.target.value)}
                                placeholder="/contact"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                              />
                            </Field>
                            <div className="flex items-end gap-2">
                              <button
                                type="button"
                                onClick={() => moveFooterLink(groupIndex, linkIndex, -1)}
                                className="rounded-lg border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
                                aria-label="上移連結"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveFooterLink(groupIndex, linkIndex, 1)}
                                className="rounded-lg border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
                                aria-label="下移連結"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFooterLink(groupIndex, linkIndex)}
                                className="rounded-lg border border-rose-200 p-3 text-rose-600 hover:bg-rose-50"
                                aria-label="刪除連結"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addFooterLink(groupIndex)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Plus className="h-4 w-4" />
                          新增連結
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <Field label="頁尾版權">
                  <input
                    type="text"
                    value={footerSettings.copyright_text}
                    onChange={(event) => updateFooter('copyright_text', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                  />
                </Field>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">即時預覽</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                  <MenuIcon className="h-4 w-4" />
                  頁首
                </div>
                <div className="text-sm text-slate-600">
                  <div className="font-medium text-slate-900">{headerSettings.logo_text || 'Logo'}</div>
                  <div className="mt-1 text-xs text-slate-500">Logo 圖片：{headerSettings.logo_image ? '已設定' : '未設定'}</div>
                  <div className="mt-3 space-y-1">
                    {previewHeaderNav.map((item) => (
                      <div key={`${item.href}-${item.label}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span>{item.label}</span>
                        <span className="text-xs text-slate-400">{item.href}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                  <ImageIcon className="h-4 w-4" />
                  頁尾
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <div>
                    <div className="text-xs text-slate-400">客服信箱</div>
                    <div className="break-all font-medium text-slate-900">{footerSettings.contact_email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">客服電話</div>
                    <div className="font-medium text-slate-900">{footerSettings.contact_phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">頁尾連結群組</div>
                    <div className="mt-2 space-y-2">
                      {previewFooterGroups.map((group, index) => (
                        <div key={`${group.title}-${index}`} className="rounded-lg bg-slate-50 p-3">
                          <div className="font-medium text-slate-900">{group.title || `群組 ${index + 1}`}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {group.links.map((link) => link.label || link.href).filter(Boolean).join('、') || '尚未設定'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">同步說明</h2>
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              <li>• 前台頁首會直接讀取 <code>site_settings.header</code></li>
              <li>• 前台頁尾會直接讀取 <code>site_settings.footer</code></li>
              <li>• 儲存後，首頁、商品頁、文章頁與靜態頁都會同步套用</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
    </label>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-2 pb-3 text-sm font-medium transition-colors ${
        active ? 'border-[var(--sonpin-primary)] text-[var(--sonpin-primary)]' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
