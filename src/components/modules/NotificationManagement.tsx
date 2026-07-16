import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, Mail, Pencil, RefreshCw, RotateCcw, Save, ShieldCheck, ShoppingCart, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DEFAULT_FOOTER_SETTINGS } from '../../data/homepageContent';

interface SiteSettingRow {
  id: string | number;
  setting_key: string;
  setting_value: any;
  updated_at?: string | null;
}

interface ContactNotificationTemplate {
  admin_subject: string;
  admin_title: string;
  admin_intro: string;
  admin_note: string;
  show_name: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_subject: boolean;
  show_message: boolean;
}

interface OrderNotificationTemplate {
  admin_subject: string;
  admin_title: string;
  admin_intro: string;
  admin_note: string;
  show_order_number: boolean;
  show_customer_name: boolean;
  show_customer_email: boolean;
  show_address: boolean;
  show_payment_method: boolean;
  show_items: boolean;
  show_totals: boolean;
  show_shipping: boolean;
}

interface RemittanceNotificationTemplate {
  admin_subject: string;
  admin_title: string;
  admin_intro: string;
  admin_note: string;
  show_order_number: boolean;
  show_remittance_amount: boolean;
  show_remitter_last5: boolean;
  show_order_total: boolean;
  show_customer_name: boolean;
  show_customer_email: boolean;
}

interface NotificationSettings {
  admin_email: string;
  admin_emails_text: string;
  contact_enabled: boolean;
  order_enabled: boolean;
  remittance_enabled: boolean;
  customer_copy_enabled: boolean;
  contact_template: ContactNotificationTemplate;
  order_template: OrderNotificationTemplate;
  remittance_template: RemittanceNotificationTemplate;
}

const NOTIFICATION_SETTING_KEY = 'notification_mail';
const FOOTER_SETTING_KEY = 'footer';

const DEFAULT_CONTACT_TEMPLATE: ContactNotificationTemplate = {
  admin_subject: 'Sonpin 聯絡表單：{{subject}}',
  admin_title: '有新的聯絡表單',
  admin_intro: '您收到一則來自客服中心的新訊息，以下為表單內容。',
  admin_note: '請盡快回覆並安排後續處理。',
  show_name: true,
  show_email: true,
  show_phone: true,
  show_subject: true,
  show_message: true,
};

const DEFAULT_ORDER_TEMPLATE: OrderNotificationTemplate = {
  admin_subject: 'Sonpin 新訂單通知：{{orderNumber}}',
  admin_title: '新訂單通知',
  admin_intro: '有顧客完成下單，以下為訂單摘要。',
  admin_note: '請確認出貨與後續聯絡資訊。',
  show_order_number: true,
  show_customer_name: true,
  show_customer_email: true,
  show_address: true,
  show_payment_method: true,
  show_items: true,
  show_totals: true,
  show_shipping: true,
};

const DEFAULT_REMITTANCE_TEMPLATE: RemittanceNotificationTemplate = {
  admin_subject: 'Sonpin 匯款通知：{{orderNumber}}',
  admin_title: '匯款通知',
  admin_intro: '顧客已回報匯款資訊，請盡快核對帳務。',
  admin_note: '若匯款金額或帳號末五碼有誤，請聯繫顧客確認。',
  show_order_number: true,
  show_remittance_amount: true,
  show_remitter_last5: true,
  show_order_total: true,
  show_customer_name: true,
  show_customer_email: true,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  admin_email: DEFAULT_FOOTER_SETTINGS.contact_email,
  admin_emails_text: DEFAULT_FOOTER_SETTINGS.contact_email,
  contact_enabled: true,
  order_enabled: true,
  remittance_enabled: true,
  customer_copy_enabled: true,
  contact_template: DEFAULT_CONTACT_TEMPLATE,
  order_template: DEFAULT_ORDER_TEMPLATE,
  remittance_template: DEFAULT_REMITTANCE_TEMPLATE,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailListSeparator = /[\n,;]+/;

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  if (typeof value === 'number') return value !== 0;
  return fallback;
};

const normalizeEmail = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const parseEmailList = (value: string) =>
  Array.from(
    new Set(
      value
        .split(emailListSeparator)
        .map((entry) => normalizeEmail(entry))
        .filter((entry) => Boolean(entry) && emailPattern.test(entry)),
    ),
  );

const collectInvalidEmails = (value: string) =>
  value
    .split(emailListSeparator)
    .map((entry) => normalizeEmail(entry))
    .filter((entry) => Boolean(entry) && !emailPattern.test(entry));

const formatEmailList = (emails: string[]) => emails.join('\n');

const normalizeTemplate = <T extends Record<string, unknown>>(value: unknown, fallback: T): T => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const result = { ...fallback } as T;

  (Object.keys(fallback) as Array<keyof T>).forEach((key) => {
    const fallbackValue = fallback[key];
    const currentValue = source[String(key)];
    if (typeof fallbackValue === 'boolean') {
      result[key] = normalizeBoolean(currentValue, fallbackValue) as T[keyof T];
    } else {
      result[key] = (typeof currentValue === 'string' && currentValue.trim() ? currentValue.trim() : fallbackValue) as T[keyof T];
    }
  });

  return result;
};

const templateTabs = [
  { id: 'general', label: '通知總覽' },
  { id: 'contact', label: '客服中心信件' },
  { id: 'order', label: '訂單通知信' },
  { id: 'remittance', label: '匯款通知信' },
] as const;

type TemplateTabId = (typeof templateTabs)[number]['id'];

const templateFieldOptions = {
  contact: [
    { key: 'show_name', label: '姓名', description: '顯示顧客姓名' },
    { key: 'show_email', label: 'Email', description: '顯示顧客 Email' },
    { key: 'show_phone', label: '電話', description: '顯示顧客電話' },
    { key: 'show_subject', label: '主旨', description: '顯示表單主旨' },
    { key: 'show_message', label: '訊息', description: '顯示留言內容' },
  ],
  order: [
    { key: 'show_order_number', label: '訂單編號', description: '顯示訂單編號' },
    { key: 'show_customer_name', label: '顧客姓名', description: '顯示顧客姓名' },
    { key: 'show_customer_email', label: '顧客 Email', description: '顯示顧客 Email' },
    { key: 'show_address', label: '收件地址', description: '顯示收件地址' },
    { key: 'show_payment_method', label: '付款方式', description: '顯示付款方式' },
    { key: 'show_items', label: '商品明細', description: '顯示商品清單' },
    { key: 'show_totals', label: '金額合計', description: '顯示商品小計與總額' },
    { key: 'show_shipping', label: '運費明細', description: '顯示運費與配送方式' },
  ],
  remittance: [
    { key: 'show_order_number', label: '訂單編號', description: '顯示訂單編號' },
    { key: 'show_remittance_amount', label: '匯款金額', description: '顯示匯款金額' },
    { key: 'show_remitter_last5', label: '匯款後五碼', description: '顯示匯款帳號後五碼' },
    { key: 'show_order_total', label: '訂單總額', description: '顯示訂單總額' },
    { key: 'show_customer_name', label: '顧客姓名', description: '顯示顧客姓名' },
    { key: 'show_customer_email', label: '顧客 Email', description: '顯示顧客 Email' },
  ],
} as const;

export default function NotificationManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TemplateTabId>('general');
  const [footerContactEmail, setFooterContactEmail] = useState(DEFAULT_FOOTER_SETTINGS.contact_email);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const adminEmails = useMemo(() => parseEmailList(settings.admin_emails_text), [settings.admin_emails_text]);
  const notificationEnabledCount = useMemo(
    () => Number(settings.contact_enabled) + Number(settings.order_enabled) + Number(settings.remittance_enabled),
    [settings.contact_enabled, settings.order_enabled, settings.remittance_enabled],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [notificationResponse, footerResponse] = await Promise.all([
        supabase.from('site_settings').select('id,setting_key,setting_value,updated_at').eq('setting_key', NOTIFICATION_SETTING_KEY).maybeSingle(),
        supabase.from('site_settings').select('id,setting_key,setting_value,updated_at').eq('setting_key', FOOTER_SETTING_KEY).maybeSingle(),
      ]);

      if (notificationResponse.error) throw notificationResponse.error;
      if (footerResponse.error) throw footerResponse.error;

      const notificationRow = notificationResponse.data as SiteSettingRow | null;
      const notificationValue = (notificationRow?.setting_value || {}) as Record<string, unknown>;
      const footerRow = footerResponse.data as SiteSettingRow | null;
      const footerValue = (footerRow?.setting_value || {}) as Record<string, unknown>;

      const rawEmails =
        Array.isArray(notificationValue.admin_emails)
          ? notificationValue.admin_emails.map((email) => normalizeEmail(email)).filter(Boolean).join('\n')
          : String(notificationValue.admin_emails || notificationValue.admin_email || footerValue.contact_email || DEFAULT_NOTIFICATION_SETTINGS.admin_email);
      const parsedEmails = parseEmailList(rawEmails);
      const adminEmail = parsedEmails[0] || String(notificationValue.admin_email || footerValue.contact_email || DEFAULT_NOTIFICATION_SETTINGS.admin_email).trim() || DEFAULT_NOTIFICATION_SETTINGS.admin_email;

      setSettings({
        admin_email: adminEmail,
        admin_emails_text: formatEmailList(parsedEmails.length > 0 ? parsedEmails : [adminEmail]),
        contact_enabled: normalizeBoolean(notificationValue.contact_enabled, DEFAULT_NOTIFICATION_SETTINGS.contact_enabled),
        order_enabled: normalizeBoolean(notificationValue.order_enabled, DEFAULT_NOTIFICATION_SETTINGS.order_enabled),
        remittance_enabled: normalizeBoolean(notificationValue.remittance_enabled, DEFAULT_NOTIFICATION_SETTINGS.remittance_enabled),
        customer_copy_enabled: normalizeBoolean(notificationValue.customer_copy_enabled, DEFAULT_NOTIFICATION_SETTINGS.customer_copy_enabled),
        contact_template: normalizeTemplate(notificationValue.contact_template, DEFAULT_CONTACT_TEMPLATE),
        order_template: normalizeTemplate(notificationValue.order_template, DEFAULT_ORDER_TEMPLATE),
        remittance_template: normalizeTemplate(notificationValue.remittance_template, DEFAULT_REMITTANCE_TEMPLATE),
      });

      setFooterContactEmail(String(footerValue.contact_email || adminEmail).trim() || adminEmail);
      setUpdatedAt(notificationRow?.updated_at || footerRow?.updated_at || null);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      setSettings(DEFAULT_NOTIFICATION_SETTINGS);
      setFooterContactEmail(DEFAULT_FOOTER_SETTINGS.contact_email);
      setUpdatedAt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    const nextEmails = parseEmailList(settings.admin_emails_text);
    const invalidEmails = collectInvalidEmails(settings.admin_emails_text);

    if (nextEmails.length === 0) {
      alert('請至少輸入一個通知信箱');
      return;
    }

    if (invalidEmails.length > 0) {
      alert(`以下信箱格式不正確：${invalidEmails.join('、')}`);
      return;
    }

    const nextEmail = settings.admin_email.trim() || nextEmails[0];
    if (!emailPattern.test(nextEmail)) {
      alert('請輸入正確的主要通知信箱');
      return;
    }

    setSaving(true);
    try {
      const notificationPayload: NotificationSettings & { admin_emails: string[] } = {
        admin_email: nextEmail,
        admin_emails_text: formatEmailList(nextEmails),
        admin_emails: nextEmails,
        contact_enabled: Boolean(settings.contact_enabled),
        order_enabled: Boolean(settings.order_enabled),
        remittance_enabled: Boolean(settings.remittance_enabled),
        customer_copy_enabled: Boolean(settings.customer_copy_enabled),
        contact_template: {
          admin_subject: settings.contact_template.admin_subject.trim(),
          admin_title: settings.contact_template.admin_title.trim(),
          admin_intro: settings.contact_template.admin_intro.trim(),
          admin_note: settings.contact_template.admin_note.trim(),
          show_name: Boolean(settings.contact_template.show_name),
          show_email: Boolean(settings.contact_template.show_email),
          show_phone: Boolean(settings.contact_template.show_phone),
          show_subject: Boolean(settings.contact_template.show_subject),
          show_message: Boolean(settings.contact_template.show_message),
        },
        order_template: {
          admin_subject: settings.order_template.admin_subject.trim(),
          admin_title: settings.order_template.admin_title.trim(),
          admin_intro: settings.order_template.admin_intro.trim(),
          admin_note: settings.order_template.admin_note.trim(),
          show_order_number: Boolean(settings.order_template.show_order_number),
          show_customer_name: Boolean(settings.order_template.show_customer_name),
          show_customer_email: Boolean(settings.order_template.show_customer_email),
          show_address: Boolean(settings.order_template.show_address),
          show_payment_method: Boolean(settings.order_template.show_payment_method),
          show_items: Boolean(settings.order_template.show_items),
          show_totals: Boolean(settings.order_template.show_totals),
          show_shipping: Boolean(settings.order_template.show_shipping),
        },
        remittance_template: {
          admin_subject: settings.remittance_template.admin_subject.trim(),
          admin_title: settings.remittance_template.admin_title.trim(),
          admin_intro: settings.remittance_template.admin_intro.trim(),
          admin_note: settings.remittance_template.admin_note.trim(),
          show_order_number: Boolean(settings.remittance_template.show_order_number),
          show_remittance_amount: Boolean(settings.remittance_template.show_remittance_amount),
          show_remitter_last5: Boolean(settings.remittance_template.show_remitter_last5),
          show_order_total: Boolean(settings.remittance_template.show_order_total),
          show_customer_name: Boolean(settings.remittance_template.show_customer_name),
          show_customer_email: Boolean(settings.remittance_template.show_customer_email),
        },
      };

      const footerPayload = {
        ...DEFAULT_FOOTER_SETTINGS,
        contact_email: nextEmail,
      };

      const [notificationExisting, footerExisting] = await Promise.all([
        supabase.from('site_settings').select('id').eq('setting_key', NOTIFICATION_SETTING_KEY).maybeSingle(),
        supabase.from('site_settings').select('id').eq('setting_key', FOOTER_SETTING_KEY).maybeSingle(),
      ]);

      if (notificationExisting.error) throw notificationExisting.error;
      if (footerExisting.error) throw footerExisting.error;

      if (notificationExisting.data?.id) {
        const { error } = await supabase.from('site_settings').update({ setting_value: notificationPayload }).eq('id', notificationExisting.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([{ setting_key: NOTIFICATION_SETTING_KEY, setting_value: notificationPayload }]);
        if (error) throw error;
      }

      if (footerExisting.data?.id) {
        const { error } = await supabase.from('site_settings').update({ setting_value: footerPayload }).eq('id', footerExisting.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([{ setting_key: FOOTER_SETTING_KEY, setting_value: footerPayload }]);
        if (error) throw error;
      }

      setSettings(notificationPayload);
      setFooterContactEmail(nextEmail);
      setUpdatedAt(new Date().toISOString());
      alert('通知信設定已更新');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      alert(`儲存通知信設定失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  const resetToFooterEmail = () => {
    setSettings((prev) => ({
      ...prev,
      admin_email: footerContactEmail || DEFAULT_FOOTER_SETTINGS.contact_email,
      admin_emails_text: footerContactEmail || DEFAULT_FOOTER_SETTINGS.contact_email,
    }));
  };

  if (loading) {
    return <div className="p-6">載入通知信設定中...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium tracking-[0.2em] text-amber-700">
            <Bell className="h-3.5 w-3.5" />
            NOTIFICATIONS
          </div>
          <h1 className="text-3xl font-bold text-slate-900">信件內容管理</h1>
          <p className="mt-2 text-slate-600">統一管理客服中心、訂單通知與匯款通知的信件內容，並支援多個通知收件信箱。</p>
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
            onClick={resetToFooterEmail}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            重設為頁尾聯絡信箱
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '儲存中…' : '儲存設定'}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold tracking-[0.2em] text-amber-700">信件內容入口</div>
            <p className="mt-1 text-sm text-amber-900">直接切換到客服中心、訂單通知與匯款通知的模板編輯區。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {templateTabs.map((tab) => (
              <button
                key={`quick-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id ? 'bg-slate-900 text-white' : 'border border-amber-300 bg-white text-slate-700 hover:bg-amber-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard icon={<Mail className="h-4 w-4" />} label="通知信箱" value={adminEmails.length > 0 ? `${adminEmails.length} 個信箱` : '-'} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="啟用通知" value={`${notificationEnabledCount} / 3`} />
        <StatCard icon={<ShoppingCart className="h-4 w-4" />} label="訂單通知" value={settings.order_enabled ? '啟用' : '停用'} />
        <StatCard icon={<MessageSquare className="h-4 w-4" />} label="顧客副本" value={settings.customer_copy_enabled ? '啟用' : '停用'} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {templateTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-900">通知設定</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">主要通知信箱 *</label>
                <input
                  type="email"
                  value={settings.admin_email}
                  onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="service@sonpin.tw"
                />
                <p className="mt-2 text-xs text-slate-500">這個信箱會作為主要收件人，也會同步到頁尾聯絡信箱。</p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">通知信收件人（可多筆，一行一個）</label>
                <textarea
                  value={settings.admin_emails_text}
                  onChange={(e) => setSettings({ ...settings, admin_emails_text: e.target.value })}
                  className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder={`service@sonpin.tw\nadmin@sonpin.tw`}
                />
                <p className="mt-2 text-xs text-slate-500">支援換行、逗號或分號分隔；送出後會同時寄給每一個信箱。</p>
              </div>

              <ToggleField title="客服中心通知" description="顧客從客服中心送出表單時，寄送通知信給管理員。" checked={settings.contact_enabled} onChange={(checked) => setSettings({ ...settings, contact_enabled: checked })} />
              <ToggleField title="訂單成立通知" description="顧客完成結帳後，寄送訂單通知信給管理員。" checked={settings.order_enabled} onChange={(checked) => setSettings({ ...settings, order_enabled: checked })} />
              <ToggleField title="匯款通知" description="顧客回報匯款資料後，寄送匯款通知信給管理員。" checked={settings.remittance_enabled} onChange={(checked) => setSettings({ ...settings, remittance_enabled: checked })} />
              <ToggleField title="寄送顧客副本" description="訂單與匯款通知同時寄送副本給顧客，方便留存。" checked={settings.customer_copy_enabled} onChange={(checked) => setSettings({ ...settings, customer_copy_enabled: checked })} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? '儲存中…' : '儲存通知設定'}
              </button>
              <span className="text-sm text-slate-500">更動後會同步更新通知設定與頁尾聯絡信箱。</span>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">目前收件清單</h3>
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="mb-2">頁尾聯絡信箱</div>
                <div className="break-all font-medium text-slate-900">{footerContactEmail || '-'}</div>
                <div className="mt-4 border-t border-dashed border-slate-200 pt-4 text-slate-600">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">通知收件人</div>
                  <div className="space-y-1 break-all text-slate-900">
                    {adminEmails.length > 0 ? adminEmails.map((email) => <div key={email}>{email}</div>) : <div>-</div>}
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">提醒</h3>
              <ul className="space-y-2 text-sm leading-6 text-slate-600">
                <li>若要加入更多收件人，請直接在上方欄位新增一行即可。</li>
                <li>模板內容會影響客服中心、訂單通知與匯款通知三種信件。</li>
              </ul>
            </section>
          </aside>
        </div>
      )}

      {activeTab === 'contact' && (
        <TemplateEditor
          title="客服中心信件模板"
          template={settings.contact_template}
          onChange={(template) => setSettings((prev) => ({ ...prev, contact_template: template }))}
          fieldOptions={templateFieldOptions.contact}
          preview={<ContactPreview template={settings.contact_template} />}
        />
      )}

      {activeTab === 'order' && (
        <TemplateEditor
          title="訂單通知信模板"
          template={settings.order_template}
          onChange={(template) => setSettings((prev) => ({ ...prev, order_template: template }))}
          fieldOptions={templateFieldOptions.order}
          preview={<OrderPreview template={settings.order_template} />}
        />
      )}

      {activeTab === 'remittance' && (
        <TemplateEditor
          title="匯款通知信模板"
          template={settings.remittance_template}
          onChange={(template) => setSettings((prev) => ({ ...prev, remittance_template: template }))}
          fieldOptions={templateFieldOptions.remittance}
          preview={<RemittancePreview template={settings.remittance_template} />}
        />
      )}
    </div>
  );
}

function TemplateEditor<T extends { admin_subject: string; admin_title: string; admin_intro: string; admin_note: string }>({
  title,
  template,
  onChange,
  fieldOptions,
  preview,
}: {
  title: string;
  template: T;
  onChange: (template: T) => void;
  fieldOptions: Array<{ key: keyof T; label: string; description: string }>;
  preview: ReactNode;
}) {
  const update = (key: keyof T, value: string | boolean) => {
    onChange({
      ...template,
      [key]: value,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Pencil className="h-5 w-5 text-slate-600" />
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">管理員主旨</label>
            <input
              value={template.admin_subject}
              onChange={(e) => update('admin_subject' as keyof T, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Sonpin 新訂單通知：{{orderNumber}}"
            />
            <p className="mt-2 text-xs text-slate-500">
              可使用變數：
              <code className="ml-1 rounded bg-slate-100 px-1 py-0.5">{'{{name}}'}</code>
              <code className="ml-1 rounded bg-slate-100 px-1 py-0.5">{'{{email}}'}</code>
              <code className="ml-1 rounded bg-slate-100 px-1 py-0.5">{'{{phone}}'}</code>
              <code className="ml-1 rounded bg-slate-100 px-1 py-0.5">{'{{subject}}'}</code>
              <code className="ml-1 rounded bg-slate-100 px-1 py-0.5">{'{{message}}'}</code>
              <code className="ml-1 rounded bg-slate-100 px-1 py-0.5">{'{{orderNumber}}'}</code>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">標題</label>
              <input
                value={template.admin_title}
                onChange={(e) => update('admin_title' as keyof T, e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">前言</label>
              <input
                value={template.admin_intro}
                onChange={(e) => update('admin_intro' as keyof T, e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">備註</label>
            <textarea
              value={template.admin_note}
              onChange={(e) => update('admin_note' as keyof T, e.target.value)}
              className="min-h-[110px] w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">顯示欄位</label>
            <div className="grid gap-3 md:grid-cols-2">
              {fieldOptions.map((field) => (
                <label key={String(field.key)} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={Boolean(template[field.key])}
                    onChange={(e) => update(field.key, e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{field.label}</div>
                    <p className="text-sm text-slate-600">{field.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">即時預覽</h3>
          {preview}
        </section>
      </aside>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </div>
      <div className="break-all text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ToggleField({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4" />
    </label>
  );
}

function ContactPreview({ template }: { template: ContactNotificationTemplate }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="mb-2 text-xs font-semibold tracking-[0.18em] text-amber-700">客服中心通知</div>
      <div className="text-lg font-bold text-slate-900">{template.admin_title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{template.admin_intro}</p>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        {template.show_name && <div>姓名：王小明</div>}
        {template.show_email && <div>Email：customer@example.com</div>}
        {template.show_phone && <div>電話：0912-345-678</div>}
        {template.show_subject && <div>主旨：產品諮詢</div>}
        {template.show_message && <div className="rounded-lg bg-white p-3 text-slate-600">請協助我確認商品配送時間。</div>}
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">{template.admin_note}</p>
    </div>
  );
}

function OrderPreview({ template }: { template: OrderNotificationTemplate }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="mb-2 text-xs font-semibold tracking-[0.18em] text-amber-700">訂單通知</div>
      <div className="text-lg font-bold text-slate-900">{template.admin_title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{template.admin_intro}</p>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        {template.show_order_number && <div>訂單編號：ORD-123456</div>}
        {template.show_customer_name && <div>顧客姓名：王小明</div>}
        {template.show_customer_email && <div>Email：customer@example.com</div>}
        {template.show_address && <div>收件地址：台北市中山區...</div>}
        {template.show_payment_method && <div>付款方式：銀行轉帳</div>}
        {template.show_items && <div className="rounded-lg bg-white p-3 text-slate-600">商品 A ×1、商品 B ×2</div>}
        {template.show_totals && <div>金額合計：NT$950</div>}
        {template.show_shipping && <div>配送方式：黑貓宅急便 / 運費 NT$100</div>}
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">{template.admin_note}</p>
    </div>
  );
}

function RemittancePreview({ template }: { template: RemittanceNotificationTemplate }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="mb-2 text-xs font-semibold tracking-[0.18em] text-amber-700">匯款通知</div>
      <div className="text-lg font-bold text-slate-900">{template.admin_title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{template.admin_intro}</p>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        {template.show_order_number && <div>訂單編號：ORD-123456</div>}
        {template.show_remittance_amount && <div>匯款金額：NT$950</div>}
        {template.show_remitter_last5 && <div>匯款帳號後五碼：12345</div>}
        {template.show_order_total && <div>訂單總額：NT$950</div>}
        {template.show_customer_name && <div>顧客姓名：王小明</div>}
        {template.show_customer_email && <div>Email：customer@example.com</div>}
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">{template.admin_note}</p>
    </div>
  );
}
