import { supabase } from '@/integrations/supabase/client';

export async function fetchClinicalHistory(patientId: string): Promise<string> {
  const { data, error } = await supabase
    .from('patients' as any)
    .select('clinical_history')
    .eq('id', patientId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as any)?.clinical_history ?? '';
}

export async function saveClinicalHistory(patientId: string, text: string): Promise<void> {
  const { error } = await supabase
    .from('patients' as any)
    .update({ clinical_history: text } as any)
    .eq('id', patientId);

  if (error) throw new Error(error.message);
}
