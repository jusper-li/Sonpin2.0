-- Allow articles to be automatically hidden after a configured date/time.
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS unpublished_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_articles_unpublished_at
  ON public.articles (unpublished_at);
