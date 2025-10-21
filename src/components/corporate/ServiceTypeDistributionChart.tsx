import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutList } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

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

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-purple-100/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutList className="h-5 w-5 text-purple-600" />
          Distribuição por Tipo de Serviço
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayData.length > 0 ? (
          <>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {displayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} atendimentos`, 'Quantidade']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {displayData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="text-xs">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-muted-foreground">
                      {item.value} ({item.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
