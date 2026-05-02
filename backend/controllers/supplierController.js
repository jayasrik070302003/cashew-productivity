// ─────────────────────────────────────────────
// Supplier Controller
// ─────────────────────────────────────────────
const { Supplier, RawEntry } = require('../models');
const { Op } = require('sequelize');

/** POST /api/suppliers */
exports.create = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) { next(err); }
};

/** GET /api/suppliers */
exports.getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = search ? { name: { [Op.like]: `%${search}%` } } : {};
    const suppliers = await Supplier.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: suppliers });
  } catch (err) { next(err); }
};

/** GET /api/suppliers/:id */
exports.getOne = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [{ model: RawEntry, as: 'rawEntries' }],
    });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (err) { next(err); }
};

/** DELETE /api/suppliers/:id */
exports.remove = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    await supplier.destroy();
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) { next(err); }
};
