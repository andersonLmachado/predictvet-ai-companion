// ─── Types ───────────────────────────────────────────────────────────────────

export interface FollowUpAnswer {
  question: string;
  answer: string;
}

export interface AnamnesisPayload {
  consultation_id: string;
  patient_id: string;
  chief_complaint: string;
  followup_answers: FollowUpAnswer[];
  transcription: string;
}

export interface SendResult {
  ok: boolean;
  error: string | null;
}

// ─── Payload builder ─────────────────────────────────────────────────────────

export function buildAnamnesisPayload(params: {
  consultationId: string;
  patientId: string;
  chiefComplaint: string;
  followupAnswers: FollowUpAnswer[];
  transcription: string;
}): AnamnesisPayload {
  return {
    consultation_id: params.consultationId,
    patient_id: params.patientId,
    chief_complaint: params.chiefComplaint,
    followup_answers: params.followupAnswers,
    transcription: params.transcription,
  };
}

// ─── Pure fetch ──────────────────────────────────────────────────────────────

export async function sendAnamnesisPayload(
  webhookUrl: string | undefined,
  secret: string | undefined,
  payload: AnamnesisPayload
): Promise<SendResult> {
  if (!webhookUrl) {
    return {
      ok: false,
      error: 'Webhook n8n não configurado. Defina VITE_N8N_ANAMNESIS_WEBHOOK_URL no .env.',
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
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      return { ok: false, error: `n8n respondeu ${response.status}: ${text}` };
    }

    return { ok: true, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erro desconhecido ao chamar o webhook.';
    return { ok: false, error: message };
  }
}
