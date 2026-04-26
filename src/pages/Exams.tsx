import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileSearch, RefreshCw, Save, NotebookPen, Calendar, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import FileDropzone from "@/components/analysis/FileDropzone";
import AnalysisResults, { AnalysisResponse, CabecalhoExame } from "@/components/analysis/AnalysisResults";
import ExamReport from "@/components/analysis/ExamReport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateVetNotesAndLaboratory } from "@/lib/vetNotes";
import { extractExamDate, updateExamDate, formatExamDate, type ExamExtraction } from "@/lib/examDate";
import { findDuplicateExam } from "@/lib/examDuplicateCheck";
import { Input } from "@/components/ui/input";
import { PatientHeader, Patient } from "@/components/pets/PatientHeader";
import ClinicalSignsSection from "@/components/dashboard/ClinicalSignsSection";

type ExamType = "sangue" | "urina";

const Exams = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [examType, setExamType] = useState<ExamType>("sangue");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patients, setPatients] = useState<Patient[]>([]);

  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [savedExamId, setSavedExamId] = useState<string | null>(null);
  const [vetNotes, setVetNotes] = useState<string>('');
  const [extractedExamDate, setExtractedExamDate] = useState<string | null>(null);
  const [laboratory, setLaboratory] = useState<string>('');

  const fetchPatients = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingPatients(true);
    try {
      const response = await fetch(`https://n8nvet.predictlab.com.br/webhook/buscar-pacientes?veterinarian_id=${user.id}`);
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
  }, [toast, user]);

  // Busca a lista de pacientes do webhook n8n ao carregar a página
  useEffect(() => {
    if (user?.id) fetchPatients();
  }, [fetchPatients, user]);

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
    setSavedExamId(null);
    setExtractedExamDate(null);
    setLaboratory('');

    try {
      const formData = new FormData();
      formData.append("data", file);
      formData.append("examType", examType);
      formData.append("patientName", selectedPatient.name);

      const response = await fetch("https://n8nvet.predictlab.com.br/webhook/analisar-arquivo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao analisar arquivo");
      }

      const data: AnalysisResponse = await response.json();
      setResult(data);
      // Extract exam date from document — non-blocking, never delays the analysis result
      extractExamDate(file).then((extraction: ExamExtraction) => {
        setExtractedExamDate(extraction.exam_date);
        if (extraction.laboratory) setLaboratory(extraction.laboratory);
      });

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

  const handleSaveExam = async () => {
    // Guard: already saved — prevent duplicate inserts from double-clicks
    if (savedExamId) return;

    const patient = selectedPatient;
    if (!result || !patient) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um paciente e aguarde o resultado da análise.",
        variant: "destructive",
      });
      return;
    }

    const patientId = patient.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!patientId || !uuidRegex.test(patientId)) {
      toast({
        title: "ID do paciente inválido",
        description: "O paciente selecionado não possui um UUID válido do banco de dados.",
        variant: "destructive",
      });
      return;
    }

    const examTypeLabel =
      examType === "sangue" ? "Hemograma Completo" : "Urinálise (EAS)";

    const payload = {
      patient_id: patientId,
      exam_type: examTypeLabel,
      clinical_summary: result.resumo_clinico,
      analysis_data: result.resultados,
    };

    setIsSavingExam(true);
    try {
      // Pre-save duplicate check: if the same patient + date + lab already
      // exists in exams_history, reuse that record instead of inserting again.
      if (extractedExamDate) {
        const existingId = await findDuplicateExam(
          patientId,
          extractedExamDate,
          laboratory || null,
        );
        if (existingId) {
          setSavedExamId(existingId);
          updateVetNotesAndLaboratory(existingId, vetNotes, laboratory || null)
            .catch((err) => console.warn('[Exams] Could not persist vet_notes on duplicate:', err));
          toast({
            title: "Exame já registrado",
            description: "Este exame já existe no histórico do paciente.",
          });
          return;
        }
      }

      const response = await fetch("https://n8nvet.predictlab.com.br/webhook/salvar-exame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Falha ao salvar exame");
      const responseData = await response.json();
      const examId = responseData?.id ?? responseData?.exam_id ?? null;
      setSavedExamId(examId);
      // Auto-save vet_notes + laboratory junto com o registro do exame
      if (examId) {
        updateVetNotesAndLaboratory(examId, vetNotes, laboratory || null)
          .catch((err) => console.warn('[Exams] Could not persist vet_notes:', err));
      }
      toast({
        title: "Exame salvo",
        description: "O exame foi salvo com sucesso.",
      });
      if (examId && extractedExamDate) {
        updateExamDate(examId, extractedExamDate).catch((err) =>
          console.warn('[Exams] Could not persist exam_date:', err)
        );
      }
    } catch (error) {
      console.error("Erro ao salvar exame:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o exame. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSavingExam(false);
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

        {/* Contexto clínico — aparece após selecionar paciente, antes do upload */}
        {selectedPatient && (
          <div className="space-y-2">
            <Label htmlFor="vet-notes" className="text-sm font-medium flex items-center gap-2">
              <NotebookPen className="h-4 w-4" />
              Contexto clínico do exame
            </Label>
            <Textarea
              id="vet-notes"
              placeholder="Ex: Histórico do paciente, motivo da solicitação, medicamentos em uso..."
              value={vetNotes}
              onChange={(e) => setVetNotes(e.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>
        )}

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
              <p className="text-lg font-medium text-foreground">Analisando exame...</p>
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

        {result && (
          <div className="space-y-4">
            <div className="space-y-3">
              {extractedExamDate && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Data do exame: {formatExamDate(extractedExamDate)}
                  </span>
                  {laboratory && (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: 'hsl(217,100%,95%)', color: 'hsl(221,73%,45%)' }}
                    >
                      <Home className="h-3.5 w-3.5" />
                      {laboratory}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                <ExamReport
                  clinical_summary={result.resumo_clinico}
                  analysis_data={result.resultados}
                  patientData={patientData}
                  examType={examType === "sangue" ? "Hemograma Completo" : "Urinálise (EAS)"}
                  vet_notes={vetNotes}
                  exam_date={extractedExamDate}
                  laboratory={laboratory || null}
                />
                <Button
                  onClick={handleSaveExam}
                  disabled={isSavingExam || !!savedExamId}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingExam ? "Salvando..." : savedExamId ? "Exame salvo" : "Salvar Exame"}
                </Button>
              </div>
            </div>
            <AnalysisResults result={result} patientData={patientData} />

            {/* Sinais Clínicos do Dia */}
            <ClinicalSignsSection patientId={selectedPatientId || null} />

            {/* Laboratório — permanece aqui pois é extraído do PDF */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="laboratory" className="text-sm font-medium">
                Laboratório
              </Label>
              <Input
                id="laboratory"
                placeholder="Ex: Centro Vet Canoas, LabCenter Vet..."
                value={laboratory}
                onChange={(e) => setLaboratory(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exams;
