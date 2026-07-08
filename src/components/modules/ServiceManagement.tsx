import { useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw, Save, Sparkles, Undo2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getFallbackServiceContent, loadServiceContent, normalizeServiceContent, saveServiceContent, type ServiceContentPayload } from '../../lib/serviceContentStore';

export default function ServiceManagement() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<'supabase' | 'fallback'>('fallback');
  const [draft, setDraft] = useState<ServiceContentPayload | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const syncEditor = (content: ServiceContentPayload) => {
    setDraft(content);
    setEditorValue(JSON.stringify(content, null, 2));
  };

  const load = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const result = await loadServiceContent();
      setSource(result.source);
      syncEditor(result.content);
    } catch (error) {
      console.error('Failed to load service content:', error);
      const fallback = getFallbackServiceContent();
      setSource('fallback');
      syncEditor(fallback);
      setNotice('載入失敗，已改用本地預設資料。');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!draft) return { shares: 0, details: 0 };
    return {
      shares: draft.shares.length,
      details: Object.keys(draft.details).length,
    };
  }, [draft]);

  const handleReset = () => {
    const fallback = getFallbackServiceContent();
    setSource('fallback');
    syncEditor(fallback);
    setNotice('已回復成本地預設內容，尚未儲存。');
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const parsed = normalizeServiceContent(editorValue);
      if (!parsed) {
        throw new Error('invalid service content payload');
      }
      await saveServiceContent(parsed);
      setSource('supabase');
      syncEditor(parsed);
      setNotice('已儲存到 Supabase。');
    } catch (error) {
      console.error('Failed to save service content:', error);
      setNotice('儲存失敗，請先確認 JSON 格式正確。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-500">{t('common.loading', '載入中…')}</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">服務分享管理</h1>
          <p className="mt-2 text-slate-600">前台 `/service` 與 `/service/:slug` 會優先讀取這裡的設定。</p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${source === 'supabase' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          <Database className="h-4 w-4" />
          {source === 'supabase' ? 'Supabase 資料' : '本地預設'}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="分享數" value={stats.shares} />
        <StatCard label="詳情數" value={stats.details} />
        <StatCard label="JSON 字元數" value={editorValue.length} />
      </div>

      {notice && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{notice}</div>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">內容 JSON</h2>
            <p className="mt-1 text-sm text-slate-500">可直接編輯完整內容，儲存後會覆蓋 `site_settings.service_content`。</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              重新載入
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
              回到預設
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              <Save className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`} />
              {saving ? '儲存中…' : '儲存'}
            </button>
          </div>
        </div>

        <div className="p-6">
          <textarea
            value={editorValue}
            onChange={(e) => setEditorValue(e.target.value)}
            rows={28}
            spellCheck={false}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-xs leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-900">
          <Sparkles className="h-5 w-5 text-[#8e6448]" />
          <h2 className="text-lg font-bold">快速預覽</h2>
        </div>
        {draft ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {draft.shares.slice(0, 3).map((share) => (
              <div key={share.slug} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-400">{share.slug}</div>
                <div className="mt-1 font-semibold text-slate-900">{share.title}</div>
                <div className="mt-2 line-clamp-3 text-sm text-slate-600">{share.excerpt}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">尚無可預覽資料</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
