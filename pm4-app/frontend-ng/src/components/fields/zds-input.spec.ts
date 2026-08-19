import { Component, ErrorHandler } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { InputTextZ } from '@zurich-col/lib-zurich';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZdsInput } from './zds-input';

/**
 * Lo que este spec puede y no puede cubrir. Bajo jsdom los `lib-*-z` son bindings sobre custom
 * elements de Lit, así que el pintado interno no se ejecuta: no se puede tipear en el input real ni
 * verificar estilos. Lo que SÍ se verifica —y es donde vive todo lo que el port puede romper— es el
 * contrato del CVA, el estado del `FormControl`, y que los inputs que llegan al hijo tengan la
 * polaridad y los nombres correctos. El pintado real es gate manual en Docker.
 *
 * Las aserciones se hacen sobre la INSTANCIA del `InputTextZ` hijo (vía `DebugElement`), que es
 * donde vive el gotcha que se está neutralizando. Aseverar sobre el DOM no serviría: los inputs de
 * un componente Angular no se reflejan como atributos.
 *
 * ── El `errorRequired` diferido: por qué `drenarTimeouts()` es obligatorio tras un `setValue` ──
 * Con la adopción del group funcionando de verdad (ver `adopcion-grupo.spec.ts`), el `lib-*-z` compone
 * su propio validador sobre el control REAL de la pantalla:
 * `setValidators(compose([validadorPrevio, () => this.generateValidation()]))`. Ese validador es un
 * **closure vivo** sobre el componente hijo, y `generateValidation()` devuelve `{errorRequired: true}`
 * cuando `validateRequired()` da `true`.
 *
 * El punto es **cuándo** se evalúa. Angular corre validadores al escribir el control, así que al
 * montar —con el `model` del hijo todavía vacío— el error se calcula y queda pegado. Quien lo limpia
 * es `UtilService.updateControlValitor()`, que hace `updateValueAndValidity()` **dentro de un
 * `setTimeout`**. Si el test asevera antes de que ese timer venza, ve un error **obsoleto**: el
 * validador ya devuelve `null`, pero el control conserva el `errors` de la pasada anterior.
 *
 * Medido, y vale registrarlo porque el síntoma es muy engañoso: con `model === 'Internet'`,
 * `required === true` y `validateRequired() === false`, el control seguía en
 * `{errorRequired: true}` / `valid: false`; un `updateValueAndValidity()` manual lo pasaba a
 * `errors: null` / `valid: true` sin cambiar nada más.
 *
 * **Corrección de un diagnóstico previo, para que no se repita.** Esto se atribuyó primero a que
 * `InputTextZ.validateRequired()` estaba invertido, como sí lo está el `CheckboxZ.validRequired()`.
 * **Es falso.** Son dos métodos con nombres casi iguales y semántica opuesta, y en el `.mjs` conviven:
 *   - `validateRequired()` — en `InputTextZ`/`InputTimeZ`/`InputDateZ`/`InputPasswordZ`/
 *     `InputSelectZ`/`TextareaZ`: `return this.required && !String(this.model || '').trim()` →
 *     **correcto** (verdadero cuando está vacío).
 *   - `validRequired()` — SOLO en `CheckboxZ`: `return this.required && this.model` → **invertido**
 *     (verdadero cuando está tildado). Ése sí es un bug de la lib, y es la razón del group satélite
 *     de `zds-checkbox-field.ts`.
 * Buscar `validRequired` con un grep da **una sola** ocurrencia y es fácil concluir que el método es
 * único; los otros seis se llaman `validateRequired`. No confundirlos.
 */

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsInput],
  template: `
    <form [formGroup]="form">
      <zds-input
        formControlName="qd_strChannel"
        name="qd_strChannel"
        label="Canal"
        [obligatorio]="true"
        [error]="error"
      />
    </form>
  `,
})
class HostDeFormulario {
  readonly form = new FormGroup({
    qd_strChannel: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    qd_strOtro: new FormControl('', [Validators.required]),
  });

  error = '';
}

/** Deja correr los `setTimeout` con que `lib-zurich` difiere `setValue`/`updateValueAndValidity`. */
async function drenarTimeouts() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/** La instancia del `lib-input-text-z` que el wrapper renderiza adentro. */
function hijo(in_objFixture: ComponentFixture<HostDeFormulario>): InputTextZ {
  const objDebug = in_objFixture.debugElement.children[0].query(
    (in_objNodo) => in_objNodo.componentInstance instanceof InputTextZ,
  );
  return objDebug.componentInstance as InputTextZ;
}

describe('ZdsInput', () => {
  let objFixture: ComponentFixture<HostDeFormulario>;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(HostDeFormulario);
    await objFixture.whenStable();
    await drenarTimeouts();
  });

  it('el control del FormGroup conserva su name real y no se agrega ninguno generado', async () => {
    // El conteo es parte de la aserción, no un extra: en el gate 0, con el control renombrado el
    // group terminó con TRES controles (el propio + el `name-<ts>-<n>` de la lib). Aseverar solo la
    // presencia de `qd_strChannel` no distingue "lo adoptó" de "lo adoptó y además creó otro".
    expect(Object.keys(objFixture.componentInstance.form.controls)).toEqual([
      'qd_strChannel',
      'qd_strOtro',
    ]);
  });

  it('ida del CVA: control.setValue llega al `model` del lib-input-text-z', async () => {
    objFixture.componentInstance.form.controls.qd_strChannel.setValue('Internet');
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(hijo(objFixture).model).toBe('Internet');
  });

  it('vuelta del CVA: el modelChange del hijo escribe el control y lo marca tocado', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strChannel;
    expect(objControl.touched).toBe(false);

    // Se emite programáticamente sobre la instancia del hijo. Simular un click/tipeo en el shadow
    // DOM no es viable en jsdom, y además probaría a Lit, no a este wrapper.
    hijo(objFixture).modelChange.emit('Sucursal');
    objFixture.detectChanges();
    await objFixture.whenStable();

    expect(objControl.value).toBe('Sucursal');
    expect(objControl.touched).toBe(true);
  });

  it('emite id="field-<name>" en el wrap, focusable y sin colisionar con el id interno de la lib', () => {
    const objWrap: HTMLElement | null =
      objFixture.nativeElement.querySelector('#field-qd_strChannel');

    expect(objWrap).not.toBeNull();

    // El elemento tiene que ser el wrap, no el componente del DS. `lib-input-text-z` cablea
    // `[id]="name"` sobre su `za-text-input` interno, así que si alguien "arreglara" esto poniendo
    // el `[id]` en el `<lib-input-text-z>` habría dos ids para un campo y `getElementById` podría
    // devolver el que no scrollea bien.
    expect(objWrap!.classList.contains('zds-field-wrap')).toBe(true);

    // `scrollToFirstError` hace `focus?.()` después de scrollear. Un `<div>` pelado no es
    // focusable; con `tabindex="-1"` sí lo es programáticamente sin entrar en el orden de Tab.
    // (Ver el comentario de `strId` en campo-base.ts: hoy el DS no delega el foco al input real,
    // así que esto no enfoca el `<input>` — pero deja el contrato listo y evita el no-op.)
    expect(objWrap!.getAttribute('tabindex')).toBe('-1');

    // El id interno de la lib sigue siendo el `name` pelado y NO se pisa: son dos ids distintos con
    // dueños distintos, y el de la lib es el que usa su propio `label for`.
    const cllIds = [...objFixture.nativeElement.querySelectorAll('[id]')].map(
      (in_objEl: Element) => in_objEl.id,
    );
    expect(cllIds).toEqual(['field-qd_strChannel', 'qd_strChannel']);
  });

  it('pasa manualValidation=true, así un campo válido no se pinta en error por culpa de otro', async () => {
    const objForm = objFixture.componentInstance.form;

    // `qd_strChannel` está válido y tocado; `qd_strOtro` está inválido → el group entero es INVALID.
    objForm.controls.qd_strChannel.setValue('Internet');
    objForm.controls.qd_strChannel.markAsTouched();
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(objForm.status).toBe('INVALID');
    expect(hijo(objFixture).manualValidation).toBe(true);

    // `valid` en esta lib SIGNIFICA `invalid`. Con `manualValidation` en false, el `ngOnChanges` de
    // la lib lo habría puesto en `true` por el status del group — pintando en rojo un campo
    // correcto. Este es el gotcha que el wrapper existe para tapar.
    expect(hijo(objFixture).valid).toBe(false);
  });

  it('traduce el estado de error a `valid` invertido: solo cuando el control está inválido Y tocado', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strChannel;

    // Inválido pero SIN tocar → no se pinta. Es lo que evita el form todo en rojo al montar.
    expect(objControl.invalid).toBe(true);
    expect(hijo(objFixture).valid).toBe(false);

    objControl.markAsTouched();
    objFixture.detectChanges();
    await objFixture.whenStable();

    expect(hijo(objFixture).valid).toBe(true);
  });

  it('un `error` explícito manda sobre el estado del control y viaja como helpText', async () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strChannel;
    objControl.setValue('Internet');
    objFixture.componentInstance.error = 'El caso ya existe';
    // `detectChanges()` acá tira NG0100 sobre el `[error]` del host: en un fixture **zoneless**, su
    // pasada de check-no-changes corre sobre un host al que se le acaba de escribir un campo desde
    // afuera sin que Angular sepa que quedó sucio. No es un bug del wrapper. `markForCheck()` +
    // `whenStable()` es la forma correcta de propagar una mutación externa del host, y ejercita el
    // mismo camino que un `signal` en producción. (Mismo patrón que en zds-textarea.spec.ts.)
    objFixture.componentRef.changeDetectorRef.markForCheck();
    await objFixture.whenStable();
    // `drenarTimeouts()` NO es opcional acá, y omitirlo costó una investigación entera. Ver el bloque
    // "el `errorRequired` diferido" de la cabecera de este archivo.
    await drenarTimeouts();

    // Control válido y sin tocar, pero con error de servidor: se pinta igual.
    expect(objControl.valid).toBe(true);
    expect(objControl.errors).toBeNull();
    expect(hijo(objFixture).valid).toBe(true);
    expect(hijo(objFixture).helpText).toBe('El caso ya existe');
  });

  it('los validadores del padre sobreviven a generateControl()', () => {
    const objControl = objFixture.componentInstance.form.controls.qd_strChannel;

    expect(objControl.errors?.['required']).toBe(true);

    objControl.setValue('x'.repeat(51));
    expect(objControl.errors?.['maxlength']).toBeTruthy();
  });

  it('setDisabledState propaga control.disable() al wrapper', async () => {
    objFixture.componentInstance.form.controls.qd_strChannel.disable();
    objFixture.detectChanges();
    await objFixture.whenStable();

    const objWrapper = objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance instanceof ZdsInput,
    ).componentInstance as ZdsInput;

    expect(objWrapper.deshabilitado()).toBe(true);
  });
});

@Component({
  standalone: true,
  imports: [ZdsInput],
  template: `<zds-input name="qd_strEmail" label="Correo" inputType="email" />`,
})
class HostSueltoEmail {}

describe('ZdsInput fuera de un FormGroup', () => {
  function hijoSuelto(in_objFixture: ComponentFixture<HostSueltoEmail>): InputTextZ {
    return in_objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance instanceof InputTextZ,
    ).componentInstance as InputTextZ;
  }

  it('funciona suelto y pone el ícono de email por defecto', async () => {
    const objFixture = TestBed.createComponent(HostSueltoEmail);
    await objFixture.whenStable();
    await drenarTimeouts();

    // Paridad con `strEffectiveIcon` de la fachada React.
    expect(hijoSuelto(objFixture).icon).toBe('mail-closed:line');
  });

  it('un modelChange sin `formControlName` no tira: los callbacks del CVA nacen como no-ops', async () => {
    // Sin form no hay `registerOnChange`/`registerOnTouched`, así que `alCambiarModelo` invoca
    // callbacks que Angular nunca proveyó. Con los no-ops iniciales de `campo-base.ts` eso es
    // inocuo; sin ellos tira `TypeError: this.fnAlCambiar is not a function`.
    //
    // ── Por qué la aserción intercepta el ErrorHandler, y no mira estado ─────────────────────
    // Se llegó acá midiendo, después de que DOS intentos más obvios pasaran verdes con la mutación
    // aplicada (o sea: no probaban nada):
    //  1. `expect(model())` — inútil: `alCambiarModelo` hace `model.set()` ANTES de llamar los
    //     callbacks, así que el valor ya está escrito cuando la excepción ocurre.
    //  2. Registrar los callbacks a mano y aseverar que corrieron — peor: al registrarlos, los
    //     campos dejan de estar `undefined` y el test **neutraliza la mutación** que quería detectar.
    //
    // Lo que se midió: la excepción **no propaga** al `emit()` (un `try/catch` alrededor no la ve)
    // y termina en el `ErrorHandler` de Angular. Ése es el único punto observable, así que el test
    // lo provee y asevera que quedó vacío. Es también la razón por la que un fallo así sería
    // invisible en producción salvo por la consola.
    const cllErrores: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ErrorHandler,
          useValue: { handleError: (in_objError: Error) => cllErrores.push(String(in_objError)) },
        },
      ],
    });

    const objFixture = TestBed.createComponent(HostSueltoEmail);
    await objFixture.whenStable();
    await drenarTimeouts();

    hijoSuelto(objFixture).modelChange.emit('tipeado sin form');
    objFixture.detectChanges();

    expect(cllErrores).toEqual([]);

    // Y el valor igual llegó al `model`, que es lo que el `lib-*-z` lee.
    const objWrapper = objFixture.debugElement.query(
      (in_objNodo) => in_objNodo.componentInstance instanceof ZdsInput,
    ).componentInstance as ZdsInput;
    expect(objWrapper.model()).toBe('tipeado sin form');
  });
});
