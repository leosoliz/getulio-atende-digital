-- Verificar e corrigir a configuração de realtime do Supabase
-- 1. Garantir que as tabelas tenham REPLICA IDENTITY FULL para capturar todas as mudanças
ALTER TABLE public.queue_customers REPLICA IDENTITY FULL;
ALTER TABLE public.identity_appointments REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_services REPLICA IDENTITY FULL;

-- 2. Garantir que as tabelas estão adicionadas à publicação de realtime
DO $$
BEGIN
    -- Para queue_customers
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_customers;
    EXCEPTION WHEN duplicate_object THEN
        -- Já existe, ignorar
        RAISE NOTICE 'queue_customers já está na publicação realtime';
    END;
    
    -- Para identity_appointments
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.identity_appointments;
    EXCEPTION WHEN duplicate_object THEN
        -- Já existe, ignorar
        RAISE NOTICE 'identity_appointments já está na publicação realtime';
    END;
    
    -- Para whatsapp_services
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_services;
    EXCEPTION WHEN duplicate_object THEN
        -- Já existe, ignorar
        RAISE NOTICE 'whatsapp_services já está na publicação realtime';
    END;
END;
$$;

-- 3. Adicionar comentários para documentação
COMMENT ON TABLE public.queue_customers IS 'Tabela de fila de espera com realtime updates habilitados';
COMMENT ON TABLE public.identity_appointments IS 'Tabela de agendamentos com realtime updates habilitados';
COMMENT ON TABLE public.whatsapp_services IS 'Tabela de serviços WhatsApp com realtime updates habilitados';