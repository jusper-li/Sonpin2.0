import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, FileText, Plus, Save, Trash2, X } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';
import StaticContent from '../StaticContent';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

interface PageSection {
  type: 'intro' | 'section';
  title: string;
  content: string;
}

interface StaticPageData {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  sections: PageSection[];
  is_published: boolean;
  updated_at: string;
  created_at?: string;
}

interface EditableStaticPage {
  id?: string;
  slug: string;
  title: string;
  meta_description: string;
  sections: PageSection[];
  is_published: boolean;
}

const RESERVED_SLUGS = new Set([
  'about',
  'story',
  'contact',
  'privacy',
  'terms',
  'shipping',
  'returns',
  'faq',
  'process',
  'culture',
]);

const DEFAULT_SECTION: PageSection = { type: 'intro', title: '', content: '' };

const DEFAULT_PAGE = (): EditableStaticPage => ({
  slug: '',
  title: '',
  meta_description: '',
  sections: [{ ...DEFAULT_SECTION }],
  is_published: false,
});

const PAGE_LABELS: Record<string, string> = {
  about: '關於我們',
  story: '品牌故事',
  contact: '客服中心',
  privacy: '隱私權政策',
  terms: '服務條款',
  shipping: '購物須知',
  returns: '退換貨政策',
  faq: '常見問題',
  process: '生產製程',
  culture: '企業文化',
};

export default function StaticPageManagement() {
  const { t } = useLanguage();
  const [pages, setPages] = useState<StaticPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState<EditableStaticPage | null>(null);

  useEffect(() => {
    void loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('static_pages')
        .select('id, slug, title, meta_description, sections, is_published, updated_at, created_at')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setPages((data || []) as StaticPageData[]);
    } catch (error) {
      console.error('Failed to load pages:', error);
      alert(t('static_pages.load_failed', '載入靜態頁面失敗'));
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditingPage(DEFAULT_PAGE());
  };

  const startEdit = (page: StaticPageData) => {
    setEditingPage({
      id: page.id,
      slug: page.slug || '',
      title: page.title || '',
      meta_description: page.meta_description || '',
      sections: Array.isArray(page.sections) && page.sections.length ? [...page.sections] : [{ ...DEFAULT_SECTION }],
      is_published: page.is_published,
    });
  };

  const updateSection = (index: number, field: keyof PageSection, value: string) => {
    if (!editingPage) return;
    const sections = [...editingPage.sections];
    sections[index] = { ...sections[index], [field]: value };
    setEditingPage({ ...editingPage, sections });
  };

  const addSection = () => {
    if (!editingPage) return;
    setEditingPage({
      ...editingPage,
      sections: [...editingPage.sections, { ...DEFAULT_SECTION }],
    });
  };

  const removeSection = (index: number) => {
    if (!editingPage) return;
    const sections = [...editingPage.sections];
    sections.splice(index, 1);
    setEditingPage({
      ...editingPage,
      sections: sections.length ? sections : [{ ...DEFAULT_SECTION }],
    });
  };

  const moveSection = (index: number, dir: 'up' | 'down') => {
    if (!editingPage) return;
    const sections = [...editingPage.sections];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setEditingPage({ ...editingPage, sections });
  };

  const saveEdit = async () => {
    if (!editingPage) return;

    const slug = editingPage.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
    const title = editingPage.title.trim();

    if (!slug || !title) {
      alert(t('static_pages.required', '請輸入頁面標題與代稱（slug）'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug,
        title,
        meta_description: editingPage.meta_description.trim(),
        sections: editingPage.sections.map((section) => ({
          type: section.type,
          title: section.title,
          content: section.content,
        })),
        is_published: editingPage.is_published,
        updated_at: new Date().toISOString(),
      };

      const query = editingPage.id
        ? supabase.from('static_pages').update(payload).eq('id', editingPage.id)
        : supabase.from('static_pages').insert([payload]);

      const { error } = await query;
      if (error) throw error;

      await loadPages();
      setEditingPage(null);
    } catch (error) {
      console.error('Failed to save page:', error);
      alert(t('static_pages.save_failed', '儲存失敗，請重試'));
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (page: StaticPageData) => {
    const label = page.title || PAGE_LABELS[page.slug] || page.slug;
    const ok = window.confirm(`確定要刪除「${label}」嗎？`);
    if (!ok) return;

    try {
      const { error } = await supabase.from('static_pages').delete().eq('id', page.id);
      if (error) throw error;
      if (editingPage?.id === page.id) setEditingPage(null);
      await loadPages();
    } catch (error) {
      console.error('Failed to delete page:', error);
      alert(t('static_pages.delete_failed', '刪除失敗，請重試'));
    }
  };

  const sortedPages = useMemo(() => pages.slice().sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')), [pages]);
  const publishedCount = pages.filter((page) => page.is_published).length;
  const draftCount = pages.length - publishedCount;

  if (loading) return <div className="p-6 text-slate-500">{t('common.loading', '載入中...')}</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">{t('static_pages.title', '靜態頁面管理')}</h1>
          <p className="max-w-3xl text-slate-600">
            {t('static_pages.subtitle', '把所有靜態頁面集中在同一個管理區塊，新增後前台選單會自動同步顯示。')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPages}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" />
            {t('common.reload', '重新載入')}
          </button>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {t('static_pages.add_page', '新增頁面')}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">總頁數</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{pages.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">已發布</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{publishedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">草稿</p>
          <p className="mt-2 text-3xl font-bold text-slate-600">{draftCount}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
        前台靜態頁面選單會自動讀取已發布的頁面；新增或刪除後，前台會跟著更新。
      </div>

      {editingPage ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingPage.id ? '編輯靜態頁面' : '新增靜態頁面'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                路徑：{editingPage.slug ? `/${editingPage.slug}` : '尚未設定'}
                {editingPage.slug && RESERVED_SLUGS.has(editingPage.slug.trim().toLowerCase()) ? '（系統保留頁）' : ''}
              </p>
            </div>
            <button
              onClick={() => setEditingPage(null)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">頁面標題</label>
                <input
                  type="text"
                  value={editingPage.title}
                  onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="例如：隱私權政策"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">頁面代稱（slug）</label>
                <input
                  type="text"
                  value={editingPage.slug}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="例如：privacy"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">SEO 描述</label>
              <input
                type="text"
                value={editingPage.meta_description}
                onChange={(e) => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="搜尋引擎顯示的描述文字"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingPage.is_published}
                  onChange={(e) => setEditingPage({ ...editingPage, is_published: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-slate-700">已發布</span>
              </label>
              <span className="text-sm text-slate-500">已發布的頁面才會出現在前台選單中。</span>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">頁面內容區塊</label>
                <button
                  onClick={addSection}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  新增區塊
                </button>
              </div>

              <div className="space-y-4">
                {editingPage.sections.map((section, index) => (
                  <div key={`${index}-${section.title}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <select
                          value={section.type}
                          onChange={(e) => updateSection(index, 'type', e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                        >
                          <option value="intro">引言區塊</option>
                          <option value="section">內容區塊</option>
                        </select>
                        <span className="text-xs text-slate-400">區塊 {index + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          className="rounded p-1 text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === editingPage.sections.length - 1}
                          className="rounded p-1 text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeSection(index)}
                          className="rounded p-1 text-red-400 transition-colors hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(index, 'title', e.target.value)}
                        placeholder="區塊標題"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <RichTextEditor
                        value={section.content}
                        onChange={(nextValue) => updateSection(index, 'content', nextValue)}
                        placeholder="可直接編輯 HTML / 文字內容"
                        minHeightClassName="min-h-[180px]"
                      />
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">內容預覽</p>
                        <StaticContent
                          value={section.content || '尚未輸入內容。'}
                          className="prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-img:my-3 prose-img:rounded-lg prose-img:border prose-img:border-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? '儲存中...' : '儲存頁面'}
              </button>
              <button
                onClick={() => setEditingPage(null)}
                className="rounded-lg px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedPages.map((page) => {
            const label = page.title || PAGE_LABELS[page.slug] || page.slug;
            return (
              <div key={page.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <h3 className="truncate text-lg font-semibold text-slate-900">{label}</h3>
                    </div>
                    <p className="text-xs text-slate-500">/{page.slug}</p>
                    <p className="mt-2 text-sm text-slate-500">{page.meta_description || '尚無描述'}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      最後更新：{new Date(page.updated_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      page.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {page.is_published ? '已發布' : '草稿'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">{page.sections?.length || 0} 個區塊</span>
                  <button
                    onClick={() => startEdit(page)}
                    className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                    編輯
                  </button>
                  <button
                    onClick={() => deletePage(page)}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    刪除
                  </button>
                </div>
              </div>
            );
          })}
          {sortedPages.length === 0 && <p className="text-slate-500">尚無靜態頁面資料</p>}
        </div>
      )}
    </div>
  );
}

