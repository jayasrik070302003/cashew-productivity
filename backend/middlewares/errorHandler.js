// ─────────────────────────────────────────────
// Global Error Handler Middleware
// ─────────────────────────────────────────────
module.exports = (err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry. Record already exists.',
    });
  }

  return res.status(status).json({ success: false, message });
};
