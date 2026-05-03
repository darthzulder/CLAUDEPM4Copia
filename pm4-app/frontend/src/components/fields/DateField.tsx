import { UseFormRegisterReturn } from 'react-hook-form';

interface Props {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  helper?: string;
}

export default function DateField({ label, registration, error, required, readOnly, helper }: Props) {
  return (
    <div className="form-group">
      <label className="form-label">
        {required && <span className="required-star">* </span>}
        {label}
      </label>
      <input
        {...registration}
        type="date"
        readOnly={readOnly}
        className={`form-control${error ? ' is-invalid' : ''}`}
      />
      {helper && !error && <small className="form-helper">{helper}</small>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
