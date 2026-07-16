/*
  # Add Customer Order Notification Template

  Backfill the customer order notification template into the existing notification_mail settings.
*/

INSERT INTO public.site_settings (setting_key, setting_value)
VALUES (
  'notification_mail',
  '{
    "admin_email": "service@sonpin.tw",
    "contact_enabled": true,
    "order_enabled": true,
    "remittance_enabled": true,
    "customer_copy_enabled": true,
    "customer_order_template": {
      "admin_subject": "Sonpin 訂單已送出：{{orderNumber}}",
      "admin_title": "訂單已送出",
      "admin_intro": "感謝您的訂購，以下是您的訂單資訊與匯款說明。",
      "admin_note": "若有任何問題，歡迎與客服中心聯繫。",
      "show_order_number": true,
      "show_customer_name": true,
      "show_customer_email": true,
      "show_address": true,
      "show_payment_method": true,
      "show_items": true,
      "show_totals": true,
      "show_shipping": true,
      "show_remittance_info": true
    }
  }'::jsonb
)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = jsonb_set(
  COALESCE(public.site_settings.setting_value, '{}'::jsonb),
  '{customer_order_template}',
  EXCLUDED.setting_value -> 'customer_order_template',
  true
);
