const router = require('express').Router();
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const {
  tripCreateSchema,
  tripUpdateSchema,
  listQuerySchema,
  idParamSchema,
} = require('../validators/trip.validator');
const ctrl = require('../controllers/trip.controller');
const journey = require('../controllers/journeyDay.controller');

router
  .route('/')
  .get(validate({ query: listQuerySchema }), ctrl.listTrips)
  .post(requireAdmin, validate({ body: tripCreateSchema }), ctrl.createTrip);

router.get('/slug/:slug', ctrl.getTripBySlug);

router.get(
  '/:id/journey-days',
  validate({ params: idParamSchema }),
  journey.listByTrip
);

router
  .route('/:id')
  .get(validate({ params: idParamSchema }), ctrl.getTrip)
  .patch(
    requireAdmin,
    validate({ params: idParamSchema, body: tripUpdateSchema }),
    ctrl.updateTrip
  )
  .delete(requireAdmin, validate({ params: idParamSchema }), ctrl.deleteTrip);

module.exports = router;
