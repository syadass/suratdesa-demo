import { TriangleAlert } from 'lucide-react';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal modal-sm"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-body confirm-body">
          <span className={`confirm-icon${danger ? ' danger' : ''}`} aria-hidden="true">
            <TriangleAlert size={22} />
          </span>
          <h3 className="modal-title">{title}</h3>
          <p className="confirm-text">{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
