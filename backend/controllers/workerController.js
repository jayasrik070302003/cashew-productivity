// ─────────────────────────────────────────────
// Worker Controller
// ─────────────────────────────────────────────
const { Worker, WorkerLog, Batch } = require('../models');
const { Op } = require('sequelize');

/** POST /api/workers */
exports.create = async (req, res, next) => {
  try {
    const worker = await Worker.create(req.body);
    res.status(201).json({ success: true, data: worker });
  } catch (err) { next(err); }
};

/** GET /api/workers */
exports.getAll = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};
    if (role)   where.role = role;
    if (search) where.name = { [Op.like]: `%${search}%` };
    const workers = await Worker.findAll({ where, order: [['name', 'ASC']] });
    res.json({ success: true, data: workers });
  } catch (err) { next(err); }
};

/** GET /api/workers/:id */
exports.getOne = async (req, res, next) => {
  try {
    const worker = await Worker.findByPk(req.params.id, {
      include: [{ model: WorkerLog, as: 'logs', include: [{ model: Batch, as: 'batch' }] }],
    });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    res.json({ success: true, data: worker });
  } catch (err) { next(err); }
};

/** PUT /api/workers/:id */
exports.update = async (req, res, next) => {
  try {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    await worker.update(req.body);
    res.json({ success: true, data: worker });
  } catch (err) { next(err); }
};

/** DELETE /api/workers/:id */
exports.remove = async (req, res, next) => {
  try {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    await worker.destroy();
    res.json({ success: true, message: 'Worker deleted' });
  } catch (err) { next(err); }
};
