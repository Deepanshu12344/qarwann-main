const { z } = require('zod');

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

const journeyDayCreateSchema = z.object({
  tripId: objectId,
  day: z.coerce.number().int().min(1).max(365),
  route: z.string().trim().max(500).optional(),
  location: z.string().trim().max(200).optional(),
  phase: z.string().trim().max(100).optional(),
  nature: z.boolean().optional(),
  adventure: z.boolean().optional(),
  culture: z.boolean().optional(),
  spiritual: z.boolean().optional(),
  heritage: z.boolean().optional(),
  modern: z.boolean().optional(),
  keyAttractions: z.array(z.string().trim().max(500)).max(100).optional(),
  experienceDetails: z.string().max(10000).optional(),
  hiddenGems: z.array(z.string().trim().max(500)).max(100).optional(),
  activities: z.array(z.string().trim().max(500)).max(100).optional(),
  localFood: z.array(z.string().trim().max(500)).max(100).optional(),
  localExperience: z.string().max(5000).optional(),
  festivals: z.array(z.string().trim().max(200)).max(50).optional(),
  stayType: z.string().trim().max(100).optional(),
  accessibility: z.string().trim().max(1000).optional(),
}).strict();

const journeyDayUpdateSchema = journeyDayCreateSchema.partial();

const listQuerySchema = z.object({
  tripId: objectId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.string().trim().default('day'),
}).strict();

const idParamSchema = z.object({ id: objectId });

module.exports = {
  journeyDayCreateSchema,
  journeyDayUpdateSchema,
  listQuerySchema,
  idParamSchema,
};
