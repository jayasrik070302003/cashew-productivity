const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/saleController');
const validate = require('../middlewares/validate');

router.post(
  '/',
  [
    body('quantity_sold').isFloat({ gt: 0 }).withMessage('quantity_sold must be > 0'),
    body('price_per_kg').isFloat({ gt: 0 }).withMessage('price_per_kg must be > 0'),
    body('date').isDate().withMessage('Valid date required'),
  ],
  validate,
  ctrl.create
);
router.get('/', ctrl.getAll);
router.delete('/:id', ctrl.remove);

module.exports = router;
