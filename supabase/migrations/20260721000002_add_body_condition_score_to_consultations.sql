-- Body Condition Score (ECC), 1-9 scale, recorded per consultation alongside
-- weight_kg/temperature_c (see 20260320000001_add_vital_signs_to_consultations.sql) —
-- NOT on patients, since it changes at every visit rather than describing the patient.

ALTER TABLE public.medical_consultations
  ADD COLUMN IF NOT EXISTS body_condition_score SMALLINT;
