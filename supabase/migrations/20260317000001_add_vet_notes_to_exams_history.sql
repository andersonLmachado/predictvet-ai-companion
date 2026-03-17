-- Add vet_notes column to store free-form veterinarian clinical observations per exam
ALTER TABLE public.exams_history
  ADD COLUMN IF NOT EXISTS vet_notes TEXT;
