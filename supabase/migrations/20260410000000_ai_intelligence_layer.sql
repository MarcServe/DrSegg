-- Intelligence layer: assessments, knowledge (pgvector), condition treatments, recommendations, vet review, capture guides

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- ai_assessments (structured audit trail per case)
-- ---------------------------------------------------------------------------
CREATE TABLE public.ai_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases (id) ON DELETE CASCADE,
  model_name TEXT,
  assessment_version TEXT DEFAULT '1',
  summary TEXT,
  likely_condition TEXT,
  differential_diagnoses JSONB,
  confidence_score NUMERIC,
  severity TEXT,
  needs_more_info BOOLEAN DEFAULT FALSE,
  missing_info JSONB,
  suggested_next_checks JSONB,
  red_flags JSONB,
  supporting_evidence JSONB,
  recommendation_type TEXT,
  knowledge_matches JSONB,
  treatments_snapshot JSONB,
  disclaimer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ai_assessments_case_id_idx ON public.ai_assessments (case_id);

ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_assessments_all_via_case"
  ON public.ai_assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = ai_assessments.case_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = ai_assessments.case_id AND c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Knowledge base
-- ---------------------------------------------------------------------------
CREATE TABLE public.knowledge_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_code TEXT UNIQUE NOT NULL,
  condition_name TEXT NOT NULL,
  species TEXT[] NOT NULL DEFAULT ARRAY['all']::TEXT[],
  common_symptoms TEXT[],
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.knowledge_condition_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES public.knowledge_conditions (id) ON DELETE CASCADE,
  source_title TEXT,
  chunk_text TEXT NOT NULL,
  embedding vector(1536)
);

CREATE INDEX knowledge_condition_chunks_condition_id_idx ON public.knowledge_condition_chunks (condition_id);

ALTER TABLE public.knowledge_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_condition_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_conditions_select_auth"
  ON public.knowledge_conditions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "knowledge_chunks_select_auth"
  ON public.knowledge_condition_chunks FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Condition ↔ drug (structured; LLM does not invent rows)
-- ---------------------------------------------------------------------------
CREATE TABLE public.condition_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES public.knowledge_conditions (id) ON DELETE CASCADE,
  drug_id UUID REFERENCES public.drug_database (id) ON DELETE SET NULL,
  species TEXT,
  region TEXT,
  treatment_level TEXT,
  dosage_text TEXT,
  duration_text TEXT,
  supportive_care TEXT,
  isolation_required BOOLEAN DEFAULT FALSE,
  prescription_required BOOLEAN DEFAULT FALSE,
  source_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX condition_treatments_condition_idx ON public.condition_treatments (condition_id);

ALTER TABLE public.condition_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "condition_treatments_select_auth"
  ON public.condition_treatments FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- case_recommendations (user-facing lines)
-- ---------------------------------------------------------------------------
CREATE TABLE public.case_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases (id) ON DELETE CASCADE,
  recommendation_type TEXT,
  title TEXT,
  description TEXT,
  source_type TEXT,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX case_recommendations_case_id_idx ON public.case_recommendations (case_id);

ALTER TABLE public.case_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_recommendations_all_via_case"
  ON public.case_recommendations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_recommendations.case_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_recommendations.case_id AND c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- vet_reviews (human escalation)
-- ---------------------------------------------------------------------------
CREATE TABLE public.vet_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases (id) ON DELETE CASCADE,
  vet_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  review_status TEXT DEFAULT 'pending',
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vet_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vet_reviews_all_via_case"
  ON public.vet_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = vet_reviews.case_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = vet_reviews.case_id AND c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- body_part_capture_guides
-- ---------------------------------------------------------------------------
CREATE TABLE public.body_part_capture_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species TEXT NOT NULL,
  symptom_trigger TEXT,
  requested_body_part TEXT,
  guide_title TEXT,
  guide_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.body_part_capture_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "body_part_guides_select_auth"
  ON public.body_part_capture_guides FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Vector similarity helper (optional; chunks may have NULL embedding until seeded)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(1536),
  p_species text,
  match_count int
)
RETURNS TABLE (
  condition_id uuid,
  condition_code text,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    kc.id AS condition_id,
    kc.condition_code,
    (1 - (kcc.embedding <=> query_embedding))::double precision AS similarity
  FROM public.knowledge_condition_chunks kcc
  JOIN public.knowledge_conditions kc ON kc.id = kcc.condition_id
  WHERE kcc.embedding IS NOT NULL
    AND (
      p_species = ANY (kc.species)
      OR 'all' = ANY (kc.species)
    )
  ORDER BY kcc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ---------------------------------------------------------------------------
-- Seed: reference drugs (region used by app default)
-- ---------------------------------------------------------------------------
INSERT INTO public.drug_database (id, active_ingredient, brand_name, region, form, requires_prescription, withdrawal_period)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Amprolium', 'Amprolium (example label)', 'Northern Highlands District', 'oral', false, 'Per product label / vet'),
  ('11111111-1111-1111-1111-111111111102', 'Toltrazuril', 'Toltrazuril (example label)', 'Northern Highlands District', 'oral', false, 'Per product label / vet'),
  ('11111111-1111-1111-1111-111111111103', 'Oxytetracycline', 'Oxytetracycline (vet-directed)', 'Northern Highlands District', 'injectable', true, 'Per vet; observe withdrawal')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: knowledge_conditions (phase-1 poultry + livestock-oriented)
-- ---------------------------------------------------------------------------
INSERT INTO public.knowledge_conditions (id, condition_code, condition_name, species, common_symptoms, category)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'coccidiosis', 'Coccidiosis', ARRAY['poultry', 'all']::TEXT[], ARRAY['bloody diarrhoea', 'huddling', 'ruffled feathers', 'weight loss'], 'parasitic'),
  ('22222222-2222-2222-2222-222222222202', 'newcastle_disease', 'Newcastle disease', ARRAY['poultry', 'all']::TEXT[], ARRAY['twisted neck', 'greenish diarrhoea', 'respiratory noise', 'sudden death'], 'viral'),
  ('22222222-2222-2222-2222-222222222203', 'heat_stress', 'Heat stress', ARRAY['poultry', 'goat', 'pig', 'dog', 'all']::TEXT[], ARRAY['panting', 'wings drooped', 'lethargy', 'reduced feed'], 'environmental'),
  ('22222222-2222-2222-2222-222222222204', 'ppr', 'Peste des petits ruminants', ARRAY['goat', 'all']::TEXT[], ARRAY['fever', 'ulcers', 'diarrhoea', 'respiratory signs'], 'viral'),
  ('22222222-2222-2222-2222-222222222205', 'parvo_dog', 'Canine parvovirus (differential)', ARRAY['dog', 'all']::TEXT[], ARRAY['bloody diarrhoea', 'vomiting', 'lethargy', 'dehydration'], 'viral')
ON CONFLICT (condition_code) DO NOTHING;

INSERT INTO public.knowledge_condition_chunks (condition_id, source_title, chunk_text)
VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    'Overview',
    'Coccidiosis in poultry often presents with bloody or mucoid droppings, huddling, and reduced feed intake. Severity depends on species of Eimeria and age of birds.'
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'Overview',
    'Newcastle disease may cause neurological signs, respiratory distress, and high mortality in naive flocks. Differential diagnosis requires lab confirmation.'
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'Overview',
    'Heat stress is non-infectious; birds may pant and hold wings away from the body. Cooling and water access are priorities.'
  );

-- Map conditions → drugs (illustrative; always subject to vet / label)
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
VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    'poultry',
    'Northern Highlands District',
    'first_line',
    'Use only per product label and local veterinary guidance.',
    'Clean waterers; reduce stocking density; consider anticoccidial per label.',
    false,
    'Illustrative seed row — verify locally'
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111103',
    'poultry',
    'Northern Highlands District',
    'supportive',
    'Prescription-only in many regions; vet must direct use and withdrawal.',
    'Isolate sick birds; strict biosecurity; report suspicion per regulations.',
    true,
    'Illustrative seed row — verify locally'
  );

INSERT INTO public.body_part_capture_guides (species, symptom_trigger, requested_body_part, guide_title, guide_text)
VALUES
  (
    'poultry',
    'diarrhoea',
    'droppings',
    'Fresh droppings photo',
    'Photograph fresh droppings on a light background in daylight; include scale reference if possible.'
  );
