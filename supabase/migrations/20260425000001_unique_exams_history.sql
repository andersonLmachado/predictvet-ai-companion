-- Prevent duplicate exam records for the same patient + date + laboratory.
--
-- A partial unique index is used (WHERE exam_date IS NOT NULL) because two
-- rows that both have a NULL exam_date cannot be reliably identified as the
-- same exam; the constraint only applies when a date was successfully extracted.
--
-- COALESCE(laboratory, '') treats NULL and empty-string laboratory as equivalent
-- so that (P, 2024-09-10, NULL) and (P, 2024-09-10, '') both conflict.
--
-- This protects against:
--   • n8n workflow retries that issue the same INSERT twice via service_role
--   • Any future code path that tries to insert the same exam a second time

CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_history_no_dupes
  ON public.exams_history (patient_id, exam_date, COALESCE(laboratory, ''))
  WHERE exam_date IS NOT NULL;
