const asyncHandler = require('express-async-handler');
const Trip = require('../models/Trip');
const Enquiry = require('../models/Enquiry');
const { getSubscriberCount } = require('../services/brevo');

exports.stats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalTrips,
    totalEnquiries,
    newEnquiriesWeek,
    enquiriesByStatus,
    enquiriesPerDayAgg,
    tripsByType,
    subscriberCount,
  ] = await Promise.all([
    Trip.countDocuments(),
    Enquiry.countDocuments(),
    Enquiry.countDocuments({ createdAt: { $gte: weekAgo } }),
    Enquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Enquiry.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Trip.aggregate([{ $group: { _id: '$tripType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    getSubscriberCount().catch(() => null),
  ]);

  // Fill missing days in last 30
  const series = [];
  const map = new Map(enquiriesPerDayAgg.map((d) => [d._id, d.count]));
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, count: map.get(key) || 0 });
  }

  res.json({
    totalTrips,
    totalEnquiries,
    newEnquiriesWeek,
    subscriberCount,
    enquiriesByStatus: enquiriesByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    enquiriesPerDay: series,
    tripsByType: tripsByType.map((t) => ({ type: t._id || 'Other', count: t.count })),
  });
});
