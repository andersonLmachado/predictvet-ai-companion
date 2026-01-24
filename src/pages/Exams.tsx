import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileDropzone from "@/components/analysis/FileDropzone";
import AnalysisResults, { AnalysisResponse } from "@/components/analysis/AnalysisResults";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type ExamType = "sangue" | "urina";

const Exams = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [examType, setExamType] = useState<ExamType>("sangue");

  const handleFileSelect = async (file: File) => {
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

        <FileDropzone onFileSelect={handleFileSelect} isLoading={isLoading} />

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

        {result && <AnalysisResults result={result} />}
      </div>
    </div>
  );
};

export default Exams;
