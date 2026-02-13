import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SOAPCardProps {
  letter: string;
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  accentColor: string;
  icon: React.ReactNode;
}

const SOAPCard: React.FC<SOAPCardProps> = ({
  letter,
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  accentColor,
  icon,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast({
        title: 'Permissão negada',
        description: 'Habilite o acesso ao microfone para gravar áudio.',
        variant: 'destructive',
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('section', letter);
      formData.append('existing_text', value);

      const response = await fetch('https://vet-api.predictlab.com.br/webhook/soap-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro no processamento');

      const contentType = response.headers.get('content-type');
      let transcribedText: string;

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        transcribedText = data.text || data.output || data.result || '';
      } else {
        transcribedText = await response.text();
      }

      if (transcribedText.trim()) {
        onChange(value ? `${value}\n${transcribedText.trim()}` : transcribedText.trim());
      }
    } catch {
      toast({
        title: 'Erro ao processar áudio',
        description: 'Não foi possível transcrever o áudio. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: accentColor }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {letter}
          </span>
          <div className="flex-1">
            <span className="font-semibold">{title}</span>
            <p className="text-xs font-normal text-muted-foreground">{subtitle}</p>
          </div>
          <span className="text-muted-foreground">{icon}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] resize-none pr-14 text-sm"
          disabled={isProcessing}
        />
        {/* Floating mic button */}
        <div className="absolute bottom-8 right-8">
          {isProcessing ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className={`h-10 w-10 rounded-full shadow-md transition-all ${
                isRecording
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600 hover:text-white animate-pulse'
                  : 'hover:border-primary hover:text-primary'
              }`}
              style={!isRecording ? { borderColor: accentColor, color: accentColor } : {}}
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
        </div>
        {isProcessing && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
            <Loader2 className="h-3 w-3 animate-spin" />
            IA está processando o áudio...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SOAPCard;
