import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, getDaysInMonth, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

interface MonthOption {
  value: string;
  label: string;
}

export default function IdentityCalendar() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);

  // Fetch available months: past 12 + current, plus future months that have appointments
  useEffect(() => {
    fetchMonthOptions();
  }, []);

  const fetchMonthOptions = async () => {
    // Past 12 months + current (always shown)
    const options: MonthOption[] = [];
    for (let i = 0; i <= 12; i++) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);
      options.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: format(date, "MMMM yyyy", { locale: ptBR })
      });
    }

    // Check future months (up to 12 months ahead) for any appointments
    const today = new Date();
    const futureStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const futureEnd = new Date(today.getFullYear(), today.getMonth() + 13, 0);

    const { data: futureAppts } = await supabase
      .from('identity_appointments')
      .select('appointment_date')
      .gte('appointment_date', format(futureStart, 'yyyy-MM-dd'))
      .lte('appointment_date', format(futureEnd, 'yyyy-MM-dd'))
      .limit(1000);

    if (futureAppts && futureAppts.length > 0) {
      const futureMonthsSet = new Set<string>();
      futureAppts.forEach(a => {
        const [y, m] = a.appointment_date.split('-');
        futureMonthsSet.add(`${y}-${m}`);
      });

      const sortedFutureMonths = Array.from(futureMonthsSet).sort();
      // Insert future months at the beginning (they come before current)
      const futureOptions: MonthOption[] = sortedFutureMonths.map(val => {
        const [y, m] = val.split('-').map(Number);
        return {
          value: val,
          label: format(new Date(y, m - 1), "MMMM yyyy", { locale: ptBR })
        };
      });
      // Merge: future (newest first) then past
      futureOptions.reverse();
      setMonthOptions([...futureOptions, ...options]);
    } else {
      setMonthOptions(options);
    }
  };

  useEffect(() => {
    fetchAppointments();
    setSelectedDay(null);
  }, [selectedMonth]);

  const fetchAppointments = async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    // For past/current: fetch ALL statuses (scheduled + completed)
    // For future: only scheduled
    const { data, error } = await supabase
      .from('identity_appointments')
      .select('id, name, phone, appointment_date, appointment_time, status')
      .gte('appointment_date', format(start, 'yyyy-MM-dd'))
      .lte('appointment_date', format(end, 'yyyy-MM-dd'))
      .in('status', ['scheduled', 'completed'])
      .order('appointment_date')
      .order('appointment_time');

    if (!error && data) {
      setAppointments(data);
    }
    setLoading(false);
  };

  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDayOfWeek = getDay(new Date(year, month - 1, 1));

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(a => a.appointment_date === dateStr);
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const selectedDayAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDisplayStatus = (appt: Appointment) => {
    if (appt.status === 'completed') return 'completed';
    const apptDate = new Date(appt.appointment_date + 'T00:00:00');
    return apptDate < today ? 'no_show' : 'scheduled';
  };

  const noShowCount = appointments.filter(a => getDisplayStatus(a) === 'no_show').length;
  const scheduledCount = appointments.filter(a => getDisplayStatus(a) === 'scheduled').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  const displayStatusLabel = (displayStatus: string) => {
    if (displayStatus === 'completed') return 'Concluído';
    if (displayStatus === 'no_show') return 'Não compareceu';
    return 'Agendado';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Agendamentos de Identidade</h3>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px] h-7 text-xs ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs capitalize">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNames.map(d => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayAppts = getAppointmentsForDay(day);
              const count = dayAppts.length;
              const hasCompleted = dayAppts.some(a => getDisplayStatus(a) === 'completed');
              const hasNoShow = dayAppts.some(a => getDisplayStatus(a) === 'no_show');
              const hasScheduled = dayAppts.some(a => getDisplayStatus(a) === 'scheduled');
              const isSelected = selectedDay === day;
              const isToday = new Date().getDate() === day &&
                new Date().getMonth() + 1 === month &&
                new Date().getFullYear() === year;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative p-1 rounded-md text-xs transition-colors min-h-[40px] flex flex-col items-center justify-start gap-0.5
                    ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                    ${isToday && !isSelected ? 'bg-accent text-accent-foreground font-bold' : ''}
                    ${!isSelected && !isToday ? 'hover:bg-muted' : ''}
                  `}
                >
                  <span className="text-[11px]">{day}</span>
                  {count > 0 && (
                    <div className="flex gap-0.5">
                      {hasScheduled && (
                        <Badge
                          variant={isSelected ? "secondary" : "default"}
                          className="text-[7px] px-0.5 py-0 h-3 min-w-[14px]"
                        >
                          {dayAppts.filter(a => getDisplayStatus(a) === 'scheduled').length}
                        </Badge>
                      )}
                      {hasNoShow && (
                        <Badge
                          variant="destructive"
                          className="text-[7px] px-0.5 py-0 h-3 min-w-[14px]"
                        >
                          {dayAppts.filter(a => getDisplayStatus(a) === 'no_show').length}
                        </Badge>
                      )}
                      {hasCompleted && (
                        <Badge
                          variant="outline"
                          className={`text-[7px] px-0.5 py-0 h-3 min-w-[14px] ${isSelected ? 'border-primary-foreground/50' : 'bg-green-50 text-green-700 border-green-200'}`}
                        >
                          {dayAppts.filter(a => a.status === 'completed').length}
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Badge variant="default" className="text-[7px] px-1 py-0 h-3">0</Badge>
              Agendado
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="destructive" className="text-[7px] px-1 py-0 h-3">0</Badge>
              Não compareceu
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[7px] px-1 py-0 h-3 bg-green-50 text-green-700 border-green-200">0</Badge>
              Concluído
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDay && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {String(selectedDay).padStart(2, '0')}/{String(month).padStart(2, '0')}/{year} — {selectedDayAppointments.length} agendamento(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            {selectedDayAppointments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum agendamento neste dia.</p>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {selectedDayAppointments.map(appt => (
                  <div key={appt.id} className="flex items-center justify-between border rounded-md px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      {appt.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />}
                      <div>
                        <p className="font-medium">{appt.name}</p>
                        <p className="text-muted-foreground">{appt.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const ds = getDisplayStatus(appt);
                        return (
                          <Badge
                            variant={ds === 'completed' ? 'outline' : ds === 'no_show' ? 'destructive' : 'default'}
                            className={`text-[9px] ${ds === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                          >
                            {displayStatusLabel(ds)}
                          </Badge>
                        );
                      })()}
                      <Badge variant="outline" className="text-[10px]">
                        {appt.appointment_time.slice(0, 5)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedDay && (
        <div className="text-center text-xs text-muted-foreground py-2 space-x-3">
          <span>Agendados: <span className="font-semibold">{scheduledCount}</span></span>
          <span>Não compareceu: <span className="font-semibold text-destructive">{noShowCount}</span></span>
          <span>Concluídos: <span className="font-semibold text-green-600">{completedCount}</span></span>
          <span>Total: <span className="font-semibold">{appointments.length}</span></span>
        </div>
      )}
    </div>
  );
}
