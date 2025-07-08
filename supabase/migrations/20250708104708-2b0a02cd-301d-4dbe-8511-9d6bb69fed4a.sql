-- Add location field to profiles table for desk/location information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.profiles.location IS 'Physical location or desk number where the user works (e.g., Mesa 3, Guichê 1)';