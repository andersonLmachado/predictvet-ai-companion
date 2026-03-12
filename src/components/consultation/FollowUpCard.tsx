import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Complaint } from './ComplaintSelector';

interface FollowUpCardProps {
  complaint: Complaint;
  onAnswer: (answer: string) => void;
}

const FollowUpCard: React.FC<FollowUpCardProps> = ({ complaint, onAnswer }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
    setTimeout(() => onAnswer(option), 250);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Complaint badge */}
      <div className="flex items-center gap-2">
        <span
          className="inline-block text-xs font-semibold px-3 py-1 rounded-lg"
          style={{
            background: 'hsl(217,100%,95%)',
            color: 'hsl(221,73%,45%)',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          {complaint.topic}
        </span>
      </div>

      {/* Question card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'white',
          border: '1px solid hsl(217,50%,90%)',
          boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
        }}
      >
        <div
          className="h-1.5"
          style={{
            background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 80%, hsl(18,76%,50%) 100%)',
          }}
        />
        <div className="p-6 space-y-6">
          <h3
            className="text-lg font-semibold leading-relaxed"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
          >
            {complaint.followup}
          </h3>

          <div className="flex flex-wrap gap-2">
            {complaint.options.map((option) => {
              const isSelected = selected === option;
              const isPrimary = option === 'Sim' || option === 'Não';

              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    fontFamily: 'Nunito Sans, sans-serif',
                    background: isSelected
                      ? 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))'
                      : isPrimary
                        ? 'hsl(217,100%,97%)'
                        : 'white',
                    color: isSelected
                      ? 'white'
                      : isPrimary
                        ? 'hsl(221,73%,45%)'
                        : 'hsl(222,30%,50%)',
                    border: `1px solid ${isSelected ? 'transparent' : isPrimary ? 'hsl(217,70%,80%)' : 'hsl(217,50%,88%)'}`,
                    boxShadow: isSelected
                      ? '0 4px 16px -4px hsla(221,73%,45%,0.4)'
                      : 'none',
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p
        className="text-xs text-center flex items-center justify-center gap-1"
        style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}
      >
        <ArrowRight className="w-3 h-3" />
        Selecione uma resposta para avançar
      </p>
    </div>
  );
};

export default FollowUpCard;
