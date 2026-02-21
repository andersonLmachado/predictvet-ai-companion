import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Mail, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type PatientRow = Tables<'patients'>;
type ExamRow = Tables<'exams'>;
type SoapRow = Tables<'medical_consultations'>;
type ExamHistoryRow = Tables<'exams_history'>;
type SoapBlock = 'S' | 'O' | 'A' | 'P';

const SOAP_BLOCKS: SoapBlock[] = ['S', 'O', 'A', 'P'];

interface ExamHistoryItem {
  id: string;
  examName: string;
  examDate: string | null;
  status: 'Analisado' | 'Não analisado';
}

interface ExamHistoryParam {
  parametro: string;
  valor_encontrado: number | string | null;
  ref_min: number | string | null;
  ref_max: number | string | null;
  unidade: string | null;
  status: string | null;
}

interface ExamHistoryDetailed {
  id: string;
  examType: string;
  createdAt: string | null;
  clinicalSummary: string | null;
  analysisData: ExamHistoryParam[];
}

const DischargeSummary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [soapEntries, setSoapEntries] = useState<SoapRow[]>([]);
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([]);
  const [examHistoryDetailed, setExamHistoryDetailed] = useState<ExamHistoryDetailed[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchReportData = async () => {
      setLoading(true);

      const [patientRes, examsRes, soapRes, examHistoryRes] = await Promise.all([
        supabase.from('patients').select('*').eq('id', id).maybeSingle(),
        supabase.from('exams').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        supabase.from('medical_consultations').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        supabase
          .from('exams_history')
          .select('id, exam_type, created_at, clinical_summary, analysis_data')
          .eq('patient_id', id)
          .order('created_at', { ascending: false }),
      ]);

      if (patientRes.error || examsRes.error || soapRes.error || examHistoryRes.error) {
        toast({
          title: 'Erro ao carregar relatório',
          description: 'Não foi possível carregar os dados de alta do paciente.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      setPatient(patientRes.data ?? null);
      setExams(examsRes.data ?? []);
      setSoapEntries(soapRes.data ?? []);
      const rawHistory = (examHistoryRes.data ?? []) as ExamHistoryRow[];
      const historyMapped: ExamHistoryItem[] = rawHistory.map((item) => {
        const hasSummary = Boolean(item.clinical_summary && item.clinical_summary.trim().length > 0);
        const hasAnalysisData = Array.isArray(item.analysis_data)
          ? item.analysis_data.length > 0
          : Boolean(item.analysis_data);

        return {
          id: item.id,
          examName: item.exam_type || 'Exame sem nome',
          examDate: item.created_at,
          status: hasSummary || hasAnalysisData ? 'Analisado' : 'Não analisado',
        };
      });
      const detailedMapped: ExamHistoryDetailed[] = rawHistory.map((item) => ({
        id: item.id,
        examType: item.exam_type || 'Exame sem nome',
        createdAt: item.created_at,
        clinicalSummary: item.clinical_summary,
        analysisData: Array.isArray(item.analysis_data)
          ? (item.analysis_data as ExamHistoryParam[])
          : [],
      }));
      setExamHistory(historyMapped);
      setExamHistoryDetailed(detailedMapped);
      setLoading(false);
    };

    fetchReportData();
  }, [id, toast]);

  const soapByBlock = useMemo(() => {
    const grouped: Record<SoapBlock, SoapRow[]> = { S: [], O: [], A: [], P: [] };

    for (const entry of soapEntries) {
      const block = entry.soap_block?.toUpperCase();
      if (block && SOAP_BLOCKS.includes(block as SoapBlock)) {
        grouped[block as SoapBlock].push(entry);
      }
    }

    return grouped;
  }, [soapEntries]);

  const latestExam = exams[0] ?? null;

  const sendEmail = () => {
    const subject = `Relatório de Alta - ${patient?.name ?? 'Paciente'}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body * { visibility: hidden !important; }
          .report-print-root, .report-print-root * { visibility: visible !important; }
          .report-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .report-sheet {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            box-shadow: none !important;
          }
          [data-print-hide="true"] { display: none !important; }
          .soap-text {
            white-space: pre-wrap !important;
            overflow-wrap: anywhere !important;
            word-wrap: break-word !important;
          }
          .soap-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="mb-6 flex items-center justify-between" data-print-hide="true">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/patient/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Relatório de Alta</h1>
            <p className="text-sm text-muted-foreground">
              Documento consolidado com paciente, exames e evolução SOAP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} disabled={loading} className="gap-2">
            <Printer className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="secondary" onClick={sendEmail} disabled={loading} className="gap-2">
            <Mail className="h-4 w-4" />
            Enviar Email
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando relatório...
        </div>
      ) : (
        <div className="report-print-root">
          <div className="report-sheet mx-auto max-w-[210mm] rounded-lg border bg-white p-8 shadow-sm">
            <header className="mb-6 border-b-2 border-primary pb-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <FileText className="h-5 w-5 text-primary" />
                  Relatório de Alta
                </h2>
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleString('pt-BR')}
                </span>
              </div>
            </header>

            <section className="mb-6 rounded-lg bg-blue-50 p-4 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <p><strong>Paciente:</strong> {patient?.name ?? '—'}</p>
                <p><strong>Tutor:</strong> {patient?.owner_name ?? '—'}</p>
                <p><strong>Espécie:</strong> {patient?.species ?? '—'}</p>
                <p><strong>Raça:</strong> {patient?.breed ?? '—'}</p>
                <p><strong>Idade:</strong> {patient?.age ?? '—'}</p>
                <p><strong>Peso:</strong> {patient?.weight ?? '—'}</p>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="mb-3 border-b pb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Exames
              </h3>

              {examHistoryDetailed.length > 0 ? (
                <div className="space-y-5">
                  {examHistoryDetailed.map((exam) => (
                    <div key={exam.id} className="rounded-md border">
                      <div className="grid gap-2 border-b bg-slate-50 p-3 text-sm md:grid-cols-3">
                        <p><strong>Exame:</strong> {exam.examType}</p>
                        <p>
                          <strong>Data:</strong>{' '}
                          {exam.createdAt ? new Date(exam.createdAt).toLocaleString('pt-BR') : '—'}
                        </p>
                        <p><strong>Indicadores:</strong> {exam.analysisData.length}</p>
                      </div>

                      {exam.analysisData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="border p-2 text-left">Parâmetro</th>
                                <th className="border p-2 text-left">Resultado</th>
                                <th className="border p-2 text-left">Ref. Min</th>
                                <th className="border p-2 text-left">Ref. Max</th>
                                <th className="border p-2 text-left">Unidade</th>
                                <th className="border p-2 text-left">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exam.analysisData.map((param, index) => (
                                <tr key={`${exam.id}-${param.parametro}-${index}`}>
                                  <td className="border p-2">{param.parametro || '—'}</td>
                                  <td className="border p-2">{param.valor_encontrado ?? '—'}</td>
                                  <td className="border p-2">{param.ref_min ?? '—'}</td>
                                  <td className="border p-2">{param.ref_max ?? '—'}</td>
                                  <td className="border p-2">{param.unidade ?? '—'}</td>
                                  <td className="border p-2">{param.status ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="p-3 text-sm text-muted-foreground">
                          Sem dados de indicadores para este exame.
                        </p>
                      )}

                      {exam.clinicalSummary && (
                        <div className="border-t p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Resumo Clínico</p>
                          <p className="soap-text mt-1 text-sm">{exam.clinicalSummary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : latestExam ? (
                <div className="space-y-2 text-sm">
                  <p><strong>Último exame:</strong> {latestExam.exam_type || '—'}</p>
                  <p><strong>Status:</strong> {latestExam.status || '—'}</p>
                  <p>
                    <strong>Data:</strong>{' '}
                    {latestExam.completed_at
                      ? new Date(latestExam.completed_at).toLocaleString('pt-BR')
                      : latestExam.created_at
                      ? new Date(latestExam.created_at).toLocaleString('pt-BR')
                      : '—'}
                  </p>
                  <p className="soap-text"><strong>Notas:</strong> {latestExam.notes || 'Sem observações.'}</p>
                  <p className="soap-text"><strong>Resultados:</strong> {latestExam.results || 'Sem resultados anexados.'}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum exame encontrado.</p>
              )}
            </section>

            <section className="mb-6">
              <h3 className="mb-3 border-b pb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Histórico de Exames
              </h3>

              {examHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum histórico de exame encontrado.</p>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border p-2 text-left">Exame</th>
                        <th className="border p-2 text-left">Data</th>
                        <th className="border p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examHistory.map((item) => (
                        <tr key={item.id}>
                          <td className="border p-2">{item.examName}</td>
                          <td className="border p-2">
                            {item.examDate ? new Date(item.examDate).toLocaleString('pt-BR') : '—'}
                          </td>
                          <td className="border p-2">{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-3 border-b pb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Consultas SOAP
              </h3>

              <div className="space-y-4">
                {SOAP_BLOCKS.map((block) => (
                  <div key={block} className="space-y-2">
                    <p className="text-sm font-semibold">Bloco {block}</p>
                    {soapByBlock[block].length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem registros neste bloco.</p>
                    ) : (
                      soapByBlock[block].map((entry) => (
                        <article key={entry.id} className="soap-card rounded-md border p-3 text-sm">
                          <p className="mb-2 text-xs text-muted-foreground">
                            {entry.created_at
                              ? new Date(entry.created_at).toLocaleString('pt-BR')
                              : '—'}
                          </p>
                          <p className="soap-text">{entry.content || '—'}</p>
                          {entry.ai_suggestions && (
                            <div className="soap-text mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
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
        </div>
      )}
    </div>
  );
};

export default DischargeSummary;
