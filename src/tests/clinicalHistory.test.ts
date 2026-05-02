import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchClinicalHistory, saveClinicalHistory } from '../lib/clinicalHistory';

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

describe('fetchClinicalHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna o histórico quando preenchido', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: { clinical_history: 'Alergia a dipirona' }, error: null })
    );
    const result = await fetchClinicalHistory('pat-001');
    expect(result).toBe('Alergia a dipirona');
    expect(supabase.from).toHaveBeenCalledWith('patients');
  });

  it('retorna string vazia quando clinical_history é null', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: { clinical_history: null }, error: null })
    );
    const result = await fetchClinicalHistory('pat-002');
    expect(result).toBe('');
  });

  it('retorna string vazia quando data é null (paciente não encontrado)', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: null, error: null })
    );
    const result = await fetchClinicalHistory('pat-003');
    expect(result).toBe('');
  });

  it('lança quando Supabase retorna erro', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: null, error: { message: 'DB error' } })
    );
    await expect(fetchClinicalHistory('pat-004')).rejects.toThrow('DB error');
  });
});

describe('saveClinicalHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolve sem erro no sucesso', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(makeUpdateChain({ error: null }));
    await expect(saveClinicalHistory('pat-001', 'Texto')).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith('patients');
  });

  it('chama UPDATE com clinical_history correto', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await saveClinicalHistory('pat-002', 'Diabetes tipo 2');
    expect(chain.update).toHaveBeenCalledWith({ clinical_history: 'Diabetes tipo 2' });
  });

  it('passa o patient_id correto no eq', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await saveClinicalHistory('pat-003', 'Texto');
    expect(chain.eq).toHaveBeenCalledWith('id', 'pat-003');
  });

  it('lança quando Supabase retorna erro', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeUpdateChain({ error: { message: 'RLS violation' } })
    );
    await expect(saveClinicalHistory('pat-004', 'Texto')).rejects.toThrow('RLS violation');
  });
});
