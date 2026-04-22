# Design: Edição Inline de Dados do Paciente

**Data:** 2026-04-21
**Branch:** fix/patient-edit
**Componente alvo:** `src/components/pets/PatientProfile.tsx`

---

## Problema

Não existe forma de editar os dados de um paciente já cadastrado (nome, espécie, raça, tutor, idade) na tela de perfil.

## Solução

Inline edit no header do `PatientProfile`, sem modal separado. Abordagem escolhida: adicionar estado de edição diretamente no componente existente (Opção A), seguindo o padrão já estabelecido no arquivo.

---

## Arquitetura

### Estado local adicionado ao `PatientProfile`

```ts
interface EditForm {
  name: string;
  owner_name: string;
  species: string;
  breed: string;
  age: string; // string para controle do input; convertido para number|null no save
}

const [isEditing, setIsEditing] = useState(false);
const [editForm, setEditForm] = useState<EditForm | null>(null);
const [isSaving, setIsSaving] = useState(false);
```

### Fluxo de edição

1. **Clique em "Editar"** → `isEditing = true`, `editForm` é inicializado com os valores atuais do `patient`
2. **Usuário altera campos** → `setEditForm(prev => ({ ...prev, [field]: value }))`
3. **Clique em "Salvar"** → `isSaving = true` → UPDATE no Supabase → sucesso: atualiza contexto, `isEditing = false`; erro: toast de erro, permanece em modo edição
4. **Clique em "Cancelar"** → `isEditing = false`, `editForm` descartado sem nenhuma mutação

---

## UI

### Modo visualização (estado atual + botão Editar)

```
[←] Thor                          [Editar] [Novo Laudo US] [Nova Anamnese] [Relatório de Alta]
    Canina • Labrador • Tutor: João Silva
```

O botão "Editar" é adicionado como primeiro item do grupo de ações no lado direito do header.

### Modo edição

- O bloco de título e subtítulo é substituído por um grid de inputs:
  - `name` → `<Input>` (texto, obrigatório)
  - `species` → `<Select>` com opções "canina" / "felina"
  - `breed` → `<Input>` (texto)
  - `owner_name` → `<Input>` (texto, obrigatório)
  - `age` → `<Input type="number" min="0">` (anos, opcional)
- Os botões do lado direito são substituídos por **"Salvar"** (primary, spinner durante save) e **"Cancelar"** (outline)
- Os botões Novo Laudo US, Nova Anamnese e Relatório de Alta ficam ocultos durante a edição para evitar navegação acidental

---

## Camada de dados

### UPDATE no Supabase

```ts
const { error } = await supabase
  .from('patients')
  .update({
    name: editForm.name,
    owner_name: editForm.owner_name,
    species: editForm.species,
    breed: editForm.breed,
    age: editForm.age !== '' ? Number(editForm.age) : null,
  })
  .eq('id', id);
```

Acesso direto via `supabase` client, dentro do contexto do usuário autenticado. Respeita o RLS. Segue o padrão já existente no `PatientProfile` para leituras diretas.

### Atualização de estado após salvar

1. `loadPatients()` — recarrega a lista global no `PatientContext`
2. Se `selectedPatient?.id === id` → `setSelectedPatient({ ...selectedPatient, ...updatedFields })` para manter o `localStorage` sincronizado imediatamente
3. Se o patient foi carregado via fallback do DB (`dbPatient`) → `setDbPatient(updated)` para evitar flash de dados antigos enquanto o `loadPatients()` termina

---

## Tratamento de erros

- Erro no UPDATE → `toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message })`
- Modo edição permanece ativo; usuário pode tentar novamente ou cancelar
- Campos obrigatórios (`name`, `owner_name`) validados antes de chamar o Supabase

---

## Testes

| Cenário | Resultado esperado |
|---|---|
| Editar nome e salvar | Header exibe novo nome; UPDATE chega no Supabase |
| Cancelar edição | Dados originais permanecem; nenhuma chamada ao Supabase |
| Erro de rede no UPDATE | Toast de erro; modo edição permanece ativo |
| Salvar com campo obrigatório vazio | Toast de validação; sem chamada ao Supabase |

---

## Arquivos modificados

- `src/components/pets/PatientProfile.tsx` — único arquivo alterado
