const express = require('express');
const router = express.Router();
const controller = require('../controllers/userStats.controller');

router.get('/:userId', controller.getStats);
router.post('/:userId/increment-booking', controller.incrementBookingCount);
router.post('/:userId/loyalty', controller.updateLoyaltyPoints);

module.exports = router;
