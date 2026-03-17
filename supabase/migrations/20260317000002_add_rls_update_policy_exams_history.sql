-- Ensure RLS is enabled on exams_history (idempotent)
ALTER TABLE public.exams_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to update vet_notes (and other fields) on exam history records
-- This follows the project pattern for permissive authenticated-user access
-- n8n inserts are done via service_role (bypasses RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'exams_history'
      AND policyname = 'Authenticated users can update exam history'
  ) THEN
    CREATE POLICY "Authenticated users can update exam history"
    ON public.exams_history FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;
