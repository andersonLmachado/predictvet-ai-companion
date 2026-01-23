import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Droplets, FlaskConical, Microscope, AlertCircle, CheckCircle2 } from "lucide-react";

// Types for Urinalysis Response
export interface ExameFisico {
  densidade: number;
  cor: string;
  aspecto: string;
}

export interface ExameQuimico {
  glicose_score: number;
  proteina_score: number;
  ph: number;
  urobilinogenio_score: number;
  nitrito_score: number;
  leucocitos_score: number;
  sangue_score: number;
  bilirrubina_score: number;
  densidade_score: number;
  acetona_score: number;
}

export interface Sedimentoscopia {
  leucocitos_campo: number;
  hemacias_campo: number;
  bacterias_score: number;
  cristais_score: number;
  cilindros_score: number;
  celulas_epiteliais_score: number;
}

export interface UrinalysisResponse {
  exame_fisico: ExameFisico;
  exame_quimico: ExameQuimico;
  sedimentoscopia: Sedimentoscopia;
  analise_clinica?: string;
  alertas?: string[];
}

// Gauge Chart Component
const GaugeChart = ({ value, min = 1000, max = 1060 }: { value: number; min?: number; max?: number }) => {
  const safeMin = 1015;
  const safeMax = 1045;
  
  // Calculate percentage position (0-100)
  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // Determine if value is in safe range
  const isInSafeRange = value >= safeMin && value <= safeMax;
  
  // Calculate safe zone positions
  const safeStartPercent = ((safeMin - min) / (max - min)) * 100;
  const safeEndPercent = ((safeMax - min) / (max - min)) * 100;
  
  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 120" className="w-full">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="16"
          strokeLinecap="round"
        />
        
        {/* Danger zone left (low) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--destructive) / 0.3)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${safeStartPercent * 2.51} 1000`}
        />
        
        {/* Safe zone (green) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--chart-2))"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(safeEndPercent - safeStartPercent) * 2.51} 1000`}
          strokeDashoffset={`-${safeStartPercent * 2.51}`}
        />
        
        {/* Danger zone right (high) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--destructive) / 0.3)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(100 - safeEndPercent) * 2.51} 1000`}
          strokeDashoffset={`-${safeEndPercent * 2.51}`}
        />
        
        {/* Needle */}
        <g transform={`rotate(${-90 + clampedPercentage * 1.8}, 100, 100)`}>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke={isInSafeRange ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx="100"
            cy="100"
            r="8"
            fill={isInSafeRange ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
          />
        </g>
        
        {/* Min/Max labels */}
        <text x="20" y="115" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">
          {min}
        </text>
        <text x="180" y="115" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">
          {max}
        </text>
      </svg>
      
      {/* Value display */}
      <div className="text-center -mt-4">
        <span className={`text-3xl font-bold ${isInSafeRange ? 'text-green-600' : 'text-destructive'}`}>
          {value}
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          Faixa normal: {safeMin} - {safeMax}
        </p>
      </div>
    </div>
  );
};

// Prepare chemical exam data for bar chart
const prepareChemicalData = (exame: ExameQuimico) => {
  const scoreLabels: Record<number, string> = {
    0: "Neg",
    1: "+",
    2: "++",
    3: "+++",
    4: "++++",
  };

  return [
    { name: "Glicose", value: exame.glicose_score, label: scoreLabels[exame.glicose_score] || "Neg" },
    { name: "Proteína", value: exame.proteina_score, label: scoreLabels[exame.proteina_score] || "Neg" },
    { name: "Leucócitos", value: exame.leucocitos_score, label: scoreLabels[exame.leucocitos_score] || "Neg" },
    { name: "Sangue", value: exame.sangue_score, label: scoreLabels[exame.sangue_score] || "Neg" },
    { name: "Nitrito", value: exame.nitrito_score, label: scoreLabels[exame.nitrito_score] || "Neg" },
    { name: "Bilirrubina", value: exame.bilirrubina_score, label: scoreLabels[exame.bilirrubina_score] || "Neg" },
    { name: "Acetona", value: exame.acetona_score, label: scoreLabels[exame.acetona_score] || "Neg" },
    { name: "Urobilinogênio", value: exame.urobilinogenio_score, label: scoreLabels[exame.urobilinogenio_score] || "Neg" },
  ];
};

// Status Indicator Component
const StatusIndicator = ({ 
  label, 
  value, 
  isAlert 
}: { 
  label: string; 
  value: string; 
  isAlert: boolean 
}) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
    isAlert 
      ? 'bg-destructive/10 border-destructive/30' 
      : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
  }`}>
    {isAlert ? (
      <AlertCircle className="h-5 w-5 text-destructive" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    )}
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className={`text-xs ${isAlert ? 'text-destructive' : 'text-green-600'}`}>
        {value}
      </p>
    </div>
  </div>
);

// Number Card Component
const NumberCard = ({ 
  label, 
  value, 
  unit, 
  icon: Icon 
}: { 
  label: string; 
  value: number | string; 
  unit?: string;
  icon?: React.ElementType;
}) => (
  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
    {Icon && <Icon className="h-8 w-8 text-primary" />}
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">
        {value}{unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </p>
    </div>
  </div>
);

interface UrinalysisResultsProps {
  result: UrinalysisResponse;
}

export const UrinalysisResults = ({ result }: UrinalysisResultsProps) => {
  const chemicalData = result.exame_quimico ? prepareChemicalData(result.exame_quimico) : [];

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {result.alertas && result.alertas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.alertas.map((alerta, index) => (
            <Badge key={index} variant="destructive" className="text-sm">
              {alerta}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* 1. Exame Físico - Gauge Chart */}
        {result.exame_fisico && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-600">
                <Droplets className="h-5 w-5" />
                Exame Físico
              </CardTitle>
              <CardDescription>Características físicas da urina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-center mb-2">Densidade</p>
                <GaugeChart value={result.exame_fisico.densidade} />
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Cor</p>
                  <p className="font-medium">{result.exame_fisico.cor}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Aspecto</p>
                  <p className="font-medium">{result.exame_fisico.aspecto}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. Exame Químico - Bar Chart */}
        {result.exame_quimico && (
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <FlaskConical className="h-5 w-5" />
                Exame Químico
              </CardTitle>
              <CardDescription>Análise bioquímica da urina</CardDescription>
              
              {/* pH Number Card */}
              <div className="mt-4">
                <NumberCard 
                  label="pH" 
                  value={result.exame_quimico.ph.toFixed(1)} 
                />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chemicalData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    domain={[0, 4]} 
                    ticks={[0, 1, 2, 3, 4]}
                    tickFormatter={(value) => {
                      const labels: Record<number, string> = { 0: "Neg", 1: "+", 2: "++", 3: "+++", 4: "++++" };
                      return labels[value] || value;
                    }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => {
                      const labels: Record<number, string> = { 0: "Negativo", 1: "+", 2: "++", 3: "+++", 4: "++++" };
                      return [labels[value] || value, "Resultado"];
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chemicalData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.value > 0 ? "hsl(var(--destructive))" : "hsl(var(--chart-2))"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 3. Sedimentoscopia */}
        {result.sedimentoscopia && (
          <Card className="lg:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Microscope className="h-5 w-5" />
                Sedimentoscopia
              </CardTitle>
              <CardDescription>Análise microscópica do sedimento urinário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Leucócitos por campo */}
                <div className="p-4 bg-muted/50 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-1">Leucócitos/Campo</p>
                  <p className="text-3xl font-bold text-foreground">
                    {result.sedimentoscopia.leucocitos_campo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">células/campo</p>
                </div>
                
                {/* Hemácias por campo */}
                <div className="p-4 bg-muted/50 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-1">Hemácias/Campo</p>
                  <p className="text-3xl font-bold text-foreground">
                    {result.sedimentoscopia.hemacias_campo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">células/campo</p>
                </div>
                
                {/* Bactérias Status */}
                <StatusIndicator 
                  label="Bactérias" 
                  value={result.sedimentoscopia.bacterias_score > 0 ? "Presente" : "Ausente"}
                  isAlert={result.sedimentoscopia.bacterias_score > 0}
                />
                
                {/* Cristais Status */}
                <StatusIndicator 
                  label="Cristais" 
                  value={result.sedimentoscopia.cristais_score > 0 ? "Presente" : "Ausente"}
                  isAlert={result.sedimentoscopia.cristais_score > 0}
                />
                
                {/* Cilindros Status */}
                <StatusIndicator 
                  label="Cilindros" 
                  value={result.sedimentoscopia.cilindros_score > 0 ? "Presente" : "Ausente"}
                  isAlert={result.sedimentoscopia.cilindros_score > 0}
                />
                
                {/* Células Epiteliais Status */}
                <StatusIndicator 
                  label="Células Epiteliais" 
                  value={result.sedimentoscopia.celulas_epiteliais_score > 0 ? "Presente" : "Ausente"}
                  isAlert={result.sedimentoscopia.celulas_epiteliais_score > 0}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análise Clínica */}
      {result.analise_clinica && (
        <Card>
          <CardHeader>
            <CardTitle>Laudo da IA</CardTitle>
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

export default UrinalysisResults;
