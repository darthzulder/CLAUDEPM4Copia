import { Controller } from 'react-hook-form';
import type { Control, RegisterOptions, FieldPath, FieldValues, UseFormSetValue, UseFormSetError, UseFormClearErrors } from 'react-hook-form';
import { useEffect, type ComponentProps, type ReactNode, type MutableRefObject } from 'react';
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
import { findDuplicateAttachment } from '../../core/fileHash';

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
import { ZrFileInput }   from '@zurich/web-components/react/file-input';
export { ZrFileInput };
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
  // Armamos el diccionario de props kebab-case solo con lo que aplica.
  const dicOut: Record<string, unknown> = {};
  if (error)          dicOut['help-text']  = error;
  else if (helpText)  dicOut['help-text']  = helpText;
  if (inputType && inputType !== 'text') dicOut['input-type'] = inputType;
  if (icon)           dicOut['icon']       = icon;
  return dicOut;
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
  autoComplete?: string;   // pasa `autocomplete` al input nativo (p.ej. "off" para evitar autofill de tarjetas)
  placeholder?: string;
}

export function ZdsInput<TFV extends FieldValues>({
  control, name, label, required, readOnly, helpText, error, rules, inputType, icon, autoComplete, placeholder,
}: InputProps<TFV>) {
  // Usamos el icono recibido o el de correo por defecto para email.
  const strEffectiveIcon = icon ?? (inputType === 'email' ? 'mail-closed:line' : undefined);
  return (
    <div className="zds-field-wrap">
      <Controller
        name={name}
        control={control}
        rules={rules as RegisterOptions<TFV, typeof name>}
        render={({ field }) => (
          <ZrTextInput
            id={`field-${String(name)}`}
            name={field.name}
            model={String(field.value ?? '')}
            label={label}
            required={required}
            readonly={readOnly}
            invalid={!!error}
            onChange={(val: string | null) => field.onChange(val ?? '')}
            onBlur={field.onBlur}
            {...({
              ...kp(error, helpText, inputType, strEffectiveIcon),
              ...(autoComplete ? { autocomplete: autoComplete } : {}),
              ...(placeholder ? { placeholder } : {}),
            } as Record<string, unknown>)}
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
            id={`field-${String(name)}`}
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
          id={`field-${String(name)}`}
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
          id={`field-${String(name)}`}
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
  // Traducciones opcionales entre el valor guardado en el form (`field.value`, lo que se
  // envía a PM4) y el value que necesita mostrar el picker. Usar cuando ambos difieren —
  // p.ej. catálogos que repiten el mismo código en más de un registro, donde el picker
  // necesita un value único por opción para poder distinguir cuál se clickeó (ver
  // "Selecciona el seguro" / "Producto SFC" en Quejas Directas, catálogo id 16).
  toPickerValue?: (in_strFieldValue: string) => string;
  fromPickerValue?: (in_strPickerValue: string) => string;
  // Efecto adicional al elegir una opción, con el value CRUDO del picker (antes de
  // `fromPickerValue`) — p.ej. sincronizar un `_desc` que no puede resolverse solo con
  // el código real por la colisión mencionada arriba.
  onPickerChange?: (in_strPickerValue: string) => void;
}

export function ZdsSelect<TFV extends FieldValues>({
  control, name, label, options, rules, required, disabled, loading,
  error, helpText, placeholder, withSearch, toPickerValue, fromPickerValue, onPickerChange,
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
            id={`field-${String(name)}`}
            name={field.name}
            label={label}
            model={toPickerValue ? toPickerValue(String(field.value ?? '')) : String(field.value ?? '')}
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
            onChange={(val: string | null) => {
              const strPickerVal = val ?? '';
              onPickerChange?.(strPickerVal);
              field.onChange(fromPickerValue ? fromPickerValue(strPickerVal) : strPickerVal);
            }}
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
  disabled?: boolean;
  error?: string;
  inline?: boolean;
}

export function ZdsRadio<TFV extends FieldValues>({
  control, name, label, options, rules, required, disabled, error, inline,
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
          id={`field-${String(name)}`}
          name={field.name}
          model={String(field.value ?? '')}
          label={label}
          options={zdsOptions}
          required={required}
          disabled={disabled}
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
          id={`field-${String(name)}`}
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
          id={`field-${String(name)}`}
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
          id={`field-${String(name)}`}
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

// ─── ZdsFileInput — ZrFileInput + Controller + Validation ────────────────────
interface FileInputProps<TFV extends FieldValues> {
  control: Control<TFV>;
  name: FieldPath<TFV>;
  label?: string;
  fileRegistry?: MutableRefObject<Map<string, File>>;
  setValue: UseFormSetValue<TFV>;
  setError: UseFormSetError<TFV>;
  clearErrors: UseFormClearErrors<TFV>;
  error?: string;
  allowedExtensions?: string[];
  maxSizeMb?: number;
  errorMessage?: string;
  duplicateMessage?: string;
  droppable?: boolean;
}

export function ZdsFileInput<TFV extends FieldValues>({
  control,
  name,
  label = '',
  fileRegistry,
  setValue,
  setError,
  clearErrors,
  error,
  allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  maxSizeMb = 5,
  errorMessage,
  duplicateMessage,
  droppable = true,
}: FileInputProps<TFV>) {
  // Mensaje de error a mostrar: el recibido o uno construido por defecto.
  const strDefaultError = `Solo se permiten archivos ${allowedExtensions.join(', ')}, máx ${maxSizeMb} MB`;
  const strEffectiveError = errorMessage || strDefaultError;
  // MSG duplicado: PM4/Smart Supervision rechaza subir un binario ya existente en el
  // request aunque el archivo tenga otro nombre — se detecta por hash (ver core/fileHash).
  const strEffectiveDuplicateError = duplicateMessage
    || 'Este archivo ya fue adjuntado (el contenido es idéntico a otro documento, aunque el nombre sea distinto)';

  return (
    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <ZrFileInput
            id={`field-${String(name)}`}
            label={label}
            model={(field.value as string) || null}
            droppable={droppable}
            onChange={async (file: File | string | null, event?: any) => {
              if (file && typeof file !== 'string') {
                const fileName = event?.target?.fileName || file.name || '';
                const ext = fileName.split('.').pop()?.toLowerCase() || '';
                const maxSize = maxSizeMb * 1024 * 1024;

                const rejectFile = (in_strMessage: string) => {
                  const target = event?.target as any;
                  if (target) {
                    target._fileName = null;
                    target._fileType = null;
                    target._blobURL = null;
                    if (target.inputRef?.value) {
                      target.inputRef.value.value = '';
                    }
                    target.requestUpdate();
                  }
                  setError(name, {
                    type: 'manual',
                    message: in_strMessage,
                  } as any);
                  setValue(name, '' as any);
                  if (fileRegistry) {
                    fileRegistry.current.delete(name as string);
                  }
                };

                if (!allowedExtensions.includes(ext) || file.size > maxSize) {
                  rejectFile(strEffectiveError);
                  return;
                }

                // ZrFileInput entrega un Blob genérico (sin .name) en `file`; sin nombre
                // real, FormData lo sube como "blob" y PM4 no puede resolver la extensión.
                const namedFile = file.name === fileName
                  ? file
                  : new File([file], fileName, { type: file.type });

                // Duplicado por CONTENIDO (no por nombre) contra el resto de adjuntos ya
                // registrados — Smart Supervision rechaza el binario repetido al guardarlo.
                if (fileRegistry) {
                  const strDuplicateKey = await findDuplicateAttachment(namedFile, fileRegistry.current, name as string);
                  if (strDuplicateKey) {
                    rejectFile(strEffectiveDuplicateError);
                    return;
                  }
                }

                clearErrors(name);
                setValue(name, fileName as any);
                if (fileRegistry) {
                  fileRegistry.current.set(name as string, namedFile);
                }
              } else {
                clearErrors(name);
                setValue(name, '' as any);
                if (fileRegistry) {
                  fileRegistry.current.delete(name as string);
                }
              }
            }}
            invalid={!!error}
            {...({
              accept: allowedExtensions,
              'help-text': error || undefined,
            } as Record<string, unknown>)}
          />
        )}
      />
    </div>
  );
}

