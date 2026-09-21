const { getGoogleReviews } = require('../services/googleReviewsService');

async function getGoogleReviewsController(_req, res) {
  try {
    res.json(await getGoogleReviews());
  } catch (error) {
    // Full detail stays server-side; the client gets no provider information.
    console.error('Google reviews request failed:', error);
    res.status(503).json({ message: 'Google reviews are temporarily unavailable.' });
  }
}

module.exports = { getGoogleReviewsController };
