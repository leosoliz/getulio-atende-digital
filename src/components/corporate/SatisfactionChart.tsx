
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

interface AttendantData {
  name: string;
  value: number;
  color: string;
}

interface AttendantDistributionChartProps {
  attendants: AttendantData[];
  total: number;
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#94a3b8", "#f97316", "#84cc16"];

export default function SatisfactionChart({ 
  attendants,
  total 
}: AttendantDistributionChartProps) {
  const top10 = attendants.slice(0, 10);

  return (
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-yellow-100/50">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <UserCheck className="h-4 w-4 text-yellow-600" />
          Distribuição por Atendente
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {top10.length > 0 ? (
          <div className="h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={top10}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fontSize: 9 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} atendimentos`, 'Quantidade']}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {top10.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
