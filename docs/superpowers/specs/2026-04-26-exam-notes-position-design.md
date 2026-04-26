# Design: Mover campo "Contexto clínico" para antes do upload

**Data:** 2026-04-26
**Branch:** fix/exam-notes-position
**Arquivo principal:** `src/pages/Exams.tsx`

---

## Problema

O campo `vet_notes` ("Observações clínicas") está dentro do bloco `{result && (...)}` e só aparece após o PDF ser analisado. O veterinário perde o momento natural de registrar o contexto clínico — histórico, motivo da solicitação, medicamentos — antes de enviar o exame.

---

## Solução Escolhida: Opção A

Mover o campo para antes do `FileDropzone` e auto-salvar `vet_notes` junto com o registro do exame, sem botão separado.

---

## Nova Ordem da Tela

```
1. Seletor de paciente        ← sem mudança
2. Campo "Contexto clínico"   ← MOVIDO (era item pós-análise)
3. FileDropzone / placeholder ← sem mudança
4. Loading / resultado        ← sem mudança
5. ExamReport + botão Salvar  ← sem mudança
6. AnalysisResults            ← sem mudança
7. ClinicalSignsSection       ← sem mudança
8. Laboratório + data         ← permanecem na seção de resultado
```

O campo de laboratório permanece na seção pós-análise porque seu valor é extraído automaticamente do PDF.

---

## Campo "Contexto clínico do exame"

| Propriedade | Valor |
|---|---|
| Label | `Contexto clínico do exame` |
| Placeholder | `Ex: Histórico do paciente, motivo da solicitação, medicamentos em uso...` |
| Ícone | `NotebookPen` (já importado) |
| Estado | `vetNotes` (existente, sem nova variável) |
| Visibilidade | Condicional ao `selectedPatient` — mesma condicional do `FileDropzone` |
| Reset | `setVetNotes('')` em `handleFileSelect` — comportamento mantido |
| Rows | 3 |

---

## Auto-salvar com o exame

Em `handleSaveExam`, após `setSavedExamId(examId)`, incluir:

```ts
if (examId) {
  updateVetNotesAndLaboratory(examId, vetNotes, laboratory || null)
    .catch(err => console.warn('[Exams] Could not persist vet_notes:', err));
}
```

Padrão idêntico ao `updateExamDate` já presente na linha 221 — não bloqueia o fluxo, falha silenciosa com warn.

---

## Remoções

- Bloco "Observações clínicas" da seção `{result && (...)}` (linhas 376–415 de `Exams.tsx`)
- Função `handleSaveNotes`
- Estado `isSavingNotes`
- Botão "Salvar observação" e aviso "Salve o exame primeiro..."

---

## Testes

| Critério | Cobertura |
|---|---|
| Campo aparece antes do upload | Teste de renderização: `vet-notes` presente no DOM sem `result` |
| Conteúdo salvo em `vet_notes` | Teste de `handleSaveExam`: `updateVetNotesAndLaboratory` chamado com valor do campo |
| Campo preenchido ao reabrir | Já coberto pelo `PatientExamsModal` — `handleSelectExam` seta `vetNotes(exam.vet_notes)` |

Nenhuma assinatura de função existente muda. Testes de `vetNotes.test.ts` e `vetNotesAndLaboratory.test.ts` continuam passando sem alteração.

---

## Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `src/pages/Exams.tsx` | Reposicionamento do campo, auto-save no `handleSaveExam`, remoção do `handleSaveNotes` e `isSavingNotes` |
| Testes novos | Arquivo de teste para renderização e comportamento de save do campo reposicionado |
