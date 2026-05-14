import { useForm, Controller } from 'react-hook-form';
import { FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

export function SiNoField({ form, name }: { form: Form; name: keyof FfFlSolicitudFormData }) {
  return (
    <Controller
      name={name}
      control={form.control}
      defaultValue="NO"
      render={({ field }) => (
        <div className="si-no-btns">
          <button
            type="button"
            className={`si-no-btn si-no-btn--si${field.value === 'SI' ? ' si-no-btn--active' : ''}`}
            onClick={() => field.onChange('SI')}
          >SI</button>
          <button
            type="button"
            className={`si-no-btn si-no-btn--no${field.value === 'NO' ? ' si-no-btn--active' : ''}`}
            onClick={() => field.onChange('NO')}
          >NO</button>
        </div>
      )}
    />
  );
}

export function SiNoSelectAll({ form, prefix, count }: {
  form: Form;
  prefix: string;
  count: number;
}) {
  const { setValue } = form;
  const keys = Array.from({ length: count }, (_, i) =>
    `${prefix}${String(i + 1).padStart(2, '0')}` as keyof FfFlSolicitudFormData
  );
  return (
    <div className="si-no-select-all">
      <button
        type="button"
        className="si-no-select-btn"
        onClick={() => keys.forEach((k) => setValue(k, 'SI'))}
      >
        Marcar todas SI
      </button>
      <button
        type="button"
        className="si-no-select-btn si-no-select-btn--no"
        onClick={() => keys.forEach((k) => setValue(k, 'NO'))}
      >
        Marcar todas NO
      </button>
    </div>
  );
}
