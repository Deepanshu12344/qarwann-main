const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const GREEN = '#004643';
const IVORY = '#F0EDE5';
const ROOT = path.resolve(__dirname, '../../..');
const PUBLIC = path.join(ROOT, 'public');
const LOGO = path.join(ROOT, 'qarwaan-dark-logo.png');

function safeAsset(image) {
  if (!image || typeof image !== 'string' || !image.startsWith('/')) return null;
  const resolved = path.resolve(PUBLIC, `.${image}`);
  if (!resolved.startsWith(`${PUBLIC}${path.sep}`) || !fs.existsSync(resolved)) return null;
  return /\.(png|jpe?g)$/i.test(resolved) ? resolved : null;
}

function slug(value) {
  return String(value || 'journey').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 70);
}

function renderCover(doc, itinerary) {
  const { width, height } = doc.page;
  doc.rect(0, 0, width, height).fill(IVORY);
  const image = safeAsset(itinerary.image);
  if (image) doc.image(image, 0, 0, { width, height: height * 0.52, cover: [width, height * 0.52] });
  else {
    doc.rect(0, 0, width, height * 0.52).fill(GREEN);
    doc.circle(width * 0.78, height * 0.18, 72).fill('#205050');
  }
  doc.fillColor(GREEN);
  if (fs.existsSync(LOGO)) doc.image(LOGO, 48, height * 0.57, { width: 140 });
  else doc.font('Helvetica-Bold').fontSize(17).text('QARWAAN', 48, height * 0.58);
  doc.font('Times-Bold').fontSize(31).fillColor(GREEN).text(itinerary.title, 48, height * 0.68, { width: width - 96 });
  doc.font('Helvetica').fontSize(11).fillColor(GREEN).text(`${itinerary.destination}  ·  ${itinerary.durationDays} days  ·  ${itinerary.travellers} traveller${itinerary.travellers === 1 ? '' : 's'}`, 48, height * 0.82);
  if (itinerary.budgetEstimate) doc.fontSize(10).fillColor('#205050').text(`Estimated budget: ${itinerary.budgetEstimate}`, 48, height * 0.86);
}

function header(doc, pageTitle) {
  const { width } = doc.page;
  doc.fillColor(GREEN).rect(0, 0, width, 46).fill(GREEN);
  doc.fillColor(IVORY).font('Helvetica-Bold').fontSize(10).text('QARWAAN', 48, 17);
  doc.font('Helvetica').fontSize(9).text(pageTitle.toUpperCase(), width - 175, 17, { width: 127, align: 'right' });
}

function footer(doc, pageNumber) {
  const { width, height } = doc.page;
  doc.fillColor('#6D7F7C').font('Helvetica').fontSize(8).text('Your next unforgettable journey starts with Qarwaan.', 48, height - 38);
  doc.text(String(pageNumber), width - 58, height - 38, { width: 10, align: 'right' });
}

function writeDay(doc, day, y) {
  const { width, height } = doc.page;
  const lineCount = Math.max(1, day.activities?.length || 0);
  const heightNeeded = 82 + lineCount * 17 + (day.localTip ? 22 : 0);
  if (y + heightNeeded > height - 70) {
    footer(doc, doc.bufferedPageRange().count + 1);
    doc.addPage();
    header(doc, 'Your Journey');
    y = 72;
  }
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(10).text(`DAY ${day.day}`, 48, y);
  doc.font('Times-Bold').fontSize(17).text(day.title, 102, y - 4, { width: width - 150 });
  y += 27;
  doc.font('Helvetica').fontSize(9.5).fillColor('#334B48');
  for (const activity of day.activities || []) {
    doc.text(`• ${activity}`, 102, y, { width: width - 150, lineGap: 2 });
    y += 17;
  }
  if (day.places?.length) {
    doc.fillColor('#6D7F7C').fontSize(8.5).text(`Places: ${day.places.join(' · ')}`, 102, y, { width: width - 150 });
    y += 16;
  }
  if (day.localTip) {
    doc.fillColor('#205050').fontSize(8.5).text(`Travel note: ${day.localTip}`, 102, y, { width: width - 150 });
    y += 22;
  }
  doc.moveTo(102, y + 4).lineTo(width - 48, y + 4).strokeColor('#D7D6CD').stroke();
  return y + 18;
}

function createBrochure(itinerary, contact) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, info: { Title: `${itinerary.title} | Qarwaan` } });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), filename: `Qarwaan_${slug(itinerary.destination)}_${itinerary.durationDays}_Day_Itinerary.pdf` }));

    renderCover(doc, itinerary);
    doc.addPage();
    header(doc, 'Your Journey');
    let y = 75;
    doc.fillColor(GREEN).font('Times-Bold').fontSize(25).text('Your Journey', 48, y);
    y += 38;
    if (itinerary.overview) {
      doc.font('Helvetica').fontSize(10).fillColor('#334B48').text(itinerary.overview, 48, y, { width: 499, lineGap: 4 });
      y += doc.heightOfString(itinerary.overview, { width: 499, lineGap: 4 }) + 20;
    }
    for (const day of itinerary.days) y = writeDay(doc, day, y);
    footer(doc, 2);

    doc.addPage();
    header(doc, 'Plan with Qarwaan');
    doc.fillColor(GREEN).font('Times-Bold').fontSize(27).text('Let Qarwaan plan your journey', 48, 88, { width: 470 });
    doc.font('Helvetica').fontSize(12).fillColor('#334B48').text('Love this itinerary? Let our travel team help personalise the details and turn your travel plans into reality.', 48, 145, { width: 455, lineGap: 5 });
    let contactY = 230;
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(11).text('PLAN THIS TRIP WITH QARWAAN', 48, contactY);
    contactY += 30;
    const enquiryUrl = `${contact.siteUrl.replace(/\/$/, '')}/enquire?trip=${encodeURIComponent(itinerary.destination)}&duration=${encodeURIComponent(`${itinerary.durationDays} days`)}`;
    doc.font('Helvetica').fontSize(10).fillColor('#334B48').text(contact.siteUrl, 48, contactY, { link: contact.siteUrl, underline: true });
    contactY += 21;
    if (contact.email) { doc.text(contact.email, 48, contactY, { link: `mailto:${contact.email}`, underline: true }); contactY += 21; }
    if (contact.phone) { doc.text(contact.phone, 48, contactY); contactY += 21; }
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(11).text('Open your enquiry', 48, contactY + 18, { link: enquiryUrl, underline: true });
    footer(doc, 3);
    doc.end();
  });
}

module.exports = { createBrochure };
