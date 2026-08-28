import { AlertIcon, InboxIcon } from './Icons.jsx';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title = 'Nothing to show', message, action }) {
  return (
    <div className="state">
      <InboxIcon style={{ color: 'var(--border-strong)' }} />
      <span className="state__title">{title}</span>
      {message ? <span>{message}</span> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state">
      <AlertIcon style={{ color: 'var(--danger)' }} />
      <span className="state__title">Something went wrong</span>
      <span>{message}</span>
      {onRetry ? (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
