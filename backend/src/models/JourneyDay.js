const mongoose = require('mongoose');

const JourneyDaySchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    day: { type: Number, required: true, min: 1 },
    route: { type: String, trim: true },
    location: { type: String, trim: true },
    phase: { type: String, trim: true }, // Arrival | Exploration | Departure ...
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
    stayType: { type: String, trim: true }, // Hotel | Homestay | Camp ...
    accessibility: { type: String, trim: true },
  },
  { timestamps: true }
);

JourneyDaySchema.index({ tripId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('JourneyDay', JourneyDaySchema);
