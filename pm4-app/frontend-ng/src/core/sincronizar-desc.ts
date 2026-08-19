import { computed, DestroyRef, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
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
 * ── Por qué depende de DOS cosas y no sólo del código ───────────────────────────────────────────
 * La etiqueta necesita el **código** y el **catálogo**, y los dos llegan por caminos distintos: el
 * código lo siembra un efecto (o lo trae `task.data`), el catálogo llega por HTTP más tarde. El orden
 * no está garantizado, y el caso frecuente es el peor: cuando el código se escribe, las opciones
 * todavía son `[]`.
 *
 * Este helper nació observando **sólo** el `valueChanges` del control, y ahí estaba el defecto: si el
 * catálogo llegaba después, nadie volvía a escribir el código, así que el `_desc` se quedaba con el
 * código crudo **para siempre** y la pantalla de destino pintaba el número en vez del texto. Se veía
 * como un bug de la pantalla que mostraba el número, no de este archivo.
 *
 * React **no** tenía el defecto: `useSyncDesc()` lleva `in_lstOptions` en las deps del `useEffect`, así
 * que la llegada del catálogo re-dispara el efecto y repara la etiqueta. Ésa es la mitad que faltaba
 * portar, y es la razón de que acá haya un `effect()` sobre las opciones además de la suscripción al
 * control. Va con casos de test dedicados (los dos marcados `REGRESIÓN`).
 *
 * El efecto sobre las opciones cubre además un caso que el control **no puede** cubrir: un
 * `FormControl` **deshabilitado** no emite `valueChanges` ni con un `setValue()` explícito, así que un
 * campo como `qd_strReceptionInstance` de SCR-000 —que se deshabilita a propósito— sólo se puede
 * reparar por esta vía.
 *
 * ── El catálogo vacío NO repara: significa "todavía no sé" ──────────────────────────────────────
 * La vía de las opciones ignora la lista vacía. `CollectionService.limpiar()` deja las opciones en `[]`
 * mientras una **recarga** está en vuelo —y también si su GET falla—, y reaccionar a ese hueco
 * degradaría un `_desc` **ya resuelto** de vuelta al código crudo, sin que nada lo repare después: la
 * vía del control no dispara porque el código no cambió. Se midió en el `_desc` de FLD-324, que recarga
 * su catálogo cuando cambia el producto. Va con caso de test.
 *
 * ── Por qué se escribe el valor inicial sin esperar un cambio ───────────────────────────────────
 * El `useEffect` de React corría **al montar**, no solo al cambiar: en la primera pasada ya escribía el
 * `_desc` del valor precargado. `valueChanges` **no** emite el valor actual al suscribirse, así que sin
 * una escritura inicial un caso precargado desde `task.data` viajaría de vuelta a PM4 con el `_desc`
 * viejo (o vacío) mientras el código sí estaría actualizado — un desfase silencioso entre dos campos
 * que deben coincidir. Va con caso de test.
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
 *   se resuelva contra las opciones **del momento** y que su llegada **re-dispare** la escritura. Es la
 *   traducción del `[strCode, in_lstOptions]` que React tenía en las deps del efecto.
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

  // ── Vía 1 · el código, SINCRÓNICA ─────────────────────────────────────────────────────────────
  // Se escribe ya, sin esperar un tick, y por eso esta vía no se reemplazó por el `effect()` de abajo:
  // las pantallas llaman a `sincronizarDesc()` en el constructor y `precargar()` arma el payload con
  // `getRawValue()` poco después, en el mismo turno. Diferir la escritura inicial dejaría el `_desc`
  // fuera de esa foto — el mismo desfase de un tick que ya costó un bug en SCR-000.
  escribirDesc(in_objForm, strCampoDesc, objControl.value as unknown, in_fnOpciones());

  objControl.valueChanges.pipe(takeUntilDestroyed(objDestroyRef)).subscribe((in_genCodigo: unknown) => {
    escribirDesc(in_objForm, strCampoDesc, in_genCodigo, in_fnOpciones());
  });

  // ── Vía 2 · el catálogo, REACTIVA ─────────────────────────────────────────────────────────────
  // Envolver el getter en un `computed()` es lo que hace rastreable la llegada de las opciones: todos
  // los call sites leen `CollectionService`, que expone signals, así que el `computed` se invalida
  // cuando responde el GET y el efecto repara la etiqueta. Si algún getter devolviera un array
  // constante, el `computed` nunca se invalida y esta vía simplemente no hace nada más.
  //
  // La única dependencia de esta vía son **las opciones**. Si el efecto dependiera además del código,
  // correría dos veces por cada cambio y —al correr un microtask después— podría pisar con un valor
  // viejo lo que la vía 1 acabó de escribir.
  //
  // El `untracked()` de afuera **no** es decorativo: 8 secciones llaman a `sincronizarDesc()` desde
  // dentro de un `effect()` de vinculación (necesitan el `form` del padre, que en el constructor
  // todavía no tiene valor). Crear un `effect()` dentro de un contexto reactivo lanza **NG0602**, y
  // sin este `untracked` la suite entera se cae con 216 rojos que no nombran este archivo. El
  // `runInInjectionContext` que esas secciones ya tienen resuelve el NG0203 de `inject()`, que es un
  // problema **distinto**: da contexto de inyección, no saca del contexto reactivo.
  const sigOpciones = computed(() => in_fnOpciones());

  untracked(() => {
    effect(() => {
      const lstOpciones = sigOpciones();
      // ⚠ Un catálogo **vacío** no repara nada, así que esta vía no debe correr con `[]`: significa
      // "todavía no sé", no "ya no hay etiqueta". `CollectionService.limpiar()` vacía las opciones
      // mientras una **recarga** está en vuelo (y también si su GET falla), y sin esta guarda ese
      // hueco degradaría un `_desc` YA RESUELTO de vuelta al código crudo — la vía 1 no lo repararía
      // porque el código no cambió. Medido en el `_desc` de FLD-324, que recarga por filtro.
      if (lstOpciones.length === 0) return;
      // El código se lee del control —su fuente de verdad, habilitado o no— y va dentro del
      // `untracked` junto con la escritura: la única dependencia de esta vía son las opciones.
      untracked(() => escribirDesc(in_objForm, strCampoDesc, objControl.value as unknown, lstOpciones));
    });
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
