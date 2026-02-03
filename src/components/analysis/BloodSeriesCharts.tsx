import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { Activity, Droplets } from "lucide-react";
import type { ExamResultItem } from "./AnalysisResults";

// Parameters for Red Blood Cell Series
const RED_SERIES_PARAMS = [
  "eritrócitos", "eritrocitos", "hemácias", "hemacias",
  "hemoglobina", "hb",
  "hematócrito", "hematocrito", "ht", "htc",
  "vcm", "vgm",
  "hcm", "chcm", "chgm",
  "rdw"
];

// Parameters for White Blood Cell Series
const WHITE_SERIES_PARAMS = [
  "leucócitos", "leucocitos", "wbc",
  "neutrófilos", "neutrofilos", "segmentados",
  "bastonetes", "bastões", "bastoes",
  "linfócitos", "linfocitos",
  "monócitos", "monocitos",
  "eosinófilos", "eosinofilos",
  "basófilos", "basofilos",
  "plaquetas", "plt"
];

const matchesParam = (parametro: string, patterns: string[]): boolean => {
  const normalized = parametro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return patterns.some(p => normalized.includes(p.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
};

interface BloodSeriesChartsProps {
  resultados: ExamResultItem[];
}

export const BloodSeriesCharts = ({ resultados }: BloodSeriesChartsProps) => {
  // Filter results for each series
  const redSeriesData = resultados.filter(r => matchesParam(r.parametro, RED_SERIES_PARAMS));
  const whiteSeriesData = resultados.filter(r => matchesParam(r.parametro, WHITE_SERIES_PARAMS));

  const hasRedSeries = redSeriesData.length > 0;
  const hasWhiteSeries = whiteSeriesData.length > 0;

  if (!hasRedSeries && !hasWhiteSeries) {
    return null; // Silently hide if no blood parameters found
  }

  const chartConfig = {
    value: { label: "Valor", color: "hsl(var(--chart-1))" },
    normal: { label: "Normal", color: "hsl(var(--chart-2))" },
    altered: { label: "Alterado", color: "hsl(var(--destructive))" },
  };

  const formatChartData = (data: ExamResultItem[]) => {
    return data.map(item => {
      const numericValue = typeof item.valor_encontrado === "number" 
        ? item.valor_encontrado 
        : parseFloat(String(item.valor_encontrado)) || 0;
      
      return {
        name: item.parametro.length > 12 ? item.parametro.substring(0, 10) + "..." : item.parametro,
        fullName: item.parametro,
        value: numericValue,
        refMin: item.ref_min,
        refMax: item.ref_max,
        unit: item.unidade,
        status: item.status,
      };
    });
  };

  const getBarColor = (status: string) => {
    if (status === "normal") return "hsl(var(--chart-2))";
    if (status === "baixo") return "#20b2aa";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        Gráficos Clássicos
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Red Blood Cell Series */}
        {hasRedSeries && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-4 w-4 text-destructive" />
                Série Vermelha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={formatChartData(redSeriesData)} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value, name, item) => (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.payload.fullName}</span>
                            <span>{value} {item.payload.unit}</span>
                            {item.payload.refMin !== null && item.payload.refMax !== null && (
                              <span className="text-xs text-muted-foreground">
                                Ref: {item.payload.refMin} - {item.payload.refMax}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {formatChartData(redSeriesData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* White Blood Cell Series */}
        {hasWhiteSeries && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Série Branca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={formatChartData(whiteSeriesData)} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value, name, item) => (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.payload.fullName}</span>
                            <span>{value} {item.payload.unit}</span>
                            {item.payload.refMin !== null && item.payload.refMax !== null && (
                              <span className="text-xs text-muted-foreground">
                                Ref: {item.payload.refMin} - {item.payload.refMax}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {formatChartData(whiteSeriesData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BloodSeriesCharts;
