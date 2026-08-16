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

  it('setDisabledState registra el estado aunque la lib no pueda deshabilitar el select', async () => {
    // El límite documentado: `disable` es un input muerto en `lib-input-select-z` (declarado, nunca
    // leído), así que **no hay forma** de deshabilitar visualmente este campo. Lo que sí se puede
    // aseverar —y es lo que importa para el CVA— es que el wrapper recibió el estado; si mañana la
    // lib cablea ese input, el bindeo se agrega en un solo lugar y este test ya lo respalda.
    objFixture.componentInstance.form.controls.qd_strChannel.disable();
    objFixture.detectChanges();
    await objFixture.whenStable();

    const objWrapper = objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance instanceof ZdsSelect,
    ).componentInstance as ZdsSelect;

    expect(objWrapper.deshabilitado()).toBe(true);
  });
});
