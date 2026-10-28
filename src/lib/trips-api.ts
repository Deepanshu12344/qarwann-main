import { api } from "@/lib/api";

export type JourneyDay = {
  id?: string;
  _id?: string;
  tripId?: string;
  dayNumber: number;
  day: number;
  route?: string;
  location: string;
  phase?: string;
  nature?: boolean;
  adventure?: boolean;
  culture?: boolean;
  spiritual?: boolean;
  heritage?: boolean;
  modern?: boolean;
  keyAttractions?: string[];
  experienceDetails?: string;
  description?: string;
  hiddenGems?: string[];
  activities?: string[];
  localFood?: string[];
  meals?: string[];
  localExperience?: string;
  festivals?: string[];
  stayType?: string;
  stay?: string;
  accessibility?: string;
  images: string[];
  imageData?: Array<{ url: string; publicId?: string; alt?: string }>;
};

export type Trip = {
  id: string;
  _id?: string;
  slug: string;
  packageName: string;
  title: string;
  name: string;
  category: "journey" | "weekend";
  status: "draft" | "published";
  featured: boolean;
  order: number;
  destination: string;
  place: string;
  country: string;
  citiesCovered: string[];
  cities: string[];
  startPoint: string;
  startingPoint: string;
  endPoint: string;
  bestSeason: string[];
  idealFor: string[];
  tripType: string;
  tags: string[];
  duration: string;
  durationDays: number;
  nights: number;
  startingPrice: number;
  budgetFrom: number;
  budget: number;
  detailedOverview: string;
  summary: string;
  overview: string;
  whyThisTrip: string;
  keyExperiences: string[];
  highlights: string[];
  coverImage: string;
  cover: string;
  img: string;
  coverImageData?: { url: string; publicId?: string; alt?: string } | null;
  gallery: Array<{ url: string; publicId?: string; alt?: string; caption?: string }>;
  galleryUrls: string[];
  locationBanners: Record<string, string>;
  inclusions?: string[];
  exclusions?: string[];
  howItWorks?: Array<{ title: string; description: string }>;
  journeyDays?: JourneyDay[];
  createdAt?: string;
  updatedAt?: string;
};

export type TripsResponse = {
  items: Trip[];
  total: number;
  page: number;
  pageSize: number;
  pagination?: { page: number; limit: number; total: number; pages: number };
  facets?: {
    countries: string[];
    tripTypes: string[];
    seasons: string[];
    idealFor: string[];
  };
};

export type DestinationSummary = {
  name: string;
  country: string;
  category: string;
  coverImage: string;
  tripCount: number;
  minPrice: number;
  slugs: string[];
};

export const tripKeys = {
  all: ["trips"] as const,
  lists: () => [...tripKeys.all, "list"] as const,
  list: (params: Record<string, any> = {}) => [...tripKeys.lists(), params] as const,
  details: () => [...tripKeys.all, "detail"] as const,
  detail: (slug: string) => [...tripKeys.details(), slug] as const,
  destinations: () => [...tripKeys.all, "destinations"] as const,
};

export async function fetchTrips(params: Record<string, any> = {}): Promise<TripsResponse> {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      query.set(k, String(v));
    }
  }
  const qs = query.toString();
  return api<TripsResponse>(`/api/trips${qs ? `?${qs}` : ""}`);
}

export async function fetchTripBySlug(slug: string): Promise<Trip> {
  return api<Trip>(`/api/trips/slug/${encodeURIComponent(slug)}`);
}

export async function fetchDestinations(): Promise<{ items: DestinationSummary[]; total: number }> {
  return api<{ items: DestinationSummary[]; total: number }>("/api/trips/destinations");
}
