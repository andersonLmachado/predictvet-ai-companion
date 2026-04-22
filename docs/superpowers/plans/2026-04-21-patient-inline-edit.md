# Patient Inline Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar edição inline dos dados do paciente (nome, espécie, raça, tutor, idade) no header do `PatientProfile`, com UPDATE direto no Supabase e refresh do contexto após salvar.

**Architecture:** Toda a lógica de UI fica em `PatientProfile.tsx` via estado local `isEditing`. A lógica pura (payload building + validação) é extraída para `src/lib/patientEdit.ts` para ser testável em Vitest (ambiente node, sem DOM). O UPDATE vai direto para o Supabase via `supabase.from('patients').update(...)`.

**Tech Stack:** React 18, TypeScript, Vitest, Supabase JS client, shadcn/ui (Input, Select, Button)

---

## Arquivo mapeado

| Ação | Arquivo |
|---|---|
| Criar | `src/lib/patientEdit.ts` |
| Criar | `src/tests/patientEdit.test.ts` |
| Modificar | `src/components/pets/PatientProfile.tsx` |

---

## Task 1: Criar utilitário puro `patientEdit.ts` com testes passando

**Files:**
- Create: `src/lib/patientEdit.ts`
- Create: `src/tests/patientEdit.test.ts`

### Sobre o que será testado

A lógica pura que precisa de cobertura:
1. `buildPatientUpdatePayload` — converte o `EditForm` (com `age` como string) no objeto enviado ao Supabase
2. `validatePatientEdit` — retorna string de erro se campos obrigatórios estiverem vazios, ou `null` se válido

---

- [ ] **Step 1.1: Escrever os testes com falha esperada**

Crie `src/tests/patientEdit.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildPatientUpdatePayload, validatePatientEdit } from '../lib/patientEdit';

// ─── buildPatientUpdatePayload ───────────────────────────────────────────────

describe('buildPatientUpdatePayload', () => {
  it('converte age string numérica para number', () => {
    const result = buildPatientUpdatePayload({
      name: 'Thor',
      owner_name: 'João',
      species: 'canina',
      breed: 'Labrador',
      age: '5',
    });
    expect(result.age).toBe(5);
  });

  it('converte age string vazia para null', () => {
    const result = buildPatientUpdatePayload({
      name: 'Luna',
      owner_name: 'Maria',
      species: 'felina',
      breed: 'SRD',
      age: '',
    });
    expect(result.age).toBeNull();
  });

  it('mapeia todos os campos corretamente', () => {
    const result = buildPatientUpdatePayload({
      name: 'Rex',
      owner_name: 'Pedro',
      species: 'canina',
      breed: 'Poodle',
      age: '3',
    });
    expect(result).toEqual({
      name: 'Rex',
      owner_name: 'Pedro',
      species: 'canina',
      breed: 'Poodle',
      age: 3,
    });
  });
});

// ─── validatePatientEdit ─────────────────────────────────────────────────────

describe('validatePatientEdit', () => {
  it('retorna null quando todos os campos obrigatórios estão preenchidos', () => {
    expect(validatePatientEdit({ name: 'Thor', owner_name: 'João', species: 'canina', breed: 'Lab', age: '3' })).toBeNull();
  });

  it('retorna mensagem de erro quando name está vazio', () => {
    const result = validatePatientEdit({ name: '', owner_name: 'João', species: 'canina', breed: 'Lab', age: '3' });
    expect(result).toBe('O nome do animal é obrigatório.');
  });

  it('retorna mensagem de erro quando owner_name está vazio', () => {
    const result = validatePatientEdit({ name: 'Thor', owner_name: '', species: 'canina', breed: 'Lab', age: '3' });
    expect(result).toBe('O nome do tutor é obrigatório.');
  });

  it('age vazia é permitida (campo opcional)', () => {
    expect(validatePatientEdit({ name: 'Thor', owner_name: 'João', species: 'canina', breed: 'Lab', age: '' })).toBeNull();
  });
});
```

- [ ] **Step 1.2: Rodar os testes e confirmar que falham**

```bash
cd predictvet-ai-companion && npx vitest run src/tests/patientEdit.test.ts
```

Esperado: FAIL com `Cannot find module '../lib/patientEdit'`

- [ ] **Step 1.3: Criar `src/lib/patientEdit.ts`**

```ts
export interface EditForm {
  name: string;
  owner_name: string;
  species: string;
  breed: string;
  age: string;
}

export interface PatientUpdatePayload {
  name: string;
  owner_name: string;
  species: string;
  breed: string;
  age: number | null;
}

export function buildPatientUpdatePayload(form: EditForm): PatientUpdatePayload {
  return {
    name: form.name,
    owner_name: form.owner_name,
    species: form.species,
    breed: form.breed,
    age: form.age !== '' ? Number(form.age) : null,
  };
}

export function validatePatientEdit(form: EditForm): string | null {
  if (!form.name.trim()) return 'O nome do animal é obrigatório.';
  if (!form.owner_name.trim()) return 'O nome do tutor é obrigatório.';
  return null;
}
```

- [ ] **Step 1.4: Rodar os testes e confirmar que passam**

```bash
cd predictvet-ai-companion && npx vitest run src/tests/patientEdit.test.ts
```

Esperado: todos os testes PASS (9 testes)

- [ ] **Step 1.5: Commit**

```bash
cd predictvet-ai-companion && git add src/lib/patientEdit.ts src/tests/patientEdit.test.ts
git commit -m "feat: add patientEdit utility with buildPatientUpdatePayload and validatePatientEdit"
```

---

## Task 2: Adicionar estado de edição ao `PatientProfile`

**Files:**
- Modify: `src/components/pets/PatientProfile.tsx`

O objetivo desta task é apenas adicionar os estados e o tipo `EditForm` — sem tocar ainda no JSX. Isso permite confirmar que o TypeScript compila antes de mexer no template.

- [ ] **Step 2.1: Adicionar imports necessários ao `PatientProfile.tsx`**

**a)** Localizar a linha de import existente do `lucide-react` (linha ~12) e adicionar `Edit`, `X`, `Save` à lista já existente:

```ts
// Antes (linha existente):
import { ArrowLeft, PawPrint, User, Calendar, ClipboardList, Activity, Sparkles, Loader2, Stethoscope, Scan } from 'lucide-react';

// Depois (adicionar os três ícones):
import { ArrowLeft, PawPrint, User, Calendar, ClipboardList, Activity, Sparkles, Loader2, Stethoscope, Scan, Edit, X, Save } from 'lucide-react';
```

**b)** Adicionar o import do utilitário e do toast (que não existe no arquivo ainda) após os imports do shadcn/ui:

```ts
import { toast } from '@/hooks/use-toast';
import { buildPatientUpdatePayload, validatePatientEdit, type EditForm } from '@/lib/patientEdit';
```

O import do `supabase` já existe no arquivo — não duplicar.

- [ ] **Step 2.2: Adicionar estados locais de edição dentro do componente `PatientProfile`**

Localizar o bloco de estados existente (logo após `const { id } = useParams...`). Adicionar após `const [dbLoading, setDbLoading] = useState(false);`:

```ts
const [isEditing, setIsEditing] = useState(false);
const [editForm, setEditForm] = useState<EditForm | null>(null);
const [isSaving, setIsSaving] = useState(false);
```

Também precisamos do `loadPatients` e `setSelectedPatient` do contexto. Localizar a linha:

```ts
const { patients, patientsLoaded, selectedPatient } = usePatient();
```

E substituir por:

```ts
const { patients, patientsLoaded, selectedPatient, loadPatients, setSelectedPatient } = usePatient();
```

- [ ] **Step 2.3: Verificar que o TypeScript compila sem erros**

```bash
cd predictvet-ai-companion && npx tsc --noEmit
```

Esperado: sem erros de tipagem

- [ ] **Step 2.4: Commit**

```bash
cd predictvet-ai-companion && git add src/components/pets/PatientProfile.tsx
git commit -m "feat: add edit state types and imports to PatientProfile"
```

---

## Task 3: Implementar `handleSave` e `handleCancelEdit`

**Files:**
- Modify: `src/components/pets/PatientProfile.tsx`

- [ ] **Step 3.1: Adicionar funções de controle de edição**

Após o bloco de `useEffect` que faz o fetch do DB (linha ~729), adicionar as três funções:

```ts
const handleStartEdit = () => {
  if (!patient) return;
  setEditForm({
    name: patient.name,
    owner_name: patient.owner_name,
    species: patient.species ?? '',
    breed: patient.breed ?? '',
    age: patient.age != null ? String(patient.age) : '',
  });
  setIsEditing(true);
};

const handleCancelEdit = () => {
  setIsEditing(false);
  setEditForm(null);
};

const handleSave = async () => {
  if (!editForm || !id) return;

  const validationError = validatePatientEdit(editForm);
  if (validationError) {
    toast({ title: 'Campo obrigatório', description: validationError, variant: 'destructive' });
    return;
  }

  setIsSaving(true);
  try {
    const payload = buildPatientUpdatePayload(editForm);
    const { error } = await supabase.from('patients').update(payload).eq('id', id);

    if (error) throw error;

    // Atualizar estado local imediatamente (evita flash de dados antigos)
    if (dbPatient) {
      setDbPatient({ ...dbPatient, ...payload, age: payload.age });
    }

    // Sincronizar selectedPatient no localStorage se for o mesmo paciente
    if (selectedPatient?.id === id) {
      setSelectedPatient({ ...selectedPatient, ...payload, age: payload.age ?? undefined });
    }

    // Recarregar lista global
    await loadPatients();

    toast({ title: 'Dados salvos!', description: `${payload.name} foi atualizado com sucesso.` });
    setIsEditing(false);
    setEditForm(null);
  } catch (err: any) {
    toast({ title: 'Erro ao salvar', description: err.message ?? 'Tente novamente.', variant: 'destructive' });
  } finally {
    setIsSaving(false);
  }
};
```

O `toast` já está importado no arquivo (`import { toast } from '@/hooks/use-toast'` — verificar e adicionar caso não exista).

- [ ] **Step 3.2: Verificar que o TypeScript compila sem erros**

```bash
cd predictvet-ai-companion && npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Step 3.3: Commit**

```bash
cd predictvet-ai-companion && git add src/components/pets/PatientProfile.tsx
git commit -m "feat: implement handleSave, handleStartEdit, handleCancelEdit in PatientProfile"
```

---

## Task 4: Atualizar o JSX do header para modo visualização/edição

**Files:**
- Modify: `src/components/pets/PatientProfile.tsx`

A seção do header está entre as linhas `{/* Header */}` e `{/* Tabs */}` (~linhas 756–784). Substituir inteiramente esse bloco pelo seguinte:

- [ ] **Step 4.1: Substituir o bloco `{/* Header */}` pelo JSX de edição inline**

Localizar:
```tsx
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PawPrint className="h-6 w-6 text-primary" />
              {patient.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {patient.species}{patient.breed ? ` • ${patient.breed}` : ''} • Tutor: {patient.owner_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/patient/${id}/ultrasound`)}>
            <Scan className="h-4 w-4 mr-1.5" />
            Novo Laudo US
          </Button>
          <Button variant="outline" onClick={() => navigate(`/anamnese/${id}`)}>
            <Stethoscope className="h-4 w-4 mr-1.5" />
            Nova Anamnese
          </Button>
          <Button onClick={() => navigate(`/paciente/${id}/relatorio-alta`)}>
            Relatório de Alta
          </Button>
        </div>
      </div>
```

Substituir por:
```tsx
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/patients')} disabled={isEditing}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {isEditing && editForm ? (
            /* ── Modo edição ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Nome do animal *</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => f ? { ...f, name: e.target.value } : f)}
                  placeholder="Nome do animal"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Espécie</label>
                <Select
                  value={editForm.species}
                  onValueChange={(v) => setEditForm((f) => f ? { ...f, species: v } : f)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Espécie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canina">Canina</SelectItem>
                    <SelectItem value="felina">Felina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Raça</label>
                <Input
                  value={editForm.breed}
                  onChange={(e) => setEditForm((f) => f ? { ...f, breed: e.target.value } : f)}
                  placeholder="Raça"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tutor *</label>
                <Input
                  value={editForm.owner_name}
                  onChange={(e) => setEditForm((f) => f ? { ...f, owner_name: e.target.value } : f)}
                  placeholder="Nome do tutor"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Idade (anos)</label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.age}
                  onChange={(e) => setEditForm((f) => f ? { ...f, age: e.target.value } : f)}
                  placeholder="Ex: 5"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ) : (
            /* ── Modo visualização ── */
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <PawPrint className="h-6 w-6 text-primary" />
                {patient.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {patient.species}{patient.breed ? ` • ${patient.breed}` : ''} • Tutor: {patient.owner_name}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            /* ── Botões de edição ── */
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="h-4 w-4 mr-1.5" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Salvar
              </Button>
            </>
          ) : (
            /* ── Botões de navegação ── */
            <>
              <Button variant="outline" onClick={handleStartEdit}>
                <Edit className="h-4 w-4 mr-1.5" />
                Editar
              </Button>
              <Button variant="outline" onClick={() => navigate(`/patient/${id}/ultrasound`)}>
                <Scan className="h-4 w-4 mr-1.5" />
                Novo Laudo US
              </Button>
              <Button variant="outline" onClick={() => navigate(`/anamnese/${id}`)}>
                <Stethoscope className="h-4 w-4 mr-1.5" />
                Nova Anamnese
              </Button>
              <Button onClick={() => navigate(`/paciente/${id}/relatorio-alta`)}>
                Relatório de Alta
              </Button>
            </>
          )}
        </div>
      </div>
```

- [ ] **Step 4.2: Adicionar imports de `Select` e `Input` que ainda não estejam no arquivo**

Verificar a linha de imports do shadcn/ui no topo do `PatientProfile.tsx`. Ela já deve ter `Button`, `Card`, `Badge`, `Skeleton`. Adicionar `Input` e `Select` se ausentes:

```ts
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```

- [ ] **Step 4.3: Verificar que o TypeScript compila sem erros**

```bash
cd predictvet-ai-companion && npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Step 4.4: Rodar todos os testes existentes para garantir nenhuma regressão**

```bash
cd predictvet-ai-companion && npx vitest run
```

Esperado: todos os testes passam (incluindo os novos de `patientEdit`)

- [ ] **Step 4.5: Commit**

```bash
cd predictvet-ai-companion && git add src/components/pets/PatientProfile.tsx
git commit -m "feat: add inline edit UI to PatientProfile header"
```

---

## Task 5: Teste manual no browser

- [ ] **Step 5.1: Subir o servidor de desenvolvimento**

```bash
cd predictvet-ai-companion && npm run dev
```

- [ ] **Step 5.2: Testar o caminho feliz**

1. Abrir um paciente existente em `/patient/<id>`
2. Clicar em "Editar" — verificar que o header vira inputs com os valores atuais preenchidos
3. Alterar o nome do animal
4. Clicar em "Salvar" — verificar spinner durante o save
5. Verificar que o header volta ao modo visualização com o novo nome
6. Verificar que o toast de sucesso aparece

- [ ] **Step 5.3: Testar cancelamento**

1. Clicar em "Editar"
2. Alterar algum campo
3. Clicar em "Cancelar"
4. Verificar que os dados originais estão exibidos (sem alteração)

- [ ] **Step 5.4: Testar validação**

1. Clicar em "Editar"
2. Limpar o campo "Nome do animal"
3. Clicar em "Salvar"
4. Verificar que o toast de erro aparece com "O nome do animal é obrigatório." e o modo edição permanece ativo

- [ ] **Step 5.5: Commit final**

```bash
cd predictvet-ai-companion && git add -p
git commit -m "feat: patient inline edit complete - name, species, breed, owner, age"
```
