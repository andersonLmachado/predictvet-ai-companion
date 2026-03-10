import React, { useCallback, useRef, useState } from 'react';
import { AlertCircle, Mic, MicOff } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// ─── SpeechRecognition browser types ───────────────────────────────────────
interface SpeechRecognitionResultItem {
  transcript: string;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionResultItem;
  length: number;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
// ────────────────────────────────────────────────────────────────────────────

const getSpeechRecognitionConstructor = ():
  | (new () => SpeechRecognitionInstance)
  | null => {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance })
      .SpeechRecognition ??
    (
      window as unknown as {
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      }
    ).webkitSpeechRecognition ??
    null
  );
};

const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
const hasSpeechRecognition = SpeechRecognitionCtor !== null;

// ────────────────────────────────────────────────────────────────────────────

export interface NarrativeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const NarrativeInput: React.FC<NarrativeInputProps> = ({
  value,
  onChange,
  placeholder = 'Descreva com suas palavras o que está sentindo o animal...',
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcripts: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcripts.push(event.results[i][0].transcript);
      }
      const newText = transcripts.join(' ').trim();
      if (newText) {
        onChange(value ? `${value} ${newText}` : newText);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [value, onChange]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const toggleMic = () => {
    if (disabled) return;
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <div className="space-y-3">
      {/* Row: label + Whisper pending badge */}
      <div className="flex items-center justify-between">
        <label
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          Relato do Tutor
        </label>

        {/* ── Whisper/n8n flag ─────────────────────────────────────────── */}
        <span
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
          style={{
            background: 'hsl(38,88%,96%)',
            color: 'hsl(38,70%,38%)',
            border: '1px solid hsl(38,60%,82%)',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          <AlertCircle className="w-3 h-3" />
          Whisper/n8n — pendente
        </span>
        {/* ─────────────────────────────────────────────────────────────── */}
      </div>

      {/* Textarea with floating mic button */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          disabled={disabled}
          className="rounded-xl text-sm resize-none pr-14"
          style={{
            borderColor: isListening ? 'hsl(221,73%,45%)' : 'hsl(217,50%,85%)',
            fontFamily: 'Nunito Sans, sans-serif',
            background: disabled ? 'hsl(217,50%,97%)' : 'hsl(213,100%,99%)',
            boxShadow: isListening ? '0 0 0 3px hsla(221,73%,45%,0.15)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />

        {/* Mic button */}
        <button
          type="button"
          onClick={toggleMic}
          disabled={!hasSpeechRecognition || disabled}
          title={
            !hasSpeechRecognition
              ? 'Reconhecimento de voz indisponível neste navegador (use Chrome ou Edge)'
              : isListening
                ? 'Parar gravação'
                : 'Iniciar ditado por voz (pt-BR)'
          }
          className="absolute bottom-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: disabled || !hasSpeechRecognition
              ? 'hsl(217,50%,91%)'
              : isListening
                ? 'hsl(352,76%,44%)'
                : 'hsl(221,73%,45%)',
            color:
              disabled || !hasSpeechRecognition ? 'hsl(222,30%,65%)' : 'white',
            cursor: disabled || !hasSpeechRecognition ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {isListening ? (
            <MicOff className="w-4 h-4 animate-pulse" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <p
          className="text-xs flex items-center gap-1.5"
          style={{ color: 'hsl(221,73%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full pl-pulse-ring"
            style={{ background: 'hsl(352,76%,44%)' }}
          />
          Gravando... fale naturalmente em português
        </p>
      )}

      {/* Browser support warning */}
      {!hasSpeechRecognition && (
        <p
          className="text-xs"
          style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          Ditado por voz indisponível neste navegador. Use Chrome ou Edge para ativar.
        </p>
      )}
    </div>
  );
};

export default NarrativeInput;
