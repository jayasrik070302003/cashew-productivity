// ─────────────────────────────────────────────
// Dashboard Controller — All KPIs in one call
// ─────────────────────────────────────────────
const { RawEntry, WorkerLog, Expense, Sale, Batch, Worker } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

/** GET /api/dashboard — supports ?start_date, ?end_date */
exports.summary = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    // Build date-range WHERE clauses
    const dateFilter = (field) => {
      if (!start_date && !end_date) return {};
      const filter = {};
      if (start_date) filter[Op.gte] = start_date;
      if (end_date)   filter[Op.lte] = end_date;
      return { [field]: filter };
    };

    // ─── Aggregate queries (all run in parallel) ───────
    const [rawEntries, workerLogs, expenses, sales, batches, workers] = await Promise.all([
      RawEntry.findAll({ where: dateFilter('date'), attributes: ['quantity', 'total_cost'] }),
      WorkerLog.findAll({
        where: dateFilter('log_date'),
        attributes: ['salary', 'quantity_processed', 'worker_id'],
        include: [{ model: Worker, as: 'worker', attributes: ['name', 'payment_type'] }],
      }),
      Expense.findAll({ where: dateFilter('date'), attributes: ['type', 'amount'] }),
      Sale.findAll({ where: dateFilter('date'), attributes: ['total_revenue', 'quantity_sold'] }),
      Batch.findAll({ where: {}, attributes: ['raw_quantity_used', 'output_quantity', 'efficiency', 'waste', 'status'] }),
      Worker.findAll({ attributes: ['id', 'name'] }),
    ]);

    // ─── Core KPIs ────────────────────────────────────
    const total_raw_cost       = rawEntries.reduce((s, r) => s + parseFloat(r.total_cost || 0), 0);
    const total_input          = rawEntries.reduce((s, r) => s + parseFloat(r.quantity || 0), 0);
    const total_worker_salary  = workerLogs.reduce((s, r) => s + parseFloat(r.salary || 0), 0);
    const total_expenses       = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const total_revenue        = sales.reduce((s, s2) => s + parseFloat(s2.total_revenue || 0), 0);
    const total_output         = batches.filter(b => b.output_quantity).reduce((s, b) => s + parseFloat(b.output_quantity || 0), 0);

    // ─── Profit ───────────────────────────────────────
    const total_cost_all = total_raw_cost + total_worker_salary + total_expenses;
    const profit         = parseFloat((total_revenue - total_cost_all).toFixed(2));
    const efficiency     = total_input > 0 ? parseFloat(((total_output / total_input) * 100).toFixed(2)) : 0;
    const waste          = parseFloat((total_input - total_output).toFixed(2));

    // ─── Alert: Negative profit ────────────────────────
    const alert = profit < 0
      ? { type: 'danger', message: `⚠️ Factory is at a LOSS of ₹${Math.abs(profit).toLocaleString()}. Review costs immediately.` }
      : null;

    // ─── Best worker (max quantity_processed) ─────────
    const workerTotals = {};
    workerLogs.forEach((log) => {
      const name = log.worker?.name || `Worker #${log.worker_id}`;
      workerTotals[name] = (workerTotals[name] || 0) + (log.quantity_processed || 0);
    });
    const bestWorkerEntry = Object.entries(workerTotals).sort((a, b) => b[1] - a[1])[0];
    const best_worker = bestWorkerEntry ? { name: bestWorkerEntry[0], quantity: bestWorkerEntry[1] } : null;

    // ─── Highest expense category ─────────────────────
    const expCat = {};
    expenses.forEach((e) => { expCat[e.type] = (expCat[e.type] || 0) + parseFloat(e.amount); });
    const topExpEntry = Object.entries(expCat).sort((a, b) => b[1] - a[1])[0];
    const top_expense_category = topExpEntry ? { type: topExpEntry[0], amount: topExpEntry[1] } : null;

    // ─── Expense breakdown (for pie chart) ────────────
    const expense_breakdown = Object.entries(expCat).map(([type, amount]) => ({ type, amount }));

    // ─── Monthly profit trend (last 6 months) for line chart ──
    const monthlyTrend = {};
    sales.forEach((s) => {
      // Use createdAt date from sale
    });

    return res.json({
      success: true,
      data: {
        total_input:         parseFloat(total_input.toFixed(2)),
        total_output:        parseFloat(total_output.toFixed(2)),
        total_raw_cost:      parseFloat(total_raw_cost.toFixed(2)),
        total_worker_salary: parseFloat(total_worker_salary.toFixed(2)),
        total_expenses:      parseFloat(total_expenses.toFixed(2)),
        total_revenue:       parseFloat(total_revenue.toFixed(2)),
        profit,
        efficiency,
        waste:               parseFloat(waste.toFixed(2)),
        alert,
        best_worker,
        top_expense_category,
        expense_breakdown,
        total_batches:       batches.length,
        completed_batches:   batches.filter(b => b.status === 'completed').length,
      },
    });
  } catch (err) { next(err); }
};

/** GET /api/dashboard/monthly-trend — revenue vs cost per month */
exports.monthlyTrend = async (req, res, next) => {
  try {
    const [sales, rawEntries, expenses, workerLogs] = await Promise.all([
      Sale.findAll({ attributes: ['date', 'total_revenue'], order: [['date', 'ASC']] }),
      RawEntry.findAll({ attributes: ['date', 'total_cost'], order: [['date', 'ASC']] }),
      Expense.findAll({ attributes: ['date', 'amount'], order: [['date', 'ASC']] }),
      WorkerLog.findAll({ attributes: ['log_date', 'salary'], order: [['log_date', 'ASC']] }),
    ]);

    const months = {};
    const addToMonth = (dateStr, key, val) => {
      const m = dateStr ? dateStr.slice(0, 7) : null;
      if (!m) return;
      if (!months[m]) months[m] = { month: m, revenue: 0, cost: 0, profit: 0 };
      months[m][key] += parseFloat(val || 0);
    };

    sales.forEach(s => addToMonth(s.date, 'revenue', s.total_revenue));
    rawEntries.forEach(r => addToMonth(r.date, 'cost', r.total_cost));
    expenses.forEach(e => addToMonth(e.date, 'cost', e.amount));
    workerLogs.forEach(l => addToMonth(l.log_date, 'cost', l.salary));

    const trend = Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // last 12 months
      .map(m => ({ ...m, profit: parseFloat((m.revenue - m.cost).toFixed(2)) }));

    res.json({ success: true, data: trend });
  } catch (err) { next(err); }
};
