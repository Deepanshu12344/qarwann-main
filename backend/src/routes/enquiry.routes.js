const router = require('express').Router();
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/enquiry.controller');
const {
  enquiryCreateSchema,
  enquiryUpdateSchema,
  listQuerySchema,
  idParamSchema,
} = require('../validators/enquiry.validator');

// Public create endpoint
router.post('/', validate({ body: enquiryCreateSchema }), ctrl.createEnquiry);

// Admin-only management
router.get('/', requireAdmin, validate({ query: listQuerySchema }), ctrl.listEnquiries);
router.get('/export', requireAdmin, ctrl.exportEnquiries);
router.get('/:id', requireAdmin, validate({ params: idParamSchema }), ctrl.getEnquiry);
router.patch('/:id', requireAdmin, validate({ params: idParamSchema, body: enquiryUpdateSchema }), ctrl.updateEnquiry);
router.delete('/:id', requireAdmin, validate({ params: idParamSchema }), ctrl.deleteEnquiry);

module.exports = router;
