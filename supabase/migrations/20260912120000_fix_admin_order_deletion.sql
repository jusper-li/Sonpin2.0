-- Delete an order and its optional remittance notice atomically through an admin-only function.
create or replace function public.admin_delete_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_order_number text;
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;

  select order_number
    into target_order_number
    from public.orders
   where id = p_order_id;

  if target_order_number is null then
    raise exception 'Order not found';
  end if;

  delete from public.remittance_notifications
   where order_number = target_order_number;

  delete from public.orders
   where id = p_order_id;
end;
$$;

revoke all on function public.admin_delete_order(uuid) from public;
grant execute on function public.admin_delete_order(uuid) to authenticated;
