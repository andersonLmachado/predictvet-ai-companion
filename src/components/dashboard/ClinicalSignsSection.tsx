import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, X } from 'lucide-react';

interface ClinicalSignsSectionProps {
  signs: string[];
  onSignsChange: (signs: string[]) => void;
}

const ClinicalSignsSection: React.FC<ClinicalSignsSectionProps> = ({ signs, onSignsChange }) => {
  const [currentSign, setCurrentSign] = useState('');

  const add = () => {
    const trimmed = currentSign.trim();
    if (trimmed && !signs.includes(trimmed)) {
      onSignsChange([...signs, trimmed]);
      setCurrentSign('');
    }
  };

  const remove = (sign: string) => {
    onSignsChange(signs.filter((s) => s !== sign));
  };

  return (
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
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
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
      </CardContent>
    </Card>
  );
};

export default ClinicalSignsSection;
