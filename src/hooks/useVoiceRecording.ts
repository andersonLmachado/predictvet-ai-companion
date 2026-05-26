import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Tipos exportados (testáveis em node) ────────────────────────────────────

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';
export type RecordingAction = 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'RESET' | 'ERROR';

export function recordingReducer(
  state: RecordingState,
  action: RecordingAction
): RecordingState {
  switch (action) {
    case 'START':  return state === 'idle'                          ? 'recording' : state;
    case 'PAUSE':  return state === 'recording'                    ? 'paused'    : state;
    case 'RESUME': return state === 'paused'                       ? 'recording' : state;
    case 'STOP':   return state === 'recording' || state === 'paused' ? 'stopped' : state;
    case 'RESET':  return 'idle';
    case 'ERROR':  return 'error';
    default:       return state;
  }
}

export const MAX_RECORDING_MS = 30 * 60 * 1000; // 30 minutos

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseVoiceRecordingReturn {
  state: RecordingState;
  duration: number;        // segundos
  audioBlob: Blob | null;
  audioUrl: string | null; // URL.createObjectURL — para <audio>
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  isSupported: boolean;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const isSupported =
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices;

  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const cancelledRef     = useRef(false); // previne onstop após reset()

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, []);

  const stop = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && (mr.state === 'recording' || mr.state === 'paused')) mr.stop();
    stopTimer();
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
    setState('stopped');
  }, [stopTimer]);

  const start = useCallback(async () => {
    if (!isSupported) {
      console.warn('[useVoiceRecording] MediaRecorder não suportado neste navegador.');
      setState('error');
      return;
    }
    try {
      cancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (cancelledRef.current) return; // reset() foi chamado
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url  = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(1000); // chunk a cada 1s
      setState('recording');
      startTimer();

      // Guard de duração máxima (30 min)
      maxTimerRef.current = setTimeout(() => {
        console.warn(
          '[useVoiceRecording] Duração máxima de 30 minutos atingida. Gravação encerrada automaticamente.'
        );
        stop();
      }, MAX_RECORDING_MS);
    } catch {
      setState('error');
    }
  }, [isSupported, startTimer, stop]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setState('paused');
    }
  }, [stopTimer]);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setState('recording');
    }
  }, [startTimer]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    stop();
    setAudioBlob(null);
    setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setDuration(0);
    setState('idle');
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopTimer();
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopTimer]);

  return { state, duration, audioBlob, audioUrl, start, pause, resume, stop, reset, isSupported };
}
