import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  DEFAULT_PRODUCT_DETAIL_SERVICE_SECTIONS,
  normalizeProductDetailServiceSettings,
  PRODUCT_DETAIL_SERVICE_SETTING_KEY,
  type ProductDetailServiceSection,
} from '../../data/productDetailServiceInfo';

interface SiteSettingRow {
  id: string | number;
  setting_key: string;
  setting_value: unknown;
}

interface SectionFormRow {
  title: string;
  itemsText: string;
}

const createDefaultRows = (): SectionFormRow[] =>
  DEFAULT_PRODUCT_DETAIL_SERVICE_SECTIONS.map((section) => ({
    title: section.title,
    itemsText: section.items.join('\n'),
  }));

const rowsToSettings = (rows: SectionFormRow[]) => ({
  sections: rows
    .map((row) => ({
      title: row.title.trim(),
      items: row.itemsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    }))
    .filter((section) => section.title || section.items.length > 0),
});

const settingsToRows = (sections: ProductDetailServiceSection[]): SectionFormRow[] =>
  sections.map((section) => ({
    title: section.title,
    itemsText: section.items.join('\n'),
  }));

export default function ProductDetailServiceManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<SectionFormRow[]>(createDefaultRows());
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('id,setting_key,setting_value,updated_at')
        .eq('setting_key', PRODUCT_DETAIL_SERVICE_SETTING_KEY)
        .maybeSingle();

      if (error) throw error;

      const row = data as SiteSettingRow & { updated_at?: string | null } | null;
      const settings = normalizeProductDetailServiceSettings(row?.setting_value);
      setRows(settingsToRows(settings.sections));
      setUpdatedAt(row?.updated_at || null);
    } catch (error) {
      console.error('Failed to load product detail service settings:', error);
      setRows(createDefaultRows());
      setUpdatedAt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const previewSections = useMemo(
    () =>
      rows
        .map((row) => ({
          title: row.title.trim(),
          items: row.itemsText
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        }))
        .filter((section) => section.title || section.items.length > 0),
    [rows]
  );

  const updateRow = (index: number, field: keyof SectionFormRow, value: string) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { title: '', itemsText: '' }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, rowIndex) => rowIndex !== index) : prev));
  };

  const resetToDefault = () => {
    if (!confirm('確定要還原預設內容嗎？')) return;
    setRows(createDefaultRows());
  };

  const save = async () => {
    const payload = rowsToSettings(rows);
    if (payload.sections.length === 0) {
      alert('請至少保留一個區塊與內容');
      return;
    }

    setSaving(true);
    try {
      const { data: existingRow, error: existingError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', PRODUCT_DETAIL_SERVICE_SETTING_KEY)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingRow?.id) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: payload })
          .eq('id', existingRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([
          {
            setting_key: PRODUCT_DETAIL_SERVICE_SETTING_KEY,
            setting_value: payload,
          },
        ]);
        if (error) throw error;
      }

      await load();
      alert('已儲存商品頁配送與服務內容');
    } catch (error) {
      console.error('Failed to save product detail service settings:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">商品頁配送與服務</h1>
          <p className="mt-2 text-slate-600">
            編輯商品詳情頁下方的付款、運送、出貨與退換貨內容，前台會立即同步。
          </p>
          {updatedAt && <p className="mt-2 text-xs text-slate-400">最後更新：{new Date(updatedAt).toLocaleString('zh-TW')}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Trash2 className="h-4 w-4" />
            還原預設
          </button>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            新增區塊
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          {rows.map((row, index) => (
            <section key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">區塊 {index + 1}</h2>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-sm text-rose-600 hover:text-rose-700"
                  >
                    刪除
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">標題</label>
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => updateRow(index, 'title', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="例如：付款方式"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">內容項目</label>
                  <textarea
                    value={row.itemsText}
                    onChange={(e) => updateRow(index, 'itemsText', e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="每行一條內容"
                  />
                  <p className="mt-2 text-xs text-slate-500">每一行會顯示成一個條目，空白行會自動略過。</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">前台預覽</h2>
          <div className="space-y-4 rounded-2xl border border-[#eadfd1] bg-[#fffaf2] p-5 text-sm">
            {previewSections.length > 0 ? (
              previewSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-stone-700">{section.title || '未命名區塊'}</h3>
                  <ul className="space-y-1.5">
                    {section.items.length > 0 ? (
                      section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-stone-500">
                          <span className="mt-0.5 text-green-500">•</span>
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-stone-400">尚未輸入內容</li>
                    )}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-stone-400">目前沒有內容</p>
            )}
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
}
