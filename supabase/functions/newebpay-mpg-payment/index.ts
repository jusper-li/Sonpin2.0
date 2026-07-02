import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

const pkcs7Pad = (data: Uint8Array, blockSize = 16) => {
  const padLength = blockSize - (data.length % blockSize || blockSize);
  const padded = new Uint8Array(data.length + padLength);
  padded.set(data);
  padded.fill(padLength, data.length);
  return padded;
};

const aesEncryptHex = async (plainText: string, hashKey: string, hashIv: string) => {
  const keyData = encoder.encode(hashKey);
  const iv = encoder.encode(hashIv);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "AES-CBC" }, false, ["encrypt"]);
  const padded = pkcs7Pad(encoder.encode(plainText));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, padded);
  return toHex(encrypted);
};

const buildTradeSha = async (tradeInfoHex: string, hashKey: string, hashIv: string) => {
  const raw = `HashKey=${hashKey}&${tradeInfoHex}&HashIV=${hashIv}`;
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
  return toHex(digest).toUpperCase();
};

const buildQueryString = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const merchantId = Deno.env.get("NEWEBPAY_MERCHANT_ID") ?? "";
    const hashKey = Deno.env.get("NEWEBPAY_HASH_KEY") ?? "";
    const hashIv = Deno.env.get("NEWEBPAY_HASH_IV") ?? "";
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
    const payGateway = Deno.env.get("NEWEBPAY_MPG_URL") ?? "https://core.newebpay.com/MPG/mpg_gateway";
    const version = Deno.env.get("NEWEBPAY_VERSION") ?? "1.6";

    if (!merchantId || !hashKey || !hashIv) {
      return new Response(
        JSON.stringify({ success: false, error: "NEWEBPAY secrets are not fully configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { orderId, payerEmail, payerName } = await req.json();
    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: "orderId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const amount = Math.max(1, Math.round(Number(order.total ?? 0)));
    const merchantOrderNo = `SP${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
    const nowTs = `${Math.floor(Date.now() / 1000)}`;
    const notifyUrl = `${supabaseUrl}/functions/v1/newebpay-mpg-webhook`;
    const clientBackUrl = `${siteUrl.replace(/\/$/, "")}/checkout/result?order_id=${encodeURIComponent(order.id)}`;

    const raw = buildQueryString({
      MerchantID: merchantId,
      RespondType: "JSON",
      TimeStamp: nowTs,
      Version: version,
      MerchantOrderNo: merchantOrderNo,
      Amt: `${amount}`,
      ItemDesc: `Sonpin Order ${order.order_number}`,
      Email: payerEmail ?? "",
      LoginType: "0",
      ReturnURL: notifyUrl,
      NotifyURL: notifyUrl,
      ClientBackURL: clientBackUrl,
      OrderComment: payerName ?? "",
    });

    const tradeInfo = await aesEncryptHex(raw, hashKey, hashIv);
    const tradeSha = await buildTradeSha(tradeInfo, hashKey, hashIv);

    const { error: mpgOrderError } = await supabase
      .from("newebpay_mpg_orders")
      .upsert(
        {
          order_id: order.id,
          merchant_order_no: merchantOrderNo,
          amount,
          payer_email: payerEmail ?? "",
          status: "pending",
          trade_info: tradeInfo,
          trade_sha: tradeSha,
        },
        { onConflict: "order_id" },
      );

    if (mpgOrderError) {
      return new Response(
        JSON.stringify({ success: false, error: mpgOrderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("payments")
      .update({
        transaction_id: merchantOrderNo,
        method: "credit_card",
        status: "pending",
        gateway_name: "newebpay",
      })
      .eq("order_id", order.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: payGateway,
        merchantId,
        tradeInfo,
        tradeSha,
        version,
        merchantOrderNo,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("newebpay-mpg-payment error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
