const { z } = require('zod');

const dateInput = z.string().trim().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  'Invalid date',
);

const enquiryCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(5).max(40),
  tripName: z.string().trim().max(200).optional().default(''),
  travelers: z.coerce.number().int().min(1).max(50),
  travelStartDate: dateInput.optional(),
  travelEndDate: dateInput.optional(),
  message: z.string().trim().max(2000).optional().default(''),
  newsletterOptIn: z.boolean().optional().default(false),
  source: z.string().trim().max(60).optional().default('website'),
}).strict().refine(
  (data) => !data.travelStartDate || !data.travelEndDate || new Date(data.travelEndDate) >= new Date(data.travelStartDate),
  { message: 'Travel end date must not be before start date', path: ['travelEndDate'] },
);

const enquiryUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']).optional(),
}).strict();

const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['new', 'contacted', 'closed']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
}).strict();

const idParamSchema = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });

module.exports = { enquiryCreateSchema, enquiryUpdateSchema, listQuerySchema, idParamSchema };
