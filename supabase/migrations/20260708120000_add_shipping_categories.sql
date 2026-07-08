/*
  Add configurable shipping categories and link products to them.
  Checkout can then calculate shipping automatically from the products in cart.
*/

create table if not exists public.shipping_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity integer not null default 1,
  quantity_to integer,
  amount numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint shipping_categories_quantity_check check (quantity > 0),
  constraint shipping_categories_quantity_to_check check (quantity_to is null or quantity_to >= quantity),
  constraint shipping_categories_amount_check check (amount >= 0)
);

alter table public.shipping_categories enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgname = 'update_shipping_categories_updated_at'
      and tgrelid = 'public.shipping_categories'::regclass
  ) then
    drop trigger update_shipping_categories_updated_at on public.shipping_categories;
  end if;

  create trigger update_shipping_categories_updated_at
    before update on public.shipping_categories
    for each row execute function public.update_updated_at_column();
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'shipping_category_id'
  ) then
    alter table public.products
      add column shipping_category_id uuid;
  end if;

  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'products'
      and constraint_name = 'products_shipping_category_id_fkey'
  ) then
    alter table public.products
      add constraint products_shipping_category_id_fkey
      foreign key (shipping_category_id)
      references public.shipping_categories(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_products_shipping_category_id
  on public.products(shipping_category_id);

insert into public.shipping_categories (name, quantity, quantity_to, amount, is_active)
select '常溫宅配', 1, null, 100, true
where not exists (
  select 1
  from public.shipping_categories
  where name = '常溫宅配'
);

update public.products
set shipping_category_id = (
  select id
  from public.shipping_categories
  where name = '常溫宅配'
  order by created_at asc
  limit 1
)
where shipping_category_id is null;

grant select on public.shipping_categories to anon, authenticated;
grant insert, update, delete on public.shipping_categories to authenticated;

drop policy if exists "Public can read active shipping categories" on public.shipping_categories;
create policy "Public can read active shipping categories"
  on public.shipping_categories for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Active admins can manage shipping categories" on public.shipping_categories;
create policy "Active admins can manage shipping categories"
  on public.shipping_categories for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

notify pgrst, 'reload schema';
