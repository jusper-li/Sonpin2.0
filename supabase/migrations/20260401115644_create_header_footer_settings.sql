/*
  # Create Header and Footer Settings
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can insert site settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
      AND admins.is_active = true
    )
  );

INSERT INTO site_settings (setting_key, setting_value)
VALUES (
  'header',
  '{
    "logo_text": "淞品土雞專賣店",
    "logo_image": "/LOGO-1.png",
    "navigation": [
      {"label": "首頁", "href": "/"},
      {"label": "關於淞品", "href": "/about"},
      {"label": "商品介紹", "href": "/products"},
      {"label": "饕客分享", "href": "/service"},
      {"label": "店頭資訊", "href": "/store"},
      {"label": "相關報導", "href": "/media"},
      {"label": "客服中心", "href": "/contact"}
    ],
    "show_cart": true,
    "show_language_selector": true
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO site_settings (setting_key, setting_value)
VALUES (
  'footer',
  '{
    "about_text": "淞品土雞專賣店深耕萬華與北部多個門市據點，提供土雞料理、滴雞精與禮盒服務。",
    "contact_email": "service@sonpin.tw",
    "contact_phone": "02-2338-0018",
    "social_links": {
      "facebook": "https://facebook.com",
      "instagram": "https://instagram.com",
      "youtube": "https://youtube.com"
    },
    "copyright_text": "© 2026 淞品土雞專賣店. All rights reserved.",
    "link_groups": [
      {
        "title": "關於淞品",
        "links": [
          {"label": "關於淞品", "href": "/about"},
          {"label": "生產製程", "href": "/story"},
          {"label": "客服中心", "href": "/contact"}
        ]
      },
      {
        "title": "商品介紹",
        "links": [
          {"label": "主打商品", "href": "/products"},
          {"label": "其他商品", "href": "/products"}
        ]
      },
      {
        "title": "客戶服務",
        "links": [
          {"label": "購物須知", "href": "/shipping"},
          {"label": "退換貨政策", "href": "/returns"},
          {"label": "隱私權政策", "href": "/privacy"}
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_site_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_site_settings_updated_at
      BEFORE UPDATE ON site_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
