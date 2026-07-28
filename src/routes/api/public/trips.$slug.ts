import { createFileRoute } from "@tanstack/react-router";
import { QARWAAN_ITINERARIES } from "@/data/qarwaan-itineraries";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/trips/$slug")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ params }) => {
        const trip = QARWAAN_ITINERARIES.find(
          (item) => item.id === params.slug || item.slug === params.slug,
        );
        if (!trip) {
          return new Response(JSON.stringify({ error: "Trip not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        return new Response(JSON.stringify(trip), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
