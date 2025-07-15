-- Verificar se identity_appointments tem realtime habilitado e configurar se necessário
-- Habilitar replica identity completa para capturar todas as mudanças
ALTER TABLE public.identity_appointments REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.identity_appointments;