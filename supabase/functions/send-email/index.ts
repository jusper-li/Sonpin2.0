import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL")?.trim() || "onboarding@resend.dev";
const FROM_NAME = Deno.env.get("RESEND_FROM_NAME")?.trim() || "Sonpin";
const FALLBACK_ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL")?.trim() || FROM_EMAIL;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

type OrderEmail = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  address: string;
  paymentMethod: string;
};

type WelcomeEmail = {
  email: string;
  displayName: string;
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

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeMultiline(value: unknown) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function asRecord(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "invalid_payload", `${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) {
    throw new HttpError(400, "invalid_payload", `${label} is required`);
  }
  return result;
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredEmail(value: unknown, label: string) {
  const result = requiredString(value, label).toLowerCase();
  if (!emailPattern.test(result)) {
    throw new HttpError(400, "invalid_payload", `${label} must be a valid email`);
  }
  return result;
}

function requiredNumber(value: unknown, label: string) {
  const result = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(result)) {
    throw new HttpError(400, "invalid_payload", `${label} must be a number`);
  }
  return result;
}

function isEmail(value: unknown) {
  return typeof value === "string" && emailPattern.test(value.trim().toLowerCase());
}

function formatMoney(value: number) {
  return `NT$ ${Math.round(value).toLocaleString("zh-TW")}`;
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

function parseOrderEmail(data: Record<string, unknown>): OrderEmail {
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new HttpError(400, "invalid_payload", "data.items must be a non-empty array");
  }

  return {
    orderNumber: requiredString(data.orderNumber, "data.orderNumber"),
    customerName: requiredString(data.customerName, "data.customerName"),
    customerEmail: requiredEmail(data.customerEmail, "data.customerEmail"),
    items: data.items.map(parseOrderItem),
    total: requiredNumber(data.total, "data.total"),
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

async function getAdminEmail() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return FALLBACK_ADMIN_EMAIL;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "footer")
      .maybeSingle();

    if (error) {
      console.warn("send-email: skipped footer settings lookup", error.message);
      return FALLBACK_ADMIN_EMAIL;
    }

    const settingValue = data?.setting_value as { contact_email?: unknown } | null | undefined;
    const contactEmail = optionalString(settingValue?.contact_email);
    return isEmail(contactEmail) ? contactEmail : FALLBACK_ADMIN_EMAIL;
  } catch (error) {
    console.warn(
      "send-email: skipped admin email lookup",
      error instanceof Error ? error.message : String(error),
    );
    return FALLBACK_ADMIN_EMAIL;
  }
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!resendApiKey) {
    throw new HttpError(
      503,
      "missing_resend_api_key",
      "郵件服務尚未完成設定：請在 Supabase Edge Function Secrets 加入 RESEND_API_KEY。",
    );
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
    throw new Error(`Resend request failed (${res.status}): ${text.slice(0, 500)}`);
  }

  return res.json();
}

const baseStyle = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: #f5f4f0;
  margin: 0;
  padding: 0;
`;

const cardStyle = `
  max-width: 600px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 20px rgba(0,0,0,0.07);
`;

const headerStyle = `
  background: #1c1917;
  padding: 36px 40px;
  text-align: center;
`;

const bodyStyle = `
  padding: 40px;
`;

const footerStyle = `
  background: #f5f4f0;
  padding: 24px 40px;
  text-align: center;
  border-top: 1px solid #e7e5e4;
`;

function wrapEmail(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <p style="color:#d6a96a;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px 0;">y &amp; m</p>
      <p style="color:#ffffff;font-size:22px;font-weight:300;letter-spacing:0.15em;margin:0;">YOU AND ME</p>
    </div>
    <div style="${bodyStyle}">
      ${content}
    </div>
    <div style="${footerStyle}">
      <p style="color:#a8a29e;font-size:12px;margin:0 0 4px 0;">© y &amp; m Coffee 精品禮盒</p>
      <p style="color:#c4b5a0;font-size:11px;margin:0;">此信件由系統自動發送，請勿直接回覆</p>
    </div>
  </div>
</body>
</html>`;
}

function generateContactAutoReply(data: ContactEmail) {
  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:22px;font-weight:300;margin:0 0 8px 0;">您好，${escapeHtml(data.name)}</h2>
    <p style="color:#d6a96a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 24px 0;">感謝您的來訊</p>
    <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
      我們已收到您關於「<strong>${escapeHtml(data.subject)}</strong>」的訊息。
    </p>
    <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
      我們的團隊將在工作日 24 小時內與您聯繫，感謝您對 y &amp; m Coffee 的支持與信任。
    </p>
    <div style="background:#faf9f7;border-left:3px solid #d6a96a;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="color:#a8a29e;font-size:12px;margin:0 0 4px 0;">服務時間</p>
      <p style="color:#1c1917;font-size:14px;margin:0;">週一至週五 09:00 - 18:00</p>
    </div>
  `);
}

function generateContactAdminNotify(data: ContactEmail) {
  const phoneRow = data.phone
    ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#a8a29e;font-size:12px;">電話</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(data.phone)}</td></tr>`
    : "";

  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:20px;font-weight:400;margin:0 0 4px 0;">新聯絡訊息</h2>
    <p style="color:#a8a29e;font-size:12px;margin:0 0 28px 0;">來自官網聯絡表單</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#a8a29e;font-size:12px;width:80px;">姓名</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(data.name)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#a8a29e;font-size:12px;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;"><a href="mailto:${escapeHtml(data.email)}" style="color:#d6a96a;">${escapeHtml(data.email)}</a></td></tr>
      ${phoneRow}
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#a8a29e;font-size:12px;">主旨</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(data.subject)}</td></tr>
    </table>
    <div style="background:#faf9f7;border-radius:8px;padding:20px;margin-top:20px;">
      <p style="color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px 0;">訊息內容</p>
      <p style="color:#1c1917;font-size:14px;line-height:1.7;margin:0;">${escapeMultiline(data.message)}</p>
    </div>
  `);
}

function generateOrderConfirmation(data: OrderEmail) {
  const paymentLabels: Record<string, string> = {
    credit_card: "信用卡付款",
    bank_transfer: "銀行轉帳",
    cash_on_delivery: "貨到付款",
  };

  const itemRows = data.items
    .map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(item.product_name)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f0ede8;color:#78716c;font-size:14px;text-align:center;">x${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;text-align:right;">${formatMoney(item.total)}</td>
    </tr>
  `)
    .join("");

  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:22px;font-weight:300;margin:0 0 4px 0;">感謝您的訂購！</h2>
    <p style="color:#a8a29e;font-size:13px;margin:0 0 28px 0;">${escapeHtml(data.customerName)} 您好，您的訂單已確認</p>
    <div style="background:#faf9f7;border-radius:10px;padding:16px 20px;margin-bottom:28px;display:inline-block;width:100%;box-sizing:border-box;">
      <p style="color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 4px 0;">訂單編號</p>
      <p style="color:#d6a96a;font-size:18px;font-weight:500;letter-spacing:0.1em;margin:0;">${escapeHtml(data.orderNumber)}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <th style="text-align:left;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">商品</th>
        <th style="text-align:center;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">數量</th>
        <th style="text-align:right;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">金額</th>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:16px 0 0 0;color:#1c1917;font-size:15px;font-weight:500;">訂單總計</td>
        <td style="padding:16px 0 0 0;color:#d6a96a;font-size:18px;font-weight:600;text-align:right;">${formatMoney(data.total)}</td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin-top:24px;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#a8a29e;font-size:12px;width:80px;">配送地址</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(data.address)}</td></tr>
      <tr><td style="padding:10px 0;color:#a8a29e;font-size:12px;">付款方式</td>
          <td style="padding:10px 0;color:#1c1917;font-size:14px;">${escapeHtml(paymentLabels[data.paymentMethod] || data.paymentMethod)}</td></tr>
    </table>
    <p style="color:#a8a29e;font-size:13px;line-height:1.6;margin:28px 0 0 0;padding-top:20px;border-top:1px solid #f0ede8;">
      如有任何問題，請透過官網聯絡我們，我們將盡快為您服務。
    </p>
  `);
}

function generateOrderAdminNotify(data: OrderEmail) {
  const paymentLabels: Record<string, string> = {
    credit_card: "信用卡付款",
    bank_transfer: "銀行轉帳",
    cash_on_delivery: "貨到付款",
  };
  const itemList = data.items
    .map((item) => `${escapeHtml(item.product_name)} x${item.quantity} ${formatMoney(item.total)}`)
    .join("<br>");

  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:20px;font-weight:400;margin:0 0 4px 0;">新訂單通知</h2>
    <p style="color:#a8a29e;font-size:12px;margin:0 0 28px 0;">訂單編號：<strong style="color:#d6a96a;">${escapeHtml(data.orderNumber)}</strong></p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#a8a29e;font-size:12px;width:80px;">客戶姓名</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(data.customerName)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#a8a29e;font-size:12px;">客戶 Email</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;"><a href="mailto:${escapeHtml(data.customerEmail)}" style="color:#d6a96a;">${escapeHtml(data.customerEmail)}</a></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#a8a29e;font-size:12px;">配送地址</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(data.address)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#a8a29e;font-size:12px;">付款方式</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(paymentLabels[data.paymentMethod] || data.paymentMethod)}</td></tr>
      <tr><td style="padding:10px 0;color:#a8a29e;font-size:12px;">訂單金額</td>
          <td style="padding:10px 0;color:#d6a96a;font-size:16px;font-weight:600;">${formatMoney(data.total)}</td></tr>
    </table>
    <div style="background:#faf9f7;border-radius:8px;padding:16px 20px;margin-top:20px;">
      <p style="color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px 0;">訂購商品</p>
      <p style="color:#1c1917;font-size:14px;line-height:2;margin:0;">${itemList}</p>
    </div>
  `);
}

function generateWelcomeEmail(data: WelcomeEmail) {
  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:24px;font-weight:300;margin:0 0 4px 0;">歡迎加入！</h2>
    <p style="color:#d6a96a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 28px 0;">Welcome to y &amp; m Coffee</p>
    <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
      親愛的 <strong>${escapeHtml(data.displayName)}</strong>，
    </p>
    <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
      感謝您加入 y &amp; m Coffee 會員！歡迎您踏入我們的精品咖啡世界，從產地到杯中，每一滴都是我們對品質的承諾。
    </p>
    <div style="background:#faf9f7;border-radius:10px;padding:24px;margin:24px 0;">
      <p style="color:#1c1917;font-size:13px;font-weight:500;margin:0 0 12px 0;">作為會員，您將享有：</p>
      <ul style="color:#57534e;font-size:14px;line-height:2;margin:0;padding-left:20px;">
        <li>專屬會員優惠與折扣</li>
        <li>新品搶先通知</li>
        <li>訂單記錄完整追蹤</li>
        <li>個人化咖啡體驗推薦</li>
      </ul>
    </div>
    <p style="color:#a8a29e;font-size:13px;margin:24px 0 0 0;">
      您的帳號：<span style="color:#1c1917;">${escapeHtml(data.email)}</span>
    </p>
  `);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Only POST is supported" }, 405);
  }

  try {
    const body = await readJson(req);
    const type = requiredString(body.type, "type");
    const data = asRecord(body.data, "data");
    const adminEmail = await getAdminEmail();

    switch (type) {
      case "contact": {
        const contact = parseContactEmail(data);
        await Promise.all([
          sendEmail({
            to: adminEmail,
            subject: `新聯絡訊息：${contact.subject}`,
            html: generateContactAdminNotify(contact),
            replyTo: contact.email,
          }),
          sendEmail({
            to: contact.email,
            subject: "已收到您的訊息 - Sonpin",
            html: generateContactAutoReply(contact),
          }),
        ]);
        break;
      }
      case "order_confirmation": {
        const order = parseOrderEmail(data);
        await Promise.all([
          sendEmail({
            to: order.customerEmail,
            subject: `訂單確認 ${order.orderNumber} - Sonpin`,
            html: generateOrderConfirmation(order),
          }),
          sendEmail({
            to: adminEmail,
            subject: `新訂單通知 ${order.orderNumber}`,
            html: generateOrderAdminNotify(order),
            replyTo: order.customerEmail,
          }),
        ]);
        break;
      }
      case "welcome": {
        const welcome = parseWelcomeEmail(data);
        await sendEmail({
          to: welcome.email,
          subject: "歡迎加入 Sonpin 會員！",
          html: generateWelcomeEmail(welcome),
        });
        break;
      }
      default:
        throw new HttpError(400, "unknown_email_type", `Unknown email type: ${type}`);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ error: error.code, message: error.message }, error.status);
    }

    console.error("send-email failed", error instanceof Error ? error.message : String(error));
    return jsonResponse(
      { error: "email_send_failed", message: "郵件寄送失敗，請稍後再試或聯絡網站管理員。" },
      500,
    );
  }
});
