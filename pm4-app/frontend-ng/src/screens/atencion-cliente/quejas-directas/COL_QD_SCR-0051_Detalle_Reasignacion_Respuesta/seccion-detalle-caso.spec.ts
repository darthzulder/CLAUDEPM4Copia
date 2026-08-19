import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal, type Signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, FormGroup } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QD, QD_COLLECTIONS } from '../fields/fields';
import { SeccionDetalleCaso } from './seccion-detalle-caso';

/**
 * S3 de SCR-0051 · el stash de la placa al salir y volver de un producto de Autos.
 *
 * ── Por qué este archivo existe, y por qué el caso NO va en el spec de la pantalla ───────────────
 * `limpiarPlaca()` es de esta sección, y su primera guarda exige que el catálogo de productos **ya
 * tenga contenido** (`cllInsurance().length === 0` → corta). El spec de la pantalla drena los GET de
 * catálogo genéricamente con `{data: []}`, así que ahí la lista de productos siempre está vacía, la
 * limpieza nunca corre y cualquier aserción sobre la placa sería un caso que pasa sin ejercitar nada.
 * Sembrar productos allá obligaría a caso-a-caso romper el drenado compartido, que es justo lo que ese
 * archivo documenta como fuente de fallos silenciosos. Montar la sección sola es más chico y más
 * honesto: se controla el catálogo y se lee el form directamente.
 *
 * Lo que **sí** vive en el spec de la pantalla y no se duplica acá: los tres casos de FLD-156/179
 * (`qd_strMarking`), porque el efecto de la marcación es de la pantalla y necesita su `dicOriginal`
 * congelado en la precarga. El caso de la marcación en el ida y vuelta de la placa va allá por eso.
 *
 * ── El host replica el cableado de la pantalla, y el espejo es la parte que importa ──────────────
 * La sección recibe `sigValores` como input y **no** lee `form.value`: es la única vía por la que sus
 * `computed()` se recalculan. El host lo alimenta desde `valueChanges` igual que la pantalla real
 * (`detalle-reasignacion-respuesta.ts:295`). Si el host sembrara un signal fijo, todos los efectos de
 * la sección quedarían congelados en el primer valor y los casos pasarían por accidente.
 */

/**
 * El catálogo de productos (colección 16), con la forma real de PM4.
 *
 * `'101'` es Autos y `'200'` es Hogar: los dos códigos son **únicos** en la lista, así que
 * `uiValueFromCode()` resuelve la etiqueta sin necesitar el `_desc` compañero. El 104 duplicado
 * —"Garantía extendida" y "Copropiedades" comparten código en la colección real— se incluye porque es
 * el caso que obliga a los values de UI desambiguados, y su presencia asegura que este spec no dependa
 * de que la lista sea prolija.
 */
const CLL_PRODUCTOS = [
  { id: 1, data: { codigo_producto_sfc: '101', nombre_producto_sfc: 'Autos' } },
  { id: 2, data: { codigo_producto_sfc: '104', nombre_producto_sfc: 'Garantía extendida' } },
  { id: 3, data: { codigo_producto_sfc: '104', nombre_producto_sfc: 'Copropiedades' } },
  { id: 4, data: { codigo_producto_sfc: '200', nombre_producto_sfc: 'Hogar' } },
];

/** Host mínimo con el mismo cableado que la pantalla: form propio + espejo desde `valueChanges`. */
@Component({
  standalone: true,
  imports: [SeccionDetalleCaso],
  template: `<app-seccion-detalle-caso [form]="form" [sigValores]="sigValores" />`,
})
class HostPrueba {
  public readonly form = new FormGroup({
    [QD.strSfcProduct]: new FormControl(''),
    [`${QD.strSfcProduct}_desc`]: new FormControl(''),
    [QD.strInteraction]: new FormControl(''),
    [QD.strServiceProvided]: new FormControl(''),
    [QD.strSfcReason]: new FormControl(''),
    [QD.strPlate]: new FormControl(''),
    [QD.strChannel]: new FormControl(''),
    [`${QD.strChannel}_desc`]: new FormControl(''),
    [QD.strAdmission]: new FormControl(''),
    [`${QD.strAdmission}_desc`]: new FormControl(''),
    [QD.strOmbudsmanEscalation]: new FormControl(''),
    [QD.strCompensation]: new FormControl(''),
    [QD.strFraudRelated]: new FormControl(''),
    // Los pinta la plantilla de S1/S2 aunque la cascada no los use.
    [QD.strEmail]: new FormControl(''),
    [`${QD.strPersonType}_desc`]: new FormControl(''),
    [`${QD.strReceptionInstance}_desc`]: new FormControl(''),
    [`${QD.strControlEntity}_desc`]: new FormControl(''),
    [QD.strComplaintText]: new FormControl(''),
  });

  /** Espejo del form, alimentado como en la pantalla: `getRawValue()` sobre cada `valueChanges`. */
  public readonly sigValoresInterno = signal<Record<string, unknown>>(this.form.getRawValue());

  public readonly sigValores = this.sigValoresInterno as Signal<Record<string, unknown>>;

  constructor() {
    this.form.valueChanges.subscribe(() => this.sigValoresInterno.set(this.form.getRawValue()));
  }
}

describe('SeccionDetalleCaso · el stash de la placa (RUL propia, no paridad React)', () => {
  let objFixture: ComponentFixture<HostPrueba>;
  let objHost: HostPrueba;
  let objMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    objMock.verify();
  });

  /**
   * Monta la sección con el form ya precargado y el catálogo de productos respondido.
   *
   * ⚠ El orden es contrato. La precarga va **antes** del primer `detectChanges()`: la sección congela
   * su vinculación en el primer efecto (`blnVinculado`), y un caso que sembrara el producto después
   * probaría un camino que la pantalla real no recorre (allá el form llega precargado desde `task.data`).
   *
   * Y el `await` no es prolijidad: `CollectionService.cargar()` publica sus signals después de un
   * `await`, así que el `flush()` no deja las opciones listas en el mismo tick. Sin ceder la cola,
   * `cllInsurance()` se lee vacío, `limpiarPlaca()` corta en su primera guarda y el caso pasa sin
   * haber ejercitado nada — el modo de falla más caro de este archivo.
   */
  async function montar(in_dicPrecarga: Record<string, string>): Promise<void> {
    objFixture = TestBed.createComponent(HostPrueba);
    objHost = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);

    objHost.form.patchValue(in_dicPrecarga);
    objFixture.detectChanges();

    // Los tres catálogos de la matriz más los dos de display de la sección (canal y admisión). Solo el
    // de productos lleva datos: es el único que gobierna `blnIsAutos`.
    await drenar();
  }

  /** Responde todo GET pendiente; el de productos con datos, el resto vacío. Converge en 2 vueltas. */
  async function drenar(): Promise<void> {
    for (let intVuelta = 0; intVuelta < 8; intVuelta++) {
      await objFixture.whenStable();
      objFixture.detectChanges();
      const cllPendientes = objMock.match((in_objReq) => in_objReq.method === 'GET');
      if (cllPendientes.length === 0) return;
      for (const objPeticion of cllPendientes) {
        if (objPeticion.cancelled) continue;
        const blnProductos = objPeticion.request.url.includes(
          `/collections/${QD_COLLECTIONS.sfcProduct.id}/records`,
        );
        objPeticion.flush({ data: blnProductos ? CLL_PRODUCTOS : [] });
      }
    }
    throw new Error('El drenado de catálogos no convergió');
  }

  /** Escribe en el form y deja el espejo y los efectos ya propagados. */
  async function escribir(in_dicCampos: Record<string, string>): Promise<void> {
    objHost.form.patchValue(in_dicCampos);
    await drenar();
  }

  /** La placa tal como está en el form (que es lo que viaja a PM4). */
  function strPlaca(): string {
    return String(objHost.form.get(QD.strPlate)?.value ?? '');
  }

  it('la sección arranca en Autos con la placa precargada intacta', async () => {
    // El caso de control, y no es relleno: prueba que la guarda de `cllInsurance()` cargado hace lo
    // suyo. Si la limpieza corriera antes de que el catálogo llegue, `blnIsAutos` sería `false` por
    // defecto y esta placa —que viene del caso, no del usuario— se borraría en el montaje.
    await montar({ [QD.strSfcProduct]: '101', [QD.strPlate]: 'ABC123' });

    expect(strPlaca()).toBe('ABC123');
  });

  it('al salir de Autos la placa se limpia (comportamiento de siempre)', async () => {
    await montar({ [QD.strSfcProduct]: '101', [QD.strPlate]: 'ABC123' });

    await escribir({ [QD.strSfcProduct]: '200' });

    expect(strPlaca(), 'fuera de Autos la placa no aplica y no debe viajar a PM4').toBe('');
  });

  it('⚠ al volver a Autos la placa se repone (lo que React pierde)', async () => {
    // El caso nuevo de la tanda. React hace `setValue('')` y el dato se va para siempre: un gestor que
    // se equivoca de producto y corrige tenía que volver a tipear una placa que ya había escrito.
    await montar({ [QD.strSfcProduct]: '101', [QD.strPlate]: 'ABC123' });

    await escribir({ [QD.strSfcProduct]: '200' });
    expect(strPlaca()).toBe('');

    await escribir({ [QD.strSfcProduct]: '101' });
    expect(strPlaca(), 'la placa guardada tiene que volver al re-elegir Autos').toBe('ABC123');
  });

  it('la placa que el usuario tipeó gana sobre la guardada', async () => {
    // El límite del stash, y vale un caso porque la alternativa —reponer siempre— es igual de fácil de
    // escribir y silenciosamente peor: le pisaría al usuario lo que acaba de tipear con un valor viejo.
    await montar({ [QD.strSfcProduct]: '101', [QD.strPlate]: 'ABC123' });

    await escribir({ [QD.strSfcProduct]: '200' });
    // Vuelve a Autos y en la misma tanda escribe otra placa: es el orden real de un formulario donde el
    // campo recién reaparece.
    await escribir({ [QD.strSfcProduct]: '101', [QD.strPlate]: 'XYZ789' });

    expect(strPlaca()).toBe('XYZ789');
  });

  it('el stash NO es un control del form: no aparece en el payload', async () => {
    // ⚠ La razón por la que el valor guardado vive en la instancia y no en un control (ni deshabilitado):
    // la pantalla arma el payload con `getRawValue()`, que **incluye** los deshabilitados, así que
    // cualquier control extra viajaría a PM4 como una variable `qd_*` que no existe en el proceso.
    await montar({ [QD.strSfcProduct]: '101', [QD.strPlate]: 'ABC123' });
    await escribir({ [QD.strSfcProduct]: '200' });

    const cllClaves = Object.keys(objHost.form.getRawValue());
    expect(cllClaves.filter((in_str) => /placa|plate/i.test(in_str))).toEqual([QD.strPlate]);
  });

  it('sin catálogo de productos la placa precargada no se toca', async () => {
    // La guarda de `cllInsurance().length === 0`, aseverada sola. Es el caso que la pantalla real vive
    // en cada montaje —el GET del catálogo tarda— y el que hace que esto no sea código defensivo.
    objFixture = TestBed.createComponent(HostPrueba);
    objHost = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);

    objHost.form.patchValue({ [QD.strSfcProduct]: '101', [QD.strPlate]: 'ABC123' });
    objFixture.detectChanges();

    // Todos los catálogos vacíos, incluido el de productos: es el estado "todavía no llegó".
    for (let intVuelta = 0; intVuelta < 8; intVuelta++) {
      await objFixture.whenStable();
      objFixture.detectChanges();
      const cllPendientes = objMock.match((in_objReq) => in_objReq.method === 'GET');
      if (cllPendientes.length === 0) break;
      for (const objPeticion of cllPendientes) {
        if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
      }
    }

    expect(strPlaca(), 'con el catálogo vacío blnIsAutos es false y esto borraría el dato del caso')
      .toBe('ABC123');
  });

  it('la sección se monta y la placa se pinta solo dentro de Autos', async () => {
    // Smoke de la plantilla, que es lo que hace que los casos de arriba no sean sobre una clase suelta:
    // el campo de la placa vive en un `@if (blnEsAutos())`.
    //
    // ⚠ Se busca por `#field-<name>` y **no** por `zds-input[name="…"]`: en la plantilla el `name` va
    // como binding (`[name]="QD.strPlate"`), o sea que es un input del componente y NO llega al DOM
    // como atributo — un selector de atributo no matchea nunca y el caso falla sin que haya nada roto.
    // El `id="field-<name>"` sí es DOM real (lo pinta el wrap de `campo-base.ts:493`) y además es el
    // que consume `scrollToFirstError`, así que aseverarlo cubre las dos cosas de una.
    await montar({ [QD.strSfcProduct]: '101', [QD.strPlate]: 'ABC123' });

    const objSeccion = objFixture.debugElement.query(By.directive(SeccionDetalleCaso));
    expect(objSeccion).not.toBeNull();
    expect(
      objFixture.nativeElement.querySelector(`#field-${QD.strPlate}`),
      'dentro de Autos el campo de la placa tiene que estar pintado',
    ).not.toBeNull();

    // La otra mitad del `@if`, sin la cual esto no prueba que sea condicional.
    await escribir({ [QD.strSfcProduct]: '200' });
    expect(
      objFixture.nativeElement.querySelector(`#field-${QD.strPlate}`),
      'fuera de Autos el campo no se pinta',
    ).toBeNull();
  });
});
