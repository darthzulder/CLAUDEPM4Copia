import { UseFormRegisterReturn } from 'react-hook-form';

export interface RadioOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  name: string;
  registration: UseFormRegisterReturn;
  options: readonly RadioOption[] | RadioOption[];
  error?: string;
  required?: boolean;
}

export default function RadioField({ label, name, registration, options, error, required }: Props) {
  return (
    <div className="form-group">
      <label className="form-label">
        {required && <span className="required-star">* </span>}
        {label}
      </label>
      <div className="radio-group">
        {options.map((o) => (
          <div key={o.value} className="form-check">
            <input
              {...registration}
              type="radio"
              id={`${name}_${o.value}`}
              value={o.value}
              className="form-check-input"
            />
            <label htmlFor={`${name}_${o.value}`} className="form-check-label">
              {o.label}
            </label>
          </div>
        ))}
      </div>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
