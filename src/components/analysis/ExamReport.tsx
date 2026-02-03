import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CabecalhoExame, ExamResultItem } from "./AnalysisResults";

interface ExamReportProps {
  clinical_summary: string;
  analysis_data: ExamResultItem[];
  patientData?: CabecalhoExame;
  examType?: string;
  className?: string;
}

const formatReference = (item: ExamResultItem) => {
  if (item.ref_min != null && item.ref_max != null) {
    return `${item.ref_min} - ${item.ref_max}`;
  }
  return "—";
};

const formatValue = (item: ExamResultItem) => {
  const unit = item.unidade ? ` ${item.unidade}` : "";
  return `${item.valor_encontrado}${unit}`;
};

const formatStatusClass = (status: ExamResultItem["status"]) => {
  if (status === "normal") return "status-normal";
  if (status === "alto") return "status-high";
  return "status-low";
};

const generatePDF = (
  clinical_summary: string,
  analysis_data: ExamResultItem[],
  patientData?: CabecalhoExame,
  examType?: string,
) => {
  const reportWindow = window.open("", "_blank");
  if (!reportWindow) return;

  const formattedDate = new Date().toLocaleString("pt-BR");
  const summaryText = clinical_summary || "Nenhum resumo clínico informado.";
  const patientName = patientData?.nome_animal ?? "Não informado";
  const examTitle = examType ?? "Exame clínico";

  const rowsHtml =
    analysis_data.length > 0
      ? analysis_data
          .map(
            (item) => `
        <tr>
          <td>${item.parametro}</td>
          <td>${formatValue(item)}</td>
          <td>${formatReference(item)}</td>
          <td><span class="status ${formatStatusClass(item.status)}">${item.status.toUpperCase()}</span></td>
        </tr>
      `,
          )
          .join("")
      : `<tr><td colspan="4" class="empty-row">Nenhum resultado disponível.</td></tr>`;

  const insightsHtml =
    analysis_data.length > 0
      ? analysis_data
          .map((item) => `<li><strong>${item.parametro}:</strong> ${item.explicacao_curta}</li>`)
          .join("")
      : "<li>Nenhuma interpretação rápida disponível.</li>";

  reportWindow.document.write(`
    <html lang="pt-BR">
      <head>
        <title>Laudo - ${patientName}</title>
        <style>
          :root {
            color-scheme: light;
          }
          body {
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            margin: 32px;
            color: #1f2937;
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          header h1 {
            margin: 0;
            font-size: 24px;
          }
          header p {
            margin: 4px 0 0;
            color: #6b7280;
            font-size: 12px;
          }
          .meta {
            text-align: right;
            font-size: 12px;
            color: #6b7280;
          }
          .section {
            margin-bottom: 24px;
          }
          .section-title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 8px;
            color: #111827;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
          }
          .patient-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px 24px;
            font-size: 13px;
          }
          .patient-grid span {
            color: #374151;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
          }
          th {
            background: #f3f6ff;
            font-weight: 600;
          }
          .status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            color: #fff;
          }
          .status-normal { background: #16a34a; }
          .status-high { background: #dc2626; }
          .status-low { background: #f59e0b; }
          .empty-row {
            text-align: center;
            color: #6b7280;
            font-style: italic;
          }
          ul {
            margin: 0;
            padding-left: 18px;
            font-size: 12px;
            color: #374151;
          }
          footer {
            margin-top: 32px;
            font-size: 11px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
          }
          @media print {
            body { margin: 16mm; }
            header { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>Laudo Médico Veterinário</h1>
            <p>PredictVet AI Companion</p>
          </div>
          <div class="meta">
            <div>${examTitle}</div>
            <div>${formattedDate}</div>
          </div>
        </header>

        <section class="section">
          <div class="section-title">Identificação do paciente</div>
          <div class="patient-grid">
            <span><strong>Nome:</strong> ${patientName}</span>
            <span><strong>Tutor:</strong> ${patientData?.tutor ?? "—"}</span>
            <span><strong>Espécie/Raça:</strong> ${patientData?.especie_raca ?? "—"}</span>
            <span><strong>Idade:</strong> ${patientData?.idade ?? "—"}</span>
            <span><strong>Sexo:</strong> ${patientData?.sexo ?? "—"}</span>
          </div>
        </section>

        <section class="section">
          <div class="section-title">Resumo clínico</div>
          <p>${summaryText}</p>
        </section>

        <section class="section">
          <div class="section-title">Resultados laboratoriais</div>
          <table>
            <thead>
              <tr>
                <th>Parâmetro</th>
                <th>Resultado</th>
                <th>Referência</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </section>

        <section class="section">
          <div class="section-title">Interpretações rápidas</div>
          <ul>
            ${insightsHtml}
          </ul>
        </section>

        <footer>
          Documento gerado automaticamente. Consulte um médico veterinário para interpretação definitiva.
        </footer>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  reportWindow.document.close();
};

const ExamReport: React.FC<ExamReportProps> = ({
  clinical_summary,
  analysis_data,
  patientData,
  examType,
  className,
}) => {
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={() => generatePDF(clinical_summary, analysis_data, patientData, examType)}
    >
      <FileText className="mr-2 h-4 w-4" />
      Gerar PDF
    </Button>
  );
};

export default ExamReport;
