/*
  # Add Sonpin About / Story / Contact Static Pages + Contact Inquiries Table
*/

INSERT INTO static_pages (slug, title, meta_description, sections, is_published) VALUES
(
  'about',
  '關於淞品',
  '認識淞品土雞專賣店的品牌起點、經營理念與聯絡資訊。',
  '[
    {"type":"intro","title":"品牌緣起","content":"淞品土雞專賣店深耕萬華與三水街市場多年，從一間小店起家，持續以新鮮、實在的土雞料理陪伴在地顧客。"},
    {"type":"section","title":"我們的堅持","content":"・自養與合作來源把關\n・每日現做、保留最佳鮮度\n・熟悉萬華街區的傳統口味\n・重視食材來源與製程透明\n・讓每一位客人吃得安心"},
    {"type":"section","title":"聯絡資訊","content":"訂購專線：02-2338-0018\n轉帳銀行：永豐銀行 萬華分行（807）\n轉帳帳號：105-001-0014900-4\n戶名：淞品生技股份有限公司\n統編：27522811"}
  ]'::jsonb,
  true
),
(
  'story',
  '生產製程',
  '從土雞挑選、料理加工到門市出餐，認識淞品的完整製程。',
  '[
    {"type":"intro","title":"從市場到餐桌","content":"淞品以土雞專賣為核心，從食材挑選、清洗處理、調味與烹調，到門市現場提供給顧客，盡量保留食材最自然的鮮味。"},
    {"type":"section","title":"食材把關","content":"每一批土雞都重視來源與品質，依照品項提供鹹水雞、煙燻雞、滷味與滴雞精等不同風味。"},
    {"type":"section","title":"門市出餐","content":"門市依照每日備料狀況提供新鮮餐點，維持熟客熟悉的口味與份量。"},
    {"type":"section","title":"品牌延伸","content":"除了門市現場販售，淞品也推出滴雞精品項與禮盒組合，方便顧客自用與送禮。"}
  ]'::jsonb,
  true
),
(
  'contact',
  '客服中心',
  '有任何訂單、門市或合作問題，歡迎與淞品土雞專賣店聯繫。',
  '[
    {"type":"intro","title":"歡迎與我們聯繫","content":"無論是產品詢問、門市位置、企業合作或媒體採訪，都歡迎透過客服中心與我們聯絡。"},
    {"type":"section","title":"聯絡資訊","content":"訂購專線：02-2338-0018\n電子郵件：service@sonpin.tw\n服務時間：週二至週日 09:00 - 17:00"},
    {"type":"section","title":"匯款資訊","content":"轉帳銀行：永豐銀行 萬華分行（807）\n轉帳帳號：105-001-0014900-4\n戶名：淞品生技股份有限公司"},
    {"type":"section","title":"門市資訊","content":"台北萬華、新北永和、士林、民生、新埔與新店皆有門市據點，歡迎就近選購。"}
  ]'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact inquiry"
  ON contact_inquiries FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read contact inquiries"
  ON contact_inquiries FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update contact inquiry status"
  ON contact_inquiries FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
