import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Phone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator"
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

interface CallQueueItem extends (QueueCustomer | IdentityAppointment) {
  showUntil: Date;
  type: 'queue' | 'appointment';
  queue_number: number;
}

const Dashboard: React.FC = () => {
  const [queueSize, setQueueSize] = useState(0);
  const [totalAttendants, setTotalAttendants] = useState(0);
  const [activeAttendants, setActiveAttendants] = useState(0);
  const [averageWaitTime, setAverageWaitTime] = useState(0);
  const [connectionHealth, setConnectionHealth] = useState(true);
  const [callQueue, setCallQueue] = useState<CallQueueItem[]>([]);

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

    // Monitorar saúde da conexão a cada 5 segundos
    setInterval(() => {
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
          
          if (payload.eventType === 'UPDATE' && payload.new && typeof payload.new === 'object' && 'id' in payload.new && payload.new.status === 'calling') {
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
          
          if (payload.eventType === 'UPDATE' && payload.new && typeof payload.new === 'object' && 'id' in payload.new && payload.new.status === 'calling') {
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
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Tamanho da fila
      const { count: queueCount } = await supabase
        .from('queue_customers')
        .select('*', { count: 'exact' })
        .eq('status', 'waiting');
      setQueueSize(queueCount || 0);

      // Total de atendentes
      const { count: totalAttendantsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'attendant');
      setTotalAttendants(totalAttendantsCount || 0);

      // Atendentes ativos (logados)
      const { count: activeAttendantsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'attendant')
        .eq('status', 'online');
      setActiveAttendants(activeAttendantsCount || 0);

      // Tempo médio de espera (simulado)
      setAverageWaitTime(Math.floor(Math.random() * 25));

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
          services:service_id (name)
        `)
        .eq('id', newCall.id)
        .single();

      if (fullCall) {
        const callWithTimer: CallQueueItem = {
          ...fullCall,
          showUntil: new Date(Date.now() + 10000), // Mostrar por 10 segundos
          type: 'queue'
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
        ...newAppointment,
        queue_number: 0, // Agendamentos não têm número de fila
        showUntil: new Date(Date.now() + 10000),
        type: 'appointment'
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Painel de Atendimento</h1>

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-shadow-card">
            <CardHeader>
              <CardTitle>Cidadãos na Fila</CardTitle>
              <CardDescription>Total de cidadãos aguardando atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{queueSize}</div>
            </CardContent>
          </Card>

          <Card className="shadow-shadow-card">
            <CardHeader>
              <CardTitle>Total de Atendentes</CardTitle>
              <CardDescription>Número total de atendentes cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAttendants}</div>
            </CardContent>
          </Card>

          <Card className="shadow-shadow-card">
            <CardHeader>
              <CardTitle>Atendentes Online</CardTitle>
              <CardDescription>Atendentes atualmente conectados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeAttendants}</div>
            </CardContent>
          </Card>

          <Card className="shadow-shadow-card">
            <CardHeader>
              <CardTitle>Tempo Médio de Espera</CardTitle>
              <CardDescription>Tempo médio que um cidadão espera na fila</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{averageWaitTime} minutos</div>
            </CardContent>
          </Card>
        </div>

        {/* Chamados Ativos */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Chamados Ativos</h2>
          {callQueue.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum chamado ativo no momento
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {callQueue.map((call) => (
                <Card key={call.id} className="shadow-shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {call.name}
                    </CardTitle>
                    <CardDescription>
                      {call.type === 'queue' ? 'Fila Geral' : 'Agendamento'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-2">
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${call.name}.png`} />
                        <AvatarFallback>{call.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{call.name}</p>
                        <p className="text-sm text-muted-foreground">{call.phone}</p>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <p className="text-sm text-muted-foreground">
                          Chamado há {Math.floor((Date.now() - new Date(call.called_at || call.created_at).getTime()) / 60000)} minutos
                        </p>
                      </div>
                      {call.type === 'queue' && (
                        <Badge variant="secondary">#{call.queue_number}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Status da Conexão */}
        <div className="text-center">
          <Badge variant={connectionHealth ? 'secondary' : 'destructive'}>
            Status da Conexão: {connectionHealth ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
