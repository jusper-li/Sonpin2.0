/*
  Sonpin bootstrap seed.

  This seed prepares:
  - The first backoffice administrator record
  - Core site settings (header/footer)
  - Initial homepage sections
  - Basic static pages

  Note:
  - The related Supabase Auth user must exist for verification-code login to work.
  - The initial admin password is stored as a bcrypt hash for bootstrap reference.
*/

create extension if not exists pgcrypto;

insert into public.admins (
  email,
  name,
  password_hash,
  login_method,
  is_active
)
values (
  'k286336@gmail.com',
  'Sonpin 管理員',
  crypt('888888', gen_salt('bf')),
  'email_magic_link',
  true
)
on conflict (email) do update
set
  name = excluded.name,
  password_hash = excluded.password_hash,
  login_method = excluded.login_method,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.site_settings (setting_key, setting_value)
values
(
  'header',
  '{
    "logo_text": "淞品土雞",
    "logo_image": "/LOGO-1.png",
    "navigation": [
      {"label": "首頁", "href": "/"},
      {"label": "關於淞品", "href": "/about"},
      {"label": "商品介紹", "href": "/products"},
      {"label": "生產製程", "href": "/culture"},
      {"label": "饕客分享", "href": "/service"},
      {"label": "店頭資訊", "href": "/store"},
      {"label": "相關報導", "href": "/media"},
      {"label": "會員專區", "href": "/member"},
      {"label": "客服中心", "href": "/contact"}
    ],
    "show_cart": true,
    "show_language_selector": true
  }'::jsonb
),
(
  'footer',
  '{
    "about_text": "淞品土雞專注提供安心、美味且適合送禮與自用的雞品與熟食，讓日常餐桌與節慶贈禮都有更好的選擇。",
    "contact_email": "service@sonpin.tw",
    "contact_phone": "02-2338-0018",
    "social_links": {
      "facebook": "",
      "instagram": "",
      "youtube": ""
    },
    "copyright_text": "© 2026 淞品土雞。All Rights Reserved.",
    "link_groups": [
      {
        "title": "關於我們",
        "links": [
          {"label": "關於淞品", "href": "/about"},
          {"label": "生產製程", "href": "/culture"},
          {"label": "客服中心", "href": "/contact"}
        ]
      },
      {
        "title": "商品與服務",
        "links": [
          {"label": "商品介紹", "href": "/products"},
          {"label": "饕客分享", "href": "/service"},
          {"label": "店頭資訊", "href": "/store"},
          {"label": "相關報導", "href": "/media"}
        ]
      },
      {
        "title": "常見資訊",
        "links": [
          {"label": "購物須知", "href": "/shipping"},
          {"label": "退換貨政策", "href": "/returns"},
          {"label": "隱私權政策", "href": "/privacy"}
        ]
      }
    ]
  }'::jsonb
)
on conflict (setting_key) do update
set setting_value = excluded.setting_value;

delete from public.homepage_sections
where section_type in ('hero', 'shop', 'story', 'contact');

insert into public.homepage_sections (id, section_type, title, content, sort_order, is_active)
values
(
  '11111111-1111-1111-1111-111111111111',
  'hero',
  '首頁主視覺',
  '{
    "label": "SONPIN",
    "main_title": "淞品土雞",
    "subtitle": "安心食材 · 經典風味 · 送禮首選",
    "tagline": "從餐桌到饕客心中的台灣土雞品牌",
    "title": "淞品土雞",
    "description": "提供熟成土雞、滴雞精與各式經典雞品，讓每一份餐桌選擇都保留真材實料與安心風味。",
    "number": "01",
    "background_image": "/sonpin-images/20250701170434.jpg"
  }'::jsonb,
  1,
  true
),
(
  '22222222-2222-2222-2222-222222222222',
  'shop',
  '商品介紹',
  '{
    "label": "商品介紹",
    "subtitle": "主打商品與人氣品項",
    "title": "商品介紹",
    "description": "從滴雞精到土雞熟食，完整呈現淞品的經典商品與送禮組合。",
    "number": "02",
    "background_image": "/sonpin-images/175135830617.jpg"
  }'::jsonb,
  2,
  true
),
(
  '33333333-3333-3333-3333-333333333333',
  'story',
  '關於淞品',
  '{
    "label": "關於淞品",
    "subtitle": "品牌故事",
    "title": "關於淞品",
    "description": "以傳統市場起家，逐步發展為兼顧品質、加工與配送的土雞品牌。",
    "number": "03",
    "background_image": "/sonpin-images/20260623131731.jpg"
  }'::jsonb,
  3,
  true
),
(
  '44444444-4444-4444-4444-444444444444',
  'contact',
  '客服中心',
  '{
    "label": "客服中心",
    "subtitle": "聯絡與訂購資訊",
    "title": "客服中心",
    "description": "提供訂購、門市與售後服務資訊，讓顧客可以快速找到需要的協助。",
    "number": "04",
    "background_image": "/sonpin-images/153285185380.jpg"
  }'::jsonb,
  4,
  true
);

insert into public.static_pages (slug, title, meta_description, sections, is_published)
values
(
  'about',
  '關於淞品',
  '了解淞品土雞的品牌起點、經營理念與對品質的堅持。',
  '[
    {"type":"intro","title":"關於淞品","content":"淞品土雞以安心食材與穩定品質為核心，持續提供適合家庭餐桌與節慶送禮的經典商品。"},
    {"type":"section","title":"品牌理念","content":"我們重視來源、處理流程與配送細節，希望每一位顧客都能吃得安心、送得體面。"},
    {"type":"section","title":"服務承諾","content":"從門市到線上訂購，皆以清楚資訊與即時服務為優先，讓購物流程簡單可靠。"}
  ]'::jsonb,
  true
),
(
  'story',
  '生產製程',
  '認識淞品土雞從選材、處理、熟成到出貨的完整流程。',
  '[
    {"type":"intro","title":"生產製程","content":"淞品以標準化流程管理食材處理、加工與包裝，維持每批商品一致的品質。"},
    {"type":"section","title":"選材與處理","content":"嚴選合適的雞種與部位，搭配穩定的處理程序，確保口感與風味達到品牌標準。"},
    {"type":"section","title":"配送與保存","content":"依照商品特性安排冷藏、冷凍與常溫配送，讓顧客在收到商品時保有最佳狀態。"}
  ]'::jsonb,
  true
),
(
  'contact',
  '客服中心',
  '聯絡淞品土雞，取得訂購、門市與售後服務資訊。',
  '[
    {"type":"intro","title":"客服中心","content":"若您有訂購、配送、門市或商品相關問題，歡迎透過電話或 Email 與我們聯繫。"},
    {"type":"section","title":"聯絡資訊","content":"電話：02-2338-0018\nEmail：service@sonpin.tw\n服務時間：週一至週日 09:00 - 18:00"},
    {"type":"section","title":"匯款資訊","content":"訂單完成後將顯示匯款資訊，專人確認入帳後再更新付款狀態與安排出貨。"}
  ]'::jsonb,
  true
)
on conflict (slug) do update
set
  title = excluded.title,
  meta_description = excluded.meta_description,
  sections = excluded.sections,
  is_published = excluded.is_published;

insert into public.seo_settings (page_path, title, description, keywords, og_image)
values
  ('/', '淞品土雞｜安心土雞與經典雞品', '淞品土雞官方網站，提供土雞熟食、滴雞精、門市資訊與品牌故事。', '淞品土雞, 土雞, 滴雞精, 雞品, 門市, 伴手禮', null),
  ('/about', '關於淞品｜品牌故事', '認識淞品土雞的起點、理念與堅持。', '關於淞品, 品牌故事, 土雞品牌', null),
  ('/products', '商品介紹｜淞品土雞', '查看淞品土雞的主打商品、人氣組合與禮盒。', '商品介紹, 土雞商品, 禮盒, 滴雞精', null),
  ('/culture', '生產製程｜淞品土雞', '了解淞品土雞的生產、處理與配送流程。', '生產製程, 品質控管, 土雞加工', null),
  ('/service', '饕客分享｜淞品土雞', '閱讀顧客與媒體對淞品土雞的分享與報導。', '饕客分享, 媒體報導, 顧客心得', null),
  ('/store', '店頭資訊｜淞品土雞', '查看淞品土雞門市位置、營業時間與聯絡方式。', '店頭資訊, 門市, 聯絡資訊', null),
  ('/media', '相關報導｜淞品土雞', '淞品土雞的影音報導與新聞內容整理。', '相關報導, 影音報導, 新聞', null),
  ('/contact', '客服中心｜淞品土雞', '聯絡淞品土雞客服，取得訂購與售後協助。', '客服中心, 聯絡我們, 訂購', null)
on conflict (page_path) do update
set
  title = excluded.title,
  description = excluded.description,
  keywords = excluded.keywords,
  og_image = excluded.og_image,
  updated_at = now();
