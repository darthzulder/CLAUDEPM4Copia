import type { FieldErrors, FieldError } from 'react-hook-form';
import type { CrearRecibirQuejaFormData } from './variables';

// Oculta el error "required" mientras el campo siga vacío y el form no se haya
// enviado todavía (evita marcar en rojo campos que el usuario aún no toca).
export function fieldError(
  errors: FieldErrors<CrearRecibirQuejaFormData>,
  name: keyof CrearRecibirQuejaFormData,
  value: unknown,
  isSubmitted: boolean,
): string | undefined {
  const err = errors[name] as FieldError | undefined;
  if (!err) return undefined;
  const empty = value === '' || value === null || value === undefined;
  if (err.type === 'required' && empty && !isSubmitted) return undefined;
  return String(err.message);
}
