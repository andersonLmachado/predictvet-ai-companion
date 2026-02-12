
CREATE TABLE public.clinical_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  observation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read observations"
  ON public.clinical_observations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert observations"
  ON public.clinical_observations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete observations"
  ON public.clinical_observations FOR DELETE
  USING (true);
