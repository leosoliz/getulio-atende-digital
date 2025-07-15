-- Habilitar realtime updates para as tabelas do dashboard
-- Configurar REPLICA IDENTITY FULL para capturar dados completos durante updates

-- Para satisfaction_surveys
ALTER TABLE public.satisfaction_surveys REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.satisfaction_surveys;

-- Verificar se as outras tabelas já estão configuradas para realtime
-- (queue_customers e identity_appointments já devem estar configuradas, mas vamos garantir)

-- Para queue_customers 
ALTER TABLE public.queue_customers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_customers;

-- Para identity_appointments
ALTER TABLE public.identity_appointments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.identity_appointments;

-- Comentários para documentar
COMMENT ON TABLE public.satisfaction_surveys IS 'Tabela habilitada para realtime updates no dashboard';
COMMENT ON TABLE public.queue_customers IS 'Tabela habilitada para realtime updates no dashboard';  
COMMENT ON TABLE public.identity_appointments IS 'Tabela habilitada para realtime updates no dashboard';