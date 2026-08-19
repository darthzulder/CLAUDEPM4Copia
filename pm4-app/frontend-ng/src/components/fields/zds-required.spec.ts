import { Component, type Type } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FileRegistryService } from '../../core/file-registry.service';
import { ZdsCheckboxField } from './zds-checkbox-field';
import { ZdsDate } from './zds-date';
import { ZdsFileInput } from './zds-file-input';
import { ZdsInput } from './zds-input';
import { ZdsRadio } from './zds-radio';
import { ZdsSelect } from './zds-select';
import { ZdsTextarea } from './zds-textarea';

/**
 * Guarda estructural del renombre `required` → `obligatorio` en la fachada. **No prueba un
 * comportamiento nuevo: prueba que la colisión que se cerró no pueda volver.**
 *
 * ── El defecto que este archivo existe para prevenir ────────────────────────────────────────
 * `RequiredValidator` es un directivo **estándar de Angular** con selector
 * `:not([type=checkbox])[required][formControlName]` (más las variantes `[formControl]`/`[ngModel]`).
 * Mientras los wrappers aceptaron un input público llamado `required`, marcar un campo obligaba a la
 * pantalla a escribir el atributo literal `required` **junto a** `formControlName`, o sea exactamente
 * ese selector: Angular enganchaba su validador en el elemento del host y le sumaba `{required: true}`
 * a un control que la pantalla nunca declaró obligatorio.
 *
 * Costó un diagnóstico entero porque el defecto es **invisible** en el caso común: si el control
 * declara `Validators.required` además de marcarse el wrapper, el validador filtrado es redundante y
 * no cambia nada observable. Sólo se ve cuando una pantalla necesita el asterisco **sin** el
 * validador — SCR-011, cuya acción de escalar tiene que ser alcanzable con los campos de S2 vacíos.
 *
 * ── Por qué la aserción va sobre `errors` de un control pelado ───────────────────────────────
 * Podría aseverarse que la clase no tiene una propiedad `required`, pero eso es una aserción sobre la
 * forma del código y no sobre el efecto: un `@Input({alias: 'required'})` la pasaría. Lo que no puede
 * pasar es un control **sin validadores** que termina con `{required: true}`, porque para eso el
 * directivo de Angular tiene que haber matcheado. Se afirma el efecto, así que la guarda vale para
 * cualquier forma futura de reintroducir el nombre.
 *
 * ── ⚠ Y encontró una SEGUNDA mitad del defecto que el renombre no cerraba ────────────────────
 * Al escribir esta guarda se creía que el `[required]` **interno** —el que cada wrapper le pasa al
 * `lib-*-z`/`za-*`— era inocuo en los 7, "porque en ese elemento no hay `formControlName`". **Es
 * cierto solo para los cinco `lib-*-z`.** Los dos wrappers sobre [`CampoZaBase`](./campo-za-base.ts)
 * (`zds-radio` y `zds-file-input`) escriben `[formControl]="control"` en ese mismo elemento, y el
 * selector del `RequiredValidator` incluye **`[required][formControl]`** además de la variante con
 * `formControlName`. Como esa base **presta** el control de la pantalla en vez de copiarlo, el
 * validador filtrado caía directo sobre él: `zds-radio` salió rojo acá con `{required: true}` sobre un
 * control pelado, y `zds-file-input` tenía la misma fuga oculta detrás de un `NG0201`.
 *
 * Se cerró escribiendo `required` sobre la instancia del hijo (`viewChild` + `effect`) en vez de
 * bindearlo en la plantilla — misma técnica que `alCambiarValid()` en `zds-textarea.ts`. Ver el
 * docstring de `ZdsRadio.objHijo` para por qué `[attr.required]` y clonar el control no servían.
 *
 * Los cinco `lib-*-z` **sí** conservan su `[required]` interno, que es el input del asterisco del DS y
 * en ese elemento no hay control alguno. Este spec cubre los 7 con sus plantillas reales, así que es
 * la guarda de las dos cosas: del nombre público y de que ningún wrapper vuelva a poner el atributo
 * sobre el elemento que lleva el control.
 */

/** Un host por wrapper, todos con el control **pelado** — sin un solo validador declarado. */
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsInput],
  template: `<form [formGroup]="form">
    <zds-input formControlName="qd_campo" name="qd_campo" label="X" [obligatorio]="true" />
  </form>`,
})
class HostInput {
  readonly form = new FormGroup({ qd_campo: new FormControl('') });
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsSelect],
  template: `<form [formGroup]="form">
    <zds-select
      formControlName="qd_campo"
      name="qd_campo"
      label="X"
      [options]="[]"
      [obligatorio]="true"
    />
  </form>`,
})
class HostSelect {
  readonly form = new FormGroup({ qd_campo: new FormControl('') });
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsTextarea],
  template: `<form [formGroup]="form">
    <zds-textarea formControlName="qd_campo" name="qd_campo" label="X" [obligatorio]="true" />
  </form>`,
})
class HostTextarea {
  readonly form = new FormGroup({ qd_campo: new FormControl('') });
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsDate],
  template: `<form [formGroup]="form">
    <zds-date formControlName="qd_campo" name="qd_campo" label="X" [obligatorio]="true" />
  </form>`,
})
class HostDate {
  readonly form = new FormGroup({ qd_campo: new FormControl('') });
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsRadio],
  template: `<form [formGroup]="form">
    <zds-radio
      formControlName="qd_campo"
      name="qd_campo"
      label="X"
      [options]="[]"
      [obligatorio]="true"
    />
  </form>`,
})
class HostRadio {
  readonly form = new FormGroup({ qd_campo: new FormControl('') });
}

/**
 * `FileRegistryService` va como provider del host porque es **por pantalla, no singleton** (decisión
 * de la Fase 3b del plan): sin esto el montaje muere con `NG0201`, que es lo que tapó este caso en la
 * primera corrida de la guarda y escondió su fuga detrás de un error de DI.
 */
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsFileInput],
  providers: [FileRegistryService],
  template: `<form [formGroup]="form">
    <zds-file-input formControlName="qd_campo" name="qd_campo" label="X" [obligatorio]="true" />
  </form>`,
})
class HostFileInput {
  readonly form = new FormGroup({ qd_campo: new FormControl('') });
}

/**
 * El checkbox va aparte y con `''` inicial a propósito: es el único wrapper con **group satélite**
 * (`grupoPropio()`), donde `obligatorio` sí compone un `Validators.required` — pero sobre el control
 * del satélite, no sobre el de la pantalla. Este host asevera justamente esa frontera.
 */
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsCheckboxField],
  template: `<form [formGroup]="form">
    <zds-checkbox-field
      formControlName="qd_campo"
      name="qd_campo"
      label="X"
      checkedValue="SI"
      uncheckedValue="NO"
      [obligatorio]="true"
    />
  </form>`,
})
class HostCheckbox {
  readonly form = new FormGroup({ qd_campo: new FormControl('NO') });
}

const DIC_HOSTS: Record<string, Type<{ form: FormGroup<{ qd_campo: FormControl }> }>> = {
  'zds-input': HostInput,
  'zds-select': HostSelect,
  'zds-textarea': HostTextarea,
  'zds-date': HostDate,
  'zds-radio': HostRadio,
  'zds-file-input': HostFileInput,
  'zds-checkbox-field': HostCheckbox,
};

describe('fachada · `obligatorio` es visual y NO filtra validadores', () => {
  beforeEach(() => {
    // `zds-file-input` y `zds-date` difieren sobre esto: sin el stub, el que dispare un
    // `scrollIntoView` tira un TypeError que jsdom no implementa y que además sale como error no
    // manejado (la implementación difiere dentro de un `setTimeout`).
    //
    // El cuerpo vacío **es** el stub: lo único que hace falta es que el método exista y no tire.
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- stub de jsdom, ver arriba
    Element.prototype.scrollIntoView = () => {};
  });

  for (const [strWrapper, objHostClass] of Object.entries(DIC_HOSTS)) {
    it(`${strWrapper}: un control sin validadores sigue sin validadores después de montar`, async () => {
      const objFixture = TestBed.createComponent(objHostClass);
      objFixture.detectChanges();
      await objFixture.whenStable();

      const objControl = objFixture.componentInstance.form.controls.qd_campo;

      // La clave se nombra en el mensaje a propósito: si mañana se filtra otra vez, el fallo dice
      // `{"required": true}` en vez de "expected false to be true", que es lo que costó tiempo.
      expect(objControl.errors, `${strWrapper} filtró un validador al control de la pantalla`).toBeNull();
      expect(objControl.valid).toBe(true);
    });
  }

  it('los 7 wrappers están cubiertos (la guarda no se degrada al agregar uno nuevo)', () => {
    // Sin esta aserción, borrar una entrada de `DIC_HOSTS` dejaría el `for` de arriba verde con menos
    // wrappers vigilados — la misma vacuidad que ya mordió dos veces en la Fase 4.
    expect(Object.keys(DIC_HOSTS)).toHaveLength(7);
  });
});
