import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export interface AttendantChannelData {
  name: string;
  queue: number;
  whatsapp: number;
  identity: number;
  total: number;
}

interface AttendantChannelChartProps {
  data: AttendantChannelData[];
  title?: string;
}

const COLORS = {
  queue: "#3b82f6",
  whatsapp: "#10b981",
  identity: "#8b5cf6",
};

export default function AttendantChannelChart({ data, title = "Distribuição por Canal por Atendente" }: AttendantChannelChartProps) {
  // Ordenar por total e pegar top 10 para legibilidade
  const top = [...data].sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/50 to-cyan-100/50">
      <CardHeader className="pb-1 pt-1.5 px-2">
        <CardTitle className="flex items-center gap-2 text-xs">
          <Users className="h-3 w-3 text-cyan-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-1.5">
        {top.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                stackOffset="expand"
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 9 }}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  domain={[0, 1]}
                />
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
                  formatter={(value: number, name: string, props: any) => {
                    const row = props.payload;
                    const total = row.total || 1;
                    const pct = Math.round((value / total) * 100);
                    const label =
                      name === "queue" ? "Presencial" : name === "whatsapp" ? "WhatsApp" : "Agendamentos";
                    return [`${value} (${pct}%)`, label];
                  }}
                  labelFormatter={(label: string, payload: any) => {
                    const total = payload?.[0]?.payload?.total ?? 0;
                    return `${label} — Total: ${total}`;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(value) =>
                    value === "queue" ? "Presencial" : value === "whatsapp" ? "WhatsApp" : "Agendamentos"
                  }
                />
                <Bar dataKey="queue" stackId="a" fill={COLORS.queue} barSize={16} />
                <Bar dataKey="whatsapp" stackId="a" fill={COLORS.whatsapp} barSize={16} />
                <Bar dataKey="identity" stackId="a" fill={COLORS.identity} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8 text-xs">
            Nenhum dado disponível
          </div>
        )}
        <p className="text-[9px] text-muted-foreground mt-1 text-center">
          Barras proporcionais (100%). Passe o mouse para ver quantidades.
        </p>
      </CardContent>
    </Card>
  );
}