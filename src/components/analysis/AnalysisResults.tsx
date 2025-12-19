import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export interface DadosGrafico {
  eritrocitos: number;
  hemoglobina: number;
  hematocrito: number;
  leucocitos: number;
}

export interface AnalysisResponse {
  dados_grafico: DadosGrafico;
  analise_clinica: string;
  alertas: string[];
}

interface AnalysisResultsProps {
  result: AnalysisResponse;
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const prepareChartData = (dados: DadosGrafico) => {
  return [
    { name: "Eritrócitos", value: dados.eritrocitos, unit: "M/µL" },
    { name: "Hemoglobina", value: dados.hemoglobina, unit: "g/dL" },
    { name: "Hematócrito", value: dados.hematocrito, unit: "%" },
    { name: "Leucócitos", value: dados.leucocitos / 1000, unit: "K/µL" },
  ];
};

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  return (
    <div className="space-y-6">
      {/* Alertas */}
      {result.alertas && result.alertas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Alertas</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.alertas.map((alerta, index) => (
                <Badge key={index} variant="destructive" className="text-sm">
                  {alerta}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Gráfico de Exames */}
      {result.dados_grafico && (
        <Card>
          <CardHeader>
            <CardTitle>Hemograma</CardTitle>
            <CardDescription>Visualização dos resultados laboratoriais</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChartData(result.dados_grafico)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(2)} ${props.payload.unit}`,
                    props.payload.name,
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {prepareChartData(result.dados_grafico).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Laudo da IA */}
      {result.analise_clinica && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Laudo da IA
            </CardTitle>
            <CardDescription>Análise clínica gerada por inteligência artificial</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {result.analise_clinica}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisResults;
