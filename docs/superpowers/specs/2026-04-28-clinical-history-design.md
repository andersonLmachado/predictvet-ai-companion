# Design: Histórico Clínico Permanente do Paciente (`clinical_history`)

**Data:** 2026-04-28
**Branch:** a criar a partir de `main` (ou de `fix/exam-notes-position` se ainda ativo)

---

## Problema

O campo `vet_notes` (por-exame) não é adequado para registrar informações permanentes do paciente como alergias, doenças preexistentes e medicamentos em uso. Essas informações precisam de um campo próprio no nível do paciente, carregado automaticamente em todas as interações clínicas.

---

## Dois Campos — Semânticas Distintas

| Campo | Label | Granularidade | Tabela | Comportamento |
|---|---|---|---|---|
| `clinical_history` | Histórico Clínico | Paciente | `patients.clinical_history` | Persistente, carrega em toda interação |
| `vet_notes` | Contexto deste exame | Exame | `exams_history.vet_notes` | Específico, começa vazio a cada exame |

---

## Tarefa 1 — Migration Supabase

SQL para rodar manualmente no **Supabase Dashboard → SQL Editor**:

```sql
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinical_history TEXT;
```

Nenhuma mudança de RLS necessária — a tabela `patients` já possui políticas para usuários autenticados.

> Nota: o tipo `Database` em `src/integrations/supabase/types.ts` não precisa ser atualizado para o app funcionar — o Supabase client aceita campos extras com `as any`. Porém, se o tipo for regenerado via Supabase CLI no futuro, o campo aparecerá automaticamente.

---

## Tarefa 2 — Lib: `src/lib/clinicalHistory.ts`

Duas funções puras, padrão idêntico ao `src/lib/vetNotes.ts`:

```ts
export async function fetchClinicalHistory(patientId: string): Promise<string>
```
- `SELECT clinical_history FROM patients WHERE id = patientId LIMIT 1`
- Retorna `string` (vazio se `null`)

```ts
export async function saveClinicalHistory(patientId: string, text: string): Promise<void>
```
- `UPDATE patients SET clinical_history = text WHERE id = patientId`
- Lança erro se Supabase retornar erro

**Testes:** `src/tests/clinicalHistory.test.ts`
- Resolve sem erro no sucesso
- Retorna string vazia quando coluna é `null`
- Lança quando Supabase retorna erro
- Chama `UPDATE` com os argumentos corretos

---

## Tarefa 3 — Componente `src/components/patient/ClinicalHistoryCard.tsx`

### Props

```ts
interface ClinicalHistoryCardProps {
  patientId: string;
  mode: 'edit' | 'readonly';
}
```

### Modo `edit` (tela de Exames)

- Usa `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` do shadcn (já disponível)
- **Com conteúdo:** `defaultOpen={true}`
- **Sem conteúdo:** `defaultOpen={false}`, trigger exibe "Adicionar histórico clínico"
- Título: `"Histórico Clínico"` com ícone `ClipboardList` (lucide)
- Subtítulo muted: `"Alergias, doenças preexistentes, medicamentos em uso"`
- Textarea `rows={4}` + botão `"Salvar histórico"`
- Ao montar e ao trocar `patientId`: chama `fetchClinicalHistory`, popula textarea
- Ao clicar Salvar: chama `saveClinicalHistory`, exibe toast de sucesso/erro
- Estado interno: `text: string`, `isLoading: boolean`, `isSaving: boolean`

### Modo `readonly` (ConsultationPage)

- Se `clinical_history` vazio ou `null` após carregamento → retorna `null` (sem render)
- Se preenchido → Card com:
  - Título `"Histórico Clínico"` com ícone `ClipboardList`
  - Texto do histórico (preformatado, `whitespace-pre-wrap`)
  - Link `"Editar histórico"` → navega para `/patients/:patientId` (React Router `Link`)
- Estado de loading: enquanto busca, retorna `null` (sem skeleton — não interrompe o fluxo)

---

## Tarefa 4 — Exams.tsx

Inserir `<ClinicalHistoryCard mode="edit" patientId={selectedPatientId} />` após `<PatientHeader>` e **antes** do campo "Contexto deste exame" (`vet_notes`).

Gated pelo mesmo `selectedPatient` que os demais campos:

```tsx
{selectedPatient && (
  <>
    <ClinicalHistoryCard mode="edit" patientId={selectedPatientId} />
    {/* Campo "Contexto deste exame" (vet_notes) — mantido como está */}
    <div className="space-y-2"> ... </div>
  </>
)}
```

---

## Tarefa 5 — ConsultationPage.tsx

Inserir `<ClinicalHistoryCard mode="readonly" patientId={patientId} />` antes do `ConsultationStepper`.

`patientId` já disponível via `useParams<{ patientId: string }>()`.

Se vazio: componente retorna `null` — nenhum espaço ocupado na tela.

---

## Tarefa 6 — `buildTruncatedPayload` + Tipos

### Tipo `ExtendedAnamnesisPayload` (`src/lib/anamnesisApi.ts`)

Adicionar campo opcional:

```ts
export interface ExtendedAnamnesisPayload extends AnamnesisPayload {
  respostas_truncadas?: true;
  weight_kg?: number | null;
  temperature_c?: number | null;
  clinical_history?: string;  // ← novo
}
```

### Função `buildTruncatedPayload`

Adicionar parâmetro opcional:

```ts
export function buildTruncatedPayload(params: {
  ...params atuais...,
  clinicalHistory?: string;  // ← novo
}): ExtendedAnamnesisPayload
```

Lógica a adicionar no final do builder, antes do `return result`:

```ts
if (params.clinicalHistory) {
  const truncated = params.clinicalHistory.slice(0, 500);
  result.clinical_history = truncated;
}
```

Sem log de warn para truncamento (diferente dos outros campos) — o histórico clínico pode ser longo por natureza, truncar silenciosamente é o comportamento correto.

### Chamada em `ConsultationPage.tsx`

Ao chamar `buildTruncatedPayload`, incluir `clinicalHistory` do estado do componente (carregado pelo `ClinicalHistoryCard` ou buscado via `fetchClinicalHistory`).

`ClinicalHistoryCard` expõe uma prop `onLoad?: (text: string) => void` — chamada uma vez quando o histórico é carregado do banco. `ConsultationPage` usa esse callback para capturar o valor e passá-lo ao `buildTruncatedPayload`, evitando um segundo fetch. Exemplo:

```tsx
const [clinicalHistory, setClinicalHistory] = useState('');
<ClinicalHistoryCard mode="readonly" patientId={patientId} onLoad={setClinicalHistory} />
// ... ao submeter:
buildTruncatedPayload({ ..., clinicalHistory })
```

---

## Tarefa 7 — n8n (manual — fora do escopo de código)

Nos nós **OpenAI S** e **OpenAI A** do workflow `anamnese-soap`, adicionar ao contexto do system prompt, imediatamente antes das respostas da anamnese:

```
{{#if $json.clinical_history}}
Histórico clínico permanente do paciente:
{{ $json.clinical_history }}
{{/if}}
```

(Sintaxe exata depende do template engine usado no nó — adaptar para Jinja2 ou expression se necessário.)

Esta tarefa é executada manualmente no n8n UI pelo operador do workflow.

---

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/lib/clinicalHistory.ts` | Criar |
| `src/tests/clinicalHistory.test.ts` | Criar |
| `src/components/patient/ClinicalHistoryCard.tsx` | Criar |
| `src/lib/anamnesisApi.ts` | Modificar — tipo + builder |
| `src/tests/buildTruncatedPayload.test.ts` | Modificar — cobrir `clinicalHistory` |
| `src/pages/Exams.tsx` | Modificar — inserir componente |
| `src/pages/ConsultationPage.tsx` | Modificar — inserir componente + passar ao builder |

---

## Testes

| Critério | Cobertura |
|---|---|
| `saveClinicalHistory` chama UPDATE correto | `clinicalHistory.test.ts` |
| `fetchClinicalHistory` retorna string vazia se null | `clinicalHistory.test.ts` |
| Payload inclui `clinical_history` quando preenchido | `buildTruncatedPayload.test.ts` |
| Payload omite `clinical_history` quando vazio | `buildTruncatedPayload.test.ts` |
| `clinical_history` truncado a 500 chars | `buildTruncatedPayload.test.ts` |
| Card readonly não renderiza quando vazio | Verificação visual (node env sem jsdom) |
| Card edit persiste ao trocar de paciente | Verificação visual |

---

## Fora do Escopo

- Atualização do tipo `Database` em `supabase/types.ts` (regenerar via CLI quando necessário)
- Histórico clínico em outros contextos além de Exams e ConsultationPage
- Versionamento ou histórico de edições do `clinical_history`
