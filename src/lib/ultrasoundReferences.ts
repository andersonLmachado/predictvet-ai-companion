// src/lib/ultrasoundReferences.ts
import type { UltrasoundSpecies } from '@/types/ultrasound';

export function checkReference(
  value: number,
  min: number | null,
  max: number | null,
): 'normal' | 'alto' | 'baixo' {
  if (max !== null && value > max) return 'alto';
  if (min !== null && value < min) return 'baixo';
  return 'normal';
}

// ── Adrenal tables ──────────────────────────────────────────────────────────

type AdrenalBand = {
  minKg: number;
  maxKg: number;
  left: { min: number; max: number };
  right: { min: number; max: number };
};

const CANIS_ADRENAL_BANDS: AdrenalBand[] = [
  { minKg: 2.5, maxKg: 5,  left: { min: 0.32, max: 0.51 }, right: { min: 0.28, max: 0.53 } },
  { minKg: 5,   maxKg: 10, left: { min: 0.30, max: 0.55 }, right: { min: 0.34, max: 0.68 } },
  { minKg: 10,  maxKg: 20, left: { min: 0.38, max: 0.64 }, right: { min: 0.35, max: 0.75 } },
  { minKg: 20,  maxKg: 40, left: { min: 0.47, max: 0.73 }, right: { min: 0.51, max: 0.87 } },
];

type FelisBand = { minKg: number; maxKg: number; min: number; max: number };
const FELIS_ADRENAL_BANDS: FelisBand[] = [
  { minKg: 0, maxKg: 4, min: 0.24, max: 0.39 },
  { minKg: 4, maxKg: 8, min: 0.26, max: 0.48 },
];

export function getAdrenalReference(
  species: UltrasoundSpecies,
  side: 'left' | 'right',
  weightKg: number | null,
): { min: number; max: number } | null {
  if (weightKg === null) return null;

  if (species === 'canis') {
    const band = CANIS_ADRENAL_BANDS.find(
      (b) => weightKg >= b.minKg && weightKg < b.maxKg,
    );
    if (!band) return null;
    return side === 'left' ? band.left : band.right;
  }

  if (species === 'felis') {
    const band = FELIS_ADRENAL_BANDS.find(
      (b) => weightKg >= b.minKg && weightKg < b.maxKg,
    );
    if (!band) return null;
    return { min: band.min, max: band.max };
  }

  return null;
}

// ── Pancreas duct ───────────────────────────────────────────────────────────

export function getPancreasDuctReference(
  species: UltrasoundSpecies,
  ageYears: number | null,
): { max: number } | null {
  if (species === 'canis') return null;
  if (ageYears === null) return null;
  return ageYears < 10 ? { max: 0.13 } : { max: 0.25 };
}

// ── Static reference constants ──────────────────────────────────────────────

export const CANIS_REFS = {
  bladder_wall_cm:        { min: null as null, max: 0.14 },
  kidney_pelvis_cm:       { min: null as null, max: 0.20 },
  intestine_duodenum_cm:  { min: null as null, max: 0.50 },
  intestine_jejunum_cm:   { min: null as null, max: 0.30 },
  intestine_ileum_cm:     { min: null as null, max: 0.50 },
  intestine_colon_cm:     { min: null as null, max: 0.15 },
  stomach_wall_cm:        { min: null as null, max: 0.50 },
} as const;

export const FELIS_REFS = {
  bladder_wall_cm:        { min: 0.13, max: 0.17 },
  kidney_cm:              { min: 3.0,  max: 4.5  },
  kidney_pelvis_cm:       { min: null as null, max: 0.20 },
  pancreas_left_lobe_cm:  { min: null as null, max: 0.90 },
  pancreas_right_lobe_cm: { min: null as null, max: 0.60 },
  gallbladder_duct_cm:    { min: null as null, max: 0.40 },
  intestine_duodenum_cm:  { min: null as null, max: 0.22 },
  intestine_jejunum_cm:   { min: null as null, max: 0.22 },
  intestine_ileum_cm:     { min: 0.17, max: 0.23 },
  intestine_colon_cm:     { min: 0.10, max: 0.25 },
  stomach_wall_cm:        { min: 0.11, max: 0.36 },
  spleen_hilar_cm:        { min: null as null, max: 1.00 },
} as const;
