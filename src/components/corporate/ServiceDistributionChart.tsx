
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface ServiceDistributionChartProps {
  queueServices: number;
  whatsappServices: number;
  identityServices: number;
  total: number;
}

export default function ServiceDistributionChart({ 
  queueServices, 
  whatsappServices, 
  identityServices, 
  total 
}: ServiceDistributionChartProps) {
  const barData = [
    {
      name: "Presencial",
      value: queueServices,
      percentage: total > 0 ? Math.round((queueServices / total) * 100) : 0,
      color: "#3b82f6"
    },
    {
      name: "WhatsApp", 
      value: whatsappServices,
      percentage: total > 0 ? Math.round((whatsappServices / total) * 100) : 0,
      color: "#10b981"
    },
    {
      name: "Agendamentos",
      value: identityServices, 
      percentage: total > 0 ? Math.round((identityServices / total) * 100) : 0,
      color: "#8b5cf6"
    }
  ];

  const pieData = barData.filter(item => item.value > 0);

  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6"];

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

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-indigo-100/50">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          Distribuição por Canal
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {pieData.length > 0 && (
          <div className="h-58 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} atendimentos`, 'Quantidade']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3">
          {barData.map((item, index) => (
            <div key={item.name} className="text-center">
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-0.5"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-xs font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.value} ({item.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
