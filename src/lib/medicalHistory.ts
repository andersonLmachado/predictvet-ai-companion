import { supabase } from '@/integrations/supabase/client';

export interface Vaccine {
  name: string;
  date: string; // "YYYY-MM-DD"
}

export interface MedicalHistory {
  allergies: string;
  previousDiseases: string;
  vaccines: Vaccine[];
}

export async function fetchMedicalHistory(patientId: string): Promise<MedicalHistory> {
  const { data, error } = await supabase
    .from('patients' as any)
    .select('allergies, previous_diseases, vaccines')
    .eq('id', patientId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const row = data as any;
  return {
    allergies: row?.allergies ?? '',
    previousDiseases: row?.previous_diseases ?? '',
    vaccines: Array.isArray(row?.vaccines) ? row.vaccines : [],
  };
}

export async function saveMedicalHistory(
  patientId: string,
  history: MedicalHistory
): Promise<void> {
  const { error } = await supabase
    .from('patients' as any)
    .update({
      allergies: history.allergies || null,
      previous_diseases: history.previousDiseases || null,
      vaccines: history.vaccines,
    } as any)
    .eq('id', patientId);

  if (error) throw new Error(error.message);
}

export function serializeVaccines(vaccines: Vaccine[]): string {
  return vaccines
    .filter((v) => v.name.trim())
    .map((v) => {
      if (!v.date) return v.name;
      const [year, month, day] = v.date.split('-');
      return `${v.name} (${day}/${month}/${year})`;
    })
    .join(', ');
}
