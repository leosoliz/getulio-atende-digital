import React, { useState, useEffect } from 'react';
import { BarChart, Users, Clock, CheckCircle, Calendar, MessageSquare, User } from 'lucide-react';
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
    serviceCountByType: {}
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
      // Simular dados de performance para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular loading
      
      const attendant = attendants.find(a => a.id === selectedAttendant);
      
      // Dados simulados baseados no atendente selecionado
      const simulatedStats = {
        totalServices: Math.floor(Math.random() * 100) + 50,
        todayServices: Math.floor(Math.random() * 20) + 5,
        averageServiceTime: Math.floor(Math.random() * 20) + 10,
        serviceCountByType: {
          'Fila Presencial': Math.floor(Math.random() * 30) + 15,
          'Atendimento Especializado': Math.floor(Math.random() * 25) + 10,
          'Suporte Técnico': Math.floor(Math.random() * 15) + 5
        }
      };

      setStats(simulatedStats);

      // Histórico simulado
      const simulatedHistory = Array.from({ length: 10 }, (_, index) => ({
        serviceType: ['Fila Presencial', 'Atendimento Especializado', 'Suporte Técnico'][Math.floor(Math.random() * 3)],
        customerName: `Cliente ${index + 1}`,
        serviceName: ['Emissão de Documento', 'Consulta Geral', 'Suporte Técnico', 'Atendimento Especializado'][Math.floor(Math.random() * 4)],
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 30) + 5,
        status: 'Concluído'
      }));

      setHistory(simulatedHistory);
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
      case 'Atendimento Especializado':
        return <CheckCircle className="h-4 w-4" />;
      case 'Suporte Técnico':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      'Fila Presencial': 'default',
      'Atendimento Especializado': 'secondary',
      'Suporte Técnico': 'outline'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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