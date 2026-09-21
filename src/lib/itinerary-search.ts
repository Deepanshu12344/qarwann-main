import { QARWAAN_ITINERARIES } from "@/data/qarwaan-itineraries";

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Resolves a specific itinerary from the words a traveller enters. A result is
 * returned only when the match is unambiguous, so broad searches can continue
 * to the regular results page.
 */
export function findMatchingItinerarySlug(query: string) {
  const normalizedQuery = normalize(query);
  const queryWords = normalizedQuery.split(" ").filter(Boolean);
  if (!queryWords.length) return undefined;

  const matches = QARWAAN_ITINERARIES.filter((trip) => {
    const searchableText = normalize([
      trip.packageName,
      trip.slug,
      trip.country,
      trip.startPoint,
      trip.endPoint,
      trip.tripType,
      ...trip.citiesCovered,
      ...trip.keyExperiences,
      ...trip.idealFor,
    ].join(" "));

    return queryWords.every((word) => searchableText.includes(word));
  });

  return matches.length === 1 ? matches[0].slug : undefined;
}
