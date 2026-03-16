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
| 2 | `NarrativeInput` | Relato passado integralmente para o step 3; truncamento ocorre apenas em `buildTruncatedPayload` |
| 3 | `DynamicAnamnesisStep` *(novo)* | Perguntas dinâmicas conversacionais |

O step 2 não mais dispara o webhook diretamente. O botão de confirmação do relato passa a disparar `ADVANCE_TO_DYNAMIC`, avançando para step 3. O webhook é chamado somente ao final do step 3.

**Navegação:** o botão "Voltar" fica **oculto/desabilitado** no step 3. Re-navegar para o step 2 re-dispararia o fluxo assíncrono (OpenAI + Supabase), o que é indesejável. O vet pode usar "Pular" em todas as perguntas para avançar sem responder.

---

## Arquitetura

### Abordagem escolhida: Hook separado (`useDynamicAnamnesis`)

O `sessionReducer` permanece com seus **8 action types** intactos (as 17 são as contagens de testes em `consultationSession.test.ts`, não o número de actions). Um novo hook `useDynamicAnamnesis` encapsula toda a fase dinâmica e vive dentro do componente `DynamicAnamnesisStep`, que só monta quando `step === 3`.

**Garantia:** `useDynamicAnamnesis` nunca é inicializado no mount do `ConsultationPage` — somente quando o vet confirma o relato e o componente entra no DOM.

---

## Arquivos

### Novos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/openaiCategories.ts` | Função pura `parseOpenAICategories(text, validCategories?)` |
| `src/hooks/useSupabaseQuestions.ts` | Hook que executa SELECT na `perguntas_anamnese` (cliente anon + RLS) |
| `src/hooks/useDynamicAnamnesis.ts` | Hook de orquestração: OpenAI → Supabase → iteração |
| `src/components/consultation/DynamicAnamnesisStep.tsx` | Componente da fase conversacional |
| `src/tests/openaiCategories.test.ts` | Testes da função de parse |
| `src/tests/useSupabaseQuestions.test.ts` | Testes do hook Supabase |
| `src/tests/buildTruncatedPayload.test.ts` | Testes da função de truncamento |
| `src/tests/useDynamicAnamnesis.test.ts` | Testes do hook de orquestração |

### Modificados

| Arquivo | O que muda |
|---|---|
| `src/lib/consultationSession.ts` | Nova action `ADVANCE_TO_DYNAMIC` (step 2 → 3) e seu tipo no union `SessionAction` |
| `src/lib/anamnesisApi.ts` | Adiciona `buildTruncatedPayload()` e `ExtendedAnamnesisPayload`; widena `sendAnamnesisPayload` para aceitar o tipo estendido |
| `src/components/consultation/ConsultationPage.tsx` | Renderiza `<DynamicAnamnesisStep>` no step 3; botão do relato despacha `ADVANCE_TO_DYNAMIC`; armazena `dynamicAnswers` em `useState` local; oculta botão "Voltar" no step 3 |
| `src/components/consultation/ConsultationPage.tsx` | Passa array de 4 steps ao `ConsultationStepper` quando `step >= 3` |

### Não modificados

`ComplaintSelector`, `FollowUpCard`, `NarrativeInput`, `GuidedConsultation`, `ConsultationStepper`, `anamnesis.json`, todos os testes existentes.

> **Nota:** `ConsultationStepper` já aceita `steps: Step[]` como prop dinâmica. Nenhuma alteração no componente — apenas o `ConsultationPage` passa um array de 4 itens quando `step >= 3`.

---

## Tipos

### Nova action em `consultationSession.ts`

```ts
// Adicionado ao union SessionAction:
| { type: 'ADVANCE_TO_DYNAMIC' }

// Reducer branch:
case 'ADVANCE_TO_DYNAMIC':
  return { ...state, step: 3 }
```

### `ExtendedAnamnesisPayload` em `anamnesisApi.ts`

```ts
export interface ExtendedAnamnesisPayload extends AnamnesisPayload {
  respostas_truncadas?: true  // flag literal: apenas presente (true) quando truncamento ocorreu; omitida caso contrário
}
```

`sendAnamnesisPayload` passa a aceitar `ExtendedAnamnesisPayload` em vez de `AnamnesisPayload`.

### Storage de `dynamicAnswers` em `ConsultationPage`

```ts
const [dynamicAnswers, setDynamicAnswers] = useState<FollowUpAnswer[]>([])
```

Não entra no `sessionReducer`. Quando `DynamicAnamnesisStep` chama `onFinish(answers)`, o `ConsultationPage` armazena em `setDynamicAnswers(answers)` e dispara o webhook.

---

## Componentes

### `DynamicAnamnesisStep`

```ts
interface Props {
  transcription: string
  onFinish: (answers: FollowUpAnswer[]) => void  // único callback — cobre sucesso, skip e erro
}
```

`onFinish([])` é chamado tanto em caso de erro/vazio quanto quando o vet pula todas as perguntas. O `ConsultationPage` trata ambos da mesma forma: envia o webhook com `dynamicAnswers: []`.

**Fases internas (`phase`):**

| Phase | Render |
|---|---|
| `'loading'` | Spinner: "Identificando categorias clínicas..." |
| `'questions'` | Card com pergunta, botões Sim/Não/Não sei, campo de detalhe opcional, barra de progresso, botão Pular |
| `'submitting'` | Breve mensagem "Finalizando anamnese..." antes de chamar `onFinish` |
| `'done'` | (interno) — transita para `'submitting'` ao responder a última pergunta |

**Barra de progresso:** "Pergunta X de Y" com barra visual.

**Resposta acumulada:** botão selecionado + texto do campo concatenados como `"Sim — detalhe opcional"`, truncado a 300 chars antes de acumular.

### Atualização do `ConsultationPage`

```tsx
// Stepper dinâmico
const steps = session.step >= 3
  ? [...STEPS_BASE, { label: 'Perguntas', description: 'Aprofundamento clínico' }]
  : STEPS_BASE

// Renderização condicional do step 3
{session.step === 3 && (
  <DynamicAnamnesisStep
    transcription={session.transcription}
    onFinish={handleFinalSubmit}
  />
)}

// Botão Voltar oculto no step 3
{session.step < 3 && <BackButton />}
```

---

## Fluxo Assíncrono (`useDynamicAnamnesis`)

```
mount (transcription disponível via prop)
  │
  ├─ Chamada OpenAI (VITE_OPENAI_API_KEY — risco controlado, MVP, chave exposta no bundle)
  │    POST https://api.openai.com/v1/chat/completions
  │    model: gpt-3.5-turbo, max_tokens: 100, temperature: 0
  │    system: "Você é um assistente veterinário clínico."
  │    user: prompt com relato + lista de categorias válidas
  │          instrução explícita: "Responda APENAS com array JSON puro, sem markdown, sem explicações"
  │    extrai: data.choices[0].message.content
  │    pre-processa: strip de markdown fences antes do JSON.parse
  │    parse: parseOpenAICategories(content) → string[]
  │
  │    erro (rede, HTTP, parse, JSON inválido) → onFinish([])
  │
  ├─ categories.length === 0 → onFinish([])
  │
  ├─ Query Supabase (cliente anon com RLS — contexto do usuário autenticado)
  │    SELECT pergunta, agrupamento
  │    FROM perguntas_anamnese
  │    WHERE agrupamento = ANY(categories) AND ativo = true
  │    ORDER BY agrupamento, id
  │    LIMIT 8
  │
  │    erro / retorno vazio → onFinish([])
  │
  └─ questions carregadas → phase = 'questions'
       usuário responde uma a uma
       ao final → phase = 'submitting' → onFinish(answers)
```

---

## `parseOpenAICategories`

```ts
function parseOpenAICategories(
  text: string,
  validCategories?: string[]
): string[]
```

- **Pre-processa:** remove markdown fences (`` ```json ... ``` `` e `` ``` ... ``` ``) antes do parse
- Faz `JSON.parse(text)` — se falhar, retorna `[]`
- Verifica se o resultado é um array — se não, retorna `[]`
- Filtra apenas categorias presentes em `validCategories` (default: lista completa abaixo)
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
}): ExtendedAnamnesisPayload
```

**Proteções aplicadas em ordem:**

1. `transcription` truncado a **500 chars** → `console.warn` se ocorrer
2. Cada `answer` de `followupAnswers` e `dynamicAnswers` truncado a **300 chars** → `console.warn` se ocorrer
3. `followup_answers = [...followupAnswers, ...dynamicAnswers]` (merged)
4. Se `JSON.stringify(followup_answers).length > 2000` → remove itens do final até caber + `respostas_truncadas: true` + `console.warn`

---

## Supabase Schema — `perguntas_anamnese`

Tabela já existente no projeto. Schema esperado:

```sql
perguntas_anamnese (
  id          bigint primary key,
  agrupamento text    not null,   -- categoria clínica (ex: "Trato Urinário")
  pergunta    text    not null,   -- texto da pergunta
  ativo       boolean not null default true
)
```

O tipo TypeScript gerado pelo Supabase (`Database['public']['Tables']['perguntas_anamnese']['Row']`) deve ser usado em `useSupabaseQuestions` para garantir type safety.

A query usa o **cliente anon** (`supabase` de `src/integrations/supabase/client.ts`) com RLS ativo — contexto do usuário autenticado.

---

## Tratamento de Erros

**Regra principal:** nenhum erro no step 3 bloqueia o fluxo. `onFinish([])` é chamado em qualquer falha e o webhook é enviado com os dados já coletados.

| Cenário | Comportamento |
|---|---|
| `VITE_OPENAI_API_KEY` ausente | `onFinish([])` imediato |
| OpenAI retorna erro HTTP | `onFinish([])` |
| OpenAI retorna JSON malformado | `parseOpenAICategories` retorna `[]` → `onFinish([])` |
| OpenAI retorna categorias todas inválidas | `parseOpenAICategories` retorna `[]` → `onFinish([])` |
| Supabase retorna vazio | `onFinish([])` |
| Supabase lança erro | `onFinish([])` |
| Vet clica "Pular" em todas as perguntas | `onFinish([])` |
| Vet responde normalmente | `onFinish(answers)` com respostas acumuladas |

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
| `consultationSession.test.ts` | 18 | Existente + 1 novo caso para `ADVANCE_TO_DYNAMIC` |
| `openaiCategories.test.ts` | 6 | Novo |
| `useSupabaseQuestions.test.ts` | 4 | Novo |
| `buildTruncatedPayload.test.ts` | 7 | Novo |
| `useDynamicAnamnesis.test.ts` | 4 | Novo |
| **Total** | **~48** | |

### `consultationSession.test.ts` — 1 caso novo

| Caso | Entrada | Esperado |
|---|---|---|
| `ADVANCE_TO_DYNAMIC` | step 2, complaint e transcription preenchidos | step avança para 3, todos os outros campos preservados |

### `openaiCategories.test.ts` — 6 casos

| Caso | Entrada | Esperado |
|---|---|---|
| JSON válido | `'["Trato Urinário", "Cardiovascular"]'` | `["Trato Urinário", "Cardiovascular"]` |
| JSON com markdown fence | `` '```json\n["Neurologia"]\n```' `` | `["Neurologia"]` (strip aplicado antes do parse) |
| String vazia | `''` | `[]` |
| JSON não-array | `'"Trato Urinário"'` | `[]` |
| Mais de 3 categorias | `'["A","B","C","D"]'` (todas válidas) | primeiras `["A","B","C"]` |
| Categoria inválida | `'["Trato Urinário", "Categoria Inexistente"]'` | `["Trato Urinário"]` |

### `useSupabaseQuestions.test.ts` — 4 casos

| Caso | Mock | Esperado |
|---|---|---|
| Retorno normal | query retorna 5 perguntas | `{ questions: [...], loading: false, error: null }` |
| Retorno vazio | query retorna `[]` | `{ questions: [], loading: false, error: null }` |
| Erro do Supabase | query lança erro | `{ questions: [], loading: false, error: Error }` |
| `categories` vazio | `[]` passado | `{ questions: [], loading: false, error: null }` sem executar query |

### `buildTruncatedPayload.test.ts` — 7 casos

| Caso | Entrada | Esperado |
|---|---|---|
| Caso normal | transcription 200 chars, 3 respostas curtas | payload sem truncamento, sem flag |
| Transcription longa | transcription 600 chars | truncado a 500, `console.warn` chamado |
| Answer longa | answer com 400 chars | truncado a 300, `console.warn` chamado |
| followup_answers estoura 2000 chars | 10 respostas longas | remove últimas até caber, `respostas_truncadas: true`, `console.warn` |
| dynamicAnswers merged | 1 followup + 2 dynamic | array final com 3 itens em ordem correta |
| Arrays vazios | `followupAnswers: [], dynamicAnswers: []` | `followup_answers: []`, sem flag |

### `useDynamicAnamnesis.test.ts` — 4 casos

| Caso | Mock | Esperado |
|---|---|---|
| Happy path | OpenAI retorna categorias válidas, Supabase retorna 3 perguntas | `phase: 'questions'`, 3 perguntas carregadas |
| OpenAI falha | fetch lança erro | `onFinish([])` chamado |
| Supabase retorna vazio | query retorna `[]` | `onFinish([])` chamado |
| categories vazio | OpenAI retorna `[]` | `onFinish([])` chamado sem chamar Supabase |

---

## Variáveis de Ambiente Necessárias

```env
VITE_OPENAI_API_KEY=sk-...
# ⚠️ VITE_ vars são expostas no bundle do browser. Risco controlado para MVP.
# Em produção: considerar proxy via n8n ou Supabase Edge Function.

VITE_SUPABASE_URL=...              # já existe
VITE_SUPABASE_PUBLISHABLE_KEY=...  # já existe
VITE_N8N_ANAMNESIS_WEBHOOK_URL=... # já existe
VITE_N8N_WEBHOOK_SECRET=...        # já existe
```

---

## Restrições e Decisões

- Chamada à OpenAI é feita **diretamente do frontend** — decisão consciente para MVP com risco controlado.
- O `anamnesis.json` e todos os componentes estáticos existentes permanecem **sem modificação**.
- `useDynamicAnamnesis` nunca é chamado no mount do `ConsultationPage`.
- O botão "Voltar" fica **oculto** no step 3 para evitar re-execução do fluxo assíncrono.
- `dynamicAnswers` é armazenado em `useState` local no `ConsultationPage`, fora do `sessionReducer`.
- `onFinish` é o único callback do `DynamicAnamnesisStep` — cobre sucesso, skip e erro com o mesmo tratamento.
- `console.warn` é permitido para rastreabilidade durante testes; nenhum `console.log` de debug em produção.
