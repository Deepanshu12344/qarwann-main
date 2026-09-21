/*
 * Provider boundary for Google reviews. This deliberately does not contact
 * Google until the business supplies the required, approved configuration.
 * Manual review content is the default source and must contain only authentic,
 * approved material entered by QARWAAN.
 */
const manualReviews = require('../data/manualGoogleReviews');
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache = { expiresAt: 0, value: null };

async function fetchFromConfiguredProvider() {
  // Intentionally a boundary, not an implementation: choose and wire the
  // approved Google provider only after credentials and policy decisions.
  throw new Error('Google reviews provider is not configured');
}

async function getGoogleReviews() {
  if (cache.value && cache.expiresAt > Date.now()) return cache.value;
  const value = process.env.GOOGLE_REVIEWS_SOURCE === 'google' ? await fetchFromConfiguredProvider() : manualReviews;
  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

module.exports = { getGoogleReviews };
