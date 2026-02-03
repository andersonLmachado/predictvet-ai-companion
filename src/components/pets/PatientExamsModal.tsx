import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft, FileText } from "lucide-react";
import AnalysisResults, {
  AnalysisResponse,
  CabecalhoExame,
  ExamResultItem,
} from "@/components/analysis/AnalysisResults";

const API_EXAMS_URL = "https://vet-api.predictlab.com.br/webhook/buscar-exames";

export type ExamHistoryRecord = {
  id: string;
  patient_id: string;
  exam_type: string;
  clinical_summary: string;
  analysis_data: ExamResultItem[];
  created_at: string;
};

type PatientExamsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  owner_name?: string;
  age?: string | number | null;
};

const examTypeLabel: Record<string, string> = {
  sangue: "Hemograma",
  urina: "Urinálise (EAS)",
};

const PatientExamsModal = ({
  open,
  onOpenChange,
  patientId,
  patientName,
  owner_name,
  age,
}: PatientExamsModalProps) => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamHistoryRecord | null>(null);

  useEffect(() => {
    if (!open || !patientId) return;
    setSelectedExam(null);
    const fetchExams = async () => {
      setLoading(true);
      try {
        const url = `${API_EXAMS_URL}?patient_id=${encodeURIComponent(patientId)}`;
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) throw new Error("Falha ao buscar exames");
        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.id != null ? [data] : [];
        const sorted = list
          .map((e: any, index: number) => ({
            id: String(e.id ?? index),
            patient_id: String(e.patient_id),
            exam_type: e.exam_type ?? "",
            clinical_summary: e.clinical_summary ?? e.resumo_clinico ?? "",
            analysis_data: Array.isArray(e.analysis_data) ? e.analysis_data : (Array.isArray(e.resultados) ? e.resultados : []),
            created_at: e.created_at ?? "",
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setExams(sorted);
      } catch (error) {
        console.error("Erro ao buscar exames:", error);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [open, patientId]);

  const handleClose = (open: boolean) => {
    if (!open) setSelectedExam(null);
    onOpenChange(open);
  };

  const patientData: CabecalhoExame = {
    nome_animal: patientName,
    especie_raca: null,
    idade: age != null ? String(age) : null,
    sexo: null,
    tutor: owner_name ?? null,
  };

  const syntheticResult =
    selectedExam != null
      ? ({
          cabecalho: patientData,
          resumo_clinico: selectedExam.clinical_summary,
          resultados: selectedExam.analysis_data,
        } satisfies AnalysisResponse)
      : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle>Histórico de exames — {patientName}</DialogTitle>
          <div className="text-sm text-muted-foreground space-y-0.5 pt-1">
            {owner_name != null && owner_name !== "" && (
              <p><span className="font-medium text-foreground">Tutor:</span> {owner_name}</p>
            )}
            {age != null && age !== "" && (
              <p><span className="font-medium text-foreground">Idade:</span> {String(age)}</p>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando exames...
            </div>
          ) : selectedExam ? (
            <div className="flex flex-col gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={() => setSelectedExam(null)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Voltar à lista
              </Button>
              {syntheticResult && (
                <AnalysisResults result={syntheticResult} patientData={patientData} />
              )}
            </div>
          ) : exams.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <p className="text-muted-foreground">
                Nenhum exame encontrado para este paciente.
              </p>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/exams");
                }}
              >
                Realizar Análise
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {exams.map((exam) => (
                <li key={exam.id}>
                  <Card
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedExam(exam)}
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-base">
                            {examTypeLabel[exam.exam_type] ?? exam.exam_type}
                          </CardTitle>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {exam.created_at
                            ? new Date(exam.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>
                      {exam.clinical_summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {exam.clinical_summary}
                        </p>
                      )}
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientExamsModal;
