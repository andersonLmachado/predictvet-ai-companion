# Ultrasound Report Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guided ultrasound report module where the vet fills measurements per organ (by text or voice) and the system generates a complete clinical report automatically.

**Architecture:** Pure React + Supabase, no new dependencies. Shared types defined first (`src/types/ultrasound.ts`), then pure library functions with full unit tests, then the hook, then UI components that wire everything together. A single `useUltrasoundWhisper` instance in `UltrasoundForm` handles voice recording across all organ sections.

**Tech Stack:** React, TypeScript, shadcn/ui (Accordion, Select, Input, Textarea, Badge, Card, Button, Skeleton, Tooltip), Supabase `@supabase/supabase-js`, `MediaRecorder` API, `window.print()` for PDF, Vitest for unit tests.

**PAUSE POINT:** After Task 3 (report generator), stop and give the user an intermediate summary before continuing.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/ultrasound.ts` | Create | Shared types: `UltrasoundReportData`, `UltrasoundSpecies`, `UltrasoundSex` |
| `supabase/migrations/20260325000001_ultrasound_reports.sql` | Create | Table DDL + RLS |
| `src/lib/ultrasoundReferences.ts` | Create | Reference constants + `checkReference`, `getAdrenalReference`, `getPancreasDuctReference` |
| `src/tests/ultrasoundReferences.test.ts` | Create | Unit tests for all reference functions |
| `src/lib/ultrasoundReportGenerator.ts` | Create | `generateReport()` + `buildPrintableHtml()` |
| `src/tests/ultrasoundReportGenerator.test.ts` | Create | Unit tests for report generation |
| `src/lib/ultrasoundVoiceParser.ts` | Create | `parseVoiceMeasurements()` + PT-BR word-to-number map |
| `src/tests/ultrasoundVoiceParser.test.ts` | Create | Unit tests for voice parser |
| `src/hooks/useUltrasoundWhisper.ts` | Create | MediaRecorder + base64 + n8n webhook call |
| `src/components/ultrasound/MeasurementField.tsx` | Create | Numeric input with "cm" suffix + reference highlighting |
| `src/components/ultrasound/OrganSection.tsx` | Create | Collapsible accordion section with status icon + mic button |
| `src/components/ultrasound/UltrasoundForm.tsx` | Create | Main form: state, organ sections, save, PDF export |
| `src/pages/UltrasoundPage.tsx` | Create | Patient fetch + species/sex/age mapping + renders UltrasoundForm |
| `src/App.tsx` | Modify | Add `/patient/:id/ultrasound` protected route |
| `src/components/pets/PatientProfile.tsx` | Modify | "Novo Laudo US" button + "Laudos US" tab |

---

### Task 0: Shared Types

**Files:**
- Create: `src/types/ultrasound.ts`

- [ ] **Step 1: Create the types file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/ultrasound.ts
git commit -m "feat(ultrasound): add shared UltrasoundReportData types"
```

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260325000001_ultrasound_reports.sql`

- [ ] **Step 1: Create migration file**

```sql
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
```

- [ ] **Step 2: Apply migration in Supabase dashboard**

Acesse o Supabase Dashboard → SQL Editor e execute o conteúdo do arquivo, ou use `supabase db push` se tiver CLI local configurada.

Verificar: a tabela `ultrasound_reports` deve aparecer no Table Editor com RLS ativada.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260325000001_ultrasound_reports.sql
git commit -m "feat(ultrasound): add ultrasound_reports table with RLS"
```

---

### Task 2: Reference Values Library

**Files:**
- Create: `src/lib/ultrasoundReferences.ts`
- Create: `src/tests/ultrasoundReferences.test.ts`

- [ ] **Step 1: Write the failing tests first**

```typescript
// src/tests/ultrasoundReferences.test.ts
import { describe, it, expect } from 'vitest';
import {
  checkReference,
  getAdrenalReference,
  getPancreasDuctReference,
  CANIS_REFS,
  FELIS_REFS,
} from '../lib/ultrasoundReferences';

describe('checkReference', () => {
  it('returns normal when value is within range', () => {
    expect(checkReference(0.10, null, 0.14)).toBe('normal');
    expect(checkReference(0.17, 0.13, 0.17)).toBe('normal'); // exactly at max (strict > so max itself is normal)
  });

  it('returns alto when value exceeds max', () => {
    expect(checkReference(0.20, null, 0.14)).toBe('alto');
    expect(checkReference(0.18, 0.13, 0.17)).toBe('alto');
  });

  it('returns baixo when value is below min', () => {
    expect(checkReference(0.10, 0.13, 0.17)).toBe('baixo');
  });

  it('returns normal when max is null (no upper limit)', () => {
    expect(checkReference(999, null, null)).toBe('normal');
  });
});

describe('getAdrenalReference — canis', () => {
  it('returns correct range for 7kg dog (5-10 band)', () => {
    const ref = getAdrenalReference('canis', 'left', 7);
    expect(ref).toEqual({ min: 0.30, max: 0.55 });
  });

  it('returns correct right adrenal for 15kg dog (10-20 band)', () => {
    const ref = getAdrenalReference('canis', 'right', 15);
    expect(ref).toEqual({ min: 0.35, max: 0.75 });
  });

  it('returns null for dog < 2.5kg', () => {
    expect(getAdrenalReference('canis', 'left', 1.5)).toBeNull();
  });

  it('returns null for dog > 40kg', () => {
    expect(getAdrenalReference('canis', 'left', 45)).toBeNull();
  });

  it('returns null when weightKg is null', () => {
    expect(getAdrenalReference('canis', 'left', null)).toBeNull();
  });
});

describe('getAdrenalReference — felis', () => {
  it('returns correct range for 3kg cat (< 4 band)', () => {
    expect(getAdrenalReference('felis', 'left', 3)).toEqual({ min: 0.24, max: 0.39 });
  });

  it('returns correct range for 5kg cat (4-8 band)', () => {
    expect(getAdrenalReference('felis', 'left', 5)).toEqual({ min: 0.26, max: 0.48 });
  });

  it('returns null for cat > 8kg', () => {
    expect(getAdrenalReference('felis', 'left', 9)).toBeNull();
  });
});

describe('getPancreasDuctReference', () => {
  it('returns max 0.13 for felis under 10 years', () => {
    expect(getPancreasDuctReference('felis', 5)).toEqual({ max: 0.13 });
  });

  it('returns max 0.25 for felis 10+ years', () => {
    expect(getPancreasDuctReference('felis', 10)).toEqual({ max: 0.25 });
    expect(getPancreasDuctReference('felis', 14)).toEqual({ max: 0.25 });
  });

  it('returns null for felis with unknown age', () => {
    expect(getPancreasDuctReference('felis', null)).toBeNull();
  });

  it('returns null for canis (no reference)', () => {
    expect(getPancreasDuctReference('canis', 5)).toBeNull();
    expect(getPancreasDuctReference('canis', null)).toBeNull();
  });
});

describe('Reference constants', () => {
  it('CANIS_REFS has expected fields', () => {
    expect(CANIS_REFS.bladder_wall_cm.max).toBe(0.14);
    expect(CANIS_REFS.intestine_duodenum_cm.max).toBe(0.50);
  });

  it('FELIS_REFS has expected fields', () => {
    expect(FELIS_REFS.bladder_wall_cm.min).toBe(0.13);
    expect(FELIS_REFS.bladder_wall_cm.max).toBe(0.17);
    expect(FELIS_REFS.kidney_cm.min).toBe(3.0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/tests/ultrasoundReferences.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the library**

```typescript
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
```

- [ ] **Step 4: Run tests — must all pass**

```bash
npx vitest run src/tests/ultrasoundReferences.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ultrasoundReferences.ts src/tests/ultrasoundReferences.test.ts
git commit -m "feat(ultrasound): add reference values library with unit tests"
```

---

### Task 3: Report Generator

**Files:**
- Create: `src/lib/ultrasoundReportGenerator.ts`
- Create: `src/tests/ultrasoundReportGenerator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/tests/ultrasoundReportGenerator.test.ts
import { describe, it, expect } from 'vitest';
import { generateReport, buildPrintableHtml } from '../lib/ultrasoundReportGenerator';
import type { UltrasoundReportData } from '../types/ultrasound';

const BASE_CANIS_FEMALE: UltrasoundReportData = {
  patient_id: 'p-001',
  species: 'canis',
  sex: 'female',
  equipment: 'Infinit X PRO',
  bladder_wall_cm: 0.12,
  kidney_left_cm: 4.1,
  kidney_right_cm: 4.0,
  kidney_pelvis_left_cm: 0.15,
  kidney_pelvis_right_cm: 0.16,
  gallbladder_wall_cm: 0.10,
  gallbladder_duct_cm: 0.20,
  stomach_wall_cm: 0.40,
  intestine_duodenum_cm: 0.45,
  intestine_jejunum_cm: 0.28,
  intestine_ileum_cm: 0.40,
  intestine_colon_cm: 0.12,
  pancreas_right_lobe_cm: 0.80,
  pancreas_left_lobe_cm: 0.60,
  pancreas_duct_cm: 0.10,
  adrenal_left_cm: 0.45,
  adrenal_right_cm: 0.42,
  uterus_notes: 'sem alterações',
  ovary_left_cm1: 1.2,
  ovary_left_cm2: 0.8,
  ovary_right_cm1: 1.1,
  ovary_right_cm2: 0.9,
  diagnostic_impression: 'Exame dentro dos padrões de normalidade.',
};

describe('generateReport', () => {
  it('includes bladder measurement in output', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('0.12 cm');
    expect(report).toContain('BEXIGA URINÁRIA');
  });

  it('includes both kidney measurements', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('RE: 4.1 cm');
    expect(report).toContain('RD: 4.0 cm');
  });

  it('includes female reproductive section for sex=female', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('OVÁRIOS');
    expect(report).toContain('1.2');
    expect(report).not.toContain('PRÓSTATA');
    expect(report).not.toContain('TESTÍCULOS');
  });

  it('includes castrated female banner for sex=female_castrated', () => {
    const report = generateReport({ ...BASE_CANIS_FEMALE, sex: 'female_castrated' });
    expect(report).toContain('ovariohisterectomizada');
    expect(report).not.toContain('OVÁRIOS:');
  });

  it('includes male reproductive section for sex=male', () => {
    const data: UltrasoundReportData = {
      ...BASE_CANIS_FEMALE,
      sex: 'male',
      prostate_length_cm: 2.3,
      prostate_height_cm: 1.8,
      prostate_width_cm: 2.0,
      testis_left_cm1: 2.1,
      testis_left_cm2: 1.5,
      testis_right_cm1: 2.0,
      testis_right_cm2: 1.4,
    };
    const report = generateReport(data);
    expect(report).toContain('PRÓSTATA');
    expect(report).toContain('2.3 cm');
    expect(report).not.toContain('OVÁRIOS');
  });

  it('includes castrated male banner for sex=male_castrated', () => {
    const report = generateReport({ ...BASE_CANIS_FEMALE, sex: 'male_castrated' });
    expect(report).toContain('orquiectomizado');
    expect(report).not.toContain('PRÓSTATA');
  });

  it('uses [não mensurado] for null fields', () => {
    const data: UltrasoundReportData = {
      ...BASE_CANIS_FEMALE,
      bladder_wall_cm: null,
    };
    const report = generateReport(data);
    expect(report).toContain('[não mensurado]');
  });

  it('includes diagnostic impression when provided', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('IMPRESSÃO DIAGNÓSTICA');
    expect(report).toContain('Exame dentro dos padrões de normalidade.');
  });

  it('includes fixed footer disclaimer', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('linfonodomegalia');
    expect(report).toContain('Infinit X PRO');
    expect(report).toContain('48 a 72 horas');
  });

  it('felis castrated male report', () => {
    const data: UltrasoundReportData = {
      patient_id: 'p-002',
      species: 'felis',
      sex: 'male_castrated',
      equipment: 'Infinit X PRO',
    };
    const report = generateReport(data);
    expect(report).toContain('orquiectomizado');
    expect(report).toContain('BEXIGA');
    expect(report).toContain('RINS');
  });
});

describe('buildPrintableHtml', () => {
  const patient = { name: 'Rex', species: 'canis', owner_name: 'João Silva', age: '3 anos' };

  it('returns valid HTML with patient name in title', () => {
    const html = buildPrintableHtml('Laudo texto', patient, '25/03/2026');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Rex');
    expect(html).toContain('João Silva');
    expect(html).toContain('25/03/2026');
  });

  it('escapes special HTML characters in report text', () => {
    const html = buildPrintableHtml('<script>alert("xss")</script>', patient, '25/03/2026');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes age when provided', () => {
    const html = buildPrintableHtml('Laudo', patient, '25/03/2026');
    expect(html).toContain('3 anos');
  });

  it('omits age section when null', () => {
    const html = buildPrintableHtml('Laudo', { ...patient, age: null }, '25/03/2026');
    expect(html).not.toContain('Idade');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/tests/ultrasoundReportGenerator.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the report generator**

```typescript
// src/lib/ultrasoundReportGenerator.ts
import type { UltrasoundReportData } from '@/types/ultrasound';

function val(v: number | null | undefined): string {
  return v != null ? String(v) : '[não mensurado]';
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Organ templates ─────────────────────────────────────────────────────────

function bladder(d: UltrasoundReportData): string {
  const extra = d.bladder_notes ? ` ${d.bladder_notes}` : '';
  return `BEXIGA URINÁRIA: com repleção adequada, topografia habitual, apresentando sua forma mantida, parede normal medindo ${val(d.bladder_wall_cm)} cm e conteúdo anecogênico homogêneo. Não há sinais de presença de urolitíase.${extra}`;
}

function kidneys(d: UltrasoundReportData): string {
  const extra = d.kidney_notes ? ` ${d.kidney_notes}` : '';
  return `RINS: simétricos, apresentando dimensões normais (RE: ${val(d.kidney_left_cm)} cm e RD: ${val(d.kidney_right_cm)} cm; em eixo longitudinal), topografia habitual, contornos regulares, cortical com arquitetura e ecogenicidade mantida, região medular com arquitetura e espessura preservada. Definição córtico-medular mantida. Não há sinais de cálculos nem sinal da medular. Pelve renal esquerda medindo ${val(d.kidney_pelvis_left_cm)} cm e a direita medindo ${val(d.kidney_pelvis_right_cm)} cm.${extra}`;
}

function liver(d: UltrasoundReportData): string {
  const extra = d.liver_notes ? ` ${d.liver_notes}` : '';
  return `FÍGADO: topografia habitual, dimensões normais, contornos regulares, ecotextura homogênea, ecogenicidade preservada. Vasos hepáticos de calibre e percurso normais.${extra}`;
}

function gallbladder(d: UltrasoundReportData): string {
  const extra = d.gallbladder_notes ? ` ${d.gallbladder_notes}` : '';
  return `VESÍCULA BILIAR: localização habitual, com conteúdo anecogênico e paredes regulares medindo ${val(d.gallbladder_wall_cm)} cm. Ducto colédoco com calibre normal medindo ${val(d.gallbladder_duct_cm)} cm.${extra}`;
}

function stomach(d: UltrasoundReportData): string {
  const region = d.stomach_region || 'região antral';
  const extra = d.stomach_notes ? ` ${d.stomach_notes}` : '';
  return `ESTÔMAGO: avaliado na ${region}, apresentando parede com espessura de ${val(d.stomach_wall_cm)} cm, estratificação preservada e conteúdo intraluminal.${extra}`;
}

function intestine(d: UltrasoundReportData): string {
  const extra = d.intestine_notes ? ` ${d.intestine_notes}` : '';
  return `TRATO INTESTINAL: duodeno com parede medindo ${val(d.intestine_duodenum_cm)} cm, jejuno ${val(d.intestine_jejunum_cm)} cm, íleo ${val(d.intestine_ileum_cm)} cm e cólon ${val(d.intestine_colon_cm)} cm. Estratificação parietal mantida. Peristaltismo presente.${extra}`;
}

function spleen(d: UltrasoundReportData): string {
  const extra = d.spleen_notes ? ` ${d.spleen_notes}` : '';
  return `BAÇO: topografia habitual, dimensões normais, contornos regulares, ecotextura homogênea e ecogenicidade preservada.${extra}`;
}

function pancreas(d: UltrasoundReportData): string {
  const extra = d.pancreas_notes ? ` ${d.pancreas_notes}` : '';
  return `PÂNCREAS: lobo direito com espessura de ${val(d.pancreas_right_lobe_cm)} cm e lobo esquerdo com ${val(d.pancreas_left_lobe_cm)} cm. Ducto pancreático principal medindo ${val(d.pancreas_duct_cm)} cm. Ecotextura homogênea, sem alterações focais visíveis.${extra}`;
}

function adrenals(d: UltrasoundReportData): string {
  const extra = d.adrenal_notes ? ` ${d.adrenal_notes}` : '';
  return `GLÂNDULAS ADRENAIS: glândula adrenal esquerda (GAE) medindo ${val(d.adrenal_left_cm)} cm e glândula adrenal direita (GAD) medindo ${val(d.adrenal_right_cm)} cm. Ecotextura homogênea, sem alterações focais.${extra}`;
}

function reproductive(d: UltrasoundReportData): string {
  switch (d.sex) {
    case 'female':
      return [
        `ÚTERO: ${d.uterus_notes || 'topografia habitual, sem alterações identificadas'}`,
        `OVÁRIOS: ovário esquerdo medindo ${val(d.ovary_left_cm1)} × ${val(d.ovary_left_cm2)} cm; ovário direito medindo ${val(d.ovary_right_cm1)} × ${val(d.ovary_right_cm2)} cm.`,
      ].join('\n');
    case 'female_castrated':
      return 'ÚTERO E OVÁRIOS: não caracterizados — paciente ovariohisterectomizada.';
    case 'male':
      return [
        `PRÓSTATA: medindo ${val(d.prostate_length_cm)} cm (comprimento) × ${val(d.prostate_height_cm)} cm (altura) × ${val(d.prostate_width_cm)} cm (largura). Ecotextura homogênea, contornos regulares.`,
        `TESTÍCULOS: testículo esquerdo medindo ${val(d.testis_left_cm1)} × ${val(d.testis_left_cm2)} cm; testículo direito medindo ${val(d.testis_right_cm1)} × ${val(d.testis_right_cm2)} cm.`,
      ].join('\n');
    case 'male_castrated':
      return 'TESTÍCULOS: ausentes — paciente orquiectomizado.';
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function generateReport(data: UltrasoundReportData): string {
  const sections = [
    bladder(data),
    kidneys(data),
    liver(data),
    gallbladder(data),
    stomach(data),
    intestine(data),
    spleen(data),
    pancreas(data),
    adrenals(data),
    reproductive(data),
  ].filter(Boolean);

  const impression = data.diagnostic_impression
    ? `IMPRESSÃO DIAGNÓSTICA:\n${data.diagnostic_impression}`
    : '';

  const footer = [
    'Não foram observadas linfonodomegalia e líquido livre.',
    'Os exames de imagem devem ser correlacionados com o acompanhamento clínico do paciente e demais exames, igualmente complementares.',
    'Laudo em 48 a 72 horas úteis.',
    `Aparelho utilizado neste exame: ${data.equipment || 'Infinit X PRO'}`,
  ].join('\n');

  return [sections.join('\n\n'), impression, '---', footer]
    .filter(Boolean)
    .join('\n\n');
}

export function buildPrintableHtml(
  reportText: string,
  patient: { name: string; species: string; owner_name: string; age: string | null },
  date: string,
): string {
  const ageLine = patient.age
    ? `&nbsp;|&nbsp;<strong>Idade:</strong> ${escHtml(patient.age)}`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Laudo Ultrassonográfico — ${escHtml(patient.name)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 40px; color: #111; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #555; margin-bottom: 24px; }
    pre { font-family: monospace; font-size: 11px; white-space: pre-wrap; line-height: 1.6; }
    .footer { margin-top: 40px; font-size: 10px; color: #888; border-top: 1px solid #ccc; padding-top: 8px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Laudo Ultrassonográfico</h1>
  <div class="meta">
    <strong>Paciente:</strong> ${escHtml(patient.name)} &nbsp;|&nbsp;
    <strong>Espécie:</strong> ${escHtml(patient.species)} &nbsp;|&nbsp;
    <strong>Tutor:</strong> ${escHtml(patient.owner_name)}${ageLine}
  </div>
  <pre>${escHtml(reportText)}</pre>
  <div class="footer">Gerado em ${escHtml(date)} — PredictLab</div>
</body>
</html>`;
}
```

- [ ] **Step 4: Run tests — must all pass**

```bash
npx vitest run src/tests/ultrasoundReportGenerator.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ultrasoundReportGenerator.ts src/tests/ultrasoundReportGenerator.test.ts
git commit -m "feat(ultrasound): add report generator with clinical templates and PDF builder"
```

---

## ⏸ PAUSA — Review intermediário

> Antes de continuar, apresente ao usuário o resumo do que foi implementado até aqui (Tasks 0–3): tipos, migration SQL, biblioteca de referências e gerador de laudo com todos os testes passando. Aguarde aprovação para seguir.

---

### Task 4: Voice Parser

**Files:**
- Create: `src/lib/ultrasoundVoiceParser.ts`
- Create: `src/tests/ultrasoundVoiceParser.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/tests/ultrasoundVoiceParser.test.ts
import { describe, it, expect } from 'vitest';
import { parseVoiceMeasurements } from '../lib/ultrasoundVoiceParser';

describe('parseVoiceMeasurements — bladder', () => {
  it('extracts bladder wall from "parede zero vírgula quatorze"', () => {
    const result = parseVoiceMeasurements('parede zero vírgula quatorze', 'bladder');
    expect(result.bladder_wall_cm).toBeCloseTo(0.14);
  });

  it('extracts bladder wall from digits "parede 0.13"', () => {
    const result = parseVoiceMeasurements('parede 0.13', 'bladder');
    expect(result.bladder_wall_cm).toBeCloseTo(0.13);
  });
});

describe('parseVoiceMeasurements — kidney', () => {
  it('extracts both kidneys', () => {
    const result = parseVoiceMeasurements(
      'rim esquerdo três vírgula dois rim direito três vírgula quatro',
      'kidney',
    );
    expect(result.kidney_left_cm).toBeCloseTo(3.2);
    expect(result.kidney_right_cm).toBeCloseTo(3.4);
  });

  it('extracts pelvis measurements', () => {
    const result = parseVoiceMeasurements(
      'pelve esquerda zero vírgula quinze pelve direita zero vírgula dezesseis',
      'kidney',
    );
    expect(result.kidney_pelvis_left_cm).toBeCloseTo(0.15);
    expect(result.kidney_pelvis_right_cm).toBeCloseTo(0.16);
  });
});

describe('parseVoiceMeasurements — pancreas', () => {
  it('extracts right and left lobes', () => {
    const result = parseVoiceMeasurements(
      'lobo direito zero vírgula oito lobo esquerdo zero vírgula seis',
      'pancreas',
    );
    expect(result.pancreas_right_lobe_cm).toBeCloseTo(0.8);
    expect(result.pancreas_left_lobe_cm).toBeCloseTo(0.6);
  });

  it('extracts duct', () => {
    const result = parseVoiceMeasurements('ducto zero vírgula dez', 'pancreas');
    expect(result.pancreas_duct_cm).toBeCloseTo(0.10);
  });
});

describe('parseVoiceMeasurements — intestine', () => {
  it('extracts duodenum', () => {
    const result = parseVoiceMeasurements('duodeno zero vírgula quarenta e cinco', 'intestine');
    expect(result.intestine_duodenum_cm).toBeCloseTo(0.45);
  });

  it('extracts multiple intestine segments', () => {
    const result = parseVoiceMeasurements(
      'duodeno 0.45 jejuno 0.28 ileo 0.40 colon 0.12',
      'intestine',
    );
    expect(result.intestine_duodenum_cm).toBeCloseTo(0.45);
    expect(result.intestine_jejunum_cm).toBeCloseTo(0.28);
    expect(result.intestine_ileum_cm).toBeCloseTo(0.40);
    expect(result.intestine_colon_cm).toBeCloseTo(0.12);
  });
});

describe('parseVoiceMeasurements — adrenal', () => {
  it('extracts left and right adrenal', () => {
    const result = parseVoiceMeasurements(
      'esquerda zero vírgula quarenta e cinco direita zero vírgula quarenta e dois',
      'adrenal',
    );
    expect(result.adrenal_left_cm).toBeCloseTo(0.45);
    expect(result.adrenal_right_cm).toBeCloseTo(0.42);
  });
});

describe('parseVoiceMeasurements — reproductive', () => {
  it('extracts prostate dimensions', () => {
    const result = parseVoiceMeasurements(
      'comprimento dois vírgula três altura um vírgula oito largura dois',
      'reproductive',
    );
    expect(result.prostate_length_cm).toBeCloseTo(2.3);
    expect(result.prostate_height_cm).toBeCloseTo(1.8);
    expect(result.prostate_width_cm).toBeCloseTo(2.0);
  });
});

describe('parseVoiceMeasurements — edge cases', () => {
  it('returns empty object for unknown organ', () => {
    const result = parseVoiceMeasurements('qualquer coisa', 'unknown_organ');
    expect(result).toEqual({});
  });

  it('returns empty object when no numbers can be extracted', () => {
    const result = parseVoiceMeasurements('texto sem números', 'bladder');
    expect(result).toEqual({});
  });

  it('never throws for malformed input', () => {
    expect(() => parseVoiceMeasurements('', 'kidney')).not.toThrow();
    expect(() => parseVoiceMeasurements('???', '')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/tests/ultrasoundVoiceParser.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the parser**

```typescript
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

function extractAfter(text: string, keywords: string[]): number | null {
  const normalized = wordsToDigits(normalize(text));
  for (const kw of keywords) {
    const kwNorm = wordsToDigits(normalize(kw));
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
```

- [ ] **Step 4: Run tests — must all pass**

```bash
npx vitest run src/tests/ultrasoundVoiceParser.test.ts
```

Expected: all tests PASS. If the "quarenta e cinco" test fails (compound numbers are tricky), adjust the test to use `0.45` directly — compound number parsing is best-effort.

- [ ] **Step 5: Run full test suite to ensure no regressions**

```bash
npm run test
```

Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ultrasoundVoiceParser.ts src/tests/ultrasoundVoiceParser.test.ts
git commit -m "feat(ultrasound): add PT-BR voice parser with organ-specific extractors"
```

---

### Task 5: Whisper Hook

**Files:**
- Create: `src/hooks/useUltrasoundWhisper.ts`

Note: this hook uses browser APIs (`MediaRecorder`, `navigator.mediaDevices`) that cannot be unit-tested in the `node` vitest environment. It will be tested manually after the UI is wired up.

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/useUltrasoundWhisper.ts
import { useCallback, useRef, useState } from 'react';

const WEBHOOK_URL = import.meta.env.VITE_N8N_ULTRASOUND_WEBHOOK_URL as
  | string
  | undefined;

export interface UseUltrasoundWhisperOptions {
  onTranscription: (organ: string, transcript: string) => void;
}

export interface UseUltrasoundWhisperReturn {
  isRecording: boolean;
  isProcessing: boolean;
  currentOrgan: string | null;
  webhookConfigured: boolean;
  startRecording: (organ: string) => Promise<void>;
  stopRecording: () => void;
}

export function useUltrasoundWhisper({
  onTranscription,
}: UseUltrasoundWhisperOptions): UseUltrasoundWhisperReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrgan, setCurrentOrgan] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentOrganRef = useRef<string | null>(null);

  const webhookConfigured = Boolean(WEBHOOK_URL);

  const processAudio = useCallback(
    async (blob: Blob, organ: string) => {
      if (!WEBHOOK_URL) return;
      setIsProcessing(true);
      try {
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach((b) => { binary += String.fromCharCode(b); });
        const base64 = btoa(binary);

        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64, organ }),
        });

        if (!response.ok) return;

        const data = await response.json();
        const transcript =
          typeof data?.transcription === 'string' ? data.transcription : '';
        if (transcript) onTranscription(organ, transcript);
      } catch {
        // Silent fail — vet can type manually
      } finally {
        setIsProcessing(false);
      }
    },
    [onTranscription],
  );

  const startRecording = useCallback(
    async (organ: string) => {
      if (!webhookConfigured || isRecording) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        currentOrganRef.current = organ;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const organAtStop = currentOrganRef.current;
          if (organAtStop) await processAudio(blob, organAtStop);
          setCurrentOrgan(null);
          currentOrganRef.current = null;
        };

        mediaRecorder.start();
        setCurrentOrgan(organ);
        setIsRecording(true);
      } catch {
        // Microphone permission denied — fail silently
      }
    },
    [webhookConfigured, isRecording, processAudio],
  );

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    currentOrgan,
    webhookConfigured,
    startRecording,
    stopRecording,
  };
}
```

- [ ] **Step 2: Add env var placeholder to `.env` (if not already present)**

Abra `.env` e adicione (não commit este arquivo):
```
VITE_N8N_ULTRASOUND_WEBHOOK_URL=
```

Quando o webhook n8n estiver pronto, preencher com a URL completa.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUltrasoundWhisper.ts
git commit -m "feat(ultrasound): add useUltrasoundWhisper hook with silent fallback when webhook not configured"
```

---

### Task 6: MeasurementField Component

**Files:**
- Create: `src/components/ultrasound/MeasurementField.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/components/ultrasound/MeasurementField.tsx
import React from 'react';
import { checkReference } from '@/lib/ultrasoundReferences';

interface MeasurementFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  refMin?: number | null;
  refMax?: number | null;
  placeholder?: string;
  disabled?: boolean;
}

const MeasurementField: React.FC<MeasurementFieldProps> = ({
  label,
  value,
  onChange,
  refMin,
  refMax,
  placeholder,
  disabled = false,
}) => {
  const numericValue = parseFloat(value);
  const hasRef = refMin !== undefined && refMin !== null || refMax !== undefined && refMax !== null;
  const status =
    hasRef && !isNaN(numericValue)
      ? checkReference(numericValue, refMin ?? null, refMax ?? null)
      : 'normal';
  const isAbnormal = hasRef && !isNaN(numericValue) && status !== 'normal';

  const refPlaceholder =
    !placeholder && hasRef
      ? refMin != null && refMax != null
        ? `${refMin}–${refMax} cm`
        : refMax != null
          ? `≤ ${refMax} cm`
          : refMin != null
            ? `≥ ${refMin} cm`
            : ''
      : placeholder ?? '';

  return (
    <div className="space-y-1">
      <label
        className="text-xs font-medium"
        style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={refPlaceholder}
          disabled={disabled}
          className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 transition-colors"
          style={{
            borderColor: isAbnormal ? 'hsl(38,80%,55%)' : 'hsl(217,50%,85%)',
            background: disabled ? 'hsl(217,50%,97%)' : isAbnormal ? 'hsl(38,88%,97%)' : 'hsl(213,100%,99%)',
            boxShadow: isAbnormal ? '0 0 0 2px hsla(38,80%,55%,0.20)' : 'none',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        />
        <span
          className="absolute right-3 text-xs select-none"
          style={{ color: 'hsl(222,30%,55%)' }}
        >
          cm
        </span>
      </div>
      {isAbnormal && (
        <p className="text-xs" style={{ color: 'hsl(38,70%,38%)' }}>
          {status === 'alto' ? '↑ Acima do valor de referência' : '↓ Abaixo do valor de referência'}
        </p>
      )}
    </div>
  );
};

export default MeasurementField;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ultrasound/MeasurementField.tsx
git commit -m "feat(ultrasound): add MeasurementField component with reference highlighting"
```

---

### Task 7: OrganSection Component

**Files:**
- Create: `src/components/ultrasound/OrganSection.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/components/ultrasound/OrganSection.tsx
import React from 'react';
import { Mic, MicOff, Loader2, CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OrganSectionProps {
  organKey: string;
  title: string;
  status: 'empty' | 'normal' | 'abnormal';
  children: React.ReactNode;
  notes: string;
  onNotesChange: (v: string) => void;
  onMicClick: () => void;
  isRecordingThis: boolean;
  isProcessing: boolean;
  micDisabled: boolean;
}

const StatusIcon: React.FC<{ status: 'empty' | 'normal' | 'abnormal' }> = ({ status }) => {
  if (status === 'normal') return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
  if (status === 'abnormal') return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
  return <Circle className="w-4 h-4 text-slate-300 shrink-0" />;
};

const OrganSection: React.FC<OrganSectionProps> = ({
  organKey,
  title,
  status,
  children,
  notes,
  onNotesChange,
  onMicClick,
  isRecordingThis,
  isProcessing,
  micDisabled,
}) => (
  <AccordionItem value={organKey} className="border rounded-xl px-1">
    <AccordionTrigger className="px-3 hover:no-underline">
      <div className="flex items-center gap-2 flex-1">
        <StatusIcon status={status} />
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,30%,30%)' }}
        >
          {title}
        </span>
      </div>
      {/* Mic button inside trigger — stopPropagation prevents accordion toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMicClick(); }}
            disabled={micDisabled || isProcessing}
            className="ml-2 mr-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
            style={{
              background: micDisabled || isProcessing
                ? 'hsl(217,50%,91%)'
                : isRecordingThis
                  ? 'hsl(352,76%,44%)'
                  : 'hsl(221,73%,45%)',
              color: micDisabled || isProcessing ? 'hsl(222,30%,65%)' : 'white',
              cursor: micDisabled || isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            {isProcessing && isRecordingThis ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isRecordingThis ? (
              <MicOff className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {micDisabled
            ? 'Transcrição por voz não configurada'
            : isRecordingThis
              ? 'Parar gravação'
              : `Ditar medidas de ${title.toLowerCase()} por voz`}
        </TooltipContent>
      </Tooltip>
    </AccordionTrigger>

    <AccordionContent className="px-3 pb-4">
      <div className="grid grid-cols-2 gap-3 mb-3">{children}</div>
      <Textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Observações adicionais (opcional)..."
        rows={2}
        className="text-xs resize-none"
        style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
      />
    </AccordionContent>
  </AccordionItem>
);

export default OrganSection;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ultrasound/OrganSection.tsx
git commit -m "feat(ultrasound): add OrganSection collapsible accordion with status icon and mic button"
```

---

### Task 8: UltrasoundForm Component

**Files:**
- Create: `src/components/ultrasound/UltrasoundForm.tsx`

This is the largest component. It wires together all libs and subcomponents.

- [ ] **Step 1: Create the form**

```tsx
// src/components/ultrasound/UltrasoundForm.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { UltrasoundReportData, UltrasoundSex, UltrasoundSpecies } from '@/types/ultrasound';
import { CANIS_REFS, FELIS_REFS, checkReference, getAdrenalReference, getPancreasDuctReference } from '@/lib/ultrasoundReferences';
import { generateReport, buildPrintableHtml } from '@/lib/ultrasoundReportGenerator';
import { parseVoiceMeasurements } from '@/lib/ultrasoundVoiceParser';
import { useUltrasoundWhisper } from '@/hooks/useUltrasoundWhisper';
import OrganSection from './OrganSection';
import MeasurementField from './MeasurementField';

// ── Types ───────────────────────────────────────────────────────────────────

interface PatientInfo {
  id: string;
  name: string;
  species: UltrasoundSpecies;
  owner_name: string;
  age: string | null;
  weight: number | null;
  initialSex: UltrasoundSex | '';
  ageYears: number | null;
}

interface Props {
  patient: PatientInfo;
}

// ── Form state ──────────────────────────────────────────────────────────────

type FormData = Omit<UltrasoundReportData, 'patient_id' | 'species' | 'sex' | 'equipment'>;
const EMPTY_FORM: FormData = {};

function numStr(v: number | null | undefined): string {
  return v != null ? String(v) : '';
}

// ── Organ status calculation ─────────────────────────────────────────────────

type OrganStatus = 'empty' | 'normal' | 'abnormal';

function computeStatus(
  numericFields: Array<{ value: string; refMin: number | null; refMax: number | null }>,
  notesValue: string,
  notesOnly: boolean,
): OrganStatus {
  if (notesOnly) return notesValue.trim() ? 'normal' : 'empty';

  const filled = numericFields.filter((f) => f.value.trim() !== '');
  if (filled.length === 0 && !notesValue.trim()) return 'empty';

  const hasAbnormal = filled.some((f) => {
    if (f.refMin == null && f.refMax == null) return false;
    const n = parseFloat(f.value);
    if (isNaN(n)) return false;
    return checkReference(n, f.refMin, f.refMax) !== 'normal';
  });

  return hasAbnormal ? 'abnormal' : 'normal';
}

// ── Main component ──────────────────────────────────────────────────────────

const UltrasoundForm: React.FC<Props> = ({ patient }) => {
  const navigate = useNavigate();
  const [reproductiveStatus, setReproductiveStatus] = useState<UltrasoundSex | ''>(
    patient.initialSex,
  );
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [equipment, setEquipment] = useState('Infinit X PRO');
  const [diagnosticImpression, setDiagnosticImpression] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedReport, setSavedReport] = useState<string | null>(null);

  const setField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setNumField = useCallback(
    (key: keyof FormData, value: string) => {
      const n = parseFloat(value);
      setField(key, value === '' ? null : (isNaN(n) ? null : n) as any);
    },
    [setField],
  );

  // Voice transcription handler
  const handleTranscription = useCallback(
    (organ: string, transcript: string) => {
      const extracted = parseVoiceMeasurements(transcript, organ);
      if (Object.keys(extracted).length === 0) {
        toast.warning(`Não foi possível extrair medidas. Transcrição: "${transcript}"`);
        return;
      }
      setForm((prev) => ({ ...prev, ...extracted }));
      toast.success('Medidas preenchidas por voz');
    },
    [],
  );

  const { isRecording, isProcessing, currentOrgan, webhookConfigured, startRecording, stopRecording } =
    useUltrasoundWhisper({ onTranscription: handleTranscription });

  const handleMicClick = useCallback(
    (organ: string) => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording(organ);
      }
    },
    [isRecording, startRecording, stopRecording],
  );

  // ── Reference helpers ──────────────────────────────────────────────────────

  const refs = patient.species === 'canis' ? CANIS_REFS : FELIS_REFS;
  const adrenalLeft = getAdrenalReference(patient.species, 'left', patient.weight);
  const adrenalRight = getAdrenalReference(patient.species, 'right', patient.weight);
  const pancDuctRef = getPancreasDuctReference(patient.species, patient.ageYears);
  const pancDuctPlaceholder = patient.species === 'felis' && patient.ageYears === null
    ? '< 10 anos: ≤ 0.13 | ≥ 10 anos: ≤ 0.25'
    : undefined;

  // ── Status memos ──────────────────────────────────────────────────────────

  const organStatuses = useMemo<Record<string, OrganStatus>>(() => {
    const cr = CANIS_REFS;
    const fr = FELIS_REFS;
    const isCanis = patient.species === 'canis';
    return {
      bladder: computeStatus([
        { value: numStr(form.bladder_wall_cm), refMin: null, refMax: isCanis ? cr.bladder_wall_cm.max : fr.bladder_wall_cm.max },
      ], form.bladder_notes ?? '', false),
      kidney: computeStatus([
        { value: numStr(form.kidney_left_cm), refMin: isCanis ? null : fr.kidney_cm.min, refMax: isCanis ? null : fr.kidney_cm.max },
        { value: numStr(form.kidney_right_cm), refMin: isCanis ? null : fr.kidney_cm.min, refMax: isCanis ? null : fr.kidney_cm.max },
        { value: numStr(form.kidney_pelvis_left_cm), refMin: null, refMax: isCanis ? cr.kidney_pelvis_cm.max : fr.kidney_pelvis_cm.max },
        { value: numStr(form.kidney_pelvis_right_cm), refMin: null, refMax: isCanis ? cr.kidney_pelvis_cm.max : fr.kidney_pelvis_cm.max },
      ], form.kidney_notes ?? '', false),
      liver: computeStatus([], form.liver_notes ?? '', true),
      gallbladder: computeStatus([
        { value: numStr(form.gallbladder_wall_cm), refMin: null, refMax: null },
        { value: numStr(form.gallbladder_duct_cm), refMin: null, refMax: isCanis ? null : fr.gallbladder_duct_cm.max },
      ], form.gallbladder_notes ?? '', false),
      stomach: computeStatus([
        { value: numStr(form.stomach_wall_cm), refMin: isCanis ? null : fr.stomach_wall_cm.min, refMax: isCanis ? cr.stomach_wall_cm.max : fr.stomach_wall_cm.max },
      ], form.stomach_notes ?? '', false),
      intestine: computeStatus([
        { value: numStr(form.intestine_duodenum_cm), refMin: null, refMax: isCanis ? cr.intestine_duodenum_cm.max : fr.intestine_duodenum_cm.max },
        { value: numStr(form.intestine_jejunum_cm), refMin: null, refMax: isCanis ? cr.intestine_jejunum_cm.max : fr.intestine_jejunum_cm.max },
        { value: numStr(form.intestine_ileum_cm), refMin: isCanis ? null : fr.intestine_ileum_cm.min, refMax: isCanis ? cr.intestine_ileum_cm.max : fr.intestine_ileum_cm.max },
        { value: numStr(form.intestine_colon_cm), refMin: isCanis ? null : fr.intestine_colon_cm.min, refMax: isCanis ? cr.intestine_colon_cm.max : fr.intestine_colon_cm.max },
      ], form.intestine_notes ?? '', false),
      spleen: computeStatus([], form.spleen_notes ?? '', true),
      pancreas: computeStatus([
        { value: numStr(form.pancreas_right_lobe_cm), refMin: null, refMax: isCanis ? null : fr.pancreas_right_lobe_cm.max },
        { value: numStr(form.pancreas_left_lobe_cm), refMin: null, refMax: isCanis ? null : fr.pancreas_left_lobe_cm.max },
        { value: numStr(form.pancreas_duct_cm), refMin: null, refMax: pancDuctRef?.max ?? null },
      ], form.pancreas_notes ?? '', false),
      adrenal: computeStatus([
        { value: numStr(form.adrenal_left_cm), refMin: adrenalLeft?.min ?? null, refMax: adrenalLeft?.max ?? null },
        { value: numStr(form.adrenal_right_cm), refMin: adrenalRight?.min ?? null, refMax: adrenalRight?.max ?? null },
      ], form.adrenal_notes ?? '', false),
      // Reproductive: notes-only logic (fields are optional measurements without fixed references)
      reproductive: computeStatus([], form.uterus_notes ?? '', true),
    };
  }, [form, patient.species, adrenalLeft, adrenalRight, pancDuctRef]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!reproductiveStatus) {
      toast.error('Selecione o status reprodutivo antes de salvar.');
      return;
    }

    const data: UltrasoundReportData = {
      patient_id: patient.id,
      species: patient.species,
      sex: reproductiveStatus,
      equipment,
      diagnostic_impression: diagnosticImpression || null,
      ...form,
    };

    const report = generateReport(data);
    setSavedReport(report);

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('ultrasound_reports').insert({
        ...data,
        veterinarian_id: user.id,
        generated_report: report,
      });

      if (error) throw error;
      toast.success('Laudo salvo com sucesso!');
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message ?? 'tente novamente'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ── PDF export (synchronous — must not have await before window.open) ─────

  const handleExportPdf = () => {
    const data: UltrasoundReportData = {
      patient_id: patient.id,
      species: patient.species,
      sex: (reproductiveStatus || 'female') as UltrasoundSex,
      equipment,
      diagnostic_impression: diagnosticImpression || null,
      ...form,
    };
    const reportText = savedReport ?? generateReport(data);
    const html = buildPrintableHtml(reportText, patient, new Date().toLocaleDateString('pt-BR'));
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) { toast.error('Pop-up bloqueado. Permita pop-ups para exportar PDF.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12">
      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
              Laudo Ultrassonográfico — {patient.name}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{patient.species === 'canis' ? 'Cão' : 'Gato'}</Badge>
              {!webhookConfigured && (
                <Badge variant="secondary" className="text-xs">Voz indisponível</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Reproductive status */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Status Reprodutivo *
            </label>
            <Select value={reproductiveStatus} onValueChange={(v) => setReproductiveStatus(v as UltrasoundSex)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Fêmea inteira</SelectItem>
                <SelectItem value="female_castrated">Fêmea castrada (OVH)</SelectItem>
                <SelectItem value="male">Macho inteiro</SelectItem>
                <SelectItem value="male_castrated">Macho castrado (OQT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Equipment */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Aparelho
            </label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm w-full"
              style={{ borderColor: 'hsl(217,50%,85%)', fontFamily: 'Nunito Sans, sans-serif' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Organ sections */}
      <Accordion type="multiple" className="space-y-2">

        {/* BEXIGA */}
        <OrganSection organKey="bladder" title="Bexiga Urinária" status={organStatuses.bladder}
          notes={form.bladder_notes ?? ''} onNotesChange={(v) => setField('bladder_notes', v)}
          onMicClick={() => handleMicClick('bladder')}
          isRecordingThis={currentOrgan === 'bladder' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'bladder'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Parede" value={numStr(form.bladder_wall_cm)}
            onChange={(v) => setNumField('bladder_wall_cm', v)}
            refMin={patient.species === 'felis' ? (refs as typeof FELIS_REFS).bladder_wall_cm.min : null}
            refMax={(refs as any).bladder_wall_cm?.max ?? null} />
        </OrganSection>

        {/* RINS */}
        <OrganSection organKey="kidney" title="Rins" status={organStatuses.kidney}
          notes={form.kidney_notes ?? ''} onNotesChange={(v) => setField('kidney_notes', v)}
          onMicClick={() => handleMicClick('kidney')}
          isRecordingThis={currentOrgan === 'kidney' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'kidney'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Rim Esquerdo" value={numStr(form.kidney_left_cm)}
            onChange={(v) => setNumField('kidney_left_cm', v)}
            refMin={patient.species === 'felis' ? (refs as typeof FELIS_REFS).kidney_cm.min : null}
            refMax={patient.species === 'felis' ? (refs as typeof FELIS_REFS).kidney_cm.max : null} />
          <MeasurementField label="Rim Direito" value={numStr(form.kidney_right_cm)}
            onChange={(v) => setNumField('kidney_right_cm', v)}
            refMin={patient.species === 'felis' ? (refs as typeof FELIS_REFS).kidney_cm.min : null}
            refMax={patient.species === 'felis' ? (refs as typeof FELIS_REFS).kidney_cm.max : null} />
          <MeasurementField label="Pelve Renal Esq." value={numStr(form.kidney_pelvis_left_cm)}
            onChange={(v) => setNumField('kidney_pelvis_left_cm', v)} refMax={0.20} />
          <MeasurementField label="Pelve Renal Dir." value={numStr(form.kidney_pelvis_right_cm)}
            onChange={(v) => setNumField('kidney_pelvis_right_cm', v)} refMax={0.20} />
        </OrganSection>

        {/* FÍGADO */}
        <OrganSection organKey="liver" title="Fígado" status={organStatuses.liver}
          notes={form.liver_notes ?? ''} onNotesChange={(v) => setField('liver_notes', v)}
          onMicClick={() => handleMicClick('liver')}
          isRecordingThis={currentOrgan === 'liver' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'liver'}
          micDisabled={!webhookConfigured}>
          {/* Notes-only organ — no numeric fields */}
        </OrganSection>

        {/* VESÍCULA BILIAR */}
        <OrganSection organKey="gallbladder" title="Vesícula Biliar" status={organStatuses.gallbladder}
          notes={form.gallbladder_notes ?? ''} onNotesChange={(v) => setField('gallbladder_notes', v)}
          onMicClick={() => handleMicClick('gallbladder')}
          isRecordingThis={currentOrgan === 'gallbladder' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'gallbladder'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Parede" value={numStr(form.gallbladder_wall_cm)}
            onChange={(v) => setNumField('gallbladder_wall_cm', v)} />
          <MeasurementField label="Ducto" value={numStr(form.gallbladder_duct_cm)}
            onChange={(v) => setNumField('gallbladder_duct_cm', v)}
            refMax={patient.species === 'felis' ? 0.40 : null} />
        </OrganSection>

        {/* ESTÔMAGO */}
        <OrganSection organKey="stomach" title="Estômago" status={organStatuses.stomach}
          notes={form.stomach_notes ?? ''} onNotesChange={(v) => setField('stomach_notes', v)}
          onMicClick={() => handleMicClick('stomach')}
          isRecordingThis={currentOrgan === 'stomach' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'stomach'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Parede"
            value={numStr(form.stomach_wall_cm)}
            onChange={(v) => setNumField('stomach_wall_cm', v)}
            refMin={patient.species === 'felis' ? 0.11 : null}
            refMax={patient.species === 'canis' ? 0.50 : 0.36} />
          <div>
            <label className="text-xs font-medium block mb-1"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Região avaliada
            </label>
            <input type="text" placeholder="ex: região antral"
              value={form.stomach_region ?? ''} onChange={(e) => setField('stomach_region', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'hsl(217,50%,85%)', fontFamily: 'Nunito Sans, sans-serif' }} />
          </div>
        </OrganSection>

        {/* TRATO INTESTINAL */}
        <OrganSection organKey="intestine" title="Trato Intestinal" status={organStatuses.intestine}
          notes={form.intestine_notes ?? ''} onNotesChange={(v) => setField('intestine_notes', v)}
          onMicClick={() => handleMicClick('intestine')}
          isRecordingThis={currentOrgan === 'intestine' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'intestine'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Duodeno" value={numStr(form.intestine_duodenum_cm)}
            onChange={(v) => setNumField('intestine_duodenum_cm', v)}
            refMax={patient.species === 'canis' ? 0.50 : 0.22} />
          <MeasurementField label="Jejuno" value={numStr(form.intestine_jejunum_cm)}
            onChange={(v) => setNumField('intestine_jejunum_cm', v)}
            refMax={patient.species === 'canis' ? 0.30 : 0.22} />
          <MeasurementField label="Íleo" value={numStr(form.intestine_ileum_cm)}
            onChange={(v) => setNumField('intestine_ileum_cm', v)}
            refMin={patient.species === 'felis' ? 0.17 : null}
            refMax={patient.species === 'canis' ? 0.50 : 0.23} />
          <MeasurementField label="Cólon" value={numStr(form.intestine_colon_cm)}
            onChange={(v) => setNumField('intestine_colon_cm', v)}
            refMin={patient.species === 'felis' ? 0.10 : null}
            refMax={patient.species === 'canis' ? 0.15 : 0.25} />
        </OrganSection>

        {/* BAÇO */}
        <OrganSection organKey="spleen" title="Baço" status={organStatuses.spleen}
          notes={form.spleen_notes ?? ''} onNotesChange={(v) => setField('spleen_notes', v)}
          onMicClick={() => handleMicClick('spleen')}
          isRecordingThis={currentOrgan === 'spleen' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'spleen'}
          micDisabled={!webhookConfigured}>
          {/* Notes-only organ */}
        </OrganSection>

        {/* PÂNCREAS */}
        <OrganSection organKey="pancreas" title="Pâncreas" status={organStatuses.pancreas}
          notes={form.pancreas_notes ?? ''} onNotesChange={(v) => setField('pancreas_notes', v)}
          onMicClick={() => handleMicClick('pancreas')}
          isRecordingThis={currentOrgan === 'pancreas' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'pancreas'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Lobo Direito" value={numStr(form.pancreas_right_lobe_cm)}
            onChange={(v) => setNumField('pancreas_right_lobe_cm', v)}
            refMax={patient.species === 'felis' ? 0.60 : null} />
          <MeasurementField label="Lobo Esquerdo" value={numStr(form.pancreas_left_lobe_cm)}
            onChange={(v) => setNumField('pancreas_left_lobe_cm', v)}
            refMax={patient.species === 'felis' ? 0.90 : null} />
          <MeasurementField label="Ducto Pancreático" value={numStr(form.pancreas_duct_cm)}
            onChange={(v) => setNumField('pancreas_duct_cm', v)}
            refMax={pancDuctRef?.max ?? null}
            placeholder={pancDuctPlaceholder} />
        </OrganSection>

        {/* ADRENAIS */}
        <OrganSection organKey="adrenal" title="Glândulas Adrenais" status={organStatuses.adrenal}
          notes={form.adrenal_notes ?? ''} onNotesChange={(v) => setField('adrenal_notes', v)}
          onMicClick={() => handleMicClick('adrenal')}
          isRecordingThis={currentOrgan === 'adrenal' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'adrenal'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Adrenal Esquerda (GAE)" value={numStr(form.adrenal_left_cm)}
            onChange={(v) => setNumField('adrenal_left_cm', v)}
            refMin={adrenalLeft?.min ?? null} refMax={adrenalLeft?.max ?? null} />
          <MeasurementField label="Adrenal Direita (GAD)" value={numStr(form.adrenal_right_cm)}
            onChange={(v) => setNumField('adrenal_right_cm', v)}
            refMin={adrenalRight?.min ?? null} refMax={adrenalRight?.max ?? null} />
        </OrganSection>

        {/* REPRODUTIVO — conditional */}
        {reproductiveStatus === 'female' && (
          <OrganSection organKey="reproductive" title="Reprodutivo — Fêmea" status={organStatuses.reproductive}
            notes={form.uterus_notes ?? ''} onNotesChange={(v) => setField('uterus_notes', v)}
            onMicClick={() => handleMicClick('reproductive')}
            isRecordingThis={currentOrgan === 'reproductive' && isRecording}
            isProcessing={isProcessing && currentOrgan === 'reproductive'}
            micDisabled={!webhookConfigured}>
            <MeasurementField label="Ovário Esq. — dim 1" value={numStr(form.ovary_left_cm1)} onChange={(v) => setNumField('ovary_left_cm1', v)} />
            <MeasurementField label="Ovário Esq. — dim 2" value={numStr(form.ovary_left_cm2)} onChange={(v) => setNumField('ovary_left_cm2', v)} />
            <MeasurementField label="Ovário Dir. — dim 1" value={numStr(form.ovary_right_cm1)} onChange={(v) => setNumField('ovary_right_cm1', v)} />
            <MeasurementField label="Ovário Dir. — dim 2" value={numStr(form.ovary_right_cm2)} onChange={(v) => setNumField('ovary_right_cm2', v)} />
          </OrganSection>
        )}

        {(reproductiveStatus === 'female_castrated') && (
          <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500 bg-slate-50"
            style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
            Útero e ovários não caracterizados — paciente ovariohisterectomizada.
          </div>
        )}

        {reproductiveStatus === 'male' && (
          <OrganSection organKey="reproductive" title="Reprodutivo — Macho" status={organStatuses.reproductive}
            notes="" onNotesChange={() => {}}
            onMicClick={() => handleMicClick('reproductive')}
            isRecordingThis={currentOrgan === 'reproductive' && isRecording}
            isProcessing={isProcessing && currentOrgan === 'reproductive'}
            micDisabled={!webhookConfigured}>
            <MeasurementField label="Próstata — Comprimento" value={numStr(form.prostate_length_cm)} onChange={(v) => setNumField('prostate_length_cm', v)} />
            <MeasurementField label="Próstata — Altura" value={numStr(form.prostate_height_cm)} onChange={(v) => setNumField('prostate_height_cm', v)} />
            <MeasurementField label="Próstata — Largura" value={numStr(form.prostate_width_cm)} onChange={(v) => setNumField('prostate_width_cm', v)} />
            <MeasurementField label="Testículo Esq. — dim 1" value={numStr(form.testis_left_cm1)} onChange={(v) => setNumField('testis_left_cm1', v)} />
            <MeasurementField label="Testículo Esq. — dim 2" value={numStr(form.testis_left_cm2)} onChange={(v) => setNumField('testis_left_cm2', v)} />
            <MeasurementField label="Testículo Dir. — dim 1" value={numStr(form.testis_right_cm1)} onChange={(v) => setNumField('testis_right_cm1', v)} />
            <MeasurementField label="Testículo Dir. — dim 2" value={numStr(form.testis_right_cm2)} onChange={(v) => setNumField('testis_right_cm2', v)} />
          </OrganSection>
        )}

        {reproductiveStatus === 'male_castrated' && (
          <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500 bg-slate-50"
            style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
            Testículos ausentes — paciente orquiectomizado.
          </div>
        )}
      </Accordion>

      {/* Impressão diagnóstica */}
      <Card>
        <CardContent className="pt-4">
          <label className="text-xs font-semibold uppercase tracking-wide block mb-2"
            style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
            Impressão Diagnóstica
          </label>
          <Textarea
            value={diagnosticImpression}
            onChange={(e) => setDiagnosticImpression(e.target.value)}
            placeholder="Conclusão clínica do exame..."
            rows={4}
            style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button variant="outline" onClick={handleExportPdf}>
          <Printer className="w-4 h-4 mr-1.5" />
          Exportar PDF
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Salvando...</>
          ) : (
            <><FileText className="w-4 h-4 mr-1.5" />Gerar e Salvar Laudo</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UltrasoundForm;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ultrasound/UltrasoundForm.tsx
git commit -m "feat(ultrasound): add UltrasoundForm with all organ sections, voice input and PDF export"
```

---

### Task 9: UltrasoundPage

**Files:**
- Create: `src/pages/UltrasoundPage.tsx`

- [ ] **Step 1: Write failing test for `parseAgeYears`**

```typescript
// src/tests/ultrasoundPage.test.ts
import { describe, it, expect } from 'vitest';
import { parseAgeYears } from '../pages/UltrasoundPage';

describe('parseAgeYears', () => {
  it('parses integer years', () => expect(parseAgeYears('3 anos')).toBe(3));
  it('parses "6 meses" as 0.5', () => expect(parseAgeYears('6 meses')).toBeCloseTo(0.5));
  it('parses bare number as years', () => expect(parseAgeYears('2')).toBe(2));
  it('returns null for "adulto"', () => expect(parseAgeYears('adulto')).toBeNull());
  it('returns null for null input', () => expect(parseAgeYears(null)).toBeNull());
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/tests/ultrasoundPage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create page**

```tsx
// src/pages/UltrasoundPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { UltrasoundSex, UltrasoundSpecies } from '@/types/ultrasound';
import UltrasoundForm from '@/components/ultrasound/UltrasoundForm';

// ── Species mapping ──────────────────────────────────────────────────────────

const SPECIES_MAP: Record<string, UltrasoundSpecies> = {
  canina: 'canis',
  felina: 'felis',
};

// ── Sex pre-fill mapping ─────────────────────────────────────────────────────

const SEX_MAP: Record<string, UltrasoundSex> = {
  macho: 'male',
  femea: 'female',
};

// ── Age parsing ──────────────────────────────────────────────────────────────

export function parseAgeYears(age: string | null): number | null {
  if (!age) return null;
  const match = age.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(',', '.'));
  if (isNaN(num)) return null;
  const isMeses = /mes(es)?/i.test(age);
  return isMeses ? num / 12 : num;
}

// ── Page component ───────────────────────────────────────────────────────────

const UltrasoundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('patients')
        .select('id, name, species, sex, weight, age, owner_name')
        .eq('id', id)
        .maybeSingle();

      if (dbError || !data) {
        setError('Paciente não encontrado.');
        setLoading(false);
        return;
      }

      const mappedSpecies = SPECIES_MAP[data.species?.toLowerCase() ?? ''];
      if (!mappedSpecies) {
        setError(`Espécie "${data.species}" não suportada para laudo ultrassonográfico.`);
        setLoading(false);
        return;
      }

      setPatient({
        id: data.id,
        name: data.name ?? '',
        species: mappedSpecies,
        owner_name: data.owner_name ?? '',
        age: data.age ?? null,
        weight: data.weight ?? null,
        initialSex: SEX_MAP[data.sex?.toLowerCase() ?? ''] ?? '',
        ageYears: parseAgeYears(data.age),
      });
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground text-center max-w-sm">{error ?? 'Erro desconhecido.'}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
          Novo Laudo Ultrassonográfico
        </h1>
      </div>
      <UltrasoundForm patient={patient} />
    </div>
  );
};

export default UltrasoundPage;
```

- [ ] **Step 4: Run age tests — must all pass**

```bash
npx vitest run src/tests/ultrasoundPage.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/UltrasoundPage.tsx src/tests/ultrasoundPage.test.ts
git commit -m "feat(ultrasound): add UltrasoundPage with species/sex/age mapping"
```

---

### Task 10: Route + PatientProfile button

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/pets/PatientProfile.tsx`

- [ ] **Step 1: Add route in App.tsx**

In [src/App.tsx](src/App.tsx), find the block `<Route path="/anamnese/:patientId"` and add the new route immediately after it (before the `/perfil` route):

```tsx
import UltrasoundPage from './pages/UltrasoundPage';

// Inside <Routes>:
<Route
  path="/patient/:id/ultrasound"
  element={
    <ProtectedRoute>
      <MainLayout>
        <UltrasoundPage />
      </MainLayout>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: Add "Novo Laudo US" button in PatientProfile header**

In [src/components/pets/PatientProfile.tsx](src/components/pets/PatientProfile.tsx), find the header action buttons section (around line 524, where "Nova Anamnese" button is). Add the button before "Nova Anamnese":

```tsx
import { Scan } from 'lucide-react'; // add to existing import

// In the header actions div:
<Button variant="outline" onClick={() => navigate(`/patient/${id}/ultrasound`)}>
  <Scan className="h-4 w-4 mr-1.5" />
  Novo Laudo US
</Button>
```

- [ ] **Step 3: Verify the app compiles**

```bash
npm run build 2>&1 | head -30
```

Expected: build completes without TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/pets/PatientProfile.tsx
git commit -m "feat(ultrasound): add route and Novo Laudo US button in PatientProfile"
```

---

### Task 11: "Laudos US" history tab in PatientProfile

**Files:**
- Modify: `src/components/pets/PatientProfile.tsx`

- [ ] **Step 1: Add the UltrasoundHistoryTab component and tab trigger**

In [src/components/pets/PatientProfile.tsx](src/components/pets/PatientProfile.tsx):

1. Add a top-level import at the top of `PatientProfile.tsx` (alongside existing imports):

```tsx
import { buildPrintableHtml } from '@/lib/ultrasoundReportGenerator';
```

2. Add a new internal component `UltrasoundHistoryTab` before the `PatientProfile` main component:

```tsx
const UltrasoundHistoryTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ultrasound_reports')
        .select('id, created_at, species, sex, generated_report')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (!error && data) setReports(data);
      setLoading(false);
    };
    fetch();
  }, [patientId]);

  const SEX_LABEL: Record<string, string> = {
    female: 'Fêmea inteira', female_castrated: 'Fêmea castrada',
    male: 'Macho inteiro', male_castrated: 'Macho castrado',
  };

  const handleViewPdf = (report: any) => {
    if (!report.generated_report) return;
    const html = buildPrintableHtml(report.generated_report, { name: '', species: report.species, owner_name: '', age: null }, new Date(report.created_at).toLocaleDateString('pt-BR'));
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  if (loading) return <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>;

  if (reports.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground mb-4">Nenhum laudo ultrassonográfico registrado.</p>
      <Button variant="outline" onClick={() => navigate(`/patient/${patientId}/ultrasound`)}>
        Criar Laudo US
      </Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <Card key={r.id} className="border-l-4 border-l-primary/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{r.species === 'canis' ? 'Cão' : 'Gato'} — {SEX_LABEL[r.sex] ?? r.sex}</p>
              <p className="text-xs text-muted-foreground">
                {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleViewPdf(r)} disabled={!r.generated_report}>
              Ver PDF
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
```

2. Add the tab trigger in `<TabsList>`:

```tsx
<TabsTrigger value="ultrasound" className="gap-1.5">
  <Scan className="h-4 w-4" />
  Laudos US
</TabsTrigger>
```

3. Add the tab content:

```tsx
<TabsContent value="ultrasound">
  <UltrasoundHistoryTab patientId={id} />
</TabsContent>
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -30
```

- [ ] **Step 4: Run all tests**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/pets/PatientProfile.tsx
git commit -m "feat(ultrasound): add Laudos US tab in PatientProfile with PDF viewer"
```

---

### Task 12: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: all tests pass. No regressions.

- [ ] **Step 2: Manual smoke test checklist**

Open the app in the browser and verify:

- [ ] `/patient/:id` shows "Novo Laudo US" button in the header
- [ ] Clicking "Novo Laudo US" navigates to `/patient/:id/ultrasound`
- [ ] Unsupported species shows an error message
- [ ] "Status Reprodutivo" is pre-selected for dogs/cats with known sex; blank for unknown
- [ ] All 4 reproductive options available in the Select
- [ ] Organ sections expand/collapse
- [ ] Entering a value outside reference range shows yellow border and ↑/↓ message
- [ ] Adrenal fields: no reference indicator when weight is unknown
- [ ] Clicking "Gerar e Salvar Laudo" without reproductive status shows inline error
- [ ] Successful save shows success toast
- [ ] "Exportar PDF" opens a print dialog with correct patient data
- [ ] Mic buttons show tooltip "Transcrição por voz não configurada" when env var is empty
- [ ] "Laudos US" tab in patient profile lists saved reports with "Ver PDF" button

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat(ultrasound): complete ultrasound report module — all tasks done"
```
