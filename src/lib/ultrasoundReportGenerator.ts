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
  const speciesLabel =
    patient.species === 'canis' ? 'Cão' :
    patient.species === 'felis' ? 'Gato' :
    escHtml(patient.species);

  const ageField = patient.age
    ? `<div class="pf"><div class="pl">Idade</div><div class="pv">${escHtml(patient.age)}</div></div>`
    : '';

  // Split report into blocks and extract sections, impression, footer
  const blocks = reportText.split('\n\n').filter(Boolean);
  const sepIdx = blocks.findIndex((b) => b.trim() === '---');
  const contentBlocks = sepIdx >= 0 ? blocks.slice(0, sepIdx) : blocks;
  const footerRaw = sepIdx >= 0 ? blocks.slice(sepIdx + 1).join('\n') : '';

  let impressionHtml = '';
  const sectionHtmlParts: string[] = [];

  for (const block of contentBlocks) {
    const headerMatch = block.match(/^([A-ZÁÀÃÂÉÊÍÓÔÕÚÜÇ\s()—-]+):\s*([\s\S]*)/);
    if (block.startsWith('IMPRESSÃO DIAGNÓSTICA')) {
      const text = block.replace(/^IMPRESSÃO DIAGNÓSTICA:\n?/, '').trim();
      impressionHtml = `
        <div class="impression">
          <div class="imp-label">Impressão Diagnóstica</div>
          <div class="imp-body">${escHtml(text).replace(/\n/g, '<br>')}</div>
        </div>`;
    } else if (headerMatch) {
      const title = headerMatch[1].trim();
      const body = headerMatch[2].trim();
      sectionHtmlParts.push(`
        <div class="section">
          <div class="sec-hdr">
            <span class="sec-dot"></span>
            <span class="sec-title">${escHtml(title)}</span>
          </div>
          <div class="sec-body">${escHtml(body).replace(/\n/g, '<br>')}</div>
        </div>`);
    } else {
      sectionHtmlParts.push(`
        <div class="section">
          <div class="sec-body">${escHtml(block).replace(/\n/g, '<br>')}</div>
        </div>`);
    }
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Laudo Ultrassonográfico — ${escHtml(patient.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Nunito Sans',Arial,sans-serif;background:#fff;color:#0a1e51;font-size:11px;line-height:1.65}

    /* ── Header ── */
    .hdr{background:linear-gradient(135deg,#071640 0%,#0d2460 60%,#1a3a80 100%);padding:22px 40px;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .brand-pill{display:inline-block;background:rgba(255,255,255,.93);border-radius:10px;padding:5px 13px;margin-bottom:12px}
    .brand-name{font-family:'Sora',sans-serif;font-size:16px;font-weight:700;color:#1a52cc;line-height:1.2}
    .brand-tag{font-size:8px;color:#2a6fec;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
    .doc-title{font-family:'Sora',sans-serif;font-size:19px;font-weight:700;color:#fff;margin-bottom:3px}
    .doc-date{font-size:9px;color:rgba(180,210,255,.7)}

    /* ── Patient bar ── */
    .pbar{background:#f0f7ff;border-bottom:2px solid #dce8f8;padding:11px 40px;display:flex;gap:28px;flex-wrap:wrap;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .pf{display:flex;flex-direction:column;gap:1px}
    .pl{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#3d5a99}
    .pv{font-family:'Sora',sans-serif;font-size:12px;font-weight:600;color:#071640}

    /* ── Content ── */
    .content{padding:24px 40px}
    .section{margin-bottom:13px}
    .sec-hdr{display:flex;align-items:center;gap:6px;border-bottom:1px solid #dce8f8;padding-bottom:4px;margin-bottom:6px}
    .sec-dot{width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#1a52cc,#df5220);flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .sec-title{font-family:'Sora',sans-serif;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#1a52cc}
    .sec-body{font-size:10.5px;color:#1a2e5a;line-height:1.7;padding-left:13px}

    /* ── Impression ── */
    .impression{background:#f0f7ff;border-left:3px solid #1a52cc;border-radius:0 8px 8px 0;padding:11px 15px;margin-top:18px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .imp-label{font-family:'Sora',sans-serif;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#1a52cc;margin-bottom:5px}
    .imp-body{font-size:11px;color:#0a1e51;line-height:1.7}

    /* ── Footer ── */
    .footer{border-top:1px solid #dce8f8;padding:14px 40px 18px;background:#f8fbff;margin-top:18px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .footer-disc{font-size:9px;color:#3d5a99;line-height:1.65}
    .footer-disc p{margin-bottom:3px}
    .footer-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid #dce8f8}
    .footer-brand{font-family:'Sora',sans-serif;font-size:9px;font-weight:700;color:#1a52cc}
    .footer-gen{font-size:9px;color:#7a9acc}

    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .hdr,.pbar,.impression,.footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
  </style>
</head>
<body>
  <div class="hdr">
    <div class="brand-pill">
      <div class="brand-name">PredictVet</div>
      <div class="brand-tag">Inteligência Veterinária</div>
    </div>
    <div class="doc-title">Laudo Ultrassonográfico</div>
    <div class="doc-date">Emitido em ${escHtml(date)}</div>
  </div>

  <div class="pbar">
    <div class="pf"><div class="pl">Paciente</div><div class="pv">${escHtml(patient.name)}</div></div>
    <div class="pf"><div class="pl">Espécie</div><div class="pv">${speciesLabel}</div></div>
    <div class="pf"><div class="pl">Tutor</div><div class="pv">${escHtml(patient.owner_name)}</div></div>
    ${ageField}
  </div>

  <div class="content">
    ${sectionHtmlParts.join('\n')}
    ${impressionHtml}
  </div>

  <div class="footer">
    <div class="footer-disc">
      ${footerRaw.split('\n').filter(Boolean).map((l) => `<p>${escHtml(l)}</p>`).join('\n      ')}
    </div>
    <div class="footer-bottom">
      <div class="footer-brand">PredictVet — Inteligência Veterinária</div>
      <div class="footer-gen">Gerado em ${escHtml(date)}</div>
    </div>
  </div>
</body>
</html>`;
}
