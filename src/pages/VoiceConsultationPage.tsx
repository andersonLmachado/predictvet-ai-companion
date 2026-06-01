import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
} from 'lucide-react';
import { usePatient } from '@/contexts/PatientContext';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useVoiceConsultation } from '@/hooks/useVoiceConsultation';
import ClinicalHistoryCard from '@/components/patient/ClinicalHistoryCard';
import { Textarea } from '@/components/ui/textarea';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PROCESSING_MESSAGES = [
  'Transcrevendo consulta...',
  'Estruturando prontuário...',
  'Gerando SOAP...',
] as const;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const WAVE_DELAYS = ['0s', '0.1s', '0.2s', '0.15s', '0.05s'];

const Waveform: React.FC = () => (
  <div className="flex items-end gap-1" style={{ height: '32px' }}>
    {WAVE_DELAYS.map((delay, i) => (
      <div
        key={i}
        style={{
          width: '6px',
          background: 'hsl(352,76%,44%)',
          borderRadius: '3px',
          animationName: 'waveBar',
          animationDuration: '0.5s',
          animationDelay: delay,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
        }}
      />
    ))}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const VoiceConsultationPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate      = useNavigate();
  const { selectedPatient } = usePatient();

  const [context,         setContext]         = useState('');
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [msgIdx,          setMsgIdx]          = useState(0);

  const recording    = useVoiceRecording();
  const consultation = useVoiceConsultation({ patientId: patientId ?? '' });

  // Cicla mensagens de processamento
  useEffect(() => {
    if (!consultation.loading) return;
    setMsgIdx(0);
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % PROCESSING_MESSAGES.length), 4000);
    return () => clearInterval(id);
  }, [consultation.loading]);

  const handleGenerateSOAP = async () => {
    if (!recording.audioBlob) return;
    await consultation.submit(recording.audioBlob, context, clinicalHistory);
  };

  const handleNewConsultation = () => {
    recording.reset();
    consultation.reset();
    setContext('');
    navigate(`/anamnese/${patientId ?? ''}`);
  };

  // ── Tela de sucesso ──────────────────────────────────────────────────────────
  if (consultation.success) {
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
              Registro por Voz
            </h1>
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
              Consulta processada com sucesso
            </h2>
            {selectedPatient && (
              <p
                className="text-sm"
                style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Paciente: <strong>{selectedPatient.name}</strong>
              </p>
            )}
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={handleNewConsultation}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'white',
                border: '1px solid hsl(217,50%,85%)',
                color: 'hsl(221,73%,45%)',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Nova consulta
            </button>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
                boxShadow: '0 6px 24px -6px hsla(221,73%,45%,0.45)',
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

  // ── Layout principal ──────────────────────────────────────────────────────────
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
          <div className="flex items-center gap-4">
            <Link
              to={`/anamnese/${patientId ?? ''}`}
              className="flex items-center gap-1 text-sm transition-all shrink-0"
              style={{ color: 'hsla(213,100%,85%,0.7)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'hsla(0,0%,100%,0.08)',
                border: '1px solid hsla(217,88%,57%,0.25)',
              }}
            >
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
              >
                Registro por Voz
              </h1>
              {selectedPatient && (
                <p
                  className="text-sm mt-0.5"
                  style={{
                    color: 'hsla(213,100%,85%,0.55)',
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {selectedPatient.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Histórico clínico — readonly */}
        {selectedPatient && (
          <ClinicalHistoryCard
            mode="readonly"
            patientId={selectedPatient.id}
            onLoad={setClinicalHistory}
          />
        )}

        {/* Card de gravação */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'white',
            border: '1px solid hsl(217,50%,90%)',
            boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
          }}
        >
          <div
            className="h-1.5"
            style={{
              background:
                'linear-gradient(135deg, hsl(352,76%,44%), hsl(18,76%,50%))',
            }}
          />
          <div className="p-6 flex flex-col items-center gap-6 min-h-[260px] justify-center">
            {/* ── Estado: processando ──────────────────────────────────── */}
            {consultation.loading && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2
                  className="w-12 h-12 animate-spin"
                  style={{ color: 'hsl(221,73%,45%)' }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,55%)' }}
                >
                  {PROCESSING_MESSAGES[msgIdx]}
                </p>
              </div>
            )}

            {!consultation.loading && (
              <>
                {/* Banner de erro */}
                {consultation.error && (
                  <div
                    className="w-full flex items-start gap-3 rounded-xl p-4 text-sm"
                    style={{
                      background: 'hsl(352,76%,97%)',
                      border: '1px solid hsl(352,76%,88%)',
                      color: 'hsl(352,76%,35%)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p>{consultation.error}</p>
                      <button
                        onClick={handleGenerateSOAP}
                        className="mt-2 text-xs font-semibold underline"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Estados: idle / recording / paused ──────────────── */}
                {(recording.state === 'idle' ||
                  recording.state === 'recording' ||
                  recording.state === 'paused') && (
                  <>
                    {/* Botão de microfone */}
                    <button
                      onClick={recording.state === 'idle' ? recording.start : undefined}
                      className="w-24 h-24 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background:
                          recording.state === 'recording'
                            ? 'hsl(352,76%,44%)'
                            : recording.state === 'paused'
                            ? 'hsl(38,88%,48%)'
                            : 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
                        boxShadow:
                          recording.state === 'idle'
                            ? '0 6px 24px -6px hsla(221,73%,45%,0.5)'
                            : '0 6px 24px -6px hsla(352,76%,44%,0.5)',
                        animation:
                          recording.state === 'recording' ? 'pulse 1.5s ease-out infinite' : 'none',
                        cursor: recording.state === 'idle' ? 'pointer' : 'default',
                      }}
                    >
                      <Mic className="w-10 h-10 text-white" />
                    </button>

                    {/* Forma de onda (apenas durante gravação) */}
                    {recording.state === 'recording' && <Waveform />}

                    {/* Timer */}
                    <p
                      className="text-3xl font-bold tabular-nums"
                      style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
                    >
                      {formatDuration(recording.duration)}
                    </p>

                    {/* Status */}
                    <p
                      className="text-sm"
                      style={{
                        fontFamily: 'Nunito Sans, sans-serif',
                        color: 'hsl(222,30%,55%)',
                      }}
                    >
                      {recording.state === 'idle'      && 'Toque para iniciar a gravação'}
                      {recording.state === 'recording'  && 'Gravando...'}
                      {recording.state === 'paused'     && 'Gravação pausada'}
                    </p>

                    {/* Controles (Pausar / Retomar / Finalizar) */}
                    {recording.state !== 'idle' && (
                      <div className="flex gap-3 flex-wrap justify-center">
                        {recording.state === 'recording' ? (
                          <button
                            onClick={recording.pause}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            style={{
                              background: 'white',
                              border: '1px solid hsl(217,50%,85%)',
                              color: 'hsl(222,30%,50%)',
                              fontFamily: 'Nunito Sans, sans-serif',
                            }}
                          >
                            <Pause className="w-4 h-4" />
                            Pausar
                          </button>
                        ) : (
                          <button
                            onClick={recording.resume}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            style={{
                              background: 'white',
                              border: '1px solid hsl(217,50%,85%)',
                              color: 'hsl(222,30%,50%)',
                              fontFamily: 'Nunito Sans, sans-serif',
                            }}
                          >
                            <Play className="w-4 h-4" />
                            Retomar
                          </button>
                        )}
                        <button
                          onClick={recording.stop}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                          style={{
                            background:
                              'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
                            boxShadow: '0 6px 24px -6px hsla(221,73%,45%,0.45)',
                            fontFamily: 'Nunito Sans, sans-serif',
                          }}
                        >
                          <Square className="w-4 h-4" />
                          Finalizar
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── Estado: stopped — player + contexto + gerar SOAP ── */}
                {recording.state === 'stopped' && recording.audioUrl && (
                  <div className="w-full space-y-5">
                    {/* Player de áudio */}
                    <audio
                      controls
                      src={recording.audioUrl}
                      className="w-full rounded-xl"
                    />

                    {/* Campo de contexto opcional */}
                    <div className="space-y-2">
                      <label
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{
                          color: 'hsl(222,30%,45%)',
                          fontFamily: 'Nunito Sans, sans-serif',
                        }}
                      >
                        Adicionar contexto (opcional)
                      </label>
                      <Textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value.slice(0, 500))}
                        placeholder="Queixa principal, observações..."
                        rows={3}
                        className="rounded-xl text-sm resize-none"
                        style={{
                          borderColor: 'hsl(217,50%,85%)',
                          fontFamily: 'Nunito Sans, sans-serif',
                          background: 'hsl(213,100%,99%)',
                        }}
                      />
                      <p
                        className="text-xs text-right"
                        style={{
                          color: 'hsl(222,30%,65%)',
                          fontFamily: 'Nunito Sans, sans-serif',
                        }}
                      >
                        {context.length}/500
                      </p>
                    </div>

                    {/* Botão Gerar SOAP */}
                    <button
                      onClick={handleGenerateSOAP}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{
                        background:
                          'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
                        boxShadow: '0 6px 24px -6px hsla(221,73%,45%,0.45)',
                        fontFamily: 'Nunito Sans, sans-serif',
                      }}
                    >
                      Gerar SOAP
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceConsultationPage;
