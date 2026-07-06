/*
  Allow the storefront to read published media articles and active stores.
  This restores `/media` and `/store` for anonymous visitors without touching
  schema or admin permissions.
*/

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
  on public.articles for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Public can read active stores" on public.stores;
create policy "Public can read active stores"
  on public.stores for select
  to anon, authenticated
  using (is_active = true);

notify pgrst, 'reload schema';
