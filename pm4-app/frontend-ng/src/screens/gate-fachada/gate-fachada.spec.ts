import { FormControl, Validators } from '@angular/forms';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GateFachada, requerirTildado } from './gate-fachada';

/**
 * Smoke de la pantalla del gate 2.
 *
 * **Lo que este spec NO es.** No es la verificación del gate: eso es manual y su checklist vive en
 * `GATE2_VERIFICACION_MANUAL.md`, precisamente porque bajo jsdom los custom elements de Lit no hacen
 * upgrade y nada de lo que importa (que los campos *pinten*) es observable acá.
 *
 * **Lo que sí aporta, y por qué vale el archivo.** La pantalla monta los 8 wrappers de golpe, así que
 * es lo más cerca de una integración que la fachada tiene. Un `TS`/plantilla roto en cualquiera de los
 * 8 —un input que no existe, un `formControlName` sin control, un provider faltante— hace fallar el
 * montaje, y este spec lo convierte en rojo de suite en vez de en una pantalla en blanco descubierta a
 * mano. Ya cazó uno: el `[texto]` que se le pasaba a `zds-status-badge`, que no tiene ese input.
 *
 * Y asevera dos contratos que **sí** son verificables sin pintado: la forma del `FormGroup` (los 9
 * campos `qd_*` con sus validadores) y la del checkbox con `requiredTrue`, que es el que tiene el
 * validador invertido del DS y donde un cambio silencioso costaría más caro.
 */
describe('GateFachada · pantalla del gate 2', () => {
  let objFixture: ComponentFixture<GateFachada>;
  let objPantalla: GateFachada;

  beforeEach(async () => {
    objFixture = TestBed.createComponent(GateFachada);
    objPantalla = objFixture.componentInstance;
    await objFixture.whenStable();
  });

  it('monta los 8 wrappers sin error', () => {
    // El montaje es la aserción: si un wrapper tuviera un input inexistente o le faltara un
    // provider, `createComponent` + `whenStable` tiran acá.
    const objDom = objFixture.nativeElement as HTMLElement;
    for (const strSelector of [
      'zds-input',
      'zds-select',
      'zds-textarea',
      'zds-date',
      'zds-radio',
      'zds-checkbox-field',
      'zds-file-input',
      'zds-status-badge',
    ]) {
      expect(objDom.querySelector(strSelector), strSelector).not.toBeNull();
    }
  });

  it('el FormGroup tiene los 9 campos qd_* del contrato de PM4', () => {
    // Los nombres son contrato con el BPM (regla 1 de pm4-app/CLAUDE.md). Acá no hay un proceso
    // real detrás, pero la pantalla es el molde de las de la Fase 5 y el prefijo es lo que se copia.
    expect(Object.keys(objPantalla.form.controls).sort()).toEqual([
      'qd_strAutoriza',
      'qd_strCanal',
      'qd_strCorreo',
      'qd_strDepartamento',
      'qd_strDetalle',
      'qd_strFecha',
      'qd_strNombre',
      'qd_strSoporte',
      'qd_strTipoPersona',
    ]);
  });

  it('el checkbox arranca en "NO" y eso deja el form inválido', () => {
    // `'NO'` es **truthy** en JS, así que un `Validators.requiredTrue` que compare mal daría válido.
    // Este test fija que la obligatoriedad del checkbox vive en el control y funciona.
    const objControl = objPantalla.form.controls.qd_strAutoriza;
    expect(objControl.value).toBe('NO');
    expect(objControl.hasError('required')).toBe(true);
  });

  it('con el checkbox en "SI" el control queda válido', () => {
    objPantalla.form.controls.qd_strAutoriza.setValue('SI');
    expect(objPantalla.form.controls.qd_strAutoriza.valid).toBe(true);
  });

  it('Validators.requiredTrue NO sirve para este control, y por eso hay uno propio', () => {
    // Este test no cubre código de la pantalla: cubre **la razón por la que el código es así**. La
    // primera versión usaba `requiredTrue` y el formulario no podía enviarse nunca, porque compara
    // con `=== true` y el control guarda `'SI'`. Es un error que se ve razonable al leerlo —
    // "requiredTrue en un checkbox obligatorio"— así que se deja aseverado para que alguien que
    // "simplifique" el validador propio vea el rojo con el motivo escrito al lado.
    const objConRequiredTrue = new FormControl('SI', [Validators.requiredTrue]);
    expect(objConRequiredTrue.valid).toBe(false);

    // Y `required` es el error simétrico: `'NO'` no es vacío, así que lo daría por válido siempre.
    const objConRequired = new FormControl('NO', [Validators.required]);
    expect(objConRequired.valid).toBe(true);

    // El validador propio es el único que respeta el contrato de texto en las dos direcciones.
    expect(new FormControl('SI', [requerirTildado('SI')]).valid).toBe(true);
    expect(new FormControl('NO', [requerirTildado('SI')]).valid).toBe(false);
  });

  it('precargar() llena los 8 campos de datos, como el reset(task.data) de React', () => {
    objPantalla.precargar();
    const objValor = objPantalla.form.getRawValue();

    expect(objValor.qd_strNombre).toBeTruthy();
    expect(objValor.qd_strCanal).toBe('13');
    expect(objValor.qd_strAutoriza).toBe('SI');
    // Con todo precargado el form queda válido: es la prueba de que los validadores de la pantalla
    // son satisfacibles con los datos que ella misma usa de ejemplo. Si el `qd_strDetalle` de
    // ejemplo quedara corto para el `minLength`, el checklist manual arrancaría con un rojo espurio.
    // Se listan los campos inválidos en vez de aseverar el booleano pelado: un `expected false to
    // be true` no dice cuál campo falló, y este test existe justamente para nombrarlo.
    const cllInvalidos = Object.entries(objPantalla.form.controls)
      .filter(([, in_objControl]) => in_objControl.invalid)
      .map(([in_strNombre]) => in_strNombre);
    expect(cllInvalidos).toEqual([]);
  });

  it('limpiar() vacía todo pero deja el checkbox en "NO", no en null', () => {
    objPantalla.precargar();
    objPantalla.limpiar();

    expect(objPantalla.form.controls.qd_strNombre.value).toBe(null);
    // El `reset({ qd_strAutoriza: 'NO' })` es deliberado: un `null` haría que el wrapper reciba
    // un valor que no es ninguno de sus dos `checkedValue`/`uncheckedValue`, y el estado inicial
    // del checkbox dependería de la coerción a booleano en vez del contrato de texto.
    expect(objPantalla.form.controls.qd_strAutoriza.value).toBe('NO');
  });

  it('enviar() volca el valor crudo del form como JSON', () => {
    objPantalla.precargar();
    objPantalla.enviar();
    // Es el `<pre>` que el checklist manual compara contra lo pintado. Se asevera que es JSON
    // parseable y que trae el valor, no la etiqueta visible del select.
    expect(JSON.parse(objPantalla.strResultado()).qd_strCanal).toBe('13');
  });

  it('simularErrorServidor() alterna, para poder apagarlo en la pasada manual', () => {
    objPantalla.simularErrorServidor();
    expect(objPantalla.strErrorServidor()).toBeTruthy();
    objPantalla.simularErrorServidor();
    expect(objPantalla.strErrorServidor()).toBe('');
  });
});
