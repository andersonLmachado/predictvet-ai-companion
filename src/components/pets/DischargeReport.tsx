import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Mail, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { PatientInfo } from '@/contexts/PatientContext';

interface DischargeReportProps {
  patient: PatientInfo;
  patientId: string;
}

interface SOAPEntry {
  soap_block: string;
  content: string | null;
  ai_suggestions: string | null;
  created_at: string | null;
}

interface ExamParam {
  parametro: string;
  valor_encontrado: number | string | null;
  ref_min: number;
  ref_max: number;
  unidade: string;
  status: string;
}

interface ExamRow {
  id: string;
  created_at: string | null;
  exam_type: string;
  clinical_summary: string | null;
  analysis_data: ExamParam[];
}

const PRIORITY_PARAMS = [
  'ERITRÓCITOS', 'HEMOGLOBINA', 'HEMATÓCRITO', 'LEUCÓCITOS TOTAIS', 'PLAQUETAS',
  'CREATININA', 'UREIA', 'ALT ( TGP )', 'FOSFATASE ALCALINA',
];

const DischargeReport: React.FC<DischargeReportProps> = ({ patient, patientId }) => {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [soapData, setSoapData] = useState<SOAPEntry[]>([]);
  const [examsData, setExamsData] = useState<ExamRow[]>([]);
  const printContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [soapRes, examsRes] = await Promise.all([
        supabase
          .from('medical_consultations')
          .select('soap_block, content, ai_suggestions, created_at')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('exams_history')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: true }),
      ]);

      if (!soapRes.error && soapRes.data) setSoapData(soapRes.data);
      if (!examsRes.error && examsRes.data) {
        setExamsData(examsRes.data.map((r: any) => ({
          ...r,
          analysis_data: Array.isArray(r.analysis_data) ? r.analysis_data : [],
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, [patientId]);

  const hasData = soapData.length > 0 || examsData.length > 0;
  const isDisabled = loading || !hasData;

  const lastA = soapData.find((s) => s.soap_block === 'A');
  const lastP = soapData.find((s) => s.soap_block === 'P');

  const getEvolutionRows = () => {
    const map = new Map<string, { points: { date: string; value: number; status: string }[]; unidade: string; refMin: number; refMax: number }>();
    examsData.forEach((exam) => {
      const dateStr = exam.created_at ? new Date(exam.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
      exam.analysis_data.forEach((p) => {
        const val = typeof p.valor_encontrado === 'number' ? p.valor_encontrado : parseFloat(String(p.valor_encontrado));
        if (isNaN(val)) return;
        if (!map.has(p.parametro)) map.set(p.parametro, { points: [], unidade: p.unidade ?? '', refMin: Number(p.ref_min) || 0, refMax: Number(p.ref_max) || 0 });
        map.get(p.parametro)!.points.push({ date: dateStr, value: val, status: p.status ?? 'normal' });
      });
    });
    // Filter to priority params that have data
    const priority = PRIORITY_PARAMS.filter((pp) => {
      for (const [key] of map) { if (key.includes(pp)) return true; }
      return false;
    });
    const result: { param: string; points: { date: string; value: number; status: string }[]; unidade: string; refMin: number; refMax: number }[] = [];
    priority.forEach((pp) => {
      for (const [key, val] of map) {
        if (key.includes(pp)) { result.push({ param: key, ...val }); break; }
      }
    });
    return result;
  };

  const generateReport = () => {
    if (!printContentRef.current) return;
    window.print();
  };

  const handleSendEmail = () => {
    const subject = `Relatório de Alta - ${patient.name}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}`, '_blank');
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .discharge-print-root,
          .discharge-print-root * {
            visibility: visible !important;
          }
          .discharge-print-root {
            position: absolute;
            inset: 0;
            margin: 0 auto;
            padding: 0;
            width: 210mm;
            max-width: 210mm;
          }
          .discharge-sheet {
            border: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            min-height: auto !important;
            width: 210mm !important;
          }
          [data-print-hide="true"] {
            display: none !important;
          }
          .discharge-dialog {
            width: 100vw !important;
            max-width: 100vw !important;
            height: auto !important;
            transform: translate(0, 0) !important;
            left: 0 !important;
            top: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .discharge-dialog > button {
            display: none !important;
          }
        }
      `}</style>
      <Dialog open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDisabled} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Relatório de Alta
                </Button>
              </DialogTrigger>
            </span>
          </TooltipTrigger>
          {isDisabled && !loading && (
            <TooltipContent>
              <p>Dados insuficientes para relatório completo</p>
            </TooltipContent>
          )}
        </Tooltip>

        <DialogContent className="discharge-dialog max-w-[95vw] w-[1100px] h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b" data-print-hide="true">
            <DialogTitle>DischargeSummary</DialogTitle>
            <DialogDescription>
              Documento de alta em formato A4.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-3 border-b flex items-center gap-2" data-print-hide="true">
            <Button onClick={generateReport} disabled={isDisabled} className="gap-2">
              <Printer className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="secondary" onClick={handleSendEmail} disabled={isDisabled} className="gap-2">
              <Mail className="h-4 w-4" />
              Enviar Email
            </Button>
          </div>

          <div className="flex-1 overflow-auto bg-slate-100 p-6">
            <div ref={printContentRef} className="discharge-print-root">
              <div className="discharge-sheet mx-auto min-h-[297mm] max-w-[210mm] bg-white p-8 shadow-sm text-sm text-slate-800">
                <header className="mb-6 border-b-2 border-blue-600 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-blue-900">Relatório de Alta</h2>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleString('pt-BR')}
                    </span>
                  </div>
                </header>

                <section className="mb-6 rounded-lg bg-blue-50 p-4">
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <p><strong>Paciente:</strong> {patient.name}</p>
                    <p><strong>Tutor:</strong> {patient.owner_name}</p>
                    <p><strong>Espécie:</strong> {patient.species ?? '—'}</p>
                    <p><strong>Raça:</strong> {patient.breed ?? '—'}</p>
                    <p><strong>Idade:</strong> {patient.age ?? '—'}</p>
                  </div>
                </section>

                <section className="mb-6">
                  <h3 className="mb-3 border-b pb-1 text-sm font-semibold text-blue-900">
                    Última Avaliação & Plano Terapêutico (SOAP)
                  </h3>
                  {lastA || lastP ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {lastA && (
                        <article className="rounded-lg border p-3">
                          <p className="mb-2 text-xs font-semibold text-blue-700">Avaliação (A)</p>
                          <p className="whitespace-pre-wrap">{lastA.content ?? '—'}</p>
                        </article>
                      )}
                      {lastP && (
                        <article className="rounded-lg border p-3">
                          <p className="mb-2 text-xs font-semibold text-blue-700">Plano (P)</p>
                          <p className="whitespace-pre-wrap">{lastP.content ?? '—'}</p>
                          {lastP.ai_suggestions && (
                            <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                              <strong>Sugestão IA:</strong> {lastP.ai_suggestions}
                            </div>
                          )}
                        </article>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">Nenhum registro SOAP disponível.</p>
                  )}
                </section>

                <section>
                  <h3 className="mb-3 border-b pb-1 text-sm font-semibold text-blue-900">
                    Evolução Laboratorial
                  </h3>
                  {getEvolutionRows().length > 0 ? (
                    <div className="overflow-hidden rounded-lg border">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="border p-2 text-left">Parâmetro</th>
                            <th className="border p-2 text-left">Unidade</th>
                            <th className="border p-2 text-left">Ref.</th>
                            <th className="border p-2 text-left">Último valor</th>
                            <th className="border p-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getEvolutionRows().map((row) => {
                            const lastPoint = row.points[row.points.length - 1];
                            return (
                              <tr key={row.param}>
                                <td className="border p-2">{row.param}</td>
                                <td className="border p-2">{row.unidade}</td>
                                <td className="border p-2">{row.refMin} - {row.refMax}</td>
                                <td className="border p-2">{lastPoint?.value ?? '—'}</td>
                                <td className="border p-2">{lastPoint?.status ?? '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">Nenhum dado de evolução laboratorial disponível.</p>
                  )}
                </section>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DischargeReport;
