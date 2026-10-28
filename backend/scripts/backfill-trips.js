/* eslint-disable no-console */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Trip = require('../src/models/Trip');
const JourneyDay = require('../src/models/JourneyDay');
const { deriveDestination } = require('../src/utils/destination');

const WEEKEND_SLUGS = new Set([
  'jim-corbett-wild-trails-and-forest-escape',
  'rishikesh-reset-by-the-ganga-weekend-escape',
  'coorg-coffee-forests-kodava-culture',
  'hampi-heritage-weekend-escape',
  'kasauli-colonial-charm-pine-trails-slow-mountain-living',
  'ooty-coonoor-tea-trails-misty-hills-nilgiri-escapes',
  'darjeeling-tea-trails-himalayan-views-toy-train-heritage',
]);

async function backfill() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB for backfill.');

  const trips = await Trip.find({});
  console.log(`Found ${trips.length} trips to check.`);

  let tripsUpdated = 0;
  for (const trip of trips) {
    let modified = false;

    if (!trip.category) {
      trip.category = WEEKEND_SLUGS.has(trip.slug) ? 'weekend' : 'journey';
      modified = true;
    }
    if (!trip.status) {
      trip.status = 'published';
      modified = true;
    }
    if (!trip.destination) {
      trip.destination = deriveDestination(trip);
      modified = true;
    }
    if (!trip.durationDays || trip.durationDays < 1) {
      const match = (trip.duration || '').match(/(\d+)\s*days?/i);
      trip.durationDays = match ? parseInt(match[1], 10) : 1;
      modified = true;
    }
    if (trip.nights === undefined || trip.nights === null) {
      const match = (trip.duration || '').match(/(\d+)\s*nights?/i);
      trip.nights = match ? parseInt(match[1], 10) : Math.max(trip.durationDays - 1, 0);
      modified = true;
    }
    if (trip.startingPrice === undefined || trip.startingPrice === null) {
      trip.startingPrice = 0;
      modified = true;
    }

    if (modified) {
      await trip.save();
      tripsUpdated++;
    }
  }
  console.log(`Updated ${tripsUpdated} trips.`);

  // Check journey days directly using the raw collection to see if any legacy 'day' fields need migration
  const rawDays = await mongoose.connection.collection('journeydays').find({ dayNumber: { $exists: false } }).toArray();
  console.log(`Found ${rawDays.length} journey days lacking dayNumber.`);

  let daysUpdated = 0;
  for (const rawDay of rawDays) {
    const dayNumber = rawDay.dayNumber || rawDay.day || 1;
    await mongoose.connection.collection('journeydays').updateOne(
      { _id: rawDay._id },
      { $set: { dayNumber } }
    );
    daysUpdated++;
  }
  console.log(`Updated ${daysUpdated} journey days.`);

  await mongoose.disconnect();
  console.log('Backfill complete.');
}

backfill().catch((err) => {
  console.error('Backfill error:', err);
  process.exit(1);
});
