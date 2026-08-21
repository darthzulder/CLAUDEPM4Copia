/**
 * S3 · Detalle de la queja — **un caso por regla**, no un smoke.
 *
 * ── Por qué esta sección tiene spec propio y no se cubre desde la pantalla ───────────────────────
 * Por lo mismo que S2, pero peor: los ocho efectos de esta sección son **la clasificación regulatoria
 * completa** (la cascada de cuatro niveles, los cinco derivados del motivo, FLD-324 y los cuatro
 * defaults de back), y **todos** se degradan sin poner rojo nada de `crear-recibir-queja.spec.ts`. Ese
 * archivo llena los obligatorios con `patchValue` y asevera sobre la petición que sale al backend: un
 * campo que dejó de derivarse viaja igual —vacío— dentro del payload, y el submit sigue verde. La
 * diferencia con S2 es la consecuencia: acá lo que se degrada en silencio es lo que el BPM usa para
 * **enrutar el caso** (rol responsable, escalamiento al Defensor, SLA), así que el efecto de un
 * derivado que dejó de escribirse no es un dato faltante en un reporte, es un caso que se va por la
 * rama equivocada del proceso.
 *
 * ── ⚠ `HttpTestingController.match()` es DESTRUCTIVO ────────────────────────────────────────────
 * Saca de la cola lo que devuelve, así que un helper construido sobre él **consume** la petición: el
 * llamador tiene que flushear lo que recibió, y un `expectOne` posterior falla con "found none", que se
 * lee como "la sección nunca pidió el catálogo". Es la trampa que costó cinco casos en
 * `crear-recibir-queja.spec.ts`; queda nombrada acá porque este archivo pide **siete** catálogos (los
 * tres de la matriz + los cuatro planos) más uno que se recarga (`productDetail`).
 *
 * ── ⚠ Las etiquetas del DS NO llegan a `textContent` bajo jsdom ─────────────────────────────────
 * `zds-select`/`zds-input` pasan `[label]` como **propiedad** a un `lib-*-z` de Lit, que no hace
 * upgrade en jsdom (trampa 2 de `docs/guides/testing-conventions.md`). Así que las ramas `@if` se
 * aseveran por el `[name]` del elemento montado, no por su rótulo: ver `montoCampo()`. Un
 * `not.toContain('Servicio prestado')` pasaría **siempre**, con la rama abierta o cerrada.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ErrorHandler } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { CatalogosService } from '../../../../core/catalogos.service';
import { FileRegistryService } from '../../../../core/file-registry.service';
import { QD, QD_COLLECTIONS, SCR000_ADJUNTO_KEYS } from '../fields/fields';
import { SeccionDetalleQueja } from './seccion-detalle-queja';

/**
 * Recolector del `ErrorHandler` global.
 *
 * ⚠ Un `throw` dentro de un `effect()` o de `afterRender` **no** pone rojo el spec por sí solo: Angular
 * lo entrega acá y sigue. Sin proveer este handler, un NG0203 (`inject()` fuera de contexto) o un
 * NG0600 (escritura a un signal desde un `computed`) pasarían como ruido de consola con los 20 casos en
 * verde. El `afterEach` asevera que la lista quedó vacía.
 */
class ErroresDePrueba implements ErrorHandler {
  readonly lstErrores: unknown[] = [];
  handleError(in_objError: unknown): void {
    this.lstErrores.push(in_objError);
  }
}

/** El regex de la placa, **copiado** de `crear-recibir-queja.ts`. Ver la nota de `crearForm()`. */
const RGX_PLACA = /^[A-Za-z]{3} ?[0-9]{3}$/;

/** Mínimo de caracteres de la queja, de `crear-recibir-queja.ts`. */
const INT_MIN_QUEJA = 50;
const INT_MAX_TEXTO = 2000;

/**
 * Los controles que S3 toca, con los validadores **reales** de la pantalla
 * (`crear-recibir-queja.ts:281-315`).
 *
 * ⚠ Se copian los validadores y el regex en vez de importar el `FormGroup` de la pantalla, y es una
 * decisión con costo declarado: montar la pantalla entera acá arrastraría `TaskService`, el recaptcha y
 * los cinco catálogos de S1/S2, o sea el arnés que este archivo existe para no necesitar. Lo que se
 * asevera abajo es **qué mensaje sale por qué clave de error**, no que el regex sea el correcto —de eso
 * responde el spec de la pantalla, que sí usa el `FormGroup` real—. Si alguien cambia un validador allá
 * y no acá, el caso que se rompe es el de la pantalla, no éste; la deuda es que éste seguiría verde
 * describiendo un contrato viejo.
 *
 * ⚠ **Dos ausencias que parecen olvidos y no lo son:**
 * - `strServiceProvided` **no** lleva `required`: la obligatoriedad la compone el DS mientras el
 *   `@if (blnIsAsistencias())` lo tenga montado, igual que los nombres en S2. Un `required` fijo acá
 *   dejaría el form inválido para siempre en todo momento que no sea Asistencias.
 * - `strPlate` lleva `pattern` pero **no** `required`, por lo mismo: el campo solo existe en Autos, y
 *   un `pattern` tolera vacío por definición.
 */
function crearForm(): FormGroup {
  return new FormGroup({
    // La cascada.
    [QD.strRequestType]: new FormControl(''),
    [QD.strSfcProduct]: new FormControl('', [Validators.required]),
    [`${QD.strSfcProduct}_desc`]: new FormControl(''),
    [QD.strInteraction]: new FormControl('', [Validators.required]),
    [QD.strServiceProvided]: new FormControl(''),
    [QD.strSfcReason]: new FormControl('', [Validators.required]),
    // Placa, queja y réplica.
    [QD.strPlate]: new FormControl('', [Validators.pattern(RGX_PLACA)]),
    [QD.strComplaintText]: new FormControl('', [
      Validators.required,
      Validators.minLength(INT_MIN_QUEJA),
      Validators.maxLength(INT_MAX_TEXTO),
    ]),
    [QD.strReply]: new FormControl('NO'),
    [QD.strReplyArgument]: new FormControl('', [Validators.maxLength(INT_MAX_TEXTO)]),
    // El rol del radicador: no tiene widget acá, pero FLD-331 lo lee.
    [QD.strFilerRole]: new FormControl(''),
    // FLD-324 y los cuatro defaults de back, sin widget.
    [QD.strProductDetail]: new FormControl(''),
    [QD.strAdmission]: new FormControl(''),
    [QD.strControlEntity]: new FormControl(''),
    [QD.strTutela]: new FormControl(''),
    [QD.strExpressComplaint]: new FormControl(''),
    // Los cinco que deriva el motivo, sin widget.
    [QD.strResponsableRole]: new FormControl(''),
    [QD.strOmbudsmanEscalation]: new FormControl(''),
    [QD.strCompensation]: new FormControl(''),
    [QD.strSlaAssigned]: new FormControl(''),
    [QD.strFraudRelated]: new FormControl(''),
    // Los cinco adjuntos.
    ...Object.fromEntries(SCR000_ADJUNTO_KEYS.map((in_str) => [in_str, new FormControl('')])),
  });
}

/**
 * Host mínimo, con el **mismo cableado que la pantalla**: `signal` + `valueChanges`, no un `computed()`.
 *
 * ⚠ Un `computed(() => this.form.value)` **no** declararía dependencia de nada —`FormGroup.value` no es
 * un signal— así que el signal no se movería nunca y **todos** los casos de cascada pasarían de forma
 * vacua: los efectos correrían una sola vez al montar, con el form vacío, y "el servicio se limpió"
 * sería indistinguible de "el servicio nunca se escribió". Y es `getRawValue()` y no `value` por lo
 * mismo que en la pantalla: un control deshabilitado desaparece de `value`.
 */
@Component({
  standalone: true,
  imports: [SeccionDetalleQueja],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-seccion-detalle-queja
      [form]="form"
      [sigValores]="sigValores"
      [blnIntentoEnvio]="blnIntentoEnvio()"
    />
  `,
})
class HostPrueba {
  readonly form = crearForm();
  readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());
  readonly blnIntentoEnvio = signal(false);

  constructor() {
    this.form.valueChanges.subscribe(() => this.sigValores.set(this.form.getRawValue()));
  }
}

let objFixture: ComponentFixture<HostPrueba>;
let objHost: HostPrueba;
let objMock: HttpTestingController;
let objErrores: ErroresDePrueba;

// ── Ids de colección, para nombrar las peticiones ─────────────────────────────────────────────────
const INT_COL_REQUEST_TYPE = QD_COLLECTIONS.requestType.id;
const INT_COL_SFC_PRODUCT = QD_COLLECTIONS.sfcProduct.id;
const INT_COL_MATRIZ = QD_COLLECTIONS.matrixMotivos.id;
const INT_COL_PRODUCT_DETAIL = QD_COLLECTIONS.productDetail.id;
const INT_COL_ADMISSION = QD_COLLECTIONS.admission.id;
const INT_COL_CONTROL_ENTITY = QD_COLLECTIONS.controlEntity.id;
const INT_COL_TUTELA = QD_COLLECTIONS.tutela.id;
const INT_COL_EXPRESS = QD_COLLECTIONS.expressComplaint.id;

/**
 * Deja asentar los efectos: microtasks del `await` interno del servicio + un macrotask + el render.
 *
 * ⚠ `whenStable()` bajo zoneless **no** drena una cadena de `await`s propios del servicio; el
 * `setTimeout(0)` sí corre después de toda la cola de microtasks pendiente. Sin él, los efectos que
 * dependen de un catálogo recién flusheado no alcanzan a correr y el caso falla en la aserción, no en
 * el `await` — que se lee como "el efecto no existe".
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  await new Promise((in_fnR) => setTimeout(in_fnR, 0));
  objFixture.detectChanges();
}

/**
 * Todas las peticiones pendientes a la colección `in_intId`, **saliendo de la cola**.
 *
 * ⚠ **Consume lo que devuelve** (`match()` es destructivo): el llamador tiene que flushear cada
 * `TestRequest`, o la petición desaparece de la cola sin respuesta y el efecto que la esperaba se queda
 * colgado. Un `expectOne` posterior sobre la misma URL falla con "found none".
 *
 * Para **contar** sin consumir está `contarGets()`. Usar este helper para contar es el error que hizo
 * fallar los 38 casos de la primera corrida de este archivo: las siete peticiones salieron de la cola
 * sin respuesta, el `verify()` del `afterEach` lanzó, y como lanzó, el `resetTestingModule()` de la
 * línea siguiente no corrió — así que **todos** los casos posteriores murieron con "Cannot configure the
 * test module when the test module has already been instantiated", que no dice nada del problema real.
 */
function getsDeColeccion(in_intId: number) {
  return objMock.match((in_objReq) => in_objReq.url.includes(`/collections/${in_intId}/records`));
}

/**
 * Cuántas peticiones se hicieron a esa colección, respondiéndolas vacías para no dejarlas colgadas.
 *
 * No hay forma de contar **sin** consumir con la API pública de `HttpTestingController`, así que se
 * consume y se responde `{data: []}` en el mismo paso: un catálogo vacío es el mismo estado que
 * "todavía no cargó", que es lo que un caso de conteo quiere de todos modos.
 */
function contarGets(in_intId: number): number {
  const cll = getsDeColeccion(in_intId);
  for (const objReq of cll) objReq.flush({ data: [] });
  return cll.length;
}

/**
 * Vacía la cola respondiendo `{data: []}` a lo que quede.
 *
 * ⚠ Hace falta en el `afterEach` porque `verify()` **también** se queja de las peticiones que un caso
 * dejó a propósito sin responder (los casos de "el GET no volvió todavía"), no solo de las que se
 * consumieron mal. Sin esto, el spec obligaría a responder los ocho catálogos en cada caso, que es justo
 * el estado que varias reglas necesitan **no** tener.
 */
function drenarPendientes(): void {
  for (const objReq of objMock.match(() => true)) {
    if (!objReq.cancelled) objReq.flush({ data: [] });
  }
}

/** Responde un catálogo con los registros dados, en la forma `{ data: [...] }` que espera el servicio. */
function responderCatalogo(in_intId: number, in_cllRegistros: readonly unknown[]): void {
  for (const objReq of getsDeColeccion(in_intId)) {
    objReq.flush({ data: in_cllRegistros });
  }
}

/** Registro de un catálogo plano (`data.codigo` / `data.descripcion`). */
function catPlano(in_strCodigo: string, in_strDesc: string) {
  return { id: 1, data: { codigo: in_strCodigo, descripcion: in_strDesc } };
}

/** Registro del catálogo de producto SFC (columnas propias: `codigo_producto_sfc`/`nombre_...`). */
function catProducto(in_strCodigo: string, in_strNombre: string) {
  return { id: 1, data: { codigo_producto_sfc: in_strCodigo, nombre_producto_sfc: in_strNombre } };
}

/** Registro del catálogo de detalle de producto (columnas propias). */
function catDetalle(in_strCodigo: string, in_strNombre: string) {
  return {
    id: 1,
    data: { codigo_detalle_producto: in_strCodigo, nombre_detalle_producto: in_strNombre },
  };
}

/**
 * Una fila de `cat_matriz_motivos`.
 *
 * Los espacios sobrantes de los datos reales se dejan **a propósito** en algunos casos: la cascada
 * compara con `normalizarMatriz()` (trim + minúsculas) y esa tolerancia es la mitad que la hace
 * funcionar, no una defensa opcional (ver `matriz-motivos.service.ts`).
 */
function filaMatriz(in_dic: Record<string, string>) {
  return {
    id: 1,
    data: {
      tipoSolicitud: 'Queja',
      productoZurich: 'Hogar',
      interaccion: 'Venta',
      servicioPrestado: 'No aplica',
      codigoMotivoSFC: '',
      motivoSFC: '',
      rolResponsable: '',
      escalamientoAdministrador: '',
      resarcimientoAdministrador: '',
      sla: '',
      relacionFraude: '',
      ...in_dic,
    },
  };
}

/**
 * Monta el host y responde los catálogos que `in_fnResponder` indique.
 *
 * Los que el caso no responda quedan pendientes a propósito: el `verify()` del `afterEach` no se queja
 * de peticiones **canceladas** al destruir el TestBed, y un catálogo sin respuesta es justamente el
 * estado "el GET no volvió todavía" que varios casos necesitan.
 */
async function montar(in_fnResponder?: () => void): Promise<void> {
  objFixture = TestBed.createComponent(HostPrueba);
  objHost = objFixture.componentInstance;
  objFixture.detectChanges();
  await asentar();
  if (in_fnResponder) {
    in_fnResponder();
    await asentar();
  }
}

/** Escribe en el form y espera a que los efectos asienten. */
async function escribir(in_dic: Record<string, unknown>): Promise<void> {
  objHost.form.patchValue(in_dic);
  await asentar();
}

/** Lee un control del form como string. `undefined` si el control no existe. */
function leer(in_strCampo: string): unknown {
  return objHost.form.get(in_strCampo)?.value;
}

/** La instancia de la sección, para llamar a sus miembros `protected` (visibilidad de TS, no runtime). */
function seccion(): SeccionDetalleQueja {
  return objFixture.debugElement.children[0].componentInstance as SeccionDetalleQueja;
}

/**
 * `true` si la sección montó el campo de ese nombre.
 *
 * ⚠ Se pregunta por el `[name]` del elemento y **no** por el texto del rótulo: la etiqueta viaja como
 * propiedad a un `lib-*-z` de Lit que no hace upgrade bajo jsdom, así que nunca llega a `textContent`.
 * Ver el ⚠ de la cabecera del archivo.
 */
function montoCampo(in_strCampo: string): boolean {
  return (objFixture.nativeElement as HTMLElement)
    .querySelector(`[name="${in_strCampo}"]`) !== null;
}

/**
 * Deja la cascada lista hasta el nivel del motivo, con una matriz de tres filas.
 *
 * Es el fixture que **React declaró imposible** de armar (ver `CrearRecibirQueja.test.tsx:1-25`): allá
 * los cuatro niveles eran selects del DS no interactuables por `fireEvent`, acá son `FormControl`s que
 * se escriben con `patchValue`. Es la razón por la que este archivo puede aseverar los derivados.
 *
 * `tipoSolicitud`/`productoZurich` comparan TEXTO, así que hay que sembrar `qd_strRequestType` con el
 * **código** cuya etiqueta es "Queja", y el producto por su value de UI (`código::etiqueta`).
 */
async function montarCascada(): Promise<void> {
  await montar(() => {
    responderCatalogo(INT_COL_REQUEST_TYPE, [catPlano('1', 'Queja')]);
    responderCatalogo(INT_COL_SFC_PRODUCT, [
      catProducto('7', 'Hogar'),
      catProducto('9', 'Autos'),
    ]);
    responderCatalogo(INT_COL_MATRIZ, [
      // Hogar · Venta → un motivo, con las cinco columnas derivadas llenas.
      filaMatriz({
        interaccion: 'Venta',
        codigoMotivoSFC: '101',
        motivoSFC: 'Información incompleta',
        rolResponsable: 'Comercial',
        escalamientoAdministrador: 'No',
        resarcimientoAdministrador: 'Ninguno',
        sla: '15',
        relacionFraude: 'No aplica',
      }),
      // Hogar · Asistencias → dos servicios, cada uno con su motivo (el nivel 3 de la cascada).
      filaMatriz({
        interaccion: 'Asistencias',
        servicioPrestado: 'Plomería',
        codigoMotivoSFC: '201',
        motivoSFC: 'Demora en la asistencia',
        rolResponsable: 'Operaciones',
        sla: '5',
        relacionFraude: 'Si',
      }),
      filaMatriz({
        // ⚠ Con espacio final a propósito: los datos reales lo traen y `normalizarMatriz()` lo tolera.
        interaccion: 'Asistencias',
        servicioPrestado: 'Cerrajería ',
        codigoMotivoSFC: '202',
        motivoSFC: 'Servicio no prestado',
      }),
      // Autos · Venta → para el caso de la placa.
      filaMatriz({
        productoZurich: 'Autos',
        interaccion: 'Venta',
        codigoMotivoSFC: '301',
        motivoSFC: 'Cobertura no informada',
      }),
    ]);
  });

  await escribir({ [QD.strRequestType]: '1' });
  // El producto va por el satélite del picker, que es el canal real: es lo que traduce a código puro.
  seccion()['objProductoUi'].setValue('7::Hogar');
  await asentar();
}

/**
 * Deja el catálogo de detalle de producto con esas opciones, **puenteando el gate del `dependsOn`**.
 *
 * ⚠ No se puede sembrar respondiendo un GET como los otros siete catálogos, porque la sección **nunca emite
 * ese GET**: `CollectionService.cargar()` corta antes de pedir cuando la definición declara un `dependsOn`
 * cuya clave no está en el diccionario de valores (`collection.service.ts:102-105`), y el desajuste
 * preservado (`qd_strProductFilter` en el call site vs `qd_strLegacyInsurance` en la colección) garantiza
 * que nunca esté. Medido con sonda: al montar se piden los ids `[16,18,45,21,22,30,32]` — el 40 no aparece.
 * Un `responderCatalogo(40, …)` no matchea nada, y los casos escritos así fallan **con la lógica correcta
 * montada**, culpando a la siembra de lo que en realidad es el gate.
 *
 * Así que se llama a `cargar()` sobre **la instancia de la sección** —`CatalogosService` está en los
 * `providers` del componente, así que `TestBed.inject()` daría otra instancia cuyas opciones nadie lee— con
 * un diccionario que sí trae la clave del `dependsOn`. Es el comportamiento que tendría la pantalla el día
 * que alguien haga coincidir los tokens, que es justo lo que conviene tener cubierto **antes** del arreglo.
 */
async function sembrarDetalleProducto(
  in_cllRegistros: Record<string, unknown>[],
): Promise<void> {
  const objCatalogos = seccion()['objCatalogos'] as CatalogosService;
  void objCatalogos.cargar('productDetail', QD_COLLECTIONS.productDetail, {
    qd_strLegacyInsurance: '7',
  });
  objMock
    .expectOne((in_objReq) => in_objReq.url.includes(`/collections/${INT_COL_PRODUCT_DETAIL}/records`))
    .flush({ data: in_cllRegistros });
  await asentar();
}

beforeEach(() => {
  objErrores = new ErroresDePrueba();
  // Los GET de colección loguean el PMQL y el conteo por consola (diagnóstico de dev de
  // `CollectionService`): sin silenciarlos, 20 casos × 8 catálogos tapan el fallo real.
  vi.spyOn(console, 'log').mockImplementation(() => undefined);

  TestBed.configureTestingModule({
    imports: [HostPrueba],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      FileRegistryService,
      { provide: ErrorHandler, useValue: objErrores },
    ],
  });
  objMock = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  // Antes del `verify()`: los casos que dejan un catálogo sin responder a propósito son varios, y
  // `verify()` no distingue "quedó pendiente porque el caso lo quiso así" de "se consumió mal".
  drenarPendientes();
  objMock.verify();
  // Ver el docstring de `ErroresDePrueba`: un throw en un efecto no pone rojo el caso por sí solo.
  expect(objErrores.lstErrores).toEqual([]);
  vi.restoreAllMocks();
  TestBed.resetTestingModule();
});

describe('S3 · carga de catálogos', () => {
  it('pide los tres catálogos de la matriz y los cuatro planos al montar', async () => {
    await montar();

    // Los tres de la cascada los pide `MatrizMotivosService.vincular()`; los cuatro planos, la sección.
    for (const intId of [
      INT_COL_REQUEST_TYPE, INT_COL_SFC_PRODUCT, INT_COL_MATRIZ,
      INT_COL_ADMISSION, INT_COL_CONTROL_ENTITY, INT_COL_TUTELA, INT_COL_EXPRESS,
    ]) {
      expect(`colección ${intId}: ${contarGets(intId)}`).toBe(`colección ${intId}: 1`);
    }
  });

  it('⚠ NUNCA pide el detalle de producto: el bug del `dependsOn` corta la petición entera', async () => {
    // **El bug preexistente, fijado como caso — y peor de lo que decía su propio comentario.**
    //
    // `recargarDetalleProducto()` pasa la clave shim `qd_strProductFilter`; el `dependsOn` de la colección
    // dice `qd_strLegacyInsurance`. Los comentarios del port (y de `MAPEO_qd_old_new.md` #3) describían la
    // consecuencia como "el filtro no se aplica y el catálogo llega completo". **Medido, es otra cosa:**
    // `CollectionService.cargar()` abre con un gate duro —`if (dependsOn && !valores[dependsOn]) { limpiar();
    // return; }` (`collection.service.ts:102-105`)— así que la clave ausente no degrada el filtro, **cancela
    // la petición**. Una sonda sobre las peticiones al montar devolvió los ids `[16,18,45,21,22,30,32]`: el
    // 40 no aparece nunca, con producto elegido o sin él.
    //
    // El corolario cae sobre FLD-324: el catálogo no llega ni completo ni filtrado, así que
    // `sembrarDetalleProducto()` no tiene de dónde tomar "la primera opción" y `qd_strProductDetail` viaja
    // **siempre vacío** a PM4. Es lo que hace hoy el React en producción, así que se porta idéntico y se
    // reporta; arreglar el token acá cambiaría un dato que el proceso viene recibiendo vacío desde siempre.
    //
    // Si alguien hace coincidir los tokens, este caso se pone rojo nombrando el conteo — y el de FLD-324
    // de abajo también, que es la otra mitad del mismo defecto.
    await montarCascada();

    expect(contarGets(INT_COL_PRODUCT_DETAIL)).toBe(0);
    expect(seccion()['cllDetalleProducto']()).toEqual([]);
  });
});

describe('RUL · las tres limpiezas de la cascada', () => {
  it('cambiar el producto VACÍA el momento que ya no existe en la matriz', async () => {
    // Nivel 2 de la cascada. Sin esto, un momento de Hogar seguiría viajando con producto Autos y el
    // motivo quedaría filtrado por una combinación que la matriz no tiene: los tres selects de abajo
    // saldrían vacíos sin ningún mensaje que lo explique.
    await montarCascada();
    await escribir({ [QD.strInteraction]: 'Venta' });
    expect(leer(QD.strInteraction)).toBe('Venta');

    // Autos también tiene "Venta", así que hay que mover a un momento que solo exista en Hogar.
    await escribir({ [QD.strInteraction]: 'Asistencias' });
    seccion()['objProductoUi'].setValue('9::Autos');
    await asentar();

    expect(leer(QD.strInteraction)).toBe('');
  });

  it('cambiar el momento a uno que NO es Asistencias vacía el servicio prestado', async () => {
    // ⚠ Ésta es la limpieza que `limpiarSiFuera()` **no** puede hacer: fuera de Asistencias
    // `cllService()` es `[]` y esa función corta antes de limpiar (su guarda de "el GET no respondió").
    // El valor viejo se quedaría dentro del filtro del motivo —el nivel siguiente— dejándolo filtrado
    // por un servicio que ya nadie ve en pantalla.
    await montarCascada();
    await escribir({ [QD.strInteraction]: 'Asistencias', [QD.strServiceProvided]: 'Plomería' });
    expect(leer(QD.strServiceProvided)).toBe('Plomería');

    await escribir({ [QD.strInteraction]: 'Venta' });

    expect(leer(QD.strServiceProvided)).toBe('');
  });

  it('cambiar el servicio VACÍA el motivo que ya no existe para esa combinación', async () => {
    // Nivel 4. Es la limpieza con la consecuencia más cara: el motivo es lo que deriva los cinco campos
    // de enrutamiento, así que un motivo que sobrevive a un cambio de servicio deja al BPM enrutando por
    // un rol responsable y un SLA que corresponden a otra fila de la matriz.
    await montarCascada();
    await escribir({ [QD.strInteraction]: 'Asistencias', [QD.strServiceProvided]: 'Plomería' });
    await escribir({ [QD.strSfcReason]: '201' });
    expect(leer(QD.strSfcReason)).toBe('201');

    await escribir({ [QD.strServiceProvided]: 'Cerrajería' });

    expect(leer(QD.strSfcReason)).toBe('');
  });

  it('⚠ un valor precargado SOBREVIVE mientras la matriz no haya respondido', async () => {
    // La guarda `in_cllOpciones.length === 0` de `limpiarSiFuera()`, y el motivo de que exista. Al
    // montar un caso precargado desde `task.data`, un valor sin catálogo todavía **no** significa "dato
    // inválido": significa "el GET no volvió". Sin esa condición la precarga se borraría sola en el
    // primer render, y el ciudadano vería un formulario que perdió sus datos al abrirlo.
    await montar();   // ningún catálogo responde
    await escribir({ [QD.strInteraction]: 'Venta', [QD.strSfcReason]: '101' });

    expect(leer(QD.strInteraction)).toBe('Venta');
    expect(leer(QD.strSfcReason)).toBe('101');
  });

  it('el espacio sobrante de la matriz se NORMALIZA antes de llegar a la opción', async () => {
    // La fila de la matriz trae `servicioPrestado: 'Cerrajería '` —con espacio final, como los datos
    // reales— y el motivo que cuelga de ella es el '202'.
    //
    // ⚠ El recorte ocurre **al construir la lista de opciones**, no al comparar contra el valor del
    // control: `leerColumnaMatriz()` recorta cada columna al leerla, así que `opcionesUnicas()` publica
    // `'Cerrajería'` ya limpio y ése es el único texto que el select puede guardar. Medido con sonda:
    // escribir `'Cerrajería '` **con** el espacio no ejercita la tolerancia, ejercita un valor que ninguna
    // UI puede producir — y `limpiarSiFuera()` lo borra, correctamente, porque no está en el catálogo (la
    // sonda devolvió `servicioLeido: ''` y `cllReason: []`). Un caso escrito así falla **con la lógica
    // correcta montada**, culpando al recorte de lo que en realidad demuestra que la limpieza funciona.
    //
    // Así que la regla se asevera donde vive: la opción llega recortada, y el motivo de esa fila se alcanza
    // escribiendo el valor recortado.
    //
    // Mutación verificada: quitando el `.trim()` de `leerColumnaMatriz()`
    // (`matriz-motivos.service.ts:19`) este caso se pone rojo —la opción pasa a valer `'Cerrajería '`— y
    // arrastra también a "cambiar el servicio VACÍA el motivo…". ⚠ Quitarlo de `normalizarMatriz()`
    // (línea 10) en cambio **NO** rompe nada acá: esa función normaliza los dos lados de la comparación,
    // así que el espacio se cancela solo. El recorte que sostiene la cascada es el de la línea 19.
    await montarCascada();
    await escribir({ [QD.strInteraction]: 'Asistencias' });

    expect(seccion()['objMatriz'].cllService().map((in_o) => in_o.value)).toEqual([
      'Plomería', 'Cerrajería',
    ]);

    await escribir({ [QD.strServiceProvided]: 'Cerrajería' });
    expect(seccion()['objMatriz'].cllReason().map((in_o) => in_o.value)).toEqual(['202']);
  });
});

describe('los cinco campos que el motivo deriva', () => {
  it('copia las cinco columnas de la fila del motivo a sus campos de back', async () => {
    // Ninguno tiene widget: son variables que el BPM usa para **enrutar el caso**. Que se degraden en
    // silencio es exactamente el motivo por el que esta sección tiene spec propio — el submit de la
    // pantalla viaja igual con los cinco vacíos y su spec sigue verde.
    await montarCascada();
    await escribir({ [QD.strInteraction]: 'Venta' });
    await escribir({ [QD.strSfcReason]: '101' });

    expect(leer(QD.strResponsableRole)).toBe('Comercial');
    expect(leer(QD.strOmbudsmanEscalation)).toBe('No');
    expect(leer(QD.strCompensation)).toBe('Ninguno');
    expect(leer(QD.strSlaAssigned)).toBe('15');
  });

  it('⚠ relacionFraude se NORMALIZA al par SI/NO, que es el contrato de PM4', async () => {
    // **El campo que no está en la ficha 1.0** (implementado en `SeccionDetalleQueja.tsx:154,169`, va
    // como `⚠ corregido en 2.0`). Es el único de los cinco que se normaliza, y no por prolijidad: la
    // columna trae prosa ("Si", "SI", "No aplica") y el proceso compara contra `'SI'` **exacto**. Un
    // valor crudo bifurcaría por la rama de "no es fraude" igual, pero sin dejar constancia de que la
    // matriz sí tenía una respuesta.
    await montarCascada();
    await escribir({ [QD.strInteraction]: 'Asistencias', [QD.strServiceProvided]: 'Plomería' });
    await escribir({ [QD.strSfcReason]: '201' });

    // La fila dice "Si" → 'SI'.
    expect(leer(QD.strFraudRelated)).toBe('SI');
  });

  it('cualquier texto que no empiece por "s" cae a NO, incluido "No aplica"', async () => {
    await montarCascada();
    await escribir({ [QD.strInteraction]: 'Venta' });
    await escribir({ [QD.strSfcReason]: '101' });

    // La fila de Venta dice "No aplica".
    expect(leer(QD.strFraudRelated)).toBe('NO');
  });

  it('sin fila de motivo NO toca ninguno de los cinco, para no pisar la precarga', async () => {
    // Dejarlos vacíos "por prolijidad" borraría lo que otra pantalla del proceso ya hubiera resuelto:
    // los cinco son campos de back y la precarga de `task.data` los trae llenos en un caso en curso.
    await montarCascada();
    objHost.form.patchValue({ [QD.strResponsableRole]: 'Precargado', [QD.strSlaAssigned]: '99' });
    await asentar();

    // Momento válido, pero sin motivo elegido: no hay fila.
    await escribir({ [QD.strInteraction]: 'Venta' });

    expect(leer(QD.strResponsableRole)).toBe('Precargado');
    expect(leer(QD.strSlaAssigned)).toBe('99');
  });
});

describe('FLD-324 · el detalle del producto', () => {
  it('⚠ hoy viaja SIEMPRE vacío, porque su catálogo nunca se pide', async () => {
    // La consecuencia de negocio del gate del `dependsOn` (ver el caso de arriba), aseverada sobre el dato
    // que sale a PM4 y no sobre el conteo de peticiones. `sembrarDetalleProducto()` está bien portado —hace
    // `cllOpciones[0]?.value` como React— pero su lista está vacía por construcción, así que el efecto no
    // tiene nada que sembrar. Es el estado de producción de React hoy; se porta y se reporta.
    await montarCascada();

    expect(leer(QD.strProductDetail)).toBe('');
  });

  it('siembra la PRIMERA opción cuando el catálogo SÍ tiene opciones', async () => {
    // La regla de FLD-324 en sí: React hace `cllProductDetail[0]?.value` y se conserva, **incluida la
    // arbitrariedad** de "la primera" (no hay criterio de negocio detrás, y el campo no tiene widget).
    //
    // ⚠ El catálogo se siembra con `sembrarDetalleProducto()`, no respondiendo un GET de la sección: por el
    // gate medido arriba esa petición nunca se emite, así que un `responderCatalogo(40, …)` no matchea nada
    // y el caso pasaría o fallaría por la fixture en vez de por la regla. Ver el docstring del helper.
    await montarCascada();

    await sembrarDetalleProducto([catDetalle('D1', 'Detalle uno'), catDetalle('D2', 'Detalle dos')]);

    expect(leer(QD.strProductDetail)).toBe('D1');
  });

  it('NO pisa un detalle de producto que ya venía precargado', async () => {
    // ⚠ Con el catálogo sembrado de verdad. Escrito contra un catálogo vacío este caso pasaría
    // **vacuamente** —nada puede pisar nada si no hay opciones— y seguiría verde incluso si alguien
    // borrara la guarda `if (… || this.leer(QD.strProductDetail)) return;` que dice cubrir.
    await montarCascada();
    await escribir({ [QD.strProductDetail]: 'YA_VENIA' });

    await sembrarDetalleProducto([catDetalle('D1', 'Detalle uno')]);

    expect(leer(QD.strProductDetail)).toBe('YA_VENIA');
  });

  it('escribe el `_desc` del detalle junto al código', async () => {
    // La convención `_desc` del proyecto (`MAPEO_qd_old_new.md`): el código viaja para que el BPM
    // bifurque, la etiqueta para que los reportes sean legibles.
    await montarCascada();
    await sembrarDetalleProducto([catDetalle('D1', 'Detalle uno')]);

    expect(leer(`${QD.strProductDetail}_desc`)).toBe('Detalle uno');
  });
});

describe('FLD-331/332/333/334 · los cuatro defaults de back', () => {
  /** Responde los cuatro catálogos planos con etiquetas como las reales (numeradas). */
  function responderLosCuatro(): void {
    responderCatalogo(INT_COL_ADMISSION, [
      catPlano('9', 'No aplica'),
      catPlano('1', 'Admitida'),
    ]);
    responderCatalogo(INT_COL_CONTROL_ENTITY, [
      catPlano('1', 'Superintendencia Financiera'),
      catPlano('5', 'Otros'),
    ]);
    responderCatalogo(INT_COL_TUTELA, [catPlano('1', '1. Si'), catPlano('2', '2. No')]);
    responderCatalogo(INT_COL_EXPRESS, [catPlano('1', '1. Si'), catPlano('2', '2. No')]);
  }

  it('FLD-331 · admisión se siembra por CÓDIGO (9), no por etiqueta', async () => {
    // El orden importa y es el de React: el código es el contrato con la Superintendencia, la etiqueta
    // es solo el respaldo por si negocio la renumera.
    await montar(responderLosCuatro);

    expect(leer(QD.strAdmission)).toBe('9');
  });

  it('FLD-331 · sin el código 9 en el catálogo, cae a la etiqueta /no aplica/i', async () => {
    await montar(() => {
      responderCatalogo(INT_COL_ADMISSION, [
        catPlano('77', 'No Aplica'),   // mayúscula distinta: el regex es case-insensitive
        catPlano('1', 'Admitida'),
      ]);
    });

    expect(leer(QD.strAdmission)).toBe('77');
  });

  it('⚠ FLD-331 · con el Defensor del Consumidor como radicador NO se siembra la admisión', async () => {
    // La admisión la decide él, y sembrarla acá **pisaría su respuesta**. Es la única de las cuatro
    // semillas con esta condición, y el fallo sería invisible: el campo saldría con "No aplica" en un
    // caso donde el Defensor había marcado otra cosa, sin nada en pantalla que lo delate.
    // Se monta sin responder la admisión, para poder sembrar el rol ANTES de que llegue el catálogo:
    // el efecto corre cuando las opciones aparecen, así que si el catálogo llegara primero la semilla
    // ya estaría escrita y el caso pasaría por el orden, no por la regla.
    await montar();
    await escribir({ [QD.strFilerRole]: '4' });

    responderCatalogo(INT_COL_ADMISSION, [catPlano('9', 'No aplica')]);
    await asentar();

    expect(leer(QD.strAdmission)).toBe('');
  });

  it('FLD-332 · ente de control se siembra con la etiqueta /otros/i', async () => {
    await montar(responderLosCuatro);

    expect(leer(QD.strControlEntity)).toBe('5');
  });

  it('FLD-333/334 · tutela y queja exprés se siembran con el "No" NUMERADO', async () => {
    // ⚠ El regex es `/^\d?\.?\s*no$/i` y el ancla no es opcional: las etiquetas reales vienen numeradas
    // ("2. No"), y un `/no/i` suelto haría match con "No aplica" — que en otro catálogo es una opción
    // legítima y distinta. Acá los dos catálogos tienen "1. Si" y "2. No".
    await montar(responderLosCuatro);

    expect(leer(QD.strTutela)).toBe('2');
    expect(leer(QD.strExpressComplaint)).toBe('2');
  });

  it('⚠ el "No" SIN numerar también hace match, y "No aplica" NO', async () => {
    // El `\d?\.?\s*` es opcional a los tres lados, así que el regex cubre las dos formas reales. Lo que
    // **no** debe cubrir es "No aplica": si lo hiciera, tutela quedaría sembrada con una opción que
    // significa otra cosa.
    await montar(() => {
      responderCatalogo(INT_COL_TUTELA, [catPlano('8', 'No aplica'), catPlano('3', 'No')]);
    });

    expect(leer(QD.strTutela)).toBe('3');
  });

  it('ninguno de los cuatro pisa un valor ya precargado', async () => {
    await montar();
    await escribir({
      [QD.strAdmission]: 'A', [QD.strControlEntity]: 'B',
      [QD.strTutela]: 'C', [QD.strExpressComplaint]: 'D',
    });

    responderLosCuatro();
    await asentar();

    expect([
      leer(QD.strAdmission), leer(QD.strControlEntity),
      leer(QD.strTutela), leer(QD.strExpressComplaint),
    ]).toEqual(['A', 'B', 'C', 'D']);
  });
});

/**
 * **FLD-331 / RUL-000-01 · el widget de admisión, que el porte a Angular había perdido.**
 *
 * El anexo lo dice con estas palabras: *"Visible (ZdsSelect requerido) solo si rol = Defensor del
 * Consumidor (código 4). En los demás roles: oculto, fijo en 'No Aplica' (código 9)"*. React lo pinta
 * (`SeccionDetalleQueja.tsx`, `blnIsDefender`); la sección de Angular se había portado con la mitad de
 * la regla —la semilla respetaba el rol— pero sin el campo, así que el Defensor no tenía dónde elegir.
 *
 * ⚠ Los dos casos del `required` son los que importan y no son decorativos: el `@if` desmonta el widget
 * pero **no** toca el `FormGroup`, así que sin `alternarValidadorAdmision()` un ciudadano que pasa por
 * Defensor y se va a otro rol deja el form inenviable sin nada en rojo. Es el defecto de §13.6/§13.7,
 * cobrado ya dos veces en esta pantalla.
 */
describe('FLD-331 · la admisión la ve y la elige SOLO el Defensor', () => {
  /** El catálogo de admisión real: el '9' del default más una opción que solo el Defensor elegiría. */
  function responderAdmision(): void {
    responderCatalogo(INT_COL_ADMISSION, [catPlano('9', 'No aplica'), catPlano('1', 'Admitida')]);
  }

  it('el campo NO se monta para un rol cualquiera, y SÍ para el Defensor', async () => {
    await montar(responderAdmision);
    await escribir({ [QD.strFilerRole]: '3' });          // Empleado Zurich
    expect(montoCampo(QD.strAdmission)).toBe(false);

    await escribir({ [QD.strFilerRole]: '4' });          // Defensor del Consumidor

    expect(seccion()['blnEsDefensor']()).toBe(true);
    expect(montoCampo(QD.strAdmission)).toBe(true);
  });

  it('⚠ el `required` LLEGA con el Defensor y SE VA con el rol siguiente', async () => {
    // La segunda mitad es la que atrapa el defecto: si el `required` se quedara puesto, el form sería
    // inválido por un campo que ya no está en el DOM — sin mensaje, y `scrollToFirstError()` sin nada
    // que enfocar. Se asevera por `hasError('required')` y no por identidad del validador: lo que
    // importa es el estado observable del control.
    await montar(responderAdmision);
    await escribir({ [QD.strFilerRole]: '4', [QD.strAdmission]: '' });

    const objControl = objHost.form.get(QD.strAdmission);
    expect(objControl?.hasError('required')).toBe(true);

    await escribir({ [QD.strFilerRole]: '3' });

    expect(objControl?.hasError('required')).toBe(false);

    // ⚠ Y se vacía a mano para probar que el validador **se fue**, no que está satisfecho.
    // Al salir de Defensor el propio `sembrarAdmision()` fuerza '9' (el caso de abajo), y un control con
    // valor no dispara `required` ni con el validador puesto: sin este vaciado la aserción de arriba pasa
    // igual con un `alternarValidadorAdmision()` que solo agrega y nunca saca. Lo verificó la mutación
    // MUT5 de §13.8, que la primera versión de este caso NO atrapó.
    objControl?.setValue('');
    expect(objControl?.hasError('required')).toBe(false);
  });

  it('entrar al rol Defensor LIMPIA el "No aplica" que se había sembrado', async () => {
    // Si no se limpiara, el select del Defensor abriría con "No aplica" ya elegido y su `required`
    // quedaría satisfecho por el default: elegiría por omisión, que es justo lo que FLD-331 no quiere.
    await montar(responderAdmision);
    expect(leer(QD.strAdmission)).toBe('9');

    await escribir({ [QD.strFilerRole]: '4' });

    expect(leer(QD.strAdmission)).toBe('');
  });

  it('⚠ salir del rol Defensor FUERZA "No aplica" sobre lo que él había elegido', async () => {
    // Diferencia de paridad **deliberada** con React (decisión del usuario, 2026-08-20): allá el
    // effect corta con `if (blnIsDefender || …) return` y después solo escribe si el valor difiere, así
    // que un '1' elegido por el Defensor sobrevive al cambio de rol y viaja al proceso con el campo ya
    // oculto — una admisión que nadie puede ver ni corregir. El anexo pide "fijo en No Aplica".
    await montar(responderAdmision);
    await escribir({ [QD.strFilerRole]: '4' });
    await escribir({ [QD.strAdmission]: '1' });          // "Admitida", elegida por el Defensor
    expect(leer(QD.strAdmission)).toBe('1');

    await escribir({ [QD.strFilerRole]: '3' });

    expect(leer(QD.strAdmission)).toBe('9');
    expect(montoCampo(QD.strAdmission)).toBe(false);
  });

  it('la elección del Defensor SOBREVIVE mientras siga siendo el radicador', async () => {
    // El guardia de rama de `sembrarAdmision()` se apoya en el cruce, no en el rol de cada corrida: si
    // se sembrara en cada pasada, cualquier tecla en otro campo le pisaría la elección al Defensor.
    await montar(responderAdmision);
    await escribir({ [QD.strFilerRole]: '4' });
    await escribir({ [QD.strAdmission]: '1' });

    await escribir({ [QD.strComplaintText]: 'x'.repeat(60) });

    expect(leer(QD.strAdmission)).toBe('1');
  });
});

describe('las tres ramas condicionales', () => {
  it('la placa se monta SOLO en la familia Autos', async () => {
    await montarCascada();
    expect(montoCampo(QD.strPlate)).toBe(false);

    seccion()['objProductoUi'].setValue('9::Autos');
    await asentar();

    expect(seccion()['blnEsAutos']()).toBe(true);
    expect(montoCampo(QD.strPlate)).toBe(true);
  });

  it('el servicio prestado se monta SOLO en Asistencias', async () => {
    await montarCascada();
    await escribir({ [QD.strInteraction]: 'Venta' });
    expect(montoCampo(QD.strServiceProvided)).toBe(false);

    await escribir({ [QD.strInteraction]: 'Asistencias' });

    expect(montoCampo(QD.strServiceProvided)).toBe(true);
  });

  it('FLD-326 · el argumento de la réplica se monta solo si el ciudadano marcó SI', async () => {
    // El checkbox guarda el contrato de texto de PM4 ('SI'/'NO'), no un booleano: un `=== true` acá
    // dejaría la rama cerrada para siempre.
    await montar();
    expect(seccion()['blnReplica']()).toBe(false);
    expect(montoCampo(QD.strReplyArgument)).toBe(false);

    await escribir({ [QD.strReply]: 'SI' });

    expect(seccion()['blnReplica']()).toBe(true);
    expect(montoCampo(QD.strReplyArgument)).toBe(true);
  });

  it('la fila del argumento lleva `row-tras-checkbox`, que le da el aire tras el checkbox', async () => {
    // Entre dos `.form-row` hermanas no hay separación —`gap` de grilla solo separa celdas DENTRO de
    // una fila, y el `margin` es 0—, así que debajo de un checkbox, que es bajo, el textarea quedaba
    // pegado a la pregunta. Lo corrige `.form-row.row-tras-checkbox` en `shared.css`.
    //
    // ⚠ Esto asevera que la CLASE llega al DOM, no los 16px: `getBoundingClientRect()` devuelve 0 en
    //   jsdom para todo, así que el hueco real NO es observable acá. Se midió en el navegador
    //   (`bottom: 1541` → `top: 1557`, `marginTop: 16px`); acá se cubre lo único que se puede romper
    //   en silencio editando la plantilla.
    await montar();
    await escribir({ [QD.strReply]: 'SI' });

    const objTextarea = (objFixture.nativeElement as HTMLElement).querySelector(
      `[name="${QD.strReplyArgument}"]`,
    );

    expect(objTextarea?.closest('.form-row')?.classList.contains('row-tras-checkbox')).toBe(true);
  });
});

describe('el switch de adjuntos', () => {
  it('arranca APAGADO sin adjuntos precargados', async () => {
    await montar();

    expect(seccion()['blnAdjuntos']()).toBe(false);
  });

  it('arranca ENCENDIDO si el caso ya traía algún adjunto', async () => {
    // Sin esta condición un caso precargado mostraría el switch apagado con documentos que **igual
    // viajan** en el payload: el ciudadano no tendría forma de ver ni de quitar lo que ya está adjunto.
    objFixture = TestBed.createComponent(HostPrueba);
    objHost = objFixture.componentInstance;
    // Se siembra ANTES del primer `detectChanges()`, porque el switch se decide en `vincular()`.
    objHost.form.get(SCR000_ADJUNTO_KEYS[2])?.setValue('escritura.pdf');
    objHost.sigValores.set(objHost.form.getRawValue());
    objFixture.detectChanges();
    await asentar();

    expect(seccion()['blnAdjuntos']()).toBe(true);
  });

  it('⚠ apagarlo borra los adjuntos en los DOS lugares donde viven', async () => {
    // **La parte no obvia, y la que importa.** El nombre del archivo está en el `FormControl` y el
    // binario en `FileRegistryService`. Limpiar solo el control dejaría los binarios en el registro y el
    // submit los subiría igual: el caso terminaría con adjuntos que el ciudadano decidió quitar, **sin
    // ninguna traza en pantalla** de que siguen ahí. Es el tipo de fallo que no se ve en QA y sí en
    // producción, con un documento que el ciudadano no quería enviar ya subido al request.
    await montar();
    const objRegistro = TestBed.inject(FileRegistryService);

    for (const strClave of SCR000_ADJUNTO_KEYS) {
      objHost.form.get(strClave)?.setValue(`${strClave}.pdf`);
      objRegistro.registrar(strClave, new File(['x'], `${strClave}.pdf`));
    }
    await asentar();
    expect(objRegistro.intCantidad).toBe(5);

    seccion()['alternarAdjuntos'](false);
    await asentar();

    expect(objRegistro.intCantidad).toBe(0);
    expect(SCR000_ADJUNTO_KEYS.map((in_str) => leer(in_str))).toEqual(['', '', '', '', '']);
  });

  it('encenderlo NO borra nada', async () => {
    // La guarda `if (in_blnOn) return;`: encender es una acción de UI, no una de datos.
    await montar();
    const objRegistro = TestBed.inject(FileRegistryService);
    objHost.form.get(SCR000_ADJUNTO_KEYS[0])?.setValue('uno.pdf');
    objRegistro.registrar(SCR000_ADJUNTO_KEYS[0], new File(['x'], 'uno.pdf'));
    await asentar();

    seccion()['alternarAdjuntos'](true);
    await asentar();

    expect(objRegistro.intCantidad).toBe(1);
    expect(leer(SCR000_ADJUNTO_KEYS[0])).toBe('uno.pdf');
  });

  it('lee el booleano del `change` de `za-switch`, que viene en `detail`', async () => {
    // `za-switch` es un CVA nativo pero acá no se ata a ningún control (lo que viaja son las cinco
    // claves, no la decisión de mostrarlas), así que el único canal es este evento. Un `.checked` del
    // target daría `undefined` con el custom element sin upgrade.
    await montar();
    seccion()['alternarAdjuntos'](true);
    await asentar();

    seccion()['alCambiarSwitch'](new CustomEvent('change', { detail: false }));
    await asentar();

    expect(seccion()['blnAdjuntos']()).toBe(false);
  });
});

describe('mensajes de error', () => {
  it('sin intento de envío NO muestra ningún mensaje, aunque el campo esté inválido', async () => {
    // Sin esta guarda la sección abre en rojo: el form arranca vacío y `required` ya falla en el primer
    // render, antes de que el ciudadano haya escrito nada.
    await montar();
    objHost.form.get(QD.strComplaintText)?.setValue('');

    expect(seccion()['mensajeDeError'](QD.strComplaintText)).toBe('');
  });

  it('la queja corta sale por `minlength` con su mensaje propio', async () => {
    // Son dos reglas sobre el mismo campo (mínimo 50, máximo 2000), así que se resuelven por el tipo de
    // error y no por el mapa `DIC_MSG_PATRON`.
    await montar();
    objHost.blnIntentoEnvio.set(true);
    await escribir({ [QD.strComplaintText]: 'muy corta' });

    expect(seccion()['mensajeDeError'](QD.strComplaintText))
      .toBe('Describe la queja con al menos 50 caracteres');
  });

  it('la queja larguísima sale por `maxlength`', async () => {
    await montar();
    objHost.blnIntentoEnvio.set(true);
    await escribir({ [QD.strComplaintText]: 'x'.repeat(INT_MAX_TEXTO + 1) });

    expect(seccion()['mensajeDeError'](QD.strComplaintText)).toBe('Máximo 2000 caracteres');
  });

  it('la placa mal formada sale por `pattern` con el formato esperado', async () => {
    await montar();
    objHost.blnIntentoEnvio.set(true);
    await escribir({ [QD.strPlate]: 'AB12' });

    expect(seccion()['mensajeDeError'](QD.strPlate)).toBe('Formato esperado: ABC123');
  });

  it('un campo vacío sin patrón sale por el mensaje genérico de requerido', async () => {
    await montar();
    objHost.blnIntentoEnvio.set(true);
    await escribir({ [QD.strComplaintText]: '' });

    // `required` gana a `minlength`: un control vacío no reporta `minlength` en Angular.
    expect(seccion()['mensajeDeError'](QD.strComplaintText)).toBe('Campo requerido');
  });

  it('⚠ el mensaje DESAPARECE al corregir el campo, sin volver a enviar', async () => {
    // La razón del `void this.sigValores()()` de `mensajeDeError()`: `form.get().valid` no es un signal,
    // así que sin tocar el de valores el mensaje quedaría **pegado** en pantalla después de corregir —el
    // ciudadano vería un campo en rojo que ya está bien y no sabría qué más hacer—. Es la misma trampa
    // que en S2 y la que este caso fija.
    await montar();
    objHost.blnIntentoEnvio.set(true);
    await escribir({ [QD.strPlate]: 'AB12' });
    expect(seccion()['mensajeDeError'](QD.strPlate)).toBe('Formato esperado: ABC123');

    await escribir({ [QD.strPlate]: 'ABC123' });

    expect(seccion()['mensajeDeError'](QD.strPlate)).toBe('');
  });

  it('un campo que no existe en el form devuelve cadena vacía y no lanza', async () => {
    await montar();
    objHost.blnIntentoEnvio.set(true);

    expect(seccion()['mensajeDeError']('qd_strNoExiste')).toBe('');
  });
});

describe('el picker de producto', () => {
  it('el satélite traduce `código::etiqueta` al código puro del control real', async () => {
    // La colección 16 **repite códigos** (el 104 es "Garantía extendida" y "Copropiedades"), y el select
    // del DS indexa por `value`: con values crudos no podría distinguir cuál se eligió. El form guarda
    // el código puro, que es lo que viaja a PM4.
    await montarCascada();

    seccion()['objProductoUi'].setValue('9::Autos');
    await asentar();

    expect(leer(QD.strSfcProduct)).toBe('9');
    expect(leer(`${QD.strSfcProduct}_desc`)).toBe('Autos');
  });

  it('preselecciona el satélite desde el código + `_desc` que trae la precarga', async () => {
    // Sin esto el select saldría **vacío** aunque el dato esté: el picker indexa por el value de UI y la
    // precarga solo trae el código. El caso que lo destapa es un `task.data` de un caso en curso.
    await montarCascada();

    await escribir({ [QD.strSfcProduct]: '9', [`${QD.strSfcProduct}_desc`]: 'Autos' });

    expect(seccion()['objProductoUi'].value).toBe('9::Autos');
  });
});
