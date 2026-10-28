/**
 * Serializers to map canonical Mongoose Trip and JourneyDay documents into
 * frontend-compatible shapes exposing legacy and canonical fields.
 */

function toPlain(doc) {
  if (!doc) return null;
  if (typeof doc.toObject === 'function') {
    return doc.toObject();
  }
  return { ...doc };
}

/**
 * Serialize a single JourneyDay document.
 * @param {Object} dayDoc - Mongoose document or plain object
 * @returns {Object} Serialized journey day
 */
function serializeJourneyDay(dayDoc) {
  if (!dayDoc) return null;
  const raw = toPlain(dayDoc);

  const imagesArray = Array.isArray(raw.images) ? raw.images : [];
  const imageUrls = imagesArray.map((img) => {
    if (typeof img === 'string') return img;
    return img?.url || '';
  }).filter(Boolean);

  const dayNumber = raw.dayNumber ?? raw.day ?? 1;

  return {
    _id: raw._id ? String(raw._id) : undefined,
    id: raw._id ? String(raw._id) : undefined,
    tripId: raw.tripId ? String(raw.tripId) : undefined,

    // Canonical & legacy day number
    dayNumber,
    day: dayNumber,

    route: raw.route || '',
    location: raw.location || '',
    phase: raw.phase || '',

    nature: Boolean(raw.nature),
    adventure: Boolean(raw.adventure),
    culture: Boolean(raw.culture),
    spiritual: Boolean(raw.spiritual),
    heritage: Boolean(raw.heritage),
    modern: Boolean(raw.modern),

    keyAttractions: Array.isArray(raw.keyAttractions) ? raw.keyAttractions : [],

    // Canonical & legacy details
    experienceDetails: raw.experienceDetails || '',
    description: raw.experienceDetails || '',

    hiddenGems: Array.isArray(raw.hiddenGems) ? raw.hiddenGems : [],
    activities: Array.isArray(raw.activities) ? raw.activities : [],

    // Canonical & legacy food
    localFood: Array.isArray(raw.localFood) ? raw.localFood : [],
    meals: Array.isArray(raw.localFood) ? raw.localFood : [],

    localExperience: raw.localExperience || '',
    festivals: Array.isArray(raw.festivals) ? raw.festivals : ['N/A'],

    // Canonical & legacy stay
    stayType: raw.stayType || '',
    stay: raw.stayType || '',

    accessibility: raw.accessibility || '',

    // URLs for carousels + rich objects for editor
    images: imageUrls,
    imageData: imagesArray,

    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * Serialize a single Trip document.
 * @param {Object} tripDoc - Mongoose document or plain object
 * @returns {Object} Serialized trip
 */
function serializeTrip(tripDoc) {
  if (!tripDoc) return null;
  const raw = toPlain(tripDoc);

  const coverUrl =
    typeof raw.coverImage === 'string'
      ? raw.coverImage
      : raw.coverImage?.url || '';

  const galleryItems = Array.isArray(raw.gallery) ? raw.gallery : [];
  const galleryUrls = galleryItems.map((g) => {
    if (typeof g === 'string') return g;
    return g?.url || '';
  }).filter(Boolean);

  let locationBanners = {};
  if (raw.locationBanners instanceof Map) {
    locationBanners = Object.fromEntries(raw.locationBanners);
  } else if (raw.locationBanners && typeof raw.locationBanners === 'object') {
    locationBanners = { ...raw.locationBanners };
  }

  const startingPrice = raw.startingPrice ?? raw.budgetFrom ?? raw.budget ?? 0;
  const detailedOverview = raw.detailedOverview || raw.summary || raw.overview || '';
  const keyExperiences = Array.isArray(raw.keyExperiences)
    ? raw.keyExperiences
    : Array.isArray(raw.highlights)
      ? raw.highlights
      : [];

  const serialized = {
    _id: raw._id ? String(raw._id) : undefined,
    id: raw.slug || (raw._id ? String(raw._id) : undefined),
    slug: raw.slug || '',

    // Canonical & legacy package name / title
    packageName: raw.packageName || raw.title || '',
    title: raw.packageName || raw.title || '',
    name: raw.packageName || raw.title || '',

    category: raw.category || 'journey',
    status: raw.status || 'published',
    featured: Boolean(raw.featured),
    order: raw.order ?? 0,

    destination: raw.destination || '',
    place: raw.destination || '',
    country: raw.country || 'India',

    citiesCovered: Array.isArray(raw.citiesCovered) ? raw.citiesCovered : [],
    cities: Array.isArray(raw.citiesCovered) ? raw.citiesCovered : [],

    startPoint: raw.startPoint || '',
    startingPoint: raw.startPoint || '',
    endPoint: raw.endPoint || '',

    bestSeason: Array.isArray(raw.bestSeason) ? raw.bestSeason : [],
    idealFor: Array.isArray(raw.idealFor) ? raw.idealFor : [],
    tripType: raw.tripType || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],

    duration: raw.duration || '',
    durationDays: raw.durationDays ?? (raw.journeyDays ? raw.journeyDays.length : 1),
    nights: raw.nights ?? Math.max((raw.durationDays || 1) - 1, 0),

    // Canonical & legacy pricing
    startingPrice,
    budgetFrom: startingPrice,
    budget: startingPrice,

    // Canonical & legacy overview
    detailedOverview,
    summary: detailedOverview,
    overview: detailedOverview,

    whyThisTrip: raw.whyThisTrip || '',

    // Canonical & legacy highlights
    keyExperiences,
    highlights: keyExperiences,

    // Cover images: plain string URL on coverImage / cover / img; object on coverImageData
    coverImage: coverUrl,
    cover: coverUrl,
    img: coverUrl,
    coverImageData: raw.coverImage && typeof raw.coverImage === 'object' ? raw.coverImage : null,

    gallery: galleryItems,
    galleryUrls,
    locationBanners,

    inclusions: Array.isArray(raw.inclusions) ? raw.inclusions : [],
    exclusions: Array.isArray(raw.exclusions) ? raw.exclusions : [],
    howItWorks: Array.isArray(raw.howItWorks) ? raw.howItWorks : [],

    seoTitle: raw.seoTitle || '',
    seoDescription: raw.seoDescription || '',

    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  if (Array.isArray(raw.journeyDays)) {
    serialized.journeyDays = raw.journeyDays.map(serializeJourneyDay);
  }

  return serialized;
}

function serializeTripList(trips) {
  if (!Array.isArray(trips)) return [];
  return trips.map(serializeTrip);
}

function serializeJourneyDayList(days) {
  if (!Array.isArray(days)) return [];
  return days.map(serializeJourneyDay);
}

module.exports = {
  serializeTrip,
  serializeTripList,
  serializeJourneyDay,
  serializeJourneyDayList,
};
