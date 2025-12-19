import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Users, TrendingUp, Star, Clock, Phone, UserCheck, Calendar, Target, BarChart3, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, startOfWeek, endOfWeek, subWeeks, getWeek, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import MetricsCard from "@/components/corporate/MetricsCard";
import SatisfactionChart from "@/components/corporate/SatisfactionChart";
import ServiceDistributionChart from "@/components/corporate/ServiceDistributionChart";
import ServiceTypeDistributionChart from "@/components/corporate/ServiceTypeDistributionChart";
import TrendChart from "@/components/corporate/TrendChart";
interface ServiceStats {
  total: number;
  thisWeek: number;
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

interface AttendantOption {
  id: string;
  name: string;
}

interface AttendantStats {
  total: number;
  queueServices: number;
  whatsappServices: number;
  identityServices: number;
  averageServiceTime: number;
  averageWaitTime: number;
  satisfactionStats: SatisfactionStats;
  serviceTypeData: ServiceTypeData[];
  dailyData: MonthlyData[];
}
export default function Corporate() {
  const [serviceStats, setServiceStats] = useState<ServiceStats>({
    total: 0,
    thisWeek: 0,
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
  const [weeklyServiceTypeData, setWeeklyServiceTypeData] = useState<ServiceTypeData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [attendantData, setAttendantData] = useState<AttendantData[]>([]);
  const [weeklyAttendantData, setWeeklyAttendantData] = useState<AttendantData[]>([]);
  const [weeklyQueueServices, setWeeklyQueueServices] = useState(0);
  const [weeklyWhatsappServices, setWeeklyWhatsappServices] = useState(0);
  const [weeklyIdentityServices, setWeeklyIdentityServices] = useState(0);
  const [weeklyAverageServiceTime, setWeeklyAverageServiceTime] = useState(0);
  const [weeklyAverageWaitTime, setWeeklyAverageWaitTime] = useState(0);
  const [weeklySatisfactionStats, setWeeklySatisfactionStats] = useState<SatisfactionStats>({
    totalSurveys: 0,
    averageRating: 0,
    ratingDistribution: {}
  });
  const [weeklyDailyData, setWeeklyDailyData] = useState<MonthlyData[]>([]);
  const [weekPeriod, setWeekPeriod] = useState('');
  const [weeklyHistoryData, setWeeklyHistoryData] = useState<MonthlyData[]>([]);
  
  // Estado para semana selecionada (formato: "ano-semana", ex: "2024-51")
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const weekNum = getWeek(today, { weekStartsOn: 1 });
    const year = getYear(today);
    return `${year}-${String(weekNum).padStart(2, '0')}`;
  });
  
  // Estados para dados mensais
  const [monthlyQueueServices, setMonthlyQueueServices] = useState(0);
  const [monthlyWhatsappServices, setMonthlyWhatsappServices] = useState(0);
  const [monthlyIdentityServices, setMonthlyIdentityServices] = useState(0);
  const [monthlyAverageServiceTime, setMonthlyAverageServiceTime] = useState(0);
  const [monthlyAverageWaitTime, setMonthlyAverageWaitTime] = useState(0);
  const [monthlySatisfactionStats, setMonthlySatisfactionStats] = useState<SatisfactionStats>({
    totalSurveys: 0,
    averageRating: 0,
    ratingDistribution: {}
  });
  const [monthlyAttendantData, setMonthlyAttendantData] = useState<AttendantData[]>([]);
  const [monthlyServiceTypeData, setMonthlyServiceTypeData] = useState<ServiceTypeData[]>([]);
  const [dailyMonthData, setDailyMonthData] = useState<MonthlyData[]>([]);
  
  // Estados para o mês selecionado
  const [selectedMonthTotalServices, setSelectedMonthTotalServices] = useState(0);
  
  // Estado para controlar o mês selecionado no filtro
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estados para a aba Servidor
  const [selectedAttendant, setSelectedAttendant] = useState<string>('all');
  const [selectedAttendantMonth, setSelectedAttendantMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [attendantList, setAttendantList] = useState<AttendantOption[]>([]);
  const [attendantStats, setAttendantStats] = useState<AttendantStats>({
    total: 0,
    queueServices: 0,
    whatsappServices: 0,
    identityServices: 0,
    averageServiceTime: 0,
    averageWaitTime: 0,
    satisfactionStats: { totalSurveys: 0, averageRating: 0, ratingDistribution: {} },
    serviceTypeData: [],
    dailyData: []
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

    // Subscriptions em tempo real para atualizar os dados automaticamente
    const queueChannel = supabase
      .channel('corporate-queue-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_customers' },
        () => {
          console.log('Queue customers changed, refetching data...');
          fetchCorporateData();
        }
      )
      .subscribe();

    const whatsappChannel = supabase
      .channel('corporate-whatsapp-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_services' },
        () => {
          console.log('WhatsApp services changed, refetching data...');
          fetchCorporateData();
        }
      )
      .subscribe();

    const identityChannel = supabase
      .channel('corporate-identity-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'identity_appointments' },
        () => {
          console.log('Identity appointments changed, refetching data...');
          fetchCorporateData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(whatsappChannel);
      supabase.removeChannel(identityChannel);
    };
  }, [selectedMonth, selectedAttendant, selectedAttendantMonth, selectedWeek]);
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
      
      // Semana selecionada (baseada no filtro)
      const [selWeekYear, selWeekNum] = selectedWeek.split('-').map(Number);
      // Calcular a data de início da semana selecionada
      const jan1 = new Date(selWeekYear, 0, 1);
      const daysToAdd = (selWeekNum - 1) * 7;
      const weekDate = new Date(jan1);
      weekDate.setDate(jan1.getDate() + daysToAdd);
      const startOfThisWeek = startOfWeek(weekDate, { weekStartsOn: 1 }); // 1 = Segunda-feira
      const endOfThisWeek = endOfWeek(weekDate, { weekStartsOn: 1 });
      
      // Formato do período da semana
      const weekPeriodStr = `${format(startOfThisWeek, "dd/MM", { locale: ptBR })} a ${format(endOfThisWeek, "dd/MM/yyyy", { locale: ptBR })}`;
      setWeekPeriod(weekPeriodStr);
      
      // Usar o mês selecionado para cálculos mensais
      const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
      const selectedDate = new Date(selectedYear, selectedMonthNum - 1, 1);
      const startOfSelectedMonth = startOfMonth(selectedDate);
      const endOfSelectedMonth = endOfMonth(selectedDate);
      
      const startOfThisMonth = startOfMonth(today);
      const endOfThisMonth = endOfMonth(today);

      // Para agendamentos: tempo de espera = called_at - (called_at::date + appointment_time)
      const getIdentityWaitTimeMs = (appointment: {
        called_at?: string | null;
        appointment_time?: string | null;
      }) => {
        if (!appointment?.called_at || !appointment?.appointment_time) return null;

        const calledAt = new Date(appointment.called_at);
        if (Number.isNaN(calledAt.getTime())) return null;

        const [hoursRaw, minutesRaw, secondsRaw] = appointment.appointment_time.split(':');
        const hours = Number(hoursRaw);
        const minutes = Number(minutesRaw);
        const seconds = Number(secondsRaw ?? 0);

        if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) return null;

        const scheduledAt = new Date(calledAt);
        scheduledAt.setHours(hours, minutes, seconds, 0);

        return calledAt.getTime() - scheduledAt.getTime();
      };


      // Buscar dados da fila normal
      const {
        data: queueData
      } = await supabase.from('queue_customers').select('*');
      const {
        data: queueWeekData
      } = await supabase.from('queue_customers').select('*').gte('created_at', startOfThisWeek.toISOString()).lte('created_at', endOfThisWeek.toISOString());
      // Buscar dados do mês atual para estatísticas gerais
      const {
        data: queueMonthData
      } = await supabase.from('queue_customers').select('*').gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString());
      
      // Buscar dados do mês selecionado para a aba mensal
      const {
        data: queueSelectedMonthData
      } = await supabase.from('queue_customers').select('*').gte('created_at', startOfSelectedMonth.toISOString()).lte('created_at', endOfSelectedMonth.toISOString());

      // Buscar dados do WhatsApp
      const {
        data: whatsappData
      } = await supabase.from('whatsapp_services').select('*');
      const {
        data: whatsappWeekData
      } = await supabase.from('whatsapp_services').select('*').gte('created_at', startOfThisWeek.toISOString()).lte('created_at', endOfThisWeek.toISOString());
      // Buscar dados do mês atual para estatísticas gerais
      const {
        data: whatsappMonthData
      } = await supabase.from('whatsapp_services').select('*').gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString());
      
      // Buscar dados do mês selecionado para a aba mensal
      const {
        data: whatsappSelectedMonthData
      } = await supabase.from('whatsapp_services').select('*').gte('created_at', startOfSelectedMonth.toISOString()).lte('created_at', endOfSelectedMonth.toISOString());

      // Buscar dados de agendamento de identidade
      const {
        data: identityData
      } = await supabase.from('identity_appointments').select('*');
      const {
        data: identityWeekData
      } = await supabase.from('identity_appointments').select('*').gte('created_at', startOfThisWeek.toISOString()).lte('created_at', endOfThisWeek.toISOString());
      // Buscar dados do mês atual para estatísticas gerais
      const {
        data: identityMonthData
      } = await supabase.from('identity_appointments').select('*').gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString());
      
      // Buscar dados do mês selecionado para a aba mensal
      const {
        data: identitySelectedMonthData
      } = await supabase.from('identity_appointments').select('*').gte('created_at', startOfSelectedMonth.toISOString()).lte('created_at', endOfSelectedMonth.toISOString());

      // Calcular estatísticas de serviços
      const queueCount = queueData?.length || 0;
      const whatsappCount = whatsappData?.length || 0;
      const identityCount = identityData?.length || 0;
      const queueWeekCount = queueWeekData?.length || 0;
      const whatsappWeekCount = whatsappWeekData?.length || 0;
      const identityWeekCount = identityWeekData?.length || 0;
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

      // Calcular tempo de espera dos agendamentos (chamado_at - horário agendado)
      identityData?.forEach((appointment: any) => {
        const waitTime = getIdentityWaitTimeMs(appointment);
        // Apenas considerar tempos de espera razoáveis (menos de 4 horas)
        if (waitTime !== null && waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
          totalWaitTime += waitTime;
          waitingCustomers++;
        }
      });
      const averageWaitTimeMinutes = waitingCustomers > 0 ? Math.round(totalWaitTime / waitingCustomers / 1000 / 60) : 0;
      setServiceStats({
        total: queueCount + whatsappCount + identityCount,
        thisWeek: queueWeekCount + whatsappWeekCount + identityWeekCount,
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
        const key = service.attendant_id || 'no_attendant';
        attendantDistribution[key] = (attendantDistribution[key] || 0) + 1;
      });

      // Contar atendimentos por attendant_id do WhatsApp
      whatsappData?.forEach(service => {
        const key = service.attendant_id || 'no_attendant';
        attendantDistribution[key] = (attendantDistribution[key] || 0) + 1;
      });

      // Contar atendimentos por attendant_id dos agendamentos de identidade
      identityData?.forEach(appointment => {
        const key = appointment.attendant_id || 'no_attendant';
        attendantDistribution[key] = (attendantDistribution[key] || 0) + 1;
      });

      console.log('Attendant distribution:', attendantDistribution);

      // Cores para o gráfico
      const attendantColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#94a3b8", "#f97316", "#84cc16"];

      // Mapear para o formato do componente
      const attendantsArray: AttendantData[] = Object.entries(attendantDistribution).map(([attendantId, count], index) => {
        let attendantName: string;
        if (attendantId === 'no_attendant') {
          attendantName = 'Sem atendente';
        } else {
          attendantName = profilesData?.find(p => p.id === attendantId)?.full_name || 'Atendente não identificado';
        }
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
      
      // Popula lista de atendentes para o filtro da aba Servidor
      const attendantOptions: AttendantOption[] = profilesData?.map(p => ({
        id: p.id,
        name: p.full_name
      })) || [];
      attendantOptions.sort((a, b) => a.name.localeCompare(b.name));
      setAttendantList(attendantOptions);

      // === DADOS SEMANAIS ===
      // Buscar atendimentos da semana para distribuição por tipo de serviço
      const weeklyServiceTypeDistribution: { [key: string]: number } = {};

      // Contar atendimentos da semana por service_id da fila
      queueWeekData?.forEach(service => {
        const serviceId = service.service_id;
        weeklyServiceTypeDistribution[serviceId] = (weeklyServiceTypeDistribution[serviceId] || 0) + 1;
      });

      // Contar atendimentos da semana por service_id do WhatsApp
      whatsappWeekData?.forEach(service => {
        const serviceId = service.service_id;
        weeklyServiceTypeDistribution[serviceId] = (weeklyServiceTypeDistribution[serviceId] || 0) + 1;
      });

      // Agendamentos de identidade da semana
      const weeklyIdentityAppointmentsCount = identityWeekData?.length || 0;
      if (weeklyIdentityAppointmentsCount > 0) {
        weeklyServiceTypeDistribution['identity'] = weeklyIdentityAppointmentsCount;
      }

      // Mapear para o formato do componente
      const totalWeeklyServices = Object.values(weeklyServiceTypeDistribution).reduce((a, b) => a + b, 0);
      const weeklyServiceTypesArray: ServiceTypeData[] = [];

      // Adicionar serviços regulares
      Object.entries(weeklyServiceTypeDistribution).forEach(([serviceId, count], index) => {
        if (serviceId === 'identity') {
          weeklyServiceTypesArray.push({
            name: 'Agendamento de Identidade',
            value: count,
            percentage: totalWeeklyServices > 0 ? Math.round(count / totalWeeklyServices * 100) : 0,
            color: COLORS[index % COLORS.length]
          });
        } else {
          const serviceName = servicesData?.find(s => s.id === serviceId)?.name || 'Serviço não identificado';
          weeklyServiceTypesArray.push({
            name: serviceName,
            value: count,
            percentage: totalWeeklyServices > 0 ? Math.round(count / totalWeeklyServices * 100) : 0,
            color: COLORS[index % COLORS.length]
          });
        }
      });

      // Ordenar por quantidade (decrescente)
      weeklyServiceTypesArray.sort((a, b) => b.value - a.value);
      setWeeklyServiceTypeData(weeklyServiceTypesArray);

      // Distribuição por atendente da semana
      const weeklyAttendantDistribution: { [key: string]: number } = {};

      // Contar atendimentos da semana por attendant_id da fila
      queueWeekData?.forEach(service => {
        const key = service.attendant_id || 'no_attendant';
        weeklyAttendantDistribution[key] = (weeklyAttendantDistribution[key] || 0) + 1;
      });

      // Contar atendimentos da semana por attendant_id do WhatsApp
      whatsappWeekData?.forEach(service => {
        const key = service.attendant_id || 'no_attendant';
        weeklyAttendantDistribution[key] = (weeklyAttendantDistribution[key] || 0) + 1;
      });

      // Contar atendimentos da semana por attendant_id dos agendamentos de identidade
      identityWeekData?.forEach(appointment => {
        const key = appointment.attendant_id || 'no_attendant';
        weeklyAttendantDistribution[key] = (weeklyAttendantDistribution[key] || 0) + 1;
      });

      // Mapear para o formato do componente
      const weeklyAttendantsArray: AttendantData[] = Object.entries(weeklyAttendantDistribution).map(([attendantId, count], index) => {
        let attendantName: string;
        if (attendantId === 'no_attendant') {
          attendantName = 'Sem atendente';
        } else {
          attendantName = profilesData?.find(p => p.id === attendantId)?.full_name || 'Atendente não identificado';
        }
        return {
          name: attendantName,
          value: count,
          color: attendantColors[index % attendantColors.length]
        };
      });

      // Ordenar por quantidade (decrescente)
      weeklyAttendantsArray.sort((a, b) => b.value - a.value);
      setWeeklyAttendantData(weeklyAttendantsArray);

      // Armazenar contagens de serviços semanais
      setWeeklyQueueServices(queueWeekCount);
      setWeeklyWhatsappServices(whatsappWeekCount);
      setWeeklyIdentityServices(identityWeekCount);

      // Buscar dados por dia da semana atual (Segunda a Domingo)
      const weeklyDailyDataArray: MonthlyData[] = [];
      const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const dayDate = new Date(startOfThisWeek);
        dayDate.setDate(dayDate.getDate() + dayOffset);
        const startOfDayDate = startOfDay(dayDate);
        const endOfDayDate = endOfDay(dayDate);

        // Contar atendimentos da fila neste dia
        const dayQueueCount = queueWeekData?.filter(service => {
          const serviceTime = new Date(service.created_at);
          return serviceTime >= startOfDayDate && serviceTime <= endOfDayDate;
        }).length || 0;

        // Contar atendimentos do WhatsApp neste dia
        const dayWhatsappCount = whatsappWeekData?.filter(service => {
          const serviceTime = new Date(service.created_at);
          return serviceTime >= startOfDayDate && serviceTime <= endOfDayDate;
        }).length || 0;

        // Contar agendamentos de identidade neste dia
        const dayIdentityCount = identityWeekData?.filter(appointment => {
          const appointmentTime = new Date(appointment.created_at);
          return appointmentTime >= startOfDayDate && appointmentTime <= endOfDayDate;
        }).length || 0;

        const totalDayServices = dayQueueCount + dayWhatsappCount + dayIdentityCount;

        weeklyDailyDataArray.push({
          month: dayNames[dayOffset],
          services: totalDayServices,
          fullMonth: format(dayDate, "EEEE, dd/MM", { locale: ptBR })
        });
      }
      setWeeklyDailyData(weeklyDailyDataArray);

      // Buscar dados das últimas 12 semanas para o histórico
      const weeklyHistoryArray: MonthlyData[] = [];
      for (let i = 11; i >= 0; i--) {
        const histWeekDate = subWeeks(startOfThisWeek, i);
        const histStartOfWeek = startOfWeek(histWeekDate, { weekStartsOn: 1 });
        const histEndOfWeek = endOfWeek(histWeekDate, { weekStartsOn: 1 });
        const histWeekNum = getWeek(histStartOfWeek, { weekStartsOn: 1 });

        // Buscar atendimentos da fila nesta semana
        const { data: histQueueData } = await supabase.from('queue_customers').select('id')
          .gte('created_at', histStartOfWeek.toISOString())
          .lte('created_at', histEndOfWeek.toISOString());

        // Buscar atendimentos do WhatsApp nesta semana
        const { data: histWhatsappData } = await supabase.from('whatsapp_services').select('id')
          .gte('created_at', histStartOfWeek.toISOString())
          .lte('created_at', histEndOfWeek.toISOString());

        // Buscar agendamentos de identidade nesta semana
        const { data: histIdentityData } = await supabase.from('identity_appointments').select('id')
          .gte('created_at', histStartOfWeek.toISOString())
          .lte('created_at', histEndOfWeek.toISOString());

        const totalWeekServices = (histQueueData?.length || 0) + (histWhatsappData?.length || 0) + (histIdentityData?.length || 0);
        const weekLabel = `S${histWeekNum}`;
        const weekPeriodLabel = `${format(histStartOfWeek, "dd/MM", { locale: ptBR })} a ${format(histEndOfWeek, "dd/MM", { locale: ptBR })}`;

        weeklyHistoryArray.push({
          month: weekLabel,
          services: totalWeekServices,
          fullMonth: weekPeriodLabel
        });
      }
      setWeeklyHistoryData(weeklyHistoryArray);

      let weeklyTotalServiceTime = 0;
      let weeklyCompletedServices = 0;

      // Calcular tempo da fila presencial da semana
      queueWeekData?.forEach(service => {
        if (service.started_at && service.completed_at) {
          const startTime = new Date(service.started_at).getTime();
          const endTime = new Date(service.completed_at).getTime();
          weeklyTotalServiceTime += endTime - startTime;
          weeklyCompletedServices++;
        }
      });

      // Calcular tempo dos agendamentos de identidade da semana
      identityWeekData?.forEach(appointment => {
        if (appointment.started_at && appointment.completed_at) {
          const startTime = new Date(appointment.started_at).getTime();
          const endTime = new Date(appointment.completed_at).getTime();
          weeklyTotalServiceTime += endTime - startTime;
          weeklyCompletedServices++;
        }
      });
      const weeklyAverageServiceTimeMinutes = weeklyCompletedServices > 0 ? Math.round(weeklyTotalServiceTime / weeklyCompletedServices / 1000 / 60) : 0;
      setWeeklyAverageServiceTime(weeklyAverageServiceTimeMinutes);

      // Calcular tempo médio de espera SEMANAL (em minutos)
      // Buscar atendimentos chamados na semana
      const { data: queueCalledWeekData } = await supabase
        .from('queue_customers')
        .select('*')
        .gte('called_at', startOfThisWeek.toISOString())
        .lte('called_at', endOfThisWeek.toISOString())
        .not('created_at', 'is', null);

      const { data: identityCalledWeekData } = await supabase
        .from('identity_appointments')
        .select('*')
        .gte('called_at', startOfThisWeek.toISOString())
        .lte('called_at', endOfThisWeek.toISOString())
        .not('created_at', 'is', null);

      let weeklyTotalWaitTime = 0;
      let weeklyWaitingCustomers = 0;

      // Calcular tempo de espera da fila presencial da semana
      queueCalledWeekData?.forEach(service => {
        if (service.created_at && service.called_at) {
          const createdTime = new Date(service.created_at).getTime();
          const calledTime = new Date(service.called_at).getTime();
          const waitTime = calledTime - createdTime;
          // Apenas considerar tempos de espera razoáveis (menos de 4 horas)
          if (waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
            weeklyTotalWaitTime += waitTime;
            weeklyWaitingCustomers++;
          }
        }
      });

      // Calcular tempo de espera dos agendamentos da semana (chamado_at - horário agendado)
      identityCalledWeekData?.forEach((appointment: any) => {
        const waitTime = getIdentityWaitTimeMs(appointment);
        // Apenas considerar tempos de espera razoáveis (menos de 4 horas)
        if (waitTime !== null && waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
          weeklyTotalWaitTime += waitTime;
          weeklyWaitingCustomers++;
        }
      });
      
      const weeklyAverageWaitTimeMinutes = weeklyWaitingCustomers > 0 ? Math.round(weeklyTotalWaitTime / weeklyWaitingCustomers / 1000 / 60) : 0;
      
      console.log('Tempo de espera semanal:', {
        totalWaitTime: weeklyTotalWaitTime,
        waitingCustomers: weeklyWaitingCustomers,
        averageMinutes: weeklyAverageWaitTimeMinutes
      });
      
      setWeeklyAverageWaitTime(weeklyAverageWaitTimeMinutes);

      // === DADOS MENSAIS (MÊS SELECIONADO) ===
      const queueSelectedMonthCount = queueSelectedMonthData?.length || 0;
      const whatsappSelectedMonthCount = whatsappSelectedMonthData?.length || 0;
      const identitySelectedMonthCount = identitySelectedMonthData?.length || 0;
      
      // Atualizar total de serviços do mês selecionado
      setSelectedMonthTotalServices(queueSelectedMonthCount + whatsappSelectedMonthCount + identitySelectedMonthCount);
      
      // Armazenar contagens de serviços mensais
      setMonthlyQueueServices(queueSelectedMonthCount);
      setMonthlyWhatsappServices(whatsappSelectedMonthCount);
      setMonthlyIdentityServices(identitySelectedMonthCount);

      // Distribuição por tipo de serviço do mês selecionado
      const monthlyServiceTypeDistribution: { [key: string]: number } = {};

      // Contar atendimentos do mês selecionado por service_id da fila
      queueSelectedMonthData?.forEach(service => {
        const serviceId = service.service_id;
        monthlyServiceTypeDistribution[serviceId] = (monthlyServiceTypeDistribution[serviceId] || 0) + 1;
      });

      // Contar atendimentos do mês selecionado por service_id do WhatsApp
      whatsappSelectedMonthData?.forEach(service => {
        const serviceId = service.service_id;
        monthlyServiceTypeDistribution[serviceId] = (monthlyServiceTypeDistribution[serviceId] || 0) + 1;
      });

      // Agendamentos de identidade do mês selecionado
      const monthlyIdentityAppointmentsCount = identitySelectedMonthData?.length || 0;
      if (monthlyIdentityAppointmentsCount > 0) {
        monthlyServiceTypeDistribution['identity'] = monthlyIdentityAppointmentsCount;
      }

      // Mapear para o formato do componente
      const totalMonthlyServices = Object.values(monthlyServiceTypeDistribution).reduce((a, b) => a + b, 0);
      const monthlyServiceTypesArray: ServiceTypeData[] = [];

      // Adicionar serviços regulares
      Object.entries(monthlyServiceTypeDistribution).forEach(([serviceId, count], index) => {
        if (serviceId === 'identity') {
          monthlyServiceTypesArray.push({
            name: 'Agendamento de Identidade',
            value: count,
            percentage: totalMonthlyServices > 0 ? Math.round(count / totalMonthlyServices * 100) : 0,
            color: COLORS[index % COLORS.length]
          });
        } else {
          const serviceName = servicesData?.find(s => s.id === serviceId)?.name || 'Serviço não identificado';
          monthlyServiceTypesArray.push({
            name: serviceName,
            value: count,
            percentage: totalMonthlyServices > 0 ? Math.round(count / totalMonthlyServices * 100) : 0,
            color: COLORS[index % COLORS.length]
          });
        }
      });

      // Ordenar por quantidade (decrescente)
      monthlyServiceTypesArray.sort((a, b) => b.value - a.value);
      setMonthlyServiceTypeData(monthlyServiceTypesArray);

      // Distribuição por atendente do mês selecionado
      const monthlyAttendantDistribution: { [key: string]: number } = {};

      // Contar atendimentos do mês selecionado por attendant_id da fila
      queueSelectedMonthData?.forEach(service => {
        const key = service.attendant_id || 'no_attendant';
        monthlyAttendantDistribution[key] = (monthlyAttendantDistribution[key] || 0) + 1;
      });

      // Contar atendimentos do mês selecionado por attendant_id do WhatsApp
      whatsappSelectedMonthData?.forEach(service => {
        const key = service.attendant_id || 'no_attendant';
        monthlyAttendantDistribution[key] = (monthlyAttendantDistribution[key] || 0) + 1;
      });

      // Contar atendimentos do mês selecionado por attendant_id dos agendamentos de identidade
      identitySelectedMonthData?.forEach(appointment => {
        const key = appointment.attendant_id || 'no_attendant';
        monthlyAttendantDistribution[key] = (monthlyAttendantDistribution[key] || 0) + 1;
      });

      // Mapear para o formato do componente
      const monthlyAttendantsArray: AttendantData[] = Object.entries(monthlyAttendantDistribution).map(([attendantId, count], index) => {
        let attendantName: string;
        if (attendantId === 'no_attendant') {
          attendantName = 'Sem atendente';
        } else {
          attendantName = profilesData?.find(p => p.id === attendantId)?.full_name || 'Atendente não identificado';
        }
        return {
          name: attendantName,
          value: count,
          color: attendantColors[index % attendantColors.length]
        };
      });

      // Ordenar por quantidade (decrescente)
      monthlyAttendantsArray.sort((a, b) => b.value - a.value);
      setMonthlyAttendantData(monthlyAttendantsArray);

      // Calcular tempo médio de atendimento MENSAL (em minutos) - do mês selecionado
      let monthlyTotalServiceTime = 0;
      let monthlyCompletedServices = 0;

      // Calcular tempo da fila presencial do mês selecionado
      queueSelectedMonthData?.forEach(service => {
        if (service.started_at && service.completed_at) {
          const startTime = new Date(service.started_at).getTime();
          const endTime = new Date(service.completed_at).getTime();
          monthlyTotalServiceTime += endTime - startTime;
          monthlyCompletedServices++;
        }
      });

      // Calcular tempo dos agendamentos de identidade do mês selecionado
      identitySelectedMonthData?.forEach(appointment => {
        if (appointment.started_at && appointment.completed_at) {
          const startTime = new Date(appointment.started_at).getTime();
          const endTime = new Date(appointment.completed_at).getTime();
          monthlyTotalServiceTime += endTime - startTime;
          monthlyCompletedServices++;
        }
      });
      const monthlyAverageServiceTimeMinutes = monthlyCompletedServices > 0 ? Math.round(monthlyTotalServiceTime / monthlyCompletedServices / 1000 / 60) : 0;
      setMonthlyAverageServiceTime(monthlyAverageServiceTimeMinutes);

      // Calcular tempo médio de espera MENSAL (em minutos) - do mês selecionado
      const { data: queueCalledSelectedMonthData } = await supabase
        .from('queue_customers')
        .select('*')
        .gte('called_at', startOfSelectedMonth.toISOString())
        .lte('called_at', endOfSelectedMonth.toISOString())
        .not('created_at', 'is', null);

      const { data: identityCalledSelectedMonthData } = await supabase
        .from('identity_appointments')
        .select('*')
        .gte('called_at', startOfSelectedMonth.toISOString())
        .lte('called_at', endOfSelectedMonth.toISOString())
        .not('created_at', 'is', null);

      let monthlyTotalWaitTime = 0;
      let monthlyWaitingCustomers = 0;

      // Calcular tempo de espera da fila presencial do mês selecionado
      queueCalledSelectedMonthData?.forEach(service => {
        if (service.created_at && service.called_at) {
          const createdTime = new Date(service.created_at).getTime();
          const calledTime = new Date(service.called_at).getTime();
          const waitTime = calledTime - createdTime;
          // Apenas considerar tempos de espera razoáveis (menos de 4 horas)
          if (waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
            monthlyTotalWaitTime += waitTime;
            monthlyWaitingCustomers++;
          }
        }
      });

      // Calcular tempo de espera dos agendamentos do mês selecionado (chamado_at - horário agendado)
      identityCalledSelectedMonthData?.forEach((appointment: any) => {
        const waitTime = getIdentityWaitTimeMs(appointment);
        // Apenas considerar tempos de espera razoáveis (menos de 4 horas)
        if (waitTime !== null && waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
          monthlyTotalWaitTime += waitTime;
          monthlyWaitingCustomers++;
        }
      });
      
      const monthlyAverageWaitTimeMinutes = monthlyWaitingCustomers > 0 ? Math.round(monthlyTotalWaitTime / monthlyWaitingCustomers / 1000 / 60) : 0;
      setMonthlyAverageWaitTime(monthlyAverageWaitTimeMinutes);

      // Buscar dados por dia do mês selecionado
      const daysInSelectedMonth = new Date(selectedYear, selectedMonthNum, 0).getDate();
      const dailyMonthDataArray: MonthlyData[] = [];
      
      for (let day = 1; day <= daysInSelectedMonth; day++) {
        const dayDate = new Date(selectedYear, selectedMonthNum - 1, day);
        const startOfDayDate = startOfDay(dayDate);
        const endOfDayDate = endOfDay(dayDate);

        // Contar atendimentos da fila neste dia
        const dayQueueCount = queueSelectedMonthData?.filter(service => {
          const serviceTime = new Date(service.created_at);
          return serviceTime >= startOfDayDate && serviceTime <= endOfDayDate;
        }).length || 0;

        // Contar atendimentos do WhatsApp neste dia
        const dayWhatsappCount = whatsappSelectedMonthData?.filter(service => {
          const serviceTime = new Date(service.created_at);
          return serviceTime >= startOfDayDate && serviceTime <= endOfDayDate;
        }).length || 0;

        // Contar agendamentos de identidade neste dia
        const dayIdentityCount = identitySelectedMonthData?.filter(appointment => {
          const appointmentTime = new Date(appointment.created_at);
          return appointmentTime >= startOfDayDate && appointmentTime <= endOfDayDate;
        }).length || 0;

        const totalDayServices = dayQueueCount + dayWhatsappCount + dayIdentityCount;

        dailyMonthDataArray.push({
          month: day.toString().padStart(2, '0'),
          services: totalDayServices,
          fullMonth: format(dayDate, "dd 'de' MMMM", { locale: ptBR })
        });
      }
      setDailyMonthData(dailyMonthDataArray);

      // Buscar dados de satisfação MENSAL - do mês selecionado
      const {
        data: monthlySatisfactionData
      } = await supabase.from('satisfaction_surveys').select('overall_rating, problem_resolved').gte('created_at', startOfSelectedMonth.toISOString()).lte('created_at', endOfSelectedMonth.toISOString());
      
      if (monthlySatisfactionData && monthlySatisfactionData.length > 0) {
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
        monthlySatisfactionData.forEach(survey => {
          const ratingScore = ratingValues[survey.overall_rating?.toLowerCase()] ?? 0;
          const resolvedScore = resolvedValues[survey.problem_resolved?.toLowerCase()] ?? 0;

          // Equação ponderada de satisfação
          const satisfactionScore = ratingScore * 0.7 + resolvedScore * 0.3;
          totalScore += satisfactionScore;
          validSurveys++;
        });
        const monthlyAverageRating = validSurveys > 0 ? totalScore / validSurveys / 20 : 0;
        const monthlyDistribution = monthlySatisfactionData.reduce((acc, survey) => {
          const rating = survey.overall_rating || 'sem avaliação';
          acc[rating] = (acc[rating] || 0) + 1;
          return acc;
        }, {} as {
          [key: string]: number;
        });
        setMonthlySatisfactionStats({
          totalSurveys: monthlySatisfactionData.length,
          averageRating: monthlyAverageRating,
          ratingDistribution: monthlyDistribution
        });
      }

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

      // Buscar dados de satisfação SEMANAL
      const {
        data: weeklySatisfactionData
      } = await supabase.from('satisfaction_surveys').select('overall_rating, problem_resolved').gte('created_at', startOfThisWeek.toISOString()).lte('created_at', endOfThisWeek.toISOString());
      
      if (weeklySatisfactionData && weeklySatisfactionData.length > 0) {
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
        weeklySatisfactionData.forEach(survey => {
          const ratingScore = ratingValues[survey.overall_rating?.toLowerCase()] ?? 0;
          const resolvedScore = resolvedValues[survey.problem_resolved?.toLowerCase()] ?? 0;

          // Equação ponderada de satisfação
          const satisfactionScore = ratingScore * 0.7 + resolvedScore * 0.3;
          totalScore += satisfactionScore;
          validSurveys++;
        });
        const weeklyAverageRating = validSurveys > 0 ? totalScore / validSurveys / 20 : 0;
        const weeklyDistribution = weeklySatisfactionData.reduce((acc, survey) => {
          const rating = survey.overall_rating || 'sem avaliação';
          acc[rating] = (acc[rating] || 0) + 1;
          return acc;
        }, {} as {
          [key: string]: number;
        });
        setWeeklySatisfactionStats({
          totalSurveys: weeklySatisfactionData.length,
          averageRating: weeklyAverageRating,
          ratingDistribution: weeklyDistribution
        });
      }

      // === DADOS DO SERVIDOR (ATENDENTE ESPECÍFICO) ===
      const [attYear, attMonth] = selectedAttendantMonth.split('-').map(Number);
      const attStartDate = startOfMonth(new Date(attYear, attMonth - 1, 1));
      const attEndDate = endOfMonth(new Date(attYear, attMonth - 1, 1));

      // Buscar dados para o atendente selecionado
      let attQueueData: any[] = [];
      let attWhatsappData: any[] = [];
      let attIdentityData: any[] = [];

      if (selectedAttendant === 'all') {
        // Se "todos", pega todos os atendimentos do mês
        const { data: qd } = await supabase.from('queue_customers').select('*')
          .gte('created_at', attStartDate.toISOString())
          .lte('created_at', attEndDate.toISOString());
        const { data: wd } = await supabase.from('whatsapp_services').select('*')
          .gte('created_at', attStartDate.toISOString())
          .lte('created_at', attEndDate.toISOString());
        const { data: id } = await supabase.from('identity_appointments').select('*')
          .gte('created_at', attStartDate.toISOString())
          .lte('created_at', attEndDate.toISOString());
        attQueueData = qd || [];
        attWhatsappData = wd || [];
        attIdentityData = id || [];
      } else {
        // Filtra pelo atendente selecionado
        const { data: qd } = await supabase.from('queue_customers').select('*')
          .eq('attendant_id', selectedAttendant)
          .gte('created_at', attStartDate.toISOString())
          .lte('created_at', attEndDate.toISOString());
        const { data: wd } = await supabase.from('whatsapp_services').select('*')
          .eq('attendant_id', selectedAttendant)
          .gte('created_at', attStartDate.toISOString())
          .lte('created_at', attEndDate.toISOString());
        const { data: id } = await supabase.from('identity_appointments').select('*')
          .eq('attendant_id', selectedAttendant)
          .gte('created_at', attStartDate.toISOString())
          .lte('created_at', attEndDate.toISOString());
        attQueueData = qd || [];
        attWhatsappData = wd || [];
        attIdentityData = id || [];
      }

      const attQueueCount = attQueueData.length;
      const attWhatsappCount = attWhatsappData.length;
      const attIdentityCount = attIdentityData.length;
      const attTotal = attQueueCount + attWhatsappCount + attIdentityCount;

      // Tempo médio de atendimento do atendente
      let attTotalServiceTime = 0;
      let attCompletedServices = 0;

      attQueueData.forEach(service => {
        if (service.started_at && service.completed_at) {
          const startTime = new Date(service.started_at).getTime();
          const endTime = new Date(service.completed_at).getTime();
          attTotalServiceTime += endTime - startTime;
          attCompletedServices++;
        }
      });

      attIdentityData.forEach(appointment => {
        if (appointment.started_at && appointment.completed_at) {
          const startTime = new Date(appointment.started_at).getTime();
          const endTime = new Date(appointment.completed_at).getTime();
          attTotalServiceTime += endTime - startTime;
          attCompletedServices++;
        }
      });

      const attAvgServiceTime = attCompletedServices > 0 ? Math.round(attTotalServiceTime / attCompletedServices / 1000 / 60) : 0;

      // Tempo médio de espera do atendente
      let attTotalWaitTime = 0;
      let attWaitingCustomers = 0;

      attQueueData.forEach(service => {
        if (service.created_at && service.called_at) {
          const createdTime = new Date(service.created_at).getTime();
          const calledTime = new Date(service.called_at).getTime();
          const waitTime = calledTime - createdTime;
          if (waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
            attTotalWaitTime += waitTime;
            attWaitingCustomers++;
          }
        }
      });

      attIdentityData.forEach((appointment: any) => {
        const waitTime = getIdentityWaitTimeMs(appointment);
        if (waitTime !== null && waitTime > 0 && waitTime < 4 * 60 * 60 * 1000) {
          attTotalWaitTime += waitTime;
          attWaitingCustomers++;
        }
      });

      const attAvgWaitTime = attWaitingCustomers > 0 ? Math.round(attTotalWaitTime / attWaitingCustomers / 1000 / 60) : 0;

      // Distribuição por tipo de serviço do atendente
      const attServiceTypeDistribution: { [key: string]: number } = {};

      attQueueData.forEach(service => {
        const serviceId = service.service_id;
        attServiceTypeDistribution[serviceId] = (attServiceTypeDistribution[serviceId] || 0) + 1;
      });

      attWhatsappData.forEach(service => {
        const serviceId = service.service_id;
        attServiceTypeDistribution[serviceId] = (attServiceTypeDistribution[serviceId] || 0) + 1;
      });

      if (attIdentityCount > 0) {
        attServiceTypeDistribution['identity'] = attIdentityCount;
      }

      const attTotalServices = Object.values(attServiceTypeDistribution).reduce((a, b) => a + b, 0);
      const attServiceTypesArray: ServiceTypeData[] = Object.entries(attServiceTypeDistribution).map(([serviceId, count], index) => {
        let serviceName: string;
        if (serviceId === 'identity') {
          serviceName = 'Agendamento de Identidade';
        } else {
          serviceName = servicesData?.find(s => s.id === serviceId)?.name || 'Serviço não identificado';
        }
        return {
          name: serviceName,
          value: count,
          percentage: attTotalServices > 0 ? Math.round(count / attTotalServices * 100) : 0,
          color: COLORS[index % COLORS.length]
        };
      });
      attServiceTypesArray.sort((a, b) => b.value - a.value);

      // Dados diários do mês para o atendente
      const daysInAttMonth = new Date(attYear, attMonth, 0).getDate();
      const attDailyData: MonthlyData[] = [];

      for (let day = 1; day <= daysInAttMonth; day++) {
        const dayDate = new Date(attYear, attMonth - 1, day);
        const startOfDayDate = startOfDay(dayDate);
        const endOfDayDate = endOfDay(dayDate);

        const dayQueueCount = attQueueData.filter(service => {
          const serviceTime = new Date(service.created_at);
          return serviceTime >= startOfDayDate && serviceTime <= endOfDayDate;
        }).length;

        const dayWhatsappCount = attWhatsappData.filter(service => {
          const serviceTime = new Date(service.created_at);
          return serviceTime >= startOfDayDate && serviceTime <= endOfDayDate;
        }).length;

        const dayIdentityCount = attIdentityData.filter(appointment => {
          const appointmentTime = new Date(appointment.created_at);
          return appointmentTime >= startOfDayDate && appointmentTime <= endOfDayDate;
        }).length;

        attDailyData.push({
          month: day.toString().padStart(2, '0'),
          services: dayQueueCount + dayWhatsappCount + dayIdentityCount,
          fullMonth: format(dayDate, "dd 'de' MMMM", { locale: ptBR })
        });
      }

      // Satisfação do atendente
      let attSatisfactionStats: SatisfactionStats = { totalSurveys: 0, averageRating: 0, ratingDistribution: {} };

      if (selectedAttendant !== 'all') {
        const { data: attSatisfactionData } = await supabase
          .from('satisfaction_surveys')
          .select('overall_rating, problem_resolved')
          .eq('attendant_id', selectedAttendant)
          .gte('created_at', attStartDate.toISOString())
          .lte('created_at', attEndDate.toISOString());

        if (attSatisfactionData && attSatisfactionData.length > 0) {
          const ratingValues: { [key: string]: number } = {
            'excelente': 100, 'bom': 75, 'regular': 50, 'ruim': 25, 'pessimo': 0
          };
          const resolvedValues: { [key: string]: number } = {
            'sim': 100, 'parcialmente': 50, 'não': 0, 'nao': 0
          };

          let totalScore = 0;
          let validSurveys = 0;
          attSatisfactionData.forEach(survey => {
            const ratingScore = ratingValues[survey.overall_rating?.toLowerCase()] ?? 0;
            const resolvedScore = resolvedValues[survey.problem_resolved?.toLowerCase()] ?? 0;
            const satisfactionScore = ratingScore * 0.7 + resolvedScore * 0.3;
            totalScore += satisfactionScore;
            validSurveys++;
          });

          const attAvgRating = validSurveys > 0 ? totalScore / validSurveys / 20 : 0;
          const attDistribution = attSatisfactionData.reduce((acc, survey) => {
            const rating = survey.overall_rating || 'sem avaliação';
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });

          attSatisfactionStats = {
            totalSurveys: attSatisfactionData.length,
            averageRating: attAvgRating,
            ratingDistribution: attDistribution
          };
        }
      } else {
        // Se todos, usa a satisfação do mês selecionado
        const { data: allSatisfactionData } = await supabase
          .from('satisfaction_surveys')
          .select('overall_rating, problem_resolved')
          .gte('created_at', attStartDate.toISOString())
          .lte('created_at', attEndDate.toISOString());

        if (allSatisfactionData && allSatisfactionData.length > 0) {
          const ratingValues: { [key: string]: number } = {
            'excelente': 100, 'bom': 75, 'regular': 50, 'ruim': 25, 'pessimo': 0
          };
          const resolvedValues: { [key: string]: number } = {
            'sim': 100, 'parcialmente': 50, 'não': 0, 'nao': 0
          };

          let totalScore = 0;
          let validSurveys = 0;
          allSatisfactionData.forEach(survey => {
            const ratingScore = ratingValues[survey.overall_rating?.toLowerCase()] ?? 0;
            const resolvedScore = resolvedValues[survey.problem_resolved?.toLowerCase()] ?? 0;
            const satisfactionScore = ratingScore * 0.7 + resolvedScore * 0.3;
            totalScore += satisfactionScore;
            validSurveys++;
          });

          const avgRating = validSurveys > 0 ? totalScore / validSurveys / 20 : 0;
          const distribution = allSatisfactionData.reduce((acc, survey) => {
            const rating = survey.overall_rating || 'sem avaliação';
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });

          attSatisfactionStats = {
            totalSurveys: allSatisfactionData.length,
            averageRating: avgRating,
            ratingDistribution: distribution
          };
        }
      }

      setAttendantStats({
        total: attTotal,
        queueServices: attQueueCount,
        whatsappServices: attWhatsappCount,
        identityServices: attIdentityCount,
        averageServiceTime: attAvgServiceTime,
        averageWaitTime: attAvgWaitTime,
        satisfactionStats: attSatisfactionStats,
        serviceTypeData: attServiceTypesArray,
        dailyData: attDailyData
      });

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur mb-1 h-7">
            <TabsTrigger value="overview" className="flex items-center gap-1 text-xs py-1">
              <BarChart3 className="h-3 w-3" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-1 text-xs py-1">
              <CalendarDays className="h-3 w-3" />
              Semanal
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-1 text-xs py-1">
              <TrendingUp className="h-3 w-3" />
              Mensal
            </TabsTrigger>
            <TabsTrigger value="servidor" className="flex items-center gap-1 text-xs py-1">
              <UserCheck className="h-3 w-3" />
              Servidor
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

          <TabsContent value="weekly" className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {/* Filtro de semana */}
              <div className="mb-2 flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">Selecionar semana:</label>
                <Select value={selectedWeek} onValueChange={(value) => {
                  setSelectedWeek(value);
                  setActiveTab('weekly');
                }}>
                  <SelectTrigger className="w-[280px] h-8 text-xs">
                    <SelectValue placeholder="Selecione a semana" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 52 }, (_, i) => {
                      const weekDate = subWeeks(new Date(), i);
                      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
                      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
                      const weekNum = getWeek(weekStart, { weekStartsOn: 1 });
                      const year = getYear(weekStart);
                      const value = `${year}-${String(weekNum).padStart(2, '0')}`;
                      const label = `Semana ${weekNum} - ${format(weekStart, "dd/MM", { locale: ptBR })} a ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`;
                      return (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-4">
                <MetricsCard title="Atendimentos da Semana" value={serviceStats.thisWeek} icon={<Users className="h-6 w-6" />} subtitle={weekPeriod} color="blue" />
                <MetricsCard title="Tempo Médio de Atendimento" value={weeklyAverageServiceTime} icon={<Clock className="h-6 w-6" />} subtitle="Minutos por atendimento na semana" color="green" />
                <MetricsCard title="Tempo Médio de Espera" value={weeklyAverageWaitTime} icon={<Timer className="h-6 w-6" />} subtitle="Minutos até ser chamado na semana" color="purple" />
                <MetricsCard title="Satisfação da Semana" value={Math.round(weeklySatisfactionStats.averageRating * 20)} icon={<Star className="h-6 w-6" />} subtitle={`${weeklySatisfactionStats.totalSurveys} avaliações na semana`} color="orange" isPercentage={true} />
              </div>

              <div className="grid gap-1 lg:grid-cols-3">
                <SatisfactionChart attendants={weeklyAttendantData} total={serviceStats.thisWeek} />
                <ServiceDistributionChart queueServices={weeklyQueueServices} whatsappServices={weeklyWhatsappServices} identityServices={weeklyIdentityServices} total={serviceStats.thisWeek} />
                <ServiceTypeDistributionChart serviceTypes={weeklyServiceTypeData} total={serviceStats.thisWeek} />
              </div>

              <TrendChart monthlyData={weeklyHistoryData} title="Histórico das Últimas 12 Semanas" />
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {/* Filtro de mês */}
              <div className="mb-2 flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">Selecionar mês:</label>
                <Select value={selectedMonth} onValueChange={(value) => {
                  setSelectedMonth(value);
                  setActiveTab('monthly');
                }}>
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
                      return (
                        <SelectItem key={value} value={value}>
                          {label.charAt(0).toUpperCase() + label.slice(1)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-4">
                <MetricsCard title="Atendimentos Este Mês" value={selectedMonthTotalServices} icon={<Users className="h-6 w-6" />} subtitle={(() => {
                  const [year, month] = selectedMonth.split('-').map(Number);
                  const date = new Date(year, month - 1, 1);
                  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
                })()} color="blue" />
                <MetricsCard title="Tempo Médio de Atendimento" value={monthlyAverageServiceTime} icon={<Clock className="h-6 w-6" />} subtitle="Minutos por atendimento no mês" color="green" />
                <MetricsCard title="Tempo Médio de Espera" value={monthlyAverageWaitTime} icon={<Timer className="h-6 w-6" />} subtitle="Minutos até ser chamado no mês" color="purple" />
                <MetricsCard title="Satisfação do Mês" value={Math.round(monthlySatisfactionStats.averageRating * 20)} icon={<Star className="h-6 w-6" />} subtitle={`${monthlySatisfactionStats.totalSurveys} avaliações no mês`} color="orange" isPercentage={true} />
              </div>

              <div className="grid gap-1 lg:grid-cols-3">
                <SatisfactionChart attendants={monthlyAttendantData} total={selectedMonthTotalServices} />
                <ServiceDistributionChart queueServices={monthlyQueueServices} whatsappServices={monthlyWhatsappServices} identityServices={monthlyIdentityServices} total={selectedMonthTotalServices} />
                <ServiceTypeDistributionChart serviceTypes={monthlyServiceTypeData} total={selectedMonthTotalServices} />
              </div>

              <TrendChart monthlyData={dailyMonthData} />
            </div>
          </TabsContent>

          <TabsContent value="servidor" className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {/* Filtros de atendente e mês */}
              <div className="mb-2 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Servidor:</label>
                  <Select value={selectedAttendant} onValueChange={(value) => {
                    setSelectedAttendant(value);
                    setActiveTab('servidor');
                  }}>
                    <SelectTrigger className="w-[220px] h-8 text-xs">
                      <SelectValue placeholder="Selecione o servidor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os servidores</SelectItem>
                      {attendantList.map(att => (
                        <SelectItem key={att.id} value={att.id}>
                          {att.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Mês:</label>
                  <Select value={selectedAttendantMonth} onValueChange={(value) => {
                    setSelectedAttendantMonth(value);
                    setActiveTab('servidor');
                  }}>
                    <SelectTrigger className="w-[200px] h-8 text-xs">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
                        return (
                          <SelectItem key={value} value={value}>
                            {label.charAt(0).toUpperCase() + label.slice(1)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-4">
                <MetricsCard 
                  title="Total de Atendimentos" 
                  value={attendantStats.total} 
                  icon={<Users className="h-6 w-6" />} 
                  subtitle={selectedAttendant === 'all' ? 'Todos os servidores' : attendantList.find(a => a.id === selectedAttendant)?.name || ''} 
                  color="blue" 
                />
                <MetricsCard 
                  title="Tempo Médio de Atendimento" 
                  value={attendantStats.averageServiceTime} 
                  icon={<Clock className="h-6 w-6" />} 
                  subtitle="Minutos por atendimento" 
                  color="green" 
                />
                <MetricsCard 
                  title="Tempo Médio de Espera" 
                  value={attendantStats.averageWaitTime} 
                  icon={<Timer className="h-6 w-6" />} 
                  subtitle="Minutos até ser chamado" 
                  color="purple" 
                />
                <MetricsCard 
                  title="Satisfação" 
                  value={Math.round(attendantStats.satisfactionStats.averageRating * 20)} 
                  icon={<Star className="h-6 w-6" />} 
                  subtitle={`${attendantStats.satisfactionStats.totalSurveys} avaliações`} 
                  color="orange" 
                  isPercentage={true} 
                />
              </div>

              <div className="grid gap-1 lg:grid-cols-2">
                <ServiceDistributionChart 
                  queueServices={attendantStats.queueServices} 
                  whatsappServices={attendantStats.whatsappServices} 
                  identityServices={attendantStats.identityServices} 
                  total={attendantStats.total} 
                />
                <ServiceTypeDistributionChart 
                  serviceTypes={attendantStats.serviceTypeData} 
                  total={attendantStats.total} 
                />
              </div>

              <TrendChart monthlyData={attendantStats.dailyData} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}