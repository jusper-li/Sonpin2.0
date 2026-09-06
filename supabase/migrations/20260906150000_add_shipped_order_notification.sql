/* Add customer notification settings for the shipped order state. */

insert into public.site_settings (setting_key, setting_value)
values (
  'notification_mail',
  jsonb_build_object(
    'shipped_enabled', true,
    'shipped_template', jsonb_build_object(
      'admin_subject', 'Sonpin 訂單已出貨：{{orderNumber}}',
      'admin_title', '訂單已出貨',
      'admin_intro', '您的訂單已完成出貨，以下是本次訂單與配送資訊。',
      'admin_note', '如有配送問題，歡迎聯繫客服中心。',
      'show_order_number', true,
      'show_customer_name', true,
      'show_customer_email', false,
      'show_address', true,
      'show_payment_method', false,
      'show_items', true,
      'show_totals', true,
      'show_shipping', true,
      'show_remittance_info', false
    )
  )
)
on conflict (setting_key) do update
set setting_value = jsonb_set(
  jsonb_set(
    coalesce(public.site_settings.setting_value, '{}'::jsonb),
    '{shipped_enabled}',
    'true'::jsonb,
    true
  ),
  '{shipped_template}',
  excluded.setting_value -> 'shipped_template',
  true
);
