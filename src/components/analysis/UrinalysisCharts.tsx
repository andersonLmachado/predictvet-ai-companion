import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Droplet, FlaskConical } from "lucide-react";
import type { ResultadoItem } from "./AnalysisResults";

// Parameters for Urinalysis
const URINE_PARAMS = [
  "densidade", "ph",
  "proteína", "proteina", "proteínas", "proteinas",
  "glicose", "glucose",
  "cetona", "cetonas", "corpos cetônicos",
  "bilirrubina",
  "urobilinogênio", "urobilinogenio",
  "hemoglobina urinária", "sangue",
  "leucócitos urinários", "leucocitos urinarios",
  "nitrito", "nitritos",
  "cristais", "cilindros", "células epiteliais"
];

const matchesParam = (parametro: string, patterns: string[]): boolean => {
  const normalized = parametro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return patterns.some(p => normalized.includes(p.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
};

interface UrinalysisChartsProps {
  resultados: ResultadoItem[];
}

export const UrinalysisCharts = ({ resultados }: UrinalysisChartsProps) => {
  // Filter results for urinalysis
  const urineData = resultados.filter(r => matchesParam(r.parametro, URINE_PARAMS));

  // Specific parameters for gauge charts
  const densidadeItem = urineData.find(r => 
    r.parametro.toLowerCase().includes("densidade")
  );
  const phItem = urineData.find(r => 
    r.parametro.toLowerCase().includes("ph")
  );

  // Other urine parameters for bar chart
  const otherUrineData = urineData.filter(r => 
    !r.parametro.toLowerCase().includes("densidade") && 
    !r.parametro.toLowerCase().includes("ph")
  );

  const hasUrineData = urineData.length > 0;

  if (!hasUrineData) {
    return null; // Silently hide if no urine parameters found
  }

  const chartConfig = {
    value: { label: "Valor", color: "hsl(var(--chart-1))" },
    normal: { label: "Normal", color: "hsl(var(--chart-2))" },
    altered: { label: "Alterado", color: "hsl(var(--destructive))" },
  };

  const getBarColor = (status: string) => {
    return status === "normal" ? "hsl(var(--chart-2))" : "hsl(var(--destructive))";
  };

  // Gauge chart component for density and pH
  const GaugeChart = ({ item, minVal, maxVal, label }: { 
    item: ResultadoItem; 
    minVal: number; 
    maxVal: number;
    label: string;
  }) => {
    const numericValue = typeof item.valor_encontrado === "number" 
      ? item.valor_encontrado 
      : parseFloat(String(item.valor_encontrado)) || 0;
    
    const percentage = ((numericValue - minVal) / (maxVal - minVal)) * 100;
    const gaugeData = [{ value: Math.min(Math.max(percentage, 0), 100), fill: getBarColor(item.status) }];

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <ChartContainer config={chartConfig} className="h-[150px] w-full">
            <RadialBarChart 
              innerRadius="60%" 
              outerRadius="100%" 
              data={gaugeData}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
              />
            </RadialBarChart>
          </ChartContainer>
          <div className="text-center -mt-8">
            <span className={`text-2xl font-bold ${item.status === "normal" ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {typeof item.valor_encontrado === "number" ? item.valor_encontrado.toFixed(3) : item.valor_encontrado}
            </span>
            <span className="text-sm text-muted-foreground ml-1">{item.unidade}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ref: {item.ref_min ?? minVal} - {item.ref_max ?? maxVal}
          </p>
        </CardContent>
      </Card>
    );
  };

  const formatChartData = (data: ResultadoItem[]) => {
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Droplet className="h-5 w-5 text-primary" />
        Urinálise
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Density Gauge */}
        {densidadeItem && (
          <GaugeChart 
            item={densidadeItem} 
            minVal={1.000} 
            maxVal={1.060} 
            label="Densidade"
          />
        )}

        {/* pH Gauge */}
        {phItem && (
          <GaugeChart 
            item={phItem} 
            minVal={4.5} 
            maxVal={9.0} 
            label="pH Urinário"
          />
        )}

        {/* Other Parameters Bar Chart */}
        {otherUrineData.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Outros Parâmetros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={formatChartData(otherUrineData)} layout="vertical" margin={{ left: 0, right: 20 }}>
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
                    {formatChartData(otherUrineData).map((entry, index) => (
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

export default UrinalysisCharts;
