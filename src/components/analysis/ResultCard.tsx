import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { ResultadoItem } from "./AnalysisResults";

// ========== Circular Progress Component ==========
interface CircularProgressProps {
  value: number;
  maxValue?: number;
  status: 'normal' | 'alto' | 'baixo';
  unit: string;
}

const CircularProgress = ({ value, maxValue, status, unit }: CircularProgressProps) => {
  // Calculate percentage - if no maxValue, show 100%
  const percentage = maxValue && maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 100;
  
  // SVG circle parameters
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Color based on status
  const getColor = () => {
    if (status === 'normal') return 'hsl(var(--chart-2))'; // Green
    return 'hsl(var(--destructive))'; // Red for alto/baixo
  };
  
  const getBgColor = () => {
    if (status === 'normal') return 'hsl(var(--chart-2) / 0.15)';
    return 'hsl(var(--destructive) / 0.15)';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getBgColor()}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center value */}
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className={`text-xl font-bold ${status === 'normal' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
          {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 2) : value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
};

// ========== Result Card Component ==========
interface ResultCardProps {
  item: ResultadoItem;
}

export const ResultCard = ({ item }: ResultCardProps) => {
  const getStatusBadge = () => {
    switch (item.status) {
      case 'normal':
        return <Badge className="bg-chart-2 hover:bg-chart-2/90 text-primary-foreground">Normal</Badge>;
      case 'alto':
        return <Badge variant="destructive">Alto</Badge>;
      case 'baixo':
        return <Badge variant="destructive">Baixo</Badge>;
      default:
        return null;
    }
  };

  const hasReference = item.ref_min !== undefined || item.ref_max !== undefined;
  const referenceText = hasReference 
    ? `${item.ref_min ?? '-'} a ${item.ref_max ?? '-'} ${item.unidade}`
    : 'Sem referência';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-foreground truncate pr-2">{item.parametro}</h3>
        {getStatusBadge()}
      </div>
      
      {/* Center - Circular Progress */}
      <CardContent className="flex justify-center py-6 relative">
        <CircularProgress
          value={item.valor_encontrado}
          maxValue={item.ref_max}
          status={item.status}
          unit={item.unidade}
        />
      </CardContent>
      
      {/* Footer - Reference & AI Insight */}
      <div className="px-4 pb-4 space-y-3">
        {/* Reference Range */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Referência: <span className="font-medium">{referenceText}</span>
          </p>
        </div>
        
        {/* AI Explanation */}
        {item.explicacao_curta && (
          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.explicacao_curta}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResultCard;
