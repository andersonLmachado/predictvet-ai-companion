-- Add structured medical history fields to patients table.
-- allergies and previous_diseases are free-text fields (nullable TEXT).
-- vaccines is a JSONB array of { "name": string, "date": string } objects,
-- defaulting to an empty array so the column is always queryable without nullchecks.

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS allergies       TEXT,
  ADD COLUMN IF NOT EXISTS previous_diseases TEXT,
  ADD COLUMN IF NOT EXISTS vaccines        JSONB DEFAULT '[]'::jsonb;
