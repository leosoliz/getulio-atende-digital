-- Adicionar política para permitir que todos vejam registros de whatsapp_services no dashboard
CREATE POLICY "Anyone can view whatsapp services for dashboard"
ON public.whatsapp_services
FOR SELECT
USING (true);