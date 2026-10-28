const asyncHandler = require('express-async-handler');
const Trip = require('../models/Trip');
const JourneyDay = require('../models/JourneyDay');
const { serializeTrip, serializeTripList } = require('../serializers/trip.serializer');
const { deriveDestination } = require('../utils/destination');

const SORTS = {
  createdAt: { createdAt: 1 },
  '-createdAt': { createdAt: -1 },
  packageName: { packageName: 1 },
  '-packageName': { packageName: -1 },
  tripType: { tripType: 1 },
  '-tripType': { tripType: -1 },
  price: { startingPrice: 1 },
  '-price': { startingPrice: -1 },
  duration: { durationDays: 1 },
  '-duration': { durationDays: -1 },
  popular: { featured: -1, order: 1, createdAt: -1 },
  order: { order: 1, featured: -1, createdAt: -1 },
};

// POST /api/trips
const createTrip = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.destination) {
    payload.destination = deriveDestination(payload);
  }
  const trip = await Trip.create(payload);
  res.status(201).json(serializeTrip(trip));
});

// GET /api/trips and /api/public/trips
const listTrips = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

  const {
    q,
    category,
    status,
    featured,
    destination,
    country,
    tripType,
    idealFor,
    bestSeason,
    duration,
    minBudget,
    maxBudget,
    page = 1,
    limit = 20,
    pageSize,
    sort,
  } = req.query;

  const effectiveLimit = pageSize ? Number(pageSize) : Number(limit);
  const filter = {};

  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (status) {
    filter.status = status;
  } else if (!req.user || req.user.role !== 'admin') {
    // Default public listing to published trips
    filter.status = 'published';
  }

  if (typeof featured === 'boolean') filter.featured = featured;
  if (destination) {
    filter.destination = new RegExp(`^${destination}$`, 'i');
  }
  if (country) {
    filter.country = new RegExp(`^${country}$`, 'i');
  }
  if (tripType) filter.tripType = tripType;
  if (idealFor) filter.idealFor = idealFor;
  if (bestSeason) filter.bestSeason = bestSeason;

  if (duration === 'short') {
    filter.durationDays = { $lte: 5 };
  } else if (duration === 'medium') {
    filter.durationDays = { $gte: 6, $lte: 9 };
  } else if (duration === 'long') {
    filter.durationDays = { $gte: 10 };
  }

  if (minBudget !== undefined || maxBudget !== undefined) {
    filter.startingPrice = {};
    if (minBudget !== undefined) filter.startingPrice.$gte = Number(minBudget);
    if (maxBudget !== undefined) filter.startingPrice.$lte = Number(maxBudget);
  }

  const sortOption = SORTS[sort] || { order: 1, featured: -1, createdAt: -1 };
  const skip = (page - 1) * effectiveLimit;

  const [items, total, countries, tripTypes, idealForList] = await Promise.all([
    Trip.find(filter).sort(sortOption).skip(skip).limit(effectiveLimit),
    Trip.countDocuments(filter),
    Trip.distinct('country', { status: 'published' }),
    Trip.distinct('tripType', { status: 'published' }),
    Trip.distinct('idealFor', { status: 'published' }),
  ]);

  const facets = {
    countries: countries.sort(),
    tripTypes: tripTypes.sort(),
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    idealFor: idealForList.sort(),
  };

  res.json({
    items: serializeTripList(items),
    total,
    page: Number(page),
    limit: effectiveLimit,
    pageSize: effectiveLimit,
    pages: Math.ceil(total / effectiveLimit),
    pagination: { page: Number(page), limit: effectiveLimit, total, pages: Math.ceil(total / effectiveLimit) },
    facets,
  });
});

// GET /api/trips/destinations
const getDestinations = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  const trips = await Trip.find({ status: 'published' }).select(
    'destination country category coverImage slug startingPrice durationDays'
  );

  const destMap = new Map();
  for (const t of trips) {
    if (!destMap.has(t.destination)) {
      destMap.set(t.destination, {
        name: t.destination,
        country: t.country,
        category: t.category,
        coverImage: t.coverImage?.url || (typeof t.coverImage === 'string' ? t.coverImage : ''),
        tripCount: 0,
        minPrice: t.startingPrice || 0,
        slugs: [],
      });
    }
    const d = destMap.get(t.destination);
    d.tripCount++;
    if (t.startingPrice && (!d.minPrice || t.startingPrice < d.minPrice)) {
      d.minPrice = t.startingPrice;
    }
    d.slugs.push(t.slug);
  }

  res.json({
    items: Array.from(destMap.values()),
    total: destMap.size,
  });
});

// GET /api/trips/:id
const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  const days = await JourneyDay.find({ tripId: trip._id }).sort('dayNumber');
  res.json(serializeTrip({ ...trip.toObject(), journeyDays: days }));
});

// GET /api/trips/slug/:slug
const getTripBySlug = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  const trip = await Trip.findOne({ slug: req.params.slug });
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  const days = await JourneyDay.find({ tripId: trip._id }).sort('dayNumber');
  res.json(serializeTrip({ ...trip.toObject(), journeyDays: days }));
});

// PATCH /api/trips/:id
const updateTrip = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.packageName && !payload.destination) {
    payload.destination = deriveDestination(payload);
  }
  const trip = await Trip.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  res.json(serializeTrip(trip));
});

// DELETE /api/trips/:id
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByIdAndDelete(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  await JourneyDay.deleteMany({ tripId: trip._id });
  res.json({ message: 'Trip and its journey days deleted' });
});

module.exports = {
  createTrip,
  listTrips,
  getDestinations,
  getTrip,
  getTripBySlug,
  updateTrip,
  deleteTrip,
};
