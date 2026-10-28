/* eslint-disable no-console */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../src/services/cloudinary.service');

const ROOT = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const MAP_FILE = path.resolve(__dirname, '../data/cloudinary-map.json');

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const includeRemote = args.includes('--include-remote');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const concurrencyArg = args.find((a) => a.startsWith('--concurrency='));
const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 3;

/**
 * Clean a relative path to make a clean, URL-safe Cloudinary public ID.
 * e.g. "/images/andaman/Andaman Main Photo.jpeg" -> "qarwaan/images/andaman/andaman-main-photo"
 */
function toPublicId(relativeImagePath) {
  const parsed = path.parse(relativeImagePath.replace(/^\//, ''));
  const dirParts = parsed.dir
    .split('/')
    .map((p) => p.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
  const baseName = parsed.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');

  const allParts = ['qarwaan', ...dirParts, baseName].filter(Boolean);
  return allParts.join('/');
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

function saveMap(map) {
  const dir = path.dirname(MAP_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2), 'utf8');
}

function collectImagesFromCatalogue() {
  const tsPath = path.join(ROOT, 'src/data/qarwaan-itineraries.ts');
  if (!fs.existsSync(tsPath)) {
    console.error('Catalogue file not found at:', tsPath);
    return [];
  }
  const content = fs.readFileSync(tsPath, 'utf8');
  const start = content.indexOf('[');
  const end = content.lastIndexOf('] as const');
  const itineraries = JSON.parse(content.slice(start, end + 1));

  const imageSet = new Set();
  itineraries.forEach((trip) => {
    if (trip.coverImage) imageSet.add(trip.coverImage);
    if (trip.locationBanners) {
      Object.values(trip.locationBanners).forEach((url) => imageSet.add(url));
    }
    (trip.journeyDays || []).forEach((day) => {
      (day.images || []).forEach((img) => imageSet.add(img));
    });
  });

  return Array.from(imageSet);
}

async function main() {
  console.log('=== Qarwaan Cloudinary Image Migration ===');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (no uploads will be made)' : 'LIVE'}`);
  console.log(`Force re-upload: ${isForce}`);
  console.log(`Concurrency: ${concurrency}`);
  if (limit !== Infinity) console.log(`Limit: ${limit} images`);

  const map = loadMap();
  const rawList = collectImagesFromCatalogue();
  console.log(`Collected ${rawList.length} distinct image paths from static catalogue.`);

  const toUpload = [];
  let skippedCached = 0;
  let remoteKept = 0;
  let missingFiles = 0;

  for (const item of rawList) {
    if (item.startsWith('http://') || item.startsWith('https://')) {
      if (!includeRemote) {
        if (!map[item]) {
          map[item] = { url: item, publicId: '', isRemote: true };
        }
        remoteKept++;
        continue;
      }
    }

    if (!isForce && map[item] && map[item].url && map[item].url.startsWith('https://res.cloudinary.com')) {
      skippedCached++;
      continue;
    }

    const cleanRel = item.replace(/^\//, '');
    const localDiskPath = path.join(PUBLIC_DIR, cleanRel);

    if (!fs.existsSync(localDiskPath)) {
      console.warn(`[WARNING] File not found on disk: ${localDiskPath}`);
      missingFiles++;
      continue;
    }

    const publicId = toPublicId(item);
    toUpload.push({
      itemKey: item,
      diskPath: localDiskPath,
      publicId,
    });
  }

  saveMap(map);

  console.log(`Images to process: ${toUpload.length}`);
  console.log(`Already in Cloudinary cache: ${skippedCached}`);
  console.log(`Remote CDN URLs retained: ${remoteKept}`);
  if (missingFiles > 0) console.log(`Missing files skipped: ${missingFiles}`);

  const queue = toUpload.slice(0, limit);
  if (queue.length === 0) {
    console.log('No new images to upload. Migration is up-to-date.');
    return;
  }

  if (isDryRun) {
    console.log('\n--- DRY-RUN PREVIEW (First 20 items) ---');
    queue.slice(0, 20).forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.itemKey} -> public_id: "${item.publicId}"`);
    });
    if (queue.length > 20) {
      console.log(`... and ${queue.length - 20} more items.`);
    }
    console.log('\nDry-run complete. Run without --dry-run to perform uploads.');
    return;
  }

  console.log(`\nStarting upload of ${queue.length} images...`);
  let completed = 0;
  let failed = 0;

  async function worker(items) {
    for (const task of items) {
      try {
        const uploadResult = await cloudinary.uploader.upload(task.diskPath, {
          public_id: task.publicId,
          overwrite: isForce,
          resource_type: 'image',
        });

        map[task.itemKey] = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
        };
        saveMap(map);
        completed++;
        console.log(`[${completed}/${queue.length}] Uploaded: ${task.itemKey} -> ${uploadResult.secure_url}`);
      } catch (err) {
        failed++;
        console.error(`[ERROR] Failed to upload ${task.itemKey}:`, err.message);
      }
    }
  }

  // Partition queue across concurrency workers
  const buckets = Array.from({ length: concurrency }, () => []);
  queue.forEach((item, index) => {
    buckets[index % concurrency].push(item);
  });

  await Promise.all(buckets.map((bucket) => worker(bucket)));

  saveMap(map);
  console.log('\n=== Migration Finished ===');
  console.log(`Successfully uploaded: ${completed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Mapping saved to: ${MAP_FILE}`);
}

main().catch((err) => {
  console.error('Fatal error in migrate-images.js:', err);
  process.exit(1);
});
