import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '@/contexts/PatientContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GitCompare, FileSearch } from 'lucide-react';
import PatientCombobox from '@/components/dashboard/PatientCombobox';
import PatientSummary from '@/components/dashboard/PatientSummary';
import TrendChart, { TrendDataPoint } from '@/components/dashboard/TrendChart';
import EvolutionReportCard from '@/components/dashboard/EvolutionReportCard';
import ExamPairSelector from '@/components/dashboard/ExamPairSelector';

interface ExamParam {
  parametro: string;
  valor_encontrado: number | string | null;
  ref_min: number;
  ref_max: number;
  unidade: string;
  status: string;
}

interface ExamHistoryRow {
  id: string;
  created_at: string | null;
  exam_date: string | null;
  exam_type: string;
  clinical_summary: string | null;
  analysis_data: ExamParam[];
}

// Parameters to show by default (most clinically relevant)
const PRIORITY_PARAMS = [
  'ERITRÓCITOS',
  'HEMOGLOBINA',
  'HEMATÓCRITO',
  'LEUCÓCITOS TOTAIS',
  'PLAQUETAS',
  'CREATININA',
  'UREIA',
  'ALT ( TGP )',
  'FOSFATASE ALCALINA',
  'PROTEÍNAS PLASMÁTICAS',
];

const Dashboard = () => {
  const { selectedPatient } = usePatient();
  const [history, setHistory] = useState<ExamHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [baseExamId, setBaseExamId]         = useState<string | null>(null);
  const [comparedExamId, setComparedExamId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPatient) {
      setHistory([]);
      return;
    }
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('exams_history')
        .select('*')
        .eq('patient_id', selectedPatient.id)
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
      } else {
        setHistory([]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [selectedPatient]);

  // Initialise default pair: penultimate vs last exam
  useEffect(() => {
    if (history.length >= 2) {
      setBaseExamId(history[history.length - 2].id);
      setComparedExamId(history[history.length - 1].id);
    } else {
      setBaseExamId(null);
      setComparedExamId(null);
    }
  }, [history]);

  // Build trend data per parameter
  const trendsByParam = useMemo(() => {
    const map = new Map<
      string,
      { data: TrendDataPoint[]; unidade: string; refMin: number; refMax: number }
    >();

    history.forEach((exam) => {
      const dateStr = exam.exam_date ?? exam.created_at ?? '';
      exam.analysis_data.forEach((p) => {
        const val = typeof p.valor_encontrado === 'number' ? p.valor_encontrado : parseFloat(String(p.valor_encontrado));
        if (isNaN(val)) return;

        if (!map.has(p.parametro)) {
          map.set(p.parametro, {
            data: [],
            unidade: p.unidade ?? '',
            refMin: Number(p.ref_min) || 0,
            refMax: Number(p.ref_max) || 0,
          });
        }
        map.get(p.parametro)!.data.push({
          date: dateStr,
          value: val,
          status: p.status ?? 'normal',
        });
      });
    });

    return map;
  }, [history]);

  // Sort: priority params first
  const sortedParams = useMemo(() => {
    const allParams = Array.from(trendsByParam.keys());
    const priority = allParams.filter((p) => PRIORITY_PARAMS.some((pp) => p.includes(pp)));
    const rest = allParams.filter((p) => !priority.includes(p));
    return [...priority, ...rest];
  }, [trendsByParam]);

  const baseExam     = useMemo(() => history.find(e => e.id === baseExamId)     ?? null, [history, baseExamId]);
  const comparedExam = useMemo(() => history.find(e => e.id === comparedExamId) ?? null, [history, comparedExamId]);

  // ISO date strings for highlighting dots in TrendChart
  const highlightedDates = useMemo<[string, string] | undefined>(() => {
    if (!baseExam || !comparedExam) return undefined;
    const toISO = (exam: ExamHistoryRow) => exam.exam_date ?? exam.created_at ?? '';
    return [toISO(baseExam), toISO(comparedExam)];
  }, [baseExam, comparedExam]);

  // Variation badge per parameter (comparing baseExam vs comparedExam)
  const badgesByParam = useMemo(() => {
    const map = new Map<string, { pct: number; color: 'green' | 'red' | 'gray' }>();
    if (!baseExam || !comparedExam) return map;

    for (const cmpParam of comparedExam.analysis_data) {
      const baseParam = baseExam.analysis_data.find(p => p.parametro === cmpParam.parametro);
      if (!baseParam) continue;

      const baseVal = typeof baseParam.valor_encontrado === 'number' ? baseParam.valor_encontrado : null;
      const cmpVal  = typeof cmpParam.valor_encontrado  === 'number' ? cmpParam.valor_encontrado  : null;
      if (baseVal === null || cmpVal === null || baseVal === 0) continue;

      const pct    = ((cmpVal - baseVal) / baseVal) * 100;
      const absPct = Math.abs(pct);

      let color: 'green' | 'red' | 'gray';
      if (absPct <= 2) {
        color = 'gray';
      } else if (cmpParam.status === 'normal') {
        color = 'green';
      } else {
        color = 'red';
      }

      map.set(cmpParam.parametro, { pct, color });
    }
    return map;
  }, [baseExam, comparedExam]);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(213,100%,98%)' }}>
      {/* Header */}
      <div
        className="pl-circuit-bg"
        style={{
          background: 'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 60%, hsl(221,73%,22%) 100%)',
          borderBottom: '1px solid hsla(217,88%,57%,0.15)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1
            className="text-xl font-bold flex items-center gap-2"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
          >
            <GitCompare className="h-5 w-5" style={{ color: 'hsl(217,90%,72%)' }} />
            Comparativo de Exames
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsla(213,100%,85%,0.6)', fontFamily: 'Nunito Sans, sans-serif' }}>
            Selecione dois exames e veja o que mudou no organismo do seu paciente
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-6">
        {/* Patient selector */}
        <PatientCombobox />

        {/* Exam pair selector — only when 2+ exams */}
        {selectedPatient && !loading && history.length >= 2 && (
          <ExamPairSelector
            exams={history}
            baseExamId={baseExamId}
            comparedExamId={comparedExamId}
            onBaseChange={setBaseExamId}
            onComparedChange={setComparedExamId}
          />
        )}

        {/* Single exam message */}
        {selectedPatient && !loading && history.length === 1 && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'hsl(38,88%,97%)',
              border: '1px solid hsl(38,88%,80%)',
              color: 'hsl(38,60%,35%)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            <FileSearch className="h-4 w-4 shrink-0" />
            Adicione um segundo exame para comparar a evolução de{' '}
            <strong>{selectedPatient.name}</strong>.
          </div>
        )}

        {/* Patient summary */}
        {selectedPatient && (
          <PatientSummary patient={selectedPatient} />
        )}

        {/* AI report */}
        {selectedPatient && (
          <EvolutionReportCard
            trendsByParam={trendsByParam}
            patientId={selectedPatient.id}
            baseExam={baseExam}
            comparedExam={comparedExam}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando histórico...</span>
          </div>
        )}

        {/* Empty state: no patient selected */}
        {!loading && !selectedPatient && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GitCompare className="h-14 w-14 mb-4" style={{ color: 'hsl(221,73%,75%)' }} />
            <p className="text-base font-medium" style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Sora, sans-serif' }}>
              Selecione um paciente para iniciar
            </p>
            <p className="text-sm mt-1" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Os gráficos comparativos aparecerão aqui
            </p>
          </div>
        )}

        {/* Empty state: patient has no exams */}
        {!loading && selectedPatient && history.length === 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'white',
              border: '1px solid hsl(217,50%,90%)',
              boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
            }}
          >
            <div className="h-1" style={{ background: 'linear-gradient(90deg, hsl(221,73%,45%), hsl(217,88%,57%))' }} />
            <div className="py-14 flex flex-col items-center gap-4">
              <FileSearch className="w-10 h-10" style={{ color: 'hsl(221,73%,75%)' }} />
              <div className="text-center">
                <p
                  className="text-base font-semibold"
                  style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
                >
                  Suba o primeiro exame para começar
                </p>
                <p className="text-sm mt-1" style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                  Acompanhe a evolução de{' '}
                  <strong style={{ color: 'hsl(222,77%,15%)' }}>{selectedPatient.name}</strong>{' '}
                  a partir do primeiro hemograma.
                </p>
              </div>
              <button
                onClick={() => navigate('/exams')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
                  boxShadow: '0 6px 24px -6px hsla(221,73%,45%,0.5)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                → Ir para Exames
              </button>
            </div>
          </div>
        )}

        {/* Trend charts grid */}
        {!loading && sortedParams.length > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
