// ─────────────────────────────────────────────
// Expense Controller
// ─────────────────────────────────────────────
const { Expense } = require('../models');
const { Op } = require('sequelize');

/** POST /api/expenses */
exports.create = async (req, res, next) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (err) { next(err); }
};

/** GET /api/expenses — supports ?type, ?start_date, ?end_date */
exports.getAll = async (req, res, next) => {
  try {
    const { type, start_date, end_date } = req.query;
    const where = {};
    if (type) where.type = type;
    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date[Op.gte] = start_date;
      if (end_date)   where.date[Op.lte] = end_date;
    }
    const expenses = await Expense.findAll({ where, order: [['date', 'DESC']] });
    res.json({ success: true, data: expenses });
  } catch (err) { next(err); }
};

/** DELETE /api/expenses/:id */
exports.remove = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    await expense.destroy();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { next(err); }
};
