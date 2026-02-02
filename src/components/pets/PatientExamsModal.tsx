import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  resultados: ExamResultItem[];
  resumo_clinico: string;
  created_at: string;
};

type PatientExamsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
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
}: PatientExamsModalProps) => {
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
        const response = await fetch(url);
        if (!response.ok) throw new Error("Falha ao buscar exames");
        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.id != null ? [data] : [];
        const sorted = (list as ExamHistoryRecord[])
          .map((e: any) => ({
            id: String(e.id),
            patient_id: String(e.patient_id),
            exam_type: e.exam_type ?? "",
            resultados: Array.isArray(e.resultados) ? e.resultados : [],
            resumo_clinico: e.resumo_clinico ?? "",
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
    idade: null,
    sexo: null,
    tutor: null,
  };

  const syntheticResult = selectedExam
    ? ({
        cabecalho: patientData,
        resumo_clinico: selectedExam.resumo_clinico,
        resultados: selectedExam.resultados,
      } satisfies AnalysisResponse)
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de exames — {patientName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando exames...
          </div>
        ) : selectedExam ? (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => setSelectedExam(null)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar à lista
            </Button>
            <ScrollArea className="flex-1 pr-4">
              {syntheticResult && (
                <AnalysisResults result={syntheticResult} patientData={patientData} />
              )}
            </ScrollArea>
          </div>
        ) : exams.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum exame encontrado para este paciente.
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
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
                      {exam.resumo_clinico && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {exam.resumo_clinico}
                        </p>
                      )}
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientExamsModal;
