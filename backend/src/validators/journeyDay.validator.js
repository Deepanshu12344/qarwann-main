const { z } = require('zod');

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

const journeyDayCreateSchema = z.object({
  tripId: objectId,
  day: z.coerce.number().int().min(1),
  route: z.string().trim().optional(),
  location: z.string().trim().optional(),
  phase: z.string().trim().optional(),
  nature: z.boolean().optional(),
  adventure: z.boolean().optional(),
  culture: z.boolean().optional(),
  spiritual: z.boolean().optional(),
  heritage: z.boolean().optional(),
  modern: z.boolean().optional(),
  keyAttractions: z.array(z.string().trim()).optional(),
  experienceDetails: z.string().optional(),
  hiddenGems: z.array(z.string().trim()).optional(),
  activities: z.array(z.string().trim()).optional(),
  localFood: z.array(z.string().trim()).optional(),
  localExperience: z.string().optional(),
  festivals: z.array(z.string().trim()).optional(),
  stayType: z.string().trim().optional(),
  accessibility: z.string().trim().optional(),
});

const journeyDayUpdateSchema = journeyDayCreateSchema.partial();

const listQuerySchema = z.object({
  tripId: objectId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.string().trim().default('day'),
});

const idParamSchema = z.object({ id: objectId });

module.exports = {
  journeyDayCreateSchema,
  journeyDayUpdateSchema,
  listQuerySchema,
  idParamSchema,
};
