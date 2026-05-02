// ─────────────────────────────────────────────
// Batch Controller
// ─────────────────────────────────────────────
const { Batch, WorkerLog, Worker } = require('../models');
const { Op } = require('sequelize');

/** POST /api/batches */
exports.create = async (req, res, next) => {
  try {
    const batch = await Batch.create(req.body);
    res.status(201).json({ success: true, data: batch });
  } catch (err) { next(err); }
};

/** GET /api/batches  — supports ?start_date, ?end_date, ?status */
exports.getAll = async (req, res, next) => {
  try {
    const { start_date, end_date, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (start_date || end_date) {
      where.start_date = {};
      if (start_date) where.start_date[Op.gte] = start_date;
      if (end_date)   where.start_date[Op.lte] = end_date;
    }
    const batches = await Batch.findAll({
      where,
      include: [{
        model: WorkerLog, as: 'workerLogs',
        include: [{ model: Worker, as: 'worker', attributes: ['id', 'name', 'role'] }],
      }],
      order: [['start_date', 'DESC']],
    });
    res.json({ success: true, data: batches });
  } catch (err) { next(err); }
};

/** PUT /api/batches/:id — update output/close batch */
exports.update = async (req, res, next) => {
  try {
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    await batch.update(req.body);
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
};

/** DELETE /api/batches/:id */
exports.remove = async (req, res, next) => {
  try {
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    await batch.destroy();
    res.json({ success: true, message: 'Batch deleted' });
  } catch (err) { next(err); }
};
