/*
  # Allow public read access for active homepage sections

  The homepage needs to read `homepage_sections` as anon visitors.
  Without this policy, the frontend falls back to the local default content
  and backend changes never appear on the live homepage.
*/

drop policy if exists "Public can read active homepage sections" on public.homepage_sections;

create policy "Public can read active homepage sections"
  on public.homepage_sections
  for select
  to anon, authenticated
  using (is_active = true);
