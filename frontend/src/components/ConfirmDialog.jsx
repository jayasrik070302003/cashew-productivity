import { MdWarning } from 'react-icons/md';

/**
 * ConfirmDialog — Reusable delete/action confirmation modal
 *
 * Props:
 *   isOpen      {boolean}   — controls visibility
 *   title       {string}    — modal heading
 *   message     {string}    — body text / description
 *   highlight   {string}    — optional bold item name shown inside the message
 *   confirmText {string}    — confirm button label (default "Delete")
 *   onConfirm   {function}  — called when user clicks confirm
 *   onCancel    {function}  — called when user cancels
 *   loading     {boolean}   — shows spinner on confirm button while action runs
 */
const ConfirmDialog = ({
  isOpen,
  title       = 'Confirm Delete',
  message     = 'This action cannot be undone.',
  highlight   = '',
  confirmText = 'Delete',
  onConfirm,
  onCancel,
  loading     = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal confirm-dialog"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        {/* Header */}
        <div className="confirm-dialog-header">
          <span className="confirm-icon-wrap">
            <MdWarning size={26} />
          </span>
          <h3>{title}</h3>
        </div>

        {/* Body */}
        <div className="confirm-dialog-body">
          <p>
            {message}
            {highlight && (
              <> <strong className="confirm-highlight">"{highlight}"</strong></>
            )}
          </p>
          <p className="confirm-warning">This action <strong>cannot</strong> be undone.</p>
        </div>

        {/* Footer */}
        <div className="confirm-dialog-footer">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger confirm-delete-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="confirm-spinner" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .confirm-dialog {
          border-radius: 16px !important;
          overflow: hidden;
          animation: confirmPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes confirmPop {
          from { transform: scale(0.88) translateY(12px); opacity: 0; }
          to   { transform: scale(1) translateY(0);        opacity: 1; }
        }
        .confirm-dialog-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 22px 24px 14px;
          border-bottom: 1px solid #fde8e8;
          background: #fff5f5;
        }
        .confirm-icon-wrap {
          width: 46px; height: 46px;
          background: #fee2e2;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #dc2626;
          flex-shrink: 0;
        }
        .confirm-dialog-header h3 {
          font-size: 17px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }
        .confirm-dialog-body {
          padding: 20px 24px;
        }
        .confirm-dialog-body p {
          font-size: 14px;
          color: #374151;
          margin: 0 0 10px;
          line-height: 1.6;
        }
        .confirm-dialog-body p:last-child { margin-bottom: 0; }
        .confirm-highlight { color: #dc2626; }
        .confirm-warning {
          font-size: 12px !important;
          color: #9ca3af !important;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 8px;
          padding: 8px 12px !important;
          margin-top: 12px !important;
        }
        .confirm-dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 24px;
          border-top: 1px solid #f3f4f6;
          background: #fafafa;
        }
        .confirm-delete-btn {
          min-width: 100px;
          display: flex; align-items: center; justify-content: center;
          gap: 6px;
        }
        .confirm-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default ConfirmDialog;
