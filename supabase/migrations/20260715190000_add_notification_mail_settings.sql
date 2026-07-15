/*
  # Add Notification Mail Settings

  Store the admin notification email and notification toggles in site_settings.
*/

INSERT INTO public.site_settings (setting_key, setting_value)
VALUES (
  'notification_mail',
  '{
    "admin_email": "service@sonpin.tw",
    "contact_enabled": true,
    "order_enabled": true,
    "remittance_enabled": true,
    "customer_copy_enabled": true
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;
