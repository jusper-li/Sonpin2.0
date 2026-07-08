import { useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw, Save, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadServiceArticles, syncServiceArticlesToDb, type ServiceArticleRow } from '../../lib/serviceArticleStore';

export default function ServiceManagement() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ServiceArticleRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const items = await loadServiceArticles();
      setRows(items);
    } catch (error) {
      console.error('Failed to load service articles:', error);
      setNotice('載入失敗，請確認 Supabase 連線。');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: rows.length,
      published: rows.filter((row) => row.status === 'published').length,
    };
  }, [rows]);

  const handleSync = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const count = await syncServiceArticlesToDb();
      setNotice(`已同步 ${count} 篇文章到資料庫。`);
      await load();
    } catch (error) {
      console.error('Failed to sync service articles:', error);
      setNotice('同步失敗，請確認 Supabase 權限與連線。');
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
          <h1 className="text-3xl font-bold text-slate-900">文章列表</h1>
          <p className="mt-2 text-slate-600">每篇文章都會以獨立一列寫入 `articles` 表，不再使用 JSON 編碼。</p>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          <Database className="mr-2 inline h-4 w-4" />
          Articles table
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <StatCard label="文章總數" value={stats.total} />
        <StatCard label="已發佈" value={stats.published} />
      </div>

      {notice && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{notice}</div>}

      <div className="mb-6 flex items-center justify-end gap-3">
        <button
          onClick={load}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
          重新整理
        </button>
        <button
          onClick={handleSync}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          <Save className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`} />
          {saving ? '同步中…' : '同步全部文章到資料庫'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">標題</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">狀態</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">發布時間</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">摘要</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row) => (
              <tr key={row.slug} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{row.title}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{row.slug}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {row.status === 'published' ? '已發佈' : '草稿'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{row.published_at ? new Date(row.published_at).toLocaleString('zh-TW') : '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{row.excerpt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-900">
          <Sparkles className="h-5 w-5 text-[#8e6448]" />
          <h2 className="text-lg font-bold">說明</h2>
        </div>
        <p className="text-sm leading-7 text-slate-600">
          這個頁面是把原本的服務內容改成文章列表管理。同步後，每一篇文章都會寫成 `articles` 表中的獨立資料列，前台 `/service` 與 `/service/:slug` 都會直接讀這些文章。
        </p>
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
