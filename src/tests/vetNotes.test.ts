import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateVetNotes } from '../lib/vetNotes';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';

function makeUpdateChain(result: { error: { message: string } | null }) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  };
}

describe('updateVetNotes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves without error on success', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(makeUpdateChain({ error: null }));
    await expect(updateVetNotes('exam-001', 'Nota teste')).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith('exams_history');
  });

  it('throws when Supabase returns an error', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeUpdateChain({ error: { message: 'DB error' } })
    );
    await expect(updateVetNotes('exam-002', 'Nota')).rejects.toThrow('DB error');
  });

  it('calls UPDATE with empty string when notes is empty', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await updateVetNotes('exam-003', '');
    expect(chain.update).toHaveBeenCalledWith({ vet_notes: '' });
  });

  it('passes correct exam ID to the eq filter', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await updateVetNotes('exam-004', 'Nota');
    expect(chain.eq).toHaveBeenCalledWith('id', 'exam-004');
  });
});
