// ─────────────────────────────────────────────
// Sales Controller
// ─────────────────────────────────────────────
const { Sale } = require('../models');
const { Op } = require('sequelize');

/** POST /api/sales */
exports.create = async (req, res, next) => {
  try {
    const sale = await Sale.create(req.body);
    res.status(201).json({ success: true, data: sale });
  } catch (err) { next(err); }
};

/** GET /api/sales — supports ?start_date, ?end_date */
exports.getAll = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const where = {};
    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date[Op.gte] = start_date;
      if (end_date)   where.date[Op.lte] = end_date;
    }
    const sales = await Sale.findAll({ where, order: [['date', 'DESC']] });
    res.json({ success: true, data: sales });
  } catch (err) { next(err); }
};

/** DELETE /api/sales/:id */
exports.remove = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    await sale.destroy();
    res.json({ success: true, message: 'Sale deleted' });
  } catch (err) { next(err); }
};
