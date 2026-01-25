import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Brain, Droplets, FlaskConical, Microscope, AlertCircle, CheckCircle2, TestTube, Activity } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

// ========== HEMOGRAMA Types ==========
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

export interface HemogramaData {
  existe: boolean;
  serie_vermelha?: SerieVermelha;
  serie_branca?: SerieBranca;
}

// ========== BIOQUIMICA Types ==========
export interface BioquimicaData {
  existe: boolean;
  creatinina?: number;
  ureia?: number;
  alt?: number;
  fosfatase_alcalina?: number;
}

// ========== URINALISE Types ==========
export interface ExameFisico {
  densidade: number;
  cor: string;
  aspecto: string;
}

export interface ExameQuimico {
  ph: number;
  glicose_score?: number;
  proteina_score?: number;
  cetonas_score?: number;
  bilirrubina_score?: number;
  sangue_oculto_score?: number;
  nitrito_score?: number;
  leucocitos_score?: number;
  urobilinogenio_score?: number;
  acetona_score?: number;
}

export interface Sedimentoscopia {
  leucocitos_campo: number;
  hemacias_campo: number;
  bacterias_score: number;
  cilindros_score?: number;
  cristais_score?: number;
  celulas_epiteliais_score?: number;
}

export interface UrinaliseData {
  existe: boolean;
  exame_fisico?: ExameFisico;
  exame_quimico?: ExameQuimico;
  sedimentoscopia?: Sedimentoscopia;
}

export interface Paciente {
  nome: string;
  especie: string;
  idade: string;
}

// ========== Combined Response Type ==========
export interface AnalysisResponse {
  paciente?: Paciente;
  alertas?: string[];
  analise_clinica?: string;
  analise_ia?: string;
  
  // Modular sections
  hemograma?: HemogramaData;
  bioquimica?: BioquimicaData;
  urinalise?: UrinaliseData;
  
  // Legacy support
  tipo_exame?: 'hemograma' | 'urina';
  serie_vermelha?: SerieVermelha;
  serie_branca?: SerieBranca;
  dados_grafico?: {
    exame_fisico: ExameFisico;
    exame_quimico: ExameQuimico;
    sedimentoscopia: Sedimentoscopia;
  };
}

// ========== Constants ==========
const BAR_CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

const PIE_CHART_COLORS = [
  { name: "Segmentados", color: "#3b82f6" },
  { name: "Linfócitos", color: "#10b981" },
  { name: "Eosinófilos", color: "#f59e0b" },
  { name: "Monócitos", color: "#8b5cf6" },
];

// ========== Hemograma Helpers ==========
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
  return items.filter(item => item.value > 0);
};

// ========== Urina Components ==========
const GaugeChart = ({ value, min = 1000, max = 1060 }: { value: number; min?: number; max?: number }) => {
  const safeMin = 1015;
  const safeMax = 1045;
  
  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const isInSafeRange = value >= safeMin && value <= safeMax;
  const safeStartPercent = ((safeMin - min) / (max - min)) * 100;
  const safeEndPercent = ((safeMax - min) / (max - min)) * 100;
  
  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 120" className="w-full">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--destructive) / 0.3)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${safeStartPercent * 2.51} 1000`} />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--chart-2))" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(safeEndPercent - safeStartPercent) * 2.51} 1000`} strokeDashoffset={`-${safeStartPercent * 2.51}`} />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--destructive) / 0.3)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(100 - safeEndPercent) * 2.51} 1000`} strokeDashoffset={`-${safeEndPercent * 2.51}`} />
        <g transform={`rotate(${-90 + clampedPercentage * 1.8}, 100, 100)`}>
          <line x1="100" y1="100" x2="100" y2="35" stroke={isInSafeRange ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="8" fill={isInSafeRange ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} />
        </g>
        <text x="20" y="115" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">{min}</text>
        <text x="180" y="115" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">{max}</text>
      </svg>
      <div className="text-center -mt-4">
        <span className={`text-3xl font-bold ${isInSafeRange ? 'text-green-600' : 'text-destructive'}`}>{value}</span>
        <p className="text-xs text-muted-foreground mt-1">Faixa normal: {safeMin} - {safeMax}</p>
      </div>
    </div>
  );
};

const prepareChemicalData = (exame: ExameQuimico) => {
  const scoreLabels: Record<number, string> = { 0: "Neg", 1: "+", 2: "++", 3: "+++", 4: "++++" };
  const items = [];
  
  if (exame.glicose_score !== undefined) items.push({ name: "Glicose", value: exame.glicose_score, label: scoreLabels[Math.floor(exame.glicose_score)] || "Neg" });
  if (exame.proteina_score !== undefined) items.push({ name: "Proteína", value: exame.proteina_score, label: scoreLabels[Math.floor(exame.proteina_score)] || "Neg" });
  if (exame.cetonas_score !== undefined) items.push({ name: "Cetonas", value: exame.cetonas_score, label: scoreLabels[Math.floor(exame.cetonas_score)] || "Neg" });
  if (exame.bilirrubina_score !== undefined) items.push({ name: "Bilirrubina", value: exame.bilirrubina_score, label: scoreLabels[Math.floor(exame.bilirrubina_score)] || "Neg" });
  if (exame.sangue_oculto_score !== undefined) items.push({ name: "Sangue Oculto", value: exame.sangue_oculto_score, label: scoreLabels[Math.floor(exame.sangue_oculto_score)] || "Neg" });
  if (exame.nitrito_score !== undefined) items.push({ name: "Nitrito", value: exame.nitrito_score, label: scoreLabels[Math.floor(exame.nitrito_score)] || "Neg" });
  if (exame.leucocitos_score !== undefined) items.push({ name: "Leucócitos", value: exame.leucocitos_score, label: scoreLabels[Math.floor(exame.leucocitos_score)] || "Neg" });
  if (exame.urobilinogenio_score !== undefined) items.push({ name: "Urobilinogênio", value: exame.urobilinogenio_score, label: scoreLabels[Math.floor(exame.urobilinogenio_score)] || "Neg" });
  if (exame.acetona_score !== undefined) items.push({ name: "Acetona", value: exame.acetona_score, label: scoreLabels[Math.floor(exame.acetona_score)] || "Neg" });
  
  return items;
};

const StatusIndicator = ({ label, value, isAlert }: { label: string; value: string; isAlert: boolean }) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg border ${isAlert ? 'bg-destructive/10 border-destructive/30' : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'}`}>
    {isAlert ? <AlertCircle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className={`text-xs ${isAlert ? 'text-destructive' : 'text-green-600'}`}>{value}</p>
    </div>
  </div>
);

const MetricCard = ({ label, value, unit }: { label: string; value: number | undefined; unit: string }) => {
  if (value === undefined) return null;
  return (
    <Card className="text-center">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-2">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">{unit}</p>
      </CardContent>
    </Card>
  );
};

// ========== Hemograma Section ==========
const HemogramaSection = ({ data }: { data: HemogramaData }) => {
  const pieData = data.serie_branca ? preparePieChartData(data.serie_branca) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2 text-red-600">
        <Activity className="h-5 w-5" />
        Hemograma
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {data.serie_vermelha && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Série Vermelha</CardTitle>
              <CardDescription>Eritrograma - valores do hemograma</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={prepareBarChartData(data.serie_vermelha)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number, name: string, props: any) => [`${value.toFixed(2)} ${props.payload.unit}`, props.payload.name]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {prepareBarChartData(data.serie_vermelha).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_CHART_COLORS[index % BAR_CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.serie_branca && pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Série Branca</CardTitle>
              <CardDescription>Leucograma - distribuição de glóbulos brancos</CardDescription>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Leucócitos Totais</p>
                <p className="text-2xl font-bold text-foreground">{data.serie_branca.leucocitos_totais.toLocaleString()} /µL</p>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value.toLocaleString()} /µL`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// ========== Bioquimica Section ==========
const BioquimicaSection = ({ data }: { data: BioquimicaData }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-600">
        <TestTube className="h-5 w-5" />
        Bioquímica
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Creatinina" value={data.creatinina} unit="mg/dL" />
        <MetricCard label="Ureia" value={data.ureia} unit="mg/dL" />
        <MetricCard label="ALT" value={data.alt} unit="U/L" />
        <MetricCard label="Fosfatase Alcalina" value={data.fosfatase_alcalina} unit="U/L" />
      </div>
    </div>
  );
};

// ========== Urinalise Section ==========
const UrinaliseSection = ({ data }: { data: UrinaliseData }) => {
  const chemicalData = data.exame_quimico ? prepareChemicalData(data.exame_quimico) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2 text-cyan-600">
        <Droplets className="h-5 w-5" />
        Urinálise
      </h2>
      
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* A - Exame Físico - Gauge Chart */}
        {data.exame_fisico && (
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
                <GaugeChart value={data.exame_fisico.densidade} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Cor</p>
                  <p className="font-medium">{data.exame_fisico.cor}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Aspecto</p>
                  <p className="font-medium">{data.exame_fisico.aspecto}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* B - Exame Químico - Bar Chart */}
        {data.exame_quimico && chemicalData.length > 0 && (
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <FlaskConical className="h-5 w-5" />
                Exame Químico
              </CardTitle>
              <CardDescription>Análise bioquímica da urina</CardDescription>
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">pH</p>
                <p className="text-2xl font-bold text-foreground">{data.exame_quimico.ph.toFixed(1)}</p>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(200, chemicalData.length * 40)}>
                <BarChart data={chemicalData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tickFormatter={(value) => ({ 0: "Neg", 1: "+", 2: "++", 3: "+++", 4: "++++" }[value] || value.toString())} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [{ 0: "Negativo", 1: "+", 2: "++", 3: "+++", 4: "++++" }[Math.floor(value)] || value, "Resultado"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chemicalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 0 ? "hsl(var(--destructive))" : "hsl(var(--chart-2))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* C - Sedimentoscopia */}
        {data.sedimentoscopia && (
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
                <div className="p-4 bg-muted/50 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-1">Leucócitos/Campo</p>
                  <p className="text-3xl font-bold text-foreground">{data.sedimentoscopia.leucocitos_campo}</p>
                  <p className="text-xs text-muted-foreground mt-1">células/campo</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-1">Hemácias/Campo</p>
                  <p className="text-3xl font-bold text-foreground">{data.sedimentoscopia.hemacias_campo}</p>
                  <p className="text-xs text-muted-foreground mt-1">células/campo</p>
                </div>
                <StatusIndicator label="Bactérias" value={data.sedimentoscopia.bacterias_score > 0 ? "Presente" : "Ausente"} isAlert={data.sedimentoscopia.bacterias_score > 0} />
                {data.sedimentoscopia.cilindros_score !== undefined && (
                  <StatusIndicator label="Cilindros" value={data.sedimentoscopia.cilindros_score > 0 ? "Presente" : "Ausente"} isAlert={data.sedimentoscopia.cilindros_score > 0} />
                )}
                {data.sedimentoscopia.cristais_score !== undefined && (
                  <StatusIndicator label="Cristais" value={data.sedimentoscopia.cristais_score > 0 ? "Presente" : "Ausente"} isAlert={data.sedimentoscopia.cristais_score > 0} />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// ========== Main Component ==========
interface AnalysisResultsProps {
  result: AnalysisResponse;
}

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  // Detect if this is a urine exam (legacy format check)
  const isUrinaExam = result.tipo_exame === 'urina' || !!result.dados_grafico || result.urinalise?.existe === true;
  
  // Normalize data: support both new modular format and legacy format
  // IMPORTANT: Don't create hemograma from legacy data if this is a urine exam
  const hemograma: HemogramaData | undefined = result.hemograma ?? (
    (!isUrinaExam && (result.serie_vermelha || result.serie_branca))
      ? { existe: true, serie_vermelha: result.serie_vermelha, serie_branca: result.serie_branca }
      : undefined
  );
  
  const bioquimica: BioquimicaData | undefined = result.bioquimica;
  
  const urinalise: UrinaliseData | undefined = result.urinalise ?? (
    result.dados_grafico 
      ? { 
          existe: true, 
          exame_fisico: result.dados_grafico.exame_fisico,
          exame_quimico: result.dados_grafico.exame_quimico,
          sedimentoscopia: result.dados_grafico.sedimentoscopia
        }
      : (result.tipo_exame === 'urina' ? { existe: true } : undefined)
  );

  // Check if any section exists based on the `existe` flag
  const hasHemograma = hemograma?.existe === true && !isUrinaExam;
  const hasBioquimica = bioquimica?.existe === true;
  const hasUrinalise = urinalise?.existe === true;
  const hasAnyData = hasHemograma || hasBioquimica || hasUrinalise;

  const analysisText = result.analise_clinica || result.analise_ia;

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

      {/* No Data Message */}
      {!hasAnyData && (
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Dados não encontrados</AlertTitle>
          <AlertDescription>
            Nenhum dado de exame foi encontrado na resposta da análise.
          </AlertDescription>
        </Alert>
      )}

      {/* Conditional Sections */}
      {hasHemograma && hemograma && <HemogramaSection data={hemograma} />}
      {hasBioquimica && bioquimica && <BioquimicaSection data={bioquimica} />}
      {hasUrinalise && urinalise && <UrinaliseSection data={urinalise} />}

      {/* AI Analysis */}
      {analysisText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Laudo da IA
            </CardTitle>
            <CardDescription>Análise clínica gerada por inteligência artificial</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysisText}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisResults;
