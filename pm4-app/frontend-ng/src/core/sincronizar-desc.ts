import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { startWith } from 'rxjs';
import { descOf } from './collection-helpers';
import type { CollectionOption } from './collection.types';

/** Sufijo por defecto de la variable compañera. Es convención de PM4, no una preferencia local. */
const STR_SUFIJO = '_desc';

/**
 * Mantiene sincronizada la variable **compañera** `<campo>_desc` con la descripción legible del código
 * guardado en `<campo>`. Reemplaza al hook `useSyncDesc()` de React (`core/useCollection.ts`).
 *
 * ── El porqué de todo el mecanismo ──────────────────────────────────────────────────────────────
 * Todo campo respaldado por una colección PM4 guarda el **código** (`qd_strChannel = "13"`), porque es
 * lo que el BPM usa para bifurcar. Pero los reportes y las pantallas de solo lectura del proceso
 * necesitan la etiqueta (`"Internet"`), y PM4 **no** resuelve la colección por su cuenta al leer un
 * caso. Por eso la etiqueta viaja como un campo más, en paralelo al código.
 *
 * Como los payloads a PM4 se arman con `{ ...form.value }`, el `_desc` viaja **solo**: no hay que
 * tocar el submit de ninguna pantalla, que es lo que hace viable la convención.
 *
 * ── `''` y no `'—'` cuando el código está vacío: es contrato, no detalle ────────────────────────
 * `descOf()` devuelve `'—'` para un código vacío porque **pinta en pantalla** (un guión es mejor que
 * un hueco). Esta función devuelve `''` porque el valor **viaja a PM4**: escribir `'—'` metería un
 * guión literal en la base del BPM, que después aparece en un reporte como si fuera una descripción
 * real. La asimetría es deliberada y va con caso de test dedicado — es exactamente la clase de detalle
 * que una "unificación" bienintencionada rompe.
 *
 * ── Por qué se emite el valor inicial con `startWith` ───────────────────────────────────────────
 * El `useEffect` de React corría **al montar**, no solo al cambiar: en la primera pasada ya escribía el
 * `_desc` del valor precargado. `valueChanges` **no** emite el valor actual al suscribirse, así que sin
 * el `startWith` un caso precargado desde `task.data` viajaría de vuelta a PM4 con el `_desc` viejo (o
 * vacío) mientras el código sí estaría actualizado — un desfase silencioso entre dos campos que deben
 * coincidir. Va con caso de test.
 *
 * ── Por qué se llama desde un contexto de inyección ─────────────────────────────────────────────
 * `takeUntilDestroyed()` necesita un `DestroyRef`, y sin él la suscripción sobrevive a la pantalla:
 * `FormGroup` no se destruye solo, así que un `valueChanges` sin cerrar sigue escribiendo sobre un form
 * huérfano. Se llama desde el `constructor` de la pantalla (o desde un campo de instancia), no desde
 * `ngOnInit` — ahí ya no hay contexto de inyección y `inject()` lanza.
 *
 * @param in_objForm El `FormGroup` de la pantalla.
 * @param in_strCampo Nombre del campo que guarda el **código**.
 * @param in_fnOpciones Las opciones de la colección, como **función**: cuando se llama, el
 *   `CollectionService` todavía no cargó nada. Si se pasara el array, se capturaría `[]` para siempre y
 *   el `_desc` quedaría en el código crudo. Pasar un getter (o un `Signal`, que es invocable) hace que
 *   cada emisión resuelva contra las opciones **de ese momento**. Es la traducción del `[strCode,
 *   in_lstOptions]` que React tenía en las deps del efecto.
 * @param in_objOpts `suffix` para el caso raro en que el campo compañero no termine en `_desc`.
 */
export function sincronizarDesc(
  in_objForm: FormGroup,
  in_strCampo: string,
  in_fnOpciones: () => readonly CollectionOption[],
  in_objOpts?: { suffix?: string },
): void {
  const objDestroyRef = inject(DestroyRef);
  const strSufijo = in_objOpts?.suffix ?? STR_SUFIJO;
  const strCampoDesc = `${in_strCampo}${strSufijo}`;

  const objControl = in_objForm.get(in_strCampo);
  if (!objControl) return;

  objControl.valueChanges
    .pipe(startWith(objControl.value as unknown), takeUntilDestroyed(objDestroyRef))
    .subscribe((in_genCodigo: unknown) => {
      escribirDesc(in_objForm, strCampoDesc, in_genCodigo, in_fnOpciones());
    });
}

/**
 * Escribe la descripción en el control compañero, creándolo si no existe.
 *
 * **`emitEvent: false` es obligatorio, no una optimización.** El `_desc` se escribe *desde* un
 * `valueChanges`; si la escritura emitiera, cualquier otro `sincronizarDesc` del mismo form (SCR-000
 * tiene ~10) reaccionaría a un cambio que no es el suyo, y un `_desc` que por configuración apuntara a
 * un campo observado entraría en un ciclo infinito. Además `setValue` con emisión marcaría el form como
 * cambiado por algo que el usuario no tocó.
 *
 * El control se **crea** si falta porque el `_desc` no está declarado en el `FormGroup` de la pantalla
 * (no es un campo de UI, no tiene widget). En React el equivalente era `setValue` sobre una clave no
 * tipada, que RHF aceptaba sin más; Reactive Forms es estricto y un `get()` inexistente devuelve `null`,
 * así que sin crearlo la escritura se perdería **en silencio**.
 */
function escribirDesc(
  in_objForm: FormGroup,
  in_strCampoDesc: string,
  in_genCodigo: unknown,
  in_lstOpciones: readonly CollectionOption[],
): void {
  const strCodigo = in_genCodigo == null ? '' : String(in_genCodigo);
  // Ojo con la asimetría respecto de `descOf`: acá el vacío es '', no '—'. Ver el encabezado.
  const strDesc = strCodigo ? descOf(in_lstOpciones, strCodigo) : '';

  const objControlDesc = in_objForm.get(in_strCampoDesc);
  if (objControlDesc) {
    objControlDesc.setValue(strDesc, { emitEvent: false });
    return;
  }
  // Sin validadores: no es un campo de UI, así que no puede volver inválido un form por su cuenta.
  in_objForm.addControl(in_strCampoDesc, new FormControl(strDesc), { emitEvent: false });
}
