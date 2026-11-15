import { useId, type ReactNode } from 'react';
import styles from './Fields.module.css';

interface BaseProps {
  label: string;
  hint?: string;
  required?: boolean;
}

function FieldShell({ id, label, hint, children }: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && (
        <span className={styles.hint} id={`${id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
}

interface TextFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'url';
  autoComplete?: string;
  placeholder?: string;
}

export function TextField({ value, onChange, type = 'text', autoComplete, placeholder, ...base }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} {...base}>
      <input
        id={id}
        className={styles.control}
        type={type}
        value={value}
        required={base.required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-describedby={base.hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function TextAreaField({ value, onChange, rows = 3, placeholder, ...base }: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} {...base}>
      <textarea
        id={id}
        className={styles.control}
        rows={rows}
        value={value}
        required={base.required}
        placeholder={placeholder}
        aria-describedby={base.hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** Texto de la opción vacía; si no se pasa, no hay opción vacía. */
  placeholder?: string;
}

export function SelectField({ value, onChange, options, placeholder, ...base }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} {...base}>
      <select
        id={id}
        className={styles.control}
        value={value}
        required={base.required}
        aria-describedby={base.hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.check}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
