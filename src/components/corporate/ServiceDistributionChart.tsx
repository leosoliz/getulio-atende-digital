import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { AttendantChannelData } from "./AttendantChannelChart";

interface ServiceDistributionChartProps {
  attendantChannelData?: AttendantChannelData[];
}

const COLORS = {
  queue: "#3b82f6",
  whatsapp: "#10b981",
  identity: "#8b5cf6",
};

const LABELS = {
  queue: "Presencial",
  whatsapp: "WhatsApp",
  identity: "Agendamentos",
};

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize="10"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ServiceDistributionChart({
  attendantChannelData = [],
}: ServiceDistributionChartProps) {
  const top4 = [...attendantChannelData]
    .filter((a) => a.total > 0 && a.name !== "Sem atendente")
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-indigo-100/50">
      <CardHeader className="pb-1 pt-1.5 px-2">
        <CardTitle className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3 text-indigo-600" />
          Distribuição por Canal — TOP 4 Atendentes
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-1.5">
        {top4.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-1">
              {top4.map((att, idx) => {
                const pieData = [
                  { key: "queue", name: LABELS.queue, value: att.queue, color: COLORS.queue },
                  { key: "whatsapp", name: LABELS.whatsapp, value: att.whatsapp, color: COLORS.whatsapp },
                  { key: "identity", name: LABELS.identity, value: att.identity, color: COLORS.identity },
                ].filter((d) => d.value > 0);

                return (
                  <div key={att.name + idx} className="flex flex-col items-center">
                    <div className="text-[10px] font-semibold text-indigo-900 truncate max-w-full text-center px-1">
                      {idx + 1}. {att.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground -mt-0.5">
                      {att.total} atendimentos
                    </div>
                    <div className="h-24 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderLabel}
                            outerRadius={38}
                            dataKey="value"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string) => [`${value}`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-1 mt-1 pt-1 border-t border-indigo-200/60">
              {(["queue", "whatsapp", "identity"] as const).map((k) => (
                <div key={k} className="text-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full mx-auto mb-0.5"
                    style={{ backgroundColor: COLORS[k] }}
                  />
                  <div className="text-[10px] font-medium">{LABELS[k]}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8 text-xs">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
