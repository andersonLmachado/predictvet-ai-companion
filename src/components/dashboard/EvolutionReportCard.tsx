import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { TrendDataPoint } from './TrendChart';

interface EvolutionReportCardProps {
  trendsByParam: Map<string, { data: TrendDataPoint[]; unidade: string; refMin: number; refMax: number }>;
  patientId?: string;
}

const EvolutionReportCard: React.FC<EvolutionReportCardProps> = ({ trendsByParam, patientId }) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setAiSummary(null);
      return;
    }
    const fetchSummary = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('evolution_summaries')
        .select('last_ai_summary')
        .eq('patient_id', patientId)
        .maybeSingle();

      setAiSummary(!error && data ? data.last_ai_summary : null);
      setLoading(false);
    };
    fetchSummary();
  }, [patientId]);

  // Local fallback analysis when no AI summary from backend
  const localReport = useMemo(() => {
    if (aiSummary || trendsByParam.size === 0) return null;

    const insights: string[] = [];
    let improving = 0;
    let worsening = 0;
    let stable = 0;

    trendsByParam.forEach((info, param) => {
      if (info.data.length < 2) return;
      const last = info.data[info.data.length - 1];
      const prev = info.data[info.data.length - 2];
      const diff = last.value - prev.value;
      const pct = prev.value !== 0 ? Math.abs((diff / prev.value) * 100) : 0;

      if (last.status === 'normal' && prev.status !== 'normal') {
        improving++;
        insights.push(`${param} retornou à faixa de referência (${prev.value} → ${last.value})`);
      } else if (last.status !== 'normal' && prev.status === 'normal') {
        worsening++;
        insights.push(`${param} saiu da faixa normal (${prev.value} → ${last.value})`);
      } else if (pct > 10 && last.status !== 'normal') {
        worsening++;
        insights.push(`${param} variou ${pct.toFixed(1)}% e permanece fora da referência`);
      } else if (Math.abs(diff) < 0.01) {
        stable++;
      } else {
        if (last.status === 'normal') improving++;
        else stable++;
      }
    });

    let summary = '';
    if (improving > worsening && worsening === 0) {
      summary = '✅ Tendência geral positiva. Os indicadores mostram evolução favorável desde o último exame.';
    } else if (worsening > improving) {
      summary = '⚠️ Atenção: alguns parâmetros mostram piora. Recomenda-se acompanhamento mais próximo.';
    } else if (improving > 0 && worsening > 0) {
      summary = '🔄 Evolução mista: parte dos indicadores melhora enquanto outros requerem atenção.';
    } else {
      summary = '📊 Indicadores estáveis entre os últimos exames.';
    }

    return { summary, insights };
  }, [trendsByParam, aiSummary]);

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/15">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <span>Parecer Geral de Evolução (IA)</span>
          <Sparkles className="h-4 w-4 text-primary/60" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : aiSummary ? (
          <p className="text-sm text-foreground whitespace-pre-line">{aiSummary}</p>
        ) : !patientId ? (
          <p className="text-sm text-muted-foreground italic">Selecione um paciente para gerar a análise de evolução</p>
        ) : localReport ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{localReport.summary}</p>
            {localReport.insights.length > 0 && (
              <ul className="space-y-1">
                {localReport.insights.map((insight, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Aguardando nova análise de evolução...</p>
        )}
      </CardContent>
    </Card>
  );
};

export default EvolutionReportCard;
