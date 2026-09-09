/* Let signed-in members see the items belonging to their own orders. */

drop policy if exists "Members can read own order items" on public.order_items;

create policy "Members can read own order items"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and (
          orders.customer_account = (select auth.uid())::text
          or lower(coalesce(orders.customer_email, '')) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
        )
    )
  );
