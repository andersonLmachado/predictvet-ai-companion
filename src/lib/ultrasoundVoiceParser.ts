// src/lib/ultrasoundVoiceParser.ts
import type { UltrasoundReportData } from '@/types/ultrasound';

// ── PT-BR word → digit map ──────────────────────────────────────────────────
const WORD_TO_DIGIT: Record<string, string> = {
  zero: '0', um: '1', uma: '1', dois: '2', duas: '2',
  três: '3', tres: '3', quatro: '4', cinco: '5', seis: '6',
  sete: '7', oito: '8', nove: '9', dez: '10', onze: '11',
  doze: '12', treze: '13', quatorze: '14', catorze: '14',
  quinze: '15', dezesseis: '16', dezessete: '17', dezoito: '18',
  dezenove: '19', vinte: '20', trinta: '30', quarenta: '40',
  cinquenta: '50',
};

function normalize(text: string): string {
  // Remove accents, lowercase, replace vírgula/ponto with '.'
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bvirgula\b/g, '.')
    .replace(/\bponto\b/g, '.')
    .replace(/\be\b/g, ''); // "quarenta e cinco" → "quarenta cinco"
}

function wordsToDigits(text: string): string {
  let result = text;
  // Sort by length desc so longer phrases match first
  const entries = Object.entries(WORD_TO_DIGIT).sort((a, b) => b[0].length - a[0].length);
  for (const [word, digit] of entries) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  }
  return result;
}

/**
 * Combine adjacent numbers after word-to-digit conversion.
 * e.g. "quarenta cinco" → "40 5" → if followed by decimal context, treat as 0.45
 * Strategy: after word conversion, collapse "INTEGER DECIMAL" into "INTEGER.DECIMAL"
 * when both are standalone numbers (handles "zero . quatorze" → "0.14")
 */
function collapseNumbers(text: string): string {
  // After normalize+wordsToDigits we may have patterns like "0 . 14" or "40 5"
  // Collapse "N . M" → "N.M"
  let result = text.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');
  // Collapse compound tens+units: "40 5" → "0.45", "40 2" → "0.42"
  // This handles "quarenta cinco" (40 5) which should be 0.45
  result = result.replace(/\b(10|20|30|40|50)\s+(\d)\b/g, (_m, tens, unit) => {
    return `0.${tens}${unit}`;
  });
  return result;
}

function extractAfter(text: string, keywords: string[]): number | null {
  const normalized = collapseNumbers(wordsToDigits(normalize(text)));
  for (const kw of keywords) {
    const kwNorm = collapseNumbers(wordsToDigits(normalize(kw)));
    // Look for keyword followed by optional space/chars then a number
    const regex = new RegExp(
      `${kwNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:[^\\d.]*)?(\\d+\\.?\\d*)`,
      'i',
    );
    const match = normalized.match(regex);
    if (match) {
      const v = parseFloat(match[1]);
      if (!isNaN(v)) return v;
    }
  }
  return null;
}

// ── Organ parsers ───────────────────────────────────────────────────────────

type OrganParser = (t: string) => Partial<UltrasoundReportData>;

const parsers: Record<string, OrganParser> = {
  bladder: (t) => {
    const wall = extractAfter(t, ['parede']);
    return wall != null ? { bladder_wall_cm: wall } : {};
  },

  kidney: (t) => {
    const r: Partial<UltrasoundReportData> = {};
    const l = extractAfter(t, ['rim esquerdo', 're ']);
    const ri = extractAfter(t, ['rim direito', 'rd ']);
    const pl = extractAfter(t, ['pelve esquerda', 'pelve renal esquerda']);
    const pr = extractAfter(t, ['pelve direita', 'pelve renal direita']);
    if (l != null) r.kidney_left_cm = l;
    if (ri != null) r.kidney_right_cm = ri;
    if (pl != null) r.kidney_pelvis_left_cm = pl;
    if (pr != null) r.kidney_pelvis_right_cm = pr;
    return r;
  },

  gallbladder: (t) => {
    const r: Partial<UltrasoundReportData> = {};
    const wall = extractAfter(t, ['parede']);
    const duct = extractAfter(t, ['ducto', 'coledoco']);
    if (wall != null) r.gallbladder_wall_cm = wall;
    if (duct != null) r.gallbladder_duct_cm = duct;
    return r;
  },

  stomach: (t) => {
    const wall = extractAfter(t, ['parede']);
    return wall != null ? { stomach_wall_cm: wall } : {};
  },

  intestine: (t) => {
    const r: Partial<UltrasoundReportData> = {};
    const d = extractAfter(t, ['duodeno']);
    const j = extractAfter(t, ['jejuno']);
    const i = extractAfter(t, ['ileo', 'ileum']);
    const c = extractAfter(t, ['colon', 'colo ']);
    if (d != null) r.intestine_duodenum_cm = d;
    if (j != null) r.intestine_jejunum_cm = j;
    if (i != null) r.intestine_ileum_cm = i;
    if (c != null) r.intestine_colon_cm = c;
    return r;
  },

  pancreas: (t) => {
    const r: Partial<UltrasoundReportData> = {};
    const right = extractAfter(t, ['lobo direito']);
    const left = extractAfter(t, ['lobo esquerdo']);
    const duct = extractAfter(t, ['ducto']);
    if (right != null) r.pancreas_right_lobe_cm = right;
    if (left != null) r.pancreas_left_lobe_cm = left;
    if (duct != null) r.pancreas_duct_cm = duct;
    return r;
  },

  adrenal: (t) => {
    const r: Partial<UltrasoundReportData> = {};
    const l = extractAfter(t, ['esquerda', 'gae']);
    const ri = extractAfter(t, ['direita', 'gad']);
    if (l != null) r.adrenal_left_cm = l;
    if (ri != null) r.adrenal_right_cm = ri;
    return r;
  },

  reproductive: (t) => {
    const r: Partial<UltrasoundReportData> = {};
    const len = extractAfter(t, ['comprimento', 'prostata comprimento']);
    const h = extractAfter(t, ['altura']);
    const w = extractAfter(t, ['largura']);
    const tl1 = extractAfter(t, ['testiculo esquerdo']);
    const tr1 = extractAfter(t, ['testiculo direito']);
    const ol1 = extractAfter(t, ['ovario esquerdo']);
    const or1 = extractAfter(t, ['ovario direito']);
    if (len != null) r.prostate_length_cm = len;
    if (h != null) r.prostate_height_cm = h;
    if (w != null) r.prostate_width_cm = w;
    if (tl1 != null) r.testis_left_cm1 = tl1;
    if (tr1 != null) r.testis_right_cm1 = tr1;
    if (ol1 != null) r.ovary_left_cm1 = ol1;
    if (or1 != null) r.ovary_right_cm1 = or1;
    return r;
  },
};

// ── Public API ──────────────────────────────────────────────────────────────

export function parseVoiceMeasurements(
  transcript: string,
  organ: string,
): Partial<UltrasoundReportData> {
  try {
    const parser = parsers[organ];
    if (!parser) return {};
    return parser(transcript);
  } catch {
    return {};
  }
}
