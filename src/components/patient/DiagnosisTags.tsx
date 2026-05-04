import React from 'react';
import { Badge } from '@/components/ui/badge';
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
    <div className="flex flex-wrap gap-1 mt-0.5">
      {visible.map((tag, i) => (
        <TooltipProvider key={i} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs font-normal px-1.5 py-0 h-5 cursor-default bg-muted text-muted-foreground hover:bg-muted"
              >
                {tag}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{tag}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {overflow > 0 && (
        <Badge
          variant="outline"
          className="text-xs font-normal px-1.5 py-0 h-5 cursor-default"
        >
          +{overflow}
        </Badge>
      )}
    </div>
  );
};

export default DiagnosisTags;
