const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookingsV2.controller');

router.get('/', controller.getAll);
router.get('/user', controller.getByUser);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id/status', controller.updateStatus);

module.exports = router;
