import { GenderBadge, StatusBadge } from '../components/Badge.jsx';
import { Modal } from '../components/Modal.jsx';
import { formatDate, formatDateTime, fullName, initials, orDash } from '../utils/format.js';

function DetailItem({ label, children, full = false }) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : undefined}>
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value">{children}</div>
    </div>
  );
}

/** Read-only profile view. The password is deliberately never exposed here. */
export function UserDetailsModal({ user, onClose, onEdit }) {
  return (
    <Modal
      title="User details"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn--primary" onClick={() => onEdit(user)}>
            Edit user
          </button>
        </>
      }
    >
      <div className="modal__body">
        <div className="detail-hero">
          <span className="avatar">{initials(user)}</span>
          <div>
            <div className="detail-hero__name">{fullName(user)}</div>
            <div className="text-muted">{user.email}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <StatusBadge status={user.status} />
          </div>
        </div>

        <div className="detail-grid">
          <DetailItem label="User ID">
            <span className="numeric">#{user.id}</span>
          </DetailItem>
          <DetailItem label="Gender">
            <GenderBadge gender={user.gender} />
          </DetailItem>
          <DetailItem label="Phone number">{orDash(user.phone_number)}</DetailItem>
          <DetailItem label="Date of birth">{formatDate(user.date_of_birth)}</DetailItem>
          <DetailItem label="City">{orDash(user.city)}</DetailItem>
          <DetailItem label="Country">{orDash(user.country)}</DetailItem>
          <DetailItem label="Address" full>
            {orDash(user.address)}
          </DetailItem>
          <DetailItem label="Created date">{formatDateTime(user.created_date)}</DetailItem>
          <DetailItem label="Updated date">{formatDateTime(user.updated_date)}</DetailItem>
        </div>
      </div>
    </Modal>
  );
}
