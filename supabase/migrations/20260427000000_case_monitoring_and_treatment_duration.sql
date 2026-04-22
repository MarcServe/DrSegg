-- Case lists: "actively monitoring" vs archived; sort by recent activity
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS monitoring_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.cases.monitoring_active IS 'When false, case is listed under older / not actively monitoring.';
COMMENT ON COLUMN public.cases.last_activity_at IS 'Bumped on new assessments and follow-ups.';

UPDATE public.cases
SET last_activity_at = COALESCE(last_activity_at, created_at);

-- Typical course length (informational; always confirm with a vet for drugs)
ALTER TABLE public.condition_treatments
  ADD COLUMN IF NOT EXISTS course_duration_text TEXT;

COMMENT ON COLUMN public.condition_treatments.course_duration_text IS 'Typical duration of treatment course if applicable — informational only.';

-- Example: heat-stress environmental management (not a drug course)
UPDATE public.condition_treatments
SET course_duration_text = 'Continue measures while hot weather lasts; recheck the same day if animals worsen.'
WHERE condition_id = '22222222-2222-2222-2222-222222222203'
  AND treatment_level = 'supportive'
  AND drug_id IS NULL
  AND (course_duration_text IS NULL OR course_duration_text = '');
