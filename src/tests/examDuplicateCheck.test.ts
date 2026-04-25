import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findDuplicateExam } from '../lib/examDuplicateCheck';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';

// Simulates a Supabase query chain ending with .maybeSingle()
function makeQueryChain(result: { data: { id: string } | null }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
}

describe('findDuplicateExam', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── No date → skip ───────────────────────────────────────────────────────────
  it('returns null immediately when examDate is null (cannot match without a date)', async () => {
    const result = await findDuplicateExam('p-001', null, null);
    expect(result).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns null immediately when examDate is null even with a laboratory', async () => {
    const result = await findDuplicateExam('p-001', null, 'LabCenter Vet');
    expect(result).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  // ── Duplicate found ──────────────────────────────────────────────────────────
  it('returns the existing exam id when duplicate found with laboratory', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeQueryChain({ data: { id: 'exam-123' } })
    );
    const result = await findDuplicateExam('p-001', '2024-09-10', 'LabCenter Vet');
    expect(result).toBe('exam-123');
  });

  it('returns the existing exam id when duplicate found without laboratory', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeQueryChain({ data: { id: 'exam-456' } })
    );
    const result = await findDuplicateExam('p-001', '2024-09-10', null);
    expect(result).toBe('exam-456');
  });

  // ── No duplicate ─────────────────────────────────────────────────────────────
  it('returns null when no duplicate found with laboratory', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeQueryChain({ data: null })
    );
    const result = await findDuplicateExam('p-001', '2024-09-10', 'LabCenter Vet');
    expect(result).toBeNull();
  });

  it('returns null when no duplicate found without laboratory', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeQueryChain({ data: null })
    );
    const result = await findDuplicateExam('p-001', '2024-09-10', null);
    expect(result).toBeNull();
  });

  // ── Query correctness ────────────────────────────────────────────────────────
  it('queries exams_history with the correct patient_id and exam_date', async () => {
    const chain = makeQueryChain({ data: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);

    await findDuplicateExam('patient-uuid-999', '2024-12-25', null);

    expect(supabase.from).toHaveBeenCalledWith('exams_history');
    expect(chain.eq).toHaveBeenCalledWith('patient_id', 'patient-uuid-999');
    expect(chain.eq).toHaveBeenCalledWith('exam_date', '2024-12-25');
  });

  it('adds laboratory eq filter when laboratory is provided', async () => {
    const chain = makeQueryChain({ data: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);

    await findDuplicateExam('p-001', '2024-09-10', 'LabCenter Vet');

    const eqArgs = chain.eq.mock.calls.map((c: string[]) => c[0]);
    expect(eqArgs).toContain('laboratory');
  });

  it('does NOT add laboratory eq filter when laboratory is null', async () => {
    const chain = makeQueryChain({ data: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);

    await findDuplicateExam('p-001', '2024-09-10', null);

    const eqArgs = chain.eq.mock.calls.map((c: string[]) => c[0]);
    expect(eqArgs).not.toContain('laboratory');
  });

  it('always calls .limit(1).maybeSingle() to avoid fetching excess rows', async () => {
    const chain = makeQueryChain({ data: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);

    await findDuplicateExam('p-001', '2024-09-10', 'Lab X');

    expect(chain.limit).toHaveBeenCalledWith(1);
    expect(chain.maybeSingle).toHaveBeenCalled();
  });
});
