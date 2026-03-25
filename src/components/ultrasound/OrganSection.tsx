// src/components/ultrasound/OrganSection.tsx
import React from 'react';
import { Mic, MicOff, Loader2, CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OrganSectionProps {
  organKey: string;
  title: string;
  status: 'empty' | 'normal' | 'abnormal';
  children: React.ReactNode;
  notes: string;
  onNotesChange: (v: string) => void;
  onMicClick: () => void;
  isRecordingThis: boolean;
  isProcessing: boolean;
  micDisabled: boolean;
}

const StatusIcon: React.FC<{ status: 'empty' | 'normal' | 'abnormal' }> = ({ status }) => {
  if (status === 'normal') return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
  if (status === 'abnormal') return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
  return <Circle className="w-4 h-4 text-slate-300 shrink-0" />;
};

const OrganSection: React.FC<OrganSectionProps> = ({
  organKey,
  title,
  status,
  children,
  notes,
  onNotesChange,
  onMicClick,
  isRecordingThis,
  isProcessing,
  micDisabled,
}) => (
  <AccordionItem value={organKey} className="border rounded-xl px-1">
    <AccordionTrigger className="px-3 hover:no-underline">
      <div className="flex items-center gap-2 flex-1">
        <StatusIcon status={status} />
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,30%,30%)' }}
        >
          {title}
        </span>
      </div>
      {/* Mic button inside trigger — stopPropagation prevents accordion toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMicClick(); }}
            disabled={micDisabled || isProcessing}
            className="ml-2 mr-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
            style={{
              background: micDisabled || isProcessing
                ? 'hsl(217,50%,91%)'
                : isRecordingThis
                  ? 'hsl(352,76%,44%)'
                  : 'hsl(221,73%,45%)',
              color: micDisabled || isProcessing ? 'hsl(222,30%,65%)' : 'white',
              cursor: micDisabled || isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            {isProcessing && isRecordingThis ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isRecordingThis ? (
              <MicOff className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {micDisabled
            ? 'Transcrição por voz não configurada'
            : isRecordingThis
              ? 'Parar gravação'
              : `Ditar medidas de ${title.toLowerCase()} por voz`}
        </TooltipContent>
      </Tooltip>
    </AccordionTrigger>

    <AccordionContent className="px-3 pb-4">
      <div className="grid grid-cols-2 gap-3 mb-3">{children}</div>
      <Textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Observações adicionais (opcional)..."
        rows={2}
        className="text-xs resize-none"
        style={{ fontFamily: 'Nunito Sans, sans-serif', borderColor: 'hsl(217,50%,85%)' }}
      />
    </AccordionContent>
  </AccordionItem>
);

export default OrganSection;
