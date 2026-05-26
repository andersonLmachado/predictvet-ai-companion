import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ─── Tipos exportados ────────────────────────────────────────────────────────

export interface VoiceConsultationPayload {
  patient_id: string;
  audio: string;            // base64
  context: string;          // max 500 chars
  clinical_history: string;
}

export interface VoiceConsultationResult {
  consultation_id: string;
  soap_s: string;
  soap_o: string;
  soap_a: string;
  soap_p: string;
}

export interface VoiceSendResult {
  ok: boolean;
  data: VoiceConsultationResult | null;
  error: string | null;
}

// ─── Função pura (testável em node) ─────────────────────────────────────────

export async function sendVoiceConsultationPayload(
  webhookUrl: string | undefined,
  secret: string | undefined,
  payload: VoiceConsultationPayload,
  signal?: AbortSignal
): Promise<VoiceSendResult> {
  if (!webhookUrl) {
    return {
      ok: false,
      data: null,
      error: 'VITE_N8N_VOICE_CONSULTATION_URL não configurado. Defina a variável no .env.',
    };
  }
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret && { Authorization: `Bearer ${secret}` }),
      },
      body: JSON.stringify(payload),
      signal,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      return { ok: false, data: null, error: `n8n respondeu ${response.status}: ${text}` };
    }
    const data = await response.json();
    return { ok: true, data, error: null };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        data: null,
        error: 'A consulta demorou mais que o esperado. Verifique sua conexão e tente novamente.',
      };
    }
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao chamar o webhook.';
    return { ok: false, data: null, error: message };
  }
}

// ─── Conversão Blob → base64 ─────────────────────────────────────────────────
// Usa arrayBuffer + btoa (compatível com browser e Node 16+)

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes  = new Uint8Array(buffer);
  let binary   = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseVoiceConsultationOptions {
  patientId: string;
}

interface UseVoiceConsultationReturn {
  submit: (audioBlob: Blob, context: string, clinicalHistory: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export function useVoiceConsultation({ patientId }: UseVoiceConsultationOptions): UseVoiceConsultationReturn {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const webhookUrl    = import.meta.env.VITE_N8N_VOICE_CONSULTATION_URL as string | undefined;
  const webhookSecret = import.meta.env.VITE_N8N_WEBHOOK_SECRET as string | undefined;

  const submit = useCallback(
    async (audioBlob: Blob, context: string, clinicalHistory: string) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 3 * 60 * 1000); // 3 min

      try {
        const audio = await blobToBase64(audioBlob);

        const payload: VoiceConsultationPayload = {
          patient_id: patientId,
          audio,
          context:          context.slice(0, 500),
          clinical_history: clinicalHistory,
        };

        const result = await sendVoiceConsultationPayload(
          webhookUrl,
          webhookSecret,
          payload,
          controller.signal
        );

        if (!result.ok || !result.data) {
          const msg = result.error ?? 'Erro desconhecido ao processar o áudio.';
          setError(msg);
          toast.error(msg);
          return;
        }

        const { data: soapData } = result;
        // Dynamic import to avoid supabase localStorage at module load time (breaks Node tests)
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();

        // Coluna `source` existe no banco mas está desatualizada nos tipos TS gerados.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: dbError } = await (supabase.from('medical_consultations') as any).insert({
          patient_id:       patientId,
          veterinarian_id:  user?.id,
          soap_s:           soapData.soap_s,
          soap_o:           soapData.soap_o,
          soap_a:           soapData.soap_a,
          soap_p:           soapData.soap_p,
          source:           'voice',
        });

        if (dbError) {
          const msg = 'Erro ao salvar consulta no prontuário.';
          setError(msg);
          toast.error(msg);
          return;
        }

        setSuccess(true);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [patientId, webhookUrl, webhookSecret]
  );

  const reset = useCallback(() => { setError(null); setSuccess(false); }, []);

  return { submit, loading, error, success, reset };
}
