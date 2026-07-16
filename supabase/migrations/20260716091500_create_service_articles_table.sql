/*
  Split service articles away from the shared articles table.

  This migration creates a dedicated service_articles table for the
  "老饕分享" section, copies the existing service article rows into it,
  and removes them from the shared articles table so article management
  and service content no longer affect each other.
*/

create table if not exists public.service_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  slug text unique not null,
  content text default '',
  excerpt text default '',
  featured_image text,
  author_id uuid references public.admins(id) on delete set null,
  status text default 'draft',
  published_at timestamptz,
  views integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.service_articles enable row level security;

create index if not exists idx_service_articles_slug on public.service_articles(slug);
create index if not exists idx_service_articles_author on public.service_articles(author_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'update_service_articles_updated_at'
      and tgrelid = 'public.service_articles'::regclass
  ) then
    create trigger update_service_articles_updated_at
      before update on public.service_articles
      for each row execute function update_updated_at_column();
  end if;
end $$;

grant select on public.service_articles to anon, authenticated;
grant insert, update, delete on public.service_articles to authenticated;

drop policy if exists "Public can read published service articles" on public.service_articles;
create policy "Public can read published service articles"
  on public.service_articles for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Active admins can manage service articles" on public.service_articles;
create policy "Active admins can manage service articles"
  on public.service_articles for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

insert into public.service_articles (
  id,
  title,
  slug,
  content,
  excerpt,
  featured_image,
  author_id,
  status,
  published_at,
  views,
  created_at,
  updated_at
)
select
  id,
  title,
  slug,
  content,
  excerpt,
  featured_image,
  author_id,
  status,
  published_at,
  views,
  created_at,
  updated_at
from public.articles
where slug in ('73', '72', '71', '70', '69', '68', '67', '66', '40')
on conflict (slug) do update set
  title = excluded.title,
  content = excluded.content,
  excerpt = excluded.excerpt,
  featured_image = excluded.featured_image,
  author_id = excluded.author_id,
  status = excluded.status,
  published_at = excluded.published_at,
  views = excluded.views,
  updated_at = excluded.updated_at;

delete from public.articles
where slug in ('73', '72', '71', '70', '69', '68', '67', '66', '40');
