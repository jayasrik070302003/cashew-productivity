const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/rawController');
const validate = require('../middlewares/validate');

router.post(
  '/',
  [
    body('supplier_id').isInt({ min: 1 }).withMessage('Valid supplier_id required'),
    body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be > 0'),
    body('cost_per_kg').isFloat({ gt: 0 }).withMessage('cost_per_kg must be > 0'),
    body('date').isDate().withMessage('Valid date required (YYYY-MM-DD)'),
  ],
  validate,
  ctrl.create
);
router.get('/', ctrl.getAll);
router.delete('/:id', ctrl.remove);

module.exports = router;
