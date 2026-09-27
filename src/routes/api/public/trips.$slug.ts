import { createFileRoute } from "@tanstack/react-router";
import { QARWAAN_ITINERARIES } from "@/data/qarwaan-itineraries";

export const Route = createFileRoute("/api/public/trips/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (params.slug.length > 200) {
          return new Response(JSON.stringify({ error: "Invalid trip identifier" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const trip = QARWAAN_ITINERARIES.find(
          (item) => item.id === params.slug || item.slug === params.slug,
        );
        if (!trip) {
          return new Response(JSON.stringify({ error: "Trip not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(trip), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
