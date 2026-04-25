import { supabase } from '@/integrations/supabase/client';

/**
 * Checks whether an exam with the same patient_id + exam_date (+ laboratory,
 * when provided) already exists in exams_history.
 *
 * Returns the existing exam ID when a duplicate is found, or null otherwise.
 *
 * Protection against:
 *   - User clicking "Salvar Exame" a second time after a successful save
 *   - n8n workflow retries that issue the same insert twice
 *
 * If examDate is null the check is skipped (returns null) because we cannot
 * reliably identify duplicates without a date.
 */
export async function findDuplicateExam(
  patientId: string,
  examDate: string | null,
  laboratory: string | null,
): Promise<string | null> {
  if (!examDate) return null;

  if (laboratory) {
    const { data } = await supabase
      .from('exams_history')
      .select('id')
      .eq('patient_id', patientId)
      .eq('exam_date', examDate)
      .eq('laboratory', laboratory)
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  }

  const { data } = await supabase
    .from('exams_history')
    .select('id')
    .eq('patient_id', patientId)
    .eq('exam_date', examDate)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}
