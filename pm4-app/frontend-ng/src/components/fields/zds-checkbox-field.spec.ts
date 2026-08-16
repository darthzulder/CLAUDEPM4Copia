import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { CheckboxZ } from '@zurich-col/lib-zurich';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZdsCheckboxField } from './zds-checkbox-field';

/**
 * Dos cosas viven solo en este spec:
 *
 *  1. **El par `checkedValue`/`uncheckedValue`**, con el caso que importa: `'NO'` es una cadena
 *     **truthy**, así que un wrapper que derivara el tildado con `!!valor` mostraría el checkbox
 *     marcado justo cuando el usuario dijo que no. Ese es el test que separa el mapeo correcto del
 *     que "parece funcionar" con `'SI'`.
 *  2. **La ausencia de contagio.** `lib-checkbox-z` tampoco tiene `manualValidation`, igual que el
 *     textarea, pero su mecanismo es distinto: se suscribe al `statusChanges` de su **propio**
 *     control, no al del group. O sea que acá no hay nada que neutralizar, y el spec lo asevera para
 *     que quede claro que la ausencia de `manualValidation` en el template es deliberada y no un
 *     olvido copiado del textarea.
 */

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsCheckboxField],
  template: `
    <form [formGroup]="form">
      <zds-checkbox-field
        formControlName="qd_blnAcepta"
        name="qd_blnAcepta"
        label="Acepto los términos"
        [obligatorio]="true"
        helpText="Obligatorio para continuar"
      />
    </form>
  `,
})
class HostBooleano {
  readonly form = new FormGroup({
    qd_blnAcepta: new FormControl<string | boolean>(false, [Validators.requiredTrue]),
    qd_strOtro: new FormControl('', [Validators.required]),
  });
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsCheckboxField],
  template: `
    <form [formGroup]="form">
      <zds-checkbox-field
        formControlName="qd_strAutoriza"
        name="qd_strAutoriza"
        label="Autorizo el tratamiento de datos"
        checkedValue="SI"
        uncheckedValue="NO"
      />
    </form>
  `,
})
class HostContratoDeTexto {
  readonly form = new FormGroup({
    qd_strAutoriza: new FormControl<string | boolean>('NO'),
  });
}

async function drenarTimeouts() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function hijo(in_objFixture: ComponentFixture<unknown>): CheckboxZ {
  return in_objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance instanceof CheckboxZ,
  ).componentInstance as CheckboxZ;
}

describe('ZdsCheckboxField booleano', () => {
  let objFixture: ComponentFixture<HostBooleano>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(HostBooleano);
    await objFixture.whenStable();
    await drenarTimeouts();
  });

  it('el control del FormGroup conserva su name real y no se agrega ninguno generado', () => {
    expect(Object.keys(objFixture.componentInstance.form.controls)).toEqual([
      'qd_blnAcepta',
      'qd_strOtro',
    ]);
  });

  it('ida del CVA: control.setValue(true) llega al `model` como booleano', async () => {
    objFixture.componentInstance.form.controls.qd_blnAcepta.setValue(true);
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(hijo(objFixture).model).toBe(true);
  });

  it('vuelta del CVA: el modelChange del hijo escribe un booleano y marca tocado', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_blnAcepta;
    expect(objControl.touched).toBe(false);

    hijo(objFixture).modelChange.emit(true);
    objFixture.detectChanges();
    await objFixture.whenStable();

    // Sin `checkedValue` el valor guardado es un booleano puro, no `'true'`.
    expect(objControl.value).toBe(true);
    expect(objControl.touched).toBe(true);
  });

  it('no hay contagio del group: el `valid` de la lib no reacciona al status del formulario', async () => {
    const objForm = objFixture.componentInstance.form;

    objForm.controls.qd_blnAcepta.setValue(true);
    objForm.controls.qd_blnAcepta.markAsTouched();
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    // Lo que este test protege: el group entero es INVALID por `qd_strOtro`, y eso **no** ensucia el
    // estado de este campo. Es la diferencia con el textarea, que sí lee `group.status` y por eso
    // necesita el parche del `(validChange)`. Acá la lib se suscribe al `statusChanges` de su
    // **propio** control, así que no hay contagio y no hay nada que neutralizar.
    expect(objForm.status).toBe('INVALID');

    // Y el control real queda VÁLIDO con el checkbox tildado, que es lo que `requiredTrue` pide.
    // Esta aserción es además la que guarda el group satélite: cuando este wrapper le pasaba a la lib
    // el `FormGroup` de la pantalla, su `validRequired()` invertido componía `errorRequired` sobre
    // este mismo control y lo dejaba **INVALID justo al tildarlo**. Si alguien saca el override de
    // `grupo`, este `expect` se pone rojo con `errors: {errorRequired: true}`.
    expect(objForm.controls.qd_blnAcepta.valid).toBe(true);
    expect(objForm.controls.qd_blnAcepta.errors).toBeNull();

    // ── Y por qué se asevera `false` y no `true` ─────────────────────────────────────────────────
    // Acá se midió, después de que este spec saliera rojo esperando `true`. Dos motivos concurrentes,
    // y ninguno tiene que ver con el wrapper:
    //  1. `valid` arranca en `false` y la suscripción solo corre cuando `statusChanges` **emite**. El
    //     control ya estaba VALID antes del `setValue`, así que no hubo transición y nadie tocó la
    //     propiedad. O sea que el `false` no significa "inválido": significa "sin actualizar".
    //  2. Aun cuando emitiera, `valid` **no llega al DOM**: el template de `lib-checkbox-z` pasa
    //     `id name label help-text ngModel required` a `za-checkbox` y ningún `[invalid]`. El estado
    //     de error de este control no se pinta, y por eso el wrapper tampoco bindea la propiedad.
    //
    // Se asevera igual —en vez de omitir el caso— porque la propiedad SÍ es observable, y si una
    // versión futura de la lib la cableara al DOM este test es el que avisa que hay que decidir la
    // polaridad. Vale saber que la del checkbox está **al revés** del textarea/input/date: su
    // suscripción hace `valid = status === 'INVALID' ? false : true`, o sea `valid` significa `valid`.
    expect(hijo(objFixture).valid).toBe(false);
  });

  it('el `validRequired()` de la lib está invertido, y el group satélite lo mantiene fuera del form', async () => {
    // Caracterización de un **bug de `lib-checkbox-z`**, no del wrapper: `validRequired()` es
    // `this.required && this.model` (sin negación), así que con `required` en `true` la lib reporta
    // `errorRequired` **cuando el checkbox SÍ está tildado**. Y no hay `manualValidation` en este
    // componente para apagar la composición del validador.
    //
    // **Es exclusivo de este componente y conviene no generalizarlo.** En el `.mjs` hay dos métodos de
    // nombre casi idéntico y semántica opuesta: `validRequired()` (solo `CheckboxZ`, invertido) y
    // `validateRequired()` (los otros seis campos: `return this.required && !String(this.model ||
    // '').trim()`, **correcto**). Se llegó a afirmar que el de `InputTextZ` también estaba invertido y
    // era falso — el síntoma real ahí era un `errors` obsoleto; ver la cabecera de zds-input.spec.ts.
    //
    // Este test asevera las dos mitades que importan:
    //  (a) que el bug de la lib **existe** — si una versión futura lo arregla, la primera aserción se
    //      pone roja y el bloque de la cabecera hay que actualizarlo;
    //  (b) que **no llega** al control de la pantalla, gracias al group satélite.
    const objControl = objFixture.componentInstance.form.controls.qd_blnAcepta;

    // Destildado: `Validators.requiredTrue` del padre sí marca el error, y el de la lib no aporta nada.
    expect(objControl.errors?.['required']).toBe(true);
    expect(objControl.errors?.['errorRequired']).toBeUndefined();

    objControl.setValue(true);
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    const objHijo = hijo(objFixture);

    // (a) El validador de la lib, invocado con el estado real del hijo, devuelve el error invertido.
    // Se invoca a mano en vez de leerlo del control porque el control satélite es interno al wrapper:
    // lo que se quiere fijar es el **comportamiento de la lib**, no dónde terminó su efecto.
    expect(objHijo.required).toBe(true);
    expect(objHijo.model).toBe(true);
    expect(
      (objHijo as unknown as { generateValidation(): unknown }).generateValidation(),
    ).toEqual({ errorRequired: true });

    // (b) Y sin embargo el control de la pantalla está limpio: el `errorRequired` se compuso sobre el
    // control satélite. Sin el override de `grupo` acá salía `{errorRequired: true}` — medido.
    expect(objControl.errors).toBeNull();
    expect(objControl.valid).toBe(true);

    // El group que ve la lib NO es el de la pantalla, y tiene un solo control. Es la aserción
    // estructural del override: si alguien lo saca, estas dos se ponen rojas juntas.
    expect(objHijo.group).not.toBe(objFixture.componentInstance.form);
    expect(Object.keys(objHijo.group.controls)).toEqual(['qd_blnAcepta']);
  });

  it('el helpText sí viaja (es el único input de texto que la lib lee de verdad)', () => {
    expect(hijo(objFixture).helpText).toBe('Obligatorio para continuar');
  });

  it('emite id="field-<name>" en el wrap', () => {
    const objWrap: HTMLElement | null = objFixture.nativeElement.querySelector('#field-qd_blnAcepta');

    expect(objWrap).not.toBeNull();
    expect(objWrap!.classList.contains('zds-field-wrap')).toBe(true);
    expect(objWrap!.getAttribute('tabindex')).toBe('-1');
  });

  it('setDisabledState registra el estado aunque `disabled` sea un input muerto en la lib', async () => {
    // `disabled` está declarado en `lib-checkbox-z` y no se lee en ninguna parte, así que el wrapper
    // no lo bindea. Igual que en el select: lo aseverable es que el CVA recibió el estado.
    objFixture.componentInstance.form.controls.qd_blnAcepta.disable();
    objFixture.detectChanges();
    await objFixture.whenStable();

    const objWrapper = objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance instanceof ZdsCheckboxField,
    ).componentInstance as ZdsCheckboxField;

    expect(objWrapper.deshabilitado()).toBe(true);
  });
});

describe('ZdsCheckboxField con contrato de texto SI/NO', () => {
  let objFixture: ComponentFixture<HostContratoDeTexto>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(HostContratoDeTexto);
    await objFixture.whenStable();
    await drenarTimeouts();
  });

  it('`NO` deja el checkbox destildado, aunque sea una cadena truthy', () => {
    // El test que justifica el orden de la comparación en `blnTildado`. Con `!!valor` este spec se
    // pone rojo: `!!'NO' === true` mostraría el checkbox marcado con el usuario habiendo dicho que no.
    expect(objFixture.componentInstance.form.controls.qd_strAutoriza.value).toBe('NO');
    expect(hijo(objFixture).model).toBe(false);
  });

  it('`SI` deja el checkbox tildado', async () => {
    objFixture.componentInstance.form.controls.qd_strAutoriza.setValue('SI');
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(hijo(objFixture).model).toBe(true);
  });

  it('al tildar guarda `SI` y al destildar guarda `NO`, no booleanos', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strAutoriza;

    hijo(objFixture).modelChange.emit(true);
    objFixture.detectChanges();
    await objFixture.whenStable();
    // El contrato con PM4 es texto: guardar `true` acá rompería el proceso (regla 1 de CLAUDE.md).
    expect(objControl.value).toBe('SI');

    hijo(objFixture).modelChange.emit(false);
    objFixture.detectChanges();
    await objFixture.whenStable();
    expect(objControl.value).toBe('NO');
  });
});
