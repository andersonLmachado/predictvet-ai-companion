# Exam Notes Position Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover o campo "Contexto clínico do exame" (`vet_notes`) para antes do upload do PDF e salvar automaticamente junto com o registro do exame.

**Architecture:** Mudança restrita ao `Exams.tsx`. O campo já existe como estado `vetNotes`; o reposicionamento é puramente estrutural no JSX. O auto-save utiliza `updateVetNotesAndLaboratory` com o mesmo padrão já usado para `updateExamDate` (fire-and-forget após obter o `examId`). O botão separado "Salvar observação" e a função `handleSaveNotes` são removidos.

**Tech Stack:** React 18, TypeScript, Vitest (node env), Supabase client direto, `updateVetNotesAndLaboratory` de `src/lib/vetNotes.ts`.

---

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/pages/Exams.tsx` | Reposicionar textarea; integrar auto-save em `handleSaveExam`; remover `handleSaveNotes` e `isSavingNotes` |

> Nenhuma função lib muda de assinatura. Os testes de `vetNotes.test.ts` e `vetNotesAndLaboratory.test.ts` continuam passando sem alteração.

---

## Task 1: Remover dead code — `handleSaveNotes` e `isSavingNotes`

**Files:**
- Modify: `src/pages/Exams.tsx`

- [ ] **Step 1.1: Remover estado `isSavingNotes` e função `handleSaveNotes`**

Em `src/pages/Exams.tsx`, localizar e remover as seguintes linhas:

```ts
// Remover (linha ~41):
const [isSavingNotes, setIsSavingNotes] = useState(false);
```

```ts
// Remover (linhas ~237–248):
const handleSaveNotes = async () => {
  if (!savedExamId) return;
  setIsSavingNotes(true);
  try {
    await updateVetNotesAndLaboratory(savedExamId, vetNotes, laboratory || null);
    toast({ title: 'Observação salva', description: 'As observações clínicas foram registradas.' });
  } catch {
    toast({ title: 'Erro ao salvar observação', description: 'Tente novamente.', variant: 'destructive' });
  } finally {
    setIsSavingNotes(false);
  }
};
```

- [ ] **Step 1.2: Verificar que o arquivo compila**

```bash
cd predictvet-ai-companion && bun run build 2>&1 | tail -20
```

Esperado: sem erros de TypeScript relacionados a `isSavingNotes` ou `handleSaveNotes`.

---

## Task 2: Integrar auto-save de `vet_notes` em `handleSaveExam`

**Files:**
- Modify: `src/pages/Exams.tsx`

- [ ] **Step 2.1: Adicionar chamada fire-and-forget após obter `examId`**

Em `handleSaveExam`, localizar o bloco após `setSavedExamId(examId)` (linha ~215) e adicionar imediatamente depois:

```ts
setSavedExamId(examId);
// Auto-save vet_notes + laboratory junto com o registro do exame
if (examId) {
  updateVetNotesAndLaboratory(examId, vetNotes, laboratory || null)
    .catch((err) => console.warn('[Exams] Could not persist vet_notes:', err));
}
```

O padrão é idêntico ao `updateExamDate` que já existe logo abaixo — não bloqueia o fluxo principal.

- [ ] **Step 2.2: Verificar que o build ainda passa**

```bash
bun run build 2>&1 | tail -20
```

Esperado: build sem erros.

- [ ] **Step 2.3: Rodar testes existentes**

```bash
bun test 2>&1
```

Esperado: todos os testes passam. Se algum falhar, investigar antes de prosseguir.

---

## Task 3: Reposicionar o campo no JSX — antes do FileDropzone

**Files:**
- Modify: `src/pages/Exams.tsx`

- [ ] **Step 3.1: Remover o bloco "Observações clínicas" da seção `{result && (...)}`**

Dentro do bloco `{result && (...)}` em `Exams.tsx`, localizar e remover completamente o div abaixo (linhas ~376–415):

```tsx
{/* Observações Clínicas do Veterinário */}
<div className="space-y-4 pt-2">
  {/* Laboratório */}
  <div className="space-y-2">
    <Label htmlFor="laboratory" ...>
      Laboratório
    </Label>
    <Input id="laboratory" ... />
  </div>
  {/* Observações clínicas */}
  <div className="space-y-2">
    <Label htmlFor="vet-notes" ...>
      <NotebookPen ... />
      Observações clínicas
    </Label>
    <Textarea id="vet-notes" ... />
    <div className="flex justify-end">
      <Button onClick={handleSaveNotes} ...>
        Salvar observação
      </Button>
    </div>
    {!savedExamId && (
      <p className="text-xs ...">
        Salve o exame primeiro para habilitar as observações.
      </p>
    )}
  </div>
</div>
```

> Atenção: o bloco "Laboratório" (`Input id="laboratory"`) fica dentro desse div e deve ser mantido na seção de resultado — apenas o sub-bloco "Observações clínicas" sai daqui. Veja o step 3.2 para a versão correta do bloco de resultado.

- [ ] **Step 3.2: Versão final do bloco de resultado — apenas Laboratório permanece**

Após a remoção, o bloco `{result && (...)}` deve terminar com:

```tsx
{result && (
  <div className="space-y-4">
    <div className="space-y-3">
      {extractedExamDate && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Data do exame: {formatExamDate(extractedExamDate)}
          </span>
          {laboratory && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'hsl(217,100%,95%)', color: 'hsl(221,73%,45%)' }}
            >
              <Home className="h-3.5 w-3.5" />
              {laboratory}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-3">
        <ExamReport ... />
        <Button onClick={handleSaveExam} ...>
          ...
        </Button>
      </div>
    </div>
    <AnalysisResults result={result} patientData={patientData} />
    <ClinicalSignsSection patientId={selectedPatientId || null} />
    {/* Laboratório — permanece aqui pois é extraído do PDF */}
    <div className="space-y-2 pt-2">
      <Label htmlFor="laboratory" className="text-sm font-medium">
        Laboratório
      </Label>
      <Input
        id="laboratory"
        placeholder="Ex: Centro Vet Canoas, LabCenter Vet..."
        value={laboratory}
        onChange={(e) => setLaboratory(e.target.value)}
      />
    </div>
  </div>
)}
```

- [ ] **Step 3.3: Adicionar campo "Contexto clínico do exame" antes do FileDropzone**

Localizar o bloco condicional `{selectedPatient ? (<FileDropzone ...>) : (<Card ...>)}` e adicionar o campo **imediatamente antes** dele, dentro do mesmo `<div className="space-y-6">`:

```tsx
{/* Contexto clínico — aparece após selecionar paciente, antes do upload */}
{selectedPatient && (
  <div className="space-y-2">
    <Label htmlFor="vet-notes" className="text-sm font-medium flex items-center gap-2">
      <NotebookPen className="h-4 w-4" />
      Contexto clínico do exame
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
)}

{selectedPatient ? (
  <FileDropzone onFileSelect={handleFileSelect} isLoading={isLoading} />
) : (
  <Card className="border-dashed bg-muted/50">
    ...
  </Card>
)}
```

- [ ] **Step 3.4: Verificar import do `NotebookPen`**

Confirmar que `NotebookPen` já está nos imports do arquivo (linha ~4):

```ts
import { Loader2, FileSearch, RefreshCw, Save, NotebookPen, Calendar, Home } from "lucide-react";
```

Se não estiver, adicionar `NotebookPen` à lista.

- [ ] **Step 3.5: Build e testes**

```bash
bun run build 2>&1 | tail -20
bun test 2>&1
```

Esperado: build sem erros, todos os testes passam.

- [ ] **Step 3.6: Commit**

```bash
git add src/pages/Exams.tsx
git commit -m "feat: move vet_notes field before upload and auto-save with exam"
```

---

## Task 4: Verificação visual no navegador

**Files:** nenhum arquivo novo

- [ ] **Step 4.1: Iniciar servidor de desenvolvimento**

```bash
bun run dev
```

Abrir `http://localhost:8080` e navegar para a tela de Exames.

- [ ] **Step 4.2: Verificar critério 1 — campo aparece antes do upload**

1. Selecionar um paciente no seletor
2. Confirmar que o campo "Contexto clínico do exame" aparece imediatamente, antes da área de upload
3. Confirmar que nenhuma mensagem de "Salve o exame primeiro" aparece

- [ ] **Step 4.3: Verificar critério 2 — conteúdo salvo em `vet_notes`**

1. Preencher o campo com um texto de teste (ex: "Histórico: diabetes, uso de insulina")
2. Fazer upload de um PDF de exame
3. Clicar em "Salvar Exame"
4. Abrir o histórico do paciente (`PatientExamsModal`)
5. Selecionar o exame recém-salvo
6. Confirmar que o campo "Observações clínicas" está preenchido com o texto digitado

- [ ] **Step 4.4: Verificar critério 3 — campo preenchido ao reabrir**

Fechar e reabrir o modal do histórico, selecionar o mesmo exame e confirmar que o campo permanece preenchido (comportamento já existente no `PatientExamsModal`, nenhuma mudança necessária).

---

## Checklist Final

- [ ] Build sem erros TypeScript
- [ ] `bun test` — todos os testes existentes passam
- [ ] Campo "Contexto clínico do exame" visível antes do upload após selecionar paciente
- [ ] Conteúdo do campo salvo automaticamente em `vet_notes` ao clicar "Salvar Exame"
- [ ] Campo preenchido ao reabrir o exame no histórico
- [ ] Sem botão "Salvar observação" separado na tela de Exames
