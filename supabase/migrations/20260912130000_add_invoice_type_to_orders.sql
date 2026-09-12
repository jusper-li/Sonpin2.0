-- Store the invoice preference explicitly while keeping existing company fields.
alter table public.orders
  add column if not exists invoice_type text not null default 'personal';

alter table public.orders
  drop constraint if exists orders_invoice_type_check;

alter table public.orders
  add constraint orders_invoice_type_check
  check (invoice_type in ('personal', 'company'));
