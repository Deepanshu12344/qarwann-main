const router = require('express').Router();
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const {
  journeyDayCreateSchema,
  journeyDayUpdateSchema,
  listQuerySchema,
  idParamSchema,
} = require('../validators/journeyDay.validator');
const ctrl = require('../controllers/journeyDay.controller');

router
  .route('/')
  .get(validate({ query: listQuerySchema }), ctrl.listJourneyDays)
  .post(requireAdmin, validate({ body: journeyDayCreateSchema }), ctrl.createJourneyDay);

router
  .route('/:id')
  .get(validate({ params: idParamSchema }), ctrl.getJourneyDay)
  .patch(
    requireAdmin,
    validate({ params: idParamSchema, body: journeyDayUpdateSchema }),
    ctrl.updateJourneyDay
  )
  .delete(requireAdmin, validate({ params: idParamSchema }), ctrl.deleteJourneyDay);

module.exports = router;
