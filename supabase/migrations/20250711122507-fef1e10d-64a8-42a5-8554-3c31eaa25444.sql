-- Criar tabela para agendamentos de identidade
CREATE TABLE public.identity_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'scheduled',
  called_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attendant_id UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.identity_appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view identity appointments" 
ON public.identity_appointments 
FOR SELECT 
USING (true);

CREATE POLICY "Receptionists can create identity appointments" 
ON public.identity_appointments 
FOR INSERT 
WITH CHECK (is_receptionist_or_admin());

CREATE POLICY "Attendants can update identity appointments" 
ON public.identity_appointments 
FOR UPDATE 
USING (is_attendant_or_admin());

-- Create trigger for timestamps
CREATE TRIGGER update_identity_appointments_updated_at
BEFORE UPDATE ON public.identity_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para atendimentos por WhatsApp
CREATE TABLE public.whatsapp_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id),
  attendant_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.whatsapp_services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Attendants can view their whatsapp services" 
ON public.whatsapp_services 
FOR SELECT 
USING (attendant_id = auth.uid());

CREATE POLICY "Attendants can create whatsapp services" 
ON public.whatsapp_services 
FOR INSERT 
WITH CHECK (attendant_id = auth.uid());

CREATE POLICY "Attendants can update their whatsapp services" 
ON public.whatsapp_services 
FOR UPDATE 
USING (attendant_id = auth.uid());