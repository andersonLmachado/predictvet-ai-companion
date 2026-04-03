import { classifyParams } from '../examComparison';

// Helper para montar um ExamHistoryRow mínimo
const makeExam = (params: Array<{ parametro: string; valor: number; status: string }>) => ({
  id: 'x',
  created_at: null,
  exam_date: null,
  exam_type: 'hemograma',
  clinical_summary: null,
  analysis_data: params.map(p => ({
    parametro: p.parametro,
    valor_encontrado: p.valor,
    ref_min: 1,
    ref_max: 10,
    unidade: '',
    status: p.status,
  })),
});

describe('classifyParams', () => {
  it('classifica como improving quando saiu de anormal para normal', () => {
    const base     = makeExam([{ parametro: 'ERITRÓCITOS', valor: 0.5, status: 'baixo' }]);
    const compared = makeExam([{ parametro: 'ERITRÓCITOS', valor: 5,   status: 'normal' }]);
    const result = classifyParams(base as any, compared as any);
    expect(result.improving).toContain('ERITRÓCITOS');
    expect(result.worsening).not.toContain('ERITRÓCITOS');
    expect(result.stable).not.toContain('ERITRÓCITOS');
  });

  it('classifica como worsening quando saiu de normal para anormal', () => {
    const base     = makeExam([{ parametro: 'EOSINÓFILOS', valor: 5,  status: 'normal' }]);
    const compared = makeExam([{ parametro: 'EOSINÓFILOS', valor: 15, status: 'alto' }]);
    const result = classifyParams(base as any, compared as any);
    expect(result.worsening).toContain('EOSINÓFILOS');
    expect(result.improving).not.toContain('EOSINÓFILOS');
    expect(result.stable).not.toContain('EOSINÓFILOS');
  });

  it('classifica como stable quando variação <= 2%', () => {
    const base     = makeExam([{ parametro: 'VCM', valor: 5,    status: 'normal' }]);
    const compared = makeExam([{ parametro: 'VCM', valor: 5.05, status: 'normal' }]);
    const result = classifyParams(base as any, compared as any);
    expect(result.stable).toContain('VCM');
  });

  it('classifica como stable quando ambos anormal com variação > 2%', () => {
    const base     = makeExam([{ parametro: 'BASÓFILOS', valor: 15, status: 'alto' }]);
    const compared = makeExam([{ parametro: 'BASÓFILOS', valor: 20, status: 'alto' }]);
    const result = classifyParams(base as any, compared as any);
    expect(result.stable).toContain('BASÓFILOS');
  });

  it('ignora parâmetro ausente no exame base', () => {
    const base     = makeExam([]);
    const compared = makeExam([{ parametro: 'CREATININA', valor: 5, status: 'normal' }]);
    const result = classifyParams(base as any, compared as any);
    expect(result.improving).not.toContain('CREATININA');
    expect(result.worsening).not.toContain('CREATININA');
    expect(result.stable).not.toContain('CREATININA');
  });

  it('ignora parâmetro com valor_encontrado não numérico', () => {
    const base     = makeExam([{ parametro: 'X', valor: 5, status: 'normal' }]);
    const compared = makeExam([{ parametro: 'X', valor: 10, status: 'alto' }]);
    // Força string em um deles
    (compared.analysis_data[0] as any).valor_encontrado = 'positivo';
    const result = classifyParams(base as any, compared as any);
    expect(result.improving.length + result.worsening.length + result.stable.length).toBe(0);
  });

  it('ignora parâmetro com valor base igual a zero (divisão por zero)', () => {
    const base     = makeExam([{ parametro: 'PROTEÍNA', valor: 0, status: 'baixo' }]);
    const compared = makeExam([{ parametro: 'PROTEÍNA', valor: 5, status: 'normal' }]);
    const result = classifyParams(base as any, compared as any);
    expect(result.improving.length + result.worsening.length + result.stable.length).toBe(0);
  });
});
