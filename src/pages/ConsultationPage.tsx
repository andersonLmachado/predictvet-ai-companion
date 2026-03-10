import React, { useCallback, useEffect, useReducer } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  PlusCircle,
  RotateCcw,
  Send,
  Stethoscope,
} from 'lucide-react';

import { usePatient } from '@/contexts/PatientContext';
import { useAnamnesisWebhook } from '@/hooks/useAnamnesisWebhook';
import { buildAnamnesisPayload } from '@/lib/anamnesisApi';
import {
  sessionReducer,
  initialSession,
} from '@/lib/consultationSession';
import ConsultationStepper from '@/components/consultation/ConsultationStepper';
import ComplaintSelector, { type Complaint } from '@/components/consultation/ComplaintSelector';
import FollowUpCard from '@/components/consultation/FollowUpCard';
import NarrativeInput from '@/components/consultation/NarrativeInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Stepper config ──────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Queixa', description: 'Motivo da consulta' },
  { label: 'Detalhes', description: 'Perguntas clínicas' },
  { label: 'Relato', description: 'Histórico do tutor' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

const ConsultationPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { selectedPatient, setSelectedPatient, patients, patientsLoaded } = usePatient();
  const { send } = useAnamnesisWebhook();
  const [session, dispatch] = useReducer(sessionReducer, initialSession);

  // Pre-select patient from URL param once the list is loaded
  useEffect(() => {
    if (!patientId || !patientsLoaded) return;
    const match = patients.find((p) => p.id === patientId);
    if (match) setSelectedPatient(match);
  }, [patientId, patientsLoaded, patients, setSelectedPatient]);

  const handleSelectComplaint = useCallback((complaint: Complaint) => {
    dispatch({ type: 'SELECT_COMPLAINT', payload: complaint });
  }, []);

  const handleFollowUpAnswer = useCallback(
    (answer: string) => {
      if (!session.complaint) return;
      dispatch({
        type: 'ANSWER_FOLLOWUP',
        payload: { question: session.complaint.followup, answer },
      });
    },
    [session.complaint]
  );

  const handleTranscriptionChange = useCallback((value: string) => {
    dispatch({ type: 'SET_TRANSCRIPTION', payload: value });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPatient || !session.complaint) return;

    dispatch({ type: 'SUBMIT_START' });

    const payload = buildAnamnesisPayload({
      consultationId: crypto.randomUUID(),
      patientId: selectedPatient.id,
      chiefComplaint: session.complaint.label,
      followupAnswers: session.followupAnswers,
      transcription: session.transcription,
    });

    const ok = await send(payload);

    if (ok) {
      dispatch({ type: 'SUBMIT_SUCCESS' });
    } else {
      dispatch({
        type: 'SUBMIT_ERROR',
        payload: 'Não foi possível enviar os dados para análise. Verifique sua conexão e tente novamente.',
      });
    }
  }, [selectedPatient, session.complaint, session.followupAnswers, session.transcription, send]);

  // ── Success screen ──────────────────────────────────────────────────────────
  if (session.submitStatus === 'success') {
    return (
      <div className="min-h-screen" style={{ background: 'hsl(213,100%,98%)' }}>
        <div
          className="pl-circuit-bg"
          style={{
            background:
              'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 60%, hsl(221,73%,22%) 100%)',
            borderBottom: '1px solid hsla(217,88%,57%,0.15)',
          }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
            >
              Anamnese Guiada
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'hsla(213,100%,85%,0.55)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              Coleta estruturada da queixa principal e histórico do tutor
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col items-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'hsl(162,70%,92%)' }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: 'hsl(162,70%,38%)' }} />
          </div>

          <div className="text-center space-y-1">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
            >
              Anamnese enviada com sucesso
            </h2>
            <p
              className="text-sm"
              style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              Os dados foram encaminhados para análise clínica.{' '}
              {selectedPatient && (
                <span>Paciente: <strong>{selectedPatient.name}</strong></span>
              )}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => dispatch({ type: 'RESET' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
                color: 'white',
                boxShadow: '0 6px 24px -6px hsla(221,73%,45%,0.45)',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Nova consulta
            </button>

            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'white',
                border: '1px solid hsl(217,50%,85%)',
                color: 'hsl(221,73%,45%)',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              <ClipboardList className="w-4 h-4" />
              Abrir SOAP
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'hsl(213,100%,98%)' }}>
      {/* Dark header */}
      <div
        className="pl-circuit-bg"
        style={{
          background:
            'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 60%, hsl(221,73%,22%) 100%)',
          borderBottom: '1px solid hsla(217,88%,57%,0.15)',
          boxShadow: '0 2px 20px -4px hsla(221,73%,10%,0.6)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: 'hsla(0,0%,100%,0.08)',
                border: '1px solid hsla(217,88%,57%,0.25)',
              }}
            >
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
              >
                Anamnese Guiada
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{
                  color: 'hsla(213,100%,85%,0.55)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                Coleta estruturada da queixa principal e histórico do tutor
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Patient selector */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'white',
            border: '1px solid hsl(217,50%,90%)',
            boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
          }}
        >
          <div className="h-1" style={{ background: 'hsl(221,73%,45%)' }} />
          <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            {selectedPatient ? (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'hsla(221,73%,45%,0.08)' }}
                  >
                    <Stethoscope
                      className="w-4 h-4"
                      style={{ color: 'hsl(221,73%,45%)' }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{
                        fontFamily: 'Nunito Sans, sans-serif',
                        color: 'hsl(222,77%,15%)',
                      }}
                    >
                      {selectedPatient.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        color: 'hsl(222,30%,55%)',
                        fontFamily: 'Nunito Sans, sans-serif',
                      }}
                    >
                      {[
                        selectedPatient.species,
                        selectedPatient.breed,
                        selectedPatient.owner_name && `Tutor: ${selectedPatient.owner_name}`,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    dispatch({ type: 'RESET' });
                  }}
                  className="text-xs font-medium transition-all"
                  style={{
                    color: 'hsl(222,30%,55%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  Alterar paciente
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 w-full flex-wrap">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: 'hsl(222,30%,50%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Selecione o paciente
                </p>
                <Select
                  onValueChange={(id) => {
                    const p = patients.find((pt) => pt.id === id);
                    if (p) setSelectedPatient(p);
                  }}
                >
                  <SelectTrigger
                    className="h-10 rounded-xl text-sm flex-1 min-w-[200px]"
                    style={{
                      borderColor: 'hsl(217,50%,85%)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    <SelectValue placeholder="Selecionar paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.species ? ` (${p.species})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link
                  to="/register-pet"
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-all"
                  style={{
                    color: 'hsl(221,73%,45%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Cadastrar pet
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Stepper */}
        <ConsultationStepper currentStep={session.step} steps={STEPS} />

        {/* Step content */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'white',
            border: '1px solid hsl(217,50%,90%)',
            boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
          }}
        >
          {/* Colored stripe */}
          <div
            className="h-1.5"
            style={{
              background:
                'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 80%, hsl(18,76%,50%) 100%)',
            }}
          />

          <div className="p-6">
            {/* Step 0 — Complaint selector */}
            {session.step === 0 && (
              <ComplaintSelector onSelect={handleSelectComplaint} />
            )}

            {/* Step 1 — Follow-up */}
            {session.step === 1 && session.complaint && (
              <FollowUpCard
                complaint={session.complaint}
                onAnswer={handleFollowUpAnswer}
              />
            )}

            {/* Step 2 — Narrative + submit */}
            {session.step === 2 && (
              <div className="space-y-6">
                <NarrativeInput
                  value={session.transcription}
                  onChange={handleTranscriptionChange}
                  disabled={session.submitStatus === 'sending'}
                />

                {/* Error message */}
                {session.submitStatus === 'error' && session.submitError && (
                  <div
                    className="flex items-start gap-3 rounded-xl p-4 text-sm"
                    style={{
                      background: 'hsl(352,76%,97%)',
                      border: '1px solid hsl(352,76%,88%)',
                      color: 'hsl(352,76%,35%)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {session.submitError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => dispatch({ type: 'BACK' })}
                    disabled={session.submitStatus === 'sending'}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: 'white',
                      border: '1px solid hsl(217,50%,85%)',
                      color: 'hsl(222,30%,50%)',
                      fontFamily: 'Nunito Sans, sans-serif',
                      opacity: session.submitStatus === 'sending' ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={!selectedPatient || session.submitStatus === 'sending'}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{
                      background:
                        !selectedPatient || session.submitStatus === 'sending'
                          ? 'hsl(217,50%,80%)'
                          : 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
                      boxShadow:
                        !selectedPatient || session.submitStatus === 'sending'
                          ? 'none'
                          : '0 6px 24px -6px hsla(221,73%,45%,0.45)',
                      fontFamily: 'Nunito Sans, sans-serif',
                      cursor:
                        !selectedPatient || session.submitStatus === 'sending'
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {session.submitStatus === 'sending' ? (
                      <>
                        <span
                          className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                        />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar para análise
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPage;
