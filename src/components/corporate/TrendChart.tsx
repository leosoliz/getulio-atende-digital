
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#10b981" 
        textAnchor="middle" 
        fontSize="10"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50">
      <CardHeader className="pb-1 pt-1.5 px-2">
        <CardTitle className="flex items-center gap-2 text-xs">
          <CalendarDays className="h-3 w-3 text-emerald-600" />
          Histórico dos Últimos 12 Meses
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-1.5">
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 8 }}
                angle={-45}
                textAnchor="end"
                height={30}
              />
              <YAxis tick={{ fontSize: 8 }} />
              <Tooltip 
                formatter={(value: number) => [`${value} atendimentos`, 'Total']}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data ? data.fullMonth : label;
                }}
              />
              <Bar
                dataKey="services"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                label={renderCustomLabel}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
