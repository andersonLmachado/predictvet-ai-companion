import { supabase } from '@/integrations/supabase/client';

export async function updateVetNotes(examId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('exams_history')
    .update({ vet_notes: notes })
    .eq('id', examId);

  if (error) throw new Error(error.message);
}
