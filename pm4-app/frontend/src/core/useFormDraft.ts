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
  in_strStorageKey: string | null,
  form: UseFormReturn<T>,
  in_intDebounceMs = 600,
) {
  const objTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objActiveRef = useRef(false); // evita guardar valores por defecto antes del restore

  // Auto-save: escucha cambios en el formulario una vez que el draft fue restaurado
  useEffect(() => {
    if (!in_strStorageKey) return;
    const objSub = form.watch((in_dicValues) => {
      if (!objActiveRef.current) return;
      if (objTimerRef.current) clearTimeout(objTimerRef.current);
      // Guardamos el borrador tras una pausa para no escribir en cada tecla
      objTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(in_strStorageKey, JSON.stringify(in_dicValues));
        } catch {
          // localStorage lleno u otro error — no es crítico
        }
      }, in_intDebounceMs);
    });
    return () => {
      objSub.unsubscribe();
      if (objTimerRef.current) clearTimeout(objTimerRef.current);
    };
  }, [in_strStorageKey, form, in_intDebounceMs]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Aplica el draft guardado sobre los valores actuales del form.
   * Debe llamarse después de haber cargado los datos base del task.
   *
   * @param taskData  Si se pasa, los campos que existen en taskData (no nulos)
   *                  tienen prioridad y NO se sobreescriben con el draft.
   */
  function restore(in_dicTaskData?: Record<string, unknown>) {
    if (objActiveRef.current) return; // ya restaurado
    objActiveRef.current = true;
    if (!in_strStorageKey) return;
    // Leemos el borrador guardado en localStorage
    const strRaw = localStorage.getItem(in_strStorageKey);
    if (!strRaw) return;
    try {
      // Recorremos cada campo del borrador y lo aplicamos al form
      const dicDraft = JSON.parse(strRaw) as Partial<T>;
      for (const [strKey, genValue] of Object.entries(dicDraft)) {
        if (genValue === undefined) continue;
        // Si task.data ya tiene un valor para este campo, lo respetamos
        if (in_dicTaskData) {
          const genExisting = in_dicTaskData[strKey];
          if (genExisting !== null && genExisting !== undefined && genExisting !== '') continue;
        }
        form.setValue(strKey as Parameters<typeof form.setValue>[0], genValue as never, { shouldDirty: false });
      }
    } catch {
      localStorage.removeItem(in_strStorageKey);
    }
  }

  /** Elimina el draft del localStorage. Llamar al completar la tarea. */
  function clearDraft() {
    if (in_strStorageKey) localStorage.removeItem(in_strStorageKey);
    objActiveRef.current = false;
  }

  return { restore, clearDraft };
}
