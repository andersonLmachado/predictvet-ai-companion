export interface ParsedPlan {
  exams: string[];
  treatments: string[];
  monitoring: string;
}

const SECTION_EXAMS      = /EXAMES\s+SOLICITADOS/i;
const SECTION_TREATMENTS = /PROTOCOLO\s+E\s+TRATAMENTO/i;
const SECTION_MONITORING = /RETORNO\s+E\s+MONITORAMENTO/i;
const ITEM_PREFIX        = /^[-•*\[]\s*/;

export function parseSoapP(text: string): ParsedPlan | null {
  if (!text.trim()) return null;

  const hasAnySection =
    SECTION_EXAMS.test(text) ||
    SECTION_TREATMENTS.test(text) ||
    SECTION_MONITORING.test(text);

  if (!hasAnySection) return null;

  type Section = 'none' | 'exams' | 'treatments' | 'monitoring';
  let current: Section = 'none';
  const result: ParsedPlan = { exams: [], treatments: [], monitoring: '' };
  const monitoringLines: string[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();

    if (SECTION_EXAMS.test(trimmed))      { current = 'exams';      continue; }
    if (SECTION_TREATMENTS.test(trimmed)) { current = 'treatments'; continue; }
    if (SECTION_MONITORING.test(trimmed)) { current = 'monitoring'; continue; }

    if (!trimmed) continue;

    if (current === 'exams' && ITEM_PREFIX.test(trimmed)) {
      result.exams.push(trimmed.replace(ITEM_PREFIX, '').trim());
    } else if (current === 'treatments' && ITEM_PREFIX.test(trimmed)) {
      result.treatments.push(trimmed.replace(ITEM_PREFIX, '').trim());
    } else if (current === 'monitoring') {
      monitoringLines.push(trimmed);
    }
  }

  result.monitoring = monitoringLines.join('\n').trim();
  return result;
}

export function serializeSoapP(plan: ParsedPlan): string {
  const parts: string[] = [
    'EXAMES SOLICITADOS:',
    ...plan.exams.map(e => `- ${e}`),
    '',
    'PROTOCOLO E TRATAMENTO:',
    ...plan.treatments.map(t => `- ${t}`),
    '',
    'RETORNO E MONITORAMENTO:',
    plan.monitoring,
  ];
  return parts.join('\n').trim();
}
