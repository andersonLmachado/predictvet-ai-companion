import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSupabaseQuestions } from '../hooks/useSupabaseQuestions';

// ─── Mock Supabase client ─────────────────────────────────────────────────────

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueryChain(result: {
  data: unknown[] | null;
  error: { message: string } | null;
}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('fetchSupabaseQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 5 perguntas quando query retorna dados', async () => {
    const mockData = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      agrupamento: 'Trato Urinário',
      pergunta: `Pergunta ${i + 1}?`,
      ativo: true,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from as any).mockReturnValue(makeQueryChain({ data: mockData, error: null }));

    const result = await fetchSupabaseQuestions(['Trato Urinário']);

    expect(result.questions).toHaveLength(5);
    expect(result.questions[0].pergunta).toBe('Pergunta 1?');
    expect(result.error).toBeNull();
  });

  it('retorna array vazio quando query retorna []', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from as any).mockReturnValue(makeQueryChain({ data: [], error: null }));

    const result = await fetchSupabaseQuestions(['Trato Urinário']);

    expect(result.questions).toHaveLength(0);
    expect(result.error).toBeNull();
  });

  it('retorna error quando Supabase lança erro', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from as any).mockReturnValue(
      makeQueryChain({ data: null, error: { message: 'DB connection error' } })
    );

    const result = await fetchSupabaseQuestions(['Trato Urinário']);

    expect(result.questions).toHaveLength(0);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('DB connection error');
  });

  it('retorna vazio sem executar query quando categories é []', async () => {
    const result = await fetchSupabaseQuestions([]);

    expect(result.questions).toHaveLength(0);
    expect(result.error).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(supabase.from as any).not.toHaveBeenCalled();
  });
});
