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
      RawEntry.findAll({ 
        where: dateFilter('date'), 
        attributes: ['quantity', 'total_cost', 'supplier_id'],
        include: [{ model: require('../models/supplier'), as: 'supplier', attributes: ['name'] }]
      }),
      WorkerLog.findAll({
        where: dateFilter('log_date'),
        attributes: ['salary', 'quantity_processed', 'worker_id'],
        include: [{ model: Worker, as: 'worker', attributes: ['name', 'payment_type'] }],
      }),
      Expense.findAll({ where: dateFilter('date'), attributes: ['type', 'amount'] }),
      Sale.findAll({ where: dateFilter('date'), attributes: ['total_revenue', 'quantity_sold'] }),
      Batch.findAll({ where: {}, attributes: ['input_quantity', 'output_quantity', 'efficiency', 'waste', 'status'] }),
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

    // ─── Best Supplier ────────────────────────────────
    const supplierTotals = {};
    rawEntries.forEach((r) => {
      const name = r.supplier?.name || 'Unknown';
      supplierTotals[name] = (supplierTotals[name] || 0) + parseFloat(r.quantity);
    });
    const bestSupEntry = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1])[0];
    const best_supplier = bestSupEntry ? { name: bestSupEntry[0], quantity: bestSupEntry[1] } : null;
    const supplier_contribution = Object.entries(supplierTotals).map(([name, quantity]) => ({ name, quantity }));

    // ─── Highest expense category ─────────────────────
    const expCat = {};
    expenses.forEach((e) => { expCat[e.type] = (expCat[e.type] || 0) + parseFloat(e.amount); });
    const topExpEntry = Object.entries(expCat).sort((a, b) => b[1] - a[1])[0];
    const top_expense_category = topExpEntry ? { type: topExpEntry[0], amount: topExpEntry[1] } : null;

    // ─── Expense breakdown (for pie chart) ────────────
    const expense_breakdown = Object.entries(expCat).map(([type, amount]) => ({ type, amount }));

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
        best_supplier,
        supplier_contribution,
        top_expense_category,
        expense_breakdown,
        total_batches:       batches.length,
        completed_batches:   batches.filter(b => b.status === 'completed').length,
        avg_efficiency:      batches.length > 0 ? (batches.reduce((s, b) => s + (b.efficiency || 0), 0) / batches.length).toFixed(1) : 0
      },
    });
  } catch (err) { next(err); }
};

/** GET /api/dashboard/monthly-trend — revenue vs cost per month */
exports.monthlyTrend = async (req, res, next) => {
  try {
    const { year } = req.query;

    const [sales, rawEntries, expenses, workerLogs, batches] = await Promise.all([
      Sale.findAll({ attributes: ['date', 'total_revenue'], order: [['date', 'ASC']] }),
      RawEntry.findAll({ attributes: ['date', 'total_cost', 'quantity'], order: [['date', 'ASC']] }),
      Expense.findAll({ attributes: ['date', 'amount'], order: [['date', 'ASC']] }),
      WorkerLog.findAll({ attributes: ['log_date', 'salary'], order: [['log_date', 'ASC']] }),
      Batch.findAll({ attributes: ['start_date', 'output_quantity'], order: [['start_date', 'ASC']] }),
    ]);

    const months = {};
    const addToMonth = (dateStr, key, val) => {
      const m = dateStr ? dateStr.slice(0, 7) : null;
      if (!m) return;
      if (year && !m.startsWith(year)) return; // Filter by year if provided
      if (!months[m]) months[m] = { month: m, revenue: 0, cost: 0, input: 0, output: 0, profit: 0 };
      months[m][key] += parseFloat(val || 0);
    };

    sales.forEach(s => addToMonth(s.date, 'revenue', s.total_revenue));
    rawEntries.forEach(r => addToMonth(r.date, 'cost', r.total_cost));
    rawEntries.forEach(r => addToMonth(r.date, 'input', r.quantity));
    expenses.forEach(e => addToMonth(e.date, 'cost', e.amount));
    workerLogs.forEach(l => addToMonth(l.log_date, 'cost', l.salary));
    batches.forEach(b => addToMonth(b.start_date, 'output', b.output_quantity));

    const trend = Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({ 
        ...m, 
        profit: parseFloat((m.revenue - m.cost).toFixed(2)),
        input: parseFloat(m.input.toFixed(2)),
        output: parseFloat(m.output.toFixed(2))
      }));

    res.json({ success: true, data: trend });
  } catch (err) { next(err); }
};
