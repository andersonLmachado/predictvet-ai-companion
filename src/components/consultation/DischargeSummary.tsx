import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Mail, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type ConsultationRow = Tables<'medical_consultations'>;
type PatientRow = Tables<'patients'>;
type ExamRow = Tables<'exams'>;

const SOAP_BLOCKS = ['S', 'O', 'A', 'P'] as const;
type SoapBlock = (typeof SOAP_BLOCKS)[number];

type GroupedSoap = Record<SoapBlock, ConsultationRow[]>;

interface DischargeSummaryProps {
  patientId: string;
}

const createEmptySoapGroups = (): GroupedSoap => ({
  S: [],
  O: [],
  A: [],
  P: [],
});

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const escapeHtml = (value: string | null | undefined) =>
  (value ?? '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const DischargeSummary: React.FC<DischargeSummaryProps> = ({ patientId }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [soapGroups, setSoapGroups] = useState<GroupedSoap>(createEmptySoapGroups());
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [latestExam, setLatestExam] = useState<ExamRow | null>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;

    const loadData = async () => {
      setLoading(true);

      const [consultationsRes, patientRes, examRes] = await Promise.all([
        supabase
          .from('medical_consultations')
          .select('*')
          .eq('patient_id', patientId)
          .order('soap_block', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase.from('patients').select('*').eq('id', patientId).maybeSingle(),
        supabase
          .from('exams')
          .select('*')
          .eq('patient_id', patientId)
          .order('completed_at', { ascending: false, nullsFirst: false })
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!active) return;

      if (consultationsRes.error || patientRes.error || examRes.error) {
        toast({
          title: 'Erro ao carregar o resumo',
          description: 'Não foi possível buscar todos os dados para o Discharge Summary.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const grouped = createEmptySoapGroups();
      for (const item of consultationsRes.data ?? []) {
        const block = item.soap_block?.toUpperCase() as SoapBlock | undefined;
        if (block && SOAP_BLOCKS.includes(block)) {
          grouped[block].push(item);
        }
      }

      setSoapGroups(grouped);
      setPatient(patientRes.data ?? null);
      setLatestExam(examRes.data ?? null);
      setLoading(false);
    };

    loadData();

    return () => {
      active = false;
    };
  }, [open, patientId, toast]);

  const lastSoapByBlock = useMemo(
    () =>
      SOAP_BLOCKS.reduce((acc, block) => {
        acc[block] = soapGroups[block][0] ?? null;
        return acc;
      }, {} as Record<SoapBlock, ConsultationRow | null>),
    [soapGroups]
  );

  const hasAnyData = useMemo(
    () =>
      Boolean(patient) ||
      Boolean(latestExam) ||
      SOAP_BLOCKS.some((block) => soapGroups[block].length > 0),
    [patient, latestExam, soapGroups]
  );

  const buildPrintableHtml = () => {
    const soapSections = SOAP_BLOCKS.map((block) => {
      const items = soapGroups[block];
      const itemsHtml =
        items.length === 0
          ? '<p class="empty">Sem registros neste bloco.</p>'
          : items
              .map(
                (entry) => `
                  <div class="soap-item">
                    <div class="meta">${escapeHtml(formatDateTime(entry.created_at))}</div>
                    <p>${escapeHtml(entry.content)}</p>
                    ${
                      entry.ai_suggestions
                        ? `<div class="hint"><strong>Sugestão IA:</strong> ${escapeHtml(entry.ai_suggestions)}</div>`
                        : ''
                    }
                  </div>
                `
              )
              .join('');

      return `
        <section class="section">
          <h3>Bloco ${block}</h3>
          ${itemsHtml}
        </section>
      `;
    }).join('');

    return `<!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Discharge Summary - ${escapeHtml(patient?.name ?? '')}</title>
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #111827; background: #f5f7fb; }
          .sheet { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 16mm; box-sizing: border-box; }
          h1 { margin: 0; font-size: 20px; }
          h2 { margin: 14px 0 8px; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          h3 { margin: 0 0 8px; font-size: 13px; color: #0f4c81; }
          p { margin: 0; white-space: pre-wrap; line-height: 1.45; }
          .meta { font-size: 11px; color: #6b7280; margin-bottom: 6px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-top: 10px; font-size: 12px; }
          .section { margin-top: 14px; }
          .soap-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
          .hint { margin-top: 8px; padding: 8px; font-size: 11px; background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; }
          .empty { color: #6b7280; font-style: italic; font-size: 12px; }
          @media print {
            body { background: #fff; }
            .sheet { margin: 0; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <h1>Discharge Summary</h1>
          <div class="meta">Gerado em ${escapeHtml(formatDateTime(new Date().toISOString()))}</div>

          <h2>Paciente (Histórico)</h2>
          <div class="grid">
            <div><strong>Nome:</strong> ${escapeHtml(patient?.name)}</div>
            <div><strong>Tutor:</strong> ${escapeHtml(patient?.owner_name)}</div>
            <div><strong>Espécie:</strong> ${escapeHtml(patient?.species)}</div>
            <div><strong>Raça:</strong> ${escapeHtml(patient?.breed)}</div>
            <div><strong>Idade:</strong> ${escapeHtml(patient?.age)}</div>
            <div><strong>Sexo:</strong> ${escapeHtml(patient?.sex)}</div>
            <div><strong>Peso:</strong> ${escapeHtml(patient?.weight?.toString())}</div>
            <div><strong>Telefone:</strong> ${escapeHtml(patient?.owner_phone)}</div>
          </div>

          <h2>Último Exame Analisado</h2>
          ${
            latestExam
              ? `
                <div class="grid">
                  <div><strong>Tipo:</strong> ${escapeHtml(latestExam.exam_type)}</div>
                  <div><strong>Status:</strong> ${escapeHtml(latestExam.status)}</div>
                  <div><strong>Solicitado:</strong> ${escapeHtml(formatDateTime(latestExam.requested_at))}</div>
                  <div><strong>Concluído:</strong> ${escapeHtml(formatDateTime(latestExam.completed_at))}</div>
                </div>
                <section class="section">
                  <h3>Notas</h3>
                  <p>${escapeHtml(latestExam.notes)}</p>
                </section>
                <section class="section">
                  <h3>Resultados</h3>
                  <p>${escapeHtml(latestExam.results)}</p>
                </section>
              `
              : '<p class="empty">Nenhum exame encontrado na tabela exams para este paciente.</p>'
          }

          <h2>Consultas SOAP (organizadas por bloco)</h2>
          ${soapSections}
        </main>
      </body>
      </html>`;
  };

  const handleExportPdf = () => {
    if (!hasAnyData) return;

    setExportingPdf(true);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      setExportingPdf(false);
      toast({
        title: 'Não foi possível exportar',
        description: 'Seu navegador bloqueou a janela de impressão.',
        variant: 'destructive',
      });
      return;
    }

    printWindow.document.write(buildPrintableHtml());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setExportingPdf(false);
    }, 250);
  };

  const buildEmailDraftText = () => {
    const lines = [
      `Discharge Summary - ${patient?.name ?? 'Paciente'}`,
      `Tutor: ${patient?.owner_name ?? '—'}`,
      `Espécie/Raça: ${patient?.species ?? '—'} / ${patient?.breed ?? '—'}`,
      '',
      'Último exame analisado:',
      latestExam
        ? `${latestExam.exam_type} (${latestExam.status}) - ${formatDateTime(
            latestExam.completed_at ?? latestExam.created_at
          )}`
        : 'Sem exame registrado.',
      '',
      'Resumo SOAP mais recente:',
      ...SOAP_BLOCKS.map((block) => {
        const entry = lastSoapByBlock[block];
        return `${block}: ${entry?.content?.slice(0, 180) || 'Sem registro.'}`;
      }),
    ];

    return lines.join('\n');
  };

  const handleSendEmail = () => {
    if (!hasAnyData) return;
    setSendingEmail(true);

    // Placeholder: body/assunto serão definidos em uma próxima etapa.
    const subject = `Discharge Summary - ${patient?.name ?? 'Paciente'}`;
    const body = buildEmailDraftText();
    const to = patient?.owner_email ?? '';
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    setSendingEmail(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Discharge Summary
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] overflow-hidden p-0">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>DischargeSummary</DialogTitle>
            <DialogDescription>
              Resumo completo em formato de documento A4 para alta.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 border-b px-6 py-3">
            <Button
              onClick={handleExportPdf}
              className="gap-2"
              disabled={loading || !hasAnyData || exportingPdf}
            >
              {exportingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Exportar PDF
            </Button>
            <Button
              variant="secondary"
              onClick={handleSendEmail}
              className="gap-2"
              disabled={loading || !hasAnyData || sendingEmail}
            >
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Enviar Email
            </Button>
          </div>

          <ScrollArea className="h-full bg-slate-100">
            <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white p-8 shadow-sm md:my-8">
              {loading ? (
                <div className="flex min-h-[240px] items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando Discharge Summary...
                </div>
              ) : !hasAnyData ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum dado disponível para gerar o resumo.
                </p>
              ) : (
                <div className="space-y-6 text-sm">
                  <section className="space-y-1">
                    <h2 className="text-xl font-semibold text-slate-900">Discharge Summary</h2>
                    <p className="text-xs text-muted-foreground">
                      Gerado em {formatDateTime(new Date().toISOString())}
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Paciente (Histórico)
                    </h3>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <p><strong>Nome:</strong> {patient?.name ?? '—'}</p>
                      <p><strong>Tutor:</strong> {patient?.owner_name ?? '—'}</p>
                      <p><strong>Espécie:</strong> {patient?.species ?? '—'}</p>
                      <p><strong>Raça:</strong> {patient?.breed ?? '—'}</p>
                      <p><strong>Idade:</strong> {patient?.age ?? '—'}</p>
                      <p><strong>Sexo:</strong> {patient?.sex ?? '—'}</p>
                      <p><strong>Peso:</strong> {patient?.weight ?? '—'}</p>
                      <p><strong>Telefone do tutor:</strong> {patient?.owner_phone ?? '—'}</p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Último Exame Analisado
                    </h3>
                    {latestExam ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <p><strong>Tipo:</strong> {latestExam.exam_type || '—'}</p>
                          <p><strong>Status:</strong> {latestExam.status || '—'}</p>
                          <p><strong>Solicitado:</strong> {formatDateTime(latestExam.requested_at)}</p>
                          <p><strong>Concluído:</strong> {formatDateTime(latestExam.completed_at)}</p>
                        </div>
                        <div>
                          <p className="mb-1 font-medium">Notas</p>
                          <p className="whitespace-pre-wrap rounded-md border bg-slate-50 p-3">
                            {latestExam.notes || 'Sem observações.'}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 font-medium">Resultados</p>
                          <p className="whitespace-pre-wrap rounded-md border bg-slate-50 p-3">
                            {latestExam.results || 'Sem resultados anexados.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Nenhum exame encontrado na tabela `exams`.
                      </p>
                    )}
                  </section>

                  <section className="space-y-3">
                    <h3 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Consultas SOAP (organizadas por bloco)
                    </h3>
                    <div className="space-y-4">
                      {SOAP_BLOCKS.map((block) => (
                        <div key={block} className="space-y-2">
                          <p className="font-semibold text-slate-800">Bloco {block}</p>
                          {soapGroups[block].length === 0 ? (
                            <p className="text-muted-foreground">Sem registros neste bloco.</p>
                          ) : (
                            soapGroups[block].map((entry) => (
                              <article key={entry.id} className="rounded-md border p-3">
                                <p className="mb-2 text-xs text-muted-foreground">
                                  {formatDateTime(entry.created_at)}
                                </p>
                                <p className="whitespace-pre-wrap">{entry.content || '—'}</p>
                                {entry.ai_suggestions && (
                                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs">
                                    <strong>Sugestão IA:</strong> {entry.ai_suggestions}
                                  </div>
                                )}
                              </article>
                            ))
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DischargeSummary;
