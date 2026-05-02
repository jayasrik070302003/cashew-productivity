const express = require('express');
const router = express.Router();
const workerDailyController = require('../controllers/workerDailyController');

router.get('/', workerDailyController.getMonthlyData);
router.get('/report', workerDailyController.getFilteredReport);
router.post('/', workerDailyController.upsert);

module.exports = router;
