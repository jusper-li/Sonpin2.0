/*
  # Ensure Blog Bulletin Category

  Keep the public blog category list in sync and make sure the announcement
  category is present without overwriting any existing custom categories.
*/

INSERT INTO public.site_settings (setting_key, setting_value)
VALUES (
  'blog_categories',
  '[
    {
      "name": "公告",
      "slug": "bulletin",
      "description": "本站最新通知與重要公告。",
      "sort_order": 0,
      "is_active": true
    }
  ]'::jsonb
)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = CASE
  WHEN EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(public.site_settings.setting_value, '[]'::jsonb)) AS category
    WHERE category->>'slug' = 'bulletin'
  ) THEN public.site_settings.setting_value
  ELSE COALESCE(public.site_settings.setting_value, '[]'::jsonb) || EXCLUDED.setting_value
END,
updated_at = now();
