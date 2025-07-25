-- Fix profiles RLS to prevent privilege escalation
-- Create a secure function to check if user can update user_type
CREATE OR REPLACE FUNCTION public.can_update_user_type(target_user_id uuid, new_user_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_type text;
BEGIN
  -- Get current user's type
  SELECT user_type INTO current_user_type
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Only admins can update user_type
  RETURN current_user_type = 'admin';
END;
$function$;

-- Drop the existing policy and create a more secure one
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (secure)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    -- Regular users can only update full_name and location
    (user_type = (SELECT user_type FROM public.profiles WHERE id = auth.uid())) OR
    -- Admins can update user_type via the secure function
    public.can_update_user_type(id, user_type)
  )
);