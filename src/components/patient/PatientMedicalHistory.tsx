import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Loader2, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  fetchMedicalHistory,
  saveMedicalHistory,
  type Vaccine,
  type Deworming,
  type ContinuousMedication,
  type Surgery,
  type ReproductiveStatus,
  type InfectiousDisease,
} from '@/lib/medicalHistory';

interface Props {
  patientId: string;
}

const SECTION_LABEL_STYLE = { color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' } as const;
const SECTION_INPUT_STYLE = { borderColor: 'hsl(217,50%,85%)', fontFamily: 'Nunito Sans, sans-serif' } as const;

const PatientMedicalHistory: React.FC<Props> = ({ patientId }) => {
  const { toast } = useToast();
  const [allergies, setAllergies] = useState('');
  const [previousDiseases, setPreviousDiseases] = useState('');
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [deworming, setDeworming] = useState<Deworming[]>([]);
  const [continuousMedications, setContinuousMedications] = useState<ContinuousMedication[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [reproductiveStatus, setReproductiveStatus] = useState<ReproductiveStatus>('');
  const [reproductiveDate, setReproductiveDate] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [transfusionHistory, setTransfusionHistory] = useState('');
  const [infectiousDiseases, setInfectiousDiseases] = useState<InfectiousDisease[]>([]);
  const [drugRestrictions, setDrugRestrictions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    setIsLoading(true);
    fetchMedicalHistory(patientId)
      .then((data) => {
        setAllergies(data.allergies);
        setPreviousDiseases(data.previousDiseases);
        setVaccines(data.vaccines);
        setDeworming(data.deworming);
        setContinuousMedications(data.continuousMedications);
        setSurgeries(data.surgeries);
        setReproductiveStatus(data.reproductiveStatus);
        setReproductiveDate(data.reproductiveDate);
        setBloodType(data.bloodType);
        setTransfusionHistory(data.transfusionHistory);
        setInfectiousDiseases(data.infectiousDiseases);
        setDrugRestrictions(data.drugRestrictions);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const addVaccine = () => {
    setVaccines((prev) => [...prev, { name: '', date: '' }]);
  };

  const removeVaccine = (index: number) => {
    setVaccines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVaccine = (index: number, field: keyof Vaccine, value: string) => {
    setVaccines((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addDeworming = () => {
    setDeworming((prev) => [...prev, { date: '', activeIngredient: '', weightKg: '' }]);
  };

  const removeDeworming = (index: number) => {
    setDeworming((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDeworming = (index: number, field: keyof Deworming, value: string) => {
    setDeworming((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const addContinuousMedication = () => {
    setContinuousMedications((prev) => [...prev, { name: '', dose: '', frequency: '', indication: '' }]);
  };

  const removeContinuousMedication = (index: number) => {
    setContinuousMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const updateContinuousMedication = (
    index: number,
    field: keyof ContinuousMedication,
    value: string
  ) => {
    setContinuousMedications((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addSurgery = () => {
    setSurgeries((prev) => [...prev, { date: '', procedure: '', anesthesiaReaction: '' }]);
  };

  const removeSurgery = (index: number) => {
    setSurgeries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSurgery = (index: number, field: keyof Surgery, value: string) => {
    setSurgeries((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addInfectiousDisease = () => {
    setInfectiousDiseases((prev) => [...prev, { disease: '', status: '', testDate: '', method: '' }]);
  };

  const removeInfectiousDisease = (index: number) => {
    setInfectiousDiseases((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInfectiousDisease = (
    index: number,
    field: keyof InfectiousDisease,
    value: string
  ) => {
    setInfectiousDiseases((prev) =>
      prev.map((d, i) => (i === index ? ({ ...d, [field]: value } as InfectiousDisease) : d))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMedicalHistory(patientId, {
        allergies,
        previousDiseases,
        vaccines,
        deworming,
        continuousMedications,
        surgeries,
        reproductiveStatus,
        reproductiveDate,
        bloodType,
        transfusionHistory,
        infectiousDiseases,
        drugRestrictions,
      });
      toast({ title: 'Histórico salvo', description: 'Dados médicos atualizados com sucesso.' });
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'white',
        border: '1px solid hsl(217,50%,90%)',
        boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
      }}
    >
      {/* Stripe */}
      <div
        className="h-1"
        style={{ background: 'linear-gradient(90deg, hsl(221,73%,45%), hsl(217,88%,57%))' }}
      />

      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: 'hsl(217,50%,93%)' }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(18,76%,50%))' }}
        />
        <h2
          className="text-sm font-semibold"
          style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
        >
          Histórico Médico
        </h2>
      </div>

      <div className="p-5 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(221,73%,45%)' }} />
          </div>
        ) : (
          <>
            {/* Alergias */}
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Alergias conhecidas
              </label>
              <Textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={3}
                className="resize-y"
                placeholder="Ex: Dipirona, amendoim, látex..."
                style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
              />
            </div>

            {/* Doenças anteriores */}
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Doenças e condições anteriores
              </label>
              <Textarea
                value={previousDiseases}
                onChange={(e) => setPreviousDiseases(e.target.value)}
                rows={3}
                className="resize-y"
                placeholder="Ex: Cinomose (2022), fratura membro anterior (2023)..."
                style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
              />
            </div>

            {/* Vacinas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
                >
                  Carteira de vacinação
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVaccine}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {vaccines.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <Syringe className="h-6 w-6" style={{ color: 'hsl(221,73%,75%)' }} />
                  <p
                    className="text-xs"
                    style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}
                  >
                    Nenhuma vacina registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vaccines.map((vaccine, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Input
                        value={vaccine.name}
                        onChange={(e) => updateVaccine(index, 'name', e.target.value)}
                        placeholder="Nome da vacina"
                        className="h-9 text-sm flex-1 min-w-0"
                        style={{
                          borderColor: 'hsl(217,50%,85%)',
                          fontFamily: 'Nunito Sans, sans-serif',
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={vaccine.date}
                          onChange={(e) => updateVaccine(index, 'date', e.target.value)}
                          className="h-9 text-sm w-full sm:w-40"
                          style={{
                            borderColor: 'hsl(217,50%,85%)',
                            fontFamily: 'Nunito Sans, sans-serif',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeVaccine(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover vacina"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vermifugação e antiparasitários */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                  Vermifugação e antiparasitários
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDeworming}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {deworming.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                    Nenhuma vermifugação registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deworming.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateDeworming(index, 'date', e.target.value)}
                        className="h-9 text-sm w-full sm:w-40"
                        style={SECTION_INPUT_STYLE}
                      />
                      <Input
                        value={item.activeIngredient}
                        onChange={(e) => updateDeworming(index, 'activeIngredient', e.target.value)}
                        placeholder="Princípio ativo"
                        className="h-9 text-sm flex-1 min-w-0"
                        style={SECTION_INPUT_STYLE}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          value={item.weightKg}
                          onChange={(e) => updateDeworming(index, 'weightKg', e.target.value)}
                          placeholder="Peso (kg)"
                          className="h-9 text-sm w-full sm:w-28"
                          style={SECTION_INPUT_STYLE}
                        />
                        <button
                          type="button"
                          onClick={() => removeDeworming(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover vermifugação"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medicamentos em uso contínuo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                  Medicamentos em uso contínuo
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContinuousMedication}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {continuousMedications.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                    Nenhum medicamento contínuo registrado
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {continuousMedications.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 rounded-xl border"
                      style={{ borderColor: 'hsl(217,50%,90%)' }}
                    >
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) => updateContinuousMedication(index, 'name', e.target.value)}
                          placeholder="Nome do medicamento"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Input
                          value={item.dose}
                          onChange={(e) => updateContinuousMedication(index, 'dose', e.target.value)}
                          placeholder="Dose"
                          className="h-9 text-sm w-full sm:w-28"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Input
                          value={item.frequency}
                          onChange={(e) => updateContinuousMedication(index, 'frequency', e.target.value)}
                          placeholder="Frequência"
                          className="h-9 text-sm w-full sm:w-32"
                          style={SECTION_INPUT_STYLE}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={item.indication}
                          onChange={(e) => updateContinuousMedication(index, 'indication', e.target.value)}
                          placeholder="Indicação"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <button
                          type="button"
                          onClick={() => removeContinuousMedication(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover medicamento"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cirurgias e procedimentos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                  Cirurgias e procedimentos
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSurgery}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {surgeries.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                    Nenhuma cirurgia registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {surgeries.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 rounded-xl border"
                      style={{ borderColor: 'hsl(217,50%,90%)' }}
                    >
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateSurgery(index, 'date', e.target.value)}
                          className="h-9 text-sm w-full sm:w-40"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Input
                          value={item.procedure}
                          onChange={(e) => updateSurgery(index, 'procedure', e.target.value)}
                          placeholder="Procedimento"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={item.anesthesiaReaction}
                          onChange={(e) => updateSurgery(index, 'anesthesiaReaction', e.target.value)}
                          placeholder="Reação à anestesia (se houver)"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <button
                          type="button"
                          onClick={() => removeSurgery(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover cirurgia"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status reprodutivo */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                Status reprodutivo
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  value={reproductiveStatus || undefined}
                  onValueChange={(v) => setReproductiveStatus(v as ReproductiveStatus)}
                >
                  <SelectTrigger className="h-9 text-sm w-full sm:w-48" style={SECTION_INPUT_STYLE}>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inteiro">Inteiro</SelectItem>
                    <SelectItem value="Castrado">Castrado</SelectItem>
                  </SelectContent>
                </Select>
                {reproductiveStatus === 'Castrado' && (
                  <Input
                    type="date"
                    value={reproductiveDate}
                    onChange={(e) => setReproductiveDate(e.target.value)}
                    className="h-9 text-sm w-full sm:w-40"
                    style={SECTION_INPUT_STYLE}
                  />
                )}
              </div>
            </div>

            {/* Tipagem sanguínea e transfusões */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                Tipagem sanguínea
              </label>
              <Input
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                placeholder="Ex: DEA 1.1 positivo"
                className="h-9 text-sm w-full sm:w-48"
                style={SECTION_INPUT_STYLE}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                Histórico de transfusões
              </label>
              <Textarea
                value={transfusionHistory}
                onChange={(e) => setTransfusionHistory(e.target.value)}
                rows={2}
                className="resize-y"
                placeholder="Ex: Transfusão em 03/2023, sem intercorrências"
                style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
              />
            </div>

            {/* Doenças infectocontagiosas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                  Doenças infectocontagiosas
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInfectiousDisease}
                  className="h-7 gap-1 text-xs"
                  style={{ borderColor: 'hsl(221,73%,45%)', color: 'hsl(221,73%,45%)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {infectiousDiseases.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed"
                  style={{ borderColor: 'hsl(217,50%,85%)' }}
                >
                  <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                    Nenhuma doença infectocontagiosa registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {infectiousDiseases.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-3 rounded-xl border"
                      style={{ borderColor: 'hsl(217,50%,90%)' }}
                    >
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={item.disease}
                          onChange={(e) => updateInfectiousDisease(index, 'disease', e.target.value)}
                          placeholder="Ex: Leishmaniose, FIV, FeLV..."
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Select
                          value={item.status || undefined}
                          onValueChange={(v) => updateInfectiousDisease(index, 'status', v)}
                        >
                          <SelectTrigger className="h-9 text-sm w-full sm:w-36" style={SECTION_INPUT_STYLE}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Positivo">Positivo</SelectItem>
                            <SelectItem value="Negativo">Negativo</SelectItem>
                            <SelectItem value="Não testado">Não testado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="date"
                          value={item.testDate}
                          onChange={(e) => updateInfectiousDisease(index, 'testDate', e.target.value)}
                          className="h-9 text-sm w-full sm:w-40"
                          style={SECTION_INPUT_STYLE}
                        />
                        <Input
                          value={item.method}
                          onChange={(e) => updateInfectiousDisease(index, 'method', e.target.value)}
                          placeholder="Método (ex: ELISA, PCR)"
                          className="h-9 text-sm flex-1 min-w-0"
                          style={SECTION_INPUT_STYLE}
                        />
                        <button
                          type="button"
                          onClick={() => removeInfectiousDisease(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: 'hsl(352,76%,44%)' }}
                          aria-label="Remover doença"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Restrições a fármacos */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={SECTION_LABEL_STYLE}>
                Restrições, idiossincrasias e sensibilidades raciais
              </label>
              <Textarea
                value={drugRestrictions}
                onChange={(e) => setDrugRestrictions(e.target.value)}
                rows={2}
                className="resize-y"
                placeholder="Descreva restrições conhecidas..."
                style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
              />
              <p className="text-xs" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                Ex: MDR1/ABCB1 em raças pastoras
              </p>
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-1">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                style={{
                  background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                className="text-white gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar Histórico'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientMedicalHistory;
