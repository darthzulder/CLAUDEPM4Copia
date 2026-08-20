import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ZdsSelect } from './zds-select';
import { ZdsInput } from './zds-input';

/**
 * Guarda de `CampoBase.genModeloParaVendor` — el arreglo de "los campos con valor precargado salen
 * en blanco".
 *
 * ── Qué defecto cubre ───────────────────────────────────────────────────────────────────────────
 * Los siete `lib-*-z` con `model`/`group` hacen `group.get(name).setValue(this.model)` incondicional
 * y emitiendo, agendado con `setTimeout` desde `ngOnChanges` detrás de `if (changes.model)`. Angular
 * reporta el PRIMER binding de `model` como cambio, así que ese echo corre al montar — y en el
 * navegador llega cuando `model` todavía es el `null` del constructor y el control ya tiene el valor
 * de `precargar()`. Con el binding viejo (`model() ?? ''`) el vendor recibía un `''` y lo escribía
 * encima. Medido sobre la tarea 180901 de la SCR-0051: el código del producto pasaba de `"101"` a
 * `""` y los cuatro selects de la clasificación regulatoria salían vacíos (0/0/0 donde React daba
 * 8/7/7).
 *
 * El mecanismo completo, por qué la frontera va en el binding, y las **dos** fronteras del lado del
 * control que se falsificaron con sonda están en el docstring de `genModeloParaVendor` en
 * [campo-base.ts](./campo-base.ts). No repetirlo acá.
 *
 * ── ⚠ Qué NO puede cubrir este spec, y por qué no es un descuido ────────────────────────────────
 * **jsdom no reproduce el echo destructivo.** Medido con sonda: bajo jsdom `writeValue` corre
 * **antes** del echo, así que el vendor escribe con `model` ya sincronizado (`"101"`) y su `setValue`
 * es el no-op de régimen. En el navegador el orden se invierte. Es el mismo límite de entorno que ya
 * documenta [zds-select.ts](./zds-select.ts) para su arreglo de catálogo tardío.
 *
 * Por eso lo que se asevera es el **contrato del getter** —qué valor recibe el vendor según el estado
 * de `model` y del control—, que sí es determinista y es la pieza que decide el resultado. El síntoma
 * de negocio (0/0/0 → 8/7/7) es verificación de navegador.
 *
 * Quien lea esta suite en verde **no debe** concluir que la SCR-0051 pinta sus selects.
 */

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZdsSelect, ZdsInput],
  template: `
    <form [formGroup]="form">
      <zds-select
        formControlName="qd_strSfcProduct"
        name="qd_strSfcProduct"
        label="Producto SFC"
        [options]="cllOpciones"
      />
      <zds-input formControlName="qd_strPlate" name="qd_strPlate" label="Placa" />
    </form>
  `,
})
class HostConValorPrecargado {
  /** Los controles nacen CON valor, que es lo que hace `precargar()` desde `task.data`. */
  readonly form = new FormGroup({
    qd_strSfcProduct: new FormControl<string | null>('101'),
    qd_strPlate: new FormControl<string | null>('DVL666'),
  });

  readonly cllOpciones = [
    { value: '101', text: 'Autos' },
    { value: '103', text: 'Hogar' },
  ];
}

/** Drena los `setTimeout` con que la lib difiere `updateControl` y su revalidación. */
async function drenarTimeouts() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function montar() {
  const objFixture = TestBed.createComponent(HostConValorPrecargado);
  await objFixture.whenStable();
  await drenarTimeouts();
  return objFixture;
}

/**
 * Lo que el wrapper le entrega al `lib-*-z` por `[model]`. El getter es `protected` —no es API para
 * las pantallas— así que se lee por índice, que es lo que hace el spec de al lado con `blnEnError`.
 */
function modeloEntregado(in_objCampo: unknown): unknown {
  return (in_objCampo as Record<string, unknown>)['genModeloParaVendor'];
}

/** El `ZdsSelect` y el `ZdsInput` montados, en el orden del template del host. */
function campos(in_objFixture: {
  debugElement: { children: { children: { componentInstance: unknown }[] }[] };
}) {
  const cllHijos = in_objFixture.debugElement.children[0].children;
  return {
    objSelect: cllHijos[0].componentInstance as ZdsSelect,
    objInput: cllHijos[1].componentInstance as ZdsInput,
  };
}

describe('CampoBase · qué modelo recibe el vendor', () => {
  it('con `model` vacío y el control precargado, entrega el valor del control (no el vacío)', async () => {
    const objFixture = await montar();
    const { objSelect } = campos(objFixture);

    // El estado del montaje en el navegador: `model` todavía es el `null` del constructor y el control
    // ya tiene lo que escribió `precargar()`. Con el binding viejo el vendor recibía `''` y lo
    // escribía encima; ahora recibe el valor bueno, así que su `setValue` es inofensivo.
    objSelect.model.set(null);

    expect(modeloEntregado(objSelect)).toBe('101');
  });

  it('el vacío del gestor SÍ llega al vendor: `model` y el control bajan juntos', async () => {
    const objFixture = await montar();
    const objControl = objFixture.componentInstance.form.controls.qd_strSfcProduct;
    const { objSelect } = campos(objFixture);

    // El vaciado del gestor entra por el `(modelChange)` del DS, que es lo que `alCambiarModelo`
    // traduce: baja `model` **y** el control. Si el blindaje fuera "ignorar los `''`" —la alternativa
    // descartada en la SCR-003— acá el vendor seguiría recibiendo `'101'` y sería imposible volver al
    // placeholder, que es una acción legítima (el prompt es elegible, ver `ZdsSelect`).
    (objSelect as unknown as { alCambiarModelo: (in_v: string | null) => void }).alCambiarModelo('');
    await objFixture.whenStable();

    expect(objControl.value).toBe('');
    expect(modeloEntregado(objSelect)).toBe('');
  });

  it('con `model` puesto, gana `model` aunque el control tenga otra cosa', async () => {
    const objFixture = await montar();
    const objControl = objFixture.componentInstance.form.controls.qd_strSfcProduct;
    const { objSelect } = campos(objFixture);

    // La autoridad de `model` no se invierte: el getter solo cubre el hueco del vacío inicial. Si
    // devolviera siempre el control, el wrapper dejaría de poder pintar un valor que el control
    // todavía no tiene y se rompería el sentido del `[model]`.
    //
    // El control se escribe **primero** a propósito: `setValue` pasa por `writeValue`, que siembra
    // `model`. Al revés, el `model.set` quedaría pisado y el caso no probaría nada.
    objControl.setValue('101', { emitEvent: false });
    objSelect.model.set('103');

    expect(modeloEntregado(objSelect)).toBe('103');
  });

  it('con `model` y control vacíos entrega `` (nunca `null`, que el `za-*` trata como reset)', async () => {
    const objFixture = await montar();
    const objControl = objFixture.componentInstance.form.controls.qd_strSfcProduct;
    const { objSelect } = campos(objFixture);

    // El caso del campo que nunca tuvo dato. Tiene que seguir saliendo `''` y no `null`: el
    // `ZaBaseInput` hace `element.reset?.()` cuando el valor es `null`, y por eso el binding viejo ya
    // usaba `?? ''`. Esa parte del contrato se conserva.
    objSelect.model.set(null);
    objControl.setValue(null, { emitEvent: false });

    expect(modeloEntregado(objSelect)).toBe('');
  });

  it('no es exclusivo del select: el input precargado también protege su valor', async () => {
    const objFixture = await montar();
    const { objInput } = campos(objFixture);

    // Los siete `lib-*-z` con `model`/`group` traen el mismo `updateControl` (verificado en el
    // `.mjs`), así que el arreglo va en la base y no en `ZdsSelect`. Este caso es lo que impide que
    // alguien lo "simplifique" moviéndolo al select.
    objInput.model.set(null);

    expect(modeloEntregado(objInput)).toBe('DVL666');
  });
});
