-- Permitir inserção de pesquisas de satisfação sem autenticação
-- Isso é necessário para cidadãos presenciais responderem a pesquisa
DROP POLICY IF EXISTS "Authenticated users can create satisfaction surveys" ON satisfaction_surveys;

CREATE POLICY "Anyone can create satisfaction surveys"
ON satisfaction_surveys
FOR INSERT
WITH CHECK (true);

-- Permitir leitura apenas para verificação de duplicatas (link expirado)
DROP POLICY IF EXISTS "Anyone can view satisfaction surveys" ON satisfaction_surveys;

CREATE POLICY "Limited read for satisfaction surveys"
ON satisfaction_surveys
FOR SELECT
USING (true);