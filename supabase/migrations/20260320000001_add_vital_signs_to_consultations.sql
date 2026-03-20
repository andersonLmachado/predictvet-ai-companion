ALTER TABLE public.medical_consultations
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS temperature_c NUMERIC(4,1);
