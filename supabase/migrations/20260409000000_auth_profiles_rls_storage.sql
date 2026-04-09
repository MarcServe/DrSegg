-- Align with Supabase Auth: profiles, cases.user_id -> auth.users, RLS, Storage

-- 1) Profiles (replaces legacy public.users for app metadata)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  region TEXT,
  farm_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.profiles (id, display_name)
SELECT id, split_part(email, '@', 1) FROM auth.users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2) Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3) Rewire cases: drop legacy FK to public.users, point to auth.users
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_user_id_fkey;

-- Clear dependent data so we can enforce NOT NULL / new FK (dev-friendly)
TRUNCATE TABLE public.observations_checklist, public.contradictions, public.followups,
  public.treatment_plans, public.case_analysis, public.case_inputs, public.cases
  CASCADE;

DROP TABLE IF EXISTS public.users CASCADE;

ALTER TABLE public.cases
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.cases
  ADD CONSTRAINT cases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- 4) Farm documents (records UI)
CREATE TABLE public.farm_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  doc_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX farm_documents_user_id_idx ON public.farm_documents (user_id);

ALTER TABLE public.farm_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farm_documents_all_own"
  ON public.farm_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5) RLS: cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cases_select_own"
  ON public.cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cases_insert_own"
  ON public.cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cases_update_own"
  ON public.cases FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cases_delete_own"
  ON public.cases FOR DELETE
  USING (auth.uid() = user_id);

-- 6) RLS: child tables via case ownership
ALTER TABLE public.case_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_inputs_all_via_case"
  ON public.case_inputs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_inputs.case_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_inputs.case_id AND c.user_id = auth.uid()
    )
  );

ALTER TABLE public.case_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_analysis_all_via_case"
  ON public.case_analysis FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_analysis.case_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_analysis.case_id AND c.user_id = auth.uid()
    )
  );

ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treatment_plans_all_via_case"
  ON public.treatment_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = treatment_plans.case_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = treatment_plans.case_id AND c.user_id = auth.uid()
    )
  );

ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followups_all_via_case"
  ON public.followups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = followups.case_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = followups.case_id AND c.user_id = auth.uid()
    )
  );

ALTER TABLE public.contradictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contradictions_all_via_case"
  ON public.contradictions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = contradictions.case_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = contradictions.case_id AND c.user_id = auth.uid()
    )
  );

ALTER TABLE public.observations_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "observations_all_via_case"
  ON public.observations_checklist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = observations_checklist.case_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = observations_checklist.case_id AND c.user_id = auth.uid()
    )
  );

-- 7) Reference data: readable by authenticated users
ALTER TABLE public.drug_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drug_database_select_authenticated"
  ON public.drug_database FOR SELECT
  TO authenticated
  USING (true);

-- 8) Storage bucket for case media
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-media', 'case-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "case_media_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'case-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "case_media_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'case-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "case_media_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'case-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "case_media_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'case-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
