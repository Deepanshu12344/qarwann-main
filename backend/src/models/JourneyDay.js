const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: '', trim: true },
    alt: { type: String, default: '', trim: true },
  },
  { _id: false }
);

function castImages(val) {
  if (!Array.isArray(val)) return [];
  return val.map((item) => (typeof item === 'string' ? { url: item, publicId: '', alt: '' } : item));
}

const JourneyDaySchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    dayNumber: { type: Number, required: true, min: 1 },
    route: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    phase: { type: String, trim: true, default: '' }, // Arrival | Exploration | Departure ...
    nature: { type: Boolean, default: false },
    adventure: { type: Boolean, default: false },
    culture: { type: Boolean, default: false },
    spiritual: { type: Boolean, default: false },
    heritage: { type: Boolean, default: false },
    modern: { type: Boolean, default: false },
    keyAttractions: [{ type: String, trim: true }],
    experienceDetails: { type: String, default: '' },
    hiddenGems: [{ type: String, trim: true }],
    activities: [{ type: String, trim: true }],
    localFood: [{ type: String, trim: true }],
    localExperience: { type: String, default: '' },
    festivals: [{ type: String, trim: true }],
    stayType: { type: String, trim: true, default: '' }, // Hotel | Homestay | Camp ...
    accessibility: { type: String, trim: true, default: '' },
    images: { type: [ImageSchema], default: [], set: castImages },
  },
  { timestamps: true }
);

// Compound unique index on tripId and dayNumber.
// Redundant index:true on tripId alone is removed since this compound index covers prefix tripId queries.
JourneyDaySchema.index({ tripId: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model('JourneyDay', JourneyDaySchema);
