import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type OrderItem = {
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

type OrderRecord = {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  subtotal: number | null;
  shipping: number | null;
  total: number | null;
  shipping_method: string | null;
  shipping_status: string | null;
  delivery_status: string | null;
  tracking_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  notes: string | null;
  created_at: string | null;
  completed_at: string | null;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizePhone = (value: unknown) =>
  typeof value === "string" ? value.replace(/[^\d+]/g, "").trim() : "";

const normalizeOrderNumber = (value: unknown) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const asRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const getShippingAddressValue = (shippingAddress: unknown, keys: string[]) => {
  const record = asRecord(shippingAddress);
  if (!record) return "";

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const verifyOrderAccess = (order: OrderRecord, verifier: string) => {
  const normalizedVerifier = verifier.trim();
  if (!normalizedVerifier) return false;

  const emailCandidates = [
    order.customer_email,
    getShippingAddressValue((order as OrderRecord & { shipping_address?: unknown }).shipping_address, ["email", "customer_email"]),
  ]
    .map(normalizeEmail)
    .filter(Boolean);

  const phoneCandidates = [
    order.customer_phone,
    order.recipient_phone,
    getShippingAddressValue((order as OrderRecord & { shipping_address?: unknown }).shipping_address, ["phone", "customer_phone", "recipient_phone"]),
  ]
    .map(normalizePhone)
    .filter(Boolean);

  const verifierEmail = normalizeEmail(normalizedVerifier);
  if (verifierEmail && emailCandidates.includes(verifierEmail)) {
    return true;
  }

  const verifierPhone = normalizePhone(normalizedVerifier);
  return Boolean(verifierPhone && phoneCandidates.includes(verifierPhone));
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => null);
    const data = asRecord(body);

    const orderNumber = normalizeOrderNumber(data?.orderNumber);
    const verifier = typeof data?.verifier === "string" ? data.verifier.trim() : "";

    if (!orderNumber || !verifier) {
      return jsonResponse(
        { error: "orderNumber and verifier are required" },
        400,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Supabase service credentials are not configured" }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, subtotal, shipping, total, shipping_method, shipping_status, delivery_status, tracking_number, customer_name, customer_email, customer_phone, recipient_name, recipient_phone, notes, created_at, completed_at, shipping_address",
      )
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError || !orderData) {
      return jsonResponse({ error: "找不到訂單，或驗證資料不符" }, 404);
    }

    const order = orderData as OrderRecord & { shipping_address?: unknown };
    if (!verifyOrderAccess(order, verifier)) {
      return jsonResponse({ error: "找不到訂單，或驗證資料不符" }, 404);
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("product_name, quantity, price, total")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      return jsonResponse({ error: "無法載入訂單明細" }, 500);
    }

    return jsonResponse({
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        shipping_method: order.shipping_method,
        shipping_status: order.shipping_status,
        delivery_status: order.delivery_status,
        tracking_number: order.tracking_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        recipient_name: order.recipient_name,
        recipient_phone: order.recipient_phone,
        notes: order.notes,
        created_at: order.created_at,
        completed_at: order.completed_at,
      },
      items: (itemsData || []) as OrderItem[],
    });
  } catch (error) {
    console.error("order-lookup error:", error);
    return jsonResponse({ error: "查詢失敗，請稍後再試" }, 500);
  }
});
