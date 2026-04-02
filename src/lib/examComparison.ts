interface ExamParam {
  parametro: string;
  valor_encontrado: number | string | null;
  ref_min: number;
  ref_max: number;
  unidade: string;
  status: string;
}

interface ExamHistoryRow {
  id: string;
  created_at: string | null;
  exam_date: string | null;
  exam_type: string;
  clinical_summary: string | null;
  analysis_data: ExamParam[];
}

export interface ClassificationResult {
  improving: string[];
  worsening: string[];
  stable: string[];
}

export function classifyParams(
  base: ExamHistoryRow,
  compared: ExamHistoryRow,
): ClassificationResult {
  const improving: string[] = [];
  const worsening: string[] = [];
  const stable: string[] = [];

  for (const cmpParam of compared.analysis_data) {
    const baseParam = base.analysis_data.find(p => p.parametro === cmpParam.parametro);
    if (!baseParam) continue;

    const baseVal = typeof baseParam.valor_encontrado === 'number' ? baseParam.valor_encontrado : null;
    const cmpVal  = typeof cmpParam.valor_encontrado  === 'number' ? cmpParam.valor_encontrado  : null;
    if (baseVal === null || cmpVal === null || baseVal === 0) continue;

    const pct = Math.abs(((cmpVal - baseVal) / baseVal) * 100);

    if (pct <= 2) {
      stable.push(cmpParam.parametro);
      continue;
    }

    // pct > 2: check status transition
    if (cmpParam.status === 'normal' && baseParam.status !== 'normal') {
      improving.push(cmpParam.parametro);
    } else if (cmpParam.status !== 'normal' && baseParam.status === 'normal') {
      worsening.push(cmpParam.parametro);
    } else {
      stable.push(cmpParam.parametro);
    }
  }

  return { improving, worsening, stable };
}
