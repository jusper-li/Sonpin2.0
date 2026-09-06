insert into public.site_settings (setting_key, setting_value)
values (
  'cart_announcement',
  '{
    "enabled": false,
    "title": "購物提醒",
    "content": "",
    "image": "",
    "image_alt": "購物提醒",
    "link_url": "",
    "link_label": "了解更多"
  }'::jsonb
)
on conflict (setting_key) do nothing;
