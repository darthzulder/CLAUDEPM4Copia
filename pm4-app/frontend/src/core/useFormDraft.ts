import { useEffect, useRef } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

/**
 * Persiste el estado de un formulario en localStorage mientras el usuario navega.
 *
 * Uso:
 *   const { restore, clearDraft } = useFormDraft(key, form);
 *   // Llamar restore() después de cargar los datos base del task:
 *   useEffect(() => { loadTask(); restore(); }, [task]);
 *   // Llamar clearDraft() al hacer submit exitoso.
 */
export function useFormDraft<T extends FieldValues>(
  storageKey: string | null,
  form: UseFormReturn<T>,
  debounceMs = 600,
) {
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false); // evita guardar valores por defecto antes del restore

  // Auto-save: escucha cambios en el formulario una vez que el draft fue restaurado
  useEffect(() => {
    if (!storageKey) return;
    const sub = form.watch((values) => {
      if (!activeRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(values));
        } catch {
          // localStorage lleno u otro error — no es crítico
        }
      }, debounceMs);
    });
    return () => {
      sub.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [storageKey, form, debounceMs]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Aplica el draft guardado sobre los valores actuales del form.
   * Debe llamarse después de haber cargado los datos base del task.
   *
   * @param taskData  Si se pasa, los campos que existen en taskData (no nulos)
   *                  tienen prioridad y NO se sobreescriben con el draft.
   */
  function restore(taskData?: Record<string, unknown>) {
    if (activeRef.current) return; // ya restaurado
    activeRef.current = true;
    if (!storageKey) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Partial<T>;
      for (const [k, v] of Object.entries(draft)) {
        if (v === undefined) continue;
        // Si task.data ya tiene un valor para este campo, lo respetamos
        if (taskData) {
          const existing = taskData[k];
          if (existing !== null && existing !== undefined && existing !== '') continue;
        }
        form.setValue(k as Parameters<typeof form.setValue>[0], v as never, { shouldDirty: false });
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  /** Elimina el draft del localStorage. Llamar al completar la tarea. */
  function clearDraft() {
    if (storageKey) localStorage.removeItem(storageKey);
    activeRef.current = false;
  }

  return { restore, clearDraft };
}
