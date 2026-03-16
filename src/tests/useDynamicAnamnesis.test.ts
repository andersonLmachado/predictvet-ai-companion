import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initDynamicPhase } from '../hooks/useDynamicAnamnesis';

// ─── Mock Supabase questions fetcher ─────────────────────────────────────────

vi.mock('../hooks/useSupabaseQuestions', () => ({
  fetchSupabaseQuestions: vi.fn(),
}));

import { fetchSupabaseQuestions } from '../hooks/useSupabaseQuestions';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const API_KEY = 'sk-test-key';

const mockQuestions = [
  { id: 1, agrupamento: 'Trato Urinário', pergunta: 'Bebe muita água?', ativo: true },
  { id: 2, agrupamento: 'Trato Urinário', pergunta: 'Urina com dificuldade?', ativo: true },
  { id: 3, agrupamento: 'Trato Urinário', pergunta: 'Urina com sangue?', ativo: true },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('initDynamicPhase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('happy path: carrega 3 perguntas quando OpenAI e Supabase retornam dados válidos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '["Trato Urinário"]' } }],
        }),
      })
    );
    vi.mocked(fetchSupabaseQuestions).mockResolvedValue({
      questions: mockQuestions,
      error: null,
    });

    const onFinish = vi.fn();
    const onQuestionsLoaded = vi.fn();

    await initDynamicPhase({ transcription: 'Animal bebendo muita água.', onFinish, onQuestionsLoaded, apiKey: API_KEY });

    expect(onQuestionsLoaded).toHaveBeenCalledWith(mockQuestions);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('OpenAI falha: onFinish([]) é chamado sem chamar Supabase', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const onFinish = vi.fn();
    const onQuestionsLoaded = vi.fn();

    await initDynamicPhase({ transcription: 'Animal apático.', onFinish, onQuestionsLoaded, apiKey: API_KEY });

    expect(onFinish).toHaveBeenCalledWith([]);
    expect(onQuestionsLoaded).not.toHaveBeenCalled();
    expect(fetchSupabaseQuestions).not.toHaveBeenCalled();
  });

  it('Supabase retorna vazio: onFinish([]) é chamado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '["Trato Urinário"]' } }],
        }),
      })
    );
    vi.mocked(fetchSupabaseQuestions).mockResolvedValue({ questions: [], error: null });

    const onFinish = vi.fn();
    const onQuestionsLoaded = vi.fn();

    await initDynamicPhase({ transcription: 'Animal com vômito.', onFinish, onQuestionsLoaded, apiKey: API_KEY });

    expect(onFinish).toHaveBeenCalledWith([]);
    expect(onQuestionsLoaded).not.toHaveBeenCalled();
  });

  it('categories vazio: onFinish([]) é chamado sem chamar Supabase', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '[]' } }],
        }),
      })
    );

    const onFinish = vi.fn();
    const onQuestionsLoaded = vi.fn();

    await initDynamicPhase({ transcription: 'Animal apático.', onFinish, onQuestionsLoaded, apiKey: API_KEY });

    expect(onFinish).toHaveBeenCalledWith([]);
    expect(fetchSupabaseQuestions).not.toHaveBeenCalled();
    expect(onQuestionsLoaded).not.toHaveBeenCalled();
  });
});
