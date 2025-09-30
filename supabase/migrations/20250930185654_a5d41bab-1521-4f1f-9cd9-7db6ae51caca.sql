-- Criar tabela de pacientes
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  sex TEXT,
  weight DECIMAL(10,2),
  owner_name TEXT NOT NULL,
  owner_phone TEXT,
  owner_email TEXT,
  veterinarian_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Políticas para veterinários
CREATE POLICY "Veterinários podem ver seus próprios pacientes" 
ON public.patients 
FOR SELECT 
USING (auth.uid() = veterinarian_id);

CREATE POLICY "Veterinários podem criar pacientes" 
ON public.patients 
FOR INSERT 
WITH CHECK (auth.uid() = veterinarian_id);

CREATE POLICY "Veterinários podem atualizar seus pacientes" 
ON public.patients 
FOR UPDATE 
USING (auth.uid() = veterinarian_id);

CREATE POLICY "Veterinários podem deletar seus pacientes" 
ON public.patients 
FOR DELETE 
USING (auth.uid() = veterinarian_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();