import { useCallback, useState } from 'react';
import {
  sendAnamnesisPayload,
  type AnamnesisPayload,
  type FollowUpAnswer,
} from '@/lib/anamnesisApi';

export type { FollowUpAnswer, AnamnesisPayload };

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

  const webhookSecret = import.meta.env.VITE_N8N_WEBHOOK_SECRET as
    | string
    | undefined;

  const send = useCallback(
    async (payload: AnamnesisPayload): Promise<boolean> => {
      setLoading(true);
      setError(null);

      const result = await sendAnamnesisPayload(webhookUrl, webhookSecret, payload);

      setLoading(false);

      if (!result.ok) {
        setError(result.error);
      }

      return result.ok;
    },
    [webhookUrl, webhookSecret]
  );

  const reset = useCallback(() => setError(null), []);

  return { send, loading, error, reset };
}
