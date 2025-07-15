-- Configurar a tabela queue_customers para real-time
ALTER TABLE public.queue_customers REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação para real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_customers;