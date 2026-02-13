import React, { useState } from 'react';
import { usePatient } from '@/contexts/PatientContext';
import { Stethoscope, ClipboardList, Eye, Brain, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SOAPCard from './SOAPCard';

const GuidedConsultation: React.FC = () => {
  const { selectedPatient } = usePatient();

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

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 pb-8">
      {/* Patient header */}
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        {selectedPatient ? (
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Consulta em andamento: <span className="text-primary">{selectedPatient.name}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {[selectedPatient.species, selectedPatient.breed, selectedPatient.owner_name && `Tutor: ${selectedPatient.owner_name}`]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground italic">
            Nenhum paciente selecionado. Selecione um paciente em <strong>Meus Pacientes</strong> para iniciar a consulta.
          </p>
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
