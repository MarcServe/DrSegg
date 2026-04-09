-- Extended profile fields for farmers / staff (email remains in auth.users)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS farm_name TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'farmer',
  ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN public.profiles.region IS 'State, province, or local area';
COMMENT ON COLUMN public.profiles.farm_type IS 'Primary enterprise type';
COMMENT ON COLUMN public.profiles.farm_name IS 'Farm or holding name';
