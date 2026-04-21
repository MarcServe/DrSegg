-- Optional pack/product image URLs for drug rows (public HTTPS URLs)
ALTER TABLE public.drug_database
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.drug_database.image_url IS 'Optional public URL to a product image (e.g. Supabase Storage or CDN).';

-- Heat stress: supportive / environmental management (often no specific drug)
INSERT INTO public.condition_treatments (
  condition_id,
  drug_id,
  species,
  region,
  treatment_level,
  dosage_text,
  supportive_care,
  prescription_required,
  source_reference
)
SELECT
  '22222222-2222-2222-2222-222222222203',
  NULL,
  NULL,
  NULL,
  'supportive',
  'Prioritize shade, ventilation, and unlimited cool water; move handling to cooler parts of the day.',
  'Misting or fans where safe; reduce stocking density; electrolytes only per product label and veterinary advice if birds show severe heat stress.',
  false,
  'Environmental — confirm locally with your veterinarian'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.condition_treatments ct
  WHERE ct.condition_id = '22222222-2222-2222-2222-222222222203'
    AND ct.drug_id IS NULL
);
