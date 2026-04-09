-- Optional link from a farm document (record) to a case
ALTER TABLE public.farm_documents
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS farm_documents_case_id_idx ON public.farm_documents (case_id);

COMMENT ON COLUMN public.farm_documents.case_id IS 'When set, this record is attached to the given case (same owner).';

DROP POLICY IF EXISTS "farm_documents_all_own" ON public.farm_documents;

CREATE POLICY "farm_documents_select_own"
  ON public.farm_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "farm_documents_insert_own"
  ON public.farm_documents FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      case_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = case_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "farm_documents_update_own"
  ON public.farm_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      case_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = case_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "farm_documents_delete_own"
  ON public.farm_documents FOR DELETE
  USING (auth.uid() = user_id);
