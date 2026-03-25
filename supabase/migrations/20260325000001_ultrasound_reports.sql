-- supabase/migrations/20260325000001_ultrasound_reports.sql

CREATE TABLE ultrasound_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  veterinarian_id UUID NOT NULL REFERENCES auth.users(id),
  species TEXT NOT NULL CHECK (species IN ('canis', 'felis')),
  sex TEXT NOT NULL CHECK (sex IN ('female', 'male', 'male_castrated', 'female_castrated')),

  -- Bexiga
  bladder_wall_cm NUMERIC(4,2),
  bladder_notes TEXT,

  -- Rins
  kidney_left_cm NUMERIC(4,2),
  kidney_right_cm NUMERIC(4,2),
  kidney_pelvis_left_cm NUMERIC(4,2),
  kidney_pelvis_right_cm NUMERIC(4,2),
  kidney_notes TEXT,

  -- Fígado
  liver_notes TEXT,

  -- Vesícula Biliar
  gallbladder_wall_cm NUMERIC(4,2),
  gallbladder_duct_cm NUMERIC(4,2),
  gallbladder_notes TEXT,

  -- Estômago
  stomach_wall_cm NUMERIC(4,2),
  stomach_region TEXT,
  stomach_notes TEXT,

  -- Trato Intestinal
  intestine_duodenum_cm NUMERIC(4,2),
  intestine_jejunum_cm NUMERIC(4,2),
  intestine_ileum_cm NUMERIC(4,2),
  intestine_colon_cm NUMERIC(4,2),
  intestine_notes TEXT,

  -- Baço
  spleen_notes TEXT,

  -- Pâncreas
  pancreas_right_lobe_cm NUMERIC(4,2),
  pancreas_left_lobe_cm NUMERIC(4,2),
  pancreas_duct_cm NUMERIC(4,2),
  pancreas_notes TEXT,

  -- Adrenais
  adrenal_left_cm NUMERIC(4,2),
  adrenal_right_cm NUMERIC(4,2),
  adrenal_notes TEXT,

  -- Reprodutivo Fêmea
  uterus_notes TEXT,
  ovary_left_cm1 NUMERIC(4,2),
  ovary_left_cm2 NUMERIC(4,2),
  ovary_right_cm1 NUMERIC(4,2),
  ovary_right_cm2 NUMERIC(4,2),

  -- Reprodutivo Macho
  prostate_length_cm NUMERIC(4,2),
  prostate_height_cm NUMERIC(4,2),
  prostate_width_cm NUMERIC(4,2),
  testis_left_cm1 NUMERIC(4,2),
  testis_left_cm2 NUMERIC(4,2),
  testis_right_cm1 NUMERIC(4,2),
  testis_right_cm2 NUMERIC(4,2),

  -- Impressão e metadados
  diagnostic_impression TEXT,
  equipment TEXT DEFAULT 'Infinit X PRO',
  generated_report TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ultrasound_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vet acessa próprios laudos"
  ON ultrasound_reports FOR ALL TO authenticated
  USING (auth.uid() = veterinarian_id);
