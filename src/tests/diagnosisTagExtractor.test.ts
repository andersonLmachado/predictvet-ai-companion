import { describe, it, expect } from 'vitest';
import { extractDiagnosisTags } from '../lib/diagnosisTagExtractor';

describe('extractDiagnosisTags', () => {
  it('extrai até 3 tags, truncando tag com parênteses a 25 chars', () => {
    const soap_a = '1. Anorexia (falta de apetite)\n2. Anemia\n3. Parasitose\n4. Outros';
    expect(extractDiagnosisTags(soap_a)).toEqual([
      'Anorexia (falta de apetit',  // 25 chars
      'Anemia',
      'Parasitose',
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
