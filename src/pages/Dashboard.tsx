
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Phone, User, Users, Timer, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator"
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Header from '@/components/Header';
import SatisfactionIndicators from '@/components/SatisfactionIndicators';

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

interface IdentityAppointment {
  id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  called_at: string | null;
  started_at: string | null;
  created_at: string;
  attendant_id: string | null;
}

interface CallQueueItem {
  id: string;
  name: string;
  phone: string;
  queue_number: number;
  showUntil: Date;
  type: 'queue' | 'appointment';
  called_at: string | null;
  started_at: string | null;
  created_at: string;
  attendant_id: string | null;
  // Optional fields for queue customers
  service_id?: string;
  is_priority?: boolean;
  services?: { name: string; estimated_time?: number };
  // Optional fields for appointments
  appointment_date?: string;
  appointment_time?: string;
}

const Dashboard: React.FC = () => {
  const [totalAttendances, setTotalAttendances] = useState(0);
  const [averageServiceTime, setAverageServiceTime] = useState(0);
  const [averageWaitTime, setAverageWaitTime] = useState(0);
  const [connectionHealth, setConnectionHealth] = useState(true);
  const [callQueue, setCallQueue] = useState<CallQueueItem[]>([]);
  const [waitingQueue, setWaitingQueue] = useState<QueueCustomer[]>([]);

  const lastDataFetchRef = useRef(new Date());
  const connectionHealthRef = useRef(true);
  const bellAudioRef = useRef<HTMLAudioElement>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Inicializar SpeechSynthesis
    speechSynthRef.current = window.speechSynthesis;

    // Carregar áudio da campainha
    bellAudioRef.current = new Audio('/sounds/bell.mp3');

    // Buscar dados iniciais
    fetchDashboardData();

    // Monitorar saúde da conexão e limpar chamadas expiradas
    const healthInterval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - lastDataFetchRef.current.getTime();
      const minutesSinceLastFetch = Math.floor(diff / 60000);

      if (minutesSinceLastFetch > 2) {
        console.warn('⚠️ Sem dados recentes - possível problema de conexão');
        connectionHealthRef.current = false;
        setConnectionHealth(false);
      } else {
        connectionHealthRef.current = true;
        setConnectionHealth(true);
      }

      // Limpar chamadas expiradas
      setCallQueue(prev => prev.filter(call => call.showUntil > now));
    }, 5000);

    // Configure realtime subscription
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_customers' },
        (payload) => {
          console.log('📥 Queue customer change:', payload.eventType, payload.new);
          lastDataFetchRef.current = new Date();
          connectionHealthRef.current = true;
          
          if (payload.eventType === 'UPDATE' && 
              payload.new && 
              typeof payload.new === 'object' && 
              'id' in payload.new && 
              'status' in payload.new && 
              payload.new.status === 'calling') {
            handleNewCall(payload.new as QueueCustomer);
          }
          fetchDashboardData();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'identity_appointments' },
        (payload) => {
          console.log('📥 Identity appointment change:', payload.eventType, payload.new);
          lastDataFetchRef.current = new Date();
          connectionHealthRef.current = true;
          
          if (payload.eventType === 'UPDATE' && 
              payload.new && 
              typeof payload.new === 'object' && 
              'id' in payload.new && 
              'status' in payload.new && 
              payload.new.status === 'calling') {
            handleNewAppointmentCall(payload.new as IdentityAppointment);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard connected to realtime');
          connectionHealthRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Dashboard realtime error');
          connectionHealthRef.current = false;
        }
      });

    // Cleanup ao desmontar
    return () => {
      console.log('🧹 Limpando subscriptions realtime...');
      supabase.removeChannel(channel);
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
      clearInterval(healthInterval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Total de atendimentos realizados no dia (queue_customers + whatsapp + agendamentos)
      const today = new Date().toISOString().split('T')[0];
      
      const [{ count: queueCount }, { count: whatsappCount }, { count: appointmentCount }] = await Promise.all([
        supabase
          .from('queue_customers')
          .select('*', { count: 'exact' })
          .eq('status', 'completed')
          .gte('created_at', today + 'T00:00:00.000Z'),
        supabase
          .from('whatsapp_services')
          .select('*', { count: 'exact' })
          .gte('created_at', today + 'T00:00:00.000Z'),
        supabase
          .from('identity_appointments')
          .select('*', { count: 'exact' })
          .eq('status', 'completed')
          .gte('created_at', today + 'T00:00:00.000Z')
      ]);
      
      setTotalAttendances((queueCount || 0) + (whatsappCount || 0) + (appointmentCount || 0));

      // Buscar fila de espera completa para exibir
      const { data: waitingData } = await supabase
        .from('queue_customers')
        .select(`
          *,
          services:service_id (name, estimated_time)
        `)
        .eq('status', 'waiting')
        .order('is_priority', { ascending: false })
        .order('created_at', { ascending: true });
      setWaitingQueue(waitingData || []);

      // Tempo médio de atendimento (atendimentos finalizados hoje)
      const { data: completedAttendances } = await supabase
        .from('queue_customers')
        .select('started_at, completed_at')
        .eq('status', 'completed')
        .not('started_at', 'is', null)
        .not('completed_at', 'is', null)
        .gte('created_at', today + 'T00:00:00.000Z');

      if (completedAttendances && completedAttendances.length > 0) {
        const avgService = completedAttendances.reduce((sum, attendance) => {
          const serviceTime = (new Date(attendance.completed_at!).getTime() - new Date(attendance.started_at!).getTime()) / 60000;
          return sum + serviceTime;
        }, 0) / completedAttendances.length;
        setAverageServiceTime(Math.round(avgService));
      } else {
        setAverageServiceTime(0);
      }

      // Tempo médio de espera (desde cadastro até chamado)
      const { data: calledCustomers } = await supabase
        .from('queue_customers')
        .select('created_at, called_at')
        .not('called_at', 'is', null)
        .gte('created_at', today + 'T00:00:00.000Z');
      
      if (calledCustomers && calledCustomers.length > 0) {
        const avgWait = calledCustomers.reduce((sum, customer) => {
          const waitTime = (new Date(customer.called_at!).getTime() - new Date(customer.created_at).getTime()) / 60000;
          return sum + waitTime;
        }, 0) / calledCustomers.length;
        setAverageWaitTime(Math.round(avgWait));
      } else {
        setAverageWaitTime(0);
      }

      lastDataFetchRef.current = new Date();
      connectionHealthRef.current = true;
      setConnectionHealth(true);
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      connectionHealthRef.current = false;
      setConnectionHealth(false);
      toast({
        title: "Erro ao buscar dados",
        description: "Não foi possível atualizar os dados do painel",
        variant: "destructive",
      });
    }
  };

  const handleNewCall = async (newCall: QueueCustomer) => {
    try {
      console.log('🔔 Nova chamada recebida:', newCall.id, newCall.name);
      
      // Prevenir chamadas duplicadas
      if (callQueue.some(call => call.id === newCall.id)) {
        console.log('⚠️ Chamada duplicada ignorada:', newCall.id);
        return;
      }

      // Buscar dados completos do cliente
      const { data: fullCall } = await supabase
        .from('queue_customers')
        .select(`
          *,
          services:service_id (name, estimated_time)
        `)
        .eq('id', newCall.id)
        .single();

      if (fullCall) {
        const callWithTimer: CallQueueItem = {
          id: fullCall.id,
          name: fullCall.name,
          phone: fullCall.phone,
          queue_number: fullCall.queue_number,
          showUntil: new Date(Date.now() + 10000), // Mostrar por 10 segundos
          type: 'queue',
          called_at: fullCall.called_at,
          started_at: fullCall.started_at,
          created_at: fullCall.created_at,
          attendant_id: fullCall.attendant_id,
          service_id: fullCall.service_id,
          is_priority: fullCall.is_priority,
          services: fullCall.services
        };

        setCallQueue(prev => {
          // Remover chamadas expiradas e adicionar nova
          const filtered = prev.filter(call => call.showUntil > new Date());
          return [...filtered, callWithTimer];
        });

        // Tocar campainha e falar nome
        playBell(newCall.name, newCall.queue_number, 'Fila Geral');
        speakName(newCall.name, newCall.queue_number, 'Fila Geral');
      }
    } catch (error) {
      console.error('❌ Erro ao processar nova chamada:', error);
    }
  };

  const handleNewAppointmentCall = async (newAppointment: IdentityAppointment) => {
    try {
      console.log('🔔 Nova chamada de agendamento recebida:', newAppointment.id, newAppointment.name);
      
      // Prevenir chamadas duplicadas
      if (callQueue.some(call => call.id === newAppointment.id)) {
        console.log('⚠️ Chamada de agendamento duplicada ignorada:', newAppointment.id);
        return;
      }

      const callWithTimer: CallQueueItem = {
        id: newAppointment.id,
        name: newAppointment.name,
        phone: newAppointment.phone,
        queue_number: 0, // Agendamentos não têm número de fila
        showUntil: new Date(Date.now() + 10000),
        type: 'appointment',
        called_at: newAppointment.called_at,
        started_at: newAppointment.started_at,
        created_at: newAppointment.created_at,
        attendant_id: newAppointment.attendant_id,
        appointment_date: newAppointment.appointment_date,
        appointment_time: newAppointment.appointment_time
      };

      setCallQueue(prev => {
        const filtered = prev.filter(call => call.showUntil > new Date());
        return [...filtered, callWithTimer];
      });

      // Tocar campainha e falar nome para agendamento
      playBell(newAppointment.name, 0, 'Agendamento de Identidade');
      speakName(newAppointment.name, 0, 'Agendamento de Identidade');
    } catch (error) {
      console.error('❌ Erro ao processar nova chamada de agendamento:', error);
    }
  };

  const playBell = (name: string, queueNumber: number, queueType: string) => {
    if (bellAudioRef.current) {
      bellAudioRef.current.play();
    }
  };

  const speakName = (name: string, queueNumber: number, queueType: string) => {
    if (!speechSynthRef.current) {
      console.warn('Speech synthesis não inicializado');
      return;
    }

    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = 'pt-BR';
    utterance.text = `Chamando, ${name}, ${queueType}`;
    speechSynthRef.current.speak(utterance);
  };

  return (
    <div className="h-screen bg-background animate-fade-in flex flex-col">
      <Header />
      <div className="flex-1 max-w-none mx-auto py-4 px-6 overflow-hidden flex flex-col">

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-shrink-0">
          <Card className="shadow-card">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
                <Users className="h-6 w-6 text-primary" />
                Total de Atendimentos no Dia
              </CardTitle>
              <CardDescription className="text-base">Fila + WhatsApp + Agendamentos</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-6xl font-bold text-primary">{totalAttendances}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/5 pb-3">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
                <Timer className="h-6 w-6 text-secondary" />
                Tempo Médio de Atendimento
              </CardTitle>
              <CardDescription className="text-base">Duração média de um atendimento</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-6xl font-bold text-secondary">{averageServiceTime} <span className="text-2xl">min</span></div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 pb-3">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
                <Hourglass className="h-6 w-6 text-accent" />
                Tempo Médio de Espera
              </CardTitle>
              <CardDescription className="text-base">Tempo médio que um cidadão espera na fila</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-6xl font-bold text-accent">{averageWaitTime} <span className="text-2xl">min</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Restante do conteúdo em scroll */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Chamados Ativos */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-3">
              <Phone className="h-6 w-6 text-primary" />
              Chamados Ativos
            </h2>
            {callQueue.length === 0 ? (
              <Card className="shadow-card">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/20 pb-3">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
                    <Clock className="h-6 w-6 text-primary" />
                    Nenhum chamado ativo
                  </CardTitle>
                  <CardDescription className="text-base">Aguardando próximas chamadas</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhum chamado ativo no momento</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {callQueue.map((call) => (
                  <Card key={call.id} className="shadow-card animate-scale-in">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
                      <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
                        <User className="h-6 w-6 text-primary" />
                        {call.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {call.type === 'queue' ? 'Fila Geral' : 'Agendamento'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${call.name}.png`} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{call.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-card-foreground text-sm">{call.name}</p>
                          <p className="text-xs text-muted-foreground">{call.phone}</p>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Há {Math.floor((Date.now() - new Date(call.called_at || call.created_at).getTime()) / 60000)}min
                          </p>
                        </div>
                        {call.type === 'queue' && (
                          <Badge variant={call.is_priority ? "destructive" : "secondary"} className="text-xs">
                            {call.is_priority ? "Prioridade" : "Normal"}
                          </Badge>
                        )}
                      </div>
                      {call.type === 'queue' && call.services && (
                        <p className="text-xs text-muted-foreground mt-2">Serviço: {call.services.name}</p>
                      )}
                      {call.type === 'appointment' && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Agendamento: {call.appointment_date} às {call.appointment_time}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Indicadores de Satisfação e Fila de Espera */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Indicadores de Satisfação */}
            <div>
              <SatisfactionIndicators />
            </div>

            {/* Fila de Espera */}
            <div>
              <Card className="shadow-card h-full">
                <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/5 pb-3">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground">
                    <User className="h-6 w-6 text-primary" />
                    Fila de Espera ({waitingQueue.length} pessoas)
                  </CardTitle>
                  <CardDescription className="text-base">
                    Lista completa dos cidadãos na fila por ordem de prioridade
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3 h-80 overflow-y-auto">
                  {waitingQueue.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">Nenhum cidadão na fila no momento</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {waitingQueue.map((customer, index) => (
                        <div
                          key={customer.id}
                          className={`p-3 rounded-lg border ${
                            customer.is_priority
                              ? 'bg-destructive/5 border-destructive/20'
                              : 'bg-card border-border'
                          } animate-fade-in`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://avatar.vercel.sh/${customer.name}.png`} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {customer.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-grow min-w-0">
                                <p className="font-medium text-card-foreground text-sm truncate">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                <p className="text-xs text-muted-foreground">
                                  {customer.services?.name || 'Serviço não especificado'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {customer.is_priority && (
                                <Badge variant="destructive" className="text-xs animate-pulse">
                                  Prioridade
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">#{customer.queue_number}</Badge>
                              <div className="text-right text-xs">
                                <p className="text-muted-foreground">Há</p>
                                <p className="font-medium">
                                  {Math.floor((Date.now() - new Date(customer.created_at).getTime()) / 60000)}min
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Status de Conexão */}
        <div className="fixed bottom-4 right-4">
          <Card className={`shadow-card ${connectionHealth ? 'border-success' : 'border-destructive'}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connectionHealth ? 'bg-success animate-pulse' : 'bg-destructive'}`}></div>
                <span className="text-xs font-medium text-card-foreground">
                  {connectionHealth ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
