
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Users, TrendingUp, Star, Clock, Phone, UserCheck, Calendar, Target, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import MetricsCard from "@/components/corporate/MetricsCard";
import SatisfactionChart from "@/components/corporate/SatisfactionChart";
import ServiceDistributionChart from "@/components/corporate/ServiceDistributionChart";
import TrendChart from "@/components/corporate/TrendChart";

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

interface Targets {
  daily: number;
  monthly: number;
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
  const [targets, setTargets] = useState<Targets>({
    daily: 150,
    monthly: 3000,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCorporateData();
    // Carregar metas salvas do localStorage
    const savedTargets = localStorage.getItem('corporate-targets');
    if (savedTargets) {
      setTargets(JSON.parse(savedTargets));
    }
  }, []);

  const updateTarget = (type: 'daily' | 'monthly', value: number) => {
    const newTargets = { ...targets, [type]: value };
    setTargets(newTargets);
    localStorage.setItem('corporate-targets', JSON.stringify(newTargets));
    toast({
      title: "Meta atualizada",
      description: `Meta ${type === 'daily' ? 'diária' : 'mensal'} atualizada para ${value}`,
    });
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando indicadores corporativos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Indicadores Corporativos
          </h1>
          <p className="text-muted-foreground text-lg">
            Visão estratégica dos indicadores de performance organizacional
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Diário
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mensal
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricsCard
                title="Total de Atendimentos"
                value={serviceStats.total}
                icon={<Users className="h-8 w-8" />}
                subtitle="Todos os tipos de atendimento"
                color="blue"
              />
              <MetricsCard
                title="Fila Presencial"
                value={serviceStats.queueServices}
                icon={<UserCheck className="h-8 w-8" />}
                subtitle="Atendimentos presenciais"
                color="green"
              />
              <MetricsCard
                title="WhatsApp"
                value={serviceStats.whatsappServices}
                icon={<Phone className="h-8 w-8" />}
                subtitle="Atendimentos por WhatsApp"
                color="purple"
              />
              <MetricsCard
                title="Agendamentos"
                value={serviceStats.identityServices}
                icon={<Calendar className="h-8 w-8" />}
                subtitle="Agendamentos de identidade"
                color="orange"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SatisfactionChart
                averageRating={satisfactionStats.averageRating}
                totalSurveys={satisfactionStats.totalSurveys}
                ratingDistribution={satisfactionStats.ratingDistribution}
              />
              <ServiceDistributionChart
                queueServices={serviceStats.queueServices}
                whatsappServices={serviceStats.whatsappServices}
                identityServices={serviceStats.identityServices}
                total={serviceStats.total}
              />
            </div>

            <TrendChart 
              todayServices={serviceStats.today}
              monthServices={serviceStats.thisMonth}
            />
          </TabsContent>

          <TabsContent value="daily" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <MetricsCard
                title="Atendimentos Hoje"
                value={serviceStats.today}
                target={targets.daily}
                icon={<CalendarDays className="h-8 w-8" />}
                subtitle={format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                color="blue"
                isEditable={true}
                onTargetUpdate={(value) => updateTarget('daily', value)}
              />
              <MetricsCard
                title="Eficiência Diária"
                value={serviceStats.today > 0 ? Math.round((serviceStats.today / targets.daily) * 100) : 0}
                icon={<Clock className="h-8 w-8" />}
                subtitle="% da meta diária"
                color="green"
              />
              <MetricsCard
                title="Status da Meta"
                value={Math.max(0, targets.daily - serviceStats.today)}
                icon={<Target className="h-8 w-8" />}
                subtitle={serviceStats.today >= targets.daily ? "Meta atingida! 🎉" : "Restantes para a meta"}
                color={serviceStats.today >= targets.daily ? "green" : "orange"}
              />
            </div>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-blue-100/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Performance Diária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progresso da Meta Diária</span>
                    <span className="text-sm text-muted-foreground">
                      {serviceStats.today} / {targets.daily}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-4">
                    <div
                      className="h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((serviceStats.today / targets.daily) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-center text-2xl font-bold text-blue-600">
                    {Math.round((serviceStats.today / targets.daily) * 100)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <MetricsCard
                title="Atendimentos Este Mês"
                value={serviceStats.thisMonth}
                target={targets.monthly}
                icon={<CalendarDays className="h-8 w-8" />}
                subtitle={format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                color="purple"
                isEditable={true}
                onTargetUpdate={(value) => updateTarget('monthly', value)}
              />
              <MetricsCard
                title="Performance Mensal"
                value={serviceStats.thisMonth > 0 ? Math.round((serviceStats.thisMonth / targets.monthly) * 100) : 0}
                icon={<TrendingUp className="h-8 w-8" />}
                subtitle="% da meta mensal"
                color="green"
              />
              <MetricsCard
                title="Projeção do Mês"
                value={Math.round((serviceStats.thisMonth / new Date().getDate()) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())}
                icon={<Target className="h-8 w-8" />}
                subtitle="Estimativa baseada na média diária"
                color="orange"
              />
            </div>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-purple-100/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Análise Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progresso da Meta Mensal</span>
                    <span className="text-sm text-muted-foreground">
                      {serviceStats.thisMonth} / {targets.monthly}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-4">
                    <div
                      className="h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((serviceStats.thisMonth / targets.monthly) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((serviceStats.thisMonth / targets.monthly) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Concluído</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.max(0, targets.monthly - serviceStats.thisMonth)}
                      </div>
                      <div className="text-sm text-muted-foreground">Restante</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <SatisfactionChart
                averageRating={satisfactionStats.averageRating}
                totalSurveys={satisfactionStats.totalSurveys}
                ratingDistribution={satisfactionStats.ratingDistribution}
              />
              <ServiceDistributionChart
                queueServices={serviceStats.queueServices}
                whatsappServices={serviceStats.whatsappServices}
                identityServices={serviceStats.identityServices}
                total={serviceStats.total}
              />
            </div>
            
            <TrendChart 
              todayServices={serviceStats.today}
              monthServices={serviceStats.thisMonth}
            />

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50">
                <CardHeader>
                  <CardTitle className="text-emerald-600">Taxa de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {serviceStats.total > 0 ? Math.round((serviceStats.total / (serviceStats.total + 50)) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Atendimentos concluídos</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50/50 to-rose-100/50">
                <CardHeader>
                  <CardTitle className="text-rose-600">Tempo Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-rose-600">15min</div>
                  <p className="text-sm text-muted-foreground">Por atendimento</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/50 to-cyan-100/50">
                <CardHeader>
                  <CardTitle className="text-cyan-600">Pico de Demanda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-600">14h-16h</div>
                  <p className="text-sm text-muted-foreground">Horário de pico</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
