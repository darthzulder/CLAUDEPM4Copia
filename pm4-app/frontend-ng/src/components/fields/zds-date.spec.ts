import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { InputDateZ } from '@zurich-col/lib-zurich';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZdsDate } from './zds-date';

/**
 * `lib-input-date-z` es el que más se parece al input de texto (polaridad invertida,
 * `manualValidation` presente), así que lo específico de este spec es el **límite**: la lib **no
 * tiene `helpText`**, y por lo tanto un `error` explícito acá pinta el borde pero **no muestra
 * mensaje**. Eso se asevera de frente —que el estado de error sí llega, y que no hay ningún input de
 * texto de ayuda donde ponerlo— para que la pérdida de paridad contra React quede registrada en un
 * test y no solo en un comentario. Si una versión futura de la lib agrega `help-text`, este spec es
 * el que hay que venir a actualizar.
 */

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsDate],
  template: `
    <form [formGroup]="form">
      <zds-date
        formControlName="qd_strFechaProrroga"
        name="qd_strFechaProrroga"
        label="Fecha de prórroga"
        [obligatorio]="true"
        [min]="min"
        [error]="error"
      />
    </form>
  `,
})
class HostDeFormulario {
  readonly form = new FormGroup({
    qd_strFechaProrroga: new FormControl('', [Validators.required]),
    qd_strOtro: new FormControl('', [Validators.required]),
  });

  min = '2026-08-14';
  error = '';
}

async function drenarTimeouts() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function hijo(in_objFixture: ComponentFixture<HostDeFormulario>): InputDateZ {
  return in_objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance instanceof InputDateZ,
  ).componentInstance as InputDateZ;
}

describe('ZdsDate', () => {
  let objFixture: ComponentFixture<HostDeFormulario>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(HostDeFormulario);
    await objFixture.whenStable();
    await drenarTimeouts();
  });

  it('el control del FormGroup conserva su name real y no se agrega ninguno generado', () => {
    expect(Object.keys(objFixture.componentInstance.form.controls)).toEqual([
      'qd_strFechaProrroga',
      'qd_strOtro',
    ]);
  });

  it('ida del CVA: control.setValue llega al `model` del lib-input-date-z', async () => {
    objFixture.componentInstance.form.controls.qd_strFechaProrroga.setValue('2026-09-01');
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(hijo(objFixture).model).toBe('2026-09-01');
  });

  it('vuelta del CVA: el modelChange del hijo escribe el control y lo marca tocado', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strFechaProrroga;
    expect(objControl.touched).toBe(false);

    hijo(objFixture).modelChange.emit('2026-09-15');
    objFixture.detectChanges();
    await objFixture.whenStable();

    expect(objControl.value).toBe('2026-09-15');
    expect(objControl.touched).toBe(true);
  });

  it('`inputType` arranca en "date" y las cotas viajan como min/max', () => {
    // La lib mapea `inputType` con una cadena de ternarios que cae a `'date'` en cualquier valor
    // desconocido. El default explícito del wrapper evita depender de ese fallback silencioso.
    expect(hijo(objFixture).inputType).toBe('date');
    expect(hijo(objFixture).min).toBe('2026-08-14');
  });

  it('pasa manualValidation=true, así una fecha válida no se pinta por culpa de otro campo', async () => {
    const objForm = objFixture.componentInstance.form;

    objForm.controls.qd_strFechaProrroga.setValue('2026-09-01');
    objForm.controls.qd_strFechaProrroga.markAsTouched();
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(objForm.status).toBe('INVALID');
    expect(hijo(objFixture).manualValidation).toBe(true);
    expect(hijo(objFixture).valid).toBe(false);
  });

  it('traduce el estado de error a `valid` invertido: solo cuando está inválido Y tocado', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strFechaProrroga;

    expect(objControl.invalid).toBe(true);
    expect(hijo(objFixture).valid).toBe(false);

    objControl.markAsTouched();
    objFixture.detectChanges();
    await objFixture.whenStable();

    expect(hijo(objFixture).valid).toBe(true);
  });

  it('un `error` explícito pinta el borde pero NO puede mostrar mensaje: la lib no tiene helpText', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strFechaProrroga;
    objControl.setValue('2026-09-01');
    objFixture.componentInstance.error = 'La fecha excede el plazo de prórroga';
    // Ver la nota de NG0100 en zds-input.spec.ts: mutar un campo del host y llamar `detectChanges()`
    // en un fixture zoneless dispara el check-no-changes sobre un host que Angular no sabe sucio.
    objFixture.componentRef.changeDetectorRef.markForCheck();
    await objFixture.whenStable();
    // Obligatorio, igual que en zds-input.spec.ts: el `errorRequired` que la lib compone sobre el
    // control se limpia recién cuando vence el `setTimeout` de `UtilService.updateControlValitor()`.
    // Sin drenarlo, este `valid` lee un error obsoleto. El porqué completo está en la cabecera de
    // zds-input.spec.ts.
    await drenarTimeouts();

    // Lo que sí funciona: el error explícito manda sobre el estado del control (válido y sin tocar)
    // y el borde se pinta.
    expect(objControl.valid).toBe(true);
    expect(hijo(objFixture).valid).toBe(true);

    // Y lo que no: `lib-input-date-z` no declara `helpText` — es el único de los cinco campos que no
    // puede mostrar texto de ayuda. Se asevera la AUSENCIA de la propiedad, no que valga `''`: si la
    // lib la agregara con default vacío, `toBe('')` seguiría verde y la pérdida de paridad quedaría
    // tapada justo cuando dejó de ser cierta.
    expect('helpText' in hijo(objFixture)).toBe(false);
  });

  it('emite id="field-<name>" en el wrap y no pisa el id interno de la lib', () => {
    const objWrap: HTMLElement | null = objFixture.nativeElement.querySelector(
      '#field-qd_strFechaProrroga',
    );

    expect(objWrap).not.toBeNull();
    expect(objWrap!.classList.contains('zds-field-wrap')).toBe(true);
    expect(objWrap!.getAttribute('tabindex')).toBe('-1');
  });

  it('los validadores del padre sobreviven a generateControl()', () => {
    expect(objFixture.componentInstance.form.controls.qd_strFechaProrroga.errors?.['required']).toBe(
      true,
    );
  });

  it('setDisabledState propaga control.disable() al wrapper', async () => {
    objFixture.componentInstance.form.controls.qd_strFechaProrroga.disable();
    objFixture.detectChanges();
    await objFixture.whenStable();

    const objWrapper = objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance instanceof ZdsDate,
    ).componentInstance as ZdsDate;

    expect(objWrapper.deshabilitado()).toBe(true);
  });
});
