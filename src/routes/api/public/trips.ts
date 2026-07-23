import { createFileRoute } from "@tanstack/react-router";
import { DEMO_TRIP_CARDS } from "@/data/demo-itineraries";


type Trip = {
  id: string;
  name: string;
  country: string;
  cover: string;
  durationDays: number;
  cities: string[];
  bestSeason: string;
  startingPoint: string;
  tripType: string;
  budget: number;
  idealFor: string;
  popularity: number;
};

export const TRIPS: Trip[] = [
  {
    id: "t1",
    name: "Maldives Overwater Escape",
    country: "Maldives",
    cover: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80",
    durationDays: 6,
    cities: ["Malé", "Baa Atoll"],
    bestSeason: "Winter",
    startingPoint: "Malé",
    tripType: "Beach",
    budget: 4200,
    idealFor: "Couples",
    popularity: 98,
  },
  {
    id: "t2",
    name: "Kyoto Cherry Blossom Trail",
    country: "Japan",
    cover: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
    durationDays: 8,
    cities: ["Tokyo", "Kyoto", "Nara"],
    bestSeason: "Spring",
    startingPoint: "Tokyo",
    tripType: "Cultural",
    budget: 3600,
    idealFor: "Couples",
    popularity: 92,
  },
  {
    id: "t3",
    name: "Patagonia Wilderness Trek",
    country: "Chile",
    cover: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80",
    durationDays: 11,
    cities: ["Santiago", "Puerto Natales", "Torres del Paine"],
    bestSeason: "Summer",
    startingPoint: "Santiago",
    tripType: "Adventure",
    budget: 5200,
    idealFor: "Solo",
    popularity: 81,
  },
  {
    id: "t4",
    name: "Moroccan Sahara Odyssey",
    country: "Morocco",
    cover: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200&q=80",
    durationDays: 9,
    cities: ["Marrakech", "Fes", "Merzouga"],
    bestSeason: "Autumn",
    startingPoint: "Marrakech",
    tripType: "Cultural",
    budget: 2900,
    idealFor: "Friends",
    popularity: 88,
  },
  {
    id: "t5",
    name: "Santorini & Cyclades Sail",
    country: "Greece",
    cover: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80",
    durationDays: 7,
    cities: ["Athens", "Mykonos", "Santorini"],
    bestSeason: "Summer",
    startingPoint: "Athens",
    tripType: "Beach",
    budget: 3800,
    idealFor: "Couples",
    popularity: 95,
  },
  {
    id: "t6",
    name: "Serengeti Migration Safari",
    country: "Tanzania",
    cover: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80",
    durationDays: 10,
    cities: ["Arusha", "Serengeti", "Ngorongoro"],
    bestSeason: "Summer",
    startingPoint: "Arusha",
    tripType: "Wildlife",
    budget: 6400,
    idealFor: "Family",
    popularity: 90,
  },
  {
    id: "t7",
    name: "Icelandic Aurora Expedition",
    country: "Iceland",
    cover: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80",
    durationDays: 6,
    cities: ["Reykjavík", "Vík", "Jökulsárlón"],
    bestSeason: "Winter",
    startingPoint: "Reykjavík",
    tripType: "Adventure",
    budget: 4100,
    idealFor: "Couples",
    popularity: 86,
  },
  {
    id: "t8",
    name: "Vietnam Coast to Highlands",
    country: "Vietnam",
    cover: "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80",
    durationDays: 12,
    cities: ["Hanoi", "Hoi An", "Ho Chi Minh"],
    bestSeason: "Autumn",
    startingPoint: "Hanoi",
    tripType: "Cultural",
    budget: 2400,
    idealFor: "Friends",
    popularity: 78,
  },
  {
    id: "t9",
    name: "Tuscany Wine Country Drive",
    country: "Italy",
    cover: "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=1200&q=80",
    durationDays: 7,
    cities: ["Florence", "Siena", "Montalcino"],
    bestSeason: "Autumn",
    startingPoint: "Florence",
    tripType: "Cultural",
    budget: 4600,
    idealFor: "Couples",
    popularity: 89,
  },
  {
    id: "t10",
    name: "Bali Hidden Temples",
    country: "Indonesia",
    cover: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80",
    durationDays: 9,
    cities: ["Ubud", "Seminyak", "Nusa Penida"],
    bestSeason: "Spring",
    startingPoint: "Denpasar",
    tripType: "Beach",
    budget: 2700,
    idealFor: "Solo",
    popularity: 84,
  },
  {
    id: "t11",
    name: "Peru: Inca Trail to Machu Picchu",
    country: "Peru",
    cover: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&q=80",
    durationDays: 10,
    cities: ["Lima", "Cusco", "Aguas Calientes"],
    bestSeason: "Winter",
    startingPoint: "Lima",
    tripType: "Adventure",
    budget: 3300,
    idealFor: "Friends",
    popularity: 91,
  },
  {
    id: "t12",
    name: "Swiss Alps Grand Train",
    country: "Switzerland",
    cover: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&q=80",
    durationDays: 8,
    cities: ["Zurich", "Lucerne", "Zermatt", "St. Moritz"],
    bestSeason: "Summer",
    startingPoint: "Zurich",
    tripType: "Luxury",
    budget: 7200,
    idealFor: "Family",
    popularity: 87,
  },
  {
    id: "t13",
    name: "Jordan Desert & Petra",
    country: "Jordan",
    cover: "https://images.unsplash.com/photo-1563177978-4c5cb6c4e1ee?w=1200&q=80",
    durationDays: 7,
    cities: ["Amman", "Petra", "Wadi Rum"],
    bestSeason: "Spring",
    startingPoint: "Amman",
    tripType: "Cultural",
    budget: 3100,
    idealFor: "Couples",
    popularity: 80,
  },
  {
    id: "t14",
    name: "New Zealand South Island",
    country: "New Zealand",
    cover: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
    durationDays: 14,
    cities: ["Christchurch", "Queenstown", "Milford Sound"],
    bestSeason: "Autumn",
    startingPoint: "Christchurch",
    tripType: "Adventure",
    budget: 5800,
    idealFor: "Family",
    popularity: 83,
  },
  {
    id: "t15",
    name: "Norwegian Fjords Cruise",
    country: "Norway",
    cover: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&q=80",
    durationDays: 8,
    cities: ["Bergen", "Flåm", "Geiranger"],
    bestSeason: "Summer",
    startingPoint: "Bergen",
    tripType: "Luxury",
    budget: 5400,
    idealFor: "Couples",
    popularity: 79,
  },
  {
    id: "t16",
    name: "Thailand Islands Hopper",
    country: "Thailand",
    cover: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80",
    durationDays: 10,
    cities: ["Bangkok", "Phuket", "Krabi"],
    bestSeason: "Winter",
    startingPoint: "Bangkok",
    tripType: "Beach",
    budget: 2200,
    idealFor: "Friends",
    popularity: 85,
  },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/trips")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.toLowerCase().trim() ?? "";
        const country = url.searchParams.get("country") ?? "";
        const tripType = url.searchParams.get("tripType") ?? "";
        const duration = url.searchParams.get("duration") ?? "";
        const bestSeason = url.searchParams.get("bestSeason") ?? "";
        const idealFor = url.searchParams.get("idealFor") ?? "";
        const minBudget = Number(url.searchParams.get("minBudget") ?? 0);
        const maxBudget = Number(url.searchParams.get("maxBudget") ?? 100000);
        const sort = url.searchParams.get("sort") ?? "popular";
        const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
        const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? 6));

        let results = TRIPS.filter((t) => {
          if (q) {
            const hay = `${t.name} ${t.country} ${t.cities.join(" ")}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          if (country && t.country !== country) return false;
          if (tripType && t.tripType !== tripType) return false;
          if (bestSeason && t.bestSeason !== bestSeason) return false;
          if (idealFor && t.idealFor !== idealFor) return false;
          if (duration) {
            if (duration === "short" && t.durationDays > 5) return false;
            if (duration === "medium" && (t.durationDays < 6 || t.durationDays > 9)) return false;
            if (duration === "long" && t.durationDays < 10) return false;
          }
          if (t.budget < minBudget || t.budget > maxBudget) return false;
          return true;
        });

        if (sort === "duration") results.sort((a, b) => a.durationDays - b.durationDays);
        else if (sort === "price") results.sort((a, b) => a.budget - b.budget);
        else results.sort((a, b) => b.popularity - a.popularity);

        const total = results.length;
        const start = (page - 1) * pageSize;
        const items = results.slice(start, start + pageSize);

        const facets = {
          countries: [...new Set(TRIPS.map((t) => t.country))].sort(),
          tripTypes: [...new Set(TRIPS.map((t) => t.tripType))].sort(),
          seasons: ["Spring", "Summer", "Autumn", "Winter"],
          idealFor: [...new Set(TRIPS.map((t) => t.idealFor))].sort(),
        };

        return new Response(
          JSON.stringify({ items, total, page, pageSize, facets }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      },
    },
  },
});
