import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Save, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SOAPCardProps {
  letter: string;
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  accentColor: string;
  icon: React.ReactNode;
  patientId?: string;
  aiSuggestions?: string;
  onAiSuggestionsChange?: (value: string) => void;
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
  patientId,
  aiSuggestions,
  onAiSuggestionsChange,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      formData.append('file', blob, 'recording.webm');
      formData.append('block', letter);
      if (patientId) formData.append('patient_id', patientId);

      const response = await fetch('https://vet-api.predictlab.com.br/webhook/soap-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro no processamento');

      const contentType = response.headers.get('content-type');
      let transcribedText: string;
      let suggestions: string | undefined;
      let formattedText: string | undefined;

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        formattedText = typeof data.formattedText === 'string' ? data.formattedText : undefined;
        transcribedText = formattedText || data.text || data.output || data.result || '';
        suggestions = data.ai_suggestions || undefined;
      } else {
        transcribedText = await response.text();
      }

      if (transcribedText.trim()) {
        const nextText = transcribedText.trim();
        if (formattedText) {
          onChange(nextText);
        } else {
          onChange(value ? `${value}\n${nextText}` : nextText);
        }
      }

      if (suggestions && onAiSuggestionsChange) {
        onAiSuggestionsChange(suggestions);
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

  const handleSave = async () => {
    if (!patientId) {
      toast({
        title: 'Paciente não selecionado',
        description: 'Selecione um paciente antes de salvar o registro.',
        variant: 'destructive',
      });
      return;
    }

    if (!value.trim()) {
      toast({
        title: 'Campo vazio',
        description: 'Preencha o campo antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('medical_consultations')
        .upsert(
          {
            patient_id: patientId,
            soap_block: letter,
            content: value.trim(),
            ...(letter === 'P' && aiSuggestions ? { ai_suggestions: aiSuggestions } : {}),
          },
          { onConflict: 'patient_id,soap_block' }
        );

      if (error) throw error;

      toast({
        title: 'Prontuário atualizado com sucesso!',
        description: `Bloco ${letter} salvo para o paciente.`,
      });
    } catch (err: any) {
      // Fallback: try insert if upsert fails
      try {
        const { error: insertError } = await supabase
          .from('medical_consultations')
          .insert({
            patient_id: patientId,
            soap_block: letter,
            content: value.trim(),
            ...(letter === 'P' && aiSuggestions ? { ai_suggestions: aiSuggestions } : {}),
          });

        if (insertError) throw insertError;

        toast({
          title: 'Prontuário atualizado com sucesso!',
          description: `Bloco ${letter} salvo para o paciente.`,
        });
      } catch {
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar o registro. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
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
      <CardContent className="relative space-y-3">
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[120px] resize-none pr-14 text-sm"
            disabled={isProcessing}
          />
          {/* Floating mic button */}
          <div className="absolute bottom-3 right-3">
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
        </div>
        {isProcessing && (
          <p className="flex items-center gap-1.5 text-xs text-primary">
            <Loader2 className="h-3 w-3 animate-spin" />
            IA está processando o áudio...
          </p>
        )}

        {/* AI Suggestions - only for P block */}
        {letter === 'P' && aiSuggestions && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Sugestões da IA
              </span>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
              {aiSuggestions}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          onClick={handleSave}
          disabled={isSaving || !value.trim()}
          className="gap-2"
          style={{ backgroundColor: accentColor }}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Registro
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SOAPCard;
