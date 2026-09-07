/* Add editable introductions for stores and factories. */

alter table public.stores
  add column if not exists description text not null default '';

update public.stores
set description = '首創產製銷一條龍作業
淞品用心 食在安心
淞品自有廠區 廠房'
where category = 'factory'
  and name like '%中央工廠%'
  and coalesce(description, '') = '';
