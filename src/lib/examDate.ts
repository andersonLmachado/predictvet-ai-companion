import { supabase } from '@/integrations/supabase/client';

const EXTRACT_DATE_WEBHOOK = 'https://n8nvet.predictlab.com.br/webhook/extrair-data-exame';

/**
 * Formats an ISO date string (YYYY-MM-DD) as DD/MM/YYYY for display.
 * Returns "Data não informada" when date is null.
 * Pure function — no side effects, fully unit-testable.
 */
export function formatExamDate(date: string | null): string {
  if (!date) return 'Data não informada';
  // Use T12:00:00 to avoid UTC midnight shifting the day in UTC-3 (Brazil)
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Sends the exam file text to the n8n date-extraction webhook.
 * Reads the file as text, truncates to 2000 chars, and POSTs JSON.
 * Returns an ISO date string (YYYY-MM-DD) or null.
 * NEVER throws — always resolves (null on any failure).
 */
export async function extractExamDate(file: File): Promise<string | null> {
  try {
    const rawText = await file.text();
    const text = rawText.slice(0, 2000);

    const response = await fetch(EXTRACT_DATE_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_N8N_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.warn('[examDate] Webhook returned non-OK status:', response.status);
      return null;
    }

    const json = await response.json();
    const date = json?.exam_date ?? null;

    // Validate ISO format before trusting the response
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    return null;
  } catch (err) {
    console.warn('[examDate] Failed to extract exam date:', err);
    return null;
  }
}

/**
 * Saves exam_date to exams_history via Supabase.
 * Follows the same RLS pattern as updateVetNotes in src/lib/vetNotes.ts.
 */
export async function updateExamDate(examId: string, date: string | null): Promise<void> {
  const { error } = await supabase
    .from('exams_history')
    .update({ exam_date: date })
    .eq('id', examId);

  if (error) throw new Error(error.message);
}
