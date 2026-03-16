// ─── Valid categories ─────────────────────────────────────────────────────────

export const VALID_CATEGORIES = [
  'Ambiente e Estilo de Vida',
  'Cardiovascular',
  'Comportamento e Atividade',
  'Dieta e Hábitos',
  'Doenças infecciosas',
  'Endócrino e Metabolismo',
  'Filhotes e Neonatos',
  'Hematologia e Doenças Imunomediadas',
  'Histórico Médico',
  'Imunologia e Imunoprofilaxia',
  'Informações Gerais do Animal',
  'Neurologia',
  'Nutrição Clínica para Cães e Gatos',
  'Oncologia',
  'Parasitologia',
  'Sinais Clínicos',
  'Sintomas Específicos',
  'Sistema Genital e Reprodutor',
  'Sistema Respiratório',
  'Sistema digestório',
  'Toxicologia',
  'Trato Urinário',
] as const;

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parses the OpenAI response text into an array of valid clinical categories.
 * - Strips markdown fences before parsing
 * - Returns [] on any parse error or non-array response
 * - Filters out categories not in validCategories
 * - Limits result to 3 items
 */
export function parseOpenAICategories(
  text: string,
  validCategories: string[] = [...VALID_CATEGORIES]
): string[] {
  if (!text) return [];

  const stripped = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return (parsed as unknown[])
    .filter((item): item is string => typeof item === 'string')
    .filter((cat) => validCategories.includes(cat))
    .slice(0, 3);
}
