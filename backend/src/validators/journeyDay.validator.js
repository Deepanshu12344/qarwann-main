const { z } = require('zod');

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

const imageInputSchema = z.union([
  z.string().trim().min(1).max(2048).transform((url) => ({ url, publicId: '', alt: '' })),
  z.object({
    url: z.string().trim().min(1).max(2048),
    publicId: z.string().trim().max(500).optional().default(''),
    alt: z.string().trim().max(500).optional().default(''),
  }),
]);

const journeyDayCreateSchema = z
  .object({
    tripId: objectId,
    dayNumber: z.coerce.number().int().min(1).max(365).optional(),
    day: z.coerce.number().int().min(1).max(365).optional(),
    route: z.string().trim().max(500).optional().default(''),
    location: z.string().trim().max(200).optional().default(''),
    phase: z.string().trim().max(100).optional().default(''),
    nature: z.boolean().optional().default(false),
    adventure: z.boolean().optional().default(false),
    culture: z.boolean().optional().default(false),
    spiritual: z.boolean().optional().default(false),
    heritage: z.boolean().optional().default(false),
    modern: z.boolean().optional().default(false),
    keyAttractions: z.array(z.string().trim().max(500)).max(100).optional().default([]),
    experienceDetails: z.string().max(10000).optional().default(''),
    hiddenGems: z.array(z.string().trim().max(500)).max(100).optional().default([]),
    activities: z.array(z.string().trim().max(500)).max(100).optional().default([]),
    localFood: z.array(z.string().trim().max(500)).max(100).optional().default([]),
    localExperience: z.string().max(5000).optional().default(''),
    festivals: z.array(z.string().trim().max(200)).max(50).optional().default([]),
    stayType: z.string().trim().max(100).optional().default(''),
    accessibility: z.string().trim().max(1000).optional().default(''),
    images: z.array(imageInputSchema).max(50).optional().default([]),
  })
  .strict()
  .transform((data) => {
    const dayNumber = data.dayNumber ?? data.day;
    if (!dayNumber) {
      throw new Error('Either dayNumber or day must be provided');
    }
    const { day, ...rest } = data;
    return { ...rest, dayNumber };
  });

const journeyDayUpdateSchema = z
  .object({
    tripId: objectId.optional(),
    dayNumber: z.coerce.number().int().min(1).max(365).optional(),
    day: z.coerce.number().int().min(1).max(365).optional(),
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
    images: z.array(imageInputSchema).max(50).optional(),
  })
  .strict()
  .transform((data) => {
    if (data.day !== undefined && data.dayNumber === undefined) {
      const { day, ...rest } = data;
      return { ...rest, dayNumber: day };
    }
    const { day, ...rest } = data;
    return rest;
  });

const listQuerySchema = z
  .object({
    tripId: objectId.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sort: z.string().trim().default('dayNumber'),
  })
  .strict();

const idParamSchema = z.object({ id: objectId });

module.exports = {
  journeyDayCreateSchema,
  journeyDayUpdateSchema,
  listQuerySchema,
  idParamSchema,
};
