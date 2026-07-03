import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Mail, Phone, ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useSEO } from '../hooks/useSEO';
import { breadcrumbSchema } from '../utils/schemaMarkup';
import { useLanguage } from '../contexts/LanguageContext';
import { shouldTranslateStaticPage, translateStaticPage, type TranslatableStaticPage } from '../lib/staticPageTranslation';
import { getStaticPageFallback } from '../data/staticPages';

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
  const { currentLanguage, t } = useLanguage();
  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData | null>(null);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({ contact_email: 'service@sonpin.tw', contact_phone: '02-2338-0018' });
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  useSEO({
    title: '客服中心',
    description: page?.meta_description || '淞品土雞專賣店客服、聯絡與匯款資訊。',
    keywords: '客服中心,聯絡淞品,淞品土雞,萬華,滴雞精',
    schema: breadcrumbSchema([
      { name: '首頁', url: window.location.origin },
      { name: '客服中心', url: `${window.location.origin}/contact` },
    ]),
  });

  useEffect(() => {
    const loadPage = async () => {
      if (!isSupabaseContentEnabled) {
        const fallback = getStaticPageFallback('contact');
        if (fallback) {
          setPage({
            slug: fallback.slug,
            title: fallback.title,
            meta_description: fallback.meta_description,
            sections: fallback.sections,
            updated_at: fallback.updated_at,
          });
        }
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
        } else {
          const fallback = getStaticPageFallback('contact');
          if (fallback) {
            setPage({
              slug: fallback.slug,
              title: fallback.title,
              meta_description: fallback.meta_description,
              sections: fallback.sections,
              updated_at: fallback.updated_at,
            });
          }
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
            contact_email: data.setting_value.contact_email || 'service@sonpin.tw',
            contact_phone: data.setting_value.contact_phone || '02-2338-0018',
          });
        }
      } catch {
        setSiteInfo({ contact_email: 'service@sonpin.tw', contact_phone: '02-2338-0018' });
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('請填寫姓名、Email、主旨與訊息內容。');
      return;
    }
    setSubmitted(true);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee]">
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-[#2b221d] via-[#5f4636] to-[#8e6448] pt-32 pb-20 text-[#fffaf2]">
          <div className="container mx-auto px-6">
            <div className="mb-6 flex items-center gap-2 text-xs tracking-[0.1em] text-[#eadfd1]">
              <Link to="/" className="transition-colors hover:text-[#fffaf2]">
                首頁
              </Link>
              <ChevronRight size={12} />
              <span className="text-[#f4ecdf]">客服中心</span>
            </div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#cfa87a]">Contact Us</p>
            <h1 className="mb-4 text-5xl font-light tracking-wide md:text-6xl">客服中心</h1>
            <p className="max-w-2xl text-base leading-relaxed font-light text-[#eadfd1]">
              {intro?.content || '如需訂購、確認匯款或詢問門市與商品資訊，歡迎與我們聯絡。'}
            </p>
          </div>
        </section>

        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-16 md:grid-cols-5">
            <div className="space-y-8 md:col-span-2">
              {translating && (
                <div className="inline-flex items-center rounded-full border border-[#eadfd1]/60 bg-[#fffaf2]/70 px-3 py-1 text-[11px] tracking-[0.18em] text-[#8e6448]">
                  翻譯中
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#f4ecdf]">
                  <Mail className="h-5 w-5 text-[#8e6448]" />
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-[#9f8a7b]">Email</p>
                  <a href={`mailto:${siteInfo.contact_email}`} className="font-light text-[#2b221d] transition-colors hover:text-[#8e6448]">
                    {siteInfo.contact_email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#f4ecdf]">
                  <Phone className="h-5 w-5 text-[#8e6448]" />
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-[#9f8a7b]">訂購專線</p>
                  <a href={`tel:${siteInfo.contact_phone}`} className="font-light text-[#2b221d] transition-colors hover:text-[#8e6448]">
                    {siteInfo.contact_phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#f4ecdf]">
                  <Clock className="h-5 w-5 text-[#8e6448]" />
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-[#9f8a7b]">服務時間</p>
                  <p className="font-light text-[#2b221d]">週二至週日上午 09:00 - 17:00</p>
                  <p className="text-sm font-light text-[#9f8a7b]">週一公休</p>
                </div>
              </div>

              {infoSections.length > 0 && (
                <div className="space-y-6 border-t border-[#eadfd1] pt-4">
                  {infoSections.map((section) => (
                    <div key={section.title}>
                      <h3 className="mb-2 text-sm font-medium text-[#6d4f3d]">{section.title}</h3>
                      <p className="whitespace-pre-line text-sm leading-relaxed font-light text-[#9f8a7b]">{section.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-3">
              {submitted ? (
                <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f4ecdf]">
                    <CheckCircle className="h-10 w-10 text-[#8e6448]" />
                  </div>
                  <h2 className="mb-3 text-2xl font-light text-[#2b221d]">已送出訊息</h2>
                  <p className="mb-8 max-w-sm leading-relaxed text-[#9f8a7b]">
                    我們已收到您的聯繫表單，若有需要會盡快回覆您。
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-sm font-light text-[#8e6448] hover:underline"
                  >
                    重新填寫
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
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[#9f8a7b]">
                        姓名 <span className="text-[#a97a4f]">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="請輸入姓名"
                        className="w-full rounded-xl border border-[#eadfd1] bg-[#fffaf2] px-4 py-3 font-light text-[#2b221d] outline-none transition-all placeholder:text-[#d8c9ba] focus:border-transparent focus:ring-2 focus:ring-[#cfa87a]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[#9f8a7b]">
                        Email <span className="text-[#a97a4f]">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@email.com"
                        className="w-full rounded-xl border border-[#eadfd1] bg-[#fffaf2] px-4 py-3 font-light text-[#2b221d] outline-none transition-all placeholder:text-[#d8c9ba] focus:border-transparent focus:ring-2 focus:ring-[#cfa87a]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[#9f8a7b]">電話</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="02-1234-5678"
                        className="w-full rounded-xl border border-[#eadfd1] bg-[#fffaf2] px-4 py-3 font-light text-[#2b221d] outline-none transition-all placeholder:text-[#d8c9ba] focus:border-transparent focus:ring-2 focus:ring-[#cfa87a]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[#9f8a7b]">
                        主旨 <span className="text-[#a97a4f]">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="請輸入聯絡主旨"
                        className="w-full rounded-xl border border-[#eadfd1] bg-[#fffaf2] px-4 py-3 font-light text-[#2b221d] outline-none transition-all placeholder:text-[#d8c9ba] focus:border-transparent focus:ring-2 focus:ring-[#cfa87a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-[#9f8a7b]">
                      訊息內容 <span className="text-[#a97a4f]">*</span>
                    </label>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="請輸入想詢問的內容"
                      className="w-full rounded-xl border border-[#eadfd1] bg-[#fffaf2] px-4 py-3 font-light text-[#2b221d] outline-none transition-all placeholder:text-[#d8c9ba] focus:border-transparent focus:ring-2 focus:ring-[#cfa87a]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2b221d] px-8 py-4 text-sm font-medium text-[#fffaf2] transition-colors hover:bg-[#5f4636]"
                  >
                    送出訊息
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
