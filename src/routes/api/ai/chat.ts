import { createFileRoute } from "@tanstack/react-router";
import { QARWAAN_ITINERARIES } from "@/data/qarwaan-itineraries";

function getAiConfig() {
  let key = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!key) {
    try {
      const fs = require("node:fs");
      const path = require("node:path");
      const candidates = [
        path.resolve(process.cwd(), ".env"),
        path.resolve(process.cwd(), "backend/.env"),
      ];
      for (const envPath of candidates) {
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, "utf-8");
          for (const line of content.split("\n")) {
            const match = line.match(/^\s*(AI_API_KEY|GEMINI_API_KEY)\s*=\s*(.*)$/);
            if (match && match[2]) {
              key = match[2].trim().replace(/^['"]|['"]$/g, "");
              process.env[match[1]] = key;
              break;
            }
          }
          if (key) break;
        }
      }
    } catch {
      // ignore in browser or restricted environments
    }
  }

  const endpoint =
    process.env.AI_API_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

  const configuredModel = process.env.AI_MODEL || "gemini-flash-lite-latest";
  const candidateModels = [
    configuredModel,
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  return { key, endpoint, candidateModels };
}

const CATALOGUE_SNIPPETS = QARWAAN_ITINERARIES.map((trip) => ({
  id: trip.id,
  title: trip.packageName,
  slug: trip.slug,
  destination: trip.citiesCovered.join(", "),
  duration: trip.duration,
  durationDays: trip.durationDays,
  bestSeason: trip.bestSeason.join(", "),
  tripType: trip.tripType,
  idealFor: trip.idealFor,
  startingBudget: trip.budgetFrom,
  coverImage: trip.coverImage,
  overview: trip.detailedOverview.slice(0, 320),
  keyExperiences: trip.keyExperiences.slice(0, 6),
}));

function buildSystemPrompt() {
  return `You are Qarwaan AI, an elite AI Travel Concierge for "Qarwaan" (a luxury travel agency).

RESPONSE FORMAT RULES:
- ALWAYS format answers using concise, structured bullet points rather than long paragraphs.
- Keep tone warm, clear, and easy to read.

TRIGGER RULE FOR DESTINATIONS & COUNTRIES:
- Whenever the user's message references ANY country, region, city, or place (e.g., "Japan", "France", "Bali", "Rajasthan", "Vietnam", "Maldives", "Korea", "Dubai", "Switzerland", "Thailand", etc.), you MUST provide the structured point-based guide AND append the valid \`\`\`json ... \`\`\` metadata block at the very end of your response, EVEN IF the user is asking about budget, packing, food, timing, safety, flights, currency, or general travel tips for that location (e.g., "my budget for japan is 3 lakh rupees", "how to pack for japan", "is tokyo safe?", "what currency does vietnam use?").
- You MUST treat any mention of a country, region, or city as a destination query and generate the trailing \`\`\`json ... \`\`\` block.

MARKDOWN STRUCTURE FOR INTENT B (DESTINATION QUERIES):
When responding to a destination query, format your markdown body strictly using clean section titles (NO \`#####\` or raw markdown heading hashes). 

ICON & TYPOGRAPHY STYLE RULES:
- Use clean, minimal, single-tone outlined icons for section headers (e.g., 🗺️, 🏛️, 🏨, 💡, 📍).
- STRICTLY AVOID cartoonish, multi-colored, or play-style icons in the narrative text.
- Use bold text headers and bullet points for effortless scannability.

REQUIRED MARKDOWN STRUCTURE:

✨ **The Essence**
- High-level overview of the destination, atmosphere, and travel vibe.

🗺️ **Day-by-Day Itinerary**
Day 1: [Catchy Day Title]
- **Morning:** [Detailed activity, cultural sight, or transfer]
- **Afternoon:** [Core highlight or exploration]
- **Evening:** [Dining, local experience, or nightlife tip]

Day 2: [Catchy Day Title]
- **Morning:** [Detailed activity]
- **Afternoon:** [Detailed activity]
- **Evening:** [Detailed activity]

(Continue for all requested or recommended days...)

🏨 **Premium Stay & Resort Recommendations**
- **[City/Region Name]:** [Hotel/Resort Name] ([Star Rating])
  - **Why you'll love it:** [Concise highlight covering location, luxury amenities, views, or service]

- **[City/Region Name]:** [Hotel/Resort Name] ([Star Rating])
  - **Why you'll love it:** [Concise highlight]

💡 **Insider Travel Tips**
- **Connectivity:** [eSIM / Pocket Wi-Fi advice]
- **Transport:** [Local transit / train card recommendations]
- **Dining & Currency:** [Reservations & payment advice]

MANDATORY DESTINATION HERO CARD RULE:
1. If the user's message contains ANY country name, state, region, city, or landmark (e.g., "China", "Rajasthan", "Japan", "Vietnam", "Bali", "Paris", "Maldives", "Tokyo", "London", etc.) — regardless of how long or conversational the question is — you MUST append the trailing \`\`\`json ... \`\`\` code block at the very end of your response.
2. NEITHER omit the JSON block NOR return raw text alone when a place name is mentioned.
3. If the user specifies an itinerary length (e.g. "12 day trip to china", "7 days in rajasthan"), the Day-by-Day Itinerary in markdown AND your trailing \`\`\`json ... \`\`\` block MUST generate all requested days (e.g. 12 days -> 12 day objects in the \`itinerary\` array).

JSON SCHEMA STRUCTURE TO APPEND:
\`\`\`json
{
  "isDestinationQuery": true,
  "destination": "China",
  "bestTime": "September to November & April to May",
  "visaStatus": "L-Tourist Visa Required / Check 240-Hour Transit Guidelines",
  "rating": "4.8 Exceptional",
  "durationDays": 12,
  "travelers": "2 Travellers",
  "coverImageUrl": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d",
  "itinerary": [
    {
      "day": 1,
      "title": "Beijing Arrival & Houhai Lake Exploration",
      "insiderTip": "Download Alipay and WeChat Pay before landing; foreign credit cards are rarely accepted.",
      "points": [
        "Arrival in Beijing and private transfer to your hotel.",
        "Evening stroll around the scenic Houhai Lake area.",
        "Welcome dinner featuring authentic local Beijing delicacies."
      ]
    }
  ]
}
\`\`\`

FAQ & NON-DESTINATION QUERIES:
- If the user query is a general question (e.g., "cancellation policy", "payment methods", "camera advice", "luggage weight limits") and does NOT mention any specific country, region, or destination, answer directly using clear, scannable bullet points.
- DO NOT generate a day-by-day itinerary.
- DO NOT append any JSON block.

BRAND STYLING & COLORS:
- Brand Color: Deep Green (#004643). Zero purple accents allowed.`;
}

function getDestinationBestTime(dest: string): string {
  const q = (dest || "").toLowerCase();
  if (q.includes("japan") || q.includes("tokyo")) return "March to May & September to November";
  if (q.includes("korea")) return "September to November & April to June";
  if (q.includes("bali")) return "April to October (Dry Season)";
  if (q.includes("vietnam")) return "November to April (Pleasant Climate)";
  if (q.includes("rajasthan")) return "October to March (Royal Season)";
  if (q.includes("france") || q.includes("paris")) return "April to October";
  if (q.includes("italy") || q.includes("rome")) return "April to June & September to October";
  if (q.includes("switzerland")) return "June to September & December to March";
  if (q.includes("maldives")) return "November to April (Sunny Dry Season)";
  if (q.includes("dubai")) return "November to March (Cool Season)";
  if (q.includes("thailand")) return "November to April (Tropical Dry)";
  if (q.includes("singapore")) return "Year-round (November to January pleasant)";
  if (q.includes("greece")) return "May to October (Mediterranean Summer)";
  if (q.includes("turkey")) return "April to May & September to October";
  if (q.includes("iceland")) return "June to August & Sep to Mar (Northern Lights)";
  if (q.includes("ladakh")) return "May to September (High Altitude Season)";
  if (q.includes("kashmir")) return "March to August & Dec to Feb (Snow)";
  if (q.includes("china") || q.includes("beijing") || q.includes("shanghai")) return "September to November & April to May";
  if (q.includes("kerala")) return "September to March";
  if (q.includes("goa")) return "November to February";
  return "October to April (Optimal Season)";
}

function getDestinationVisaStatus(dest: string): string {
  const q = (dest || "").toLowerCase();
  if (q.includes("china")) return "L-Tourist Visa Required / Check 240-Hour Transit Guidelines";
  if (q.includes("japan")) return "Tourist e-Visa / Embassy visa required";
  if (q.includes("korea")) return "K-ETA or Tourist Visa required";
  if (q.includes("bali") || q.includes("indonesia")) return "30-day Visa on Arrival (e-VOA available)";
  if (q.includes("vietnam")) return "30-day single/multiple entry e-Visa available";
  if (q.includes("france") || q.includes("italy") || q.includes("switzerland") || q.includes("greece") || q.includes("iceland") || q.includes("europe")) return "Schengen Visa required for non-EU travelers";
  if (q.includes("maldives")) return "30-day free Visa on Arrival for all tourists";
  if (q.includes("dubai") || q.includes("uae")) return "Pre-arranged 30/60-day tourist visa";
  if (q.includes("thailand")) return "Visa Exemption or Visa on Arrival (VOA)";
  if (q.includes("singapore")) return "SG Arrival Card + Tourist Visa";
  if (q.includes("turkey")) return "e-Visa available for eligible passport holders";
  if (q.includes("rajasthan") || q.includes("ladakh") || q.includes("kashmir") || q.includes("kerala") || q.includes("goa")) return "Domestic travel: valid photo ID; International: Indian e-Visa";
  return "Check local entry & visa guidelines";
}

function extractDurationFromQuery(text: string): number {
  const match = (text || "").match(/\b(\d+)\s*(?:[- ]?day|days|nights|night)\b/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0 && val <= 30) return val;
  }
  return 0;
}

function extractTravellersFromQuery(text: string): number {
  const match = (text || "").match(/\b(\d+)\s*(?:people|persons|travellers|travelers|guests|adults)\b/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0 && val <= 50) return val;
  }
  if (/\b(?:solo|alone)\b/i.test(text)) return 1;
  if (/\b(?:couple|honeymoon|duo|two of us)\b/i.test(text)) return 2;
  return 2;
}

interface ParsedItineraryDay {
  day: number;
  title: string;
  activities: string[];
  places: string[];
  localTip: string;
}

function extractItineraryFromMarkdown(markdownText: string, destination: string, userQuery: string) {
  const duration = extractDurationFromQuery(userQuery) || 0;
  const travellers = extractTravellersFromQuery(userQuery);
  const coverImage = getDestinationCoverImage(destination);

  const lines = (markdownText || "").split("\n");
  const parsedDays: ParsedItineraryDay[] = [];

  let currentDay: ParsedItineraryDay | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Detect if we hit a different main section that marks the end of the Day-by-Day Itinerary
    if (
      /^[🏨💡🏛️🍽️]/.test(trimmed) ||
      /^\*{0,2}(Premium Stay|Insider Travel Tips|Insider Tips|Hotels|Where to Stay|Packing Tips)/i.test(trimmed)
    ) {
      if (currentDay && currentDay.activities.length) {
        parsedDays.push(currentDay);
        currentDay = null;
      }
      continue;
    }

    // Skip section headers like "Day-by-Day Itinerary"
    if (/Day-by-Day Itinerary/i.test(trimmed)) {
      continue;
    }

    // Check if line is a Day header (e.g. Day 1: ..., **Day 1: ...**, Day 1 - ...)
    const dayMatch = trimmed.match(/^#{0,6}\s*\*{0,2}Day\s+(\d+)[:\-–—\s*]+(.*?)(?:\*{0,2})$/i);
    if (dayMatch) {
      if (currentDay && currentDay.activities.length) {
        parsedDays.push(currentDay);
      }
      const dayNum = parseInt(dayMatch[1], 10) || (parsedDays.length + 1);
      let dayTitle = dayMatch[2].replace(/^\*+|\*+$/g, "").replace(/^[:\-–—\s]+/, "").trim();
      if (!dayTitle) dayTitle = `Explore ${destination}`;
      currentDay = {
        day: dayNum,
        title: dayTitle,
        activities: [],
        places: [],
        localTip: "",
      };
      continue;
    }

    // If we're inside a day, collect bullet points or activities
    if (currentDay) {
      // Check for Tip lines
      const tipMatch = trimmed.match(/^[-*•]?\s*\*{0,2}(?:Tip|Insider Tip|Local Tip)[:\*]\s*(.*)$/i);
      if (tipMatch) {
        currentDay.localTip = tipMatch[1].replace(/^\*+|\*+$/g, "").trim();
        continue;
      }

      // Check for bullet items (e.g. - **Morning:** ..., * **Afternoon:** ..., - Activity...)
      if (/^[-*•]\s+/.test(trimmed)) {
        const actText = trimmed.replace(/^[-*•]\s+/, "").trim();
        const cleanedAct = actText.replace(/^\*\*([^*:]+)\*{0,2}:?\s*/i, "$1: ").trim();
        if (cleanedAct.length > 5) {
          currentDay.activities.push(cleanedAct);
        }
        continue;
      }

      // Check if it's a bold slot without leading dash (e.g. **Morning:** ...)
      if (/^\*\*(Morning|Afternoon|Evening)\*\*:?\s*/i.test(trimmed)) {
        const cleanedAct = trimmed.replace(/^\*\*([^*:]+)\*{0,2}:?\s*/i, "$1: ").trim();
        if (cleanedAct.length > 5) {
          currentDay.activities.push(cleanedAct);
        }
        continue;
      }
    }
  }

  if (currentDay && currentDay.activities.length) {
    parsedDays.push(currentDay);
  }

  if (parsedDays.length > 0) {
    for (const d of parsedDays) {
      if (!d.activities.length) {
        d.activities = [`Explore highlights of ${d.title || destination}`];
      }
      if (!d.localTip) {
        d.localTip = `Check opening times and reserve activities in ${destination} in advance.`;
      }
    }

    const finalDuration = duration || parsedDays.length;

    return {
      title: `${destination}: Curated Journey`,
      destination,
      durationDays: finalDuration,
      travellers,
      coverImage,
      overview: `A bespoke luxury journey through ${destination}.`,
      days: parsedDays,
    };
  }

  // Dynamic fallback if no Day headers were found in markdown text
  const finalDuration = duration || 5;
  const dynamicDays: ParsedItineraryDay[] = [];
  const attractions = getFallbackAttractions(destination);

  for (let d = 1; d <= finalDuration; d++) {
    const attraction = attractions[(d - 1) % attractions.length] || `Highlights of ${destination}`;
    const cleanAttr = attraction.split("–")[0].trim();
    dynamicDays.push({
      day: d,
      title: d === 1 ? `Arrival & Welcome in ${destination}` : d === finalDuration ? `Bespoke Farewell & Departure from ${destination}` : `Exploring ${cleanAttr}`,
      activities: [
        `Morning: Curated exploration of ${cleanAttr}.`,
        `Afternoon: Immersive cultural encounter and leisure stroll through artisanal quarters.`,
        `Evening: Private sunset dining experience featuring celebrated local gastronomy.`,
      ],
      places: [],
      localTip: `Pre-reserve private entries and allow leisurely transit time across ${destination}.`,
    });
  }

  return {
    title: `${destination}: Curated Journey`,
    destination,
    durationDays: finalDuration,
    travellers,
    coverImage,
    overview: `A bespoke luxury journey through ${destination}.`,
    days: dynamicDays,
  };
}

function parseConciergeResponse(content: string, userQuery: string) {
  if (!content || typeof content !== "string") {
    throw new Error("Empty response from AI model");
  }

  const rawText = content.trim();

  // Check for the trailing or embedded ```json ... ``` block
  const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
  const match = rawText.match(jsonBlockRegex);

  if (match) {
    try {
      const parsedJson = JSON.parse(match[1]);
      if (parsedJson.isDestinationQuery !== false && (parsedJson.destination || parsedJson.itinerary)) {
        // INTENT B: Destination Query / Itinerary Request
        const cleanReply = rawText.replace(match[0], "").trim();
        const destination = parsedJson.destination || detectDestinationFromText(userQuery);
        const coverImage =
          parsedJson.coverImageUrl && parsedJson.coverImageUrl.startsWith("http")
            ? parsedJson.coverImageUrl
            : getDestinationCoverImage(destination);

        const bestTime = parsedJson.bestTime || getDestinationBestTime(destination);
        const visaStatus = parsedJson.visaStatus || getDestinationVisaStatus(destination);
        const rating = parsedJson.rating || "4.8 Exceptional";

        const rawItineraryDays = Array.isArray(parsedJson.itinerary) ? parsedJson.itinerary : [];
        let itineraryDays = rawItineraryDays.map((d: any, idx: number) => {
          let points: string[] = [];
          if (Array.isArray(d.points)) {
            points = d.points.map((p: any) => String(p).trim()).filter(Boolean);
          } else if (Array.isArray(d.activities)) {
            points = d.activities.map((p: any) => String(p).trim()).filter(Boolean);
          } else if (typeof d.points === "string") {
            points = [d.points.trim()];
          } else if (typeof d.activities === "string") {
            points = [d.activities.trim()];
          }
          return {
            day: typeof d.day === "number" ? d.day : idx + 1,
            title: d.title || `Day ${idx + 1}`,
            activities: points.length ? points : [`Explore highlights of ${destination}`],
            places: Array.isArray(d.places) ? d.places : [],
            localTip: d.insiderTip || d.localTip || d.tip || "",
          };
        });

        const queryDuration = extractDurationFromQuery(userQuery);
        const queryTravellers = extractTravellersFromQuery(userQuery);

        // If JSON had an empty itinerary array or fewer days than requested in user query,
        // extract richer days directly from cleanReply markdown:
        if (itineraryDays.length === 0 || (queryDuration > 0 && itineraryDays.length < queryDuration)) {
          const markdownItin = extractItineraryFromMarkdown(cleanReply, destination, userQuery);
          if (markdownItin && markdownItin.days.length >= itineraryDays.length) {
            itineraryDays = markdownItin.days;
          }
        }

        const durationDays =
          parsedJson.durationDays ||
          parsedJson.duration_days ||
          itineraryDays.length ||
          queryDuration ||
          5;

        const rawTravellers = parsedJson.travellers || parsedJson.travelers;
        const travellers =
          (typeof rawTravellers === "number" ? rawTravellers : parseInt(String(rawTravellers || ""), 10)) ||
          queryTravellers ||
          2;

        const itinerary = itineraryDays.length
          ? {
              title: `${destination}: Curated Journey`,
              destination,
              durationDays: Math.max(durationDays, itineraryDays.length),
              travellers,
              coverImage,
              overview: parsedJson.overview || `A bespoke luxury journey through ${destination}.`,
              days: itineraryDays,
            }
          : extractItineraryFromMarkdown(cleanReply, destination, userQuery);

        const destinationCard = {
          name: destination,
          tag: "POPULAR DESTINATION",
          rating,
          coverImage,
          bestTime,
          visaStatus,
        };

        return {
          isDestinationQuery: true,
          reply: cleanReply || `✨ Welcome to **${destination}**! Here is your curated luxury guide and journey.`,
          destination,
          bestTime,
          visaStatus,
          destinationCard,
          itinerary,
        };
      }
    } catch (err) {
      console.warn("Could not parse embedded JSON in response:", err);
    }
  }

  // Fallback: If AI forgot or omitted the JSON block, but user asked about a destination/country
  const detectedDest = detectDestinationFromText(userQuery, "") || detectDestinationFromText(rawText, "");
  if (detectedDest) {
    const cleanReply = rawText.replace(/^```(?:markdown)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const coverImage = getDestinationCoverImage(detectedDest);
    const bestTime = getDestinationBestTime(detectedDest);
    const visaStatus = getDestinationVisaStatus(detectedDest);
    const rating = "4.9 Exceptional";

    const itinerary = extractItineraryFromMarkdown(cleanReply, detectedDest, userQuery);

    const destinationCard = {
      name: detectedDest,
      tag: "POPULAR DESTINATION",
      rating,
      coverImage,
      bestTime,
      visaStatus,
    };

    return {
      isDestinationQuery: true,
      reply: cleanReply,
      destination: detectedDest,
      bestTime,
      visaStatus,
      destinationCard,
      itinerary,
    };
  }

  // INTENT A: General FAQ / Non-Destination Query
  const cleanFaq = rawText
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return {
    isDestinationQuery: false,
    reply: cleanFaq,
    destination: undefined,
    bestTime: undefined,
    visaStatus: undefined,
    destinationCard: undefined,
    itinerary: null,
  };
}

function detectDestinationFromText(text: string, fallback = "Bali"): string {
  if (!text || typeof text !== "string") return fallback !== "Destination" ? fallback : "Bali";
  const q = text.toLowerCase();

  // 1. Direct country/city keyword matching for top global destinations
  if (q.includes("china") || q.includes("beijing") || q.includes("shanghai") || q.includes("xi'an") || q.includes("xian") || q.includes("guilin") || q.includes("chengdu") || q.includes("hong kong") || q.includes("great wall")) return "China";
  if (q.includes("japan") || q.includes("tokyo") || q.includes("kyoto") || q.includes("osaka") || q.includes("hokkaido") || q.includes("fuji")) return "Japan";
  if (q.includes("paris") || q.includes("eiffel") || q.includes("france") || q.includes("nice") || q.includes("lyon")) return "France";
  if (q.includes("london") || q.includes("uk") || q.includes("england") || q.includes("britain") || q.includes("scotland") || q.includes("edinburgh")) return "London";
  if (q.includes("rome") || q.includes("florence") || q.includes("venice") || q.includes("italy") || q.includes("milan") || q.includes("amalfi") || q.includes("tuscany")) return "Italy";
  if (q.includes("korea") || q.includes("seoul") || q.includes("busan") || q.includes("jeju")) return "South Korea";
  if (q.includes("bali") || q.includes("ubud") || q.includes("seminyak") || q.includes("canggu") || q.includes("kuta") || q.includes("uluwatu") || q.includes("indonesia") || q.includes("lombok") || q.includes("komodo")) return "Bali";
  if (q.includes("dubai") || q.includes("uae") || q.includes("abu dhabi")) return "Dubai";
  if (q.includes("vietnam") || q.includes("hanoi") || q.includes("da nang") || q.includes("ho chi minh") || q.includes("hoi an") || q.includes("ha long")) return "Vietnam";
  if (q.includes("thailand") || q.includes("bangkok") || q.includes("phuket") || q.includes("krabi") || q.includes("chiang mai") || q.includes("koh samui")) return "Thailand";
  if (q.includes("ladakh") || q.includes("leh") || q.includes("pangong") || q.includes("nubra")) return "Ladakh";
  if (q.includes("kashmir") || q.includes("srinagar") || q.includes("gulmarg") || q.includes("pahalgam")) return "Kashmir";
  if (q.includes("kerala") || q.includes("munnar") || q.includes("alleppey") || q.includes("kochi") || q.includes("thekkady")) return "Kerala";
  if (q.includes("goa") || q.includes("panaji")) return "Goa";
  if (q.includes("rajasthan") || q.includes("jaipur") || q.includes("udaipur") || q.includes("jodhpur") || q.includes("jaisalmer") || q.includes("pushkar")) return "Rajasthan";
  if (q.includes("spiti") || q.includes("kaza")) return "Spiti Valley";
  if (q.includes("andaman") || q.includes("havelock") || q.includes("neil island")) return "Andaman";
  if (q.includes("bhutan") || q.includes("paro") || q.includes("thimphu") || q.includes("punakha")) return "Bhutan";
  if (q.includes("nepal") || q.includes("kathmandu") || q.includes("pokhara") || q.includes("everest")) return "Nepal";
  if (q.includes("switzerland") || q.includes("swiss") || q.includes("zurich") || q.includes("lucerne") || q.includes("interlaken") || q.includes("geneva") || q.includes("zermatt")) return "Switzerland";
  if (q.includes("greece") || q.includes("santorini") || q.includes("athens") || q.includes("mykonos") || q.includes("crete")) return "Greece";
  if (q.includes("turkey") || q.includes("istanbul") || q.includes("cappadocia") || q.includes("antalya")) return "Turkey";
  if (q.includes("singapore")) return "Singapore";
  if (q.includes("maldives")) return "Maldives";
  if (q.includes("iceland") || q.includes("reykjavik")) return "Iceland";
  if (q.includes("norway") || q.includes("oslo") || q.includes("bergen") || q.includes("fjord")) return "Norway";
  if (q.includes("egypt") || q.includes("cairo") || q.includes("giza") || q.includes("luxor")) return "Egypt";
  if (q.includes("spain") || q.includes("barcelona") || q.includes("madrid") || q.includes("seville") || q.includes("ibiza")) return "Spain";
  if (q.includes("germany") || q.includes("berlin") || q.includes("munich") || q.includes("bavaria")) return "Germany";
  if (q.includes("australia") || q.includes("sydney") || q.includes("melbourne") || q.includes("brisbane") || q.includes("cairns")) return "Australia";
  if (q.includes("new zealand") || q.includes("auckland") || q.includes("queenstown")) return "New Zealand";
  if (q.includes("sri lanka") || q.includes("colombo") || q.includes("kandy") || q.includes("galle") || q.includes("ella")) return "Sri Lanka";
  if (q.includes("malaysia") || q.includes("kuala lumpur") || q.includes("penang") || q.includes("langkawi")) return "Malaysia";
  if (q.includes("philippines") || q.includes("manila") || q.includes("boracay") || q.includes("palawan") || q.includes("cebu")) return "Philippines";
  if (q.includes("portugal") || q.includes("lisbon") || q.includes("porto") || q.includes("algarve")) return "Portugal";
  if (q.includes("austria") || q.includes("vienna") || q.includes("salzburg")) return "Austria";
  if (q.includes("netherlands") || q.includes("amsterdam")) return "Netherlands";
  if (q.includes("czech") || q.includes("prague")) return "Prague";
  if (q.includes("hungary") || q.includes("budapest")) return "Budapest";
  if (q.includes("ireland") || q.includes("dublin")) return "Ireland";
  if (q.includes("croatia") || q.includes("dubrovnik") || q.includes("split")) return "Croatia";
  if (q.includes("morocco") || q.includes("marrakech") || q.includes("casablanca")) return "Morocco";
  if (q.includes("south africa") || q.includes("cape town") || q.includes("kruger")) return "South Africa";
  if (q.includes("kenya") || q.includes("nairobi") || q.includes("masai mara")) return "Kenya";
  if (q.includes("tanzania") || q.includes("serengeti") || q.includes("zanzibar")) return "Tanzania";
  if (q.includes("mauritius")) return "Mauritius";
  if (q.includes("seychelles")) return "Seychelles";
  if (q.includes("saudi") || q.includes("riyadh") || q.includes("jeddah") || q.includes("alula")) return "Saudi Arabia";
  if (q.includes("qatar") || q.includes("doha")) return "Qatar";
  if (q.includes("oman") || q.includes("muscat")) return "Oman";
  if (q.includes("jordan") || q.includes("petra") || q.includes("amman")) return "Jordan";
  if (q.includes("usa") || q.includes("united states") || q.includes("america") || q.includes("new york") || q.includes("california") || q.includes("las vegas") || q.includes("hawaii")) return "United States";
  if (q.includes("canada") || q.includes("vancouver") || q.includes("toronto") || q.includes("banff")) return "Canada";
  if (q.includes("mexico") || q.includes("cancun") || q.includes("tulum")) return "Mexico";
  if (q.includes("peru") || q.includes("machu picchu") || q.includes("cusco") || q.includes("lima")) return "Peru";
  if (q.includes("brazil") || q.includes("rio de janeiro")) return "Brazil";
  if (q.includes("europe")) return "Europe";

  // 2. Natural language pattern match: "trip to X", "travel to X", "holiday in X", "budget for X", etc.
  const nlMatch = text.match(/\b(?:trip to|travel to|tour to|journey to|escape to|holiday in|vacation in|visit|visiting|explore|exploring|budget for|fly to|heading to|going to|guide for|guide to)\s+([A-Za-z\s]{2,20}?)(?:\s+(?:for|with|include|including|in|on|at|during|and|over|\.|\?|,|$))/i);
  if (nlMatch && nlMatch[1]) {
    const rawDest = nlMatch[1].trim();
    if (rawDest.length >= 3 && !/^(the|a|an|my|our|any|some|this|that)$/i.test(rawDest)) {
      return rawDest.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
  }

  // 3. Match from markdown headers in AI response, e.g. "Welcome to X", "Curated Journey to X"
  const welcomeMatch = text.match(/(?:welcome to|journey through|escape to|guide to)\s+\*?\*?([A-Za-z\s]{3,25}?)\*?\*?[!:\.\n]/i);
  if (welcomeMatch && welcomeMatch[1]) {
    const rawDest = welcomeMatch[1].trim();
    if (rawDest.length >= 3 && !/^(the|our|qarwaan|a|an)$/i.test(rawDest)) {
      return rawDest.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
  }

  return fallback !== "Destination" ? fallback : "Bali";
}

function formatSingleAttraction(item: any): string {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object") {
    const name = item.name || item.title || item.attraction || "Attraction";
    const loc = item.location || item.city || item.region ? ` (${item.location || item.city || item.region})` : "";
    const desc = item.description || item.notes || item.summary || item.details || item.tip || "";
    return `${name}${loc}${desc ? ` — ${desc}` : ""}`;
  }
  return "";
}

function formatSingleRestaurant(item: any): string {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object") {
    const name = item.name || item.restaurant || item.title || "Dining Spot";
    const locOrCuisine = [item.cuisine, item.location || item.city].filter(Boolean).join(", ");
    const locTag = locOrCuisine ? ` (${locOrCuisine})` : "";
    const desc = item.specialty || item.description || item.notes || item.highlight || "";
    return `${name}${locTag}${desc ? ` — ${desc}` : ""}`;
  }
  return "";
}

/**
 * Splits run-on activity strings into concise, distinct bullet points.
 */
function cleanActivities(rawActs: any, fallbackSummary = ""): string[] {
  const result: string[] = [];

  if (Array.isArray(rawActs) && rawActs.length > 0) {
    for (const item of rawActs) {
      const text = typeof item === "string" ? item.trim() : (item?.activity || item?.title || item?.description || "").trim();
      if (!text) continue;

      if (text.includes("\n") || text.includes("•")) {
        const parts = text.split(/\n|•/).map((s: string) => s.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
        result.push(...parts);
      } else if (text.length > 130 && text.includes(". ")) {
        // Long run-on sentence: break by sentence boundary
        const parts = text.split(/\.\s+/).map((s: string) => s.replace(/^[-*]\s*/, "").replace(/\.$/, "").trim()).filter(Boolean);
        result.push(...parts);
      } else {
        result.push(text.replace(/^[-*]\s*/, ""));
      }
    }
  } else if (fallbackSummary && typeof fallbackSummary === "string") {
    const parts = fallbackSummary.split(/\n|•|\.\s+/).map((s: string) => s.replace(/^[-*]\s*/, "").replace(/\.$/, "").trim()).filter(Boolean);
    result.push(...(parts.length ? parts : [fallbackSummary]));
  }

  return result.filter((s) => s.length > 3);
}

function getDestinationCoverImage(dest: string, fallbackUrl?: string): string {
  const q = (dest || "").toLowerCase();
  if (q.includes("maldives")) return "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("vietnam") || q.includes("hanoi") || q.includes("da nang")) return "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80";
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
  if (q.includes("switzerland") || q.includes("swiss") || q.includes("zurich")) return "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("europe") || q.includes("paris") || q.includes("france") || q.includes("italy")) return "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("singapore")) return "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80";
  if (q.includes("bali") || q.includes("ubud") || q.includes("seminyak")) return "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80";

  if (fallbackUrl && fallbackUrl.startsWith("http")) return fallbackUrl;

  const matched = CATALOGUE_SNIPPETS.find((t) =>
    t.title.toLowerCase().includes(q) ||
    t.destination.toLowerCase().includes(q)
  );
  if (matched?.coverImage) return matched.coverImage;

  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";
}

function getFallbackAttractions(dest: string): string[] {
  const q = (dest || "").toLowerCase();
  if (q.includes("china")) return [
    "The Great Wall of China (Mutianyu) – Majestic ancient fortification winding through mountain ridges",
    "The Forbidden City (Beijing) – Imperial palace complex with 600 years of dynastic history",
    "Terracotta Army (Xi'an) – Grand underground army of thousands of life-sized clay warriors",
    "The Bund & Yu Garden (Shanghai) – Historic waterfront skyline paired with classical Ming dynasty gardens"
  ];
  if (q.includes("maldives")) return [
    "Baa Atoll UNESCO Biosphere Reserve – World-renowned marine sanctuary with manta rays and sea turtles",
    "Vaadhoo Island Sea of Stars – Magical bioluminescent beach glowing in the night waters",
    "Maafushi Island – Vibrant local island known for water sports and authentic Maldivian culture",
    "Malé Old Friday Mosque & National Museum – Intriguing historical coral-stone architecture"
  ];
  if (q.includes("rajasthan")) return [
    "Amber Fort & Palace (Jaipur) – Grand Rajput fortress with Sheesh Mahal mirror palace",
    "City Palace & Lake Pichola (Udaipur) – Fairytale palace with romantic boat rides at sunset",
    "Mehrangarh Fort (Jodhpur) – Imposing clifftop citadel overlooking the Blue City",
    "Jaisalmer Golden Fort & Sam Sand Dunes – Living sand-stone fort and desert camel safaris"
  ];
  if (q.includes("vietnam")) return [
    "Ha Long Bay – Iconic emerald waters and thousands of towering limestone islands",
    "Hoi An Ancient Town – UNESCO-listed lantern-lit town with preserved timber merchant houses",
    "Old Quarter (Hanoi) – Bustling historic streets with street food and French colonial charm",
    "Golden Bridge at Ba Na Hills (Da Nang) – Giant stone hands holding a golden walkway in the clouds"
  ];
  if (q.includes("bali")) return [
    "Uluwatu Temple – Dramatic clifftop sea temple with sunset Kecak fire dance",
    "Tegallalang Rice Terraces (Ubud) – Emerald green cascading terraces and jungle swings",
    "Tirta Empul Holy Water Spring – Sacred Balinese Hindu water purification temple",
    "Nusa Penida Kelingking Beach – Breathtaking dinosaur-head limestone cliff and azure bay"
  ];
  if (q.includes("korea")) return [
    "Gyeongbokgung Palace (Seoul) – Grand dynastic royal palace with changing of the guard",
    "Bukchon Hanok Village – Preserved traditional wooden homes dating back 600 years",
    "N Seoul Tower – 360-degree panoramic skyline views across the capital basin",
    "Gamcheon Culture Village (Busan) – Vibrant hillside village of pastel-colored houses"
  ];
  return [
    `Iconic Historical Landmarks of ${dest} – Celebrated heritage and architecture`,
    `Scenic Panoramic Viewpoints – Breathtaking natural landscapes and vistas`,
    `Artisan Quarter & Local Markets – Vibrant cultural crafts and local life`
  ];
}

function getFallbackRestaurants(dest: string): string[] {
  const q = (dest || "").toLowerCase();
  if (q.includes("china")) return [
    "Quanjude Roast Duck (Beijing) – Historic culinary institution renowned for crispy wood-roasted Peking duck",
    "Lost Heaven (The Bund, Shanghai) – Celebrated Yunnan folk gastronomy in atmospheric colonial quarters",
    "De Fa Chang Dumpling Restaurant (Xi'an) – Renowned multi-course dumpling banquets with regional delicacies"
  ];
  if (q.includes("maldives")) return [
    "Ithaa Undersea Restaurant – Spectacular dining 5 meters beneath the Indian Ocean surface",
    "Subsix – Submerged dining lounge surrounded by coral gardens and marine life",
    "Overwater Grill & Sandbank Dining – Private candlelit seafood dinner on secluded sands"
  ];
  if (q.includes("rajasthan")) return [
    "1135 AD (Amber Fort, Jaipur) – Regal fine dining fit for maharajas in historic ramparts",
    "Ambrai (Udaipur) – Unrivaled lakeside dining with lit views of City Palace across Lake Pichola",
    "Indique (Jodhpur) – Rooftop dining with sweeping views of the illuminated Mehrangarh Fort"
  ];
  if (q.includes("vietnam")) return [
    "Morning Glory Original (Hoi An) – Legendary Vietnamese street food elevated to artisanal quality",
    "Quan An Ngon (Hanoi) – Celebrating diverse regional culinary classics under one roof",
    "Madame Lan (Da Nang) – Riverside dining with authentic Central Vietnamese delicacies"
  ];
  if (q.includes("bali")) return [
    "Locavore – Renowned modern fine dining celebrating Indonesian terroir and hyper-local produce",
    "Warung Babi Guling Ibu Oka (Ubud) – World-famous destination for traditional spiced suckling pig",
    "Jimbaran Bay Beachside Seafood – Fresh grilled ocean catch on candlelit tables right on the sand"
  ];
  if (q.includes("korea")) return [
    "Tosokchon Samgyetang (Seoul) – Revered ginseng chicken soup near the royal palace",
    "Myeongdong Kyoja – Michelin-recommended knife-cut kalguksu noodles and mandu dumplings",
    "Jungsik Seoul – Two-Michelin-starred modern Korean fine dining"
  ];
  return [
    `Traditional Heritage Kitchen in ${dest} – Time-honored family recipes and local classics`,
    `Scenic Sunset Dining Venue – Curated seasonal dining with panoramic views`,
    `Artisan Street Food Quarter – Sizzling street snacks and celebrated local specialties`
  ];
}

function normalizeAiResponse(parsed: any, userQuery = "") {
  let rawDest = parsed.destination || parsed.itinerary?.destination || "";
  if (!rawDest || rawDest.toLowerCase() === "destination") {
    rawDest = detectDestinationFromText(userQuery, "Bali");
  }
  const destination = rawDest;

  const bestTime =
    parsed.bestTime ||
    parsed.best_time ||
    parsed.bestSeason ||
    "October to April (Optimal Weather)";

  const visaStatus =
    parsed.visaStatus ||
    parsed.visa_status ||
    parsed.visa ||
    "Check local travel entry guidelines";

  // 1. Extract Attractions from multiple potential keys
  const rawAttractions =
    parsed.nearbyAttractions ||
    parsed.top_attractions ||
    parsed.attractions ||
    parsed.must_visit_attractions ||
    parsed.must_visit ||
    parsed.sights ||
    parsed.places_to_visit ||
    parsed.places ||
    [];

  let nearbyAttractions: string[] = (Array.isArray(rawAttractions) ? rawAttractions : [])
    .map(formatSingleAttraction)
    .filter(Boolean);

  if (!nearbyAttractions.length) {
    nearbyAttractions = getFallbackAttractions(destination);
  }

  // 2. Extract Restaurants from multiple potential keys
  const rawRestaurants =
    parsed.nearbyRestaurants ||
    parsed.top_restaurants ||
    parsed.restaurants ||
    parsed.food_spots ||
    parsed.dining ||
    parsed.culinary_recommendations ||
    parsed.food ||
    parsed.places_to_eat ||
    [];

  let nearbyRestaurants: string[] = (Array.isArray(rawRestaurants) ? rawRestaurants : [])
    .map(formatSingleRestaurant)
    .filter(Boolean);

  if (!nearbyRestaurants.length) {
    nearbyRestaurants = getFallbackRestaurants(destination);
  }

  // 3. Extract Itinerary with cleaned bullet points
  let itinerary: any = null;
  const rawItin =
    parsed.itinerary ||
    parsed.suggested_itinerary ||
    parsed.plan ||
    (Array.isArray(parsed.days) ? parsed.days : null);

  if (Array.isArray(rawItin)) {
    itinerary = {
      title: `${destination}: Curated Journey`,
      destination,
      durationDays: rawItin.length,
      travellers: parsed.travellers || parsed.duration_days || 2,
      overview: `A carefully designed ${rawItin.length}-day curated journey through ${destination}.`,
      highlights: nearbyAttractions.slice(0, 4),
      days: rawItin.map((d: any, idx: number) => ({
        day: d.day || idx + 1,
        title: d.title || `Day ${idx + 1}`,
        activities: cleanActivities(d.activities, d.description || d.summary),
        places: Array.isArray(d.places) ? d.places : [],
        localTip: d.localTip || d.tip || "",
      })),
    };
  } else if (rawItin && typeof rawItin === "object") {
    const rawDays = Array.isArray(rawItin.days)
      ? rawItin.days
      : Array.isArray(parsed.days)
        ? parsed.days
        : [];

    itinerary = {
      title: rawItin.title || `${destination}: Curated Journey`,
      destination: rawItin.destination || destination,
      durationDays: rawItin.durationDays || rawDays.length || 5,
      travellers: rawItin.travellers || parsed.travellers || 2,
      budgetEstimate: rawItin.budgetEstimate || rawItin.budget || "Customized Rates",
      travelStyle: rawItin.travelStyle || rawItin.style || "Cultural & Experiential",
      overview: rawItin.overview || "",
      highlights: Array.isArray(rawItin.highlights) && rawItin.highlights.length ? rawItin.highlights : nearbyAttractions.slice(0, 4),
      packingTips: Array.isArray(rawItin.packingTips) ? rawItin.packingTips : [],
      caveats: Array.isArray(rawItin.caveats) ? rawItin.caveats : [],
      coverImage: rawItin.coverImage || "",
      days: rawDays.map((d: any, idx: number) => ({
        day: d.day || idx + 1,
        title: d.title || `Day ${idx + 1}`,
        activities: cleanActivities(d.activities, d.description || d.summary),
        places: Array.isArray(d.places) ? d.places : [],
        localTip: d.localTip || d.tip || "",
      })),
    };
  }

  // 4. Clean Reply (NEVER brief, NEVER inject raw Day-by-Day dump)
  let rawReply =
    parsed.reply ||
    parsed.response ||
    parsed.message ||
    parsed.answer ||
    parsed.text ||
    parsed.content ||
    "";

  if (typeof rawReply !== "string") {
    rawReply = "";
  }

  let reply = rawReply.trim();

  // Guarantee that reply is ALWAYS a rich, comprehensive guide (never 1-2 lines)
  if (reply.length < 220) {
    const sections: string[] = [];
    sections.push(
      `### 🌟 Welcome to ${destination}: An Experiential Journey by Qarwaan\n\n` +
      `Few places on earth offer the transcendent allure, vibrant culture, and timeless scenery of **${destination}**. As your private luxury concierge at Qarwaan, I have curated a bespoke experience tailored to immerse you in the very best that ${destination} has to offer—balancing leisurely indulgence with authentic cultural discoveries.`
    );

    if (itinerary?.overview) {
      sections.push(`### 🗺️ Journey Overview\n${itinerary.overview}`);
    }

    if (nearbyAttractions.length) {
      sections.push(
        `### 🏛️ Must-Visit Highlights in ${destination}\n${nearbyAttractions.map((a) => `• **${a}**`).join("\n")}`
      );
    }

    if (nearbyRestaurants.length) {
      sections.push(
        `### 🍽️ Curated Culinary & Dining Experiences\n${nearbyRestaurants.map((r) => `• ${r}`).join("\n")}`
      );
    }

    sections.push(
      `### 💡 Concierge Travel Insights\n` +
      `• **Optimal Travel Season:** ${bestTime}\n` +
      `• **Entry & Visa:** ${visaStatus}\n` +
      `• **Curated Pace:** Private transfers and boutique luxury stays arranged for seamless exploration.`
    );

    reply = sections.join("\n\n");
  }

  // 5. Clean Weather Forecast
  let weatherForecast = Array.isArray(parsed.weatherForecast) ? parsed.weatherForecast : [];
  if (weatherForecast.length) {
    weatherForecast = weatherForecast.map((w: any, idx: number) => {
      let temp = typeof w.tempC === "number" ? w.tempC : parseInt(String(w.temperature || w.temp || 22), 10);
      if (isNaN(temp)) temp = 22;
      return {
        day: w.day || `Day ${idx + 1}`,
        tempC: temp,
        condition: w.condition || "Pleasant",
        icon: w.icon || (String(w.condition || "").toLowerCase().includes("rain") ? "rain" : String(w.condition || "").toLowerCase().includes("clear") ? "sun" : "cloud"),
      };
    });
  }

  const destinationCard = {
    name: destination,
    tag: "POPULAR DESTINATION",
    rating: "4.8 Exceptional",
    coverImage: getDestinationCoverImage(destination, itinerary?.coverImage),
    bestTime,
    visaStatus,
  };

  return {
    ...parsed,
    reply,
    destination,
    bestTime,
    visaStatus,
    destinationCard,
    weatherForecast,
    nearbyAttractions,
    nearbyRestaurants,
    itinerary,
  };
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      GET: async () => {
        const { candidateModels } = getAiConfig();
        return new Response(
          JSON.stringify({
            status: "online",
            models: candidateModels,
            catalog: CATALOGUE_SNIPPETS.slice(0, 10),
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const messages = Array.isArray(body.messages) ? body.messages : [];
          const preferences = body.preferences || {};
          const persona = body.persona || preferences.persona || "";

          if (!messages.length && !body.prompt) {
            return new Response(
              JSON.stringify({ error: "At least one message is required" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const { key: apiKey, endpoint, candidateModels } = getAiConfig();

          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "AI_API_KEY or GEMINI_API_KEY must be configured on the server." }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          }

          const formattedMessages = messages.length
            ? messages.map((m: { role: string; content: string }) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: String(m.content || "").slice(0, 4000),
              }))
            : [{ role: "user", content: String(body.prompt).slice(0, 4000) }];

          const systemPrompt = buildSystemPrompt();
          const personaContext = persona
            ? `ACTIVE TRIP PERSONA: ${persona}. Please optimize travel pacing, hotel vibe, experiences, and recommendations specifically for a ${persona}.`
            : "";

          const basePayload = {
            messages: [
              { role: "system", content: systemPrompt },
              ...(personaContext ? [{ role: "system", content: personaContext }] : []),
              ...(Object.keys(preferences).length
                ? [{ role: "system", content: `USER PREFERENCES: ${JSON.stringify(preferences)}` }]
                : []),
              ...formattedMessages,
            ],
            reasoning_effort: "low",
            temperature: 0.5,
          };

          let rawData: any = null;
          let lastErrorMsg = "";

          for (const modelName of candidateModels) {
            // Attempt 1: Gemini via OpenAI Chat Completions endpoint with reasoning_effort low
            try {
              const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...basePayload, model: modelName }),
              });

              if (res.ok) {
                rawData = await res.json();
                break;
              }

              const errText = await res.text();
              lastErrorMsg = `Model ${modelName} OpenAI endpoint returned status ${res.status}: ${errText.slice(0, 150)}`;
              console.warn(lastErrorMsg);
            } catch (fetchErr: any) {
              lastErrorMsg = `Model ${modelName} OpenAI fetch error: ${fetchErr?.message}`;
              console.warn(lastErrorMsg);
            }

            // Attempt 2: Direct Gemini generateContent native endpoint as fallback
            try {
              const nativeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
              const userQueryText = formattedMessages[formattedMessages.length - 1]?.content || "";
              const nativeRes = await fetch(nativeUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      role: "user",
                      parts: [{ text: `${systemPrompt}\n\nUSER REQUEST: ${userQueryText}` }],
                    },
                  ],
                  generationConfig: {
                    temperature: 0.5,
                  },
                }),
              });

              if (nativeRes.ok) {
                rawData = await nativeRes.json();
                break;
              }
              const nativeErr = await nativeRes.text();
              lastErrorMsg = `Model ${modelName} native endpoint status ${nativeRes.status}: ${nativeErr.slice(0, 150)}`;
              console.warn(lastErrorMsg);
            } catch (nativeErr: any) {
              lastErrorMsg = `Model ${modelName} native fetch error: ${nativeErr?.message}`;
              console.warn(lastErrorMsg);
            }
          }

          if (!rawData) {
            // Strictly NO canned answers. Surface the real error to the user!
            return new Response(
              JSON.stringify({
                error: `Gemini AI service unavailable: ${lastErrorMsg || "All models currently experiencing high demand. Please try again."}`,
              }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          }

          const userQuery = formattedMessages[formattedMessages.length - 1]?.content || "";
          const content =
            rawData.choices?.[0]?.message?.content ||
            rawData.candidates?.[0]?.content?.parts?.[0]?.text ||
            "";

          const parsed = parseConciergeResponse(content, userQuery);

          // Find catalogue match if destination query
          const matchedTrips =
            parsed.isDestinationQuery && parsed.destination
              ? CATALOGUE_SNIPPETS.filter(
                  (t) =>
                    t.destination.toLowerCase().includes(parsed.destination!.toLowerCase()) ||
                    parsed.destination!.toLowerCase().includes(t.destination.toLowerCase()),
                ).slice(0, 4)
              : [];

          return new Response(
            JSON.stringify({
              ...parsed,
              matchedTrips,
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (err: any) {
          console.error("Error in /api/ai/chat handler:", err);
          return new Response(
            JSON.stringify({
              error: err?.message || "Internal server error occurred while processing journey",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
