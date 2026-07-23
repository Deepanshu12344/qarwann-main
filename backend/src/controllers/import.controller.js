const XLSX = require('xlsx');
const slugify = require('slugify');
const asyncHandler = require('express-async-handler');
const Trip = require('../models/Trip');
const JourneyDay = require('../models/JourneyDay');

const ABOUT_SHEET = 'ABOUT TRIP';
const JOURNEY_SHEET = 'JOURNEY MASTER';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

// Normalize header keys: trim, lowercase, collapse whitespace.
const norm = (s) =>
  String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const toStr = (v) => (v === undefined || v === null ? '' : String(v).trim());

const toList = (v) => {
  if (v === undefined || v === null || v === '') return [];
  if (Array.isArray(v)) return v.map(toStr).filter(Boolean);
  return String(v)
    .split(/[,;|\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
};

const toBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = toStr(v).toLowerCase();
  return ['yes', 'y', 'true', '1', 'x', '✓', 'tick'].includes(s);
};

const toInt = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

// Build a key map from a row keyed on raw headers -> normalized accessor.
function rowAccessor(row) {
  const map = {};
  for (const k of Object.keys(row)) map[norm(k)] = row[k];
  return (...aliases) => {
    for (const a of aliases) {
      const key = norm(a);
      if (key in map) return map[key];
    }
    return undefined;
  };
}

/* -------------------------------------------------------------------------- */
/*  Row mappers                                                                */
/* -------------------------------------------------------------------------- */

function mapTripRow(row) {
  const get = rowAccessor(row);
  const packageName = toStr(get('packageName', 'Package Name', 'package'));
  if (!packageName) return null;

  return {
    packageName,
    duration: toStr(get('duration', 'Duration')),
    citiesCovered: toList(get('citiesCovered', 'Cities Covered', 'cities')),
    startPoint: toStr(get('startPoint', 'Start Point', 'starting point')),
    endPoint: toStr(get('endPoint', 'End Point', 'ending point')),
    bestSeason: toList(get('bestSeason', 'Best Season', 'season')),
    idealFor: toList(get('idealFor', 'Ideal For')),
    tripType: toStr(get('tripType', 'Trip Type', 'type')),
    detailedOverview: toStr(get('detailedOverview', 'Detailed Overview', 'overview')),
    whyThisTrip: toStr(get('whyThisTrip', 'Why This Trip')),
    keyExperiences: toList(get('keyExperiences', 'Key Experiences')),
    coverImage: toStr(get('coverImage', 'Cover Image', 'image')) || undefined,
  };
}

function mapJourneyRow(row) {
  const get = rowAccessor(row);
  const day = toInt(get('day', 'Day', 'Day No'));
  const packageName = toStr(
    get('packageName', 'Package Name', 'Trip', 'Trip Name'),
  );
  if (!day || !packageName) return null;

  return {
    _packageName: packageName, // resolved to tripId later
    day,
    route: toStr(get('route', 'Route')),
    location: toStr(get('location', 'Location')),
    phase: toStr(get('phase', 'Phase')),
    nature: toBool(get('nature', 'Nature')),
    adventure: toBool(get('adventure', 'Adventure')),
    culture: toBool(get('culture', 'Culture')),
    spiritual: toBool(get('spiritual', 'Spiritual')),
    heritage: toBool(get('heritage', 'Heritage')),
    modern: toBool(get('modern', 'Modern')),
    keyAttractions: toList(get('keyAttractions', 'Key Attractions')),
    experienceDetails: toStr(get('experienceDetails', 'Experience Details')),
    hiddenGems: toList(get('hiddenGems', 'Hidden Gems')),
    activities: toList(get('activities', 'Activities')),
    localFood: toList(get('localFood', 'Local Food')),
    localExperience: toStr(get('localExperience', 'Local Experience')),
    festivals: toList(get('festivals', 'Festivals')),
    stayType: toStr(get('stayType', 'Stay Type', 'stay')),
    accessibility: toStr(get('accessibility', 'Accessibility')),
  };
}

/* -------------------------------------------------------------------------- */
/*  Controller                                                                 */
/* -------------------------------------------------------------------------- */

const importExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded. Use form-field "file".');
  }

  let workbook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
  } catch (e) {
    res.status(400);
    throw new Error(`Could not parse Excel file: ${e.message}`);
  }

  const summary = {
    tripsAdded: 0,
    tripsUpdated: 0,
    tripsSkipped: 0,
    journeyDaysAdded: 0,
    journeyDaysUpdated: 0,
    errors: [],
  };

  // Find sheets case-insensitively
  const findSheet = (name) =>
    workbook.SheetNames.find((s) => s.trim().toLowerCase() === name.toLowerCase());

  const aboutSheetName = findSheet(ABOUT_SHEET);
  const journeySheetName = findSheet(JOURNEY_SHEET);

  if (!aboutSheetName) {
    res.status(400);
    throw new Error(`Required sheet "${ABOUT_SHEET}" not found in workbook`);
  }
  if (!journeySheetName) {
    res.status(400);
    throw new Error(`Required sheet "${JOURNEY_SHEET}" not found in workbook`);
  }

  const aboutRows = XLSX.utils.sheet_to_json(workbook.Sheets[aboutSheetName], {
    defval: '',
    raw: false,
  });
  const journeyRows = XLSX.utils.sheet_to_json(workbook.Sheets[journeySheetName], {
    defval: '',
    raw: false,
  });

  /* ---------- 1. Upsert trips ------------------------------------------- */

  // Map: slug -> trip._id, used when linking journey days.
  const slugToId = new Map();

  for (let i = 0; i < aboutRows.length; i++) {
    const rowNum = i + 2; // header row + 1-indexed
    try {
      const data = mapTripRow(aboutRows[i]);
      if (!data) {
        summary.tripsSkipped++;
        continue;
      }
      const slug = slugify(data.packageName, { lower: true, strict: true });
      const existing = await Trip.findOne({ slug });

      if (existing) {
        await Trip.updateOne({ _id: existing._id }, { $set: { ...data, slug } });
        slugToId.set(slug, existing._id);
        summary.tripsUpdated++;
      } else {
        const created = await Trip.create({ ...data, slug });
        slugToId.set(slug, created._id);
        summary.tripsAdded++;
      }
    } catch (err) {
      summary.errors.push({
        sheet: ABOUT_SHEET,
        row: rowNum,
        message: err.message,
      });
    }
  }

  /* ---------- 2. Upsert journey days ------------------------------------ */

  for (let i = 0; i < journeyRows.length; i++) {
    const rowNum = i + 2;
    try {
      const data = mapJourneyRow(journeyRows[i]);
      if (!data) continue;

      const slug = slugify(data._packageName, { lower: true, strict: true });
      let tripId = slugToId.get(slug);
      if (!tripId) {
        // Trip may exist from a previous import — try DB lookup.
        const trip = await Trip.findOne({ slug }).select('_id');
        if (!trip) {
          summary.errors.push({
            sheet: JOURNEY_SHEET,
            row: rowNum,
            message: `No trip found for package "${data._packageName}"`,
          });
          continue;
        }
        tripId = trip._id;
        slugToId.set(slug, tripId);
      }

      const { _packageName, ...payload } = data;
      const result = await JourneyDay.updateOne(
        { tripId, day: payload.day },
        { $set: { ...payload, tripId } },
        { upsert: true },
      );

      if (result.upsertedCount > 0) summary.journeyDaysAdded++;
      else if (result.modifiedCount > 0) summary.journeyDaysUpdated++;
    } catch (err) {
      summary.errors.push({
        sheet: JOURNEY_SHEET,
        row: rowNum,
        message: err.message,
      });
    }
  }

  res.json({
    success: true,
    file: req.file.originalname,
    sheetsProcessed: [aboutSheetName, journeySheetName],
    ...summary,
  });
});

module.exports = { importExcel };
