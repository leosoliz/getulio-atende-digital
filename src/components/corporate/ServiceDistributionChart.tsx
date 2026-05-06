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
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  // Centralizar o rótulo no meio da fatia (entre raio interno e externo)
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="9"
      fontWeight="700"
      style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 1.5 }}
    >
      {`${Math.round(percent * 100)}%`}
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
            <div className="flex items-center justify-center gap-3 mb-1 text-[10px]">
              {(["queue", "whatsapp", "identity"] as const).map((k) => (
                <div key={k} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[k] }} />
                  <span className="text-indigo-900 font-medium">{LABELS[k]}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {top4.map((att, idx) => {
                const pieData = [
                  { key: "queue", name: LABELS.queue, value: att.queue, color: COLORS.queue },
                  { key: "whatsapp", name: LABELS.whatsapp, value: att.whatsapp, color: COLORS.whatsapp },
                  { key: "identity", name: LABELS.identity, value: att.identity, color: COLORS.identity },
                ].filter((d) => d.value > 0);

                return (
                  <div key={att.name + idx} className="flex items-center gap-2 bg-white/60 rounded-md py-1 px-2 border border-indigo-100">
                    <div className="h-24 w-24 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderLabel}
                            innerRadius={16}
                            outerRadius={44}
                            paddingAngle={1}
                            stroke="#ffffff"
                            strokeWidth={1.5}
                            dataKey="value"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string) => {
                              const pct = att.total > 0 ? Math.round((value / att.total) * 100) : 0;
                              return [`${value} (${pct}%)`, name];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-indigo-900 truncate leading-tight">
                        {idx + 1}. {att.name}
                      </div>
                      <div className="text-[9px] text-muted-foreground leading-tight">
                        {att.total} atendimentos
                      </div>
                    </div>
                  </div>
                );
              })}
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
