import React, { useState, useEffect } from 'react';
import { User, Clock, Phone, AlertTriangle, Calendar, MessageSquare, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

interface Service {
  id: string;
  name: string;
  estimated_time: number;
}

interface QueueCustomer {
  id: string;
  name: string;
  phone: string;
  queue_number: number;
  service_id: string;
  is_priority: boolean;
  status: string;
  created_at: string;
  called_at: string | null;
  started_at: string | null;
  services: { name: string };
}

interface IdentityAppointment {
  id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

interface WhatsAppService {
  id: string;
  name: string;
  phone: string;
  service_id: string;
  notes: string | null;
  created_at: string;
  services: { name: string };
}

const Attendant: React.FC = () => {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [queueCustomers, setQueueCustomers] = useState<QueueCustomer[]>([]);
  const [identityAppointments, setIdentityAppointments] = useState<IdentityAppointment[]>([]);
  const [whatsappServices, setWhatsappServices] = useState<WhatsAppService[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<QueueCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasIdentityService, setHasIdentityService] = useState(false);
  
  // WhatsApp form states
  const [whatsappForm, setWhatsappForm] = useState({
    name: '',
    phone: '',
    service_id: '',
    notes: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchAttendantServices();
      fetchQueueCustomers();
      fetchIdentityAppointments();
      fetchWhatsappServices();
      
      const channel = supabase
        .channel('queue-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'queue_customers' },
          () => { fetchQueueCustomers(); }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'identity_appointments' },
          () => { fetchIdentityAppointments(); }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'whatsapp_services' },
          () => { fetchWhatsappServices(); }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const fetchAttendantServices = async () => {
    if (!profile?.id) return;
    
    const { data, error } = await supabase
      .from('attendant_services')
      .select(`
        service_id,
        services:service_id (
          id,
          name,
          estimated_time
        )
      `)
      .eq('attendant_id', profile.id);
    
    if (error) {
      console.error('Erro ao buscar serviços do atendente:', error);
      return;
    }
    
    const attendantServices = data?.map(item => item.services).filter(Boolean) || [];
    setServices(attendantServices);
    
    // Verificar se tem serviço de RG
    const hasRG = attendantServices.some(service => 
      service.name.toLowerCase().includes('identidade') || 
      service.name.toLowerCase().includes('rg')
    );
    setHasIdentityService(hasRG);
  };

  const fetchQueueCustomers = async () => {
    if (!profile?.id) return;
    
    const { data: attendantServices } = await supabase
      .from('attendant_services')
      .select('service_id')
      .eq('attendant_id', profile.id);
    
    if (!attendantServices || attendantServices.length === 0) return;
    
    const serviceIds = attendantServices.map(as => as.service_id);
    
    const { data, error } = await supabase
      .from('queue_customers')
      .select(`
        *,
        services:service_id (name)
      `)
      .in('service_id', serviceIds)
      .eq('status', 'waiting')
      .order('is_priority', { ascending: false })
      .order('queue_number');
    
    if (error) {
      console.error('Erro ao buscar fila:', error);
      return;
    }
    
    setQueueCustomers(data || []);
  };

  const fetchIdentityAppointments = async () => {
    if (!hasIdentityService) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('identity_appointments')
      .select('*')
      .eq('appointment_date', today)
      .in('status', ['scheduled', 'called'])
      .order('appointment_time');
    
    if (error) {
      console.error('Erro ao buscar agendamentos de identidade:', error);
      return;
    }
    
    setIdentityAppointments(data || []);
  };

  const fetchWhatsappServices = async () => {
    if (!profile?.id) return;
    
    const { data, error } = await supabase
      .from('whatsapp_services')
      .select(`
        *,
        services:service_id (name)
      `)
      .eq('attendant_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar atendimentos WhatsApp:', error);
      return;
    }
    
    setWhatsappServices(data || []);
  };

  const callNextCustomer = async () => {
    if (queueCustomers.length === 0) return;
    
    const nextCustomer = queueCustomers[0];
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('queue_customers')
        .update({
          status: 'called',
          attendant_id: profile?.id,
          called_at: new Date().toISOString()
        })
        .eq('id', nextCustomer.id);

      if (error) {
        throw error;
      }

      setCurrentCustomer(nextCustomer);
      toast({
        title: "Cidadão chamado",
        description: `${nextCustomer.name} foi chamado para atendimento`,
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao chamar cidadão",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const completeService = async (customer: QueueCustomer) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('queue_customers')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (error) {
        throw error;
      }

      setCurrentCustomer(null);
      toast({
        title: "Atendimento finalizado",
        description: `Atendimento de ${customer.name} foi finalizado`,
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar atendimento",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleWhatsappSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappForm.name || !whatsappForm.phone || !whatsappForm.service_id) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('whatsapp_services')
        .insert({
          name: whatsappForm.name,
          phone: whatsappForm.phone,
          service_id: whatsappForm.service_id,
          notes: whatsappForm.notes || null,
          attendant_id: profile?.id
        });

      if (error) {
        throw error;
      }

      setWhatsappForm({ name: '', phone: '', service_id: '', notes: '' });
      toast({
        title: "Atendimento WhatsApp registrado",
        description: "Atendimento foi registrado com sucesso",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao registrar atendimento",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const getWaitingTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return diffInMinutes;
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  if (!profile) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Painel do Atendente
          </h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo, {profile.full_name}
          </p>
        </div>

        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queue">Fila Atual</TabsTrigger>
            <TabsTrigger value="identity" disabled={!hasIdentityService}>
              Agendamentos RG
            </TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
              <Card className="shadow-shadow-card">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Atendimento Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {currentCustomer ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={currentCustomer.is_priority ? "destructive" : "secondary"}>
                            #{currentCustomer.queue_number}
                          </Badge>
                          {currentCustomer.is_priority && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Prioritário
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-lg">{currentCustomer.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentCustomer.services?.name}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground mt-2">
                          <Phone className="h-4 w-4 mr-1" />
                          {currentCustomer.phone}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => completeService(currentCustomer)}
                        disabled={loading}
                        className="w-full"
                      >
                        Finalizar Atendimento
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum atendimento em andamento</p>
                      <Button 
                        onClick={callNextCustomer}
                        disabled={loading || queueCustomers.length === 0}
                        className="mt-4"
                      >
                        {loading ? 'Chamando...' : 'Chamar Próximo'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-shadow-card">
                <CardHeader className="bg-gradient-to-r from-secondary/10 to-success/10">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Fila de Espera ({queueCustomers.length} pessoas)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {queueCustomers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum cidadão na fila
                      </p>
                    ) : (
                      queueCustomers.map((customer, index) => (
                        <div
                          key={customer.id}
                          className={`p-4 rounded-lg border ${
                            index === 0 ? 'border-primary bg-primary/5' : 'border-border bg-card'
                          } ${customer.is_priority ? 'border-destructive bg-destructive/5' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={customer.is_priority ? "destructive" : "secondary"}>
                                  #{customer.queue_number}
                                </Badge>
                                {customer.is_priority && (
                                  <Badge variant="destructive">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Prioritário
                                  </Badge>
                                )}
                                {index === 0 && (
                                  <Badge variant="outline">
                                    Próximo
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium">{customer.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {customer.services?.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-1" />
                                {getWaitingTime(customer.created_at)} min
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="identity">
            <Card className="shadow-shadow-card mt-6">
              <CardHeader className="bg-gradient-to-r from-secondary/10 to-success/10">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agendamentos de RG - Hoje ({identityAppointments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {identityAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum agendamento de RG para hoje
                    </p>
                  ) : (
                    identityAppointments.map((appointment, index) => (
                      <div
                        key={appointment.id}
                        className="p-4 rounded-lg border border-border bg-card"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {formatTime(appointment.appointment_time)}
                              </Badge>
                              <Badge variant={
                                appointment.status === 'scheduled' ? 'outline' : 'secondary'
                              }>
                                {appointment.status === 'scheduled' ? 'Agendado' : 'Chamado'}
                              </Badge>
                            </div>
                            <h4 className="font-medium">{appointment.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              RG - Emissão de Identidade
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Phone className="h-4 w-4 mr-1" />
                              {appointment.phone}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
              <Card className="shadow-shadow-card">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-600/10">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Registrar Atendimento WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleWhatsappSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome do Cidadão</label>
                      <Input
                        value={whatsappForm.name}
                        onChange={(e) => setWhatsappForm({...whatsappForm, name: e.target.value})}
                        placeholder="Digite o nome completo"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <Input
                        value={whatsappForm.phone}
                        onChange={(e) => setWhatsappForm({...whatsappForm, phone: e.target.value})}
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Serviço</label>
                      <select
                        value={whatsappForm.service_id}
                        onChange={(e) => setWhatsappForm({...whatsappForm, service_id: e.target.value})}
                        className="w-full p-2 border border-border rounded-md bg-card"
                        required
                      >
                        <option value="">Selecione um serviço</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <Textarea
                        value={whatsappForm.notes}
                        onChange={(e) => setWhatsappForm({...whatsappForm, notes: e.target.value})}
                        placeholder="Observações sobre o atendimento..."
                        rows={3}
                      />
                    </div>
                    
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Registrando...' : 'Registrar Atendimento'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="shadow-shadow-card">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-600/10">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Atendimentos WhatsApp ({whatsappServices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {whatsappServices.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum atendimento WhatsApp registrado
                      </p>
                    ) : (
                      whatsappServices.map((service, index) => (
                        <div
                          key={service.id}
                          className="p-4 rounded-lg border border-border bg-card"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  WhatsApp
                                </Badge>
                              </div>
                              <h4 className="font-medium">{service.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {service.services?.name}
                              </p>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Phone className="h-4 w-4 mr-1" />
                                {service.phone}
                              </div>
                              {service.notes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {service.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                {new Date(service.created_at).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(service.created_at).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Attendant;