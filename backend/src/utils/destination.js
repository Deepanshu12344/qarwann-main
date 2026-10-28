const KNOWN_DESTINATION_MAP = {
  'andaman-island-escape-beaches-blue-waters-island-stories': 'Andaman Islands',
  'bali-island-of-gods-iconic-wonders-hidden-gems': 'Bali',
  'bhutan-himalayan-serenity-cultural-discovery': 'Bhutan',
  'goa-coastal-charm-cultural-escape': 'Goa',
  'nepal-himalayan-heritage-lakes-jungle-escape': 'Nepal',
  'kerala-serenity-escape': 'Kerala',
  'ladakh-himalayan-expedition': 'Ladakh',
  'rajasthan-royal-heritage-desert-odyssey': 'Rajasthan',
  'spiti-valley-expedition': 'Spiti Valley',
  'jim-corbett-wild-trails-and-forest-escape': 'Jim Corbett',
  'coorg-coffee-forests-kodava-culture': 'Coorg',
  'hampi-heritage-weekend-escape': 'Hampi',
  'kasauli-colonial-charm-pine-trails-slow-mountain-living': 'Kasauli',
  'rishikesh-reset-by-the-ganga-weekend-escape': 'Rishikesh',
  'ooty-coonoor-tea-trails-misty-hills-nilgiri-escapes': 'Ooty & Coonoor',
  'darjeeling-tea-trails-himalayan-views-toy-train-heritage': 'Darjeeling',
};

const DESTINATION_PREFIX_MAP = [
  ['andaman', 'Andaman Islands'],
  ['bali', 'Bali'],
  ['bhutan', 'Bhutan'],
  ['goa', 'Goa'],
  ['nepal', 'Nepal'],
  ['kerala', 'Kerala'],
  ['ladakh', 'Ladakh'],
  ['rajasthan', 'Rajasthan'],
  ['spiti', 'Spiti Valley'],
  ['corbett', 'Jim Corbett'],
  ['coorg', 'Coorg'],
  ['hampi', 'Hampi'],
  ['kasauli', 'Kasauli'],
  ['rishikesh', 'Rishikesh'],
  ['ooty', 'Ooty & Coonoor'],
  ['coonoor', 'Ooty & Coonoor'],
  ['darjeeling', 'Darjeeling'],
];

/**
 * Derive destination matching the exact grouping logic used by the frontend.
 * @param {Object} trip - Trip object or raw row
 * @returns {string} Canonical destination name
 */
function deriveDestination(trip = {}) {
  if (trip.destination && typeof trip.destination === 'string' && trip.destination.trim()) {
    return trip.destination.trim();
  }
  const slug = (trip.slug || '').trim().toLowerCase();
  if (slug && KNOWN_DESTINATION_MAP[slug]) {
    return KNOWN_DESTINATION_MAP[slug];
  }

  const name = (trip.packageName || trip.title || '').trim().toLowerCase();
  for (const [key, dest] of DESTINATION_PREFIX_MAP) {
    if (slug.includes(key) || name.includes(key)) {
      return dest;
    }
  }

  // Fallback: parse segment before em-dash, en-dash, hyphen, pipe, or colon
  const rawName = (trip.packageName || trip.title || '').trim();
  const parts = rawName.split(/\s*[–—\-|:]\s*/);
  if (parts.length > 1 && parts[0].trim().length > 1) {
    return parts[0].trim();
  }

  return trip.startPoint ? String(trip.startPoint).trim() : 'India';
}

module.exports = {
  deriveDestination,
  KNOWN_DESTINATION_MAP,
};
