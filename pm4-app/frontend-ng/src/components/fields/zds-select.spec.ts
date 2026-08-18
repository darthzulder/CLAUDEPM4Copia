import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { InputSelectZ } from '@zurich-col/lib-zurich';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZdsSelect, type OpcionZds } from './zds-select';

/**
 * Este spec **no** es una copia del de `ZdsInput` con otro selector, y eso es a propósito: de los
 * cinco campos, `lib-input-select-z` es el que más se parece al input de texto por fuera y el que
 * menos se le parece por dentro. Las tres diferencias que sólo se pueden pescar acá:
 *
 *  1. **La polaridad NO se invierte.** Su input se llama `invalid` y significa `invalid`. Copiar la
 *     aserción del input de texto (`valid === false` cuando está bien) daría un verde falso: acá
 *     `invalid === false` significa lo mismo pero la propiedad es otra, y un wrapper que negara de
 *     más pasaría el test del input de texto y rompería este.
 *  2. **Las opciones viajan como `description`.** Su template hace `{{item.description}}`, así que
 *     una opción con `text` renderiza la etiqueta **vacía sin fallar** — el modo de falla más
 *     silencioso de la fachada entera, y por eso tiene aserción propia.
 *  3. **`disable` es un input muerto**, o sea que este campo no se puede deshabilitar. El spec
 *     asevera lo que sí pasa (el wrapper registra el estado) y documenta el límite en vez de
 *     aseverar un `disabled` que nunca llega a ninguna parte.
 */

const CLL_OPCIONES: readonly OpcionZds[] = [
  { value: '13', text: 'Internet' },
  { value: '14', label: 'Sucursal' },
  { value: '15' },
];

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsSelect],
  template: `
    <form [formGroup]="form">
      <zds-select
        formControlName="qd_strChannel"
        name="qd_strChannel"
        label="Canal"
        [obligatorio]="true"
        [options]="opciones"
        [placeholder]="placeholder"
        [loading]="loading"
        [error]="error"
        helpText="Elegí el canal de ingreso"
      />
    </form>
  `,
})
class HostDeFormulario {
  readonly form = new FormGroup({
    qd_strChannel: new FormControl('', [Validators.required]),
    qd_strOtro: new FormControl('', [Validators.required]),
  });

  opciones: readonly OpcionZds[] = CLL_OPCIONES;
  placeholder = '';
  loading = false;
  error = '';
}

async function drenarTimeouts() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function hijo(in_objFixture: ComponentFixture<HostDeFormulario>): InputSelectZ {
  return in_objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance instanceof InputSelectZ,
  ).componentInstance as InputSelectZ;
}

/**
 * Las etiquetas **pintadas** en el listado, leídas del shadow DOM del `z-select`.
 *
 * ── ⚠ Por qué se asevera lo pintado y NO la propiedad `options` de ningún elemento ──────────
 * Porque aseverar la propiedad fue exactamente el falso verde que dejó pasar el defecto real. La
 * primera versión del arreglo escribía `options` sobre el **`za-select`** —el envoltorio de Angular,
 * que no tiene shadow root ni reactividad de Lit— y ahí esa propiedad está muerta: nadie la lee. En
 * el navegador se midió `options.length === 33` en ese elemento y **0 opciones pintadas**. Toda la
 * suite estaba verde, `tsc` y `npm run verify` también, y el select seguía en blanco.
 *
 * Un caso que lea `options` hereda ese agujero: mide lo que el código *escribió*, no lo que el
 * usuario *ve*. Leer los `<li>` del shadow root no tiene esa salida. Lit **sí** rinde bajo jsdom
 * (medido con una sonda: `shadowRoot` presente, `<li>` pintados, etiquetas en `textContent`).
 */
function etiquetasPintadas(in_objFixture: ComponentFixture<HostDeFormulario>): string[] {
  const objElemento: Element | null = in_objFixture.nativeElement.querySelector('z-select');

  // El conteo va primero: sin `z-select` —o sin shadow root— el `[...querySelectorAll]` de abajo
  // devolvería `[]` y un `toEqual([])` pasaría por vacuidad, que es justo el falso verde a evitar.
  expect(objElemento).not.toBeNull();
  expect(objElemento!.shadowRoot).not.toBeNull();

  return [...objElemento!.shadowRoot!.querySelectorAll('li')].map((in_objLi) =>
    (in_objLi.textContent ?? '').trim(),
  );
}

describe('ZdsSelect', () => {
  let objFixture: ComponentFixture<HostDeFormulario>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(HostDeFormulario);
    await objFixture.whenStable();
    await drenarTimeouts();
  });

  it('el control del FormGroup conserva su name real y no se agrega ninguno generado', () => {
    // Con el conteo incluido: `lib-input-select-z` SÍ llama `generateControl()`, así que acá el
    // riesgo de que aparezca un `name-<ts>-<n>` extra es real (a diferencia del textarea, que nunca
    // registra control). Ver el hallazgo del gate 0.
    expect(Object.keys(objFixture.componentInstance.form.controls)).toEqual([
      'qd_strChannel',
      'qd_strOtro',
    ]);
  });

  it('ida del CVA: control.setValue llega al `model` del lib-input-select-z', async () => {
    objFixture.componentInstance.form.controls.qd_strChannel.setValue('13');
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(hijo(objFixture).model).toBe('13');
  });

  it('vuelta del CVA: el modelChange del hijo escribe el control y lo marca tocado', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strChannel;
    expect(objControl.touched).toBe(false);

    hijo(objFixture).modelChange.emit('14');
    objFixture.detectChanges();
    await objFixture.whenStable();

    expect(objControl.value).toBe('14');
    expect(objControl.touched).toBe(true);
  });

  it('traduce las opciones a `description`, con el orden `text ?? label ?? value` de React', () => {
    // El gotcha de falso verde: la lib renderiza `{{item.description}}`. Si el wrapper dejara pasar
    // `text` tal cual, el `<option>` saldría con etiqueta vacía y ningún error de consola.
    expect(hijo(objFixture).options).toEqual([
      { value: '13', description: 'Internet' },
      { value: '14', description: 'Sucursal' },
      { value: '15', description: '15' },
    ]);
  });

  it('un catálogo que llega TARDE termina pintado en el listado', async () => {
    // El escenario real de todas las pantallas: el catálogo sale de una colección PM4, así que
    // resuelve una respuesta HTTP **después** del primer render. Se asevera lo PINTADO y no
    // `hijo().options` —lo que el wrapper le entrega a la lib— porque aseverar propiedades es lo que
    // dejó pasar el defecto real (ver el docstring de `etiquetasPintadas`).
    //
    // ── ⚠ ESTE CASO **NO** CUBRE EL ARREGLO DE `zds-select.ts`. LEER ANTES DE CONFIAR ──────────
    // Se midió por mutación, y el resultado es incómodo pero hay que dejarlo escrito: **quitando el
    // `afterRenderEffect` entero, este caso sigue pintando las tres etiquetas.** O sea que jsdom
    // **no reproduce el defecto de producción**. El motivo es coherente con el mecanismo: acá los
    // `<option>` del slot alcanzan a estar en el DOM antes del render de Lit, así que el getter
    // `_targetOptionsArray` los encuentra y el listado se pinta sin ayuda. En el navegador el
    // catálogo llega **más tarde**, después de ese render, y ahí no hay quien agende otro.
    //
    // Las tres mutaciones sobre `zds-select.ts`, con su resultado real:
    //  - quitar el efecto → este caso NO lo detecta (pinta igual);
    //  - `z-select` → `za-select` (el defecto que se envió) → NO lo detecta por el listado final;
    //  - `text` → `description` → **verde, 12/12**: la clave nunca se ejerce, porque bajo jsdom el
    //    slot le gana al getter y la propiedad jamás es la fuente de los datos.
    //
    // Entonces lo que este caso sí vale es una **guarda de no-regresión del camino feliz** (que un
    // catálogo tardío quede pintado, por cualquier vía) y el arnés que deja el listado observable.
    // La verificación del arreglo es **de navegador**, y así se hizo: `qd_strIdType` (7 opciones) y
    // `qd_strDepartment` (33) de la SCR-000, que pintaban 0, pintan todas. Queda anotado acá y en la
    // cabecera de `zds-select.ts` para que nadie lea este verde como cobertura del arreglo.
    const objHost = objFixture.componentInstance;

    // Arranca sin catálogo, como una pantalla cuyo `objCatalogos.de(...)` todavía no resolvió. El DS
    // pinta un `<li>` con su propio texto de vacío —literalmente lo que el usuario reportaba ver— y
    // se asevera ese texto en vez de `[]` para que el estado inicial quede fijado y no pase por
    // vacuidad. (Sale en inglés porque este arnés no monta los `ZDS_LOCALES` de la app.)
    objHost.opciones = [];
    objFixture.componentRef.changeDetectorRef.markForCheck();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(etiquetasPintadas(objFixture)).toEqual(['No options found']);

    // Y ahora llega el catálogo, tarde.
    objHost.opciones = CLL_OPCIONES;
    objFixture.componentRef.changeDetectorRef.markForCheck();
    await objFixture.whenStable();
    await drenarTimeouts();

    // Se aseveran las ETIQUETAS, no los `value`: una opción sin `text` cae a su `value` ('15'), así
    // que el orden `text ?? label ?? value` de la fachada queda cubierto de punta a punta.
    expect(etiquetasPintadas(objFixture)).toEqual(['Internet', 'Sucursal', '15']);
  });

  it('el placeholder entra como primera opción de valor vacío, no como input de la lib', async () => {
    // `lib-input-select-z` no tiene input de placeholder: el prompt se implementa como `<option>`.
    // Se asevera la POSICIÓN además del contenido — un prompt al final de la lista sería inservible.
    objFixture.componentInstance.placeholder = 'Seleccione...';
    objFixture.componentRef.changeDetectorRef.markForCheck();
    await objFixture.whenStable();

    expect(hijo(objFixture).options[0]).toEqual({ value: '', description: 'Seleccione...' });
    expect(hijo(objFixture).options).toHaveLength(4);
  });

  it('pasa manualValidation=true, así un select válido no se pinta por culpa de otro campo', async () => {
    const objForm = objFixture.componentInstance.form;

    objForm.controls.qd_strChannel.setValue('13');
    objForm.controls.qd_strChannel.markAsTouched();
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(objForm.status).toBe('INVALID');
    expect(hijo(objFixture).manualValidation).toBe(true);
    expect(hijo(objFixture).invalid).toBe(false);
  });

  it('la polaridad de `invalid` NO se invierte: se pasa el estado de error tal cual', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strChannel;

    // Inválido sin tocar → no se marca (mismo criterio que el resto de la fachada).
    expect(objControl.invalid).toBe(true);
    expect(hijo(objFixture).invalid).toBe(false);

    objControl.markAsTouched();
    objFixture.detectChanges();
    await objFixture.whenStable();

    // Y acá está la diferencia con los otros cuatro campos: inválido y tocado → `invalid === true`,
    // NO `valid === true`. Un wrapper que copiara la inversión del input de texto pondría `false`.
    expect(hijo(objFixture).invalid).toBe(true);
  });

  it('el orden del helpText es error → cargando → helpText, igual que en React', async () => {
    expect(hijo(objFixture).helpText).toBe('Elegí el canal de ingreso');

    objFixture.componentInstance.loading = true;
    objFixture.componentRef.changeDetectorRef.markForCheck();
    await objFixture.whenStable();
    expect(hijo(objFixture).helpText).toBe('Cargando opciones...');

    // El error explícito manda incluso sobre el estado de carga: es el mensaje más específico.
    objFixture.componentInstance.error = 'No se pudo validar el canal';
    objFixture.componentRef.changeDetectorRef.markForCheck();
    await objFixture.whenStable();
    expect(hijo(objFixture).helpText).toBe('No se pudo validar el canal');
    expect(hijo(objFixture).invalid).toBe(true);
  });

  it('emite id="field-<name>" en el wrap y no pisa el id interno de la lib', () => {
    const objWrap: HTMLElement | null =
      objFixture.nativeElement.querySelector('#field-qd_strChannel');

    expect(objWrap).not.toBeNull();
    expect(objWrap!.classList.contains('zds-select-wrap')).toBe(true);
    expect(objWrap!.getAttribute('tabindex')).toBe('-1');

    const cllIds = [...objFixture.nativeElement.querySelectorAll('[id]')].map(
      (in_objEl: Element) => in_objEl.id,
    );
    expect(cllIds).toEqual(['field-qd_strChannel', 'qd_strChannel']);
  });

  it('los validadores del padre sobreviven a generateControl()', () => {
    expect(objFixture.componentInstance.form.controls.qd_strChannel.errors?.['required']).toBe(true);
  });

  it('deshabilitar el control registra el estado y atenúa el envoltorio', async () => {
    // El límite documentado: `disable` es un input muerto en `lib-input-select-z` (declarado, nunca
    // leído), así que el estado no puede viajar al `za-select`. Angular igual bloquea el campo de
    // verdad; lo que se perdía era la SEÑAL VISUAL que el `z-select` de React da desde el propio DS
    // (`opacity: .5` en el host con `disabled`). Se replica marcando el envoltorio, así que el caso
    // cubre las dos mitades: el CVA recibió el estado, y la clase que lo pinta quedó puesta.
    const fnEnvoltorio = () =>
      objFixture.nativeElement.querySelector('.zds-select-wrap') as HTMLElement;

    // El conteo va antes: sin envoltorio, los dos `contains` de abajo son tautologías.
    expect(fnEnvoltorio()).not.toBeNull();
    expect(fnEnvoltorio().classList.contains('zds-select-wrap--deshabilitado')).toBe(false);

    objFixture.componentInstance.form.controls.qd_strChannel.disable();
    objFixture.detectChanges();
    await objFixture.whenStable();

    const objWrapper = objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance instanceof ZdsSelect,
    ).componentInstance as ZdsSelect;

    expect(objWrapper.deshabilitado()).toBe(true);
    expect(fnEnvoltorio().classList.contains('zds-select-wrap--deshabilitado')).toBe(true);
  });
});
