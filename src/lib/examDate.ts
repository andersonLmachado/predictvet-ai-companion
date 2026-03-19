import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { supabase } from '@/integrations/supabase/client';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const EXTRACT_DATE_WEBHOOK = 'https://n8nvet.predictlab.com.br/webhook/extrair-data-exame';

export interface ExamExtraction {
  exam_date: string | null;
  laboratory: string | null;
}

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
 * Extracts plain text from a PDF file using pdfjs-dist.
 * Reads up to 3 pages — sufficient to find a date in most exam documents.
 * Returns at most 2000 chars.
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  const pagesToRead = Math.min(pdf.numPages, 3);

  for (let i = 1; i <= pagesToRead; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.slice(0, 2000);
}

/**
 * Sends extracted exam text to the n8n date-extraction webhook.
 * Uses pdfjs-dist for PDFs; falls back to file.text() for images.
 * Returns an ExamExtraction with exam_date (ISO YYYY-MM-DD or null) and laboratory (string or null).
 * NEVER throws — always resolves ({ exam_date: null, laboratory: null } on any failure).
 */
export async function extractExamDate(file: File): Promise<ExamExtraction> {
  try {
    let text = '';

    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else {
      text = (await file.text()).slice(0, 2000);
    }

    if (!text.trim()) {
      console.warn('[examDate] texto vazio após extração, abortando');
      return { exam_date: null, laboratory: null };
    }

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
      return { exam_date: null, laboratory: null };
    }

    const json = await response.json();
    const raw = Array.isArray(json) ? json[0] : json;
    const date = raw?.exam_date ?? null;
    const lab = typeof raw?.laboratory === 'string' ? raw.laboratory : null;

    const validDate =
      typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;

    return { exam_date: validDate, laboratory: lab };
  } catch (err) {
    console.warn('[examDate] Failed to extract exam date:', err);
    return { exam_date: null, laboratory: null };
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
