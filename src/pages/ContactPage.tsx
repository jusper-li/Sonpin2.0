import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Mail, Phone, ChevronRight, Search, ReceiptText, ArrowRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import DeferredSiteFooter from '../components/DeferredSiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { useLanguage } from '../contexts/LanguageContext';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';

interface StaticPageData extends TranslatableStaticPage {}

interface SiteInfo {
  contact_email: string;
  contact_phone: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const { currentLanguage } = useLanguage();
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData | null>(null);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({ contact_email: '', contact_phone: '' });
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  useSEO({
    title: page?.title || '客服中心',
    description: page?.meta_description || '聯絡淞品土雞客服，取得訂購與售後協助。',
    keywords: '客服中心,聯絡淞品,訂購,售後,門市',
    schema: breadcrumbSchema([
      { name: '首頁', url: window.location.origin },
      { name: '客服中心', url: `${window.location.origin}/contact` },
    ]),
  });

  useEffect(() => {
    const loadPage = async () => {
      if (!isSupabaseContentEnabled) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('static_pages')
          .select('*')
          .eq('slug', 'contact')
          .eq('is_published', true)
          .maybeSingle();
        if (data) {
          setSourcePage(data as StaticPageData);
          setPage(data as StaticPageData);
        }
      } finally {
        setLoading(false);
      }
    };

    const loadSiteInfo = async () => {
      if (!isSupabaseContentEnabled) return;
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'footer')
          .maybeSingle();
        if (data?.setting_value) {
          setSiteInfo({
            contact_email: data.setting_value.contact_email || '',
            contact_phone: data.setting_value.contact_phone || '',
          });
        }
      } catch {
        setSiteInfo({ contact_email: '', contact_phone: '' });
      }
    };

    void loadPage();
    void loadSiteInfo();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!sourcePage) return;
      if (!shouldTranslateStaticPage(currentLanguage)) {
        setPage(sourcePage);
        return;
      }

      setTranslating(true);
      try {
        const translated = await translateStaticPage(sourcePage, currentLanguage);
        setPage(translated as StaticPageData);
      } catch {
        setPage(sourcePage);
      } finally {
        setTranslating(false);
      }
    };

    void run();
  }, [currentLanguage, sourcePage]);

  const sections = page?.sections || [];
  const intro = sections.find((section) => section.type === 'intro');
  const infoSections = sections.filter((section) => section.type === 'section');
  const serviceShortcuts = [
    {
      title: '訂單查詢',
      description: '非會員也可以直接查詢訂單狀態、進度與匯款資訊。',
      to: '/order-query',
      icon: Search,
    },
    {
      title: '匯款通知',
      description: '完成轉帳後，回到這裡填寫訂單編號與匯款資料通知我們。',
      to: '/remittance-notice',
      icon: ReceiptText,
    },
  ];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('請完整填寫姓名、Email、主旨與訊息內容。');
      return;
    }
    setSubmitted(true);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
        <SiteHeader />
        <main className="flex-1">
          <section className="container mx-auto px-6 py-24 text-stone-500">載入中...</section>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
        <SiteHeader />
        <main className="flex-1">
          <section className="container mx-auto px-6 py-24 text-stone-500">找不到客服中心內容。</section>
        </main>
        <DeferredSiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-[var(--sonpin-ink)] via-[var(--sonpin-primary-soft)] to-[var(--sonpin-primary)] pt-32 pb-20 text-[var(--sonpin-surface)]">
          <div className="container mx-auto px-6">
            <div className="mb-6 flex items-center gap-2 text-xs tracking-[0.1em] text-[var(--sonpin-primary-border)]">
              <Link to="/" className="transition-colors hover:text-[var(--sonpin-surface)]">
                首頁
              </Link>
              <ChevronRight size={12} />
              <span className="text-[var(--sonpin-background)]">客服中心</span>
            </div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--sonpin-primary-warm)]">Contact Us</p>
            <h1 className="mb-4 text-5xl font-light tracking-wide md:text-6xl">{page.title}</h1>
            <p className="max-w-2xl text-base font-light leading-relaxed text-[var(--sonpin-primary-border)]">
              {intro?.content || '如需訂購、門市資訊或售後協助，歡迎直接與我們聯絡。'}
            </p>
          </div>
        </section>

        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-16 md:grid-cols-5">
            <div className="space-y-8 md:col-span-2">
              {translating && (
                <div className="inline-flex items-center rounded-full border border-[var(--sonpin-primary-border)]/60 bg-[var(--sonpin-surface)]/70 px-3 py-1 text-[11px] tracking-[0.18em] text-[var(--sonpin-primary)]">
                  翻譯中
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--sonpin-background)]">
                  <Mail className="h-5 w-5 text-[var(--sonpin-primary)]" />
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">Email</p>
                  <a href={`mailto:${siteInfo.contact_email}`} className="font-light text-[var(--sonpin-ink)] transition-colors hover:text-[var(--sonpin-primary)]">
                    {siteInfo.contact_email || 'service@sonpin.tw'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--sonpin-background)]">
                  <Phone className="h-5 w-5 text-[var(--sonpin-primary)]" />
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">客服電話</p>
                  <a href={`tel:${siteInfo.contact_phone}`} className="font-light text-[var(--sonpin-ink)] transition-colors hover:text-[var(--sonpin-primary)]">
                    {siteInfo.contact_phone || '02-2338-0018'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--sonpin-background)]">
                  <Clock className="h-5 w-5 text-[var(--sonpin-primary)]" />
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">服務時間</p>
                  <p className="font-light text-[var(--sonpin-ink)]">週一至週日 上午 09:00 - 17:00</p>
                  <p className="text-sm font-light text-[var(--sonpin-primary-muted)]">實際營業時間請以門市公告為準</p>
                </div>
              </div>

              {infoSections.length > 0 && (
                <div className="space-y-6 border-t border-[var(--sonpin-primary-border)] pt-4">
                  {infoSections.map((section) => (
                    <div key={section.title}>
                      <h3 className="mb-2 text-sm font-medium text-[var(--sonpin-primary-soft)]">{section.title}</h3>
                      <p className="whitespace-pre-line text-sm leading-relaxed font-light text-[var(--sonpin-primary-muted)]">{section.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 border-t border-[var(--sonpin-primary-border)] pt-6">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--sonpin-primary-muted)]">Customer Service</p>
                  <h2 className="text-2xl font-light tracking-wide text-[var(--sonpin-ink)]">客服中心快速服務</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sonpin-primary-muted)]">
                    訂單查詢與匯款通知都集中在這裡，讓你可以更快完成後續流程。
                  </p>
                </div>

                <div className="grid gap-4">
                  {serviceShortcuts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="group flex items-center justify-between rounded-2xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] p-5 shadow-sm transition hover:border-[var(--sonpin-primary)] hover:bg-[var(--sonpin-background)]"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sonpin-background)] text-[var(--sonpin-primary)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-[var(--sonpin-ink)]">{item.title}</h3>
                            <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--sonpin-primary-muted)]">{item.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-[var(--sonpin-primary-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--sonpin-primary)]" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              {submitted ? (
                <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--sonpin-background)]">
                    <CheckCircle className="h-10 w-10 text-[var(--sonpin-primary)]" />
                  </div>
                  <h2 className="mb-3 text-2xl font-light text-[var(--sonpin-ink)]">已送出訊息</h2>
                  <p className="mb-8 max-w-sm leading-relaxed text-[var(--sonpin-primary-muted)]">
                    我們已收到您的訊息，若有需要會儘快透過 Email 與您聯繫。
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-sm font-light text-[var(--sonpin-primary)] hover:underline"
                  >
                    再送出一則
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">
                        姓名 <span className="text-[var(--sonpin-primary)]">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="請輸入姓名"
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">
                        Email <span className="text-[var(--sonpin-primary)]">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@email.com"
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">電話</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="02-1234-5678"
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">
                        主旨 <span className="text-[var(--sonpin-primary)]">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="請填寫主旨"
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">
                      訊息內容 <span className="text-[var(--sonpin-primary)]">*</span>
                    </label>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="請描述您的需求或問題"
                      className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--sonpin-ink)] px-8 py-4 text-sm font-medium text-[var(--sonpin-surface)] transition-colors hover:bg-[var(--sonpin-primary-soft)]"
                  >
                    送出訊息
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <DeferredSiteFooter />
    </div>
  );
}
