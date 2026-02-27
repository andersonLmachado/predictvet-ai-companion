
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '@/contexts/PatientContext';
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
import { Search, Loader2 } from 'lucide-react';

const API_PATIENTS_URL = 'https://n8nvet.predictlab.com.br/webhook/buscar-pacientes';

type PatientRow = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string | number | null;
  owner_name: string;
  updated_at?: string;
};

const PatientsList = () => {
  const navigate = useNavigate();
  const { setSelectedPatient: setGlobalPatient } = usePatient();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_PATIENTS_URL);
        if (!response.ok) throw new Error('Falha ao buscar pacientes');
        const data = await response.json();
        const rawList = Array.isArray(data) ? data : data?.id != null ? [data] : [];
        const list: PatientRow[] = rawList.map((p: any) => ({
          id: String(p.id),
          name: p.name ?? '',
          species: p.species ?? '',
          breed: p.breed ?? '',
          age: p.age ?? null,
          owner_name: p.owner_name ?? '',
          updated_at: p.updated_at,
        }));
        setPatients(list);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.owner_name && patient.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (patient.breed && patient.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (patient.species && patient.species.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openPatientDetails = (patient: PatientRow) => {
    setGlobalPatient({
      id: patient.id,
      name: patient.name,
      owner_name: patient.owner_name,
      species: patient.species,
      breed: patient.breed,
      age: patient.age,
    });
    navigate(`/patient/${patient.id}`);
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
                  <TableHead className="hidden md:table-cell">Atualizado</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Carregando pacientes...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.species}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.breed}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.age ?? '—'}</TableCell>
                      <TableCell>{patient.owner_name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {patient.updated_at
                          ? new Date(patient.updated_at).toLocaleDateString('pt-BR')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPatientDetails(patient)}
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
            {loading ? 'Carregando...' : `${filteredPatients.length} pacientes no total`}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatientsList;
