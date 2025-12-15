import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, FileText, Stethoscope, TestTube, Loader2, X, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DadosGrafico {
  eritrocitos: number;
  hemoglobina: number;
  hematocrito: number;
  leucocitos: number;
}

interface AnalysisResponse {
  dados_grafico: DadosGrafico;
  analise_clinica: string;
  alertas: string[];
}

const Dashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  
  // Form state
  const [patientId, setPatientId] = useState("");
  const [age, setAge] = useState("");
  const [species, setSpecies] = useState("");
  const [clinicalSigns, setClinicalSigns] = useState<string[]>([]);
  const [currentSign, setCurrentSign] = useState("");
  const [examResults, setExamResults] = useState("");

  const addClinicalSign = () => {
    if (currentSign.trim() && !clinicalSigns.includes(currentSign.trim())) {
      setClinicalSigns([...clinicalSigns, currentSign.trim()]);
      setCurrentSign("");
    }
  };

  const removeClinicalSign = (sign: string) => {
    setClinicalSigns(clinicalSigns.filter(s => s !== sign));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addClinicalSign();
    }
  };

  const handleAnalyze = async () => {
    if (!patientId || !species) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o ID do paciente e a espécie.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("https://vet-api.predictlab.com.br/webhook/analisar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: patientId,
          age: age ? parseInt(age) : null,
          species,
          clinical_signs: clinicalSigns,
          exam_results: examResults,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao analisar caso");
      }

      const data: AnalysisResponse = await response.json();
      setResult(data);

      toast({
        title: "Análise concluída",
        description: "Os resultados estão disponíveis abaixo.",
      });
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível conectar ao servidor de análise. Verifique se o serviço está ativo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const prepareChartData = (dados: DadosGrafico) => {
    return [
      { name: "Eritrócitos", value: dados.eritrocitos, unit: "M/µL" },
      { name: "Hemoglobina", value: dados.hemoglobina, unit: "g/dL" },
      { name: "Hematócrito", value: dados.hematocrito, unit: "%" },
      { name: "Leucócitos", value: dados.leucocitos / 1000, unit: "K/µL" },
    ];
  };

  const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  const isFormValid = patientId.trim() !== "" && species !== "";

  return (
    <div className="container mx-auto py-8 px-4 pb-24 max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Veterinário</h1>
          <p className="text-muted-foreground mt-2">
            Análise inteligente de casos clínicos com IA
          </p>
        </div>
        <Button
          className={`h-12 px-8 text-lg ${!isFormValid && !isLoading ? "bg-muted text-muted-foreground hover:bg-muted" : ""}`}
          onClick={handleAnalyze}
          disabled={isLoading || !isFormValid}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analisando...
            </>
          ) : (
            "Analisar Caso"
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário de Entrada */}
        <div className="space-y-6">
          {/* Dados do Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Dados do Paciente
              </CardTitle>
              <CardDescription>Informações básicas do animal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patientId">ID do Paciente *</Label>
                  <Input
                    id="patientId"
                    placeholder="Ex: PAC-001"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Idade (anos)</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Ex: 5"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="species">Espécie *</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a espécie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canino">Canino</SelectItem>
                    <SelectItem value="felino">Felino</SelectItem>
                    <SelectItem value="equino">Equino</SelectItem>
                    <SelectItem value="bovino">Bovino</SelectItem>
                    <SelectItem value="ave">Ave</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sinais Clínicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Sinais Clínicos
              </CardTitle>
              <CardDescription>Adicione os sintomas observados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite um sintoma e pressione Enter"
                  value={currentSign}
                  onChange={(e) => setCurrentSign(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button type="button" variant="secondary" onClick={addClinicalSign}>
                  Adicionar
                </Button>
              </div>
              {clinicalSigns.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {clinicalSigns.map((sign) => (
                    <Badge key={sign} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                      {sign}
                      <button
                        onClick={() => removeClinicalSign(sign)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultados de Exames */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-primary" />
                Resultados de Exames
              </CardTitle>
              <CardDescription>Cole o laudo completo (OCR/Texto)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Cole aqui o texto do laudo de exames..."
                className="min-h-[200px] resize-y"
                value={examResults}
                onChange={(e) => setExamResults(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Interface de Resultados */}
        <div className="space-y-6">
          {!result && !isLoading && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center text-muted-foreground">
                <TestTube className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Preencha o formulário e clique em "Analisar Caso"</p>
                <p className="text-sm mt-2">Os resultados da análise aparecerão aqui</p>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-lg font-medium">Processando análise...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Isso pode levar alguns segundos
                </p>
              </CardContent>
            </Card>
          )}

          {result && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
