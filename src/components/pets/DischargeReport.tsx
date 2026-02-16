import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { PatientInfo } from '@/contexts/PatientContext';
import predictLabLogo from '@/assets/predictlab-logo.png';

interface DischargeReportProps {
  patient: PatientInfo;
  patientId: string;
}

interface SOAPEntry {
  soap_block: string;
  content: string | null;
  ai_suggestions: string | null;
  created_at: string | null;
}

interface ExamParam {
  parametro: string;
  valor_encontrado: number | string | null;
  ref_min: number;
  ref_max: number;
  unidade: string;
  status: string;
}

interface ExamRow {
  id: string;
  created_at: string | null;
  exam_type: string;
  clinical_summary: string | null;
  analysis_data: ExamParam[];
}

const PRIORITY_PARAMS = [
  'ERITRÓCITOS', 'HEMOGLOBINA', 'HEMATÓCRITO', 'LEUCÓCITOS TOTAIS', 'PLAQUETAS',
  'CREATININA', 'UREIA', 'ALT ( TGP )', 'FOSFATASE ALCALINA',
];

const DischargeReport: React.FC<DischargeReportProps> = ({ patient, patientId }) => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [soapData, setSoapData] = useState<SOAPEntry[]>([]);
  const [examsData, setExamsData] = useState<ExamRow[]>([]);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');

  // Pre-load logo as data URL for the print window
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      setLogoDataUrl(canvas.toDataURL('image/png'));
    };
    img.src = predictLabLogo;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [soapRes, examsRes] = await Promise.all([
        supabase
          .from('medical_consultations')
          .select('soap_block, content, ai_suggestions, created_at')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('exams_history')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: true }),
      ]);

      if (!soapRes.error && soapRes.data) setSoapData(soapRes.data);
      if (!examsRes.error && examsRes.data) {
        setExamsData(examsRes.data.map((r: any) => ({
          ...r,
          analysis_data: Array.isArray(r.analysis_data) ? r.analysis_data : [],
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, [patientId]);

  const hasData = soapData.length > 0 || examsData.length > 0;
  const isDisabled = loading || !hasData;

  const lastA = soapData.find((s) => s.soap_block === 'A');
  const lastP = soapData.find((s) => s.soap_block === 'P');

  const getEvolutionRows = () => {
    const map = new Map<string, { points: { date: string; value: number; status: string }[]; unidade: string; refMin: number; refMax: number }>();
    examsData.forEach((exam) => {
      const dateStr = exam.created_at ? new Date(exam.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
      exam.analysis_data.forEach((p) => {
        const val = typeof p.valor_encontrado === 'number' ? p.valor_encontrado : parseFloat(String(p.valor_encontrado));
        if (isNaN(val)) return;
        if (!map.has(p.parametro)) map.set(p.parametro, { points: [], unidade: p.unidade ?? '', refMin: Number(p.ref_min) || 0, refMax: Number(p.ref_max) || 0 });
        map.get(p.parametro)!.points.push({ date: dateStr, value: val, status: p.status ?? 'normal' });
      });
    });
    // Filter to priority params that have data
    const priority = PRIORITY_PARAMS.filter((pp) => {
      for (const [key] of map) { if (key.includes(pp)) return true; }
      return false;
    });
    const result: { param: string; points: { date: string; value: number; status: string }[]; unidade: string; refMin: number; refMax: number }[] = [];
    priority.forEach((pp) => {
      for (const [key, val] of map) {
        if (key.includes(pp)) { result.push({ param: key, ...val }); break; }
      }
    });
    return result;
  };

  const generateReport = () => {
    setGenerating(true);
    const w = window.open('', '_blank');
    if (!w) { setGenerating(false); return; }

    const now = new Date().toLocaleString('pt-BR');
    const evolution = getEvolutionRows();

    const statusColor = (s: string) => s === 'alto' ? '#dc2626' : s === 'baixo' ? '#800020' : '#16a34a';

    const evolutionTableHtml = evolution.length > 0
      ? `<table>
          <thead><tr><th>Parâmetro</th><th>Unidade</th><th>Ref.</th>${evolution[0].points.map((p) => `<th>${p.date}</th>`).join('')}<th>Status</th></tr></thead>
          <tbody>${evolution.map((row) => {
            const lastPoint = row.points[row.points.length - 1];
            return `<tr>
              <td>${row.param}</td>
              <td>${row.unidade}</td>
              <td>${row.refMin} - ${row.refMax}</td>
              ${row.points.map((p) => `<td>${p.value}</td>`).join('')}
              <td><span class="badge" style="background:${statusColor(lastPoint.status)}">${lastPoint.status.toUpperCase()}</span></td>
            </tr>`;
          }).join('')}</tbody>
        </table>`
      : '<p class="empty">Nenhum dado de evolução laboratorial disponível.</p>';

    const soapHtml = (lastA || lastP)
      ? `<div class="soap-grid">
          ${lastA ? `<div class="soap-card"><h4>Avaliação (A)</h4><p>${lastA.content ?? '—'}</p>${lastA.ai_suggestions ? `<div class="ai-note"><strong>💡 IA:</strong> ${lastA.ai_suggestions}</div>` : ''}</div>` : ''}
          ${lastP ? `<div class="soap-card"><h4>Plano (P)</h4><p>${lastP.content ?? '—'}</p>${lastP.ai_suggestions ? `<div class="ai-note"><strong>💡 IA:</strong> ${lastP.ai_suggestions}</div>` : ''}</div>` : ''}
        </div>`
      : '<p class="empty">Nenhum registro SOAP disponível.</p>';

    w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório de Alta - ${patient.name}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 32px 40px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .header img { height: 44px; object-fit: contain; }
  .header-right { text-align: right; font-size: 11px; color: #6b7280; }
  .header-right h2 { font-size: 18px; color: #1e3a5f; margin-bottom: 4px; }
  .patient-box { background: #f0f4ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 24px; font-size: 13px; }
  .patient-box span { color: #374151; }
  .section { margin-bottom: 24px; }
  .section-title { font-weight: 700; font-size: 15px; color: #1e3a5f; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
  th, td { padding: 7px 10px; border: 1px solid #e5e7eb; text-align: left; }
  th { background: #eef2ff; font-weight: 600; color: #1e3a5f; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; color: #fff; }
  .soap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .soap-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
  .soap-card h4 { font-size: 13px; color: #2563eb; margin-bottom: 8px; }
  .soap-card p { font-size: 12px; white-space: pre-wrap; color: #374151; }
  .ai-note { margin-top: 10px; padding: 8px 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; font-size: 11px; color: #92400e; }
  .empty { color: #9ca3af; font-style: italic; font-size: 12px; }
  footer { margin-top: 32px; border-top: 2px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
  @media print {
    body { margin: 12mm 16mm; padding: 0; }
    .header { page-break-after: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>${logoDataUrl ? `<img src="${logoDataUrl}" alt="PredictLab"/>` : '<h1 style="color:#2563eb">PredictLab</h1>'}</div>
    <div class="header-right">
      <h2>Relatório de Alta</h2>
      <div>${now}</div>
    </div>
  </div>

  <div class="patient-box">
    <span><strong>Paciente:</strong> ${patient.name}</span>
    <span><strong>Tutor:</strong> ${patient.owner_name}</span>
    <span><strong>Espécie:</strong> ${patient.species ?? '—'}</span>
    <span><strong>Raça:</strong> ${patient.breed ?? '—'}</span>
    <span><strong>Idade:</strong> ${patient.age ?? '—'}</span>
  </div>

  <div class="section">
    <div class="section-title">Última Avaliação & Plano Terapêutico (SOAP)</div>
    ${soapHtml}
  </div>

  <div class="section">
    <div class="section-title">Evolução Laboratorial</div>
    ${evolutionTableHtml}
  </div>

  <footer>
    <span>Documento gerado automaticamente por PredictLab AI Companion.</span>
    <span>Consulte um médico veterinário para interpretação definitiva.</span>
  </footer>

  <script>window.onload=()=>{window.print();};<\/script>
</body>
</html>`);
    w.document.close();
    setGenerating(false);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button
            variant="outline"
            size="sm"
            disabled={isDisabled}
            onClick={generateReport}
            className="gap-2"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Relatório de Alta
          </Button>
        </span>
      </TooltipTrigger>
      {isDisabled && !loading && (
        <TooltipContent>
          <p>Dados insuficientes para relatório completo</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export default DischargeReport;
