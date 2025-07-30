import React, { useState, useEffect } from 'react';
import { BarChart, Users, Clock, CheckCircle, Calendar, MessageSquare, User, Star, IdCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AttendantProfile {
  id: string;
  full_name: string;
  user_type: string;
  location: string | null;
}

interface PerformanceStats {
  totalServices: number;
  todayServices: number;
  averageServiceTime: number;
  serviceCountByType: Record<string, number>;
  satisfactionStats: {
    averageRating: number;
    totalSurveys: number;
    ratingDistribution: Record<string, number>;
  };
}

interface ServiceHistory {
  serviceType: string;
  customerName: string;
  serviceName: string;
  date: string;
  duration: number;
  status: string;
}

const AttendantReports: React.FC = () => {
  const [attendants, setAttendants] = useState<AttendantProfile[]>([]);
  const [selectedAttendant, setSelectedAttendant] = useState<string>('');
  const [stats, setStats] = useState<PerformanceStats>({
    totalServices: 0,
    todayServices: 0,
    averageServiceTime: 0,
    serviceCountByType: {},
    satisfactionStats: {
      averageRating: 0,
      totalSurveys: 0,
      ratingDistribution: {}
    }
  });
  const [history, setHistory] = useState<ServiceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendants();
  }, []);

  useEffect(() => {
    if (selectedAttendant) {
      fetchPerformanceData();
    }
  }, [selectedAttendant]);

  const fetchAttendants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, location')
        .eq('user_type', 'attendant')
        .order('full_name');

      if (error) throw error;
      setAttendants(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar atendentes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPerformanceData = async () => {
    if (!selectedAttendant) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar atendimentos da fila presencial
      const { data: queueServices } = await supabase
        .from('queue_customers')
        .select(`
          id, created_at, completed_at, started_at,
          services(name)
        `)
        .eq('attendant_id', selectedAttendant)
        .not('completed_at', 'is', null);

      // Buscar atendimentos do WhatsApp
      const { data: whatsappServices } = await supabase
        .from('whatsapp_services')
        .select('id, created_at, service_id, services(name)')
        .eq('attendant_id', selectedAttendant);

      // Buscar agendamentos de identidade
      const { data: identityServices } = await supabase
        .from('identity_appointments')
        .select('id, created_at, completed_at, started_at')
        .eq('attendant_id', selectedAttendant)
        .not('completed_at', 'is', null);

      // Calcular estatísticas
      const queueCount = queueServices?.length || 0;
      const whatsappCount = whatsappServices?.length || 0;
      const identityCount = identityServices?.length || 0;
      const totalServices = queueCount + whatsappCount + identityCount;

      // Atendimentos de hoje
      const queueToday = queueServices?.filter(s => s.created_at?.startsWith(today)).length || 0;
      const whatsappToday = whatsappServices?.filter(s => s.created_at?.startsWith(today)).length || 0;
      const identityToday = identityServices?.filter(s => s.created_at?.startsWith(today)).length || 0;
      const todayServices = queueToday + whatsappToday + identityToday;

      // Calcular tempo médio de atendimento
      const completedServices = queueServices?.concat(identityServices as any) || [];
      const validDurations = completedServices
        .filter(s => s.started_at && s.completed_at)
        .map(s => {
          const start = new Date(s.started_at!);
          const end = new Date(s.completed_at!);
          return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // em minutos
        })
        .filter(duration => duration > 0 && duration < 300); // filtrar valores válidos

      const averageServiceTime = validDurations.length > 0 
        ? Math.round(validDurations.reduce((sum, time) => sum + time, 0) / validDurations.length)
        : 0;

      // Buscar dados de satisfação
      const { data: satisfactionData } = await supabase
        .from('satisfaction_surveys')
        .select('overall_rating')
        .eq('attendant_id', selectedAttendant);

      // Calcular estatísticas de satisfação
      const totalSurveys = satisfactionData?.length || 0;
      const ratingDistribution: Record<string, number> = {};
      let averageRating = 0;

      if (totalSurveys > 0) {
        satisfactionData?.forEach(survey => {
          const rating = survey.overall_rating;
          ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        });

        // Converter ratings em números para calcular média
        const ratingValues = satisfactionData?.map(s => {
          switch(s.overall_rating) {
            case 'excelente': return 5;
            case 'bom': return 4;
            case 'regular': return 3;
            case 'ruim': return 2;
            case 'pessimo': return 1;
            default: return 3;
          }
        }) || [];

        averageRating = ratingValues.length > 0 
          ? Math.round((ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length) * 10) / 10
          : 0;
      }

      // Montar estatísticas
      const stats: PerformanceStats = {
        totalServices,
        todayServices,
        averageServiceTime,
        serviceCountByType: {
          'Fila Presencial': queueCount,
          'WhatsApp': whatsappCount,
          'Agendamento Identidade': identityCount
        },
        satisfactionStats: {
          averageRating,
          totalSurveys,
          ratingDistribution
        }
      };

      setStats(stats);

      // Montar histórico combinado
      const historyItems: ServiceHistory[] = [];
      
      // Adicionar serviços da fila
      queueServices?.forEach(service => {
        historyItems.push({
          serviceType: 'Fila Presencial',
          customerName: 'Cliente da Fila',
          serviceName: service.services?.name || 'Serviço Geral',
          date: service.completed_at || service.created_at,
          duration: service.started_at && service.completed_at 
            ? Math.round((new Date(service.completed_at).getTime() - new Date(service.started_at).getTime()) / (1000 * 60))
            : 0,
          status: 'Concluído'
        });
      });

      // Adicionar serviços do WhatsApp
      whatsappServices?.forEach(service => {
        historyItems.push({
          serviceType: 'WhatsApp',
          customerName: 'Cliente WhatsApp',
          serviceName: service.services?.name || 'Atendimento WhatsApp',
          date: service.created_at,
          duration: 0,
          status: 'Concluído'
        });
      });

      // Adicionar agendamentos de identidade
      identityServices?.forEach(service => {
        historyItems.push({
          serviceType: 'Agendamento Identidade',
          customerName: 'Cliente Agendamento',
          serviceName: 'Documento de Identidade',
          date: service.completed_at || service.created_at,
          duration: service.started_at && service.completed_at 
            ? Math.round((new Date(service.completed_at).getTime() - new Date(service.started_at).getTime()) / (1000 * 60))
            : 0,
          status: 'Concluído'
        });
      });

      // Ordenar por data mais recente e pegar os 10 primeiros
      historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(historyItems.slice(0, 10));

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Fila Presencial':
        return <Users className="h-4 w-4" />;
      case 'WhatsApp':
        return <MessageSquare className="h-4 w-4" />;
      case 'Agendamento Identidade':
        return <IdCard className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      'Fila Presencial': 'default',
      'WhatsApp': 'secondary',
      'Agendamento Identidade': 'outline'
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'} className="flex items-center gap-1">
        {getTypeIcon(type)}
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Relatórios de Atendentes
          </CardTitle>
          <CardDescription>
            Selecione um atendente para visualizar seus indicadores de performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="max-w-sm">
              <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um atendente" />
                </SelectTrigger>
                <SelectContent>
                  {attendants.map((attendant) => (
                    <SelectItem key={attendant.id} value={attendant.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {attendant.full_name}
                        {attendant.location && (
                          <span className="text-muted-foreground text-xs">
                            - {attendant.location}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAttendant && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Total de Atendimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-primary">{stats.totalServices}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Atendimentos Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-primary">{stats.todayServices}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Tempo Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold text-primary">{stats.averageServiceTime}min</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tipos de Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(stats.serviceCountByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{type}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Satisfação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary flex items-center gap-1">
                      {stats.satisfactionStats.averageRating}
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stats.satisfactionStats.totalSurveys} avaliações
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Atendimentos */}
          <Card className="shadow-shadow-card">
            <CardHeader>
              <CardTitle>Últimos Atendimentos</CardTitle>
              <CardDescription>
                Histórico dos 10 atendimentos mais recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum atendimento encontrado</p>
                </div>
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
                    {history.map((service, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {getTypeBadge(service.serviceType)}
                        </TableCell>
                        <TableCell>{service.customerName}</TableCell>
                        <TableCell>{service.serviceName}</TableCell>
                        <TableCell>{formatDate(service.date)}</TableCell>
                        <TableCell>{service.duration}min</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-green-600">
                            {service.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendantReports;