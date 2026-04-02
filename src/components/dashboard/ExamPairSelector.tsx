import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatExamDate } from '@/lib/examDate';

interface ExamOption {
  id: string;
  exam_date: string | null;
  created_at: string | null;
}

interface ExamPairSelectorProps {
  exams: ExamOption[];
  baseExamId: string | null;
  comparedExamId: string | null;
  onBaseChange: (id: string) => void;
  onComparedChange: (id: string) => void;
}

const ExamPairSelector: React.FC<ExamPairSelectorProps> = ({
  exams,
  baseExamId,
  comparedExamId,
  onBaseChange,
  onComparedChange,
}) => {
  const displayDate = (exam: ExamOption) =>
    formatExamDate(exam.exam_date ?? exam.created_at ?? null);

  return (
    <div className="flex items-end gap-3 flex-wrap">
      {/* Exame base */}
      <div className="flex flex-col gap-1.5">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          Exame base
        </span>
        <Select value={baseExamId ?? ''} onValueChange={onBaseChange}>
          <SelectTrigger
            className="h-9 rounded-xl text-sm min-w-[160px]"
            style={{
              borderColor: 'hsl(221,73%,55%)',
              background: 'hsl(221,73%,97%)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {exams.map(exam => (
              <SelectItem key={exam.id} value={exam.id}>
                {displayDate(exam)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Separador */}
      <span
        className="text-sm font-bold pb-1.5"
        style={{ color: 'hsl(221,73%,45%)', fontFamily: 'Sora, sans-serif' }}
      >
        vs
      </span>

      {/* Exame comparado */}
      <div className="flex flex-col gap-1.5">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          Exame comparado
        </span>
        <Select value={comparedExamId ?? ''} onValueChange={onComparedChange}>
          <SelectTrigger
            className="h-9 rounded-xl text-sm min-w-[160px]"
            style={{
              borderColor: 'hsl(162,60%,45%)',
              background: 'hsl(162,60%,97%)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {exams.map(exam => (
              <SelectItem key={exam.id} value={exam.id}>
                {displayDate(exam)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ExamPairSelector;
