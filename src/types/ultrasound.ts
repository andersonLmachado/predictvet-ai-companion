// src/types/ultrasound.ts

export type UltrasoundSpecies = 'canis' | 'felis';
export type UltrasoundSex = 'female' | 'male' | 'male_castrated' | 'female_castrated';

export interface UltrasoundReportData {
  patient_id: string;
  species: UltrasoundSpecies;
  sex: UltrasoundSex;
  equipment: string;
  diagnostic_impression?: string | null;

  // Bexiga
  bladder_wall_cm?: number | null;
  bladder_notes?: string;

  // Rins
  kidney_left_cm?: number | null;
  kidney_right_cm?: number | null;
  kidney_pelvis_left_cm?: number | null;
  kidney_pelvis_right_cm?: number | null;
  kidney_notes?: string;

  // Fígado
  liver_notes?: string;

  // Vesícula Biliar
  gallbladder_wall_cm?: number | null;
  gallbladder_duct_cm?: number | null;
  gallbladder_notes?: string;

  // Estômago
  stomach_wall_cm?: number | null;
  stomach_region?: string;
  stomach_notes?: string;

  // Trato Intestinal
  intestine_duodenum_cm?: number | null;
  intestine_jejunum_cm?: number | null;
  intestine_ileum_cm?: number | null;
  intestine_colon_cm?: number | null;
  intestine_notes?: string;

  // Baço
  spleen_notes?: string;

  // Pâncreas
  pancreas_right_lobe_cm?: number | null;
  pancreas_left_lobe_cm?: number | null;
  pancreas_duct_cm?: number | null;
  pancreas_notes?: string;

  // Adrenais
  adrenal_left_cm?: number | null;
  adrenal_right_cm?: number | null;
  adrenal_notes?: string;

  // Reprodutivo Fêmea
  uterus_notes?: string;
  ovary_left_cm1?: number | null;
  ovary_left_cm2?: number | null;
  ovary_right_cm1?: number | null;
  ovary_right_cm2?: number | null;

  // Reprodutivo Macho
  prostate_length_cm?: number | null;
  prostate_height_cm?: number | null;
  prostate_width_cm?: number | null;
  testis_left_cm1?: number | null;
  testis_left_cm2?: number | null;
  testis_right_cm1?: number | null;
  testis_right_cm2?: number | null;
}
