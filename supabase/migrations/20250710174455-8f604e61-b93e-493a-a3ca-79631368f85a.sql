-- Create satisfaction survey table
CREATE TABLE public.satisfaction_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_customer_id UUID NOT NULL,
  attendant_id UUID NOT NULL,
  overall_rating TEXT NOT NULL CHECK (overall_rating IN ('Excelente', 'Bom', 'Regular', 'Ruim', 'Péssimo')),
  problem_resolved TEXT NOT NULL CHECK (problem_resolved IN ('Sim', 'Parcialmente', 'Não')),
  improvement_aspect TEXT NOT NULL CHECK (improvement_aspect IN ('Tempo de espera', 'Clareza das informações', 'Educação e cordialidade', 'Resolução do problema', 'Nenhuma melhoria necessária')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Create policies for satisfaction surveys
CREATE POLICY "Anyone can view satisfaction surveys" 
ON public.satisfaction_surveys 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create satisfaction surveys" 
ON public.satisfaction_surveys 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update satisfaction surveys" 
ON public.satisfaction_surveys 
FOR UPDATE 
USING (true);

-- Create foreign key relationships
ALTER TABLE public.satisfaction_surveys 
ADD CONSTRAINT satisfaction_surveys_queue_customer_id_fkey 
FOREIGN KEY (queue_customer_id) REFERENCES public.queue_customers(id);

ALTER TABLE public.satisfaction_surveys 
ADD CONSTRAINT satisfaction_surveys_attendant_id_fkey 
FOREIGN KEY (attendant_id) REFERENCES public.profiles(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_satisfaction_surveys_updated_at
BEFORE UPDATE ON public.satisfaction_surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();