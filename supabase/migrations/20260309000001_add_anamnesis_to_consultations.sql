-- Add guided anamnesis context columns to medical_consultations
ALTER TABLE public.medical_consultations
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
  ADD COLUMN IF NOT EXISTS followup_question TEXT,
  ADD COLUMN IF NOT EXISTS followup_answer TEXT;
