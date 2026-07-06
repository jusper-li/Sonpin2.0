/*
  Seed confirmed social accounts for the Sonpin brand.

  The public site loads `social_accounts` first and falls back to footer JSON
  only when the table is empty. These rows provide the first official links
  we could verify from public brand pages.
*/

insert into public.social_accounts (
  platform,
  username,
  url,
  is_active,
  sort_order
)
values
  (
    'Facebook',
    '淞品土雞專賣店',
    'https://www.facebook.com/pages/%E6%B7%9E%E5%93%81%E5%9C%9F%E9%9B%9E%E5%B0%88%E8%B3%A3%E5%BA%97/554740257924681',
    true,
    1
  ),
  (
    'YouTube',
    '李冠龍',
    'https://www.youtube.com/@aa286336/videos',
    true,
    2
  )
on conflict (platform) do update
set
  username = excluded.username,
  url = excluded.url,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();
