const express = require('express');
const router = express.Router();
const workerDailyController = require('../controllers/workerDailyController');

router.get('/', workerDailyController.getMonthlyData);
router.get('/report', workerDailyController.getReportData);
router.post('/', workerDailyController.upsertDailyLog);

module.exports = router;
