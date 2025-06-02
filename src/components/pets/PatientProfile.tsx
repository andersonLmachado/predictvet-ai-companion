
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';

// Interface para os dados completos do pet e tutor
interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  age: string;
  gender: string;
  weight: string;
  observations: string;
  lastConsult: string;
  tutor: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
}

// Amostra de dados para simulação
const samplePatients: Record<string, Patient> = {
  '1': {
    id: '1',
    name: 'Max',
    species: 'Canina',
    breed: 'Labrador',
    birthDate: '2022-06-15',
    age: '3 anos',
    gender: 'Macho',
    weight: '28.5',
    observations: 'Alérgico a alguns tipos de ração. Apresentou dermatite no último ano.',
    lastConsult: '2025-05-20',
    tutor: {
      name: 'Carlos Silva',
      phone: '(11) 98765-4321',
      email: 'carlos@email.com',
      address: 'Rua das Flores, 123 - São Paulo/SP'
    }
  },
  '2': {
    id: '2',
    name: 'Luna',
    species: 'Felina',
    breed: 'SRD',
    birthDate: '2023-03-10',
    age: '2 anos',
    gender: 'Fêmea',
    weight: '4.2',
    observations: 'Castrada. Animal resgatado da rua em 2023.',
    lastConsult: '2025-05-25',
    tutor: {
      name: 'Ana Sousa',
      phone: '(11) 91234-5678',
      email: 'ana@email.com',
      address: 'Av. Paulista, 1000 - São Paulo/SP'
    }
  },
  '3': {
    id: '3',
    name: 'Thor',
    species: 'Canina',
    breed: 'Golden Retriever',
    birthDate: '2020-05-22',
    age: '5 anos',
    gender: 'Macho',
    weight: '32.1',
    observations: 'Castrado. Apresentou problemas articulares em 2024.',
    lastConsult: '2025-05-18',
    tutor: {
      name: 'Marcos Oliveira',
      phone: '(11) 97777-8888',
      email: 'marcos@email.com',
      address: 'Rua Augusta, 500 - São Paulo/SP'
    }
  }
};

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Buscar dados do paciente pelo ID
  const patient = id ? samplePatients[id] : null;
  
  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Paciente não encontrado</h2>
          <p className="text-muted-foreground mb-4">O paciente que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => navigate('/patients')}>Voltar para lista</Button>
        </div>
      </div>
    );
  }

  const handleEditPatient = () => {
    // Futuramente redirecionar para o formulário com dados pré-preenchidos
    navigate(`/edit-pet/${patient.id}`);
  };

  const handleDeletePatient = () => {
    // Simulação de exclusão
    setTimeout(() => {
      toast({
        title: "Paciente removido",
        description: `${patient.name} foi removido com sucesso.`,
      });
      navigate('/patients');
    }, 500);
  };
  
  // Calcular idade em anos a partir da data de nascimento
  const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age === 0) {
      // Calcular meses para animais com menos de 1 ano
      const months = today.getMonth() - birth.getMonth() + 
        (today.getFullYear() - birth.getFullYear()) * 12;
      return `${months} meses`;
    }
    
    return `${age} anos`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl">{patient.name}</CardTitle>
            <CardDescription>
              {patient.species} • {patient.breed} • {calculateAge(patient.birthDate)}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleEditPatient}>
              Editar Cadastro
            </Button>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Remover Pet</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover {patient.name} do cadastro? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePatient}>
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="profile">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              {/* Dados do Pet */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Informações do Pet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Espécie</p>
                    <p>{patient.species}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Raça</p>
                    <p>{patient.breed}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
                    <p>{new Date(patient.birthDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Idade</p>
                    <p>{calculateAge(patient.birthDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Gênero</p>
                    <p>{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Peso</p>
                    <p>{patient.weight} kg</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Observações</p>
                    <p className="whitespace-pre-wrap">{patient.observations || 'Nenhuma observação registrada.'}</p>
                  </div>
                </div>
              </div>

              <Separator />
              
              {/* Dados do Tutor */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Informações do Tutor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p>{patient.tutor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefone</p>
                    <p>{patient.tutor.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">E-mail</p>
                    <p>{patient.tutor.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Endereço</p>
                    <p>{patient.tutor.address || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Histórico de Consultas</h3>
                <p className="text-gray-500 mb-4">
                  Funcionalidade será implementada em atualizações futuras.
                </p>
                <Button variant="outline" onClick={() => navigate('/chat')}>
                  Iniciar Nova Consulta
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientProfile;
