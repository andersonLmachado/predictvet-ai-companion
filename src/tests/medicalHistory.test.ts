import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMedicalHistory,
  saveMedicalHistory,
  serializeVaccines,
  type Vaccine,
} from '../lib/medicalHistory';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';

function makeFetchChain(result: { data: any; error: any }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
}

function makeUpdateChain(result: { error: { message: string } | null }) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  };
}

describe('fetchMedicalHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna os campos quando preenchidos', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({
        data: {
          allergies: 'Dipirona',
          previous_diseases: 'Cinomose (2022)',
          vaccines: [{ name: 'V8', date: '2024-03-15' }],
        },
        error: null,
      })
    );
    const result = await fetchMedicalHistory('pat-001');
    expect(result.allergies).toBe('Dipirona');
    expect(result.previousDiseases).toBe('Cinomose (2022)');
    expect(result.vaccines).toEqual([{ name: 'V8', date: '2024-03-15' }]);
  });

  it('retorna defaults quando campos são null', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({
        data: { allergies: null, previous_diseases: null, vaccines: null },
        error: null,
      })
    );
    const result = await fetchMedicalHistory('pat-002');
    expect(result.allergies).toBe('');
    expect(result.previousDiseases).toBe('');
    expect(result.vaccines).toEqual([]);
  });

  it('retorna defaults quando data é null (paciente não encontrado)', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: null, error: null })
    );
    const result = await fetchMedicalHistory('pat-003');
    expect(result.allergies).toBe('');
    expect(result.previousDiseases).toBe('');
    expect(result.vaccines).toEqual([]);
  });

  it('lança quando Supabase retorna erro', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: null, error: { message: 'DB error' } })
    );
    await expect(fetchMedicalHistory('pat-004')).rejects.toThrow('DB error');
  });
});

describe('saveMedicalHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolve sem erro no sucesso', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(makeUpdateChain({ error: null }));
    await expect(
      saveMedicalHistory('pat-001', { allergies: 'Dipirona', previousDiseases: '', vaccines: [] })
    ).resolves.toBeUndefined();
  });

  it('envia allergies como null quando vazio', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await saveMedicalHistory('pat-002', { allergies: '', previousDiseases: '', vaccines: [] });
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ allergies: null, previous_diseases: null })
    );
  });

  it('lança quando Supabase retorna erro', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeUpdateChain({ error: { message: 'RLS violation' } })
    );
    await expect(
      saveMedicalHistory('pat-003', { allergies: '', previousDiseases: '', vaccines: [] })
    ).rejects.toThrow('RLS violation');
  });
});

describe('serializeVaccines', () => {
  it('retorna string vazia para array vazio', () => {
    expect(serializeVaccines([])).toBe('');
  });

  it('serializa vacina com nome e data', () => {
    const vaccines: Vaccine[] = [{ name: 'V8', date: '2024-03-15' }];
    expect(serializeVaccines(vaccines)).toBe('V8 (15/03/2024)');
  });

  it('serializa múltiplas vacinas separadas por vírgula', () => {
    const vaccines: Vaccine[] = [
      { name: 'V8', date: '2024-03-15' },
      { name: 'Antirrábica', date: '2024-03-15' },
    ];
    expect(serializeVaccines(vaccines)).toBe('V8 (15/03/2024), Antirrábica (15/03/2024)');
  });

  it('omite vacinas com nome vazio', () => {
    const vaccines: Vaccine[] = [
      { name: '', date: '2024-01-01' },
      { name: 'V8', date: '2024-03-15' },
    ];
    expect(serializeVaccines(vaccines)).toBe('V8 (15/03/2024)');
  });

  it('exibe apenas o nome quando data está vazia', () => {
    const vaccines: Vaccine[] = [{ name: 'V8', date: '' }];
    expect(serializeVaccines(vaccines)).toBe('V8');
  });
});
