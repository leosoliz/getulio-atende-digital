
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { CalendarDays } from "lucide-react";

interface MonthlyData {
  month: string;
  services: number;
  fullMonth: string;
}

interface TrendChartProps {
  monthlyData: MonthlyData[];
}

export default function TrendChart({ monthlyData }: TrendChartProps) {
  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-600" />
          Histórico dos Últimos 12 Meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`${value} atendimentos`, 'Total']}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data ? data.fullMonth : label;
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
