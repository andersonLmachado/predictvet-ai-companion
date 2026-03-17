import { supabase } from '@/integrations/supabase/client';

export async function updateVetNotes(examId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('exams_history')
    .update({ vet_notes: notes })
    .eq('id', examId);
  // RLS on exams_history (policy: "Authenticated users can update exam history")
  // restricts UPDATE to authenticated users. The exam ID is obtained from the
  // n8n save-exam response and is owned by the current session's patient.

  if (error) throw new Error(error.message);
}
