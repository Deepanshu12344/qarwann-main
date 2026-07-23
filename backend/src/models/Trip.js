const mongoose = require('mongoose');
const slugify = require('slugify');

const TripSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true, trim: true, maxlength: 200 },
    duration: { type: String, required: true, trim: true }, // e.g. "7 Days / 6 Nights"
    citiesCovered: [{ type: String, trim: true }],
    startPoint: { type: String, required: true, trim: true },
    endPoint: { type: String, required: true, trim: true },
    bestSeason: [{ type: String, trim: true }], // ["Spring","Autumn"]
    idealFor: [{ type: String, trim: true }],   // ["Couples","Families"]
    tripType: { type: String, required: true, trim: true }, // Adventure | Cultural | ...
    detailedOverview: { type: String, default: '' },
    whyThisTrip: { type: String, default: '' },
    keyExperiences: [{ type: String, trim: true }],
    slug: { type: String, unique: true, index: true },
    coverImage: { type: String, trim: true },
  },
  { timestamps: true }
);

TripSchema.pre('validate', function (next) {
  if (this.packageName && (!this.slug || this.isModified('packageName'))) {
    this.slug = slugify(this.packageName, { lower: true, strict: true });
  }
  next();
});

TripSchema.index({ packageName: 'text', detailedOverview: 'text' });

module.exports = mongoose.model('Trip', TripSchema);
