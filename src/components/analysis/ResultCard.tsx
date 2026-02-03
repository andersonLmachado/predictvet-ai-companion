import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import type { ExamResultItem } from "./AnalysisResults";

// ========== Circular Progress Component ==========
interface CircularProgressProps {
  value: number;
  maxValue: number | null;
  status: "normal" | "alto" | "baixo";
  displayValue: string;
  unit: string;
}

const CircularProgress = ({ value, maxValue, status, displayValue, unit }: CircularProgressProps) => {
  // Calculate percentage - if no maxValue, use double the value as max
  const effectiveMax = maxValue ?? value * 2;
  const percentage = effectiveMax > 0 ? Math.min((value / effectiveMax) * 100, 100) : 100;
  
  // SVG circle parameters
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Color based on status
  const getColor = () => {
    if (status === "normal") return "hsl(var(--chart-2))"; // Green
    if (status === "baixo") return "#20b2aa"; // Teal for baixo
    return "hsl(var(--destructive))"; // Red for alto
  };
  
  const getBgColor = () => {
    if (status === "normal") return "hsl(var(--chart-2) / 0.15)";
    if (status === "baixo") return "rgba(32, 178, 170, 0.15)"; // Teal background for baixo
    return "hsl(var(--destructive) / 0.15)";
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
        <span className={`text-xl font-bold ${status === "normal" ? "text-green-600 dark:text-green-400" : status === "baixo" ? "text-[#20b2aa]" : "text-destructive"}`}>
          {displayValue}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
};

// ========== Result Card Component ==========
interface ResultCardProps {
  item: ExamResultItem;
}

export const ResultCard = ({ item }: ResultCardProps) => {
  const getStatusBadge = () => {
    switch (item.status) {
      case "normal":
        return <Badge className="bg-chart-2 hover:bg-chart-2/90 text-primary-foreground">Normal</Badge>;
      case "alto":
        return <Badge variant="destructive">Alto</Badge>;
      case "baixo":
        return <Badge className="bg-[#20b2aa] hover:bg-[#20b2aa]/90 text-white">Baixo</Badge>;
      default:
        return null;
    }
  };

  // Handle both number and string values
  const numericValue = typeof item.valor_encontrado === "number" 
    ? item.valor_encontrado 
    : parseFloat(String(item.valor_encontrado)) || 0;
  
  const displayValue = typeof item.valor_encontrado === "number"
    ? item.valor_encontrado % 1 === 0 
      ? item.valor_encontrado.toString() 
      : item.valor_encontrado.toFixed(2)
    : String(item.valor_encontrado);

  const hasReference = item.ref_min !== null || item.ref_max !== null;
  const referenceText = hasReference 
    ? `${item.ref_min ?? "-"} a ${item.ref_max ?? "-"} ${item.unidade}`
    : "Sem referência";

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
          value={numericValue}
          maxValue={item.ref_max}
          status={item.status}
          displayValue={displayValue}
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
            <Brain className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
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
