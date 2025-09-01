import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  Timer, 
  Activity, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  BarChart3, 
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SatisfactionIndicators from '@/components/SatisfactionIndicators';
import DashboardHeader from '@/components/DashboardHeader';
import CallPopup from '@/components/CallPopup';

// Interfaces para tipagem
interface QueueCustomer {
  id: string;
  name: string;
  phone: string;
  service_id: string;
  is_priority: boolean;
  queue_number: number;
  status: string;
  location_id: string | null;
  attendant_id: string | null;
  called_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  services?: {
    name: string;
    estimated_time: number;
  };
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
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CallQueueItem {
  id: string;
  name: string;
  queue_number: number;
  service_name?: string;
  showUntil: Date;
  type: 'queue' | 'appointment';
  service_id?: string;
  is_priority?: boolean;
  services?: {
    name: string;
    estimated_time: number;
  };
}

const Dashboard = () => {
  const [totalAttendances, setTotalAttendances] = useState(0);
  const [averageServiceTime, setAverageServiceTime] = useState(0);
  const [averageWaitTime, setAverageWaitTime] = useState(0);
  const [connectionHealth, setConnectionHealth] = useState(true);
  const [callQueue, setCallQueue] = useState<CallQueueItem[]>([]);
  const [waitingQueue, setWaitingQueue] = useState<QueueCustomer[]>([]);

  // Novo estado para o popup de chamada
  const [currentCall, setCurrentCall] = useState<{
    isOpen: boolean;
    customerName: string;
    queueNumber: number;
    serviceName: string;
    isAppointment: boolean;
    isPriority: boolean;
  }>({
    isOpen: false,
    customerName: '',
    queueNumber: 0,
    serviceName: '',
    isAppointment: false,
    isPriority: false
  });

  const lastDataFetchRef = useRef(new Date());
  const connectionHealthRef = useRef(true);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { toast } = useToast();

  // Função para configurar o canal de realtime
  const setupRealtimeChannel = () => {
    console.log('🔌 Configurando realtime para dashboard...');
    
    // Remover canal anterior se existir
    if (channelRef.current) {
      console.log('🔌 Removendo canal anterior...');
      supabase.removeChannel(channelRef.current);
    }
    
    // Criar novo canal com timestamp único para evitar conflitos
    const channel = supabase
      .channel('dashboard-queue-updates-' + Date.now()) 
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_customers' },
        async (payload) => {
          console.log('📥 [DASHBOARD] Queue customer change:', payload.eventType);
          if (payload.new && typeof payload.new === 'object') {
            console.log('📥 [DASHBOARD] Status e nome:', (payload.new as any).status, (payload.new as any).name);
          }
          lastDataFetchRef.current = new Date();
          connectionHealthRef.current = true;
          setConnectionHealth(true);
          
          if (payload.eventType === 'UPDATE' && 
              payload.new && 
              typeof payload.new === 'object' && 
              'id' in payload.new && 
              'status' in payload.new && 
              payload.new.status === 'calling') {
            handleNewCall(payload.new as QueueCustomer);
          }
          
          // Atualizar fila de espera imediatamente para todos os eventos
          await updateWaitingQueue();
          
          // Atualizar estatísticas
          fetchDashboardData();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'identity_appointments' },
        async (payload) => {
          console.log('📥 [DASHBOARD] Identity appointment change:', payload.eventType, payload.new);
          lastDataFetchRef.current = new Date();
          connectionHealthRef.current = true;
          setConnectionHealth(true);
          
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
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'whatsapp_services' },
        async (payload) => {
          console.log('📥 [DASHBOARD] WhatsApp service change:', payload.eventType, payload.new);
          lastDataFetchRef.current = new Date();
          connectionHealthRef.current = true;
          setConnectionHealth(true);
        }
      )
      .subscribe((status) => {
        console.log('📡 [DASHBOARD] Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard connected to realtime');
          connectionHealthRef.current = true;
          setConnectionHealth(true);
          toast({
            title: "Conexão estabelecida",
            description: "O dashboard está conectado em tempo real",
            duration: 3000,
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Dashboard realtime error');
          connectionHealthRef.current = false;
          setConnectionHealth(false);
          toast({
            title: "Erro de conexão",
            description: "Não foi possível conectar ao serviço em tempo real",
            variant: "destructive",
            duration: 5000,
          });
        }
      });
      
    // Guardar referência ao canal
    channelRef.current = channel;
    return channel;
  };

  useEffect(() => {
    // Inicializar SpeechSynthesis
    speechSynthRef.current = window.speechSynthesis;

    // Buscar dados iniciais
    fetchDashboardData();

    // Configurar canal realtime
    setupRealtimeChannel();

    // Enviar heartbeat periódico para verificar status da conexão
    const pingInterval = setInterval(async () => {
      try {
        // Ping simples para verificar conectividade
        const { count } = await supabase
          .from('queue_customers')
          .select('count', { count: 'exact', head: true });
          
        console.log('💓 Heartbeat OK - ' + new Date().toLocaleTimeString());
        lastDataFetchRef.current = new Date();
        connectionHealthRef.current = true;
        setConnectionHealth(true);
      } catch (err) {
        console.error('💔 Heartbeat falhou:', err);
      }
    }, 45000); // Ping a cada 45 segundos

    // Monitorar saúde da conexão
    const healthInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastFetch = now.getTime() - lastDataFetchRef.current.getTime();
      
      // Se passou mais de 30 segundos sem receber dados, considerar desconectado
      if (timeSinceLastFetch > 30000) {
        console.log('⚠️ Conexão pode estar com problemas - sem dados há', timeSinceLastFetch, 'ms');
        connectionHealthRef.current = false;
        setConnectionHealth(false);
        
        // Após 1 minuto sem conexão, tentar reconectar
        if (timeSinceLastFetch > 60000) {
          console.log('🔄 Tentando reconectar automaticamente...');
          setupRealtimeChannel();
          lastDataFetchRef.current = new Date();
          toast({
            title: "Reconectando...",
            description: "Tentando restabelecer a conexão",
            duration: 3000,
          });
        }
      } else {
        connectionHealthRef.current = true;
        setConnectionHealth(true);
      }

      // Limpar chamadas expiradas
      setCallQueue(prev => prev.filter(call => call.showUntil > now));
    }, 5000);

    // Cleanup ao desmontar
    return () => {
      console.log('🧹 Limpando subscriptions realtime...');
      clearInterval(healthInterval);
      clearInterval(pingInterval);
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Função separada para atualizar a fila de espera
  const updateWaitingQueue = async () => {
    try {
      const { data: waitingData } = await supabase
        .from('queue_customers')
        .select(`
          *,
          services:service_id (name, estimated_time)
        `)
        .eq('status', 'waiting')
        .order('is_priority', { ascending: false })
        .order('created_at', { ascending: true });
      
      console.log('📊 [DASHBOARD] Fila de espera atualizada:', waitingData?.length, 'pessoas');
      setWaitingQueue(waitingData || []);
    } catch (error) {
      console.error('❌ Erro ao atualizar fila de espera:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Total de atendimentos realizados no dia
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00`;
      console.log('🗓️ Buscando dados para:', today);
      
      // 1. Fila completada
      const { count: queueCount, error: queueError } = await supabase
        .from('queue_customers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', todayStart);
        
      console.log('📊 Resultado fila:', { count: queueCount, error: queueError });
      
      // 2. WhatsApp services
      const { count: whatsappCount, error: whatsappError } = await supabase
        .from('whatsapp_services')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);
        
      console.log('📊 Resultado whatsapp:', { count: whatsappCount, error: whatsappError });
      
      // 3. Agendamentos completados
      const { count: appointmentCount, error: appointmentError } = await supabase
        .from('identity_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', todayStart);
        
      console.log('📊 Resultado agendamentos:', { count: appointmentCount, error: appointmentError });
      
      // Calcular total
      const totalQueue = queueCount || 0;
      const totalWhatsapp = whatsappCount || 0;
      const totalAppointments = appointmentCount || 0;
      const totalAttendances = totalQueue + totalWhatsapp + totalAppointments;
      
      console.log('📈 TOTAL FINAL:', {
        fila: totalQueue,
        whatsapp: totalWhatsapp, 
        agendamentos: totalAppointments,
        TOTAL: totalAttendances
      });
      
      setTotalAttendances(totalAttendances);

      // Buscar fila de espera completa para exibir
      await updateWaitingQueue();

      // Calcular tempo médio de atendimento (apenas para filas completadas)
      const { data: completedQueue } = await supabase
        .from('queue_customers')
        .select('started_at, completed_at')
        .eq('status', 'completed')
        .gte('created_at', todayStart)
        .not('started_at', 'is', null)
        .not('completed_at', 'is', null);

      if (completedQueue && completedQueue.length > 0) {
        const avgService = completedQueue.reduce((acc, item) => {
          const start = new Date(item.started_at!);
          const end = new Date(item.completed_at!);
          return acc + (end.getTime() - start.getTime());
        }, 0) / completedQueue.length;
        setAverageServiceTime(Math.round(avgService / 1000 / 60)); // em minutos
      }

      // Calcular tempo médio de espera (chamada - criação)
      const { data: calledQueue } = await supabase
        .from('queue_customers')
        .select('created_at, called_at')
        .not('called_at', 'is', null)
        .gte('created_at', todayStart);

      if (calledQueue && calledQueue.length > 0) {
        const avgWait = calledQueue.reduce((acc, item) => {
          const created = new Date(item.created_at);
          const called = new Date(item.called_at!);
          return acc + (called.getTime() - created.getTime());
        }, 0) / calledQueue.length;
        setAverageWaitTime(Math.round(avgWait / 1000 / 60)); // em minutos
      }

    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
    }
  };

  const handleNewCall = async (newCall: QueueCustomer) => {
    try {
      console.log('🔔 Nova chamada recebida:', newCall.id, newCall.name);
      
      // Prevenir chamadas duplicadas no popup
      if (currentCall.isOpen) {
        console.log('⚠️ Popup já está ativo, ignorando chamada duplicada');
        return;
      }

      // Buscar informações completas do cliente se necessário
      if (!newCall.services) {
        const { data: fullCall } = await supabase
          .from('queue_customers')
          .select(`
            *,
            services:service_id (name, estimated_time)
          `)
          .eq('id', newCall.id)
          .single();

        if (fullCall) {
          newCall = fullCall;
        }
      }

      if (newCall.services) {
        // Abrir popup de chamada
        setCurrentCall({
          isOpen: true,
          customerName: newCall.name,
          queueNumber: newCall.queue_number,
          serviceName: newCall.services.name,
          isAppointment: false,
          isPriority: newCall.is_priority || false
        });

        // Manter registro na lista de chamadas ativas (para referência)
        const callWithTimer: CallQueueItem = {
          id: newCall.id,
          name: newCall.name,
          queue_number: newCall.queue_number,
          service_name: newCall.services.name,
          showUntil: new Date(Date.now() + 30000),
          type: 'queue',
          service_id: newCall.service_id,
          is_priority: newCall.is_priority,
          services: newCall.services
        };

        setCallQueue(prev => {
          const filtered = prev.filter(call => call.showUntil > new Date());
          return [...filtered, callWithTimer];
        });
      }
    } catch (error) {
      console.error('❌ Erro ao processar nova chamada:', error);
    }
  };

  const handleNewAppointmentCall = async (newAppointment: IdentityAppointment) => {
    try {
      console.log('🔔 Nova chamada de agendamento recebida:', newAppointment.id, newAppointment.name);
      
      // Prevenir chamadas duplicadas no popup
      if (currentCall.isOpen) {
        console.log('⚠️ Popup já está ativo, ignorando chamada de agendamento duplicada');
        return;
      }

      // Abrir popup de chamada
      setCurrentCall({
        isOpen: true,
        customerName: newAppointment.name,
        queueNumber: 0,
        serviceName: 'Agendamento de Identidade',
        isAppointment: true,
        isPriority: false
      });

      // Manter registro na lista de chamadas ativas (para referência)
      const callWithTimer: CallQueueItem = {
        id: newAppointment.id,
        name: newAppointment.name,
        queue_number: 0,
        service_name: 'Agendamento de Identidade',
        showUntil: new Date(Date.now() + 30000),
        type: 'appointment'
      };

      setCallQueue(prev => {
        const filtered = prev.filter(call => call.showUntil > new Date());
        return [...filtered, callWithTimer];
      });
    } catch (error) {
      console.error('❌ Erro ao processar nova chamada de agendamento:', error);
    }
  };

  const handleCloseCallPopup = () => {
    setCurrentCall({
      isOpen: false,
      customerName: '',
      queueNumber: 0,
      serviceName: '',
      isAppointment: false,
      isPriority: false
    });
  };

  // Classes padrão para todos os cards
  // Classes padrão para todos os cards, usando o mesmo estilo do componente da tela de Atendente
  const cardClass = "bg-card text-card-foreground border rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md";
  const cardHeaderClass = "px-6 py-5 border-b bg-muted/50";
  const cardTitleClass = "text-3xl font-bold flex items-center gap-2";
  const cardContentClass = "p-6";
  const iconClass = "h-6 w-6 text-primary";
  const statValueClass = "text-5xl font-black tracking-tight mt-2";
  const statLabelClass = "text-lg font-medium text-muted-foreground";

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      
      <div className="p-4 space-y-4 flex-1 overflow-hidden">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className={cardTitleClass}>
                <BarChart3 className={iconClass} />
                Total de Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent className={cardContentClass}>
              <div className={statValueClass}>{totalAttendances}</div>
              <p className={statLabelClass}>Hoje</p>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className={cardTitleClass}>
                <Timer className={iconClass} />
                Tempo Médio de Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className={cardContentClass}>
              <div className={statValueClass}>{averageServiceTime}</div>
              <p className={statLabelClass}>minutos</p>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className={cardTitleClass}>
                <Clock className={iconClass} />
                Tempo Médio de Espera
              </CardTitle>
            </CardHeader>
            <CardContent className={cardContentClass}>
              <div className={statValueClass}>{averageWaitTime}</div>
              <p className={statLabelClass}>minutos</p>
            </CardContent>
          </Card>
        </div>

        {/* Chamadas Ativas */}
        <Card className={cardClass}>
          <CardHeader className={cardHeaderClass}>
            <CardTitle className={cardTitleClass}>
              <Bell className={iconClass} />
              Chamadas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent className={cardContentClass}>
            {callQueue.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma chamada ativa no momento
                </p>
            ) : (
              <div className="space-y-3">
                {callQueue.map((call) => (
                  <div 
                    key={call.id} 
                    className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/10 animate-fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        {call.type === 'appointment' ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <Activity className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{call.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {call.type === 'appointment' 
                            ? call.service_name 
                            : `${call.service_name} - Senha ${call.queue_number}`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {call.is_priority && (
                        <Badge variant="destructive" className="text-xs font-medium py-1">
                          Prioritário
                        </Badge>
                      )}
                      <Badge variant={call.type === 'appointment' ? "outline" : "secondary"} className="text-xs font-medium py-1">
                        {call.type === 'appointment' ? 'Agendamento' : 'Fila'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fila de Espera e Indicadores de Satisfação (lado a lado) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fila de Espera */}
          <Card className={`${cardClass} h-[calc(100%-5px)]`}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className={cardTitleClass}>
                <Users className={iconClass} />
                Fila de Espera ({waitingQueue.length})
              </CardTitle>
            </CardHeader>
            <CardContent className={cardContentClass}>
              {waitingQueue.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma pessoa na fila de espera
                </p>
              ) : (
                <div className="space-y-3">
                  {waitingQueue.slice(0, 10).map((customer, index) => (
                    <div 
                      key={customer.id} 
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                          <span className="text-sm font-semibold text-primary">
                            {customer.queue_number}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.services?.name || 'Serviço não identificado'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {customer.is_priority && (
                          <Badge variant="destructive" className="text-xs font-medium py-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Prioritário
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs font-medium py-1">
                          {index + 1}º na fila
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {waitingQueue.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground pt-3">
                      ... e mais {waitingQueue.length - 10} pessoas na fila
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indicadores de Satisfação */}
          <div className={`${cardClass} h-[calc(100%-5px)]`}>
            <SatisfactionIndicators />
          </div>
        </div>

        {/* Status da conexão fixo no canto */}
        <div className="fixed bottom-4 right-4">
          <div className={`px-3 py-2 rounded-full text-sm font-medium shadow-lg border ${
            connectionHealth 
              ? 'bg-success/10 text-success border-success/20' 
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionHealth ? 'bg-success animate-pulse' : 'bg-destructive'
              }`} />
              {connectionHealth ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Popup de Chamada */}
      <CallPopup
        isOpen={currentCall.isOpen}
        customerName={currentCall.customerName}
        queueNumber={currentCall.queueNumber}
        serviceName={currentCall.serviceName}
        isAppointment={currentCall.isAppointment}
        isPriority={currentCall.isPriority}
        onClose={handleCloseCallPopup}
      />
    </div>
  );
};

export default Dashboard;
