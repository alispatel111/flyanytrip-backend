const express = require('express');
const router = express.Router();
const controller = require('../controllers/flightBooking.controller');

router.get('/:bookingId', controller.getByBookingId);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/:id/cancel', controller.cancel);

module.exports = router;
