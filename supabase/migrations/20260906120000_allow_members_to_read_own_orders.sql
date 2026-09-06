/* Allow signed-in members to see only orders placed with their account email. */

drop policy if exists "Members can read own orders" on public.orders;
create policy "Members can read own orders"
  on public.orders
  for select
  to authenticated
  using (
    lower(coalesce(customer_email, '')) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
