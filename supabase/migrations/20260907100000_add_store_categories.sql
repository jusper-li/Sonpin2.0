/* Add explicit store categories for storefront grouping and backoffice editing. */

alter table public.stores
  add column if not exists category text not null default 'store';

update public.stores
set category = 'factory'
where (city = 'factory' or name like '%工廠%')
  and category = 'store';

update public.stores
set category = 'store'
where category is null or category not in ('store', 'factory');

alter table public.stores
  drop constraint if exists stores_category_check;

alter table public.stores
  add constraint stores_category_check check (category in ('store', 'factory'));

create index if not exists idx_stores_category on public.stores(category);
