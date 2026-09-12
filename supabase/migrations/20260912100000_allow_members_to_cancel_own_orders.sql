/* Allow authenticated members to cancel their own unfulfilled orders. */

drop policy if exists "Members can cancel own pending orders" on public.orders;
create policy "Members can cancel own pending orders"
  on public.orders
  for update
  to authenticated
  using (
    status in ('pending', 'processing')
    and (
      customer_account = auth.uid()::text
      or lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    status = 'cancelled'
    and (
      customer_account = auth.uid()::text
      or lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
