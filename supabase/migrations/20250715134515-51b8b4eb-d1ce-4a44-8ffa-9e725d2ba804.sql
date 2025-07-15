-- Habilitar realtime updates apenas para as tabelas que ainda não estão configuradas

-- Para satisfaction_surveys
ALTER TABLE public.satisfaction_surveys REPLICA IDENTITY FULL;

-- Adicionar apenas satisfaction_surveys à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.satisfaction_surveys;

-- Para identity_appointments (caso ainda não esteja)
ALTER TABLE public.identity_appointments REPLICA IDENTITY FULL;

-- Tentar adicionar identity_appointments à publicação (pode falhar se já estiver)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.identity_appointments;
EXCEPTION
    WHEN duplicate_object THEN
        -- Se já existe, apenas ignorar
        NULL;
END $$;

-- Comentários para documentar
COMMENT ON TABLE public.satisfaction_surveys IS 'Tabela habilitada para realtime updates no dashboard';
COMMENT ON TABLE public.identity_appointments IS 'Tabela habilitada para realtime updates no dashboard';