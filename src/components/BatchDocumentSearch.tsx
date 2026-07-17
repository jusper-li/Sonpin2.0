import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Search, ExternalLink } from 'lucide-react';
import { loadBatchDocuments, type BatchDocument } from '../lib/batchDocuments';
import { useLanguage } from '../contexts/LanguageContext';

const text = {
  'zh-TW': {
    badge: 'BATCH QUERY',
    title: '批號查詢',
    description: '輸入 PDF 檔名或批號關鍵字，即可搜尋相關文件。',
    placeholder: '請輸入檔名或批號',
    loading: '載入批號文件中...',
    results: '搜尋結果',
    empty: '找不到符合的批號文件。',
    open: '檢視 PDF',
    fileName: '檔名',
    note: '若您已取得批號文件名稱，直接輸入即可快速找到對應 PDF。',
  },
  en: {
    badge: 'BATCH QUERY',
    title: 'Batch Lookup',
    description: 'Search PDF filenames or batch keywords to find matching documents.',
    placeholder: 'Enter file name or batch keyword',
    loading: 'Loading batch documents...',
    results: 'Results',
    empty: 'No matching batch document was found.',
    open: 'Open PDF',
    fileName: 'File name',
    note: 'If you already know the document name, typing it will quickly find the matching PDF.',
  },
} as const;

type UILanguage = keyof typeof text;

export default function BatchDocumentSearch() {
  const { currentLanguage } = useLanguage();
  const lang = (currentLanguage in text ? currentLanguage : 'zh-TW') as UILanguage;
  const t = text[lang];

  const [documents, setDocuments] = useState<BatchDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const items = await loadBatchDocuments({ publishedOnly: true });
        setDocuments(items);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredDocuments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return documents;
    return documents.filter((item) =>
      [item.title, item.file_name, item.description].join(' ').toLowerCase().includes(keyword),
    );
  }, [documents, searchTerm]);

  return (
    <section id="batch-query" className="rounded-[2rem] border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)]/95 p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--sonpin-primary)]">{t.badge}</p>
          <h2 className="mt-2 text-2xl font-light tracking-wide text-[var(--sonpin-ink)]">{t.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--sonpin-primary-muted)]">{t.description}</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)] px-4 py-3 text-sm text-[var(--sonpin-primary-muted)]">
          <Search className="h-4 w-4" />
          <span>{documents.length}</span>
          <span>{t.results}</span>
        </div>
      </div>

      <div className="mb-5 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sonpin-primary-border)]" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t.placeholder}
            className="w-full rounded-2xl border border-[var(--sonpin-primary-border)] bg-white px-11 py-3 text-sm text-[var(--sonpin-ink)] outline-none transition focus:border-[var(--sonpin-primary)]"
          />
        </div>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-[var(--sonpin-primary-muted)]">{t.note}</p>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)] px-4 py-5 text-sm text-[var(--sonpin-primary-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t.loading}
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid gap-4">
          {filteredDocuments.map((document) => (
            <article key={document.id} className="rounded-2xl border border-[var(--sonpin-primary-border)] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--sonpin-background)] text-[var(--sonpin-primary)]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[var(--sonpin-ink)]">{document.title}</h3>
                    <p className="mt-1 text-sm text-[var(--sonpin-primary-muted)]">
                      {t.fileName}：{document.file_name}
                    </p>
                    {document.description && (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--sonpin-primary-muted)]">{document.description}</p>
                    )}
                  </div>
                </div>

                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)] px-4 py-2 text-sm text-[var(--sonpin-primary)] transition hover:border-[var(--sonpin-primary)] hover:bg-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.open}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--sonpin-primary-border)] bg-[var(--sonpin-background)] px-4 py-8 text-center text-sm text-[var(--sonpin-primary-muted)]">
          {t.empty}
        </div>
      )}
    </section>
  );
}
