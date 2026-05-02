const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/workerController');
const validate = require('../middlewares/validate');

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Worker name is required'),
    body('role').isIn(['breaking', 'drying', 'sorting']).withMessage('Role must be breaking/drying/sorting'),
    body('payment_type').isIn(['daily', 'per_kg']).withMessage('payment_type must be daily or per_kg'),
    body('rate').optional({ checkFalsy: true }).isFloat({ gt: 0 }).withMessage('Rate must be > 0'),
  ],
  validate,
  ctrl.create
);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
