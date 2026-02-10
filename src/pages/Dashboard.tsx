import { useState, useEffect, useMemo } from 'react';
import { usePatient } from '@/contexts/PatientContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Activity } from 'lucide-react';
import PatientCombobox from '@/components/dashboard/PatientCombobox';
import PatientSummary from '@/components/dashboard/PatientSummary';
import TrendChart, { TrendDataPoint } from '@/components/dashboard/TrendChart';
import ClinicalSignsSection from '@/components/dashboard/ClinicalSignsSection';

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
  const [clinicalSigns, setClinicalSigns] = useState<string[]>([]);

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
        setHistory(
          data.map((row: any) => ({
            ...row,
            analysis_data: Array.isArray(row.analysis_data) ? row.analysis_data : [],
          }))
        );
      } else {
        setHistory([]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [selectedPatient]);

  // Build trend data per parameter
  const trendsByParam = useMemo(() => {
    const map = new Map<
      string,
      { data: TrendDataPoint[]; unidade: string; refMin: number; refMax: number }
    >();

    history.forEach((exam) => {
      const dateStr = exam.created_at ?? '';
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

  return (
    <div className="container mx-auto py-8 px-4 pb-24 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Evolução do Paciente
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Acompanhe a progressão dos indicadores clínicos ao longo do tempo
        </p>
      </div>

      {/* Patient selector */}
      <div className="mb-6">
        <PatientCombobox />
      </div>

      {/* Patient summary */}
      {selectedPatient && (
        <div className="mb-6">
          <PatientSummary patient={selectedPatient} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando histórico...</span>
        </div>
      )}

      {/* Empty states */}
      {!loading && !selectedPatient && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground">Selecione um paciente para visualizar a evolução</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Os gráficos de progressão aparecerão aqui
          </p>
        </div>
      )}

      {!loading && selectedPatient && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground">Nenhum exame registrado</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Envie exames na aba de Exames para visualizar a evolução de {selectedPatient.name}
          </p>
        </div>
      )}

      {/* Trend charts grid */}
      {!loading && sortedParams.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
          {sortedParams.map((param) => {
            const info = trendsByParam.get(param)!;
            return (
              <TrendChart
                key={param}
                parametro={param}
                unidade={info.unidade}
                data={info.data}
                refMin={info.refMin}
                refMax={info.refMax}
              />
            );
          })}
        </div>
      )}

      {/* Clinical signs */}
      {selectedPatient && (
        <div className="max-w-2xl">
          <ClinicalSignsSection signs={clinicalSigns} onSignsChange={setClinicalSigns} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
