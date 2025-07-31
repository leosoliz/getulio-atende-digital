
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface SatisfactionChartProps {
  averageRating: number;
  totalSurveys: number;
  ratingDistribution: { [key: string]: number };
}

export default function SatisfactionChart({ 
  averageRating, 
  totalSurveys, 
  ratingDistribution 
}: SatisfactionChartProps) {
  const pieData = Object.entries(ratingDistribution).map(([rating, count]) => ({
    name: rating.charAt(0).toUpperCase() + rating.slice(1),
    value: count,
    percentage: totalSurveys > 0 ? Math.round((count / totalSurveys) * 100) : 0
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

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
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-yellow-100/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-600" />
          Satisfação Geral
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(averageRating) 
                        ? "text-yellow-400 fill-current" 
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <Badge variant="outline" className="text-sm">
                {totalSurveys} avaliações
              </Badge>
            </div>
            
            <div className="space-y-2">
              {Object.entries(ratingDistribution).map(([rating, count]) => {
                const percentage = totalSurveys > 0 ? (count / totalSurveys) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center justify-between text-sm">
                    <span className="capitalize min-w-0 flex-1">{rating}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-16 bg-secondary rounded-full h-2">
                        <div
                          className="h-2 bg-yellow-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground min-w-fit">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {pieData.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} avaliações`, 'Quantidade']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
