import { Component, type Type } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { ZaFileInput, ZaRadioSelect } from '@zurich/angular-components';
import { beforeEach, describe, expect, it } from 'vitest';
import { FileRegistryService } from '../../core/file-registry.service';
import { ZdsFileInput } from './zds-file-input';
import { ZdsRadio } from './zds-radio';

/**
 * Guarda del idioma de los textos **propios del DS**. Cubre los dos mecanismos, que son
 * independientes y ninguno reemplaza al otro:
 *
 * 1. **`window.ZDS_LOCALES.es`** que puebla [`zds-setup.ts`](../../zds-setup.ts) → los strings
 *    (`"Examinar archivo"`, `"Hoy"`, `inputs.requiredHelpText`). Es la **única** vía para los cinco
 *    wrappers sobre `lib-*-z`, que no tienen input `locale`.
 * 2. **El input `locale`** que las plantillas de [`CampoZaBase`](./campo-za-base.ts) pasan al `za-*` →
 *    el `Intl.ListFormat` de `file-input.js`, que lee la propiedad cruda y no `computedLocale`.
 *
 * ── Por qué el defecto que previene es difícil de ver, y por eso hace falta la guarda ──────────
 * El síntoma original era un `console.warn` (`Locale "es" not found. Fallback to 'en'`) y textos en
 * inglés **dentro del shadow DOM** de los componentes de Lit. O sea: no rompe ningún test, no rompe el
 * build, y no se ve en el DOM que jsdom expone. Vivió en producción en React sin que nadie lo notara.
 * Si alguien borra el bloque de `zds-setup.ts` —que además está excluido de cobertura, así que ninguna
 * métrica lo protege— la app vuelve a inglés en silencio.
 *
 * ── ⚠ Lo que este spec NO puede aseverar, dicho explícitamente ────────────────────────────────
 * **No** verifica que el texto traducido se pinte. Eso ocurre dentro del shadow DOM de los custom
 * elements de Lit, que jsdom no ejecuta —la trampa ya documentada en `docs/guides/testing-conventions.md`
 * y en el plan de migración—. La verificación del pintado se hizo **en el navegador**, midiendo el
 * `shadowRoot.textContent` del `z-file-input` antes y después:
 *
 * ```
 * antes:   "Browse file ... Only PDF, JPG, or PNG files are allowed"
 * después: "Examinar archivo ... Sólo se permiten archivos PDF, JPG o PNG"
 * ```
 *
 * Lo que sí se puede aseverar acá es todo lo que el DS necesita para llegar a ese resultado: que el
 * diccionario esté publicado en el global con la forma que `_getLocaleMap()` busca, y que el input
 * `locale` llegue a la instancia del componente hijo. Es la misma división de trabajo que rige en el
 * resto de la fachada: los specs cubren el contrato, la pasada manual cubre el pintado.
 */

/** Forma del global que `web-components/dist/localized.js` consulta: `window.ZDS_LOCALES?.[locale]`. */
interface GlobalConLocales {
  ZDS_LOCALES?: Record<string, { today?: string; fileInput?: { browse?: string } } | undefined>;
}

describe('Idioma de los textos del DS', () => {
  describe('1. el diccionario global (única vía para los `lib-*-z`)', () => {
    /**
     * El import de `zds-setup.ts` va **dentro** del caso y no en la cabecera del archivo a propósito.
     * Es un módulo con efecto secundario al importarse, y el registro de módulos de ESM lo ejecuta
     * **una sola vez** por worker: si otro spec del mismo archivo ya lo hubiera importado, un
     * `import` de cabecera acá no volvería a correr el efecto y el caso pasaría por herencia en vez de
     * por su propia causa. Un `await import()` local deja explícito que lo que se asevera es el efecto
     * de **este** import.
     */
    it('publica `es` con la forma exacta que `_getLocaleMap()` busca', async () => {
      await import('../../zds-setup');

      const objGlobal = globalThis as GlobalConLocales;

      // La aserción es sobre el efecto observable —el diccionario alcanzable en la ruta que el DS
      // consulta— y no sobre que el módulo exporte algo: `zds-setup.ts` no exporta nada.
      expect(objGlobal.ZDS_LOCALES).toBeDefined();
      expect(objGlobal.ZDS_LOCALES?.['es']).toBeDefined();
    });

    /**
     * Dos claves concretas, y las dos elegidas por lo que cubren, no al azar:
     *
     * - `today` es el botón del calendario, o sea lo que `ZdsDate` va a mostrar en SCR-012. Era el
     *   motivo por el que este warning dejaba de ser cosmético.
     * - `fileInput.browse` es anidada, así que además prueba que el diccionario entró **entero** y no
     *   como un objeto plano al que le falta la profundidad que `_getLocaleMap().fileInput` recorre.
     *
     * Se aseveran los valores en español y no solo su presencia: un diccionario en inglés publicado
     * bajo la clave `es` cumpliría "está definido" y sería exactamente el defecto sin arreglar.
     */
    it('trae los textos en español, no el diccionario en inglés bajo la clave `es`', async () => {
      await import('../../zds-setup');

      const objEs = (globalThis as GlobalConLocales).ZDS_LOCALES?.['es'];

      expect(objEs?.today).toBe('Hoy');
      expect(objEs?.fileInput?.browse).toBe('Examinar archivo');
    });
  });

  describe('2. el input `locale` del `za-*` (el `Intl.ListFormat` que el global no alcanza)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [FileRegistryService] });
    });

    /**
     * Se asevera sobre la **instancia del componente hijo**, que es donde el valor tiene que llegar
     * para que `new Intl.ListFormat(this.locale, ...)` reciba algo distinto de `undefined`. Mirar el
     * atributo del DOM no serviría: `locale` es un `@Input` de `ZaBaseInput`, así que Angular escribe
     * la **propiedad** y el atributo queda ausente (es la misma razón por la que varios props del DS
     * no se reflejan como atributos, ya documentada en las convenciones de testing).
     */
    it('llega a la instancia del `za-file-input`', () => {
      expect(leerLocale(HostFileInput, ZaFileInput)).toBe('es');
    });

    /** El otro wrapper de la misma base, para que la constante no quede bindeada en uno solo. */
    it('llega a la instancia del `za-radio-select`', () => {
      expect(leerLocale(HostRadio, ZaRadioSelect)).toBe('es');
    });
  });
});

/**
 * Monta el host y devuelve el `locale` de la instancia del componente de Zurich.
 *
 * Se localiza el hijo con `By.directive` en vez de indexar `children[0].children[0]`: el `<div>`
 * envolvente que lleva el `id` del contrato de `scrollToFirstError` es un detalle de la plantilla, y
 * un spec que depende de la profundidad del árbol se rompe con cualquier cambio de estructura que no
 * tenga nada que ver con el idioma.
 */
function leerLocale(in_objHost: Type<unknown>, in_objDirectiva: Type<unknown>): string | undefined {
  const objFixture = TestBed.createComponent(in_objHost);
  objFixture.detectChanges();

  const objHijo = objFixture.debugElement.query(By.directive(in_objDirectiva));
  return (objHijo.componentInstance as { locale?: string }).locale;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsFileInput],
  template: `<form [formGroup]="form">
    <zds-file-input formControlName="qd_strSoporte" name="qd_strSoporte" label="Soporte" />
  </form>`,
})
class HostFileInput {
  readonly form = new FormGroup({ qd_strSoporte: new FormControl('') });
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsRadio],
  template: `<form [formGroup]="form">
    <zds-radio
      formControlName="qd_strOpcion"
      name="qd_strOpcion"
      label="Opción"
      [options]="[{ value: 'a', text: 'A' }]"
    />
  </form>`,
})
class HostRadio {
  readonly form = new FormGroup({ qd_strOpcion: new FormControl('') });
}
