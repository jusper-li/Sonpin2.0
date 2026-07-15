/*
  Add order inquiry navigation entries to header/footer site settings.
*/

update public.site_settings
set setting_value = jsonb_set(
  setting_value,
  '{navigation}',
  (
    case
      when exists (
        select 1
        from jsonb_array_elements(coalesce(setting_value->'navigation', '[]'::jsonb)) as item
        where item->>'href' = '/order-query'
      )
      then coalesce(setting_value->'navigation', '[]'::jsonb)
      else coalesce(setting_value->'navigation', '[]'::jsonb)
        || jsonb_build_array(jsonb_build_object('label', '訂單查詢', 'href', '/order-query'))
    end
  ),
  true
)
where setting_key = 'header';

update public.site_settings
set setting_value = jsonb_set(
  setting_value,
  '{link_groups,1,links}',
  (
    case
      when exists (
        select 1
        from jsonb_array_elements(coalesce(setting_value->'link_groups'->1->'links', '[]'::jsonb)) as item
        where item->>'href' = '/order-query'
      )
      then coalesce(setting_value->'link_groups'->1->'links', '[]'::jsonb)
      else coalesce(setting_value->'link_groups'->1->'links', '[]'::jsonb)
        || jsonb_build_array(jsonb_build_object('label', '訂單查詢', 'href', '/order-query'))
    end
  ),
  true
)
where setting_key = 'footer';
