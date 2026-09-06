alter table public.products
  add column if not exists is_unlimited_stock boolean not null default false;

comment on column public.products.is_unlimited_stock is
  '商品是否使用無限庫存；啟用後前台不以 stock 數字限制購買數量';
