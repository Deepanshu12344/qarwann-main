const axios = require('axios');
const fallbackCatalogue = require('../data/qarwaanCatalogue');

const MAX_CATALOGUE_ITEMS = 18;

function cleanText(value, max = 300) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normalisePreferences(value = {}) {
  if (!value || typeof value !== 'object') return {};
  const keys = [
    'destination', 'travelMonth', 'startDate', 'durationDays', 'travellers', 'budget',
    'tripType', 'accommodation', 'interests', 'pace', 'specialRequests', 'persona',
  ];
  const result = {};
  for (const key of keys) {
    const item = value[key];
    if (Array.isArray(item)) result[key] = item.map((entry) => cleanText(entry, 80)).filter(Boolean).slice(0, 8);
    else if (typeof item === 'number' && Number.isFinite(item)) result[key] = item;
    else if (typeof item === 'string' && cleanText(item, 300)) result[key] = cleanText(item, 300);
  }
  return result;
}

function catalogueSummary(trip) {
  return {
    id: String(trip._id || trip.id || trip.slug),
    title: trip.packageName || trip.title,
    slug: trip.slug,
    destination: trip.citiesCovered?.join(', ') || trip.destination || trip.startPoint,
    duration: trip.duration,
    type: trip.tripType || trip.type,
    idealFor: trip.idealFor || [],
    bestSeason: trip.bestSeason || [],
    overview: cleanText(trip.detailedOverview || trip.overview, 520),
    highlights: (trip.keyExperiences || trip.highlights || []).slice(0, 8),
    coverImage: trip.coverImage || '',
  };
}

function scoreTrip(trip, search) {
  const haystack = [
    trip.packageName, trip.startPoint, trip.endPoint, trip.tripType,
    ...(trip.citiesCovered || []), ...(trip.idealFor || []), ...(trip.keyExperiences || []),
  ].join(' ').toLowerCase();
  return search.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

async function getRelevantCatalogue({ Trip, query, preferences }) {
  let allTrips = [];
  try {
    if (Trip && typeof Trip.find === 'function') {
      allTrips = await Trip.find({}).sort({ createdAt: -1 }).limit(80).lean();
    }
  } catch (err) {
    console.warn('MongoDB query not available, falling back to static catalogue:', err.message);
  }

  if (!allTrips || !allTrips.length) {
    allTrips = fallbackCatalogue;
  }

  const words = [query, preferences.destination, preferences.tripType, ...(preferences.interests || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
    .slice(0, 25);

  return allTrips
    .map((trip) => ({ trip, score: scoreTrip(trip, words) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CATALOGUE_ITEMS)
    .map(({ trip }) => catalogueSummary(trip));
}

function parseJson(content) {
  if (typeof content !== 'string') throw new Error('The AI provider returned an empty response.');
  const stripped = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('The AI provider returned an invalid response.');
    return JSON.parse(match[0]);
  }
}

function validDay(day, number) {
  if (!day || typeof day !== 'object') return null;
  const title = cleanText(day.title || day.location || `Day ${number}`, 100);
  const activities = Array.isArray(day.activities)
    ? day.activities.map((activity) => cleanText(activity, 180)).filter(Boolean).slice(0, 6)
    : [cleanText(day.morning, 180), cleanText(day.afternoon, 180), cleanText(day.evening, 180)].filter(Boolean);
  if (!title || !activities.length) return null;
  return {
    day: Number.isInteger(day.day) && day.day > 0 ? day.day : number,
    title,
    activities,
    places: Array.isArray(day.places) ? day.places.map((place) => cleanText(place, 100)).filter(Boolean).slice(0, 8) : [],
    localTip: cleanText(day.localTip || day.transportation || '', 280),
  };
}

function normaliseItinerary(value, catalogue = []) {
  if (!value || typeof value !== 'object') return null;
  const days = (Array.isArray(value.days) ? value.days : []).map(validDay).filter(Boolean).slice(0, 21);
  if (!days.length) return null;
  const destination = cleanText(value.destination, 120);
  const title = cleanText(value.title, 150);
  if (!destination || !title) return null;
  const candidate = catalogue.find((trip) =>
    [trip.title, trip.destination].some((item) => item?.toLowerCase().includes(destination.toLowerCase()) || destination.toLowerCase().includes(item?.toLowerCase() || '')),
  );
  return {
    title,
    destination,
    durationDays: Math.min(21, Math.max(days.length, Number(value.durationDays) || days.length)),
    travellers: Math.min(50, Math.max(1, Number(value.travellers) || 2)),
    budgetEstimate: cleanText(value.budgetEstimate, 160),
    travelStyle: cleanText(value.travelStyle, 120),
    overview: cleanText(value.overview, 700),
    highlights: (Array.isArray(value.highlights) ? value.highlights : []).map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 8),
    packingTips: (Array.isArray(value.packingTips) ? value.packingTips : []).map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 8),
    caveats: (Array.isArray(value.caveats) ? value.caveats : []).map((item) => cleanText(item, 180)).filter(Boolean).slice(0, 6),
    budgetBreakdown: cleanText(value.budgetBreakdown, 700),
    image: candidate?.coverImage || value.coverImage || value.image || '',
    days,
  };
}

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

function detectDestinationName(text) {
  if (!text || typeof text !== 'string') return '';
  const q = text.toLowerCase();

  // 1. Direct country/city keyword matching for top global destinations
  if (q.includes('china') || q.includes('beijing') || q.includes('shanghai') || q.includes("xi'an") || q.includes('xian') || q.includes('guilin') || q.includes('chengdu') || q.includes('hong kong') || q.includes('great wall')) return 'China';
  if (q.includes('japan') || q.includes('tokyo') || q.includes('kyoto') || q.includes('osaka') || q.includes('hokkaido') || q.includes('fuji')) return 'Japan';
  if (q.includes('paris') || q.includes('eiffel') || q.includes('france') || q.includes('nice') || q.includes('lyon')) return 'France';
  if (q.includes('london') || q.includes('uk') || q.includes('england') || q.includes('britain') || q.includes('scotland') || q.includes('edinburgh')) return 'London';
  if (q.includes('rome') || q.includes('florence') || q.includes('venice') || q.includes('italy') || q.includes('milan') || q.includes('amalfi') || q.includes('tuscany')) return 'Italy';
  if (q.includes('korea') || q.includes('seoul') || q.includes('busan') || q.includes('jeju')) return 'South Korea';
  if (q.includes('bali') || q.includes('ubud') || q.includes('seminyak') || q.includes('canggu') || q.includes('kuta') || q.includes('uluwatu') || q.includes('indonesia') || q.includes('lombok') || q.includes('komodo')) return 'Bali';
  if (q.includes('dubai') || q.includes('uae') || q.includes('abu dhabi')) return 'Dubai';
  if (q.includes('vietnam') || q.includes('hanoi') || q.includes('da nang') || q.includes('ho chi minh') || q.includes('hoi an') || q.includes('ha long')) return 'Vietnam';
  if (q.includes('thailand') || q.includes('bangkok') || q.includes('phuket') || q.includes('krabi') || q.includes('chiang mai') || q.includes('koh samui')) return 'Thailand';
  if (q.includes('ladakh') || q.includes('leh') || q.includes('pangong') || q.includes('nubra')) return 'Ladakh';
  if (q.includes('kashmir') || q.includes('srinagar') || q.includes('gulmarg') || q.includes('pahalgam')) return 'Kashmir';
  if (q.includes('kerala') || q.includes('munnar') || q.includes('alleppey') || q.includes('kochi') || q.includes('thekkady')) return 'Kerala';
  if (q.includes('goa') || q.includes('panaji')) return 'Goa';
  if (q.includes('rajasthan') || q.includes('jaipur') || q.includes('udaipur') || q.includes('jodhpur') || q.includes('jaisalmer') || q.includes('pushkar')) return 'Rajasthan';
  if (q.includes('spiti') || q.includes('kaza')) return 'Spiti Valley';
  if (q.includes('andaman') || q.includes('havelock') || q.includes('neil island')) return 'Andaman';
  if (q.includes('bhutan') || q.includes('paro') || q.includes('thimphu') || q.includes('punakha')) return 'Bhutan';
  if (q.includes('nepal') || q.includes('kathmandu') || q.includes('pokhara') || q.includes('everest')) return 'Nepal';
  if (q.includes('switzerland') || q.includes('swiss') || q.includes('zurich') || q.includes('lucerne') || q.includes('interlaken') || q.includes('geneva') || q.includes('zermatt')) return 'Switzerland';
  if (q.includes('greece') || q.includes('santorini') || q.includes('athens') || q.includes('mykonos') || q.includes('crete')) return 'Greece';
  if (q.includes('turkey') || q.includes('istanbul') || q.includes('cappadocia') || q.includes('antalya')) return 'Turkey';
  if (q.includes('singapore')) return 'Singapore';
  if (q.includes('maldives')) return 'Maldives';
  if (q.includes('iceland') || q.includes('reykjavik')) return 'Iceland';
  if (q.includes('norway') || q.includes('oslo') || q.includes('bergen') || q.includes('fjord')) return 'Norway';
  if (q.includes('egypt') || q.includes('cairo') || q.includes('giza') || q.includes('luxor')) return 'Egypt';
  if (q.includes('spain') || q.includes('barcelona') || q.includes('madrid') || q.includes('seville') || q.includes('ibiza')) return 'Spain';
  if (q.includes('germany') || q.includes('berlin') || q.includes('munich') || q.includes('bavaria')) return 'Germany';
  if (q.includes('australia') || q.includes('sydney') || q.includes('melbourne') || q.includes('brisbane') || q.includes('cairns')) return 'Australia';
  if (q.includes('new zealand') || q.includes('auckland') || q.includes('queenstown')) return 'New Zealand';
  if (q.includes('sri lanka') || q.includes('colombo') || q.includes('kandy') || q.includes('galle') || q.includes('ella')) return 'Sri Lanka';
  if (q.includes('malaysia') || q.includes('kuala lumpur') || q.includes('penang') || q.includes('langkawi')) return 'Malaysia';
  if (q.includes('philippines') || q.includes('manila') || q.includes('boracay') || q.includes('palawan') || q.includes('cebu')) return 'Philippines';
  if (q.includes('portugal') || q.includes('lisbon') || q.includes('porto') || q.includes('algarve')) return 'Portugal';
  if (q.includes('austria') || q.includes('vienna') || q.includes('salzburg')) return 'Austria';
  if (q.includes('netherlands') || q.includes('amsterdam')) return 'Netherlands';
  if (q.includes('czech') || q.includes('prague')) return 'Prague';
  if (q.includes('hungary') || q.includes('budapest')) return 'Budapest';
  if (q.includes('ireland') || q.includes('dublin')) return 'Ireland';
  if (q.includes('croatia') || q.includes('dubrovnik') || q.includes('split')) return 'Croatia';
  if (q.includes('morocco') || q.includes('marrakech') || q.includes('casablanca')) return 'Morocco';
  if (q.includes('south africa') || q.includes('cape town') || q.includes('kruger')) return 'South Africa';
  if (q.includes('kenya') || q.includes('nairobi') || q.includes('masai mara')) return 'Kenya';
  if (q.includes('tanzania') || q.includes('serengeti') || q.includes('zanzibar')) return 'Tanzania';
  if (q.includes('mauritius')) return 'Mauritius';
  if (q.includes('seychelles')) return 'Seychelles';
  if (q.includes('saudi') || q.includes('riyadh') || q.includes('jeddah') || q.includes('alula')) return 'Saudi Arabia';
  if (q.includes('qatar') || q.includes('doha')) return 'Qatar';
  if (q.includes('oman') || q.includes('muscat')) return 'Oman';
  if (q.includes('jordan') || q.includes('petra') || q.includes('amman')) return 'Jordan';
  if (q.includes('usa') || q.includes('united states') || q.includes('america') || q.includes('new york') || q.includes('california') || q.includes('las vegas') || q.includes('hawaii')) return 'United States';
  if (q.includes('canada') || q.includes('vancouver') || q.includes('toronto') || q.includes('banff')) return 'Canada';
  if (q.includes('mexico') || q.includes('cancun') || q.includes('tulum')) return 'Mexico';
  if (q.includes('peru') || q.includes('machu picchu') || q.includes('cusco') || q.includes('lima')) return 'Peru';
  if (q.includes('brazil') || q.includes('rio de janeiro')) return 'Brazil';
  if (q.includes('europe')) return 'Europe';

  // 2. Natural language pattern match: "trip to X", "travel to X", "holiday in X", "budget for X", etc.
  const nlMatch = text.match(/\b(?:trip to|travel to|tour to|journey to|escape to|holiday in|vacation in|visit|visiting|explore|exploring|budget for|fly to|heading to|going to|guide for|guide to)\s+([A-Za-z\s]{2,20}?)(?:\s+(?:for|with|include|including|in|on|at|during|and|over|\.|\?|,|$))/i);
  if (nlMatch && nlMatch[1]) {
    const rawDest = nlMatch[1].trim();
    if (rawDest.length >= 3 && !/^(the|a|an|my|our|any|some|this|that)$/i.test(rawDest)) {
      return rawDest.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // 3. Match from markdown headers in AI response, e.g. "Welcome to X", "Curated Journey to X"
  const welcomeMatch = text.match(/(?:welcome to|journey through|escape to|guide to)\s+\*?\*?([A-Za-z\s]{3,25}?)\*?\*?[!:\.\n]/i);
  if (welcomeMatch && welcomeMatch[1]) {
    const rawDest = welcomeMatch[1].trim();
    if (rawDest.length >= 3 && !/^(the|our|qarwaan|a|an)$/i.test(rawDest)) {
      return rawDest.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  return '';
}

function extractDurationFromQuery(text) {
  const match = (text || '').match(/\b(\d+)\s*(?:[- ]?day|days|nights|night)\b/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0 && val <= 30) return val;
  }
  return 0;
}

function extractTravellersFromQuery(text) {
  const match = (text || '').match(/\b(\d+)\s*(?:people|persons|travellers|travelers|guests|adults)\b/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0 && val <= 50) return val;
  }
  if (/\b(?:solo|alone)\b/i.test(text)) return 1;
  if (/\b(?:couple|honeymoon|duo|two of us)\b/i.test(text)) return 2;
  return 2;
}

function extractItineraryFromMarkdown(markdownText, destination, userQuery) {
  const duration = extractDurationFromQuery(userQuery) || 0;
  const travellers = extractTravellersFromQuery(userQuery);

  const lines = (markdownText || '').split('\n');
  const parsedDays = [];
  let currentDay = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (
      /^[🏨💡🏛️🍽️]/.test(trimmed) ||
      /^\*{0,2}(Premium Stay|Insider Travel Tips|Insider Tips|Hotels|Where to Stay|Packing Tips)/i.test(trimmed)
    ) {
      if (currentDay && currentDay.points.length) {
        parsedDays.push(currentDay);
        currentDay = null;
      }
      continue;
    }

    if (/Day-by-Day Itinerary/i.test(trimmed)) {
      continue;
    }

    const dayMatch = trimmed.match(/^#{0,6}\s*\*{0,2}Day\s+(\d+)[:\-–—\s*]+(.*?)(?:\*{0,2})$/i);
    if (dayMatch) {
      if (currentDay && currentDay.points.length) {
        parsedDays.push(currentDay);
      }
      const dayNum = parseInt(dayMatch[1], 10) || (parsedDays.length + 1);
      let dayTitle = dayMatch[2].replace(/^\*+|\*+$/g, '').replace(/^[:\-–—\s]+/, '').trim();
      if (!dayTitle) dayTitle = `Explore ${destination}`;
      currentDay = {
        day: dayNum,
        title: dayTitle,
        points: [],
        activities: [],
        places: [],
        localTip: '',
      };
      continue;
    }

    if (currentDay) {
      const tipMatch = trimmed.match(/^[-*•]?\s*\*{0,2}(?:Tip|Insider Tip|Local Tip)[:\*]\s*(.*)$/i);
      if (tipMatch) {
        currentDay.localTip = tipMatch[1].replace(/^\*+|\*+$/g, '').trim();
        continue;
      }

      if (/^[-*•]\s+/.test(trimmed)) {
        const actText = trimmed.replace(/^[-*•]\s+/, '').trim();
        const cleanedAct = actText.replace(/^\*\*([^*:]+)\*{0,2}:?\s*/i, '$1: ').trim();
        if (cleanedAct.length > 5) {
          currentDay.points.push(cleanedAct);
          currentDay.activities.push(cleanedAct);
        }
        continue;
      }

      if (/^\*\*(Morning|Afternoon|Evening)\*\*:?\s*/i.test(trimmed)) {
        const cleanedAct = trimmed.replace(/^\*\*([^*:]+)\*{0,2}:?\s*/i, '$1: ').trim();
        if (cleanedAct.length > 5) {
          currentDay.points.push(cleanedAct);
          currentDay.activities.push(cleanedAct);
        }
        continue;
      }
    }
  }

  if (currentDay && currentDay.points.length) {
    parsedDays.push(currentDay);
  }

  if (parsedDays.length > 0) {
    for (const d of parsedDays) {
      if (!d.points.length) {
        const fallbackAct = `Explore highlights of ${d.title || destination}`;
        d.points = [fallbackAct];
        d.activities = [fallbackAct];
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
      days: parsedDays,
    };
  }

  const finalDuration = duration || 5;
  const dynamicDays = [];
  for (let d = 1; d <= finalDuration; d++) {
    const act = [
      `Morning: Curated exploration of key landmarks in ${destination}.`,
      `Afternoon: Immersive cultural encounter and leisure stroll through local markets.`,
      `Evening: Celebrated dinner experience highlighting regional gastronomy.`,
    ];
    dynamicDays.push({
      day: d,
      title: d === 1 ? `Arrival & Welcome in ${destination}` : d === finalDuration ? `Bespoke Farewell & Departure from ${destination}` : `Day ${d}: Highlights of ${destination}`,
      points: act,
      activities: act,
      places: [],
      localTip: `Pre-reserve entries and allow leisurely transit time across ${destination}.`,
    });
  }

  return {
    title: `${destination}: Curated Journey`,
    destination,
    durationDays: finalDuration,
    travellers,
    days: dynamicDays,
  };
}

function parseConciergeResponse(content, userQuery = '') {
  if (typeof content !== 'string') throw new Error('The AI provider returned an empty response.');
  const rawText = content.trim();
  const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
  const match = rawText.match(jsonBlockRegex);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.isDestinationQuery !== false && (parsed.destination || parsed.itinerary)) {
        const cleanReply = rawText.replace(match[0], '').trim();
        const destination = parsed.destination || detectDestinationName(userQuery) || 'Destination';

        const rawItineraryDays = Array.isArray(parsed.itinerary) ? parsed.itinerary : [];
        let itineraryDays = rawItineraryDays.map((d, idx) => {
          let points = [];
          if (Array.isArray(d.points)) {
            points = d.points.map((p) => String(p).trim()).filter(Boolean);
          } else if (Array.isArray(d.activities)) {
            points = d.activities.map((p) => String(p).trim()).filter(Boolean);
          } else if (typeof d.points === 'string') {
            points = [d.points.trim()];
          } else if (typeof d.activities === 'string') {
            points = [d.activities.trim()];
          }
          return {
            day: typeof d.day === 'number' ? d.day : idx + 1,
            title: d.title || `Day ${idx + 1}`,
            points: points.length ? points : [`Explore highlights of ${destination}`],
            activities: points.length ? points : [`Explore highlights of ${destination}`],
            places: Array.isArray(d.places) ? d.places : [],
            localTip: d.insiderTip || d.localTip || d.tip || '',
          };
        });

        const queryDuration = extractDurationFromQuery(userQuery);
        const queryTravellers = extractTravellersFromQuery(userQuery);

        if (itineraryDays.length === 0 || (queryDuration > 0 && itineraryDays.length < queryDuration)) {
          const markdownItin = extractItineraryFromMarkdown(cleanReply, destination, userQuery);
          if (markdownItin && markdownItin.days.length >= itineraryDays.length) {
            itineraryDays = markdownItin.days;
          }
        }

        const durationDays =
          parsed.durationDays ||
          parsed.duration_days ||
          itineraryDays.length ||
          queryDuration ||
          5;

        const rawTravellers = parsed.travellers || parsed.travelers;
        const travellers =
          (typeof rawTravellers === 'number' ? rawTravellers : parseInt(String(rawTravellers || ''), 10)) ||
          queryTravellers ||
          2;

        const itinerary = itineraryDays.length
          ? {
              title: `${destination}: Curated Journey`,
              destination,
              durationDays: Math.max(durationDays, itineraryDays.length),
              travellers,
              days: itineraryDays,
            }
          : extractItineraryFromMarkdown(cleanReply, destination, userQuery);

        return {
          isDestinationQuery: true,
          reply: cleanReply,
          ...parsed,
          destination,
          durationDays: Math.max(durationDays, itineraryDays.length),
          travellers,
          itinerary,
        };
      }
    } catch (e) {
      console.warn('Failed to parse embedded JSON in Intent B response:', e);
    }
  }

  // Fallback destination extraction if AI omitted JSON block
  const detectedDest = detectDestinationName(userQuery) || detectDestinationName(rawText);
  if (detectedDest) {
    const cleanReply = rawText.replace(/^```(?:markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const itinerary = extractItineraryFromMarkdown(cleanReply, detectedDest, userQuery);
    return {
      isDestinationQuery: true,
      reply: cleanReply,
      destination: detectedDest,
      bestTime: 'October to April (Optimal Season)',
      visaStatus: 'Check local entry & visa guidelines',
      rating: '4.9 Exceptional',
      itinerary,
    };
  }

  return {
    isDestinationQuery: false,
    reply: rawText.replace(/^```(?:markdown)?\s*/i, '').replace(/\s*```$/i, '').trim(),
    destination: null,
    itinerary: null,
  };
}

async function askProvider({ messages, preferences, catalogue }) {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('AI_API_KEY or GEMINI_API_KEY must be configured on the server.');
  }

  const endpoint =
    process.env.AI_API_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

  const candidateModels = [
    process.env.AI_MODEL || 'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
  ];

  const conversation = messages.map((message) => ({ role: message.role, content: cleanText(message.content, 4000) }));
  let responseData = null;
  let lastErrorMsg = '';

  for (const modelCandidate of candidateModels) {
    try {
      const res = await axios.post(
        endpoint,
        {
          model: modelCandidate,
          temperature: 0.5,
          reasoning_effort: 'low',
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'system', content: `CURRENT PREFERENCES: ${JSON.stringify(preferences)}` },
            ...conversation,
          ],
        },
        {
          timeout: Number(process.env.AI_TIMEOUT_MS || 25000),
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          maxContentLength: 1_000_000,
        }
      );
      if (res.data?.choices?.[0]?.message?.content) {
        responseData = res.data;
        break;
      }
    } catch (err) {
      lastErrorMsg = `Model ${modelCandidate} failed: ${err.response?.status || err.message}`;
      console.warn(lastErrorMsg);
    }
  }

  if (responseData) {
    const lastUserQuery = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
    return parseConciergeResponse(responseData.choices[0].message.content, lastUserQuery);
  }

  // Strictly NO mock fallback: throw error so UI surfaces actual error state
  throw new Error(`Gemini AI service unavailable: ${lastErrorMsg || 'All models currently busy. Please try again.'}`);
}

module.exports = { getRelevantCatalogue, normaliseItinerary, normalisePreferences, askProvider };
