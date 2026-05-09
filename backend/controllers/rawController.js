// ─────────────────────────────────────────────
// Raw Entry Controller
// ─────────────────────────────────────────────
const { RawEntry, Supplier } = require('../models');
const { Op } = require('sequelize');

/** POST /api/raw */
exports.create = async (req, res, next) => {
  try {
    const { quantity, cost_per_kg, supplier_id, date } = req.body;
    const { Batch } = require('../models');

    const qty  = parseFloat(quantity);
    const cost = parseFloat(cost_per_kg);

    if (isNaN(qty) || qty <= 0)  return res.status(400).json({ success: false, message: 'quantity must be a positive number' });
    if (isNaN(cost) || cost <= 0) return res.status(400).json({ success: false, message: 'cost_per_kg must be a positive number' });

    const total_cost = parseFloat((qty * cost).toFixed(2));

    // 1. Create Raw Entry
    const entry = await RawEntry.create({ 
      ...req.body, 
      quantity: qty, 
      cost_per_kg: cost, 
      total_cost 
    });

    // 2. Auto-generate Batch
    // Get Supplier for prefix
    const supplier = await Supplier.findByPk(supplier_id);
    const prefix = (supplier.name || 'SUP').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3);
    
    // Global batch count for sequential ID numbering
    const batchCount = await Batch.count({ paranoid: false });
    const suffix = String(batchCount + 1).padStart(3, '0');
    const batch_code = `${prefix}-${suffix}`;

    await Batch.create({
      batch_code,
      supplier_id,
      raw_entry_id: entry.id,
      input_quantity: qty,
      start_date: date || new Date().toISOString().split('T')[0],
      status: 'active'
    });

    const full = await RawEntry.findByPk(entry.id, { 
      include: [{ model: Supplier, as: 'supplier' }] 
    });
    
    res.status(201).json({ success: true, data: full, message: `Raw entry saved and Batch ${batch_code} created.` });
  } catch (err) { next(err); }
};

/** GET /api/raw  — supports ?start_date & ?end_date & ?supplier_id */
exports.getAll = async (req, res, next) => {
  try {
    const { start_date, end_date, supplier_id } = req.query;
    const where = {};
    if (supplier_id) where.supplier_id = supplier_id;
    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date[Op.gte] = start_date;
      if (end_date)   where.date[Op.lte] = end_date;
    }
    const entries = await RawEntry.findAll({
      where,
      include: [{ model: Supplier, as: 'supplier' }],
      order: [['date', 'DESC']],
    });
    res.json({ success: true, data: entries });
  } catch (err) { next(err); }
};

/** DELETE /api/raw/:id */
exports.remove = async (req, res, next) => {
  try {
    const entry = await RawEntry.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    await entry.destroy();
    res.json({ success: true, message: 'Raw entry deleted' });
  } catch (err) { next(err); }
};
