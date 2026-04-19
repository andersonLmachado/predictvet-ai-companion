# Home Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a home page atual por uma landing page de 7 seções que conta a história do PredictLab progressivamente, mantendo o Hero dark e o roadmap de 8 etapas intactos.

**Architecture:** Um componente por seção em `src/components/homepage/`. O `Index.tsx` compõe os componentes na ordem especificada. Componentes antigos são removidos do Index mas preservados no disco. A seção de Inteligência Clínica recebe fundo dark `hsl(222,77%,10%)` para destacar o tema de IA preditiva.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, Vitest, Lucide React, React Router DOM

---

## Mapa de arquivos

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Modificar | `src/index.css` | Adicionar `scroll-behavior: smooth` no `html` |
| Modificar | `src/pages/Index.tsx` | Composição final das 7 seções |
| Modificar | `src/components/homepage/HeroSection.tsx` | Atualizar tag, título, subtítulo e CTAs |
| Reescrever | `src/components/homepage/FeaturesSection.tsx` | Grid 2 colunas, 6 cards, `id="features"` |
| Criar | `src/components/homepage/ProblemSection.tsx` | Seção Problema/Solução — 3 comparações Antes→Depois |
| Criar | `src/components/homepage/ClinicalIntelligenceSection.tsx` | Fundo dark — 4 insight cards + 3 passos + disclaimer |
| Criar | `src/components/homepage/MetricsSection.tsx` | 3 métricas em cards (2.000+, 22, 100%) |
| Criar | `src/components/homepage/HowToStartSection.tsx` | 3 passos numerados + CTA final |

---

## Task 1: Scroll suave e scaffolding do Index.tsx

**Files:**
- Modify: `src/index.css`
- Modify: `src/pages/Index.tsx`

- [ ] **Step 1.1: Adicionar `scroll-behavior: smooth` ao `html`**

Em `src/index.css`, no bloco `@layer base`, adicionar **antes** do seletor `*`:

```css
@layer base {
  html {
    scroll-behavior: smooth;
  }

  * {
    @apply border-border;
  }
  /* ... resto do arquivo inalterado ... */
}
```

- [ ] **Step 1.2: Reescrever `Index.tsx` com a estrutura final**

Substituir o conteúdo inteiro de `src/pages/Index.tsx`:

```tsx
import React from 'react';
import HeroSection from '@/components/homepage/HeroSection';
import ProblemSection from '@/components/homepage/ProblemSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import HowItWorksSection from '@/components/homepage/HowItWorksSection';
import ClinicalIntelligenceSection from '@/components/homepage/ClinicalIntelligenceSection';
import MetricsSection from '@/components/homepage/MetricsSection';
import HowToStartSection from '@/components/homepage/HowToStartSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ClinicalIntelligenceSection />
      <MetricsSection />
      <HowToStartSection />
    </div>
  );
};

export default Index;
```

> **Nota:** Os componentes `ProblemSection`, `ClinicalIntelligenceSection`, `MetricsSection` e `HowToStartSection` ainda não existem — o build vai falhar até a Task 3, 5, 6 e 7 serem concluídas. Isso é esperado.

- [ ] **Step 1.3: Confirmar que testes existentes passam**

```bash
cd predictvet-ai-companion && npm test
```

Esperado: todos os testes em `src/tests/` passam (eles não testam componentes de homepage).

- [ ] **Step 1.4: Commit**

```bash
git add src/index.css src/pages/Index.tsx
git commit -m "feat: scaffold landing page structure in Index.tsx + smooth scroll"
```

---

## Task 2: Atualizar HeroSection (textos e CTAs)

**Files:**
- Modify: `src/components/homepage/HeroSection.tsx`

Mudanças cirúrgicas: tag pill, h1, subtítulo e dois botões de CTA. Navbar, logo, floating badges e fundo não mudam.

- [ ] **Step 2.1: Atualizar o texto da tag pill**

Localizar (linhas ~128-135) o bloco do badge pill e substituir apenas o texto interno:

**Antes:**
```tsx
<span
  className="text-xs font-semibold uppercase tracking-widest"
  style={{ color: 'hsl(217,90%,78%)', fontFamily: 'Nunito Sans, sans-serif' }}
>
  IA de Suporte à Decisão Diagnóstica Veterinária
</span>
```

**Depois:**
```tsx
<span
  className="text-xs font-semibold uppercase tracking-widest"
  style={{ color: 'hsl(217,90%,78%)', fontFamily: 'Nunito Sans, sans-serif' }}
>
  Para médicos veterinários
</span>
```

- [ ] **Step 2.2: Atualizar o h1**

Localizar (linhas ~151-157) e substituir o conteúdo do `<h1>`:

**Antes:**
```tsx
<h1
  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 pl-animate-fade-up-d2"
  style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
>
  Inteligência Artificial a Serviço do{' '}
  <span className="pl-text-gradient">Diagnóstico Veterinário</span>
</h1>
```

**Depois:**
```tsx
<h1
  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 pl-animate-fade-up-d2"
  style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
>
  O prontuário inteligente que{' '}
  <span className="pl-text-gradient">pensa com você</span>{' '}
  durante a consulta
</h1>
```

- [ ] **Step 2.3: Atualizar o subtítulo**

Localizar (linhas ~160-165) e substituir o texto do parágrafo subtítulo:

**Antes:**
```tsx
<p
  className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 pl-animate-fade-up-d3"
  style={{ color: 'hsla(213,100%,88%,0.65)', fontFamily: 'Nunito Sans, sans-serif' }}
>
  Segurança para o seu diagnóstico, clareza para o tutor e tecnologia de ponta para o desfecho clínico.
</p>
```

**Depois:**
```tsx
<p
  className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 pl-animate-fade-up-d3"
  style={{ color: 'hsla(213,100%,88%,0.65)', fontFamily: 'Nunito Sans, sans-serif' }}
>
  O PredictLab estrutura a anamnese, gera o SOAP automaticamente, analisa exames laboratoriais e acompanha a evolução clínica do paciente — tudo em um só lugar.
</p>
```

- [ ] **Step 2.4: Atualizar os botões CTA**

Localizar (linhas ~168-197) o bloco de CTAs e substituir completo:

**Antes:**
```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center pl-animate-fade-up-d4">
  <Link to="/register">
    <button
      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 80%, hsl(18,76%,50%) 100%)',
        boxShadow: '0 8px 32px -8px hsla(221,73%,45%,0.6)',
        fontFamily: 'Nunito Sans, sans-serif',
      }}
    >
      Começar Gratuitamente
      <ArrowRight className="w-4 h-4" />
    </button>
  </Link>
  <Link to="/login">
    <button
      className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-200"
      style={{
        background: 'hsla(0,0%,100%,0.07)',
        border: '1px solid hsla(217,88%,57%,0.3)',
        color: 'hsl(213,100%,90%)',
        fontFamily: 'Nunito Sans, sans-serif',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'hsla(0,0%,100%,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'hsla(0,0%,100%,0.07)')}
    >
      Já tenho conta
    </button>
  </Link>
</div>
```

**Depois:**
```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center pl-animate-fade-up-d4">
  <Link to="/register">
    <button
      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 80%, hsl(18,76%,50%) 100%)',
        boxShadow: '0 8px 32px -8px hsla(221,73%,45%,0.6)',
        fontFamily: 'Nunito Sans, sans-serif',
      }}
    >
      Começar gratuitamente
      <ArrowRight className="w-4 h-4" />
    </button>
  </Link>
  <a href="#features">
    <button
      className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-200"
      style={{
        background: 'hsla(0,0%,100%,0.07)',
        border: '1px solid hsla(217,88%,57%,0.3)',
        color: 'hsl(213,100%,90%)',
        fontFamily: 'Nunito Sans, sans-serif',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'hsla(0,0%,100%,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'hsla(0,0%,100%,0.07)')}
    >
      Ver demonstração →
    </button>
  </a>
</div>
```

> Troca `Link to="/login"` por `<a href="#features">` para smooth scroll nativo sem interferir no React Router.

- [ ] **Step 2.5: Verificar build TypeScript**

```bash
npm run build 2>&1 | tail -10
```

Esperado: build sem erros de TypeScript.

- [ ] **Step 2.6: Commit**

```bash
git add src/components/homepage/HeroSection.tsx
git commit -m "feat: update HeroSection copy and CTAs for landing page"
```

---

## Task 3: Criar ProblemSection

**Files:**
- Create: `src/components/homepage/ProblemSection.tsx`

- [ ] **Step 3.1: Criar o arquivo**

Criar `src/components/homepage/ProblemSection.tsx` com o conteúdo completo:

```tsx
import React from 'react';
import { X, Check } from 'lucide-react';

const comparisons = [
  {
    before: 'Anamnese manual',
    after: 'Anamnese guiada em 3 min',
  },
  {
    before: 'Comparar laudos manualmente',
    after: 'Comparativo automático com linha de tendência',
  },
  {
    before: 'Laudo US manual',
    after: 'Roteiro guiado por voz/texto',
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 px-6 md:px-12" style={{ background: '#ffffff' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div
            className="text-xs font-semibold uppercase mb-3"
            style={{
              color: '#0F6E56',
              fontFamily: 'Nunito Sans, sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            O problema que resolvemos
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,12%)' }}
          >
            O veterinário perde tempo com papelada, não com o paciente
          </h2>
        </div>

        {/* Comparison rows */}
        <div>
          {comparisons.map(({ before, after }, i) => (
            <div
              key={before}
              className="py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
              style={{
                borderBottom:
                  i < comparisons.length - 1 ? '0.5px solid #e0e0e0' : 'none',
              }}
            >
              {/* Before */}
              <div className="flex items-center gap-3 sm:flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsla(0,72%,55%,0.1)' }}
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'hsl(0,72%,55%)' }} />
                </div>
                <span
                  className="text-sm"
                  style={{
                    color: 'hsl(222,30%,50%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {before}
                </span>
              </div>

              {/* Arrow */}
              <span
                className="hidden sm:block text-sm"
                style={{ color: 'hsl(222,30%,70%)' }}
              >
                →
              </span>

              {/* After */}
              <div className="flex items-center gap-3 sm:flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsla(162,70%,38%,0.1)' }}
                >
                  <Check className="w-3.5 h-3.5" style={{ color: '#0F6E56' }} />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: 'hsl(222,77%,12%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {after}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
```

- [ ] **Step 3.2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: build sem erros. (Index.tsx ainda não compila pois ClinicalIntelligenceSection, MetricsSection e HowToStartSection ainda não existem — OK.)

- [ ] **Step 3.3: Commit**

```bash
git add src/components/homepage/ProblemSection.tsx
git commit -m "feat: add ProblemSection — before/after comparisons"
```

---

## Task 4: Reescrever FeaturesSection (6 cards, grid 2 colunas)

**Files:**
- Rewrite: `src/components/homepage/FeaturesSection.tsx`

- [ ] **Step 4.1: Substituir o conteúdo completo de FeaturesSection**

```tsx
import React from 'react';
import {
  ClipboardList,
  FileText,
  FlaskConical,
  BarChart3,
  Scan,
  LayoutDashboard,
} from 'lucide-react';

const features = [
  {
    icon: ClipboardList,
    title: 'Anamnese guiada com IA',
    description:
      'Perguntas clínicas específicas por tema, estruturando o relato do tutor de forma padronizada e completa.',
    accent: 'hsl(162,70%,38%)',
    tag: 'Clínico',
    comingSoon: false,
  },
  {
    icon: FileText,
    title: 'SOAP automático',
    description:
      'Prontuário SOAP gerado automaticamente a partir da anamnese, com suspeitas diagnósticas e plano terapêutico.',
    accent: 'hsl(221,73%,45%)',
    tag: 'Prontuário',
    comingSoon: false,
  },
  {
    icon: FlaskConical,
    title: 'Análise de exames',
    description:
      'Upload de hemogramas e painéis bioquímicos com interpretação automática por IA e identificação de desvios.',
    accent: 'hsl(217,88%,57%)',
    tag: 'Laboratorial',
    comingSoon: false,
  },
  {
    icon: BarChart3,
    title: 'Comparativo de exames',
    description:
      'Linha de tendência entre exames consecutivos para visualizar a evolução de parâmetros ao longo do tempo.',
    accent: 'hsl(18,76%,50%)',
    tag: 'Analytics',
    comingSoon: false,
  },
  {
    icon: Scan,
    title: 'Laudo ultrassonográfico',
    description:
      'Roteiro guiado por voz ou texto para estruturar laudos de ultrassonografia de forma padronizada.',
    accent: 'hsl(258,52%,50%)',
    tag: 'Diagnóstico',
    comingSoon: false,
  },
  {
    icon: LayoutDashboard,
    title: 'Painel do tutor',
    description:
      'Área exclusiva para o tutor acompanhar o histórico e evolução do animal de forma clara e acessível.',
    accent: 'hsl(222,20%,55%)',
    tag: 'em breve',
    comingSoon: true,
  },
] as const;

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="py-24 px-6 md:px-12"
      style={{ background: 'hsl(213,100%,98%)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{
              background: 'hsl(217,100%,95%)',
              border: '1px solid hsl(217,50%,85%)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'hsl(221,73%,45%)' }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{
                color: 'hsl(221,73%,45%)',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              Funcionalidades
            </span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
          >
            Tudo que você precisa em uma consulta
          </h2>
        </div>

        {/* Grid 2 colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'white',
                border: '1px solid hsl(217,50%,90%)',
                boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
                opacity: f.comingSoon ? 0.75 : 1,
              }}
            >
              {/* Topo colorido */}
              <div className="h-1" style={{ background: f.accent }} />

              <div className="p-6 space-y-4">
                {/* Tag */}
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    background: `${f.accent}18`,
                    color: f.accent,
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {f.tag}
                </span>

                {/* Ícone */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${f.accent}15` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>

                {/* Texto */}
                <div>
                  <h3
                    className="text-base font-bold mb-2"
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      color: f.comingSoon
                        ? 'hsl(222,20%,55%)'
                        : 'hsl(222,77%,15%)',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: 'hsl(222,30%,55%)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    {f.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
```

- [ ] **Step 4.2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: erros somente para os 3 componentes ainda não criados (ClinicalIntelligenceSection, MetricsSection, HowToStartSection).

- [ ] **Step 4.3: Commit**

```bash
git add src/components/homepage/FeaturesSection.tsx
git commit -m "feat: rewrite FeaturesSection — 6 cards grid 2col with features anchor"
```

---

## Task 5: Criar ClinicalIntelligenceSection (seção dark)

**Files:**
- Create: `src/components/homepage/ClinicalIntelligenceSection.tsx`

- [ ] **Step 5.1: Criar o arquivo**

```tsx
import React from 'react';

const insights = [
  {
    dot: '#E24B4A',
    title: 'Parâmetros em queda progressiva',
    text: 'Quando um indicador cai consistentemente entre exames, o sistema sinaliza antes que atinja valores críticos.',
    example:
      '"Hematócrito caiu 18% nos últimos 3 exames — ainda dentro da referência, mas com tendência de queda."',
  },
  {
    dot: '#1D9E75',
    title: 'Resposta ao tratamento',
    text: 'Compara exames antes e depois de uma intervenção e mostra quais parâmetros responderam ao protocolo.',
    example: '"Eritrócitos retornou à faixa de referência (5.26 → 7.15) após suplementação."',
  },
  {
    dot: '#EF9F27',
    title: 'Correlações entre órgãos',
    text: 'Identifica quando múltiplos parâmetros relacionados se alteram juntos, sugerindo investigação direcionada.',
    example:
      '"Creatinina elevada + pelve renal dilatada no ultrassom — correlacionar com estadiamento IRIS."',
  },
  {
    dot: '#534AB7',
    title: 'Alertas precoces',
    text: 'Parâmetros ainda dentro da referência mas com variação significativa entre exames são destacados para monitoramento.',
    example:
      '"Plaquetas variou 321% e permanece fora da referência — recomenda-se acompanhamento mais próximo."',
  },
] as const;

const howSteps = [
  {
    num: '01',
    title: 'Dados reais, não suposições',
    text: 'Cada análise é baseada nos exames reais do paciente armazenados no histórico — não em médias populacionais genéricas.',
  },
  {
    num: '02',
    title: 'A IA interpreta, o veterinário decide',
    text: 'Os insights são sugestões clínicas auditáveis — o veterinário sempre tem a palavra final sobre conduta e diagnóstico.',
  },
  {
    num: '03',
    title: 'Quanto mais exames, mais preciso',
    text: 'O sistema melhora com o tempo. Com dois exames você vê variação. Com cinco, você vê uma tendência. Com dez, você vê um padrão.',
  },
] as const;

const ClinicalIntelligenceSection = () => {
  return (
    <section
      className="py-24 px-6 md:px-12"
      style={{ background: 'hsl(222,77%,10%)' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Label */}
        <div
          className="text-xs font-semibold uppercase mb-3"
          style={{
            color: 'hsl(162,70%,55%)',
            fontFamily: 'Nunito Sans, sans-serif',
            letterSpacing: '0.1em',
          }}
        >
          Inteligência clínica
        </div>

        {/* Título */}
        <h2
          className="text-2xl md:text-3xl font-semibold mb-4"
          style={{
            fontFamily: 'Sora, sans-serif',
            color: 'hsl(213,100%,97%)',
            lineHeight: 1.3,
          }}
        >
          A IA não substitui o veterinário — ela amplifica o que ele já sabe
        </h2>

        {/* Parágrafo intro */}
        <p
          className="text-base leading-relaxed"
          style={{
            color: 'hsla(213,100%,88%,0.6)',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          O PredictLab analisa os dados clínicos do paciente ao longo do tempo e
          identifica padrões que seriam difíceis de perceber consulta a consulta. Não
          são predições absolutas — são alertas baseados em tendências reais, para que
          o veterinário tome decisões com mais informação.
        </p>

        {/* Grid de insight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {insights.map(({ dot, title, text, example }) => (
            <div
              key={title}
              className="rounded-xl p-5"
              style={{
                background: 'hsla(0,0%,100%,0.05)',
                border: '0.5px solid hsla(0,0%,100%,0.12)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: dot }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: 'hsl(213,100%,97%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {title}
                </span>
              </div>
              <p
                className="text-xs leading-relaxed mb-2"
                style={{
                  color: 'hsla(213,100%,88%,0.6)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                {text}
              </p>
              <p
                className="text-xs italic leading-relaxed px-3 py-2 rounded-lg"
                style={{
                  color: 'hsla(213,100%,80%,0.5)',
                  background: 'hsla(0,0%,100%,0.06)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                {example}
              </p>
            </div>
          ))}
        </div>

        {/* Como funciona */}
        <div className="mt-10">
          <div
            className="text-xs font-semibold uppercase mb-4"
            style={{
              color: 'hsl(162,70%,55%)',
              fontFamily: 'Nunito Sans, sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            Como funciona
          </div>

          <div>
            {howSteps.map(({ num, title, text }, i) => (
              <div
                key={num}
                className="flex gap-4 py-5"
                style={{
                  borderBottom:
                    i < howSteps.length - 1
                      ? '0.5px solid hsla(0,0%,100%,0.1)'
                      : 'none',
                }}
              >
                <div
                  className="text-2xl font-semibold flex-shrink-0 w-8"
                  style={{
                    color: 'hsl(162,70%,55%)',
                    fontFamily: 'Sora, sans-serif',
                  }}
                >
                  {num}
                </div>
                <div>
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{
                      color: 'hsl(213,100%,97%)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    {title}
                  </div>
                  <div
                    className="text-sm leading-relaxed"
                    style={{
                      color: 'hsla(213,100%,88%,0.6)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    {text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="mt-6 text-xs leading-relaxed p-4"
          style={{
            color: 'hsla(213,100%,88%,0.45)',
            background: 'hsla(0,0%,100%,0.04)',
            borderLeft: '3px solid #1D9E75',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          O PredictLab é uma ferramenta de apoio à decisão clínica. Os alertas e
          insights gerados não substituem o julgamento do médico veterinário
          habilitado. A prescrição, o diagnóstico e a conduta terapêutica são de
          responsabilidade exclusiva do profissional.
        </div>
      </div>
    </section>
  );
};

export default ClinicalIntelligenceSection;
```

- [ ] **Step 5.2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: erros apenas para MetricsSection e HowToStartSection (ainda não criados).

- [ ] **Step 5.3: Commit**

```bash
git add src/components/homepage/ClinicalIntelligenceSection.tsx
git commit -m "feat: add ClinicalIntelligenceSection — dark section with 4 insights + how it works"
```

---

## Task 6: Criar MetricsSection

**Files:**
- Create: `src/components/homepage/MetricsSection.tsx`

- [ ] **Step 6.1: Criar o arquivo**

```tsx
import React from 'react';

const metrics = [
  { value: '2.000+', label: 'perguntas clínicas' },
  { value: '22', label: 'categorias clínicas' },
  { value: '100%', label: 'dados seguros' },
] as const;

const MetricsSection = () => {
  return (
    <section
      className="py-20 px-6 md:px-12"
      style={{ background: 'hsl(213,100%,98%)' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {metrics.map(({ value, label }) => (
            <div
              key={label}
              className="text-center p-8 rounded-2xl"
              style={{
                background: 'white',
                border: '1px solid hsl(217,50%,90%)',
                boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
              }}
            >
              <div
                className="text-4xl font-bold mb-2"
                style={{
                  fontFamily: 'Sora, sans-serif',
                  color: 'hsl(221,73%,45%)',
                }}
              >
                {value}
              </div>
              <div
                className="text-sm"
                style={{
                  fontFamily: 'Nunito Sans, sans-serif',
                  color: 'hsl(222,30%,55%)',
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
```

- [ ] **Step 6.2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: erro apenas para HowToStartSection.

- [ ] **Step 6.3: Commit**

```bash
git add src/components/homepage/MetricsSection.tsx
git commit -m "feat: add MetricsSection — 3 metric cards"
```

---

## Task 7: Criar HowToStartSection

**Files:**
- Create: `src/components/homepage/HowToStartSection.tsx`

- [ ] **Step 7.1: Criar o arquivo**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    num: '01',
    title: 'Cadastre o paciente',
    description:
      'Crie o perfil com dados do tutor, espécie, raça e histórico clínico.',
  },
  {
    num: '02',
    title: 'Inicie a consulta guiada',
    description:
      'Responda as perguntas clínicas estruturadas por categoria de queixa.',
  },
  {
    num: '03',
    title: 'Receba o SOAP completo',
    description:
      'A IA gera automaticamente o prontuário com suspeitas e plano terapêutico.',
  },
] as const;

const HowToStartSection = () => {
  return (
    <section className="py-24 px-6 md:px-12" style={{ background: '#ffffff' }}>
      <div className="max-w-2xl mx-auto text-center">
        {/* Label */}
        <div
          className="text-xs font-semibold uppercase mb-3"
          style={{
            color: '#0F6E56',
            fontFamily: 'Nunito Sans, sans-serif',
            letterSpacing: '0.1em',
          }}
        >
          Como começar
        </div>

        {/* Título */}
        <h2
          className="text-3xl md:text-4xl font-bold mb-12"
          style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,12%)' }}
        >
          Em 3 passos você já está consultando com IA
        </h2>

        {/* Passos */}
        <div className="text-left mb-12">
          {steps.map(({ num, title, description }, i) => (
            <div
              key={num}
              className="flex gap-5 py-5"
              style={{
                borderBottom:
                  i < steps.length - 1 ? '0.5px solid #e0e0e0' : 'none',
              }}
            >
              <div
                className="text-xl font-semibold flex-shrink-0 w-8 pt-0.5"
                style={{ color: '#1D9E75', fontFamily: 'Sora, sans-serif' }}
              >
                {num}
              </div>
              <div>
                <div
                  className="text-base font-semibold mb-1"
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    color: 'hsl(222,77%,12%)',
                  }}
                >
                  {title}
                </div>
                <div
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: 'Nunito Sans, sans-serif',
                    color: 'hsl(222,30%,55%)',
                  }}
                >
                  {description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link to="/register">
          <button
            className="px-10 py-4 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
            style={{
              background:
                'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
              boxShadow: '0 8px 32px -8px hsla(221,73%,45%,0.5)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            Começar gratuitamente
          </button>
        </Link>
      </div>
    </section>
  );
};

export default HowToStartSection;
```

- [ ] **Step 7.2: Verificar build limpo (todos os componentes existem)**

```bash
npm run build 2>&1 | tail -15
```

Esperado: `✓ built in X.Xs` sem erros de TypeScript.

- [ ] **Step 7.3: Rodar testes**

```bash
npm test
```

Esperado: todos os testes passam (os testes existentes não tocam em componentes de homepage).

- [ ] **Step 7.4: Commit**

```bash
git add src/components/homepage/HowToStartSection.tsx
git commit -m "feat: add HowToStartSection — 3 steps + CTA final"
```

---

## Task 8: Verificação visual e commit final

**Files:** Nenhum arquivo novo — apenas verificação.

- [ ] **Step 8.1: Iniciar servidor de desenvolvimento**

```bash
npm run dev
```

Abrir `http://localhost:5173` (ou a porta indicada no terminal).

- [ ] **Step 8.2: Verificar cada seção visualmente**

Percorrer a página e confirmar:

| Seção | Verificar |
|---|---|
| Hero | Tag "Para médicos veterinários", novo título, botão "Ver demonstração →" faz smooth scroll para Features |
| Problema | 3 linhas com X vermelho / ✓ verde, responsivo no mobile |
| Features | `id="features"` presente, 6 cards em grid 2 colunas, card "Painel do tutor" com opacidade reduzida e tag "em breve" |
| Roadmap | 8 etapas intactas — sem alteração visual |
| Inteligência Clínica | Fundo dark, 4 insight cards, 3 passos numerados, disclaimer com borda verde |
| Métricas | 3 cards centralizados com números grandes |
| Como começar | 3 passos numerados, botão CTA verde/azul |

- [ ] **Step 8.3: Testar responsividade mobile**

No browser, ativar DevTools e testar em 375px de largura. Verificar:
- Hero: título sem overflow, botões empilhados verticalmente
- Problema: comparações empilhadas (sem seta `→`)
- Features: cards em coluna única
- Inteligência Clínica: insight cards em coluna única
- Métricas: cards em coluna única

- [ ] **Step 8.4: Confirmar smooth scroll**

Clicar em "Ver demonstração →" no Hero e verificar que a página rola suavemente até a seção de Features.

- [ ] **Step 8.5: Rodar testes e build final**

```bash
npm test && npm run build
```

Esperado: todos os testes passam + build sem erros.

- [ ] **Step 8.6: Commit final**

```bash
git add -A
git commit -m "feat: landing page completa — 7 seções progressivas

- Hero: nova copy com posicionamento de prontuário inteligente
- ProblemSection: comparações Antes/Depois
- FeaturesSection: 6 cards grid 2 colunas (inclui Painel do tutor em breve)
- HowItWorksSection: roadmap 8 etapas preservado
- ClinicalIntelligenceSection: seção dark com 4 insights e disclaimer
- MetricsSection: 3 métricas numéricas
- HowToStartSection: 3 passos + CTA final"
```

---

## Self-review

**Cobertura do spec:**

| Requisito do spec | Task que implementa |
|---|---|
| Seção 1 Hero — tag, título, subtítulo, 2 CTAs | Task 2 |
| Seção 2 Problema/Solução — 3 comparações | Task 3 |
| Seção 3 Features — grid 2 colunas, 6 cards | Task 4 |
| Seção 4 Inteligência Clínica — conteúdo do HTML de referência | Task 5 |
| Seção 5 Métricas — 3 cards | Task 6 |
| Seção 6 Como começar — 3 passos + CTA | Task 7 |
| HowItWorksSection preservado entre Features e IA | Task 1 (Index.tsx) |
| Smooth scroll para `#features` | Tasks 1 + 2 |
| Responsivo | Task 8 (verificação) |
| Testes não quebram | Tasks 1, 7, 8 |
| Navbar/header sem alteração | Task 2 (apenas textos internos) |

**Sem placeholders:** Cada step contém o código completo.

**Consistência de tipos:** `as const` nos arrays de dados; ícones via `f.icon` pattern do FeaturesSection original mantido. Nenhuma referência cruzada entre tasks quebra nomenclatura.
