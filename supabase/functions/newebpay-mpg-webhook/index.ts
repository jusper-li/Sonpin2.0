import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const fromHex = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

const pkcs7Unpad = (data: Uint8Array) => {
  const pad = data[data.length - 1];
  if (!pad || pad > 16) return data;
  return data.slice(0, data.length - pad);
};

const aesDecrypt = async (hexCipher: string, hashKey: string, hashIv: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(hashKey),
    { name: "AES-CBC" },
    false,
    ["decrypt"],
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: encoder.encode(hashIv) },
    key,
    fromHex(hexCipher),
  );
  return decoder.decode(pkcs7Unpad(new Uint8Array(plain)));
};

const parseQuery = (query: string) => {
  const params = new URLSearchParams(query);
  const output: Record<string, string> = {};
  params.forEach((value, key) => {
    output[key] = value;
  });
  return output;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hashKey = Deno.env.get("NEWEBPAY_HASH_KEY") ?? "";
    const hashIv = Deno.env.get("NEWEBPAY_HASH_IV") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const bodyText = await req.text();
    const body = new URLSearchParams(bodyText);
    const tradeInfo = body.get("TradeInfo") ?? "";
    const status = body.get("Status") ?? "";

    if (!tradeInfo || !hashKey || !hashIv) {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const decrypted = await aesDecrypt(tradeInfo, hashKey, hashIv);
    const parsed = parseQuery(decrypted);
    const merchantOrderNo = parsed.MerchantOrderNo ?? "";
    const tradeNo = parsed.TradeNo ?? "";
    const respondCode = parsed.RespondCode ?? "";
    const auth = parsed.Auth ?? "";
    const cardNo = parsed.CardNo ?? "";
    const amount = Number(parsed.Amt ?? 0);
    const paidOk = status.toUpperCase() === "SUCCESS" || auth === "SUCCESS" || respondCode === "00";

    if (!merchantOrderNo) {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { data: mpgOrder } = await supabase
      .from("newebpay_mpg_orders")
      .select("id, order_id")
      .eq("merchant_order_no", merchantOrderNo)
      .maybeSingle();

    if (!mpgOrder?.order_id) {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const paymentStatus = paidOk ? "paid" : "failed";
    const orderPaymentStatus = paidOk ? "paid" : "failed";
    const orderStatus = paidOk ? "processing" : "pending";

    await supabase
      .from("newebpay_mpg_orders")
      .update({
        status: paidOk ? "paid" : "failed",
        trade_no: tradeNo || null,
        respond_code: respondCode || null,
        card_no: cardNo || null,
        paid_at: paidOk ? new Date().toISOString() : null,
        raw_response: {
          status,
          parsed,
          raw: bodyText,
        },
      })
      .eq("id", mpgOrder.id);

    await supabase
      .from("payments")
      .update({
        status: paymentStatus,
        provider_status: status,
        transaction_id: tradeNo || merchantOrderNo,
        paid_at: paidOk ? new Date().toISOString() : null,
        metadata: {
          respond_code: respondCode,
          auth,
          card_no: cardNo,
          amount,
          merchant_order_no: merchantOrderNo,
        },
      })
      .eq("order_id", mpgOrder.order_id);

    await supabase
      .from("orders")
      .update({
        payment_status: orderPaymentStatus,
        status: orderStatus,
      })
      .eq("id", mpgOrder.order_id);

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("newebpay-mpg-webhook error:", error);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});

