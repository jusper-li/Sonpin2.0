/*
  # Fix Hero main_title and Header Navigation Sync

  - Align hero title with the current Sonpin brand
  - Update header navigation to the Sonpin site structure
*/

UPDATE homepage_sections
SET content = content || '{"main_title": "淞品土雞專賣店"}'::jsonb
WHERE section_type = 'hero';

UPDATE site_settings
SET setting_value = setting_value || jsonb_build_object(
  'navigation', '[
    {"href": "/", "label": "首頁"},
    {"href": "/about", "label": "關於淞品"},
    {"href": "/products", "label": "商品介紹"},
    {"href": "/service", "label": "饕客分享"},
    {"href": "/store", "label": "店頭資訊"},
    {"href": "/media", "label": "相關報導"},
    {"href": "/contact", "label": "客服中心"}
  ]'::jsonb
)
WHERE setting_key = 'header';
