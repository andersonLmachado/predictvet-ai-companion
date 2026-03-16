# Dynamic Anamnesis Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir o fluxo de Anamnese Guiada adicionando identificação de categorias clínicas via OpenAI, busca de perguntas dinâmicas no Supabase e um fluxo conversacional de Q&A como 4º passo do stepper.

**Architecture:** O `sessionReducer` ganha apenas um novo action type (`ADVANCE_TO_DYNAMIC`). Toda a lógica da fase dinâmica vive em `useDynamicAnamnesis`, que reside dentro de `DynamicAnamnesisStep` — componente que só monta quando `step === 3`. O webhook é chamado ao final do step 3 via `handleFinalSubmit` no `ConsultationPage`.

**Tech Stack:** React, Vitest, Supabase (`@supabase/supabase-js`), OpenAI REST API (`VITE_OPENAI_API_KEY`), Tailwind CSS, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-15-dynamic-anamnesis-design.md`

---

## Chunk 1: Foundation — Branch, Reducer, Payload, OpenAI Parser

### Task 1: Criar a branch de feature

**Files:**
- No files modified — apenas criação da branch

- [ ] **Step 1: Criar e checar a branch**

```bash
git checkout -b feat/dynamic-anamnesis
git status
```

Esperado: branch `feat/dynamic-anamnesis` criada a partir de `main`.

---

### Task 2: Adicionar `ADVANCE_TO_DYNAMIC` ao `sessionReducer`

**Files:**
- Modify: `src/lib/consultationSession.ts`
- Modify: `src/tests/consultationSession.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Abrir `src/tests/consultationSession.test.ts` e adicionar no final do arquivo (após o bloco `RESET`):

```typescript
// ─── ADVANCE_TO_DYNAMIC ──────────────────────────────────────────────────────

describe('ADVANCE_TO_DYNAMIC', () => {
  it('avança step de 2 para 3 preservando complaint, followupAnswers e transcription', () => {
    const atStep2: ConsultationSession = {
      ...initialSession,
      step: 2,
      complaint: mockComplaint,
      followupAnswers: [mockAnswer],
      transcription: 'Animal apático desde ontem.',
    };

    const next = sessionReducer(atStep2, { type: 'ADVANCE_TO_DYNAMIC' });

    expect(next.step).toBe(3);
    expect(next.complaint).toEqual(mockComplaint);
    expect(next.followupAnswers).toHaveLength(1);
    expect(next.transcription).toBe('Animal apático desde ontem.');
    expect(next.submitStatus).toBe('idle');
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
npm test -- consultationSession
```

Esperado: FAIL — `sessionReducer` não reconhece `'ADVANCE_TO_DYNAMIC'`. (O arquivo já tem 13 testes passando — o novo virá como o 14º.)

- [ ] **Step 3: Implementar a action em `consultationSession.ts`**

Localizar o union `SessionAction` (linha 26) e adicionar o novo tipo:

```typescript
export type SessionAction =
  | { type: 'SELECT_COMPLAINT'; payload: Complaint }
  | { type: 'ANSWER_FOLLOWUP'; payload: FollowUpAnswer }
  | { type: 'SET_TRANSCRIPTION'; payload: string }
  | { type: 'BACK' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'ADVANCE_TO_DYNAMIC' }
  | { type: 'RESET' };
```

Localizar o `switch` no reducer (após o `case 'SET_TRANSCRIPTION'`) e adicionar:

```typescript
    case 'ADVANCE_TO_DYNAMIC':
      return { ...state, step: 3 };
```

- [ ] **Step 4: Rodar todos os testes do session para confirmar 14 passando**

```bash
npm test -- consultationSession
```

Esperado: 14 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/consultationSession.ts src/tests/consultationSession.test.ts
git commit -m "feat: add ADVANCE_TO_DYNAMIC action to sessionReducer"
```

---

### Task 3: Adicionar `buildTruncatedPayload` e `ExtendedAnamnesisPayload` ao `anamnesisApi.ts`

**Files:**
- Modify: `src/lib/anamnesisApi.ts`
- Create: `src/tests/buildTruncatedPayload.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/tests/buildTruncatedPayload.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildTruncatedPayload } from '../lib/anamnesisApi';

const BASE_PARAMS = {
  consultationId: 'uuid-123',
  patientId: 'patient-456',
  chiefComplaint: 'Vômito persistente',
  followupAnswers: [],
  transcription: 'Animal com vômito há 2 dias.',
  dynamicAnswers: [],
};

describe('buildTruncatedPayload', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('caso normal: payload sem truncamento e sem flag', () => {
    const result = buildTruncatedPayload(BASE_PARAMS);

    expect(result.consultation_id).toBe('uuid-123');
    expect(result.patient_id).toBe('patient-456');
    expect(result.chief_complaint).toBe('Vômito persistente');
    expect(result.transcription).toBe('Animal com vômito há 2 dias.');
    expect(result.followup_answers).toEqual([]);
    expect(result.respostas_truncadas).toBeUndefined();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('transcription longa: trunca a 500 chars e chama console.warn', () => {
    const longText = 'x'.repeat(600);
    const result = buildTruncatedPayload({ ...BASE_PARAMS, transcription: longText });

    expect(result.transcription).toHaveLength(500);
    expect(console.warn).toHaveBeenCalled();
  });

  it('answer longa: trunca cada answer a 300 chars e chama console.warn', () => {
    const longAnswer = { question: 'Pergunta?', answer: 'a'.repeat(400) };
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      followupAnswers: [longAnswer],
    });

    expect(result.followup_answers[0].answer).toHaveLength(300);
    expect(console.warn).toHaveBeenCalled();
  });

  it('followup_answers estoura 2000 chars: remove últimas e adiciona flag', () => {
    const longAnswers = Array.from({ length: 10 }, (_, i) => ({
      question: `Pergunta ${i}?`,
      answer: 'a'.repeat(280),
    }));

    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      followupAnswers: longAnswers,
    });

    expect(JSON.stringify(result.followup_answers).length).toBeLessThanOrEqual(2000);
    expect(result.respostas_truncadas).toBe(true);
    expect(result.followup_answers.length).toBeLessThan(10);
    expect(console.warn).toHaveBeenCalled();
  });

  it('dynamicAnswers merged: 1 followup + 2 dynamic resulta em array com 3 itens na ordem correta', () => {
    const followup = { question: 'Estático?', answer: 'Sim' };
    const dyn1 = { question: 'Dinâmica 1?', answer: 'Não' };
    const dyn2 = { question: 'Dinâmica 2?', answer: 'Não sei' };

    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      followupAnswers: [followup],
      dynamicAnswers: [dyn1, dyn2],
    });

    expect(result.followup_answers).toHaveLength(3);
    expect(result.followup_answers[0]).toEqual(followup);
    expect(result.followup_answers[1]).toEqual(dyn1);
    expect(result.followup_answers[2]).toEqual(dyn2);
  });

  it('arrays vazios: followup_answers vazio sem flag', () => {
    const result = buildTruncatedPayload(BASE_PARAMS);

    expect(result.followup_answers).toEqual([]);
    expect(result.respostas_truncadas).toBeUndefined();
  });

  it('answer concatenada: resposta com mais de 300 chars após concatenação é truncada', () => {
    const answer = { question: 'Tem dor?', answer: `Sim — ${'detalhe '.repeat(60)}` };
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      dynamicAnswers: [answer],
    });

    expect(result.followup_answers[0].answer).toHaveLength(300);
    expect(console.warn).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npm test -- buildTruncatedPayload
```

Esperado: FAIL — `buildTruncatedPayload` não existe.

- [ ] **Step 3: Implementar em `anamnesisApi.ts`**

Adicionar no início do arquivo (após os tipos existentes):

```typescript
export interface ExtendedAnamnesisPayload extends AnamnesisPayload {
  respostas_truncadas?: true; // flag literal: apenas presente (true) quando truncamento ocorreu; omitida caso contrário
}
```

Adicionar a função `buildTruncatedPayload` após `buildAnamnesisPayload`:

```typescript
// ─── Truncated payload builder ────────────────────────────────────────────────

export function buildTruncatedPayload(params: {
  consultationId: string;
  patientId: string;
  chiefComplaint: string;
  followupAnswers: FollowUpAnswer[];
  transcription: string;
  dynamicAnswers: FollowUpAnswer[];
}): ExtendedAnamnesisPayload {
  let { transcription } = params;

  if (transcription.length > 500) {
    console.warn('[buildTruncatedPayload] transcription truncado de', transcription.length, 'para 500 chars');
    transcription = transcription.slice(0, 500);
  }

  const truncateAnswer = (ans: FollowUpAnswer): FollowUpAnswer => {
    if (ans.answer.length > 300) {
      console.warn('[buildTruncatedPayload] answer truncado de', ans.answer.length, 'para 300 chars');
      return { ...ans, answer: ans.answer.slice(0, 300) };
    }
    return ans;
  };

  let followup_answers: FollowUpAnswer[] = [
    ...params.followupAnswers.map(truncateAnswer),
    ...params.dynamicAnswers.map(truncateAnswer),
  ];

  const result: ExtendedAnamnesisPayload = {
    consultation_id: params.consultationId,
    patient_id: params.patientId,
    chief_complaint: params.chiefComplaint,
    followup_answers,
    transcription,
  };

  if (JSON.stringify(followup_answers).length > 2000) {
    while (followup_answers.length > 0 && JSON.stringify(followup_answers).length > 2000) {
      followup_answers = followup_answers.slice(0, -1);
    }
    console.warn('[buildTruncatedPayload] followup_answers truncado para', followup_answers.length, 'itens');
    result.followup_answers = followup_answers;
    result.respostas_truncadas = true;
  }

  return result;
}
```

**Nota:** A assinatura de `sendAnamnesisPayload` não precisa ser alterada. Como `ExtendedAnamnesisPayload extends AnamnesisPayload`, o TypeScript aceita o tipo estendido onde `AnamnesisPayload` é esperado (subtipagem estrutural).

- [ ] **Step 4: Rodar os testes para confirmar 7 passando**

```bash
npm test -- buildTruncatedPayload
```

Esperado: 7 testes PASS.

- [ ] **Step 5: Confirmar que os 9 testes de anamnesisApi continuam passando**

```bash
npm test -- anamnesisApi
```

Esperado: 9 testes PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/anamnesisApi.ts src/tests/buildTruncatedPayload.test.ts
git commit -m "feat: add buildTruncatedPayload and ExtendedAnamnesisPayload"
```

---

### Task 4: Criar `parseOpenAICategories`

**Files:**
- Create: `src/lib/openaiCategories.ts`
- Create: `src/tests/openaiCategories.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/tests/openaiCategories.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseOpenAICategories, VALID_CATEGORIES } from '../lib/openaiCategories';

describe('parseOpenAICategories', () => {
  it('JSON válido retorna array filtrado e limitado', () => {
    const result = parseOpenAICategories('["Trato Urinário", "Cardiovascular"]');
    expect(result).toEqual(['Trato Urinário', 'Cardiovascular']);
  });

  it('JSON com markdown fence é parseado corretamente (strip aplicado)', () => {
    const result = parseOpenAICategories('```json\n["Neurologia"]\n```');
    expect(result).toEqual(['Neurologia']);
  });

  it('string vazia retorna array vazio', () => {
    expect(parseOpenAICategories('')).toEqual([]);
  });

  it('JSON não-array retorna array vazio', () => {
    expect(parseOpenAICategories('"Trato Urinário"')).toEqual([]);
  });

  it('mais de 3 categorias válidas retorna apenas as 3 primeiras', () => {
    const fourValid = JSON.stringify(VALID_CATEGORIES.slice(0, 4));
    const result = parseOpenAICategories(fourValid);
    expect(result).toHaveLength(3);
  });

  it('categoria inválida é filtrada, válidas permanecem', () => {
    const result = parseOpenAICategories('["Trato Urinário", "Categoria Inexistente"]');
    expect(result).toEqual(['Trato Urinário']);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npm test -- openaiCategories
```

Esperado: FAIL — módulo não existe.

- [ ] **Step 3: Criar `src/lib/openaiCategories.ts`**

```typescript
// ─── Valid categories ─────────────────────────────────────────────────────────

export const VALID_CATEGORIES = [
  'Ambiente e Estilo de Vida',
  'Cardiovascular',
  'Comportamento e Atividade',
  'Dieta e Hábitos',
  'Doenças infecciosas',
  'Endócrino e Metabolismo',
  'Filhotes e Neonatos',
  'Hematologia e Doenças Imunomediadas',
  'Histórico Médico',
  'Imunologia e Imunoprofilaxia',
  'Informações Gerais do Animal',
  'Neurologia',
  'Nutrição Clínica para Cães e Gatos',
  'Oncologia',
  'Parasitologia',
  'Sinais Clínicos',
  'Sintomas Específicos',
  'Sistema Genital e Reprodutor',
  'Sistema Respiratório',
  'Sistema digestório',
  'Toxicologia',
  'Trato Urinário',
] as const;

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parses the OpenAI response text into an array of valid clinical categories.
 * - Strips markdown fences before parsing
 * - Returns [] on any parse error or non-array response
 * - Filters out categories not in validCategories
 * - Limits result to 3 items
 */
export function parseOpenAICategories(
  text: string,
  validCategories: string[] = [...VALID_CATEGORIES]
): string[] {
  if (!text) return [];

  const stripped = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return (parsed as unknown[])
    .filter((item): item is string => typeof item === 'string')
    .filter((cat) => validCategories.includes(cat))
    .slice(0, 3);
}
```

- [ ] **Step 4: Rodar os testes para confirmar 6 passando**

```bash
npm test -- openaiCategories
```

Esperado: 6 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/openaiCategories.ts src/tests/openaiCategories.test.ts
git commit -m "feat: add parseOpenAICategories with markdown strip and category validation"
```

---

## Chunk 2: Hooks — Supabase + Orchestration

### Task 5: Criar `useSupabaseQuestions`

> **Nota sobre tipos Supabase:** A tabela `perguntas_anamnese` pode não estar presente nos tipos gerados em `src/integrations/supabase/types.ts`. Nesse caso, o hook usa a interface hand-rolled `SupabaseQuestion` em vez do tipo gerado — decisão consciente para não bloquear o desenvolvimento enquanto os tipos não são regenerados. O `supabase.from('perguntas_anamnese')` retornará `any` sem a tipagem gerada, o que é aceitável para MVP.

**Files:**
- Create: `src/hooks/useSupabaseQuestions.ts`
- Create: `src/tests/useSupabaseQuestions.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/tests/useSupabaseQuestions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSupabaseQuestions } from '../hooks/useSupabaseQuestions';

// Mock Supabase client
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../integrations/supabase/client';

const mockSupabase = supabase as unknown as {
  from: ReturnType<typeof vi.fn>;
};

const buildChain = (returnValue: { data: unknown; error: unknown }) => ({
  select: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue(returnValue),
});

describe('useSupabaseQuestions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('retorno normal: carrega perguntas corretamente', async () => {
    const mockData = [
      { pergunta: 'Animal urina com sangue?', agrupamento: 'Trato Urinário' },
      { pergunta: 'Aumentou a frequência?', agrupamento: 'Trato Urinário' },
    ];
    mockSupabase.from.mockReturnValue(buildChain({ data: mockData, error: null }));

    const { result } = renderHook(() =>
      useSupabaseQuestions(['Trato Urinário'])
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.questions).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('retorno vazio: questions é array vazio sem erro', async () => {
    mockSupabase.from.mockReturnValue(buildChain({ data: [], error: null }));

    const { result } = renderHook(() =>
      useSupabaseQuestions(['Cardiovascular'])
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.questions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('erro do Supabase: error é preenchido e questions vazio', async () => {
    mockSupabase.from.mockReturnValue(
      buildChain({ data: null, error: { message: 'DB error' } })
    );

    const { result } = renderHook(() =>
      useSupabaseQuestions(['Neurologia'])
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.questions).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('categories vazio: não executa query, retorna estado inicial imediato', async () => {
    const { result } = renderHook(() => useSupabaseQuestions([]));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(result.current.questions).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npm test -- useSupabaseQuestions
```

Esperado: FAIL — módulo não existe.

- [ ] **Step 3: Criar `src/hooks/useSupabaseQuestions.ts`**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseQuestion {
  pergunta: string;
  agrupamento: string;
}

interface UseSupabaseQuestionsResult {
  questions: SupabaseQuestion[];
  loading: boolean;
  error: Error | null;
}

export function useSupabaseQuestions(categories: string[]): UseSupabaseQuestionsResult {
  const [questions, setQuestions] = useState<SupabaseQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const categoriesKey = categories.join(',');

  useEffect(() => {
    if (categories.length === 0) {
      setQuestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('perguntas_anamnese')
          .select('pergunta, agrupamento')
          .in('agrupamento', categories)
          .eq('ativo', true)
          .order('agrupamento')
          .order('id')
          .limit(8);

        if (supabaseError) throw new Error(supabaseError.message);

        if (!cancelled) {
          setQuestions((data as SupabaseQuestion[]) ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Erro ao buscar perguntas'));
          setLoading(false);
        }
      }
    };

    fetchQuestions();

    return () => {
      cancelled = true;
    };
  }, [categoriesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { questions, loading, error };
}
```

- [ ] **Step 4: Rodar os testes para confirmar 4 passando**

```bash
npm test -- useSupabaseQuestions
```

Esperado: 4 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSupabaseQuestions.ts src/tests/useSupabaseQuestions.test.ts
git commit -m "feat: add useSupabaseQuestions hook with Supabase anon client"
```

---

### Task 6: Criar `useDynamicAnamnesis`

**Files:**
- Create: `src/hooks/useDynamicAnamnesis.ts`
- Create: `src/tests/useDynamicAnamnesis.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/tests/useDynamicAnamnesis.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDynamicAnamnesis } from '../hooks/useDynamicAnamnesis';

// Mock openaiCategories
vi.mock('../lib/openaiCategories', () => ({
  parseOpenAICategories: vi.fn(),
  VALID_CATEGORIES: ['Trato Urinário', 'Neurologia'],
}));

// Mock useSupabaseQuestions
vi.mock('../hooks/useSupabaseQuestions', () => ({
  useSupabaseQuestions: vi.fn(),
}));

import { parseOpenAICategories } from '../lib/openaiCategories';
import { useSupabaseQuestions } from '../hooks/useSupabaseQuestions';

const mockParseOpenAI = parseOpenAICategories as ReturnType<typeof vi.fn>;
const mockUseSupabase = useSupabaseQuestions as ReturnType<typeof vi.fn>;

const mockQuestions = [
  { pergunta: 'Animal urina com sangue?', agrupamento: 'Trato Urinário' },
  { pergunta: 'Aumentou a frequência?', agrupamento: 'Trato Urinário' },
];

describe('useDynamicAnamnesis', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_OPENAI_API_KEY', 'sk-test-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('happy path: categorias encontradas, perguntas carregadas, phase = questions', async () => {
    mockParseOpenAI.mockReturnValue(['Trato Urinário']);
    mockUseSupabase.mockReturnValue({
      questions: mockQuestions,
      loading: false,
      error: null,
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Trato Urinário"]' } }],
      }),
    }));

    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useDynamicAnamnesis('Animal com sangue na urina', onFinish)
    );

    await waitFor(() => expect(result.current.phase).toBe('questions'));

    expect(result.current.questions).toHaveLength(2);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('OpenAI falha: onFinish([]) chamado imediatamente', async () => {
    mockUseSupabase.mockReturnValue({ questions: [], loading: false, error: null });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const onFinish = vi.fn();
    renderHook(() => useDynamicAnamnesis('relato qualquer', onFinish));

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([]));
  });

  it('Supabase retorna vazio: onFinish([]) chamado', async () => {
    mockParseOpenAI.mockReturnValue(['Neurologia']);
    mockUseSupabase.mockReturnValue({ questions: [], loading: false, error: null });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["Neurologia"]' } }],
      }),
    }));

    const onFinish = vi.fn();
    renderHook(() => useDynamicAnamnesis('animal letárgico', onFinish));

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([]));
  });

  it('categories vazio após parse: onFinish([]) chamado sem chamar Supabase', async () => {
    mockParseOpenAI.mockReturnValue([]);
    mockUseSupabase.mockReturnValue({ questions: [], loading: false, error: null });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '[]' } }],
      }),
    }));

    const onFinish = vi.fn();
    renderHook(() => useDynamicAnamnesis('sem sintoma claro', onFinish));

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([]));
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npm test -- useDynamicAnamnesis
```

Esperado: FAIL — módulo não existe.

- [ ] **Step 3: Criar `src/hooks/useDynamicAnamnesis.ts`**

```typescript
import { useState, useEffect, useRef } from 'react';
import { parseOpenAICategories } from '@/lib/openaiCategories';
import { useSupabaseQuestions, type SupabaseQuestion } from './useSupabaseQuestions';
import type { FollowUpAnswer } from '@/lib/anamnesisApi';

export type DynamicPhase = 'loading' | 'questions' | 'submitting' | 'done';

interface UseDynamicAnamnesisResult {
  phase: DynamicPhase;
  questions: SupabaseQuestion[];
  currentIndex: number;
  selectedButton: 'Sim' | 'Não' | 'Não sei' | null;
  detailText: string;
  setSelectedButton: (btn: 'Sim' | 'Não' | 'Não sei') => void;
  setDetailText: (text: string) => void;
  submitAnswer: () => void;
  skipQuestion: () => void;
}

export function useDynamicAnamnesis(
  transcription: string,
  onFinish: (answers: FollowUpAnswer[]) => void
): UseDynamicAnamnesisResult {
  // useRef keeps onFinish always current without adding it to effect deps,
  // preventing stale closure issues in React 18 Strict Mode double-mount.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const [categories, setCategories] = useState<string[]>([]);
  const [openaiDone, setOpenaiDone] = useState(false);
  const [phase, setPhase] = useState<DynamicPhase>('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<FollowUpAnswer[]>([]);
  const [selectedButton, setSelectedButton] = useState<'Sim' | 'Não' | 'Não sei' | null>(null);
  const [detailText, setDetailText] = useState('');

  const { questions, loading: questionsLoading, error: questionsError } = useSupabaseQuestions(
    openaiDone ? categories : []
  );

  // OpenAI call — runs once on mount
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      setOpenaiDone(true);
      return;
    }

    const callOpenAI = async () => {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'Você é um assistente veterinário clínico.' },
              {
                role: 'user',
                content: `Dado o seguinte relato sobre um animal: '${transcription}'\nIdentifique quais categorias clínicas são relevantes para aprofundar a anamnese.\nResponda APENAS com um array JSON puro com os nomes exatos das categorias, sem markdown, sem explicações.\nExemplo de resposta válida: ["Trato Urinário", "Cardiovascular"]\nRetorne no máximo 3 categorias.\n\nCategorias disponíveis:\nAmbiente e Estilo de Vida, Cardiovascular, Comportamento e Atividade, Dieta e Hábitos, Doenças infecciosas, Endócrino e Metabolismo, Filhotes e Neonatos, Hematologia e Doenças Imunomediadas, Histórico Médico, Imunologia e Imunoprofilaxia, Informações Gerais do Animal, Neurologia, Nutrição Clínica para Cães e Gatos, Oncologia, Parasitologia, Sinais Clínicos, Sintomas Específicos, Sistema Genital e Reprodutor, Sistema Respiratório, Sistema digestório, Toxicologia, Trato Urinário.`,
              },
            ],
            max_tokens: 100,
            temperature: 0,
          }),
        });

        if (!response.ok) throw new Error(`OpenAI respondeu ${response.status}`);

        const data = await response.json();
        const content: string = data?.choices?.[0]?.message?.content ?? '';
        setCategories(parseOpenAICategories(content));
      } catch {
        setCategories([]);
      } finally {
        setOpenaiDone(true);
      }
    };

    callOpenAI();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // After OpenAI + Supabase both resolve
  useEffect(() => {
    if (!openaiDone) return;
    if (questionsLoading) return;

    if (categories.length === 0 || questionsError || questions.length === 0) {
      onFinishRef.current([]);
      return;
    }

    setPhase('questions');
  }, [openaiDone, questionsLoading, categories.length, questionsError, questions.length]);

  const submitAnswer = () => {
    if (!selectedButton) return;

    const current = questions[currentIndex];
    const rawAnswer = detailText.trim()
      ? `${selectedButton} — ${detailText.trim()}`
      : selectedButton;
    const answer = rawAnswer.slice(0, 300);

    const newAnswers = [...answers, { question: current.pergunta, answer }];
    setAnswers(newAnswers);
    setSelectedButton(null);
    setDetailText('');

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setPhase('submitting');
      onFinish(newAnswers);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const skipQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setPhase('submitting');
      onFinish(answers);
    } else {
      setCurrentIndex(nextIndex);
    }
    setSelectedButton(null);
    setDetailText('');
  };

  return {
    phase,
    questions,
    currentIndex,
    selectedButton,
    detailText,
    setSelectedButton,
    setDetailText,
    submitAnswer,
    skipQuestion,
  };
}
```

- [ ] **Step 4: Rodar os testes para confirmar 4 passando**

```bash
npm test -- useDynamicAnamnesis
```

Esperado: 4 testes PASS.

- [ ] **Step 5: Rodar todos os testes para confirmar nenhuma regressão**

```bash
npm test
```

Esperado: 45 testes PASS (14 session + 10 api + 7 truncate + 6 categories + 4 supabase + 4 dynamic).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useDynamicAnamnesis.ts src/tests/useDynamicAnamnesis.test.ts
git commit -m "feat: add useDynamicAnamnesis orchestration hook"
```

---

## Chunk 3: UI Integration — Componente + ConsultationPage

### Task 7: Criar `DynamicAnamnesisStep`

> ⚠️ **Antes de escrever JSX:** invocar o skill `predictlab-design-system` para garantir consistência com as tokens de cor, tipografia e padrões de card do projeto.

**Files:**
- Create: `src/components/consultation/DynamicAnamnesisStep.tsx`

- [ ] **Step 1: Criar o componente**

Criar `src/components/consultation/DynamicAnamnesisStep.tsx`:

```tsx
import React from 'react';
import { SkipForward } from 'lucide-react';
import { useDynamicAnamnesis } from '@/hooks/useDynamicAnamnesis';
import type { FollowUpAnswer } from '@/lib/anamnesisApi';

interface DynamicAnamnesisStepProps {
  transcription: string;
  onFinish: (answers: FollowUpAnswer[]) => void;
}

const QUICK_REPLY_OPTIONS = ['Sim', 'Não', 'Não sei'] as const;

const DynamicAnamnesisStep: React.FC<DynamicAnamnesisStepProps> = ({
  transcription,
  onFinish,
}) => {
  const {
    phase,
    questions,
    currentIndex,
    selectedButton,
    detailText,
    setSelectedButton,
    setDetailText,
    submitAnswer,
    skipQuestion,
  } = useDynamicAnamnesis(transcription, onFinish);

  // Loading phase
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'hsl(221,73%,45%)', borderTopColor: 'transparent' }}
        />
        <p
          className="text-sm font-medium"
          style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,55%)' }}
        >
          Identificando categorias clínicas...
        </p>
      </div>
    );
  }

  // Submitting phase
  if (phase === 'submitting' || phase === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'hsl(162,70%,38%)', borderTopColor: 'transparent' }}
        />
        <p
          className="text-sm font-medium"
          style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,55%)' }}
        >
          Finalizando anamnese...
        </p>
      </div>
    );
  }

  // Questions phase
  const current = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div className="space-y-5">
      {/* Header + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(221,73%,45%)' }}
          >
            {current.agrupamento}
          </p>
          <p
            className="text-xs"
            style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,55%)' }}
          >
            Pergunta {currentIndex + 1} de {questions.length}
          </p>
        </div>
        <div
          className="h-1.5 w-full rounded-full overflow-hidden"
          style={{ background: 'hsl(217,50%,92%)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, hsl(221,73%,45%), hsl(217,88%,57%))',
            }}
          />
        </div>
      </div>

      {/* Question text */}
      <p
        className="text-base font-semibold leading-snug"
        style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
      >
        {current.pergunta}
      </p>

      {/* Quick reply buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_REPLY_OPTIONS.map((option) => {
          const isSelected = selectedButton === option;
          return (
            <button
              key={option}
              onClick={() => setSelectedButton(option)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))'
                  : 'white',
                border: isSelected
                  ? '1px solid transparent'
                  : '1px solid hsl(217,50%,85%)',
                color: isSelected ? 'white' : 'hsl(222,30%,50%)',
                boxShadow: isSelected ? '0 4px 16px -4px hsla(221,73%,45%,0.45)' : 'none',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Optional detail input */}
      <div>
        <textarea
          value={detailText}
          onChange={(e) => setDetailText(e.target.value)}
          placeholder="Detalhe adicional (opcional)..."
          rows={2}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-all"
          style={{
            background: 'hsl(213,100%,98%)',
            border: '1px solid hsl(217,50%,88%)',
            fontFamily: 'Nunito Sans, sans-serif',
            color: 'hsl(222,77%,15%)',
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={skipQuestion}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'transparent',
            border: '1px dashed hsl(217,50%,80%)',
            color: 'hsl(222,30%,60%)',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          <SkipForward className="w-3.5 h-3.5" />
          Pular
        </button>

        <button
          onClick={submitAnswer}
          disabled={!selectedButton}
          className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: selectedButton
              ? 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))'
              : 'hsl(217,50%,80%)',
            boxShadow: selectedButton ? '0 6px 24px -6px hsla(221,73%,45%,0.45)' : 'none',
            cursor: selectedButton ? 'pointer' : 'not-allowed',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default DynamicAnamnesisStep;
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

Esperado: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/components/consultation/DynamicAnamnesisStep.tsx
git commit -m "feat: add DynamicAnamnesisStep conversational component"
```

---

### Task 8: Atualizar `ConsultationPage` para integrar o step 3

**Files:**
- Modify: `src/pages/ConsultationPage.tsx`

- [ ] **Step 1: Adicionar imports no topo do arquivo**

No bloco de imports existente, adicionar:

```typescript
import { useState, useCallback, useEffect, useReducer } from 'react';
// (useState já precisará ser importado — substituir o import do React se necessário)
```

Após o import de `NarrativeInput`, adicionar:

```typescript
import DynamicAnamnesisStep from '@/components/consultation/DynamicAnamnesisStep';
import { buildTruncatedPayload } from '@/lib/anamnesisApi';
import type { FollowUpAnswer } from '@/lib/anamnesisApi';
```

- [ ] **Step 2: Atualizar a constante `STEPS` e adicionar `STEPS_WITH_DYNAMIC`**

Substituir o bloco `STEPS` existente:

```typescript
const STEPS_BASE = [
  { label: 'Queixa', description: 'Motivo da consulta' },
  { label: 'Detalhes', description: 'Perguntas clínicas' },
  { label: 'Relato', description: 'Histórico do tutor' },
];

const STEP_DYNAMIC = { label: 'Perguntas', description: 'Aprofundamento clínico' };
```

- [ ] **Step 3: Adicionar state de `dynamicAnswers` e atualizar os handlers**

Logo após `const [session, dispatch] = useReducer(...)`, adicionar:

```typescript
const [dynamicAnswers, setDynamicAnswers] = useState<FollowUpAnswer[]>([]);
```

Substituir `handleSubmit` (função atual que chama o webhook) por dois handlers novos:

```typescript
// Avança para step 3 após confirmar o relato (não chama webhook ainda)
const handleAdvanceToDynamic = useCallback(() => {
  dispatch({ type: 'ADVANCE_TO_DYNAMIC' });
}, []);

// Chamado pelo DynamicAnamnesisStep ao terminar (sucesso, skip ou erro)
const handleFinalSubmit = useCallback(
  async (dynAnswers: FollowUpAnswer[]) => {
    if (!selectedPatient || !session.complaint) return;
    setDynamicAnswers(dynAnswers);
    dispatch({ type: 'SUBMIT_START' });

    const payload = buildTruncatedPayload({
      consultationId: crypto.randomUUID(),
      patientId: selectedPatient.id,
      chiefComplaint: session.complaint.label,
      followupAnswers: session.followupAnswers,
      transcription: session.transcription,
      dynamicAnswers: dynAnswers,
    });

    const { ok, error } = await send(payload);

    if (ok) {
      dispatch({ type: 'SUBMIT_SUCCESS' });
    } else {
      dispatch({
        type: 'SUBMIT_ERROR',
        payload: error ?? 'Não foi possível enviar os dados para análise.',
      });
    }
  },
  // setDynamicAnswers is a stable React setter — incluído explicitamente para satisfazer exhaustive-deps
  [selectedPatient, session.complaint, session.followupAnswers, session.transcription, send, setDynamicAnswers]
);
```

- [ ] **Step 4: Atualizar o stepper para mostrar 4 passos no step 3**

No JSX, substituir:

```tsx
<ConsultationStepper currentStep={session.step} steps={STEPS} />
```

por:

```tsx
<ConsultationStepper
  currentStep={session.step}
  steps={session.step >= 3 ? [...STEPS_BASE, STEP_DYNAMIC] : STEPS_BASE}
/>
```

- [ ] **Step 5: Atualizar o step 2 — botão vira "Próximo" e chama `handleAdvanceToDynamic`**

No step 2, localizar o botão de submit e substituir o `onClick={handleSubmit}` por `onClick={handleAdvanceToDynamic}`, e ocultar o botão "Voltar" quando `submitStatus === 'sending'` continua igual. O botão de submit passa a ser:

```tsx
<button
  onClick={handleAdvanceToDynamic}
  disabled={!selectedPatient}
  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
  style={{
    background: !selectedPatient
      ? 'hsl(217,50%,80%)'
      : 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
    boxShadow: !selectedPatient ? 'none' : '0 6px 24px -6px hsla(221,73%,45%,0.45)',
    fontFamily: 'Nunito Sans, sans-serif',
    cursor: !selectedPatient ? 'not-allowed' : 'pointer',
  }}
>
  <ChevronRight className="w-4 h-4" />
  Próximo
</button>
```

- [ ] **Step 6: Adicionar renderização do step 3 no JSX**

Após o bloco `{session.step === 2 && ...}`, adicionar:

```tsx
{/* Step 3 — Dynamic Q&A */}
{session.step === 3 && session.submitStatus !== 'success' && (
  <>
    {session.submitStatus === 'sending' ? (
      <div className="flex flex-col items-center gap-4 py-10">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'hsl(221,73%,45%)', borderTopColor: 'transparent' }}
        />
        <p
          className="text-sm font-medium"
          style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,55%)' }}
        >
          Enviando para análise...
        </p>
      </div>
    ) : session.submitStatus === 'error' ? (
      <div className="space-y-4">
        <div
          className="flex items-start gap-3 rounded-xl p-4 text-sm"
          style={{
            background: 'hsl(352,76%,97%)',
            border: '1px solid hsl(352,76%,88%)',
            color: 'hsl(352,76%,35%)',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {session.submitError}
        </div>
        <button
          onClick={() => dispatch({ type: 'BACK' })}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: 'white',
            border: '1px solid hsl(217,50%,85%)',
            color: 'hsl(222,30%,50%)',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao relato
        </button>
      </div>
    ) : (
      <DynamicAnamnesisStep
        transcription={session.transcription}
        onFinish={handleFinalSubmit}
      />
    )}
  </>
)}
```

> **Nota:** No step 3, o botão "Voltar" global (fora do card) fica oculto — a navegação é controlada internamente. O único "Voltar" disponível é no estado de erro.

- [ ] **Step 7: Ocultar o botão "Voltar" global no step 3**

Localizar o botão "Voltar" no step 2 (ele já está dentro do bloco `session.step === 2`) — não precisa de alteração pois o step 3 usa seu próprio JSX sem botão de voltar global.

Verificar que o step 2 agora apenas chama `handleAdvanceToDynamic` e que `session.submitStatus === 'sending'` nunca ocorre no step 2 (a action SUBMIT_START só é disparada em `handleFinalSubmit`, no step 3).

- [ ] **Step 8: Verificar TypeScript sem erros**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/pages/ConsultationPage.tsx
git commit -m "feat: integrate DynamicAnamnesisStep as step 3 in ConsultationPage"
```

---

### Task 9: Regressão final e commit de finalização

**Files:**
- No new files

- [ ] **Step 1: Rodar suite completa de testes**

```bash
npm test
```

Esperado: ~45 testes PASS, 0 FAIL.

Contagem esperada por arquivo:
- `consultationSession.test.ts` → 14
- `anamnesisApi.test.ts` → 10 (baseline existente, sem novos testes)
- `buildTruncatedPayload.test.ts` → 7
- `openaiCategories.test.ts` → 6
- `useSupabaseQuestions.test.ts` → 4
- `useDynamicAnamnesis.test.ts` → 4

- [ ] **Step 2: Build de produção para confirmar sem erros de compilação**

```bash
npm run build
```

Esperado: build sem erros.

- [ ] **Step 3: Adicionar `VITE_OPENAI_API_KEY` ao `.env` (se ainda não estiver)**

Verificar se `.env` já contém a chave. Se não:

```
VITE_OPENAI_API_KEY=sk-...
```

> ⚠️ Esta chave é exposta no bundle do browser. Risco controlado para MVP — ver spec para detalhes.

- [ ] **Step 4: Commit de finalização da feature**

```bash
git add .
git commit -m "feat: complete dynamic anamnesis flow (OpenAI + Supabase + conversational Q&A)"
```

- [ ] **Step 5: Confirmar branch pronta para PR**

```bash
git log --oneline feat/dynamic-anamnesis
git diff main...feat/dynamic-anamnesis --stat
```

Esperado: 7-8 commits na branch, todos os arquivos novos e modificados listados.
