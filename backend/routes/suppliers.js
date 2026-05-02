const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/supplierController');
const validate = require('../middlewares/validate');

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Supplier name is required')],
  validate,
  ctrl.create
);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.delete('/:id', ctrl.remove);

module.exports = router;
