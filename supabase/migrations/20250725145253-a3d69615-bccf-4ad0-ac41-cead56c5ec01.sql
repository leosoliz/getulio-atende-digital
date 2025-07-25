-- CRITICAL SECURITY FIXES

-- 1. Fix mutable function search paths by adding explicit search_path
CREATE OR REPLACE FUNCTION public.get_next_queue_number_by_location(location_uuid uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO next_number
  FROM public.queue_customers
  WHERE DATE(created_at) = CURRENT_DATE
    AND (location_uuid IS NULL OR location_id = location_uuid);
  
  RETURN next_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_next_queue_number()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO next_number
  FROM public.queue_customers
  WHERE DATE(created_at) = CURRENT_DATE;
  
  RETURN next_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, user_type, location_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'attendant'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'location_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'location_id')::UUID 
      ELSE NULL 
    END
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_receptionist_or_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'receptionist')
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_attendant_or_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'attendant')
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$function$;

-- 2. Create secure role checking function to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN (
        SELECT user_type 
        FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$function$;

-- 3. Fix profiles RLS to prevent users from updating their own user_type
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (restricted)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Only allow updating full_name and location for non-admins
    (user_type = OLD.user_type AND location_id IS NOT DISTINCT FROM OLD.location_id) 
    OR 
    -- Admins can update user_type
    public.is_admin()
  )
);

-- 4. Restrict vehicle bookings to authenticated users only
DROP POLICY IF EXISTS "Todos podem criar agendamentos" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "Todos podem editar agendamentos" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "Todos podem deletar agendamentos" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "Todos podem ver agendamentos" ON public.vehicle_bookings;

CREATE POLICY "Authenticated users can view bookings"
ON public.vehicle_bookings
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create bookings"
ON public.vehicle_bookings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own bookings"
ON public.vehicle_bookings
FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can delete bookings"
ON public.vehicle_bookings
FOR DELETE
USING (public.is_admin());

-- 5. Restrict fleet vehicles to authenticated users
DROP POLICY IF EXISTS "Todos podem ver veículos da frota" ON public.fleet_vehicles;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar frota" ON public.fleet_vehicles;

CREATE POLICY "Authenticated users can view fleet"
ON public.fleet_vehicles
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage fleet"
ON public.fleet_vehicles
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. Add rate limiting function for satisfaction surveys
CREATE OR REPLACE FUNCTION public.check_survey_rate_limit()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Allow max 5 surveys per hour from same source
  SELECT COUNT(*)
  INTO recent_count
  FROM public.satisfaction_surveys
  WHERE created_at > NOW() - INTERVAL '1 hour';
  
  RETURN recent_count < 5;
END;
$function$;

-- Update satisfaction survey policy with rate limiting
DROP POLICY IF EXISTS "Anyone can create satisfaction surveys" ON public.satisfaction_surveys;

CREATE POLICY "Rate limited satisfaction surveys"
ON public.satisfaction_surveys
FOR INSERT
WITH CHECK (public.check_survey_rate_limit());