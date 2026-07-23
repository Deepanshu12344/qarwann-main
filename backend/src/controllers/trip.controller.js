const asyncHandler = require('express-async-handler');
const Trip = require('../models/Trip');
const JourneyDay = require('../models/JourneyDay');

// POST /api/trips
const createTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.create(req.body);
  res.status(201).json(trip);
});

// GET /api/trips
const listTrips = asyncHandler(async (req, res) => {
  const { q, tripType, idealFor, bestSeason, page, limit, sort } = req.query;
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (tripType) filter.tripType = tripType;
  if (idealFor) filter.idealFor = idealFor;
  if (bestSeason) filter.bestSeason = bestSeason;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Trip.find(filter).sort(sort || '-createdAt').skip(skip).limit(limit),
    Trip.countDocuments(filter),
  ]);

  res.json({
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/trips/:id
const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  res.json(trip);
});

// GET /api/trips/slug/:slug
const getTripBySlug = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ slug: req.params.slug });
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  const days = await JourneyDay.find({ tripId: trip._id }).sort('day');
  res.json({ ...trip.toObject(), journeyDays: days });
});

// PATCH /api/trips/:id
const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  res.json(trip);
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
  getTrip,
  getTripBySlug,
  updateTrip,
  deleteTrip,
};
