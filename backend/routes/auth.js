const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const validate = require('../middlewares/validate');

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
);

module.exports = router;
