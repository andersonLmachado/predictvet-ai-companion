---
name: predictvet-design-system
description: Use when building, editing, or reviewing any frontend component, page, or UI element in the PredictVet project. Apply before writing JSX, choosing colors, picking fonts, creating cards, forms, buttons, navbars, or any visual element. Ensures brand consistency across all frontend work.
---

# PredictVet Design System

## Overview

PredictVet is a **veterinary AI SaaS** product. The visual identity is derived from the brand logo:
- **Deep Royal Blue** — primary brand, technology, trust
- **Crimson Red** — accent from the blood drop icon, critical indicators
- **Orange-Red** — second accent from the separator dot
- **Dark Navy** — backgrounds, navbar, dark sections

**Core rule:** Every UI decision should feel like it belongs in a medical/scientific software product — precise, clean, modern, professional.

---

## Typography

| Role | Font | Import |
|---|---|---|
| Headings, numbers, brand text | **Sora** | Google Fonts |
| Body, labels, UI text, descriptions | **Nunito Sans** | Google Fonts |

**Already imported in `index.css`.**

```tsx
// Headings
style={{ fontFamily: 'Sora, sans-serif' }}

// Body / labels / UI
style={{ fontFamily: 'Nunito Sans, sans-serif' }}
```

**Rules:**
- `h1`–`h6` always use Sora via the global CSS rule (already set)
- KPI numbers: Sora, `font-bold`, large size
- Labels: Nunito Sans, `text-xs font-semibold uppercase tracking-wide`
- Descriptions: Nunito Sans, `text-sm`, muted color
- Never use Inter, Roboto, Arial, or system-ui

---

## Color Tokens

All defined as CSS variables in `index.css`. Use HSL notation for consistency.

### Primary Palette

```
Brand Blue:    hsl(221, 73%, 45%)   ← #1a52cc  → --primary
Navy Dark:     hsl(222, 77%, 15%)   ← #0a1e51  → sidebar / navbar bg
Navy Deeper:   hsl(222, 77%, 12%)   ← #071640  → hero bg, dark sections
Blue Vivid:    hsl(217, 88%, 57%)   ← #2a6fec  → gradients, CTAs
Blue Light:    hsl(217, 90%, 68%)   ← #5a97f5  → text-gradient highlight
Blue Sky:      hsl(213, 100%, 98%)  ← #f0f7ff  → page background
```

### Accent Palette

```
Crimson Red:   hsl(352, 76%, 44%)   ← #c41c2e  → --destructive, KPI trend, alerts
Orange Red:    hsl(18,  76%, 50%)   ← #df5220  → gradient tail, dot accent
Emerald:       hsl(162, 70%, 38%)   ← #189e72  → positive/success accent
Amber:         hsl(38,  88%, 48%)   ← #e08d14  → warning accent
```

### Semantic Mappings (shadcn tokens)

```
--background:          hsl(213, 100%, 98%)   ← page bg
--foreground:          hsl(222, 77%, 12%)    ← main text
--primary:             hsl(221, 73%, 45%)    ← brand blue
--muted-foreground:    hsl(222, 30%, 50%)    ← secondary text
--border:              hsl(217, 50%, 88%)    ← subtle dividers
```

---

## Gradients

### Standard Brand Gradient (CTAs, buttons, stripes)
```tsx
background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)'
// With red tail (hero, vivid):
background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 80%, hsl(18,76%,50%) 100%)'
```

### Dark Section / Navbar Background
```tsx
background: 'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 60%, hsl(221,73%,22%) 100%)'
```

### Hero / Auth Page Background (mesh radial)
```tsx
background:
  'radial-gradient(ellipse 80% 60% at 20% 30%, hsl(221,73%,22%) 0%, transparent 55%),' +
  'radial-gradient(ellipse 60% 50% at 80% 70%, hsl(352,76%,18%) 0%, transparent 50%),' +
  'linear-gradient(160deg, hsl(222,77%,10%) 0%, hsl(222,77%,18%) 100%)'
```

### Text Gradient (highlighted headings on dark bg)
```tsx
className="pl-text-gradient"
// = gradient: light blue → white-blue → orange-red
```

---

## Utility Classes (defined in `index.css`)

| Class | Effect |
|---|---|
| `.pl-gradient` | Navy-to-blue gradient background |
| `.pl-gradient-vivid` | Blue → vivid blue → orange-red gradient |
| `.pl-gradient-hero` | Mesh radial dark hero background |
| `.pl-text-gradient` | Gradient text (blue → orange) |
| `.pl-card-hover` | Lift + shadow on hover (`translateY(-3px)`) |
| `.pl-glow` | Blue box-shadow glow |
| `.pl-circuit-bg` | SVG circuit/dot pattern overlay |
| `.pl-pulse-ring` | Animated pulsing ring (status dot) |
| `.pl-animate-float` | Slow float up/down animation |
| `.pl-animate-fade-up` | Fade in from bottom |
| `.pl-animate-fade-up-d1` ... `d4` | Staggered fade-up with delays |

---

## Component Patterns

### Card (standard)
```tsx
<div
  className="rounded-2xl overflow-hidden pl-card-hover"
  style={{
    background: 'white',
    border: '1px solid hsl(217,50%,90%)',
    boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
  }}
>
  {/* Colored top stripe (optional, pick accent color) */}
  <div className="h-1" style={{ background: 'hsl(221,73%,45%)' }} />
  <div className="p-5">...</div>
</div>
```

### Card Header (section divider)
```tsx
<div
  className="px-6 py-4 border-b flex items-center gap-2"
  style={{ borderColor: 'hsl(217,50%,93%)' }}
>
  {/* Colored dot marker */}
  <div
    className="w-2 h-2 rounded-full"
    style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(18,76%,50%))' }}
  />
  <h2 className="text-sm font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}>
    Section Title
  </h2>
</div>
```

### Primary Button
```tsx
<button
  className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
  style={{
    background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
    boxShadow: '0 6px 24px -6px hsla(221,73%,45%,0.5)',
    fontFamily: 'Nunito Sans, sans-serif',
  }}
>
  Label
</button>
```

### Ghost Button (on dark bg)
```tsx
<button
  className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
  style={{
    background: 'hsla(0,0%,100%,0.07)',
    border: '1px solid hsla(217,88%,57%,0.3)',
    color: 'hsl(213,100%,90%)',
    fontFamily: 'Nunito Sans, sans-serif',
  }}
>
  Label
</button>
```

### Form Input
```tsx
<Input
  className="h-11 rounded-xl text-sm"
  style={{
    borderColor: 'hsl(217,50%,85%)',
    fontFamily: 'Nunito Sans, sans-serif',
    background: 'hsl(213,100%,99%)',
  }}
/>
```

### Form Label
```tsx
<Label
  className="text-xs font-semibold uppercase tracking-wide"
  style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
>
  Label
</Label>
```

### Badge / Tag
```tsx
// Light badge on white card
<span
  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg"
  style={{ background: 'hsl(217,100%,95%)', color: 'hsl(221,73%,45%)' }}
>
  Tag
</span>

// On dark background
<span
  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
  style={{
    background: 'hsla(217,88%,57%,0.15)',
    border: '1px solid hsla(217,88%,57%,0.3)',
    color: 'hsl(217,90%,78%)',
  }}
>
  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(162,70%,55%)' }} />
  Label
</span>
```

### Icon Container
```tsx
// On white card
<div
  className="w-11 h-11 rounded-xl flex items-center justify-center"
  style={{ background: 'hsl(221,73%,45%)15' }} // 15 = ~8% opacity hex
>
  <Icon className="w-5 h-5" style={{ color: 'hsl(221,73%,45%)' }} />
</div>

// On dark bg
<div
  className="w-9 h-9 rounded-lg flex items-center justify-center"
  style={{
    background: 'hsla(0,0%,100%,0.08)',
    border: '1px solid hsla(217,88%,57%,0.25)',
  }}
>
  <Icon className="w-5 h-5 text-white" />
</div>
```

### Section Header (empty state)
```tsx
<div className="py-14 flex flex-col items-center gap-3">
  <Icon className="w-10 h-10" style={{ color: 'hsl(221,73%,75%)' }} />
  <p className="text-sm" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
    Mensagem de estado vazio
  </p>
</div>
```

---

## Dark Section Pattern (Navbar / Hero / Banners)

Always add the circuit pattern overlay:
```tsx
className="pl-circuit-bg"
style={{
  background: 'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 100%)',
  borderBottom: '1px solid hsla(217,88%,57%,0.15)',
  boxShadow: '0 2px 20px -4px hsla(221,73%,10%,0.6)',
}}
```

**Text on dark sections:**
- Primary text: `hsl(213,100%,97%)` or `hsl(213,100%,95%)`
- Secondary text: `hsla(213,100%,85%,0.55)`
- Muted text: `hsla(213,100%,80%,0.4)`
- Accent highlight: `hsl(217,90%,72%)`

---

## Page Layout

### Authenticated App Pages
```tsx
<div className="min-h-screen" style={{ background: 'hsl(213,100%,98%)' }}>
  {/* Dark header banner */}
  <div className="pl-circuit-bg" style={{ background: '...navy gradient...' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
      {/* Page title + subtitle */}
    </div>
  </div>

  {/* Content */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    {/* Cards, grids, etc. */}
  </div>
</div>
```

### Landing Page Sections
- Dark sections: use `pl-gradient-hero` or navy gradients
- Light sections: `background: 'hsl(213,100%,98%)'`
- Alternate for visual rhythm

---

## Animation Guidelines

- **Page entry:** Use staggered `.pl-animate-fade-up-d1` through `d4` on key elements
- **Cards:** `.pl-card-hover` for lift on hover
- **Floating elements:** `.pl-animate-float` (badges, decorative elements)
- **Status indicators:** `.pl-pulse-ring` on the dot only (not the container)
- **Transitions:** `transition-all duration-200` for interactive elements

---

## KPI / Stat Cards

Always include:
1. Colored top stripe (`h-1` or `h-1.5`) matching the metric type
2. Large number in Sora font
3. Small label in Nunito Sans, muted color
4. Icon in a tinted container with matching accent color

Accent color per metric type:
- Patients / primary: `hsl(221,73%,45%)`
- Success / exams: `hsl(162,70%,38%)`
- Warning / pending: `hsl(38,88%,48%)`
- Critical / trend: `hsl(352,76%,44%)`

---

## SOAP Consultation — Block Color System

The SOAP screen uses one distinct `accentColor` per clinical block. This color drives the **left border**, **letter badge**, **mic button**, and **Save button** of each `SOAPCard`.

### Block Accent Colors (current)

| Block | Letra | Significado clínico | accentColor | Hex approx. |
|---|---|---|---|---|
| **S** | Subjetivo | Anamnese / Relato do tutor | `hsl(210, 70%, 50%)` | `#2e86c1` (Azul médio) |
| **O** | Objetivo | Exame físico / Sinais vitais | `hsl(160, 60%, 40%)` | `#27ae77` (Verde-teal) |
| **A** | Avaliação | Diagnóstico diferencial | `hsl(35, 80%, 50%)` | `#d98c18` (Âmbar) |
| **P** | Plano | Conduta / Prescrições | `hsl(270, 50%, 55%)` | `#8e5dc7` (Violeta) |

> **Nota de brand:** O bloco P usa violeta, que está fora da paleta principal PredictVet. Se futuramente for realinhado, o substituto natural seria `hsl(352, 76%, 44%)` (Crimson) ou `hsl(221, 73%, 45%)` (Brand Blue). Os demais blocos S, O, A são coerentes com as variantes semânticas do sistema (azul, emerald, âmbar).

### Como usar o accentColor no SOAPCard

O prop `accentColor` é uma string CSS completa. Ele é aplicado via `style={{ ... }}` inline (não via className), pois Tailwind não suporta valores dinâmicos arbitrários.

```tsx
// Em GuidedConsultation.tsx — passagem dos accent colors
<SOAPCard accentColor="hsl(210, 70%, 50%)" ... />  // S
<SOAPCard accentColor="hsl(160, 60%, 40%)" ... />  // O
<SOAPCard accentColor="hsl(35, 80%, 50%)"  ... />  // A
<SOAPCard accentColor="hsl(270, 50%, 55%)" ... />  // P
```

### Cores internas do SOAPCard

Além do `accentColor`, o componente usa cores fixas para estados especiais:

| Estado / Elemento | Classe/Cor |
|---|---|
| Mic ativo (gravando) | `bg-red-500` + `animate-pulse` |
| Mic desabilitado (sem paciente) | `bg-muted`, `text-muted-foreground`, `opacity-50` |
| Processando IA (overlay) | `bg-background/70` + `text-primary` |
| Caixa de Sugestões IA (bloco P) | `bg-amber-50`, `border-amber-200`, `text-amber-700/800` (light) / `dark:bg-amber-950/30` |
| Ícone Sugestões IA | `text-amber-600` |
| Card border-left | `borderLeftColor: accentColor` (via style inline) |
| Botão Salvar | `backgroundColor: accentColor` (via style inline) |

### Alinhamento com o Design System

Ao **criar novas telas** que referenciem ou visualizem dados SOAP (relatórios, histórico, timeline), use as mesmas cores de bloco como identificadores visuais:

```tsx
const SOAP_COLORS = {
  S: 'hsl(210, 70%, 50%)',
  O: 'hsl(160, 60%, 40%)',
  A: 'hsl(35, 80%, 50%)',
  P: 'hsl(270, 50%, 55%)',
} as const;
```

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Using Tailwind `bg-blue-600` directly | Use HSL values `hsl(221,73%,45%)` or `--primary` token |
| Using `text-gray-500` | Use `hsl(222,30%,55%)` (brand muted) |
| White background on dark page sections | Use navy gradient + circuit pattern |
| Using the old blue-to-green gradient | Replace with blue-to-orange-red gradient |
| Generic card with no top stripe | Add `h-1` accent stripe |
| `font-family: Inter` or system fonts | Use Sora (headings) or Nunito Sans (body) |
| `mix-blend-multiply` on logo on dark bg | Wrap logo in white pill container |
| Separate inline `onMouseEnter`/`Leave` when Tailwind suffices | Use Tailwind hover: classes when possible |

---

## Logo Usage

**File:** `src/assets/predictlab-logo-v26.png` (full logo with text + tagline)
**Icon only:** `src/assets/predictlab-icon-new.png` (drop icon without text)

**On light backgrounds:** Display directly, no blend modes needed
**On dark backgrounds:** Wrap in a white pill container:
```tsx
<div
  className="px-4 py-2 rounded-xl"
  style={{ background: 'hsla(0,0%,100%,0.93)', boxShadow: '0 2px 12px -4px hsla(221,73%,20%,0.3)' }}
>
  <img src={predictlabLogo} alt="PredictVet" className="h-9 object-contain" />
</div>
```
