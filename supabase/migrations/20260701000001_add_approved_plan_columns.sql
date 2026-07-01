ALTER TABLE public.medical_consultations
  ADD COLUMN IF NOT EXISTS approved_exams      JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS approved_treatments JSONB DEFAULT '[]';
