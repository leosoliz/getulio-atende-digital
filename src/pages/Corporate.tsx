import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Users, TrendingUp, Star, Clock, Phone, UserCheck, Calendar, Target, BarChart3, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import MetricsCard from "@/components/corporate/MetricsCard";
import SatisfactionChart from "@/components/corporate/SatisfactionChart";
import ServiceDistributionChart from "@/components/corporate/ServiceDistributionChart";
import ServiceTypeDistributionChart from "@/components/corporate/ServiceTypeDistributionChart";
import TrendChart from "@/components/corporate/TrendChart";
interface ServiceStats {
  total: number;
  today: number;
  thisMonth: number;
  queueServices: number;
  whatsappServices: number;
  identityServices: number;
  averageServiceTime: number;
  averageWaitTime: number;
}
interface ServiceTypeData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}
interface MonthlyData {
  month: string;
  services: number;
  fullMonth: string;
}
interface SatisfactionStats {
  totalSurveys: number;
  averageRating: number;
  ratingDistribution: {
    [key: string]: number;
  };
}

interface AttendantData {
  name: string;
  value: number;
  color: string;
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
    averageServiceTime: 0,
    averageWaitTime: 0
  });
  const [satisfactionStats, setSatisfactionStats] = useState<SatisfactionStats>({
    totalSurveys: 0,
    averageRating: 0,
    ratingDistribution: {}
  });
  const [targets, setTargets] = useState<Targets>({
    daily: 150,
    monthly: 3000
  });
  const [serviceTypeData, setServiceTypeData] = useState<ServiceTypeData[]>([]);
  const [dailyServiceTypeData, setDailyServiceTypeData] = useState<ServiceTypeData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [attendantData, setAttendantData] = useState<AttendantData[]>([]);
  const [dailyAttendantData, setDailyAttendantData] = useState<AttendantData[]>([]);
  const [dailyQueueServices, setDailyQueueServices] = useState(0);
  const [dailyWhatsappServices, setDailyWhatsappServices] = useState(0);
  const [dailyIdentityServices, setDailyIdentityServices] = useState(0);
  const [dailyAverageServiceTime, setDailyAverageServiceTime] = useState(0);
  const [dailyAverageWaitTime, setDailyAverageWaitTime] = useState(0);
  const [dailySatisfactionStats, setDailySatisfactionStats] = useState<SatisfactionStats>({
    totalSurveys: 0,
    averageRating: 0,
    ratingDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchCorporateData();
    // Carregar metas salvas do localStorage
    const savedTargets = localStorage.getItem('corporate-targets');
    if (savedTargets) {
      setTargets(JSON.parse(savedTargets));
    }
  }, []);
  const updateTarget = (type: 'daily' | 'monthly', value: number) => {
    const newTargets = {
      ...targets,
      [type]: value
    };
    setTargets(newTargets);
    localStorage.setItem('corporate-targets', JSON.stringify(newTargets));
    toast({
      title: "Meta atualizada",
      description: `Meta ${type === 'daily' ? 'diária' : 'mensal'} atualizada para ${value}`
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
      const {
        data: queueData
      } = await supabase.from('queue_customers').select('*');
      const {
        data: queueTodayData
      } = await supabase.from('queue_customers').select('*').gte('created_at', startOfToday.toISOString()).lte('created_at', endOfToday.toISOString());
      const {
        data: queueMonthData
      } = await supabase.from('queue_customers').select('*').gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString());

      // Buscar dados do WhatsApp
      const {
        data: whatsappData
      } = await supabase.from('whatsapp_services').select('*');
      const {
        data: whatsappTodayData
      } = await supabase.from('whatsapp_services').select('*').gte('created_at', startOfToday.toISOString()).lte('created_at', endOfToday.toISOString());
      const {
        data: whatsappMonthData
      } = await supabase.from('whatsapp_services').select('*').gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString());

      // Buscar dados de agendamento de identidade
      const {
        data: identityData
      } = await supabase.from('identity_appointments').select('*');
      const {
        data: identityTodayData
      } = await supabase.from('identity_appointments').select('*').gte('created_at', startOfToday.toISOString()).lte('created_at', endOfToday.toISOString());
      const {
        data: identityMonthData
      } = await supabase.from('identity_appointments').select('*').gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString());

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

      // Calcular tempo médio de atendimento (em minutos)
      let totalServiceTime = 0;
      let completedServices = 0;

      // Calcular tempo da fila presencial
      queueData?.forEach(service => {
        if (service.started_at && service.completed_at) {
          const startTime = new Date(service.started_at).getTime();
          const endTime = new Date(service.completed_at).getTime();
          totalServiceTime += endTime - startTime;
          completedServices++;
        }
      });

      // Calcular tempo dos agendamentos de identidade
      identityData?.forEach(appointment => {
        if (appointment.started_at && appointment.completed_at) {
          const startTime = new Date(appointment.started_at).getTime();
          const endTime = new Date(appointment.completed_at).getTime();
          totalServiceTime += endTime - startTime;
          completedServices++;
        }
      });
      const averageServiceTimeMinutes = completedServices > 0 ? Math.round(totalServiceTime / completedServices / 1000 / 60) : 0;

      // Calcular tempo médio de espera (em minutos)
      let totalWaitTime = 0;
      let waitingCustomers = 0;

      // Calcular tempo de espera da fila presencial
      queueData?.forEach(service => {
        if (service.created_at && service.called_at) {
          const createdTime = new Date(service.created_at).getTime();
          const calledTime = new Date(service.called_at).getTime();
          const waitTime = calledTime - createdTime;
          // Apenas considerar tempos de espera razoáveis (menos de 4 horas)
          if (waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
            totalWaitTime += waitTime;
            waitingCustomers++;
          }
        }
      });

      // Calcular tempo de espera dos agendamentos
      identityData?.forEach(appointment => {
        if (appointment.created_at && appointment.called_at) {
          const createdTime = new Date(appointment.created_at).getTime();
          const calledTime = new Date(appointment.called_at).getTime();
          const waitTime = calledTime - createdTime;
          // Apenas considerar tempos de espera razoáveis (menos de 4 horas)
          if (waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
            totalWaitTime += waitTime;
            waitingCustomers++;
          }
        }
      });
      const averageWaitTimeMinutes = waitingCustomers > 0 ? Math.round(totalWaitTime / waitingCustomers / 1000 / 60) : 0;
      setServiceStats({
        total: queueCount + whatsappCount + identityCount,
        today: queueTodayCount + whatsappTodayCount + identityTodayCount,
        thisMonth: queueMonthCount + whatsappMonthCount + identityMonthCount,
        queueServices: queueCount,
        whatsappServices: whatsappCount,
        identityServices: identityCount,
        averageServiceTime: averageServiceTimeMinutes,
        averageWaitTime: averageWaitTimeMinutes
      });

      // Buscar todos os serviços disponíveis
      const {
        data: servicesData
      } = await supabase.from('services').select('id, name').eq('active', true);

      // Buscar todos os atendimentos com seus service_id
      const {
        data: allQueueServices
      } = await supabase.from('queue_customers').select('service_id');
      const {
        data: allWhatsappServices
      } = await supabase.from('whatsapp_services').select('service_id');
      const {
        data: allIdentityAppointments
      } = await supabase.from('identity_appointments').select('id');

      // Criar distribuição por tipo de serviço
      const serviceTypeDistribution: {
        [key: string]: number;
      } = {};

      // Contar atendimentos por service_id da fila
      allQueueServices?.forEach(service => {
        const serviceId = service.service_id;
        serviceTypeDistribution[serviceId] = (serviceTypeDistribution[serviceId] || 0) + 1;
      });

      // Contar atendimentos por service_id do WhatsApp
      allWhatsappServices?.forEach(service => {
        const serviceId = service.service_id;
        serviceTypeDistribution[serviceId] = (serviceTypeDistribution[serviceId] || 0) + 1;
      });

      // Agendamentos de identidade não têm service_id, então vamos considerar como um tipo separado
      const identityAppointmentsCount = allIdentityAppointments?.length || 0;
      if (identityAppointmentsCount > 0) {
        serviceTypeDistribution['identity'] = identityAppointmentsCount;
      }

      // Mapear para o formato do componente
      const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];
      const totalServices = Object.values(serviceTypeDistribution).reduce((a, b) => a + b, 0);
      const serviceTypesArray: ServiceTypeData[] = [];

      // Adicionar serviços regulares
      Object.entries(serviceTypeDistribution).forEach(([serviceId, count], index) => {
        if (serviceId === 'identity') {
          serviceTypesArray.push({
            name: 'Agendamento de Identidade',
            value: count,
            percentage: totalServices > 0 ? Math.round(count / totalServices * 100) : 0,
            color: COLORS[index % COLORS.length]
          });
        } else {
          const serviceName = servicesData?.find(s => s.id === serviceId)?.name || 'Serviço não identificado';
          serviceTypesArray.push({
            name: serviceName,
            value: count,
            percentage: totalServices > 0 ? Math.round(count / totalServices * 100) : 0,
            color: COLORS[index % COLORS.length]
          });
        }
      });

      // Ordenar por quantidade (decrescente)
      serviceTypesArray.sort((a, b) => b.value - a.value);
      setServiceTypeData(serviceTypesArray);

      // Buscar dados dos últimos 12 meses
      const monthlyDataArray: MonthlyData[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const startOfMonthDate = startOfMonth(monthDate);
        const endOfMonthDate = endOfMonth(monthDate);

        // Buscar atendimentos da fila
        const {
          data: queueMonthData
        } = await supabase.from('queue_customers').select('id').gte('created_at', startOfMonthDate.toISOString()).lte('created_at', endOfMonthDate.toISOString());

        // Buscar atendimentos do WhatsApp
        const {
          data: whatsappMonthData
        } = await supabase.from('whatsapp_services').select('id').gte('created_at', startOfMonthDate.toISOString()).lte('created_at', endOfMonthDate.toISOString());

        // Buscar agendamentos de identidade
        const {
          data: identityMonthData
        } = await supabase.from('identity_appointments').select('id').gte('created_at', startOfMonthDate.toISOString()).lte('created_at', endOfMonthDate.toISOString());
        const totalMonthServices = (queueMonthData?.length || 0) + (whatsappMonthData?.length || 0) + (identityMonthData?.length || 0);
        monthlyDataArray.push({
          month: format(monthDate, "MMM/yy", {
            locale: ptBR
          }),
          services: totalMonthServices,
          fullMonth: format(monthDate, "MMMM 'de' yyyy", {
            locale: ptBR
          })
        });
      }
      setMonthlyData(monthlyDataArray);

      // Buscar dados de atendentes
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('user_type', 'attendant');

      console.log('Profiles data:', profilesData);

      // Criar distribuição por atendente
      const attendantDistribution: { [key: string]: number } = {};

      // Contar atendimentos por attendant_id da fila
      queueData?.forEach(service => {
        if (service.attendant_id) {
          attendantDistribution[service.attendant_id] = (attendantDistribution[service.attendant_id] || 0) + 1;
        }
      });

      // Contar atendimentos por attendant_id do WhatsApp
      whatsappData?.forEach(service => {
        if (service.attendant_id) {
          attendantDistribution[service.attendant_id] = (attendantDistribution[service.attendant_id] || 0) + 1;
        }
      });

      // Contar atendimentos por attendant_id dos agendamentos de identidade
      identityData?.forEach(appointment => {
        if (appointment.attendant_id) {
          attendantDistribution[appointment.attendant_id] = (attendantDistribution[appointment.attendant_id] || 0) + 1;
        }
      });

      console.log('Attendant distribution:', attendantDistribution);

      // Cores para o gráfico
      const attendantColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#94a3b8", "#f97316", "#84cc16"];

      // Mapear para o formato do componente
      const attendantsArray: AttendantData[] = Object.entries(attendantDistribution).map(([attendantId, count], index) => {
        const attendantName = profilesData?.find(p => p.id === attendantId)?.full_name || 'Atendente não identificado';
        return {
          name: attendantName,
          value: count,
          color: attendantColors[index % attendantColors.length]
        };
      });

      // Ordenar por quantidade (decrescente)
      attendantsArray.sort((a, b) => b.value - a.value);
      console.log('Attendants array:', attendantsArray);
      setAttendantData(attendantsArray);

      // === DADOS DIÁRIOS ===
      // Buscar atendimentos de hoje para distribuição por tipo de serviço
      const dailyServiceTypeDistribution: { [key: string]: number } = {};

      // Contar atendimentos de hoje por service_id da fila
      queueTodayData?.forEach(service => {
        const serviceId = service.service_id;
        dailyServiceTypeDistribution[serviceId] = (dailyServiceTypeDistribution[serviceId] || 0) + 1;
      });

      // Contar atendimentos de hoje por service_id do WhatsApp
      whatsappTodayData?.forEach(service => {
        const serviceId = service.service_id;
        dailyServiceTypeDistribution[serviceId] = (dailyServiceTypeDistribution[serviceId] || 0) + 1;
      });

      // Agendamentos de identidade de hoje
      const dailyIdentityAppointmentsCount = identityTodayData?.length || 0;
      if (dailyIdentityAppointmentsCount > 0) {
        dailyServiceTypeDistribution['identity'] = dailyIdentityAppointmentsCount;
      }

      // Mapear para o formato do componente
      const totalDailyServices = Object.values(dailyServiceTypeDistribution).reduce((a, b) => a + b, 0);
      const dailyServiceTypesArray: ServiceTypeData[] = [];

      // Adicionar serviços regulares
      Object.entries(dailyServiceTypeDistribution).forEach(([serviceId, count], index) => {
        if (serviceId === 'identity') {
          dailyServiceTypesArray.push({
            name: 'Agendamento de Identidade',
            value: count,
            percentage: totalDailyServices > 0 ? Math.round(count / totalDailyServices * 100) : 0,
            color: COLORS[index % COLORS.length]
          });
        } else {
          const serviceName = servicesData?.find(s => s.id === serviceId)?.name || 'Serviço não identificado';
          dailyServiceTypesArray.push({
            name: serviceName,
            value: count,
            percentage: totalDailyServices > 0 ? Math.round(count / totalDailyServices * 100) : 0,
            color: COLORS[index % COLORS.length]
          });
        }
      });

      // Ordenar por quantidade (decrescente)
      dailyServiceTypesArray.sort((a, b) => b.value - a.value);
      setDailyServiceTypeData(dailyServiceTypesArray);

      // Distribuição por atendente de hoje
      const dailyAttendantDistribution: { [key: string]: number } = {};

      // Contar atendimentos de hoje por attendant_id da fila
      queueTodayData?.forEach(service => {
        if (service.attendant_id) {
          dailyAttendantDistribution[service.attendant_id] = (dailyAttendantDistribution[service.attendant_id] || 0) + 1;
        }
      });

      // Contar atendimentos de hoje por attendant_id do WhatsApp
      whatsappTodayData?.forEach(service => {
        if (service.attendant_id) {
          dailyAttendantDistribution[service.attendant_id] = (dailyAttendantDistribution[service.attendant_id] || 0) + 1;
        }
      });

      // Contar atendimentos de hoje por attendant_id dos agendamentos de identidade
      identityTodayData?.forEach(appointment => {
        if (appointment.attendant_id) {
          dailyAttendantDistribution[appointment.attendant_id] = (dailyAttendantDistribution[appointment.attendant_id] || 0) + 1;
        }
      });

      // Mapear para o formato do componente
      const dailyAttendantsArray: AttendantData[] = Object.entries(dailyAttendantDistribution).map(([attendantId, count], index) => {
        const attendantName = profilesData?.find(p => p.id === attendantId)?.full_name || 'Atendente não identificado';
        return {
          name: attendantName,
          value: count,
          color: attendantColors[index % attendantColors.length]
        };
      });

      // Ordenar por quantidade (decrescente)
      dailyAttendantsArray.sort((a, b) => b.value - a.value);
      setDailyAttendantData(dailyAttendantsArray);

      // Armazenar contagens de serviços diários
      setDailyQueueServices(queueTodayCount);
      setDailyWhatsappServices(whatsappTodayCount);
      setDailyIdentityServices(identityTodayCount);

      // Calcular tempo médio de atendimento DIÁRIO (em minutos)
      let dailyTotalServiceTime = 0;
      let dailyCompletedServices = 0;

      // Calcular tempo da fila presencial de hoje
      queueTodayData?.forEach(service => {
        if (service.started_at && service.completed_at) {
          const startTime = new Date(service.started_at).getTime();
          const endTime = new Date(service.completed_at).getTime();
          dailyTotalServiceTime += endTime - startTime;
          dailyCompletedServices++;
        }
      });

      // Calcular tempo dos agendamentos de identidade de hoje
      identityTodayData?.forEach(appointment => {
        if (appointment.started_at && appointment.completed_at) {
          const startTime = new Date(appointment.started_at).getTime();
          const endTime = new Date(appointment.completed_at).getTime();
          dailyTotalServiceTime += endTime - startTime;
          dailyCompletedServices++;
        }
      });
      const dailyAverageServiceTimeMinutes = dailyCompletedServices > 0 ? Math.round(dailyTotalServiceTime / dailyCompletedServices / 1000 / 60) : 0;
      setDailyAverageServiceTime(dailyAverageServiceTimeMinutes);

      // Calcular tempo médio de espera DIÁRIO (em minutos)
      // Buscar atendimentos chamados hoje
      const { data: queueCalledTodayData } = await supabase
        .from('queue_customers')
        .select('*')
        .gte('called_at', startOfToday.toISOString())
        .lte('called_at', endOfToday.toISOString())
        .not('created_at', 'is', null);

      const { data: identityCalledTodayData } = await supabase
        .from('identity_appointments')
        .select('*')
        .gte('called_at', startOfToday.toISOString())
        .lte('called_at', endOfToday.toISOString())
        .not('created_at', 'is', null);

      let dailyTotalWaitTime = 0;
      let dailyWaitingCustomers = 0;

      // Calcular tempo de espera da fila presencial de hoje
      queueCalledTodayData?.forEach(service => {
        if (service.created_at && service.called_at) {
          const createdTime = new Date(service.created_at).getTime();
          const calledTime = new Date(service.called_at).getTime();
          const waitTime = calledTime - createdTime;
          // Apenas considerar tempos de espera razoáveis (menos de 4 horas)
          if (waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
            dailyTotalWaitTime += waitTime;
            dailyWaitingCustomers++;
          }
        }
      });

      // Calcular tempo de espera dos agendamentos de hoje
      identityCalledTodayData?.forEach(appointment => {
        if (appointment.created_at && appointment.called_at) {
          const createdTime = new Date(appointment.created_at).getTime();
          const calledTime = new Date(appointment.called_at).getTime();
          const waitTime = calledTime - createdTime;
          // Apenas considerar tempos de espera razoáveis (menos de 4 horas)
          if (waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
            dailyTotalWaitTime += waitTime;
            dailyWaitingCustomers++;
          }
        }
      });
      
      const dailyAverageWaitTimeMinutes = dailyWaitingCustomers > 0 ? Math.round(dailyTotalWaitTime / dailyWaitingCustomers / 1000 / 60) : 0;
      
      console.log('Tempo de espera diário:', {
        totalWaitTime: dailyTotalWaitTime,
        waitingCustomers: dailyWaitingCustomers,
        averageMinutes: dailyAverageWaitTimeMinutes
      });
      
      setDailyAverageWaitTime(dailyAverageWaitTimeMinutes);

      // Buscar dados de satisfação (todos)
      const {
        data: satisfactionData
      } = await supabase.from('satisfaction_surveys').select('overall_rating, problem_resolved');
      if (satisfactionData && satisfactionData.length > 0) {
        // Mapear valores de avaliação (normalizado para 0-100)
        const ratingValues: {
          [key: string]: number;
        } = {
          'excelente': 100,
          'bom': 75,
          'regular': 50,
          'ruim': 25,
          'pessimo': 0
        };

        // Mapear valores de resolução de problema
        const resolvedValues: {
          [key: string]: number;
        } = {
          'sim': 100,
          'parcialmente': 50,
          'não': 0,
          'nao': 0
        };

        // Calcular score ponderado: 70% avaliação geral + 30% resolução de problema
        let totalScore = 0;
        let validSurveys = 0;
        satisfactionData.forEach(survey => {
          const ratingScore = ratingValues[survey.overall_rating?.toLowerCase()] ?? 0;
          const resolvedScore = resolvedValues[survey.problem_resolved?.toLowerCase()] ?? 0;

          // Equação ponderada de satisfação
          const satisfactionScore = ratingScore * 0.7 + resolvedScore * 0.3;
          totalScore += satisfactionScore;
          validSurveys++;
        });
        const averageRating = validSurveys > 0 ? totalScore / validSurveys / 20 : 0;
        const distribution = satisfactionData.reduce((acc, survey) => {
          const rating = survey.overall_rating || 'sem avaliação';
          acc[rating] = (acc[rating] || 0) + 1;
          return acc;
        }, {} as {
          [key: string]: number;
        });
        setSatisfactionStats({
          totalSurveys: satisfactionData.length,
          averageRating,
          ratingDistribution: distribution
        });
      }

      // Buscar dados de satisfação DIÁRIA
      const {
        data: dailySatisfactionData
      } = await supabase.from('satisfaction_surveys').select('overall_rating, problem_resolved').gte('created_at', startOfToday.toISOString()).lte('created_at', endOfToday.toISOString());
      
      if (dailySatisfactionData && dailySatisfactionData.length > 0) {
        // Mapear valores de avaliação (normalizado para 0-100)
        const ratingValues: {
          [key: string]: number;
        } = {
          'excelente': 100,
          'bom': 75,
          'regular': 50,
          'ruim': 25,
          'pessimo': 0
        };

        // Mapear valores de resolução de problema
        const resolvedValues: {
          [key: string]: number;
        } = {
          'sim': 100,
          'parcialmente': 50,
          'não': 0,
          'nao': 0
        };

        // Calcular score ponderado: 70% avaliação geral + 30% resolução de problema
        let totalScore = 0;
        let validSurveys = 0;
        dailySatisfactionData.forEach(survey => {
          const ratingScore = ratingValues[survey.overall_rating?.toLowerCase()] ?? 0;
          const resolvedScore = resolvedValues[survey.problem_resolved?.toLowerCase()] ?? 0;

          // Equação ponderada de satisfação
          const satisfactionScore = ratingScore * 0.7 + resolvedScore * 0.3;
          totalScore += satisfactionScore;
          validSurveys++;
        });
        const dailyAverageRating = validSurveys > 0 ? totalScore / validSurveys / 20 : 0;
        const dailyDistribution = dailySatisfactionData.reduce((acc, survey) => {
          const rating = survey.overall_rating || 'sem avaliação';
          acc[rating] = (acc[rating] || 0) + 1;
          return acc;
        }, {} as {
          [key: string]: number;
        });
        setDailySatisfactionStats({
          totalSurveys: dailySatisfactionData.length,
          averageRating: dailyAverageRating,
          ratingDistribution: dailyDistribution
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados corporativos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados corporativos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando indicadores corporativos...</p>
        </div>
      </div>;
  }
  return <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden flex flex-col">
      <div className="container mx-auto px-2 py-1 flex-1 flex flex-col overflow-hidden">
        <div className="mb-1 text-center">
          <h1 className="text-lg font-bold text-foreground mb-0 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Indicadores de Atendimento</h1>
          <p className="text-muted-foreground text-[10px]">Secretaria de Desenvolvimento Econômico e Planejamento</p>
        </div>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur mb-1 h-7">
            <TabsTrigger value="overview" className="flex items-center gap-1 text-xs py-1">
              <BarChart3 className="h-3 w-3" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-1 text-xs py-1">
              <CalendarDays className="h-3 w-3" />
              Diário
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-1 text-xs py-1">
              <TrendingUp className="h-3 w-3" />
              Mensal
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs py-1">
              <Target className="h-3 w-3" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-4">
              <MetricsCard title="Total de Atendimentos" value={serviceStats.total} icon={<Users className="h-6 w-6" />} subtitle="Todos os tipos de atendimento" color="blue" />
              <MetricsCard title="Tempo Médio de Atendimento" value={serviceStats.averageServiceTime} icon={<Clock className="h-6 w-6" />} subtitle="Minutos por atendimento" color="green" />
              <MetricsCard title="Tempo Médio de Espera" value={serviceStats.averageWaitTime} icon={<Timer className="h-6 w-6" />} subtitle="Minutos até ser chamado" color="purple" />
              <MetricsCard title="Satisfação" value={Math.round(satisfactionStats.averageRating * 20)} icon={<Star className="h-6 w-6" />} subtitle={`${satisfactionStats.totalSurveys} avaliações`} color="orange" isPercentage={true} />
              </div>

              <div className="grid gap-1 lg:grid-cols-3">
                <SatisfactionChart attendants={attendantData} total={serviceStats.total} />
                <ServiceDistributionChart queueServices={serviceStats.queueServices} whatsappServices={serviceStats.whatsappServices} identityServices={serviceStats.identityServices} total={serviceStats.total} />
                <ServiceTypeDistributionChart serviceTypes={serviceTypeData} total={serviceStats.total} />
              </div>

              <TrendChart monthlyData={monthlyData} />
            </div>
          </TabsContent>

          <TabsContent value="daily" className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-4">
                <MetricsCard title="Atendimentos Hoje" value={serviceStats.today} icon={<Users className="h-6 w-6" />} subtitle={format(new Date(), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR
                })} color="blue" />
                <MetricsCard title="Tempo Médio de Atendimento" value={dailyAverageServiceTime} icon={<Clock className="h-6 w-6" />} subtitle="Minutos por atendimento hoje" color="green" />
                <MetricsCard title="Tempo Médio de Espera" value={dailyAverageWaitTime} icon={<Timer className="h-6 w-6" />} subtitle="Minutos até ser chamado hoje" color="purple" />
                <MetricsCard title="Satisfação Hoje" value={Math.round(dailySatisfactionStats.averageRating * 20)} icon={<Star className="h-6 w-6" />} subtitle={`${dailySatisfactionStats.totalSurveys} avaliações hoje`} color="orange" isPercentage={true} />
              </div>

              <div className="grid gap-1 lg:grid-cols-3">
                <SatisfactionChart attendants={dailyAttendantData} total={serviceStats.today} />
                <ServiceDistributionChart queueServices={dailyQueueServices} whatsappServices={dailyWhatsappServices} identityServices={dailyIdentityServices} total={serviceStats.today} />
                <ServiceTypeDistributionChart serviceTypes={dailyServiceTypeData} total={serviceStats.today} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-1">
            <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-3">
              <MetricsCard title="Atendimentos Este Mês" value={serviceStats.thisMonth} target={targets.monthly} icon={<CalendarDays className="h-6 w-6" />} subtitle={format(new Date(), "MMMM 'de' yyyy", {
              locale: ptBR
            })} color="purple" isEditable={true} onTargetUpdate={value => updateTarget('monthly', value)} />
              <MetricsCard title="Performance Mensal" value={serviceStats.thisMonth > 0 ? Math.round(serviceStats.thisMonth / targets.monthly * 100) : 0} icon={<TrendingUp className="h-6 w-6" />} subtitle="% da meta mensal" color="green" />
              <MetricsCard title="Projeção do Mês" value={Math.round(serviceStats.thisMonth / new Date().getDate() * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())} icon={<Target className="h-6 w-6" />} subtitle="Estimativa baseada na média diária" color="orange" />
            </div>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-purple-100/50">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Análise Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Progresso da Meta Mensal</span>
                    <span className="text-xs text-muted-foreground">
                      {serviceStats.thisMonth} / {targets.monthly}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div className="h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000" style={{
                    width: `${Math.min(serviceStats.thisMonth / targets.monthly * 100, 100)}%`
                  }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {Math.round(serviceStats.thisMonth / targets.monthly * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Concluído</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-orange-600">
                        {Math.max(0, targets.monthly - serviceStats.thisMonth)}
                      </div>
                      <div className="text-xs text-muted-foreground">Restante</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-1">
            <div className="grid gap-1 lg:grid-cols-2">
              <SatisfactionChart attendants={attendantData} total={serviceStats.total} />
              <ServiceDistributionChart queueServices={serviceStats.queueServices} whatsappServices={serviceStats.whatsappServices} identityServices={serviceStats.identityServices} total={serviceStats.total} />
            </div>
            
            <TrendChart monthlyData={monthlyData} />

            <div className="grid gap-1 md:grid-cols-3">
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-emerald-600 text-sm">Taxa de Conversão</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <div className="text-xl font-bold text-emerald-600">
                    {serviceStats.total > 0 ? Math.round(serviceStats.total / (serviceStats.total + 50) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Atendimentos concluídos</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50/50 to-rose-100/50">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-rose-600 text-sm">Tempo Médio</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <div className="text-xl font-bold text-rose-600">15min</div>
                  <p className="text-xs text-muted-foreground">Por atendimento</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/50 to-cyan-100/50">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-cyan-600 text-sm">Pico de Demanda</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <div className="text-xl font-bold text-cyan-600">14h-16h</div>
                  <p className="text-xs text-muted-foreground">Horário de pico</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}