import { useEffect, useMemo, useState } from 'react';
import { Bell, ExternalLink, Eye, Mail, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BatchDocumentManagement from './BatchDocumentManagement';

type PageSection = {
  type: 'intro' | 'section';
  title: string;
  content: string;
};

type StaticPageRow = {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  sections: PageSection[];
  is_published: boolean;
  updated_at: string;
};

type ContactInquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

type SectionEditorRow = {
  type: PageSection['type'];
  title: string;
  content: string;
};

const CONTACT_SLUG = 'contact';

const defaultSections = (): SectionEditorRow[] => [
  {
    type: 'intro',
    title: '歡迎與我們聯繫',
    content: '無論是產品詢問、門市位置、企業合作或售後協助，都歡迎透過客服中心與我們聯絡。',
  },
  {
    type: 'section',
    title: '聯絡資訊',
    content: '電話：02-2338-0018\nEmail：service@sonpin.tw\n服務時間：週一至週日 09:00 - 17:00',
  },
  {
    type: 'section',
    title: '匯款資訊',
    content: '銀行：永豐銀行 萬華分行\n帳號：105-001-0014900-4\n戶名：淞品生技股份有限公司',
  },
  {
    type: 'section',
    title: '客服提醒',
    content: '若有緊急問題，請直接致電客服中心；若為訂單與匯款相關問題，也可使用訂單查詢與匯款通知功能。',
  },
];

const pageToRows = (sections: PageSection[]): SectionEditorRow[] =>
  (sections?.length ? sections : defaultSections()).map((section) => ({
    type: section.type,
    title: section.title || '',
    content: section.content || '',
  }));

const rowsToSections = (rows: SectionEditorRow[]): PageSection[] =>
  rows
    .map((row) => ({
      type: row.type,
      title: row.title.trim(),
      content: row.content.trim(),
    }))
    .filter((section) => section.title || section.content);

export default function ContactCenterManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<StaticPageRow | null>(null);
  const [rows, setRows] = useState<SectionEditorRow[]>(defaultSections());
  const [search, setSearch] = useState('');
  const [inquiries, setInquiries] = useState<ContactInquiryRow[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiryRow | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pageResponse, inquiryResponse] = await Promise.all([
        supabase
          .from('static_pages')
          .select('id,slug,title,meta_description,sections,is_published,updated_at')
          .eq('slug', CONTACT_SLUG)
          .maybeSingle(),
        supabase
          .from('contact_inquiries')
          .select('id,name,email,phone,subject,message,status,created_at')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (pageResponse.error) throw pageResponse.error;
      if (inquiryResponse.error) throw inquiryResponse.error;

      const page = pageResponse.data as StaticPageRow | null;
      if (page) {
        setEditing(page);
        setRows(pageToRows(page.sections));
        setUpdatedAt(page.updated_at || null);
      } else {
        setEditing({
          id: '',
          slug: CONTACT_SLUG,
          title: '客服中心',
          meta_description: '聯絡淞品土雞客服，取得訂購與售後協助。',
          sections: defaultSections(),
          is_published: true,
          updated_at: '',
        });
        setRows(defaultSections());
        setUpdatedAt(null);
      }

      setInquiries((inquiryResponse.data || []) as ContactInquiryRow[]);
    } catch (error) {
      console.error('Failed to load contact center data:', error);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredInquiries = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return inquiries;
    return inquiries.filter((item) =>
      [item.name, item.email, item.phone || '', item.subject, item.message, item.status].join(' ').toLowerCase().includes(keyword),
    );
  }, [inquiries, search]);

  const updateRow = (index: number, field: keyof SectionEditorRow, value: string) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { type: 'section', title: '', content: '' }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const savePage = async () => {
    if (!editing) return;
    const payload = {
      title: editing.title.trim() || '客服中心',
      meta_description: editing.meta_description.trim(),
      sections: rowsToSections(rows),
      is_published: editing.is_published,
      updated_at: new Date().toISOString(),
    };

    if (!payload.title) {
      alert('請輸入客服中心標題');
      return;
    }

    setSaving(true);
    try {
      const { data: existing, error: existingError } = await supabase
        .from('static_pages')
        .select('id')
        .eq('slug', CONTACT_SLUG)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing?.id) {
        const { error } = await supabase.from('static_pages').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('static_pages').insert([
          {
            slug: CONTACT_SLUG,
            ...payload,
          },
        ]);
        if (error) throw error;
      }

      await load();
      alert('客服中心內容已更新');
    } catch (error) {
      console.error('Failed to save contact center page:', error);
      alert(`儲存失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  const updateInquiryStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('contact_inquiries').update({ status }).eq('id', id);
      if (error) throw error;
      setInquiries((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (error) {
      console.error('Failed to update inquiry status:', error);
      alert('更新詢問狀態失敗');
    }
  };

  if (loading) {
    return <div className="p-6">載入客服中心管理中...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium tracking-[0.2em] text-blue-700">
            <Bell className="h-3.5 w-3.5" />
            CUSTOMER SERVICE
          </div>
          <h1 className="text-3xl font-bold text-slate-900">客服中心管理</h1>
          <p className="mt-2 text-slate-600">這裡可以管理客服中心頁面內容，並查看顧客送出的聯絡詢問。</p>
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
            onClick={savePage}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '儲存中...' : '儲存客服中心'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">頁面設定</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${editing?.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {editing?.is_published ? '已發佈' : '草稿'}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">頁面標題</label>
                <input
                  type="text"
                  value={editing?.title || ''}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">SEO 描述</label>
                <input
                  type="text"
                  value={editing?.meta_description || ''}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, meta_description: e.target.value } : prev))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(editing?.is_published)}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, is_published: e.target.checked } : prev))}
                />
                發佈客服中心頁面
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">頁面內容</h2>
                <p className="text-sm text-slate-500">可編輯客服中心頁面的區塊、標題與文字。</p>
              </div>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                新增區塊
              </button>
            </div>

            <div className="space-y-4">
              {rows.map((row, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <select
                        value={row.type}
                        onChange={(e) => updateRow(index, 'type', e.target.value as PageSection['type'])}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                      >
                        <option value="intro">簡介區</option>
                        <option value="section">內容區</option>
                      </select>
                      <span className="text-xs text-slate-400">區塊 {index + 1}</span>
                    </div>
                    <button type="button" onClick={() => removeRow(index)} className="text-sm text-rose-600 hover:text-rose-700">
                      <Trash2 className="inline-block h-4 w-4" />
                      刪除
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => updateRow(index, 'title', e.target.value)}
                      placeholder="標題"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                    <textarea
                      value={row.content}
                      onChange={(e) => updateRow(index, 'content', e.target.value)}
                      rows={5}
                      placeholder="內容，支援換行"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">客服詢問紀錄</h2>
                <p className="text-sm text-slate-500">顧客從客服中心送出的訊息會顯示在這裡。</p>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜尋姓名 / Email / 主旨"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="divide-y divide-slate-200">
                {filteredInquiries.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">目前沒有客服詢問。</div>
                ) : (
                  filteredInquiries.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedInquiry(item)}
                      className="block w-full bg-white p-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{item.subject}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {item.name} · {item.email}
                          </div>
                          <div className="mt-1 line-clamp-2 text-sm text-slate-600">{item.message}</div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.status === 'closed'
                              ? 'bg-slate-100 text-slate-600'
                              : item.status === 'replied'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.status === 'closed' ? '已結案' : item.status === 'replied' ? '已回覆' : '待處理'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
          <BatchDocumentManagement />
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">預覽</h3>
            <div className="space-y-4 rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] p-5 text-sm">
              <p className="text-xs tracking-[0.25em] text-[var(--sonpin-primary)] uppercase">Customer Service</p>
              {rowsToSections(rows).map((section, index) => (
                <div key={`${section.title}-${index}`} className="space-y-2">
                  <h4 className="text-sm font-semibold text-[var(--sonpin-ink)]">{section.title || '未命名區塊'}</h4>
                  <p className="whitespace-pre-line text-sm leading-7 text-[var(--sonpin-primary-muted)]">{section.content || '尚未填寫內容'}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">回到前台</h3>
            <a
              href="/contact"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              開啟客服中心頁
            </a>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">詢問詳情</h3>
            {selectedInquiry ? (
              <div className="space-y-3 text-sm text-slate-600">
                <div>
                  <div className="text-xs text-slate-400">姓名</div>
                  <div className="font-medium text-slate-900">{selectedInquiry.name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Email</div>
                  <div className="font-medium text-slate-900">{selectedInquiry.email}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">電話</div>
                  <div className="font-medium text-slate-900">{selectedInquiry.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">主旨</div>
                  <div className="font-medium text-slate-900">{selectedInquiry.subject}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">內容</div>
                  <div className="whitespace-pre-line rounded-lg bg-slate-50 p-3 leading-7 text-slate-700">{selectedInquiry.message}</div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => updateInquiryStatus(selectedInquiry.id, 'pending')}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    設為待處理
                  </button>
                  <button
                    type="button"
                    onClick={() => updateInquiryStatus(selectedInquiry.id, 'replied')}
                    className="rounded-lg border border-emerald-300 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    設為已回覆
                  </button>
                  <button
                    type="button"
                    onClick={() => updateInquiryStatus(selectedInquiry.id, 'closed')}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    設為已結案
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">點選左側一筆詢問即可查看詳情。</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
