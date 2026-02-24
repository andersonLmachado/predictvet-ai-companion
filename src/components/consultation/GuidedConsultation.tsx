import React, { useEffect, useState, useRef } from 'react';
import { usePatient } from '@/contexts/PatientContext';
import { Stethoscope, ClipboardList, Eye, Brain, FileCheck, RefreshCw, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import SOAPCard from './SOAPCard';
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

  useEffect(() => {
    if (isInitialMount.current) {
      if (selectedPatient?.id) {
        setIsPreSelected(true);
      }
      isInitialMount.current = false;
    }
  }, []);

  const [soapData, setSoapData] = useState({
    S: '',
    O: '',
    A: '',
    P: '',
  });

  const [aiSuggestions, setAiSuggestions] = useState('');

  const updateField = (field: keyof typeof soapData) => (value: string) => {
    setSoapData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let isMounted = true;

    const loadConsultationData = async () => {
      if (!selectedPatient?.id) {
        if (isMounted) {
          setSoapData({ S: '', O: '', A: '', P: '' });
          setAiSuggestions('');
        }
        return;
      }

      const { data, error } = await supabase
        .from('medical_consultations')
        .select('soap_block, content, ai_suggestions, created_at')
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

      const nextSoapData = { S: '', O: '', A: '', P: '' };
      let nextAiSuggestions = '';
      const filledBlocks = new Set<string>();

      for (const row of data ?? []) {
        const block = row.soap_block;
        if (!block || !['S', 'O', 'A', 'P'].includes(block) || filledBlocks.has(block)) continue;

        nextSoapData[block as keyof typeof nextSoapData] = row.content ?? '';
        if (block === 'P') {
          nextAiSuggestions = row.ai_suggestions ?? '';
        }
        filledBlocks.add(block);

        if (filledBlocks.size === 4) break;
      }

      setSoapData(nextSoapData);
      setAiSuggestions(nextAiSuggestions);
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

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 pb-8">
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

      {/* SOAP Cards */}
      <div className="grid gap-5">
        <SOAPCard
          letter="S"
          title="Subjetivo — Anamnese"
          subtitle="Relato do tutor, queixa principal, histórico"
          placeholder="Descreva a queixa principal, duração dos sintomas, histórico de doenças anteriores, alimentação, vacinação..."
          value={soapData.S}
          onChange={updateField('S')}
          accentColor="hsl(210, 70%, 50%)"
          icon={<ClipboardList className="h-5 w-5" />}
          patientId={selectedPatient?.id}
        />

        <SOAPCard
          letter="O"
          title="Objetivo — Exame Físico"
          subtitle="Parâmetros clínicos e sinais vitais"
          placeholder="Temperatura: ___°C | TPC: ___s | FC: ___bpm | FR: ___mpm | Mucosas: ___ | Linfonodos: ___ | Ausculta: ___"
          value={soapData.O}
          onChange={updateField('O')}
          accentColor="hsl(160, 60%, 40%)"
          icon={<Eye className="h-5 w-5" />}
          patientId={selectedPatient?.id}
        />

        <SOAPCard
          letter="A"
          title="Avaliação — Diagnóstico"
          subtitle="Suspeitas clínicas e diagnósticos diferenciais"
          placeholder="Liste as principais hipóteses diagnósticas baseadas nos dados subjetivos e objetivos coletados..."
          value={soapData.A}
          onChange={updateField('A')}
          accentColor="hsl(35, 80%, 50%)"
          icon={<Brain className="h-5 w-5" />}
          patientId={selectedPatient?.id}
        />

        <SOAPCard
          letter="P"
          title="Plano — Conduta"
          subtitle="Exames solicitados, prescrições, retorno"
          placeholder="Solicitar hemograma completo, bioquímico renal... Prescrever: ___ | Retorno em: ___"
          value={soapData.P}
          onChange={updateField('P')}
          accentColor="hsl(270, 50%, 55%)"
          icon={<FileCheck className="h-5 w-5" />}
          patientId={selectedPatient?.id}
          aiSuggestions={aiSuggestions}
          onAiSuggestionsChange={setAiSuggestions}
        />
      </div>
    </div>
  );
};

export default GuidedConsultation;
