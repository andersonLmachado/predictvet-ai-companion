import {
  serializeVaccines,
  serializeContinuousMedications,
  serializeInfectiousDiseases,
  type Vaccine,
  type ContinuousMedication,
  type InfectiousDisease,
} from './medicalHistory';

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

export interface ExtendedAnamnesisPayload extends AnamnesisPayload {
  respostas_truncadas?: true; // flag literal: apenas presente (true) quando truncamento ocorreu; omitida caso contrário
  weight_kg?: number | null;
  temperature_c?: number | null;
  clinical_history?: string;
  allergies?: string;
  previous_diseases?: string;
  vaccines?: string;
  continuous_medications?: string;
  drug_restrictions?: string;
  reproductive_status?: string;
  infectious_diseases?: string;
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

// ─── Truncated payload builder ────────────────────────────────────────────────

export function buildTruncatedPayload(params: {
  consultationId: string;
  patientId: string;
  chiefComplaint: string;
  followupAnswers: FollowUpAnswer[];
  transcription: string;
  dynamicAnswers: FollowUpAnswer[];
  weightKg?: number | null;
  temperatureC?: number | null;
  clinicalHistory?: string;
  allergies?: string;
  previousDiseases?: string;
  vaccines?: Vaccine[];
  continuousMedications?: ContinuousMedication[];
  drugRestrictions?: string;
  reproductiveStatus?: string;
  infectiousDiseases?: InfectiousDisease[];
}): ExtendedAnamnesisPayload {
  let { transcription } = params;

  if (transcription.length > 500) {
    console.warn('[buildTruncatedPayload] transcription truncado de', transcription.length, 'para 500 chars');
    transcription = transcription.slice(0, 500);
  }

  const truncateAnswer = (ans: FollowUpAnswer): FollowUpAnswer => {
    if (ans.answer.length > 300) {
      console.warn('[buildTruncatedPayload] answer truncado de', ans.answer.length, 'para 300 chars');
      return { ...ans, answer: ans.answer.slice(0, 300) };
    }
    return ans;
  };

  let followup_answers: FollowUpAnswer[] = [
    ...params.followupAnswers.map(truncateAnswer),
    ...params.dynamicAnswers.map(truncateAnswer),
  ];

  const result: ExtendedAnamnesisPayload = {
    consultation_id: params.consultationId,
    patient_id: params.patientId,
    chief_complaint: params.chiefComplaint,
    followup_answers,
    transcription,
  };

  if (JSON.stringify(followup_answers).length > 2000) {
    while (followup_answers.length > 0 && JSON.stringify(followup_answers).length > 2000) {
      followup_answers = followup_answers.slice(0, -1);
    }
    console.warn('[buildTruncatedPayload] followup_answers truncado para', followup_answers.length, 'itens');
    result.followup_answers = followup_answers;
    result.respostas_truncadas = true;
  }

  if (params.weightKg != null) result.weight_kg = params.weightKg;
  if (params.temperatureC != null) result.temperature_c = params.temperatureC;

  if (params.clinicalHistory) {
    result.clinical_history = params.clinicalHistory.slice(0, 500);
  }

  if (params.allergies) result.allergies = params.allergies.slice(0, 300);
  if (params.previousDiseases) result.previous_diseases = params.previousDiseases.slice(0, 300);
  if (params.vaccines?.length) result.vaccines = serializeVaccines(params.vaccines);
  if (params.continuousMedications?.length) {
    result.continuous_medications = serializeContinuousMedications(params.continuousMedications).slice(0, 300);
  }
  if (params.drugRestrictions) result.drug_restrictions = params.drugRestrictions.slice(0, 300);
  if (params.reproductiveStatus) result.reproductive_status = params.reproductiveStatus;
  if (params.infectiousDiseases?.length) {
    result.infectious_diseases = serializeInfectiousDiseases(params.infectiousDiseases).slice(0, 300);
  }

  return result;
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
