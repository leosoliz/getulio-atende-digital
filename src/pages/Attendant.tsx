
import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, XCircle, User, Clock, AlertTriangle, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

interface QueueCustomer {
  id: string;
  name: string;
  phone: string;
  queue_number: number;
  service_id: string;
  is_priority: boolean;
  status: string;
  called_at: string | null;
  started_at: string | null;
  created_at: string;
  attendant_id: string | null;
  services: { name: string; estimated_time: number };
}

interface Service {
  id: string;
  name: string;
}

interface IdentityAppointment {
  id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

const Attendant: React.FC = () => {
  const [currentCustomer, setCurrentCustomer] = useState<QueueCustomer | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<QueueCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [identityAppointments, setIdentityAppointments] = useState<IdentityAppointment[]>([]);
  
  // WhatsApp service form states
  const [whatsappName, setWhatsappName] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappService, setWhatsappService] = useState('');
  const [whatsappNotes, setWhatsappNotes] = useState('');
  
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.id) {
      console.log('Profile not loaded yet, skipping data fetch');
      return;
    }

    console.log('Setting up attendant page with profile:', profile.id);
    fetchQueues();
    fetchServices();
    fetchIdentityAppointments();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    
    console.log('Setting up real-time subscriptions for profile:', profile.id);
    
    // Configurar real-time para a fila
    const channel = supabase
      .channel('attendant-queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_customers' },
        (payload) => { 
          console.log('Queue change detected:', payload);
          fetchQueues(); 
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'identity_appointments' },
        (payload) => { 
          console.log('Identity appointment change detected:', payload);
          fetchIdentityAppointments();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [profile?.id]); // Depender do profile.id para recriar a subscription quando necessário

  const fetchQueues = async () => {
    if (!profile?.id) return;

    try {
      // Buscar cliente atual (em atendimento)
      const { data: currentData } = await supabase
        .from('queue_customers')
        .select(`
          *,
          services:service_id (name, estimated_time)
        `)
        .eq('attendant_id', profile.id)
        .in('status', ['calling', 'in_service']);

      console.log('Current customer data:', currentData);
      // currentData pode ser um array quando há múltiplos clientes
      setCurrentCustomer(Array.isArray(currentData) ? currentData[0] || null : currentData || null);

      // Buscar serviços que o atendente pode prestar
      const { data: attendantServices, error: servicesError } = await supabase
        .from('attendant_services')
        .select('service_id')
        .eq('attendant_id', profile.id);

      console.log('Attendant services query result:', { attendantServices, servicesError, attendantId: profile.id });

      const serviceIds = attendantServices?.map(as => as.service_id) || [];
      console.log('Service IDs for attendant:', serviceIds);
      
      // Buscar fila de espera - Por enquanto, mostrar todos os clientes para debug
      const { data: waitingData, error } = await supabase
        .from('queue_customers')
        .select(`
          *,
          services:service_id (name, estimated_time)
        `)
        .eq('status', 'waiting')
        .order('is_priority', { ascending: false })
        .order('queue_number', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching waiting queue:', error);
        return;
      }

      console.log('Raw waiting queue data:', waitingData);
      
      // Se o atendente tem serviços específicos, filtrar, senão mostrar todos
      let filteredData = waitingData || [];
      if (serviceIds.length > 0) {
        filteredData = waitingData?.filter(customer => 
          serviceIds.includes(customer.service_id)
        ) || [];
        console.log('Filtered waiting queue for attendant services:', filteredData);
      } else {
        console.log('No services assigned to attendant - showing all customers for debug');
      }

      setWaitingQueue(filteredData);
    } catch (error) {
      console.error('Error in fetchQueues:', error);
    }
  };

  const fetchServices = async () => {
    if (!profile?.id) return;

    const { data: attendantServices } = await supabase
      .from('attendant_services')
      .select('service_id')
      .eq('attendant_id', profile.id);

    const serviceIds = attendantServices?.map(as => as.service_id) || [];
    
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name')
      .in('id', serviceIds)
      .eq('active', true);

    setServices(servicesData || []);
  };

  const fetchIdentityAppointments = async () => {
    if (!profile?.id) return;

    // Verificar se o atendente tem o serviço de Emissão de Identidade
    const { data: attendantServices } = await supabase
      .from('attendant_services')
      .select('service_id')
      .eq('attendant_id', profile.id);

    const serviceIds = attendantServices?.map(as => as.service_id) || [];
    
    // Buscar o ID do serviço de Emissão de Identidade
    const { data: identityService } = await supabase
      .from('services')
      .select('id')
      .eq('name', 'Emissão de Identidade')
      .single();

    // Só mostrar agendamentos se o atendente presta esse serviço
    if (!identityService || !serviceIds.includes(identityService.id)) {
      setIdentityAppointments([]);
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('identity_appointments')
      .select('*')
      .eq('appointment_date', today)
      .eq('status', 'scheduled')
      .order('appointment_time');

    setIdentityAppointments(data || []);
  };

  const callNextCustomer = async () => {
    if (waitingQueue.length === 0) {
      toast({
        title: "Fila vazia",
        description: "Não há cidadãos aguardando atendimento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const nextCustomer = waitingQueue[0];
      
      // Primeiro, chamar o cliente
      const { error: callError } = await supabase
        .from('queue_customers')
        .update({
          status: 'calling',
          attendant_id: profile?.id,
          called_at: new Date().toISOString()
        })
        .eq('id', nextCustomer.id);

      if (callError) throw callError;

      toast({
        title: "Cidadão chamado",
        description: `${nextCustomer.name} foi chamado para atendimento`,
      });

      // Atualizar estado imediatamente para refletir a mudança
      setCurrentCustomer({
        ...nextCustomer,
        status: 'calling',
        attendant_id: profile?.id,
        called_at: new Date().toISOString()
      });

      // Remover da fila de espera
      setWaitingQueue(prev => prev.filter(customer => customer.id !== nextCustomer.id));

      // Automaticamente iniciar o atendimento após 2 segundos
      setTimeout(async () => {
        const { error: startError } = await supabase
          .from('queue_customers')
          .update({
            status: 'in_service',
            started_at: new Date().toISOString()
          })
          .eq('id', nextCustomer.id);

        if (!startError) {
          // Atualizar estado local também
          setCurrentCustomer(prev => prev ? {
            ...prev,
            status: 'in_service',
            started_at: new Date().toISOString()
          } : null);

          toast({
            title: "Atendimento iniciado",
            description: `${nextCustomer.name} está sendo atendido`,
          });
        }
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Erro ao chamar cidadão",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const startService = async (customerId: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('queue_customers')
        .update({
          status: 'in_service',
          started_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: "Atendimento iniciado",
        description: "O atendimento foi iniciado com sucesso",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar atendimento",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const completeService = async (customerId: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('queue_customers')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: "Atendimento concluído",
        description: "O atendimento foi finalizado com sucesso",
      });
      
      setCurrentCustomer(null);
      
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar atendimento",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const getServiceTime = (startedAt: string) => {
    const now = new Date();
    const started = new Date(startedAt);
    const diffInMinutes = Math.floor((now.getTime() - started.getTime()) / (1000 * 60));
    return diffInMinutes;
  };

  const getWaitingTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return diffInMinutes;
  };

  const callIdentityAppointment = async (appointmentId: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('identity_appointments')
        .update({
          status: 'calling',
          attendant_id: profile?.id,
          called_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Automaticamente iniciar o atendimento após 2 segundos
      setTimeout(async () => {
        const { error: startError } = await supabase
          .from('identity_appointments')
          .update({
            status: 'in_service',
            started_at: new Date().toISOString()
          })
          .eq('id', appointmentId);

        if (!startError) {
          const appointment = identityAppointments.find(a => a.id === appointmentId);
          toast({
            title: "Agendamento iniciado",
            description: `${appointment?.name} está sendo atendido`,
          });
        }
      }, 2000);

      toast({
        title: "Agendamento chamado",
        description: "Cidadão foi chamado para atendimento",
      });
      
      fetchIdentityAppointments();
    } catch (error: any) {
      toast({
        title: "Erro ao chamar agendamento",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const completeIdentityAppointment = async (appointmentId: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('identity_appointments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento concluído",
        description: "Agendamento foi finalizado com sucesso",
      });
      
      fetchIdentityAppointments();
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar agendamento",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const registerWhatsappService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!whatsappName || !whatsappPhone || !whatsappService) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('whatsapp_services')
        .insert({
          name: whatsappName,
          phone: whatsappPhone,
          service_id: whatsappService,
          attendant_id: profile?.id,
          notes: whatsappNotes
        });

      if (error) throw error;

      toast({
        title: "Atendimento registrado",
        description: `Atendimento por WhatsApp de ${whatsappName} foi registrado`,
      });

      // Limpar formulário
      setWhatsappName('');
      setWhatsappPhone('');
      setWhatsappService('');
      setWhatsappNotes('');
      
    } catch (error: any) {
      toast({
        title: "Erro ao registrar atendimento",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cliente Atual */}
          <Card className="shadow-shadow-card">
            <CardHeader className="bg-gradient-to-r from-success/10 to-primary/10">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {currentCustomer ? 'Cidadão em Atendimento' : 'Nenhum Cidadão'}
              </CardTitle>
              <CardDescription>
                {currentCustomer ? 'Atendimento em andamento' : 'Chame o próximo cidadão da fila'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {currentCustomer ? (
                <div className="space-y-6">
                  <div className={`p-6 rounded-lg border-2 ${
                    currentCustomer.is_priority 
                      ? 'border-destructive bg-destructive/5' 
                      : 'border-success bg-success/5'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
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
                        <h3 className="text-xl font-bold">{currentCustomer.name}</h3>
                        <p className="text-muted-foreground">{currentCustomer.phone}</p>
                        <p className="font-medium">{currentCustomer.services?.name}</p>
                      </div>
                      {currentCustomer.started_at && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Tempo de atendimento</p>
                          <p className="text-2xl font-bold text-primary">
                            {getServiceTime(currentCustomer.started_at)} min
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {currentCustomer.status === 'calling' && (
                        <Button 
                          onClick={() => startService(currentCustomer.id)}
                          disabled={loading}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Iniciar Atendimento
                        </Button>
                      )}
                      
                      {currentCustomer.status === 'in_service' && (
                        <Button 
                          onClick={() => completeService(currentCustomer.id)}
                          disabled={loading}
                          variant="outline"
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Finalizar Atendimento
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum cidadão sendo atendido</h3>
                  <p className="text-muted-foreground mb-6">
                    Chame o próximo cidadão da fila para iniciar o atendimento
                  </p>
                  <Button 
                    onClick={callNextCustomer}
                    disabled={loading || waitingQueue.length === 0}
                    size="lg"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Chamar Próximo Cidadão
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fila de Espera */}
          <Card className="shadow-shadow-card">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próximos na Fila ({waitingQueue.length})
              </CardTitle>
              <CardDescription>
                Cidadãos aguardando para serem chamados
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {waitingQueue.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum cidadão aguardando
                  </p>
                ) : (
                  waitingQueue.map((customer, index) => (
                    <div
                      key={customer.id}
                      className={`p-4 rounded-lg border ${
                        customer.is_priority
                          ? 'border-destructive bg-destructive/5'
                          : 'border-border bg-card'
                      } ${index === 0 ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
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
                              <Badge variant="outline" className="bg-primary text-primary-foreground">
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
                          <p className="text-xs text-muted-foreground">
                            Tempo estimado: {customer.services?.estimated_time} min
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {!currentCustomer && waitingQueue.length > 0 && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={callNextCustomer}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Chamar Próximo Cidadão
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agendamentos de Identidade */}
          {identityAppointments.length > 0 && (
            <Card className="shadow-shadow-card">
              <CardHeader className="bg-gradient-to-r from-accent/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agendamentos Identidade ({identityAppointments.length})
                </CardTitle>
                <CardDescription>
                  Agendamentos para hoje
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {identityAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{appointment.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {appointment.phone}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            {appointment.appointment_time}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {appointment.status === 'scheduled' ? 'Agendado' : 'Em atendimento'}
                        </Badge>
                      </div>
                      
                      {appointment.status === 'scheduled' && (
                        <Button 
                          onClick={() => callIdentityAppointment(appointment.id)}
                          disabled={loading}
                          size="sm"
                          className="w-full"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Chamar Agendamento
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* WhatsApp Service Registration */}
        <div className="mt-8">
          <Card className="shadow-shadow-card">
            <CardHeader className="bg-gradient-to-r from-success/10 to-primary/10">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Registrar Atendimento por WhatsApp
              </CardTitle>
              <CardDescription>
                Registre um atendimento que foi realizado via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={registerWhatsappService} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="whatsapp-name">Nome do Cidadão</Label>
                  <Input
                    id="whatsapp-name"
                    value={whatsappName}
                    onChange={(e) => setWhatsappName(e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="whatsapp-phone">Telefone</Label>
                  <Input
                    id="whatsapp-phone"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="(47) 99999-9999"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="whatsapp-service">Serviço Prestado</Label>
                  <Select value={whatsappService} onValueChange={setWhatsappService} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="whatsapp-notes">Observações (opcional)</Label>
                  <Textarea
                    id="whatsapp-notes"
                    value={whatsappNotes}
                    onChange={(e) => setWhatsappNotes(e.target.value)}
                    placeholder="Detalhes do atendimento..."
                    className="min-h-[40px]"
                  />
                </div>
                
                <div className="md:col-span-2 lg:col-span-4">
                  <Button type="submit" disabled={loading} className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {loading ? 'Registrando...' : 'Registrar Atendimento'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Attendant;
