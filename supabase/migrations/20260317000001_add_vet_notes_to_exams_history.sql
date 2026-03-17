ALTER TABLE exams_history
  ADD COLUMN IF NOT EXISTS vet_notes TEXT;
