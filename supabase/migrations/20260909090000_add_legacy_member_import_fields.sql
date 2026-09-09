-- Preserve fields imported from the legacy member system.
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS legacy_id text,
  ADD COLUMN IF NOT EXISTS member_type text,
  ADD COLUMN IF NOT EXISTS fax text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS bonus_points numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS legacy_created_at_text text,
  ADD COLUMN IF NOT EXISTS legacy_updated_at_text text;

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS address text DEFAULT '';

CREATE TABLE IF NOT EXISTS public.legacy_member_imports (
  old_id text PRIMARY KEY,
  member_account text NOT NULL,
  member_name text,
  member_type text,
  phone text,
  email text,
  address text,
  bonus_points numeric NOT NULL DEFAULT 0,
  status text,
  created_at_text text,
  updated_at_text text,
  fax text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legacy_member_imports ENABLE ROW LEVEL SECURITY;
