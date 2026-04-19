import React from 'react';
import { X, Check } from 'lucide-react';

const comparisons = [
  {
    before: 'Anamnese manual',
    after: 'Anamnese guiada em 3 min',
  },
  {
    before: 'Comparar laudos manualmente',
    after: 'Comparativo automático com linha de tendência',
  },
  {
    before: 'Laudo US manual',
    after: 'Roteiro guiado por voz/texto',
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 px-6 md:px-12" style={{ background: '#ffffff' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div
            className="text-xs font-semibold uppercase mb-3"
            style={{
              color: '#0F6E56',
              fontFamily: 'Nunito Sans, sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            O problema que resolvemos
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,12%)' }}
          >
            O veterinário perde tempo com papelada, não com o paciente
          </h2>
        </div>

        {/* Comparison rows */}
        <div>
          {comparisons.map(({ before, after }, i) => (
            <div
              key={before}
              className="py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
              style={{
                borderBottom:
                  i < comparisons.length - 1 ? '0.5px solid #e0e0e0' : 'none',
              }}
            >
              {/* Before */}
              <div className="flex items-center gap-3 sm:flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsla(0,72%,55%,0.1)' }}
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'hsl(0,72%,55%)' }} />
                </div>
                <span
                  className="text-sm"
                  style={{
                    color: 'hsl(222,30%,50%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {before}
                </span>
              </div>

              {/* Arrow */}
              <span
                className="hidden sm:block text-sm"
                style={{ color: 'hsl(222,30%,70%)' }}
              >
                →
              </span>

              {/* After */}
              <div className="flex items-center gap-3 sm:flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsla(162,70%,38%,0.1)' }}
                >
                  <Check className="w-3.5 h-3.5" style={{ color: '#0F6E56' }} />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: 'hsl(222,77%,12%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {after}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
