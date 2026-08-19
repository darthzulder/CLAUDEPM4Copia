import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ZdsInput } from './zds-input';
import { ZdsSelect } from './zds-select';
import { ZdsTextarea } from './zds-textarea';
import { ZdsDate } from './zds-date';
import { ZdsCheckboxField } from './zds-checkbox-field';
import { CampoBase } from './campo-base';

/**
 * El spec que faltaba, y su ausencia dejó un bug verde mucho tiempo.
 *
 * ── Qué se dejó pasar, y por qué los specs por wrapper no lo veían ──────────────────────────
 * `CampoBase` resolvía el `FormGroup` del padre **una sola vez**, en su `ngOnInit`, leyendo
 * `ngControl.control.parent`. Ahí ese `parent` todavía es `null`: `formControlName` engancha el
 * control al group en el `ngOnChanges` de su propia directiva, que corre **después** del `ngOnInit`
 * del componente que provee el `NG_VALUE_ACCESSOR`. Resultado: la rama "dentro de un form" nunca
 * corría y los cinco wrappers le pasaban al `lib-*-z` un group **privado** de un solo control.
 *
 * Cada spec de wrapper tenía un test llamado "el control del FormGroup conserva su name real" que
 * comparaba `Object.keys(host.form.controls)` — y **pasaba**, porque el hijo nunca tocaba ese group.
 * O sea que pasaba por la razón **opuesta** a la que decía cubrir: no verificaba que la lib adoptara
 * el control, verificaba que la lib no llegaba al form. Un test que pasa por el motivo equivocado es
 * peor que no tenerlo, porque cierra la pregunta.
 *
 * Por eso este archivo asevera la **identidad del group** (`===`), no las claves. Es la única forma
 * de distinguir "adoptó el group real" de "se armó uno propio con el mismo nombre de control".
 */

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsInput, ZdsSelect, ZdsTextarea, ZdsDate, ZdsCheckboxField],
  template: `
    <form [formGroup]="form">
      <zds-input formControlName="qd_strNombre" name="qd_strNombre" label="Nombre" />
      <zds-select
        formControlName="qd_strChannel"
        name="qd_strChannel"
        label="Canal"
        [options]="[{ value: '13', text: 'Internet' }]"
      />
      <zds-textarea formControlName="qd_strDetalle" name="qd_strDetalle" label="Detalle" />
      <zds-date formControlName="qd_strFecha" name="qd_strFecha" label="Fecha" />
      <zds-checkbox-field formControlName="qd_blnAcepta" name="qd_blnAcepta" label="Acepto" />
    </form>
  `,
})
class HostDeFormulario {
  readonly form = new FormGroup({
    qd_strNombre: new FormControl<string | null>('Ana', [Validators.required]),
    qd_strChannel: new FormControl<string | null>('13'),
    qd_strDetalle: new FormControl<string | null>('un párrafo', [Validators.maxLength(500)]),
    qd_strFecha: new FormControl<string | null>('2026-08-14'),
    qd_blnAcepta: new FormControl<string | boolean>(false),
  });
}

/**
 * Los wrappers se manipulan como `object` y no como `CampoBase<unknown>` a propósito:
 * `CampoBase<T>` es **invariante** en `T` (tiene un campo `(in_valor: T | null) => void`), así que
 * `ZdsCheckboxField extends CampoBase<string | boolean>` NO es asignable a `CampoBase<unknown>` y un
 * type predicate contra él no compila (TS2677). El `instanceof` en runtime es lo que importa acá.
 */
type Wrapper = object;

/** Lee el `grupo` protegido del wrapper. Es lo que el wrapper le pasa al `lib-*-z` por `[group]`. */
function grupoDe(in_objWrapper: Wrapper): FormGroup {
  return (in_objWrapper as { grupo: FormGroup }).grupo;
}

/**
 * Se deduplica con un `Set` porque `queryAll` devuelve **dos** nodos por wrapper: el elemento del
 * componente y el nodo del `formControlName` que lo tiene como `NG_VALUE_ACCESSOR`. Los dos resuelven
 * al mismo `componentInstance`, así que sin el `Set` los conteos salen al doble (medido: 8 en vez de
 * 4) y un `toHaveLength` se vuelve imposible de leer.
 */
function wrappers(in_objFixture: ComponentFixture<unknown>): Wrapper[] {
  return [
    ...new Set(
      in_objFixture.debugElement
        .queryAll((in_objNodo) => in_objNodo.componentInstance instanceof CampoBase)
        .map((in_objNodo) => in_objNodo.componentInstance as Wrapper),
    ),
  ];
}

async function montar() {
  const objFixture = TestBed.createComponent(HostDeFormulario);
  await objFixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return objFixture;
}

describe('adopción del FormGroup del padre', () => {
  it('los cuatro campos que comparten group reciben el FormGroup REAL de la pantalla, no una copia', async () => {
    const objFixture = await montar();
    const objForm = objFixture.componentInstance.form;

    // `===` y no una comparación de claves: es la aserción que distingue la adopción real de un group
    // privado que casualmente tiene un control con el mismo nombre. Ver la cabecera.
    const cllCompartidos = wrappers(objFixture).filter(
      (in_objW) => !(in_objW instanceof ZdsCheckboxField),
    );

    // Conteo explícito: si mañana se agrega un wrapper al host y no al filtro, este número avisa en
    // vez de dejar el nuevo campo sin aseverar.
    expect(cllCompartidos).toHaveLength(4);
    for (const objWrapper of cllCompartidos) {
      expect(grupoDe(objWrapper)).toBe(objForm);
    }
  });

  it('el checkbox es la excepción deliberada: group satélite, nunca el de la pantalla', async () => {
    const objFixture = await montar();
    const objForm = objFixture.componentInstance.form;
    const objCheckbox = wrappers(objFixture).find(
      (in_objW) => in_objW instanceof ZdsCheckboxField,
    );

    // El porqué completo está en el bloque "group satélite" de zds-checkbox-field.ts: la lib escribe
    // booleanos sobre el control (pisaría el contrato `'SI'`/`'NO'`) y su `validRequired()` está
    // invertido. Acá solo se fija que la excepción sigue siendo una excepción.
    expect(objCheckbox).toBeDefined();
    expect(grupoDe(objCheckbox!)).not.toBe(objForm);
    expect(Object.keys(grupoDe(objCheckbox!).controls)).toEqual(['qd_blnAcepta']);
  });

  it('el FormGroup de la pantalla no gana controles generados (`name-<ts>-<n>`) ni pierde los suyos', async () => {
    const objFixture = await montar();
    const objForm = objFixture.componentInstance.form;

    // La otra mitad del contrato del gate 0: `generateControl()` solo inventa un nombre aleatorio si
    // el control NO existe ya. Con la adopción funcionando de verdad, esta aserción por fin significa
    // lo que dice — antes pasaba porque la lib ni miraba este group.
    expect(Object.keys(objForm.controls)).toEqual([
      'qd_strNombre',
      'qd_strChannel',
      'qd_strDetalle',
      'qd_strFecha',
      'qd_blnAcepta',
    ]);
    expect(Object.keys(objForm.controls).some((in_strClave) => in_strClave.startsWith('name-'))).toBe(
      false,
    );
  });

  it('los validadores que puso la pantalla sobreviven a la composición de la lib', async () => {
    const objFixture = await montar();
    const objForm = objFixture.componentInstance.form;

    // `generateControl()` hace `setValidators(compose([validadorPrevio, generateValidation()]))`, así
    // que **compone** en vez de reemplazar. Esto es lo que permite que `required`/`maxLength` sigan
    // viviendo en la definición del form y no en el componente del DS — la pieza sobre la que se
    // apoya toda la fachada. Aseverado sobre el efecto (el control se pone inválido), no sobre la
    // existencia de la función, que no probaría que sigue corriendo.
    objForm.controls.qd_strNombre.setValue('');
    expect(objForm.controls.qd_strNombre.errors?.['required']).toBe(true);

    objForm.controls.qd_strDetalle.setValue('x'.repeat(501));
    expect(objForm.controls.qd_strDetalle.errors?.['maxlength']).toBeTruthy();
  });

  it('la lib no pisa los valores del form: ni al montar ni tras un patchValue de la pantalla', async () => {
    const objFixture = await montar();
    const objForm = objFixture.componentInstance.form;

    // La lib es un **segundo escritor** del control (`updateControl()` hace `setValue(this.model)`).
    // En estos cuatro es redundante y no destructiva, porque el wrapper le pasa por `[model]` el mismo
    // valor que el control ya tiene. El checkbox es el único que transforma el valor, y por eso es el
    // único con group satélite. Este test es el que avisaría si un wrapper nuevo empezara a
    // transformar valores sin darse cuenta del problema.
    expect(objForm.getRawValue()).toEqual({
      qd_strNombre: 'Ana',
      qd_strChannel: '13',
      qd_strDetalle: 'un párrafo',
      qd_strFecha: '2026-08-14',
      qd_blnAcepta: false,
    });

    objForm.patchValue({ qd_strNombre: 'Beatriz', qd_strDetalle: 'otro párrafo' });
    objFixture.detectChanges();
    await objFixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(objForm.controls.qd_strNombre.value).toBe('Beatriz');
    expect(objForm.controls.qd_strDetalle.value).toBe('otro párrafo');
  });
});
