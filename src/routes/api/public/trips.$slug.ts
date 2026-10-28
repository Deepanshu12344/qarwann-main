import { createFileRoute } from "@tanstack/react-router";
import { API_BASE_URL } from "@/lib/api";
import { QARWAAN_ITINERARIES } from "@/data/qarwaan-itineraries";
import { resolveImageUrl } from "@/lib/media";

export const Route = createFileRoute("/api/public/trips/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug;
        if (!slug || slug === "undefined" || slug.length > 200) {
          return new Response(JSON.stringify({ error: "Invalid trip identifier" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const backendUrl = `${API_BASE_URL}/api/trips/slug/${encodeURIComponent(slug)}`;

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
          if (res.status === 404) {
            return new Response(JSON.stringify({ error: "Trip not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch {
          // Backend offline or unreachable; fall back gracefully to static cache
        }

        // Fallback for offline builds
        const staticTrip = QARWAAN_ITINERARIES.find(
          (item) => item.id === slug || item.slug === slug
        );

        if (!staticTrip) {
          return new Response(JSON.stringify({ error: "Trip not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Resolve images to Cloudinary CDN URLs in static fallback
        const coverUrl = resolveImageUrl(staticTrip.coverImage);
        const resolvedTrip = {
          ...staticTrip,
          id: staticTrip.slug || staticTrip.id,
          slug: staticTrip.slug || staticTrip.id,
          title: staticTrip.packageName,
          name: staticTrip.packageName,
          coverImage: coverUrl,
          cover: coverUrl,
          img: coverUrl,
          gallery: Array.isArray(staticTrip.gallery)
            ? staticTrip.gallery.map(resolveImageUrl)
            : [],
          galleryUrls: Array.isArray(staticTrip.gallery)
            ? staticTrip.gallery.map(resolveImageUrl)
            : [],
          journeyDays: Array.isArray(staticTrip.journeyDays)
            ? staticTrip.journeyDays.map((d) => ({
                ...d,
                images: Array.isArray(d.images) ? d.images.map(resolveImageUrl) : [],
              }))
            : [],
        };

        return new Response(JSON.stringify(resolvedTrip), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          },
        });
      },
    },
  },
});
