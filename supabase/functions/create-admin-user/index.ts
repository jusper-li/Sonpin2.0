import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Server configuration is incomplete" }, 500);

  const token = authorization.replace("Bearer ", "");
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user?.email) return json({ error: "Unauthorized" }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: caller, error: callerError } = await adminClient
    .from("admins")
    .select("id")
    .eq("is_active", true)
    .ilike("email", authData.user.email)
    .maybeSingle();
  if (callerError || !caller) return json({ error: "Only active admins can create admins" }, 403);

  const body = await request.json().catch(() => ({}));
  const action = body.action === "update" ? "update" : "create";
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const password = String(body.password || "");
  const isActive = body.is_active !== false;
  const roleIds = Array.isArray(body.role_ids) ? body.role_ids.filter((value): value is string => typeof value === "string") : [];

  if (!email || !name || (action === "create" && password.length < 6) || (action === "update" && password && password.length < 6)) {
    return json({ error: action === "create" ? "Name, email and a password of at least 6 characters are required" : "Name and email are required; a new password must be at least 6 characters" }, 400);
  }

  if (action === "update") {
    const adminId = String(body.admin_id || "").trim();
    if (!adminId) return json({ error: "admin_id is required" }, 400);

    const { data: existing, error: existingError } = await adminClient
      .from("admins")
      .select("id, auth_user_id")
      .eq("id", adminId)
      .maybeSingle();
    if (existingError || !existing) return json({ error: existingError?.message || "Admin record not found" }, 404);

    if (existing.auth_user_id) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(existing.auth_user_id, {
        email,
        ...(password ? { password } : {}),
        user_metadata: { display_name: name },
      });
      if (authUpdateError) return json({ error: authUpdateError.message }, 400);
    }

    const { error: adminUpdateError } = await adminClient
      .from("admins")
      .update({ email, name, is_active: isActive })
      .eq("id", adminId);
    if (adminUpdateError) return json({ error: adminUpdateError.message }, 400);

    const { error: clearRolesError } = await adminClient.from("admin_roles").delete().eq("admin_id", adminId);
    if (clearRolesError) return json({ error: clearRolesError.message }, 400);
    if (roleIds.length > 0) {
      const { error: roleError } = await adminClient.from("admin_roles").insert(roleIds.map((roleId) => ({ admin_id: adminId, role_id: roleId })));
      if (roleError) return json({ error: roleError.message }, 400);
    }

    return json({ success: true, admin_id: adminId });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name },
  });
  if (createError || !created.user) return json({ error: createError?.message || "Unable to create Auth user" }, 400);

  const { data: adminRecord, error: adminError } = await adminClient
    .from("admins")
    .insert({ email, name, is_active: isActive, auth_user_id: created.user.id, login_method: "email_password" })
    .select("id")
    .single();
  if (adminError || !adminRecord) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json({ error: adminError?.message || "Unable to create admin record" }, 400);
  }

  if (roleIds.length > 0) {
    const { error: roleError } = await adminClient.from("admin_roles").insert(roleIds.map((roleId) => ({ admin_id: adminRecord.id, role_id: roleId })));
    if (roleError) {
      await adminClient.from("admins").delete().eq("id", adminRecord.id);
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: roleError.message }, 400);
    }
  }

  return json({ success: true, admin_id: adminRecord.id, auth_user_id: created.user.id });
});
