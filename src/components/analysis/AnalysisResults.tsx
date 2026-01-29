import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Brain, AlertCircle, Sparkles } from "lucide-react";

// ========== New Card-Based Types ==========
export interface ResultadoItem {
  parametro: string;
  valor_encontrado: number;
  unidade: string;
  ref_min?: number;
  ref_max?: number;
  status: 'normal' | 'alto' | 'baixo';
  explicacao_curta?: string;
}

export interface Paciente {
  nome: string;
  especie: string;
  idade: string;
}

export interface AnalysisResponse {
  paciente?: Paciente;
  alertas?: string[];
  resumo_clinico?: string;
  analise_clinica?: string;
  analise_ia?: string;
  resultados?: ResultadoItem[];
  
  // Legacy support - will be ignored if resultados exists
  hemograma?: any;
  bioquimica?: any;
  urinalise?: any;
  tipo_exame?: string;
  serie_vermelha?: any;
  serie_branca?: any;
  dados_grafico?: any;
}

// ========== Circular Progress Component ==========
interface CircularProgressProps {
  value: number;
  maxValue?: number;
  status: 'normal' | 'alto' | 'baixo';
  label: string;
  unit: string;
}

const CircularProgress = ({ value, maxValue, status, label, unit }: CircularProgressProps) => {
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

const ResultCard = ({ item }: ResultCardProps) => {
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
          label={item.parametro}
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

// ========== Main Component ==========
interface AnalysisResultsProps {
  result: AnalysisResponse;
}

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  const hasResultados = result.resultados && result.resultados.length > 0;
  const resumo = result.resumo_clinico || result.analise_clinica || result.analise_ia;

  return (
    <div className="space-y-6">
      {/* Patient Info */}
      {result.paciente && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span><strong>Paciente:</strong> {result.paciente.nome}</span>
              <span><strong>Espécie:</strong> {result.paciente.especie}</span>
              <span><strong>Idade:</strong> {result.paciente.idade}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {result.alertas && result.alertas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Alertas</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.alertas.map((alerta, index) => (
                <Badge key={index} variant="destructive" className="text-sm">{alerta}</Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Clinical Summary - Highlighted at Top */}
      {resumo && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-2">Resumo Clínico</h2>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {resumo}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data Message */}
      {!hasResultados && (
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Dados não encontrados</AlertTitle>
          <AlertDescription>
            Nenhum resultado de exame foi encontrado na resposta da análise.
          </AlertDescription>
        </Alert>
      )}

      {/* Results Grid - Card-Based Layout */}
      {hasResultados && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Resultados do Exame</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {result.resultados!.map((item, index) => (
              <ResultCard key={`${item.parametro}-${index}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
