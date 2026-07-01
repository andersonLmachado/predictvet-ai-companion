import { describe, it, expect } from 'vitest';
import { parseSoapP, serializeSoapP } from '../lib/parseSoapP';

const FULL_PLAN = `EXAMES SOLICITADOS:
- Hemograma completo — triagem inicial
- Ultrassom abdominal — avaliar estruturas

PROTOCOLO E TRATAMENTO:
- Amoxicilina 10mg/kg a cada 12h por 7 dias
- Dipirona se febre > 39.5°C

RETORNO E MONITORAMENTO:
Retorno em 7 dias. Sinais de alerta: vômito persistente.`;

describe('parseSoapP', () => {
  it('retorna null para string vazia', () => {
    expect(parseSoapP('')).toBeNull();
    expect(parseSoapP('   ')).toBeNull();
  });

  it('retorna null para texto bruto sem seções reconhecidas', () => {
    expect(parseSoapP('Amoxicilina 10mg/kg. Retorno em 7 dias.')).toBeNull();
  });

  it('parseia texto no formato exato do prompt n8n', () => {
    const result = parseSoapP(FULL_PLAN);
    expect(result).not.toBeNull();
    expect(result!.exams).toEqual([
      'Hemograma completo — triagem inicial',
      'Ultrassom abdominal — avaliar estruturas',
    ]);
    expect(result!.treatments).toEqual([
      'Amoxicilina 10mg/kg a cada 12h por 7 dias',
      'Dipirona se febre > 39.5°C',
    ]);
    expect(result!.monitoring).toBe('Retorno em 7 dias. Sinais de alerta: vômito persistente.');
  });

  it('tolera variações de caixa nos cabeçalhos', () => {
    const mixed = [
      'exames solicitados:',
      '- Hemograma',
      '',
      'protocolo e tratamento:',
      '- Amoxicilina',
      '',
      'retorno e monitoramento:',
      'Retorno em 7 dias.',
    ].join('\n');
    const result = parseSoapP(mixed);
    expect(result).not.toBeNull();
    expect(result!.exams).toEqual(['Hemograma']);
    expect(result!.treatments).toEqual(['Amoxicilina']);
    expect(result!.monitoring).toBe('Retorno em 7 dias.');
  });

  it('retorna arrays vazios para seções ausentes, mas retorna objeto quando ao menos uma seção existe', () => {
    const onlyMonitoring = 'RETORNO E MONITORAMENTO:\nRetorno em 7 dias.';
    const result = parseSoapP(onlyMonitoring);
    expect(result).not.toBeNull();
    expect(result!.exams).toEqual([]);
    expect(result!.treatments).toEqual([]);
    expect(result!.monitoring).toBe('Retorno em 7 dias.');
  });

  it('aceita marcadores alternativos de lista (•, *, [)', () => {
    const bullets = [
      'EXAMES SOLICITADOS:',
      '• Hemograma',
      '* Ultrassom',
      '[ ] Raio-X',
    ].join('\n');
    const result = parseSoapP(bullets);
    expect(result).not.toBeNull();
    expect(result!.exams).toHaveLength(3);
  });
});

describe('serializeSoapP', () => {
  it('serializa de volta para texto parseável (round-trip)', () => {
    const original = parseSoapP(FULL_PLAN)!;
    const serialized = serializeSoapP(original);
    const reparsed = parseSoapP(serialized);
    expect(reparsed).toEqual(original);
  });

  it('permite substituir monitoring via spread antes de serializar', () => {
    const original = parseSoapP(FULL_PLAN)!;
    const modified = serializeSoapP({ ...original, monitoring: 'Retorno em 14 dias.' });
    const reparsed = parseSoapP(modified);
    expect(reparsed!.monitoring).toBe('Retorno em 14 dias.');
    expect(reparsed!.exams).toEqual(original.exams);
    expect(reparsed!.treatments).toEqual(original.treatments);
  });
});
