import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, XCircle, User, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  services: { name: string; estimated_time: number };
}

const Attendant: React.FC = () => {
  const [currentCustomer, setCurrentCustomer] = useState<QueueCustomer | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<QueueCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchQueues();
    
    // Configurar real-time para a fila
    const channel = supabase
      .channel('attendant-queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_customers' },
        () => { fetchQueues(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchQueues = async () => {
    if (!profile?.id) return;

    // Buscar cliente atual (em atendimento)
    const { data: currentData } = await supabase
      .from('queue_customers')
      .select(`
        *,
        services:service_id (name, estimated_time)
      `)
      .eq('attendant_id', profile.id)
      .eq('status', 'in_service')
      .single();

    setCurrentCustomer(currentData || null);

    // Buscar fila de espera (priorizar urgentes)
    const { data: waitingData } = await supabase
      .from('queue_customers')
      .select(`
        *,
        services:service_id (name, estimated_time)
      `)
      .eq('status', 'waiting')
      .order('is_priority', { ascending: false })
      .order('queue_number', { ascending: true })
      .limit(10);

    setWaitingQueue(waitingData || []);
  };

  const callNextCustomer = async () => {
    if (waitingQueue.length === 0) {
      toast({
        title: "Fila vazia",
        description: "Não há clientes aguardando atendimento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const nextCustomer = waitingQueue[0];
      
      const { error } = await supabase
        .from('queue_customers')
        .update({
          status: 'calling',
          attendant_id: profile?.id,
          called_at: new Date().toISOString()
        })
        .eq('id', nextCustomer.id);

      if (error) throw error;

      // Automaticamente iniciar o atendimento após chamar
      setTimeout(async () => {
        const { error: startError } = await supabase
          .from('queue_customers')
          .update({
            status: 'in_service',
            started_at: new Date().toISOString()
          })
          .eq('id', nextCustomer.id);

        if (!startError) {
          toast({
            title: "Atendimento iniciado",
            description: `${nextCustomer.name} está sendo atendido`,
          });
        }
      }, 2000); // 2 segundos após a chamada

      toast({
        title: "Cliente chamado",
        description: `${nextCustomer.name} foi chamado para atendimento`,
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao chamar cliente",
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cliente Atual */}
          <Card className="shadow-shadow-card">
            <CardHeader className="bg-gradient-to-r from-success/10 to-primary/10">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {currentCustomer ? 'Cliente em Atendimento' : 'Nenhum Cliente'}
              </CardTitle>
              <CardDescription>
                {currentCustomer ? 'Atendimento em andamento' : 'Chame o próximo cliente da fila'}
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
                  <h3 className="text-lg font-medium mb-2">Nenhum cliente sendo atendido</h3>
                  <p className="text-muted-foreground mb-6">
                    Chame o próximo cliente da fila para iniciar o atendimento
                  </p>
                  <Button 
                    onClick={callNextCustomer}
                    disabled={loading || waitingQueue.length === 0}
                    size="lg"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Chamar Próximo Cliente
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
                Clientes aguardando para serem chamados
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {waitingQueue.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum cliente aguardando
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
                    Chamar Próximo Cliente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Attendant;