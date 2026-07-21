-- Extended clinical history fields for patients, flagged by the founding vet as missing.
-- JSONB array items use camelCase keys (matches the TS types in src/lib/medicalHistory.ts) —
-- this is an app-owned blob with no other consumers, so we skip a snake_case mapping layer:
-- deworming: [{ date, activeIngredient, weightKg }]
-- continuous_medications: [{ name, dose, frequency, indication }]
-- surgeries: [{ date, procedure, anesthesiaReaction }]
-- infectious_diseases: [{ disease, status, testDate, method }]

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS deworming JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS continuous_medications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS surgeries JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reproductive_status TEXT,
  ADD COLUMN IF NOT EXISTS reproductive_date DATE,
  ADD COLUMN IF NOT EXISTS blood_type TEXT,
  ADD COLUMN IF NOT EXISTS transfusion_history TEXT,
  ADD COLUMN IF NOT EXISTS infectious_diseases JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS drug_restrictions TEXT;
