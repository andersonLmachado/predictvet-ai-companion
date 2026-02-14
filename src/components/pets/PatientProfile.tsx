
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient, PatientInfo } from '@/contexts/PatientContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, PawPrint, User, Calendar, ClipboardList, Activity, Sparkles, Loader2 } from 'lucide-react';
import PatientSummary from '@/components/dashboard/PatientSummary';
import EvolutionReportCard from '@/components/dashboard/EvolutionReportCard';
import TrendChart, { TrendDataPoint } from '@/components/dashboard/TrendChart';
import ClinicalSignsSection from '@/components/dashboard/ClinicalSignsSection';

// --- Tab: Histórico SOAP ---
const SOAPHistoryTab: React.FC<{ patientId: string }> = ({ patientId }) => {
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
  }, [patientId]);

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

const PRIORITY_PARAMS = [
  'ERITRÓCITOS', 'HEMOGLOBINA', 'HEMATÓCRITO', 'LEUCÓCITOS TOTAIS', 'PLAQUETAS',
  'CREATININA', 'UREIA', 'ALT ( TGP )', 'FOSFATASE ALCALINA', 'PROTEÍNAS PLASMÁTICAS',
];

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
        setHistory(data.map((row: any) => ({
          ...row,
          analysis_data: Array.isArray(row.analysis_data) ? row.analysis_data : [],
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [patientId]);

  const trendsByParam = useMemo(() => {
    const map = new Map<string, { data: TrendDataPoint[]; unidade: string; refMin: number; refMax: number }>();
    history.forEach((exam) => {
      const dateStr = exam.created_at ?? '';
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
      <EvolutionReportCard trendsByParam={trendsByParam} patientId={patientId} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sortedParams.map((param) => {
          const info = trendsByParam.get(param)!;
          return <TrendChart key={param} parametro={param} unidade={info.unidade} data={info.data} refMin={info.refMin} refMax={info.refMax} />;
        })}
      </div>
      <div className="max-w-2xl">
        <ClinicalSignsSection patientId={patientId} />
      </div>
    </div>
  );
};

// --- Tab: Resumo Clínico ---
const ClinicalSummaryTab: React.FC<{ patient: PatientInfo; patientId: string }> = ({ patient, patientId }) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('evolution_summaries')
        .select('last_ai_summary')
        .eq('patient_id', patientId)
        .maybeSingle();
      setAiSummary(!error && data ? data.last_ai_summary : null);
      setLoading(false);
    };
    fetch();
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
    </div>
  );
};

// --- Main Component ---
const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, patientsLoaded } = usePatient();

  const patient = useMemo(() => {
    if (!id || !patientsLoaded) return null;
    return patients.find((p) => p.id === id) ?? null;
  }, [id, patients, patientsLoaded]);

  if (!patientsLoaded) {
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
      <div className="flex items-center gap-4 mb-6">
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
      </Tabs>
    </div>
  );
};

export default PatientProfile;
