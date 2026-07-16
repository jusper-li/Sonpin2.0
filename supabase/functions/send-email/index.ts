import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL")?.trim() || "onboarding@resend.dev";
const FROM_NAME = Deno.env.get("RESEND_FROM_NAME")?.trim() || "Sonpin";
const FALLBACK_ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL")?.trim() || FROM_EMAIL;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REMITTANCE_INFO = {
  bankName: "永豐銀行 萬華分行",
  bankCode: "807",
  accountNumber: "105-001-0014900-4",
  accountName: "淞品生技股份有限公司",
  taxId: "27522811",
  note: "匯款後請於客服時間 09:00–17:00 來電或私訊告知，並提供訂單編號以利對帳。",
};

type ContactEmail = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type OrderItem = {
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

type ShippingBreakdownItem = {
  categoryName: string;
  quantityLabel: string;
  quantity: number;
  fee: number;
};

type OrderEmail = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  shipping?: number;
  shippingMethod?: string;
  shippingBreakdown?: ShippingBreakdownItem[];
  address: string;
  paymentMethod: string;
};

type WelcomeEmail = {
  email: string;
  displayName: string;
};

type RemittanceNotificationEmail = {
  orderNumber: string;
  remittanceAmount: number;
  remitterAccountLast5: string;
};

type NotificationMailSettings = {
  admin_email: string;
  admin_emails: string[];
  contact_enabled: boolean;
  order_enabled: boolean;
  remittance_enabled: boolean;
  customer_copy_enabled: boolean;
  contact_template: ContactNotificationTemplate;
  order_template: OrderNotificationTemplate;
  customer_order_template: CustomerOrderNotificationTemplate;
  remittance_template: RemittanceNotificationTemplate;
};

type ContactNotificationTemplate = {
  admin_subject: string;
  admin_title: string;
  admin_intro: string;
  admin_note: string;
  show_name: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_subject: boolean;
  show_message: boolean;
};

type OrderNotificationTemplate = {
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
};

type CustomerOrderNotificationTemplate = {
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
  show_remittance_info: boolean;
};

type RemittanceNotificationTemplate = {
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
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationMailSettings = {
  admin_email: FALLBACK_ADMIN_EMAIL,
  admin_emails: [FALLBACK_ADMIN_EMAIL],
  contact_enabled: true,
  order_enabled: true,
  remittance_enabled: true,
  customer_copy_enabled: true,
  contact_template: {
    admin_subject: "Sonpin 聯絡表單：{{subject}}",
    admin_title: "有新的聯絡表單",
    admin_intro: "您收到一則來自客服中心的新訊息，以下為表單內容。",
    admin_note: "請盡快回覆並安排後續處理。",
    show_name: true,
    show_email: true,
    show_phone: true,
    show_subject: true,
    show_message: true,
  },
  order_template: {
    admin_subject: "Sonpin 新訂單通知：{{orderNumber}}",
    admin_title: "新訂單通知",
    admin_intro: "有顧客完成下單，以下為訂單摘要。",
    admin_note: "請確認出貨與後續聯絡資訊。",
    show_order_number: true,
    show_customer_name: true,
    show_customer_email: true,
    show_address: true,
    show_payment_method: true,
    show_items: true,
    show_totals: true,
    show_shipping: true,
  },
  customer_order_template: {
    admin_subject: "Sonpin 訂單已送出：{{orderNumber}}",
    admin_title: "訂單已送出",
    admin_intro: "感謝您的訂購，以下是您的訂單資訊與匯款說明。",
    admin_note: "若有任何問題，歡迎與客服中心聯繫。",
    show_order_number: true,
    show_customer_name: true,
    show_customer_email: true,
    show_address: true,
    show_payment_method: true,
    show_items: true,
    show_totals: true,
    show_shipping: true,
    show_remittance_info: true,
  },
  remittance_template: {
    admin_subject: "Sonpin 匯款通知：{{orderNumber}}",
    admin_title: "匯款通知",
    admin_intro: "顧客已回報匯款資訊，請盡快核對帳務。",
    admin_note: "若匯款金額或帳號末五碼有誤，請聯繫顧客確認。",
    show_order_number: true,
    show_remittance_amount: true,
    show_remitter_last5: true,
    show_order_total: true,
    show_customer_name: true,
    show_customer_email: true,
  },
};

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function asRecord(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "invalid_payload", `${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw new HttpError(400, "invalid_payload", `${label} is required`);
  return result;
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredEmail(value: unknown, label: string) {
  const result = requiredString(value, label).toLowerCase();
  if (!emailPattern.test(result)) throw new HttpError(400, "invalid_payload", `${label} must be a valid email`);
  return result;
}

function requiredNumber(value: unknown, label: string) {
  const result = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(result)) throw new HttpError(400, "invalid_payload", `${label} must be a number`);
  return result;
}

function isEmail(value: unknown) {
  return typeof value === "string" && emailPattern.test(value.trim().toLowerCase());
}

function normalizeEmailList(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,;]+/)
      : [];

  return Array.from(
    new Set(
      source
        .map((entry) => normalizeEmail(entry))
        .filter((entry) => Boolean(entry) && emailPattern.test(entry)),
    ),
  );
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function formatMoney(value: number) {
  return `NT$ ${Math.round(value).toLocaleString("zh-TW")}`;
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => values[key] ?? "");
}

function parseTemplateObject<T extends Record<string, string | boolean>>(value: unknown, fallback: T): T {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const result = { ...fallback };

  for (const key of Object.keys(fallback) as Array<keyof T>) {
    const fallbackValue = fallback[key];
    const currentValue = source[String(key)];
    if (typeof fallbackValue === "boolean") {
      result[key] = normalizeBoolean(currentValue, fallbackValue) as T[keyof T];
    } else {
      result[key] = (typeof currentValue === "string" && currentValue.trim() ? currentValue.trim() : fallbackValue) as T[keyof T];
    }
  }

  return result;
}

function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    credit_card: "信用卡",
    bank_transfer: "銀行轉帳",
    cash_on_delivery: "貨到付款",
  };
  return labels[method] || method;
}

async function readJson(req: Request) {
  try {
    return asRecord(await req.json(), "request body");
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON");
  }
}

function parseContactEmail(data: Record<string, unknown>): ContactEmail {
  return {
    name: requiredString(data.name, "data.name"),
    email: requiredEmail(data.email, "data.email"),
    phone: optionalString(data.phone),
    subject: requiredString(data.subject, "data.subject"),
    message: requiredString(data.message, "data.message"),
  };
}

function parseOrderItem(value: unknown, index: number): OrderItem {
  const item = asRecord(value, `data.items[${index}]`);
  return {
    product_name: requiredString(item.product_name, `data.items[${index}].product_name`),
    quantity: requiredNumber(item.quantity, `data.items[${index}].quantity`),
    price: requiredNumber(item.price, `data.items[${index}].price`),
    total: requiredNumber(item.total, `data.items[${index}].total`),
  };
}

function parseShippingBreakdownItem(value: unknown, index: number): ShippingBreakdownItem {
  const item = asRecord(value, `data.shippingBreakdown[${index}]`);
  return {
    categoryName: requiredString(item.categoryName, `data.shippingBreakdown[${index}].categoryName`),
    quantityLabel: optionalString(item.quantityLabel),
    quantity: requiredNumber(item.quantity, `data.shippingBreakdown[${index}].quantity`),
    fee: requiredNumber(item.fee, `data.shippingBreakdown[${index}].fee`),
  };
}

function parseOrderEmail(data: Record<string, unknown>): OrderEmail {
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new HttpError(400, "invalid_payload", "data.items must be a non-empty array");
  }

  const shippingBreakdown = Array.isArray(data.shippingBreakdown)
    ? data.shippingBreakdown.map(parseShippingBreakdownItem)
    : [];

  return {
    orderNumber: requiredString(data.orderNumber, "data.orderNumber"),
    customerName: requiredString(data.customerName, "data.customerName"),
    customerEmail: requiredEmail(data.customerEmail, "data.customerEmail"),
    items: data.items.map(parseOrderItem),
    total: requiredNumber(data.total, "data.total"),
    subtotal: data.subtotal === undefined || data.subtotal === null ? undefined : requiredNumber(data.subtotal, "data.subtotal"),
    shipping: data.shipping === undefined || data.shipping === null ? undefined : requiredNumber(data.shipping, "data.shipping"),
    shippingMethod: optionalString(data.shippingMethod),
    shippingBreakdown,
    address: requiredString(data.address, "data.address"),
    paymentMethod: requiredString(data.paymentMethod, "data.paymentMethod"),
  };
}

function parseWelcomeEmail(data: Record<string, unknown>): WelcomeEmail {
  return {
    email: requiredEmail(data.email, "data.email"),
    displayName: requiredString(data.displayName, "data.displayName"),
  };
}

function parseRemittanceNotificationEmail(data: Record<string, unknown>): RemittanceNotificationEmail {
  return {
    orderNumber: requiredString(data.orderNumber, "data.orderNumber"),
    remittanceAmount: requiredNumber(data.remittanceAmount, "data.remittanceAmount"),
    remitterAccountLast5: requiredString(data.remitterAccountLast5, "data.remitterAccountLast5").slice(-5),
  };
}

function parseNotificationSettings(value: unknown): NotificationMailSettings {
  const settings = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const adminEmails = normalizeEmailList(settings.admin_emails);
  const adminEmail = optionalString(settings.admin_email);
  return {
    admin_email: adminEmails[0] || adminEmail || FALLBACK_ADMIN_EMAIL,
    admin_emails: adminEmails.length > 0 ? adminEmails : (adminEmail ? [adminEmail] : [FALLBACK_ADMIN_EMAIL]),
    contact_enabled: settings.contact_enabled === undefined ? true : Boolean(settings.contact_enabled),
    order_enabled: settings.order_enabled === undefined ? true : Boolean(settings.order_enabled),
    remittance_enabled: settings.remittance_enabled === undefined ? true : Boolean(settings.remittance_enabled),
    customer_copy_enabled: settings.customer_copy_enabled === undefined ? true : Boolean(settings.customer_copy_enabled),
    contact_template: parseTemplateObject(settings.contact_template, DEFAULT_NOTIFICATION_SETTINGS.contact_template),
    order_template: parseTemplateObject(settings.order_template, DEFAULT_NOTIFICATION_SETTINGS.order_template),
    customer_order_template: parseTemplateObject(settings.customer_order_template, DEFAULT_NOTIFICATION_SETTINGS.customer_order_template),
    remittance_template: parseTemplateObject(settings.remittance_template, DEFAULT_NOTIFICATION_SETTINGS.remittance_template),
  };
}

async function getNotificationSettings() {
  const explicitAdminEmail = Deno.env.get("ADMIN_EMAIL")?.trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      admin_email: isEmail(explicitAdminEmail) ? explicitAdminEmail : FALLBACK_ADMIN_EMAIL,
      admin_emails: isEmail(explicitAdminEmail) ? [explicitAdminEmail] : [FALLBACK_ADMIN_EMAIL],
    };
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const [{ data: notificationData, error: notificationError }, { data: footerData, error: footerError }] = await Promise.all([
      supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "notification_mail")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "footer")
        .maybeSingle(),
    ]);

    if (notificationError) {
      console.warn("send-email: skipped notification settings lookup", notificationError.message);
    }
    if (footerError) {
      console.warn("send-email: skipped footer settings lookup", footerError.message);
    }

    const notificationSettings = parseNotificationSettings(notificationData?.setting_value);
    const footerValue = footerData?.setting_value as { contact_email?: unknown } | null | undefined;
    const footerContactEmail = optionalString(footerValue?.contact_email);

    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...notificationSettings,
      admin_email: isEmail(notificationSettings.admin_email)
        ? notificationSettings.admin_email
        : isEmail(footerContactEmail)
          ? footerContactEmail
          : isEmail(explicitAdminEmail)
            ? explicitAdminEmail
          : FALLBACK_ADMIN_EMAIL,
      admin_emails: Array.from(
        new Set(
          [
            ...(notificationSettings.admin_emails || []),
            notificationSettings.admin_email,
            footerContactEmail,
            explicitAdminEmail,
            FALLBACK_ADMIN_EMAIL,
          ].filter((entry): entry is string => isEmail(entry)),
        ),
      ),
    };
  } catch (error) {
    console.warn("send-email: skipped admin email lookup", error instanceof Error ? error.message : String(error));
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      admin_email: isEmail(explicitAdminEmail) ? explicitAdminEmail : FALLBACK_ADMIN_EMAIL,
      admin_emails: isEmail(explicitAdminEmail) ? [explicitAdminEmail] : [FALLBACK_ADMIN_EMAIL],
    };
  }
}

async function getAdminEmails() {
  const settings = await getNotificationSettings();
  return settings.admin_emails.length > 0 ? settings.admin_emails : [settings.admin_email];
}

async function sendEmail(params: { to: string; subject: string; html: string; replyTo?: string }) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!resendApiKey) {
    console.warn("send-email: skipped mail send because RESEND_API_KEY is not configured");
    return;
  }

  const payload: Record<string, unknown> = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  };

  if (params.replyTo && isEmail(params.replyTo)) {
    payload.reply_to = params.replyTo;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`send-email: Resend request failed (${res.status}): ${text.slice(0, 500)}`);
  }
}

async function sendEmailToRecipients(
  recipients: string[],
  params: { subject: string; html: string; replyTo?: string },
) {
  const uniqueRecipients = Array.from(new Set(recipients.filter((recipient) => isEmail(recipient))));
  await Promise.allSettled(uniqueRecipients.map((to) => sendEmail({ to, ...params })));
}

function wrapEmail(content: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="font-family: Arial, Helvetica, sans-serif; background:#f5f4f0; margin:0; padding:0;">
    <div style="max-width:640px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.07);">
      <div style="background:#1c1917;padding:28px 40px;text-align:center;">
        <div style="color:#d6a96a;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px 0;">Sonpin</div>
        <div style="color:#fff;font-size:22px;font-weight:300;letter-spacing:0.15em;margin:0;">淞品土雞專賣店</div>
      </div>
      <div style="padding:40px;">${content}</div>
    </div>
  </body>
</html>`;
}

function renderRemittanceSection() {
  return `
    <div style="margin-top:24px;padding:20px;border-radius:10px;background:#faf9f7;border:1px solid #eee7dc;">
      <h3 style="margin:0 0 12px 0;color:#1c1917;font-size:16px;font-weight:600;">匯款資訊</h3>
      <p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>銀行名稱：</strong>${escapeHtml(REMITTANCE_INFO.bankName)}（${escapeHtml(REMITTANCE_INFO.bankCode)}）</p>
      <p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>匯款帳號：</strong>${escapeHtml(REMITTANCE_INFO.accountNumber)}</p>
      <p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>戶名：</strong>${escapeHtml(REMITTANCE_INFO.accountName)}</p>
      ${REMITTANCE_INFO.taxId ? `<p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>統編：</strong>${escapeHtml(REMITTANCE_INFO.taxId)}</p>` : ""}
      <p style="margin:12px 0 0 0;color:#78716c;line-height:1.8;font-size:13px;">${escapeHtml(REMITTANCE_INFO.note)}</p>
    </div>
  `;
}

function renderShippingBreakdown(items: ShippingBreakdownItem[]) {
  if (items.length === 0) return "";

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid #f0ede8;color:#57534e;font-size:14px;">
            ${escapeHtml(item.categoryName)}${item.quantityLabel ? ` ${escapeHtml(item.quantityLabel)}` : ""} × ${escapeHtml(item.quantity)}
          </td>
          <td style="padding:10px 0;border-top:1px solid #f0ede8;color:#1c1917;font-size:14px;text-align:right;">
            ${formatMoney(item.fee)}
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="margin-top:16px;">
      <h3 style="margin:0 0 8px 0;color:#1c1917;font-size:16px;font-weight:600;">運費明細</h3>
      <table style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
    </div>
  `;
}

function generateContactAutoReply(data: ContactEmail) {
  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:22px;font-weight:300;margin:0 0 8px 0;">您好，${escapeHtml(data.name)}</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">我們已收到您的訊息，主旨為 <strong>${escapeHtml(data.subject)}</strong>。</p>
    <p style="color:#57534e;line-height:1.8;margin:0;">我們會盡快回覆您，謝謝您的聯絡。</p>
  `);
}

function generateContactAdminNotify(data: ContactEmail, template: ContactNotificationTemplate) {
  const fields = [
    template.show_name ? { label: "姓名", value: data.name, link: false } : null,
    template.show_email ? { label: "Email", value: data.email, link: true } : null,
    template.show_phone ? { label: "電話", value: data.phone || "-", link: false } : null,
    template.show_subject ? { label: "主旨", value: data.subject, link: false } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; link: boolean }>;

  const fieldRows = fields
    .map(
      (field) => `
        <p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;">
          <strong>${escapeHtml(field.label)}：</strong>${
            field.link ? `<a href="mailto:${escapeHtml(field.value)}">${escapeHtml(field.value)}</a>` : escapeHtml(field.value)
          }
        </p>`,
    )
    .join("");

  const messageBlock = template.show_message
    ? `
      <div style="margin-top:16px;background:#faf9f7;border-radius:8px;padding:16px 20px;border:1px solid #eee7dc;">
        <p style="margin:0 0 8px 0;color:#a16207;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">訊息內容</p>
        <p style="margin:0;white-space:pre-wrap;color:#1c1917;line-height:1.8;">${escapeHtml(data.message)}</p>
      </div>
    `
    : "";

  const noteBlock = template.admin_note
    ? `<p style="margin:16px 0 0 0;color:#78716c;line-height:1.8;font-size:13px;">${escapeHtml(template.admin_note)}</p>`
    : "";

  return wrapEmail(`
    <p style="margin:0 0 8px 0;color:#a16207;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">客服中心</p>
    <h2 style="color:#1c1917;font-size:20px;font-weight:400;margin:0 0 12px 0;">${escapeHtml(template.admin_title)}</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">${escapeHtml(template.admin_intro)}</p>
    ${fieldRows || '<p style="color:#78716c;line-height:1.8;margin:0 0 8px 0;">目前未勾選任何顯示欄位。</p>'}
    ${messageBlock}
    ${noteBlock}
  `);
}

function generateCustomerOrderConfirmation(data: OrderEmail, template: CustomerOrderNotificationTemplate) {
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(item.product_name)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f0ede8;color:#78716c;font-size:14px;text-align:center;">x${escapeHtml(item.quantity)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;text-align:right;">${formatMoney(item.total)}</td>
        </tr>`
    )
    .join("");

  const subtotal = data.subtotal ?? data.items.reduce((sum, item) => sum + item.total, 0);
  const shipping = data.shipping ?? 0;
  const shippingMethod = data.shippingMethod || "銀行轉帳";

  return wrapEmail(`
    <p style="margin:0 0 8px 0;color:#a16207;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">客戶訂單通知</p>
    <h2 style="color:#1c1917;font-size:22px;font-weight:300;margin:0 0 4px 0;">${escapeHtml(template.admin_title)}</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">${escapeHtml(template.admin_intro)}</p>

    ${template.show_order_number ? `<div style="margin:0 0 24px 0;padding:16px 20px;border-radius:10px;background:#faf9f7;border:1px solid #eee7dc;"><p style="margin:0;color:#a16207;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">訂單編號</p><p style="margin:6px 0 0 0;color:#1c1917;font-size:20px;font-weight:700;font-family:monospace;">${escapeHtml(data.orderNumber)}</p></div>` : ""}

    ${template.show_customer_name ? `<p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>顧客姓名：</strong>${escapeHtml(data.customerName)}</p>` : ""}
    ${template.show_customer_email ? `<p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>Email：</strong><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></p>` : ""}
    ${template.show_address ? `<p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>收件地址：</strong>${escapeHtml(data.address)}</p>` : ""}
    ${template.show_payment_method ? `<p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;"><strong>付款方式：</strong>${escapeHtml(paymentMethodLabel(data.paymentMethod))}</p>` : ""}

    ${template.show_items ? `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;"><tr><th style="text-align:left;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">商品</th><th style="text-align:center;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">數量</th><th style="text-align:right;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">小計</th></tr>${itemRows}<tr><td colspan="2" style="padding:14px 0 0 0;color:#57534e;font-size:14px;">商品小計</td><td style="padding:14px 0 0 0;color:#1c1917;font-size:14px;text-align:right;">${formatMoney(subtotal)}</td></tr><tr><td colspan="2" style="padding:8px 0 0 0;color:#57534e;font-size:14px;">運費</td><td style="padding:8px 0 0 0;color:#1c1917;font-size:14px;text-align:right;">${formatMoney(shipping)}</td></tr><tr><td colspan="2" style="padding:14px 0 0 0;color:#1c1917;font-size:15px;font-weight:600;">訂單總額</td><td style="padding:14px 0 0 0;color:#d6a96a;font-size:18px;font-weight:700;text-align:right;">${formatMoney(data.total)}</td></tr></table>` : ""}

    ${template.show_shipping ? `<p style="color:#57534e;line-height:1.8;margin:16px 0 0 0;"><strong>配送方式：</strong>${escapeHtml(shippingMethod)}</p><p style="color:#57534e;line-height:1.8;margin:8px 0 0 0;"><strong>運費明細：</strong>${formatMoney(shipping)}</p>${renderShippingBreakdown(data.shippingBreakdown || [])}` : ""}
    ${template.show_remittance_info ? renderRemittanceSection() : ""}
    ${template.admin_note ? `<p style="color:#78716c;line-height:1.8;margin:16px 0 0 0;font-size:13px;">${escapeHtml(template.admin_note)}</p>` : ""}
  `);
}

function generateOrderAdminNotify(data: OrderEmail, template: OrderNotificationTemplate) {
  const subtotal = data.subtotal ?? data.items.reduce((sum, item) => sum + item.total, 0);
  const shipping = data.shipping ?? 0;
  const itemsHtml = template.show_items
    ? `
      <table style="width:100%;border-collapse:collapse;margin:12px 0 12px 0;">
        <tr>
          <th style="text-align:left;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">商品</th>
          <th style="text-align:center;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">數量</th>
          <th style="text-align:right;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">小計</th>
        </tr>
        ${data.items
          .map(
            (item) => `
              <tr>
                <td style="padding:10px 0;border-top:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(item.product_name)}</td>
                <td style="padding:10px 0;border-top:1px solid #f0ede8;color:#78716c;font-size:14px;text-align:center;">x${escapeHtml(item.quantity)}</td>
                <td style="padding:10px 0;border-top:1px solid #f0ede8;color:#1c1917;font-size:14px;text-align:right;">${formatMoney(item.total)}</td>
              </tr>`,
          )
          .join('')}
      </table>`
    : '';

  const totalsHtml = template.show_totals
    ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <tr>
          <td style="padding:8px 0;color:#57534e;font-size:14px;">商品小計</td>
          <td style="padding:8px 0;color:#1c1917;font-size:14px;text-align:right;">${formatMoney(subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#57534e;font-size:14px;">訂單總額</td>
          <td style="padding:8px 0;color:#d6a96a;font-size:18px;font-weight:700;text-align:right;">${formatMoney(data.total)}</td>
        </tr>
      </table>`
    : '';

  const shippingHtml = template.show_shipping
    ? `
      <p style="color:#57534e;line-height:1.8;margin:8px 0 0 0;"><strong>配送方式：</strong>${escapeHtml(data.shippingMethod || '銀行轉帳')}</p>
      <p style="color:#57534e;line-height:1.8;margin:8px 0 0 0;"><strong>運費：</strong>${formatMoney(shipping)}</p>
      ${renderShippingBreakdown(data.shippingBreakdown || [])}
    `
    : '';

  return wrapEmail(`
    <p style="margin:0 0 8px 0;color:#a16207;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">訂單管理</p>
    <h2 style="color:#1c1917;font-size:20px;font-weight:400;margin:0 0 12px 0;">${escapeHtml(template.admin_title)}</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">${escapeHtml(template.admin_intro)}</p>
    ${template.show_order_number ? `<p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>訂單編號：</strong>${escapeHtml(data.orderNumber)}</p>` : ''}
    ${template.show_customer_name ? `<p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>顧客姓名：</strong>${escapeHtml(data.customerName)}</p>` : ''}
    ${template.show_customer_email ? `<p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>Email：</strong><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></p>` : ''}
    ${template.show_address ? `<p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>收件地址：</strong>${escapeHtml(data.address)}</p>` : ''}
    ${template.show_payment_method ? `<p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;"><strong>付款方式：</strong>${escapeHtml(paymentMethodLabel(data.paymentMethod))}</p>` : ''}
    ${itemsHtml}
    ${totalsHtml}
    ${shippingHtml}
    ${template.admin_note ? `<p style="color:#78716c;line-height:1.8;margin:16px 0 0 0;font-size:13px;">${escapeHtml(template.admin_note)}</p>` : ''}
  `);
}

function generateWelcomeEmail(data: WelcomeEmail) {
  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:24px;font-weight:300;margin:0 0 4px 0;">歡迎加入 Sonpin</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">親愛的 <strong>${escapeHtml(data.displayName)}</strong>，我們很高興您加入我們。</p>
    <p style="color:#57534e;line-height:1.8;margin:0;">若您之後有任何訂單或商品問題，歡迎隨時與我們聯繫。</p>
  `);
}


type OrderLookup = {
  id: string;
  order_number: string;
  total: number | null;
  customer_name: string | null;
  customer_email: string | null;
};

function generateRemittanceNotificationAdminEmail(data: RemittanceNotificationEmail, order: OrderLookup, template: RemittanceNotificationTemplate) {
  return wrapEmail(`
    <p style="margin:0 0 8px 0;color:#a16207;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">匯款管理</p>
    <h2 style="color:#1c1917;font-size:22px;font-weight:300;margin:0 0 12px 0;">${escapeHtml(template.admin_title)}</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">${escapeHtml(template.admin_intro)}</p>
    <div style="margin:0 0 24px 0;padding:16px 20px;border-radius:10px;background:#faf9f7;border:1px solid #eee7dc;">
      ${template.show_order_number ? `<p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>訂單編號：</strong>${escapeHtml(data.orderNumber)}</p>` : ''}
      ${template.show_remittance_amount ? `<p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>匯款金額：</strong>${formatMoney(data.remittanceAmount)}</p>` : ''}
      ${template.show_remitter_last5 ? `<p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>匯款帳號後 5 碼：</strong>${escapeHtml(data.remitterAccountLast5)}</p>` : ''}
      ${template.show_order_total ? `<p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>訂單總額：</strong>${formatMoney(Number(order.total || 0))}</p>` : ''}
      ${template.show_customer_name ? `<p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>顧客姓名：</strong>${escapeHtml(order.customer_name || '-')}</p>` : ''}
      ${template.show_customer_email ? `<p style="margin:0;color:#57534e;line-height:1.8;"><strong>Email：</strong><a href="mailto:${escapeHtml(order.customer_email || '')}">${escapeHtml(order.customer_email || '-')}</a></p>` : ''}
    </div>
    ${template.admin_note ? `<p style="color:#78716c;line-height:1.8;margin:0;font-size:13px;">${escapeHtml(template.admin_note)}</p>` : ''}
  `);
}

function generateRemittanceNotificationCustomerEmail(data: RemittanceNotificationEmail) {
  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:22px;font-weight:300;margin:0 0 8px 0;">???????????</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">?????????????????????????</p>
    <div style="margin:0 0 24px 0;padding:16px 20px;border-radius:10px;background:#faf9f7;border:1px solid #eee7dc;">
      <p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>?????</strong>${escapeHtml(data.orderNumber)}</p>
      <p style="margin:0 0 8px 0;color:#57534e;line-height:1.8;"><strong>?????</strong>${formatMoney(data.remittanceAmount)}</p>
      <p style="margin:0;color:#57534e;line-height:1.8;"><strong>????? 5 ??</strong>${escapeHtml(data.remitterAccountLast5)}</p>
    </div>
    <p style="color:#57534e;line-height:1.8;margin:0;">?????????????????????</p>
  `);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Only POST is supported" }, 405);
  }

  try {
    const body = await readJson(req);
    const type = requiredString(body.type, "type");
    const data = asRecord(body.data, "data");
    const notificationSettings = await getNotificationSettings();
    const adminRecipients = notificationSettings.admin_emails.length > 0 ? notificationSettings.admin_emails : [notificationSettings.admin_email];

    switch (type) {
      case "contact": {
        const contact = parseContactEmail(data);
        const subject = renderTemplate(notificationSettings.contact_template.admin_subject, {
          name: contact.name,
          email: contact.email,
          phone: contact.phone || "-",
          subject: contact.subject,
          message: contact.message,
        }).trim() || `Sonpin 聯絡表單：${contact.subject}`;
        await Promise.all([
          notificationSettings.contact_enabled
            ? sendEmailToRecipients(adminRecipients, {
                subject,
                html: generateContactAdminNotify(contact, notificationSettings.contact_template),
                replyTo: contact.email,
              })
            : Promise.resolve(),
          sendEmail({
            to: contact.email,
            subject: "Sonpin 聯絡表單已收到",
            html: generateContactAutoReply(contact),
          }),
        ]);
        break;
      }
      case "order_confirmation": {
        const order = parseOrderEmail(data);
        const adminSubject = renderTemplate(notificationSettings.order_template.admin_subject, {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          address: order.address,
          paymentMethod: paymentMethodLabel(order.paymentMethod),
          total: formatMoney(order.total),
        }).trim() || `Sonpin 新訂單通知 ${order.orderNumber}`;
        await Promise.allSettled([
          notificationSettings.customer_copy_enabled && order.customerEmail
            ? sendEmail({
                to: order.customerEmail,
                subject:
                  renderTemplate(notificationSettings.customer_order_template.admin_subject, {
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    address: order.address,
                    paymentMethod: paymentMethodLabel(order.paymentMethod),
                    total: formatMoney(order.total),
                  }).trim() || `Sonpin 訂單已送出 ${order.orderNumber}`,
                html: generateCustomerOrderConfirmation(order, notificationSettings.customer_order_template),
              })
            : Promise.resolve(),
          notificationSettings.order_enabled
            ? sendEmailToRecipients(adminRecipients, {
                subject: adminSubject,
                html: generateOrderAdminNotify(order, notificationSettings.order_template),
                replyTo: order.customerEmail,
              })
            : Promise.resolve(),
        ]);
        break;
      }
      case "welcome": {
        const welcome = parseWelcomeEmail(data);
        await sendEmail({
          to: welcome.email,
          subject: "Sonpin ??????",
          html: generateWelcomeEmail(welcome),
        });
        break;
      }
      case "remittance_notification": {
        const remittance = parseRemittanceNotificationEmail(data);
        const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

        if (!supabaseUrl || !serviceRoleKey) {
          throw new HttpError(503, "supabase_not_configured", "Supabase service credentials are not configured");
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("id, order_number, total, customer_name, customer_email")
          .eq("order_number", remittance.orderNumber)
          .maybeSingle();

        if (orderError || !orderData) {
          throw new HttpError(404, "order_not_found", "?????????????????");
        }

        const order = orderData as OrderLookup;
        const eventDescription = "remittance notification: amount " + formatMoney(remittance.remittanceAmount) + ", last5 " + remittance.remitterAccountLast5;
        const adminSubject = renderTemplate(notificationSettings.remittance_template.admin_subject, {
          orderNumber: remittance.orderNumber,
          remittanceAmount: formatMoney(remittance.remittanceAmount),
          remitterAccountLast5: remittance.remitterAccountLast5,
          orderTotal: formatMoney(Number(order.total || 0)),
          customerName: order.customer_name || "-",
          customerEmail: order.customer_email || "-",
        }).trim() || `Sonpin 匯款通知 ${remittance.orderNumber}`;

        await Promise.allSettled([
          supabase.from("order_events").insert({
            order_id: orderData.id,
            event_type: "remittance_notification",
            description: eventDescription,
            actor_name: order.customer_name || "",
            actor_type: "customer",
          }),
          notificationSettings.remittance_enabled
            ? sendEmailToRecipients(adminRecipients, {
                subject: adminSubject,
                html: generateRemittanceNotificationAdminEmail(remittance, order, notificationSettings.remittance_template),
                replyTo: order.customer_email || undefined,
              })
            : Promise.resolve(),
          notificationSettings.customer_copy_enabled && order.customer_email
            ? sendEmail({
                to: order.customer_email,
                subject: `Sonpin 匯款通知已收到 ${remittance.orderNumber}`,
                html: generateRemittanceNotificationCustomerEmail(remittance),
              })
            : Promise.resolve(),
        ]);
        break;
      }
      default:
        throw new HttpError(400, "unknown_email_type", `Unknown email type: ${type}`);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    if (error instanceof HttpError) {
      console.warn(`send-email skipped (${error.code}): ${error.message}`);
      return jsonResponse(
        {
          success: true,
          skipped: true,
          error: error.code,
          message: error.message,
        },
        200,
      );
    }

    console.error("send-email failed", error instanceof Error ? error.message : String(error));
    return jsonResponse(
      { error: "email_send_failed", message: "Email send failed. Please check Resend configuration." },
      500,
    );
  }
});
