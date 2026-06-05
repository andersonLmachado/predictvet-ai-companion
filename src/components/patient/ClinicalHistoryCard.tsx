import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronDown, Save } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchClinicalHistory, saveClinicalHistory } from '@/lib/clinicalHistory';
import { fetchMedicalHistory } from '@/lib/medicalHistory';

export interface ClinicalHistoryCardProps {
  patientId: string;
  mode: 'edit' | 'readonly';
  onLoad?: (text: string) => void;
}

const ClinicalHistoryCard: React.FC<ClinicalHistoryCardProps> = ({
  patientId,
  mode,
  onLoad,
}) => {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [allergies, setAllergies] = useState('');
  const [previousDiseases, setPreviousDiseases] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    if (!patientId) return;
    setIsLoading(true);
    setText('');
    setAllergies('');
    setPreviousDiseases('');
    setOpen(false);
    Promise.all([
      fetchClinicalHistory(patientId),
      fetchMedicalHistory(patientId),
    ])
      .then(([historyText, medical]) => {
        setText(historyText);
        setAllergies(medical.allergies);
        setPreviousDiseases(medical.previousDiseases);
        setOpen(historyText.trim().length > 0);
        onLoadRef.current?.(historyText);
      })
      .catch(() => {
        onLoadRef.current?.('');
      })
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalHistory(patientId, text);
      toast({ title: 'Histórico salvo', description: 'O histórico clínico foi atualizado.' });
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === 'readonly') {
    const hasContent = text.trim() || allergies.trim() || previousDiseases.trim();
    if (isLoading || !hasContent) return null;
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="py-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              Histórico Clínico
            </div>
            <Link
              to={`/patient/${patientId}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              Editar histórico
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3 space-y-1">
          {allergies.trim() && (
            <p className="text-sm text-foreground">
              <span className="font-medium">Alergias:</span> {allergies}
            </p>
          )}
          {previousDiseases.trim() && (
            <p className="text-sm text-foreground">
              <span className="font-medium">Doenças anteriores:</span> {previousDiseases}
            </p>
          )}
          {text.trim() && (
            <p className="text-sm text-foreground whitespace-pre-wrap">
              <span className="font-medium">Histórico:</span> {text}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex items-center gap-2 w-full text-left py-1">
          <ClipboardList className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium">
            {text.trim() ? 'Histórico Clínico' : 'Adicionar histórico clínico'}
          </span>
          <ChevronDown
            className={`h-4 w-4 ml-auto text-muted-foreground transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        <p className="text-xs text-muted-foreground">
          Alergias, doenças preexistentes, medicamentos em uso
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-y"
          placeholder="Ex: Alergia a dipirona, diabetes mellitus tipo 2, uso contínuo de insulina 0,5 UI/kg..."
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            variant="secondary"
            size="sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar histórico'}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ClinicalHistoryCard;
