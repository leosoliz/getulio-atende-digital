
CREATE OR REPLACE FUNCTION public.get_today_completed_identity_appointments()
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  attendant_id uuid,
  completed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ia.id, ia.name, ia.phone, ia.attendant_id, ia.completed_at
  FROM public.identity_appointments ia
  WHERE ia.status = 'completed'
    AND ia.completed_at >= (CURRENT_DATE)::timestamptz
    AND ia.completed_at <  (CURRENT_DATE + INTERVAL '1 day')::timestamptz
  ORDER BY ia.completed_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_today_completed_identity_appointments() TO anon, authenticated;
