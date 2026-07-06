import { defineMcp } from "@lovable.dev/mcp-js";
import getDailyStats from "./tools/get-daily-stats";
import listServiceLocations from "./tools/list-service-locations";

export default defineMcp({
  name: "getulio-atende-mcp",
  title: "Getúlio Atende Digital MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Presidente Getúlio municipal attendance system. Use `get_daily_stats` to fetch aggregate attendance counts for a date, and `list_service_locations` to enumerate active service locations.",
  tools: [getDailyStats, listServiceLocations],
});