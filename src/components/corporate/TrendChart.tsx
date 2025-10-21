
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
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-emerald-600" />
          Histórico dos Últimos 12 Meses
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 9 }} />
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
