const express = require('express');
const { getGoogleReviewsController } = require('../controllers/googleReviews.controller');

const router = express.Router();
router.get('/', getGoogleReviewsController);

module.exports = router;
