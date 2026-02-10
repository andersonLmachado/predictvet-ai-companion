import React from 'react';
import { PatientInfo } from '@/contexts/PatientContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, PawPrint, Calendar } from 'lucide-react';

interface PatientSummaryProps {
  patient: PatientInfo;
}

const PatientSummary: React.FC<PatientSummaryProps> = ({ patient }) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-6 py-4 px-6">
        <div className="flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Paciente</p>
            <p className="font-semibold text-foreground">{patient.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Tutor</p>
            <p className="font-medium text-foreground">{patient.owner_name}</p>
          </div>
        </div>
        {patient.age && (
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Idade</p>
              <p className="font-medium text-foreground">{patient.age}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {patient.species}{patient.breed ? ` • ${patient.breed}` : ''}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientSummary;
