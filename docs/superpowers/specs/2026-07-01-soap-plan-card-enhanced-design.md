# Design — Card P Enriquecido (feat/soap-plan-enhanced)

**Data:** 2026-07-01  
**Branch:** `feat/soap-plan-enhanced`  
**Status:** Aprovado pelo autor

---

## 1. Contexto

O Card P (Plano — Conduta) exibe atualmente um bloco de texto único com o conteúdo de `soap_p`. A proposta é torná-lo acionável: o veterinário vê o plano estruturado em três seções visuais com checkboxes, marca o que foi aprovado/prescrito, e os itens marcados ficam salvos no Supabase.

O Card P enriquecido é implementado como um **componente separado** (`PlanCard`), não uma extensão condicional do `SOAPCard`. O `SOAPCard` genérico permanece inalterado para os blocos S, O e A.

---

## 2. Arquitetura

### 2.1 Arquivos novos

| Arquivo | Propósito |
|---|---|
| `src/components/consultation/PlanCard.tsx` | Componente principal — substitui `<SOAPCard letter="P">` |
| `src/lib/parseSoapP.ts` | Parser puro, sem dependências de UI |
| `supabase/migrations/20260701000001_add_approved_plan_columns.sql` | Adiciona `approved_exams` e `approved_treatments` à tabela |

### 2.2 Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/consultation/GuidedConsultation.tsx` | Troca `<SOAPCard letter="P">` por `<PlanCard>`; carrega `approved_exams`/`approved_treatments` da query existente |
| `src/integrations/supabase/types.ts` | Adiciona `approved_exams: Json \| null` e `approved_treatments: Json \| null` em `medical_consultations` (Row, Insert, Update) |

### 2.3 Passo manual (n8n) — fora do escopo de código

Atualizar o prompt do nó OpenAI P no workflow `anamnese-soap` para o formato abaixo:

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

---

## 3. Banco de dados

### Migration

```sql
ALTER TABLE public.medical_consultations
  ADD COLUMN IF NOT EXISTS approved_exams     JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS approved_treatments JSONB DEFAULT '[]';
```

### Semântica das colunas

- `approved_exams: string[]` — textos dos itens de exame que o vet marcou
- `approved_treatments: string[]` — textos das condutas que o vet marcou
- `content` — mantém o texto bruto de `soap_p` (retrocompatibilidade)

---

## 4. Parser — `parseSoapP.ts`

### Interface

```typescript
export interface ParsedPlan {
  exams: string[];      // itens de "EXAMES SOLICITADOS"
  treatments: string[]; // itens de "PROTOCOLO E TRATAMENTO"
  monitoring: string;   // texto livre de "RETORNO E MONITORAMENTO"
}

export function parseSoapP(text: string): ParsedPlan | null
```

Retorna `null` quando:
- `text` está vazio ou só tem espaços
- nenhuma seção reconhecida é encontrada no texto

### Lógica de split

1. Divide o texto por cabeçalhos via regex case-insensitive:
   - `/EXAMES SOLICITADOS/i`
   - `/PROTOCOLO E TRATAMENTO/i`
   - `/RETORNO E MONITORAMENTO/i`
2. Extrai itens de lista: qualquer linha que começa com `-`, `•`, `*` ou `[`
3. Faz strip do marcador e espaços de cada item
4. A seção RETORNO é capturada como texto livre (não lista)
5. Se nenhuma seção for encontrada → retorna `null`

### Casos de teste obrigatórios

| Input | Output esperado |
|---|---|
| Texto no formato exato do prompt n8n | `ParsedPlan` com 3 seções preenchidas |
| Cabeçalhos com variações de caixa/espaço | Parse correto |
| Texto bruto sem cabeçalhos | `null` |
| String vazia | `null` |
| Apenas seção RETORNO presente | `ParsedPlan` com `exams: []`, `treatments: []`, monitoring preenchido |

---

## 5. Componente PlanCard

### Props e handle

```typescript
interface PlanCardProps {
  value: string;                   // texto bruto de soap_p
  onChange: (v: string) => void;
  patientId?: string;
  initialApprovedExams?: string[];
  initialApprovedTreatments?: string[];
}

export interface PlanCardHandle {
  save(): Promise<{ ok: boolean; letter: string }>;
}
```

O handle expõe `save()` com a mesma assinatura do `SOAPCardHandle` — o `GuidedConsultation` chama `soapRefs.P.current?.save()` sem saber que é um `PlanCard`.

### Estado interno

```typescript
const parsed = useMemo(() => parseSoapP(value), [value]);
const [approvedExams, setApprovedExams] = useState<string[]>(initialApprovedExams ?? []);
const [approvedTreatments, setApprovedTreatments] = useState<string[]>(initialApprovedTreatments ?? []);
const [isMonitoringEditing, setIsMonitoringEditing] = useState(false);
const [monitoringOverride, setMonitoringOverride] = useState<string | null>(null);
const [isSaving, setIsSaving] = useState(false);
```

### Modos de exibição

**Modo estruturado** — quando `parseSoapP(value) !== null`:

```
┌─ P  Plano — Conduta ───────────────────────────────────────────────┐
│ Exames Solicitados  [2 / 5 selecionados]          [Microscope icon] │
│  ☑ Hemograma completo — triagem inicial                             │
│  ☐ Ultrassom abdominal — avaliar estruturas                         │
│  ...                                                                 │
│                                                                      │
│ Protocolo e Tratamento  [1 / 3 selecionados]          [Pill icon]   │
│  ☑ Amoxicilina 10mg/kg a cada 12h por 7 dias                        │
│  ☐ Dipirona se febre > 39.5°C                                       │
│  ...                                                                 │
│                                                                      │
│ Retorno e Monitoramento                          [CalendarDays icon] │
│  ┌──────────────────────────────────────────┐ [✏ lápis flutuante]  │
│  │ Retorno em 7 dias. Sinais de alerta: ... │                        │
│  └──────────────────────────────────────────┘                        │
│                                                                      │
│  [Salvar Plano]                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Modo fallback** — quando `parseSoapP(value) === null` (vazio ou formato diferente):

```
┌─ P  Plano — Conduta ──────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ [textarea livre — placeholder padrão]                       │   │
│  └────────────────────────────────────────────────────────────┘   │
│  [Salvar Plano]                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Detalhe: seção Retorno

- Por padrão: textarea `readOnly`
- Ícone `Pencil` (14px) flutuante no canto superior direito — sem label
- Clique no lápis → `isMonitoringEditing = true` → textarea vira editável
- Edição vai para `monitoringOverride` (não altera `value` diretamente)
- O `save()` usa `monitoringOverride ?? parsed.monitoring` para persistir

### Detalhe: checkboxes

- Toggle: se o texto do item está em `approvedExams` → marcado
- Marcado: texto com `line-through` + opacidade reduzida
- Badge de contagem: `X / Y selecionados` no header da seção
- Item desmarcado: remove o texto do array

### Método `save()`

```typescript
// upsert na tabela medical_consultations
{
  patient_id: patientId,
  soap_block: 'P',
  content: value.trim(),                  // texto bruto preservado
  approved_exams: approvedExams,          // JSONB array
  approved_treatments: approvedTreatments // JSONB array
}
// onConflict: 'patient_id,soap_block'
```

---

## 6. GuidedConsultation — mudanças

### Query (adicionar colunas)

```typescript
.select('..., soap_p, ..., approved_exams, approved_treatments')
```

No bloco de carga do `soap_block='P'` row:

```typescript
const pRow = (data ?? []).find((row: any) => row.soap_block === 'P');
setApprovedState({
  exams: (pRow as any)?.approved_exams ?? [],
  treatments: (pRow as any)?.approved_treatments ?? [],
});
```

### Renderização

```tsx
// Antes:
<SOAPCard ref={soapRefs.P} letter="P" ... />

// Depois:
<PlanCard
  ref={soapRefs.P}
  value={soapData.P}
  onChange={updateField('P')}
  patientId={selectedPatient?.id}
  initialApprovedExams={approvedState.exams}
  initialApprovedTreatments={approvedState.treatments}
/>
```

O `soapRefs.P` mantém o tipo `RefObject<SOAPCardHandle>` pois `PlanCardHandle` tem a mesma assinatura.

---

## 7. Voz

Fora do escopo desta iteração. O P normalmente é preenchido pela Anamnese Guiada (via IA). Voice pode ser adicionado em iteração futura seguindo o mesmo padrão do `SOAPCard`.

---

## 8. Design System

Antes de escrever qualquer JSX, invocar o skill `predictvet-design-system`. Paleta de acentos para as seções:

| Seção | Cor sugerida |
|---|---|
| Exames Solicitados | `hsl(221, 73%, 45%)` (azul-índigo da marca) |
| Protocolo e Tratamento | `hsl(160, 60%, 40%)` (verde-teal — mesmo do Card O) |
| Retorno e Monitoramento | `hsl(35, 80%, 50%)` (âmbar — mesmo do Card A) |

Fundo de cada seção: versão 8% de opacidade da cor de acento (`/8` no Tailwind).

---

## 9. Fora do escopo

- Voice recording no PlanCard
- Regenerar `types.ts` via Supabase CLI (manter padrão `as any` do projeto)
- Alterações no fluxo de Anamnese Guiada além das listadas
