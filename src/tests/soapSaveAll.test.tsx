import { describe, it, expect } from 'vitest';
import { aggregateSaveResults } from '../lib/soapSaveOrchestrator';

describe('aggregateSaveResults', () => {
  it('retorna success:true quando todos os cards salvam', () => {
    const results = [
      { ok: true, letter: 'S' },
      { ok: true, letter: 'O' },
      { ok: true, letter: 'A' },
      { ok: true, letter: 'P' },
    ];
    expect(aggregateSaveResults(results)).toEqual({ success: true, failedLetters: [] });
  });

  it('retorna success:false com letras dos blocos que falharam', () => {
    const results = [
      { ok: true, letter: 'S' },
      { ok: false, letter: 'O' },
      { ok: true, letter: 'A' },
      { ok: false, letter: 'P' },
    ];
    expect(aggregateSaveResults(results)).toEqual({ success: false, failedLetters: ['O', 'P'] });
  });

  it('ignora entradas undefined (cards com save() sem resposta)', () => {
    const results = [
      { ok: true, letter: 'S' },
      undefined,
      { ok: true, letter: 'A' },
      undefined,
    ];
    expect(aggregateSaveResults(results)).toEqual({ success: true, failedLetters: [] });
  });
});
