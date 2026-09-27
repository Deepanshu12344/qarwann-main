const router = require('express').Router();
const validate = require('../middleware/validate');
const { requireAdmin, requireCsrf } = require('../middleware/auth');
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
  .post(requireAdmin, requireCsrf, validate({ body: journeyDayCreateSchema }), ctrl.createJourneyDay);

router
  .route('/:id')
  .get(validate({ params: idParamSchema }), ctrl.getJourneyDay)
  .patch(
    requireAdmin, requireCsrf,
    validate({ params: idParamSchema, body: journeyDayUpdateSchema }),
    ctrl.updateJourneyDay
  )
  .delete(requireAdmin, requireCsrf, validate({ params: idParamSchema }), ctrl.deleteJourneyDay);

module.exports = router;
