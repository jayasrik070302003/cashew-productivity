import React, { useState, useEffect, useMemo } from 'react';

/**
 * Enhanced DailyWorkerProductivity Component
 * 
 * Requirements:
 * - Persistent state using localStorage ("workersData")
 * - Auto-save on every input change
 * - Load data on mount
 * - Real-time Total/Avg calculations
 * - Format: Array of workers with names and days data
 */
const DailyWorkerProductivity = () => {
  // --- Constants ---
  const STORAGE_KEY = "workersData";
  const DEFAULT_MONTH = new Date().getMonth() + 1;
  const DEFAULT_YEAR = new Date().getFullYear();

  // Initial workers data if none exists in storage
  const initialWorkers = [
    { id: 1, name: 'Arjun Kumar', days: {} },
    { id: 2, name: 'Sita Devi', days: {} },
    { id: 3, name: 'Rajesh Sharma', days: {} },
    { id: 4, name: 'Priya Singh', days: {} },
  ];

  // --- State Initialization (Load from LocalStorage) ---
  const [workers, setWorkers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialWorkers;
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e);
    }
    return initialWorkers;
  });

  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);

  // --- Auto-Save Effect ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
  }, [workers]);

  // --- Logic ---
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [month, year]);
  const dayArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const handleInputChange = (workerId, day, value) => {
    // Only numbers or empty strings allowed, no negative values
    if (value !== '' && (isNaN(value) || parseFloat(value) < 0)) return;

    setWorkers(prevWorkers => 
      prevWorkers.map(w => {
        if (w.id === workerId) {
          return {
            ...w,
            days: {
              ...w.days,
              [`${year}_${month}_${day}`]: value
            }
          };
        }
        return w;
      })
    );
  };

  // --- Real-time Calculations ---
  const calculatedData = useMemo(() => {
    return workers.map(worker => {
      let total = 0;
      dayArray.forEach(day => {
        const val = worker.days[`${year}_${month}_${day}`];
        if (val && !isNaN(val)) {
          total += parseFloat(val);
        }
      });
      const avg = total / daysInMonth;
      return {
        ...worker,
        total,
        avg: avg.toFixed(2)
      };
    });
  }, [workers, month, year, dayArray, daysInMonth]);

  return (
    <div className="productivity-container">
      <div className="header-flex">
        <div className="title-area">
          <h1>Worker Productivity Dashboard</h1>
          <p className="status-badge">Auto-saving to Local Storage</p>
        </div>
        
        <div className="controls">
          <div className="control-group">
            <label>Month</label>
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>Year</label>
            <input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="productivity-table">
          <thead>
            <tr>
              <th className="sticky-col">Worker Name</th>
              {dayArray.map(day => (
                <th key={day}>{day}</th>
              ))}
              <th className="stats-col total-header">Total</th>
              <th className="stats-col avg-header">Avg/Day</th>
            </tr>
          </thead>
          <tbody>
            {calculatedData.map(worker => (
              <tr key={worker.id}>
                <td className="sticky-col worker-name">{worker.name}</td>
                {dayArray.map(day => (
                  <td key={day} className="input-cell">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={worker.days[`${year}_${month}_${day}`] || ''}
                      onChange={(e) => handleInputChange(worker.id, day, e.target.value)}
                      placeholder="0"
                    />
                  </td>
                ))}
                <td className="total-cell">{worker.total.toLocaleString()}</td>
                <td className="avg-cell">{worker.avg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .productivity-container {
          font-family: 'Inter', system-ui, sans-serif;
          background: #fff;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .title-area h1 { font-size: 22px; font-weight: 800; color: #1a1a1a; margin: 0; }
        .status-badge { 
          font-size: 11px; 
          color: #2d6a2d; 
          background: #e8f5e9; 
          padding: 4px 8px; 
          border-radius: 4px; 
          display: inline-block;
          margin-top: 6px;
          font-weight: 600;
        }

        .controls { display: flex; gap: 16px; }
        .control-group { display: flex; flex-direction: column; gap: 4px; }
        .control-group label { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; }
        .control-group select, .control-group input { 
          padding: 8px 12px; border: 1.2px solid #eee; border-radius: 8px; font-size: 14px; outline: none; background: #fcfcfc;
        }
        .control-group select:focus, .control-group input:focus { border-color: #4caf50; background: #fff; }

        .table-wrapper { 
          overflow-x: auto; 
          border-radius: 12px; 
          border: 1px solid #f0f0f0;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.02);
        }

        .productivity-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .productivity-table th { 
          background: #f8f9fa; 
          padding: 12px 8px; 
          font-size: 12px; 
          font-weight: 700; 
          color: #444; 
          border-bottom: 2px solid #eee;
          white-space: nowrap;
        }
        .productivity-table td { padding: 0; border-bottom: 1px solid #f5f5f5; border-right: 1px solid #f5f5f5; }

        .sticky-col {
          position: sticky; left: 0; background: #fff; z-index: 5;
          min-width: 160px; text-align: left !important; padding: 12px 16px !important;
          border-right: 2px solid #eee !important;
        }

        .worker-name { font-weight: 700; color: #333; }

        .input-cell input {
          width: 100%; height: 42px; border: none; background: transparent; text-align: center;
          outline: none; font-size: 14px; transition: all 0.2s;
        }
        .input-cell input:focus { background: #f1f8f1; box-shadow: inset 0 0 0 2px #4caf50; font-weight: 700; }
        .input-cell input:hover { background: #fafafa; }

        .stats-col { min-width: 90px; background: #fdfdfd; font-weight: 800; text-align: right !important; padding: 12px 16px !important; }
        .total-cell { color: #2d6a2d; background: #f1f8f1 !important; }
        .avg-cell { color: #666; font-style: italic; font-size: 12px; }

        tr:hover td { background-color: #fcfcfc; }
        tr:hover .sticky-col { background-color: #fcfcfc; }
        tr:hover .total-cell { background-color: #ebf5eb !important; }

        /* Hide number spinners */
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}} />
    </div>
  );
};

export default DailyWorkerProductivity;
