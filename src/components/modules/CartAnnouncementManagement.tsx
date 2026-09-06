import { useEffect, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import ImageUpload from '../ImageUpload';
import RichTextEditor from '../RichTextEditor';
import { supabase } from '../../lib/supabase';
import {
  CART_ANNOUNCEMENT_SETTING_KEY,
  DEFAULT_CART_ANNOUNCEMENT,
  normalizeCartAnnouncement,
  type CartAnnouncementSettings,
} from '../../data/cartAnnouncement';

interface SiteSettingRow {
  id: string | number;
  setting_value: unknown;
  updated_at?: string | null;
}

export default function CartAnnouncementManagement() {
  const [form, setForm] = useState<CartAnnouncementSettings>(DEFAULT_CART_ANNOUNCEMENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('id,setting_value,updated_at')
        .eq('setting_key', CART_ANNOUNCEMENT_SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      const row = data as SiteSettingRow | null;
      setForm(normalizeCartAnnouncement(row?.setting_value));
      setUpdatedAt(row?.updated_at || null);
    } catch (error) {
      console.error('Failed to load cart announcement:', error);
      setForm(DEFAULT_CART_ANNOUNCEMENT);
      setUpdatedAt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        image_alt: form.image_alt.trim(),
        link_url: form.link_url.trim(),
        link_label: form.link_label.trim(),
      };
      const { data: existing, error: existingError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', CART_ANNOUNCEMENT_SETTING_KEY)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing?.id) {
        const { error } = await supabase.from('site_settings').update({ setting_value: payload }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([{ setting_key: CART_ANNOUNCEMENT_SETTING_KEY, setting_value: payload }]);
        if (error) throw error;
      }

      await load();
      alert('購物車公告已儲存');
    } catch (error) {
      console.error('Failed to save cart announcement:', error);
      alert('儲存失敗，請確認 Supabase 權限與資料表設定');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">購物車公告管理</h1>
          <p className="mt-2 text-slate-600">設定購物車頁面的公告文字、圖片與導向連結。</p>
          {updatedAt && <p className="mt-2 text-xs text-slate-400">最後更新：{new Date(updatedAt).toLocaleString('zh-TW')}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
          <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? '儲存中...' : '儲存公告'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-slate-800">
            <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} className="h-4 w-4" />
            啟用購物車公告
          </label>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">公告標題</label>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">公告內容</label>
            <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} placeholder="請輸入購物車公告內容..." />
            <p className="mt-2 text-xs text-slate-400">支援粗體、連結與清單，內容會顯示在購物車頁面。</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">公告圖片（選填）</label>
            <ImageUpload value={form.image} onChange={(image) => setForm({ ...form, image })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">圖片替代文字</label>
            <input value={form.image_alt} onChange={(event) => setForm({ ...form, image_alt: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">連結網址（選填）</label>
              <input value={form.link_url} onChange={(event) => setForm({ ...form, link_url: event.target.value })} placeholder="/shop 或 https://..." className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">按鈕文字</label>
              <input value={form.link_label} onChange={(event) => setForm({ ...form, link_label: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
          </div>
        </section>

        <aside>
          <div className="rounded-xl border border-slate-200 bg-[var(--sonpin-background)] p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">前台預覽</p>
            <div className="overflow-hidden rounded-xl border border-[var(--sonpin-primary-border)] bg-white">
              {form.image && <img src={form.image} alt={form.image_alt || form.title} className="h-40 w-full object-cover" />}
              <div className="p-5">
                <h2 className="text-xl font-medium text-stone-800">{form.title || '公告標題'}</h2>
                {form.content ? <div className="prose prose-sm mt-3 max-w-none text-stone-600" dangerouslySetInnerHTML={{ __html: form.content }} /> : <p className="mt-3 text-sm text-stone-400">尚未輸入公告內容</p>}
                {form.link_url && <div className="mt-4 inline-flex rounded-full bg-stone-800 px-4 py-2 text-xs text-white">{form.link_label || '了解更多'}</div>}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
