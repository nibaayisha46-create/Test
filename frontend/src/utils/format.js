export const GENDERS = ['Male', 'Female', 'Other'];
export const STATUSES = ['Active', 'Inactive'];

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function fullName(user) {
  return `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
}

export function initials(user) {
  const first = user?.first_name?.[0] ?? '';
  const last = user?.last_name?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

/** ISO timestamp -> `YYYY-MM-DD` for <input type="date">. */
export function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function orDash(value) {
  return value === null || value === undefined || value === '' ? '—' : value;
}
