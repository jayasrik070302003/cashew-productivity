const { WorkerDailyLog, Worker, Batch } = require('../models');
const { Op } = require('sequelize');

/** Upsert daily log: POST /api/worker-daily */
exports.upsert = async (req, res, next) => {
  try {
    const { worker_id, batch_id, date, quantity_processed } = req.body;
    
    if (!worker_id || !batch_id || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const [log, created] = await WorkerDailyLog.findOrCreate({
      where: { worker_id, batch_id, date },
      defaults: { quantity_processed: quantity_processed || 0 }
    });

    if (!created) {
      await log.update({ quantity_processed: quantity_processed || 0 });
    }

    res.json({ success: true, data: log });
  } catch (err) { next(err); }
};

/** Get batch data: GET /api/worker-daily?batch_id=... */
exports.getMonthlyData = async (req, res, next) => {
  try {
    const { batch_id, month, year } = req.query;
    if (!batch_id) {
      return res.status(400).json({ success: false, message: 'Batch ID is required' });
    }

    const where = { batch_id };
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const logs = await WorkerDailyLog.findAll({ where });

    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};

/** Get Filtered Report: GET /api/worker-daily/report?batch_id=...&from_date=...&to_date=... */
exports.getFilteredReport = async (req, res, next) => {
  try {
    const { batch_id, from_date, to_date } = req.query;
    if (!batch_id) return res.status(400).json({ success: false, message: 'Batch ID is required' });

    const where = { batch_id };
    if (from_date && to_date) {
      where.date = { [Op.between]: [from_date, to_date] };
    }

    const logs = await WorkerDailyLog.findAll({
      where,
      include: [{ model: Worker, as: 'worker' }]
    });

    // Aggregation
    let totalQty = 0;
    const workerStats = {};

    logs.forEach(l => {
      const qty = parseFloat(l.quantity_processed) || 0;
      totalQty += qty;
      
      const wName = l.worker?.name || 'Unknown';
      if (!workerStats[wName]) workerStats[wName] = 0;
      workerStats[wName] += qty;
    });

    const worker_breakdown = Object.entries(workerStats).map(([name, total]) => ({
      worker_name: name,
      total: total.toFixed(1)
    }));

    res.json({
      success: true,
      total_quantity: totalQty.toFixed(1),
      worker_breakdown
    });
  } catch (err) { next(err); }
};
