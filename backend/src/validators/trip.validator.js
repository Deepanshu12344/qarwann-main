const { z } = require('zod');

const tripCreateSchema = z.object({
  packageName: z.string().trim().min(1).max(200),
  duration: z.string().trim().min(1).max(100),
  citiesCovered: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  startPoint: z.string().trim().min(1).max(100),
  endPoint: z.string().trim().min(1).max(100),
  bestSeason: z.array(z.string().trim().max(100)).max(20).default([]),
  idealFor: z.array(z.string().trim().max(100)).max(20).default([]),
  tripType: z.string().trim().min(1).max(100),
  detailedOverview: z.string().max(10000).optional().default(''),
  whyThisTrip: z.string().max(5000).optional().default(''),
  keyExperiences: z.array(z.string().trim().max(500)).max(100).default([]),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200).optional(),
  coverImage: z.string().trim().url().max(2048).optional(),
}).strict();

const tripUpdateSchema = tripCreateSchema.partial();

const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  tripType: z.string().trim().optional(),
  idealFor: z.string().trim().optional(),
  bestSeason: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().trim().optional(), // e.g. "-createdAt"
}).strict();

const idParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id'),
});

module.exports = { tripCreateSchema, tripUpdateSchema, listQuerySchema, idParamSchema };
