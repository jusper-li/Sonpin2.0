/*
  # Seed SEO Settings Test Data for Sonpin
*/

INSERT INTO seo_settings (page_path, title, description, keywords, og_image, canonical_url, robots)
VALUES
  ('/', '淞品土雞專賣店 - 首頁', '淞品土雞專賣店官方網站，提供土雞料理、滴雞精、門市資訊與媒體報導。', '淞品,土雞,滴雞精,門市,萬華', 'https://sonpin.tw/og-image.jpg', 'https://sonpin.tw/', 'index, follow'),
  ('/products', '商品介紹 - 淞品土雞專賣店', '瀏覽淞品的滴雞精、煙燻雞、鹹水雞與禮盒商品。', '商品介紹,土雞,滴雞精,禮盒,淞品', 'https://sonpin.tw/og-products.jpg', 'https://sonpin.tw/products', 'index, follow'),
  ('/about', '關於淞品 - 淞品土雞專賣店', '了解淞品土雞專賣店的品牌起點與經營理念。', '關於淞品,品牌故事,萬華土雞', 'https://sonpin.tw/og-about.jpg', 'https://sonpin.tw/about', 'index, follow'),
  ('/story', '生產製程 - 淞品土雞專賣店', '認識淞品從食材挑選到門市出餐的完整製程。', '生產製程,土雞,滴雞精,淞品', 'https://sonpin.tw/og-story.jpg', 'https://sonpin.tw/story', 'index, follow'),
  ('/contact', '客服中心 - 淞品土雞專賣店', '有任何訂單或門市問題，歡迎與淞品聯繫。', '客服中心,聯絡淞品,土雞', NULL, 'https://sonpin.tw/contact', 'index, follow'),
  ('/shipping', '購物須知 - 淞品土雞專賣店', '說明配送、付款與購買相關注意事項。', '購物須知,配送,付款,淞品', NULL, 'https://sonpin.tw/shipping', 'index, follow'),
  ('/returns', '退換貨政策 - 淞品土雞專賣店', '說明退換貨與售後處理規範。', '退換貨,售後服務,淞品', NULL, 'https://sonpin.tw/returns', 'index, follow'),
  ('/privacy', '隱私權政策 - 淞品土雞專賣店', '說明網站蒐集與使用個人資料的方式。', '隱私權政策,個資,淞品', NULL, 'https://sonpin.tw/privacy', 'noindex, nofollow')
ON CONFLICT (page_path) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  keywords = EXCLUDED.keywords,
  og_image = EXCLUDED.og_image,
  canonical_url = EXCLUDED.canonical_url,
  robots = EXCLUDED.robots,
  updated_at = now();
