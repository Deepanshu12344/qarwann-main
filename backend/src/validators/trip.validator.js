const { z } = require('zod');

const tripCreateSchema = z.object({
  packageName: z.string().trim().min(1).max(200),
  duration: z.string().trim().min(1),
  citiesCovered: z.array(z.string().trim().min(1)).default([]),
  startPoint: z.string().trim().min(1),
  endPoint: z.string().trim().min(1),
  bestSeason: z.array(z.string().trim()).default([]),
  idealFor: z.array(z.string().trim()).default([]),
  tripType: z.string().trim().min(1),
  detailedOverview: z.string().optional().default(''),
  whyThisTrip: z.string().optional().default(''),
  keyExperiences: z.array(z.string().trim()).default([]),
  slug: z.string().trim().optional(),
  coverImage: z.string().trim().url().optional(),
});

const tripUpdateSchema = tripCreateSchema.partial();

const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  tripType: z.string().trim().optional(),
  idealFor: z.string().trim().optional(),
  bestSeason: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().trim().optional(), // e.g. "-createdAt"
});

const idParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id'),
});

module.exports = { tripCreateSchema, tripUpdateSchema, listQuerySchema, idParamSchema };
