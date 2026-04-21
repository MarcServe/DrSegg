-- Neutral in-app placeholder for drug rows (served from Next.js /public)
UPDATE public.drug_database
SET image_url = '/drug-placeholder.svg'
WHERE id IN (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103'
)
  AND (image_url IS NULL OR btrim(image_url) = '');
