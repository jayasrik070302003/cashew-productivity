const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/workerLogController');
const validate = require('../middlewares/validate');

router.post(
  '/',
  [
    body('worker_id').isInt({ min: 1 }).withMessage('Valid worker_id required'),
    body('batch_id').isInt({ min: 1 }).withMessage('Valid batch_id required'),
    body('log_date').isDate().withMessage('Valid log_date required (YYYY-MM-DD)'),
  ],
  validate,
  ctrl.create
);
router.get('/', ctrl.getAll);

module.exports = router;
