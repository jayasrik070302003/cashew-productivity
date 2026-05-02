const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/expenseController');
const validate = require('../middlewares/validate');

router.post(
  '/',
  [
    body('type').isIn(['tea', 'electricity', 'transport', 'misc']).withMessage('Type must be tea/electricity/transport/misc'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be > 0'),
    body('date').isDate().withMessage('Valid date required'),
  ],
  validate,
  ctrl.create
);
router.get('/', ctrl.getAll);
router.delete('/:id', ctrl.remove);

module.exports = router;
