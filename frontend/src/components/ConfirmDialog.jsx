import { AlertIcon } from './Icons.jsx';
import { Modal } from './Modal.jsx';

/** Confirmation prompt shown before a destructive action such as delete. */
export function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={busy ? () => {} : onCancel}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
            {busy ? <span className="spinner spinner--sm" /> : null}
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="modal__body" style={{ display: 'flex', gap: 14 }}>
        <span className="summary-card__icon tone-danger" style={{ width: 40, height: 40 }}>
          <AlertIcon />
        </span>
        <div>{message}</div>
      </div>
    </Modal>
  );
}
