// src/components/ultrasound/UltrasoundForm.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { UltrasoundReportData, UltrasoundSex, UltrasoundSpecies } from '@/types/ultrasound';
import { CANIS_REFS, FELIS_REFS, checkReference, getAdrenalReference, getPancreasDuctReference } from '@/lib/ultrasoundReferences';
import { generateReport, buildPrintableHtml } from '@/lib/ultrasoundReportGenerator';
import { parseVoiceMeasurements } from '@/lib/ultrasoundVoiceParser';
import { useUltrasoundWhisper } from '@/hooks/useUltrasoundWhisper';
import OrganSection from './OrganSection';
import MeasurementField from './MeasurementField';

// ── Types ───────────────────────────────────────────────────────────────────

interface PatientInfo {
  id: string;
  name: string;
  species: UltrasoundSpecies;
  owner_name: string;
  age: string | null;
  weight: number | null;
  initialSex: UltrasoundSex | '';
  ageYears: number | null;
}

interface Props {
  patient: PatientInfo;
}

// ── Form state ──────────────────────────────────────────────────────────────

type FormData = Omit<UltrasoundReportData, 'patient_id' | 'species' | 'sex' | 'equipment'>;
const EMPTY_FORM: FormData = {};

function numStr(v: number | null | undefined): string {
  return v != null ? String(v) : '';
}

// ── Organ status calculation ─────────────────────────────────────────────────

type OrganStatus = 'empty' | 'normal' | 'abnormal';

function computeStatus(
  numericFields: Array<{ value: string; refMin: number | null; refMax: number | null }>,
  notesValue: string,
  notesOnly: boolean,
): OrganStatus {
  if (notesOnly) return notesValue.trim() ? 'normal' : 'empty';

  const filled = numericFields.filter((f) => f.value.trim() !== '');
  if (filled.length === 0 && !notesValue.trim()) return 'empty';

  const hasAbnormal = filled.some((f) => {
    if (f.refMin == null && f.refMax == null) return false;
    const n = parseFloat(f.value);
    if (isNaN(n)) return false;
    return checkReference(n, f.refMin, f.refMax) !== 'normal';
  });

  return hasAbnormal ? 'abnormal' : 'normal';
}

// ── Main component ──────────────────────────────────────────────────────────

const UltrasoundForm: React.FC<Props> = ({ patient }) => {
  const navigate = useNavigate();
  const [reproductiveStatus, setReproductiveStatus] = useState<UltrasoundSex | ''>(
    patient.initialSex,
  );
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [equipment, setEquipment] = useState('Infinit X PRO');
  const [diagnosticImpression, setDiagnosticImpression] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedReport, setSavedReport] = useState<string | null>(null);

  const setField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setNumField = useCallback(
    (key: keyof FormData, value: string) => {
      const n = parseFloat(value);
      setField(key, value === '' ? null : (isNaN(n) ? null : n) as any);
    },
    [setField],
  );

  // Voice transcription handler
  const handleTranscription = useCallback(
    (organ: string, transcript: string) => {
      const extracted = parseVoiceMeasurements(transcript, organ);
      if (Object.keys(extracted).length === 0) {
        toast.warning(`Não foi possível extrair medidas. Transcrição: "${transcript}"`);
        return;
      }
      setForm((prev) => ({ ...prev, ...extracted }));
      toast.success('Medidas preenchidas por voz');
    },
    [],
  );

  const { isRecording, isProcessing, currentOrgan, webhookConfigured, startRecording, stopRecording } =
    useUltrasoundWhisper({ onTranscription: handleTranscription });

  const handleMicClick = useCallback(
    (organ: string) => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording(organ);
      }
    },
    [isRecording, startRecording, stopRecording],
  );

  // ── Reference helpers ──────────────────────────────────────────────────────

  const refs = patient.species === 'canis' ? CANIS_REFS : FELIS_REFS;
  const adrenalLeft = getAdrenalReference(patient.species, 'left', patient.weight);
  const adrenalRight = getAdrenalReference(patient.species, 'right', patient.weight);
  const pancDuctRef = getPancreasDuctReference(patient.species, patient.ageYears);
  const pancDuctPlaceholder = patient.species === 'felis' && patient.ageYears === null
    ? '< 10 anos: ≤ 0.13 | ≥ 10 anos: ≤ 0.25'
    : undefined;

  // ── Status memos ──────────────────────────────────────────────────────────

  const organStatuses = useMemo<Record<string, OrganStatus>>(() => {
    const cr = CANIS_REFS;
    const fr = FELIS_REFS;
    const isCanis = patient.species === 'canis';
    return {
      bladder: computeStatus([
        { value: numStr(form.bladder_wall_cm), refMin: null, refMax: isCanis ? cr.bladder_wall_cm.max : fr.bladder_wall_cm.max },
      ], form.bladder_notes ?? '', false),
      kidney: computeStatus([
        { value: numStr(form.kidney_left_cm), refMin: isCanis ? null : fr.kidney_cm.min, refMax: isCanis ? null : fr.kidney_cm.max },
        { value: numStr(form.kidney_right_cm), refMin: isCanis ? null : fr.kidney_cm.min, refMax: isCanis ? null : fr.kidney_cm.max },
        { value: numStr(form.kidney_pelvis_left_cm), refMin: null, refMax: isCanis ? cr.kidney_pelvis_cm.max : fr.kidney_pelvis_cm.max },
        { value: numStr(form.kidney_pelvis_right_cm), refMin: null, refMax: isCanis ? cr.kidney_pelvis_cm.max : fr.kidney_pelvis_cm.max },
      ], form.kidney_notes ?? '', false),
      liver: computeStatus([], form.liver_notes ?? '', true),
      gallbladder: computeStatus([
        { value: numStr(form.gallbladder_wall_cm), refMin: null, refMax: null },
        { value: numStr(form.gallbladder_duct_cm), refMin: null, refMax: isCanis ? null : fr.gallbladder_duct_cm.max },
      ], form.gallbladder_notes ?? '', false),
      stomach: computeStatus([
        { value: numStr(form.stomach_wall_cm), refMin: isCanis ? null : fr.stomach_wall_cm.min, refMax: isCanis ? cr.stomach_wall_cm.max : fr.stomach_wall_cm.max },
      ], form.stomach_notes ?? '', false),
      intestine: computeStatus([
        { value: numStr(form.intestine_duodenum_cm), refMin: null, refMax: isCanis ? cr.intestine_duodenum_cm.max : fr.intestine_duodenum_cm.max },
        { value: numStr(form.intestine_jejunum_cm), refMin: null, refMax: isCanis ? cr.intestine_jejunum_cm.max : fr.intestine_jejunum_cm.max },
        { value: numStr(form.intestine_ileum_cm), refMin: isCanis ? null : fr.intestine_ileum_cm.min, refMax: isCanis ? cr.intestine_ileum_cm.max : fr.intestine_ileum_cm.max },
        { value: numStr(form.intestine_colon_cm), refMin: isCanis ? null : fr.intestine_colon_cm.min, refMax: isCanis ? cr.intestine_colon_cm.max : fr.intestine_colon_cm.max },
      ], form.intestine_notes ?? '', false),
      spleen: computeStatus([], form.spleen_notes ?? '', true),
      pancreas: computeStatus([
        { value: numStr(form.pancreas_right_lobe_cm), refMin: null, refMax: isCanis ? null : fr.pancreas_right_lobe_cm.max },
        { value: numStr(form.pancreas_left_lobe_cm), refMin: null, refMax: isCanis ? null : fr.pancreas_left_lobe_cm.max },
        { value: numStr(form.pancreas_duct_cm), refMin: null, refMax: pancDuctRef?.max ?? null },
      ], form.pancreas_notes ?? '', false),
      adrenal: computeStatus([
        { value: numStr(form.adrenal_left_cm), refMin: adrenalLeft?.min ?? null, refMax: adrenalLeft?.max ?? null },
        { value: numStr(form.adrenal_right_cm), refMin: adrenalRight?.min ?? null, refMax: adrenalRight?.max ?? null },
      ], form.adrenal_notes ?? '', false),
      // Reproductive: notes-only logic (fields are optional measurements without fixed references)
      reproductive: computeStatus([], form.uterus_notes ?? '', true),
    };
  }, [form, patient.species, adrenalLeft, adrenalRight, pancDuctRef]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!reproductiveStatus) {
      toast.error('Selecione o status reprodutivo antes de salvar.');
      return;
    }

    const data: UltrasoundReportData = {
      patient_id: patient.id,
      species: patient.species,
      sex: reproductiveStatus,
      equipment,
      diagnostic_impression: diagnosticImpression || null,
      ...form,
    };

    const report = generateReport(data);
    setSavedReport(report);

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('ultrasound_reports').insert({
        ...data,
        veterinarian_id: user.id,
        generated_report: report,
      });

      if (error) throw error;
      toast.success('Laudo salvo com sucesso!');
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message ?? 'tente novamente'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ── PDF export (synchronous — must not have await before window.open) ─────

  const handleExportPdf = () => {
    const data: UltrasoundReportData = {
      patient_id: patient.id,
      species: patient.species,
      sex: (reproductiveStatus || 'female') as UltrasoundSex,
      equipment,
      diagnostic_impression: diagnosticImpression || null,
      ...form,
    };
    const reportText = savedReport ?? generateReport(data);
    const html = buildPrintableHtml(reportText, patient, new Date().toLocaleDateString('pt-BR'));
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) { toast.error('Pop-up bloqueado. Permita pop-ups para exportar PDF.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12">
      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
              Laudo Ultrassonográfico — {patient.name}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{patient.species === 'canis' ? 'Cão' : 'Gato'}</Badge>
              {!webhookConfigured && (
                <Badge variant="secondary" className="text-xs">Voz indisponível</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Reproductive status */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Status Reprodutivo *
            </label>
            <Select value={reproductiveStatus} onValueChange={(v) => setReproductiveStatus(v as UltrasoundSex)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Fêmea inteira</SelectItem>
                <SelectItem value="female_castrated">Fêmea castrada (OVH)</SelectItem>
                <SelectItem value="male">Macho inteiro</SelectItem>
                <SelectItem value="male_castrated">Macho castrado (OQT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Equipment */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Aparelho
            </label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm w-full"
              style={{ borderColor: 'hsl(217,50%,85%)', fontFamily: 'Nunito Sans, sans-serif' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Organ sections */}
      <Accordion type="multiple" className="space-y-2">

        {/* BEXIGA */}
        <OrganSection organKey="bladder" title="Bexiga Urinária" status={organStatuses.bladder}
          notes={form.bladder_notes ?? ''} onNotesChange={(v) => setField('bladder_notes', v)}
          onMicClick={() => handleMicClick('bladder')}
          isRecordingThis={currentOrgan === 'bladder' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'bladder'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Parede" value={numStr(form.bladder_wall_cm)}
            onChange={(v) => setNumField('bladder_wall_cm', v)}
            refMin={patient.species === 'felis' ? (refs as typeof FELIS_REFS).bladder_wall_cm.min : null}
            refMax={(refs as any).bladder_wall_cm?.max ?? null} />
        </OrganSection>

        {/* RINS */}
        <OrganSection organKey="kidney" title="Rins" status={organStatuses.kidney}
          notes={form.kidney_notes ?? ''} onNotesChange={(v) => setField('kidney_notes', v)}
          onMicClick={() => handleMicClick('kidney')}
          isRecordingThis={currentOrgan === 'kidney' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'kidney'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Rim Esquerdo" value={numStr(form.kidney_left_cm)}
            onChange={(v) => setNumField('kidney_left_cm', v)}
            refMin={patient.species === 'felis' ? (refs as typeof FELIS_REFS).kidney_cm.min : null}
            refMax={patient.species === 'felis' ? (refs as typeof FELIS_REFS).kidney_cm.max : null} />
          <MeasurementField label="Rim Direito" value={numStr(form.kidney_right_cm)}
            onChange={(v) => setNumField('kidney_right_cm', v)}
            refMin={patient.species === 'felis' ? (refs as typeof FELIS_REFS).kidney_cm.min : null}
            refMax={patient.species === 'felis' ? (refs as typeof FELIS_REFS).kidney_cm.max : null} />
          <MeasurementField label="Pelve Renal Esq." value={numStr(form.kidney_pelvis_left_cm)}
            onChange={(v) => setNumField('kidney_pelvis_left_cm', v)} refMax={0.20} />
          <MeasurementField label="Pelve Renal Dir." value={numStr(form.kidney_pelvis_right_cm)}
            onChange={(v) => setNumField('kidney_pelvis_right_cm', v)} refMax={0.20} />
        </OrganSection>

        {/* FÍGADO */}
        <OrganSection organKey="liver" title="Fígado" status={organStatuses.liver}
          notes={form.liver_notes ?? ''} onNotesChange={(v) => setField('liver_notes', v)}
          onMicClick={() => handleMicClick('liver')}
          isRecordingThis={currentOrgan === 'liver' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'liver'}
          micDisabled={!webhookConfigured}>
          {/* Notes-only organ — no numeric fields */}
        </OrganSection>

        {/* VESÍCULA BILIAR */}
        <OrganSection organKey="gallbladder" title="Vesícula Biliar" status={organStatuses.gallbladder}
          notes={form.gallbladder_notes ?? ''} onNotesChange={(v) => setField('gallbladder_notes', v)}
          onMicClick={() => handleMicClick('gallbladder')}
          isRecordingThis={currentOrgan === 'gallbladder' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'gallbladder'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Parede" value={numStr(form.gallbladder_wall_cm)}
            onChange={(v) => setNumField('gallbladder_wall_cm', v)} />
          <MeasurementField label="Ducto" value={numStr(form.gallbladder_duct_cm)}
            onChange={(v) => setNumField('gallbladder_duct_cm', v)}
            refMax={patient.species === 'felis' ? 0.40 : null} />
        </OrganSection>

        {/* ESTÔMAGO */}
        <OrganSection organKey="stomach" title="Estômago" status={organStatuses.stomach}
          notes={form.stomach_notes ?? ''} onNotesChange={(v) => setField('stomach_notes', v)}
          onMicClick={() => handleMicClick('stomach')}
          isRecordingThis={currentOrgan === 'stomach' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'stomach'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Parede"
            value={numStr(form.stomach_wall_cm)}
            onChange={(v) => setNumField('stomach_wall_cm', v)}
            refMin={patient.species === 'felis' ? 0.11 : null}
            refMax={patient.species === 'canis' ? 0.50 : 0.36} />
          <div>
            <label className="text-xs font-medium block mb-1"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Região avaliada
            </label>
            <input type="text" placeholder="ex: região antral"
              value={form.stomach_region ?? ''} onChange={(e) => setField('stomach_region', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'hsl(217,50%,85%)', fontFamily: 'Nunito Sans, sans-serif' }} />
          </div>
        </OrganSection>

        {/* TRATO INTESTINAL */}
        <OrganSection organKey="intestine" title="Trato Intestinal" status={organStatuses.intestine}
          notes={form.intestine_notes ?? ''} onNotesChange={(v) => setField('intestine_notes', v)}
          onMicClick={() => handleMicClick('intestine')}
          isRecordingThis={currentOrgan === 'intestine' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'intestine'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Duodeno" value={numStr(form.intestine_duodenum_cm)}
            onChange={(v) => setNumField('intestine_duodenum_cm', v)}
            refMax={patient.species === 'canis' ? 0.50 : 0.22} />
          <MeasurementField label="Jejuno" value={numStr(form.intestine_jejunum_cm)}
            onChange={(v) => setNumField('intestine_jejunum_cm', v)}
            refMax={patient.species === 'canis' ? 0.30 : 0.22} />
          <MeasurementField label="Íleo" value={numStr(form.intestine_ileum_cm)}
            onChange={(v) => setNumField('intestine_ileum_cm', v)}
            refMin={patient.species === 'felis' ? 0.17 : null}
            refMax={patient.species === 'canis' ? 0.50 : 0.23} />
          <MeasurementField label="Cólon" value={numStr(form.intestine_colon_cm)}
            onChange={(v) => setNumField('intestine_colon_cm', v)}
            refMin={patient.species === 'felis' ? 0.10 : null}
            refMax={patient.species === 'canis' ? 0.15 : 0.25} />
        </OrganSection>

        {/* BAÇO */}
        <OrganSection organKey="spleen" title="Baço" status={organStatuses.spleen}
          notes={form.spleen_notes ?? ''} onNotesChange={(v) => setField('spleen_notes', v)}
          onMicClick={() => handleMicClick('spleen')}
          isRecordingThis={currentOrgan === 'spleen' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'spleen'}
          micDisabled={!webhookConfigured}>
          {/* Notes-only organ */}
        </OrganSection>

        {/* PÂNCREAS */}
        <OrganSection organKey="pancreas" title="Pâncreas" status={organStatuses.pancreas}
          notes={form.pancreas_notes ?? ''} onNotesChange={(v) => setField('pancreas_notes', v)}
          onMicClick={() => handleMicClick('pancreas')}
          isRecordingThis={currentOrgan === 'pancreas' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'pancreas'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Lobo Direito" value={numStr(form.pancreas_right_lobe_cm)}
            onChange={(v) => setNumField('pancreas_right_lobe_cm', v)}
            refMax={patient.species === 'felis' ? 0.60 : null} />
          <MeasurementField label="Lobo Esquerdo" value={numStr(form.pancreas_left_lobe_cm)}
            onChange={(v) => setNumField('pancreas_left_lobe_cm', v)}
            refMax={patient.species === 'felis' ? 0.90 : null} />
          <MeasurementField label="Ducto Pancreático" value={numStr(form.pancreas_duct_cm)}
            onChange={(v) => setNumField('pancreas_duct_cm', v)}
            refMax={pancDuctRef?.max ?? null}
            placeholder={pancDuctPlaceholder} />
        </OrganSection>

        {/* ADRENAIS */}
        <OrganSection organKey="adrenal" title="Glândulas Adrenais" status={organStatuses.adrenal}
          notes={form.adrenal_notes ?? ''} onNotesChange={(v) => setField('adrenal_notes', v)}
          onMicClick={() => handleMicClick('adrenal')}
          isRecordingThis={currentOrgan === 'adrenal' && isRecording}
          isProcessing={isProcessing && currentOrgan === 'adrenal'}
          micDisabled={!webhookConfigured}>
          <MeasurementField label="Adrenal Esquerda (GAE)" value={numStr(form.adrenal_left_cm)}
            onChange={(v) => setNumField('adrenal_left_cm', v)}
            refMin={adrenalLeft?.min ?? null} refMax={adrenalLeft?.max ?? null} />
          <MeasurementField label="Adrenal Direita (GAD)" value={numStr(form.adrenal_right_cm)}
            onChange={(v) => setNumField('adrenal_right_cm', v)}
            refMin={adrenalRight?.min ?? null} refMax={adrenalRight?.max ?? null} />
        </OrganSection>

        {/* REPRODUTIVO — conditional */}
        {reproductiveStatus === 'female' && (
          <OrganSection organKey="reproductive" title="Reprodutivo — Fêmea" status={organStatuses.reproductive}
            notes={form.uterus_notes ?? ''} onNotesChange={(v) => setField('uterus_notes', v)}
            onMicClick={() => handleMicClick('reproductive')}
            isRecordingThis={currentOrgan === 'reproductive' && isRecording}
            isProcessing={isProcessing && currentOrgan === 'reproductive'}
            micDisabled={!webhookConfigured}>
            <MeasurementField label="Ovário Esq. — dim 1" value={numStr(form.ovary_left_cm1)} onChange={(v) => setNumField('ovary_left_cm1', v)} />
            <MeasurementField label="Ovário Esq. — dim 2" value={numStr(form.ovary_left_cm2)} onChange={(v) => setNumField('ovary_left_cm2', v)} />
            <MeasurementField label="Ovário Dir. — dim 1" value={numStr(form.ovary_right_cm1)} onChange={(v) => setNumField('ovary_right_cm1', v)} />
            <MeasurementField label="Ovário Dir. — dim 2" value={numStr(form.ovary_right_cm2)} onChange={(v) => setNumField('ovary_right_cm2', v)} />
          </OrganSection>
        )}

        {(reproductiveStatus === 'female_castrated') && (
          <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500 bg-slate-50"
            style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
            Útero e ovários não caracterizados — paciente ovariohisterectomizada.
          </div>
        )}

        {reproductiveStatus === 'male' && (
          <OrganSection organKey="reproductive" title="Reprodutivo — Macho" status={organStatuses.reproductive}
            notes="" onNotesChange={() => {}}
            onMicClick={() => handleMicClick('reproductive')}
            isRecordingThis={currentOrgan === 'reproductive' && isRecording}
            isProcessing={isProcessing && currentOrgan === 'reproductive'}
            micDisabled={!webhookConfigured}>
            <MeasurementField label="Próstata — Comprimento" value={numStr(form.prostate_length_cm)} onChange={(v) => setNumField('prostate_length_cm', v)} />
            <MeasurementField label="Próstata — Altura" value={numStr(form.prostate_height_cm)} onChange={(v) => setNumField('prostate_height_cm', v)} />
            <MeasurementField label="Próstata — Largura" value={numStr(form.prostate_width_cm)} onChange={(v) => setNumField('prostate_width_cm', v)} />
            <MeasurementField label="Testículo Esq. — dim 1" value={numStr(form.testis_left_cm1)} onChange={(v) => setNumField('testis_left_cm1', v)} />
            <MeasurementField label="Testículo Esq. — dim 2" value={numStr(form.testis_left_cm2)} onChange={(v) => setNumField('testis_left_cm2', v)} />
            <MeasurementField label="Testículo Dir. — dim 1" value={numStr(form.testis_right_cm1)} onChange={(v) => setNumField('testis_right_cm1', v)} />
            <MeasurementField label="Testículo Dir. — dim 2" value={numStr(form.testis_right_cm2)} onChange={(v) => setNumField('testis_right_cm2', v)} />
          </OrganSection>
        )}

        {reproductiveStatus === 'male_castrated' && (
          <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500 bg-slate-50"
            style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
            Testículos ausentes — paciente orquiectomizado.
          </div>
        )}
      </Accordion>

      {/* Impressão diagnóstica */}
      <Card>
        <CardContent className="pt-4">
          <label className="text-xs font-semibold uppercase tracking-wide block mb-2"
            style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
            Impressão Diagnóstica
          </label>
          <Textarea
            value={diagnosticImpression}
            onChange={(e) => setDiagnosticImpression(e.target.value)}
            placeholder="Conclusão clínica do exame..."
            rows={4}
            style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button variant="outline" onClick={handleExportPdf}>
          <Printer className="w-4 h-4 mr-1.5" />
          Exportar PDF
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Salvando...</>
          ) : (
            <><FileText className="w-4 h-4 mr-1.5" />Gerar e Salvar Laudo</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UltrasoundForm;
