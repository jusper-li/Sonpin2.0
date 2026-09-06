INSERT INTO site_settings (setting_key, setting_value)
SELECT
  'homepage_hero_blocks',
  '[
    {"id":"banner-gift-box","mode":"custom","title":"淞品常溫滴雞精禮盒","image":"/sonpin-images/sonpin-room-temp-drip-gift-box.jpg","href":"/products","is_active":true,"sort_order":1},
    {"id":"banner-smoked-chicken","mode":"custom","title":"淞品畜產 煙燻放山雞","image":"/sonpin-images/sonpin-smoked-whole-chicken.png","href":"/products","is_active":true,"sort_order":2},
    {"id":"banner-salted-chicken","mode":"custom","title":"淞品鹹水雞，安心美味每一天","image":"/sonpin-images/sonpin-salted-whole-chicken.png","href":"/products","is_active":true,"sort_order":3},
    {"id":"banner-production","mode":"custom","title":"從產地到餐桌的安心堅持","image":"/sonpin-images/20250701170434.jpg","href":"/process","is_active":true,"sort_order":4}
  ]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM site_settings WHERE setting_key = 'homepage_hero_blocks'
);
