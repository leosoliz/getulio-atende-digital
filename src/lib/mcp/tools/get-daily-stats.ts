import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default defineTool({
  name: "get_daily_stats",
  title: "Get daily attendance stats",
  description:
    "Aggregate attendance counts for a given date (YYYY-MM-DD) across the in-person queue and WhatsApp services.",
  inputSchema: {
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("Target date in YYYY-MM-DD format (America/Sao_Paulo)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ date }) => {
    const start = `${date}T00:00:00-03:00`;
    const end = `${date}T23:59:59-03:00`;
    const sb = admin();

    const [queueTotal, queueCompleted, whats] = await Promise.all([
      sb.from("queue_customers").select("*", { count: "exact", head: true })
        .gte("created_at", start).lte("created_at", end),
      sb.from("queue_customers").select("*", { count: "exact", head: true })
        .eq("status", "completed").gte("completed_at", start).lte("completed_at", end),
      sb.from("whatsapp_services").select("*", { count: "exact", head: true })
        .gte("created_at", start).lte("created_at", end),
    ]);

    const payload = {
      date,
      queue_total: queueTotal.count ?? 0,
      queue_completed: queueCompleted.count ?? 0,
      whatsapp_services: whats.count ?? 0,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});