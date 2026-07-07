import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Microscope, Pill, CalendarDays, Pencil, FileCheck } from 'lucide-react';
import { toast as uiToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePatient } from '@/contexts/PatientContext';
import { parseSoapP, serializeSoapP } from '@/lib/parseSoapP';
import type { SOAPCardHandle } from './SOAPCard';

interface PlanCardProps {
  value: string;
  onChange: (v: string) => void;
  patientId?: string;
  consultationId?: string;
  initialApprovedExams?: string[];
  initialApprovedTreatments?: string[];
}

const ACCENT = 'hsl(270, 50%, 55%)';
const EMPTY_STRING_ARRAY: string[] = [];

const PlanCard = forwardRef<SOAPCardHandle, PlanCardProps>(
  (
    {
      value,
      onChange,
      patientId,
      consultationId,
      initialApprovedExams = EMPTY_STRING_ARRAY,
      initialApprovedTreatments = EMPTY_STRING_ARRAY,
    },
    ref,
  ) => {
    const { refreshPatientState } = usePatient();

    const [approvedExams, setApprovedExams] = useState<string[]>(initialApprovedExams);
    const [approvedTreatments, setApprovedTreatments] = useState<string[]>(initialApprovedTreatments);
    const [isMonitoringEditing, setIsMonitoringEditing] = useState(false);
    const [monitoringOverride, setMonitoringOverride] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [fallbackContent, setFallbackContent] = useState(value);

    // Sync approved state when parent reloads data (e.g. patient switch)
    useEffect(() => { setApprovedExams(initialApprovedExams); }, [initialApprovedExams]);
    useEffect(() => { setApprovedTreatments(initialApprovedTreatments); }, [initialApprovedTreatments]);
    useEffect(() => {
      setFallbackContent(value);
    }, [value]);

    const parsed = useMemo(() => parseSoapP(value), [value]);

    const toggleExam = (item: string) =>
      setApprovedExams((prev) =>
        prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
      );

    const toggleTreatment = (item: string) =>
      setApprovedTreatments((prev) =>
        prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item],
      );

    const handleSaveInternal = useCallback(
      async (opts?: { silent?: boolean }): Promise<{ ok: boolean; letter: string }> => {
        const silent = opts?.silent ?? false;

        if (!patientId) {
          if (!silent) {
            uiToast({
              title: 'Paciente não selecionado',
              description: 'Selecione um paciente antes de salvar o registro.',
              variant: 'destructive',
            });
          }
          return { ok: false, letter: 'P' };
        }

        if (!value.trim()) return { ok: true, letter: 'P' };

        const { error: authError } = await supabase.auth.getUser();
        if ((authError as any)?.status === 401) {
          toast.error('Sua sessão expirou. Por favor, recarregue a página.');
          return { ok: false, letter: 'P' };
        }

        const contentToSave =
          parsed && monitoringOverride !== null
            ? serializeSoapP({ ...parsed, monitoring: monitoringOverride })
            : value;

        setIsSaving(true);
        try {
          if (consultationId) {
            // Guided/voice record exists: UPDATE the flat soap_p column on that row
            const payload: Record<string, unknown> = {
              soap_p: contentToSave,
              approved_exams: approvedExams,
              approved_treatments: approvedTreatments,
            };

            const { error } = await (supabase.from('medical_consultations') as any)
              .update(payload)
              .eq('id', consultationId);
            if (error) throw error;
          } else {
            // No guided record: legacy upsert per soap_block
            const { error } = await supabase
              .from('medical_consultations')
              .upsert(
                {
                  patient_id: patientId,
                  soap_block: 'P',
                  content: contentToSave,
                  approved_exams: approvedExams,
                  approved_treatments: approvedTreatments,
                } as any,
                { onConflict: 'patient_id,soap_block' },
              );

            if (error) throw error;
          }

          if (!silent) toast.success('Bloco P salvo com sucesso!');
          refreshPatientState();
          return { ok: true, letter: 'P' };
        } catch (err: any) {
          if (err?.status === 401 || err?.code === '401') {
            toast.error('Sua sessão expirou. Por favor, recarregue a página.');
          } else if (!silent) {
            uiToast({
              title: 'Erro ao salvar',
              description: 'Não foi possível salvar o registro. Tente novamente.',
              variant: 'destructive',
            });
          }
          return { ok: false, letter: 'P' };
        } finally {
          setIsSaving(false);
        }
      },
      [patientId, consultationId, value, parsed, monitoringOverride, approvedExams, approvedTreatments, refreshPatientState],
    );

    useImperativeHandle(ref, () => ({ save: () => handleSaveInternal({ silent: true }) }), [
      handleSaveInternal,
    ]);

    const cardHeader = (
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            P
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">Plano — Conduta</span>
            </div>
            <p className="text-xs font-normal text-muted-foreground">
              Exames solicitados, prescrições, retorno
            </p>
          </div>
          <FileCheck className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
    );

    const saveButton = (
      <CardFooter className="pt-0">
        <Button
          onClick={() => handleSaveInternal({ silent: false })}
          disabled={isSaving || !value.trim()}
          className="gap-2"
          style={{ backgroundColor: ACCENT }}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Plano
        </Button>
      </CardFooter>
    );

    // ── Fallback mode (empty or unrecognized format) ──────────────────────────
    if (!parsed) {
      return (
        <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: ACCENT }}>
          {cardHeader}
          <CardContent>
            <Textarea
              value={fallbackContent}
              onChange={(e) => {
                setFallbackContent(e.target.value);
                onChange(e.target.value);
              }}
              placeholder="Solicitar hemograma completo, bioquímico renal... Prescrever: ___ | Retorno em: ___"
              className="min-h-[120px] resize-none text-sm"
            />
          </CardContent>
          {saveButton}
        </Card>
      );
    }

    // ── Structured mode ───────────────────────────────────────────────────────
    const monitoringText = monitoringOverride ?? parsed.monitoring;

    return (
      <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: ACCENT }}>
        {cardHeader}
        <CardContent className="space-y-4">

          {/* Section 1 — Exames */}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ background: 'hsla(221,73%,45%,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Microscope className="h-4 w-4" style={{ color: 'hsl(221,73%,45%)' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(221,73%,45%)' }}>
                  Exames Solicitados
                </span>
              </div>
              {parsed.exams.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {approvedExams.length} / {parsed.exams.length} selecionados
                </span>
              )}
            </div>
            {parsed.exams.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum exame especificado</p>
            ) : (
              parsed.exams.map((exam, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Checkbox
                    id={`exam-${i}`}
                    checked={approvedExams.includes(exam)}
                    onCheckedChange={() => toggleExam(exam)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`exam-${i}`}
                    className={`text-sm cursor-pointer leading-relaxed select-none ${
                      approvedExams.includes(exam) ? 'line-through opacity-50' : ''
                    }`}
                  >
                    {exam}
                  </label>
                </div>
              ))
            )}
          </div>

          {/* Section 2 — Tratamento */}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ background: 'hsla(160,60%,40%,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4" style={{ color: 'hsl(160,60%,40%)' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(160,60%,40%)' }}>
                  Protocolo e Tratamento
                </span>
              </div>
              {parsed.treatments.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {approvedTreatments.length} / {parsed.treatments.length} selecionados
                </span>
              )}
            </div>
            {parsed.treatments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma conduta especificada</p>
            ) : (
              parsed.treatments.map((treatment, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Checkbox
                    id={`treatment-${i}`}
                    checked={approvedTreatments.includes(treatment)}
                    onCheckedChange={() => toggleTreatment(treatment)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`treatment-${i}`}
                    className={`text-sm cursor-pointer leading-relaxed select-none ${
                      approvedTreatments.includes(treatment) ? 'line-through opacity-50' : ''
                    }`}
                  >
                    {treatment}
                  </label>
                </div>
              ))
            )}
          </div>

          {/* Section 3 — Retorno */}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ background: 'hsla(35,80%,50%,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" style={{ color: 'hsl(35,80%,50%)' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(35,80%,50%)' }}>
                  Retorno e Monitoramento
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMonitoringEditing((e) => !e)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="editar retorno"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <Textarea
              value={monitoringText}
              readOnly={!isMonitoringEditing}
              onChange={(e) => setMonitoringOverride(e.target.value)}
              className="min-h-[72px] resize-none text-sm bg-transparent border-0 p-0 focus-visible:ring-0 shadow-none"
            />
          </div>

        </CardContent>
        {saveButton}
      </Card>
    );
  },
);

PlanCard.displayName = 'PlanCard';
export default PlanCard;
