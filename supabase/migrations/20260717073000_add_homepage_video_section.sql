update public.homepage_sections
set
  title = '影音區塊',
  content = '{
    "label": "影音區塊",
    "subtitle": "品牌影音",
    "title": "品牌影音",
    "description": "透過影片帶你認識淞品土雞的品牌故事與真實現場。",
    "number": "04",
    "href": "/media",
    "cta_label": "觀看影片",
    "youtube": "https://www.youtube.com/embed/U-jVtVyH93M",
    "video_title": "品牌影音介紹",
    "video_description": "觀看淞品土雞的品牌故事與相關影音內容。",
    "background_image": "/sonpin-images/20250701170434.jpg",
    "submenu": [
      { "label": "影音專區", "title": "影音專區", "href": "/media" },
      { "label": "了解更多", "title": "了解更多影音內容", "href": "/media" }
    ]
  }'::jsonb,
  sort_order = 4,
  is_active = true
where section_type = 'video';

update public.homepage_sections
set sort_order = 5
where section_type = 'contact';

insert into public.homepage_sections (id, section_type, title, content, sort_order, is_active)
select
  '55555555-5555-5555-5555-555555555555',
  'video',
  '影音區塊',
  '{
    "label": "影音區塊",
    "subtitle": "品牌影音",
    "title": "品牌影音",
    "description": "透過影片帶你認識淞品土雞的品牌故事與真實現場。",
    "number": "04",
    "href": "/media",
    "cta_label": "觀看影片",
    "youtube": "https://www.youtube.com/embed/U-jVtVyH93M",
    "video_title": "品牌影音介紹",
    "video_description": "觀看淞品土雞的品牌故事與相關影音內容。",
    "background_image": "/sonpin-images/20250701170434.jpg",
    "submenu": [
      { "label": "影音專區", "title": "影音專區", "href": "/media" },
      { "label": "了解更多", "title": "了解更多影音內容", "href": "/media" }
    ]
  }'::jsonb,
  4,
  true
where not exists (
  select 1
  from public.homepage_sections
  where section_type = 'video'
);
