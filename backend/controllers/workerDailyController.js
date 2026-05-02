const { WorkerDailyLog, Worker } = require('../models');
const { Op } = require('sequelize');

exports.getMonthlyData = async (req, res, next) => {
  try {
    const { month, year, supplier_id } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const where = {
      date: { [Op.between]: [startDate, endDate] }
    };

    if (supplier_id) {
      where.supplier_id = supplier_id;
    }

    const logs = await WorkerDailyLog.findAll({
      where,
      include: [{ model: Worker, as: 'worker', attributes: ['id', 'name'] }]
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

exports.upsertDailyLog = async (req, res, next) => {
  try {
    const { worker_id, supplier_id, date, quantity_processed } = req.body;

    if (!worker_id || !supplier_id || !date || quantity_processed === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (quantity_processed < 0) {
      return res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
    }

    // Upsert needs the unique fields to find existing record.
    // Since we updated the unique index in the model, Sequelize will use (worker_id, date, supplier_id)
    const [log, created] = await WorkerDailyLog.upsert({
      worker_id,
      supplier_id,
      date,
      quantity_processed
    });

    res.json({
      success: true,
      message: created ? 'Log created' : 'Log updated',
      data: log
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/worker-daily/report?supplier_id=...&from_date=...&to_date=... */
exports.getReportData = async (req, res, next) => {
  try {
    const { supplier_id, from_date, to_date } = req.query;

    if (!supplier_id || !from_date || !to_date) {
      return res.status(400).json({ success: false, message: 'supplier_id, from_date, and to_date are required' });
    }

    const logs = await WorkerDailyLog.findAll({
      where: {
        supplier_id,
        date: { [Op.between]: [from_date, to_date] }
      },
      include: [{ model: Worker, as: 'worker', attributes: ['name'] }]
    });

    // Calculate totals
    const total_quantity = logs.reduce((sum, log) => sum + log.quantity_processed, 0);

    // Worker breakdown
    const breakdownMap = {};
    logs.forEach(log => {
      const name = log.worker?.name || 'Unknown';
      breakdownMap[name] = (breakdownMap[name] || 0) + log.quantity_processed;
    });

    const worker_breakdown = Object.entries(breakdownMap).map(([worker_name, total]) => ({
      worker_name,
      total: parseFloat(total.toFixed(2))
    }));

    res.json({
      success: true,
      data: {
        total_quantity: parseFloat(total_quantity.toFixed(2)),
        worker_breakdown
      }
    });
  } catch (err) {
    next(err);
  }
};
