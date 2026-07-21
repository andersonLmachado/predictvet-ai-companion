import { supabase } from '@/integrations/supabase/client';

export interface Vaccine {
  name: string;
  date: string; // "YYYY-MM-DD"
}

export interface Deworming {
  date: string; // "YYYY-MM-DD"
  activeIngredient: string;
  weightKg: string;
}

export interface ContinuousMedication {
  name: string;
  dose: string;
  frequency: string;
  indication: string;
}

export interface Surgery {
  date: string; // "YYYY-MM-DD"
  procedure: string;
  anesthesiaReaction: string;
}

export type InfectiousDiseaseStatus = 'Positivo' | 'Negativo' | 'Não testado' | '';

export interface InfectiousDisease {
  disease: string;
  status: InfectiousDiseaseStatus;
  testDate: string; // "YYYY-MM-DD"
  method: string;
}

export type ReproductiveStatus = 'Inteiro' | 'Castrado' | '';

export interface MedicalHistory {
  allergies: string;
  previousDiseases: string;
  vaccines: Vaccine[];
  deworming: Deworming[];
  continuousMedications: ContinuousMedication[];
  surgeries: Surgery[];
  reproductiveStatus: ReproductiveStatus;
  reproductiveDate: string;
  bloodType: string;
  transfusionHistory: string;
  infectiousDiseases: InfectiousDisease[];
  drugRestrictions: string;
}

export async function fetchMedicalHistory(patientId: string): Promise<MedicalHistory> {
  const { data, error } = await supabase
    .from('patients' as any)
    .select(
      'allergies, previous_diseases, vaccines, deworming, continuous_medications, surgeries, ' +
        'reproductive_status, reproductive_date, blood_type, transfusion_history, infectious_diseases, drug_restrictions'
    )
    .eq('id', patientId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const row = data as any;
  return {
    allergies: row?.allergies ?? '',
    previousDiseases: row?.previous_diseases ?? '',
    vaccines: Array.isArray(row?.vaccines) ? row.vaccines : [],
    deworming: Array.isArray(row?.deworming) ? row.deworming : [],
    continuousMedications: Array.isArray(row?.continuous_medications) ? row.continuous_medications : [],
    surgeries: Array.isArray(row?.surgeries) ? row.surgeries : [],
    reproductiveStatus: row?.reproductive_status ?? '',
    reproductiveDate: row?.reproductive_date ?? '',
    bloodType: row?.blood_type ?? '',
    transfusionHistory: row?.transfusion_history ?? '',
    infectiousDiseases: Array.isArray(row?.infectious_diseases) ? row.infectious_diseases : [],
    drugRestrictions: row?.drug_restrictions ?? '',
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
      deworming: history.deworming,
      continuous_medications: history.continuousMedications,
      surgeries: history.surgeries,
      reproductive_status: history.reproductiveStatus || null,
      reproductive_date: history.reproductiveDate || null,
      blood_type: history.bloodType || null,
      transfusion_history: history.transfusionHistory || null,
      infectious_diseases: history.infectiousDiseases,
      drug_restrictions: history.drugRestrictions || null,
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

export function serializeContinuousMedications(medications: ContinuousMedication[]): string {
  return medications
    .filter((m) => m.name.trim())
    .map((m) => {
      let result = m.name;
      const doseFrequency = [m.dose, m.frequency].filter(Boolean).join(' ');
      if (doseFrequency) result += ` ${doseFrequency}`;
      if (m.indication) result += ` (${m.indication})`;
      return result;
    })
    .join(', ');
}

export function serializeInfectiousDiseases(diseases: InfectiousDisease[]): string {
  return diseases
    .filter((d) => d.disease.trim())
    .map((d) => {
      let result = d.disease;
      if (d.status) result += `: ${d.status}`;
      const details: string[] = [];
      if (d.method) details.push(d.method);
      if (d.testDate) {
        const [year, month, day] = d.testDate.split('-');
        details.push(`${day}/${month}/${year}`);
      }
      if (details.length) result += ` (${details.join(', ')})`;
      return result;
    })
    .join(', ');
}
