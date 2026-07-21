import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';
import { saveUltrasoundReport } from '../lib/ultrasoundReportSave';

function abortRejection(signal: AbortSignal): Promise<never> {
  return new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () =>
      reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
    );
  });
}

describe('saveUltrasoundReport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolve ok:true no sucesso', async () => {
    const insert = vi.fn().mockReturnValue({
      abortSignal: vi.fn().mockResolvedValue({ error: null }),
    });
    vi.mocked(supabase.from as any).mockReturnValue({ insert });

    const result = await saveUltrasoundReport({ patient_id: 'p1' });
    expect(result).toEqual({ ok: true, error: null, timedOut: false });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('resolve ok:false com mensagem quando Supabase retorna erro comum (sem retry)', async () => {
    const insert = vi.fn().mockReturnValue({
      abortSignal: vi.fn().mockResolvedValue({ error: { message: 'RLS violation' } }),
    });
    vi.mocked(supabase.from as any).mockReturnValue({ insert });

    const result = await saveUltrasoundReport({ patient_id: 'p1' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('RLS violation');
    expect(result.timedOut).toBe(false);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('tenta novamente 1x quando a 1ª tentativa expira (timeout) e a 2ª funciona', async () => {
    let call = 0;
    const insert = vi.fn().mockImplementation(() => {
      call++;
      const attempt = call;
      return {
        abortSignal: (signal: AbortSignal) =>
          attempt === 1 ? abortRejection(signal) : Promise.resolve({ error: null }),
      };
    });
    vi.mocked(supabase.from as any).mockReturnValue({ insert });

    const result = await saveUltrasoundReport({ patient_id: 'p1' }, 10);
    expect(result).toEqual({ ok: true, error: null, timedOut: false });
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it('retorna timedOut:true quando ambas tentativas expiram', async () => {
    const insert = vi.fn().mockImplementation(() => ({
      abortSignal: (signal: AbortSignal) => abortRejection(signal),
    }));
    vi.mocked(supabase.from as any).mockReturnValue({ insert });

    const result = await saveUltrasoundReport({ patient_id: 'p1' }, 10);
    expect(result.ok).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(insert).toHaveBeenCalledTimes(2);
  });
});
