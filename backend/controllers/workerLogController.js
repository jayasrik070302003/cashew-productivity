// ─────────────────────────────────────────────
// WorkerLog Controller
// Salary is auto-calculated based on payment_type
// ─────────────────────────────────────────────
const { WorkerLog, Worker, Batch } = require('../models');
const { Op } = require('sequelize');

/** POST /api/worker-logs */
exports.create = async (req, res, next) => {
  try {
    const { worker_id, batch_id, quantity_processed, working_days, log_date, notes } = req.body;

    // Fetch worker to determine payment_type and rate
    const worker = await Worker.findByPk(worker_id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    const batch = await Batch.findByPk(batch_id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // ── Business Logic: Salary Calculation ──
    let salary;
    if (worker.payment_type === 'per_kg') {
      if (!quantity_processed) return res.status(400).json({ success: false, message: 'quantity_processed required for per_kg workers' });
      salary = parseFloat((quantity_processed * worker.rate).toFixed(2));
    } else {
      if (!working_days) return res.status(400).json({ success: false, message: 'working_days required for daily workers' });
      salary = parseFloat((working_days * worker.rate).toFixed(2));
    }

    const log = await WorkerLog.create({
      worker_id, batch_id, quantity_processed, working_days, salary, log_date, notes,
    });

    const full = await WorkerLog.findByPk(log.id, {
      include: [
        { model: Worker, as: 'worker' },
        { model: Batch, as: 'batch' },
      ],
    });

    res.status(201).json({ success: true, data: full });
  } catch (err) { next(err); }
};

/** GET /api/worker-logs */
exports.getAll = async (req, res, next) => {
  try {
    const { worker_id, batch_id, start_date, end_date } = req.query;
    const where = {};
    if (worker_id) where.worker_id = worker_id;
    if (batch_id)  where.batch_id = batch_id;
    if (start_date || end_date) {
      where.log_date = {};
      if (start_date) where.log_date[Op.gte] = start_date;
      if (end_date)   where.log_date[Op.lte] = end_date;
    }
    const logs = await WorkerLog.findAll({
      where,
      include: [
        { model: Worker, as: 'worker' },
        { model: Batch, as: 'batch', attributes: ['id', 'batch_code', 'start_date'] },
      ],
      order: [['log_date', 'DESC']],
    });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};
