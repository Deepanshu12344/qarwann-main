const router = require('express').Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const { rateLimit } = require('../middleware/rateLimit');
const ctrl = require('../controllers/aiTravel.controller');

const text = z.string().trim().min(1).max(4000);
const preferences = z.object({
  destination: z.string().max(160).optional(), travelMonth: z.string().max(80).optional(), startDate: z.string().max(40).optional(),
  durationDays: z.coerce.number().int().min(1).max(30).optional(), travellers: z.coerce.number().int().min(1).max(50).optional(),
  budget: z.string().max(160).optional(), tripType: z.string().max(100).optional(), accommodation: z.string().max(160).optional(),
  interests: z.array(z.string().max(100)).max(8).optional(), pace: z.string().max(80).optional(), specialRequests: z.string().max(400).optional(),
}).strict();
const chatSchema = z.object({ messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: text })).min(1).max(16), preferences: preferences.optional().default({}) }).strict();
const itinerarySchema = z.object({ itinerary: z.object({}).passthrough() }).strict();

router.get('/discovery', rateLimit({ windowMs: 60 * 1000, max: 60, message: 'Too many requests. Please try again shortly.' }), ctrl.discovery);
router.post('/travel-chat', rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: 'You have reached the planning limit. Please try again later.' }), validate({ body: chatSchema }), ctrl.chat);
router.post('/brochure', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many brochure requests. Please try again later.' }), validate({ body: itinerarySchema }), ctrl.brochure);

module.exports = router;
