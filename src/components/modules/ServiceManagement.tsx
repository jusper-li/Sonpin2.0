import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save, Search, Sparkles, X, CreditCard as Edit } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadServiceArticles, syncServiceArticlesToDb, type ServiceArticleRow } from '../../lib/serviceArticleStore';
import { supabase } from '../../lib/supabase';
import ImageUpload from '../ImageUpload';
import RichTextEditor from '../RichTextEditor';

interface ServiceArticleFormState {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  status: 'draft' | 'published';
  published_at: string;
}

const emptyForm = (slug = ''): ServiceArticleFormState => ({
  title: '',
  slug,
  content: '',
  excerpt: '',
  featured_image: '',
  status: 'draft',
  published_at: '',
});

const toDatetimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const dateLabel = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('zh-TW').format(date);
};

export default function ServiceManagement() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rows, setRows] = useState<ServiceArticleRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ServiceArticleRow | null>(null);
  const [form, setForm] = useState<ServiceArticleFormState>(emptyForm());

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
      setNotice('載入老饕分享失敗，請確認 Supabase 連線與 articles 表。');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: rows.length,
      published: rows.filter((row) => row.status === 'published').length,
    }),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => `${row.title} ${row.slug} ${row.excerpt}`.toLowerCase().includes(query));
  }, [rows, searchTerm]);

  const openForm = (article: ServiceArticleRow) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      slug: article.slug,
      content: article.content || '',
      excerpt: article.excerpt || '',
      featured_image: article.featured_image || '',
      status: article.status,
      published_at: toDatetimeLocal(article.published_at),
    });
    setShowForm(true);
  };

  const handleSync = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const count = await syncServiceArticlesToDb();
      setNotice(`已同步 ${count} 篇老饕分享內容到 Supabase。`);
      await load();
    } catch (error) {
      console.error('Failed to sync service articles:', error);
      setNotice('同步老饕分享失敗，請確認 Supabase 權限與 articles 表。');
    } finally {
      setSaving(false);
    }
  };

  const saveArticle = async () => {
    if (!editingArticle) return;

    if (!form.title.trim() || !form.slug.trim()) {
      alert('請先填寫標題與代碼。');
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content,
        excerpt: form.excerpt,
        featured_image: form.featured_image || null,
        status: form.status,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };

      const { error } = editingArticle.id
        ? await supabase.from('articles').update(payload).eq('id', editingArticle.id)
        : await supabase.from('articles').upsert(payload, { onConflict: 'slug' });

      if (error) throw error;

      setShowForm(false);
      setEditingArticle(null);
      await load();
    } catch (error) {
      console.error('Failed to save service article:', error);
      setNotice('儲存失敗，請確認 Supabase 權限與欄位設定。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">{t('common.loading', '載入中...')}</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">老饕分享</h1>
          <p className="mt-2 text-slate-600">比照文章管理樣式，逐篇編輯每一則分享內容，並直接寫回 `articles` 表。</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? '同步中...' : '同步預設內容'}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <StatCard label="文章總數" value={stats.total} />
        <StatCard label="已發佈" value={stats.published} />
      </div>

      {notice && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{notice}</div>}

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜尋標題、代碼、摘要"
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-slate-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">文章</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">狀態</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">發佈日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">摘要</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRows.map((row) => (
              <tr key={row.id || row.slug} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{row.title}</div>
                  <div className="text-xs text-slate-500">/{row.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {row.status === 'published' ? '已發佈' : '草稿'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{dateLabel(row.published_at)}</td>
                <td className="px-6 py-4 text-sm leading-6 text-slate-500">
                  <div className="line-clamp-2 max-w-xl">{row.excerpt || '尚未填寫摘要'}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openForm(row)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit className="h-4 w-4" />
                    編輯
                  </button>
                </td>
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
          這個頁面和文章管理共用同一套卡片與表格視覺，編輯後會直接更新 Supabase 的 <code>articles</code> 表，前台 `/service` 與 `/service/:slug` 會立即同步。
        </p>
      </div>

      {showForm && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900">編輯老饕分享</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">文章標題 *</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">文章代碼</label>
                  <input value={form.slug} disabled className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">發佈狀態</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as 'draft' | 'published' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="draft">草稿</option>
                    <option value="published">已發佈</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">摘要</label>
                <textarea
                  value={form.excerpt}
                  onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">封面圖片</label>
                <ImageUpload value={form.featured_image} onChange={(url) => setForm({ ...form, featured_image: url })} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">內容</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(nextValue) => setForm({ ...form, content: nextValue })}
                  placeholder="請輸入文章內容..."
                />
                <p className="mt-2 text-xs text-slate-400">支援 HTML 編輯，內容會直接儲存在 Supabase。</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">發佈時間</label>
                <input
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(event) => setForm({ ...form, published_at: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-6">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">
                取消
              </button>
              <button
                onClick={saveArticle}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                儲存文章
              </button>
            </div>
          </div>
        </div>
      )}
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
