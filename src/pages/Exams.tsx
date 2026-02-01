import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileSearch, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import FileDropzone from "@/components/analysis/FileDropzone";
import AnalysisResults, { AnalysisResponse, CabecalhoExame } from "@/components/analysis/AnalysisResults";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PatientHeader, Patient } from "@/components/pets/PatientHeader";

type ExamType = "sangue" | "urina";

const Exams = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [examType, setExamType] = useState<ExamType>("sangue");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patients, setPatients] = useState<Patient[]>([]);

  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      const response = await fetch("https://vet-api.predictlab.com.br/webhook/buscar-pacientes");
      if (!response.ok) {
        throw new Error("Falha ao buscar pacientes");
      }
      const data = await response.json();

      // Webhook n8n pode retornar array ou objeto único; normalizar para array
      const rawList = Array.isArray(data) ? data : data?.id != null ? [data] : [];
      const formattedPatients: Patient[] = rawList.map((p: any) => ({
        id: String(p.id),
        name: p.name ?? "",
        owner_name: p.owner_name ?? "",
        breed: p.breed ?? "",
        age: p.age ?? "",
        species: p.species,
        sex: p.sex,
      }));

      setPatients(formattedPatients);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de pacientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPatients(false);
    }
  }, [toast]);

  // Busca a lista de pacientes do webhook n8n ao carregar a página
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handlePatientChange = (value: string) => setSelectedPatientId(value);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const patientData: CabecalhoExame | undefined = selectedPatient ? {
    nome_animal: selectedPatient.name,
    especie_raca: selectedPatient.breed,
    idade: String(selectedPatient.age),
    tutor: selectedPatient.owner_name,
    sexo: selectedPatient.sex || null,
  } : undefined;

  const handleFileSelect = async (file: File) => {
    if (!selectedPatient) {
        toast({
            title: "Seleção obrigatória",
            description: "Por favor, selecione um paciente antes de enviar o exame.",
            variant: "destructive",
        });
        return;
    }
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("data", file);
      formData.append("examType", examType);

      const response = await fetch("https://vet-api.predictlab.com.br/webhook/analisar-arquivo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao analisar arquivo");
      }

      const data: AnalysisResponse = await response.json();
      setResult(data);

      toast({
        title: "Análise concluída",
        description: "Os resultados do exame estão disponíveis.",
      });
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Análise de Exames</h1>
        <p className="text-muted-foreground mt-2">
          Envie uma imagem ou PDF do exame para análise com IA
        </p>
      </div>

      <div className="space-y-6">
        {/* Seletor de Tipo de Exame */}
        <div className="space-y-2">
          <Label htmlFor="exam-type" className="text-sm font-medium">
            Tipo de Exame
          </Label>
          <Select value={examType} onValueChange={(value: ExamType) => setExamType(value)}>
            <SelectTrigger id="exam-type" className="w-full md:w-72">
              <SelectValue placeholder="Selecione o tipo de exame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sangue">Hemograma Completo</SelectItem>
              <SelectItem value="urina">Urinálise (EAS)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de Paciente (Obrigatório) */}
        <div className="space-y-2">
           <Label htmlFor="patient-select" className="text-sm font-medium">
             Selecione o Paciente
           </Label>
           <div className="flex items-center gap-2">
             <Select value={selectedPatientId} onValueChange={handlePatientChange}>
               <SelectTrigger id="patient-select" className="w-full">
                 <SelectValue placeholder={isLoadingPatients ? "Carregando..." : "Selecione um paciente cadastrado"} />
               </SelectTrigger>
               <SelectContent>
                 {patients.length > 0 ? (
                   patients.map((patient) => (
                     <SelectItem key={patient.id} value={patient.id}>
                       {patient.name} ({patient.owner_name})
                     </SelectItem>
                   ))
                 ) : (
                   <SelectItem value="none" disabled>Nenhum paciente encontrado</SelectItem>
                 )}
               </SelectContent>
             </Select>
             <Button
               type="button"
               variant="outline"
               size="icon"
               onClick={fetchPatients}
               disabled={isLoadingPatients}
               title="Atualizar lista de pacientes"
             >
               <RefreshCw className={`h-4 w-4 ${isLoadingPatients ? 'animate-spin' : ''}`} />
             </Button>
           </div>
           <PatientHeader patient={selectedPatient} />
        </div>

        {selectedPatient ? (
           <FileDropzone onFileSelect={handleFileSelect} isLoading={isLoading} />
        ) : (
           <Card className="border-dashed bg-muted/50">
             <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
               <FileSearch className="h-12 w-12 mb-4 opacity-50" />
               <p>Selecione um paciente acima para enviar exames.</p>
             </CardContent>
           </Card>
        )}

        {isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium text-foreground">Analisando exame com IA...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Isso pode levar alguns segundos
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !result && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileSearch className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground">
                Envie um arquivo para ver os resultados da análise
              </p>
            </CardContent>
          </Card>
        )}

        {result && <AnalysisResults result={result} patientData={patientData} />}
      </div>
    </div>
  );
};

export default Exams;
