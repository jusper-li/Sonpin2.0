-- Keep legacy order numbers unchanged and assign the new format only to new orders.
create or replace function public.assign_new_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  date_key text := to_char(now() at time zone 'Asia/Taipei', 'YYYYMMDD');
  next_sequence integer;
begin
  -- The storefront still sends a legacy placeholder; replace it only on INSERT.
  if new.order_number is null or new.order_number like 'ORD-%' then
    perform pg_advisory_xact_lock(hashtext('sonpin-order-number:' || date_key));

    select coalesce(max(split_part(order_number, '-', 2)::integer), 0) + 1
      into next_sequence
      from public.orders
     where order_number ~ ('^' || date_key || '-[0-9]+$');

    new.order_number := date_key || '-' || next_sequence;
  end if;

  return new;
end;
$$;

drop trigger if exists assign_new_order_number_before_insert on public.orders;

create trigger assign_new_order_number_before_insert
before insert on public.orders
for each row
execute function public.assign_new_order_number();
