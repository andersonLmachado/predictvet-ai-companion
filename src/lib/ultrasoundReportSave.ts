// src/lib/ultrasoundReportSave.ts
import { supabase } from '@/integrations/supabase/client';

export interface SaveUltrasoundReportResult {
  ok: boolean;
  error: string | null;
  timedOut: boolean;
}

const SAVE_TIMEOUT_MS = 15000;

async function insertOnce(
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<SaveUltrasoundReportResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('ultrasound_reports') as any)
      .insert(payload)
      .abortSignal(controller.signal);

    return { ok: !error, error: error?.message ?? null, timedOut: false };
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      error: timedOut
        ? 'Tempo de resposta excedido.'
        : err instanceof Error
          ? err.message
          : 'Erro desconhecido ao salvar o laudo.',
      timedOut,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Salva o laudo de ultrassom; tenta novamente uma vez, apenas se a 1ª tentativa expirou (timeout).
export async function saveUltrasoundReport(
  payload: Record<string, unknown>,
  timeoutMs: number = SAVE_TIMEOUT_MS,
): Promise<SaveUltrasoundReportResult> {
  const first = await insertOnce(payload, timeoutMs);
  if (first.ok || !first.timedOut) return first;
  return insertOnce(payload, timeoutMs);
}
