
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Search } from 'lucide-react';

// Dados simulados para exibição inicial
const samplePatients = [
  {
    id: '1',
    name: 'Max',
    species: 'Canina',
    breed: 'Labrador',
    age: '3 anos',
    gender: 'Macho',
    tutor: 'Carlos Silva',
    lastConsult: '2025-05-20',
  },
  {
    id: '2',
    name: 'Luna',
    species: 'Felina',
    breed: 'SRD',
    age: '2 anos',
    gender: 'Fêmea',
    tutor: 'Ana Sousa',
    lastConsult: '2025-05-25',
  },
  {
    id: '3',
    name: 'Thor',
    species: 'Canina',
    breed: 'Golden Retriever',
    age: '5 anos',
    gender: 'Macho',
    tutor: 'Marcos Oliveira',
    lastConsult: '2025-05-18',
  },
  {
    id: '4',
    name: 'Meg',
    species: 'Canina',
    breed: 'Beagle',
    age: '4 anos',
    gender: 'Fêmea',
    tutor: 'Julia Santos',
    lastConsult: '2025-05-23',
  },
  {
    id: '5',
    name: 'Felix',
    species: 'Felina',
    breed: 'Persa',
    age: '6 anos',
    gender: 'Macho',
    tutor: 'Carla Mendes',
    lastConsult: '2025-05-15',
  }
];

const PatientsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [patients, setPatients] = React.useState(samplePatients);
  
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.tutor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.species.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateToPatientProfile = (id: string) => {
    navigate(`/patient/${id}`);
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Meus Pacientes</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar pacientes..."
                className="pl-8 h-10 w-full sm:w-[250px] rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate('/register-pet')}>
              Novo Paciente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Espécie</TableHead>
                  <TableHead className="hidden md:table-cell">Raça</TableHead>
                  <TableHead className="hidden md:table-cell">Idade</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Última Consulta</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.species}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.breed}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.age}</TableCell>
                      <TableCell>{patient.tutor}</TableCell>
                      <TableCell>{new Date(patient.lastConsult).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigateToPatientProfile(patient.id)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Nenhum paciente encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {filteredPatients.length} pacientes no total
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatientsList;
