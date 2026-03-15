# Design Spec: Anamnese Dinâmica (feat/dynamic-anamnesis)

**Data:** 2026-03-15
**Branch:** `feat/dynamic-anamnesis`
**Autor:** Anderson (Tech Lead)

---

## Objetivo

Evoluir o fluxo de Anamnese Guiada para que, após o vet registrar o relato do tutor, o sistema identifique automaticamente categorias clínicas relevantes (via OpenAI) e exiba perguntas de aprofundamento dinâmicas (buscadas do Supabase) em um fluxo conversacional.

---

## Contexto: Fluxo Atual

O fluxo atual possui **3 steps** gerenciados por `sessionReducer` em `ConsultationPage`:

| Step | Componente | Descrição |
|---|---|---|
| 0 | `ComplaintSelector` | Seleção da queixa principal do `anamnesis.json` |
| 1 | `FollowUpCard` | Pergunta de follow-up estática associada à queixa |
| 2 | `NarrativeInput` | Relato livre do tutor (texto ou voz) |

Ao final do step 2, o payload é enviado diretamente ao webhook n8n.

**26 testes existentes** cobrem `anamnesisApi.test.ts` (9) e `consultationSession.test.ts` (17).

---

## Fluxo Novo

O fluxo evolui para **4 steps**, mantendo os 3 existentes intactos:

| Step | Componente | Descrição |
|---|---|---|
| 0 | `ComplaintSelector` | Sem alteração |
| 1 | `FollowUpCard` | Sem alteração |
| 2 | `NarrativeInput` | Relato truncado a 500 chars antes de qualquer processamento |
| 3 | `DynamicAnamnesisStep` *(novo)* | Perguntas dinâmicas conversacionais |

O step 2 não mais dispara o webhook diretamente. O botão de confirmação do relato passa a disparar `ADVANCE_TO_DYNAMIC`, avançando para step 3. O webhook é chamado somente ao final do step 3.

---

## Arquitetura

### Abordagem escolhida: Hook separado (`useDynamicAnamnesis`)

O `sessionReducer` permanece intacto. Um novo hook `useDynamicAnamnesis` encapsula toda a fase dinâmica e vive dentro do componente `DynamicAnamnesisStep`, que só monta quando `step === 3`.

**Garantia:** `useDynamicAnamnesis` nunca é inicializado no mount do `ConsultationPage` — somente quando o vet confirma o relato e o componente entra no DOM.

---

## Arquivos

### Novos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/openaiCategories.ts` | Função pura `parseOpenAICategories(text, validCategories?)` |
| `src/hooks/useSupabaseQuestions.ts` | Hook que executa SELECT na `perguntas_anamnese` |
| `src/hooks/useDynamicAnamnesis.ts` | Hook de orquestração: OpenAI → Supabase → iteração |
| `src/components/consultation/DynamicAnamnesisStep.tsx` | Componente da fase conversacional |
| `src/tests/openaiCategories.test.ts` | Testes da função de parse |
| `src/tests/useSupabaseQuestions.test.ts` | Testes do hook Supabase |
| `src/tests/buildTruncatedPayload.test.ts` | Testes da função de truncamento |

### Modificados

| Arquivo | O que muda |
|---|---|
| `src/lib/consultationSession.ts` | Nova action `ADVANCE_TO_DYNAMIC` (step 2 → 3) |
| `src/lib/anamnesisApi.ts` | Extrai/adiciona `buildTruncatedPayload()` com proteções |
| `src/components/consultation/ConsultationPage.tsx` | Renderiza `<DynamicAnamnesisStep>` no step 3; botão do relato despacha `ADVANCE_TO_DYNAMIC` |
| `src/components/consultation/ConsultationStepper.tsx` | Aceita `steps` dinâmico; exibe 4 passos quando `totalSteps === 4` |

### Não modificados

`ComplaintSelector`, `FollowUpCard`, `NarrativeInput`, `GuidedConsultation`, `anamnesis.json`, todos os testes existentes.

---

## Componentes

### `DynamicAnamnesisStep`

```ts
interface Props {
  transcription: string
  onComplete: (answers: FollowUpAnswer[]) => void
  onSkipAll: () => void
}
```

**Fases internas (`phase`):**

| Phase | Render |
|---|---|
| `'loading'` | Spinner: "Identificando categorias clínicas..." |
| `'questions'` | Card com pergunta, botões Sim/Não/Não sei, campo de detalhe opcional, barra de progresso, botão Pular |
| `'done'` | Dispara `onComplete(answers)` automaticamente |
| erro / vazio | Dispara `onSkipAll()` automaticamente |

**Barra de progresso:** "Pergunta X de Y" com barra visual.

**Resposta acumulada:** botão selecionado + texto do campo concatenados como `"Sim — detalhe opcional"`, truncado a 300 chars antes de acumular.

### Atualização do `ConsultationStepper`

```tsx
const steps = session.step >= 3
  ? [...STEPS_BASE, { label: 'Perguntas', description: 'Aprofundamento clínico' }]
  : STEPS_BASE
```

---

## Fluxo Assíncrono (`useDynamicAnamnesis`)

```
mount (transcription disponível via prop)
  │
  ├─ Chamada OpenAI
  │    endpoint: POST https://api.openai.com/v1/chat/completions
  │    model: gpt-3.5-turbo
  │    max_tokens: 100, temperature: 0
  │    prompt: inclui o relato e lista de categorias válidas
  │    extrai: data.choices[0].message.content
  │    parse: parseOpenAICategories(content)
  │
  │    erro (rede, parse, JSON inválido) → categories = [] → onSkipAll()
  │
  ├─ categories.length === 0 → onSkipAll()
  │
  ├─ Query Supabase
  │    SELECT pergunta, agrupamento
  │    FROM perguntas_anamnese
  │    WHERE agrupamento = ANY(categories) AND ativo = true
  │    ORDER BY agrupamento, id
  │    LIMIT 8
  │
  │    erro / retorno vazio → onSkipAll()
  │
  └─ questions carregadas → phase = 'questions'
       usuário responde uma a uma
       ao final → onComplete(answers)
```

---

## `parseOpenAICategories`

```ts
function parseOpenAICategories(
  text: string,
  validCategories?: string[]
): string[]
```

- Faz `JSON.parse(text)` — se falhar, retorna `[]`
- Verifica se o resultado é um array — se não, retorna `[]`
- Filtra apenas categorias presentes em `validCategories` (default: lista completa do prompt)
- Limita a no máximo **3 categorias**

**Categorias válidas (lista completa):**
```
Ambiente e Estilo de Vida, Cardiovascular, Comportamento e Atividade,
Dieta e Hábitos, Doenças infecciosas, Endócrino e Metabolismo,
Filhotes e Neonatos, Hematologia e Doenças Imunomediadas, Histórico Médico,
Imunologia e Imunoprofilaxia, Informações Gerais do Animal, Neurologia,
Nutrição Clínica para Cães e Gatos, Oncologia, Parasitologia,
Sinais Clínicos, Sintomas Específicos, Sistema Genital e Reprodutor,
Sistema Respiratório, Sistema digestório, Toxicologia, Trato Urinário
```

---

## `buildTruncatedPayload`

```ts
function buildTruncatedPayload(params: {
  consultationId: string
  patientId: string
  chiefComplaint: string
  followupAnswers: FollowUpAnswer[]
  transcription: string
  dynamicAnswers: FollowUpAnswer[]
}): AnamnesisPayload & { respostas_truncadas?: true }
```

**Proteções aplicadas em ordem:**

1. `transcription` truncado a **500 chars** → `console.warn` se ocorrer
2. Cada `answer` de `followupAnswers` e `dynamicAnswers` truncado a **300 chars** → `console.warn` se ocorrer
3. `followup_answers = [...followupAnswers, ...dynamicAnswers]` (merged)
4. Se `JSON.stringify(followup_answers).length > 2000` → remove itens do final até caber + `respostas_truncadas: true` + `console.warn`

---

## Tratamento de Erros

**Regra principal:** nenhum erro no step 3 bloqueia o fluxo. Se qualquer chamada falhar, `onSkipAll()` é chamado e o webhook é enviado com os dados já coletados (queixa + follow-up estático + relato).

| Cenário | Comportamento |
|---|---|
| OpenAI sem chave (`VITE_OPENAI_API_KEY` ausente) | `onSkipAll()` imediato |
| OpenAI retorna erro HTTP | `onSkipAll()` |
| OpenAI retorna JSON malformado | `parseOpenAICategories` retorna `[]` → `onSkipAll()` |
| Supabase retorna vazio | `onSkipAll()` |
| Supabase lança erro | `onSkipAll()` |
| Vet clica "Pular" em todas as perguntas | `onComplete([])` |

---

## Payload Final (webhook n8n)

```json
{
  "consultation_id": "uuid",
  "patient_id": "string",
  "chief_complaint": "string",
  "followup_answers": [
    { "question": "...", "answer": "Sim — detalhe opcional" }
  ],
  "transcription": "string (≤500 chars)",
  "respostas_truncadas": true
}
```

`respostas_truncadas` só aparece quando o array ultrapassou 2000 chars.

---

## Testes

### Totais esperados

| Arquivo | Testes | Status |
|---|---|---|
| `anamnesisApi.test.ts` | 9 | Existente — sem alteração |
| `consultationSession.test.ts` | 17 | Existente — sem alteração |
| `openaiCategories.test.ts` | 6 | Novo |
| `useSupabaseQuestions.test.ts` | 4 | Novo |
| `buildTruncatedPayload.test.ts` | 7 | Novo |
| **Total** | **~43** | |

### `openaiCategories.test.ts` — 6 casos

| Caso | Entrada | Esperado |
|---|---|---|
| JSON válido | `'["Trato Urinário", "Cardiovascular"]'` | `["Trato Urinário", "Cardiovascular"]` |
| JSON com markdown | `` '```json\n["Neurologia"]\n```' `` | `[]` |
| String vazia | `''` | `[]` |
| JSON não-array | `'"Trato Urinário"'` | `[]` |
| Mais de 3 categorias | `'["A","B","C","D"]'` (todas válidas) | `["A","B","C"]` |
| Categoria inválida | `'["Trato Urinário", "Categoria Inexistente"]'` | `["Trato Urinário"]` |

### `useSupabaseQuestions.test.ts` — 4 casos

| Caso | Mock | Esperado |
|---|---|---|
| Retorno normal | query retorna 5 perguntas | `{ questions: [...], loading: false, error: null }` |
| Retorno vazio | query retorna `[]` | `{ questions: [], loading: false, error: null }` |
| Erro do Supabase | query lança erro | `{ questions: [], loading: false, error: Error }` |
| `categories` vazio | `[]` passado | não executa query, retorna `questions: []` imediatamente |

### `buildTruncatedPayload.test.ts` — 7 casos

| Caso | Entrada | Esperado |
|---|---|---|
| Caso normal | transcription 200 chars, 3 respostas curtas | payload sem truncamento, sem flag |
| Transcription longa | transcription 600 chars | truncado a 500, `console.warn` chamado |
| Answer longa | answer com 400 chars | truncado a 300, `console.warn` chamado |
| followup_answers estoura 2000 chars | 10 respostas longas | remove últimas até caber, `respostas_truncadas: true`, `console.warn` |
| dynamicAnswers merged | 1 followup + 2 dynamic | array final com 3 itens em ordem correta |
| Arrays vazios | `followupAnswers: [], dynamicAnswers: []` | `followup_answers: []`, sem flag |
| Answer concatenada | botão "Sim" + texto "detalhe" | `answer: "Sim — detalhe"` |

---

## Variáveis de Ambiente Necessárias

```env
VITE_OPENAI_API_KEY=sk-...   # nova — chamada direta do frontend à OpenAI
VITE_SUPABASE_URL=...         # já existe
VITE_SUPABASE_PUBLISHABLE_KEY=... # já existe
VITE_N8N_ANAMNESIS_WEBHOOK_URL=... # já existe
VITE_N8N_WEBHOOK_SECRET=...   # já existe
```

---

## Restrições e Decisões

- A chamada à OpenAI é feita **diretamente do frontend** usando `VITE_OPENAI_API_KEY` — decisão de simplicidade para MVP. Em produção, considerar proxy via n8n ou Edge Function.
- O `anamnesis.json` e todos os componentes estáticos existentes permanecem **sem modificação**.
- `useDynamicAnamnesis` nunca é chamado no mount do `ConsultationPage` — só quando `DynamicAnamnesisStep` monta (step 3).
- `console.warn` é permitido para rastreabilidade durante testes; nenhum `console.log` de debug em produção.
