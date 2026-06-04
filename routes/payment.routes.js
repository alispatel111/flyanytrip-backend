const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// POST /api/payment/create-order
router.post('/create-order', paymentController.createOrder);

// POST /api/payment/verify
router.post('/verify', paymentController.verifyPayment);

// GET /api/payment/config
router.get('/config', paymentController.getConfig);

module.exports = router;
