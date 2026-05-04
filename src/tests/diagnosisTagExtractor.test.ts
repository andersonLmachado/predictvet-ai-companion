import { describe, it, expect } from 'vitest';
import { extractDiagnosisTags } from '../lib/diagnosisTagExtractor';

describe('extractDiagnosisTags', () => {
  it('extrai até 3 tags de texto numerado padrão', () => {
    const soap_a = '1. Anemia\n2. Parasitose\n3. Infecção\n4. Outros';
    expect(extractDiagnosisTags(soap_a)).toEqual([
      'Anemia',
      'Parasitose',
      'Infecção',
    ]);
  });

  it('trunca cada tag a 25 caracteres', () => {
    const soap_a = '1. Insuficiência renal crônica avançada grave\n2. Anemia';
    const tags = extractDiagnosisTags(soap_a);
    expect(tags[0]).toHaveLength(25);
    expect(tags[0]).toBe('Insuficiência renal crôni');
  });

  it('retorna [] quando não há linhas numeradas', () => {
    const soap_a = 'Paciente apresenta sinais de anemia e parasitose sem formatação.';
    expect(extractDiagnosisTags(soap_a)).toEqual([]);
  });

  it('retorna [] para string vazia', () => {
    expect(extractDiagnosisTags('')).toEqual([]);
  });

  it('retorna [] para string somente com espaços', () => {
    expect(extractDiagnosisTags('   ')).toEqual([]);
  });

  it('ignora linhas não numeradas entre numeradas', () => {
    const soap_a = '1. Anemia\nNota adicional\n2. Parasitose';
    expect(extractDiagnosisTags(soap_a)).toEqual(['Anemia', 'Parasitose']);
  });

  it('aceita numeração com espaços variados após o ponto', () => {
    const soap_a = '1.  Anemia\n2.   Parasitose';
    expect(extractDiagnosisTags(soap_a)).toEqual(['Anemia', 'Parasitose']);
  });

  it('retorna menos de 3 tags quando há menos linhas numeradas', () => {
    const soap_a = '1. Anemia';
    expect(extractDiagnosisTags(soap_a)).toEqual(['Anemia']);
  });
});
