import { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons.jsx';

/**
 * Accessible modal dialog: closes on Escape / overlay click, locks background
 * scroll and moves focus into the panel when it opens.
 */
export function Modal({ title, subtitle, size = 'md', onClose, children, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="modal__header">
          <div>
            <h2 className="modal__title">{title}</h2>
            {subtitle ? <p className="modal__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </header>

        {children}

        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
