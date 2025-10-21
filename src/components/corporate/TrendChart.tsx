
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
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-emerald-600" />
          Histórico dos Últimos 12 Meses
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
