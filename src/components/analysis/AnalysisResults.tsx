import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Brain } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

export interface SerieVermelha {
  eritrocitos: number;
  hemoglobina: number;
  hematocrito: number;
}

export interface SerieBranca {
  leucocitos_totais: number;
  segmentados: number;
  linfocitos: number;
  eosinofilos: number;
  monocitos: number;
}

export interface AnalysisResponse {
  serie_vermelha: SerieVermelha;
  serie_branca: SerieBranca;
  analise_clinica: string;
  alertas: string[];
}

const BAR_CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

const PIE_CHART_COLORS = [
  { name: "Segmentados", color: "#3b82f6" },
  { name: "Linfócitos", color: "#10b981" },
  { name: "Eosinófilos", color: "#f59e0b" },
  { name: "Monócitos", color: "#8b5cf6" },
];

const prepareBarChartData = (dados: SerieVermelha) => {
  return [
    { name: "Eritrócitos", value: dados.eritrocitos, unit: "M/µL" },
    { name: "Hemoglobina", value: dados.hemoglobina, unit: "g/dL" },
    { name: "Hematócrito", value: dados.hematocrito, unit: "%" },
  ];
};

const preparePieChartData = (dados: SerieBranca) => {
  const items = [
    { name: "Segmentados", value: dados.segmentados, color: "#3b82f6" },
    { name: "Linfócitos", value: dados.linfocitos, color: "#10b981" },
    { name: "Eosinófilos", value: dados.eosinofilos, color: "#f59e0b" },
    { name: "Monócitos", value: dados.monocitos, color: "#8b5cf6" },
  ];
  
  // Filter out items with value 0
  return items.filter(item => item.value > 0);
};

interface AnalysisResultsProps {
  result: AnalysisResponse;
}

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  const pieData = result.serie_branca ? preparePieChartData(result.serie_branca) : [];

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

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico Série Vermelha - Bar Chart */}
        {result.serie_vermelha && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Série Vermelha</CardTitle>
              <CardDescription>Eritrograma - valores do hemograma</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={prepareBarChartData(result.serie_vermelha)} layout="vertical">
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
                    {prepareBarChartData(result.serie_vermelha).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_CHART_COLORS[index % BAR_CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico Série Branca - Pie Chart */}
        {result.serie_branca && pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Série Branca</CardTitle>
              <CardDescription>Leucograma - distribuição de glóbulos brancos</CardDescription>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Leucócitos Totais</p>
                <p className="text-2xl font-bold text-foreground">
                  {result.serie_branca.leucocitos_totais.toLocaleString()} /µL
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()} /µL`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

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
