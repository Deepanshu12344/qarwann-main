const { z } = require('zod');

const imageObjectSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  publicId: z.string().trim().max(500).optional().default(''),
  alt: z.string().trim().max(500).optional().default(''),
});

const galleryItemSchema = imageObjectSchema.extend({
  caption: z.string().trim().max(500).optional().default(''),
});

const imageInputSchema = z.union([
  z.string().trim().min(1).max(2048).transform((url) => ({ url, publicId: '', alt: '' })),
  imageObjectSchema,
]);

const galleryInputSchema = z.union([
  z.string().trim().min(1).max(2048).transform((url) => ({ url, publicId: '', alt: '', caption: '' })),
  galleryItemSchema,
]);

const howItWorksItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
});

const tripCreateSchema = z.object({
  packageName: z.string().trim().min(1).max(200),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200).optional(),

  category: z.enum(['journey', 'weekend']).default('journey'),
  status: z.enum(['draft', 'published']).default('published'),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),

  destination: z.string().trim().min(1).max(200),
  country: z.string().trim().min(1).max(100).default('India'),
  citiesCovered: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  startPoint: z.string().trim().min(1).max(100),
  endPoint: z.string().trim().min(1).max(100),
  bestSeason: z.array(z.string().trim().max(100)).max(20).default([]),
  idealFor: z.array(z.string().trim().max(100)).max(20).default([]),
  tripType: z.string().trim().min(1).max(100),
  tags: z.array(z.string().trim().max(100)).max(50).default([]),

  duration: z.string().trim().min(1).max(100),
  durationDays: z.coerce.number().int().min(1),
  nights: z.coerce.number().int().min(0),
  startingPrice: z.coerce.number().min(0).default(0),

  detailedOverview: z.string().max(10000).optional().default(''),
  whyThisTrip: z.string().max(5000).optional().default(''),
  keyExperiences: z.array(z.string().trim().max(500)).max(100).default([]),

  coverImage: imageInputSchema.optional().nullable(),
  gallery: z.array(galleryInputSchema).max(50).default([]),
  locationBanners: z.record(z.string()).optional().default({}),

  inclusions: z.array(z.string().trim().max(500)).max(100).default([]),
  exclusions: z.array(z.string().trim().max(500)).max(100).default([]),
  howItWorks: z.array(howItWorksItemSchema).max(20).default([]),

  seoTitle: z.string().trim().max(200).optional().default(''),
  seoDescription: z.string().trim().max(500).optional().default(''),
}).strict();

const tripUpdateSchema = tripCreateSchema.partial();

const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.enum(['journey', 'weekend']).optional(),
  status: z.enum(['draft', 'published']).optional(),
  featured: z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean().optional()),
  destination: z.string().trim().optional(),
  country: z.string().trim().optional(),
  tripType: z.string().trim().optional(),
  idealFor: z.string().trim().optional(),
  bestSeason: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().trim().optional(), // e.g. "-createdAt", "popular", "price", "duration"
}).strict();

const idParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id'),
});

module.exports = {
  tripCreateSchema,
  tripUpdateSchema,
  listQuerySchema,
  idParamSchema,
  imageInputSchema,
  galleryInputSchema,
};
