/* Let signed-in members see orders linked to their account ID or checkout email. */

drop policy if exists "Members can read own orders" on public.orders;

create policy "Members can read own orders"
  on public.orders
  for select
  to authenticated
  using (
    customer_account = (select auth.uid())::text
    or lower(coalesce(customer_email, '')) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
