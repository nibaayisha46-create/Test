import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertIcon, CheckCircleIcon, CloseIcon } from './Icons.jsx';

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, variant = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current, { id, message, variant }]);
      timers.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS));
      return id;
    },
    [dismiss],
  );

  // Clear any pending timers if the provider unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.variant}`}>
            {toast.variant === 'error' ? (
              <AlertIcon style={{ color: 'var(--danger)' }} />
            ) : (
              <CheckCircleIcon style={{ color: 'var(--success)' }} />
            )}
            <span className="toast__message">{toast.message}</span>
            <button
              type="button"
              className="icon-btn"
              style={{ width: 24, height: 24, border: 'none' }}
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a <ToastProvider>');
  return context;
}
