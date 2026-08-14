import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
// El nombre de la clase NO sigue el patrón `Lib*Component` que sugiere el selector: es `InputTextZ`
// pelado. Verificado en `fesm2022/zurich-col-lib-zurich.mjs` en vez de deducirlo del selector —
// deducirlo costó un `TS2305` acá mismo, y es la misma lección del gate 0 con `za-icon`/`icon`.
import { InputTextZ } from '@zurich-col/lib-zurich';
import { describe, expect, it } from 'vitest';

/**
 * PROBE de arquitectura de la Fase 2 — la evidencia que decide cómo se escribe el wrapper CVA, y
 * después la guarda de regresión de esa decisión. Se conserva en el árbol a propósito: si una
 * versión futura de `lib-zurich` cambia quién escribe el `FormControl`, se pone rojo acá una vez
 * en vez de en los 8 specs de wrapper a la vez.
 *
 * ── La pregunta ────────────────────────────────────────────────────────────────────────────
 * `lib-input-text-z` toca el `FormControl` por caminos diferidos (verificado en el `.mjs`):
 *
 *   ngOnChanges     → if (changes.model) setTimeout(() => this.updateControl())
 *   updateControl() → this.group.get(this.name).setValue(this.model)
 *   generateControl() → UtilService.updateControlValitor(...) → setTimeout(updateValueAndValidity)
 *
 * y su template interno es `<za-text-input [(ngModel)]="model">`, donde `za-text-input` trae su
 * PROPIO ControlValueAccessor (cadena `ZaTextInput → ZaBaseInput → ZaModelElement`). O sea que un
 * wrapper CVA encima sumaría un tercer escritor al mismo control.
 *
 * ── La respuesta, MEDIDA (no leída) ────────────────────────────────────────────────────────
 * El `setValue()` diferido **sí corre y sí pisa** el control — pero solo cuando el *input* `model`
 * cambia, porque está detrás de `if (changes.model)`. Eso hace que la autoridad sea `model`, no el
 * control: **quien gana es el último que escribió `model`.**
 *
 * Cómo se estableció, porque el primer intento de probarlo fue un test vacío: la versión original
 * de este archivo asertaba `control.value === 'Internet'` escribiendo el control Y propagando a
 * `[model]`. Al mutar quitando la propagación **siguió verde** — no probaba nada, porque sin cambio
 * de `model` no hay `ngOnChanges` y por lo tanto no hay segundo escritor. Recién la mutación
 * inversa (poner `[model]` en un valor DISTINTO del que escribió el padre) puso el test rojo con
 * `expected 'PISADO' to be 'Internet'`, y eso es lo que fija el contrato de abajo.
 *
 * ── Consecuencia directa para el wrapper ───────────────────────────────────────────────────
 * El `writeValue()` del wrapper escribe `model` y con eso el **valor** queda bien: el `setValue`
 * diferido de la lib **converge**, así que el control se sincroniza por un solo camino.
 *
 * **Pero eso no alcanza, y este archivo no podía verlo.** `writeValue` además fuerza un
 * `ApplicationRef.tick()`, porque el validador que la lib compone lee `this.model` **del hijo**: si el
 * binding no llegó cuando vence su timer, marca `errorRequired` sobre un campo que sí tiene dato. Acá
 * eso nunca aparece porque **los cuatro tests propagan `model` a mano con un `detectChanges()`** antes
 * de drenar los timers — o sea que verifican el contrato de la lib con la carrera ya resuelta a favor.
 * Un `patchValue` real no hace eso. El caso real lo cubre
 * [precarga-patchvalue.spec.ts](./precarga-patchvalue.spec.ts); vale leerlo antes de "simplificar" el
 * `tick()`, y vale saber que la blindez de este archivo es **estructural**, no un descuido.
 *
 * ── Lo que este archivo NO prueba, dicho explícitamente ────────────────────────────────────
 * Una versión anterior de este comentario afirmaba que un `setValue()` extra en `writeValue` haría
 * que "el orden de los timers decidiera el valor final". **Eso es falso y quedó desmentido por la
 * mutación del gate 2:** se agregó ese `setValue` y la suite quedó verde; se buscó el escenario que
 * la pusiera roja de tres formas (mismo valor, valores divergentes en el mismo tick, y escritura del
 * usuario intercalada entre el `writeValue` y el vencimiento del timer) y ninguna distinguió el
 * código correcto del mutado.
 *
 * El motivo está en el `.mjs`: el `setTimeout` **no captura el valor al agendarse** — el
 * `updateControl()` lee `this.model` al vencer, así que nunca escribe un valor obsoleto. El
 * `setValue` extra es redundante, no destructivo.
 *
 * O sea que **ningún test guarda "no agregues un setValue"**, y no se escribió uno de adorno para
 * fingir que sí. Lo que este archivo guarda es el contrato de la lib del que depende el diseño: que
 * escribir `model` propaga al control, y que `model` gana ante un conflicto.
 */

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, InputTextZ],
  template: `
    <form [formGroup]="form">
      <lib-input-text-z
        [group]="form"
        [name]="'qd_strChannel'"
        [label]="'Canal'"
        [model]="model()"
        (modelChange)="model.set($event ?? '')"
        [manualValidation]="true"
      />
    </form>
  `,
})
class HostConControlPrecreado {
  // El control se pre-crea con el `name` REAL y sus validadores: es la maniobra que hace que
  // `generateControl()` lo adopte en vez de inventar un `name-<ts>-<n>` (gate 0).
  readonly form = new FormGroup({
    qd_strChannel: new FormControl('', [Validators.required, Validators.maxLength(50)]),
  });

  readonly model = signal('');
}

/** Deja correr los `setTimeout` que la lib usa para diferir `setValue` y `updateValueAndValidity`. */
async function drenarTimeouts() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function montar() {
  const objFixture = TestBed.createComponent(HostConControlPrecreado);
  await objFixture.whenStable();
  await drenarTimeouts();
  return objFixture;
}

describe('Quién escribe el FormControl de un lib-input-text-z', () => {
  it('adopta el control pre-creado: conserva el name real y NO agrega uno generado', async () => {
    const objFixture = await montar();

    // El conteo importa tanto como el nombre. En el gate 0, al renombrar el control pre-creado el
    // group pasó a tener TRES controles (el propio + el `name-<ts>-<n>` que la lib generó), así que
    // aseverar solo `get('qd_strChannel')` no distingue "adoptó" de "adoptó y además creó otro".
    expect(Object.keys(objFixture.componentInstance.form.controls)).toEqual(['qd_strChannel']);
  });

  it('escribir `model` propaga al control: es el ÚNICO camino que el wrapper debe usar', async () => {
    const objFixture = await montar();
    const objControl = objFixture.componentInstance.form.controls.qd_strChannel;

    // Sin tocar el control: solo `model`, que es lo que hará `writeValue()`.
    objFixture.componentInstance.model.set('Internet');
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(objControl.value).toBe('Internet');
  });

  it('si `model` y el control discrepan, gana `model` (por eso writeValue NO debe hacer setValue)', async () => {
    const objFixture = await montar();
    const objControl = objFixture.componentInstance.form.controls.qd_strChannel;

    // Se los pone en conflicto deliberado: el control en un valor y `model` en otro. Esta es la
    // aserción que documenta el riesgo real — y la que se pone roja si una versión futura de la
    // lib deja de pisar el control, porque entonces el wrapper tendría que cambiar de estrategia.
    objControl.setValue('ESCRITO_EN_EL_CONTROL');
    objFixture.componentInstance.model.set('ESCRITO_EN_MODEL');
    objFixture.detectChanges();
    await objFixture.whenStable();
    await drenarTimeouts();

    expect(objControl.value).toBe('ESCRITO_EN_MODEL');
  });

  it('la lib COMPONE los validadores del padre en vez de reemplazarlos', async () => {
    const objFixture = await montar();
    const objControl = objFixture.componentInstance.form.controls.qd_strChannel;

    // `required` del padre sigue vivo tras `generateControl()`.
    expect(objControl.errors?.['required']).toBe(true);

    // Y `maxLength(50)` también: `setValidators(compose([previo, generateValidation]))`.
    objControl.setValue('x'.repeat(51));
    expect(objControl.errors?.['maxlength']).toBeTruthy();
  });
});
