ALTER TABLE public.evolution_summaries ADD COLUMN patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX idx_evolution_summaries_patient ON public.evolution_summaries(patient_id);

-- RLS policy
CREATE POLICY "Authenticated users can read evolution summaries"
ON public.evolution_summaries FOR SELECT
USING (true);

CREATE POLICY "Allow insert/update for authenticated"
ON public.evolution_summaries FOR ALL
USING (true);