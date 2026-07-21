# Patient History Extended Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 9 new clinical history fields to `patients` (deworming, continuous medications, surgeries, reproductive status, blood type/transfusions, infectious diseases, drug restrictions) plus a per-consultation Body Condition Score (ECC) on `medical_consultations`, expose them all in `PatientMedicalHistory.tsx`, and inject the clinically-critical subset into the n8n/OpenAI SOAP payload.

**Architecture:** Two additive Supabase migrations (one on `patients`, one on `medical_consultations`), extended `src/lib/medicalHistory.ts` fetch/save/serialize functions, new UI sections in `PatientMedicalHistory.tsx` following its existing vaccine-list pattern, ECC wired through `SOAPCard.tsx`/`GuidedConsultation.tsx` alongside the existing weight/temperature vitals, and 4 new optional fields on `buildTruncatedPayload` in `anamnesisApi.ts`.

**Tech Stack:** React + TypeScript, Supabase (Postgres/JSONB), Vitest + Testing Library, shadcn/ui (`Select`, `Input`, `Textarea`, `Button`).

## Global Constraints

- Do not break the existing test suite — baseline measured at 247/247 passing (`npx vitest run`) before this work started.
- `body_condition_score` lives on `medical_consultations`, never on `patients` (corrected from the original ticket's migration draft — see spec's "Decisions made during brainstorming" §1).
- `deworming` and `surgeries` are stored/editable but **never** serialized into the n8n payload — only `continuous_medications`, `drug_restrictions`, `reproductive_status`, `infectious_diseases` are critical per the ticket.
- `reproductive_status` values are literal PT strings: `'Inteiro' | 'Castrado' | ''`.
- Infectious disease `status` is constrained to `'Positivo' | 'Negativo' | 'Não testado' | ''`; `disease` and `method` are free text.
- All new free-text payload fields are truncated to 300 chars, matching the existing `allergies`/`previousDiseases` pattern.
- Spec: `docs/superpowers/specs/2026-07-21-patient-history-extended-design.md`

---

### Task 1: Migration — extended clinical fields on `patients`

**Files:**
- Create: `supabase/migrations/20260721000001_add_patient_history_extended_fields.sql`

**Interfaces:**
- Produces: 9 new nullable/JSONB-default columns on `public.patients`, consumed by Task 3's `fetchMedicalHistory`/`saveMedicalHistory`.

- [ ] **Step 1: Create the migration file**

```sql
-- Extended clinical history fields for patients, flagged by the founding vet as missing.
-- JSONB array items use camelCase keys (matches the TS types in src/lib/medicalHistory.ts) —
-- this is an app-owned blob with no other consumers, so we skip a snake_case mapping layer:
-- deworming: [{ date, activeIngredient, weightKg }]
-- continuous_medications: [{ name, dose, frequency, indication }]
-- surgeries: [{ date, procedure, anesthesiaReaction }]
-- infectious_diseases: [{ disease, status, testDate, method }]

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS deworming JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS continuous_medications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS surgeries JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reproductive_status TEXT,
  ADD COLUMN IF NOT EXISTS reproductive_date DATE,
  ADD COLUMN IF NOT EXISTS blood_type TEXT,
  ADD COLUMN IF NOT EXISTS transfusion_history TEXT,
  ADD COLUMN IF NOT EXISTS infectious_diseases JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS drug_restrictions TEXT;
```

- [ ] **Step 2: Verify the file**

Run: `cat supabase/migrations/20260721000001_add_patient_history_extended_fields.sql`
Expected: exact SQL from Step 1, no typos in column names (they must match Task 3's `.select()`/`.update()` calls verbatim).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260721000001_add_patient_history_extended_fields.sql
git commit -m "feat(db): add extended clinical history columns to patients"
```

---

### Task 2: Migration — Body Condition Score on `medical_consultations`

**Files:**
- Create: `supabase/migrations/20260721000002_add_body_condition_score_to_consultations.sql`

**Interfaces:**
- Produces: `body_condition_score SMALLINT` column on `public.medical_consultations`, consumed by Task 7 (`SOAPCard.tsx`) and Task 8 (`GuidedConsultation.tsx`).

- [ ] **Step 1: Create the migration file**

```sql
-- Body Condition Score (ECC), 1-9 scale, recorded per consultation alongside
-- weight_kg/temperature_c (see 20260320000001_add_vital_signs_to_consultations.sql) —
-- NOT on patients, since it changes at every visit rather than describing the patient.

ALTER TABLE public.medical_consultations
  ADD COLUMN IF NOT EXISTS body_condition_score SMALLINT;
```

- [ ] **Step 2: Verify the file**

Run: `cat supabase/migrations/20260721000002_add_body_condition_score_to_consultations.sql`
Expected: exact SQL from Step 1.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260721000002_add_body_condition_score_to_consultations.sql
git commit -m "feat(db): add body_condition_score to medical_consultations"
```

---

### Task 3: Extend `medicalHistory.ts` types + fetch/save

**Files:**
- Modify: `src/lib/medicalHistory.ts`
- Test: `src/tests/medicalHistory.test.ts`

**Interfaces:**
- Consumes: nothing new (extends existing `fetchMedicalHistory`/`saveMedicalHistory`/`MedicalHistory`).
- Produces: types `Deworming { date, activeIngredient, weightKg }`, `ContinuousMedication { name, dose, frequency, indication }`, `Surgery { date, procedure, anesthesiaReaction }`, `InfectiousDiseaseStatus = 'Positivo' | 'Negativo' | 'Não testado' | ''`, `InfectiousDisease { disease, status: InfectiousDiseaseStatus, testDate, method }`, `ReproductiveStatus = 'Inteiro' | 'Castrado' | ''`. `MedicalHistory` gains `deworming`, `continuousMedications`, `surgeries`, `reproductiveStatus`, `reproductiveDate`, `bloodType`, `transfusionHistory`, `infectiousDiseases`, `drugRestrictions`. Consumed by Task 5 (`PatientMedicalHistory.tsx`), Task 6 (`anamnesisApi.ts`/`ConsultationPage.tsx`).

- [ ] **Step 1: Write the failing tests**

Add to `src/tests/medicalHistory.test.ts`, replacing the existing import line with:

```ts
import {
  fetchMedicalHistory,
  saveMedicalHistory,
  serializeVaccines,
  type Vaccine,
} from '../lib/medicalHistory';
```

Append these two `describe` blocks after the existing `saveMedicalHistory` block (before `describe('serializeVaccines', ...)`):

```ts
describe('fetchMedicalHistory — campos estendidos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna os novos campos quando preenchidos', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({
        data: {
          allergies: null,
          previous_diseases: null,
          vaccines: null,
          deworming: [{ date: '2024-01-10', activeIngredient: 'Praziquantel', weightKg: '4.5' }],
          continuous_medications: [
            { name: 'Levotiroxina', dose: '0.1mg', frequency: '1x/dia', indication: 'Hipotireoidismo' },
          ],
          surgeries: [{ date: '2023-05-20', procedure: 'Ovariohisterectomia', anesthesiaReaction: 'Nenhuma' }],
          reproductive_status: 'Castrado',
          reproductive_date: '2023-05-20',
          blood_type: 'DEA 1.1 positivo',
          transfusion_history: 'Nenhuma transfusão prévia',
          infectious_diseases: [
            { disease: 'Leishmaniose', status: 'Negativo', testDate: '2024-02-01', method: 'ELISA' },
          ],
          drug_restrictions: 'MDR1/ABCB1 suspeito',
        },
        error: null,
      })
    );

    const result = await fetchMedicalHistory('pat-010');

    expect(result.deworming).toEqual([{ date: '2024-01-10', activeIngredient: 'Praziquantel', weightKg: '4.5' }]);
    expect(result.continuousMedications).toEqual([
      { name: 'Levotiroxina', dose: '0.1mg', frequency: '1x/dia', indication: 'Hipotireoidismo' },
    ]);
    expect(result.surgeries).toEqual([
      { date: '2023-05-20', procedure: 'Ovariohisterectomia', anesthesiaReaction: 'Nenhuma' },
    ]);
    expect(result.reproductiveStatus).toBe('Castrado');
    expect(result.reproductiveDate).toBe('2023-05-20');
    expect(result.bloodType).toBe('DEA 1.1 positivo');
    expect(result.transfusionHistory).toBe('Nenhuma transfusão prévia');
    expect(result.infectiousDiseases).toEqual([
      { disease: 'Leishmaniose', status: 'Negativo', testDate: '2024-02-01', method: 'ELISA' },
    ]);
    expect(result.drugRestrictions).toBe('MDR1/ABCB1 suspeito');
  });

  it('retorna defaults quando os novos campos são null', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({
        data: {
          allergies: null,
          previous_diseases: null,
          vaccines: null,
          deworming: null,
          continuous_medications: null,
          surgeries: null,
          reproductive_status: null,
          reproductive_date: null,
          blood_type: null,
          transfusion_history: null,
          infectious_diseases: null,
          drug_restrictions: null,
        },
        error: null,
      })
    );

    const result = await fetchMedicalHistory('pat-011');

    expect(result.deworming).toEqual([]);
    expect(result.continuousMedications).toEqual([]);
    expect(result.surgeries).toEqual([]);
    expect(result.reproductiveStatus).toBe('');
    expect(result.reproductiveDate).toBe('');
    expect(result.bloodType).toBe('');
    expect(result.transfusionHistory).toBe('');
    expect(result.infectiousDiseases).toEqual([]);
    expect(result.drugRestrictions).toBe('');
  });
});

describe('saveMedicalHistory — campos estendidos', () => {
  beforeEach(() => vi.clearAllMocks());

  const fullHistory = {
    allergies: '',
    previousDiseases: '',
    vaccines: [],
    deworming: [{ date: '2024-01-10', activeIngredient: 'Praziquantel', weightKg: '4.5' }],
    continuousMedications: [
      { name: 'Levotiroxina', dose: '0.1mg', frequency: '1x/dia', indication: 'Hipotireoidismo' },
    ],
    surgeries: [{ date: '2023-05-20', procedure: 'Ovariohisterectomia', anesthesiaReaction: 'Nenhuma' }],
    reproductiveStatus: 'Castrado' as const,
    reproductiveDate: '2023-05-20',
    bloodType: 'DEA 1.1 positivo',
    transfusionHistory: '',
    infectiousDiseases: [
      { disease: 'Leishmaniose', status: 'Negativo' as const, testDate: '2024-02-01', method: 'ELISA' },
    ],
    drugRestrictions: 'MDR1/ABCB1 suspeito',
  };

  it('envia os novos campos JSONB e de texto corretamente', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);

    await saveMedicalHistory('pat-012', fullHistory);

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        deworming: fullHistory.deworming,
        continuous_medications: fullHistory.continuousMedications,
        surgeries: fullHistory.surgeries,
        reproductive_status: 'Castrado',
        reproductive_date: '2023-05-20',
        blood_type: 'DEA 1.1 positivo',
        transfusion_history: null,
        infectious_diseases: fullHistory.infectiousDiseases,
        drug_restrictions: 'MDR1/ABCB1 suspeito',
      })
    );
  });

  it('envia campos de texto opcionais como null quando vazios', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);

    await saveMedicalHistory('pat-013', {
      ...fullHistory,
      reproductiveStatus: '',
      reproductiveDate: '',
      bloodType: '',
      drugRestrictions: '',
    });

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        reproductive_status: null,
        reproductive_date: null,
        blood_type: null,
        drug_restrictions: null,
      })
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/medicalHistory.test.ts`
Expected: FAIL — `fetchMedicalHistory`/`saveMedicalHistory` don't read/write the new columns yet, so `result.deworming` etc. are `undefined`.

- [ ] **Step 3: Replace `src/lib/medicalHistory.ts` with the extended implementation**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/medicalHistory.test.ts`
Expected: PASS (all `fetchMedicalHistory`/`saveMedicalHistory` tests, old and new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/medicalHistory.ts src/tests/medicalHistory.test.ts
git commit -m "feat(lib): extend medicalHistory fetch/save with 9 new clinical fields"
```

---

### Task 4: Add `serializeContinuousMedications`/`serializeInfectiousDiseases` to `medicalHistory.ts`

**Files:**
- Modify: `src/lib/medicalHistory.ts`
- Test: `src/tests/medicalHistory.test.ts`

**Interfaces:**
- Consumes: `ContinuousMedication`, `InfectiousDisease` types from Task 3.
- Produces: `serializeContinuousMedications(medications: ContinuousMedication[]): string`, `serializeInfectiousDiseases(diseases: InfectiousDisease[]): string`. Consumed by Task 6 (`buildTruncatedPayload`).

- [ ] **Step 1: Write the failing tests**

Update the import at the top of `src/tests/medicalHistory.test.ts` to:

```ts
import {
  fetchMedicalHistory,
  saveMedicalHistory,
  serializeVaccines,
  serializeContinuousMedications,
  serializeInfectiousDiseases,
  type Vaccine,
} from '../lib/medicalHistory';
```

Append at the end of the file:

```ts
describe('serializeContinuousMedications', () => {
  it('retorna string vazia para array vazio', () => {
    expect(serializeContinuousMedications([])).toBe('');
  });

  it('serializa nome, dose, frequência e indicação', () => {
    expect(
      serializeContinuousMedications([
        { name: 'Enrofloxacino', dose: '10mg', frequency: '2x/dia', indication: 'Piometra' },
      ])
    ).toBe('Enrofloxacino 10mg 2x/dia (Piometra)');
  });

  it('omite indicação quando vazia', () => {
    expect(
      serializeContinuousMedications([
        { name: 'Levotiroxina', dose: '0.1mg', frequency: '1x/dia', indication: '' },
      ])
    ).toBe('Levotiroxina 0.1mg 1x/dia');
  });

  it('omite medicamentos com nome vazio', () => {
    expect(
      serializeContinuousMedications([
        { name: '', dose: '10mg', frequency: '2x/dia', indication: '' },
        { name: 'Enrofloxacino', dose: '10mg', frequency: '2x/dia', indication: 'Piometra' },
      ])
    ).toBe('Enrofloxacino 10mg 2x/dia (Piometra)');
  });

  it('serializa múltiplos medicamentos separados por vírgula', () => {
    expect(
      serializeContinuousMedications([
        { name: 'Enrofloxacino', dose: '10mg', frequency: '2x/dia', indication: 'Piometra' },
        { name: 'Levotiroxina', dose: '0.1mg', frequency: '1x/dia', indication: '' },
      ])
    ).toBe('Enrofloxacino 10mg 2x/dia (Piometra), Levotiroxina 0.1mg 1x/dia');
  });
});

describe('serializeInfectiousDiseases', () => {
  it('retorna string vazia para array vazio', () => {
    expect(serializeInfectiousDiseases([])).toBe('');
  });

  it('serializa doença, status, método e data do teste', () => {
    expect(
      serializeInfectiousDiseases([
        { disease: 'Leishmaniose', status: 'Positivo', testDate: '2024-03-15', method: 'ELISA' },
      ])
    ).toBe('Leishmaniose: Positivo (ELISA, 15/03/2024)');
  });

  it('omite parênteses quando método e data ausentes', () => {
    expect(
      serializeInfectiousDiseases([{ disease: 'FIV', status: 'Negativo', testDate: '', method: '' }])
    ).toBe('FIV: Negativo');
  });

  it('omite doenças com nome vazio', () => {
    expect(
      serializeInfectiousDiseases([
        { disease: '', status: 'Positivo', testDate: '', method: '' },
        { disease: 'FeLV', status: 'Não testado', testDate: '', method: '' },
      ])
    ).toBe('FeLV: Não testado');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/medicalHistory.test.ts`
Expected: FAIL — `serializeContinuousMedications is not a function` / `serializeInfectiousDiseases is not a function`.

- [ ] **Step 3: Append the serializers to `src/lib/medicalHistory.ts`**

Add after `serializeVaccines`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/medicalHistory.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
git add src/lib/medicalHistory.ts src/tests/medicalHistory.test.ts
git commit -m "feat(lib): add serializers for continuous medications and infectious diseases"
```

---

### Task 5: Extend `PatientMedicalHistory.tsx` with the 7 new UI sections

**Files:**
- Modify: `src/components/patient/PatientMedicalHistory.tsx`

**Interfaces:**
- Consumes: `Deworming`, `ContinuousMedication`, `Surgery`, `ReproductiveStatus`, `InfectiousDisease` types and the extended `fetchMedicalHistory`/`saveMedicalHistory` from Task 3.
- Produces: no new exports — this is a leaf UI component. No dedicated test file exists for this component today (consistent with the pre-existing file); verification is type-check + full suite green.

- [ ] **Step 1: Replace the full file**

```tsx
import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Loader2, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  fetchMedicalHistory,
  saveMedicalHistory,
  type Vaccine,
  type Deworming,
  type ContinuousMedication,
  type Surgery,
  type ReproductiveStatus,
  type InfectiousDisease,
} from '@/lib/medicalHistory';

interface Props {
  patientId: string;
}

const SECTION_LABEL_STYLE = { color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' } as const;
const SECTION_INPUT_STYLE = { borderColor: 'hsl(217,50%,85%)', fontFamily: 'Nunito Sans, sans-serif' } as const;

const PatientMedicalHistory: React.FC<Props> = ({ patientId }) => {
  const { toast } = useToast();
  const [allergies, setAllergies] = useState('');
  const [previousDiseases, setPreviousDiseases] = useState('');
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [deworming, setDeworming] = useState<Deworming[]>([]);
  const [continuousMedications, setContinuousMedications] = useState<ContinuousMedication[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [reproductiveStatus, setReproductiveStatus] = useState<ReproductiveStatus>('');
  const [reproductiveDate, setReproductiveDate] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [transfusionHistory, setTransfusionHistory] = useState('');
  const [infectiousDiseases, setInfectiousDiseases] = useState<InfectiousDisease[]>([]);
  const [drugRestrictions, setDrugRestrictions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    setIsLoading(true);
    fetchMedicalHistory(patientId)
      .then((data) => {
        setAllergies(data.allergies);
        setPreviousDiseases(data.previousDiseases);
        setVaccines(data.vaccines);
        setDeworming(data.deworming);
        setContinuousMedications(data.continuousMedications);
        setSurgeries(data.surgeries);
        setReproductiveStatus(data.reproductiveStatus);
        setReproductiveDate(data.reproductiveDate);
        setBloodType(data.bloodType);
        setTransfusionHistory(data.transfusionHistory);
        setInfectiousDiseases(data.infectiousDiseases);
        setDrugRestrictions(data.drugRestrictions);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const addVaccine = () => {
    setVaccines((prev) => [...prev, { name: '', date: '' }]);
  };

  const removeVaccine = (index: number) => {
    setVaccines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVaccine = (index: number, field: keyof Vaccine, value: string) => {
    setVaccines((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addDeworming = () => {
    setDeworming((prev) => [...prev, { date: '', activeIngredient: '', weightKg: '' }]);
  };

  const removeDeworming = (index: number) => {
    setDeworming((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDeworming = (index: number, field: keyof Deworming, value: string) => {
    setDeworming((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const addContinuousMedication = () => {
    setContinuousMedications((prev) => [...prev, { name: '', dose: '', frequency: '', indication: '' }]);
  };

  const removeContinuousMedication = (index: number) => {
    setContinuousMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const updateContinuousMedication = (
    index: number,
    field: keyof ContinuousMedication,
    value: string
  ) => {
    setContinuousMedications((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addSurgery = () => {
    setSurgeries((prev) => [...prev, { date: '', procedure: '', anesthesiaReaction: '' }]);
  };

  const removeSurgery = (index: number) => {
    setSurgeries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSurgery = (index: number, field: keyof Surgery, value: string) => {
    setSurgeries((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addInfectiousDisease = () => {
    setInfectiousDiseases((prev) => [...prev, { disease: '', status: '', testDate: '', method: '' }]);
  };

  const removeInfectiousDisease = (index: number) => {
    setInfectiousDiseases((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInfectiousDisease = (
    index: number,
    field: keyof InfectiousDisease,
    value: string
  ) => {
    setInfectiousDiseases((prev) =>
      prev.map((d, i) => (i === index ? ({ ...d, [field]: value } as InfectiousDisease) : d))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMedicalHistory(patientId, {
        allergies,
        previousDiseases,
        vaccines,
        deworming,
        continuousMedications,
        surgeries,
        reproductiveStatus,
        reproductiveDate,
        bloodType,
        transfusionHistory,
        infectiousDiseases,
        drugRestrictions,
      });
      toast({ title: 'Histórico salvo', description: 'Dados médicos atualizados com sucesso.' });
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'white',
        border: '1px solid hsl(217,50%,90%)',
        boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
      }}
    >
      {/* Stripe */}
      <div
        className="h-1"
        style={{ background: 'linear-gradient(90deg, hsl(221,73%,45%), hsl(217,88%,57%))' }}
      />

      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: 'hsl(217,50%,93%)' }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(18,76%,50%))' }}
        />
        <h2
          className="text-sm font-semibold"
          style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
        >
          Histórico Médico
        </h2>
      </div>

      <div className="p-5 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(221,73%,45%)' }} />
          </div>
        ) : (
          <>
            {/* Alergias */}
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Alergias conhecidas
              </label>
              <Textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={3}
                className="resize-y"
                placeholder="Ex: Dipirona, amendoim, látex..."
                style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
              />
            </div>

            {/* Doenças anteriores */}
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Doenças e condições anteriores
              </label>
              <Textarea
                value={previousDiseases}
                onChange={(e) => setPreviousDiseases(e.target.value)}
                rows={3}
                className="resize-y"
                placeholder="Ex: Cinomose (2022), fratura membro anterior (2023)..."
                style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
              />
            </div>

            {/* Vacinas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
                >
                  Carteira de vacinação
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVaccine}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {vaccines.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <Syringe className="h-6 w-6" style={{ color: 'hsl(221,73%,75%)' }} />
                  <p
                    className="text-xs"
                    style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}
                  >
                    Nenhuma vacina registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vaccines.map((vaccine, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Input
                        value={vaccine.name}
                        onChange={(e) => updateVaccine(index, 'name', e.target.value)}
                        placeholder="Nome da vacina"
                        className="h-9 text-sm flex-1 min-w-0"
                        style={{
                          borderColor: 'hsl(217,50%,85%)',
                          fontFamily: 'Nunito Sans, sans-serif',
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={vaccine.date}
                          onChange={(e) => updateVaccine(index, 'date', e.target.value)}
                          className="h-9 text-sm w-full sm:w-40"
                          style={{
                            borderColor: 'hsl(217,50%,85%)',
                            fontFamily: 'Nunito Sans, sans-serif',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeVaccine(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover vacina"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vermifugação e antiparasitários */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                  Vermifugação e antiparasitários
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDeworming}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {deworming.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                    Nenhuma vermifugação registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deworming.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateDeworming(index, 'date', e.target.value)}
                        className="h-9 text-sm w-full sm:w-40"
                        style={SECTION_INPUT_STYLE}
                      />
                      <Input
                        value={item.activeIngredient}
                        onChange={(e) => updateDeworming(index, 'activeIngredient', e.target.value)}
                        placeholder="Princípio ativo"
                        className="h-9 text-sm flex-1 min-w-0"
                        style={SECTION_INPUT_STYLE}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          value={item.weightKg}
                          onChange={(e) => updateDeworming(index, 'weightKg', e.target.value)}
                          placeholder="Peso (kg)"
                          className="h-9 text-sm w-full sm:w-28"
                          style={SECTION_INPUT_STYLE}
                        />
                        <button
                          type="button"
                          onClick={() => removeDeworming(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover vermifugação"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medicamentos em uso contínuo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                  Medicamentos em uso contínuo
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContinuousMedication}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {continuousMedications.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                    Nenhum medicamento contínuo registrado
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {continuousMedications.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 rounded-xl border"
                      style={{ borderColor: 'hsl(217,50%,90%)' }}
                    >
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) => updateContinuousMedication(index, 'name', e.target.value)}
                          placeholder="Nome do medicamento"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Input
                          value={item.dose}
                          onChange={(e) => updateContinuousMedication(index, 'dose', e.target.value)}
                          placeholder="Dose"
                          className="h-9 text-sm w-full sm:w-28"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Input
                          value={item.frequency}
                          onChange={(e) => updateContinuousMedication(index, 'frequency', e.target.value)}
                          placeholder="Frequência"
                          className="h-9 text-sm w-full sm:w-32"
                          style={SECTION_INPUT_STYLE}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={item.indication}
                          onChange={(e) => updateContinuousMedication(index, 'indication', e.target.value)}
                          placeholder="Indicação"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <button
                          type="button"
                          onClick={() => removeContinuousMedication(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover medicamento"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cirurgias e procedimentos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                  Cirurgias e procedimentos
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSurgery}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {surgeries.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                    Nenhuma cirurgia registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {surgeries.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 rounded-xl border"
                      style={{ borderColor: 'hsl(217,50%,90%)' }}
                    >
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateSurgery(index, 'date', e.target.value)}
                          className="h-9 text-sm w-full sm:w-40"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Input
                          value={item.procedure}
                          onChange={(e) => updateSurgery(index, 'procedure', e.target.value)}
                          placeholder="Procedimento"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={item.anesthesiaReaction}
                          onChange={(e) => updateSurgery(index, 'anesthesiaReaction', e.target.value)}
                          placeholder="Reação à anestesia (se houver)"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <button
                          type="button"
                          onClick={() => removeSurgery(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover cirurgia"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status reprodutivo */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                Status reprodutivo
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  value={reproductiveStatus || undefined}
                  onValueChange={(v) => setReproductiveStatus(v as ReproductiveStatus)}
                >
                  <SelectTrigger className="h-9 text-sm w-full sm:w-48" style={SECTION_INPUT_STYLE}>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inteiro">Inteiro</SelectItem>
                    <SelectItem value="Castrado">Castrado</SelectItem>
                  </SelectContent>
                </Select>
                {reproductiveStatus === 'Castrado' && (
                  <Input
                    type="date"
                    value={reproductiveDate}
                    onChange={(e) => setReproductiveDate(e.target.value)}
                    className="h-9 text-sm w-full sm:w-40"
                    style={SECTION_INPUT_STYLE}
                  />
                )}
              </div>
            </div>

            {/* Tipagem sanguínea e transfusões */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                Tipagem sanguínea
              </label>
              <Input
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                placeholder="Ex: DEA 1.1 positivo"
                className="h-9 text-sm w-full sm:w-48"
                style={SECTION_INPUT_STYLE}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                Histórico de transfusões
              </label>
              <Textarea
                value={transfusionHistory}
                onChange={(e) => setTransfusionHistory(e.target.value)}
                rows={2}
                className="resize-y"
                placeholder="Ex: Transfusão em 03/2023, sem intercorrências"
                style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
              />
            </div>

            {/* Doenças infectocontagiosas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                  Doenças infectocontagiosas
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInfectiousDisease}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {infectiousDiseases.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                    Nenhuma doença infectocontagiosa registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {infectiousDiseases.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 rounded-xl border"
                      style={{ borderColor: 'hsl(217,50%,90%)' }}
                    >
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={item.disease}
                          onChange={(e) => updateInfectiousDisease(index, 'disease', e.target.value)}
                          placeholder="Ex: Leishmaniose, FIV, FeLV..."
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Select
                          value={item.status || undefined}
                          onValueChange={(v) => updateInfectiousDisease(index, 'status', v)}
                        >
                          <SelectTrigger className="h-9 text-sm w-full sm:w-36" style={SECTION_INPUT_STYLE}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Positivo">Positivo</SelectItem>
                            <SelectItem value="Negativo">Negativo</SelectItem>
                            <SelectItem value="Não testado">Não testado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="date"
                          value={item.testDate}
                          onChange={(e) => updateInfectiousDisease(index, 'testDate', e.target.value)}
                          className="h-9 text-sm w-full sm:w-40"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Input
                          value={item.method}
                          onChange={(e) => updateInfectiousDisease(index, 'method', e.target.value)}
                          placeholder="Método (ex: ELISA, PCR)"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <button
                          type="button"
                          onClick={() => removeInfectiousDisease(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover doença"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Restrições a fármacos */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                Restrições, idiossincrasias e sensibilidades raciais
              </label>
              <Textarea
                value={drugRestrictions}
                onChange={(e) => setDrugRestrictions(e.target.value)}
                rows={2}
                className="resize-y"
                placeholder="Descreva restrições conhecidas..."
                style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
              />
              <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                Ex: MDR1/ABCB1 em raças pastoras
              </p>
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-1">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                style={{
                  background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                className="text-white gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar Histórico'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientMedicalHistory;
```

- [ ] **Step 2: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no TypeScript errors; all existing tests still pass (no test file targets this component directly).

- [ ] **Step 3: Commit**

```bash
git add src/components/patient/PatientMedicalHistory.tsx
git commit -m "feat(ui): add 7 new clinical history sections to PatientMedicalHistory"
```

---

### Task 6: Extend `buildTruncatedPayload` + wire `ConsultationPage.tsx`

**Files:**
- Modify: `src/lib/anamnesisApi.ts`
- Modify: `src/pages/ConsultationPage.tsx:53-57,109-120`
- Test: `src/tests/buildTruncatedPayload.test.ts`

**Interfaces:**
- Consumes: `ContinuousMedication`, `InfectiousDisease` types and `serializeContinuousMedications`/`serializeInfectiousDiseases` from Task 4; `MedicalHistory` from Task 3.
- Produces: `buildTruncatedPayload` params gain `continuousMedications?`, `drugRestrictions?`, `reproductiveStatus?`, `infectiousDiseases?`; `ExtendedAnamnesisPayload` gains `continuous_medications?`, `drug_restrictions?`, `reproductive_status?`, `infectious_diseases?`.

- [ ] **Step 1: Write the failing tests**

Append to `src/tests/buildTruncatedPayload.test.ts` (after the `medical history injection` describe block):

```ts
describe('extended medical history injection', () => {
  it('inclui continuous_medications serializado e truncado a 300 chars', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      continuousMedications: [
        { name: 'Enrofloxacino', dose: '10mg', frequency: '2x/dia', indication: 'Piometra' },
      ],
    });
    expect(result.continuous_medications).toBe('Enrofloxacino 10mg 2x/dia (Piometra)');
  });

  it('omite continuous_medications quando array vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, continuousMedications: [] });
    expect(result.continuous_medications).toBeUndefined();
  });

  it('trunca continuous_medications a 300 chars', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      continuousMedications: [{ name: 'A'.repeat(400), dose: '', frequency: '', indication: '' }],
    });
    expect(result.continuous_medications).toHaveLength(300);
  });

  it('inclui drug_restrictions quando preenchido, truncado a 300 chars', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      drugRestrictions: 'MDR1/ABCB1 em raças pastoras',
    });
    expect(result.drug_restrictions).toBe('MDR1/ABCB1 em raças pastoras');
  });

  it('omite drug_restrictions quando vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, drugRestrictions: '' });
    expect(result.drug_restrictions).toBeUndefined();
  });

  it('trunca drug_restrictions a 300 chars', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, drugRestrictions: 'A'.repeat(400) });
    expect(result.drug_restrictions).toHaveLength(300);
  });

  it('inclui reproductive_status quando preenchido', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, reproductiveStatus: 'Castrado' });
    expect(result.reproductive_status).toBe('Castrado');
  });

  it('omite reproductive_status quando vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, reproductiveStatus: '' });
    expect(result.reproductive_status).toBeUndefined();
  });

  it('inclui infectious_diseases serializado quando array não-vazio', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      infectiousDiseases: [
        { disease: 'Leishmaniose', status: 'Positivo', testDate: '2024-03-15', method: 'ELISA' },
      ],
    });
    expect(result.infectious_diseases).toBe('Leishmaniose: Positivo (ELISA, 15/03/2024)');
  });

  it('omite infectious_diseases quando array vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, infectiousDiseases: [] });
    expect(result.infectious_diseases).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/buildTruncatedPayload.test.ts`
Expected: FAIL — TypeScript errors first (`continuousMedications` etc. don't exist on the params type), then runtime `undefined` mismatches once types are loosened.

- [ ] **Step 3: Modify `src/lib/anamnesisApi.ts`**

Replace the import line at the top:

```ts
import {
  serializeVaccines,
  serializeContinuousMedications,
  serializeInfectiousDiseases,
  type Vaccine,
  type ContinuousMedication,
  type InfectiousDisease,
} from './medicalHistory';
```

Replace the `ExtendedAnamnesisPayload` interface:

```ts
export interface ExtendedAnamnesisPayload extends AnamnesisPayload {
  respostas_truncadas?: true; // flag literal: apenas presente (true) quando truncamento ocorreu; omitida caso contrário
  weight_kg?: number | null;
  temperature_c?: number | null;
  clinical_history?: string;
  allergies?: string;
  previous_diseases?: string;
  vaccines?: string;
  continuous_medications?: string;
  drug_restrictions?: string;
  reproductive_status?: string;
  infectious_diseases?: string;
}
```

In `buildTruncatedPayload`, extend the `params` type (add after `vaccines?: Vaccine[];`):

```ts
  continuousMedications?: ContinuousMedication[];
  drugRestrictions?: string;
  reproductiveStatus?: string;
  infectiousDiseases?: InfectiousDisease[];
```

And extend the body (add after `if (params.vaccines?.length) result.vaccines = serializeVaccines(params.vaccines);`):

```ts
  if (params.continuousMedications?.length) {
    result.continuous_medications = serializeContinuousMedications(params.continuousMedications).slice(0, 300);
  }
  if (params.drugRestrictions) result.drug_restrictions = params.drugRestrictions.slice(0, 300);
  if (params.reproductiveStatus) result.reproductive_status = params.reproductiveStatus;
  if (params.infectiousDiseases?.length) {
    result.infectious_diseases = serializeInfectiousDiseases(params.infectiousDiseases).slice(0, 300);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/buildTruncatedPayload.test.ts`
Expected: PASS (all tests in the file, old and new).

- [ ] **Step 5: Wire the new fields in `src/pages/ConsultationPage.tsx`**

Replace the `medicalHistory` initial state (lines 53-57):

```ts
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    allergies: '',
    previousDiseases: '',
    vaccines: [],
    deworming: [],
    continuousMedications: [],
    surgeries: [],
    reproductiveStatus: '',
    reproductiveDate: '',
    bloodType: '',
    transfusionHistory: '',
    infectiousDiseases: [],
    drugRestrictions: '',
  });
```

Replace the `buildTruncatedPayload` call (lines 109-120):

```ts
      const payload = buildTruncatedPayload({
        consultationId: crypto.randomUUID(),
        patientId: selectedPatient.id,
        chiefComplaint: session.complaint.label,
        followupAnswers: session.followupAnswers,
        transcription: session.transcription,
        dynamicAnswers: answers,
        clinicalHistory: clinicalHistory || undefined,
        allergies: medicalHistory.allergies || undefined,
        previousDiseases: medicalHistory.previousDiseases || undefined,
        vaccines: medicalHistory.vaccines.length ? medicalHistory.vaccines : undefined,
        continuousMedications: medicalHistory.continuousMedications.length
          ? medicalHistory.continuousMedications
          : undefined,
        drugRestrictions: medicalHistory.drugRestrictions || undefined,
        reproductiveStatus: medicalHistory.reproductiveStatus || undefined,
        infectiousDiseases: medicalHistory.infectiousDiseases.length
          ? medicalHistory.infectiousDiseases
          : undefined,
      });
```

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no TypeScript errors; all tests pass, including the existing `ConsultationPage — fluxo guiado existente não foi alterado` test.

- [ ] **Step 7: Commit**

```bash
git add src/lib/anamnesisApi.ts src/pages/ConsultationPage.tsx src/tests/buildTruncatedPayload.test.ts
git commit -m "feat(payload): inject continuous meds, drug restrictions, reproductive status, infectious diseases into n8n payload"
```

---

### Task 7: Add ECC (Body Condition Score) to `SOAPCard.tsx`

**Files:**
- Modify: `src/components/consultation/SOAPCard.tsx`
- Test: `src/tests/soapSaveAll.test.tsx`

**Interfaces:**
- Consumes: nothing new (extends existing `SOAPCardProps`/save flow).
- Produces: `SOAPCardProps` gains `bodyConditionScore?: string`, `onBodyConditionScoreChange?: (v: string) => void`. Consumed by Task 8 (`GuidedConsultation.tsx`).

- [ ] **Step 1: Write the failing tests**

Append to `src/tests/soapSaveAll.test.tsx` (after the `SOAPCard — indicador isDirty` describe block):

```tsx
// ── ECC (body_condition_score) ─────────────────────────────────────────────

const oBaseProps = {
  letter: 'O',
  title: 'Objetivo',
  subtitle: 'Exame físico',
  placeholder: 'Digite aqui...',
  value: '',
  onChange: vi.fn(),
  accentColor: 'hsl(160,60%,40%)',
  icon: null,
  patientId: 'patient-123',
};

describe('SOAPCard — Escore de Condição Corporal (ECC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('inclui body_condition_score no upsert quando preenchido no bloco O', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<SOAPCard {...oBaseProps} bodyConditionScore="7" ref={ref} />);

    await act(() => ref.current!.save());

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ body_condition_score: 7 }),
      expect.anything()
    );
  });

  it('envia body_condition_score null quando não preenchido no bloco O', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<SOAPCard {...oBaseProps} weightKg="4.5" ref={ref} />);

    await act(() => ref.current!.save());

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ body_condition_score: null }),
      expect.anything()
    );
  });

  it('não inclui body_condition_score para blocos que não são O', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<SOAPCard {...baseProps} bodyConditionScore="7" value="conteúdo" ref={ref} />);

    await act(() => ref.current!.save());

    const [payload] = mockUpsert.mock.calls[0];
    expect(payload).not.toHaveProperty('body_condition_score');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/soapSaveAll.test.tsx`
Expected: FAIL — `bodyConditionScore` prop doesn't exist yet / `body_condition_score` never appears in the upsert payload.

- [ ] **Step 3: Add the `Select` import to `SOAPCard.tsx`**

Insert after the existing `@/components/ui/tooltip` import block (after line 15):

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

- [ ] **Step 4: Extend `SOAPCardProps` and destructuring**

In the `SOAPCardProps` interface, add after `onTemperatureChange?: (v: string) => void;`:

```ts
  bodyConditionScore?: string;
  onBodyConditionScoreChange?: (v: string) => void;
```

In the component's destructured props, add after `onTemperatureChange,`:

```ts
  bodyConditionScore: bodyConditionScoreProp = '',
  onBodyConditionScoreChange,
```

- [ ] **Step 5: Add state and sync effect**

After `const [temperatureC, setTemperatureC] = useState(temperatureCProp);`, add:

```ts
  const [bodyConditionScore, setBodyConditionScore] = useState(bodyConditionScoreProp);
```

After the `useEffect(() => { setTemperatureC(temperatureCProp); }, [temperatureCProp]);` block, add:

```ts
  useEffect(() => {
    setBodyConditionScore(bodyConditionScoreProp);
  }, [bodyConditionScoreProp]);
```

- [ ] **Step 6: Include ECC in `hasVitals`, save payload, and dependency array**

Replace:

```ts
      const hasVitals = letter === 'O' && (weightKg.trim() !== '' || temperatureC.trim() !== '');
```

with:

```ts
      const hasVitals =
        letter === 'O' &&
        (weightKg.trim() !== '' || temperatureC.trim() !== '' || bodyConditionScore.trim() !== '');
```

Replace:

```ts
        const weightVal = letter === 'O' && weightKg.trim() ? parseFloat(weightKg) : null;
        const tempVal = letter === 'O' && temperatureC.trim() ? parseFloat(temperatureC) : null;

        if (consultationId) {
          // Guided/voice record exists: UPDATE the flat soap_* columns on that row
          const soapKey = `soap_${letter.toLowerCase()}`;
          const payload: Record<string, unknown> = {};
          if (content.trim()) payload[soapKey] = content.trim();
          if (letter === 'O') {
            payload.weight_kg = weightVal;
            payload.temperature_c = tempVal;
          }
```

with:

```ts
        const weightVal = letter === 'O' && weightKg.trim() ? parseFloat(weightKg) : null;
        const tempVal = letter === 'O' && temperatureC.trim() ? parseFloat(temperatureC) : null;
        const eccVal = letter === 'O' && bodyConditionScore.trim() ? parseInt(bodyConditionScore, 10) : null;

        if (consultationId) {
          // Guided/voice record exists: UPDATE the flat soap_* columns on that row
          const soapKey = `soap_${letter.toLowerCase()}`;
          const payload: Record<string, unknown> = {};
          if (content.trim()) payload[soapKey] = content.trim();
          if (letter === 'O') {
            payload.weight_kg = weightVal;
            payload.temperature_c = tempVal;
            payload.body_condition_score = eccVal;
          }
```

Replace:

```ts
                ...(letter === 'O' ? { weight_kg: weightVal, temperature_c: tempVal } : {}),
```

with:

```ts
                ...(letter === 'O' ? { weight_kg: weightVal, temperature_c: tempVal, body_condition_score: eccVal } : {}),
```

Replace the `useCallback` dependency array:

```ts
    [patientId, content, letter, weightKg, temperatureC, aiSuggestions, consultationId, refreshPatientState]
```

with:

```ts
    [patientId, content, letter, weightKg, temperatureC, bodyConditionScore, aiSuggestions, consultationId, refreshPatientState]
```

- [ ] **Step 7: Add the ECC select to the JSX, and include it in the footer's disabled check**

Inside the `{letter === 'O' && (<div className="flex gap-3">...` block, insert a new sibling right after the Temperatura `<div className="flex flex-col gap-1">...</div>` closes (i.e. immediately before the block's own closing `</div>`):

```tsx
            {/* ECC */}
            <div className="flex flex-col gap-1">
              <label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                ECC (1-9)
              </label>
              <Select
                value={bodyConditionScore || undefined}
                onValueChange={(v) => {
                  setBodyConditionScore(v);
                  onBodyConditionScoreChange?.(v);
                }}
              >
                <SelectTrigger
                  className="h-9 w-16 text-sm"
                  style={{ borderColor: 'hsl(217,50%,85%)', background: 'hsl(213,100%,99%)' }}
                >
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
```

Replace the footer `Button`'s `disabled` prop:

```tsx
          disabled={isSaving || (!content.trim() && !(letter === 'O' && (weightKg.trim() || temperatureC.trim())))}
```

with:

```tsx
          disabled={
            isSaving ||
            (!content.trim() &&
              !(letter === 'O' && (weightKg.trim() || temperatureC.trim() || bodyConditionScore.trim())))
          }
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/tests/soapSaveAll.test.tsx`
Expected: PASS (all tests in the file, old and new).

- [ ] **Step 9: Commit**

```bash
git add src/components/consultation/SOAPCard.tsx src/tests/soapSaveAll.test.tsx
git commit -m "feat(consultation): add Body Condition Score (ECC) to SOAPCard vitals"
```

---

### Task 8: Wire ECC through `GuidedConsultation.tsx`

**Files:**
- Modify: `src/components/consultation/GuidedConsultation.tsx`

**Interfaces:**
- Consumes: `bodyConditionScore`/`onBodyConditionScoreChange` props on `SOAPCard` from Task 7.
- Produces: nothing new — top-level page wiring. No dedicated test file exists for this component; verification is type-check + full suite green.

- [ ] **Step 1: Extend `vitalSigns` state**

Replace:

```ts
  const [vitalSigns, setVitalSigns] = useState({ weightKg: '', temperatureC: '' });
```

with:

```ts
  const [vitalSigns, setVitalSigns] = useState({ weightKg: '', temperatureC: '', bodyConditionScore: '' });
```

- [ ] **Step 2: Include it in the no-patient reset branch**

Replace:

```ts
          setVitalSigns({ weightKg: '', temperatureC: '' });
```

with:

```ts
          setVitalSigns({ weightKg: '', temperatureC: '', bodyConditionScore: '' });
```

- [ ] **Step 3: Add the column to the Supabase select**

Replace:

```ts
        .select('id, soap_block, content, created_at, source, soap_s, soap_o, soap_a, soap_p, weight_kg, temperature_c, approved_exams, approved_treatments')
```

with:

```ts
        .select('id, soap_block, content, created_at, source, soap_s, soap_o, soap_a, soap_p, weight_kg, temperature_c, body_condition_score, approved_exams, approved_treatments')
```

- [ ] **Step 4: Load it from `vitalsSource`**

Replace:

```ts
      setVitalSigns({
        weightKg: (vitalsSource as any)?.weight_kg != null ? String((vitalsSource as any).weight_kg) : '',
        temperatureC: (vitalsSource as any)?.temperature_c != null ? String((vitalsSource as any).temperature_c) : '',
      });
```

with:

```ts
      setVitalSigns({
        weightKg: (vitalsSource as any)?.weight_kg != null ? String((vitalsSource as any).weight_kg) : '',
        temperatureC: (vitalsSource as any)?.temperature_c != null ? String((vitalsSource as any).temperature_c) : '',
        bodyConditionScore:
          (vitalsSource as any)?.body_condition_score != null
            ? String((vitalsSource as any).body_condition_score)
            : '',
      });
```

- [ ] **Step 5: Pass the prop pair to the O-block `SOAPCard`**

Replace:

```tsx
          weightKg={vitalSigns.weightKg}
          temperatureC={vitalSigns.temperatureC}
          onWeightChange={(v) => setVitalSigns((prev) => ({ ...prev, weightKg: v }))}
          onTemperatureChange={(v) => setVitalSigns((prev) => ({ ...prev, temperatureC: v }))}
```

with:

```tsx
          weightKg={vitalSigns.weightKg}
          temperatureC={vitalSigns.temperatureC}
          onWeightChange={(v) => setVitalSigns((prev) => ({ ...prev, weightKg: v }))}
          onTemperatureChange={(v) => setVitalSigns((prev) => ({ ...prev, temperatureC: v }))}
          bodyConditionScore={vitalSigns.bodyConditionScore}
          onBodyConditionScoreChange={(v) => setVitalSigns((prev) => ({ ...prev, bodyConditionScore: v }))}
```

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no TypeScript errors; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/consultation/GuidedConsultation.tsx
git commit -m "feat(consultation): wire Body Condition Score through GuidedConsultation"
```

---

### Task 9: Final full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite one more time**

Run: `npx vitest run`
Expected: all test files pass, total test count ≥ 247 + newly added tests (Tasks 3, 4, 6, 7 add roughly 4 + 9 + 10 + 3 = 26 new tests).

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Confirm no stray console.log or TODOs were introduced**

Run: `git diff main --stat` (from the worktree) to review the full file list touched, then `grep -rn "console.log\|TODO" src/lib/medicalHistory.ts src/lib/anamnesisApi.ts src/components/patient/PatientMedicalHistory.tsx src/components/consultation/SOAPCard.tsx src/components/consultation/GuidedConsultation.tsx src/pages/ConsultationPage.tsx`
Expected: no matches (per `coding-rules.md`: "Keep logs clean — no debug `console.log` left in production code").
