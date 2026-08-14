import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TextareaZ } from '@zurich-col/lib-zurich';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZdsTextarea } from './zds-textarea';

/**
 * El spec que más importa de los cinco campos, porque `lib-textarea-z` es el único **sin**
 * `manualValidation`: su `ngOnChanges` hace `if (this.group.status == 'INVALID') this.valid = true`
 * sin guarda posible. Acá se asevera el RESULTADO observable (el campo válido no queda marcado),
 * no el mecanismo con que se consigue — si mañana la lib agrega `manualValidation` y el wrapper
 * cambia de estrategia, este spec tiene que seguir siendo el mismo.
 */

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsTextarea],
  template: `
    <form [formGroup]="form">
      <zds-textarea
        formControlName="qd_strDescription"
        name="qd_strDescription"
        label="Descripción"
        [required]="true"
        [error]="error"
        [maxLength]="maxLength"
      />
    </form>
  `,
})
class HostDeFormulario {
  readonly form = new FormGroup({
    qd_strDescription: new FormControl('', [Validators.required, Validators.maxLength(500)]),
    qd_strOtro: new FormControl('', [Validators.required]),
  });

  error = '';
  maxLength: number | undefined = undefined;
}

async function drenarTimeouts() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function hijo(in_objFixture: ComponentFixture<HostDeFormulario>): TextareaZ {
  return in_objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance instanceof TextareaZ,
  ).componentInstance as TextareaZ;
}

describe('ZdsTextarea', () => {
  let objFixture: ComponentFixture<HostDeFormulario>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(HostDeFormulario);
    await objFixture.whenStable();
    await drenarTimeouts();
  });

  it('el control del FormGroup conserva su name real y no se agrega ninguno generado', () => {
    // Acá el motivo es distinto al de los otros campos: `lib-textarea-z` **nunca** llama a
    // `generateControl()` (su `ngOnInit` solo hace `generateGroup()`), así que no tiene con qué
    // inventar un `name-<ts>-<n>`. El test se pone rojo si una versión futura lo agrega.
    expect(Object.keys(objFixture.componentInstance.form.controls)).toEqual([
      'qd_strDescription',
      'qd_strOtro',
    ]);
  });

  it('ida del CVA: control.setValue llega al `model` del lib-textarea-z', async () => {
    objFixture.componentInstance.form.controls.qd_strDescription.setValue('Un reclamo largo');
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(hijo(objFixture).model).toBe('Un reclamo largo');
  });

  it('vuelta del CVA: el modelChange del hijo escribe el control y lo marca tocado', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strDescription;
    expect(objControl.touched).toBe(false);

    hijo(objFixture).modelChange.emit('Texto del usuario');
    objFixture.detectChanges();
    await objFixture.whenStable();

    expect(objControl.value).toBe('Texto del usuario');
    expect(objControl.touched).toBe(true);
  });

  it('un campo válido NO se pinta en error porque otro campo del group sea inválido', async () => {
    // ── El escenario que este wrapper existe para tapar, y el único de los cinco campos donde la
    // lib no ofrece `manualValidation` para apagarlo. Ver la cabecera de zds-textarea.ts.
    const objForm = objFixture.componentInstance.form;

    objForm.controls.qd_strDescription.setValue('Texto válido');
    objForm.controls.qd_strDescription.markAsTouched();
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    // El group entero es INVALID por culpa de `qd_strOtro`, que sigue vacío y es required.
    expect(objForm.status).toBe('INVALID');
    expect(objForm.controls.qd_strDescription.valid).toBe(true);

    // Y aun así el textarea no queda marcado. `valid` en esta lib SIGNIFICA `invalid`, así que lo
    // que se asevera es que quedó en `false`. Sin el re-bindeo del wrapper, el `ngOnChanges` de la
    // lib lo dejaría en `true` y el campo se pintaría rojo estando correcto.
    expect(hijo(objFixture).valid).toBe(false);
  });

  it('traduce el estado de error a `valid` invertido: solo cuando está inválido Y tocado', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strDescription;

    expect(objControl.invalid).toBe(true);
    expect(hijo(objFixture).valid).toBe(false);

    objControl.markAsTouched();
    objFixture.detectChanges();
    await objFixture.whenStable();

    expect(hijo(objFixture).valid).toBe(true);
  });

  it('un `error` explícito manda sobre el estado del control y viaja como helpText', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strDescription;
    objControl.setValue('Texto válido');
    objFixture.componentInstance.error = 'El texto no cumple';
    objFixture.detectChanges();
    await objFixture.whenStable();

    expect(objControl.valid).toBe(true);
    expect(hijo(objFixture).valid).toBe(true);
    expect(hijo(objFixture).helpText).toBe('El texto no cumple');
  });

  it('`elastic` arranca en true, igual que la fachada React', () => {
    expect(hijo(objFixture).elastic).toBe(true);
  });

  it('un `maxLength` numérico se traduce al par maxLength(bool) + maxNumber(num) de la lib', async () => {
    // Sin límite: el interruptor apagado, así que el `[attr.max-length]` de la lib queda en ''.
    expect(hijo(objFixture).maxLength).toBe(false);

    objFixture.componentInstance.maxLength = 500;
    // `detectChanges()` acá tiraba NG0100 sobre el `[required]="true"` del host. No es un bug del
    // wrapper: en un fixture **zoneless** el `detectChanges()` corre su pasada de verificación
    // (check-no-changes) sobre un host al que se le acaba de escribir un campo desde afuera, sin que
    // Angular sepa que quedó sucio. `markForCheck()` + `whenStable()` es la forma correcta de
    // propagar una mutación externa del host, y ejercita el mismo camino que un `signal` en prod.
    objFixture.componentRef.changeDetectorRef.markForCheck();
    await objFixture.whenStable();

    // Con límite: interruptor prendido Y el número donde la lib lo lee. Aseverar solo uno de los
    // dos no distinguiría el traductor correcto de uno que manda el número al input equivocado
    // — que es justo el error que el nombre `maxLength` invita a cometer.
    expect(hijo(objFixture).maxLength).toBe(true);
    expect(hijo(objFixture).maxNumber).toBe(500);
  });

  it('los validadores del padre sobreviven al montaje', () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strDescription;

    expect(objControl.errors?.['required']).toBe(true);

    objControl.setValue('x'.repeat(501));
    expect(objControl.errors?.['maxlength']).toBeTruthy();
  });

  it('setDisabledState propaga control.disable() al wrapper', async () => {
    objFixture.componentInstance.form.controls.qd_strDescription.disable();
    objFixture.detectChanges();
    await objFixture.whenStable();

    const objWrapper = objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance instanceof ZdsTextarea,
    ).componentInstance as ZdsTextarea;

    expect(objWrapper.deshabilitado()).toBe(true);
  });
});
