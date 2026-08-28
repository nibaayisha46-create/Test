export function StatusBadge({ status }) {
  const variant = status === 'Active' ? 'active' : 'inactive';
  return (
    <span className={`badge badge--${variant}`}>
      <span className="badge__dot" />
      {status}
    </span>
  );
}

export function GenderBadge({ gender }) {
  const variant = { Male: 'male', Female: 'female' }[gender] ?? 'other';
  return <span className={`badge badge--${variant}`}>{gender}</span>;
}
