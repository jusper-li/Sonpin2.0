/* Seed FAQ content and fix media article copy */

insert into public.faqs (id, question, answer, category, sort_order, is_active)
values
  (
    'f1a3d4d4-6f1a-4ef2-a0e4-3db2b5d2b001',
    '如何下單購買？',
    '您可以先透過網站或直接聯絡客服，確認商品內容、數量與出貨方式後再完成訂購。',
    'general',
    10,
    true
  ),
  (
    'f1a3d4d4-6f1a-4ef2-a0e4-3db2b5d2b002',
    '可以宅配嗎？',
    '可依商品屬性安排冷藏或冷凍配送，實際配送方式與出貨時程請以客服確認結果為準。',
    'shipping',
    20,
    true
  ),
  (
    'f1a3d4d4-6f1a-4ef2-a0e4-3db2b5d2b003',
    '可以門市自取嗎？',
    '可以，若您希望門市自取，建議先與客服確認門市據點與取貨時間，避免現場久候。',
    'order',
    30,
    true
  ),
  (
    'f1a3d4d4-6f1a-4ef2-a0e4-3db2b5d2b004',
    '有哪些付款方式？',
    '可依當期服務內容選擇線上付款、銀行轉帳或門市付款，若有調整會以客服公告為準。',
    'payment',
    40,
    true
  ),
  (
    'f1a3d4d4-6f1a-4ef2-a0e4-3db2b5d2b005',
    '商品如何保存？',
    '收到商品後請依包裝標示保存，冷藏或冷凍商品請儘快放入冰箱，並於有效期限內食用。',
    'product',
    50,
    true
  ),
  (
    'f1a3d4d4-6f1a-4ef2-a0e4-3db2b5d2b006',
    '可以退換貨嗎？',
    '食品類商品基於衛生與保存考量，若有配送損壞、品項錯誤或品質異常，請盡快聯絡客服協助處理。',
    'return',
    60,
    true
  )
on conflict (id) do update
set
  question = excluded.question,
  answer = excluded.answer,
  category = excluded.category,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

update public.articles
set
  title = '台北補品：淞品滴雞精@雨後',
  content = '<p>部落客開箱淞品滴雞精，從包裝、價格到風味都做了完整分享。</p><p>這篇部落格文章從外盒與紙袋開始介紹，先提到淞品滴雞精的包裝很有品牌感，不再只是傳統市場的簡單盒裝。</p><p>作者也分享了價格、份量與食用感受，認為這款滴雞精在送禮與日常補養之間都很合適。</p><p>文章特別提到紙袋與外盒的設計很有質感，內容物標示也清楚，讓人感覺這不只是市場熟食，而是能當成伴手禮的商品。</p><p>飲用感受方面則偏向濃醇順口，作者把它拿來和其他品牌比較，認為淞品的滴雞精有自己明確的品牌印象。</p>',
  excerpt = '部落客開箱淞品滴雞精，從包裝、價格到風味都做了完整分享。'
where slug = '79-66';

update public.articles
set
  title = '年代台灣向錢衝-日斬萬雞年賣上億',
  content = '<p>年代新聞專訪淞品，介紹這家土雞品牌如何靠市場口碑走向年營收上億。</p><p>這支年代新聞節目帶到淞品從市場攤位走向規模化經營的過程，焦點放在創業歷程與品牌成長。</p><p>影片中可以看見店家如何把傳統雞肉生意做成穩定供應的品牌，也說明他們在市場上長期累積的口碑。</p><div class="my-6 overflow-hidden rounded-2xl border border-[#eadfd1] bg-black"><iframe src="https://www.youtube.com/embed/HCTmM1PKLUU" title="年代台灣向錢衝-日斬萬雞年賣上億" width="100%" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>',
  excerpt = '年代新聞專訪淞品，介紹這家土雞品牌如何靠市場口碑走向年營收上億。'
where slug = '78-81';
