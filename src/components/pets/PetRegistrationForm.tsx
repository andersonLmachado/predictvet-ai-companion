import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PetData {
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  gender: string;
  weight: string;
  observations: string;
}

interface TutorData {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const PetRegistrationForm = () => {
  const navigate = useNavigate();
  const [petData, setPetData] = useState<PetData>({
    name: '',
    species: '',
    breed: '',
    birthDate: '',
    gender: '',
    weight: '',
    observations: '',
  });

  const [tutorData, setTutorData] = useState<TutorData>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handlePetChange = (field: keyof PetData, value: string) => {
    setPetData(prev => ({ ...prev, [field]: value }));
  };

  const handleTutorChange = (field: keyof TutorData, value: string) => {
    setTutorData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredPetFields: (keyof PetData)[] = ['name', 'species', 'breed', 'birthDate', 'gender', 'weight'];
    const requiredTutorFields: (keyof TutorData)[] = ['name', 'phone', 'email'];

    for (const field of requiredPetFields) {
      if (!petData[field]) {
        toast({
          title: "Campo obrigatório",
          description: `Por favor, preencha o campo ${field} do pet.`,
          variant: "destructive",
        });
        return false;
      }
    }

    for (const field of requiredTutorFields) {
      if (!tutorData[field]) {
        toast({
          title: "Campo obrigatório",
          description: `Por favor, preencha o campo ${field} do tutor.`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tutorData.email)) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para cadastrar um paciente.",
          variant: "destructive",
        });
        return;
      }

      // Calcular idade a partir da data de nascimento
      const birthDate = new Date(petData.birthDate);
      const today = new Date();
      let ageYears = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        ageYears--;
      }

      // Enviar dados para o Webhook com os nomes corretos das colunas
      const response = await fetch('https://vet-api.predictlab.com.br/webhook/cadastrar-paciente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: petData.name,
          species: petData.species,
          breed: petData.breed,
          age: String(ageYears),
          sex: petData.gender,
          weight: parseFloat(petData.weight),
          owner_name: tutorData.name,
          owner_phone: tutorData.phone,
          owner_email: tutorData.email,
          veterinarian_id: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: Falha ao cadastrar paciente`);
      }
      
      toast({
        title: "Pet cadastrado com sucesso!",
        description: `${petData.name} foi adicionado aos seus pacientes.`,
      });

      // Limpar formulário após sucesso
      setPetData({
        name: '',
        species: '',
        breed: '',
        birthDate: '',
        gender: '',
        weight: '',
        observations: '',
      });
      
      setTutorData({
        name: '',
        phone: '',
        email: '',
        address: '',
      });

      // Redirecionar para lista de pacientes
      navigate('/patients');
      
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast({
        title: "Erro ao cadastrar pet",
        description: error.message || "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPetData({
      name: '',
      species: '',
      breed: '',
      birthDate: '',
      gender: '',
      weight: '',
      observations: '',
    });
    
    setTutorData({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
    
    toast({
      title: "Formulário limpo",
      description: "Todos os campos foram resetados.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cadastro de Novo Paciente</CardTitle>
          <CardDescription>
            Preencha as informações do pet e do tutor responsável
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Dados do Pet */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Dados do Pet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="petName">Nome do Pet *</Label>
                  <Input
                    id="petName"
                    value={petData.name}
                    onChange={(e) => handlePetChange('name', e.target.value)}
                    placeholder="Ex: Thor, Luna..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="species">Espécie *</Label>
                  <Select value={petData.species} onValueChange={(value) => handlePetChange('species', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a espécie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="canina">Canina</SelectItem>
                      <SelectItem value="felina">Felina</SelectItem>
                      <SelectItem value="aves">Aves</SelectItem>
                      <SelectItem value="repteis">Répteis</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">Raça *</Label>
                  <Input
                    id="breed"
                    value={petData.breed}
                    onChange={(e) => handlePetChange('breed', e.target.value)}
                    placeholder="Ex: Labrador, SRD, Persa..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={petData.birthDate}
                    onChange={(e) => handlePetChange('birthDate', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={petData.weight}
                    onChange={(e) => handlePetChange('weight', e.target.value)}
                    placeholder="Ex: 5.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gênero *</Label>
                  <RadioGroup 
                    value={petData.gender} 
                    onValueChange={(value) => handlePetChange('gender', value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="macho" id="macho" />
                      <Label htmlFor="macho">Macho</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="femea" id="femea" />
                      <Label htmlFor="femea">Fêmea</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="desconhecido" id="desconhecido" />
                      <Label htmlFor="desconhecido">Desconhecido</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="observations">Observações Adicionais</Label>
                <Textarea
                  id="observations"
                  value={petData.observations}
                  onChange={(e) => handlePetChange('observations', e.target.value)}
                  placeholder="Informações importantes sobre o pet (alergias, medicamentos, comportamento, etc.)"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Dados do Tutor */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Dados do Tutor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tutorName">Nome Completo *</Label>
                  <Input
                    id="tutorName"
                    value={tutorData.name}
                    onChange={(e) => handleTutorChange('name', e.target.value)}
                    placeholder="Nome completo do tutor"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutorPhone">Telefone *</Label>
                  <Input
                    id="tutorPhone"
                    value={tutorData.phone}
                    onChange={(e) => handleTutorChange('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutorEmail">E-mail *</Label>
                  <Input
                    id="tutorEmail"
                    type="email"
                    value={tutorData.email}
                    onChange={(e) => handleTutorChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutorAddress">Endereço</Label>
                  <Input
                    id="tutorAddress"
                    value={tutorData.address}
                    onChange={(e) => handleTutorChange('address', e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Limpar Formulário
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Cadastro"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PetRegistrationForm;
