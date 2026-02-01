import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, PawPrint } from "lucide-react";

export interface Patient {
  id: string;
  name: string;
  owner_name: string;
  breed: string;
  age: string | number;
  species?: string;
  sex?: string;
}

interface PatientHeaderProps {
  patient: Patient | undefined;
}

export const PatientHeader = ({ patient }: PatientHeaderProps) => {
  if (!patient) return null;

  return (
    <Card className="mb-6 bg-muted/30 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-primary" />
          Dados do Paciente
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-muted-foreground">Nome do Animal</span>
          <span className="font-medium">{patient.name}</span>
        </div>
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-muted-foreground">Raça</span>
          <span className="font-medium">
            {patient.breed}
          </span>
        </div>
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-muted-foreground">Tutor</span>
          <span className="font-medium flex items-center gap-1">
            <User className="h-3 w-3" /> {patient.owner_name}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
