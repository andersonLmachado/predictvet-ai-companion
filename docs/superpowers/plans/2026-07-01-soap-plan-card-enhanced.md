# SOAP Plan Card Enhanced — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o `<SOAPCard letter="P">` por um `PlanCard` separado que parseia `soap_p` em três seções visuais com checkboxes (exames e tratamentos) e persiste os itens aprovados em `approved_exams`/`approved_treatments` no Supabase.

**Architecture:** Parse-on-load com `useMemo` — o texto bruto de `soap_p` é autoritativo e permanece salvo em `content`; `parseSoapP()` deriva as seções estruturadas; `approved_exams`/`approved_treatments` são arrays JSONB independentes. Quando o texto não tem o formato esperado (ou está vazio), o PlanCard cai para um textarea livre sem quebrar nada.

**Tech Stack:** React 18 + forwardRef, Vitest + Testing Library (happy-dom), Supabase (upsert via `patient_id,soap_block`), Tailwind CSS + design system PredictVet.

## Global Constraints

- Todos os componentes usam `forwardRef` + `useImperativeHandle` igual ao `SOAPCard` existente — a interface `{ save(): Promise<{ ok: boolean; letter: string }> }` é invariante
- Testes de componentes precisam do `// @vitest-environment happy-dom` na primeira linha
- Alias `@/` resolve para `./src/` (configurado no `vite.config.ts`)
- O projeto usa `as any` casts em queries Supabase — não regenerar `types.ts` via CLI; atualizar manualmente apenas os tipos da tabela `medical_consultations`
- Sem `console.log` em código de produção
- Seguir o padrão de commit do projeto: `feat(scope): descrição em inglês`
- Executar `npm run test` e `npm run build` antes de cada commit para garantir que nada quebrou

---

## File Map

| Status | Arquivo | Responsabilidade |
|--------|---------|-----------------|
| CRIAR | `src/lib/parseSoapP.ts` | Parser puro: texto → `ParsedPlan \| null`; serializer: `ParsedPlan` → texto |
| CRIAR | `src/tests/parseSoapP.test.ts` | Testes unitários do parser |
| CRIAR | `src/components/consultation/PlanCard.tsx` | Card P estruturado com checkboxes e modo fallback |
| CRIAR | `src/tests/planCard.test.tsx` | Testes do PlanCard (happy-dom) |
| CRIAR | `supabase/migrations/20260701000001_add_approved_plan_columns.sql` | Adiciona `approved_exams` e `approved_treatments` |
| MODIFICAR | `src/integrations/supabase/types.ts` | Adiciona as duas novas colunas no tipo `medical_consultations` |
| MODIFICAR | `src/components/consultation/GuidedConsultation.tsx` | Troca `<SOAPCard letter="P">` por `<PlanCard>`, carrega approved state |

---

## Task 1: Migration + Supabase Types

**Files:**
- Create: `supabase/migrations/20260701000001_add_approved_plan_columns.sql`
- Modify: `src/integrations/supabase/types.ts`

**Interfaces:**
- Produces: colunas `approved_exams: Json | null` e `approved_treatments: Json | null` acessíveis via Supabase client nas Tasks 3 e 4

- [ ] **Step 1: Criar arquivo de migration**

Criar `supabase/migrations/20260701000001_add_approved_plan_columns.sql`:

```sql
ALTER TABLE public.medical_consultations
  ADD COLUMN IF NOT EXISTS approved_exams      JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS approved_treatments JSONB DEFAULT '[]';
```

- [ ] **Step 2: Atualizar `src/integrations/supabase/types.ts`**

Localizar o bloco `medical_consultations` (em torno da linha 179) e adicionar as duas novas colunas em `Row`, `Insert` e `Update`:

Em `Row`:
```typescript
approved_exams: Json | null
approved_treatments: Json | null
```

Em `Insert`:
```typescript
approved_exams?: Json | null
approved_treatments?: Json | null
```

Em `Update`:
```typescript
approved_exams?: Json | null
approved_treatments?: Json | null
```

O tipo `Json` já está importado/definido no arquivo — verificar que existe; se não existir, adicionar no topo: `type Json = string | number | boolean | null | { [key: string]: Json } | Json[]`.

- [ ] **Step 3: Aplicar migration no Supabase**

Acessar o Supabase Dashboard → SQL Editor → colar e executar o conteúdo do arquivo de migration. Verificar que as colunas aparecem na tabela `medical_consultations`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260701000001_add_approved_plan_columns.sql \
        src/integrations/supabase/types.ts
git commit -m "feat(db): add approved_exams and approved_treatments to medical_consultations"
```

---

## Task 2: Parser `parseSoapP`

**Files:**
- Create: `src/lib/parseSoapP.ts`
- Create: `src/tests/parseSoapP.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface ParsedPlan {
    exams: string[];
    treatments: string[];
    monitoring: string;
  }
  export function parseSoapP(text: string): ParsedPlan | null
  export function serializeSoapP(plan: ParsedPlan): string
  ```

- [ ] **Step 1: Criar o arquivo de teste com casos falhando**

Criar `src/tests/parseSoapP.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseSoapP, serializeSoapP } from '../lib/parseSoapP';

const FULL_PLAN = `EXAMES SOLICITADOS:
- Hemograma completo — triagem inicial
- Ultrassom abdominal — avaliar estruturas

PROTOCOLO E TRATAMENTO:
- Amoxicilina 10mg/kg a cada 12h por 7 dias
- Dipirona se febre > 39.5°C

RETORNO E MONITORAMENTO:
Retorno em 7 dias. Sinais de alerta: vômito persistente.`;

describe('parseSoapP', () => {
  it('retorna null para string vazia', () => {
    expect(parseSoapP('')).toBeNull();
    expect(parseSoapP('   ')).toBeNull();
  });

  it('retorna null para texto bruto sem seções reconhecidas', () => {
    expect(parseSoapP('Amoxicilina 10mg/kg. Retorno em 7 dias.')).toBeNull();
  });

  it('parseia texto no formato exato do prompt n8n', () => {
    const result = parseSoapP(FULL_PLAN);
    expect(result).not.toBeNull();
    expect(result!.exams).toEqual([
      'Hemograma completo — triagem inicial',
      'Ultrassom abdominal — avaliar estruturas',
    ]);
    expect(result!.treatments).toEqual([
      'Amoxicilina 10mg/kg a cada 12h por 7 dias',
      'Dipirona se febre > 39.5°C',
    ]);
    expect(result!.monitoring).toBe('Retorno em 7 dias. Sinais de alerta: vômito persistente.');
  });

  it('tolera variações de caixa nos cabeçalhos', () => {
    const mixed = [
      'exames solicitados:',
      '- Hemograma',
      '',
      'protocolo e tratamento:',
      '- Amoxicilina',
      '',
      'retorno e monitoramento:',
      'Retorno em 7 dias.',
    ].join('\n');
    const result = parseSoapP(mixed);
    expect(result).not.toBeNull();
    expect(result!.exams).toEqual(['Hemograma']);
    expect(result!.treatments).toEqual(['Amoxicilina']);
    expect(result!.monitoring).toBe('Retorno em 7 dias.');
  });

  it('retorna arrays vazios para seções ausentes, mas retorna objeto quando ao menos uma seção existe', () => {
    const onlyMonitoring = 'RETORNO E MONITORAMENTO:\nRetorno em 7 dias.';
    const result = parseSoapP(onlyMonitoring);
    expect(result).not.toBeNull();
    expect(result!.exams).toEqual([]);
    expect(result!.treatments).toEqual([]);
    expect(result!.monitoring).toBe('Retorno em 7 dias.');
  });

  it('aceita marcadores alternativos de lista (•, *, [)', () => {
    const bullets = [
      'EXAMES SOLICITADOS:',
      '• Hemograma',
      '* Ultrassom',
      '[ ] Raio-X',
    ].join('\n');
    const result = parseSoapP(bullets);
    expect(result).not.toBeNull();
    expect(result!.exams).toHaveLength(3);
  });
});

describe('serializeSoapP', () => {
  it('serializa de volta para texto parseável (round-trip)', () => {
    const original = parseSoapP(FULL_PLAN)!;
    const serialized = serializeSoapP(original);
    const reparsed = parseSoapP(serialized);
    expect(reparsed).toEqual(original);
  });

  it('permite substituir monitoring via spread antes de serializar', () => {
    const original = parseSoapP(FULL_PLAN)!;
    const modified = serializeSoapP({ ...original, monitoring: 'Retorno em 14 dias.' });
    const reparsed = parseSoapP(modified);
    expect(reparsed!.monitoring).toBe('Retorno em 14 dias.');
    expect(reparsed!.exams).toEqual(original.exams);
    expect(reparsed!.treatments).toEqual(original.treatments);
  });
});
```

- [ ] **Step 2: Confirmar que os testes falham**

```bash
npm run test -- parseSoapP
```

Esperado: falha com `Cannot find module '../lib/parseSoapP'`.

- [ ] **Step 3: Implementar `src/lib/parseSoapP.ts`**

```typescript
export interface ParsedPlan {
  exams: string[];
  treatments: string[];
  monitoring: string;
}

const SECTION_EXAMS      = /EXAMES\s+SOLICITADOS/i;
const SECTION_TREATMENTS = /PROTOCOLO\s+E\s+TRATAMENTO/i;
const SECTION_MONITORING = /RETORNO\s+E\s+MONITORAMENTO/i;
const ITEM_PREFIX        = /^[-•*\[]\s*/;

export function parseSoapP(text: string): ParsedPlan | null {
  if (!text.trim()) return null;

  const hasAnySection =
    SECTION_EXAMS.test(text) ||
    SECTION_TREATMENTS.test(text) ||
    SECTION_MONITORING.test(text);

  if (!hasAnySection) return null;

  type Section = 'none' | 'exams' | 'treatments' | 'monitoring';
  let current: Section = 'none';
  const result: ParsedPlan = { exams: [], treatments: [], monitoring: '' };
  const monitoringLines: string[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();

    if (SECTION_EXAMS.test(trimmed))      { current = 'exams';      continue; }
    if (SECTION_TREATMENTS.test(trimmed)) { current = 'treatments'; continue; }
    if (SECTION_MONITORING.test(trimmed)) { current = 'monitoring'; continue; }

    if (!trimmed) continue;

    if (current === 'exams' && ITEM_PREFIX.test(trimmed)) {
      result.exams.push(trimmed.replace(ITEM_PREFIX, '').trim());
    } else if (current === 'treatments' && ITEM_PREFIX.test(trimmed)) {
      result.treatments.push(trimmed.replace(ITEM_PREFIX, '').trim());
    } else if (current === 'monitoring') {
      monitoringLines.push(trimmed);
    }
  }

  result.monitoring = monitoringLines.join('\n').trim();
  return result;
}

export function serializeSoapP(plan: ParsedPlan): string {
  const parts: string[] = [
    'EXAMES SOLICITADOS:',
    ...plan.exams.map(e => `- ${e}`),
    '',
    'PROTOCOLO E TRATAMENTO:',
    ...plan.treatments.map(t => `- ${t}`),
    '',
    'RETORNO E MONITORAMENTO:',
    plan.monitoring,
  ];
  return parts.join('\n').trim();
}
```

- [ ] **Step 4: Confirmar que os testes passam**

```bash
npm run test -- parseSoapP
```

Esperado: todos os testes passando (`7 passed`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/parseSoapP.ts src/tests/parseSoapP.test.ts
git commit -m "feat(lib): add parseSoapP and serializeSoapP utilities with tests"
```

---

## Task 3: Componente `PlanCard`

**Files:**
- Create: `src/components/consultation/PlanCard.tsx`
- Create: `src/tests/planCard.test.tsx`

**Interfaces:**
- Consumes:
  - `parseSoapP(text): ParsedPlan | null` — de `@/lib/parseSoapP`
  - `serializeSoapP(plan): string` — de `@/lib/parseSoapP`
  - `SOAPCardHandle` — de `./SOAPCard` (reutilizar a interface existente)
- Produces:
  ```typescript
  // PlanCard é compatível com SOAPCardHandle via forwardRef
  // soapRefs.P.current!.save() funciona identicamente ao SOAPCard
  export default PlanCard  // forwardRef<SOAPCardHandle, PlanCardProps>
  ```

- [ ] **Step 1: Criar o arquivo de teste com casos falhando**

Criar `src/tests/planCard.test.tsx`:

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanCard from '../components/consultation/PlanCard';
import type { SOAPCardHandle } from '../components/consultation/SOAPCard';

const { mockUpsert } = vi.hoisted(() => ({
  mockUpsert: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
  },
}));

vi.mock('@/contexts/PatientContext', () => ({
  usePatient: () => ({ refreshPatientState: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

const PLAN_TEXT = `EXAMES SOLICITADOS:
- Hemograma completo — triagem inicial
- Ultrassom abdominal — avaliar estruturas

PROTOCOLO E TRATAMENTO:
- Amoxicilina 10mg/kg a cada 12h por 7 dias

RETORNO E MONITORAMENTO:
Retorno em 7 dias.`;

// ── Fallback mode ──────────────────────────────────────────────────────────────

describe('PlanCard — modo fallback', () => {
  it('exibe textarea livre quando value está vazio', () => {
    render(<PlanCard value="" onChange={vi.fn()} patientId="p-1" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText('Exames Solicitados')).not.toBeInTheDocument();
  });

  it('exibe textarea livre quando texto não tem seções reconhecidas', () => {
    render(
      <PlanCard value="Amoxicilina 10mg/kg. Retorno em 7 dias." onChange={vi.fn()} patientId="p-1" />,
    );
    expect(screen.queryByText('Exames Solicitados')).not.toBeInTheDocument();
  });
});

// ── Structured mode ────────────────────────────────────────────────────────────

describe('PlanCard — modo estruturado', () => {
  it('exibe as 3 seções quando texto tem formato correto', () => {
    render(<PlanCard value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);
    expect(screen.getByText('Exames Solicitados')).toBeInTheDocument();
    expect(screen.getByText('Protocolo e Tratamento')).toBeInTheDocument();
    expect(screen.getByText('Retorno e Monitoramento')).toBeInTheDocument();
  });

  it('renderiza label para cada item de exame', () => {
    render(<PlanCard value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);
    expect(screen.getByText('Hemograma completo — triagem inicial')).toBeInTheDocument();
    expect(screen.getByText('Ultrassom abdominal — avaliar estruturas')).toBeInTheDocument();
  });

  it('marcar um exame adiciona classe line-through ao label', () => {
    render(<PlanCard value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);
    const label = screen.getByText('Hemograma completo — triagem inicial');
    expect(label.className).not.toContain('line-through');

    fireEvent.click(label);

    expect(screen.getByText('Hemograma completo — triagem inicial').className).toContain('line-through');
  });

  it('desmarcar um exame remove a classe line-through', () => {
    render(
      <PlanCard
        value={PLAN_TEXT}
        onChange={vi.fn()}
        patientId="p-1"
        initialApprovedExams={['Hemograma completo — triagem inicial']}
      />,
    );
    const label = screen.getByText('Hemograma completo — triagem inicial');
    expect(label.className).toContain('line-through');

    fireEvent.click(label);

    expect(screen.getByText('Hemograma completo — triagem inicial').className).not.toContain('line-through');
  });

  it('exibe badge de contagem correta de exames selecionados', () => {
    render(
      <PlanCard
        value={PLAN_TEXT}
        onChange={vi.fn()}
        patientId="p-1"
        initialApprovedExams={['Hemograma completo — triagem inicial']}
      />,
    );
    expect(screen.getByText('1 / 2 selecionados')).toBeInTheDocument();
  });
});

// ── save() via ref ─────────────────────────────────────────────────────────────

describe('PlanCard — save() via ref', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('retorna ok:true sem chamar upsert quando value está vazio', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<PlanCard ref={ref} value="" onChange={vi.fn()} patientId="p-1" />);

    const result = await act(() => ref.current!.save());

    expect(result).toEqual({ ok: true, letter: 'P' });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('retorna ok:false sem chamar upsert quando patientId não está definido', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<PlanCard ref={ref} value={PLAN_TEXT} onChange={vi.fn()} />);

    const result = await act(() => ref.current!.save());

    expect(result).toEqual({ ok: false, letter: 'P' });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('chama upsert com soap_block P e approved_exams ao salvar', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<PlanCard ref={ref} value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);

    fireEvent.click(screen.getByText('Hemograma completo — triagem inicial'));

    await act(() => ref.current!.save());

    expect(mockUpsert).toHaveBeenCalledOnce();
    const [[payload]] = mockUpsert.mock.calls;
    expect(payload.soap_block).toBe('P');
    expect(payload.approved_exams).toContain('Hemograma completo — triagem inicial');
    expect(payload.approved_treatments).toEqual([]);
  });

  it('inclui initialApprovedTreatments no upsert quando nenhum checkbox novo é marcado', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(
      <PlanCard
        ref={ref}
        value={PLAN_TEXT}
        onChange={vi.fn()}
        patientId="p-1"
        initialApprovedTreatments={['Amoxicilina 10mg/kg a cada 12h por 7 dias']}
      />,
    );

    await act(() => ref.current!.save());

    const [[payload]] = mockUpsert.mock.calls;
    expect(payload.approved_treatments).toContain('Amoxicilina 10mg/kg a cada 12h por 7 dias');
  });

  it('retorna ok:false quando upsert retorna erro', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } });
    const ref = createRef<SOAPCardHandle>();
    render(<PlanCard ref={ref} value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);

    const result = await act(() => ref.current!.save());

    expect(result).toEqual({ ok: false, letter: 'P' });
  });
});
```

- [ ] **Step 2: Confirmar que os testes falham**

```bash
npm run test -- planCard
```

Esperado: falha com `Cannot find module '../components/consultation/PlanCard'`.

- [ ] **Step 3: Implementar `src/components/consultation/PlanCard.tsx`**

Antes de escrever qualquer JSX, invocar o skill `predictvet-design-system` para confirmar tokens de cor e padrões de componente. Em seguida, implementar:

```typescript
import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Microscope, Pill, CalendarDays, Pencil, FileCheck } from 'lucide-react';
import { toast as uiToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePatient } from '@/contexts/PatientContext';
import { parseSoapP, serializeSoapP } from '@/lib/parseSoapP';
import type { SOAPCardHandle } from './SOAPCard';

interface PlanCardProps {
  value: string;
  onChange: (v: string) => void;
  patientId?: string;
  initialApprovedExams?: string[];
  initialApprovedTreatments?: string[];
}

const ACCENT = 'hsl(270, 50%, 55%)';

const PlanCard = forwardRef<SOAPCardHandle, PlanCardProps>(
  (
    {
      value,
      onChange,
      patientId,
      initialApprovedExams = [],
      initialApprovedTreatments = [],
    },
    ref,
  ) => {
    const { refreshPatientState } = usePatient();

    const [approvedExams, setApprovedExams] = useState<string[]>(initialApprovedExams);
    const [approvedTreatments, setApprovedTreatments] = useState<string[]>(initialApprovedTreatments);
    const [isMonitoringEditing, setIsMonitoringEditing] = useState(false);
    const [monitoringOverride, setMonitoringOverride] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedValue, setLastSavedValue] = useState(value);
    const isDirty = value !== lastSavedValue;

    // Sync approved state when parent reloads data (e.g. patient switch)
    useEffect(() => { setApprovedExams(initialApprovedExams); }, [initialApprovedExams]);
    useEffect(() => { setApprovedTreatments(initialApprovedTreatments); }, [initialApprovedTreatments]);
    useEffect(() => { setLastSavedValue(value); }, [value]);

    const parsed = useMemo(() => parseSoapP(value), [value]);

    const toggleExam = (item: string) =>
      setApprovedExams((prev) =>
        prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
      );

    const toggleTreatment = (item: string) =>
      setApprovedTreatments((prev) =>
        prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item],
      );

    const handleSaveInternal = useCallback(
      async (opts?: { silent?: boolean }): Promise<{ ok: boolean; letter: string }> => {
        const silent = opts?.silent ?? false;

        if (!patientId) {
          if (!silent) {
            uiToast({
              title: 'Paciente não selecionado',
              description: 'Selecione um paciente antes de salvar o registro.',
              variant: 'destructive',
            });
          }
          return { ok: false, letter: 'P' };
        }

        if (!value.trim()) return { ok: true, letter: 'P' };

        const { error: authError } = await supabase.auth.getUser();
        if ((authError as any)?.status === 401) {
          toast.error('Sua sessão expirou. Por favor, recarregue a página.');
          return { ok: false, letter: 'P' };
        }

        const contentToSave =
          parsed && monitoringOverride !== null
            ? serializeSoapP({ ...parsed, monitoring: monitoringOverride })
            : value;

        setIsSaving(true);
        try {
          const { error } = await supabase
            .from('medical_consultations')
            .upsert(
              {
                patient_id: patientId,
                soap_block: 'P',
                content: contentToSave,
                approved_exams: approvedExams,
                approved_treatments: approvedTreatments,
              } as any,
              { onConflict: 'patient_id,soap_block' },
            );

          if (error) throw error;

          setLastSavedValue(value);
          if (!silent) toast.success('Bloco P salvo com sucesso!');
          refreshPatientState();
          return { ok: true, letter: 'P' };
        } catch (err: any) {
          if (err?.status === 401 || err?.code === '401') {
            toast.error('Sua sessão expirou. Por favor, recarregue a página.');
          } else if (!silent) {
            uiToast({
              title: 'Erro ao salvar',
              description: 'Não foi possível salvar o registro. Tente novamente.',
              variant: 'destructive',
            });
          }
          return { ok: false, letter: 'P' };
        } finally {
          setIsSaving(false);
        }
      },
      [patientId, value, parsed, monitoringOverride, approvedExams, approvedTreatments, refreshPatientState],
    );

    useImperativeHandle(ref, () => ({ save: () => handleSaveInternal({ silent: true }) }), [
      handleSaveInternal,
    ]);

    const cardHeader = (
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            P
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">Plano — Conduta</span>
              {isDirty && value.trim() && (
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: 'hsl(24, 90%, 55%)' }}
                  aria-label="alterações não salvas"
                />
              )}
            </div>
            <p className="text-xs font-normal text-muted-foreground">
              Exames solicitados, prescrições, retorno
            </p>
          </div>
          <FileCheck className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
    );

    const saveButton = (
      <CardFooter className="pt-0">
        <Button
          onClick={() => handleSaveInternal({ silent: false })}
          disabled={isSaving || !value.trim()}
          className="gap-2"
          style={{ backgroundColor: ACCENT }}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Plano
        </Button>
      </CardFooter>
    );

    // ── Fallback mode (empty or unrecognized format) ──────────────────────────
    if (!parsed) {
      return (
        <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: ACCENT }}>
          {cardHeader}
          <CardContent>
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Solicitar hemograma completo, bioquímico renal... Prescrever: ___ | Retorno em: ___"
              className="min-h-[120px] resize-none text-sm"
            />
          </CardContent>
          {saveButton}
        </Card>
      );
    }

    // ── Structured mode ───────────────────────────────────────────────────────
    const monitoringText = monitoringOverride ?? parsed.monitoring;

    return (
      <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: ACCENT }}>
        {cardHeader}
        <CardContent className="space-y-4">

          {/* Section 1 — Exames */}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ background: 'hsla(221,73%,45%,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Microscope className="h-4 w-4" style={{ color: 'hsl(221,73%,45%)' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(221,73%,45%)' }}>
                  Exames Solicitados
                </span>
              </div>
              {parsed.exams.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {approvedExams.length} / {parsed.exams.length} selecionados
                </span>
              )}
            </div>
            {parsed.exams.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum exame especificado</p>
            ) : (
              parsed.exams.map((exam, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Checkbox
                    id={`exam-${i}`}
                    checked={approvedExams.includes(exam)}
                    onCheckedChange={() => toggleExam(exam)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`exam-${i}`}
                    className={`text-sm cursor-pointer leading-relaxed select-none ${
                      approvedExams.includes(exam) ? 'line-through opacity-50' : ''
                    }`}
                  >
                    {exam}
                  </label>
                </div>
              ))
            )}
          </div>

          {/* Section 2 — Tratamento */}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ background: 'hsla(160,60%,40%,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4" style={{ color: 'hsl(160,60%,40%)' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(160,60%,40%)' }}>
                  Protocolo e Tratamento
                </span>
              </div>
              {parsed.treatments.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {approvedTreatments.length} / {parsed.treatments.length} selecionados
                </span>
              )}
            </div>
            {parsed.treatments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma conduta especificada</p>
            ) : (
              parsed.treatments.map((treatment, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Checkbox
                    id={`treatment-${i}`}
                    checked={approvedTreatments.includes(treatment)}
                    onCheckedChange={() => toggleTreatment(treatment)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`treatment-${i}`}
                    className={`text-sm cursor-pointer leading-relaxed select-none ${
                      approvedTreatments.includes(treatment) ? 'line-through opacity-50' : ''
                    }`}
                  >
                    {treatment}
                  </label>
                </div>
              ))
            )}
          </div>

          {/* Section 3 — Retorno */}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ background: 'hsla(35,80%,50%,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" style={{ color: 'hsl(35,80%,50%)' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(35,80%,50%)' }}>
                  Retorno e Monitoramento
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMonitoringEditing((e) => !e)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="editar retorno"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <Textarea
              value={monitoringText}
              readOnly={!isMonitoringEditing}
              onChange={(e) => setMonitoringOverride(e.target.value)}
              className="min-h-[72px] resize-none text-sm bg-transparent border-0 p-0 focus-visible:ring-0 shadow-none"
            />
          </div>

        </CardContent>
        {saveButton}
      </Card>
    );
  },
);

PlanCard.displayName = 'PlanCard';
export default PlanCard;
```

- [ ] **Step 4: Confirmar que os testes passam**

```bash
npm run test -- planCard
```

Esperado: todos os testes passando.

- [ ] **Step 5: Build sem erros de TypeScript**

```bash
npm run build
```

Esperado: zero erros de compilação.

- [ ] **Step 6: Commit**

```bash
git add src/components/consultation/PlanCard.tsx src/tests/planCard.test.tsx
git commit -m "feat(consultation): add PlanCard with structured SOAP-P sections and checkbox approvals"
```

---

## Task 4: Integrar PlanCard no GuidedConsultation

**Files:**
- Modify: `src/components/consultation/GuidedConsultation.tsx`

**Interfaces:**
- Consumes:
  - `PlanCard` (default export) — de `./PlanCard`
  - `SOAPCardHandle` — já importado via `./SOAPCard` (o tipo do ref não muda)

- [ ] **Step 1: Adicionar import e estado de aprovações**

No topo de `GuidedConsultation.tsx`, adicionar o import:

```typescript
import PlanCard from './PlanCard';
```

No corpo do componente, após a declaração de `const [aiSuggestions, setAiSuggestions] = useState('');`, adicionar:

```typescript
const [approvedState, setApprovedState] = useState<{
  exams: string[];
  treatments: string[];
}>({ exams: [], treatments: [] });
```

- [ ] **Step 2: Atualizar a query para incluir as novas colunas**

Na linha com `.select(...)`, adicionar `approved_exams, approved_treatments` ao final da string:

```typescript
.select('soap_block, content, ai_suggestions, created_at, source, soap_s, soap_o, soap_a, soap_p, weight_kg, temperature_c, approved_exams, approved_treatments')
```

- [ ] **Step 3: Carregar o estado de aprovações após a query**

Dentro de `loadConsultationData`, após as duas branches (`if (guidedRecord)` / `else`), e **antes** do bloco de `weight_kg`/`temperature_c`, adicionar:

```typescript
// Load approved plan items from the P block row (exists after vet saves approvals)
const pApprovalRow = (data ?? []).find((row: any) => row.soap_block === 'P');
setApprovedState({
  exams:      (pApprovalRow as any)?.approved_exams      ?? [],
  treatments: (pApprovalRow as any)?.approved_treatments ?? [],
});
```

- [ ] **Step 4: Substituir `<SOAPCard letter="P">` por `<PlanCard>`**

Localizar o bloco JSX do Card P (em torno da linha 325 do arquivo original):

```tsx
<SOAPCard
  ref={soapRefs.P}
  letter="P"
  title="Plano — Conduta"
  subtitle="Exames solicitados, prescrições, retorno"
  placeholder="Solicitar hemograma completo, bioquímico renal... Prescrever: ___ | Retorno em: ___"
  value={soapData.P}
  onChange={updateField('P')}
  accentColor="hsl(270, 50%, 55%)"
  icon={<FileCheck className="h-5 w-5" />}
  patientId={selectedPatient?.id}
  aiSuggestions={aiSuggestions}
  onAiSuggestionsChange={setAiSuggestions}
/>
```

Substituir por:

```tsx
<PlanCard
  ref={soapRefs.P}
  value={soapData.P}
  onChange={updateField('P')}
  patientId={selectedPatient?.id}
  initialApprovedExams={approvedState.exams}
  initialApprovedTreatments={approvedState.treatments}
/>
```

- [ ] **Step 5: Remover imports não mais usados**

Verificar se `aiSuggestions` e `onAiSuggestionsChange` ainda são usados em algum outro lugar do arquivo. Se `setAiSuggestions` não tiver mais referências, remover:
- `const [aiSuggestions, setAiSuggestions] = useState('');`

Se o ícone `FileCheck` não for mais usado diretamente no `GuidedConsultation.tsx`, remover do import de `lucide-react`.

- [ ] **Step 6: Confirmar que todos os testes passam**

```bash
npm run test
```

Esperado: toda a suíte passa (`parseSoapP`, `planCard`, `soapSaveAll`, e demais).

- [ ] **Step 7: Build sem erros**

```bash
npm run build
```

Esperado: zero erros.

- [ ] **Step 8: Smoke test manual**

Abrir o app em `npm run dev`, navegar para `/soap` (ou `/consulta`), selecionar um paciente com `soap_p` já preenchido via Anamnese Guiada (formato estruturado). Verificar:

1. Card P exibe as 3 seções com checkboxes
2. Marcar um exame → label fica riscado, badge atualiza
3. Clicar no lápis da seção Retorno → textarea vira editável
4. Clicar em "Salvar Plano" → toast de sucesso
5. Recarregar a página → checkboxes marcados persistem
6. Paciente com `soap_p` vazio → card exibe textarea livre

- [ ] **Step 9: Commit**

```bash
git add src/components/consultation/GuidedConsultation.tsx
git commit -m "feat(consultation): replace SOAPCard P with PlanCard in GuidedConsultation"
```

---

## Task 5: Passo manual n8n (fora do código)

Não há arquivos para commitar. Documentado aqui para registro.

- [ ] **Step 1: Atualizar prompt do nó OpenAI P no workflow `anamnese-soap`**

No n8n Dashboard → Workflow `anamnese-soap` → nó "OpenAI P" → System/User prompt, substituir o conteúdo atual por:

```
Você é um médico veterinário especialista em pequenos animais. Com base na
anamnese e avaliação abaixo, elabore um plano terapêutico DETALHADO e ACIONÁVEL.

Anamnese: {{ followup_answers }}
Avaliação: {{ soap_a }}

Responda EXATAMENTE neste formato:

EXAMES SOLICITADOS:
- [nome do exame] — [justificativa clínica breve]
- [nome do exame] — [justificativa clínica breve]

PROTOCOLO E TRATAMENTO:
- [medicamento/conduta] — [dose, frequência, duração]
- [medicamento/conduta] — [dose, frequência, duração]

RETORNO E MONITORAMENTO:
[orientações de retorno e sinais de alerta]

Seja específico. Inclua pelo menos 3 exames e 3 condutas terapêuticas quando indicado.
```

- [ ] **Step 2: Disparar uma consulta de teste via Anamnese Guiada e verificar que o `soap_p` retornado segue o formato esperado**
