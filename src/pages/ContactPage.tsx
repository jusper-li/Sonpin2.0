import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, Mail, Phone, ReceiptText, Search, ChevronRight } from 'lucide-react';
import { isSupabaseContentEnabled, supabase, supabaseAnonKey, supabaseBaseUrl } from '../lib/supabase';
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

const uiText = {
  'zh-TW': {
    home: '首頁',
    contactCenter: '客服中心',
    contactCenterShort: '客服中心快速服務',
    contactCenterIntro: '訂單查詢與匯款通知都集中在這裡，讓你可以更快完成後續流程。',
    customerService: 'Customer Service',
    orderQueryTitle: '訂單查詢',
    orderQueryDesc: '非會員也可以直接查詢訂單狀態、進度與匯款資訊。',
    remittanceTitle: '匯款通知',
    remittanceDesc: '完成轉帳後，回到這裡填寫訂單編號與匯款資料通知我們。',
    loading: '載入中…',
    notFound: '找不到客服中心內容。',
    breadcrumb: '客服中心',
    lead: '淞品土雞專賣店提供客服、訂單與門市資訊，讓你更輕鬆完成聯繫與查詢。',
    translating: '翻譯中',
    email: 'Email',
    phone: '電話',
    hoursTitle: '服務時間',
    hours: '週一至週六 09:00 - 17:00',
    hoursNote: '週日與國定假日休息，若有急件可先透過 Email 聯繫。',
    messageSent: '已送出訊息',
    messageSentDesc: '我們已收到您的訊息，若有需要會儘快透過 Email 與您聯繫。',
    sendAnother: '再送出一則',
    name: '姓名',
    namePlaceholder: '請輸入姓名',
    emailLabel: 'Email',
    emailPlaceholder: 'you@email.com',
    phoneLabel: '電話',
    phonePlaceholder: '02-1234-5678',
    subject: '主旨',
    subjectPlaceholder: '請填寫主旨',
    message: '訊息內容',
    messagePlaceholder: '請描述您的需求或問題',
    submit: '送出訊息',
    validation: '請完整填寫姓名、Email、主旨與訊息內容。',
    homeAria: '回到首頁',
    serviceCardTitle: '客服中心快速服務',
  },
  en: {
    home: 'Home',
    contactCenter: 'Customer Service',
    contactCenterShort: 'Quick Service',
    contactCenterIntro: 'Order lookup and remittance notice are gathered here so you can finish the next step quickly.',
    customerService: 'Customer Service',
    orderQueryTitle: 'Order Inquiry',
    orderQueryDesc: 'Even non-members can check order status, progress, and remittance details directly.',
    remittanceTitle: 'Remittance Notice',
    remittanceDesc: 'After you complete the transfer, return here to submit the order number and remittance details.',
    loading: 'Loading…',
    notFound: 'Customer service content not found.',
    breadcrumb: 'Customer Service',
    lead: 'Songpin provides customer service, order, and store information so you can contact us and look up details more easily.',
    translating: 'Translating',
    email: 'Email',
    phone: 'Phone',
    hoursTitle: 'Service Hours',
    hours: 'Mon–Sat 09:00 - 17:00',
    hoursNote: 'Closed on Sundays and public holidays. For urgent matters, email us first.',
    messageSent: 'Message sent',
    messageSentDesc: 'We have received your message and will contact you by email if needed.',
    sendAnother: 'Send another',
    name: 'Name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Email',
    emailPlaceholder: 'you@email.com',
    phoneLabel: 'Phone',
    phonePlaceholder: '02-1234-5678',
    subject: 'Subject',
    subjectPlaceholder: 'Enter a subject',
    message: 'Message',
    messagePlaceholder: 'Tell us what you need or what problem you have',
    submit: 'Send message',
    validation: 'Please fill in your name, email, subject, and message.',
    homeAria: 'Back to home',
    serviceCardTitle: 'Quick Service',
  },
  ja: {
    home: 'ホーム',
    contactCenter: 'お問い合わせ',
    contactCenterShort: 'クイックサービス',
    contactCenterIntro: '注文確認と入金通知をここにまとめています。次の手続きを素早く完了できます。',
    customerService: 'Customer Service',
    orderQueryTitle: '注文確認',
    orderQueryDesc: '会員でなくても、注文状況・進捗・入金情報を直接確認できます。',
    remittanceTitle: '入金通知',
    remittanceDesc: 'お振り込み完了後、注文番号と入金情報を入力してお知らせください。',
    loading: '読み込み中…',
    notFound: 'お問い合わせ内容が見つかりません。',
    breadcrumb: 'お問い合わせ',
    lead: '淞品土雞專賣店では、問い合わせ・注文・店舗情報をまとめてご案内しています。',
    translating: '翻訳中',
    email: 'メール',
    phone: '電話',
    hoursTitle: '受付時間',
    hours: '月〜土 09:00 - 17:00',
    hoursNote: '日曜・祝日は休業です。お急ぎの場合はメールでご連絡ください。',
    messageSent: '送信しました',
    messageSentDesc: 'メッセージを受け取りました。必要に応じてメールでご連絡します。',
    sendAnother: 'もう一件送る',
    name: 'お名前',
    namePlaceholder: 'お名前を入力してください',
    emailLabel: 'メール',
    emailPlaceholder: 'you@email.com',
    phoneLabel: '電話番号',
    phonePlaceholder: '02-1234-5678',
    subject: '件名',
    subjectPlaceholder: '件名を入力してください',
    message: 'お問い合わせ内容',
    messagePlaceholder: 'ご要望やご質問をご記入ください',
    submit: '送信する',
    validation: 'お名前、メール、件名、お問い合わせ内容をご入力ください。',
    homeAria: 'ホームへ戻る',
    serviceCardTitle: 'クイックサービス',
  },
  ko: {
    home: '홈',
    contactCenter: '고객센터',
    contactCenterShort: '빠른 서비스',
    contactCenterIntro: '주문 조회와 입금 안내를 한곳에 모아, 다음 절차를 빠르게 진행할 수 있습니다.',
    customerService: 'Customer Service',
    orderQueryTitle: '주문 조회',
    orderQueryDesc: '비회원도 주문 상태, 진행 상황, 입금 정보를 바로 확인할 수 있습니다.',
    remittanceTitle: '입금 안내',
    remittanceDesc: '이체를 완료한 후 주문번호와 입금 정보를 입력해 알려주세요.',
    loading: '불러오는 중…',
    notFound: '고객센터 내용을 찾을 수 없습니다.',
    breadcrumb: '고객센터',
    lead: '淞品土雞專賣店의 고객센터에서는 문의, 주문, 매장 정보를 한곳에서 확인할 수 있습니다.',
    translating: '번역 중',
    email: '이메일',
    phone: '전화',
    hoursTitle: '운영 시간',
    hours: '월~토 09:00 - 17:00',
    hoursNote: '일요일 및 공휴일은 휴무입니다. 급한 문의는 이메일로 먼저 연락해 주세요.',
    messageSent: '메시지 전송 완료',
    messageSentDesc: '메시지를 받았습니다. 필요 시 이메일로 연락드리겠습니다.',
    sendAnother: '다시 보내기',
    name: '이름',
    namePlaceholder: '이름을 입력하세요',
    emailLabel: '이메일',
    emailPlaceholder: 'you@email.com',
    phoneLabel: '전화번호',
    phonePlaceholder: '02-1234-5678',
    subject: '제목',
    subjectPlaceholder: '제목을 입력하세요',
    message: '문의 내용',
    messagePlaceholder: '요청 사항이나 문제를 자세히 적어주세요',
    submit: '메시지 보내기',
    validation: '이름, 이메일, 제목, 문의 내용을 모두 입력해 주세요.',
    homeAria: '홈으로 이동',
    serviceCardTitle: '빠른 서비스',
  },
} as const;

type UILanguage = keyof typeof uiText;

export default function ContactPage() {
  const { currentLanguage } = useLanguage();
  const lang = (currentLanguage in uiText ? currentLanguage : 'zh-TW') as UILanguage;
  const t = uiText[lang];

  const [sourcePage, setSourcePage] = useState<StaticPageData | null>(null);
  const [page, setPage] = useState<StaticPageData | null>(null);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({ contact_email: '', contact_phone: '' });
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  const serviceShortcuts = useMemo(
    () => [
      {
        title: t.orderQueryTitle,
        description: t.orderQueryDesc,
        to: '/order-query',
        icon: Search,
      },
      {
        title: t.remittanceTitle,
        description: t.remittanceDesc,
        to: '/remittance-notice',
        icon: ReceiptText,
      },
    ],
    [t],
  );

  useSEO({
    title: page?.title || t.contactCenter,
    description: page?.meta_description || t.lead,
    keywords: t.contactCenter,
    schema: breadcrumbSchema([
      { name: t.home, url: window.location.origin },
      { name: t.contactCenter, url: `${window.location.origin}/contact` },
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError(t.validation);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      };

      const inquiryInsert = supabase.from('contact_inquiries').insert([
        {
          ...payload,
          status: 'pending',
        },
      ]);

      const emailSend = fetch(`${supabaseBaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          authorization: `Bearer ${supabaseAnonKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          type: 'contact',
          data: payload,
        }),
      });

      const [inquiryResult, emailResponse] = await Promise.all([inquiryInsert, emailSend]);
      if (inquiryResult.error) throw inquiryResult.error;

      const emailPayload = await emailResponse.json().catch(() => null);
      if (!emailResponse.ok || emailPayload?.error) {
        throw new Error(emailPayload?.message || emailPayload?.error || '信件寄送失敗');
      }

      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '送出失敗，請稍後再試');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--sonpin-background)]">
        <SiteHeader />
        <main className="flex-1">
          <section className="container mx-auto px-6 py-24 text-stone-500">{t.loading}</section>
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
          <section className="container mx-auto px-6 py-24 text-stone-500">{t.notFound}</section>
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
                {t.home}
              </Link>
              <ChevronRight size={12} />
              <span className="text-[var(--sonpin-background)]">{t.breadcrumb}</span>
            </div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--sonpin-primary-warm)]">Contact Us</p>
            <h1 className="mb-4 text-5xl font-light tracking-wide md:text-6xl">{page.title || t.contactCenter}</h1>
            <p className="max-w-2xl text-base font-light leading-relaxed text-[var(--sonpin-primary-border)]">
              {intro?.content || t.lead}
            </p>
          </div>
        </section>

        <div className="container mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-16 md:grid-cols-5">
            <div className="space-y-8 md:col-span-2">
              {translating && (
                <div className="inline-flex items-center rounded-full border border-[var(--sonpin-primary-border)]/60 bg-[var(--sonpin-surface)]/70 px-3 py-1 text-[11px] tracking-[0.18em] text-[var(--sonpin-primary)]">
                  {t.translating}
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--sonpin-background)]">
                  <Mail className="h-5 w-5 text-[var(--sonpin-primary)]" />
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">{t.email}</p>
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
                  <p className="mb-1 text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">{t.phone}</p>
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
                  <p className="mb-1 text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">{t.hoursTitle}</p>
                  <p className="font-light text-[var(--sonpin-ink)]">{t.hours}</p>
                  <p className="text-sm font-light text-[var(--sonpin-primary-muted)]">{t.hoursNote}</p>
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
                  <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--sonpin-primary-muted)]">{t.customerService}</p>
                  <h2 className="text-2xl font-light tracking-wide text-[var(--sonpin-ink)]">{t.serviceCardTitle}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sonpin-primary-muted)]">{t.contactCenterIntro}</p>
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
                  <h2 className="mb-3 text-2xl font-light text-[var(--sonpin-ink)]">{t.messageSent}</h2>
                  <p className="mb-8 max-w-sm leading-relaxed text-[var(--sonpin-primary-muted)]">{t.messageSentDesc}</p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-sm font-light text-[var(--sonpin-primary)] hover:underline"
                  >
                    {t.sendAnother}
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
                        {t.name} <span className="text-[var(--sonpin-primary)]">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder={t.namePlaceholder}
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">
                        {t.emailLabel} <span className="text-[var(--sonpin-primary)]">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder={t.emailPlaceholder}
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">{t.phoneLabel}</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder={t.phonePlaceholder}
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">
                        {t.subject} <span className="text-[var(--sonpin-primary)]">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder={t.subjectPlaceholder}
                        className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-[var(--sonpin-primary-muted)]">
                      {t.message} <span className="text-[var(--sonpin-primary)]">*</span>
                    </label>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder={t.messagePlaceholder}
                      className="w-full rounded-xl border border-[var(--sonpin-primary-border)] bg-[var(--sonpin-surface)] px-4 py-3 font-light text-[var(--sonpin-ink)] outline-none transition-all placeholder:text-[var(--sonpin-primary-border)] focus:border-transparent focus:ring-2 focus:ring-[var(--sonpin-primary-warm)]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--sonpin-ink)] px-8 py-4 text-sm font-medium text-[var(--sonpin-surface)] transition-colors hover:bg-[var(--sonpin-primary-soft)]"
                  >
                    {t.submit}
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
