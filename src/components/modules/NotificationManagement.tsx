import { useEffect, useState } from 'react';
import { Bell, Mail, RefreshCw, Save, ShieldCheck, ShoppingCart, MessageSquare, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DEFAULT_FOOTER_SETTINGS } from '../../data/homepageContent';

interface SiteSettingRow {
  id: string | number;
  setting_key: string;
  setting_value: any;
  updated_at?: string | null;
}

interface NotificationSettings {
  admin_email: string;
  contact_enabled: boolean;
  order_enabled: boolean;
  remittance_enabled: boolean;
  customer_copy_enabled: boolean;
}

const NOTIFICATION_SETTING_KEY = 'notification_mail';
const FOOTER_SETTING_KEY = 'footer';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  admin_email: DEFAULT_FOOTER_SETTINGS.contact_email,
  contact_enabled: true,
  order_enabled: true,
  remittance_enabled: true,
  customer_copy_enabled: true,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  if (typeof value === 'number') return value !== 0;
  return fallback;
};

export default function NotificationManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [footerContactEmail, setFooterContactEmail] = useState(DEFAULT_FOOTER_SETTINGS.contact_email);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

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
      const notificationValue = (notificationRow?.setting_value || {}) as Partial<NotificationSettings>;
      const footerRow = footerResponse.data as SiteSettingRow | null;
      const footerValue = (footerRow?.setting_value || {}) as Partial<typeof DEFAULT_FOOTER_SETTINGS>;

      const adminEmail = String(
        notificationValue.admin_email || footerValue.contact_email || DEFAULT_NOTIFICATION_SETTINGS.admin_email
      ).trim() || DEFAULT_NOTIFICATION_SETTINGS.admin_email;

      setSettings({
        admin_email: adminEmail,
        contact_enabled: normalizeBoolean(notificationValue.contact_enabled, DEFAULT_NOTIFICATION_SETTINGS.contact_enabled),
        order_enabled: normalizeBoolean(notificationValue.order_enabled, DEFAULT_NOTIFICATION_SETTINGS.order_enabled),
        remittance_enabled: normalizeBoolean(notificationValue.remittance_enabled, DEFAULT_NOTIFICATION_SETTINGS.remittance_enabled),
        customer_copy_enabled: normalizeBoolean(notificationValue.customer_copy_enabled, DEFAULT_NOTIFICATION_SETTINGS.customer_copy_enabled),
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
          <p className="mt-2 text-slate-600">統一管理訂單、聯絡表單與匯款通知的收件信箱與寄送開關。</p>
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Mail className="h-4 w-4" />
            收件信箱
          </div>
          <div className="break-all text-lg font-semibold text-slate-900">{settings.admin_email || '-'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            啟用通知
          </div>
          <div className="text-lg font-semibold text-slate-900">
            {Number(settings.contact_enabled) + Number(settings.order_enabled) + Number(settings.remittance_enabled)} / 3
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <ShoppingCart className="h-4 w-4" />
            訂單通知
          </div>
          <div className="text-lg font-semibold text-slate-900">{settings.order_enabled ? '啟用' : '停用'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <MessageSquare className="h-4 w-4" />
            顧客副本
          </div>
          <div className="text-lg font-semibold text-slate-900">{settings.customer_copy_enabled ? '啟用' : '停用'}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900">通知寄送設定</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">通知收件信箱 *</label>
              <input
                type="email"
                value={settings.admin_email}
                onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="service@sonpin.tw"
              />
              <p className="mt-2 text-xs text-slate-500">這個信箱會同步到頁尾聯絡信箱，並作為訂單 / 聯絡 / 匯款通知的主要收件人。</p>
            </div>

            <ToggleField
              title="聯絡表單通知"
              description="當顧客從客服中心送出表單時，寄送管理員通知信。"
              checked={settings.contact_enabled}
              onChange={(checked) => setSettings({ ...settings, contact_enabled: checked })}
            />

            <ToggleField
              title="訂單成立通知"
              description="顧客完成結帳後，寄送訂單通知信給管理員。"
              checked={settings.order_enabled}
              onChange={(checked) => setSettings({ ...settings, order_enabled: checked })}
            />

            <ToggleField
              title="匯款通知"
              description="顧客回報匯款資料時，寄送匯款通知給管理員。"
              checked={settings.remittance_enabled}
              onChange={(checked) => setSettings({ ...settings, remittance_enabled: checked })}
            />

            <ToggleField
              title="寄送顧客副本"
              description="訂單與匯款通知同時寄送給顧客，方便留存。"
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
              {saving ? '儲存中...' : '儲存通知設定'}
            </button>
            <span className="text-sm text-slate-500">若未設定專用通知信箱，系統仍會沿用頁尾聯絡信箱。</span>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">寄送範圍說明</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>• 聯絡表單：客服中心送出後，寄送給管理員。</li>
              <li>• 訂單成立：完成結帳後，寄送給管理員與顧客。</li>
              <li>• 匯款通知：顧客填寫匯款資料後，寄送給管理員，必要時也可寄給顧客。</li>
              <li>• 本頁設定會同步更新頁尾聯絡信箱，避免前台與寄信收件人不一致。</li>
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">目前同步來源</h3>
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="mb-2">頁尾聯絡信箱</div>
              <div className="break-all font-medium text-slate-900">{footerContactEmail || '-'}</div>
            </div>
          </section>
        </aside>
      </div>
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
