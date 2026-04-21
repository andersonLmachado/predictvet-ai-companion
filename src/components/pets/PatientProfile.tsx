
import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient, PatientInfo } from '@/contexts/PatientContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { buildPatientUpdatePayload, validatePatientEdit, type EditForm } from '@/lib/patientEdit';
import { ArrowLeft, PawPrint, User, Calendar, ClipboardList, Activity, Sparkles, Loader2, Stethoscope, Scan, Edit, X, Save } from 'lucide-react';
import PatientSummary from '@/components/dashboard/PatientSummary';
import EvolutionReportCard from '@/components/dashboard/EvolutionReportCard';
import TrendChart, { TrendDataPoint } from '@/components/dashboard/TrendChart';
import ClinicalSignsSection from '@/components/dashboard/ClinicalSignsSection';
import PatientExamsModal from '@/components/pets/PatientExamsModal';
import {
  buildExamEvolutionComparison,
  formatCellValue,
  formatReferenceRange,
  type ExamEvolutionExam,
} from '@/lib/examEvolution';
import { buildPrintableHtml } from '@/lib/ultrasoundReportGenerator';

// --- Tab: Histórico SOAP ---
const SOAPHistoryTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { consultationRefreshKey } = usePatient();
  const [soapHistory, setSoapHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (!error && data) setSoapHistory(data);
      setLoading(false);
    };
    fetch();
  }, [patientId, consultationRefreshKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (soapHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground mb-4">Nenhuma consulta SOAP registrada para este paciente.</p>
        <Button variant="outline" onClick={() => navigate('/chat')}>Iniciar Consulta Guiada</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {soapHistory.map((entry) => (
        <Card key={entry.id} className="border-l-4 border-l-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="font-mono">Bloco {entry.soap_block}</Badge>
              <span className="text-xs text-muted-foreground">
                {entry.created_at
                  ? new Date(entry.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })
                  : '—'}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
            {entry.ai_suggestions && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Sugestões da IA</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200 whitespace-pre-wrap">{entry.ai_suggestions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// --- Tab: Evolução ---
interface ExamParam {
  parametro: string;
  valor_encontrado: number | string | null;
  ref_min: number | string | null;
  ref_max: number | string | null;
  unidade: string | null;
  status: string | null;
}

interface ExamHistoryRow {
  id: string;
  created_at: string | null;
  exam_date: string | null;
  exam_type: string;
  clinical_summary: string | null;
  analysis_data: ExamParam[];
}

const PRIORITY_PARAMS = [
  'ERITRÓCITOS', 'HEMOGLOBINA', 'HEMATÓCRITO', 'LEUCÓCITOS TOTAIS', 'PLAQUETAS',
  'CREATININA', 'UREIA', 'ALT ( TGP )', 'FOSFATASE ALCALINA', 'PROTEÍNAS PLASMÁTICAS',
];

const formatExamLabel = (exam: ExamEvolutionExam | null) => {
  if (!exam) return '—';
  const effectiveDate = exam.examDate ?? exam.createdAt;
  const dateText = effectiveDate
    ? new Date(effectiveDate).toLocaleDateString('pt-BR')
    : 'Data indefinida';
  return `${exam.examType || 'Exame'} (${dateText})`;
};

const EvolutionTab: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [history, setHistory] = useState<ExamHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('exams_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });
      if (!error && data) {
        const mapped = data.map((row: any) => ({
          ...row,
          analysis_data: Array.isArray(row.analysis_data) ? row.analysis_data : [],
        }));
        mapped.sort((a: ExamHistoryRow, b: ExamHistoryRow) => {
          const aTime = new Date(a.exam_date ?? a.created_at ?? 0).getTime();
          const bTime = new Date(b.exam_date ?? b.created_at ?? 0).getTime();
          return aTime - bTime;
        });
        setHistory(mapped);
      }
      setLoading(false);
    };
    fetch();
  }, [patientId]);

  const trendsByParam = useMemo(() => {
    const map = new Map<string, { data: TrendDataPoint[]; unidade: string; refMin: number; refMax: number }>();
    history.forEach((exam) => {
      const dateStr = exam.exam_date ?? exam.created_at ?? '';
      exam.analysis_data.forEach((p) => {
        const val = typeof p.valor_encontrado === 'number' ? p.valor_encontrado : parseFloat(String(p.valor_encontrado));
        if (isNaN(val)) return;
        if (!map.has(p.parametro)) {
          map.set(p.parametro, { data: [], unidade: p.unidade ?? '', refMin: Number(p.ref_min) || 0, refMax: Number(p.ref_max) || 0 });
        }
        map.get(p.parametro)!.data.push({ date: dateStr, value: val, status: p.status ?? 'normal' });
      });
    });
    return map;
  }, [history]);

  const sortedParams = useMemo(() => {
    const allParams = Array.from(trendsByParam.keys());
    const priority = allParams.filter((p) => PRIORITY_PARAMS.some((pp) => p.includes(pp)));
    const rest = allParams.filter((p) => !priority.includes(p));
    return [...priority, ...rest];
  }, [trendsByParam]);

  const evolutionComparison = useMemo(
    () =>
      buildExamEvolutionComparison(
        history.map((exam) => ({
          id: exam.id,
          examType: exam.exam_type,
          createdAt: exam.created_at,
          examDate: exam.exam_date ?? null,
          analysisData: exam.analysis_data,
        }))
      ),
    [history]
  );

  // ExamHistoryRow correspondentes para EvolutionReportCard (painel de 3 colunas)
  const baseHistoryRow = useMemo(
    () => history.find(e => e.id === evolutionComparison.previousExam?.id) ?? null,
    [history, evolutionComparison]
  );
  const comparedHistoryRow = useMemo(
    () => history.find(e => e.id === evolutionComparison.latestExam?.id) ?? null,
    [history, evolutionComparison]
  );

  // Datas destacadas para os dots dos TrendCharts (espelha comportamento do Dashboard)
  const highlightedDates = useMemo<[string, string] | undefined>(() => {
    const { latestExam, previousExam } = evolutionComparison;
    if (!latestExam || !previousExam) return undefined;
    const baseDate = previousExam.examDate ?? previousExam.createdAt ?? '';
    const cmpDate  = latestExam.examDate  ?? latestExam.createdAt  ?? '';
    if (!baseDate || !cmpDate) return undefined;
    return [baseDate, cmpDate];
  }, [evolutionComparison]);

  // Badges de variação por parâmetro (mesma lógica do Dashboard)
  const badgesByParam = useMemo(() => {
    const map = new Map<string, { pct: number; color: 'green' | 'red' | 'gray' }>();
    if (!baseHistoryRow || !comparedHistoryRow) return map;
    for (const cmpParam of comparedHistoryRow.analysis_data) {
      const baseParam = baseHistoryRow.analysis_data.find(p => p.parametro === cmpParam.parametro);
      if (!baseParam) continue;
      const baseVal = typeof baseParam.valor_encontrado === 'number' ? baseParam.valor_encontrado : null;
      const cmpVal  = typeof cmpParam.valor_encontrado  === 'number' ? cmpParam.valor_encontrado  : null;
      if (baseVal === null || cmpVal === null || baseVal === 0) continue;
      const pct    = ((cmpVal - baseVal) / baseVal) * 100;
      const absPct = Math.abs(pct);
      let color: 'green' | 'red' | 'gray';
      if (absPct <= 2)              color = 'gray';
      else if (cmpParam.status === null)   color = 'gray';
      else if (cmpParam.status === 'normal') color = 'green';
      else                          color = 'red';
      map.set(cmpParam.parametro, { pct, color });
    }
    return map;
  }, [baseHistoryRow, comparedHistoryRow]);

  // Formata data curta para cabeçalho das colunas da tabela
  const formatColHeader = (exam: ExamEvolutionExam | null): string => {
    if (!exam) return '—';
    const d = exam.examDate ?? exam.createdAt;
    return d ? new Date(d).toLocaleDateString('pt-BR') : 'Data indef.';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando histórico...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg text-muted-foreground">Nenhum exame registrado</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Envie exames na aba de Exames para visualizar a evolução</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabela comparativa */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'white',
          border: '1px solid hsl(217,50%,90%)',
          boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
        }}
      >
        <div className="h-1" style={{ background: 'linear-gradient(90deg, hsl(221,73%,45%), hsl(217,88%,57%))' }} />
        <div
          className="px-5 py-4 border-b flex items-center gap-2"
          style={{ borderColor: 'hsl(217,50%,93%)' }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(18,76%,50%))' }}
          />
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
          >
            Evolução Comparativa
          </h2>
        </div>
        <div className="p-5">
          {evolutionComparison.mode === 'none' ? (
            <p className="text-sm" style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Nenhum exame analisado encontrado para comparação.
            </p>
          ) : (
            <div className="space-y-3">
              {evolutionComparison.mode === 'comparison' && (
                <div
                  className="flex items-center gap-3 text-xs rounded-lg px-3 py-2"
                  style={{
                    background: 'hsl(217,100%,97%)',
                    border: '1px solid hsl(217,50%,88%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                    color: 'hsl(222,30%,45%)',
                  }}
                >
                  <span>
                    <span className="font-semibold" style={{ color: 'hsl(222,30%,45%)' }}>Anterior:</span>{' '}
                    {formatExamLabel(evolutionComparison.previousExam)}
                  </span>
                  <span style={{ color: 'hsl(221,73%,55%)' }}>→</span>
                  <span>
                    <span className="font-semibold" style={{ color: 'hsl(221,73%,40%)' }}>Mais recente:</span>{' '}
                    {formatExamLabel(evolutionComparison.latestExam)}
                  </span>
                </div>
              )}
              {evolutionComparison.mode === 'single' && (
                <p className="text-xs" style={{ color: 'hsl(222,30%,50%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                  Extrato do exame: {formatExamLabel(evolutionComparison.singleExam)}
                </p>
              )}
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'hsl(217,50%,90%)' }}>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr style={{ background: 'hsl(217,50%,96%)' }}>
                      <th
                        className="border p-2.5 text-left font-semibold"
                        style={{ borderColor: 'hsl(217,50%,90%)', color: 'hsl(222,77%,15%)', fontFamily: 'Nunito Sans, sans-serif' }}
                      >
                        Parâmetro
                      </th>
                      <th
                        className="border p-2.5 text-left font-semibold"
                        style={{ borderColor: 'hsl(217,50%,90%)', color: 'hsl(221,73%,35%)', fontFamily: 'Nunito Sans, sans-serif' }}
                      >
                        {formatColHeader(evolutionComparison.latestExam)}
                        <span className="ml-1 text-xs font-normal" style={{ color: 'hsl(222,30%,55%)' }}>(atual)</span>
                      </th>
                      {evolutionComparison.mode === 'comparison' && (
                        <th
                          className="border p-2.5 text-left font-semibold"
                          style={{ borderColor: 'hsl(217,50%,90%)', color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
                        >
                          {formatColHeader(evolutionComparison.previousExam)}
                          <span className="ml-1 text-xs font-normal" style={{ color: 'hsl(222,30%,55%)' }}>(anterior)</span>
                        </th>
                      )}
                      <th
                        className="border p-2.5 text-left font-semibold"
                        style={{ borderColor: 'hsl(217,50%,90%)', color: 'hsl(222,77%,15%)', fontFamily: 'Nunito Sans, sans-serif' }}
                      >
                        Referência
                      </th>
                      {evolutionComparison.mode === 'comparison' && (
                        <th
                          className="border p-2.5 text-left font-semibold"
                          style={{ borderColor: 'hsl(217,50%,90%)', color: 'hsl(222,77%,15%)', fontFamily: 'Nunito Sans, sans-serif' }}
                        >
                          Alteração
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {evolutionComparison.rows.map((row, index) => (
                      <tr key={`${row.parameter}-${index}`}>
                        <td
                          className="border p-2.5 font-medium"
                          style={{ borderColor: 'hsl(217,50%,92%)', fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,77%,15%)' }}
                        >
                          {row.parameter}
                        </td>
                        <td
                          className="border p-2.5"
                          style={{ borderColor: 'hsl(217,50%,92%)', fontFamily: 'Nunito Sans, sans-serif' }}
                        >
                          {formatCellValue(row.examXValue, row.unit)}
                        </td>
                        {evolutionComparison.mode === 'comparison' && (
                          <td
                            className="border p-2.5"
                            style={{ borderColor: 'hsl(217,50%,92%)', fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,50%)' }}
                          >
                            {formatCellValue(row.examYValue, row.unit)}
                          </td>
                        )}
                        <td
                          className="border p-2.5"
                          style={{ borderColor: 'hsl(217,50%,92%)', fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,50%)' }}
                        >
                          {formatReferenceRange(row.refMin, row.refMax)}
                        </td>
                        {evolutionComparison.mode === 'comparison' && (
                          <td
                            className="border p-2.5 font-medium"
                            style={{
                              borderColor: 'hsl(217,50%,92%)',
                              fontFamily: 'Nunito Sans, sans-serif',
                              color:
                                row.changeDirection === 'up'
                                  ? 'hsl(352,76%,38%)'
                                  : row.changeDirection === 'down'
                                  ? 'hsl(221,73%,40%)'
                                  : row.changeDirection === 'same'
                                  ? 'hsl(222,30%,45%)'
                                  : 'hsl(222,30%,60%)',
                            }}
                          >
                            {row.changeText}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <EvolutionReportCard
        trendsByParam={trendsByParam}
        patientId={patientId}
        baseExam={baseHistoryRow}
        comparedExam={comparedHistoryRow}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sortedParams.map((param) => {
          const info  = trendsByParam.get(param)!;
          const badge = badgesByParam.get(param);
          return (
            <TrendChart
              key={param}
              parametro={param}
              unidade={info.unidade}
              data={info.data}
              refMin={info.refMin}
              refMax={info.refMax}
              highlightedDates={highlightedDates}
              variationBadge={badge}
            />
          );
        })}
      </div>
      <div className="max-w-2xl">
        <ClinicalSignsSection patientId={patientId} />
      </div>
    </div>
  );
};

// --- Tab: Resumo Clínico ---
const API_EXAMS_URL = "https://n8nvet.predictlab.com.br/webhook/buscar-exames";

const examTypeLabel: Record<string, string> = {
  sangue: "Hemograma",
  urina: "Urinálise (EAS)",
};

const ClinicalSummaryTab: React.FC<{ patient: PatientInfo; patientId: string }> = ({ patient, patientId }) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsModalOpen, setExamsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('evolution_summaries')
        .select('last_ai_summary')
        .eq('patient_id', patientId)
        .maybeSingle();
      setAiSummary(!error && data ? data.last_ai_summary : null);
      setLoading(false);
    };

    const fetchExams = async () => {
      setExamsLoading(true);
      try {
        const url = `${API_EXAMS_URL}?patient_id=${encodeURIComponent(patientId)}`;
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) throw new Error("Falha ao buscar exames");
        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.id != null ? [data] : [];
        const sorted = list
          .map((e: any, index: number) => ({
            id: String(e.id ?? index),
            exam_type: e.exam_type ?? "",
            clinical_summary: e.clinical_summary ?? e.resumo_clinico ?? "",
            created_at: e.created_at ?? "",
          }))
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setExams(sorted);
      } catch {
        setExams([]);
      } finally {
        setExamsLoading(false);
      }
    };

    fetchSummary();
    fetchExams();
  }, [patientId]);

  return (
    <div className="space-y-6">
      <PatientSummary patient={patient} />

      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Parecer Geral da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : aiSummary ? (
            <p className="text-sm text-foreground whitespace-pre-line">{aiSummary}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum parecer de evolução disponível. Envie exames para gerar a análise.</p>
          )}
        </CardContent>
      </Card>

      {/* Exames do paciente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Exames Realizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {examsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Nenhum exame encontrado para este paciente.</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/exams')}>Realizar Análise</Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {exams.map((exam) => (
                <li key={exam.id}>
                  <div
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setExamsModalOpen(true)}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {examTypeLabel[exam.exam_type] ?? exam.exam_type}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {exam.created_at
                        ? new Date(exam.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })
                        : "—"}
                    </span>
                  </div>
                  {exam.clinical_summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 ml-6">{exam.clinical_summary}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <PatientExamsModal
        open={examsModalOpen}
        onOpenChange={setExamsModalOpen}
        patientId={patientId}
        patientName={patient.name}
        owner_name={patient.owner_name}
        age={patient.age}
      />
    </div>
  );
};

// --- Tab: Laudos Ultrassonográficos ---
const UltrasoundHistoryTab: React.FC<{ patientId: string; patientName: string; ownerName: string }> = ({ patientId, patientName, ownerName }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ultrasound_reports')
        .select('id, created_at, species, sex, generated_report')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (!error && data) setReports(data);
      setLoading(false);
    };
    fetchReports();
  }, [patientId]);

  const SEX_LABEL: Record<string, string> = {
    female: 'Fêmea inteira', female_castrated: 'Fêmea castrada',
    male: 'Macho inteiro', male_castrated: 'Macho castrado',
  };

  const handleViewPdf = (report: any) => {
    if (!report.generated_report) return;
    const html = buildPrintableHtml(
      report.generated_report,
      { name: patientName, species: report.species, owner_name: ownerName, age: null },
      new Date(report.created_at).toLocaleDateString('pt-BR'),
    );
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  if (loading) return (
    <div className="space-y-2">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );

  if (reports.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground mb-4">Nenhum laudo ultrassonográfico registrado.</p>
      <Button variant="outline" onClick={() => navigate(`/patient/${patientId}/ultrasound`)}>
        Criar Laudo US
      </Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <Card key={r.id} className="border-l-4 border-l-primary/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {r.species === 'canis' ? 'Cão' : 'Gato'} — {SEX_LABEL[r.sex] ?? r.sex}
              </p>
              <p className="text-xs text-muted-foreground">
                {r.created_at
                  ? new Date(r.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '—'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewPdf(r)}
              disabled={!r.generated_report}
            >
              Ver PDF
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// --- Main Component ---
const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, patientsLoaded, selectedPatient, loadPatients, setSelectedPatient } = usePatient();
  const [dbPatient, setDbPatient] = useState<PatientInfo | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // First try from context list, then from DB directly
  const contextPatient = useMemo(() => {
    if (!id || !patientsLoaded) return null;
    return patients.find((p) => p.id === id) ?? null;
  }, [id, patients, patientsLoaded]);

  // If not found in context, fetch directly from Supabase
  useEffect(() => {
    if (!id || contextPatient) return;
    if (!patientsLoaded) return;
    const fetchFromDb = async () => {
      setDbLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, owner_name, species, breed, age')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        setDbPatient({
          id: String(data.id),
          name: data.name ?? '',
          owner_name: data.owner_name ?? '',
          species: data.species ?? '',
          breed: data.breed ?? '',
          age: data.age ?? null,
        });
      }
      setDbLoading(false);
    };
    fetchFromDb();
  }, [id, contextPatient, patientsLoaded]);

  const patient = contextPatient ?? dbPatient ?? (selectedPatient?.id === id ? selectedPatient : null);

  const handleStartEdit = () => {
    if (!patient) return;
    setEditForm({
      name: patient.name,
      owner_name: patient.owner_name,
      species: patient.species ?? '',
      breed: patient.breed ?? '',
      age: patient.age != null ? String(patient.age) : '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSave = async () => {
    if (!editForm || !id) return;

    const validationError = validatePatientEdit(editForm);
    if (validationError) {
      toast({ title: 'Campo obrigatório', description: validationError, variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPatientUpdatePayload(editForm);
      const { error } = await supabase.from('patients').update(payload).eq('id', id);

      if (error) throw error;

      // Atualizar estado local imediatamente (evita flash de dados antigos)
      if (dbPatient) {
        setDbPatient({ ...dbPatient, ...payload, age: payload.age });
      }

      // Sincronizar selectedPatient no localStorage se for o mesmo paciente
      if (selectedPatient?.id === id) {
        setSelectedPatient({ ...selectedPatient, ...payload, age: payload.age ?? undefined });
      }

      // Recarregar lista global FIRST
      await loadPatients();

      // THEN exit edit mode and show success toast (context is now fresh)
      setIsEditing(false);
      setEditForm(null);
      toast({ title: 'Dados salvos!', description: `${payload.name} foi atualizado com sucesso.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Tente novamente.';
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!patientsLoaded || dbLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient || !id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Paciente não encontrado</h2>
          <p className="text-muted-foreground mb-4">O paciente que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => navigate('/patients')}>Voltar para lista</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PawPrint className="h-6 w-6 text-primary" />
              {patient.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {patient.species}{patient.breed ? ` • ${patient.breed}` : ''} • Tutor: {patient.owner_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/patient/${id}/ultrasound`)}>
            <Scan className="h-4 w-4 mr-1.5" />
            Novo Laudo US
          </Button>
          <Button variant="outline" onClick={() => navigate(`/anamnese/${id}`)}>
            <Stethoscope className="h-4 w-4 mr-1.5" />
            Nova Anamnese
          </Button>
          <Button onClick={() => navigate(`/paciente/${id}/relatorio-alta`)}>
            Relatório de Alta
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="summary" className="gap-1.5">
            <User className="h-4 w-4" />
            Resumo Clínico
          </TabsTrigger>
          <TabsTrigger value="evolution" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Evolução
          </TabsTrigger>
          <TabsTrigger value="soap" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Histórico SOAP
          </TabsTrigger>
          <TabsTrigger value="ultrasound" className="gap-1.5">
            <Scan className="h-4 w-4" />
            Laudos US
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <ClinicalSummaryTab patient={patient} patientId={id} />
        </TabsContent>

        <TabsContent value="evolution">
          <EvolutionTab patientId={id} />
        </TabsContent>

        <TabsContent value="soap">
          <SOAPHistoryTab patientId={id} />
        </TabsContent>

        <TabsContent value="ultrasound">
          <UltrasoundHistoryTab patientId={id} patientName={patient.name} ownerName={patient.owner_name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientProfile;
