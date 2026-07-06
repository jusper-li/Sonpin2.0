/*
  Admin versioning and audit tracking.

  This migration:
  - hardens `site_settings` back to admin-only writes
  - extends `admin_audit_logs` with confirmation metadata
  - adds RPC helpers for recording checks and confirming review
  - adds triggers so admin-side content changes are recorded automatically
*/

create extension if not exists pgcrypto;

create schema if not exists private;

alter table public.admin_audit_logs
  add column if not exists is_confirmed boolean not null default false,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references public.admins(id) on delete set null;

alter table public.admin_audit_logs enable row level security;

create index if not exists admin_audit_logs_action_idx
  on public.admin_audit_logs(action, created_at desc);

create index if not exists admin_audit_logs_entity_idx
  on public.admin_audit_logs(entity_table, entity_id, created_at desc);

create index if not exists admin_audit_logs_confirmed_idx
  on public.admin_audit_logs(is_confirmed, created_at desc);

drop policy if exists "Anyone can update site settings" on public.site_settings;
drop policy if exists "Anyone can insert site settings" on public.site_settings;
drop policy if exists "Active admins can manage site settings" on public.site_settings;

create policy "Active admins can manage site settings"
  on public.site_settings
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create or replace function public.record_admin_audit_event(
  p_action text,
  p_entity_table text,
  p_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin_id uuid;
  v_log_id uuid;
begin
  if not private.is_admin() then
    return null;
  end if;

  v_admin_id := private.current_admin_id();
  if v_admin_id is null then
    return null;
  end if;

  insert into public.admin_audit_logs (
    admin_id,
    action,
    entity_table,
    entity_id,
    metadata,
    is_confirmed
  )
  values (
    v_admin_id,
    p_action,
    p_entity_table,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb),
    false
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

create or replace function public.confirm_admin_audit_log(
  p_log_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin_id uuid;
  v_confirmed_at timestamptz := now();
  v_rows integer;
begin
  if not private.is_admin() then
    return false;
  end if;

  v_admin_id := private.current_admin_id();
  if v_admin_id is null then
    return false;
  end if;

  update public.admin_audit_logs
  set
    is_confirmed = true,
    confirmed_at = coalesce(confirmed_at, v_confirmed_at),
    confirmed_by = coalesce(confirmed_by, v_admin_id),
    metadata = jsonb_set(
      jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        '{confirmed}',
        'true'::jsonb,
        true
      ),
      '{confirmed_at}',
      to_jsonb(coalesce(confirmed_at, v_confirmed_at)),
      true
    )
  where id = p_log_id;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

create or replace function private.record_admin_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin_id uuid;
  v_row_id text;
  v_before jsonb;
  v_after jsonb;
  v_action text := lower(TG_OP);
begin
  if not private.is_admin() then
    return coalesce(NEW, OLD);
  end if;

  v_admin_id := private.current_admin_id();
  if v_admin_id is null then
    return coalesce(NEW, OLD);
  end if;

  if TG_OP = 'DELETE' then
    v_before := to_jsonb(OLD);
    v_row_id := v_before->>'id';
  else
    v_after := to_jsonb(NEW);
    v_row_id := v_after->>'id';
    if TG_OP = 'UPDATE' then
      v_before := to_jsonb(OLD);
    end if;
  end if;

  insert into public.admin_audit_logs (
    admin_id,
    action,
    entity_table,
    entity_id,
    metadata,
    is_confirmed
  )
  values (
    v_admin_id,
    v_action,
    TG_TABLE_NAME,
    nullif(v_row_id, ''),
    jsonb_build_object(
      'operation', TG_OP,
      'confirmed', false,
      'checked_at', now(),
      'before', v_before,
      'after', v_after
    ),
    false
  );

  return coalesce(NEW, OLD);
end;
$$;

revoke all on function public.record_admin_audit_event(text, text, text, jsonb) from public, anon;
revoke all on function public.confirm_admin_audit_log(uuid) from public, anon;
grant execute on function public.record_admin_audit_event(text, text, text, jsonb) to authenticated;
grant execute on function public.confirm_admin_audit_log(uuid) to authenticated;

grant select, insert on public.admin_audit_logs to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'site_settings',
    'seo_settings',
    'articles',
    'homepage_sections',
    'social_accounts',
    'languages',
    'translations',
    'products',
    'categories',
    'stores',
    'faqs',
    'static_pages',
    'contact_inquiries',
    'members',
    'orders',
    'order_items',
    'payments',
    'admins',
    'roles',
    'permissions',
    'role_permissions',
    'admin_roles',
    'ai_chat_logs',
    'ai_usage_stats',
    'ai_learning_logs',
    'knowledge_base',
    'knowledge_categories',
    'chat_sessions',
    'chat_messages',
    'chat_feedback'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists %I on public.%I;', 'admin_audit_' || table_name, table_name);
      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function private.record_admin_audit_row_change();',
        'admin_audit_' || table_name,
        table_name
      );
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
