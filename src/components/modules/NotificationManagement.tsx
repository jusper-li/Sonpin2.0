import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, Mail, RefreshCw, Save, ShieldCheck, ShoppingCart, MessageSquare, RotateCcw, Pencil } from 'lucide-react';
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

interface NotificationSettings {
  admin_email: string;
  contact_enabled: boolean;
  order_enabled: boolean;
  remittance_enabled: boolean;
  customer_copy_enabled: boolean;
  contact_template: ContactNotificationTemplate;
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

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  admin_email: DEFAULT_FOOTER_SETTINGS.contact_email,
  contact_enabled: true,
  order_enabled: true,
  remittance_enabled: true,
  customer_copy_enabled: true,
  contact_template: DEFAULT_CONTACT_TEMPLATE,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  if (typeof value === 'number') return value !== 0;
  return fallback;
};

const normalizeTemplate = (value: unknown): ContactNotificationTemplate => {
  const template = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

  return {
    admin_subject: String(template.admin_subject || DEFAULT_CONTACT_TEMPLATE.admin_subject).trim() || DEFAULT_CONTACT_TEMPLATE.admin_subject,
    admin_title: String(template.admin_title || DEFAULT_CONTACT_TEMPLATE.admin_title).trim() || DEFAULT_CONTACT_TEMPLATE.admin_title,
    admin_intro: String(template.admin_intro || DEFAULT_CONTACT_TEMPLATE.admin_intro).trim() || DEFAULT_CONTACT_TEMPLATE.admin_intro,
    admin_note: String(template.admin_note || DEFAULT_CONTACT_TEMPLATE.admin_note).trim() || DEFAULT_CONTACT_TEMPLATE.admin_note,
    show_name: normalizeBoolean(template.show_name, DEFAULT_CONTACT_TEMPLATE.show_name),
    show_email: normalizeBoolean(template.show_email, DEFAULT_CONTACT_TEMPLATE.show_email),
    show_phone: normalizeBoolean(template.show_phone, DEFAULT_CONTACT_TEMPLATE.show_phone),
    show_subject: normalizeBoolean(template.show_subject, DEFAULT_CONTACT_TEMPLATE.show_subject),
    show_message: normalizeBoolean(template.show_message, DEFAULT_CONTACT_TEMPLATE.show_message),
  };
};

const templateFieldOptions = [
  { key: 'show_name', label: '姓名', description: '顯示顧客姓名' },
  { key: 'show_email', label: 'Email', description: '顯示顧客電子信箱' },
  { key: 'show_phone', label: '電話', description: '顯示顧客聯絡電話' },
  { key: 'show_subject', label: '主旨', description: '顯示來信主旨' },
  { key: 'show_message', label: '內容', description: '顯示來信內容' },
] as const;

export default function NotificationManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [footerContactEmail, setFooterContactEmail] = useState(DEFAULT_FOOTER_SETTINGS.contact_email);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const notificationEnabledCount = useMemo(
    () => Number(settings.contact_enabled) + Number(settings.order_enabled) + Number(settings.remittance_enabled),
    [settings.contact_enabled, settings.order_enabled, settings.remittance_enabled],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [notificationResponse, footerResponse] = await Promise.all([
        supabase
          .from('site_settings')
          .select('id,setting_key,setting_value,updated_at')
          .eq('setting_key', NOTIFICATION_SETTING_KEY)
          .maybeSingle(),
        supabase
          .from('site_settings')
          .select('id,setting_key,setting_value,updated_at')
          .eq('setting_key', FOOTER_SETTING_KEY)
          .maybeSingle(),
      ]);

      if (notificationResponse.error) throw notificationResponse.error;
      if (footerResponse.error) throw footerResponse.error;

      const notificationRow = notificationResponse.data as SiteSettingRow | null;
      const notificationValue = (notificationRow?.setting_value || {}) as Record<string, unknown>;
      const footerRow = footerResponse.data as SiteSettingRow | null;
      const footerValue = (footerRow?.setting_value || {}) as Record<string, unknown>;

      const adminEmail = String(
        notificationValue.admin_email || footerValue.contact_email || DEFAULT_NOTIFICATION_SETTINGS.admin_email,
      ).trim() || DEFAULT_NOTIFICATION_SETTINGS.admin_email;

      setSettings({
        admin_email: adminEmail,
        contact_enabled: normalizeBoolean(notificationValue.contact_enabled, DEFAULT_NOTIFICATION_SETTINGS.contact_enabled),
        order_enabled: normalizeBoolean(notificationValue.order_enabled, DEFAULT_NOTIFICATION_SETTINGS.order_enabled),
        remittance_enabled: normalizeBoolean(notificationValue.remittance_enabled, DEFAULT_NOTIFICATION_SETTINGS.remittance_enabled),
        customer_copy_enabled: normalizeBoolean(notificationValue.customer_copy_enabled, DEFAULT_NOTIFICATION_SETTINGS.customer_copy_enabled),
        contact_template: normalizeTemplate(notificationValue.contact_template),
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

  const updateTemplate = (key: keyof ContactNotificationTemplate, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      contact_template: {
        ...prev.contact_template,
        [key]: value,
      },
    }));
  };

  const save = async () => {
    const nextEmail = settings.admin_email.trim();
    if (!emailPattern.test(nextEmail)) {
      alert('請輸入有效的通知信箱');
      return;
    }

    setSaving(true);
    try {
      const notificationPayload: NotificationSettings = {
        admin_email: nextEmail,
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
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: notificationPayload })
          .eq('id', notificationExisting.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([
          {
            setting_key: NOTIFICATION_SETTING_KEY,
            setting_value: notificationPayload,
          },
        ]);
        if (error) throw error;
      }

      if (footerExisting.data?.id) {
        const { error } = await supabase.from('site_settings').update({ setting_value: footerPayload }).eq('id', footerExisting.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([
          {
            setting_key: FOOTER_SETTING_KEY,
            setting_value: footerPayload,
          },
        ]);
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
          <h1 className="text-3xl font-bold text-slate-900">通知信管理</h1>
          <p className="mt-2 text-slate-600">集中管理客服、訂單與匯款通知，並可直接編輯客服中心通知信模板。</p>
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
            同步頁尾信箱
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard icon={<Mail className="h-4 w-4" />} label="通知信箱" value={settings.admin_email || '-'} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="啟用數量" value={`${notificationEnabledCount} / 3`} />
        <StatCard icon={<ShoppingCart className="h-4 w-4" />} label="訂單通知" value={settings.order_enabled ? '啟用' : '停用'} />
        <StatCard icon={<MessageSquare className="h-4 w-4" />} label="客服複本" value={settings.customer_copy_enabled ? '啟用' : '停用'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-900">通知信總設定</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">通知信箱 *</label>
                <input
                  type="email"
                  value={settings.admin_email}
                  onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="service@sonpin.tw"
                />
                <p className="mt-2 text-xs text-slate-500">客服中心、訂單與匯款通知都會寄到這個信箱。</p>
              </div>

              <ToggleField
                title="客服中心通知"
                description="顧客從聯絡表單送出訊息時寄給管理員。"
                checked={settings.contact_enabled}
                onChange={(checked) => setSettings({ ...settings, contact_enabled: checked })}
              />

              <ToggleField
                title="訂單通知"
                description="顧客完成下單後寄給管理員。"
                checked={settings.order_enabled}
                onChange={(checked) => setSettings({ ...settings, order_enabled: checked })}
              />

              <ToggleField
                title="匯款通知"
                description="顧客回報匯款後寄給管理員。"
                checked={settings.remittance_enabled}
                onChange={(checked) => setSettings({ ...settings, remittance_enabled: checked })}
              />

              <ToggleField
                title="顧客副本"
                description="寄送匯款通知時，同步寄給顧客一份。"
                checked={settings.customer_copy_enabled}
                onChange={(checked) => setSettings({ ...settings, customer_copy_enabled: checked })}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? '儲存中...' : '儲存總設定'}
              </button>
              <span className="text-sm text-slate-500">上方設定會同時影響客服中心、訂單與匯款通知。</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-slate-600" />
              <h2 className="text-xl font-bold text-slate-900">客服中心通知信模板</h2>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">信件主旨</label>
                <input
                  value={settings.contact_template.admin_subject}
                  onChange={(e) => updateTemplate('admin_subject', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Sonpin 聯絡表單：{{subject}}"
                />
              <p className="mt-2 text-xs text-slate-500">
                可用變數：<code className="rounded bg-slate-100 px-1 py-0.5">{'{{name}}'}</code>、
                <code className="rounded bg-slate-100 px-1 py-0.5">{'{{email}}'}</code>、
                <code className="rounded bg-slate-100 px-1 py-0.5">{'{{phone}}'}</code>、
                <code className="rounded bg-slate-100 px-1 py-0.5">{'{{subject}}'}</code>、
                <code className="rounded bg-slate-100 px-1 py-0.5">{'{{message}}'}</code>
              </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">標題</label>
                  <input
                    value={settings.contact_template.admin_title}
                    onChange={(e) => updateTemplate('admin_title', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="有新的聯絡表單"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">內文</label>
                  <input
                    value={settings.contact_template.admin_intro}
                    onChange={(e) => updateTemplate('admin_intro', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="您收到一則來自客服中心的新訊息..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">備註</label>
                <textarea
                  value={settings.contact_template.admin_note}
                  onChange={(e) => updateTemplate('admin_note', e.target.value)}
                  className="min-h-[110px] w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="請盡快回覆並安排後續處理。"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">顯示欄位</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {templateFieldOptions.map((field) => (
                    <label
                      key={field.key}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <input
                        type="checkbox"
                        checked={settings.contact_template[field.key]}
                        onChange={(e) => updateTemplate(field.key, e.target.checked)}
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

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? '儲存中...' : '儲存模板'}
                </button>
                <span className="text-sm text-slate-500">儲存後，客服表單寄出的管理員通知信就會套用這些內容。</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">目前模板預覽</h3>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="mb-2 text-xs font-semibold tracking-[0.18em] text-amber-700">客服中心</div>
              <div className="text-lg font-bold text-slate-900">{settings.contact_template.admin_title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{settings.contact_template.admin_intro}</p>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {settings.contact_template.show_name && <div>姓名：王小明</div>}
                {settings.contact_template.show_email && <div>Email：customer@example.com</div>}
                {settings.contact_template.show_phone && <div>電話：0912-345-678</div>}
                {settings.contact_template.show_subject && <div>主旨：詢問商品資訊</div>}
                {settings.contact_template.show_message && (
                  <div className="rounded-lg bg-white p-3 text-slate-600">您好，我想詢問這款商品的配送與保存方式。</div>
                )}
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-500">{settings.contact_template.admin_note}</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">頁尾通知信箱</h3>
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="mb-2">目前頁尾聯絡信箱</div>
              <div className="break-all font-medium text-slate-900">{footerContactEmail || '-'}</div>
            </div>
          </section>
        </aside>
      </div>
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
