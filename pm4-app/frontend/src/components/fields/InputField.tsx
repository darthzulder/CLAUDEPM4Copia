import { UseFormRegisterReturn } from 'react-hook-form';

interface Props {
  label: string;
  name?: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: 'text' | 'email' | 'number' | 'password';
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  helper?: string;
  suffix?: React.ReactNode;
}

export default function InputField({
  label, registration, error, type = 'text',
  placeholder, readOnly, required, helper, suffix,
}: Props) {
  return (
    <div className="form-group">
      <label className="form-label">
        {required && <span className="required-star">* </span>}
        {label}
      </label>
      <div className={`input-wrapper${suffix ? ' has-suffix' : ''}`}>
        <input
          {...registration}
          type={type}
          placeholder={placeholder ?? ''}
          readOnly={readOnly}
          className={`form-control${error ? ' is-invalid' : ''}`}
        />
        {suffix && <div className="input-suffix">{suffix}</div>}
      </div>
      {helper && !error && <small className="form-helper">{helper}</small>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
