import { createFileRoute } from "@tanstack/react-router";
import { getDemoTrip } from "@/data/demo-itineraries";
import { TRIPS } from "./trips";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function fallbackDetail(slug: string) {
  const t = TRIPS.find((x) => x.id === slug);
  if (!t) return null;
  const perCity = Math.max(1, Math.floor(t.durationDays / Math.max(1, t.cities.length)));
  const journeyDays: any[] = [];
  let day = 1;
  t.cities.forEach((city, ci) => {
    const days = ci === t.cities.length - 1 ? t.durationDays - journeyDays.length : perCity;
    for (let i = 0; i < days; i++) {
      journeyDays.push({
        day: day++,
        location: city,
        route: i === 0 && ci > 0 ? `${t.cities[ci - 1]} → ${city}` : city,
        phase: i === 0 ? "Arrival & Orientation" : i === days - 1 ? "Discovery" : "Immersion",
        keyAttractions: [`${city} highlights`, `Signature landmarks of ${city}`],
        experienceDetails: `Explore ${city} with curated guides — a mix of iconic sites and locally-loved corners tailored to a ${t.tripType.toLowerCase()} pace.`,
        activities: [`Guided walk in ${city}`, `${t.tripType} experience`],
        localFood: [`Regional specialties of ${city}`],
        stayType: "Boutique / Luxury Stay",
      });
    }
  });
  return {
    id: t.id,
    slug: t.id,
    packageName: t.name,
    coverImage: t.cover,
    country: t.country,
    duration: `${t.durationDays} days`,
    durationDays: t.durationDays,
    citiesCovered: t.cities,
    bestSeason: [t.bestSeason],
    startPoint: t.startingPoint,
    endPoint: t.cities[t.cities.length - 1],
    tripType: t.tripType,
    idealFor: [t.idealFor],
    budgetFrom: t.budget,
    detailedOverview: `A ${t.durationDays}-day ${t.tripType.toLowerCase()} journey through ${t.country}, weaving together ${t.cities.join(", ")}. Every stay, transfer, and experience is designed by QARWAAN's specialists to feel effortless.`,
    whyThisTrip: `Ideal for ${t.idealFor.toLowerCase()} seeking ${t.tripType.toLowerCase()} in ${t.bestSeason.toLowerCase()}. Handpicked stays, private guides, and access to moments most travellers miss.`,
    keyExperiences: [
      `Private arrival & concierge in ${t.startingPoint}`,
      `Curated ${t.tripType.toLowerCase()} experiences across ${t.cities.length} destinations`,
      `Signature stays with QARWAAN-vetted hospitality`,
    ],
    journeyDays,
  };
}

export const Route = createFileRoute("/api/public/trips/$slug")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ params }) => {
        const trip = getDemoTrip(params.slug) ?? fallbackDetail(params.slug);
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
