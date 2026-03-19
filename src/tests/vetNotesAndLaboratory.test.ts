import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateVetNotesAndLaboratory } from '../lib/vetNotes';

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

describe('updateVetNotesAndLaboratory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves when saving notes and laboratory together', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(makeUpdateChain({ error: null }));
    await expect(
      updateVetNotesAndLaboratory('exam-001', 'Nota teste', 'LabCenter Vet')
    ).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith('exams_history');
  });

  it('sends both vet_notes and laboratory in a single UPDATE call', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await updateVetNotesAndLaboratory('exam-002', 'Minha nota', 'Centro Vet Canoas');
    expect(chain.update).toHaveBeenCalledWith({
      vet_notes: 'Minha nota',
      laboratory: 'Centro Vet Canoas',
    });
  });

  it('accepts null laboratory (not found by webhook)', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await updateVetNotesAndLaboratory('exam-003', 'Nota', null);
    expect(chain.update).toHaveBeenCalledWith({ vet_notes: 'Nota', laboratory: null });
  });

  it('throws when Supabase returns an error', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeUpdateChain({ error: { message: 'RLS violation' } })
    );
    await expect(
      updateVetNotesAndLaboratory('exam-004', 'Nota', null)
    ).rejects.toThrow('RLS violation');
  });

  it('passes correct exam ID to the eq filter', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await updateVetNotesAndLaboratory('exam-005', 'Nota', 'Lab X');
    expect(chain.eq).toHaveBeenCalledWith('id', 'exam-005');
  });
});
