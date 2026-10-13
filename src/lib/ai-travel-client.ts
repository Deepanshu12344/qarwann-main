export type TripPersona =
  | "Honeymoon"
  | "Family Trip"
  | "Group Tour"
  | "Solo Backpacker"
  | "Adventure"
  | string;

export interface WeatherDay {
  day: string;
  tempC: number;
  condition: string;
  icon: "sun" | "rain" | "cloud" | string;
}

export interface TravelPreferences {
  destination?: string;
  durationDays?: number;
  travellers?: number;
  tripType?: string;
  budget?: string;
  persona?: TripPersona;
  interests?: string[];
  travelMonth?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  places?: string[];
  localTip?: string;
}

export interface AiItinerary {
  title?: string;
  destination?: string;
  durationDays?: number;
  travellers?: number;
  budgetEstimate?: string;
  travelStyle?: string;
  overview?: string;
  highlights?: string[];
  packingTips?: string[];
  caveats?: string[];
  coverImage?: string;
  days?: ItineraryDay[];
}

export interface DestinationCardInfo {
  name: string;
  tag: string;
  rating: string;
  coverImage: string;
  bestTime: string;
  visaStatus: string;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  isDestinationQuery?: boolean;
  destination?: string;
  bestTime?: string;
  visaStatus?: string;
  destinationCard?: DestinationCardInfo;
  itinerary?: AiItinerary | null;
  weatherForecast?: WeatherDay[];
  nearbyAttractions?: string[];
  nearbyRestaurants?: string[];
  matchedTrips?: any[];
}

export interface AskQarwaanAiParams {
  messages: Array<{ role: string; content: string }>;
  preferences?: TravelPreferences;
  persona?: TripPersona;
}

export interface AiChatResponse {
  reply: string;
  isDestinationQuery?: boolean;
  destination?: string;
  bestTime?: string;
  visaStatus?: string;
  destinationCard?: DestinationCardInfo;
  preferences?: Partial<TravelPreferences>;
  itinerary?: AiItinerary | null;
  weatherForecast?: WeatherDay[];
  nearbyAttractions?: string[];
  nearbyRestaurants?: string[];
  matchedTrips?: any[];
  recommendedTrips?: any[];
}

/**
 * Communicates directly with the Qarwaan AI server endpoint.
 * Strictly no mock fallbacks or client-side API keys.
 * Errors surface directly to the UI.
 */
export async function askQarwaanAi(params: AskQarwaanAiParams): Promise<AiChatResponse> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMessage = `AI request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData?.error) {
        errorMessage = errData.error;
      }
    } catch {
      // response was not JSON
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AiChatResponse;
}

export function getDestinationCoverImage(dest: string, fallbackUrl?: string): string {
  const q = (dest || "").toLowerCase();
  if (q.includes("maldives")) return "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("vietnam") || q.includes("hanoi") || q.includes("da nang") || q.includes("hoi an")) return "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("rajasthan") || q.includes("jaipur") || q.includes("udaipur") || q.includes("jodhpur") || q.includes("jaisalmer")) return "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("korea") || q.includes("seoul") || q.includes("busan") || q.includes("jeju")) return "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("china") || q.includes("beijing") || q.includes("shanghai") || q.includes("great wall")) return "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("japan") || q.includes("tokyo") || q.includes("kyoto") || q.includes("osaka")) return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("dubai") || q.includes("uae") || q.includes("abu dhabi")) return "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("thailand") || q.includes("bangkok") || q.includes("phuket") || q.includes("krabi")) return "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("ladakh") || q.includes("leh") || q.includes("pangong")) return "/images/ladakh/ladakh-cover.png";
  if (q.includes("kashmir") || q.includes("srinagar") || q.includes("gulmarg")) return "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("kerala") || q.includes("munnar") || q.includes("alleppey") || q.includes("kochi")) return "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("goa")) return "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("andaman") || q.includes("havelock")) return "/images/andaman/Andaman Main Photo.jpeg";
  if (q.includes("bhutan")) return "/images/bhutan/bhutan-main.png";
  if (q.includes("nepal")) return "/images/nepal/Nepal Main Photo.avif";
  if (q.includes("coorg")) return "/images/coorg/main.png";
  if (q.includes("darjeeling")) return "/images/darjeeling/main-image.png";
  if (q.includes("switzerland") || q.includes("swiss") || q.includes("zurich") || q.includes("lucerne")) return "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("europe") || q.includes("paris") || q.includes("france") || q.includes("italy") || q.includes("rome")) return "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("singapore")) return "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("sri lanka")) return "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("turkey") || q.includes("istanbul")) return "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("greece") || q.includes("santorini")) return "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("iceland")) return "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("bali") || q.includes("ubud") || q.includes("seminyak")) return "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80";

  if (fallbackUrl && fallbackUrl.startsWith("http")) return fallbackUrl;
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";
}
