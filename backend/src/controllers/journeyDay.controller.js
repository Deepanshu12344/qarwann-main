const asyncHandler = require('express-async-handler');
const JourneyDay = require('../models/JourneyDay');
const Trip = require('../models/Trip');

// POST /api/journey-days
const createJourneyDay = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.body.tripId);
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found for tripId');
  }
  const day = await JourneyDay.create(req.body);
  res.status(201).json(day);
});

// GET /api/journey-days
const listJourneyDays = asyncHandler(async (req, res) => {
  const { tripId, page, limit, sort } = req.query;
  const filter = {};
  if (tripId) filter.tripId = tripId;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    JourneyDay.find(filter).sort(sort).skip(skip).limit(limit),
    JourneyDay.countDocuments(filter),
  ]);

  res.json({
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/journey-days/:id
const getJourneyDay = asyncHandler(async (req, res) => {
  const day = await JourneyDay.findById(req.params.id);
  if (!day) {
    res.status(404);
    throw new Error('Journey day not found');
  }
  res.json(day);
});

// PATCH /api/journey-days/:id
const updateJourneyDay = asyncHandler(async (req, res) => {
  const day = await JourneyDay.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!day) {
    res.status(404);
    throw new Error('Journey day not found');
  }
  res.json(day);
});

// DELETE /api/journey-days/:id
const deleteJourneyDay = asyncHandler(async (req, res) => {
  const day = await JourneyDay.findByIdAndDelete(req.params.id);
  if (!day) {
    res.status(404);
    throw new Error('Journey day not found');
  }
  res.json({ message: 'Journey day deleted' });
});

// GET /api/trips/:id/journey-days  (mounted from trip routes)
const listByTrip = asyncHandler(async (req, res) => {
  const days = await JourneyDay.find({ tripId: req.params.id }).sort('day');
  res.json({ items: days });
});

module.exports = {
  createJourneyDay,
  listJourneyDays,
  getJourneyDay,
  updateJourneyDay,
  deleteJourneyDay,
  listByTrip,
};
