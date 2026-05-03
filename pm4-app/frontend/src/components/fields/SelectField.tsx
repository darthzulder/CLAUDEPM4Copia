import { useState, useRef, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import type { Control, RegisterOptions, FieldValues, Path } from 'react-hook-form';
import './SelectField.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props<T extends FieldValues> {
  label: string;
  name: Path<T>;
  control: Control<T>;
  rules?: RegisterOptions<T, Path<T>>;
  options: readonly SelectOption[] | SelectOption[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

const PAGE_SIZE = 10;

function findLabel(opts: readonly SelectOption[], val: string): string {
  return (opts as SelectOption[]).find(o => o.value === val)?.label ?? '';
}

interface BoxProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  options: readonly SelectOption[] | SelectOption[];
  error?: string;
  required?: boolean;
  placeholder: string;
  disabled?: boolean;
}

function ComboBox({
  label, value, onChange, onBlur, options,
  error, required, placeholder, disabled,
}: BoxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const list = options as SelectOption[];
  const filtered = query
    ? list.filter(o => o.label.toLowerCase().includes(query.toLowerCase())).slice(0, PAGE_SIZE)
    : list.slice(0, PAGE_SIZE);

  function pick(opt: SelectOption) {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  }

  function handleFocus() {
    setQuery('');
    setOpen(true);
  }

  function handleBlur() {
    setTimeout(() => {
      setOpen(false);
      setQuery('');
      onBlur();
    }, 150);
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const display = open ? query : findLabel(options, value);

  return (
    <div className="form-group">
      <label className="form-label">
        {required && <span className="required-star">* </span>}
        {label}
      </label>
      <div className="combo-wrap" ref={rootRef}>
        <input
          type="text"
          value={display}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={`form-control combo-input${error ? ' is-invalid' : ''}`}
        />
        <span className="combo-caret" aria-hidden="true">▾</span>
        {open && !disabled && (
          <ul className="combo-dropdown">
            {filtered.length > 0
              ? filtered.map(opt => (
                  <li
                    key={opt.value}
                    className={`combo-option${opt.value === value ? ' is-selected' : ''}`}
                    onMouseDown={e => { e.preventDefault(); pick(opt); }}
                  >
                    {opt.label}
                  </li>
                ))
              : <li className="combo-empty">Sin resultados</li>
            }
          </ul>
        )}
      </div>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

export default function SelectField<T extends FieldValues>({
  label, name, control, rules, options, error, required,
  placeholder = 'Seleccione...', disabled, loading,
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <ComboBox
          label={label}
          value={String(field.value ?? '')}
          onChange={field.onChange}
          onBlur={field.onBlur}
          options={options}
          error={error}
          required={required}
          placeholder={loading ? 'Cargando...' : placeholder}
          disabled={disabled || loading}
        />
      )}
    />
  );
}
