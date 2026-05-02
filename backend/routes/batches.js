const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/batchController');
const validate = require('../middlewares/validate');

router.post(
  '/',
  [
    body('start_date').isDate().withMessage('Valid start_date required'),
    body('raw_quantity_used').isFloat({ gt: 0 }).withMessage('raw_quantity_used must be > 0'),
    body('batch_code').optional().trim(),
  ],
  validate,
  ctrl.create
);
router.get('/', ctrl.getAll);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
