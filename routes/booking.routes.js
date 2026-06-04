const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

// POST /api/booking/revalidate
router.post('/revalidate', bookingController.revalidateBooking);

// POST /api/booking/confirm
router.post('/confirm', bookingController.confirmBooking);

// GET /api/booking/details/:id
router.get('/details/:id', bookingController.getBookingDetails);

// GET /api/booking/invoice/:id/download
router.get('/invoice/:id/download', bookingController.downloadInvoice);

module.exports = router;
