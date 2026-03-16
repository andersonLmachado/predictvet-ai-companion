import React, { useState } from 'react';
import { SkipForward } from 'lucide-react';
import type { FollowUpAnswer } from '@/lib/anamnesisApi';
import { useDynamicAnamnesis } from '@/hooks/useDynamicAnamnesis';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  transcription: string;
  onFinish: (answers: FollowUpAnswer[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ANSWER_OPTIONS = ['Sim', 'Não', 'Não sei'] as const;
type AnswerOption = (typeof ANSWER_OPTIONS)[number];

// ─── Component ────────────────────────────────────────────────────────────────

const DynamicAnamnesisStep: React.FC<Props> = ({ transcription, onFinish }) => {
  const { phase, questions, currentIndex, respondAnswer, skip } = useDynamicAnamnesis(
    transcription,
    onFinish
  );
  const [selected, setSelected] = useState<AnswerOption | null>(null);
  const [detail, setDetail] = useState('');

  const handleAnswer = () => {
    if (!selected) return;
    const fullAnswer = detail.trim() ? `${selected} — ${detail.trim()}` : selected;
    respondAnswer(fullAnswer);
    setSelected(null);
    setDetail('');
  };

  const handleSkip = () => {
    skip();
    setSelected(null);
    setDetail('');
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <span
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'hsl(217,50%,85%)',
            borderTopColor: 'hsl(221,73%,45%)',
          }}
        />
        <p
          className="text-sm"
          style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          Identificando categorias clínicas...
        </p>
      </div>
    );
  }

  // ── Submitting ─────────────────────────────────────────────────────────────
  if (phase === 'submitting' || phase === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <span
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'hsl(217,50%,85%)',
            borderTopColor: 'hsl(221,73%,45%)',
          }}
        />
        <p
          className="text-sm"
          style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          Finalizando anamnese...
        </p>
      </div>
    );
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  const current = questions[currentIndex];
  const total = questions.length;
  const progress = (currentIndex / total) * 100;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            Aprofundamento clínico
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            Pergunta {currentIndex + 1} de {total}
          </p>
        </div>

        <button
          onClick={handleSkip}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: 'white',
            border: '1px solid hsl(217,50%,85%)',
            color: 'hsl(222,30%,55%)',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          <SkipForward className="w-3.5 h-3.5" />
          Pular
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'hsl(217,50%,93%)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background:
              'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
          }}
        />
      </div>

      {/* Question text */}
      <p
        className="text-base font-semibold leading-relaxed"
        style={{ color: 'hsl(222,77%,15%)', fontFamily: 'Sora, sans-serif' }}
      >
        {current?.pergunta}
      </p>

      {/* Answer options */}
      <div className="flex gap-2 flex-wrap">
        {ANSWER_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(selected === option ? null : option)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background:
                selected === option
                  ? 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)'
                  : 'white',
              color: selected === option ? 'white' : 'hsl(222,30%,50%)',
              border: `1px solid ${selected === option ? 'transparent' : 'hsl(217,50%,85%)'}`,
              boxShadow:
                selected === option ? '0 6px 24px -6px hsla(221,73%,45%,0.45)' : 'none',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Optional detail */}
      {selected && (
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            Detalhe (opcional)
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Adicione mais informações se necessário..."
            rows={2}
            className="w-full rounded-xl text-sm resize-none p-3 outline-none"
            style={{
              border: '1px solid hsl(217,50%,85%)',
              fontFamily: 'Nunito Sans, sans-serif',
              background: 'hsl(213,100%,99%)',
              color: 'hsl(222,77%,15%)',
              transition: 'border-color 0.2s',
            }}
          />
        </div>
      )}

      {/* Confirm button */}
      <div className="flex justify-end pt-1">
        <button
          onClick={handleAnswer}
          disabled={!selected}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: selected
              ? 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))'
              : 'hsl(217,50%,80%)',
            boxShadow: selected ? '0 6px 24px -6px hsla(221,73%,45%,0.45)' : 'none',
            cursor: selected ? 'pointer' : 'not-allowed',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default DynamicAnamnesisStep;
