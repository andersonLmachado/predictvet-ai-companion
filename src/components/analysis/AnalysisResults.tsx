import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Brain } from "lucide-react";
import { ResultCard } from "./ResultCard";
import { BloodSeriesCharts } from "./BloodSeriesCharts";
import { UrinalysisCharts } from "./UrinalysisCharts";

// ========== Types ==========
export interface ResultadoItem {
  parametro: string;
  valor_encontrado: number | string;
  unidade: string;
  ref_min: number | null;
  ref_max: number | null;
  status: "normal" | "alto" | "baixo";
  explicacao_curta: string;
}

export interface AnalysisResponse {
  resumo_clinico: string;
  resultados: ResultadoItem[];
}

// ========== Main Component ==========
interface AnalysisResultsProps {
  result: AnalysisResponse;
}

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  const hasResultados = result.resultados && result.resultados.length > 0;
  const resumo = result.resumo_clinico;

  return (
    <div className="space-y-8">
      {/* Section A: Clinical Summary */}
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

      {/* Section B: Card Grid - BloodGPT Style */}
      {hasResultados && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Insights Detalhados</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {result.resultados.map((item, index) => (
              <ResultCard key={`${item.parametro}-${index}`} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Section C: Traditional Charts */}
      {hasResultados && (
        <>
          {/* Blood Series Charts */}
          <BloodSeriesCharts resultados={result.resultados} />
          
          {/* Urinalysis Charts */}
          <UrinalysisCharts resultados={result.resultados} />
        </>
      )}
    </div>
  );
};

export default AnalysisResults;
