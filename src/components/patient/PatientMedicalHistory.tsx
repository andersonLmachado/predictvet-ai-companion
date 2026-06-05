import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Loader2, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  fetchMedicalHistory,
  saveMedicalHistory,
  type Vaccine,
} from '@/lib/medicalHistory';

interface Props {
  patientId: string;
}

const PatientMedicalHistory: React.FC<Props> = ({ patientId }) => {
  const { toast } = useToast();
  const [allergies, setAllergies] = useState('');
  const [previousDiseases, setPreviousDiseases] = useState('');
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
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
    setVaccines((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMedicalHistory(patientId, { allergies, previousDiseases, vaccines });
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
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={vaccine.name}
                        onChange={(e) => updateVaccine(index, 'name', e.target.value)}
                        placeholder="Nome da vacina"
                        className="h-9 text-sm flex-1"
                        style={{
                          borderColor: 'hsl(217,50%,85%)',
                          fontFamily: 'Nunito Sans, sans-serif',
                        }}
                      />
                      <Input
                        type="date"
                        value={vaccine.date}
                        onChange={(e) => updateVaccine(index, 'date', e.target.value)}
                        className="h-9 text-sm w-40"
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
                  ))}
                </div>
              )}
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
