
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { CalendarDays } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TrendChartProps {
  todayServices: number;
  monthServices: number;
}

export default function TrendChart({ todayServices, monthServices }: TrendChartProps) {
  // Simulando dados dos últimos 7 dias (em uma aplicação real, isso viria do banco)
  const generateTrendData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayServices = Math.floor(Math.random() * 200) + 50; // Dados simulados
      data.push({
        date: format(date, "dd/MM", { locale: ptBR }),
        services: i === 0 ? todayServices : dayServices,
        fullDate: format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
      });
    }
    return data;
  };

  const trendData = generateTrendData();

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-600" />
          Tendência dos Últimos 7 Dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`${value} atendimentos`, 'Total']}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data ? data.fullDate : label;
                }}
              />
              <Area
                type="monotone"
                dataKey="services"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorServices)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
