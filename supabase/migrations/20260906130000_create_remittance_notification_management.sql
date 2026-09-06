create table if not exists public.remittance_notifications (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  remittance_amount numeric not null default 0 check (remittance_amount >= 0),
  remitter_account_last5 text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_remittance_notifications_created_at on public.remittance_notifications(created_at desc);
create index if not exists idx_remittance_notifications_order_number on public.remittance_notifications(order_number);

alter table public.remittance_notifications enable row level security;

drop policy if exists "Public can submit remittance notifications" on public.remittance_notifications;
create policy "Public can submit remittance notifications"
  on public.remittance_notifications for insert
  to anon, authenticated
  with check (remittance_amount >= 0 and length(remitter_account_last5) between 1 and 5);

drop policy if exists "Active admins can manage remittance notifications" on public.remittance_notifications;
create policy "Active admins can manage remittance notifications"
  on public.remittance_notifications for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());
