import React, { useState, useEffect } from 'react';
import { Users, Clock, TrendingUp, AlertTriangle, CheckCircle, PhoneCall } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import SatisfactionIndicators from '@/components/SatisfactionIndicators';

interface QueueCustomer {
  id: string;
  name: string;
  queue_number: number;
  service_id: string;
  is_priority: boolean;
  status: string;
  created_at: string;
  called_at: string | null;
  services: { name: string };
  attendant_id: string | null;
  profiles?: { full_name: string; location: string };
  phone?: string; // Opcional para suportar agendamentos
}

interface IdentityAppointment {
  id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  attendant_id: string | null;
  called_at: string | null;
  profiles?: { full_name: string; location: string };
}

interface CallQueueItem extends QueueCustomer {
  showUntil: Date;
  type: 'queue' | 'appointment';
}

interface DashboardStats {
  totalInQueue: number;
  totalServedToday: number;
  averageWaitTime: number;
  averageServiceTime: number;
  priorityInQueue: number;
}

const Dashboard: React.FC = () => {
  const [callQueue, setCallQueue] = useState<CallQueueItem[]>([]);
  const [queueCustomers, setQueueCustomers] = useState<QueueCustomer[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalInQueue: 0,
    totalServedToday: 0,
    averageWaitTime: 0,
    averageServiceTime: 0,
    priorityInQueue: 0,
  });

  // Som da campainha
  const playBell = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (frequency: number, duration: number, delay: number) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      }, delay);
    };

    // 3 toques de campainha em 5 segundos
    playTone(800, 0.3, 0);      // Primeiro toque
    playTone(800, 0.3, 1500);   // Segundo toque
    playTone(800, 0.3, 3000);   // Terceiro toque
  };

  // Text-to-speech em português
  const speakName = (name: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Chamando ${name}, ${name}`);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Configurar real-time para atualizações
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_customers' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'calling') {
            handleNewCall(payload.new as QueueCustomer, 'queue');
          }
          fetchDashboardData();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'identity_appointments' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'calling') {
            handleNewAppointmentCall(payload.new as IdentityAppointment);
          }
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'satisfaction_surveys' },
        (payload) => {
          console.log('Satisfaction survey updated:', payload);
          // Recalcular estatísticas quando pesquisas de satisfação são atualizadas
          calculateStats();
        }
      )
      .subscribe();

    // Limpar fila de chamadas expiradas a cada segundo
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      setCallQueue(prev => prev.filter(call => call.showUntil > now));
    }, 1000);

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchDashboardData, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      clearInterval(cleanupInterval);
    };
  }, []);

  const handleNewCall = async (newCall: QueueCustomer, type: 'queue' | 'appointment' = 'queue') => {
    // Buscar dados completos do cidadão com perfil do atendente
    const { data: fullCall } = await supabase
      .from('queue_customers')
      .select(`
        *,
        services:service_id (name),
        profiles:attendant_id (full_name, location)
      `)
      .eq('id', newCall.id)
      .single();

    if (fullCall) {
      const callWithTimer: CallQueueItem = {
        ...fullCall,
        showUntil: new Date(Date.now() + 10000), // Mostrar por 10 segundos
        type
      };

      setCallQueue(prev => [...prev, callWithTimer]);
      playBell(); // Tocar campainha
      speakName(fullCall.name); // Text-to-speech
    }
  };

  const handleNewAppointmentCall = async (newAppointment: IdentityAppointment) => {
    // Buscar dados completos do agendamento com perfil do atendente
    const { data: fullAppointment } = await supabase
      .from('identity_appointments')
      .select(`
        *,
        profiles:attendant_id (full_name, location)
      `)
      .eq('id', newAppointment.id)
      .single();

    if (fullAppointment) {
      // Converter agendamento para formato similar ao queue_customers
      const appointmentAsCall: CallQueueItem = {
        id: fullAppointment.id,
        name: fullAppointment.name,
        phone: fullAppointment.phone,
        queue_number: 0, // Agendamentos não têm número na fila
        service_id: '', // Para agendamentos de identidade
        is_priority: false,
        status: 'calling',
        called_at: fullAppointment.called_at,
        created_at: fullAppointment.appointment_date,
        services: { name: 'Emissão de Identidade' },
        attendant_id: fullAppointment.attendant_id,
        profiles: fullAppointment.profiles,
        showUntil: new Date(Date.now() + 10000), // Mostrar por 10 segundos
        type: 'appointment'
      };

      setCallQueue(prev => [...prev, appointmentAsCall]);
      playBell(); // Tocar campainha
      speakName(fullAppointment.name); // Text-to-speech
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Não buscar chamada atual aqui, usar a fila de chamadas

      // Buscar fila atual
      const { data: queueData } = await supabase
        .from('queue_customers')
        .select(`
          *,
          services:service_id (name)
        `)
        .eq('status', 'waiting')
        .order('is_priority', { ascending: false })
        .order('queue_number', { ascending: true })
        .limit(15);

      setQueueCustomers(queueData || []);

      // Calcular estatísticas
      await calculateStats();

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const calculateStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Total na fila (incluindo agendamentos)
    const { count: totalInQueue } = await supabase
      .from('queue_customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');

    // Total agendamentos hoje
    const { count: totalAppointmentsToday } = await supabase
      .from('identity_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)
      .eq('status', 'scheduled');

    // Total atendido hoje (fila + agendamentos)
    const { count: totalServedQueueToday } = await supabase
      .from('queue_customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`);

    const { count: totalServedAppointmentsToday } = await supabase
      .from('identity_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)
      .eq('status', 'completed');

    // Cidadãos prioritários na fila
    const { count: priorityInQueue } = await supabase
      .from('queue_customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting')
      .eq('is_priority', true);

    // Tempo médio de espera (últimos atendimentos do dia)
    const { data: completedToday } = await supabase
      .from('queue_customers')
      .select('created_at, called_at, started_at, completed_at')
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`)
      .not('called_at', 'is', null)
      .not('started_at', 'is', null)
      .not('completed_at', 'is', null);

    let averageWaitTime = 0;
    let averageServiceTime = 0;

    if (completedToday && completedToday.length > 0) {
      const waitTimes = completedToday.map(customer => {
        const created = new Date(customer.created_at).getTime();
        const called = new Date(customer.called_at!).getTime();
        return (called - created) / (1000 * 60); // em minutos
      });

      const serviceTimes = completedToday.map(customer => {
        const started = new Date(customer.started_at!).getTime();
        const completed = new Date(customer.completed_at!).getTime();
        return (completed - started) / (1000 * 60); // em minutos
      });

      averageWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
      averageServiceTime = serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length;
    }

    setStats({
      totalInQueue: (totalInQueue || 0) + (totalAppointmentsToday || 0),
      totalServedToday: (totalServedQueueToday || 0) + (totalServedAppointmentsToday || 0),
      averageWaitTime: Math.round(averageWaitTime),
      averageServiceTime: Math.round(averageServiceTime),
      priorityInQueue: priorityInQueue || 0,
    });
  };

  const getWaitingTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return diffInMinutes;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20">
      <Header />
      
      <div className="container mx-auto px-8 py-6 max-w-[1920px]">
        {/* Chamadas Ativas */}
        {callQueue.length > 0 && (
          <div className="mb-12 space-y-6">
            {callQueue.map((call, index) => (
              <Card key={call.id} className="shadow-shadow-elevated border-4 border-primary bg-gradient-to-r from-primary/15 to-accent/15 animate-pulse">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-8">
                      <PhoneCall className="h-20 w-20 text-primary animate-pulse" />
                    </div>
                     <h2 className="text-8xl font-black text-primary mb-8 tracking-wide">
                       CHAMANDO CIDADÃO
                     </h2>
                      <div className="flex items-center justify-center gap-12 mb-8">
                        {call.type === 'queue' ? (
                          <Badge variant="outline" className="text-6xl py-6 px-12 bg-primary text-primary-foreground font-black border-4">
                            #{call.queue_number}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-5xl py-6 px-12 bg-accent text-accent-foreground font-black border-4">
                            AGENDAMENTO
                          </Badge>
                        )}
                        <div>
                          <p className="text-7xl font-black mb-2">{call.name}</p>
                          <p className="text-4xl text-muted-foreground font-bold">{call.services?.name}</p>
                        </div>
                      </div>
                    {call.profiles?.full_name && (
                      <div className="text-3xl text-muted-foreground font-bold">
                        <p>Atendente: {call.profiles.full_name}</p>
                        {call.profiles.location && (
                          <p className="font-black text-primary text-4xl mt-2">Local: {call.profiles.location}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-8 mb-12">
          <Card className="shadow-shadow-card border-2 hover:shadow-shadow-elevated transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-3xl font-bold">Na Fila</CardTitle>
              <Users className="h-12 w-12 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-8xl font-black text-primary mb-4">{stats.totalInQueue}</div>
              <p className="text-2xl text-muted-foreground font-bold">
                {stats.priorityInQueue} prioritários
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-shadow-card border-2 hover:shadow-shadow-elevated transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-3xl font-bold">Atendidos Hoje</CardTitle>
              <CheckCircle className="h-12 w-12 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-8xl font-black text-success mb-4">{stats.totalServedToday}</div>
              <p className="text-2xl text-muted-foreground font-bold">
                Total do dia
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-shadow-card border-2 hover:shadow-shadow-elevated transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-3xl font-bold">Tempo Espera</CardTitle>
              <Clock className="h-12 w-12 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-8xl font-black text-secondary mb-4">{stats.averageWaitTime} min</div>
              <p className="text-2xl text-muted-foreground font-bold">
                Média do dia
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-shadow-card border-2 hover:shadow-shadow-elevated transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-3xl font-bold">Tempo Atendimento</CardTitle>
              <TrendingUp className="h-12 w-12 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-8xl font-black text-accent mb-4">{stats.averageServiceTime} min</div>
              <p className="text-2xl text-muted-foreground font-bold">
                Média do dia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Primeira linha: Satisfação do Atendimento + Fila Atual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Satisfação do Atendimento */}
          <SatisfactionIndicators />
          
          {/* Fila Atual */}
          <Card className="shadow-shadow-card border-2">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/10 pb-8">
              <CardTitle className="flex items-center gap-4 text-4xl font-bold">
                <Users className="h-10 w-10" />
                Fila Atual
              </CardTitle>
              <CardDescription className="text-2xl font-bold">
                Próximos cidadãos a serem atendidos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {queueCustomers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-32 w-32 text-muted-foreground mx-auto mb-8" />
                  <h3 className="text-4xl font-bold mb-4">Fila vazia</h3>
                  <p className="text-2xl text-muted-foreground font-bold">
                    Não há cidadãos aguardando atendimento
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {queueCustomers.map((customer, index) => (
                    <div
                      key={customer.id}
                      className={`p-6 rounded-xl border-4 transition-all hover:shadow-shadow-elevated ${
                        customer.is_priority
                          ? 'border-destructive bg-destructive/10 shadow-lg'
                          : 'border-border bg-card'
                      } ${index < 3 ? 'ring-4 ring-primary/50 shadow-xl' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={customer.is_priority ? "destructive" : "secondary"}
                            className="text-2xl py-2 px-4 font-black"
                          >
                            #{customer.queue_number}
                          </Badge>
                          {customer.is_priority && (
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                          )}
                          {index < 3 && (
                            <Badge variant="outline" className="bg-primary text-primary-foreground text-lg py-2 px-3 font-bold">
                              Próximo
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-xl text-muted-foreground font-bold">
                            <Clock className="h-6 w-6 mr-2" />
                            {getWaitingTime(customer.created_at)} min
                          </div>
                        </div>
                      </div>
                      
                      <h4 className="font-black text-2xl mb-2">{customer.name}</h4>
                      <p className="text-xl text-muted-foreground font-bold">{customer.services?.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;