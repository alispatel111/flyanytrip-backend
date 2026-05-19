const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flight.controller');
const { flightSearchLimiter } = require('../middlewares/rateLimiter');

// GET /api/flights/search
// Protected with rate limiter to ensure stability during high traffic (e.g., 10k users/day)
router.get('/search', flightSearchLimiter, flightController.searchFlights);
router.post('/search/multicity', flightSearchLimiter, flightController.searchMultiCityFlights);
router.get('/locations', flightController.searchLocations);
router.get('/calendar-fare', flightController.getCalendarFare);
router.post('/fare-rule', flightController.getFareRule);
router.post('/fare-quote', flightController.getFareQuote);
router.post('/ssr', flightController.getFlightSSR);

module.exports = router;
