/**
 * Labelled form control with inline validation messaging.
 * Renders an input, select or textarea depending on `as`.
 */
export function Field({
  id,
  label,
  error,
  hint,
  required = false,
  full = false,
  as = 'input',
  options = [],
  placeholder,
  children,
  ...controlProps
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;

  const className = `${as === 'select' ? 'select' : as === 'textarea' ? 'textarea' : 'input'}${
    error ? ' has-error' : ''
  }`;

  const shared = {
    id,
    name: id,
    className,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': errorId ?? hintId,
    ...controlProps,
  };

  return (
    <div className={`field${full ? ' field--full' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {as === 'select' ? (
        <select {...shared}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            return (
              <option key={value} value={value}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      ) : as === 'textarea' ? (
        <textarea {...shared} placeholder={placeholder} />
      ) : (
        <input {...shared} placeholder={placeholder} />
      )}

      {children}

      {error ? (
        <span className="field__error" id={errorId} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
