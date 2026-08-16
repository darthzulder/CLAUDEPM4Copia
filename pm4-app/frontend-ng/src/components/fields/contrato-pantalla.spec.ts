import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { aseverarContratoDeCampos, cllCamposDeLaFachada, objHijoDelDs } from './contrato-pantalla';
import { ZdsInput } from './zds-input';

/**
 * Spec de la guarda cross-pantalla de `contrato-pantalla.ts`.
 *
 * ── Por qué este archivo existe, y por qué es el más importante de los dos ────────────────────
 * `aseverarContratoDeCampos()` la van a invocar los 13 specs de pantalla en una línea. Si no dispara,
 * las 13 quedan cubiertas por algo que nunca se pone rojo — que es **peor que no tener guarda**, porque
 * la falsa seguridad escala con la cantidad de pantallas. Es el escalón siguiente de la vacuidad que
 * costó los gates 2 y 4, y a esa escala.
 *
 * Así que cada regla que la función asevera tiene acá **un host que la rompe** y un caso que espera el
 * rojo. No alcanza con montar una pantalla bien cableada y ver verde: eso es exactamente lo que hacían
 * los 10 casos de la SCR-008 mientras sus 9 campos estaban muertos.
 *
 * ── Por qué se asevera con `expect(() => …).toThrow()` ───────────────────────────────────────
 * La función asevera con `expect()` de Vitest, y un `expect` fallido **tira**. Así que el rojo esperado
 * se captura envolviendo la llamada, y se asevera además el **mensaje**: una guarda que tira por la
 * causa equivocada (un `undefined` en el helper, por ejemplo) pasaría un `toThrow()` pelado y se vería
 * idéntica a una que funciona.
 */
describe('contrato de campos (guarda cross-pantalla)', () => {
  /** Pantalla bien cableada: es el control negativo de todo lo demás. */
  @Component({
    standalone: true,
    imports: [ZdsInput, ReactiveFormsModule],
    template: `
      <form [formGroup]="form">
        <zds-input formControlName="qd_strSfcCode" name="qd_strSfcCode" label="ID Caso" />
        <zds-input formControlName="qd_strChannel" name="qd_strChannel" label="Canal" />
      </form>
    `,
  })
  class HostSano {
    readonly form = new FormGroup({
      qd_strSfcCode: new FormControl(''),
      qd_strChannel: new FormControl(''),
    });
  }

  /** Rompe la regla 1: dentro del form, pero sin `formControlName`. El defecto 1 de la SCR-008. */
  @Component({
    standalone: true,
    imports: [ZdsInput, ReactiveFormsModule],
    template: `
      <form [formGroup]="form">
        <zds-input formControlName="qd_strSfcCode" name="qd_strSfcCode" label="ID Caso" />
        <zds-input name="qd_strChannel" label="Canal" />
      </form>
    `,
  })
  class HostSinFormControlName {
    readonly form = new FormGroup({
      qd_strSfcCode: new FormControl(''),
      qd_strChannel: new FormControl(''),
    });
  }

  /**
   * Rompe la regla 2: `formControlName` y `name` divergen. Es el copy-paste típico —se cambia uno de
   * los dos y no el otro—, y el síntoma es mudo: Angular engancha el control igual, pero el `lib-*-z`
   * no lo adopta y se genera un `name-<ts>-<n>` al lado.
   */
  @Component({
    standalone: true,
    imports: [ZdsInput, ReactiveFormsModule],
    template: `
      <form [formGroup]="form">
        <zds-input formControlName="qd_strSfcCode" name="qd_strOtroNombre" label="ID Caso" />
      </form>
    `,
  })
  class HostNombresDivergentes {
    readonly form = new FormGroup({ qd_strSfcCode: new FormControl('') });
  }

  /** Rompe la regla 3: dos campos con el mismo `name` → dos `id="field-qd_strSfcCode"`. */
  @Component({
    standalone: true,
    imports: [ZdsInput, ReactiveFormsModule],
    template: `
      <form [formGroup]="form">
        <zds-input formControlName="qd_strSfcCode" name="qd_strSfcCode" label="Sección A" />
        <zds-input formControlName="qd_strSfcCode" name="qd_strSfcCode" label="Sección B" />
      </form>
    `,
  })
  class HostIdsRepetidos {
    readonly form = new FormGroup({ qd_strSfcCode: new FormControl('') });
  }

  /** Sin ningún campo de la fachada: dispara la guarda de vacuidad. */
  @Component({
    standalone: true,
    template: `<p>solo texto</p>`,
  })
  class HostSinCampos {}

  /**
   * Uso **suelto**, sin form ancestro. La regla 1 no aplica (cae a `grupoPropio()`, que es legítimo y
   * está aseverado en varios specs de la fachada), así que la guarda tiene que perdonarlo.
   */
  @Component({
    standalone: true,
    imports: [ZdsInput],
    template: `<zds-input name="qd_strSuelto" label="Suelto" />`,
  })
  class HostSuelto {}

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  async function montar<T>(in_objTipo: new () => T): Promise<ComponentFixture<T>> {
    const objFixture = TestBed.createComponent(in_objTipo);
    await objFixture.whenStable();
    objFixture.detectChanges();

    return objFixture;
  }

  it('una pantalla bien cableada pasa el contrato', async () => {
    const objFixture = await montar(HostSano);

    expect(() => aseverarContratoDeCampos(objFixture)).not.toThrow();
  });

  it('⚠ un campo dentro del form SIN formControlName rompe el contrato, nombrando el campo', async () => {
    const objFixture = await montar(HostSinFormControlName);

    // El mensaje tiene que nombrar el campo: con 9 campos en pantalla, un "falta un formControlName"
    // genérico obliga a buscar a mano cuál, que es justo el trabajo que la guarda ahorra.
    expect(() => aseverarContratoDeCampos(objFixture)).toThrow(/qd_strChannel/);
    expect(() => aseverarContratoDeCampos(objFixture)).toThrow(/formControlName/);
  });

  it('⚠ un formControlName que no coincide con el name rompe el contrato', async () => {
    const objFixture = await montar(HostNombresDivergentes);

    expect(() => aseverarContratoDeCampos(objFixture)).toThrow(/deben coincidir/);
  });

  it('⚠ dos campos con el mismo name (ids repetidos) rompen el contrato', async () => {
    const objFixture = await montar(HostIdsRepetidos);

    // Sin ids únicos, `scrollToFirstError` hace `querySelector('#field-<path>')` y siempre encuentra
    // el primero: el scroll al error apunta al campo equivocado.
    expect(() => aseverarContratoDeCampos(objFixture)).toThrow(/ids de campo repetidos/);
  });

  it('⚠ una pantalla sin ningún campo montado rompe el contrato (anti-vacuidad)', async () => {
    const objFixture = await montar(HostSinCampos);

    // Es la guarda que evita que las tres reglas de arriba sean tautologías sobre una lista vacía:
    // un `for` que no itera deja pasar cualquier cosa, y el archivo se ve sano. Ya pasó dos veces.
    expect(() => aseverarContratoDeCampos(objFixture)).toThrow(/no montó ningún campo/);
  });

  it('el uso suelto (sin form ancestro) pasa el contrato', async () => {
    const objFixture = await montar(HostSuelto);

    // La regla 1 se condiciona a "hay un ControlContainer ancestro". Sin este caso, una guarda que
    // exigiera `formControlName` siempre pasaría los casos rojos de arriba y se vería idéntica a una
    // que funciona — mientras rompe media suite de la fachada, que monta wrappers sueltos a propósito.
    expect(() => aseverarContratoDeCampos(objFixture)).not.toThrow();
  });

  it('⚠ cllCamposDeLaFachada deduplica: 2 campos montados, no 4 nodos', async () => {
    const objFixture = await montar(HostSano);

    // `DebugElement.componentInstance` devuelve el componente **dueño** del nodo, así que el
    // `.zds-field-wrap` de adentro de cada wrapper también reporta el wrapper: el `queryAll` crudo da
    // el doble. Medido en la SCR-008: 18 nodos para 9 campos. Sin el `Set`, la guarda de conteo de
    // arriba y cualquier aserción de cantidad fallarían por una causa del test.
    const cllCrudo = objFixture.debugElement.queryAll(
      (in_objNodo) => in_objNodo.componentInstance instanceof ZdsInput,
    );

    expect(cllCrudo.length).toBeGreaterThan(2);
    expect(cllCamposDeLaFachada(objFixture)).toHaveLength(2);
  });

  it('objHijoDelDs devuelve el componente del DS, no el wrapper', async () => {
    const objFixture = await montar(HostSano);
    const [objCampo] = cllCamposDeLaFachada(objFixture);

    const objHijo = objHijoDelDs(objFixture, objCampo);

    // Lo que importa del hijo es que **no** es el wrapper (el `!== in_objCampo` del helper) y que
    // expone el contrato `model`/`modelChange` que los guardas-puente de pantalla consumen.
    expect(objHijo).not.toBe(objCampo);
    expect(objHijo).toHaveProperty('modelChange');
  });
});
