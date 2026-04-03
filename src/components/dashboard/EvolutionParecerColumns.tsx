import React from 'react';
import { classifyParams, ExamHistoryRow } from '@/lib/examComparison';

interface EvolutionParecerColumnsProps {
  baseExam: ExamHistoryRow;
  comparedExam: ExamHistoryRow;
}

interface ColumnProps {
  title: string;
  emoji: string;
  params: string[];
  bg: string;
  border: string;
  titleColor: string;
}

const Column: React.FC<ColumnProps> = ({ title, emoji, params, bg, border, titleColor }) => (
  <div
    className="rounded-xl p-3 flex-1 min-w-0"
    style={{ background: bg, border: `1px solid ${border}` }}
  >
    <p
      className="text-xs font-bold uppercase tracking-wide mb-2"
      style={{ color: titleColor, fontFamily: 'Sora, sans-serif' }}
    >
      {emoji} {title}
    </p>
    {params.length === 0 ? (
      <p className="text-xs italic" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
        —
      </p>
    ) : (
      params.map(p => (
        <p
          key={p}
          className="text-xs py-0.5"
          style={{ color: 'hsl(222,30%,35%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          {p}
        </p>
      ))
    )}
  </div>
);

const EvolutionParecerColumns: React.FC<EvolutionParecerColumnsProps> = ({
  baseExam,
  comparedExam,
}) => {
  const { improving, worsening, stable } = classifyParams(baseExam, comparedExam);

  return (
    <div className="flex gap-3 mb-4">
      <Column
        title="Melhora"
        emoji="🟢"
        params={improving}
        bg="hsl(162,60%,96%)"
        border="hsl(162,60%,82%)"
        titleColor="hsl(162,60%,30%)"
      />
      <Column
        title="Piora"
        emoji="🔴"
        params={worsening}
        bg="hsl(352,76%,97%)"
        border="hsl(352,76%,82%)"
        titleColor="hsl(352,76%,35%)"
      />
      <Column
        title="Estável"
        emoji="🟡"
        params={stable}
        bg="hsl(38,88%,97%)"
        border="hsl(38,88%,80%)"
        titleColor="hsl(38,60%,35%)"
      />
    </div>
  );
};

export default EvolutionParecerColumns;
