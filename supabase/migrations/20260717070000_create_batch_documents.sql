/*
  Create batch document storage and metadata table for customer service batch lookup.

  This supports:
  - Admin PDF uploads in backoffice
  - Public customer-service search by file name
*/

create table if not exists public.batch_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  file_name text not null default '',
  file_url text not null default '',
  storage_path text not null unique,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.batch_documents enable row level security;

create index if not exists idx_batch_documents_sort_order on public.batch_documents(sort_order);
create index if not exists idx_batch_documents_title on public.batch_documents(lower(title));
create index if not exists idx_batch_documents_file_name on public.batch_documents(lower(file_name));

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'update_batch_documents_updated_at'
      and tgrelid = 'public.batch_documents'::regclass
  ) then
    create trigger update_batch_documents_updated_at
      before update on public.batch_documents
      for each row execute function update_updated_at_column();
  end if;
end $$;

grant select on public.batch_documents to anon, authenticated;
grant insert, update, delete on public.batch_documents to authenticated;

drop policy if exists "Public can read active batch documents" on public.batch_documents;
create policy "Public can read active batch documents"
  on public.batch_documents for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Active admins can manage batch documents" on public.batch_documents;
create policy "Active admins can manage batch documents"
  on public.batch_documents for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

insert into storage.buckets (id, name, public)
values ('batch-documents', 'batch-documents', true)
on conflict (id) do nothing;

drop policy if exists "Public read access for batch documents" on storage.objects;
drop policy if exists "Authenticated users can upload batch documents" on storage.objects;
drop policy if exists "Authenticated users can update batch documents" on storage.objects;
drop policy if exists "Authenticated users can delete batch documents" on storage.objects;

create policy "Public read access for batch documents"
  on storage.objects for select
  using (bucket_id = 'batch-documents');

create policy "Authenticated users can upload batch documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'batch-documents');

create policy "Authenticated users can update batch documents"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'batch-documents')
  with check (bucket_id = 'batch-documents');

create policy "Authenticated users can delete batch documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'batch-documents');
