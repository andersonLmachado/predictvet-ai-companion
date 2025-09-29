import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ExamFormDialog from './ExamFormDialog';
import { useToast } from '@/hooks/use-toast';

interface Exam {
  id: string;
  patient_id: string;
  exam_type: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  results: string | null;
  notes: string | null;
}

const ExamsList = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: exams, isLoading, refetch } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as Exam[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800';
      case 'concluído':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      em_andamento: 'Em Andamento',
      concluído: 'Concluído',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando exames...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exames</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as solicitações de exames dos pacientes
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Solicitar Exame
        </Button>
      </div>

      {exams && exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum exame solicitado</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Comece solicitando o primeiro exame para seus pacientes.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Primeiro Exame
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams?.map((exam) => (
            <Card key={exam.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{exam.exam_type}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(exam.requested_at), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(exam.status)}>
                    {getStatusLabel(exam.status)}
                  </Badge>
                </div>
              </CardHeader>
              {exam.notes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{exam.notes}</p>
                  {exam.results && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Resultados:</h4>
                      <p className="text-sm">{exam.results}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <ExamFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          refetch();
          toast({
            title: 'Exame solicitado',
            description: 'O exame foi solicitado com sucesso.',
          });
        }}
      />
    </div>
  );
};

export default ExamsList;
