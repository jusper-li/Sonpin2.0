create or replace function public.import_media_articles(p_articles jsonb)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count integer := 0;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.articles (
    title,
    slug,
    content,
    excerpt,
    featured_image,
    status,
    published_at
  )
  select
    article_data.title,
    article_data.slug,
    article_data.content,
    article_data.excerpt,
    article_data.featured_image,
    coalesce(article_data.status, 'published'),
    article_data.published_at
  from jsonb_to_recordset(coalesce(p_articles, '[]'::jsonb)) as article_data (
    title text,
    slug text,
    content text,
    excerpt text,
    featured_image text,
    status text,
    published_at timestamptz
  )
  on conflict (slug) do update
  set
    title = excluded.title,
    content = excluded.content,
    excerpt = excluded.excerpt,
    featured_image = excluded.featured_image,
    status = excluded.status,
    published_at = excluded.published_at;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.import_media_articles(jsonb) to authenticated;
