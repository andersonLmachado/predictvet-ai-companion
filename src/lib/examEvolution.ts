export interface ExamEvolutionParam {
  parametro: string;
  valor_encontrado: number | string | null;
  ref_min: number | string | null;
  ref_max: number | string | null;
  unidade: string | null;
  status: string | null;
}

export interface ExamEvolutionExam {
  id: string;
  examType: string;
  createdAt: string | null;
  analysisData: ExamEvolutionParam[];
}

export interface ExamEvolutionComparisonRow {
  parameter: string;
  examXValue: number | string | null;
  examYValue: number | string | null;
  refMin: number | string | null;
  refMax: number | string | null;
  unit: string | null;
  changeText: string;
  changeDirection: 'up' | 'down' | 'same' | 'unknown';
}

export interface ExamEvolutionComparisonResult {
  mode: 'none' | 'single' | 'comparison';
  singleExam: ExamEvolutionExam | null;
  latestExam: ExamEvolutionExam | null;
  previousExam: ExamEvolutionExam | null;
  rows: ExamEvolutionComparisonRow[];
}

export const parseNumericValue = (value: number | string | null | undefined): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatCellValue = (value: number | string | null | undefined, unit?: string | null) => {
  if (value === null || value === undefined || value === '') return '—';
  const hasUnit = unit && unit.trim().length > 0;
  return hasUnit ? `${value} ${unit}` : String(value);
};

export const formatReferenceRange = (
  refMin: number | string | null | undefined,
  refMax: number | string | null | undefined
) => {
  const min = refMin ?? '—';
  const max = refMax ?? '—';
  return `${min} - ${max}`;
};

const normalizeParamName = (name: string | null | undefined) => (name ?? '').trim().toUpperCase();

export const buildExamEvolutionComparison = (exams: ExamEvolutionExam[]): ExamEvolutionComparisonResult => {
  const analyzedExams = exams
    .filter((exam) => Array.isArray(exam.analysisData) && exam.analysisData.length > 0)
    .slice()
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  if (analyzedExams.length === 0) {
    return {
      mode: 'none',
      singleExam: null,
      latestExam: null,
      previousExam: null,
      rows: [],
    };
  }

  if (analyzedExams.length === 1) {
    const [singleExam] = analyzedExams;
    return {
      mode: 'single',
      singleExam,
      latestExam: singleExam,
      previousExam: null,
      rows: singleExam.analysisData.map((param) => ({
        parameter: param.parametro || 'Parâmetro sem nome',
        examXValue: param.valor_encontrado,
        examYValue: null,
        refMin: param.ref_min,
        refMax: param.ref_max,
        unit: param.unidade,
        changeText: 'Exame único',
        changeDirection: 'unknown',
      })),
    };
  }

  const latestExam = analyzedExams[0];
  const previousExam = analyzedExams[1];

  const latestMap = new Map<string, ExamEvolutionParam>();
  const previousMap = new Map<string, ExamEvolutionParam>();

  for (const param of latestExam.analysisData) {
    latestMap.set(normalizeParamName(param.parametro), param);
  }
  for (const param of previousExam.analysisData) {
    previousMap.set(normalizeParamName(param.parametro), param);
  }

  const keys = Array.from(new Set([...latestMap.keys(), ...previousMap.keys()])).filter(Boolean).sort();

  const rows: ExamEvolutionComparisonRow[] = keys.map((key) => {
    const x = latestMap.get(key);
    const y = previousMap.get(key);

    const xValue = x?.valor_encontrado ?? null;
    const yValue = y?.valor_encontrado ?? null;
    const xNumeric = parseNumericValue(xValue);
    const yNumeric = parseNumericValue(yValue);

    let changeText = 'Sem comparação';
    let changeDirection: ExamEvolutionComparisonRow['changeDirection'] = 'unknown';

    if (xNumeric !== null && yNumeric !== null) {
      const diff = xNumeric - yNumeric;
      if (Math.abs(diff) < 0.000001) {
        changeText = 'Sem alteração';
        changeDirection = 'same';
      } else if (diff > 0) {
        changeText = `Aumentou (+${diff.toFixed(2)})`;
        changeDirection = 'up';
      } else {
        changeText = `Reduziu (${diff.toFixed(2)})`;
        changeDirection = 'down';
      }
    }

    return {
      parameter: x?.parametro || y?.parametro || 'Parâmetro sem nome',
      examXValue: xValue,
      examYValue: yValue,
      refMin: x?.ref_min ?? y?.ref_min ?? null,
      refMax: x?.ref_max ?? y?.ref_max ?? null,
      unit: x?.unidade ?? y?.unidade ?? null,
      changeText,
      changeDirection,
    };
  });

  return {
    mode: 'comparison',
    singleExam: null,
    latestExam,
    previousExam,
    rows,
  };
};
