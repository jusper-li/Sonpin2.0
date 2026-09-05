/* Build the homepage from existing database content for Homepage Management. */

delete from public.homepage_sections
where section_type in ('hero', 'banner', 'article', 'story', 'video', 'store');

insert into public.homepage_sections (id, section_type, title, content, sort_order, is_active)
select
  '61111111-1111-1111-1111-111111111111'::uuid,
  'hero',
  coalesce(p.name, '首頁主視覺'),
  jsonb_build_object(
    'label', '精選商品',
    'title', coalesce(p.name, '首頁主視覺'),
    'description', coalesce(p.summary, ''),
    'background_image', coalesce(p.images ->> 0, ''),
    'href', case when p.slug is not null then '/product/' || p.slug else '/products' end,
    'cta_label', '商品介紹',
    'source_type', case when p.id is not null then 'product' else '' end,
    'source_id', coalesce(p.id::text, '')
  ),
  1,
  true
from (select * from public.products where is_active = true order by created_at desc limit 1) p;

insert into public.homepage_sections (id, section_type, title, content, sort_order, is_active)
select
  '62222222-2222-2222-2222-222222222222'::uuid,
  'article',
  a.title,
  jsonb_build_object(
    'label', '文章',
    'title', a.title,
    'description', coalesce(a.excerpt, ''),
    'background_image', coalesce(a.featured_image, ''),
    'href', '/blog/posts/' || a.slug,
    'cta_label', '了解更多',
    'source_type', 'article',
    'source_id', a.id::text
  ),
  2,
  true
from public.articles a
where a.slug = '79-83' and a.status = 'published';

insert into public.homepage_sections (id, section_type, title, content, sort_order, is_active)
select
  '63333333-3333-3333-3333-333333333333'::uuid,
  'article',
  a.title,
  jsonb_build_object(
    'label', '文章',
    'title', a.title,
    'description', coalesce(a.excerpt, ''),
    'background_image', coalesce(a.featured_image, ''),
    'href', '/blog/posts/' || a.slug,
    'cta_label', '了解更多',
    'source_type', 'article',
    'source_id', a.id::text
  ),
  3,
  true
from public.articles a
where a.slug = '79-92' and a.status = 'published';

insert into public.homepage_sections (id, section_type, title, content, sort_order, is_active)
select
  '64444444-4444-4444-4444-444444444444'::uuid,
  'video',
  a.title,
  jsonb_build_object(
    'label', '影音',
    'title', a.title,
    'description', coalesce(a.excerpt, ''),
    'background_image', coalesce(a.featured_image, ''),
    'href', '/media',
    'youtube', 'https://www.youtube.com/embed/U-jVtVyH93M?si=0G1LqoOZ1tjteRnw',
    'video_title', a.title,
    'source_type', 'article',
    'source_id', a.id::text
  ),
  4,
  true
from public.articles a
where a.slug = '78-115' and a.status = 'published';

insert into public.homepage_sections (id, section_type, title, content, sort_order, is_active)
select
  '65555555-5555-5555-5555-555555555555'::uuid,
  'video',
  a.title,
  jsonb_build_object(
    'label', '影音',
    'title', a.title,
    'description', coalesce(a.excerpt, ''),
    'background_image', coalesce(a.featured_image, ''),
    'href', '/media',
    'youtube', 'https://www.youtube.com/embed/HCTmM1PKLUU',
    'video_title', a.title,
    'source_type', 'article',
    'source_id', a.id::text
  ),
  5,
  true
from public.articles a
where a.slug = '78-81' and a.status = 'published';

insert into public.homepage_sections (id, section_type, title, content, sort_order, is_active)
select
  '66666666-6666-6666-6666-666666666666'::uuid,
  'story',
  a.title,
  jsonb_build_object(
    'label', '品牌故事',
    'title', a.title,
    'description', coalesce(a.excerpt, ''),
    'background_image', coalesce(a.featured_image, ''),
    'href', '/blog/posts/' || a.slug,
    'cta_label', '關於淞品',
    'source_type', 'article',
    'source_id', a.id::text
  ),
  6,
  true
from public.articles a
where a.slug = '79-91' and a.status = 'published';

insert into public.homepage_sections (id, section_type, title, content, sort_order, is_active)
select
  '67777777-7777-7777-7777-777777777777'::uuid,
  'store',
  '店頭資訊',
  jsonb_build_object(
    'label', '門市',
    'title', '店頭資訊',
    'description', concat_ws('｜', s.name, s.city, s.address, s.phone),
    'background_image', coalesce(s.images[1], ''),
    'href', '/store',
    'cta_label', '查看門市',
    'source_type', 'store',
    'source_id', s.id::text
  ),
  7,
  true
from public.stores s
where s.is_active = true
order by s.city, s.name
limit 1;
