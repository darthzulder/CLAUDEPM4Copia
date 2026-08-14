import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ZdsInput } from './zds-input';
import { ZdsSelect } from './zds-select';
import { ZdsTextarea } from './zds-textarea';

/**
 * El camino de precarga de PM4: `patchValue` sobre el `FormGroup` y **nadie más toca nada**.
 *
 * ── Qué se rompe sin el `tick()` de `writeValue`, medido ─────────────────────────────────────
 * **No se pierde el valor.** Eso hay que decirlo de entrada porque la lectura intuitiva es la
 * contraria, y este archivo existió un rato aseverando justamente eso —que `patchValue` se perdía—
 * y **pasaba con el `tick()` mutado**, o sea que no guardaba nada. Traza real sobre `precargar()` de
 * la pantalla del gate 2, con el `tick()` quitado:
 * ```
 * inmediato        → ["qd_strNombre","qd_strCorreo","qd_strCanal"] inválidos · valores CORRECTOS
 * tras microtask   → los mismos 3 inválidos                       · valores CORRECTOS
 * tras 1 macrotask → los mismos 3 inválidos                       · valores CORRECTOS
 * tras 2 macrotasks→ []                                           · valores CORRECTOS
 * ```
 * El valor **siempre** sobrevive. Lo que se rompe es la **validez**: el control queda con
 * `{errorRequired: true}` sosteniendo un valor perfectamente válido, y se arregla solo dos
 * macrotasks después.
 *
 * ── Por qué ─────────────────────────────────────────────────────────────────────────────────
 * `generateControl()` de la lib **compone** su propio validador sobre los del padre, y ese validador
 * lee **`this.model` del hijo**, no el valor del control:
 * ```js
 * validateRequired() { return this.required && !String(this.model || '').trim(); }
 * ```
 * Además `UtilService.updateControlValitor` difiere el `updateValueAndValidity()` en un `setTimeout`.
 * Bajo `provideZonelessChangeDetection()`, un `patchValue` que no venga de un handler no propaga
 * `[model]` al hijo antes de que ese timer venza, así que el validador corre leyendo el `model` viejo
 * (`''`) y marca `errorRequired` sobre un campo que **sí** tiene dato. El `tick()` de
 * [campo-base.ts](./campo-base.ts) propaga el binding en el mismo tick y el validador ve el valor real.
 *
 * ── Por qué importa igual, siendo transitorio ────────────────────────────────────────────────
 * Porque `TaskService` va a llamar `patchValue` desde una respuesta HTTP y **la pantalla lee el estado
 * enseguida**: un `form.valid` consultado en la misma vuelta —para habilitar el botón de enviar, para
 * decidir si mostrar el resumen— ve `false` con los datos correctos puestos. Y el síntoma no señala la
 * causa: `errorRequired` es la clave del DS, no de Angular, lo que invita a diagnosticar la definición
 * del form en vez de la propagación del binding.
 *
 * ── Por qué este archivo existe aparte de los specs por wrapper ──────────────────────────────
 * Porque ninguno podía verlo: todos propagan `[model]` a mano con un `detectChanges()` antes de drenar
 * los timers de la lib (ver [colision-escritores.spec.ts](./colision-escritores.spec.ts)), o sea que
 * verificaban el contrato **con la carrera ya resuelta a favor**. Un `patchValue` real no hace eso.
 *
 * ── Qué NO se asevera acá ───────────────────────────────────────────────────────────────────
 * Nada sobre pintado: bajo jsdom los custom elements de Lit no hacen upgrade.
 */

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsInput, ZdsSelect, ZdsTextarea],
  template: `
    <form [formGroup]="form">
      <zds-input
        formControlName="qd_strNombre"
        name="qd_strNombre"
        label="Nombre"
        [required]="true"
      />
      <zds-select
        formControlName="qd_strCanal"
        name="qd_strCanal"
        label="Canal"
        [options]="[{ value: '13', text: 'Internet' }]"
        [required]="true"
      />
      <zds-textarea
        formControlName="qd_strDetalle"
        name="qd_strDetalle"
        label="Detalle"
        [required]="true"
      />
    </form>
  `,
})
class HostDePrecarga {
  // Los `Validators.required` del padre son los que la pantalla declara de verdad; la lib **compone**
  // su `errorRequired` sobre ellos. Van puestos para que el escenario sea el real y no uno donde el
  // único validador es el de la lib.
  readonly form = new FormGroup({
    qd_strNombre: new FormControl<string | null>('', [Validators.required]),
    qd_strCanal: new FormControl<string | null>('', [Validators.required]),
    qd_strDetalle: new FormControl<string | null>('', [Validators.required]),
  });
}

/** Los dos `setTimeout` con los que la lib difiere `setValue` y `updateValueAndValidity`. */
async function drenarTimeouts() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/** `patchValue` con datos válidos para los tres campos, tal como llegaría de `task.data`. */
function precargar(in_objHost: HostDePrecarga): void {
  in_objHost.form.patchValue({
    qd_strNombre: 'Nelson Bravo',
    qd_strCanal: '13',
    qd_strDetalle: 'Detalle de prueba con largo suficiente.',
  });
}

/** Los controles inválidos, por nombre: un booleano pelado no diría cuál campo falló. */
function cllInvalidos(in_objHost: HostDePrecarga): string[] {
  return Object.entries(in_objHost.form.controls)
    .filter(([, in_objControl]) => in_objControl.invalid)
    .map(([in_strNombre]) => in_strNombre);
}

describe('Precarga de PM4 · patchValue sobre el FormGroup', () => {
  async function montar() {
    const objFixture = TestBed.createComponent(HostDePrecarga);
    await objFixture.whenStable();
    await drenarTimeouts();
    return objFixture;
  }

  it('⚠ tras patchValue los campos quedan VÁLIDOS en el mismo tick', async () => {
    const objFixture = await montar();

    // El punto del test: `patchValue` y NADA más. Sin `detectChanges()`, sin tocar `model` a mano. Es
    // lo que hará `TaskService` con el `task.data` de PM4 — y se lee el estado **enseguida**, que es
    // lo que hace una pantalla al decidir si habilita el submit.
    precargar(objFixture.componentInstance);

    expect(cllInvalidos(objFixture.componentInstance)).toEqual([]);
  });

  it('y el errorRequired del DS no aparece sobre campos con valor', async () => {
    const objFixture = await montar();
    precargar(objFixture.componentInstance);

    // Se asevera la clave por nombre: `errorRequired` la compone `generateControl()` de la lib, no
    // Angular. Si reaparece, el mensaje dice cuál campo y con qué clave.
    const cllConError = Object.entries(objFixture.componentInstance.form.controls)
      .filter(([, in_objControl]) => in_objControl.errors)
      .map(([in_strNombre, in_objControl]) => [in_strNombre, in_objControl.errors]);

    expect(cllConError).toEqual([]);
  });

  it('el valor sobrevive al ciclo completo de escritores de la lib', async () => {
    const objFixture = await montar();
    precargar(objFixture.componentInstance);

    // Este es el caso que **no** se rompe sin el `tick()`, y está aseverado a propósito: fue la
    // hipótesis equivocada (ver la cabecera). Sirve como contraprueba de que `updateControl()` no
    // pisa el control, así que si algún día empieza a pisarlo, se ve acá y no en una pantalla.
    await drenarTimeouts();
    await objFixture.whenStable();

    expect(objFixture.componentInstance.form.getRawValue()).toEqual({
      qd_strNombre: 'Nelson Bravo',
      qd_strCanal: '13',
      qd_strDetalle: 'Detalle de prueba con largo suficiente.',
    });
  });
});
