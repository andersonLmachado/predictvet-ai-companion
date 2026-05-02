# Clinical History — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o campo `clinical_history` persistente ao nível do paciente, exibido em modo editável na tela de Exames e em modo somente-leitura na ConsultationPage, com injeção automática no payload enviado ao n8n.

**Architecture:** Nova lib `clinicalHistory.ts` (queries Supabase direto) + componente `ClinicalHistoryCard` (edit/readonly) reutilizado em Exams e ConsultationPage. O payload de anamnese recebe o campo via parâmetro opcional em `buildTruncatedPayload`, truncado a 500 chars. A migration é rodada manualmente no Supabase Dashboard.

**Tech Stack:** React 18, TypeScript, Vite, Supabase client, shadcn/ui (Collapsible, Card, Textarea, Button), React Router v6, Vitest (node env).

---

## Pré-requisito: Migration Supabase (manual)

> **Executar no Supabase Dashboard → SQL Editor ANTES de rodar o app:**

```sql
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinical_history TEXT;
```

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/lib/clinicalHistory.ts` | Criar |
| `src/tests/clinicalHistory.test.ts` | Criar |
| `src/components/patient/ClinicalHistoryCard.tsx` | Criar |
| `src/lib/anamnesisApi.ts` | Modificar — tipo + param `clinicalHistory` |
| `src/tests/buildTruncatedPayload.test.ts` | Modificar — 3 novos casos |
| `src/pages/Exams.tsx` | Modificar — inserir componente |
| `src/pages/ConsultationPage.tsx` | Modificar — inserir componente + onLoad + builder |

---

## Task 1: Lib `clinicalHistory.ts` (TDD)

**Files:**
- Create: `src/lib/clinicalHistory.ts`
- Create: `src/tests/clinicalHistory.test.ts`

- [ ] **Step 1.1: Escrever os testes (falham primeiro)**

Criar `src/tests/clinicalHistory.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchClinicalHistory, saveClinicalHistory } from '../lib/clinicalHistory';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';

function makeFetchChain(result: { data: any; error: any }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
}

function makeUpdateChain(result: { error: { message: string } | null }) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  };
}

describe('fetchClinicalHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna o histórico quando preenchido', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: { clinical_history: 'Alergia a dipirona' }, error: null })
    );
    const result = await fetchClinicalHistory('pat-001');
    expect(result).toBe('Alergia a dipirona');
    expect(supabase.from).toHaveBeenCalledWith('patients');
  });

  it('retorna string vazia quando clinical_history é null', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: { clinical_history: null }, error: null })
    );
    const result = await fetchClinicalHistory('pat-002');
    expect(result).toBe('');
  });

  it('retorna string vazia quando data é null (paciente não encontrado)', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: null, error: null })
    );
    const result = await fetchClinicalHistory('pat-003');
    expect(result).toBe('');
  });

  it('lança quando Supabase retorna erro', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: null, error: { message: 'DB error' } })
    );
    await expect(fetchClinicalHistory('pat-004')).rejects.toThrow('DB error');
  });
});

describe('saveClinicalHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolve sem erro no sucesso', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(makeUpdateChain({ error: null }));
    await expect(saveClinicalHistory('pat-001', 'Texto')).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith('patients');
  });

  it('chama UPDATE com clinical_history correto', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await saveClinicalHistory('pat-002', 'Diabetes tipo 2');
    expect(chain.update).toHaveBeenCalledWith({ clinical_history: 'Diabetes tipo 2' });
  });

  it('passa o patient_id correto no eq', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await saveClinicalHistory('pat-003', 'Texto');
    expect(chain.eq).toHaveBeenCalledWith('id', 'pat-003');
  });

  it('lança quando Supabase retorna erro', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeUpdateChain({ error: { message: 'RLS violation' } })
    );
    await expect(saveClinicalHistory('pat-004', 'Texto')).rejects.toThrow('RLS violation');
  });
});
```

- [ ] **Step 1.2: Rodar os testes — confirmar que falham**

```bash
cd /home/anderson/Documentos/PredictLab/predictvet-ai-companion
npx vitest run src/tests/clinicalHistory.test.ts 2>&1 | tail -20
```

Esperado: FAIL com "Cannot find module '../lib/clinicalHistory'"

- [ ] **Step 1.3: Implementar `src/lib/clinicalHistory.ts`**

```ts
import { supabase } from '@/integrations/supabase/client';

export async function fetchClinicalHistory(patientId: string): Promise<string> {
  const { data, error } = await supabase
    .from('patients' as any)
    .select('clinical_history')
    .eq('id', patientId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as any)?.clinical_history ?? '';
}

export async function saveClinicalHistory(patientId: string, text: string): Promise<void> {
  const { error } = await supabase
    .from('patients' as any)
    .update({ clinical_history: text } as any)
    .eq('id', patientId);

  if (error) throw new Error(error.message);
}
```

- [ ] **Step 1.4: Rodar os testes — confirmar que passam**

```bash
npx vitest run src/tests/clinicalHistory.test.ts 2>&1 | tail -10
```

Esperado: `8 passed (8)`

- [ ] **Step 1.5: Rodar suite completa — sem regressões**

```bash
npx vitest run 2>&1 | tail -5
```

Esperado: todos os testes anteriores ainda passando.

- [ ] **Step 1.6: Commit**

```bash
git add src/lib/clinicalHistory.ts src/tests/clinicalHistory.test.ts
git commit -m "feat: add clinicalHistory lib with fetch and save functions"
```

---

## Task 2: Tipo e builder — `anamnesisApi.ts` (TDD)

**Files:**
- Modify: `src/lib/anamnesisApi.ts`
- Modify: `src/tests/buildTruncatedPayload.test.ts`

- [ ] **Step 2.1: Adicionar 3 casos de teste ao arquivo existente**

Abrir `src/tests/buildTruncatedPayload.test.ts` e adicionar no final do arquivo (dentro de `describe('buildTruncatedPayload', ...)` ou após os testes existentes):

```ts
describe('clinical_history injection', () => {
  it('inclui clinical_history no payload quando preenchido', () => {
    const result = buildTruncatedPayload({
      consultationId: 'c1',
      patientId: 'p1',
      chiefComplaint: 'tosse',
      followupAnswers: [],
      transcription: '',
      dynamicAnswers: [],
      clinicalHistory: 'Diabetes tipo 2',
    });
    expect(result.clinical_history).toBe('Diabetes tipo 2');
  });

  it('omite clinical_history quando vazio', () => {
    const result = buildTruncatedPayload({
      consultationId: 'c1',
      patientId: 'p1',
      chiefComplaint: 'tosse',
      followupAnswers: [],
      transcription: '',
      dynamicAnswers: [],
      clinicalHistory: '',
    });
    expect(result.clinical_history).toBeUndefined();
  });

  it('trunca clinical_history para 500 chars', () => {
    const longText = 'A'.repeat(600);
    const result = buildTruncatedPayload({
      consultationId: 'c1',
      patientId: 'p1',
      chiefComplaint: 'tosse',
      followupAnswers: [],
      transcription: '',
      dynamicAnswers: [],
      clinicalHistory: longText,
    });
    expect(result.clinical_history).toHaveLength(500);
  });
});
```

- [ ] **Step 2.2: Rodar para confirmar falha**

```bash
npx vitest run src/tests/buildTruncatedPayload.test.ts 2>&1 | tail -15
```

Esperado: FAIL nos 3 novos casos (campo não existe ainda).

- [ ] **Step 2.3: Atualizar `ExtendedAnamnesisPayload` em `src/lib/anamnesisApi.ts`**

Localizar a interface e adicionar o campo:

```ts
export interface ExtendedAnamnesisPayload extends AnamnesisPayload {
  respostas_truncadas?: true;
  weight_kg?: number | null;
  temperature_c?: number | null;
  clinical_history?: string;
}
```

- [ ] **Step 2.4: Atualizar assinatura de `buildTruncatedPayload`**

Adicionar `clinicalHistory?: string` ao objeto de parâmetros:

```ts
export function buildTruncatedPayload(params: {
  consultationId: string;
  patientId: string;
  chiefComplaint: string;
  followupAnswers: FollowUpAnswer[];
  transcription: string;
  dynamicAnswers: FollowUpAnswer[];
  weightKg?: number | null;
  temperatureC?: number | null;
  clinicalHistory?: string;
}): ExtendedAnamnesisPayload {
```

- [ ] **Step 2.5: Adicionar lógica de injeção no corpo do builder**

Logo antes do `return result` (linha final da função), adicionar:

```ts
if (params.clinicalHistory) {
  result.clinical_history = params.clinicalHistory.slice(0, 500);
}

return result;
```

- [ ] **Step 2.6: Rodar testes — confirmar que passam**

```bash
npx vitest run src/tests/buildTruncatedPayload.test.ts 2>&1 | tail -10
```

Esperado: todos os casos passam (incluindo os 3 novos).

- [ ] **Step 2.7: Suite completa**

```bash
npx vitest run 2>&1 | tail -5
```

Esperado: sem regressões.

- [ ] **Step 2.8: Commit**

```bash
git add src/lib/anamnesisApi.ts src/tests/buildTruncatedPayload.test.ts
git commit -m "feat: add clinical_history to anamnesis payload (truncated 500 chars)"
```

---

## Task 3: Componente `ClinicalHistoryCard.tsx`

> **IMPORTANTE:** Antes de escrever JSX, invocar o skill `predictvet-design-system` via Skill tool para garantir conformidade com o design system PredictVet. O código abaixo usa tokens shadcn padrão — ajustar conforme o skill indicar.

**Files:**
- Create: `src/components/patient/ClinicalHistoryCard.tsx`

- [ ] **Step 3.1: Criar o arquivo do componente**

Criar `src/components/patient/ClinicalHistoryCard.tsx` com o conteúdo completo abaixo:

```tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronDown, Save } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchClinicalHistory, saveClinicalHistory } from '@/lib/clinicalHistory';

export interface ClinicalHistoryCardProps {
  patientId: string;
  mode: 'edit' | 'readonly';
  onLoad?: (text: string) => void;
}

const ClinicalHistoryCard: React.FC<ClinicalHistoryCardProps> = ({
  patientId,
  mode,
  onLoad,
}) => {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    setIsLoading(true);
    setText('');
    setOpen(false);
    fetchClinicalHistory(patientId)
      .then((value) => {
        setText(value);
        setOpen(value.trim().length > 0);
        onLoad?.(value);
      })
      .catch(() => {
        onLoad?.('');
      })
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalHistory(patientId, text);
      toast({ title: 'Histórico salvo', description: 'O histórico clínico foi atualizado.' });
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === 'readonly') {
    if (isLoading || !text.trim()) return null;
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="py-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              Histórico Clínico
            </div>
            <Link
              to={`/patient/${patientId}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              Editar histórico
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex items-center gap-2 w-full text-left py-1">
          <ClipboardList className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium">
            {text.trim() ? 'Histórico Clínico' : 'Adicionar histórico clínico'}
          </span>
          <ChevronDown
            className={`h-4 w-4 ml-auto text-muted-foreground transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        <p className="text-xs text-muted-foreground">
          Alergias, doenças preexistentes, medicamentos em uso
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-y"
          placeholder="Ex: Alergia a dipirona, diabetes mellitus tipo 2, uso contínuo de insulina 0,5 UI/kg..."
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            variant="secondary"
            size="sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar histórico'}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ClinicalHistoryCard;
```

- [ ] **Step 3.2: Verificar build TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Esperado: sem erros. Se aparecer erro em `CollapsibleTrigger asChild`, verificar a API do componente em `src/components/ui/collapsible.tsx` e ajustar.

- [ ] **Step 3.3: Build completo**

```bash
npx vite build 2>&1 | tail -10
```

Esperado: `✓ built in ...`

- [ ] **Step 3.4: Commit**

```bash
git add src/components/patient/ClinicalHistoryCard.tsx
git commit -m "feat: add ClinicalHistoryCard component (edit/readonly modes)"
```

---

## Task 4: Integrar no `Exams.tsx`

**Files:**
- Modify: `src/pages/Exams.tsx`

- [ ] **Step 4.1: Adicionar import do componente**

No topo de `src/pages/Exams.tsx`, adicionar junto aos outros imports de componentes:

```ts
import ClinicalHistoryCard from '@/components/patient/ClinicalHistoryCard';
```

- [ ] **Step 4.2: Inserir o componente no JSX**

Localizar o bloco condicional `{selectedPatient && (...)}` que contém o campo "Contexto clínico do exame" (id="vet-notes"). Inserir `ClinicalHistoryCard` **antes** desse campo:

```tsx
{selectedPatient && (
  <>
    <ClinicalHistoryCard mode="edit" patientId={selectedPatientId} />

    {/* Contexto deste exame — específico por análise */}
    <div className="space-y-2">
      <Label htmlFor="vet-notes" className="text-sm font-medium flex items-center gap-2">
        <NotebookPen className="h-4 w-4" />
        Contexto deste exame
      </Label>
      <Textarea
        id="vet-notes"
        placeholder="Ex: Histórico do paciente, motivo da solicitação, medicamentos em uso..."
        value={vetNotes}
        onChange={(e) => setVetNotes(e.target.value)}
        rows={3}
        className="resize-y"
      />
    </div>
  </>
)}
```

> Atenção: o label do campo `vet_notes` muda de "Contexto clínico do exame" para **"Contexto deste exame"** para diferenciar dos dois campos.

- [ ] **Step 4.3: Build e testes**

```bash
npx vite build 2>&1 | tail -5
npx vitest run 2>&1 | tail -5
```

Esperado: build limpo, todos os testes passando.

- [ ] **Step 4.4: Commit**

```bash
git add src/pages/Exams.tsx
git commit -m "feat: add ClinicalHistoryCard to Exams page"
```

---

## Task 5: Integrar no `ConsultationPage.tsx`

**Files:**
- Modify: `src/pages/ConsultationPage.tsx`

- [ ] **Step 5.1: Adicionar imports**

No topo de `src/pages/ConsultationPage.tsx`, adicionar:

```ts
import ClinicalHistoryCard from '@/components/patient/ClinicalHistoryCard';
```

- [ ] **Step 5.2: Adicionar estado para capturar o histórico via `onLoad`**

Dentro do componente `ConsultationPage`, adicionar após os states existentes:

```ts
const [clinicalHistory, setClinicalHistory] = useState('');
```

- [ ] **Step 5.3: Inserir `ClinicalHistoryCard` no JSX antes do stepper**

Localizar o `ConsultationStepper` no retorno JSX de `ConsultationPage` e inserir o card imediatamente antes dele:

```tsx
{selectedPatient && (
  <ClinicalHistoryCard
    mode="readonly"
    patientId={selectedPatient.id}
    onLoad={setClinicalHistory}
  />
)}
<ConsultationStepper ... />
```

> Se o patient vem de `useParams` (patientId), usar `patientId` diretamente:
> ```tsx
> {patientId && (
>   <ClinicalHistoryCard
>     mode="readonly"
>     patientId={patientId}
>     onLoad={setClinicalHistory}
>   />
> )}
> ```

- [ ] **Step 5.4: Passar `clinicalHistory` ao `buildTruncatedPayload`**

Localizar a chamada a `buildTruncatedPayload` em `ConsultationPage.tsx` e adicionar o parâmetro:

```ts
const payload = buildTruncatedPayload({
  consultationId: session.consultationId,
  patientId: selectedPatient?.id ?? patientId ?? '',
  chiefComplaint: session.chiefComplaint,
  followupAnswers: session.followupAnswers,
  transcription: session.transcription,
  dynamicAnswers,
  clinicalHistory: clinicalHistory || undefined,
});
```

> A chamada exata pode diferir — localizar onde `buildTruncatedPayload` é chamado no arquivo e adicionar apenas `clinicalHistory: clinicalHistory || undefined`.

- [ ] **Step 5.5: Build e testes**

```bash
npx vite build 2>&1 | tail -5
npx vitest run 2>&1 | tail -5
```

Esperado: build limpo, todos os testes passando.

- [ ] **Step 5.6: Commit**

```bash
git add src/pages/ConsultationPage.tsx
git commit -m "feat: show ClinicalHistoryCard in ConsultationPage and inject in payload"
```

---

## Task 6: Verificação visual no navegador

- [ ] **Step 6.1: Iniciar servidor de desenvolvimento**

```bash
npx vite --port 8080
```

- [ ] **Step 6.2: Verificar tela de Exames**

1. Selecionar um paciente
2. Confirmar que o card "Adicionar histórico clínico" aparece (colapsado) antes do "Contexto deste exame"
3. Expandir, preencher texto e clicar "Salvar histórico"
4. Toast "Histórico salvo" deve aparecer
5. Trocar de paciente: card deve resetar e carregar o histórico do novo paciente
6. Voltar ao paciente anterior: histórico salvo deve aparecer e card abrir automaticamente

- [ ] **Step 6.3: Verificar ConsultationPage**

1. Navegar para uma consulta de um paciente com histórico preenchido
2. Confirmar que o card readonly aparece antes do stepper com o texto salvo
3. Navegar para consulta de paciente SEM histórico: confirmar que nada aparece

- [ ] **Step 6.4: Verificar link "Editar histórico"**

No card readonly, clicar "Editar histórico" e confirmar que navega para `/patient/:id`.

---

## Task 7: n8n — instrução manual

> Esta tarefa é executada **manualmente no n8n UI** — não há mudança de código.

- [ ] **Step 7.1: Acessar o workflow `anamnese-soap` no n8n**

- [ ] **Step 7.2: No nó OpenAI S (Subjective), adicionar ao system prompt:**

```
{{#if clinical_history}}
Histórico clínico permanente do paciente:
{{ clinical_history }}
{{/if}}
```

Posicionar antes das respostas da anamnese.

- [ ] **Step 7.3: Repetir no nó OpenAI A (Assessment)**

Mesmo bloco, mesma posição.

> A sintaxe exata depende do template engine configurado no nó — adaptar para Jinja2/expression conforme necessário.

---

## Checklist Final

- [ ] `npx vitest run` — todos os testes passam (incluindo 8 novos de `clinicalHistory.test.ts` e 3 de `buildTruncatedPayload.test.ts`)
- [ ] Build sem erros TypeScript
- [ ] Card editável aparece na tela de Exames antes do "Contexto deste exame"
- [ ] Histórico salvo persiste ao trocar e voltar para o mesmo paciente
- [ ] Card readonly invisível quando histórico vazio (ConsultationPage)
- [ ] Card readonly visível com conteúdo quando preenchido
- [ ] `clinical_history` presente no payload enviado ao n8n quando preenchido
- [ ] `clinical_history` ausente do payload quando vazio
- [ ] Truncamento a 500 chars funcionando (coberto por teste)
- [ ] n8n atualizado manualmente (Task 7)
