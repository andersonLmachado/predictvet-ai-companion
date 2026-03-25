// src/lib/ultrasoundReportGenerator.ts
import type { UltrasoundReportData } from '@/types/ultrasound';

function val(v: number | null | undefined): string {
  if (v == null) return '[não mensurado]';
  // Preserve at least one decimal place so 4.0 renders as "4.0" and not "4"
  const s = String(v);
  return s.includes('.') ? s : s + '.0';
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Organ templates ─────────────────────────────────────────────────────────

function bladder(d: UltrasoundReportData): string {
  const extra = d.bladder_notes ? ` ${d.bladder_notes}` : '';
  return `BEXIGA URINÁRIA: com repleção adequada, topografia habitual, apresentando sua forma mantida, parede normal medindo ${val(d.bladder_wall_cm)} cm e conteúdo anecogênico homogêneo. Não há sinais de presença de urolitíase.${extra}`;
}

function kidneys(d: UltrasoundReportData): string {
  const extra = d.kidney_notes ? ` ${d.kidney_notes}` : '';
  return `RINS: simétricos, apresentando dimensões normais (RE: ${val(d.kidney_left_cm)} cm e RD: ${val(d.kidney_right_cm)} cm; em eixo longitudinal), topografia habitual, contornos regulares, cortical com arquitetura e ecogenicidade mantida, região medular com arquitetura e espessura preservada. Definição córtico-medular mantida. Não há sinais de cálculos nem sinal da medular. Pelve renal esquerda medindo ${val(d.kidney_pelvis_left_cm)} cm e a direita medindo ${val(d.kidney_pelvis_right_cm)} cm.${extra}`;
}

function liver(d: UltrasoundReportData): string {
  const extra = d.liver_notes ? ` ${d.liver_notes}` : '';
  return `FÍGADO: topografia habitual, dimensões normais, contornos regulares, ecotextura homogênea, ecogenicidade preservada. Vasos hepáticos de calibre e percurso normais.${extra}`;
}

function gallbladder(d: UltrasoundReportData): string {
  const extra = d.gallbladder_notes ? ` ${d.gallbladder_notes}` : '';
  return `VESÍCULA BILIAR: localização habitual, com conteúdo anecogênico e paredes regulares medindo ${val(d.gallbladder_wall_cm)} cm. Ducto colédoco com calibre normal medindo ${val(d.gallbladder_duct_cm)} cm.${extra}`;
}

function stomach(d: UltrasoundReportData): string {
  const region = d.stomach_region || 'região antral';
  const extra = d.stomach_notes ? ` ${d.stomach_notes}` : '';
  return `ESTÔMAGO: avaliado na ${region}, apresentando parede com espessura de ${val(d.stomach_wall_cm)} cm, estratificação preservada e conteúdo intraluminal.${extra}`;
}

function intestine(d: UltrasoundReportData): string {
  const extra = d.intestine_notes ? ` ${d.intestine_notes}` : '';
  return `TRATO INTESTINAL: duodeno com parede medindo ${val(d.intestine_duodenum_cm)} cm, jejuno ${val(d.intestine_jejunum_cm)} cm, íleo ${val(d.intestine_ileum_cm)} cm e cólon ${val(d.intestine_colon_cm)} cm. Estratificação parietal mantida. Peristaltismo presente.${extra}`;
}

function spleen(d: UltrasoundReportData): string {
  const extra = d.spleen_notes ? ` ${d.spleen_notes}` : '';
  return `BAÇO: topografia habitual, dimensões normais, contornos regulares, ecotextura homogênea e ecogenicidade preservada.${extra}`;
}

function pancreas(d: UltrasoundReportData): string {
  const extra = d.pancreas_notes ? ` ${d.pancreas_notes}` : '';
  return `PÂNCREAS: lobo direito com espessura de ${val(d.pancreas_right_lobe_cm)} cm e lobo esquerdo com ${val(d.pancreas_left_lobe_cm)} cm. Ducto pancreático principal medindo ${val(d.pancreas_duct_cm)} cm. Ecotextura homogênea, sem alterações focais visíveis.${extra}`;
}

function adrenals(d: UltrasoundReportData): string {
  const extra = d.adrenal_notes ? ` ${d.adrenal_notes}` : '';
  return `GLÂNDULAS ADRENAIS: glândula adrenal esquerda (GAE) medindo ${val(d.adrenal_left_cm)} cm e glândula adrenal direita (GAD) medindo ${val(d.adrenal_right_cm)} cm. Ecotextura homogênea, sem alterações focais.${extra}`;
}

function reproductive(d: UltrasoundReportData): string {
  switch (d.sex) {
    case 'female':
      return [
        `ÚTERO: ${d.uterus_notes || 'topografia habitual, sem alterações identificadas'}`,
        `OVÁRIOS: ovário esquerdo medindo ${val(d.ovary_left_cm1)} × ${val(d.ovary_left_cm2)} cm; ovário direito medindo ${val(d.ovary_right_cm1)} × ${val(d.ovary_right_cm2)} cm.`,
      ].join('\n');
    case 'female_castrated':
      return 'ÚTERO e ovários não caracterizados — paciente ovariohisterectomizada.';
    case 'male':
      return [
        `PRÓSTATA: medindo ${val(d.prostate_length_cm)} cm (comprimento) × ${val(d.prostate_height_cm)} cm (altura) × ${val(d.prostate_width_cm)} cm (largura). Ecotextura homogênea, contornos regulares.`,
        `TESTÍCULOS: testículo esquerdo medindo ${val(d.testis_left_cm1)} × ${val(d.testis_left_cm2)} cm; testículo direito medindo ${val(d.testis_right_cm1)} × ${val(d.testis_right_cm2)} cm.`,
      ].join('\n');
    case 'male_castrated':
      return 'TESTÍCULOS: ausentes — paciente orquiectomizado.';
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function generateReport(data: UltrasoundReportData): string {
  const sections = [
    bladder(data),
    kidneys(data),
    liver(data),
    gallbladder(data),
    stomach(data),
    intestine(data),
    spleen(data),
    pancreas(data),
    adrenals(data),
    reproductive(data),
  ].filter(Boolean);

  const impression = data.diagnostic_impression
    ? `IMPRESSÃO DIAGNÓSTICA:\n${data.diagnostic_impression}`
    : '';

  const footer = [
    'Não foram observadas linfonodomegalia e líquido livre.',
    'Os exames de imagem devem ser correlacionados com o acompanhamento clínico do paciente e demais exames, igualmente complementares.',
    'Laudo em 48 a 72 horas úteis.',
    `Aparelho utilizado neste exame: ${data.equipment || 'Infinit X PRO'}`,
  ].join('\n');

  return [sections.join('\n\n'), impression, '---', footer]
    .filter(Boolean)
    .join('\n\n');
}

export function buildPrintableHtml(
  reportText: string,
  patient: { name: string; species: string; owner_name: string; age: string | null },
  date: string,
): string {
  const ageLine = patient.age
    ? `&nbsp;|&nbsp;<strong>Idade:</strong> ${escHtml(patient.age)}`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Laudo Ultrassonográfico — ${escHtml(patient.name)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 40px; color: #111; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #555; margin-bottom: 24px; }
    pre { font-family: monospace; font-size: 11px; white-space: pre-wrap; line-height: 1.6; }
    .footer { margin-top: 40px; font-size: 10px; color: #888; border-top: 1px solid #ccc; padding-top: 8px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Laudo Ultrassonográfico</h1>
  <div class="meta">
    <strong>Paciente:</strong> ${escHtml(patient.name)} &nbsp;|&nbsp;
    <strong>Espécie:</strong> ${escHtml(patient.species)} &nbsp;|&nbsp;
    <strong>Tutor:</strong> ${escHtml(patient.owner_name)}${ageLine}
  </div>
  <pre>${escHtml(reportText)}</pre>
  <div class="footer">Gerado em ${escHtml(date)} — PredictLab</div>
</body>
</html>`;
}
