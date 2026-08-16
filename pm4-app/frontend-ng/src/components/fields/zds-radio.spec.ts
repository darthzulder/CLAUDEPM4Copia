import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ZaRadioSelect } from '@zurich/angular-components';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZdsRadio } from './zds-radio';

/**
 * Este spec cubre el **otro** modelo de wrapper de la fachada, y por eso su forma es distinta a la de
 * los cinco de `lib-*-z`.
 *
 * Allá el wrapper *es* el `ControlValueAccessor` y lo que se asevera es el puente que escribe a mano
 * (`writeValue` → `model`, `modelChange` → control). Acá el CVA es el **nativo de Zurich**
 * (`ZaRadioSelect` registra su propio `NG_VALUE_ACCESSOR`), así que lo que puede romperse es otra
 * cosa: que el wrapper le preste **el mismo `FormControl`** de la pantalla y no una copia. Si le
 * pasara otro control, el campo se vería perfecto y no guardaría nada — y ningún test de "el valor
 * llega al hijo" lo detectaría, porque el valor *sí* llegaría.
 *
 * Por eso el test central es de **identidad de control**, hermano del de identidad de group que
 * `adopcion-grupo.spec.ts` hace para el otro modelo.
 *
 * ── Lo que NO se testea acá, y por qué ────────────────────────────────────────────────────────
 * No hay test de "el control conserva su `name` real". Ese test existe para los `lib-*-z` porque esos
 * componentes **inventan** nombres de control (`UtilService.getControlName()` → `name-<ts>-<n>`) si
 * el group no los tiene ya. `za-radio-select` no recibe `[group]` ni registra controles: no hay
 * nombre que pueda inventar, así que un test así no podría ponerse rojo nunca. Escribirlo sería
 * exactamente el test de adorno que el flujo de CLAUDE.md desaconseja.
 */

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsRadio],
  template: `
    <form [formGroup]="form">
      <zds-radio
        formControlName="qd_strTipo"
        name="qd_strTipo"
        label="Tipo de solicitud"
        [options]="cllOpciones()"
        [obligatorio]="true"
        [inline]="blnInline()"
        [error]="strError()"
        helpText="Elegí una opción"
      />
    </form>
  `,
})
class Host {
  readonly form = new FormGroup({
    qd_strTipo: new FormControl<string | null>(null, [Validators.required]),
    qd_strOtro: new FormControl('', [Validators.required]),
  });

  readonly blnInline = signal(false);
  readonly strError = signal('');
  readonly cllOpciones = signal<readonly { value: string; text?: string; label?: string; disabled?: boolean }[]>([
    { value: '1', text: 'Queja' },
    { value: '2', label: 'Reclamo' },
    { value: '3' },
    { value: '4', text: 'Anulado', disabled: true },
  ]);
}

/** Host sin `formControlName`: cubre el uso suelto, que es donde el control de respaldo importa. */
@Component({
  standalone: true,
  imports: [ZdsRadio],
  template: `<zds-radio name="qd_strSuelto" label="Suelto" [options]="[{ value: '1', text: 'Uno' }]" />`,
})
class HostSuelto {}

/**
 * `_onChange` y `_onBlur` son `protected` en `ZaBaseInput`, así que el tipo público de `ZaRadioSelect`
 * no los expone. Se declaran acá para poder invocarlos desde el spec.
 *
 * **No es evitable con otro enfoque, y conviene decir por qué:** son los dos únicos puntos de entrada
 * del componente. La alternativa —despachar un evento DOM real sobre el `<z-radio-select>`— exigiría
 * que Lit haya hecho el upgrade del custom element para que el `(change)` interno esté enganchado, y
 * bajo jsdom eso no pasa. Llamarlos directo es *más* fiel al camino real (`ZaBaseInput` los expone al
 * template con esos mismos nombres) que simular una interacción que el runner no puede ejecutar.
 */
type ZaRadioSelectInterno = ZaRadioSelect & {
  _onChange(in_objEvento: CustomEvent<string> | Event): void;
  _onBlur(in_objEvento: FocusEvent): void;
};

function hijo(in_objFixture: ComponentFixture<unknown>): ZaRadioSelectInterno {
  return in_objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance instanceof ZaRadioSelect,
  ).componentInstance as ZaRadioSelectInterno;
}

describe('ZdsRadio', () => {
  let objFixture: ComponentFixture<Host>;
  let objControl: FormControl<string | null>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(Host);
    objControl = objFixture.componentInstance.form.controls.qd_strTipo;
    await objFixture.whenStable();
  });

  it('le presta a za-radio-select EL MISMO FormControl de la pantalla, no una copia', () => {
    // El test central de este modelo de wrapper. Con un control distinto el campo se vería bien y no
    // guardaría nada, y los tests de ida/vuelta de abajo **no lo detectarían**: con una copia
    // sincronizada el valor igual iría y volvería.
    //
    // La identidad se lee del `FormControlDirective` que el `[formControl]` del template instancia
    // sobre el `za-radio-select`. Su `.control` es el objeto que el CVA nativo gobierna, así que
    // compararlo por referencia contra el control del `FormGroup` del host es la aserción exacta.
    const objDirectiva = objFixture.debugElement
      .query((in_objNodo) => in_objNodo.componentInstance instanceof ZaRadioSelect)
      .injector.get(NgControl);

    expect(objDirectiva.control).toBe(objControl);
  });

  it('ida: control.setValue llega al ngModel del za-radio-select', async () => {
    objControl.setValue('2');
    await objFixture.whenStable();

    expect(hijo(objFixture).ngModel).toBe('2');
  });

  it('vuelta: el change del componente de Zurich escribe en el control de la pantalla', async () => {
    // Se dispara el `change` como lo hace el web component real: un CustomEvent con `detail`. Es lo
    // que `ZaBaseInput._onChange` lee para llamar al `onChange` del CVA.
    hijo(objFixture)._onChange(new CustomEvent('change', { detail: '3' }));
    await objFixture.whenStable();

    expect(objControl.value).toBe('3');
  });

  it('el blur del componente marca el control como touched', async () => {
    expect(objControl.touched).toBe(false);

    // `FocusEvent` real: `_onBlur` lo tipa así y hace `event.stopPropagation()` sobre él.
    hijo(objFixture)._onBlur(new FocusEvent('blur'));
    await objFixture.whenStable();

    expect(objControl.touched).toBe(true);
  });

  it('traduce las opciones a {value, text} con el orden text ?? label ?? value', () => {
    expect(hijo(objFixture).options).toEqual([
      { value: '1', text: 'Queja', disabled: undefined },
      { value: '2', text: 'Reclamo', disabled: undefined },
      { value: '3', text: '3', disabled: undefined },
      { value: '4', text: 'Anulado', disabled: true },
    ]);
  });

  it('preserva el disabled por opción (a diferencia de ZdsSelect, que no tiene dónde ponerlo)', () => {
    const cllOpciones = hijo(objFixture).options as { value: string; disabled?: boolean }[];
    expect(cllOpciones.find((in_objOpcion) => in_objOpcion.value === '4')?.disabled).toBe(true);
  });

  it('emite id="field-<name>" para scrollToFirstError', () => {
    expect(objFixture.nativeElement.querySelector('#field-qd_strTipo')).not.toBeNull();
  });

  it('inline se traduce a config="inline"; sin inline no manda config', async () => {
    // `undefined`, no `''`: el tipo del DS es `'inline' | undefined` y `''` no es un valor válido.
    expect(hijo(objFixture).config).toBeUndefined();

    objFixture.componentInstance.blnInline.set(true);
    await objFixture.whenStable();

    expect(hijo(objFixture).config).toBe('inline');
  });

  it('NO contagia el error de otro campo del form (no hay manualValidation que neutralizar)', async () => {
    // `qd_strOtro` es inválido y sin tocar. En un `lib-*-z` esto pintaría este campo en rojo por el
    // `if (!manualValidation && group.status == 'INVALID')` de su `ngOnChanges`. La capa `za-*` no
    // recibe `[group]`, así que no puede mirar el estado de al lado — se asevera para dejar claro
    // que la ausencia de `manualValidation` en el template es deliberada.
    objControl.setValue('1');
    objControl.markAsTouched();
    await objFixture.whenStable();

    expect(objFixture.componentInstance.form.invalid).toBe(true);
    expect(hijo(objFixture).invalid).toBe(false);
  });

  it('invalid tiene la polaridad correcta: inválido y tocado se pinta, inválido a secas no', async () => {
    // Sin tocar: no se pinta, aunque el required no esté satisfecho. Es el criterio de React, y lo
    // que evita un form de ~20 obligatorios todo en rojo al montar.
    expect(objControl.invalid).toBe(true);
    expect(hijo(objFixture).invalid).toBe(false);

    objControl.markAsTouched();
    await objFixture.whenStable();

    expect(hijo(objFixture).invalid).toBe(true);
  });

  it('un error explícito manda sobre el estado del control y desplaza al helpText', async () => {
    objControl.setValue('1');
    await objFixture.whenStable();
    expect(hijo(objFixture).helpText).toBe('Elegí una opción');

    objFixture.componentInstance.strError.set('El tipo no aplica a este canal');
    await objFixture.whenStable();

    expect(hijo(objFixture).invalid).toBe(true);
    expect(hijo(objFixture).helpText).toBe('El tipo no aplica a este canal');
  });

  it('control.disable() deshabilita el componente vía el setDisabledState del CVA nativo', async () => {
    objControl.disable();
    await objFixture.whenStable();

    expect(hijo(objFixture).disabled).toBe(true);
  });
});

describe('ZdsRadio suelto (sin formControlName)', () => {
  it('monta sin tirar y usa el control de respaldo', async () => {
    const objFixture = TestBed.createComponent(HostSuelto);
    await objFixture.whenStable();

    // `[formControl]` exige una instancia real: pasarle `null` tiraría NG01050. El control de
    // respaldo de `CampoZaBase` existe por esto.
    expect(hijo(objFixture)).toBeInstanceOf(ZaRadioSelect);
    expect(objFixture.nativeElement.querySelector('#field-qd_strSuelto')).not.toBeNull();
  });
});
