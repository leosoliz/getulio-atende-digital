import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
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

export default function IdentityCalendar() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: format(date, "MMMM yyyy", { locale: ptBR })
    };
  });

  useEffect(() => {
    fetchAppointments();
  }, [selectedMonth]);

  const fetchAppointments = async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const { data, error } = await supabase
      .from('identity_appointments')
      .select('id, name, phone, appointment_date, appointment_time, status')
      .gte('appointment_date', format(start, 'yyyy-MM-dd'))
      .lte('appointment_date', format(end, 'yyyy-MM-dd'))
      .eq('status', 'scheduled')
      .order('appointment_date')
      .order('appointment_time');

    if (!error && data) {
      setAppointments(data);
    }
    setLoading(false);
  };

  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDayOfWeek = getDay(new Date(year, month - 1, 1)); // 0=Sun

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(a => a.appointment_date === dateStr);
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const selectedDayAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : [];

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
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNames.map(d => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayAppts = getAppointmentsForDay(day);
              const count = dayAppts.length;
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
                    <Badge 
                      variant={isSelected ? "secondary" : "default"} 
                      className="text-[8px] px-1 py-0 h-3.5 min-w-[16px]"
                    >
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Appointment list for selected day */}
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
              <p className="text-xs text-muted-foreground">Nenhum agendamento aberto neste dia.</p>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {selectedDayAppointments.map(appt => (
                  <div key={appt.id} className="flex items-center justify-between border rounded-md px-2 py-1.5 text-xs">
                    <div>
                      <p className="font-medium">{appt.name}</p>
                      <p className="text-muted-foreground">{appt.phone}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {appt.appointment_time.slice(0, 5)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedDay && (
        <div className="text-center text-xs text-muted-foreground py-2">
          Total de agendamentos abertos no mês: <span className="font-semibold">{appointments.length}</span>
        </div>
      )}
    </div>
  );
}
