import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock fetch ────────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Mock pdfjs-dist ───────────────────────────────────────────────────────────
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
  version: '5.5.207',
}));

// ── Mock Supabase ─────────────────────────────────────────────────────────────
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import * as pdfjsLib from 'pdfjs-dist';
import { extractExamDate, updateExamDate, formatExamDate } from '../lib/examDate';
import { supabase } from '@/integrations/supabase/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUpdateChain(result: { error: { message: string } | null }) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  };
}

/** Simulates pdfjs-dist returning a single-page PDF with the given text. */
function makePdfPromise(text: string) {
  return {
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({ items: [{ str: text }] }),
      }),
    }),
  };
}

// ── extractExamDate ───────────────────────────────────────────────────────────
describe('extractExamDate', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  // PDF path — pdfjs-dist extracts text
  it('returns ExamExtraction with exam_date when n8n responds (PDF)', async () => {
    vi.mocked(pdfjsLib.getDocument).mockReturnValueOnce(makePdfPromise('Resultado 10/09/2024') as any);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exam_date: '2024-09-10', laboratory: 'LabCenter Vet' }),
    });
    const file = new File(['pdf binary'], 'exame.pdf', { type: 'application/pdf' });
    const result = await extractExamDate(file);
    expect(result).toEqual({ exam_date: '2024-09-10', laboratory: 'LabCenter Vet' });
  });

  it('sends pdfjs-extracted text (not raw binary) in request body', async () => {
    const pdfText = 'Hemograma Completo - Data coleta: 15/03/2024';
    vi.mocked(pdfjsLib.getDocument).mockReturnValueOnce(makePdfPromise(pdfText) as any);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exam_date: null, laboratory: null }),
    });
    const file = new File(['%PDF-1.4 binary garbage'], 'exame.pdf', { type: 'application/pdf' });
    await extractExamDate(file);
    const [, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body).text).toBe(pdfText + '\n');
  });

  // Image path — file.text() fallback (pdfjs NOT called)
  it('returns { exam_date: null, laboratory: null } when n8n returns nulls (image)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exam_date: null, laboratory: null }),
    });
    const file = new File(['dummy'], 'exame.jpg', { type: 'image/jpeg' });
    const result = await extractExamDate(file);
    expect(result).toEqual({ exam_date: null, laboratory: null });
    expect(vi.mocked(pdfjsLib.getDocument)).not.toHaveBeenCalled();
  });

  it('returns { exam_date: null, laboratory: null } and warns on network error (never throws)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    const file = new File(['dummy'], 'exame.jpg', { type: 'image/jpeg' });
    const result = await extractExamDate(file);
    expect(result).toEqual({ exam_date: null, laboratory: null });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns { exam_date: null, laboratory: null } when webhook returns non-OK HTTP status', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const file = new File(['dummy'], 'exame.jpg', { type: 'image/jpeg' });
    const result = await extractExamDate(file);
    expect(result).toEqual({ exam_date: null, laboratory: null });
    expect(warnSpy).toHaveBeenCalledWith('[examDate] Webhook returned non-OK status:', 500);
    warnSpy.mockRestore();
  });

  it('sends JSON body with Authorization header from env', async () => {
    vi.stubEnv('VITE_N8N_WEBHOOK_SECRET', 'test-secret-abc');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exam_date: '2024-09-10', laboratory: null }),
    });
    const file = new File(['conteúdo do exame'], 'exame.jpg', { type: 'image/jpeg' });
    await extractExamDate(file);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://n8nvet.predictlab.com.br/webhook/extrair-data-exame');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['Authorization']).toBe('Bearer test-secret-abc');
    expect(JSON.parse(options.body)).toEqual({ text: 'conteúdo do exame' });
  });

  it('truncates text to 2000 chars before sending', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exam_date: null, laboratory: null }),
    });
    const file = new File(['x'.repeat(3000)], 'exame.jpg', { type: 'image/jpeg' });
    await extractExamDate(file);
    const [, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body).text).toHaveLength(2000);
  });
});

// ── updateExamDate ────────────────────────────────────────────────────────────
describe('updateExamDate', () => {
  beforeEach(() => vi.clearAllMocks());

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

// ── formatExamDate ────────────────────────────────────────────────────────────
describe('formatExamDate', () => {
  it('formats ISO date as DD/MM/YYYY for PDF', () => {
    expect(formatExamDate('2024-09-10')).toBe('10/09/2024');
  });

  it('returns "Data não informada" when date is null', () => {
    expect(formatExamDate(null)).toBe('Data não informada');
  });
});
