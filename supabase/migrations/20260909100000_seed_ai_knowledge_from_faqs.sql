-- Seed the AI knowledge base from the site's current published FAQs.
-- The guards make this safe to run again after a deployment.
INSERT INTO public.knowledge_categories (name, description, is_active)
SELECT source.category, '由網站 FAQ 同步的客服知識分類', true
FROM (
  SELECT DISTINCT NULLIF(trim(category), '') AS category
  FROM public.faqs
  WHERE is_active = true
) AS source
WHERE source.category IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.knowledge_categories existing
    WHERE existing.name = source.category
  );

INSERT INTO public.knowledge_base (category_id, question, answer, keywords, priority, is_active)
SELECT
  category.id,
  faq.question,
  faq.answer,
  ARRAY_REMOVE(ARRAY[NULLIF(trim(faq.category), ''), NULLIF(trim(faq.question), '')], NULL)::text[],
  20,
  true
FROM public.faqs faq
LEFT JOIN public.knowledge_categories category
  ON category.name = NULLIF(trim(faq.category), '')
WHERE faq.is_active = true
  AND NULLIF(trim(faq.question), '') IS NOT NULL
  AND NULLIF(trim(faq.answer), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.knowledge_base existing
    WHERE existing.question = faq.question
  );
