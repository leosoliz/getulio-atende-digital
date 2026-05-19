CREATE OR REPLACE FUNCTION public.check_survey_rate_limit_by_attendant(_attendant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO recent_count
  FROM public.satisfaction_surveys
  WHERE attendant_id = _attendant_id
    AND created_at > NOW() - INTERVAL '1 hour';

  RETURN recent_count < 20;
END;
$$;

DROP POLICY IF EXISTS "Rate limited satisfaction surveys" ON public.satisfaction_surveys;

CREATE POLICY "Rate limited satisfaction surveys"
ON public.satisfaction_surveys
FOR INSERT
WITH CHECK (public.check_survey_rate_limit_by_attendant(attendant_id));