# Spec: `exam_date` como Data de Referência nos Exames

## Objetivo

Usar a data real do exame (`exam_date`, extraída do documento pelo n8n) como referência de data em todas as telas, substituindo a data de upload (`created_at`). Também exibir a data extraída na tela de upload assim que ela estiver disponível.

## Contexto

O campo `exam_date` já existe em `exams_history` e é extraído automaticamente após o upload via `extractExamDate()` em `src/lib/examDate.ts`. O problema: nenhuma tela de acompanhamento (Dashboard, evolução, alta) usa esse campo — todas usam `created_at`, que é a data/hora do upload, não a data real do exame.

---

## Escopo

### 1 — Badge na tela de Upload (`Exams.tsx`)

**Localização:** div de botões `flex-wrap items-center justify-end gap-3`, entre "Gerar PDF" e "Salvar Exame".

**Estados:**
- Extração em andamento (`isLoading === true` ou extração ainda não resolveu): não exibir nada (a extração é fire-and-forget e pode terminar após a análise)
- `extractedExamDate` não-null: badge com ícone de calendário — "Data do exame: DD/MM/YYYY" (usar `formatExamDate`)
- `extractedExamDate === null` após análise concluída: nada (silencioso — o vet define no histórico)

**Implementação:** Ícone `Calendar` (lucide-react) + texto formatado. Estilo: `inline-flex items-center gap-1.5 text-sm text-muted-foreground` — discreto, sem bloquear o fluxo.

---

### 2 — Dashboard (`Dashboard.tsx`)

**Problema:** `ExamHistoryRow` não tem `exam_date`. O `dateStr` para os gráficos usa `exam.created_at`.

**Mudanças:**
- Adicionar `exam_date: string | null` à interface `ExamHistoryRow`
- O `data.map()` já usa `select('*')`, então `exam_date` já vem da query — só falta incluir no tipo
- Substituir `const dateStr = exam.created_at ?? ''` por `const dateStr = exam.exam_date ?? exam.created_at ?? ''`
- Manter `.order('created_at', { ascending: true })` no Supabase — ordenação no banco não muda
- Re-ordenar `history` em JS por `exam_date ?? created_at` após o fetch, para que exames com data real sejam exibidos na ordem correta do eixo X

---

### 3 — Biblioteca de Evolução (`examEvolution.ts`)

**Problema:** `ExamEvolutionExam` não tem `examDate`. A ordenação usa apenas `createdAt`.

**Mudanças:**
- Adicionar `examDate: string | null` à interface `ExamEvolutionExam`
- Atualizar o sort em `buildExamEvolutionComparison`:
  ```ts
  const aTime = new Date(a.examDate ?? a.createdAt ?? 0).getTime();
  const bTime = new Date(b.examDate ?? b.createdAt ?? 0).getTime();
  ```
- Todos os callers que constroem `ExamEvolutionExam` passam `examDate` (ver §4)

---

### 4 — Resumo de Alta (`DischargeSummary.tsx`)

**Problemas encontrados:**
1. A query Supabase usa `select('id, exam_type, created_at, clinical_summary, analysis_data')` — não inclui `exam_date`
2. `ExamHistoryItem.examDate` é preenchido com `item.created_at` em vez de `item.exam_date ?? item.created_at`
3. `ExamHistoryDetailed` não tem campo `examDate`; o objeto `ExamEvolutionExam` é construído com `createdAt: item.created_at` apenas
4. `formatExamLabel` usa `exam.createdAt` — deveria preferir `exam.examDate`
5. A exibição detalhada do exame usa `exam.createdAt` — deveria usar `exam.examDate ?? exam.createdAt`

**Mudanças:**
- Adicionar `exam_date` ao `select()` da query
- Adicionar `examDate: string | null` à interface `ExamHistoryDetailed`
- Preencher com `item.exam_date ?? null`
- `ExamHistoryItem.examDate = item.exam_date ?? item.created_at`
- Construção do `ExamEvolutionExam`: passar `examDate: item.examDate`
- `formatExamLabel`: usar `exam.examDate ?? exam.createdAt`
- Exibição detalhada: `exam.examDate ?? exam.createdAt`

---

## O que NÃO muda

- Nenhuma query de ordenação SQL alterada (`ORDER BY created_at` mantido)
- `created_at` permanece para auditoria e fallback
- `PatientExamsModal.tsx` — já completo
- `extractExamDate` e `updateExamDate` — já funcionam
- Nenhuma nova dependência npm

---

## Regra de fallback em toda a codebase

```
data exibida = exam_date ?? created_at
```

Quando `exam_date` for null (exames antigos ou falha de extração), o comportamento é idêntico ao atual.

---

## Testes

Todos os testes existentes devem continuar passando (61 atualmente). Não há testes novos necessários para esta mudança — as funções alteradas (`buildExamEvolutionComparison`, componentes React) são cobertas por testes de integração manuais. A lógica de fallback `exam_date ?? created_at` é trivial demais para justificar unit test adicional.

---

## Arquivos alterados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/pages/Exams.tsx` | Badge de `exam_date` na barra de ações |
| `src/pages/Dashboard.tsx` | Tipo `ExamHistoryRow` + `dateStr` + re-sort |
| `src/lib/examEvolution.ts` | Interface `ExamEvolutionExam` + sort |
| `src/pages/DischargeSummary.tsx` | Query + tipos + display |
