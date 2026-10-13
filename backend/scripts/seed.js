require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('../src/models/Trip');
const catalogue = require('../src/data/qarwaanCatalogue');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB:', uri);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  console.log(`Seeding ${catalogue.length} Qarwaan signature itineraries...`);
  for (const item of catalogue) {
    await Trip.findOneAndUpdate(
      { slug: item.slug },
      {
        packageName: item.packageName,
        slug: item.slug,
        duration: item.duration,
        citiesCovered: item.citiesCovered,
        startPoint: item.startPoint,
        endPoint: item.endPoint,
        bestSeason: item.bestSeason,
        idealFor: item.idealFor,
        tripType: item.tripType,
        detailedOverview: item.detailedOverview,
        keyExperiences: item.keyExperiences,
        coverImage: item.coverImage,
      },
      { upsert: true, new: true }
    );
    console.log(`  ✓ Synced ${item.packageName}`);
  }

  console.log('Seed completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Failed to seed MongoDB:', err);
  process.exit(1);
});
