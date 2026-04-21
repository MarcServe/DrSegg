-- Expand intelligence layer: safety metadata on conditions, richer drug rows, symptom normalization catalogue.
--
-- CLINICAL / REGULATORY REVIEW (required before relying on this in production)
-- - Have a licensed clinician and/or local agriculture/public-health authority review
--   symptom_dictionary entries, notifiable/severity flags, and any user-facing derivatives.
-- - Seeds are educational defaults for your stack, not jurisdiction-specific legal advice.

ALTER TABLE public.knowledge_conditions
  ADD COLUMN IF NOT EXISTS requires_vet BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.knowledge_conditions
  ADD COLUMN IF NOT EXISTS notifiable BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.knowledge_conditions
  ADD COLUMN IF NOT EXISTS severity_hint TEXT;

COMMENT ON COLUMN public.knowledge_conditions.requires_vet IS
  'When true, triage copy should emphasize veterinary involvement.';
COMMENT ON COLUMN public.knowledge_conditions.notifiable IS
  'Reportable in many jurisdictions — follow local rules; escalate urgent care.';
COMMENT ON COLUMN public.knowledge_conditions.severity_hint IS
  'Optional coarse hint: low | moderate | high | critical (UI / prompts only, not a diagnosis).';

ALTER TABLE public.drug_database
  ADD COLUMN IF NOT EXISTS drug_class TEXT;

ALTER TABLE public.drug_database
  ADD COLUMN IF NOT EXISTS manufacturer TEXT;

ALTER TABLE public.drug_database
  ADD COLUMN IF NOT EXISTS image_query TEXT;

ALTER TABLE public.drug_database
  ADD COLUMN IF NOT EXISTS species_scope TEXT[] DEFAULT ARRAY['all']::TEXT[];

ALTER TABLE public.drug_database
  ADD COLUMN IF NOT EXISTS search_keywords TEXT;

COMMENT ON COLUMN public.drug_database.drug_class IS 'High-level class (antibiotic, nsaid, anthelmintic, etc.) for filtering and UI.';
COMMENT ON COLUMN public.drug_database.species_scope IS 'Which species rows apply to; all means not species-restricted at row level.';

-- ---------------------------------------------------------------------------
-- symptom_dictionary: canonical labels + aliases for future normalization / scoring
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.symptom_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}'::TEXT[],
  animal_types TEXT[] NOT NULL DEFAULT ARRAY['all']::TEXT[],
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT symptom_dictionary_canonical_name_unique UNIQUE (canonical_name)
);

CREATE INDEX IF NOT EXISTS symptom_dictionary_animal_types_idx ON public.symptom_dictionary USING GIN (animal_types);

ALTER TABLE public.symptom_dictionary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "symptom_dictionary_select_auth"
  ON public.symptom_dictionary FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Backfill existing seeded conditions
-- ---------------------------------------------------------------------------
UPDATE public.knowledge_conditions
SET
  requires_vet = true,
  notifiable = true,
  severity_hint = 'high'
WHERE condition_code IN ('newcastle_disease', 'ppr');

UPDATE public.knowledge_conditions
SET requires_vet = true, severity_hint = 'high'
WHERE condition_code = 'parvo_dog';

UPDATE public.knowledge_conditions
SET severity_hint = 'moderate'
WHERE condition_code = 'coccidiosis';

UPDATE public.knowledge_conditions
SET severity_hint = 'moderate'
WHERE condition_code = 'heat_stress';

-- ---------------------------------------------------------------------------
-- Seed symptom dictionary (idempotent by canonical_name)
-- ---------------------------------------------------------------------------
INSERT INTO public.symptom_dictionary (canonical_name, aliases, animal_types, category)
VALUES
  ('respiratory_distress', ARRAY['laboured breathing', 'open mouth breathing', 'dyspnea'], ARRAY['poultry', 'goat', 'pig', 'dog', 'all']::TEXT[], 'respiratory'),
  ('nasal_discharge', ARRAY['runny nose', 'snuffles'], ARRAY['poultry', 'goat', 'pig', 'dog', 'all']::TEXT[], 'respiratory'),
  ('coughing', ARRAY['cough'], ARRAY['pig', 'dog', 'goat', 'cattle', 'all']::TEXT[], 'respiratory'),
  ('sneezing', ARRAY['sneezes'], ARRAY['poultry', 'dog', 'all']::TEXT[], 'respiratory'),
  ('diarrhoea', ARRAY['diarrhea', 'scours', 'loose droppings', 'loose stool'], ARRAY['poultry', 'goat', 'pig', 'dog', 'cattle', 'all']::TEXT[], 'gastrointestinal'),
  ('bloody_diarrhoea', ARRAY['blood in droppings', 'bloody stool'], ARRAY['poultry', 'dog', 'pig', 'all']::TEXT[], 'gastrointestinal'),
  ('vomiting', ARRAY['emesis', 'throwing up'], ARRAY['dog', 'pig', 'all']::TEXT[], 'gastrointestinal'),
  ('inappetence', ARRAY['off feed', 'anorexia', 'not eating', 'reduced appetite'], ARRAY['poultry', 'goat', 'pig', 'dog', 'cattle', 'all']::TEXT[], 'general'),
  ('lethargy', ARRAY['depressed', 'weak', 'dull'], ARRAY['poultry', 'goat', 'pig', 'dog', 'cattle', 'all']::TEXT[], 'general'),
  ('fever', ARRAY['pyrexia', 'hot'], ARRAY['goat', 'pig', 'dog', 'cattle', 'all']::TEXT[], 'general'),
  ('neurological_signs', ARRAY['tremor', 'seizure', 'circling', 'head tilt', 'twisted neck'], ARRAY['poultry', 'dog', 'pig', 'cattle', 'all']::TEXT[], 'neurologic'),
  ('lameness', ARRAY['limping', 'non weight bearing'], ARRAY['goat', 'pig', 'dog', 'cattle', 'all']::TEXT[], 'musculoskeletal'),
  ('skin_lesions', ARRAY['sores', 'scabs', 'nodules', 'lumps'], ARRAY['poultry', 'goat', 'pig', 'dog', 'cattle', 'all']::TEXT[], 'integument'),
  ('sudden_mortality', ARRAY['sudden death', 'dead birds', 'mortality spike'], ARRAY['poultry', 'pig', 'all']::TEXT[], 'general'),
  ('mastitis_signs', ARRAY['swollen udder', 'abnormal milk', 'clots in milk'], ARRAY['goat', 'cattle', 'all']::TEXT[], 'reproductive'),
  ('reproductive_failure', ARRAY['abortion', 'stillbirth', 'return to heat'], ARRAY['goat', 'pig', 'cattle', 'all']::TEXT[], 'reproductive'),
  ('weight_loss', ARRAY['thin', 'poor body condition', 'emaciation'], ARRAY['poultry', 'goat', 'pig', 'dog', 'cattle', 'all']::TEXT[], 'general'),
  ('panting', ARRAY['open mouth breathing heat'], ARRAY['poultry', 'dog', 'all']::TEXT[], 'environmental'),
  ('limping_wing', ARRAY['drooped wing'], ARRAY['poultry', 'all']::TEXT[], 'musculoskeletal')
ON CONFLICT (canonical_name) DO NOTHING;
