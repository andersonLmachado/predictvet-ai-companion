import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Brain, AlertCircle } from "lucide-react";
import { ResultCard } from "./ResultCard";
import { BloodSeriesCharts } from "./BloodSeriesCharts";

// ========== Types ==========
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
  resultados?: ResultadoItem[];
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

      {/* No Data Message - Only if resultados is empty */}
      {!hasResultados && (
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Dados não encontrados</AlertTitle>
          <AlertDescription>
            Nenhum resultado de exame foi encontrado na resposta da análise.
          </AlertDescription>
        </Alert>
      )}

      {/* Section 1: Card Grid - BloodGPT Style */}
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

      {/* Section 2: Classic Charts - Blood Series */}
      {hasResultados && (
        <BloodSeriesCharts resultados={result.resultados!} />
      )}
    </div>
  );
};

export default AnalysisResults;
