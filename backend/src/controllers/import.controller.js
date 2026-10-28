const ExcelJS = require('exceljs');
const slugify = require('slugify');
const asyncHandler = require('express-async-handler');
const Trip = require('../models/Trip');
const JourneyDay = require('../models/JourneyDay');
const { deriveDestination } = require('../utils/destination');

const ABOUT_SHEET = 'ABOUT TRIP';
const JOURNEY_SHEET = 'JOURNEY MASTER';
const MAX_ROWS_PER_SHEET = 2_000;

const KNOWN_STARTING_PRICES = {
  'andaman-island-escape-beaches-blue-waters-island-stories': 39500,
  'bali-island-of-gods-iconic-wonders-hidden-gems': 39999,
  'bhutan-himalayan-serenity-cultural-discovery': 21999,
  'goa-coastal-charm-cultural-escape': 13500,
  'nepal-himalayan-heritage-lakes-jungle-escape': 24999,
  'kerala-serenity-escape': 13500,
  'ladakh-himalayan-expedition': 27999,
  'rajasthan-royal-heritage-desert-odyssey': 40000,
  'jim-corbett-wild-trails-and-forest-escape': 0,
  'coorg-coffee-forests-kodava-culture': 0,
  'hampi-heritage-weekend-escape': 0,
  'kasauli-colonial-charm-pine-trails-slow-mountain-living': 0,
  'rishikesh-reset-by-the-ganga-weekend-escape': 0,
  'ooty-coonoor-tea-trails-misty-hills-nilgiri-escapes': 0,
  'darjeeling-tea-trails-himalayan-views-toy-train-heritage': 0,
  'spiti-valley-expedition': 15999,
};

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

function isXlsxBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  return buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
}

function worksheetRows(worksheet) {
  const headers = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, column) => {
    headers[column] = String(cell.text || cell.value || '').trim();
  });

  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const result = {};
    for (let column = 1; column < headers.length; column += 1) {
      if (headers[column]) result[headers[column]] = row.getCell(column).text;
    }
    rows.push(result);
  });
  return rows;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

const isPlaceholder = (v) => ['', '-', '—', 'n/a', 'na'].includes(toStr(v).toLowerCase());

const toFestivals = (v) => {
  const festivals = toList(v).filter((festival) => !isPlaceholder(festival));
  return festivals.length ? festivals : ['N/A'];
};

const toStayType = (v) => {
  const stayType = toStr(v);
  return isPlaceholder(stayType) ? 'Departure' : stayType;
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

  const durationStr = toStr(get('duration', 'Duration'));
  const parsedDur = parseDuration(durationStr, 1);
  const explicitDays = toInt(get('durationDays', 'duration_days', 'days'));
  const explicitNights = toInt(get('nights'));
  const durationDays = explicitDays && explicitDays > 0 ? explicitDays : parsedDur.durationDays;
  const nights = explicitNights !== null && explicitNights >= 0 ? explicitNights : parsedDur.nights;

  const formattedDuration =
    durationStr && !durationStr.trim().match(/^\d+$/)
      ? durationStr
      : `${nights} Nights / ${durationDays} Days`;

  const parsedPrice = toInt(get('startingPrice', 'Starting Price', 'price', 'budgetFrom', 'budget'));

  return {
    packageName,
    duration: formattedDuration,
    durationDays,
    nights,
    startingPrice: parsedPrice !== null ? parsedPrice : undefined,
    country: toStr(get('country', 'Country')) || 'India',
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
  const dayNumber = toInt(get('dayNumber', 'day', 'Day', 'Day No', 'Day Number'));
  const packageName = toStr(get('packageName', 'Package Name', 'Trip', 'Trip Name'));
  if (!dayNumber || !packageName) return null;

  return {
    _packageName: packageName, // resolved to tripId later
    dayNumber,
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
    festivals: toFestivals(get('festivals', 'Festivals')),
    stayType: toStayType(get('stayType', 'Stay Type', 'stay')),
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
  if (!isXlsxBuffer(req.file.buffer)) {
    res.status(400);
    throw new Error('Uploaded file is not a valid .xlsx workbook');
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(req.file.buffer);
  } catch {
    res.status(400);
    throw new Error('Could not parse Excel file');
  }

  const summary = {
    tripsAdded: 0,
    tripsUpdated: 0,
    tripsSkipped: 0,
    journeyDaysAdded: 0,
    journeyDaysUpdated: 0,
    errors: [],
  };

  const findSheet = (name) =>
    workbook.worksheets.find((sheet) => sheet.name.trim().toLowerCase() === name.toLowerCase());

  const aboutSheet = findSheet(ABOUT_SHEET);
  const journeySheet = findSheet(JOURNEY_SHEET);

  if (!aboutSheet) {
    res.status(400);
    throw new Error(`Required sheet "${ABOUT_SHEET}" not found in workbook`);
  }
  if (!journeySheet) {
    res.status(400);
    throw new Error(`Required sheet "${JOURNEY_SHEET}" not found in workbook`);
  }

  const aboutRows = worksheetRows(aboutSheet);
  const journeyRows = worksheetRows(journeySheet);
  if (aboutRows.length > MAX_ROWS_PER_SHEET || journeyRows.length > MAX_ROWS_PER_SHEET) {
    res.status(400);
    throw new Error(`Workbook sheets must contain at most ${MAX_ROWS_PER_SHEET} rows`);
  }

  /* ---------- 1. Upsert trips ------------------------------------------- */

  const slugToId = new Map();

  for (let i = 0; i < aboutRows.length; i++) {
    const rowNum = i + 2;
    try {
      const data = mapTripRow(aboutRows[i]);
      if (!data) {
        summary.tripsSkipped++;
        continue;
      }
      const slug = slugify(data.packageName, { lower: true, strict: true });
      const destination = deriveDestination({ ...data, slug });
      const category = detectCategory(slug, data.packageName);
      const startingPrice =
        data.startingPrice !== undefined
          ? data.startingPrice
          : KNOWN_STARTING_PRICES[slug] ?? 0;

      const fullData = {
        ...data,
        slug,
        destination,
        category,
        status: 'published',
        startingPrice,
      };

      const existing = await Trip.findOne({ slug });

      if (existing) {
        await Trip.updateOne({ _id: existing._id }, { $set: fullData });
        slugToId.set(slug, existing._id);
        summary.tripsUpdated++;
      } else {
        const created = await Trip.create(fullData);
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
        { tripId, dayNumber: payload.dayNumber },
        { $set: { ...payload, tripId } },
        { upsert: true }
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
    sheetsProcessed: [aboutSheet.name, journeySheet.name],
    ...summary,
  });
});

module.exports = { importExcel };
