import { Controller } from 'react-hook-form';
import type { Control, RegisterOptions, FieldPath, FieldValues } from 'react-hook-form';
import { useEffect, type ComponentProps } from 'react';
import { ZrModal as ZrModalRaw } from '@zurich/web-components/react/modal';
import { ZrTextInput }        from '@zurich/web-components/react/text-input';
import { ZrCheckbox }         from '@zurich/web-components/react/checkbox';
import { ZrSelect }           from '@zurich/web-components/react/select';
import { ZrDateInput }        from '@zurich/web-components/react/date-input';
import { ZrTextarea }         from '@zurich/web-components/react/textarea';
import { ZrRadioSelect }      from '@zurich/web-components/react/radio-select';
import { ZrSegmentedControl } from '@zurich/web-components/react/segmented-control';

// ─── Re-exports: raw Zurich DS components (facade única para toda la app) ───
export { ZrTextInput };
export { ZrTextarea };
export { ZrSelect };
export { ZrCheckbox };
export { ZrDateInput };
export { ZrRadioSelect };
export { ZrSegmentedControl };
export { ZrButton }      from '@zurich/web-components/react/button';

// ZrModal: el componente ZDS bloquea el scroll del body al abrir
// (document.body.style.overflow = 'hidden') y SOLO lo restaura en un render con
// model=false. Si se desmonta estando abierto (patrón `cond && <ZrModal>`), ese
// render nunca ocurre y el body queda con overflow:hidden → la página no
// scrollea. Restauramos el overflow al desmontar para cubrir todos los modales.
export function ZrModal(props: ComponentProps<typeof ZrModalRaw>) {
  useEffect(() => () => { document.body.style.removeProperty('overflow'); }, []);
  return <ZrModalRaw {...props} />;
}
export { ZrForm }        from '@zurich/web-components/react/form';
export { ZrCard }        from '@zurich/web-components/react/card';
export { ZrTabs }        from '@zurich/web-components/react/tabs';
export { ZrTable }       from '@zurich/web-components/react/table';
export { ZrProgressBar } from '@zurich/web-components/react/progress-bar';
export { ZrAlert }       from '@zurich/web-components/react/alert';
export { ZrBadge }       from '@zurich/web-components/react/badge';
export { ZrChip }        from '@zurich/web-components/react/chip';
export { ZrTag }         from '@zurich/web-components/react/tag';
export { ZrFileInput }   from '@zurich/web-components/react/file-input';

// ─── kp: construye props kebab-case (JSX no admite guiones en nombres de prop) ─
function kp(error?: string, helpText?: string, inputType?: string, icon?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (error)          out['help-text']  = error;
  else if (helpText)  out['help-text']  = helpText;
  if (inputType && inputType !== 'text') out['input-type'] = inputType;
  if (icon)           out['icon']       = icon;
  return out;
}

// ─── ZdsInput — ZrTextInput + Controller ─────────────────────────────────────
interface InputProps<TFV extends FieldValues> {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  helpText?: string;
  error?: string;
  rules?: RegisterOptions<TFV, FieldPath<TFV>>;
  inputType?: 'text' | 'email' | 'tel';
  icon?: string;
}

export function ZdsInput<TFV extends FieldValues>({
  control, name, label, required, readOnly, helpText, error, rules, inputType, icon,
}: InputProps<TFV>) {
  const effectiveIcon = icon ?? (inputType === 'email' ? 'mail-closed:line' : undefined);
  return (
    <div data-zds-readonly={readOnly ? '' : undefined} className="zds-field-wrap">
      <Controller
        name={name}
        control={control}
        rules={rules as RegisterOptions<TFV, typeof name>}
        render={({ field }) => (
          <ZrTextInput
            name={field.name}
            model={String(field.value ?? '')}
            label={label}
            required={required}
            readonly={readOnly}
            invalid={!!error}
            onChange={(val: string | null) => field.onChange(val ?? '')}
            onBlur={field.onBlur}
            {...(kp(error, helpText, inputType, effectiveIcon) as Record<string, unknown>)}
          />
        )}
      />
    </div>
  );
}

// ─── ZdsDate — ZrDateInput + Controller ──────────────────────────────────────
export function ZdsDate<TFV extends FieldValues>({
  control, name, label, required, readOnly, helpText, error, rules, min,
}: Omit<InputProps<TFV>, 'inputType' | 'icon'> & { min?: string }) {
  return (
    <div data-zds-readonly={readOnly ? '' : undefined} className="zds-field-wrap">
      <Controller
        name={name}
        control={control}
        rules={rules as RegisterOptions<TFV, typeof name>}
        render={({ field }) => (
          <ZrDateInput
            name={field.name}
            model={String(field.value ?? '')}
            label={label}
            required={required}
            readonly={readOnly}
            invalid={!!error}
            onChange={(val: string | null) => field.onChange(val ?? '')}
            onBlur={field.onBlur}
            {...({
              ...kp(error, helpText),
              ...(min ? { min } : {}),
            } as Record<string, unknown>)}
          />
        )}
      />
    </div>
  );
}

// ─── ZdsTextarea — ZrTextarea + Controller ────────────────────────────────────
interface TextareaProps<TFV extends FieldValues> {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  helpText?: string;
  error?: string;
  rules?: RegisterOptions<TFV, FieldPath<TFV>>;
  maxLength?: number;
  elastic?: boolean;
  placeholder?: string;
}

export function ZdsTextarea<TFV extends FieldValues>({
  control, name, label, required, readOnly, helpText, error, rules, maxLength, elastic, placeholder,
}: TextareaProps<TFV>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules as RegisterOptions<TFV, typeof name>}
      render={({ field }) => (
        <ZrTextarea
          name={field.name}
          model={String(field.value ?? '')}
          label={label}
          required={required}
          readonly={readOnly}
          invalid={!!error}
          elastic={elastic ?? true}
          onChange={(val: string | null) => field.onChange(val ?? '')}
          onBlur={field.onBlur}
          {...({
            ...kp(error, helpText),
            ...(maxLength ? { 'max-length': maxLength } : {}),
            ...(placeholder ? { placeholder } : {}),
          } as Record<string, unknown>)}
        />
      )}
    />
  );
}

// ─── ZdsCheckboxField — ZrCheckbox + Controller ───────────────────────────────
export function ZdsCheckboxField<TFV extends FieldValues>({
  control, name, label,
}: {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  label: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <ZrCheckbox
          name={field.name}
          model={!!field.value}
          label={label}
          onChange={(val: boolean | null) => field.onChange(val ?? false)}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

// ─── ZdsSelect — ZrSelect + Controller ───────────────────────────────────────
type ZdsOption = { value: string; label?: string; text?: string; disabled?: boolean };

interface SelectProps<TFV extends FieldValues> {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  label: string;
  options: readonly ZdsOption[];
  rules?: RegisterOptions<TFV, FieldPath<TFV>>;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  helpText?: string;
  placeholder?: string;
  withSearch?: boolean;
}

export function ZdsSelect<TFV extends FieldValues>({
  control, name, label, options, rules, required, disabled, loading,
  error, helpText, placeholder, withSearch,
}: SelectProps<TFV>) {
  const zdsOptions = options.map((o) => ({
    value:    o.value,
    text:     o.text ?? o.label ?? o.value,
    disabled: o.disabled,
  }));

  const allOptions = placeholder
    ? [{ value: '', text: placeholder, disabled: true }, ...zdsOptions]
    : zdsOptions;

  return (
    <div className="zds-select-wrap">
      <Controller
        name={name}
        control={control}
        rules={rules as RegisterOptions<TFV, typeof name>}
        render={({ field }) => (
          <ZrSelect
            name={field.name}
            label={label}
            model={String(field.value ?? '')}
            options={allOptions}
            required={required}
            disabled={disabled || loading}
            invalid={!!error}
            {...({
              ...kp(error, helpText ?? (loading ? 'Cargando opciones...' : undefined)),
              ...(withSearch
                ? { 'with-search': true, 'search-autofocus': true, 'search-placeholder': 'Buscar...' }
                : {}),
            } as Record<string, unknown>)}
            onChange={(val: string | null) => field.onChange(val ?? '')}
            onBlur={() => field.onBlur()}
          />
        )}
      />
    </div>
  );
}

// ─── ZdsRadio — ZrRadioSelect + Controller ────────────────────────────────────
type ZdsRadioOption = { value: string; label?: string; text?: string; disabled?: boolean };

interface RadioProps<TFV extends FieldValues> {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  label: string;
  options: readonly ZdsRadioOption[];
  rules?: RegisterOptions<TFV, FieldPath<TFV>>;
  required?: boolean;
  error?: string;
  inline?: boolean;
}

export function ZdsRadio<TFV extends FieldValues>({
  control, name, label, options, rules, required, error, inline,
}: RadioProps<TFV>) {
  const zdsOptions = options.map((o) => ({
    value:    o.value,
    text:     o.text ?? o.label ?? o.value,
    disabled: o.disabled,
  }));

  return (
    <Controller
      name={name}
      control={control}
      rules={rules as RegisterOptions<TFV, typeof name>}
      render={({ field }) => (
        <ZrRadioSelect
          name={field.name}
          model={String(field.value ?? '')}
          label={label}
          options={zdsOptions}
          required={required}
          invalid={!!error}
          onChange={(val: string | null) => field.onChange(val ?? '')}
          onBlur={field.onBlur}
          {...({
            ...(error ? { 'help-text': error } : {}),
            ...(inline ? { config: 'inline' } : {}),
          } as Record<string, unknown>)}
        />
      )}
    />
  );
}

// ─── ZdsSegmented — ZrSegmentedControl + Controller (toggle SÍ/NO, etc.) ─────
interface SegmentedProps<TFV extends FieldValues> {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  options: readonly { value: string; label?: string; text?: string; icon?: string; disabled?: boolean }[];
  rules?: RegisterOptions<TFV, FieldPath<TFV>>;
  disabled?: boolean;
}

export function ZdsSegmented<TFV extends FieldValues>({
  control, name, options, rules, disabled,
}: SegmentedProps<TFV>) {
  const zdsOptions = options.map((o) => ({
    value:    o.value,
    text:     o.text ?? o.label ?? o.value,
    disabled: o.disabled,
    ...(o.icon ? { icon: o.icon } : {}),
  }));

  return (
    <Controller
      name={name}
      control={control}
      rules={rules as RegisterOptions<TFV, typeof name>}
      render={({ field }) => (
        <ZrSegmentedControl
          name={field.name}
          model={field.value ? String(field.value) : null}
          disabled={disabled}
          onChange={(val: string | null) => field.onChange(val ?? '')}
          onBlur={field.onBlur}
          {...({ options: zdsOptions } as Record<string, unknown>)}
        />
      )}
    />
  );
}

