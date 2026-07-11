import { useId, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (props: {
    id: string;
    invalid: boolean;
    describedBy: string | undefined;
  }) => ReactNode;
}

export const Field = ({ label, hint, error, children }: FieldProps) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {children({ id, invalid: Boolean(error), describedBy })}
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
}

export const CheckboxField = ({ checked, onChange, error, children }: CheckboxProps) => {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label className="checkbox" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <span className="checkbox__text">{children}</span>
      </label>
      {error && (
        <p className="field__error" id={errorId} role="alert" style={{ marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  );
};
