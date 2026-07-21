import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendUltrasoundAudio } from '../hooks/useUltrasoundWhisper';

describe('sendUltrasoundAudio', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('envia áudio com Authorization Bearer e organ, retorna a transcrição', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transcription: 'Vesícula biliar com paredes finas.' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendUltrasoundAudio(
      'https://n8nvet.predictlab.com.br/webhook/ultrasound-transcription',
      'secret-token',
      'base64audiodata==',
      'gallbladder',
    );

    expect(result.ok).toBe(true);
    expect(result.transcription).toBe('Vesícula biliar com paredes finas.');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://n8nvet.predictlab.com.br/webhook/ultrasound-transcription');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer secret-token');
    expect(options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body.audio).toBe('base64audiodata==');
    expect(body.organ).toBe('gallbladder');
  });

  it('retorna ok:false sem lançar quando o n8n responde 403 (auth ausente/incorreta)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Authorization data is wrong!',
    }));

    const result = await sendUltrasoundAudio(
      'https://n8nvet.predictlab.com.br/webhook/ultrasound-transcription',
      undefined,
      'base64audiodata==',
      'kidney',
    );

    expect(result.ok).toBe(false);
    expect(result.transcription).toBeNull();
    expect(result.error).toMatch(/403/);
  });

  it('retorna ok:false com mensagem legível quando a URL não está configurada', async () => {
    const result = await sendUltrasoundAudio(undefined, 'secret-token', 'base64==', 'liver');

    expect(result.ok).toBe(false);
    expect(result.transcription).toBeNull();
    expect(result.error).toMatch(/VITE_N8N_ULTRASOUND_WEBHOOK_URL/);
  });

  it('erro de rede retorna ok:false sem lançar exceção', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));

    const result = await sendUltrasoundAudio(
      'https://n8nvet.predictlab.com.br/webhook/ultrasound-transcription',
      'secret-token',
      'base64==',
      'spleen',
    );

    expect(result.ok).toBe(false);
    expect(result.transcription).toBeNull();
    expect(result.error).toBe('Failed to fetch');
  });

  it('não envia Authorization quando o secret não está configurado', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transcription: 'ok' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await sendUltrasoundAudio(
      'https://n8nvet.predictlab.com.br/webhook/ultrasound-transcription',
      undefined,
      'base64==',
      'pancreas',
    );

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });
});
