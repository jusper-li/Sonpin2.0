/*
  Allow the storefront to read active categories and products again.
  This restores the `/products` collection and product detail pages without
  changing the schema or admin policies.
*/

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
  on public.categories for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select
  to anon, authenticated
  using (
    is_active = true
    and coalesce(is_hidden, false) = false
    and (published_at is null or published_at <= now())
    and (unpublished_at is null or unpublished_at > now())
  );

notify pgrst, 'reload schema';

