-- Criar função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela de exames
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  exam_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  results TEXT,
  notes TEXT,
  veterinarian_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Políticas para veterinários verem seus exames
CREATE POLICY "Veterinários podem ver seus próprios exames" 
ON public.exams 
FOR SELECT 
USING (auth.uid() = veterinarian_id);

CREATE POLICY "Veterinários podem criar exames" 
ON public.exams 
FOR INSERT 
WITH CHECK (auth.uid() = veterinarian_id);

CREATE POLICY "Veterinários podem atualizar seus exames" 
ON public.exams 
FOR UPDATE 
USING (auth.uid() = veterinarian_id);

CREATE POLICY "Veterinários podem deletar seus exames" 
ON public.exams 
FOR DELETE 
USING (auth.uid() = veterinarian_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();