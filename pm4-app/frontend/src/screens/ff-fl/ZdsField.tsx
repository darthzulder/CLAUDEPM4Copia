import { useState, useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import type { Control, RegisterOptions, FieldPath, FieldValues, ControllerRenderProps } from 'react-hook-form';
import { ZrTextInput }  from '@zurich/web-components/react/text-input';
import { ZrCheckbox }   from '@zurich/web-components/react/checkbox';
import { ZrSelect }     from '@zurich/web-components/react/select';
import { ZrDateInput }  from '@zurich/web-components/react/date-input';

// Construye props kebab-case para pasarlos con spread (JSX no admite guiones en nombres de prop)
function kp(error?: string, helpText?: string, inputType?: string, icon?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (error)          out['help-text']  = error;
  else if (helpText)  out['help-text']  = helpText;
  if (inputType && inputType !== 'text') out['input-type'] = inputType;
  if (icon)           out['icon']       = icon;
  return out;
}

// ---------------------------------------------------------------------------
// Text / email / tel input  →  ZrTextInput (@zurich/web-components)
// ---------------------------------------------------------------------------
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
    // data-zds-readonly añade la clase al host para aplicar el fondo gris desde CSS
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
            locale="es-CO"
            onChange={(val: string | null) => field.onChange(val ?? '')}
            onBlur={field.onBlur}
            {...(kp(error, helpText, inputType, effectiveIcon) as Record<string, unknown>)}
          />
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date input  →  ZrDateInput (@zurich/web-components)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Checkbox  →  ZrCheckbox (@zurich/web-components)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Select  →  ZrSelect (@zurich/web-components)
//
// Usa un wrapper de altura fija (.zds-select-wrap) para que el ZrSelect sea
// position:absolute dentro de su celda de grid. Cuando el dropdown se abre,
// el componente crece hacia abajo SOBRE el contenido (no lo empuja).
// ---------------------------------------------------------------------------
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
    // Wrapper de altura fija: la celda del grid no crece con el dropdown
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

// ---------------------------------------------------------------------------
// Suggest (typeahead)  —  input libre + dropdown filtrado, máx 10 resultados
// ---------------------------------------------------------------------------
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

// Inner component para poder usar hooks dentro del render del Controller
function SuggestInner<TFV extends FieldValues>({
  field,
  label,
  options,
  required,
  loading,
  error,
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

  // Cuando el valor se pre-popula desde PM4 y los options ya cargaron
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
      {/* focus bubbles desde el input del web component hasta este div */}
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
            field.onChange('');  // limpia valor guardado mientras el usuario escribe
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
                onMouseDown={(e) => {
                  e.preventDefault();  // evita que el blur cierre el dropdown antes del click
                  selectOption(opt);
                }}
              >
                {idx >= 0 ? (
                  <>
                    {text.slice(0, idx)}
                    <strong>{text.slice(idx, idx + q.length)}</strong>
                    {text.slice(idx + q.length)}
                  </>
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
