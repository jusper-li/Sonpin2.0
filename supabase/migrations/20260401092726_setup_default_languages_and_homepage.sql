/*
  # Setup Default Languages and Homepage Content for Sonpin
*/

INSERT INTO languages (code, name, is_default, is_active) VALUES
  ('zh-TW', '繁體中文', true, true),
  ('en', 'English', false, true),
  ('ja', '日本語', false, true),
  ('ko', '한국어', false, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO homepage_sections (section_type, title, content, sort_order, is_active) VALUES
  (
    'hero',
    '首頁主視覺',
    '{
      "background_image": "",
      "title": "淞品土雞專賣店",
      "subtitle": "萬華老字號土雞專賣品牌",
      "description": "從門市到製程，堅持以新鮮、安心與熟悉的街區味道，帶給顧客最道地的土雞料理與滴雞精。",
      "buttons": [
        {"text": "商品介紹", "link": "/products", "style": "primary"},
        {"text": "店頭資訊", "link": "/store", "style": "secondary"}
      ]
    }'::jsonb,
    1,
    true
  ),
  (
    'about',
    '關於淞品',
    '{
      "image": "",
      "title": "關於淞品",
      "subtitle": "品牌起點",
      "description": "淞品土雞專賣店深耕萬華與三水街市場多年，以實在的土雞料理與滴雞精品項陪伴在地生活。",
      "features": [
        {"icon": "shield", "title": "安心來源", "description": "重視食材品質與來源透明"},
        {"icon": "flame", "title": "現做現售", "description": "維持每日新鮮出餐的節奏"},
        {"icon": "heart", "title": "在地服務", "description": "陪伴熟客與街區共同成長"}
      ]
    }'::jsonb,
    2,
    true
  ),
  (
    'products',
    '商品介紹',
    '{
      "title": "商品介紹",
      "subtitle": "淞品人氣商品",
      "description": "提供滴雞精、煙燻雞、鹹水雞與禮盒等多樣選擇。",
      "display_mode": "grid",
      "show_count": 6
    }'::jsonb,
    3,
    true
  ),
  (
    'stores',
    '店頭資訊',
    '{
      "title": "店頭資訊",
      "subtitle": "歡迎蒞臨",
      "description": "北部多個門市據點，歡迎就近前來選購。",
      "display_mode": "list"
    }'::jsonb,
    4,
    true
  ),
  (
    'contact',
    '客服中心',
    '{
      "title": "客服中心",
      "subtitle": "與我們聯繫",
      "description": "有任何訂單、門市或合作問題，歡迎與我們聯繫。",
      "email": "service@sonpin.tw",
      "phone": "02-2338-0018",
      "address": "台北市萬華區三水街84號"
    }'::jsonb,
    5,
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO translations (language_code, key, value) VALUES
  ('zh-TW', 'nav.home', '首頁'),
  ('zh-TW', 'nav.about', '關於淞品'),
  ('zh-TW', 'nav.products', '商品介紹'),
  ('zh-TW', 'nav.stores', '店頭資訊'),
  ('zh-TW', 'nav.contact', '客服中心'),
  ('zh-TW', 'footer.copyright', '© 2026 淞品土雞專賣店. All Rights Reserved.'),
  ('zh-TW', 'footer.privacy', '隱私權政策'),
  ('zh-TW', 'footer.terms', '服務條款'),
  ('zh-TW', 'footer.contact', '客服中心'),
  ('zh-TW', 'footer.stores', '店頭資訊'),
  ('zh-TW', 'footer.email', 'service@sonpin.tw'),
  ('zh-TW', 'common.loading', '載入中...'),
  ('zh-TW', 'common.error', '發生錯誤'),
  ('zh-TW', 'common.success', '成功'),
  ('zh-TW', 'common.cancel', '取消'),
  ('zh-TW', 'common.confirm', '確認'),
  ('zh-TW', 'common.save', '儲存'),
  ('zh-TW', 'common.delete', '刪除'),
  ('zh-TW', 'common.edit', '編輯')
ON CONFLICT (language_code, key) DO NOTHING;
