-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  region TEXT,
  farm_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  animal_type TEXT NOT NULL,
  health_status TEXT, -- healthy, mild_concern, likely_sick, critical
  confidence TEXT, -- low, medium, high
  mode TEXT, -- observation, diagnosis, treatment
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create case_inputs table
CREATE TABLE public.case_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- image, video, audio, text
  file_url TEXT,
  transcription TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create case_analysis table
CREATE TABLE public.case_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  possible_conditions JSONB,
  severity TEXT,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create treatment_plans table
CREATE TABLE public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  region TEXT,
  treatments JSONB,
  dosage JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create followups table
CREATE TABLE public.followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  notes TEXT,
  media_url TEXT,
  status TEXT, -- improving, unchanged, worsening
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drug_database table
CREATE TABLE public.drug_database (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  active_ingredient TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  region TEXT NOT NULL,
  form TEXT,
  requires_prescription BOOLEAN DEFAULT FALSE,
  withdrawal_period TEXT
);

-- Create contradictions table
CREATE TABLE public.contradictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  detected BOOLEAN DEFAULT FALSE,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create observations_checklist table
CREATE TABLE public.observations_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  value BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
