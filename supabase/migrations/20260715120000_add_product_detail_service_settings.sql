/*
  Add editable product detail shipping/service content.
*/

insert into public.site_settings (setting_key, setting_value)
values (
  'product_detail_service',
  '{
    "sections": [
      {
        "title": "付款方式",
        "items": [
          "銀行轉帳（匯款後出貨）",
          "請於下單後依完成頁顯示的匯款資訊完成轉帳"
        ]
      },
      {
        "title": "運送方式",
        "items": [
          "黑貓宅急便",
          "門市自取"
        ]
      },
      {
        "title": "出貨與到貨",
        "items": [
          "訂單成立後會盡快安排出貨",
          "實際到貨時間依物流公司配送為準"
        ]
      },
      {
        "title": "退換貨提醒",
        "items": [
          "食品類商品基於衛生考量，拆封後恕無法退換貨",
          "若商品有瑕疵，請於收到後盡快聯繫客服"
        ]
      }
    ]
  }'::jsonb
)
on conflict (setting_key) do update
set setting_value = excluded.setting_value,
    updated_at = now();

notify pgrst, 'reload schema';
