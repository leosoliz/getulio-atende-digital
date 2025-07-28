import React, { useState, useEffect } from 'react';
import { User, Clock, Phone, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const Attendant: React.FC = () => {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [queueCustomers, setQueueCustomers] = useState<QueueCustomer[]>([]);
  const [identityAppointments, setIdentityAppointments] = useState<IdentityAppointment[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<QueueCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasIdentityService, setHasIdentityService] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchAttendantServices();
      fetchQueueCustomers();
      fetchIdentityAppointments();
      
      const channel = supabase
        .channel('queue-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'queue_customers' },
          () => { fetchQueueCustomers(); }
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

  const getWaitingTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return diffInMinutes;
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

        {hasIdentityService ? (
          <Tabs defaultValue="queue" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="queue">Fila Normal</TabsTrigger>
              <TabsTrigger value="identity">Agendamentos RG</TabsTrigger>
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
                                  {appointment.appointment_time}
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
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        )}
      </div>
    </div>
  );
};

export default Attendant;