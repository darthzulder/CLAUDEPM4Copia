import { useForm, Controller } from 'react-hook-form';
import { ZrSegmentedControl, ZrButton } from '../../components/fields/ZdsFields';
import { FfFlSolicitudFormData } from './variables';

type Form = ReturnType<typeof useForm<FfFlSolicitudFormData>>;

const SI_NO_OPTIONS = [
  { value: 'SI', text: 'SÍ' },
  { value: 'NO', text: 'NO' },
];

export function SiNoField({ form, name }: { form: Form; name: keyof FfFlSolicitudFormData }) {
  return (
    <Controller
      name={name}
      control={form.control}
      defaultValue="NO"
      render={({ field }) => (
        <ZrSegmentedControl
          name={field.name}
          model={field.value ? String(field.value) : 'NO'}
          onChange={(val: string | null) => field.onChange(val ?? 'NO')}
          onBlur={field.onBlur}
          {...({ options: SI_NO_OPTIONS } as Record<string, unknown>)}
        />
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
      <ZrButton config="secondary:s" icon="check:line" onClick={() => keys.forEach((k) => setValue(k, 'SI'))}>
        Marcar todas SÍ
      </ZrButton>
      <ZrButton config="secondary:s" icon="close:line" onClick={() => keys.forEach((k) => setValue(k, 'NO'))}>
        Marcar todas NO
      </ZrButton>
    </div>
  );
}
