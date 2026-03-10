import { useCallback, useState } from 'react';

// ─── Payload ────────────────────────────────────────────────────────────────

export interface FollowUpAnswer {
  question: string;
  answer: string;
}

export interface AnamnesisPayload {
  patient_id: string;
  chief_complaint: string;
  followup_answers: FollowUpAnswer[];
  transcription: string;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseAnamnesisWebhookReturn {
  send: (payload: AnamnesisPayload) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Sends the guided anamnesis intake data to the n8n webhook.
 *
 * Endpoint: VITE_N8N_ANAMNESIS_WEBHOOK_URL (env var)
 * The n8n workflow receives the payload, runs clinical logic via Gemini,
 * and persists results to medical_consultations using the service_role key.
 *
 * Returns `true` on HTTP 2xx, `false` otherwise (error stored in `error`).
 */
export function useAnamnesisWebhook(): UseAnamnesisWebhookReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webhookUrl = import.meta.env.VITE_N8N_ANAMNESIS_WEBHOOK_URL as
    | string
    | undefined;

  const send = useCallback(
    async (payload: AnamnesisPayload): Promise<boolean> => {
      if (!webhookUrl) {
        setError(
          'Webhook n8n não configurado. Defina VITE_N8N_ANAMNESIS_WEBHOOK_URL no .env.'
        );
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => response.statusText);
          throw new Error(`n8n respondeu ${response.status}: ${text}`);
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro desconhecido ao chamar o webhook.';
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [webhookUrl]
  );

  const reset = useCallback(() => setError(null), []);

  return { send, loading, error, reset };
}
