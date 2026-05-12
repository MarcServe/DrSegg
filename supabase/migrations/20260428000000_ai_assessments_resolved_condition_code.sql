-- Snapshot of KB condition_code used for treatment lookups (aligned with analyze / api/treatment).
ALTER TABLE public.ai_assessments
  ADD COLUMN IF NOT EXISTS resolved_condition_code TEXT;

COMMENT ON COLUMN public.ai_assessments.resolved_condition_code IS
  'Knowledge base condition_code used for structured treatments at assessment time.';
