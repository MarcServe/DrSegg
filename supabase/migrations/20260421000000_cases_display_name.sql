-- User-visible case title (optional; falls back to species + date in UI)
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS display_name TEXT;

COMMENT ON COLUMN public.cases.display_name IS 'Optional label chosen by the user (e.g. coop name, animal name).';
