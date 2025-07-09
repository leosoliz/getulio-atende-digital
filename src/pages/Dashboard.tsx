import React, { useState, useEffect } from 'react';
import { Users, Clock, TrendingUp, AlertTriangle, CheckCircle, PhoneCall } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';

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
}

interface CallQueueItem extends QueueCustomer {
  showUntil: Date;
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

  useEffect(() => {
    fetchDashboardData();
    
    // Configurar real-time para atualizações
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_customers' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'calling') {
            handleNewCall(payload.new as QueueCustomer);
          }
          fetchDashboardData();
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

  const handleNewCall = async (newCall: QueueCustomer) => {
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
        showUntil: new Date(Date.now() + 10000) // Mostrar por 10 segundos
      };

      setCallQueue(prev => [...prev, callWithTimer]);
      playBell(); // Tocar campainha
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

    // Total na fila
    const { count: totalInQueue } = await supabase
      .from('queue_customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');

    // Total atendido hoje
    const { count: totalServedToday } = await supabase
      .from('queue_customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`);

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
      totalInQueue: totalInQueue || 0,
      totalServedToday: totalServedToday || 0,
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
      
      <div className="container mx-auto px-6 py-8">
        {/* Chamadas Ativas */}
        {callQueue.length > 0 && (
          <div className="mb-8 space-y-4">
            {callQueue.map((call, index) => (
              <Card key={call.id} className="shadow-shadow-elevated border-2 border-primary bg-gradient-to-r from-primary/10 to-accent/10 animate-pulse">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <PhoneCall className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-bold text-primary mb-2">
                      CHAMANDO CIDADÃO
                    </h2>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <Badge variant="outline" className="text-2xl py-2 px-4 bg-primary text-primary-foreground">
                        #{call.queue_number}
                      </Badge>
                      <div>
                        <p className="text-xl font-bold">{call.name}</p>
                        <p className="text-lg text-muted-foreground">{call.services?.name}</p>
                      </div>
                    </div>
                    {call.profiles?.full_name && (
                      <div className="text-lg text-muted-foreground">
                        <p>Atendente: {call.profiles.full_name}</p>
                        {call.profiles.location && (
                          <p className="font-medium text-primary">Local: {call.profiles.location}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Na Fila</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalInQueue}</div>
              <p className="text-xs text-muted-foreground">
                {stats.priorityInQueue} prioritários
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendidos Hoje</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.totalServedToday}</div>
              <p className="text-xs text-muted-foreground">
                Total do dia
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio Espera</CardTitle>
              <Clock className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.averageWaitTime} min</div>
              <p className="text-xs text-muted-foreground">
                Média do dia
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio Atendimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.averageServiceTime} min</div>
              <p className="text-xs text-muted-foreground">
                Média do dia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Fila Atual */}
        <Card className="shadow-shadow-card">
          <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Fila Atual
            </CardTitle>
            <CardDescription>
              Próximos cidadãos a serem atendidos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {queueCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Fila vazia</h3>
                <p className="text-muted-foreground">
                  Não há cidadãos aguardando atendimento
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {queueCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      customer.is_priority
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border bg-card'
                    } ${index < 3 ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={customer.is_priority ? "destructive" : "secondary"}
                          className="text-lg py-1 px-3"
                        >
                          #{customer.queue_number}
                        </Badge>
                        {customer.is_priority && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        {index < 3 && (
                          <Badge variant="outline" className="bg-primary text-primary-foreground">
                            Próximo
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {getWaitingTime(customer.created_at)} min
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-lg mb-1">{customer.name}</h4>
                    <p className="text-sm text-muted-foreground">{customer.services?.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;