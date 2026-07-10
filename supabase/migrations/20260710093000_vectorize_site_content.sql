/*
  # Vectorize site content for semantic search

  - Enables pgvector
  - Adds a dedicated vector table for site content
  - Creates a semantic search RPC for AI retrieval
*/

create extension if not exists vector with schema extensions;

create table if not exists public.site_content_embeddings (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id uuid not null,
  source_slug text default '',
  source_title text not null,
  content_type text not null default 'page',
  content_text text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536),
  embedding_model text not null default 'text-embedding-3-small',
  embedding_updated_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_table, source_id)
);

alter table public.site_content_embeddings enable row level security;

create index if not exists idx_site_content_embeddings_source
  on public.site_content_embeddings (source_table, source_id);

create index if not exists idx_site_content_embeddings_active
  on public.site_content_embeddings (is_active);

create index if not exists idx_site_content_embeddings_embedding
  on public.site_content_embeddings
  using hnsw (embedding vector_cosine_ops);

create or replace function public.match_site_content(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.72,
  match_count integer default 8,
  source_table_filter text default null
)
returns table (
  id uuid,
  source_table text,
  source_id uuid,
  source_slug text,
  source_title text,
  content_type text,
  content_text text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    site_content_embeddings.id,
    site_content_embeddings.source_table,
    site_content_embeddings.source_id,
    site_content_embeddings.source_slug,
    site_content_embeddings.source_title,
    site_content_embeddings.content_type,
    site_content_embeddings.content_text,
    site_content_embeddings.metadata,
    1 - (site_content_embeddings.embedding <=> query_embedding) as similarity
  from public.site_content_embeddings
  where site_content_embeddings.is_active = true
    and site_content_embeddings.embedding is not null
    and (source_table_filter is null or site_content_embeddings.source_table = source_table_filter)
    and 1 - (site_content_embeddings.embedding <=> query_embedding) >= match_threshold
  order by site_content_embeddings.embedding <=> query_embedding asc
  limit match_count;
$$;
