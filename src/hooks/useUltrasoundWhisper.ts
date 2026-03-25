// src/hooks/useUltrasoundWhisper.ts
import { useCallback, useRef, useState } from 'react';

const WEBHOOK_URL = import.meta.env.VITE_N8N_ULTRASOUND_WEBHOOK_URL as
  | string
  | undefined;

export interface UseUltrasoundWhisperOptions {
  onTranscription: (organ: string, transcript: string) => void;
}

export interface UseUltrasoundWhisperReturn {
  isRecording: boolean;
  isProcessing: boolean;
  currentOrgan: string | null;
  webhookConfigured: boolean;
  startRecording: (organ: string) => Promise<void>;
  stopRecording: () => void;
}

export function useUltrasoundWhisper({
  onTranscription,
}: UseUltrasoundWhisperOptions): UseUltrasoundWhisperReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrgan, setCurrentOrgan] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentOrganRef = useRef<string | null>(null);

  const webhookConfigured = Boolean(WEBHOOK_URL);

  const processAudio = useCallback(
    async (blob: Blob, organ: string) => {
      if (!WEBHOOK_URL) return;
      setIsProcessing(true);
      try {
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach((b) => { binary += String.fromCharCode(b); });
        const base64 = btoa(binary);

        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64, organ }),
        });

        if (!response.ok) return;

        const data = await response.json();
        const transcript =
          typeof data?.transcription === 'string' ? data.transcription : '';
        if (transcript) onTranscription(organ, transcript);
      } catch {
        // Silent fail — vet can type manually
      } finally {
        setIsProcessing(false);
      }
    },
    [onTranscription],
  );

  const startRecording = useCallback(
    async (organ: string) => {
      if (!webhookConfigured || isRecording) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        currentOrganRef.current = organ;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const organAtStop = currentOrganRef.current;
          if (organAtStop) await processAudio(blob, organAtStop);
          setCurrentOrgan(null);
          currentOrganRef.current = null;
        };

        mediaRecorder.start();
        setCurrentOrgan(organ);
        setIsRecording(true);
      } catch {
        // Microphone permission denied — fail silently
      }
    },
    [webhookConfigured, isRecording, processAudio],
  );

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    currentOrgan,
    webhookConfigured,
    startRecording,
    stopRecording,
  };
}
