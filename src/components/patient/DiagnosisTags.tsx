import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DiagnosisTagsProps {
  tags: string[];
  maxVisible?: number;
}

const DiagnosisTags: React.FC<DiagnosisTagsProps> = ({ tags, maxVisible = 2 }) => {
  if (tags.length === 0) return null;

  const visible = tags.slice(0, maxVisible);
  const overflow = tags.length - maxVisible;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap gap-1 mt-0.5">
        {visible.map((tag) => (
          <Tooltip key={tag}>
            <TooltipTrigger asChild>
              <span
                className="inline-flex items-center text-xs font-normal px-1.5 rounded-md cursor-default leading-5 h-5"
                style={{ background: 'hsl(217,100%,95%)', color: 'hsl(221,73%,45%)' }}
              >
                {tag}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{tag}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <span
            className="inline-flex items-center text-xs font-normal px-1.5 rounded-md cursor-default leading-5 h-5"
            style={{ background: 'hsl(217,100%,95%)', color: 'hsl(221,73%,45%)', opacity: 0.8 }}
          >
            +{overflow}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DiagnosisTags;
