import { Controller } from 'react-hook-form';
import type { Control, RegisterOptions, FieldPath, FieldValues } from 'react-hook-form';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { ZrModal as ZrModalRaw } from '@zurich/web-components/react/modal';
import { ZrTextInput }        from '@zurich/web-components/react/text-input';
import { ZrCheckbox }         from '@zurich/web-components/react/checkbox';
import { ZrSelect }           from '@zurich/web-components/react/select';
import { ZrDateInput }        from '@zurich/web-components/react/date-input';
import { ZrTextarea }         from '@zurich/web-components/react/textarea';
import { ZrRadioSelect }      from '@zurich/web-components/react/radio-select';
import { ZrSegmentedControl } from '@zurich/web-components/react/segmented-control';
import { ZrStepper }         from '@zurich/web-components/react/stepper';
import { ZrCalendar }        from '@zurich/web-components/react/calendar';

// ─── Re-exports: raw Zurich DS components (facade única para toda la app) ───
export { ZrTextInput };
export { ZrTextarea };
export { ZrSelect };
export { ZrCheckbox };
export { ZrDateInput };
export { ZrRadioSelect };
export { ZrSegmentedControl };
export { ZrStepper };
export { ZrCalendar };
export { ZrButton }      from '@zurich/web-components/react/button';
export { ZrIcon }        from '@zurich/web-components/react/icon';

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
import { ZrBadge }        from '@zurich/web-components/react/badge';
export { ZrBadge };
export { ZrChip }        from '@zurich/web-components/react/chip';
import { ZrTag }          from '@zurich/web-components/react/tag';
export { ZrTag };
export { ZrFileInput }   from '@zurich/web-components/react/file-input';
export { ZrSidebar }     from '@zurich/web-components/react/sidebar';
export { ZrTile }        from '@zurich/web-components/react/tile';
export { ZrTooltip }     from '@zurich/web-components/react/tooltip';
export { ZrInputGroup }  from '@zurich/web-components/react/input-group';
export { ZrFieldset }    from '@zurich/web-components/react/fieldset';
export { ZrLoader }      from '@zurich/web-components/react/loader';

// ─── Píldora de estado: ZrTag del DS (pill en-flujo) con semántica por variante ─
// El DS no tiene "status pill" dedicada; ZrTag es la pill en-flujo. Mapeamos la
// variante a su fill DS (neutral = sin fill → default del DS). ZrBadge NO sirve:
// es notificación overlay (position:absolute → se superpone si hay varias en fila).
export type StatusVariant = 'success' | 'danger' | 'info' | 'neutral';

const STATUS_FILL: Record<StatusVariant, 'moss' | 'peach' | 'teal' | undefined> = {
  success: 'moss',
  danger:  'peach',
  info:    'teal',
  neutral: undefined,
};

export function ZdsStatusBadge({
  variant = 'neutral',
  children,
  className,
}: {
  variant?: StatusVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ZrTag {...({ fill: STATUS_FILL[variant], className } as Record<string, unknown>)}>
      {String(children)}
    </ZrTag>
  );
}

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
    <div className="zds-field-wrap">
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
    <div className="zds-field-wrap">
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

// ─── ZdsStepper — ZrStepper + Controller (contador 1-based en [1, steps]) ─────
export function ZdsStepper<TFV extends FieldValues>({
  control, name, label, steps = 10, disabled, center, rules,
}: {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  label?: string;
  steps?: number;
  disabled?: boolean;
  center?: boolean;
  rules?: RegisterOptions<TFV, FieldPath<TFV>>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules as RegisterOptions<TFV, typeof name>}
      render={({ field }) => (
        <ZrStepper
          model={Number(field.value) || 1}
          disabled={disabled}
          onChange={(val: number) => field.onChange(val)}
          {...({
            steps,
            ...(label ? { label } : {}),
            ...(center ? { config: 'center' } : {}),
          } as Record<string, unknown>)}
        />
      )}
    />
  );
}

// ─── ZdsCalendar — ZrCalendar + Controller (fecha inline, modelo ISO YYYY-MM-DD) ─
// A diferencia de ZdsDate (campo de texto), es la grilla de mes siempre visible.
export function ZdsCalendar<TFV extends FieldValues>({
  control, name, rules, min, max, wide, disabled,
}: {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  rules?: RegisterOptions<TFV, FieldPath<TFV>>;
  min?: string;
  max?: string;
  wide?: boolean;
  disabled?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules as RegisterOptions<TFV, typeof name>}
      render={({ field }) => (
        <ZrCalendar
          model={String(field.value ?? '')}
          disabled={disabled}
          wide={wide}
          onChange={(val: string | null) => field.onChange(val ?? '')}
          {...({
            ...(min ? { min } : {}),
            ...(max ? { max } : {}),
          } as Record<string, unknown>)}
        />
      )}
    />
  );
}

