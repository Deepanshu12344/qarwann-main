import { createFileRoute } from "@tanstack/react-router";
import { API_BASE_URL } from "@/lib/api";
import { QARWAAN_ITINERARIES } from "@/data/qarwaan-itineraries";
import { resolveImageUrl } from "@/lib/media";

const WEEKEND_GETAWAY_SLUGS = new Set([
  "jim-corbett-wild-trails-and-forest-escape",
  "rishikesh-reset-by-the-ganga-weekend-escape",
  "coorg-coffee-forests-kodava-culture",
  "hampi-heritage-weekend-escape",
  "kasauli-colonial-charm-pine-trails-slow-mountain-living",
  "ooty-coonoor-tea-trails-misty-hills-nilgiri-escapes",
  "darjeeling-tea-trails-himalayan-views-toy-train-heritage",
]);

export const Route = createFileRoute("/api/public/trips")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const backendUrl = `${API_BASE_URL}/api/trips?${url.searchParams.toString()}`;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(backendUrl, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            return new Response(JSON.stringify(data), {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
              },
            });
          }
        } catch {
          // Backend offline or unreachable; fall back gracefully to static cache
        }

        // Graceful fallback for offline build / server start
        const category = url.searchParams.get("category") ?? "";
        const q = url.searchParams.get("q")?.toLowerCase().trim() ?? "";
        const country = url.searchParams.get("country") ?? "";
        const tripType = url.searchParams.get("tripType") ?? "";
        const duration = url.searchParams.get("duration") ?? "";
        const bestSeason = url.searchParams.get("bestSeason") ?? "";
        const idealFor = url.searchParams.get("idealFor") ?? "";
        const sort = url.searchParams.get("sort") ?? "popular";

        let source = QARWAAN_ITINERARIES;
        if (category === "weekend") {
          source = source.filter((t) => WEEKEND_GETAWAY_SLUGS.has(t.slug));
        } else if (category === "journey") {
          source = source.filter((t) => !WEEKEND_GETAWAY_SLUGS.has(t.slug));
        }

        let filtered = source.map((t, idx) => {
          const coverUrl = resolveImageUrl(t.coverImage);
          const placeStr = t.destination || t.citiesCovered?.[0] || t.country;
          const durationStr = t.duration || `${t.durationDays} Days / ${Math.max(t.durationDays - 1, 0)} Nights`;

          return {
            id: t.slug || t.id,
            slug: t.slug || t.id,
            name: t.packageName,
            packageName: t.packageName,
            title: t.packageName,
            destination: placeStr,
            place: placeStr,
            country: t.country,
            cover: coverUrl,
            coverImage: coverUrl,
            img: coverUrl,
            duration: durationStr,
            durationDays: t.durationDays,
            nights: (t as any).nights ?? Math.max(t.durationDays - 1, 0),
            cities: [...t.citiesCovered],
            citiesCovered: [...t.citiesCovered],
            bestSeason: Array.isArray(t.bestSeason) ? t.bestSeason[0] ?? "All year" : t.bestSeason,
            startingPoint: t.startPoint,
            startPoint: t.startPoint,
            tripType: t.tripType,
            budget: t.budgetFrom,
            budgetFrom: t.budgetFrom,
            startingPrice: t.budgetFrom,
            idealFor: Array.isArray(t.idealFor) ? t.idealFor[0] ?? "Travellers" : t.idealFor,
            popularity: 100 - idx,
            category: WEEKEND_GETAWAY_SLUGS.has(t.slug) ? "weekend" : "journey",
          };
        });

        if (q) {
          filtered = filtered.filter((t) =>
            `${t.name} ${t.country} ${t.cities.join(" ")}`.toLowerCase().includes(q)
          );
        }
        if (country) filtered = filtered.filter((t) => t.country === country);
        if (tripType) filtered = filtered.filter((t) => t.tripType === tripType);
        if (bestSeason) filtered = filtered.filter((t) => t.bestSeason === bestSeason);
        if (idealFor) filtered = filtered.filter((t) => t.idealFor === idealFor);
        if (duration === "short") filtered = filtered.filter((t) => t.durationDays <= 5);
        else if (duration === "medium") filtered = filtered.filter((t) => t.durationDays >= 6 && t.durationDays <= 9);
        else if (duration === "long") filtered = filtered.filter((t) => t.durationDays >= 10);

        if (sort === "duration") filtered.sort((a, b) => a.durationDays - b.durationDays);
        else if (sort === "price") filtered.sort((a, b) => a.budget - b.budget);
        else filtered.sort((a, b) => b.popularity - a.popularity);

        const facets = {
          countries: [...new Set(filtered.map((t) => t.country))].sort(),
          tripTypes: [...new Set(filtered.map((t) => t.tripType))].sort(),
          seasons: ["Spring", "Summer", "Autumn", "Winter"],
          idealFor: [...new Set(filtered.map((t) => t.idealFor))].sort(),
        };

        return new Response(
          JSON.stringify({
            items: filtered,
            total: filtered.length,
            page: 1,
            pageSize: filtered.length,
            facets,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
            },
          }
        );
      },
    },
  },
});
