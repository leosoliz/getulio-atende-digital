import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Users, TrendingUp, Star, Clock, Phone, UserCheck, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ServiceStats {
  total: number;
  today: number;
  thisMonth: number;
  queueServices: number;
  whatsappServices: number;
  identityServices: number;
}

interface SatisfactionStats {
  totalSurveys: number;
  averageRating: number;
  ratingDistribution: { [key: string]: number };
}

export default function Corporate() {
  const [serviceStats, setServiceStats] = useState<ServiceStats>({
    total: 0,
    today: 0,
    thisMonth: 0,
    queueServices: 0,
    whatsappServices: 0,
    identityServices: 0,
  });
  const [satisfactionStats, setSatisfactionStats] = useState<SatisfactionStats>({
    totalSurveys: 0,
    averageRating: 0,
    ratingDistribution: {},
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCorporateData();
  }, []);

  const fetchCorporateData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      const startOfThisMonth = startOfMonth(today);
      const endOfThisMonth = endOfMonth(today);

      // Buscar dados da fila normal
      const { data: queueData } = await supabase
        .from('queue_customers')
        .select('*');

      const { data: queueTodayData } = await supabase
        .from('queue_customers')
        .select('*')
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString());

      const { data: queueMonthData } = await supabase
        .from('queue_customers')
        .select('*')
        .gte('created_at', startOfThisMonth.toISOString())
        .lte('created_at', endOfThisMonth.toISOString());

      // Buscar dados do WhatsApp
      const { data: whatsappData } = await supabase
        .from('whatsapp_services')
        .select('*');

      const { data: whatsappTodayData } = await supabase
        .from('whatsapp_services')
        .select('*')
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString());

      const { data: whatsappMonthData } = await supabase
        .from('whatsapp_services')
        .select('*')
        .gte('created_at', startOfThisMonth.toISOString())
        .lte('created_at', endOfThisMonth.toISOString());

      // Buscar dados de agendamento de identidade
      const { data: identityData } = await supabase
        .from('identity_appointments')
        .select('*');

      const { data: identityTodayData } = await supabase
        .from('identity_appointments')
        .select('*')
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString());

      const { data: identityMonthData } = await supabase
        .from('identity_appointments')
        .select('*')
        .gte('created_at', startOfThisMonth.toISOString())
        .lte('created_at', endOfThisMonth.toISOString());

      // Calcular estatísticas de serviços
      const queueCount = queueData?.length || 0;
      const whatsappCount = whatsappData?.length || 0;
      const identityCount = identityData?.length || 0;

      const queueTodayCount = queueTodayData?.length || 0;
      const whatsappTodayCount = whatsappTodayData?.length || 0;
      const identityTodayCount = identityTodayData?.length || 0;

      const queueMonthCount = queueMonthData?.length || 0;
      const whatsappMonthCount = whatsappMonthData?.length || 0;
      const identityMonthCount = identityMonthData?.length || 0;

      setServiceStats({
        total: queueCount + whatsappCount + identityCount,
        today: queueTodayCount + whatsappTodayCount + identityTodayCount,
        thisMonth: queueMonthCount + whatsappMonthCount + identityMonthCount,
        queueServices: queueCount,
        whatsappServices: whatsappCount,
        identityServices: identityCount,
      });

      // Buscar dados de satisfação
      const { data: satisfactionData } = await supabase
        .from('satisfaction_surveys')
        .select('overall_rating');

      if (satisfactionData && satisfactionData.length > 0) {
        const ratings = satisfactionData.map(s => s.overall_rating);
        const ratingValues: { [key: string]: number } = {
          'excelente': 5,
          'bom': 4,
          'regular': 3,
          'ruim': 2,
          'pessimo': 1
        };

        const numericRatings = ratings.map(r => ratingValues[r] || 0).filter(r => r > 0);
        const averageRating = numericRatings.length > 0 
          ? numericRatings.reduce((sum, rating) => sum + rating, 0) / numericRatings.length 
          : 0;

        const distribution = ratings.reduce((acc, rating) => {
          acc[rating] = (acc[rating] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        setSatisfactionStats({
          totalSurveys: satisfactionData.length,
          averageRating,
          ratingDistribution: distribution,
        });
      }

    } catch (error) {
      console.error('Erro ao buscar dados corporativos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados corporativos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados corporativos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Indicadores Corporativos</h1>
          <p className="text-muted-foreground">
            Visão geral dos indicadores de performance da organização
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="daily">Desempenho Diário</TabsTrigger>
            <TabsTrigger value="monthly">Desempenho Mensal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serviceStats.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Todos os tipos de atendimento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fila Presencial</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serviceStats.queueServices.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Atendimentos presenciais
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serviceStats.whatsappServices.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Atendimentos por WhatsApp
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serviceStats.identityServices.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Agendamentos de identidade
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Satisfação Geral
                  </CardTitle>
                  <CardDescription>
                    Índices de satisfação dos atendimentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Nota Média</span>
                    <Badge variant="secondary">
                      {satisfactionStats.averageRating.toFixed(1)}/5.0
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total de Avaliações</span>
                    <span className="text-sm">{satisfactionStats.totalSurveys}</span>
                  </div>
                  {Object.entries(satisfactionStats.ratingDistribution).map(([rating, count]) => (
                    <div key={rating} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{rating}</span>
                      <span className="text-sm">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Distribuição por Canal
                  </CardTitle>
                  <CardDescription>
                    Distribuição dos atendimentos por tipo de canal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Presencial</span>
                    <Badge variant="outline">
                      {serviceStats.total > 0 
                        ? Math.round((serviceStats.queueServices / serviceStats.total) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">WhatsApp</span>
                    <Badge variant="outline">
                      {serviceStats.total > 0 
                        ? Math.round((serviceStats.whatsappServices / serviceStats.total) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Agendamentos</span>
                    <Badge variant="outline">
                      {serviceStats.total > 0 
                        ? Math.round((serviceStats.identityServices / serviceStats.total) * 100)
                        : 0}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="daily" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atendimentos Hoje</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serviceStats.today.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meta Diária</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">150</div>
                  <p className="text-xs text-muted-foreground">
                    {serviceStats.today >= 150 ? "✅ Meta atingida" : `${150 - serviceStats.today} restantes`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {serviceStats.today > 0 ? Math.round((serviceStats.today / 150) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    da meta diária
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atendimentos Este Mês</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serviceStats.thisMonth.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meta Mensal</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.000</div>
                  <p className="text-xs text-muted-foreground">
                    {serviceStats.thisMonth >= 3000 ? "✅ Meta atingida" : `${3000 - serviceStats.thisMonth} restantes`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {serviceStats.thisMonth > 0 ? Math.round((serviceStats.thisMonth / 3000) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    da meta mensal
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}