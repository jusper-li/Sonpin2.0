/*
  Restore the public storefront read path for social accounts and fix
  a few article titles that were stored with encoding corruption.
*/

drop policy if exists "Public can read active social accounts" on public.social_accounts;
create policy "Public can read active social accounts"
  on public.social_accounts for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read seo settings" on public.seo_settings;
create policy "Public can read seo settings"
  on public.seo_settings for select
  to anon, authenticated
  using (true);

update public.articles
set title = case slug
  when '78-81' then '年代台灣向錢衝-日斬萬雞年賣上億'
  when '79-40' then '淞品商行---令人噴口水的 "白斬雞 & 燻雞"'
  when '79-66' then '台北補品：淞品滴雞精@雨後'
  else title
end
where slug in ('78-81', '79-40', '79-66');

notify pgrst, 'reload schema';
