import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, Loader2, Plus, RefreshCw, Save, Search, Trash2, Upload, X } from 'lucide-react';
import { BATCH_DOCUMENTS_BUCKET, loadBatchDocuments, type BatchDocument } from '../../lib/batchDocuments';
import { supabase } from '../../lib/supabase';

interface BatchDocumentFormState {
  title: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = (): BatchDocumentFormState => ({
  title: '',
  file_name: '',
  file_url: '',
  storage_path: '',
  description: '',
  is_active: true,
  sort_order: 0,
});

const normalizeFileName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();

export default function BatchDocumentManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<BatchDocument[]>([]);
  const [editingDocument, setEditingDocument] = useState<BatchDocument | null>(null);
  const [form, setForm] = useState<BatchDocumentFormState>(emptyForm());
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const items = await loadBatchDocuments({ publishedOnly: false });
      setDocuments(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredDocuments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return documents;
    return documents.filter((item) =>
      [item.title, item.file_name, item.description].join(' ').toLowerCase().includes(keyword),
    );
  }, [documents, searchTerm]);

  const openForm = (document?: BatchDocument) => {
    if (document) {
      setEditingDocument(document);
      setForm({
        title: document.title,
        file_name: document.file_name,
        file_url: document.file_url,
        storage_path: document.storage_path,
        description: document.description || '',
        is_active: document.is_active,
        sort_order: document.sort_order,
      });
    } else {
      setEditingDocument(null);
      setForm(emptyForm());
    }
  };

  const uploadPdf = async (file: File) => {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('請選擇 PDF 檔案');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const safeName = normalizeFileName(file.name.replace(/\.[^.]+$/, '')) || 'batch-document';
      const storagePath = `batch-documents/${Date.now()}-${safeName}.${fileExt}`;
      const { error } = await supabase.storage.from(BATCH_DOCUMENTS_BUCKET).upload(storagePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

      if (error) throw error;

      const { data } = supabase.storage.from(BATCH_DOCUMENTS_BUCKET).getPublicUrl(storagePath);
      setForm((current) => ({
        ...current,
        title: current.title || file.name.replace(/\.[^.]+$/, ''),
        file_name: file.name,
        file_url: data.publicUrl,
        storage_path: storagePath,
      }));
    } catch (error) {
      console.error('PDF upload failed:', error);
      alert(`PDF 上傳失敗：${error instanceof Error ? error.message : '請確認儲存桶權限設定'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadPdf(file);
    event.target.value = '';
  };

  const saveDocument = async () => {
    if (!form.title.trim()) {
      alert('請輸入文件標題');
      return;
    }
    if (!form.file_url.trim() || !form.storage_path.trim()) {
      alert('請先上傳 PDF 檔案');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        file_name: form.file_name.trim(),
        file_url: form.file_url.trim(),
        storage_path: form.storage_path.trim(),
        description: form.description.trim(),
        is_active: form.is_active,
        sort_order: Number.isFinite(Number(form.sort_order)) ? Number(form.sort_order) : 0,
      };

      if (editingDocument?.id) {
        const { error } = await supabase.from('batch_documents').update(payload).eq('id', editingDocument.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('batch_documents').insert([payload]);
        if (error) throw error;
      }

      setEditingDocument(null);
      setForm(emptyForm());
      await load();
      alert('批號文件已儲存');
    } catch (error) {
      console.error('Failed to save batch document:', error);
      alert(`儲存失敗：${error instanceof Error ? error.message : '請稍後再試'}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (document: BatchDocument) => {
    if (!confirm(`確定要刪除批號文件「${document.title}」嗎？`)) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('batch_documents').delete().eq('id', document.id);
      if (error) throw error;

      if (document.storage_path) {
        const { error: storageError } = await supabase.storage.from(BATCH_DOCUMENTS_BUCKET).remove([document.storage_path]);
        if (storageError) {
          console.warn('Failed to remove batch document file:', storageError);
        }
      }

      if (editingDocument?.id === document.id) {
        setEditingDocument(null);
        setForm(emptyForm());
      }
      await load();
    } catch (error) {
      console.error('Failed to delete batch document:', error);
      alert(`刪除失敗：${error instanceof Error ? error.message : '請稍後再試'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-500">載入批號文件管理中...</div>;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium tracking-[0.2em] text-slate-700">
            <FileText className="h-3.5 w-3.5" />
            BATCH DOCUMENTS
          </div>
          <h2 className="text-2xl font-bold text-slate-900">批號查詢管理</h2>
          <p className="mt-2 text-sm text-slate-600">上傳 PDF 批號文件，讓客服中心可依檔名直接搜尋對應結果。</p>
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
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            新增批號文件
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜尋標題、檔名或說明"
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div className="mt-3 text-xs text-slate-500">目前共有 {documents.length} 筆文件。</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-900">使用說明</p>
          <ul className="mt-2 space-y-2 leading-6">
            <li>1. 上傳 PDF 後，填寫標題與顯示說明。</li>
            <li>2. 前台客服中心可用檔名或關鍵字搜尋。</li>
            <li>3. 可啟用 / 停用文件控制前台是否顯示。</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              找不到符合條件的文件。
            </div>
          ) : (
            filteredDocuments.map((document) => (
              <div key={document.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{document.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${document.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {document.is_active ? '啟用中' : '停用中'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">檔名：{document.file_name}</p>
                      {document.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{document.description}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      開啟 PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => openForm(document)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDocument(document)}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{editingDocument ? '編輯批號文件' : '新增批號文件'}</h3>
            {editingDocument && (
              <button type="button" onClick={() => openForm()} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200" aria-label="關閉">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">標題 *</label>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="例如：2026-07 批號文件"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">PDF 檔案 *</label>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
                  <Upload className="h-4 w-4" />
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      上傳中
                    </>
                  ) : (
                    '選擇 PDF'
                  )}
                  <input type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
                </label>
                {form.file_url && (
                  <a href={form.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    <ExternalLink className="h-4 w-4" />
                    預覽 PDF
                  </a>
                )}
              </div>

              {form.file_name && (
                <p className="mt-2 text-xs text-slate-500">目前檔名：{form.file_name}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">說明</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="可填寫此批號文件的用途或查詢說明"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">排序</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                  />
                  前台顯示
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={saveDocument}
                disabled={saving || uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? '儲存中...' : '儲存文件'}
              </button>

              <button
                type="button"
                onClick={() => openForm()}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                清空
              </button>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs leading-6 text-slate-500">
              上傳後會自動存到 Supabase Storage 的 <code>{BATCH_DOCUMENTS_BUCKET}</code> bucket，前台可直接搜尋檔名。
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
