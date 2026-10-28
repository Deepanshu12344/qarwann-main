const mongoose = require('mongoose');
const slugify = require('slugify');

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: '', trim: true },
    alt: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const GalleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: '', trim: true },
    alt: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const HowItWorksItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

function castImage(val) {
  if (!val) return null;
  if (typeof val === 'string') return { url: val, publicId: '', alt: '' };
  return val;
}

function castGallery(val) {
  if (!Array.isArray(val)) return [];
  return val.map((item) => (typeof item === 'string' ? { url: item, publicId: '', alt: '', caption: '' } : item));
}

const TripSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },

    category: {
      type: String,
      required: true,
      enum: ['journey', 'weekend'],
      default: 'journey',
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'published'],
      default: 'published',
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },

    destination: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
    citiesCovered: [{ type: String, trim: true }],
    startPoint: { type: String, required: true, trim: true },
    endPoint: { type: String, required: true, trim: true },
    bestSeason: [{ type: String, trim: true }],
    idealFor: [{ type: String, trim: true }],
    tripType: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],

    duration: { type: String, required: true, trim: true }, // e.g. "6 Nights / 7 Days"
    durationDays: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 0 },
    startingPrice: { type: Number, required: true, min: 0, default: 0 },

    detailedOverview: { type: String, default: '' },
    whyThisTrip: { type: String, default: '' },
    keyExperiences: [{ type: String, trim: true }],

    coverImage: { type: ImageSchema, default: null, set: castImage },
    gallery: { type: [GalleryImageSchema], default: [], set: castGallery },
    locationBanners: { type: Map, of: String, default: {} },

    inclusions: [{ type: String, trim: true }],
    exclusions: [{ type: String, trim: true }],
    howItWorks: [HowItWorksItemSchema],

    seoTitle: { type: String, trim: true, default: '' },
    seoDescription: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
  }
);

TripSchema.pre('validate', function (next) {
  if (this.packageName && !this.slug) {
    this.slug = slugify(this.packageName, { lower: true, strict: true });
  }
  next();
});

// Compound index for listing/filtering
TripSchema.index({ category: 1, status: 1, featured: -1, order: 1 });

// Full text search index on canonical text fields
TripSchema.index(
  {
    packageName: 'text',
    destination: 'text',
    country: 'text',
    detailedOverview: 'text',
    tags: 'text',
  },
  {
    weights: {
      packageName: 10,
      destination: 8,
      country: 6,
      tags: 4,
      detailedOverview: 2,
    },
  }
);

module.exports = mongoose.model('Trip', TripSchema);
