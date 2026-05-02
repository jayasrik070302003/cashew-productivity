const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');

router.get('/', ctrl.summary);
router.get('/monthly-trend', ctrl.monthlyTrend);

module.exports = router;
