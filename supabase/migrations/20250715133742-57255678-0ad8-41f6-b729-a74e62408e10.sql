-- Modificar a tabela satisfaction_surveys para suportar tanto queue_customers quanto identity_appointments
-- Primeiro, vamos fazer backup dos dados existentes e depois modificar a estrutura

-- Adicionar nova coluna para identity_appointments
ALTER TABLE public.satisfaction_surveys 
ADD COLUMN identity_appointment_id uuid;

-- Permitir que queue_customer_id seja nullable 
ALTER TABLE public.satisfaction_surveys 
ALTER COLUMN queue_customer_id DROP NOT NULL;

-- Adicionar constraint para garantir que pelo menos um ID seja fornecido
ALTER TABLE public.satisfaction_surveys 
ADD CONSTRAINT satisfaction_surveys_customer_check 
CHECK (
  (queue_customer_id IS NOT NULL AND identity_appointment_id IS NULL) OR
  (queue_customer_id IS NULL AND identity_appointment_id IS NOT NULL)
);

-- Adicionar foreign key para identity_appointments
ALTER TABLE public.satisfaction_surveys 
ADD CONSTRAINT satisfaction_surveys_identity_appointment_id_fkey 
FOREIGN KEY (identity_appointment_id) 
REFERENCES public.identity_appointments(id);

-- Adicionar índices para performance
CREATE INDEX idx_satisfaction_surveys_identity_appointment_id 
ON public.satisfaction_surveys(identity_appointment_id);

-- Comentários para documentar as mudanças
COMMENT ON COLUMN public.satisfaction_surveys.identity_appointment_id IS 'ID do agendamento de identidade quando a pesquisa for para este tipo de serviço';
COMMENT ON CONSTRAINT satisfaction_surveys_customer_check ON public.satisfaction_surveys IS 'Garante que exatamente um tipo de customer_id seja fornecido';