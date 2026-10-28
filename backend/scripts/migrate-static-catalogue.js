/* eslint-disable no-console */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Trip = require('../src/models/Trip');
const JourneyDay = require('../src/models/JourneyDay');
const { deriveDestination } = require('../src/utils/destination');

const ROOT = path.resolve(__dirname, '../..');
const MAP_FILE = path.resolve(__dirname, '../data/cloudinary-map.json');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

const WEEKEND_SLUGS = new Set([
  'jim-corbett-wild-trails-and-forest-escape',
  'rishikesh-reset-by-the-ganga-weekend-escape',
  'coorg-coffee-forests-kodava-culture',
  'hampi-heritage-weekend-escape',
  'kasauli-colonial-charm-pine-trails-slow-mountain-living',
  'ooty-coonoor-tea-trails-misty-hills-nilgiri-escapes',
  'darjeeling-tea-trails-himalayan-views-toy-train-heritage',
]);

function detectCategory(slug, packageName = '') {
  if (WEEKEND_SLUGS.has(slug)) return 'weekend';
  const lower = `${slug} ${packageName}`.toLowerCase();
  if (lower.includes('weekend') || lower.includes('getaway')) return 'weekend';
  return 'journey';
}

function parseDuration(durationStr, fallbackDays = 1) {
  let days = fallbackDays;
  if (typeof durationStr === 'string') {
    const daysMatch = durationStr.match(/(\d+)\s*days?/i);
    if (daysMatch) days = parseInt(daysMatch[1], 10);
  }
  let nights = Math.max(days - 1, 0);
  if (typeof durationStr === 'string') {
    const nightsMatch = durationStr.match(/(\d+)\s*nights?/i);
    if (nightsMatch) nights = parseInt(nightsMatch[1], 10);
  }
  return { durationDays: days, nights };
}

function loadMap() {
  if (fs.existsSync(MAP_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function resolveImage(map, imgPath, alt = '') {
  if (!imgPath) return null;
  if (map[imgPath] && map[imgPath].url) {
    return {
      url: map[imgPath].url,
      publicId: map[imgPath].publicId || '',
      alt: alt || '',
    };
  }
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
    return {
      url: imgPath,
      publicId: '',
      alt: alt || '',
    };
  }
  // Fallback for missing file or unmapped local path
  return {
    url: imgPath,
    publicId: '',
    alt: alt || '',
  };
}

async function runMigration() {
  console.log('=== Qarwaan Static Catalogue Migration to MongoDB Atlas ===');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (no database writes)' : 'LIVE'}`);

  const cataloguePath = path.join(ROOT, 'src/data/qarwaan-itineraries.ts');
  if (!fs.existsSync(cataloguePath)) {
    throw new Error(`Catalogue file not found at: ${cataloguePath}`);
  }

  const raw = fs.readFileSync(cataloguePath, 'utf8');
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf('] as const');
  const itineraries = JSON.parse(raw.slice(start, end + 1));
  console.log(`Loaded ${itineraries.length} itineraries from static catalogue.`);

  const cloudinaryMap = loadMap();
  console.log(`Loaded ${Object.keys(cloudinaryMap).length} image mappings from Cloudinary cache.`);

  const uri = process.env.MONGODB_URI;
  if (!uri && !isDryRun) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  if (!isDryRun) {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas.');
  }

  const stats = {
    tripsProcessed: 0,
    tripsCreated: 0,
    tripsUpdated: 0,
    journeyDaysUpserted: 0,
  };

  for (let idx = 0; idx < itineraries.length; idx++) {
    const rawTrip = itineraries[idx];
    const slug = rawTrip.slug;
    const category = detectCategory(slug, rawTrip.packageName);
    const destination = deriveDestination(rawTrip);
    const { durationDays, nights } = parseDuration(
      rawTrip.duration,
      rawTrip.durationDays || (rawTrip.journeyDays ? rawTrip.journeyDays.length : 1)
    );
    const startingPrice = rawTrip.budgetFrom ?? 0;

    const coverImageObj = resolveImage(cloudinaryMap, rawTrip.coverImage, rawTrip.packageName);

    // Build gallery from distinct day images and cover
    const galleryMap = new Map();
    if (coverImageObj) {
      galleryMap.set(coverImageObj.url, { ...coverImageObj, caption: rawTrip.packageName });
    }
    (rawTrip.journeyDays || []).forEach((d) => {
      (d.images || []).forEach((imgUrl) => {
        const resolved = resolveImage(cloudinaryMap, imgUrl, `${rawTrip.packageName} Day ${d.day}`);
        if (resolved && !galleryMap.has(resolved.url)) {
          galleryMap.set(resolved.url, { ...resolved, caption: `Day ${d.day} — ${d.location || ''}` });
        }
      });
    });
    const gallery = Array.from(galleryMap.values());

    // Map locationBanners with Cloudinary URLs
    const locationBanners = {};
    if (rawTrip.locationBanners && typeof rawTrip.locationBanners === 'object') {
      for (const [locKey, bannerUrl] of Object.entries(rawTrip.locationBanners)) {
        const resolved = resolveImage(cloudinaryMap, bannerUrl);
        locationBanners[locKey] = resolved ? resolved.url : bannerUrl;
      }
    }

    const tripData = {
      packageName: rawTrip.packageName,
      slug,
      category,
      status: 'published',
      featured: idx < 4,
      order: idx,
      destination,
      country: rawTrip.country || 'India',
      citiesCovered: rawTrip.citiesCovered || [],
      startPoint: rawTrip.startPoint,
      endPoint: rawTrip.endPoint,
      bestSeason: rawTrip.bestSeason || [],
      idealFor: rawTrip.idealFor || [],
      tripType: rawTrip.tripType,
      tags: Array.from(new Set([rawTrip.tripType, ...(rawTrip.idealFor || []), destination])).filter(Boolean),
      duration: rawTrip.duration,
      durationDays,
      nights,
      startingPrice,
      detailedOverview: rawTrip.detailedOverview || '',
      whyThisTrip: rawTrip.whyThisTrip || '',
      keyExperiences: rawTrip.keyExperiences || [],
      coverImage: coverImageObj,
      gallery,
      locationBanners,
      inclusions: [
        'Premium accommodations & boutique stays',
        'Daily breakfast & curated local culinary experiences',
        'Private chauffered AC transportation throughout',
        'Expert local tour guides & entry permits',
      ],
      exclusions: [
        'International or domestic airfare (unless specified)',
        'Personal expenses & travel insurance',
        'Meals not mentioned in the itinerary',
      ],
      howItWorks: [
        { title: 'Personal Consultation', description: 'We understand your travel style and tailor every detail.' },
        { title: 'Seamless Booking', description: 'Lock in dates with transparent pricing and full support.' },
        { title: 'Effortless Journey', description: 'Enjoy round-the-clock concierge and bespoke on-ground service.' },
      ],
      seoTitle: `${rawTrip.packageName} | Qarwaan Luxury Journeys`,
      seoDescription: rawTrip.detailedOverview ? rawTrip.detailedOverview.slice(0, 155) : '',
    };

    if (isDryRun) {
      console.log(`\n[DRY-RUN] Trip ${idx + 1}/${itineraries.length}: ${rawTrip.packageName}`);
      console.log(`  - Slug: ${slug}`);
      console.log(`  - Category: ${category} | Destination: ${destination}`);
      console.log(`  - Duration: ${durationDays}D / ${nights}N | Price: ₹${startingPrice}`);
      console.log(`  - Cover Image: ${coverImageObj?.url}`);
      console.log(`  - Journey Days: ${rawTrip.journeyDays ? rawTrip.journeyDays.length : 0}`);
      stats.tripsProcessed++;
      stats.journeyDaysUpserted += rawTrip.journeyDays ? rawTrip.journeyDays.length : 0;
      continue;
    }

    // Upsert trip in database
    const existingTrip = await Trip.findOne({ slug });
    let tripDoc;
    if (existingTrip) {
      tripDoc = await Trip.findByIdAndUpdate(existingTrip._id, tripData, {
        new: true,
        runValidators: true,
      });
      stats.tripsUpdated++;
      console.log(`✓ Updated Trip: ${tripData.packageName} (${slug})`);
    } else {
      tripDoc = await Trip.create(tripData);
      stats.tripsCreated++;
      console.log(`+ Created Trip: ${tripData.packageName} (${slug})`);
    }
    stats.tripsProcessed++;

    // Upsert journey days
    const journeyDays = rawTrip.journeyDays || [];
    for (const rawDay of journeyDays) {
      const dayNumber = rawDay.day;
      const dayImages = (rawDay.images || []).map((imgUrl) =>
        resolveImage(cloudinaryMap, imgUrl, `${rawTrip.packageName} Day ${dayNumber}`)
      ).filter(Boolean);

      const dayPayload = {
        tripId: tripDoc._id,
        dayNumber,
        route: rawDay.route || '',
        location: rawDay.location || '',
        phase: rawDay.phase || '',
        nature: Boolean(rawDay.nature),
        adventure: Boolean(rawDay.adventure),
        culture: Boolean(rawDay.culture),
        spiritual: Boolean(rawDay.spiritual),
        heritage: Boolean(rawDay.heritage),
        modern: Boolean(rawDay.modern),
        keyAttractions: rawDay.keyAttractions || [],
        experienceDetails: rawDay.experienceDetails || '',
        hiddenGems: rawDay.hiddenGems || [],
        activities: rawDay.activities || [],
        localFood: rawDay.localFood || [],
        localExperience: rawDay.localExperience || '',
        festivals: rawDay.festivals || ['N/A'],
        stayType: rawDay.stayType || 'Departure',
        accessibility: rawDay.accessibility || '',
        images: dayImages,
      };

      await JourneyDay.findOneAndUpdate(
        { tripId: tripDoc._id, dayNumber },
        dayPayload,
        { upsert: true, new: true, runValidators: true }
      );
      stats.journeyDaysUpserted++;
    }

    // Clean up any extra journey days if day count was reduced
    await JourneyDay.deleteMany({
      tripId: tripDoc._id,
      dayNumber: { $gt: journeyDays.length },
    });
  }

  if (!isDryRun) {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB Atlas.');
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Total Trips Processed: ${stats.tripsProcessed}`);
  if (!isDryRun) {
    console.log(`Trips Created: ${stats.tripsCreated}`);
    console.log(`Trips Updated: ${stats.tripsUpdated}`);
  }
  console.log(`Journey Days Upserted: ${stats.journeyDaysUpserted}`);
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
