import React from 'react';
import { FileText } from 'lucide-react';
import jsPDF from 'jspdf';

interface ExamReportProps {
  clinical_summary: string;
  analysis_data: Record<string, any>;
}

const formatAnalysisData = (data: Record<string, any>) => {
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
};

const generatePDF = (clinical_summary: string, analysis_data: Record<string, any>) => {
  const doc = new jsPDF();
  doc.setFont('helvetica');
  doc.setFontSize(16);
  doc.text('Laudo Médico', 20, 20);
  doc.setFontSize(12);
  doc.text('Resumo Clínico:', 20, 35);
  doc.text(clinical_summary, 20, 45);
  doc.text('Dados da Análise:', 20, 60);
  doc.text(formatAnalysisData(analysis_data), 20, 70);
  doc.save('laudo-medico.pdf');
};

const ExamReport: React.FC<ExamReportProps> = ({ clinical_summary, analysis_data }) => {
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      onClick={() => generatePDF(clinical_summary, analysis_data)}
    >
      <FileText size={20} />
      Gerar Laudo PDF
    </button>
  );
};

export default ExamReport;
