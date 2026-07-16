alter table public.static_pages
  add column if not exists images jsonb not null default '[]'::jsonb;

update public.static_pages
set images = '[{"slot":"gallery-1","url":"/sonpin-images/20180730135352.jpg","alt":"關於淞品圖片 1"},{"slot":"gallery-2","url":"/sonpin-images/20180730135448.jpg","alt":"關於淞品圖片 2"}]'::jsonb
where slug = 'about';

update public.static_pages
set images = '[{"slot":"hero","url":"https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=1600","alt":"品牌故事主視覺"}]'::jsonb
where slug = 'story';

update public.static_pages
set images = '[{"slot":"hero","url":"/sonpin-images/20250917152151.jpg","alt":"品牌文化照片"}]'::jsonb
where slug = 'culture';

update public.static_pages
set images = '[{"slot":"gallery-1","url":"/sonpin-images/153285065447.jpg","alt":"製程照片 1"},{"slot":"gallery-2","url":"/sonpin-images/153285183849.jpg","alt":"製程照片 2"}]'::jsonb
where slug = 'process';
