const asyncHandler = require('express-async-handler');
const ExcelJS = require('exceljs');
const Enquiry = require('../models/Enquiry');
const { sendEnquiryEmail } = require('../services/mailer');
const { addSubscriber } = require('../services/brevo');

function safeCell(value) {
  const stringValue = String(value ?? '');
  return /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;
}

exports.createEnquiry = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.travelStartDate) payload.travelStartDate = new Date(payload.travelStartDate);
  if (payload.travelEndDate) payload.travelEndDate = new Date(payload.travelEndDate);

  const enquiry = await Enquiry.create(payload);

  // Fire-and-await notifications, but never fail the request
  const notif = { emailSent: false, emailError: '', newsletterAdded: false, newsletterError: '' };
  try {
    await sendEnquiryEmail(enquiry.toObject());
    notif.emailSent = true;
  } catch (e) {
    notif.emailError = e.message || String(e);
    console.error('[enquiry] email failed:', notif.emailError);
  }
  if (enquiry.newsletterOptIn) {
    try {
      await addSubscriber({ email: enquiry.email, name: enquiry.name });
      notif.newsletterAdded = true;
    } catch (e) {
      notif.newsletterError = e.message || String(e);
      console.error('[enquiry] brevo add failed:', notif.newsletterError);
    }
  }
  enquiry.notifications = notif;
  await enquiry.save();

  res.status(201).json({
    id: enquiry._id,
    ok: true,
    emailSent: notif.emailSent,
    newsletterAdded: notif.newsletterAdded,
  });
});

exports.listEnquiries = asyncHandler(async (req, res) => {
  const { q, status, from, to, page, limit } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { tripName: rx }, { message: rx }];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Enquiry.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
});

exports.getEnquiry = asyncHandler(async (req, res) => {
  const enq = await Enquiry.findById(req.params.id);
  if (!enq) return res.status(404).json({ message: 'Enquiry not found' });
  res.json(enq);
});

exports.updateEnquiry = asyncHandler(async (req, res) => {
  const enq = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!enq) return res.status(404).json({ message: 'Enquiry not found' });
  res.json(enq);
});

exports.deleteEnquiry = asyncHandler(async (req, res) => {
  const enq = await Enquiry.findByIdAndDelete(req.params.id);
  if (!enq) return res.status(404).json({ message: 'Enquiry not found' });
  res.json({ ok: true });
});

exports.exportEnquiries = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const items = await Enquiry.find(filter).sort({ createdAt: -1 }).lean();
  const rows = items.map((e) => ({
    Date: new Date(e.createdAt).toISOString(),
    Name: safeCell(e.name),
    Email: safeCell(e.email),
    Phone: safeCell(e.phone),
    Trip: safeCell(e.tripName),
    Travelers: e.travelers,
    'Start Date': e.travelStartDate ? new Date(e.travelStartDate).toISOString().slice(0, 10) : '',
    'End Date': e.travelEndDate ? new Date(e.travelEndDate).toISOString().slice(0, 10) : '',
    Message: safeCell(e.message),
    'Newsletter Opt-In': e.newsletterOptIn ? 'Yes' : 'No',
    Status: e.status,
    Source: safeCell(e.source),
  }));
  const headers = ['Date', 'Name', 'Email', 'Phone', 'Trip', 'Travelers', 'Start Date', 'End Date', 'Message', 'Newsletter Opt-In', 'Status', 'Source'];
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Enquiries');
  ws.columns = headers.map((header) => ({ header, key: header, width: 24 }));
  ws.addRows(rows);
  const buf = Buffer.from(await wb.xlsx.writeBuffer());
  const filename = `qarwaan-enquiries-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buf);
});
