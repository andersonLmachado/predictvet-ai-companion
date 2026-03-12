import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendAnamnesisPayload,
  buildAnamnesisPayload,
  type AnamnesisPayload,
} from '../lib/anamnesisApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const basePayload: AnamnesisPayload = {
  consultation_id: 'uuid-test-001',
  patient_id: 'patient-456',
  chief_complaint: 'Vômito persistente',
  followup_answers: [{ question: 'Há quanto tempo?', answer: 'Mais de 24h' }],
  transcription: 'Animal apático desde ontem.',
};

// ─── sendAnamnesisPayload ─────────────────────────────────────────────────────

describe('sendAnamnesisPayload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna ok:false com mensagem legível quando webhookUrl é undefined — sem throw', async () => {
    const result = await sendAnamnesisPayload(undefined, undefined, basePayload);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/VITE_N8N_ANAMNESIS_WEBHOOK_URL/);
  });

  it('retorna ok:false com mensagem legível quando webhookUrl é string vazia — sem throw', async () => {
    const result = await sendAnamnesisPayload('', undefined, basePayload);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/VITE_N8N_ANAMNESIS_WEBHOOK_URL/);
  });

  it('retorna ok:false e error com status+body quando servidor responde 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Unexpected token in JSON',
      })
    );

    const result = await sendAnamnesisPayload(
      'https://n8n.example.com/webhook/test',
      undefined,
      basePayload
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('500');
    expect(result.error).toContain('Unexpected token in JSON');
  });

  it('retorna ok:true e error:null quando servidor responde 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '{"status":"ok"}',
      })
    );

    const result = await sendAnamnesisPayload(
      'https://n8n.example.com/webhook/test',
      undefined,
      basePayload
    );

    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
  });

  it('envia Authorization header quando secret está presente', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });
    vi.stubGlobal('fetch', mockFetch);

    await sendAnamnesisPayload(
      'https://n8n.example.com/webhook/test',
      'my-secret-token',
      basePayload
    );

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer my-secret-token');
  });

  it('não envia Authorization header quando secret é undefined', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });
    vi.stubGlobal('fetch', mockFetch);

    await sendAnamnesisPayload(
      'https://n8n.example.com/webhook/test',
      undefined,
      basePayload
    );

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('retorna ok:false e error legível quando fetch lança exceção de rede', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    );

    const result = await sendAnamnesisPayload(
      'https://n8n.example.com/webhook/test',
      undefined,
      basePayload
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Failed to fetch');
  });
});

// ─── buildAnamnesisPayload ────────────────────────────────────────────────────

describe('buildAnamnesisPayload — shape do payload final', () => {
  it('contém todos os campos obrigatórios', () => {
    const payload = buildAnamnesisPayload({
      consultationId: 'uuid-123',
      patientId: 'p-456',
      chiefComplaint: 'Vômito',
      followupAnswers: [{ question: 'Há quanto tempo?', answer: 'Mais de 24h' }],
      transcription: 'Animal apático...',
    });

    expect(payload).toHaveProperty('consultation_id', 'uuid-123');
    expect(payload).toHaveProperty('patient_id', 'p-456');
    expect(payload).toHaveProperty('chief_complaint', 'Vômito');
    expect(payload).toHaveProperty('followup_answers');
    expect(payload).toHaveProperty('transcription', 'Animal apático...');
  });

  it('followup_answers é um array com os objetos corretos', () => {
    const answers = [
      { question: 'Pergunta 1', answer: 'Resp A' },
      { question: 'Pergunta 2', answer: 'Resp B' },
    ];

    const payload = buildAnamnesisPayload({
      consultationId: 'x',
      patientId: 'y',
      chiefComplaint: 'Letargia',
      followupAnswers: answers,
      transcription: '',
    });

    expect(Array.isArray(payload.followup_answers)).toBe(true);
    expect(payload.followup_answers).toHaveLength(2);
    expect(payload.followup_answers[0]).toEqual({ question: 'Pergunta 1', answer: 'Resp A' });
  });

  it('aceita transcription vazia sem erro', () => {
    const payload = buildAnamnesisPayload({
      consultationId: 'x',
      patientId: 'y',
      chiefComplaint: 'Dor',
      followupAnswers: [],
      transcription: '',
    });

    expect(payload.transcription).toBe('');
    expect(payload.followup_answers).toHaveLength(0);
  });
});
