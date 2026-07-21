import React, { useEffect, useState, useRef } from 'react';
import { usePatient } from '@/contexts/PatientContext';
import { Stethoscope, ClipboardList, Eye, Brain, RefreshCw, PlusCircle, Sparkles, ArrowRight, Loader2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';
import SOAPCard, { type SOAPCardHandle } from './SOAPCard';
import PlanCard from './PlanCard';
import { aggregateSaveResults } from '@/lib/soapSaveOrchestrator';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const GuidedConsultation: React.FC = () => {
  const { selectedPatient, setSelectedPatient, patients } = usePatient();
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(
    selectedPatient?.id
  );
  const isInitialMount = useRef(true);
  const [isPreSelected, setIsPreSelected] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const soapRefs = {
    S: useRef<SOAPCardHandle>(null),
    O: useRef<SOAPCardHandle>(null),
    A: useRef<SOAPCardHandle>(null),
    P: useRef<SOAPCardHandle>(null),
  };

  useEffect(() => {
    if (isInitialMount.current) {
      if (selectedPatient?.id) {
        setIsPreSelected(true);
      }
      isInitialMount.current = false;
    }
  }, []);

  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [soapData, setSoapData] = useState({
    S: '',
    O: '',
    A: '',
    P: '',
  });

  const [approvedState, setApprovedState] = useState<{ exams: string[]; treatments: string[] }>({ exams: [], treatments: [] });
  const [vitalSigns, setVitalSigns] = useState({ weightKg: '', temperatureC: '', bodyConditionScore: '' });

  const updateField = (field: keyof typeof soapData) => (value: string) => {
    setSoapData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let isMounted = true;

    const loadConsultationData = async () => {
      if (!selectedPatient?.id) {
        if (isMounted) {
          setSoapData({ S: '', O: '', A: '', P: '' });
          setApprovedState({ exams: [], treatments: [] });
          setVitalSigns({ weightKg: '', temperatureC: '', bodyConditionScore: '' });
        }
        return;
      }

      const { data, error } = await supabase
        .from('medical_consultations')
        .select('id, soap_block, content, created_at, source, soap_s, soap_o, soap_a, soap_p, weight_kg, temperature_c, body_condition_score, approved_exams, approved_treatments')
        .eq('patient_id', selectedPatient.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Erro ao carregar consulta',
          description: 'Não foi possível carregar os registros SOAP do paciente.',
          variant: 'destructive',
        });
        return;
      }

      if (!isMounted) return;

      // Guided flow: single row with flat soap_s/o/a/p fields
      const guidedRecord = (data ?? []).find(
        (row: any) => row.source === 'guided' || row.source === 'voice'
      );
      if (guidedRecord) {
        setConsultationId((guidedRecord as any).id ?? null);
        setSoapData({
          S: (guidedRecord as any).soap_s ?? '',
          O: (guidedRecord as any).soap_o ?? '',
          A: (guidedRecord as any).soap_a ?? '',
          P: (guidedRecord as any).soap_p ?? '',
        });
      } else {
        setConsultationId(null);
        // Legacy flow: one row per soap_block
        const nextSoapData = { S: '', O: '', A: '', P: '' };
        const filledBlocks = new Set<string>();

        for (const row of data ?? []) {
          const block = row.soap_block;
          if (!block || !['S', 'O', 'A', 'P'].includes(block) || filledBlocks.has(block)) continue;

          nextSoapData[block as keyof typeof nextSoapData] = row.content ?? '';
          filledBlocks.add(block);

          if (filledBlocks.size === 4) break;
        }

        setSoapData(nextSoapData);
      }

      // Load vital signs: prefer guided/voice record (same row), fall back to legacy soap_block='O' row
      const vitalsSource = guidedRecord ?? (data ?? []).find((row: any) => row.soap_block === 'O');
      setVitalSigns({
        weightKg: (vitalsSource as any)?.weight_kg != null ? String((vitalsSource as any).weight_kg) : '',
        temperatureC: (vitalsSource as any)?.temperature_c != null ? String((vitalsSource as any).temperature_c) : '',
        bodyConditionScore:
          (vitalsSource as any)?.body_condition_score != null
            ? String((vitalsSource as any).body_condition_score)
            : '',
      });

      // Load approved plan items: prefer the guided/voice record's own columns, fall back to the legacy P-block row
      const legacyPRow = (data ?? []).find((row: any) => row.soap_block === 'P');
      const approvedSource = (guidedRecord && ((guidedRecord as any).approved_exams?.length || (guidedRecord as any).approved_treatments?.length))
        ? guidedRecord
        : legacyPRow;
      setApprovedState({
        exams:      (approvedSource as any)?.approved_exams      ?? [],
        treatments: (approvedSource as any)?.approved_treatments ?? [],
      });
    };

    loadConsultationData();

    return () => {
      isMounted = false;
    };
  }, [selectedPatient?.id]);

  useEffect(() => {
    if (selectedPatient?.id !== selectedPatientId) {
      setSelectedPatientId(selectedPatient?.id);
    }
  }, [selectedPatient?.id]);

  const handlePatientChange = (value: string) => {
    setSelectedPatientId(value);
    const patient = patients.find((p) => p.id === value);
    if (patient) {
      setSelectedPatient(patient);
    }
  };

  const handleResetSelection = () => {
    setSelectedPatientId(undefined);
    setSelectedPatient(null);
  };

  const handleSaveAll = async () => {
    if (!selectedPatient) return;
    setIsSavingAll(true);
    try {
      const results = await Promise.all(
        (['S', 'O', 'A', 'P'] as const).map(l => soapRefs[l].current?.save())
      );
      const { success, failedLetters } = aggregateSaveResults(results);
      if (success) {
        sonnerToast.success('Prontuário salvo com sucesso');
      } else {
        sonnerToast.error(`Não foi possível salvar os blocos: ${failedLetters.join(', ')}`);
      }
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 pb-8">
      {/* Patient header */}
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        {selectedPatient ? (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Consulta em andamento: <span className="text-primary">{selectedPatient.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {[selectedPatient.species, selectedPatient.breed, selectedPatient.owner_name && `Tutor: ${selectedPatient.owner_name}`]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>
            {!isPreSelected && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-primary"
                onClick={handleResetSelection}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Alterar
              </Button>
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="patient-select" className="text-sm font-medium text-muted-foreground">
                Selecione um paciente para iniciar
              </Label>
              <Link
                to="/register-pet"
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-all"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Cadastrar Pet
              </Link>
            </div>
            <Select value={selectedPatientId} onValueChange={handlePatientChange}>
              <SelectTrigger id="patient-select" className="w-full max-w-xs">
                <SelectValue placeholder="Selecionar paciente..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name} {patient.species ? `(${patient.species})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Badge variant="outline" className="gap-1.5">
          <ClipboardList className="h-3.5 w-3.5" />
          SOAP
        </Badge>
      </div>

      {/* ── Anamnese Guiada shortcut ─────────────────────────────────────── */}
      <Link
        to={selectedPatient ? `/anamnese/${selectedPatient.id}` : '/anamnese'}
        className="group flex items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-all pl-card-hover"
        style={{
          background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(269,55%,48%) 50%, hsl(352,76%,44%) 100%)',
          boxShadow: '0 6px 28px -6px hsla(221,73%,45%,0.45), 0 2px 8px -2px hsla(352,76%,44%,0.25)',
          textDecoration: 'none',
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsla(0,0%,100%,0.15)', border: '1px solid hsla(0,0%,100%,0.25)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p
              className="text-sm font-bold leading-tight"
              style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
            >
              Iniciar Anamnese Guiada com IA
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'hsla(213,100%,90%,0.7)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              Colete a queixa principal e histórico — a IA estrutura o SOAP automaticamente
            </p>
          </div>
        </div>
        <ArrowRight
          className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1"
          style={{ color: 'hsla(213,100%,95%,0.8)' }}
        />
      </Link>
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* SOAP Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SOAPCard
          ref={soapRefs.S}
          letter="S"
          title="Subjetivo — Anamnese"
          subtitle="Relato do tutor, queixa principal, histórico"
          placeholder="Descreva a queixa principal, duração dos sintomas, histórico de doenças anteriores, alimentação, vacinação..."
          value={soapData.S}
          onChange={updateField('S')}
          accentColor="hsl(210, 70%, 50%)"
          icon={<ClipboardList className="h-5 w-5" />}
          patientId={selectedPatient?.id}
          consultationId={consultationId ?? undefined}
        />

        <SOAPCard
          ref={soapRefs.O}
          letter="O"
          title="Objetivo — Exame Físico"
          subtitle="Parâmetros clínicos e sinais vitais"
          placeholder="Temperatura: ___°C | TPC: ___s | FC: ___bpm | FR: ___mpm | Mucosas: ___ | Linfonodos: ___ | Ausculta: ___"
          value={soapData.O}
          onChange={updateField('O')}
          accentColor="hsl(160, 60%, 40%)"
          icon={<Eye className="h-5 w-5" />}
          patientId={selectedPatient?.id}
          weightKg={vitalSigns.weightKg}
          temperatureC={vitalSigns.temperatureC}
          onWeightChange={(v) => setVitalSigns((prev) => ({ ...prev, weightKg: v }))}
          onTemperatureChange={(v) => setVitalSigns((prev) => ({ ...prev, temperatureC: v }))}
          bodyConditionScore={vitalSigns.bodyConditionScore}
          onBodyConditionScoreChange={(v) => setVitalSigns((prev) => ({ ...prev, bodyConditionScore: v }))}
          consultationId={consultationId ?? undefined}
        />

        <SOAPCard
          ref={soapRefs.A}
          letter="A"
          title="Avaliação — Diagnóstico"
          subtitle="Suspeitas clínicas e diagnósticos diferenciais"
          placeholder="Liste as principais hipóteses diagnósticas baseadas nos dados subjetivos e objetivos coletados..."
          value={soapData.A}
          onChange={updateField('A')}
          accentColor="hsl(35, 80%, 50%)"
          icon={<Brain className="h-5 w-5" />}
          patientId={selectedPatient?.id}
          consultationId={consultationId ?? undefined}
        />

        <PlanCard
          ref={soapRefs.P}
          value={soapData.P}
          onChange={updateField('P')}
          patientId={selectedPatient?.id}
          consultationId={consultationId ?? undefined}
          initialApprovedExams={approvedState.exams}
          initialApprovedTreatments={approvedState.treatments}
        />
      </div>

      <button
        onClick={handleSaveAll}
        disabled={!selectedPatient || isSavingAll}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all"
        style={{
          background: (!selectedPatient || isSavingAll)
            ? 'hsl(217,50%,80%)'
            : 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
          boxShadow: (!selectedPatient || isSavingAll)
            ? 'none'
            : '0 6px 24px -6px hsla(221,73%,45%,0.45)',
          fontFamily: 'Nunito Sans, sans-serif',
          cursor: (!selectedPatient || isSavingAll) ? 'not-allowed' : 'pointer',
        }}
      >
        {isSavingAll ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Salvar Prontuário Completo
          </>
        )}
      </button>
    </div>
  );
};

export default GuidedConsultation;
