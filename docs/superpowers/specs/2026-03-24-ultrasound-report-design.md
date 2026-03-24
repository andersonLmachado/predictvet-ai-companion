# Design: Módulo de Laudo Ultrassonográfico Guiado

**Data:** 2026-03-24
**Branch:** `feat/ultrasound-report`
**Status:** Aprovado (v2 — pós spec-review)

---

## Contexto

O vet precisa gerar laudos ultrassonográficos completos no padrão clínico sem digitar texto livre. O módulo permite preencher medidas por órgão via texto ou voz — o sistema substitui os valores nos templates clínicos e gera o laudo completo automaticamente.

---

## Escopo

| Incluso | Excluído |
|---|---|
| Formulário guiado por órgão (cão e felino) | Integração WhatsApp para tutor |
| Geração automática do laudo em texto | Edição manual do texto do laudo |
| Entrada por voz via Whisper/n8n | Workflow n8n (criado separadamente) |
| Export PDF via window.print() | Assinatura digital |
| Histórico de laudos no perfil do paciente | Laudos de outras modalidades (RX, TC) |
| Valores de referência por espécie/peso | Suporte a mais espécies além de canis/felis |

---

## Arquitetura

### Fluxo de dados

```
Vet abre /patient/:id/ultrasound
  → UltrasoundPage busca patients (species, sex, weight, age) do Supabase
  → Mapeia species: "canina" → "canis", "felina" → "felis"
  → Se species não mapeável: mostra erro "Espécie não suportada" e bloqueia o formulário
  → Mapeia sex: "macho" → pré-preenche "male", "femea" → pré-preenche "female"
  → Status reprodutivo (castrado/inteiro) sempre requer seleção manual pelo vet
  → Vet preenche medidas por órgão

  Caminho voz (instância única de useUltrasoundWhisper em UltrasoundForm):
    Vet clica microfone da seção → UltrasoundForm.startRecording(organ)
    MediaRecorder → Blob audio/webm → btoa() → base64
    POST { audio: base64, organ: string } → VITE_N8N_ULTRASOUND_WEBHOOK_URL
    → { transcription: string }
    → parseVoiceMeasurements(transcription, organ)
    → preenche campos do órgão

  Caminho salvar:
    generateReport(data, species, sex) → texto clínico completo
    INSERT ultrasound_reports { ...campos, veterinarian_id, generated_report }
    → toast de sucesso

  Caminho PDF (síncrono, dentro do click handler, sem await antes de window.open):
    buildPrintableHtml(report, patient) → string HTML
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.print()
```

### Stack

Sem dependências novas. Usa exclusivamente o que já existe no projeto:

- React + shadcn/ui (Accordion, Card, Input, Button, Badge, Textarea, Select, Skeleton)
- Supabase (`@supabase/supabase-js`) para persistência
- `MediaRecorder` API nativa para captura de áudio
- `window.print()` para PDF (mesmo padrão do DischargeSummary)

---

## Banco de dados

### Tabela `ultrasound_reports`

```sql
CREATE TABLE ultrasound_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  veterinarian_id UUID NOT NULL REFERENCES auth.users(id),
  species TEXT NOT NULL CHECK (species IN ('canis', 'felis')),
  sex TEXT NOT NULL CHECK (sex IN ('female', 'male', 'male_castrated', 'female_castrated')),

  -- Bexiga
  bladder_wall_cm NUMERIC(4,2),
  bladder_notes TEXT,

  -- Rins
  kidney_left_cm NUMERIC(4,2),
  kidney_right_cm NUMERIC(4,2),
  kidney_pelvis_left_cm NUMERIC(4,2),
  kidney_pelvis_right_cm NUMERIC(4,2),
  kidney_notes TEXT,

  -- Fígado
  liver_notes TEXT,

  -- Vesícula Biliar
  gallbladder_wall_cm NUMERIC(4,2),
  gallbladder_duct_cm NUMERIC(4,2),
  gallbladder_notes TEXT,

  -- Estômago
  stomach_wall_cm NUMERIC(4,2),
  stomach_region TEXT,
  stomach_notes TEXT,

  -- Trato Intestinal
  intestine_duodenum_cm NUMERIC(4,2),
  intestine_jejunum_cm NUMERIC(4,2),
  intestine_ileum_cm NUMERIC(4,2),
  intestine_colon_cm NUMERIC(4,2),
  intestine_notes TEXT,

  -- Baço
  spleen_notes TEXT,

  -- Pâncreas
  pancreas_right_lobe_cm NUMERIC(4,2),
  pancreas_left_lobe_cm NUMERIC(4,2),
  pancreas_duct_cm NUMERIC(4,2),
  pancreas_notes TEXT,

  -- Adrenais
  adrenal_left_cm NUMERIC(4,2),
  adrenal_right_cm NUMERIC(4,2),
  adrenal_notes TEXT,

  -- Reprodutivo Fêmea
  uterus_notes TEXT,
  ovary_left_cm1 NUMERIC(4,2),
  ovary_left_cm2 NUMERIC(4,2),
  ovary_right_cm1 NUMERIC(4,2),
  ovary_right_cm2 NUMERIC(4,2),

  -- Reprodutivo Macho
  prostate_length_cm NUMERIC(4,2),
  prostate_height_cm NUMERIC(4,2),
  prostate_width_cm NUMERIC(4,2),
  testis_left_cm1 NUMERIC(4,2),
  testis_left_cm2 NUMERIC(4,2),
  testis_right_cm1 NUMERIC(4,2),
  testis_right_cm2 NUMERIC(4,2),

  -- Impressão e metadados
  diagnostic_impression TEXT,
  equipment TEXT DEFAULT 'Infinit X PRO',
  generated_report TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ultrasound_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vet acessa próprios laudos"
  ON ultrasound_reports FOR ALL TO authenticated
  USING (auth.uid() = veterinarian_id);
```

**Nota arquivística:** `species` e `sex` são armazenados no laudo (independente do cadastro) para integridade do documento gerado.

### Mapeamento de campos do paciente

**`patients.species`** armazena `"canina"`, `"felina"` e outros valores livres. O `UltrasoundPage` mapeia:
- `"canina"` → `"canis"`
- `"felina"` → `"felis"`
- qualquer outro valor → bloqueia formulário com mensagem "Espécie não suportada para laudo ultrassonográfico"

**`patients.sex`** armazena `"macho"`, `"femea"`, `"desconhecido"`. O `UltrasoundPage` faz pré-preenchimento parcial:
- `"macho"` → `reproductiveStatus = "male"` (pré-selecionado no Select)
- `"femea"` → `reproductiveStatus = "female"` (pré-selecionado)
- outros → `reproductiveStatus = ""` (vet deve selecionar)

**Importante:** O cadastro de pacientes não possui campo de castração. O status `male_castrated` / `female_castrated` é sempre selecionado manualmente pelo vet no formulário de ultrassom. O Select de "Status Reprodutivo" oferece as 4 opções independentemente do valor pré-preenchido.

---

## Tipos compartilhados

### `src/types/ultrasound.ts` (novo arquivo)

Define `UltrasoundReportData` — interface única usada por `ultrasoundReportGenerator.ts`, `ultrasoundVoiceParser.ts` e `UltrasoundForm.tsx`. Contém todos os campos numéricos e de texto da tabela, mais `species`, `sex`, `equipment`, `diagnostic_impression`.

Este arquivo deve ser criado **antes** dos demais para permitir paralelização.

---

## Componentes e bibliotecas

### Novos arquivos

#### `src/types/ultrasound.ts`
Interface `UltrasoundReportData` com todos os campos. Pré-requisito para os demais.

#### `src/lib/ultrasoundReferences.ts`
- Constantes de referência por espécie (`'canis'` | `'felis'`)
- `checkReference(value: number, min: number, max: number): 'normal' | 'alto' | 'baixo'`
- `getAdrenalReference(species: 'canis' | 'felis', side: 'left' | 'right', weightKg: number | null): { min: number; max: number } | null`
  - Retorna `null` quando `weightKg` é `null` ou está fora das faixas tabeladas (cão < 2.5 kg ou > 40 kg; felino > 8 kg)
  - `MeasurementField` com `refMin/refMax = null` apenas não exibe indicador de referência (nunca lança erro)
- `getPancreasDuctReference(species: 'canis' | 'felis', ageYears: number | null): { max: number } | null`
  - Felis: `ageYears < 10` → `{ max: 0.13 }`, `ageYears >= 10` → `{ max: 0.25 }`, `ageYears = null` → mostra **ambas** as referências no placeholder do campo
  - Canis: retorna `null` (sem referência tabelada para ducto)

#### `src/lib/ultrasoundReportGenerator.ts`
- `generateReport(data: UltrasoundReportData): string`
  - Usa `data.species` e `data.sex` internamente
  - Templates clínicos completos para cada órgão
  - Campos não preenchidos (`null`/`undefined`/`""`) → `[não mensurado]`
  - Seções reprodutivas condicionais por `data.sex`
  - Rodapé fixo com disclaimer e `data.equipment`
- `buildPrintableHtml(reportText: string, patient: { name: string; species: string; owner_name: string; age: string | null }, date: string): string`
  - Retorna string HTML completo para `window.document.write()`
  - Inclui cabeçalho (nome, espécie, tutor, data), corpo do laudo em fonte monoespaçada, rodapé com data de geração

#### `src/lib/ultrasoundVoiceParser.ts`
- `parseVoiceMeasurements(transcript: string, organ: string): Partial<UltrasoundReportData>`
- Mapa PT-BR de numerais por extenso → float (`"três vírgula dois"` → `3.2`, `"zero vírgula quatorze"` → `0.14`)
- Regex contextual por órgão
- Retorna `{}` se nenhum valor for extraído — nunca lança erro

#### `src/hooks/useUltrasoundWhisper.ts`
Hook **único por formulário**, não por seção.

```ts
interface UseUltrasoundWhisperReturn {
  isRecording: boolean;
  isProcessing: boolean;
  currentOrgan: string | null;
  startRecording: (organ: string) => Promise<void>;
  stopRecording: () => void;
  webhookConfigured: boolean; // false se VITE_N8N_ULTRASOUND_WEBHOOK_URL não definida
}
```

- `startRecording(organ)` guarda o órgão corrente, inicia `MediaRecorder`
- `stopRecording()` encerra e dispara o processamento
- Blob → `btoa()` → base64, POST `{ audio, organ }` para `VITE_N8N_ULTRASOUND_WEBHOOK_URL`
- **Se env var ausente:** `webhookConfigured = false`, `startRecording` retorna sem fazer nada, sem erro
- Callback `onTranscription(organ: string, transcript: string)` para que `UltrasoundForm` encaminhe ao parser correto
- Impede gravação simultânea: `startRecording` é no-op se `isRecording = true`

#### `src/components/ultrasound/MeasurementField.tsx`

```ts
interface MeasurementFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  refMin?: number | null;
  refMax?: number | null;
  placeholder?: string;
  disabled?: boolean;
}
```

- Input numérico com sufixo "cm" fixo
- `refMin`/`refMax` presentes: placeholder exibe range, borda amarela se valor fora
- `refMin`/`refMax` ausentes ou `null`: campo renderiza normalmente sem indicador de referência

#### `src/components/ultrasound/OrganSection.tsx`

```ts
interface OrganSectionProps {
  title: string;
  status: 'empty' | 'normal' | 'abnormal';
  children: React.ReactNode;          // campos MeasurementField
  notes: string;
  onNotesChange: (v: string) => void;
  onMicClick: () => void;
  isRecordingThis: boolean;           // true quando este órgão está sendo gravado
  isProcessing: boolean;
  micDisabled: boolean;               // true quando webhook não configurado
}
```

- Accordion item (shadcn/ui)
- Ícone de status no trigger: ✓ verde (`normal`), ⚠ amarelo (`abnormal`), ○ cinza (`empty`)
- Botão microfone no header; tooltip "Webhook não configurado" quando `micDisabled`
- `isRecordingThis`: anima o botão de microfone (pulse) apenas para o órgão ativo

#### `src/components/ultrasound/UltrasoundForm.tsx`

Componente principal. Instancia **um único** `useUltrasoundWhisper`, passa `organ` em `startRecording(organ)`.

**Cálculo de status por órgão** (computado em memo a cada mudança de formulário):

Órgãos com campos numéricos:
- `'empty'`: todos os campos numéricos vazios/null E notes vazio
- `'abnormal'`: pelo menos um campo numérico preenchido E fora do range de referência (considerando apenas campos que possuem `refMin`/`refMax` — campos sem referência tabelada não contribuem para `abnormal`)
- `'normal'`: pelo menos um campo preenchido E nenhum campo fora do range

Órgãos somente com notes (fígado, baço, útero castrado, testículos castrado):
- `'normal'` se notes não vazio; `'empty'` se vazio; nunca `'abnormal'`

**Age parsing** (para referência do ducto pancreático felino):
- `patients.age` é string livre (`"3 anos"`, `"6 meses"`, `"2"`, `"adulto"`, `"filhote"`)
- `UltrasoundPage` extrai o primeiro número da string e normaliza: se contém `"meses"` ou `"mes"` → divide por 12; caso contrário assume anos
- Se a string não contém número algum (ex: `"adulto"`, `"filhote"`, `null`) → `ageYears = null`
- `ageYears: number | null` passado para `UltrasoundForm`; se `null`, campo ducto exibe ambas as referências no placeholder (`"< 10 anos: ≤ 0.13 cm | ≥ 10 anos: ≤ 0.25 cm"`)
- **Fallback geral:** quando `ageYears = null`, todas as referências dependentes de idade são ignoradas → usa apenas referências por espécie. Nenhum campo é marcado como `'abnormal'` com base em referências etárias se a idade é desconhecida.

**Ao salvar:**
1. Valida `reproductiveStatus` preenchido (erro inline se vazio)
2. `generateReport(formData)` → `generated_report`
3. `supabase.from('ultrasound_reports').insert({ ...formData, veterinarian_id: user.id, generated_report })`
4. Toast de sucesso

**Ao exportar PDF (síncrono, dentro do onClick):**
1. Monta `html = buildPrintableHtml(generated_report ?? generateReport(formData), patient, new Date().toLocaleDateString('pt-BR'))`
2. `const w = window.open('', '_blank', 'noopener,noreferrer')`
3. `w.document.write(html)` → `w.document.close()` → `w.print()`
4. Nenhum `await` antes de `window.open()` — garante que não seja bloqueado pelo browser

#### `src/pages/UltrasoundPage.tsx`

Busca via Supabase: `id, name, species, sex, weight, age, owner_name` do paciente.
- Mapeia `species` (canina/felina → canis/felis); bloqueia se desconhecida
- Mapeia `sex` (macho/femea → male/female) como valor inicial do Select
- Analisa `age` para `ageYears: number | null`
- Renderiza `UltrasoundForm` com props derivados

### Arquivos modificados

#### `src/App.tsx`
Nova rota protegida (padrão inglês, consistente com `/patient/:id` já existente):
```tsx
<Route path="/patient/:id/ultrasound" element={
  <ProtectedRoute><MainLayout><UltrasoundPage /></MainLayout></ProtectedRoute>
} />
```

#### `src/components/pets/PatientProfile.tsx`
1. Botão "Novo Laudo US" no header (junto com "Nova Anamnese"):
   ```tsx
   <Button variant="outline" onClick={() => navigate(`/patient/${id}/ultrasound`)}>
     <Scan className="h-4 w-4 mr-1.5" />
     Novo Laudo US
   </Button>
   ```
2. Nova aba "Laudos US" — lista `ultrasound_reports` do paciente (data + espécie/sexo + botão "Ver PDF")

---

## Valores de referência

### Cães (canis)

| Órgão/Campo | min | max |
|---|---|---|
| Bexiga parede | — | 0.14 |
| Pelve renal | — | 0.20 |
| Duodeno | — | 0.50 |
| Jejuno | — | 0.30 |
| Íleo | — | 0.50 |
| Cólon | — | 0.15 |
| Estômago parede | — | 0.50 |

Adrenais por peso (GAE = adrenal esquerda, GAD = adrenal direita).
**Fora das faixas (< 2.5 kg ou > 40 kg):** `getAdrenalReference` retorna `null` — campo sem indicador de referência.

| Peso (kg) | GAE min | GAE max | GAD min | GAD max |
|---|---|---|---|---|
| 2.5–5 | 0.32 | 0.51 | 0.28 | 0.53 |
| 5–10 | 0.30 | 0.55 | 0.34 | 0.68 |
| 10–20 | 0.38 | 0.64 | 0.35 | 0.75 |
| 20–40 | 0.47 | 0.73 | 0.51 | 0.87 |

### Felinos (felis)

| Órgão/Campo | min | max |
|---|---|---|
| Bexiga parede | 0.13 | 0.17 |
| Rins | 3.0 | 4.5 |
| Pelve renal | — | 0.20 |
| Pâncreas lobo esquerdo | — | 0.90 |
| Pâncreas lobo direito | — | 0.60 |
| Ducto pancreático (< 10 anos) | — | 0.13 |
| Ducto pancreático (≥ 10 anos) | — | 0.25 |
| Vesícula ducto | — | 0.40 |
| Duodeno | — | 0.22 |
| Jejuno | — | 0.22 |
| Íleo entre dobras | 0.17 | 0.23 |
| Cólon | 0.10 | 0.25 |
| Estômago entre rugas | 0.11 | 0.36 |
| Baço região hilar | — | 1.00 |

Adrenais por peso. **Fora das faixas (> 8 kg):** retorna `null`.

| Peso (kg) | min | max |
|---|---|---|
| < 4 | 0.24 | 0.39 |
| 4–8 | 0.26 | 0.48 |

---

## Voice parser — exemplos

| Entrada (transcript) | Órgão | Saída |
|---|---|---|
| "rim esquerdo três vírgula dois rim direito três vírgula quatro" | `kidney` | `{ kidney_left_cm: 3.2, kidney_right_cm: 3.4 }` |
| "parede zero vírgula quatorze" | `bladder` | `{ bladder_wall_cm: 0.14 }` |
| "lobo direito zero vírgula oito lobo esquerdo zero vírgula seis" | `pancreas` | `{ pancreas_right_lobe_cm: 0.8, pancreas_left_lobe_cm: 0.6 }` |
| "próstata comprimento dois vírgula três altura um vírgula oito largura dois" | `reproductive` | `{ prostate_length_cm: 2.3, prostate_height_cm: 1.8, prostate_width_cm: 2.0 }` |

---

## Seções condicionais por sexo

| `reproductiveStatus` | Seção exibida |
|---|---|
| `female` | Útero (notes) + Ovários E (cm1, cm2) + Ovários D (cm1, cm2) |
| `female_castrated` | Banner: "Útero e ovários não caracterizados — paciente ovariohisterectomizada" |
| `male` | Próstata (comprimento, altura, largura) + Testículos E (cm1, cm2) + Testículos D (cm1, cm2) |
| `male_castrated` | Banner: "Testículos ausentes — paciente orquiectomizado" |

---

## Template do laudo gerado

Estrutura do texto gerado por `generateReport()`:

```
BEXIGA URINÁRIA: com repleção adequada, topografia habitual, apresentando sua forma
mantida, parede normal medindo {bladder_wall_cm} cm e conteúdo anecogênico homogêneo.
Não há sinais de presença de urolitíase.

RINS: simétricos, apresentando dimensões normais (RE: {kidney_left_cm} cm e RD:
{kidney_right_cm} cm; em eixo longitudinal), topografia habitual, contornos regulares,
cortical com arquitetura e ecogenicidade mantida, região medular com arquitetura e
espessura preservada. Definição córtico-medular mantida. Não há sinais de cálculos nem
sinal da medular. Pelve renal esquerda medindo {kidney_pelvis_left_cm} cm e a direita
medindo {kidney_pelvis_right_cm} cm.

[... demais órgãos seguem o mesmo padrão clínico ...]

{seção reprodutiva condicional por sex}

IMPRESSÃO DIAGNÓSTICA:
{diagnostic_impression}

---
Não foram observadas linfonodomegalia e líquido livre.
Os exames de imagem devem ser correlacionados com o acompanhamento clínico do paciente
e demais exames, igualmente complementares.
Laudo em 48 a 72 horas úteis.
Aparelho utilizado neste exame: {equipment}
```

---

## Dependências externas

### Webhook n8n — ultrasound-transcription

**Status:** Não criado (será implementado separadamente pelo time)
**Env var:** `VITE_N8N_ULTRASOUND_WEBHOOK_URL`
**URL de produção esperada:** `https://n8nvet.predictlab.com.br/webhook/ultrasound-transcription`

**Contrato:**
```
Request:  POST Content-Type: application/json
          { "audio": "<base64 webm>", "organ": "<nome do órgão>" }
Response: { "transcription": "<texto>" }
```

**Comportamento quando não configurado:**
- `useUltrasoundWhisper.webhookConfigured = false`
- Todos os botões de microfone exibem tooltip "Transcrição por voz não configurada"
- O restante do formulário funciona normalmente (preenchimento manual)

---

## Testes

| Cenário | Tipo |
|---|---|
| `generateReport()` cão fêmea inteira com todos os campos | Unit |
| `generateReport()` felino macho castrado | Unit |
| `checkReference()` dentro e fora do range, e com `null` | Unit |
| `getAdrenalReference()` para peso fora das faixas → `null` | Unit |
| `getPancreasDuctReference()` felino < 10 anos, ≥ 10 anos, idade `null` | Unit |
| `parseVoiceMeasurements()` para cada órgão (rim, bexiga, pâncreas, reprodutivo) | Unit |
| Campos condicionais por sexo renderizam corretamente | Component |
| Botão microfone desabilitado quando env var ausente | Component |
| Status ✓/⚠/○ calculado corretamente em UltrasoundForm | Component |
| Salva no Supabase com `veterinarian_id` correto | Integration (manual) |
| Bloqueia salvamento se `reproductiveStatus` vazio | Component |
| Espécie não suportada exibe erro e bloqueia formulário | Component |

---

## Ordem de implementação

```
Tarefa 0: src/types/ultrasound.ts          (pré-requisito, sem dep)
Tarefa 1: Migration SQL                     (sem dep)
Tarefa 2: ultrasoundReferences.ts           (dep: types)
Tarefa 3: ultrasoundReportGenerator.ts      (dep: types) ← PAUSA pós esta tarefa
Tarefa 4: ultrasoundVoiceParser.ts          (dep: types)
Tarefa 5: useUltrasoundWhisper.ts           (dep: MediaRecorder API)
Tarefa 6: MeasurementField → OrganSection → UltrasoundForm  (dep: 0, 2, 4, 5)
Tarefa 7: UltrasoundPage + App.tsx + PatientProfile         (dep: 6)
Tarefa 8: buildPrintableHtml + PDF export   (dep: 3, 7)
```

**Pausa para review intermediário após Tarefa 3** (Migration + types + references + generator).
