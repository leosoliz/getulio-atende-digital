import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

interface ServiceTypeData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ServiceTypeDistributionChartProps {
  serviceTypes: ServiceTypeData[];
  total: number;
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#94a3b8"];

export default function ServiceTypeDistributionChart({ 
  serviceTypes,
  total 
}: ServiceTypeDistributionChartProps) {
  const filteredData = serviceTypes.filter(item => item.value > 0);
  
  // Get top 10 and group the rest as "Outros"
  const top10 = filteredData.slice(0, 10);
  const others = filteredData.slice(10);
  
  let displayData = [...top10];
  
  if (others.length > 0) {
    const othersSum = others.reduce((sum, item) => sum + item.value, 0);
    const othersPercentage = ((othersSum / total) * 100).toFixed(1);
    displayData.push({
      name: 'Outros',
      value: othersSum,
      percentage: parseFloat(othersPercentage),
      color: '#94a3b8' // slate-400
    });
  }

  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
      <text 
        x={x + width + 5} 
        y={y + height / 2} 
        fill="#666" 
        textAnchor="start" 
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-purple-100/50">
      <CardHeader className="pb-1 pt-1.5 px-2">
        <CardTitle className="flex items-center gap-2 text-xs">
          <BarChart3 className="h-3 w-3 text-purple-600" />
          Distribuição por Tipo de Serviço
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-1.5">
        {displayData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={displayData}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} atendimentos`, 'Quantidade']}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} label={renderCustomLabel} barSize={18}>
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8 text-xs">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
