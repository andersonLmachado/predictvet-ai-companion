import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendVoiceConsultationPayload,
  type VoiceConsultationPayload,
} from '../hooks/useVoiceConsultation';

const basePayload: VoiceConsultationPayload = {
  patient_id: 'p-123',
  audio: 'base64audiodata==',
  context: 'Dor abdominal aguda',
  clinical_history: 'Alergia a penicilina',
};

describe('sendVoiceConsultationPayload', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('envia payload correto para o webhook com Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        consultation_id: 'c-uuid-001',
        soap_s: 'Tutor relata vômito há 2 dias',
        soap_o: 'FC 120bpm, TPC 2s',
        soap_a: 'Gastroenterite',
        soap_p: 'Fluido IV, metronidazol',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendVoiceConsultationPayload(
      'https://n8n.example.com/webhook/voice',
      'secret-token',
      basePayload
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      consultation_id: 'c-uuid-001',
      soap_s: 'Tutor relata vômito há 2 dias',
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://n8n.example.com/webhook/voice');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer secret-token');
    expect(options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body.patient_id).toBe('p-123');
    expect(body.audio).toBe('base64audiodata==');
    expect(body.context).toBe('Dor abdominal aguda');
    expect(body.clinical_history).toBe('Alergia a penicilina');
  });

  it('erro de rede retorna ok:false sem lançar exceção — áudio não é perdido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));

    const result = await sendVoiceConsultationPayload(
      'https://n8n.example.com/webhook/voice',
      undefined,
      basePayload
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Failed to fetch');
    expect(result.data).toBeNull();
    // O áudio (Blob) vive no caller — a função pura não o consome nem o destrói
  });

  it('retorna ok:false com mensagem legível quando URL não configurada', async () => {
    const result = await sendVoiceConsultationPayload(undefined, undefined, basePayload);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/VITE_N8N_VOICE_CONSULTATION_URL/);
  });
});
