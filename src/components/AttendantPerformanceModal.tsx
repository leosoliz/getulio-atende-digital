
import React, { useState, useEffect } from 'react';
import { X, User, Clock, CheckCircle, MessageSquare, Calendar, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PerformanceStats {
  totalServices: number;
  todayServices: number;
  avgServiceTime: number;
  queueServices: number;
  appointmentServices: number;
  whatsappServices: number;
}

interface ServiceHistory {
  id: string;
  type: 'queue' | 'appointment' | 'whatsapp';
  customerName: string;
  serviceName: string;
  date: string;
  duration?: number;
  status: string;
}

interface AttendantPerformanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AttendantPerformanceModal: React.FC<AttendantPerformanceModalProps> = ({ open, onOpenChange }) => {
  const [stats, setStats] = useState<PerformanceStats>({
    totalServices: 0,
    todayServices: 0,
    avgServiceTime: 0,
    queueServices: 0,
    appointmentServices: 0,
    whatsappServices: 0,
  });
  const [history, setHistory] = useState<ServiceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (open && profile?.id) {
      fetchPerformanceData();
    }
  }, [open, profile?.id]);

  const fetchPerformanceData = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    
    try {
      // Calcular limites do dia atual no fuso de São Paulo (independente do fuso do navegador)
      const nowSpStr = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
      const nowSp = new Date(nowSpStr);
      const startOfToday = new Date(nowSp.getFullYear(), nowSp.getMonth(), nowSp.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(nowSp.getFullYear(), nowSp.getMonth(), nowSp.getDate(), 23, 59, 59, 999);
      // Compensar diferença entre fuso do navegador e America/Sao_Paulo
      const tzOffsetMs = new Date().getTime() - nowSp.getTime();
      const startISO = new Date(startOfToday.getTime() + tzOffsetMs).toISOString();
      const endISO = new Date(endOfToday.getTime() + tzOffsetMs).toISOString();

      console.log('[Performance] Profile ID:', profile.id);
      console.log('[Performance] Janela hoje (BRT):', { startISO, endISO });

      // Totais usando count exato (evita o limite de 1000 linhas do Supabase)
      const [
        { count: queueServices, error: e1 },
        { count: appointmentServices, error: e2 },
        { count: whatsappServices, error: e3 },
        { count: queueToday, error: e4 },
        { count: appointmentToday, error: e5 },
        { count: whatsappToday, error: e6 },
      ] = await Promise.all([
        supabase
          .from('queue_customers')
          .select('*', { count: 'exact', head: true })
          .eq('attendant_id', profile.id)
          .eq('status', 'completed'),
        supabase
          .from('identity_appointments')
          .select('*', { count: 'exact', head: true })
          .eq('attendant_id', profile.id)
          .eq('status', 'completed'),
        supabase
          .from('whatsapp_services')
          .select('*', { count: 'exact', head: true })
          .eq('attendant_id', profile.id),
        supabase
          .from('queue_customers')
          .select('*', { count: 'exact', head: true })
          .eq('attendant_id', profile.id)
          .eq('status', 'completed')
          .gte('completed_at', startISO)
          .lte('completed_at', endISO),
        supabase
          .from('identity_appointments')
          .select('*', { count: 'exact', head: true })
          .eq('attendant_id', profile.id)
          .eq('status', 'completed')
          .gte('completed_at', startISO)
          .lte('completed_at', endISO),
        supabase
          .from('whatsapp_services')
          .select('*', { count: 'exact', head: true })
          .eq('attendant_id', profile.id)
          .gte('created_at', startISO)
          .lte('created_at', endISO),
      ]);

      console.log('[Performance] Counts:', {
        queueServices, appointmentServices, whatsappServices,
        queueToday, appointmentToday, whatsappToday,
        errors: { e1, e2, e3, e4, e5, e6 }
      });

      const totalServices = (queueServices || 0) + (appointmentServices || 0) + (whatsappServices || 0);
      const todayServices = (queueToday || 0) + (appointmentToday || 0) + (whatsappToday || 0);

      // Buscar dados detalhados (para histórico e tempo médio) - últimos 50 de cada
      const [
        { data: queueData },
        { data: appointmentData },
        { data: whatsappData },
      ] = await Promise.all([
        supabase
          .from('queue_customers')
          .select(`*, services:service_id (name)`)
          .eq('attendant_id', profile.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(100),
        supabase
          .from('identity_appointments')
          .select('*')
          .eq('attendant_id', profile.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(100),
        supabase
          .from('whatsapp_services')
          .select(`*, services:service_id (name)`)
          .eq('attendant_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      // Calcular tempo médio (apenas fila normal com dados completos, amostra recente)
      const completedQueueWithTimes = queueData?.filter(item => 
        item.started_at && item.completed_at
      ) || [];
      
      let avgServiceTime = 0;
      if (completedQueueWithTimes.length > 0) {
        const totalTime = completedQueueWithTimes.reduce((sum, item) => {
          const start = new Date(item.started_at!);
          const end = new Date(item.completed_at!);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60);
        }, 0);
        avgServiceTime = Math.round(totalTime / completedQueueWithTimes.length);
      }

      setStats({
        totalServices,
        todayServices,
        avgServiceTime,
        queueServices,
        appointmentServices,
        whatsappServices,
      });

      // Criar histórico unificado
      const historyItems: ServiceHistory[] = [];

      // Adicionar fila normal
      if (queueData) {
        queueData.forEach(item => {
          historyItems.push({
            id: item.id,
            type: 'queue',
            customerName: item.name,
            serviceName: item.services?.name || 'Serviço não identificado',
            date: item.completed_at || item.created_at,
            duration: item.started_at && item.completed_at ? 
              Math.round((new Date(item.completed_at).getTime() - new Date(item.started_at).getTime()) / (1000 * 60)) : 
              undefined,
            status: item.status
          });
        });
      }

      // Adicionar agendamentos
      if (appointmentData) {
        appointmentData.forEach(item => {
          historyItems.push({
            id: item.id,
            type: 'appointment',
            customerName: item.name,
            serviceName: 'Emissão de Identidade',
            date: item.completed_at || item.created_at,
            duration: item.started_at && item.completed_at ? 
              Math.round((new Date(item.completed_at).getTime() - new Date(item.started_at).getTime()) / (1000 * 60)) : 
              undefined,
            status: item.status
          });
        });
      }

      // Adicionar WhatsApp
      if (whatsappData) {
        whatsappData.forEach(item => {
          historyItems.push({
            id: item.id,
            type: 'whatsapp',
            customerName: item.name,
            serviceName: item.services?.name || 'Serviço não identificado',
            date: item.created_at,
            status: 'completed'
          });
        });
      }

      // Ordenar por data (mais recente primeiro)
      historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistory(historyItems.slice(0, 50)); // Limitar aos últimos 50 atendimentos

    } catch (error) {
      console.error('Erro ao buscar dados de performance:', error);
    }
    
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'queue':
        return <User className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'queue':
        return <Badge variant="secondary">Fila</Badge>;
      case 'appointment':
        return <Badge variant="outline">Agendamento</Badge>;
      case 'whatsapp':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">WhatsApp</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Minha Performance
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Indicadores de Performance */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Atendimentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalServices}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.todayServices}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tempo Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.avgServiceTime > 0 ? `${stats.avgServiceTime}min` : '-'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Fila Normal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-blue-600">{stats.queueServices}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Agendamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-purple-600">{stats.appointmentServices}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">{stats.whatsappServices}</div>
                </CardContent>
              </Card>
            </div>

            {/* Histórico de Atendimentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Histórico de Atendimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum atendimento registrado
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={`${item.type}-${item.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(item.type)}
                              {getTypeBadge(item.type)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.customerName}</TableCell>
                          <TableCell>{item.serviceName}</TableCell>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>
                            {item.duration ? `${item.duration} min` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'completed' ? 'default' : 'secondary'} 
                                   className={item.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                              {item.status === 'completed' ? 'Concluído' : item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttendantPerformanceModal;
