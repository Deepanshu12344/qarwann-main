/* eslint-disable no-console */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Trip = require('../src/models/Trip');

const SITEMAP_PATH = path.resolve(__dirname, '../../public/sitemap.xml');
const BASE_URL = 'https://www.qarwaan.com';

const STATIC_ROUTES = [
  '/',
  '/trips',
  '/about-us',
  '/contact',
  '/weekend-getaways',
  '/privacy',
  '/terms-and-conditions',
  '/cancellation',
  '/disclaimer',
];

async function generateSitemap() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const trips = await Trip.find({ status: 'published' }).select('slug updatedAt').sort({ order: 1 });
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const route of STATIC_ROUTES) {
    xml += `  <url>\n    <loc>${BASE_URL}${route}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
  }

  for (const trip of trips) {
    const lastmod = trip.updatedAt ? new Date(trip.updatedAt).toISOString().split('T')[0] : today;
    xml += `  <url>\n    <loc>${BASE_URL}/trips/${trip.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n  </url>\n`;
  }

  xml += '</urlset>\n';

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
  console.log(`Generated dynamic sitemap with ${STATIC_ROUTES.length + trips.length} URLs at: ${SITEMAP_PATH}`);

  await mongoose.disconnect();
}

generateSitemap().catch((err) => {
  console.error('Error generating sitemap:', err);
  process.exit(1);
});
