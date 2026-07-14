import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

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

function formatMoney(value: number) {
  return `NT$ ${Math.round(value).toLocaleString("zh-TW")}`;
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
  const explicitAdminEmail = Deno.env.get("ADMIN_EMAIL")?.trim();
  if (isEmail(explicitAdminEmail)) {
    return explicitAdminEmail;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!supabaseUrl || !serviceRoleKey) return FALLBACK_ADMIN_EMAIL;

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
    console.warn("send-email: skipped admin email lookup", error instanceof Error ? error.message : String(error));
    return FALLBACK_ADMIN_EMAIL;
  }
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

function wrapEmail(content: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="font-family: Arial, Helvetica, sans-serif; background:#f5f4f0; margin:0; padding:0;">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.07);">
      <div style="background:#1c1917;padding:28px 40px;text-align:center;">
        <div style="color:#d6a96a;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px 0;">Sonpin</div>
        <div style="color:#fff;font-size:22px;font-weight:300;letter-spacing:0.15em;margin:0;">客服通知</div>
      </div>
      <div style="padding:40px;">${content}</div>
    </div>
  </body>
</html>`;
}

function generateContactAutoReply(data: ContactEmail) {
  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:22px;font-weight:300;margin:0 0 8px 0;">您好，${escapeHtml(data.name)}</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">我們已收到您關於 <strong>${escapeHtml(data.subject)}</strong> 的訊息。</p>
    <p style="color:#57534e;line-height:1.8;margin:0;">我們會盡快回覆您，謝謝您的聯繫。</p>
  `);
}

function generateContactAdminNotify(data: ContactEmail) {
  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:20px;font-weight:400;margin:0 0 16px 0;">新的聯絡表單</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>姓名：</strong>${escapeHtml(data.name)}</p>
    <p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>Email：</strong><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
    <p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>電話：</strong>${escapeHtml(data.phone || "-")}</p>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;"><strong>主旨：</strong>${escapeHtml(data.subject)}</p>
    <div style="background:#faf9f7;border-radius:8px;padding:16px 20px;">
      <p style="margin:0;white-space:pre-wrap;color:#1c1917;line-height:1.8;">${escapeHtml(data.message)}</p>
    </div>
  `);
}

function generateOrderConfirmation(data: OrderEmail) {
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;">${escapeHtml(item.product_name)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f0ede8;color:#78716c;font-size:14px;text-align:center;">x${item.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f0ede8;color:#1c1917;font-size:14px;text-align:right;">${formatMoney(item.total)}</td>
        </tr>`,
    )
    .join("");

  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:22px;font-weight:300;margin:0 0 4px 0;">訂單確認</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">${escapeHtml(data.customerName)}，感謝您訂購 Sonpin。</p>
    <p style="color:#d6a96a;font-size:18px;font-weight:600;margin:0 0 24px 0;">${escapeHtml(data.orderNumber)}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <th style="text-align:left;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">商品</th>
        <th style="text-align:center;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">數量</th>
        <th style="text-align:right;color:#a8a29e;font-size:11px;font-weight:400;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid #e7e5e4;">金額</th>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:16px 0 0 0;color:#1c1917;font-size:15px;font-weight:500;">訂單總計</td>
        <td style="padding:16px 0 0 0;color:#d6a96a;font-size:18px;font-weight:600;text-align:right;">${formatMoney(data.total)}</td>
      </tr>
    </table>
    <p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>配送地址：</strong>${escapeHtml(data.address)}</p>
    <p style="color:#57534e;line-height:1.8;margin:0;"><strong>付款方式：</strong>${escapeHtml(paymentMethodLabel(data.paymentMethod))}</p>
  `);
}

function generateOrderAdminNotify(data: OrderEmail) {
  const itemList = data.items
    .map((item) => `${escapeHtml(item.product_name)} x${item.quantity} ${formatMoney(item.total)}`)
    .join("<br>");

  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:20px;font-weight:400;margin:0 0 4px 0;">新的訂單通知</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;"><strong>訂單號：</strong>${escapeHtml(data.orderNumber)}</p>
    <p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>姓名：</strong>${escapeHtml(data.customerName)}</p>
    <p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>Email：</strong><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></p>
    <p style="color:#57534e;line-height:1.8;margin:0 0 8px 0;"><strong>地址：</strong>${escapeHtml(data.address)}</p>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;"><strong>付款方式：</strong>${escapeHtml(paymentMethodLabel(data.paymentMethod))}</p>
    <div style="background:#faf9f7;border-radius:8px;padding:16px 20px;">
      <p style="margin:0 0 8px 0;color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">訂單明細</p>
      <p style="color:#1c1917;font-size:14px;line-height:1.9;margin:0;">${itemList}</p>
    </div>
  `);
}

function generateWelcomeEmail(data: WelcomeEmail) {
  return wrapEmail(`
    <h2 style="color:#1c1917;font-size:24px;font-weight:300;margin:0 0 4px 0;">歡迎加入 Sonpin</h2>
    <p style="color:#57534e;line-height:1.8;margin:0 0 16px 0;">親愛的 <strong>${escapeHtml(data.displayName)}</strong>，感謝您加入我們。</p>
    <p style="color:#57534e;line-height:1.8;margin:0;">您現在可以瀏覽商品、查詢訂單並接收最新消息。</p>
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
    const adminEmail = await getAdminEmail();

    switch (type) {
      case "contact": {
        const contact = parseContactEmail(data);
        await Promise.all([
          sendEmail({
            to: adminEmail,
            subject: `Sonpin 聯絡表單：${contact.subject}`,
            html: generateContactAdminNotify(contact),
            replyTo: contact.email,
          }),
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
        await Promise.allSettled([
          sendEmail({
            to: order.customerEmail,
            subject: `Sonpin 訂單確認 ${order.orderNumber}`,
            html: generateOrderConfirmation(order),
          }),
          sendEmail({
            to: adminEmail,
            subject: `Sonpin 新訂單 ${order.orderNumber}`,
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
          subject: "Sonpin 歡迎加入",
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
