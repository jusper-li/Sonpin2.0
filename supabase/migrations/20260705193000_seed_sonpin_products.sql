/*
  Sonpin product seed.

  This seed keeps the frontend and backend aligned for:
  - /products (13 items total)
  - /products/6 main products
  - /products/7 other products

  Notes:
  - Uses fixed UUIDs for deterministic category/product references.
  - Frontend still keeps fallback content, but Supabase can now drive the catalog.
*/

insert into public.categories (id, name, slug, description, sort_order, is_active)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '主打商品',
    'main-products',
    '淞品主打禮盒與招牌熟食。',
    1,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '其他商品',
    'other-products',
    '淞品其他熟食與單品。',
    2,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.site_settings (setting_key, setting_value)
values
(
  'product_order',
  '[
    "sonpin-drip-essence",
    "sonpin-smoked-whole-chicken",
    "sonpin-salted-whole-chicken",
    "sonpin-30-pack-drip-gift-box",
    "sonpin-whole-chicken-12-pack-drip-gift-box",
    "sonpin-room-temp-drip-gift-box",
    "sonpin-salted-half-chicken",
    "sonpin-smoked-half-chicken",
    "sonpin-salted-plate",
    "sonpin-smoked-plate",
    "sonpin-braised-chicken-feet",
    "sonpin-chicken-gizzard",
    "sonpin-chicken-intestine"
  ]'::jsonb
)
on conflict (setting_key) do update
set setting_value = excluded.setting_value;

insert into public.products (
  id,
  category_id,
  name,
  slug,
  summary,
  description,
  price,
  sale_price,
  stock,
  sku,
  images,
  specifications,
  content,
  seo_title,
  seo_description,
  seo_keywords,
  og_image,
  is_active,
  is_featured,
  created_at,
  updated_at
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '淞品滴雞精',
    'sonpin-drip-essence',
    '每日補養的經典滴雞精，溫潤順口、方便補充元氣。',
    '選用台灣土雞慢火滴煉，保留雞肉精華的高湯風味。',
    850,
    null,
    99,
    'SONPIN-DRIP-ESSENCE',
    '["/sonpin-images/sonpin-drip-essence.jpg"]'::jsonb,
    '[
      {"name":"容量","value":"65ML / 8包入"},
      {"name":"類型","value":"滴雞精"},
      {"name":"售價","value":"NT$850"}
    ]'::jsonb,
    '',
    '淞品滴雞精',
    '每日補養的經典滴雞精，溫潤順口、方便補充元氣。',
    '淞品滴雞精, 滴雞精, 禮盒, 補養',
    '/sonpin-images/sonpin-drip-essence.jpg',
    true,
    true,
    '2026-07-05T09:00:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '淞品煙燻雞-全雞',
    'sonpin-smoked-whole-chicken',
    '節慶聚會的招牌全雞，煙燻香氣濃郁。',
    '以傳統工法製作，適合家庭分享與宴客。',
    700,
    null,
    30,
    'SONPIN-SMOKED-WHOLE',
    '["/sonpin-images/sonpin-smoked-whole-chicken.png"]'::jsonb,
    '[
      {"name":"類型","value":"煙燻雞"},
      {"name":"部位","value":"全雞"},
      {"name":"售價","value":"NT$700"}
    ]'::jsonb,
    '',
    '淞品煙燻雞-全雞',
    '節慶聚會的招牌全雞，煙燻香氣濃郁。',
    '淞品煙燻雞, 煙燻雞, 全雞',
    '/sonpin-images/sonpin-smoked-whole-chicken.png',
    true,
    false,
    '2026-07-05T09:01:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '淞品鹽水雞-全雞',
    'sonpin-salted-whole-chicken',
    '清爽鹹香的經典全雞，肉質鮮嫩。',
    '以簡單調味突顯雞肉原味，是日常餐桌的人氣選擇。',
    700,
    null,
    30,
    'SONPIN-SALTED-WHOLE',
    '["/sonpin-images/sonpin-salted-whole-chicken.png"]'::jsonb,
    '[
      {"name":"類型","value":"鹽水雞"},
      {"name":"部位","value":"全雞"},
      {"name":"售價","value":"NT$700"}
    ]'::jsonb,
    '',
    '淞品鹽水雞-全雞',
    '清爽鹹香的經典全雞，肉質鮮嫩。',
    '淞品鹽水雞, 鹽水雞, 全雞',
    '/sonpin-images/sonpin-salted-whole-chicken.png',
    true,
    false,
    '2026-07-05T09:02:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '30包滴雞精禮盒',
    'sonpin-30-pack-drip-gift-box',
    '30 包入禮盒，送禮自用皆合適。',
    '大容量禮盒設計，適合長輩滋補或企業贈禮。',
    3000,
    null,
    20,
    'SONPIN-30PACK-DRIP',
    '["/sonpin-images/163081696885.jpg","/sonpin-images/20240618103536.jpg"]'::jsonb,
    '[
      {"name":"容量","value":"65ML / 30包"},
      {"name":"類型","value":"滴雞精禮盒"},
      {"name":"售價","value":"NT$3000"}
    ]'::jsonb,
    '',
    '30包滴雞精禮盒',
    '30包入滴雞精禮盒，送禮自用皆合適。',
    '滴雞精禮盒, 30包, 補養',
    '/sonpin-images/163081696885.jpg',
    true,
    false,
    '2026-07-05T09:03:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '1隻雞+12包滴雞精禮盒',
    'sonpin-whole-chicken-12-pack-drip-gift-box',
    '全雞與滴雞精組合禮盒。',
    '兼具熟食與滋補，適合節慶贈禮。',
    1900,
    null,
    20,
    'SONPIN-CHICKEN-12PACK',
    '["/sonpin-images/163081802847.jpg","/sonpin-images/20240618103604.jpg"]'::jsonb,
    '[
      {"name":"組合","value":"1隻雞 + 12包滴雞精"},
      {"name":"類型","value":"綜合禮盒"},
      {"name":"售價","value":"NT$1900"}
    ]'::jsonb,
    '',
    '1隻雞+12包滴雞精禮盒',
    '全雞與滴雞精組合禮盒。',
    '綜合禮盒, 滴雞精, 全雞',
    '/sonpin-images/163081802847.jpg',
    true,
    false,
    '2026-07-05T09:04:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    '淞品常溫滴雞精禮盒',
    'sonpin-room-temp-drip-gift-box',
    '常溫保存的滴雞精禮盒，外出送禮更方便。',
    '常溫包裝設計，保存與攜帶都更彈性。',
    850,
    null,
    20,
    'SONPIN-ROOM-TEMP-DRIP',
    '["/sonpin-images/175136093578.jpg","/sonpin-images/20250701170434.jpg","/sonpin-images/20250701175515.jpg"]'::jsonb,
    '[
      {"name":"容量","value":"50ML / 8包"},
      {"name":"類型","value":"常溫滴雞精"},
      {"name":"售價","value":"NT$850"}
    ]'::jsonb,
    '',
    '淞品常溫滴雞精禮盒',
    '常溫保存的滴雞精禮盒，外出送禮更方便。',
    '常溫滴雞精, 滴雞精禮盒',
    '/sonpin-images/175136093578.jpg',
    true,
    false,
    '2026-07-05T09:05:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000007',
    '22222222-2222-2222-2222-222222222222',
    '淞品鹽水雞-半隻(暫不提供網路購買)',
    'sonpin-salted-half-chicken',
    '半隻鹽水雞，清爽不膩。',
    '採用經典鹽水滷製，適合現場選購。',
    350,
    330,
    25,
    'SONPIN-SALTED-HALF',
    '["/sonpin-images/153268378688.png","/sonpin-images/20180730140352.png"]'::jsonb,
    '[
      {"name":"規格","value":"半隻"},
      {"name":"類型","value":"鹽水雞"},
      {"name":"售價","value":"NT$350"}
    ]'::jsonb,
    '',
    '淞品鹽水雞-半隻(暫不提供網路購買)',
    '半隻鹽水雞，清爽不膩。',
    '半隻, 鹽水雞',
    '/sonpin-images/153268378688.png',
    true,
    false,
    '2026-07-05T09:06:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000008',
    '22222222-2222-2222-2222-222222222222',
    '淞品煙燻雞-半隻(暫不提供網路購買)',
    'sonpin-smoked-half-chicken',
    '半隻煙燻雞，香氣濃厚。',
    '煙燻工法讓雞肉更具風味，適合現場購買。',
    350,
    330,
    25,
    'SONPIN-SMOKED-HALF',
    '["/sonpin-images/153268393092.png","/sonpin-images/20180730140213.png"]'::jsonb,
    '[
      {"name":"規格","value":"半隻"},
      {"name":"類型","value":"煙燻雞"},
      {"name":"售價","value":"NT$350"}
    ]'::jsonb,
    '',
    '淞品煙燻雞-半隻(暫不提供網路購買)',
    '半隻煙燻雞，香氣濃厚。',
    '半隻, 煙燻雞',
    '/sonpin-images/153268393092.png',
    true,
    false,
    '2026-07-05T09:07:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000009',
    '22222222-2222-2222-2222-222222222222',
    '淞品鹽水雞-小盤(暫不提供網路購買)',
    'sonpin-salted-plate',
    '鹽水雞小盤份量，方便即食。',
    '小份量盤裝，適合單人享用。',
    120,
    null,
    40,
    'SONPIN-SALTED-PLATE',
    '["/sonpin-images/153268404282.png","/sonpin-images/20180730141121.png"]'::jsonb,
    '[
      {"name":"規格","value":"小盤"},
      {"name":"類型","value":"鹽水雞"},
      {"name":"售價","value":"NT$120"}
    ]'::jsonb,
    '',
    '淞品鹽水雞-小盤(暫不提供網路購買)',
    '鹽水雞小盤份量，方便即食。',
    '小盤, 鹽水雞',
    '/sonpin-images/153268404282.png',
    true,
    false,
    '2026-07-05T09:08:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000010',
    '22222222-2222-2222-2222-222222222222',
    '淞品煙燻雞-小盤(暫不提供網路購買)',
    'sonpin-smoked-plate',
    '煙燻雞小盤份量，風味濃郁。',
    '適合即食與小份分享。',
    120,
    null,
    40,
    'SONPIN-SMOKED-PLATE',
    '["/sonpin-images/153268438297.png","/sonpin-images/20180730141138.png"]'::jsonb,
    '[
      {"name":"規格","value":"小盤"},
      {"name":"類型","value":"煙燻雞"},
      {"name":"售價","value":"NT$120"}
    ]'::jsonb,
    '',
    '淞品煙燻雞-小盤(暫不提供網路購買)',
    '煙燻雞小盤份量，風味濃郁。',
    '小盤, 煙燻雞',
    '/sonpin-images/153268438297.png',
    true,
    false,
    '2026-07-05T09:09:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000011',
    '22222222-2222-2222-2222-222222222222',
    '淞品滷鳳爪-真空包裝(暫不提供網路購買)',
    'sonpin-braised-chicken-feet',
    '滷鳳爪真空包裝，鹹香入味。',
    '適合下酒、配飯或現場選購。',
    150,
    130,
    30,
    'SONPIN-BRAISED-FEET',
    '["/sonpin-images/153268469617.png","/sonpin-images/20180730141215.png","/sonpin-images/20180730141239.png"]'::jsonb,
    '[
      {"name":"規格","value":"真空包裝"},
      {"name":"類型","value":"滷鳳爪"},
      {"name":"售價","value":"NT$150"}
    ]'::jsonb,
    '',
    '淞品滷鳳爪-真空包裝(暫不提供網路購買)',
    '滷鳳爪真空包裝，鹹香入味。',
    '滷鳳爪, 真空包裝',
    '/sonpin-images/153268469617.png',
    true,
    false,
    '2026-07-05T09:10:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000012',
    '22222222-2222-2222-2222-222222222222',
    '淞品雞胗-真空包裝(暫不提供網路購買)',
    'sonpin-chicken-gizzard',
    '雞胗真空包裝，口感彈牙。',
    '滷製後保留香氣，方便攜帶。',
    150,
    130,
    30,
    'SONPIN-CHICKEN-GIZZARD',
    '["/sonpin-images/153268485723.png","/sonpin-images/20180730141311.png","/sonpin-images/20180730141326.png"]'::jsonb,
    '[
      {"name":"規格","value":"真空包裝"},
      {"name":"類型","value":"雞胗"},
      {"name":"售價","value":"NT$150"}
    ]'::jsonb,
    '',
    '淞品雞胗-真空包裝(暫不提供網路購買)',
    '雞胗真空包裝，口感彈牙。',
    '雞胗, 真空包裝',
    '/sonpin-images/153268485723.png',
    true,
    false,
    '2026-07-05T09:11:00+08:00',
    now()
  ),
  (
    '30000000-0000-0000-0000-000000000013',
    '22222222-2222-2222-2222-222222222222',
    '淞品雞腸-真空包裝(暫不提供網路購買)',
    'sonpin-chicken-intestine',
    '雞腸真空包裝，經典小菜。',
    '滷香風味濃郁，適合熟食商品陳列。',
    150,
    130,
    30,
    'SONPIN-CHICKEN-INTESTINE',
    '["/sonpin-images/153268493255.png","/sonpin-images/20180730141358.png","/sonpin-images/20180730141419.png"]'::jsonb,
    '[
      {"name":"規格","value":"真空包裝"},
      {"name":"類型","value":"雞腸"},
      {"name":"售價","value":"NT$150"}
    ]'::jsonb,
    '',
    '淞品雞腸-真空包裝(暫不提供網路購買)',
    '雞腸真空包裝，經典小菜。',
    '雞腸, 真空包裝',
    '/sonpin-images/153268493255.png',
    true,
    false,
    '2026-07-05T09:12:00+08:00',
    now()
  )
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  summary = excluded.summary,
  description = excluded.description,
  price = excluded.price,
  sale_price = excluded.sale_price,
  stock = excluded.stock,
  sku = excluded.sku,
  images = excluded.images,
  specifications = excluded.specifications,
  content = excluded.content,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  seo_keywords = excluded.seo_keywords,
  og_image = excluded.og_image,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured,
  updated_at = now();
