/*
  Restore public checkout insert policies for storefront order creation.

  The live Supabase project is missing the public insert policies that allow
  anonymous checkout flow writes to orders, order_items, and payments.
  This migration restores the checkout path without broadening admin access.
*/

drop policy if exists "Public can create checkout orders" on public.orders;
drop policy if exists "Public can create checkout order items" on public.order_items;
drop policy if exists "Public can create checkout payments" on public.payments;

create policy "Public can create checkout orders"
  on public.orders for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and payment_status in ('unpaid', 'pending')
    and total >= 0
    and subtotal >= 0
  );

create policy "Public can create checkout order items"
  on public.order_items for insert
  to anon, authenticated
  with check (
    quantity > 0
    and price >= 0
    and total >= 0
  );

create policy "Public can create checkout payments"
  on public.payments for insert
  to anon, authenticated
  with check (
    amount >= 0
    and status in ('pending', 'unpaid')
  );

