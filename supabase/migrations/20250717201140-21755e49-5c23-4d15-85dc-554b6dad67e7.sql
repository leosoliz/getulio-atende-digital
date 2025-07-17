-- Adicionar suporte para pesquisas de satisfação de atendimentos via WhatsApp

-- Adicionar nova coluna para whatsapp_services
ALTER TABLE public.satisfaction_surveys 
ADD COLUMN whatsapp_service_id uuid;

-- Adicionar foreign key para whatsapp_services
ALTER TABLE public.satisfaction_surveys 
ADD CONSTRAINT satisfaction_surveys_whatsapp_service_id_fkey 
FOREIGN KEY (whatsapp_service_id) 
REFERENCES public.whatsapp_services(id);

-- Modificar a constraint existente para incluir whatsapp_service_id
ALTER TABLE public.satisfaction_surveys 
DROP CONSTRAINT satisfaction_surveys_customer_check;

-- Adicionar nova constraint que permite exatamente um tipo de customer_id
ALTER TABLE public.satisfaction_surveys 
ADD CONSTRAINT satisfaction_surveys_customer_check 
CHECK (
  (queue_customer_id IS NOT NULL AND identity_appointment_id IS NULL AND whatsapp_service_id IS NULL) OR
  (queue_customer_id IS NULL AND identity_appointment_id IS NOT NULL AND whatsapp_service_id IS NULL) OR
  (queue_customer_id IS NULL AND identity_appointment_id IS NULL AND whatsapp_service_id IS NOT NULL)
);

-- Adicionar índice para performance
CREATE INDEX idx_satisfaction_surveys_whatsapp_service_id 
ON public.satisfaction_surveys(whatsapp_service_id);

-- Comentário para documentar a mudança
COMMENT ON COLUMN public.satisfaction_surveys.whatsapp_service_id IS 'ID do atendimento via WhatsApp quando a pesquisa for para este tipo de serviço';