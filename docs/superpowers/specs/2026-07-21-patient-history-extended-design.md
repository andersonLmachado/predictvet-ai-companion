# Patient History Extended — Design Spec

**Branch:** `feat/patient-history-extended`
**Date:** 2026-07-21

## Context

A veterinária co-fundadora identificou campos clínicos críticos ausentes no
histórico do paciente. Este spec expande `PatientMedicalHistory` com esses
campos estruturados, e injeta os campos clinicamente críticos no payload
enviado ao n8n/OpenAI para consideração nos SOAPs gerados.

## Decisions made during brainstorming

1. **Escore de Condição Corporal (ECC) does NOT live on `patients`.** Section
   8 of the original request states it's measured per-consultation alongside
   weight — matching how `weight_kg`/`temperature_c` already live on
   `medical_consultations` (see `20260320000001_add_vital_signs_to_consultations.sql`)
   and are captured in `SOAPCard.tsx`. The original migration draft that put
   `body_condition_score` on `patients` was a copy/paste inconsistency;
   corrected here. Confirmed with the user: ECC ships in this same branch,
   touching `SOAPCard.tsx` and `GuidedConsultation.tsx`.
2. **`reproductive_status`** stored as literal PT strings (`"Inteiro"` /
   `"Castrado"`), matching the existing pattern of storing `allergies` /
   `previous_diseases` as direct free text — no code/label mapping layer.
3. **Infectious disease `disease` field** is free text (`Input`), matching
   the existing vaccine-list pattern — no fixed enum/select of diseases.
4. **Infectious disease `status` field** is a constrained `Select`
   (`Positivo` / `Negativo` / `Não testado`) since it's a clinically bounded
   result, unlike the disease name itself. `method` stays free text (test
   methods vary too much for a fixed list).
5. **Payload serialization** for list-type fields uses human-readable,
   truncated strings — the same style as `serializeVaccines()` — not raw
   JSON, so the OpenAI prompt consumes them the same way it already consumes
   `allergies`/`vaccines`.
6. **Not every new field goes into the n8n payload.** Only the fields the
   user flagged as clinically critical are injected:
   `continuous_medications`, `drug_restrictions`, `reproductive_status`,
   `infectious_diseases`. `deworming` and `surgeries` are stored/editable in
   the UI but NOT sent to n8n (out of the user's stated critical list).

## Data model

### Migration A — `patients` table (new file, timestamp > `20260701000001`)

```sql
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

JSONB shapes:
- `deworming`: `[{ date, active_ingredient, weight_kg }]`
- `continuous_medications`: `[{ name, dose, frequency, indication }]`
- `surgeries`: `[{ date, procedure, anesthesia_reaction }]`
- `infectious_diseases`: `[{ disease, status, test_date, method }]`

### Migration B — `medical_consultations` table (new file)

```sql
ALTER TABLE public.medical_consultations
  ADD COLUMN IF NOT EXISTS body_condition_score SMALLINT;
```

No `body_condition_score` column on `patients`.

## `src/lib/medicalHistory.ts`

New types (camelCase in TS, snake_case in DB, same convention as `Vaccine`):

```ts
export interface Deworming { date: string; activeIngredient: string; weightKg: string }
export interface ContinuousMedication { name: string; dose: string; frequency: string; indication: string }
export interface Surgery { date: string; procedure: string; anesthesiaReaction: string }
export interface InfectiousDisease {
  disease: string;
  status: 'Positivo' | 'Negativo' | 'Não testado' | '';
  testDate: string;
  method: string;
}
```

`MedicalHistory` interface gains:
```ts
deworming: Deworming[];
continuousMedications: ContinuousMedication[];
surgeries: Surgery[];
reproductiveStatus: 'Inteiro' | 'Castrado' | '';
reproductiveDate: string;
bloodType: string;
transfusionHistory: string;
infectiousDiseases: InfectiousDisease[];
drugRestrictions: string;
```

`fetchMedicalHistory`/`saveMedicalHistory` extended with the same
null→default-value pattern already used for `allergies`/`vaccines` (empty
string / empty array defaults, `|| null` on save for optional text columns).

New serializers, mirroring `serializeVaccines`:
- `serializeContinuousMedications(meds)` → e.g.
  `"Enrofloxacino 10mg 2x/dia (Piometra)"`, joined by `", "`.
- `serializeInfectiousDiseases(diseases)` → e.g.
  `"Leishmaniose: Positivo (ELISA, 15/03/2024)"`, joined by `", "`.

## `PatientMedicalHistory.tsx` — new sections

Inserted after the existing vaccine list, following its established visual
pattern (rounded card, uppercase label, dashed-border empty state, `+`/`×`
row controls):

1. **Vermifugação e antiparasitários** — list: data + princípio ativo + peso
   na aplicação. Same add/remove-row pattern as vaccines.
2. **Medicamentos em uso contínuo** — list: nome + dose + frequência +
   indicação. Separate field/section from "doenças anteriores" — not merged.
3. **Cirurgias e procedimentos** — list: data + procedimento + reação à
   anestesia (free text).
4. **Status reprodutivo** — `Select` (Inteiro / Castrado); selecting
   "Castrado" reveals a `date` `Input` for `reproductiveDate`.
5. **Tipagem sanguínea e transfusões** — `Input` (blood type) + `Textarea`
   (transfusion history).
6. **Doenças infectocontagiosas** — list: doença (`Input`) + status
   (`Select`: Positivo/Negativo/Não testado) + data do teste (`date` `Input`)
   + método (`Input`).
7. **Restrições a fármacos** — separate `Textarea` from allergies. Label:
   "Restrições, idiossincrasias e sensibilidades raciais". Hint text: "Ex:
   MDR1/ABCB1 em raças pastoras".

ECC (item 8) is **not** in this component — see below.

## ECC — `SOAPCard.tsx` / `GuidedConsultation.tsx`

- `bodyConditionScore`/`onBodyConditionScoreChange` prop pair added to
  `SOAPCardProps`, mirroring the existing `weightKg`/`onWeightChange` pair.
- Rendered as a `Select` (1-9) next to the weight/temperature inputs, visible
  only for the `O` (Objective) block — same gating as vitals today
  (`letter === 'O'`).
- Included in the save payload (`payload.body_condition_score`) and the
  `medical_consultations` update alongside `weight_kg`/`temperature_c`.
- No numeric-range validation needed (bounded `Select`, unlike free-typed
  weight/temperature which use `validateVitals`).
- `GuidedConsultation.tsx` gains matching state (`bodyConditionScore`) and
  prop plumbing into `SOAPCard`, and includes it in the fetch/select of
  `medical_consultations` columns.

## Payload injection — `anamnesisApi.ts` / `ConsultationPage.tsx`

`buildTruncatedPayload` params gain:
```ts
continuousMedications?: ContinuousMedication[];
drugRestrictions?: string;
reproductiveStatus?: string;
infectiousDiseases?: InfectiousDisease[];
```

Each mirrors the existing `allergies`/`vaccines` handling:
- `drugRestrictions`/`reproductiveStatus` → truncated to 300 chars, omitted
  when falsy (same as `allergies`/`previousDiseases`).
- `continuousMedications`/`infectiousDiseases` → serialized via the new
  serializers, only included when the array is non-empty (same as
  `vaccines`).

`ExtendedAnamnesisPayload` gains matching optional fields:
`continuous_medications?: string`, `drug_restrictions?: string`,
`reproductive_status?: string`, `infectious_diseases?: string`.

`ConsultationPage.tsx` wires these from the already-fetched `medicalHistory`
state (same `useEffect`/`fetchMedicalHistory` call already in place), passed
into `buildTruncatedPayload` alongside the existing `allergies`/`vaccines`
args.

## Testing

- `src/tests/medicalHistory.test.ts`: extend fetch/save round-trip coverage
  for all 9 new `patients` fields (present, null-default, JSONB array
  default), plus unit tests for `serializeContinuousMedications` and
  `serializeInfectiousDiseases` (empty array, single item, multiple items,
  omits blank entries — same shape as existing `serializeVaccines` tests).
- `src/tests/anamnesisApi.test.ts`: extend `buildTruncatedPayload` coverage —
  each of the 4 new payload fields present when provided, truncated at 300
  chars, omitted when empty/undefined. Confirm `deworming`/`surgeries` are
  never serialized into the payload even when present in `medicalHistory`.
- New assertions (likely in an existing SOAP/consultation test file) for the
  ECC save path: `body_condition_score` included in the `medical_consultations`
  update only when `letter === 'O'`, absent otherwise.
- Full suite must remain green. Baseline measured at 247/247 passing
  (`npx vitest run`) before this work started — the ticket's "242/242" figure
  is stale relative to `main`.

## Out of scope

- No changes to `deworming`/`surgeries` payload injection.
- No fixed enum/select for infectious disease names.
- No `body_condition_score` column on `patients`.
