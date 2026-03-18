import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock fetch (used by extractExamDate) ────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Mock Supabase (used by updateExamDate) ───────────────────────────────────
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { extractExamDate, updateExamDate, formatExamDate } from '../lib/examDate';
import { supabase } from '@/integrations/supabase/client';

function makeUpdateChain(result: { error: { message: string } | null }) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  };
}

// ── extractExamDate ──────────────────────────────────────────────────────────
describe('extractExamDate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ISO date string when n8n responds with valid date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exam_date: '2024-09-10' }),
    });
    const file = new File(['dummy content'], 'exame.pdf', { type: 'application/pdf' });
    const result = await extractExamDate(file);
    expect(result).toBe('2024-09-10');
  });

  it('returns null when n8n responds with null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exam_date: null }),
    });
    const file = new File(['dummy'], 'exame.jpg', { type: 'image/jpeg' });
    const result = await extractExamDate(file);
    expect(result).toBeNull();
  });

  it('returns null and warns on network error (never throws)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    const file = new File(['dummy'], 'exame.pdf', { type: 'application/pdf' });
    const result = await extractExamDate(file);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ── updateExamDate ───────────────────────────────────────────────────────────
describe('updateExamDate', () => {
  beforeEach(() => vi.clearAllMocks());

  // Covers spec scenario: "manual date edit" — vet enters a date and saves
  it('resolves when saving a valid date (manual edit by vet)', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(makeUpdateChain({ error: null }));
    await expect(updateExamDate('exam-001', '2024-09-10')).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith('exams_history');
  });

  it('resolves when date is null (clear/reset)', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(makeUpdateChain({ error: null }));
    await expect(updateExamDate('exam-002', null)).resolves.toBeUndefined();
  });

  it('throws when Supabase returns an error', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeUpdateChain({ error: { message: 'RLS violation' } })
    );
    await expect(updateExamDate('exam-003', '2024-09-10')).rejects.toThrow('RLS violation');
  });
});

// ── formatExamDate ───────────────────────────────────────────────────────────
// Covers spec scenarios: "PDF uses exam_date" and "PDF uses 'Data não informada' when null"
describe('formatExamDate', () => {
  it('formats ISO date as DD/MM/YYYY for PDF', () => {
    expect(formatExamDate('2024-09-10')).toBe('10/09/2024');
  });

  it('returns "Data não informada" when date is null', () => {
    expect(formatExamDate(null)).toBe('Data não informada');
  });
});
