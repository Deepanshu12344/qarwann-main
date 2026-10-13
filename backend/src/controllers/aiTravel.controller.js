const asyncHandler = require('express-async-handler');
const Trip = require('../models/Trip');
const { getRelevantCatalogue, normaliseItinerary, normalisePreferences, askProvider } = require('../services/aiTravel.service');
const { createBrochure } = require('../services/brochure.service');

function publicTrip(trip) {
  return { id: trip.id, title: trip.title, slug: trip.slug, destination: trip.destination, duration: trip.duration, type: trip.type, idealFor: trip.idealFor, coverImage: trip.coverImage };
}

exports.discovery = asyncHandler(async (_req, res) => {
  const catalogue = await getRelevantCatalogue({ Trip, query: '', preferences: {} });
  const destinations = [];
  const seen = new Set();
  for (const trip of catalogue) {
    const destination = trip.destination?.split(',')[0]?.trim();
    if (!destination || seen.has(destination.toLowerCase())) continue;
    seen.add(destination.toLowerCase());
    destinations.push({ name: destination, description: trip.overview, coverImage: trip.coverImage, tripId: trip.id });
  }
  res.json({ destinations: destinations.slice(0, 9), trips: catalogue.slice(0, 10).map(publicTrip) });
});

exports.chat = asyncHandler(async (req, res) => {
  const preferences = normalisePreferences(req.body.preferences);
  const messages = req.body.messages;
  const lastMessage = messages[messages.length - 1]?.content || '';
  const catalogue = await getRelevantCatalogue({ Trip, query: lastMessage, preferences });
  let result;
  try {
    result = await askProvider({ messages, preferences, catalogue });
  } catch (error) {
    if (error.response?.status === 429) { error.status = 429; error.message = 'Qarwaan AI is busy right now. Please try again in a moment.'; }
    if (error.code === 'ECONNABORTED') { error.status = 504; error.message = 'Qarwaan AI took too long to respond. Please try again.'; }
    throw error;
  }
  if (!result.isDestinationQuery) {
    return res.json({
      isDestinationQuery: false,
      reply: String(result.reply || '').trim(),
      destination: null,
      bestTime: null,
      visaStatus: null,
      itinerary: null,
      weatherForecast: [],
      nearbyAttractions: [],
      nearbyRestaurants: [],
      recommendedTrips: [],
    });
  }

  const nextPreferences = normalisePreferences({ ...preferences, ...result.preferences });
  const itinerary = normaliseItinerary(result.itinerary, catalogue);
  const catalogueIds = new Set(catalogue.map((trip) => trip.id));
  const requestedIds = Array.isArray(result.recommendedTripIds) ? result.recommendedTripIds.map(String) : [];
  const recommendedTrips = catalogue.filter((trip) => catalogueIds.has(trip.id) && requestedIds.includes(trip.id)).slice(0, 4).map(publicTrip);
  let reply = String(result.reply || '').trim();
  const destination = result.destination || itinerary?.destination || preferences?.destination || 'your destination';
  const bestTime = result.bestTime || 'October to April (Optimal Weather)';
  const visaStatus = result.visaStatus || 'Check local travel entry guidelines';

  const rawAttractions = result.nearbyAttractions || result.top_attractions || result.attractions || [];
  const nearbyAttractions = (Array.isArray(rawAttractions) ? rawAttractions : []).map((item) => {
    if (typeof item === 'string') return item.trim();
    if (item && typeof item === 'object') {
      const name = item.name || item.title || item.attraction || 'Attraction';
      const loc = item.location ? ` (${item.location})` : '';
      const desc = item.description || item.notes || '';
      return `${name}${loc}${desc ? ` — ${desc}` : ''}`;
    }
    return '';
  }).filter(Boolean);

  const rawRestaurants = result.nearbyRestaurants || result.top_restaurants || result.restaurants || [];
  const nearbyRestaurants = (Array.isArray(rawRestaurants) ? rawRestaurants : []).map((item) => {
    if (typeof item === 'string') return item.trim();
    if (item && typeof item === 'object') {
      const name = item.name || item.restaurant || 'Dining Spot';
      const loc = item.location || item.cuisine ? ` (${[item.cuisine, item.location].filter(Boolean).join(', ')})` : '';
      const desc = item.specialty || item.description || '';
      return `${name}${loc}${desc ? ` — ${desc}` : ''}`;
    }
    return '';
  }).filter(Boolean);

  res.json({
    isDestinationQuery: true,
    reply: reply.slice(0, 5000),
    destination,
    bestTime,
    visaStatus,
    weatherForecast: Array.isArray(result.weatherForecast) ? result.weatherForecast : [],
    nearbyAttractions,
    nearbyRestaurants,
    preferences: nextPreferences,
    itinerary,
    recommendedTrips,
  });
});

exports.brochure = asyncHandler(async (req, res) => {
  const itinerary = normaliseItinerary(req.body.itinerary, []);
  if (!itinerary) return res.status(400).json({ message: 'A complete itinerary with at least one day is required.' });
  // Preserve only the existing catalogue image path received from the client; the PDF service revalidates it locally.
  itinerary.image = typeof req.body.itinerary.image === 'string' ? req.body.itinerary.image.slice(0, 500) : '';
  const contact = {
    siteUrl: process.env.SITE_URL || 'https://www.qarwaan.com',
    email: process.env.CONTACT_EMAIL || '',
    phone: process.env.CONTACT_PHONE || '',
  };
  const { buffer, filename } = await createBrochure(itinerary, contact);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(buffer);
});
