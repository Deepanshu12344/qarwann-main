const router = require('express').Router();
const validate = require('../middleware/validate');
const { requireAdmin, requireCsrf } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const ctrl = require('../controllers/enquiry.controller');
const {
  enquiryCreateSchema,
  enquiryUpdateSchema,
  listQuerySchema,
  idParamSchema,
} = require('../validators/enquiry.validator');

// Public create endpoint
router.post('/', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many enquiries from this address. Please try again later.' }), validate({ body: enquiryCreateSchema }), ctrl.createEnquiry);

// Admin-only management
router.get('/', requireAdmin, validate({ query: listQuerySchema }), ctrl.listEnquiries);
router.get('/export', requireAdmin, validate({ query: listQuerySchema.pick({ status: true, from: true, to: true }) }), ctrl.exportEnquiries);
router.get('/:id', requireAdmin, validate({ params: idParamSchema }), ctrl.getEnquiry);
router.patch('/:id', requireAdmin, requireCsrf, validate({ params: idParamSchema, body: enquiryUpdateSchema }), ctrl.updateEnquiry);
router.delete('/:id', requireAdmin, requireCsrf, validate({ params: idParamSchema }), ctrl.deleteEnquiry);

module.exports = router;
