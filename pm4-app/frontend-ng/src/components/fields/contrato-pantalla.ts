import { ControlContainer, NgControl } from '@angular/forms';
import { expect } from 'vitest';
import type { ComponentFixture } from '@angular/core/testing';
import { CampoBase } from './campo-base';

/**
 * ⚠ **Guarda cross-pantalla de nivel estructural: se invoca con una línea desde el spec de cualquier
 * pantalla y asevera lo que es universalmente cierto de sus campos.**
 *
 * ── Por qué esto vive en la fachada y no en el spec de cada pantalla ─────────────────────────
 * De los tres defectos que el port de la SCR-008 dejó pasar con la suite **verde**, dos eran
 * **omisiones**: 9 campos sin `formControlName` y 3 textarea sin `[maxLength]`. Y un spec por pantalla
 * asevera lo que la pantalla **declara**; no puede aseverar lo que la pantalla **olvidó** declarar —
 * lo escribe la misma persona que acaba de olvidar el binding, en el mismo momento.
 *
 * El valor concreto de tenerlo acá: cada defecto nuevo que se descubra se agrega **una vez** y queda
 * cubriendo las 13 pantallas, incluidas las 11 que todavía no se portaron. Es lo contrario de sumar
 * un caso más al spec de la pantalla que acaba de fallar.
 *
 * ── Qué cubre y qué NO ──────────────────────────────────────────────────────────────────────
 * Cubre solo lo **decidible sin saber nada de la pantalla**. `formControlName` califica: todo `zds-*`
 * dentro de un form lo necesita, sin excepción. **`[maxLength]` no califica** — depende de si React lo
 * pasaba, y el único origen de esa verdad es el `.tsx`, así que esa mitad la cubre el dataset de
 * paridad (opción C), no esta función.
 *
 * Tampoco reemplaza los guardas-puente de la SCR-008 (que el **valor** precargado llegue al componente
 * del DS): eso necesita los valores esperados de esa pantalla, que son dato suyo.
 *
 * ── Relación con la guarda de `campo-base.ts` (no es redundante, y conviene entender por qué) ─
 * `guardarFormControlNameEnDev()` tira dentro de un `afterNextRender`, y Angular **enruta esa excepción
 * al `ErrorHandler` global**: Vitest la imprime pero **no** falla el caso (medido). O sea que esa guarda
 * protege el navegador, no la suite. Ésta es la que pone **rojo**, y por eso son dos capas y no una.
 */
export function aseverarContratoDeCampos(in_objFixture: ComponentFixture<unknown>): void {
  const cllCampos = cllCamposDeLaFachada(in_objFixture);

  // Una pantalla sin ningún `zds-*` no es un defecto (las de solo lectura existen), pero una que
  // *debería* tenerlos y montó cero sí lo es, y sin esta cuenta las aserciones de abajo serían todas
  // tautologías sobre una lista vacía. Es exactamente la vacuidad que costó el gate 4: un `for` que
  // no itera nunca deja pasar cualquier cosa. Se informa el conteo para que quede visible en el spec.
  expect(cllCampos.length, 'la pantalla no montó ningún campo de la fachada').toBeGreaterThan(0);

  for (const objCampo of cllCampos) {
    const strNombre = objCampo.name();
    const objNodo = in_objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance === objCampo,
    );

    // ── 1 · Dentro de un form reactivo, todo campo necesita su `NgControl` ────────────────────
    // Es el defecto 1 de la SCR-008. Se pregunta por el `ControlContainer` ancestro y NO por el DOM:
    // `[formGroup]="form"` es un binding de **propiedad**, así que Angular no lo deja como atributo
    // (el `<form>` renderizado tiene solo `["novalidate","class"]` — medido). Una versión anterior de
    // la guarda de `campo-base.ts` usaba `closest('[formGroup]')` y **falló abierto**: perdonaba
    // justo el defecto para el que se escribió.
    const blnDentroDeForm = !!objNodo.injector.get(ControlContainer, null);
    const objNgControl = objNodo.injector.get(NgControl, null);

    if (blnDentroDeForm) {
      expect(
        objNgControl,
        `[contrato] ${strNombre} está dentro de un form reactivo pero no tiene [formControlName]. ` +
          `Sin él no hay NgControl: writeValue() nunca corre y el (modelChange) de vuelta muere en un ` +
          `no-op, así que el campo queda MUERTO en las dos direcciones sin ningún síntoma en consola.`,
      ).not.toBeNull();
    }

    // ── 2 · El `name` y la clave del control tienen que coincidir ────────────────────────────
    // Son dos contratos distintos que se parecen: `formControlName` engancha el wrapper al `FormGroup`
    // (Angular) y `name` es lo que el `lib-*-z` usa para **adoptar** ese control en vez de inventarse
    // un `name-<ts>-<n>`. Si divergen, la lib no adopta nada y el group termina con un control basura
    // — el mismo síntoma que el gate 0 aseveró en runtime, ahora vigilado por pantalla.
    if (objNgControl) {
      expect(
        objNgControl.name,
        `[contrato] ${strNombre} tiene formControlName="${objNgControl.name}" y name="${strNombre}": ` +
          `deben coincidir, o el lib-*-z no adopta el control y genera un name-<ts>-<n>.`,
      ).toBe(strNombre);
    }
  }

  // ── 3 · Los `id="field-<name>"` tienen que ser únicos ─────────────────────────────────────
  // Es el contrato que `scrollToFirstError` necesita: busca `#field-<path>`, y con un id repetido
  // `querySelector` devuelve el primero, así que el scroll al error apunta al campo equivocado. No es
  // hipotético: dos secciones que repiten un `name` es un copy-paste normal al portar una pantalla.
  const cllIds = cllCampos.map((in_objCampo) => `field-${in_objCampo.name()}`);
  const cllRepetidos = cllIds.filter((in_strId, in_numI) => cllIds.indexOf(in_strId) !== in_numI);

  expect(
    [...new Set(cllRepetidos)],
    '[contrato] hay ids de campo repetidos: scrollToFirstError apuntaría al campo equivocado',
  ).toEqual([]);
}

/**
 * Todos los `CampoBase` montados en el fixture, deduplicados.
 *
 * ⚠ **El `Set` no es cosmético.** `DebugElement.componentInstance` devuelve el componente **dueño** del
 * nodo, no el componente que el nodo *es*, así que el `<div class="zds-field-wrap">` de adentro de cada
 * wrapper también reporta el wrapper. Medido sobre la SCR-008: un `queryAll` de `instanceof CampoBase`
 * da **18 nodos para 9 campos**. Sin deduplicar, cualquier aserción de conteo falla por una causa del
 * test y no del código.
 *
 * Absorbe el `cllCamposDs()` que vivía en el spec de la SCR-008, que es donde se descubrió el 18-por-9.
 *
 * ⚠ **Es genérica en `T`, y ninguna instanciación fija funciona.** `CampoBase<T>` es **invariante** en
 * `T`: lo tiene en posición contravariante (`fnAlCambiar: (in_valor: T|null) => void`) **y** en una
 * invariante (`model: WritableSignal<T|null>`). O sea que `CampoBase<string>` no es asignable ni a
 * `CampoBase<unknown>` (falla por el callback) ni a `CampoBase<never>` (falla por el signal) — los dos
 * se probaron y los dos rompen `tsc`. Genérica sí, y el llamador conserva su tipo sin castear.
 *
 * Igual **no se lee ningún valor tipado acá**: solo `name()`. El `T` está para que
 * `cllCamposDeLaFachada<string>(fixture)` devuelva `CampoBase<string>[]` en el spec que lo pide.
 */
export function cllCamposDeLaFachada<T>(
  in_objFixture: ComponentFixture<unknown>,
): CampoBase<T>[] {
  const cllInstancias = in_objFixture.debugElement
    .queryAll((in_objNodo) => in_objNodo.componentInstance instanceof CampoBase)
    .map((in_objNodo) => in_objNodo.componentInstance as CampoBase<T>);

  return [...new Set(cllInstancias)];
}

/**
 * El componente del DS que el wrapper renderiza adentro (`lib-input-text-z`, `lib-textarea-z`, …),
 * tipado como `any` a propósito.
 *
 * ⚠ **Por qué el descubrimiento va por el árbol de `DebugElement` y no con `instanceof TextareaZ`:**
 * el `no-restricted-imports` de `eslint.config.mjs` prohíbe `@zurich-col/lib-zurich` en todo el
 * workspace salvo `src/components/fields/**` y `src/zds-setup.ts` (la regla 2 de CLAUDE.md hecha
 * ejecutable). Este archivo **sí** está en esa lista, pero los specs de pantalla que lo llaman **no**,
 * y devolver una instancia tipada del DS obligaría a importar la clase allá. Se deja el descubrimiento
 * por posición para que el guardrail no haya que ensancharlo por comodidad de un test.
 *
 * El hijo es el primer nodo debajo del wrapper cuyo `componentInstance` **no es** el wrapper — el
 * `!== in_objCampo` es lo que hace el trabajo, por el mismo 18-por-9 de arriba. Alcanza porque la
 * plantilla de todos los wrappers es un `<div class="zds-field-wrap">` con **un solo** componente
 * adentro.
 *
 * Absorbe el `objHijoDs()` del spec de la SCR-008.
 */
export function objHijoDelDs<T>(
  in_objFixture: ComponentFixture<unknown>,
  in_objCampo: CampoBase<T>,
  // El `disable` va acá y no arriba de la firma: eslint lo aplica a la **línea siguiente**, y con la
  // firma multilínea esa línea es el `export function`, no el tipo de retorno. Puesto arriba, eslint
  // reporta las dos mitades del error — "Unused eslint-disable directive" por el que no tapa nada y
  // "Unexpected any" por el que quedó sin tapar—, y con `--max-warnings=0` el lint falla igual.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- se lee `model`/`modelChange`, contrato del DS
): any {
  const objWrapper = in_objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance === in_objCampo,
  );

  const objHijo = objWrapper
    .queryAll((in_objNodo) => !!in_objNodo.componentInstance)
    .find((in_objNodo) => in_objNodo.componentInstance !== in_objCampo);

  // Sin esto, un cambio de plantilla que sacara el `lib-*-z` haría fallar con "Cannot read properties
  // of undefined", que se lee como error del test y no como el defecto que es.
  expect(
    objHijo,
    `el wrapper de ${in_objCampo.name()} no renderizó ningún componente del DS`,
  ).toBeDefined();

  return objHijo!.componentInstance;
}
