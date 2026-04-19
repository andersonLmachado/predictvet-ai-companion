# Home Redesign — Landing Page Completa

**Data:** 2026-04-19  
**Branch:** `feat/home-redesign` (a partir de `main`)  
**Escopo:** Substituir a home page atual por uma landing page de 6 seções que conta a história do PredictLab progressivamente.

---

## Decisões de design

| Ponto | Decisão |
|---|---|
| Estilo do Hero | Dark gradient (mantém identidade visual atual) |
| Fundo das seções | Alternância branco / azul-gelo; Inteligência Clínica em dark |
| Botão "Ver demonstração" | Smooth scroll para `#features` (âncora na mesma página) |
| Abordagem de implementação | Um componente por seção (Abordagem A) |

---

## Arquitetura de arquivos

### Arquivos a modificar

| Arquivo | Ação |
|---|---|
| `src/pages/Index.tsx` | Atualizar imports e ordem das seções |
| `src/components/homepage/HeroSection.tsx` | Atualizar tag, título, subtítulo e CTAs |
| `src/components/homepage/FeaturesSection.tsx` | Reescrever — grid 2 colunas, 6 cards |

### Arquivos a criar

| Arquivo | Seção |
|---|---|
| `src/components/homepage/ProblemSection.tsx` | Seção 2 — Problema/Solução |
| `src/components/homepage/ClinicalIntelligenceSection.tsx` | Seção 4 — Inteligência Clínica (dark) |
| `src/components/homepage/MetricsSection.tsx` | Seção 5 — Métricas |
| `src/components/homepage/HowToStartSection.tsx` | Seção 6 — Como começar + CTA |

### Arquivos desconectados de `Index.tsx` (não deletados)

`WhyChooseSection`, `FAQSection`, `CTASection` — removidos dos imports/render de `Index.tsx`. Arquivos físicos preservados.

### Ordem final em `Index.tsx`

```
HeroSection                   ← dark gradient (atualizado)
ProblemSection                ← fundo branco
FeaturesSection               ← fundo azul-gelo, id="features"
HowItWorksSection             ← fundo branco, sem alteração (8 etapas)
ClinicalIntelligenceSection   ← fundo dark hsl(222,77%,10%)
MetricsSection                ← fundo azul-gelo
HowToStartSection             ← fundo branco + CTA final
```

---

## Seções — especificação detalhada

### Seção 1 — HeroSection (atualizada)

**Arquivo:** `src/components/homepage/HeroSection.tsx`

**Fundo:** dark gradient existente — sem alteração.  
**Navbar:** sem alteração.  
**Logo hero e floating badges:** sem alteração.

**Mudanças:**

- **Tag pill:** `"Para médicos veterinários"` — dot verde `hsl(162,70%,55%)`, fundo `hsla(217,88%,57%,0.15)`, borda `hsla(217,88%,57%,0.3)`
- **Título (h1):** `"O prontuário inteligente que pensa com você durante a consulta"` — Sora bold, `hsl(213,100%,97%)`
- **Subtítulo:** `"O PredictLab estrutura a anamnese, gera o SOAP automaticamente, analisa exames laboratoriais e acompanha a evolução clínica do paciente — tudo em um só lugar."` — Nunito Sans, `hsla(213,100%,88%,0.65)`
- **Botão primário:** `"Começar gratuitamente"` → `Link to="/register"` — gradiente azul existente
- **Botão secundário:** `"Ver demonstração →"` → `<a href="#features">` com `scroll-behavior: smooth` — fundo `hsla(0,0%,100%,0.07)`, borda `hsla(217,88%,57%,0.3)`, texto `hsl(213,100%,90%)`

---

### Seção 2 — ProblemSection (nova)

**Arquivo:** `src/components/homepage/ProblemSection.tsx`  
**Fundo:** `#ffffff`  
**Padding:** `py-24 px-6 md:px-12`  
**Container:** `max-w-3xl mx-auto`

**Conteúdo:**

- Label: `"O problema que resolvemos"` — uppercase, verde `#0F6E56`, tamanho 11px
- Título (h2): `"O veterinário perde tempo com papelada, não com o paciente"` — Sora, `hsl(222,77%,12%)`
- 3 linhas de comparação, separadas por `border-bottom: 0.5px solid #e0e0e0`:

| Antes | Com PredictLab |
|---|---|
| Anamnese manual | Anamnese guiada em 3 min |
| Comparar laudos manualmente | Comparativo automático com linha de tendência |
| Laudo US manual | Roteiro guiado por voz/texto |

**Layout de cada linha:**
- Dois blocos lado a lado separados por seta `→`
- Bloco "Antes": ícone `X` vermelho `hsl(0,72%,55%)` + texto `hsl(222,30%,50%)`
- Bloco "Com PredictLab": ícone `Check` verde `#0F6E56` + texto `hsl(222,77%,12%)` em semi-bold
- Mobile: empilhado verticalmente

---

### Seção 3 — FeaturesSection (reescrita)

**Arquivo:** `src/components/homepage/FeaturesSection.tsx`  
**Fundo:** `hsl(213,100%,98%)`  
**Atributo:** `id="features"` na tag `<section>` para o scroll  
**Grid:** `grid-cols-1 sm:grid-cols-2`, `gap-6`  
**Container:** `max-w-4xl mx-auto`

**Header:**
- Label pill: `"Funcionalidades"` — azul `hsl(221,73%,45%)`
- Título: `"Tudo que você precisa em uma consulta"` — Sora bold
- Sem subtítulo longo

**6 cards** — estrutura de cada card:
- Topo colorido `h-1` com `background: accent`
- Tag de categoria (pequena, colorida)
- Ícone `w-10 h-10` em container com fundo `accent + 15%`
- Título (Sora, 15px, bold)
- Descrição curta (Nunito Sans, 13px, `hsl(222,30%,55%)`)

| # | Título | Ícone (lucide) | Accent | Tag |
|---|---|---|---|---|
| 1 | Anamnese guiada com IA | `ClipboardList` | `hsl(162,70%,38%)` | Clínico |
| 2 | SOAP automático | `FileText` | `hsl(221,73%,45%)` | Prontuário |
| 3 | Análise de exames | `FlaskConical` | `hsl(217,88%,57%)` | Laboratorial |
| 4 | Comparativo de exames | `BarChart3` | `hsl(18,76%,50%)` | Analytics |
| 5 | Laudo ultrassonográfico | `Scan` | `hsl(258,52%,50%)` | Diagnóstico |
| 6 | Painel do tutor | `LayoutDashboard` | `hsl(222,20%,55%)` | Badge "em breve" |

Card 6 (Painel do tutor): `opacity: 0.75`, badge `"em breve"` cinza, sem accent colorido.

---

### Seção 4 — ClinicalIntelligenceSection (nova, dark)

**Arquivo:** `src/components/homepage/ClinicalIntelligenceSection.tsx`  
**Fundo:** `hsl(222,77%,10%)`  
**Padding:** `py-24 px-6 md:px-12`  
**Container:** `max-w-3xl mx-auto`

Tradução fiel do `predictlab_prediction_section.html` para React/Tailwind com tokens do design system.

**Conteúdo (texto exato do arquivo de referência):**

- Label: `"Inteligência clínica"` — verde-menta `hsl(162,70%,55%)`, uppercase 11px
- Título: `"A IA não substitui o veterinário — ela amplifica o que ele já sabe"`
- Parágrafo: `"O PredictLab analisa os dados clínicos do paciente ao longo do tempo e identifica padrões que seriam difíceis de perceber consulta a consulta..."`

**Grid 4 insight cards** (`grid-cols-1 sm:grid-cols-2`, gap 16px):

| Card | Dot | Título | Exemplo |
|---|---|---|---|
| 1 | `#E24B4A` (vermelho) | Parâmetros em queda progressiva | "Hematócrito caiu 18%..." |
| 2 | `#1D9E75` (verde) | Resposta ao tratamento | "Eritrócitos retornou à faixa..." |
| 3 | `#EF9F27` (laranja) | Correlações entre órgãos | "Creatinina elevada + pelve renal..." |
| 4 | `#534AB7` (roxo) | Alertas precoces | "Plaquetas variou 321%..." |

Cada card: `background: hsla(0,0%,100%,0.05)`, `border: 0.5px solid hsla(0,0%,100%,0.12)`, `border-radius: 12px`.  
Exemplo em itálico: `background: hsla(0,0%,100%,0.06)`, `border-radius: 8px`.

**Subseção "Como funciona"** (3 passos numerados):

| Num | Título | Texto |
|---|---|---|
| 01 | Dados reais, não suposições | "Cada análise é baseada nos exames reais do paciente..." |
| 02 | A IA interpreta, o veterinário decide | "Os insights são sugestões clínicas auditáveis..." |
| 03 | Quanto mais exames, mais preciso | "O sistema melhora com o tempo..." |

Números: `hsl(162,70%,55%)`, tamanho 22px, Sora.  
Linhas separadas por `border-bottom: 0.5px solid hsla(0,0%,100%,0.1)`.

**Disclaimer** (texto exato do HTML de referência):  
`border-left: 3px solid #1D9E75`, `background: hsla(0,0%,100%,0.04)`, fonte 12px, cor `hsla(0,0%,100%,0.5)`.

---

### Seção 5 — MetricsSection (nova)

**Arquivo:** `src/components/homepage/MetricsSection.tsx`  
**Fundo:** `hsl(213,100%,98%)`  
**Layout:** 3 cards em linha (`grid-cols-1 sm:grid-cols-3`), centralizados  
**Container:** `max-w-2xl mx-auto`

Cada card:
- Número: Sora bold, `text-4xl`, cor `hsl(221,73%,45%)`
- Label: Nunito Sans, `text-sm`, `hsl(222,30%,55%)`
- Sem ícone
- `border: 1px solid hsl(217,50%,90%)`, `border-radius: 16px`, `padding: 2rem`, `background: white`

| Número | Label |
|---|---|
| `2.000+` | perguntas clínicas |
| `22` | categorias clínicas |
| `100%` | dados seguros |

---

### Seção 6 — HowToStartSection (nova)

**Arquivo:** `src/components/homepage/HowToStartSection.tsx`  
**Fundo:** `#ffffff`  
**Container:** `max-w-2xl mx-auto text-center`

**Conteúdo:**
- Label: `"Como começar"` — verde, uppercase
- Título: `"Em 3 passos você já está consultando com IA"` — Sora
- 3 passos numerados (layout vertical, simples):
  1. `"Cadastre o paciente"` — número `01` colorido
  2. `"Inicie a consulta guiada"` — número `02`
  3. `"Receba o SOAP completo"` — número `03`
- Separadores horizontais `border-bottom: 0.5px solid #e0e0e0` entre passos
- **CTA final:** botão `"Começar gratuitamente"` → `Link to="/register"`, gradiente azul, centralizado

---

## Design system aplicado

- **Fontes:** Sora (headings), Nunito Sans (body/UI) — já importadas no projeto
- **Cores principais:** `hsl(221,73%,45%)` (azul primário), `hsl(162,70%,38%)` (verde), `#0F6E56` (verde escuro label), `hsl(222,77%,10%)` (dark bg)
- **Border-radius:** `rounded-2xl` (cards), `rounded-full` (pills/badges)
- **Sombras:** `box-shadow: 0 2px 12px -4px hsla(221,73%,30%,0.08)` (cards claros)
- **Classes PredictLab:** `pl-animate-fade-up`, `pl-card-hover` — usar onde já aplicadas no HeroSection

---

## Scroll behavior

Adicionar ao `index.css` ou `App.tsx`:
```css
html {
  scroll-behavior: smooth;
}
```

O botão "Ver demonstração →" usa `<a href="#features">` (tag `<a>` nativa, não `Link` do React Router, para não interferir com o router).

---

## Testes existentes

Os testes em `src/tests/` não tocam em componentes de homepage — nenhum teste deve ser afetado. Verificar com `npm test` após a implementação.

---

## O que NÃO muda

- `HowItWorksSection.tsx` — preservado integralmente (8 etapas do roadmap)
- Navbar dentro de `HeroSection.tsx` — sem alteração
- Rotas em `App.tsx` — sem alteração
- Arquivos `WhyChooseSection.tsx`, `FAQSection.tsx`, `CTASection.tsx` — ficam no disco, apenas removidos do `Index.tsx`
