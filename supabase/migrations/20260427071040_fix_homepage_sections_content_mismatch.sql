/*
  # Fix Homepage Sections Content Mismatch

  Ensure the homepage admin content reflects the Sonpin brand defaults.
*/

UPDATE homepage_sections
SET content = content || jsonb_build_object(
  'main_title', '淞品土雞專賣店',
  'label', '首頁'
)
WHERE section_type = 'hero'
  AND (content->>'main_title' IS NULL OR content->>'main_title' = '')
  AND (content->>'label' IS NULL OR content->>'label' = '');

UPDATE homepage_sections
SET content = content || jsonb_build_object(
  'label', COALESCE(content->>'title', title),
  'number', '02'
)
WHERE section_type = 'products'
  AND (content->>'label' IS NULL OR content->>'label' = '')
  AND (content->>'number' IS NULL OR content->>'number' = '');
