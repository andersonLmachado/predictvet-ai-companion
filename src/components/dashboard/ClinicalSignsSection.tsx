import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, X, Save, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Observation {
  id: string;
  observation: string;
  created_at: string;
}

interface ClinicalSignsSectionProps {
  patientId: string | null;
}

const ClinicalSignsSection: React.FC<ClinicalSignsSectionProps> = ({ patientId }) => {
  const [signs, setSigns] = useState<string[]>([]);
  const [currentSign, setCurrentSign] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<Observation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    setSigns([]);
    if (patientId) fetchHistory();
    else setHistory([]);
  }, [patientId]);

  const fetchHistory = async () => {
    if (!patientId) return;
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('clinical_observations')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) setHistory(data as Observation[]);
    setLoadingHistory(false);
  };

  const add = () => {
    const trimmed = currentSign.trim();
    if (trimmed && !signs.includes(trimmed)) {
      setSigns((prev) => [...prev, trimmed]);
      setCurrentSign('');
    }
  };

  const remove = (sign: string) => setSigns((prev) => prev.filter((s) => s !== sign));

  const saveObservations = async () => {
    if (!patientId || signs.length === 0) return;
    setSaving(true);
    const observation = signs.join(', ');
    const { error } = await supabase
      .from('clinical_observations')
      .insert({ patient_id: patientId, observation });
    if (error) {
      toast.error('Erro ao salvar observações');
    } else {
      toast.success('Observações salvas com sucesso');
      setSigns([]);
      fetchHistory();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Sinais Clínicos do Dia
          </CardTitle>
          <CardDescription>Registre sintomas observados na anamnese</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Digite um sintoma e pressione Enter"
              value={currentSign}
              onChange={(e) => setCurrentSign(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); add(); }
              }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={add}>
              Adicionar
            </Button>
          </div>
          {signs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {signs.map((sign) => (
                <Badge key={sign} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  {sign}
                  <button onClick={() => remove(sign)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {signs.length > 0 && (
            <Button onClick={saveObservations} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Observações
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      {patientId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Histórico de Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            )}
            {!loadingHistory && history.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma observação registrada.</p>
            )}
            {!loadingHistory && history.length > 0 && (
              <div className="relative border-l-2 border-primary/20 pl-4 space-y-4">
                {history.map((obs) => (
                  <div key={obs.id} className="relative">
                    <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(obs.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-foreground mt-0.5">{obs.observation}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClinicalSignsSection;
