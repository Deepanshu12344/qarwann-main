import { QARWAAN_ITINERARIES } from "@/data/qarwaan-itineraries";

export type PlannerPreferences = {
  destination?: string;
  durationDays?: number;
  travellers?: number;
  tripType?: string;
  interests?: string[];
};

export type PlannerTrip = {
  id: string;
  title: string;
  slug: string;
  destination: string;
  duration: string;
  type: string;
  idealFor: string[];
  coverImage?: string;
};

export type PlannerItinerary = {
  title: string;
  destination: string;
  durationDays: number;
  travellers: number;
  budgetEstimate?: string;
  travelStyle?: string;
  overview?: string;
  highlights: string[];
  packingTips: string[];
  caveats: string[];
  image?: string;
  days: { day: number; title: string; activities: string[]; places: string[]; localTip?: string }[];
};

type CatalogueTrip = (typeof QARWAAN_ITINERARIES)[number];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "help",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "plan",
  "please",
  "the",
  "to",
  "trip",
  "with",
]);
const DESTINATION_ALIASES: Record<string, string[]> = {
  himachal: ["spiti", "kasauli"],
  mountains: ["spiti", "ladakh", "kasauli", "darjeeling", "ooty"],
  beach: ["andaman", "bali", "goa"],
  wildlife: ["corbett"],
};

function textTerms(value: string) {
  const raw = value.toLowerCase();
  const expanded = Object.entries(DESTINATION_ALIASES).flatMap(([alias, terms]) =>
    raw.includes(alias) ? terms : [],
  );
  return [
    ...raw.split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !STOP_WORDS.has(term)),
    ...expanded,
  ];
}

function toTrip(trip: CatalogueTrip): PlannerTrip {
  return {
    id: trip.id,
    title: trip.packageName,
    slug: trip.slug,
    destination: trip.citiesCovered.join(", "),
    duration: trip.duration,
    type: trip.tripType,
    idealFor: trip.idealFor,
    coverImage: trip.coverImage,
  };
}

function score(trip: CatalogueTrip, query: string, preferences: PlannerPreferences) {
  const terms = textTerms(
    [query, preferences.destination, preferences.tripType, ...(preferences.interests || [])]
      .filter(Boolean)
      .join(" "),
  );
  const searchable = [
    trip.packageName,
    trip.country,
    trip.tripType,
    ...trip.citiesCovered,
    ...trip.idealFor,
    ...trip.keyExperiences,
  ]
    .join(" ")
    .toLowerCase();
  let result = terms.reduce((total, term) => total + (searchable.includes(term) ? 3 : 0), 0);
  const queryLower = query.toLowerCase();
  if (
    /romantic|couple|honeymoon/.test(queryLower) &&
    trip.idealFor.some((item) => /couple/i.test(item))
  )
    result += 4;
  if (/long weekend|weekend/.test(queryLower) && trip.durationDays <= 3) result += 5;
  if (/adventure/.test(queryLower) && /adventure/i.test(trip.tripType)) result += 3;
  return result;
}

function extractPreferences(message: string, current: PlannerPreferences): PlannerPreferences {
  const duration = message.match(/\b(\d{1,2})\s*(?:day|days|night|nights)\b/i);
  const travellers = message.match(
    /\b(\d{1,2})\s*(?:travellers?|travelers?|people|persons?|adults?)\b/i,
  );
  return {
    ...current,
    durationDays: duration ? Number(duration[1]) : current.durationDays,
    travellers: travellers ? Number(travellers[1]) : current.travellers,
  };
}

function makeItinerary(trip: CatalogueTrip, preferences: PlannerPreferences): PlannerItinerary {
  const requestedDays =
    preferences.durationDays && preferences.durationDays > 0
      ? Math.min(preferences.durationDays, trip.journeyDays.length)
      : trip.journeyDays.length;
  const days = trip.journeyDays.slice(0, requestedDays).map((day, index) => ({
    day: index + 1,
    title: day.phase || day.location,
    activities: day.activities.slice(0, 5),
    places: day.keyAttractions.slice(0, 5),
    localTip: day.hiddenGems[0] || day.localExperience,
  }));
  const shownDays = days.length;
  return {
    title:
      shownDays === trip.journeyDays.length
        ? trip.packageName
        : `${trip.packageName} — ${shownDays}-day highlights`,
    destination: trip.citiesCovered.join(", "),
    durationDays: shownDays,
    travellers: preferences.travellers || 2,
    budgetEstimate: trip.budgetFrom
      ? `From ₹${trip.budgetFrom.toLocaleString("en-IN")} per person`
      : undefined,
    travelStyle: trip.tripType,
    overview: trip.detailedOverview,
    highlights: trip.keyExperiences.slice(0, 6),
    packingTips: [],
    caveats: [
      "This is a suggested route based on Qarwaan’s published journey. Final availability, inclusions and pricing are confirmed by the travel team.",
    ],
    image: trip.coverImage,
    days,
  };
}

export function getPlannerDiscovery() {
  const trips = QARWAAN_ITINERARIES.map(toTrip);
  const destinations = trips
    .reduce<{ name: string; description: string; coverImage?: string; tripId: string }[]>(
      (result, trip) => {
        const name = trip.destination.split(",")[0];
        if (!result.some((destination) => destination.name === name)) {
          result.push({
            name,
            description: `${trip.duration} · ${trip.type}`,
            coverImage: trip.coverImage,
            tripId: trip.id,
          });
        }
        return result;
      },
      [],
    )
    .slice(0, 9);
  return { destinations, trips: trips.slice(0, 10) };
}

export function planLocalJourney(message: string, currentPreferences: PlannerPreferences) {
  const extractedPreferences = extractPreferences(message, currentPreferences);
  const ranked = [...QARWAAN_ITINERARIES]
    .map((trip) => ({ trip, score: score(trip, message, extractedPreferences) }))
    .sort(
      (left, right) => right.score - left.score || left.trip.durationDays - right.trip.durationDays,
    );
  const match = ranked[0]?.trip || QARWAAN_ITINERARIES[0];
  const matched = (ranked[0]?.score || 0) > 0;
  const preferences = { ...extractedPreferences, destination: match.citiesCovered[0] };
  const itinerary = makeItinerary(match, preferences);
  const recommendedTrips = ranked.slice(0, 4).map(({ trip }) => toTrip(trip));
  const reply = matched
    ? `I found a Qarwaan journey that fits: ${match.packageName}. I’ve prepared a practical route below using our published trip details. You can adjust it or send an enquiry when you’re ready.`
    : `I can help with that. I’ve started with ${match.packageName}, the closest journey in Qarwaan’s current collection. Tell me a destination, preferred duration, or travel style and I’ll refine the route.`;
  return { reply, preferences, itinerary, recommendedTrips };
}
