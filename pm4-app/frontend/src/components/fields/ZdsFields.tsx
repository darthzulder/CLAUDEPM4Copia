import { useState, useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import type { Control, RegisterOptions, FieldPath, FieldValues, ControllerRenderProps } from 'react-hook-form';
import { ZrTextInput }   from '@zurich/web-components/react/text-input';
import { ZrCheckbox }    from '@zurich/web-components/react/checkbox';
import { ZrSelect }      from '@zurich/web-components/react/select';
import { ZrDateInput }   from '@zurich/web-components/react/date-input';
import { ZrTextarea }    from '@zurich/web-components/react/textarea';
import { ZrRadioSelect } from '@zurich/web-components/react/radio-select';

// ─── Re-exports: raw Zurich DS components (facade única para toda la app) ───
export { ZrTextInput };
export { ZrTextarea };
export { ZrSelect };
export { ZrCheckbox };
export { ZrDateInput };
export { ZrRadioSelect };
export { ZrButton }      from '@zurich/web-components/react/button';
export { ZrModal }       from '@zurich/web-components/react/modal';
export { ZrForm }        from '@zurich/web-components/react/form';
export { ZrCard }        from '@zurich/web-components/react/card';
export { ZrTabs }        from '@zurich/web-components/react/tabs';
export { ZrProgressBar } from '@zurich/web-components/react/progress-bar';

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
}

export function ZdsTextarea<TFV extends FieldValues>({
  control, name, label, required, readOnly, helpText, error, rules, maxLength, elastic,
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
              ...(withSearch ? { 'with-search': true } : {}),
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

// ─── ZdsSuggest — typeahead input con dropdown filtrado ───────────────────────
type SuggestOption = { value: string; label?: string; text?: string };

interface SuggestProps<TFV extends FieldValues> {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  label: string;
  options: readonly SuggestOption[];
  rules?: RegisterOptions<TFV, FieldPath<TFV>>;
  required?: boolean;
  loading?: boolean;
  error?: string;
}

function SuggestInner<TFV extends FieldValues>({
  field, label, options, required, loading, error,
}: {
  field: ControllerRenderProps<TFV, FieldPath<TFV>>;
  label: string;
  options: readonly SuggestOption[];
  required?: boolean;
  loading?: boolean;
  error?: string;
}) {
  const [displayText, setDisplayText] = useState('');
  const [query, setQuery]             = useState('');
  const [open, setOpen]               = useState(false);

  useEffect(() => {
    if (!field.value || !options.length) return;
    const match = options.find(o => o.value === String(field.value));
    if (match) setDisplayText(match.text ?? match.label ?? String(field.value));
  }, [field.value, options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 10);
    return options
      .filter(o => (o.text ?? o.label ?? o.value).toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, options]);

  function selectOption(opt: SuggestOption) {
    field.onChange(opt.value);
    setDisplayText(opt.text ?? opt.label ?? opt.value);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="zds-suggest-wrap">
      <div
        onFocus={() => { setQuery(displayText); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      >
        <ZrTextInput
          label={label}
          model={displayText}
          required={required}
          invalid={!!error}
          readonly={loading}
          icon="search:line"
          onChange={(val: string | null) => {
            const v = val ?? '';
            setDisplayText(v);
            setQuery(v);
            setOpen(true);
            field.onChange('');
          }}
          onBlur={field.onBlur}
          {...(error ? { 'help-text': error } : loading ? { 'help-text': 'Cargando...' } : {})}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="suggest-dropdown" role="listbox" aria-label={`Opciones para ${label}`}>
          {filtered.map(opt => {
            const text = opt.text ?? opt.label ?? opt.value;
            const q    = query.trim().toLowerCase();
            const idx  = q ? text.toLowerCase().indexOf(q) : -1;
            return (
              <li
                key={opt.value}
                role="option"
                className="suggest-option"
                onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }}
              >
                {idx >= 0 ? (
                  <>{text.slice(0, idx)}<strong>{text.slice(idx, idx + q.length)}</strong>{text.slice(idx + q.length)}</>
                ) : text}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ZdsSuggest<TFV extends FieldValues>({
  control, name, label, options, rules, required, loading, error,
}: SuggestProps<TFV>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules as RegisterOptions<TFV, typeof name>}
      render={({ field }) => (
        <SuggestInner
          field={field as ControllerRenderProps<TFV, FieldPath<TFV>>}
          label={label}
          options={options}
          required={required}
          loading={loading}
          error={error}
        />
      )}
    />
  );
}
