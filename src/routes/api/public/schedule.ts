import { createFileRoute } from "@tanstack/react-router";
import { CONFIG } from "@/config";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };

export const Route = createFileRoute("/api/public/schedule")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        try {
          const r = await fetch(CONFIG.SCHEDULE_CSV_URL, { redirect: "follow" });
          if (!r.ok) return new Response(`Sheet fetch failed [${r.status}]`, { status: 502, headers: CORS });
          return new Response(await r.text(), {
            headers: { ...CORS, "content-type": "text/csv; charset=utf-8", "cache-control": "public, max-age=300" },
          });
        } catch {
          return new Response("Sheet fetch failed", { status: 502, headers: CORS });
        }
      },
    },
  },
});
