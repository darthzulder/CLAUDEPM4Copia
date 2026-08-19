import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CampoBase } from '../../../../components/fields/campo-base';
import { cllCamposDeLaFachada } from '../../../../components/fields/contrato-pantalla';
import { ZdsRadio } from '../../../../components/fields/zds-radio';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { QD, SCR009_DEFAULT_ENTITY_CODE, SCR009_DEFAULT_ENTITY_TYPE } from '../fields/fields';
import { FormularioSuperintendencia } from './formulario-superintendencia';
import { selloBogotaSfc } from './hoy-bogota';

/**
 * SCR-009 · Formulario Superintendencia — **un caso por RUL/ACT/MSG del anexo**, no un smoke.
 *
 * Hereda la infraestructura de los specs de pantalla anteriores (servicios reales +
 * `HttpTestingController` en vez de `vi.mock`, aserción sobre el `FormControl` **y** sobre lo que de
 * verdad llegó al hijo del DS, rótulos copiados del anexo y no de la plantilla,
 * `espiarNavegacionDelTope()` para que la redirección del borrador sea observable). Lo que **este**
 * archivo agrega:
 *
 * ── 1. El caso central es el bloqueo por opción de los dos radios de anexos ───────────────────────
 * Los radios de FLD-163/164 se pintan bloqueados pero sus valores **tienen que seguir viajando** a la
 * SFC y seguir alimentando el gate. React lo lograba con un `disabled` de grupo (atributo del DOM, que
 * no toca el valor de react-hook-form); acá va como `disabled` **en cada opción**. Hay tres casos sobre
 * esto: `options` bloqueadas, el valor en el payload y el gate vivo. El primero pone rojo el borrado
 * del `disabled` por opción (medido: es el único que cae).
 *
 * ⚠ **Lo que estos casos NO detectan, medido y no supuesto: agregar un `control.disable()`.** Se probó
 * como mutación —deshabilitar los dos controles de anexos en `vincular()`— y los 44 casos quedan
 * **verdes**. Las dos razones, las dos verificadas:
 *  - **No apaga el `disabled` por opción.** Son dos canales independientes: el estado del control viaja
 *    por el `setDisabledState` del CVA nativo de `za-radio-select` y nunca toca `[options]`, así que
 *    `cllOpcionesZa` sigue emitiendo `disabled: true` (ver la cabecera de `zds-radio.ts`, que documenta
 *    justamente que el DS no tiene input de `disabled` por opción y que el grupo se gobierna desde el
 *    control). O sea que el caso de las `options` no puede verlo.
 *  - **No vacía el payload ni rompe el gate**, aunque un control deshabilitado sí desaparezca de
 *    `form.value`: esta pantalla nunca lee `value`. El payload se arma con `getRawValue()` (ver
 *    `enviarCon()`) y el espejo `sigValores` que alimenta el gate, también.
 *
 * Y no es un agujero que haya que tapar con un caso más: un `disable()` acá **no produce un defecto**
 * —el bloqueo visual sigue, los flags siguen viajando—, es simplemente un segundo camino redundante
 * para lo que ya hace el `disabled` por opción. Lo que sí necesitaba caso propio es la línea que hace
 * que eso sea inofensivo: el `getRawValue()` del payload, que hasta escribir este archivo no estaba
 * cubierto (con `value` en su lugar, los 43 casos pasaban). Tiene el suyo más abajo.
 *
 * ── 2. El envío es de dos fases, y las dos mitades se aseveran ────────────────────────────────────
 * `solicitarEnvio()` NO envía: valida y abre el popup. Un caso comprueba que pulsar el botón con el
 * form incompleto **no** abre el popup y **no** dispara PUT (la guarda no puede vivir solo en el
 * `[disabled]`: bajo jsdom un componente del DS deshabilitado igual invoca su handler), y otro que la
 * confirmación es la que completa la tarea.
 *
 * ── 3. La precarga tiene tres garantías con consecuencia regulatoria ──────────────────────────────
 * `qd_strComplaintStatus` forzado a `'4'` (SCR-009 *es* el cierre), las dos fechas al mismo sello en
 * hora Colombia, y `qd_strFinalReplyAttach` a `'SI'`. Cada una tiene su caso: las tres se pierden sin
 * ruido si alguien "simplifica" el `patchValue`.
 *
 * ── 4. Los rótulos vienen del ANEXO, con sus divergencias declaradas ──────────────────────────────
 * Ver [`DIC_ROTULOS_CAMPOS`](#DIC_ROTULOS_CAMPOS) y [`CLL_ROTULOS_TEXTO`](#CLL_ROTULOS_TEXTO).
 */
const INT_TASK_ID = 9;
const INT_REQUEST_ID = 77;
const OBJ_ENV_VACIO = { strTaskId: '', strCaseId: '', strProcessId: '', strEventId: '', strToken: '' };

/** El literal que el BPM lee para enrutar el cierre. Duplicado a propósito: si el `.ts` lo cambia, avisa. */
const STR_ACCION_ENVIO = 'ENVIAR_SFC';

let objFixture: ComponentFixture<FormularioSuperintendencia>;
let objPantalla: FormularioSuperintendencia;
let objMock: HttpTestingController;

/**
 * Rótulos de los **campos de la fachada** (los que tienen `name`, o sea los que ve `cllCamposDs()`).
 *
 * ⚠ **Copiados de `insumos/Quejas directas/Anexo02_Index/screens/SCR-009.md`** (tabla "Campos de la
 * Pantalla", columna *Etiqueta*, sin el `* `/`◉ ` del obligatorio), **no** de la plantilla: un rótulo
 * aseverado contra sí mismo es una tautología, y en SCR-012 esa tautología dejó cinco rótulos
 * derivados en verde. Si esta tabla y el `.html` discrepan, **el que se corrige es el `.html`**.
 *
 * Los cuatro de fraude (FLD-159..162) no están acá: solo existen cuando `qd_strFraudRelated === 'SI'`,
 * así que se aseveran en el caso de RUL-009-01 y no en el conjunto que se compara al montar.
 *
 * ⚠ **Las tres divergencias con el anexo, portadas de React y anotadas en la ficha:**
 *  - **FLD-149 Producto Digital** y **FLD-156 Marcación**: el anexo los marca *"Back, solo lectura"* y
 *    el código los rinde como `zds-select` **editables**. Se portan como están (una migración de
 *    framework no cambia el comportamiento de la app desplegada) y por eso figuran acá como campos de
 *    la fachada en vez de como texto plano.
 *  - **FLD-140..145 y FLD-150** (Código SFC, Canal, Producto, Motivo, Admisión, Ente de Control, y
 *    Estado de la Queja) el anexo los declara de la pantalla; el código **no los pinta**. Para los
 *    seis primeros el propio anexo lo explica ("No se renderiza en SCR-009: viaja en el payload"),
 *    coherente con RUL-009-02. Estado de la Queja sí es divergencia: se fuerza a `'4'` y se oculta.
 *
 * FLD-140 (`qd_strSfcCode`) **sí** aparece como campo de la fachada, pero en S7 y con otro rótulo
 * ("Código SFC / Número de Radicado"), que es un agregado de la fusión de la ex SCR-010.
 *
 * ⚠ **FLD-163/164 no están en esta tabla, y no es un olvido:** son `zds-radio`, que extiende
 * [`CampoZaBase`](../../../../components/fields/campo-za-base.ts) —la jerarquía **paralela** de los
 * `za-*`, que no deriva de `CampoBase`—, así que `cllCamposDeLaFachada()` no los ve. Van en
 * [`DIC_ROTULOS_ZA`](#DIC_ROTULOS_ZA). Meterlos acá pondría en rojo el caso que compara el conjunto
 * completo contra la salida del helper, y el defecto estaría en la expectativa, no en la pantalla —
 * que es exactamente lo que pasó al escribir este archivo. Es la misma partición documentada en el
 * spec de la SCR-0052 para su `ZdsFileInput`.
 */
const DIC_ROTULOS_CAMPOS: Record<string, string> = {
  [QD.strSex]: 'Sexo', // FLD-146
  [QD.strLgbtiq]: 'LGBTIQ+', // FLD-147
  [QD.strSpecialCondition]: 'Condición Especial', // FLD-148
  [QD.strDigitalProduct]: 'Producto Digital', // FLD-149 · divergencia: el anexo lo quiere solo lectura
  [QD.strMarking]: 'Marcación', // FLD-156 · divergencia: idem
  // S6/S7 — de la fusión de la ex SCR-010; no tienen FLD en el anexo de SCR-009.
  [QD.strUpdateDate]: 'Fecha de Actualización',
  [QD.strClosureDate]: 'Fecha de Cierre',
  [QD.strSfcCode]: 'Código SFC / Número de Radicado',
};

/**
 * Los campos de la fachada que salen de `CampoZaBase` (los `za-*`), invisibles para
 * `cllCamposDeLaFachada()` por la razón del bloque de arriba. Acá son los dos radios de anexos.
 *
 * Se aseveran consultando el componente por su clase (`By.directive(ZdsRadio)`), que es la única forma
 * de alcanzarlos: no depende del filtro `instanceof CampoBase` del helper compartido.
 */
const DIC_ROTULOS_ZA: Record<string, string> = {
  [QD.strIncludesComplaintAnnex]: '¿Incluye Anexos a la Queja?', // FLD-163
  [QD.strIncludesReplyAttach]: '¿Incluye Adjunto Respuesta Final?', // FLD-164
};

/**
 * Rótulos que van como **texto plano** (`info-bar-label`), sin control detrás. No los ve
 * `cllCamposDs()`, así que se aseveran leyendo el DOM.
 *
 * Los seis de S3 salen del anexo (FLD-151..155/157). *¿Relacionada con Fraude?* es FLD-158, y
 * *Prórroga (Código)* es FLD-166 **con el rótulo de React**: el anexo dice *"Prórroga (días, si
 * aplica)"* con default `0` y React dice *"Prórroga (Código)"* con default `'1'` — dos contratos
 * distintos (días vs. código de catálogo). Se porta el de React y queda como divergencia en la ficha.
 *
 * Los tres de S7 (*Estado del envío*, *Intentos*, *Último error*) son de la fusión de la ex SCR-010.
 */
const CLL_ROTULOS_TEXTO: string[] = [
  'Favorabilidad', // FLD-151
  'Aceptación', // FLD-152
  'Rectificación', // FLD-153
  'Desistimiento', // FLD-154
  'Tutela', // FLD-155
  'Queja Exprés', // FLD-157
  '¿Relacionada con Fraude?', // FLD-158
  'PDF Respuesta Final (generado)', // FLD-165 · va por `app-request-file-list`, no es campo de la fachada
  'Prórroga (Código)', // FLD-166 · rótulo de React, NO del anexo. Ver arriba.
  'Estado del envío a SFC',
  'Intentos de envío',
];

/** Los seis títulos de sección que la pantalla monta, en el orden del anexo (S2..S7). */
const CLL_TITULOS_SECCION: string[] = [
  'Datos del Consumidor — Campos SFC', // S2 · SEC-029
  'Condición de la Queja', // S3 · SEC-030
  'Datos de Fraude CE-019-2024', // S4 · SEC-031
  'Anexos del Formulario', // S5 · SEC-032
  'Datos de Cierre Regulatorio', // S6 · ex SCR-010
  'Estado del Envío a SmartSupervision (SFC)', // S7 · ex SCR-010
];

/**
 * `task.data` del caso: cierre **sin** fraude y sin rechazo previo, o sea el camino normal. Los casos
 * que necesitan otra cosa lo pasan por parámetro a `montar()`.
 *
 * ⚠ `qd_strComplaintStatus` llega en `'2'` (Abierta, lo que dejó la radicación en SCR-000) **a
 * propósito**: es lo que hace que el caso del forzado a `'4'` pueda fallar. Con `'4'` de entrada, ese
 * caso pasaría sin que la precarga hiciera nada.
 *
 * Y las dos fechas llegan con un valor viejo distinguible por el mismo motivo: si llegaran vacías, un
 * `patchValue` que dejara de sellarlas se vería igual que uno que las sella.
 */
function datosTarea(): Record<string, unknown> {
  return {
    // S2
    [QD.strSex]: '3',
    [QD.strLgbtiq]: '2',
    [QD.strSpecialCondition]: '',
    [QD.strDigitalProduct]: '2',
    // S3
    [QD.strComplaintStatus]: '2',
    [QD.strFavorability]: '1',
    [QD.strAcceptance]: '1',
    [QD.strRectification]: '1',
    [QD.strWithdrawal]: '2',
    [QD.strTutela]: '2',
    [QD.strMarking]: '',
    [QD.strExpressComplaint]: '2',
    // S4 — sin fraude.
    [QD.strFraudRelated]: 'NO',
    // S5
    [QD.strIncludesComplaintAnnex]: 'SI',
    [QD.strIncludesReplyAttach]: 'SI',
    [QD.strSlaDaysProlognated]: '1',
    // S6/S7 — un sello viejo, para que el re-sellado sea observable.
    [QD.strUpdateDate]: '2020-01-01T00:00:00',
    [QD.strClosureDate]: '2020-01-01T00:00:00',
    [QD.strM3ClosureStatus]: 'Pendiente',
    [QD.strM3ClosureAttempts]: '0',
    [QD.strSfcCode]: 'SFC-2026-0009',
    // Ruido deliberado: `task.data` trae el caso entero y la pantalla solo copia lo que declara.
    qd_strCaseNumber: 'QD-2026-000456',
    qd_strComplaintText: 'Texto de la queja que esta pantalla no pinta.',
  };
}

function tarea(in_dicDatos: Record<string, unknown>): Record<string, unknown> {
  return { id: INT_TASK_ID, process_request_id: INT_REQUEST_ID, data: in_dicDatos };
}

function fijarQueryString(in_strQuery: string): void {
  window.history.replaceState({}, '', '/' + in_strQuery);
}

/**
 * ⚠ El orden importa y está medido: **`await whenStable()` por sí solo NO repinta** bajo
 * `provideZonelessChangeDetection()`. Sin el `detectChanges()` el template se queda en la rama
 * `@if (blnCargando())` para siempre y ningún campo existe.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

const INT_MAX_VUELTAS_DRENADO = 8;
const INT_VACIAS_PARA_CORTAR = 2;

/**
 * Consume los GET que la pantalla dispara por su cuenta —los **12** catálogos de la pantalla, más los
 * **2** de fraude que pide `SeccionFraudeAnexos`, más el listado de archivos del request— para que el
 * `objMock.verify()` del `afterEach` no falle por una petición legítima que ningún caso nombró.
 *
 * **Drena solo `GET`, y el filtro —no el orden de llamada— es lo que mantiene honestos a
 * `dicPayloadEnviado()` y `dicBorradorEnviado()`.** Los PUT son lo que esos helpers aseveran, así que
 * drenarlos acá los dejaría consumidos y devolverían `null`: el caso de "NO completa la tarea" pasaría
 * **igual que si la pantalla sí la hubiera completado**.
 *
 * Corta con DOS vueltas vacías seguidas y no con una: `ngOnInit` hace `await cargar()` y **después**
 * dispara los catálogos, así que nacen un microtask más tarde que el flush de la tarea. Cortar en la
 * primera cola vacía los dejaría colgados. Es el mismo motivo medido en SCR-0052.
 */
async function drenarPeticiones(): Promise<void> {
  let intVaciasSeguidas = 0;

  for (
    let intVuelta = 0;
    intVuelta < INT_MAX_VUELTAS_DRENADO && intVaciasSeguidas < INT_VACIAS_PARA_CORTAR;
    intVuelta++
  ) {
    await asentar();
    const cllPendientes = objMock.match((in_objReq) => in_objReq.method === 'GET');
    intVaciasSeguidas = cllPendientes.length === 0 ? intVaciasSeguidas + 1 : 0;
    for (const objPeticion of cllPendientes) {
      if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
    }
  }

  const cllQuedaron = objMock.match((in_objReq) => in_objReq.method === 'GET');
  if (cllQuedaron.length > 0) {
    throw new Error(
      `El drenado no convergió en ${INT_MAX_VUELTAS_DRENADO} vueltas: ` +
        cllQuedaron
          .map((in_objPet) => `${in_objPet.request.method} ${in_objPet.request.urlWithParams}`)
          .join(', '),
    );
  }
}

/**
 * Monta la pantalla con la tarea ya respondida. Las tres partes del orden son contrato:
 *
 * 1. `fijarQueryString` **antes** de `createComponent`, porque `ngOnInit` llama `cargar()` y ahí se
 *    lee el `task_id`.
 * 2. `detectChanges()` **entre** `createComponent` y el `expectOne`: bajo
 *    `provideZonelessChangeDetection()` **`createComponent()` por sí solo NO corre `ngOnInit`**.
 * 3. El `flush` **antes** del `await`, porque `precargar()` corre recién cuando `await cargar()`
 *    resuelve — y los catálogos recién después de eso (ver `drenarPeticiones`).
 */
async function montar(in_dicDatos: Record<string, unknown> = datosTarea()): Promise<void> {
  fijarQueryString(`?task_id=${INT_TASK_ID}`);
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
    ],
  });
  objFixture = TestBed.createComponent(FormularioSuperintendencia);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  objFixture.detectChanges();
  objMock
    .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
    .flush(tarea(in_dicDatos));
  await drenarPeticiones();
}

const INT_MAX_VUELTAS_DE_ESPERA = 12;

/**
 * Cuenta las peticiones de un método en cola **sin consumirlas**. El `match()` de
 * `HttpTestingController` **saca de la cola todo lo que su predicado acepta**, así que una sonda que
 * devolviera `true` dejaría a `dicPayloadEnviado()` mirando una cola vacía y reportando "la pantalla
 * no envió nada". Devolver siempre `false` es lo que la convierte en sonda y no en consumidor.
 */
function intEnCola(in_strMetodo: string): number {
  let intCuenta = 0;
  objMock.match((in_objReq) => {
    if (in_objReq.method === in_strMetodo) intCuenta++;
    return false;
  });
  return intCuenta;
}

/**
 * Asienta hasta que se cumpla `in_fnListo`, y **repinta una vez más cuando se cumple** (el efecto nace
 * detrás del `await` de `asentar()`, o sea después del `detectChanges()` que esa vuelta ya corrió).
 *
 * **No lanza si el efecto no aparece**, y es deliberado: hay casos donde *no debe* aparecer (el
 * borrador no completa la tarea; un form incompleto no abre el popup) y el que decide si esa ausencia
 * es un defecto es el caso, no el helper. Lo que el bucle garantiza es que cuando el caso mire, la
 * cadena de `await` ya terminó — o sea que un `null`/`0` significa "la pantalla no lo emitió" y no "lo
 * miré un microtask antes". Sin esto, los dos son indistinguibles y el caso pasa por el motivo
 * equivocado.
 */
async function asentarHastaQue(in_fnListo: () => boolean): Promise<void> {
  for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DE_ESPERA; intVuelta++) {
    await asentar();
    if (in_fnListo()) {
      objFixture.detectChanges();
      return;
    }
  }
}

/** Asienta hasta que haya una petición del método pedido en cola. Ver `asentarHastaQue()`. */
async function asentarHasta(in_strMetodo: string): Promise<void> {
  await asentarHastaQue(() => intEnCola(in_strMetodo) > 0);
}

/**
 * El `data` del PUT de **completado** (el envío a la SFC), o `null` si la pantalla no completó la
 * tarea. Consume el PUT, así que se llama una vez por caso.
 */
function dicPayloadEnviado(): Record<string, unknown> | null {
  const cllPuts = objMock.match(
    (in_objReq) => in_objReq.method === 'PUT' && in_objReq.url === `/api/tasks/${INT_TASK_ID}`,
  );
  if (cllPuts.length === 0) return null;
  const objCuerpo = cllPuts[0].request.body as { status: string; data: Record<string, unknown> };
  cllPuts[0].flush({});
  return objCuerpo.data;
}

/**
 * El `data` del PUT del **borrador** (ACT-009-02), o `null` si no se guardó. Va a
 * `/requests/{process_request_id}` y **no** lleva `status`: es la diferencia con el completado, y es lo
 * que hace que confundir las dos acciones no pueda pasar inadvertido.
 */
function dicBorradorEnviado(in_blnFallar = false): Record<string, unknown> | null {
  const cllPuts = objMock.match(
    (in_objReq) => in_objReq.method === 'PUT' && in_objReq.url === `/api/requests/${INT_REQUEST_ID}`,
  );
  if (cllPuts.length === 0) return null;
  const objCuerpo = cllPuts[0].request.body as { data: Record<string, unknown> };
  if (in_blnFallar) {
    cllPuts[0].flush({ message: 'PM4 rechazó el borrador' }, { status: 500, statusText: 'Error' });
  } else {
    cllPuts[0].flush({});
  }
  return objCuerpo.data;
}

/** Los wrappers `zds-*` de la fachada que la pantalla montó, deduplicados por el helper. */
function cllCamposDs(): CampoBase<string>[] {
  return cllCamposDeLaFachada<string>(objFixture);
}

/** El **wrapper** de un campo, buscado por su `name`. Los `input()` de la fachada se leen acá. */
function objCampo(in_strNombre: string): CampoBase<string> {
  const objEncontrado = cllCamposDs().find((in_objCampo) => in_objCampo.name() === in_strNombre);

  // Sin esta guarda, un campo que desapareciera del template fallaría con "Cannot read properties of
  // undefined", que se lee como error del test y no como el defecto que es.
  expect(objEncontrado, `la pantalla no montó el campo ${in_strNombre}`).toBeDefined();
  return objEncontrado!;
}

/**
 * Los dos wrappers `zds-radio` de anexos, indexados por su `name`. Van por `By.directive` y no por
 * `cllCamposDs()` porque `ZdsRadio` extiende `CampoZaBase`, que no es un `CampoBase` — ver
 * `DIC_ROTULOS_ZA`.
 */
function dicRadiosZa(): Record<string, ZdsRadio> {
  const dicRadios: Record<string, ZdsRadio> = {};
  for (const objNodo of objFixture.debugElement.queryAll(By.directive(ZdsRadio))) {
    const objRadio = objNodo.componentInstance as ZdsRadio;
    dicRadios[objRadio.name()] = objRadio;
  }
  return dicRadios;
}

/** Un `zds-radio` por su `name`, con la guarda que nombra el campo si no se montó. */
function objRadioZa(in_strNombre: string): ZdsRadio {
  const objRadio = dicRadiosZa()[in_strNombre];
  expect(objRadio, `la pantalla no montó el zds-radio ${in_strNombre}`).toBeDefined();
  return objRadio;
}

/**
 * El `za-radio-select` que un `zds-radio` renderiza adentro. Es donde se lee el `options` que de verdad
 * llegó al componente del DS, o sea el extremo lejano del mapeo `cllOpcionesZa`.
 *
 * No se reusa `objHijoDelDs()` porque su firma pide un `CampoBase<T>` y `ZdsRadio` no lo es; el
 * descubrimiento por posición es el mismo (el primer nodo debajo del wrapper que no sea el wrapper).
 *
 * El retorno se declara con la única propiedad que el spec le lee, en vez del `any` que devuelve
 * `objHijoDelDs()`: acá alcanza, y así el `disabled` por opción —que es *el* contrato que estos dos
 * radios tienen que cumplir— queda escrito en la firma y no en un cast del caso.
 *
 * ⚠ **`objRadioZa()` se resuelve UNA vez, antes del `query()`, y no adentro de su predicado.** El
 * predicado corre una vez por nodo del árbol, y `objRadioZa()` hace su propio `queryAll` completo más
 * un `expect`: llamarlo ahí adentro vuelve la búsqueda cuadrática sobre el árbol más grande del
 * archivo (6 secciones, 12 selects de catálogo y los sub-árboles del DS). No es teórico —así estaba
 * escrito— y el costo no se ve corriendo el spec solo: con la suite completa, los workers compitiendo
 * por CPU lo empujaban arriba de los 5000 ms y **este** caso era el único que se pasaba del timeout,
 * con un `Test timed out` que se lee como un cuelgue de la pantalla y no como lo que era, un helper
 * del spec. Medido: verde aislado, rojo en `npm run test`.
 */
function objHijoDelRadio(in_strNombre: string): { options: { value: string; disabled?: boolean }[] } {
  const objRadio = objRadioZa(in_strNombre);
  const objWrapper = objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance === objRadio,
  );
  const objHijo = objWrapper
    .queryAll((in_objNodo) => !!in_objNodo.componentInstance)
    .find((in_objNodo) => in_objNodo.componentInstance !== objWrapper.componentInstance);

  expect(objHijo, `el zds-radio ${in_strNombre} no renderizó su za-radio-select`).toBeDefined();
  return objHijo!.componentInstance;
}

/** El texto completo del fixture, para aseverar los valores que van como texto plano. */
function strTexto(): string {
  return (objFixture.nativeElement as HTMLElement).textContent ?? '';
}

/**
 * Texto del aviso de bloqueo (MSG-009-02), o `''` si no se pinta.
 *
 * ⚠ **Se lee el `za-alert` y no `strTexto()`.** El aviso nombra *"Condición Especial"* y *"datos de
 * fraude"*, pero **"Condición Especial" también es el rótulo del select de S2**, que está en pantalla
 * siempre. Aseverar esa frase sobre el texto completo del fixture pasaría con el aviso borrado — es la
 * misma tautología que en SCR-012 dejó cinco rótulos derivados en verde. Acotando la lectura al nodo
 * de la alerta, la aserción vuelve a poder fallar.
 *
 * Se filtra por `config="info"` **y** por ser hijo directo del `<form>`, y las dos mitades hacen falta:
 *  - `config="info"` descarta el `za-alert` de S7 (`config="negative"`, el rechazo por SFC) y el de
 *    error de carga, que comparten el selector de etiqueta.
 *  - `:scope > za-alert` descarta el de `app-request-file-list`, que **también** es `config="info"` y
 *    dice *"Aún no se ha generado el PDF de respuesta final."* — con `querySelector` sobre todo el
 *    fixture ganaba ése (está antes en el DOM) y los cuatro casos de MSG-009-02 medían el texto
 *    equivocado. Es lo que pasó al escribir este archivo: dos avisos informativos legítimos, y el
 *    selector amplio no distingue cuál.
 */
function strAvisoBloqueo(): string {
  const objForm = (objFixture.nativeElement as HTMLElement).querySelector('form');
  const objAlerta = objForm?.querySelector(':scope > za-alert[config="info"]');
  return objAlerta?.textContent ?? '';
}

/** Valor crudo de un control del form, como string. */
function strValor(in_strCampo: string): string {
  return String(objPantalla.form.get(in_strCampo)?.value ?? '');
}

/**
 * Suplanta `window.top` por un doble cuyo `location.href` es una propiedad **escribible**, y devuelve
 * un lector de lo último que se le asignó (`null` si nadie navegó) junto con el `restaurar()`.
 *
 * ⚠ **Por qué un doble y no leer `window.top.location.href` antes y después.** En jsdom el fixture
 * corre en el frame de arriba, así que `window.top === window`; y asignarle `location.href` **no
 * cambia el valor** —jsdom emite `Not implemented: navigation` y sigue—. O sea que un
 * `expect(href).toBe(hrefDeAntes)` pasa **igual haya navegado o no**: una aserción que no puede
 * fallar. Con la suplantación, el "SOLO si el guardado salió bien" se puede aseverar por sus dos
 * mitades. Medido en SCR-0052: sin esto, borrar el `if (!blnOk) return;` dejaba la suite entera verde.
 */
function espiarNavegacionDelTope(): { strDestino: () => string | null; restaurar: () => void } {
  let strAsignado: string | null = null;
  const objDoble = {
    location: {
      get href(): string {
        return strAsignado ?? '';
      },
      set href(in_strValor: string) {
        strAsignado = in_strValor;
      },
    },
  };
  const objDescriptorOriginal = Object.getOwnPropertyDescriptor(window, 'top');
  Object.defineProperty(window, 'top', { configurable: true, get: () => objDoble });

  return {
    strDestino: () => strAsignado,
    restaurar: () => {
      if (objDescriptorOriginal) Object.defineProperty(window, 'top', objDescriptorOriginal);
      else Reflect.deleteProperty(window, 'top');
    },
  };
}

/** Completa Condición Especial, que es el único obligatorio incondicional (FLD-148). */
async function completarCondEspecial(in_strCodigo = '1'): Promise<void> {
  objPantalla.form.get(QD.strSpecialCondition)!.setValue(in_strCodigo);
  await asentar();
}

/**
 * Deja el formulario en estado enviable y confirma el popup. Devuelve el payload del PUT.
 *
 * ⚠ **`confirmarEnvio()` va sin `await`, y no es descuido.** Su promesa recién se resuelve cuando el
 * PUT responde, y el que lo responde es el `asentarHasta('PUT')` de la línea siguiente: con el `await`
 * puesto, el caso se cuelga antes de llegar a flushear y el `HttpTestingController` queda con la
 * petición abierta. Eso es exactamente lo que pasó al escribir este archivo — un
 * `Test timed out in 5000ms` acá, y después `Expected no open requests, found 1: PUT /api/tasks/9`
 * en el `verify()` del `afterEach`, cuyo throw se come el `resetTestingModule()` de la línea de
 * abajo y cascadea `Cannot configure the test module…` a la veintena de casos siguientes. Mismo
 * patrón (y mismo motivo) que el `void objPantalla.enviar()` del spec de la SCR-0052.
 */
async function enviarConfirmando(): Promise<Record<string, unknown> | null> {
  await completarCondEspecial();
  objPantalla.solicitarEnvio();
  await asentar();
  void objPantalla.confirmarEnvio();
  await asentarHasta('PUT');
  return dicPayloadEnviado();
}

describe('SCR-009 · Formulario Superintendencia', () => {
  beforeEach(() => {
    // `scrollToFirstError` difiere el scroll en un `setTimeout(0)`, así que sin este stub el
    // `TypeError` de jsdom sale como **error no manejado** en vez de como fallo del caso — Vitest
    // reporta `Tests N passed` + `Errors 1`, que es fácil de leer como una suite verde.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    Element.prototype.scrollIntoView = () => {};
  });

  afterEach(() => {
    // Si la pantalla dispara una petición que ningún caso esperaba, el caso falla acá en vez de
    // pasar inadvertida. El `?` es load-bearing: un caso que falla antes de `montar()` deja
    // `objMock` sin asignar y el `verify()` taparía el fallo real con un TypeError.
    objMock?.verify();
    TestBed.resetTestingModule();
  });

  // ── Montaje y contrato de campos ────────────────────────────────────────────────────────────────

  it('monta las seis secciones del anexo (S2 a S7), en orden', async () => {
    await montar();

    const strContenido = strTexto();
    for (const strTitulo of CLL_TITULOS_SECCION) {
      expect(strContenido, `falta la sección "${strTitulo}"`).toContain(strTitulo);
    }

    // El orden también es contrato: es el del anexo, y una sección movida cambia la lectura del
    // formulario regulatorio. Se compara por posición del título en el texto.
    const cllPosiciones = CLL_TITULOS_SECCION.map((in_str) => strContenido.indexOf(in_str));
    expect(cllPosiciones).toEqual([...cllPosiciones].sort((in_a, in_b) => in_a - in_b));
  });

  it('monta los 8 campos `CampoBase` con los rótulos del anexo, y ninguno más', async () => {
    await montar();

    const dicMontados: Record<string, string> = {};
    for (const objCampoDs of cllCamposDs()) dicMontados[objCampoDs.name()] = objCampoDs.label();

    // Se compara el diccionario **completo** y no campo por campo: así un campo de más —uno que la
    // pantalla monte y el anexo no declare— también pone el caso rojo. Con `toContain` por campo, un
    // agregado silencioso pasaría.
    expect(dicMontados).toEqual(DIC_ROTULOS_CAMPOS);
  });

  it('monta los 2 radios `CampoZaBase` de anexos con los rótulos del anexo, y ninguno más', async () => {
    await montar();

    // Caso aparte del de arriba porque los radios son `CampoZaBase` y `cllCamposDs()` no los alcanza
    // (ver `DIC_ROTULOS_ZA`). Se asevera lo mismo —el input `label` del wrapper— y también en conjunto,
    // para que un radio de más quede rojo.
    const dicMontados: Record<string, string> = {};
    for (const [strNombre, objRadio] of Object.entries(dicRadiosZa())) {
      dicMontados[strNombre] = objRadio.label();
    }

    expect(dicMontados).toEqual(DIC_ROTULOS_ZA);
  });

  it('los 10 campos del form (las dos jerarquías juntas) precargan desde task.data', async () => {
    await montar();

    // Los dos grupos juntos: la precarga es del `FormGroup`, y ahí un `za-*` es un control como
    // cualquier otro. La partición `CampoBase`/`CampoZaBase` solo importa al consultar el DOM.
    for (const strCampo of [...Object.keys(DIC_ROTULOS_CAMPOS), ...Object.keys(DIC_ROTULOS_ZA)]) {
      expect(objPantalla.form.get(strCampo), `falta el control ${strCampo}`).not.toBeNull();
    }
    expect(strValor(QD.strIncludesComplaintAnnex)).toBe('SI');
    expect(strValor(QD.strIncludesReplyAttach)).toBe('SI');
  });

  it('monta los valores de solo lectura con sus rótulos, como texto plano', async () => {
    await montar();

    const strContenido = strTexto();
    for (const strRotulo of CLL_ROTULOS_TEXTO) {
      expect(strContenido, `falta el rótulo de solo lectura "${strRotulo}"`).toContain(strRotulo);
    }
  });

  it('⚠ Estado de la Queja no se pinta, aunque el anexo lo declare (FLD-150)', async () => {
    await montar();

    // Divergencia declarada: SCR-009 *es* el cierre, así que el estado se fuerza y no se ofrece. El
    // caso existe para que volver a pintarlo sea una decisión y no un descuido; el valor sí viaja
    // (ver el caso del payload).
    expect(strTexto()).not.toContain('Estado de la Queja');
    expect(cllCamposDs().some((in_objC) => in_objC.name() === QD.strComplaintStatus)).toBe(false);
  });

  // ── La precarga y sus tres garantías ────────────────────────────────────────────────────────────

  it('precarga desde task.data y descarta las claves que el form no declara (RUL-009-02)', async () => {
    await montar();

    expect(strValor(QD.strSex)).toBe('3');
    expect(strValor(QD.strLgbtiq)).toBe('2');
    expect(strValor(QD.strFavorability)).toBe('1');
    expect(strValor(QD.strSfcCode)).toBe('SFC-2026-0009');

    // El ruido de `task.data` no crea controles: el form declara exactamente `SCR009_DEFAULTS`.
    expect(objPantalla.form.get('qd_strCaseNumber')).toBeNull();
    expect(objPantalla.form.get('qd_strComplaintText')).toBeNull();
  });

  it('⚠ fuerza Estado de la Queja a "4" (Cerrada) pisando el "2" que trae el caso', async () => {
    await montar();

    // La entrada es `'2'` (Abierta). Sin el forzado, la SFC recibiría el cierre marcado como abierto.
    expect(strValor(QD.strComplaintStatus)).toBe('4');
  });

  it('⚠ sella Fecha de Actualización y Fecha de Cierre con el MISMO instante, en hora Colombia', async () => {
    await montar();

    const strActualizacion = strValor(QD.strUpdateDate);
    const strCierre = strValor(QD.strClosureDate);

    // 1. Pisó el sello viejo que traía el caso.
    expect(strActualizacion).not.toBe('2020-01-01T00:00:00');
    // 2. Son idénticas: es una sola llamada a `selloBogotaSfc()`, no dos. Dos llamadas podrían caer en
    //    segundos distintos y la SFC recibiría un cierre "anterior" a su propia actualización.
    expect(strCierre).toBe(strActualizacion);
    // 3. Tienen el formato de la SFC. No se compara contra un instante fijo —sería aseverar el
    //    reloj—; el valor exacto lo cubre `hoy-bogota.spec.ts`.
    expect(strActualizacion).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    // 4. Y el sello es el de HOY en Bogotá, o sea que la precarga usa esta función y no `toISOString`.
    //    Se compara solo la fecha: el segundo puede haber avanzado entre el montaje y esta línea.
    expect(strActualizacion.slice(0, 10)).toBe(selloBogotaSfc().slice(0, 10));
  });

  it('las dos fechas de cierre se pintan como solo lectura', async () => {
    await montar();

    // Son campos del form (viajan en el payload) pero el gestor no las puede tocar: las calcula la
    // precarga. Si dejaran de ser `readOnly`, un gestor podría mandar a la SFC una fecha inventada.
    expect(objCampo(QD.strUpdateDate).readOnly()).toBe(true);
    expect(objCampo(QD.strClosureDate).readOnly()).toBe(true);
    expect(objCampo(QD.strSfcCode).readOnly()).toBe(true);
  });

  it('inyecta tipo y código de entidad por defecto cuando el caso no los trae', async () => {
    await montar();

    expect(strValor(QD.strEntityType)).toBe(SCR009_DEFAULT_ENTITY_TYPE);
    expect(strValor(QD.strEntityCode)).toBe(SCR009_DEFAULT_ENTITY_CODE);
  });

  it('respeta el tipo y código de entidad que YA vienen del back', async () => {
    // La otra mitad del caso anterior: el default es un relleno, no un pisado. Sin este caso, un
    // `patchValue` que escribiera el default **siempre** pasaría igual.
    await montar({ ...datosTarea(), [QD.strEntityType]: '9', [QD.strEntityCode]: 'XX-99' });

    expect(strValor(QD.strEntityType)).toBe('9');
    expect(strValor(QD.strEntityCode)).toBe('XX-99');
  });

  it('fuerza el adjunto de respuesta final a "SI" incluso si el caso lo trae vacío', async () => {
    // El PDF lo genera el proceso (SP2-T06), así que el flag no es una decisión del gestor.
    await montar({ ...datosTarea(), [QD.strFinalReplyAttach]: '' });

    expect(strValor(QD.strFinalReplyAttach)).toBe('SI');
  });

  // ── RUL-009-01 · el gate de fraude ──────────────────────────────────────────────────────────────

  it('RUL-009-01 · sin fraude, los cuatro campos de fraude NO se pintan y no bloquean', async () => {
    await montar();

    expect(strTexto()).toContain('¿Relacionada con Fraude?');
    // La rama `@if (blnEsFraude())` cerrada: los cuatro campos no existen en el DOM.
    const cllNombres = cllCamposDs().map((in_objC) => in_objC.name());
    expect(cllNombres).not.toContain(QD.strFraudType);
    expect(cllNombres).not.toContain(QD.strFraudModality);
    expect(cllNombres).not.toContain(QD.strClaimedAmount);
    expect(cllNombres).not.toContain(QD.strAcknowledgedAmount);

    // Y no bloquean: con Condición Especial completa alcanza para enviar.
    await completarCondEspecial();
    expect(objPantalla.blnPuedeEnviar()).toBe(true);
  });

  it('RUL-009-01 · con fraude = SI, aparecen los cuatro campos y son obligatorios', async () => {
    await montar({ ...datosTarea(), [QD.strFraudRelated]: 'SI' });
    await completarCondEspecial();

    // Los cuatro se pintan, con los rótulos del anexo (FLD-159..162).
    expect(objCampo(QD.strFraudType).label()).toBe('Tipo de Fraude');
    expect(objCampo(QD.strFraudModality).label()).toBe('Modalidad de Fraude');
    expect(objCampo(QD.strClaimedAmount).label()).toBe('Monto Reclamado (COP)');
    expect(objCampo(QD.strAcknowledgedAmount).label()).toBe('Monto Reconocido (COP)');

    // Y bloquean el envío mientras estén vacíos, aunque Condición Especial esté completa.
    expect(objPantalla.blnPuedeEnviar()).toBe(false);
  });

  it('RUL-009-01 · el gate se libera recién con los CUATRO campos de fraude completos', async () => {
    await montar({ ...datosTarea(), [QD.strFraudRelated]: 'SI' });
    await completarCondEspecial();

    // Se completan de a uno para que un gate escrito con `||` en vez de `&&` se ponga rojo: con
    // "alguno completo" bastaría el primero y los tres `false` intermedios no existirían.
    const cllCampos = [
      QD.strFraudType,
      QD.strFraudModality,
      QD.strClaimedAmount,
      QD.strAcknowledgedAmount,
    ];
    for (const strCampo of cllCampos.slice(0, 3)) {
      objPantalla.form.get(strCampo)!.setValue('1');
      await asentar();
      expect(objPantalla.blnPuedeEnviar(), `no debería habilitarse tras ${strCampo}`).toBe(false);
    }

    objPantalla.form.get(QD.strAcknowledgedAmount)!.setValue('1000');
    await asentar();
    expect(objPantalla.blnPuedeEnviar()).toBe(true);
  });

  it('RUL-009-01 · un monto en blancos no cuenta como completo', async () => {
    await montar({ ...datosTarea(), [QD.strFraudRelated]: 'SI' });
    await completarCondEspecial();
    for (const strCampo of [QD.strFraudType, QD.strFraudModality, QD.strClaimedAmount]) {
      objPantalla.form.get(strCampo)!.setValue('1');
    }
    // El `.trim()` del gate: sin él, un espacio pasaría por completo y la SFC recibiría un monto vacío.
    objPantalla.form.get(QD.strAcknowledgedAmount)!.setValue('   ');
    await asentar();

    expect(objPantalla.blnPuedeEnviar()).toBe(false);
  });

  // ── MSG-009-02 / RUL-009-03 · el bloqueo por campos SFC incompletos ─────────────────────────────

  it('MSG-009-02 · con Condición Especial vacía, el gate bloquea y se pinta el aviso', async () => {
    await montar();

    expect(objPantalla.blnPuedeEnviar()).toBe(false);
    expect(strAvisoBloqueo()).toContain('Condición Especial');
    expect(strAvisoBloqueo()).toContain('antes de enviar');
  });

  it('MSG-009-02 · el aviso desaparece cuando el formulario queda completo', async () => {
    await montar();
    await completarCondEspecial();

    // La otra mitad: un aviso que se pintara siempre pasaría el caso de arriba igual.
    expect(objPantalla.blnPuedeEnviar()).toBe(true);
    expect(strAvisoBloqueo()).toBe('');
  });

  it('MSG-009-02 · el aviso menciona los datos de fraude solo cuando aplica', async () => {
    await montar({ ...datosTarea(), [QD.strFraudRelated]: 'SI' });

    expect(strAvisoBloqueo()).toContain('datos de fraude');
  });

  it('MSG-009-02 · sin fraude, el aviso NO menciona los datos de fraude', async () => {
    await montar();

    // El `@if (blnEsFraude())` **dentro** del texto de la alerta: sin él, el aviso pediría completar
    // datos de fraude en todo caso sin fraude, donde esos campos ni se pintan.
    expect(strAvisoBloqueo()).not.toContain('datos de fraude');
  });

  it('el error de Condición Especial no se pinta hasta el primer intento de envío', async () => {
    await montar();

    // Equivalente del `isSubmitted` de RHF: un formulario recién abierto no se pinta en rojo.
    expect(objPantalla.strErrorCondEspecial()).toBe('');
    expect(objCampo(QD.strSpecialCondition).error()).toBe('');

    objPantalla.solicitarEnvio();
    await asentar();

    expect(objPantalla.strErrorCondEspecial()).toBe('Campo requerido');
    expect(objCampo(QD.strSpecialCondition).error()).toBe('Campo requerido');
  });

  it('el error se limpia al completar el campo, ya con el intento hecho', async () => {
    await montar();
    objPantalla.solicitarEnvio();
    await asentar();
    await completarCondEspecial();

    // Sin esto, un `strErrorCondEspecial` que devolviera el mensaje fijo tras el primer intento
    // pasaría el caso de arriba y dejaría el campo en rojo para siempre.
    expect(objPantalla.strErrorCondEspecial()).toBe('');
  });

  // ── ⚠ Los dos radios de anexos: bloqueados por opción, valores vivos ────────────────────────────

  it('⚠ los dos radios de anexos llegan con sus opciones DESHABILITADAS (paridad con el disabled de React)', async () => {
    await montar();

    // Se lee el `options` que efectivamente llegó al `za-radio-select`, no el que la sección le pasó
    // al wrapper: el `cllOpcionesZa` de `zds-radio` es quien podría descartar el `disabled` al mapear
    // (`text ?? label ?? value` + `disabled`), y ahí es donde el bloqueo se perdería sin ruido.
    for (const strCampo of [QD.strIncludesComplaintAnnex, QD.strIncludesReplyAttach]) {
      const cllOpciones = objHijoDelRadio(strCampo).options;

      expect(cllOpciones.length, `${strCampo} sin opciones`).toBeGreaterThan(0);
      expect(
        cllOpciones.every((in_objOp) => in_objOp.disabled === true),
        `${strCampo} tiene opciones habilitadas: ${JSON.stringify(cllOpciones)}`,
      ).toBe(true);
    }
  });

  it('⚠ pese al bloqueo, los dos flags de anexos SIGUEN en el payload que va a la SFC', async () => {
    await montar();

    // Que los dos flags viajen es el punto del bloqueo por opción: el anexo los declara obligatorios,
    // así que la SFC los tiene que recibir aunque el gestor no pueda tocarlos.
    //
    // ⚠ **Este caso NO pone rojo un `control.disable()` por sí solo, y conviene no creer que sí.** Un
    // control deshabilitado desaparece de `form.value`, pero esta pantalla arma el payload con
    // `getRawValue()`, así que los flags salen igual. Medido: con el `disable()` puesto y
    // `getRawValue()` en su lugar, este caso queda **verde**. Lo que sí lo pone rojo es la
    // combinación —`disable()` **más** `value`— y de la mitad `getRawValue()` se ocupa su propio caso,
    // más abajo.
    const dicPayload = await enviarConfirmando();

    expect(dicPayload?.[QD.strIncludesComplaintAnnex]).toBe('SI');
    expect(dicPayload?.[QD.strIncludesReplyAttach]).toBe('SI');
  });

  it('⚠ y el gate sigue mirando los dos flags: si llegaran vacíos, no se puede enviar', async () => {
    // La tercera pata del trío: el gate bloquea cuando el back de verdad mandó un flag vacío, que es
    // el único caso en que debe bloquear. Igual que el caso de arriba, un `control.disable()` no lo
    // rompería —el espejo `sigValores` que alimenta el gate también lee `getRawValue()`— y por eso el
    // trío se apoya en el `disabled` por opción y no en el estado del control.
    await montar({ ...datosTarea(), [QD.strIncludesReplyAttach]: '' });
    await completarCondEspecial();

    expect(objPantalla.blnAnexosCompletos()).toBe(false);
    expect(objPantalla.blnPuedeEnviar()).toBe(false);
  });

  it('los dos radios siguen siendo controles del form, no texto plano', async () => {
    await montar();

    // Guarda del camino elegido: si alguien los reemplazara por un `info-bar-value` ("total, están
    // bloqueados"), los valores dejarían de viajar y el caso del payload sería el único en rojo, con
    // un mensaje que no apunta acá.
    const cllRadios = objFixture.debugElement.queryAll(By.directive(ZdsRadio));
    expect(cllRadios).toHaveLength(2);
  });

  // ── El envío de dos fases (ACT-009-03, el que el anexo no declara) ──────────────────────────────

  it('solicitarEnvio() con el form incompleto NO abre el popup ni dispara nada', async () => {
    await montar();

    objPantalla.solicitarEnvio();
    await asentar();

    // ⚠ La guarda tiene que estar en el método y no solo en el `[disabled]` del botón: bajo jsdom un
    // componente del DS deshabilitado **igual invoca su handler** (trampa 1 de
    // `testing-conventions.md`), así que sin el corte se podría abrir el popup —y enviar desde ahí—
    // con el formulario incompleto.
    expect(objPantalla.blnMostrarConfirmacion()).toBe(false);
    expect(intEnCola('PUT')).toBe(0);
  });

  it('solicitarEnvio() con el form completo abre el popup y TODAVÍA no envía', async () => {
    await montar();
    await completarCondEspecial();

    objPantalla.solicitarEnvio();
    await asentar();

    expect(objPantalla.blnMostrarConfirmacion()).toBe(true);
    // La mitad que importa: el envío cierra el caso, así que abrir el popup no puede enviar.
    expect(intEnCola('PUT')).toBe(0);
  });

  it('el popup abierto muestra su texto de confirmación', async () => {
    await montar();
    await completarCondEspecial();
    objPantalla.solicitarEnvio();
    await asentar();

    // El `@if` va **dentro** del slot `libZTemplate` y el modal monta siempre; si estuviera al revés
    // el modal abriría vacío y este caso lo nombraría.
    expect(strTexto()).toContain('Confirmar envío a SmartSupervision');
    expect(strTexto()).toContain('cerrado');
  });

  it('"Atrás" del popup cierra sin enviar', async () => {
    await montar();
    await completarCondEspecial();
    objPantalla.solicitarEnvio();
    await asentar();

    objPantalla.cerrarConfirmacion();
    await asentar();

    expect(objPantalla.blnMostrarConfirmacion()).toBe(false);
    expect(intEnCola('PUT')).toBe(0);
  });

  it('confirmar el popup completa la tarea con qd_strAction = ENVIAR_SFC', async () => {
    await montar();

    const dicPayload = await enviarConfirmando();

    expect(dicPayload).not.toBeNull();
    // El literal es contrato con el BPM: es lo que enruta el cierre regulatorio.
    expect(dicPayload?.[QD.strAction]).toBe(STR_ACCION_ENVIO);
    // Y cierra el popup, para que un segundo click no reenvíe.
    expect(objPantalla.blnMostrarConfirmacion()).toBe(false);
  });

  it('el payload del envío lleva TODAS las claves del caso, no solo las editables', async () => {
    await montar();

    const dicPayload = await enviarConfirmando();

    // El `reset()` de React devolvía el estado entero. Un control que faltara en el `FormGroup` se
    // perdería en el camino y la SFC recibiría el cierre sin ese dato.
    expect(dicPayload?.[QD.strComplaintStatus]).toBe('4');
    expect(dicPayload?.[QD.strFavorability]).toBe('1');
    expect(dicPayload?.[QD.strSfcCode]).toBe('SFC-2026-0009');
    expect(dicPayload?.[QD.strEntityType]).toBe(SCR009_DEFAULT_ENTITY_TYPE);
    expect(dicPayload?.[QD.strUpdateDate]).toBe(strValor(QD.strUpdateDate));
  });

  it('⚠ el payload se arma con `getRawValue()`: un control deshabilitado igual viaja a la SFC', async () => {
    await montar();

    // **El caso existe porque la precaución no se ejercitaba sola.** `enviarCon()` lee
    // `getRawValue()` y no `value` por la regla del proyecto (un control deshabilitado desaparece de
    // `value`), pero hoy **ninguna** pantalla-SCR-009 deshabilita nada, así que las dos lecturas
    // devuelven lo mismo y cambiar una por la otra dejaba los 43 casos verdes — medido como mutación
    // al escribir este archivo. Deshabilitar el control acá crea la única condición en la que las dos
    // difieren, y así la línea queda cubierta por su consecuencia y no por su forma.
    //
    // No es hipotético: el camino natural para "bloquear" los radios de anexos (FLD-163/164) es un
    // `control.disable()`, y es **esta** línea la que hace que tomarlo sea inofensivo. Medido: con el
    // `disable()` puesto y `getRawValue()` en su lugar, los flags siguen viajando; con el `disable()`
    // puesto y `value`, salen vacíos hacia el regulador y nada más en el archivo lo nota.
    objPantalla.form.get(QD.strIncludesComplaintAnnex)!.disable();
    await asentar();
    expect(
      objPantalla.form.value[QD.strIncludesComplaintAnnex],
      'premisa del caso: un control deshabilitado NO está en `value`',
    ).toBeUndefined();

    const dicPayload = await enviarConfirmando();

    expect(dicPayload?.[QD.strIncludesComplaintAnnex]).toBe('SI');
  });

  // ── ACT-009-02 · Guardar Borrador ───────────────────────────────────────────────────────────────

  it('ACT-009-02 · guarda el borrador sobre el request, sin completar la tarea', async () => {
    await montar();
    const objEspia = espiarNavegacionDelTope();

    try {
      // ⚠ **La promesa se espera DENTRO del `try`, y no es cosmético.** `guardarBorrador()` escribe
      // `window.top.location.href` detrás de su último `await`, o sea después de que el caso
      // devolvió el control. Con un `void` suelto ese `href` cae cuando el `finally` ya restauró el
      // `window.top` real, y jsdom lo reporta como `Not implemented: navigation` **fuera** del caso:
      // un error no manejado que Vitest cuenta aparte y deja la suite en `Tests 43 passed` +
      // `Errors 2`, fácil de leer como verde. Es lo que pasó al escribir este archivo.
      const objPromesa = objPantalla.guardarBorrador();
      await asentarHasta('PUT');
      const dicBorrador = dicBorradorEnviado();
      await objPromesa;

      expect(dicBorrador?.[QD.strAction]).toBe('GUARDAR_BORRADOR');
      // Un borrador NO completa la tarea: el PUT va a `/requests/{id}`, no a `/tasks/{id}`.
      expect(dicPayloadEnviado()).toBeNull();
    } finally {
      objEspia.restaurar();
    }
  });

  it('ACT-009-02 · el borrador se guarda aunque el formulario esté incompleto', async () => {
    await montar();
    const objEspia = espiarNavegacionDelTope();

    try {
      // Condición Especial está vacía y el gate bloquea el envío; el borrador es "Siempre" según el
      // anexo. Si el borrador compartiera el gate del envío, el gestor perdería lo escrito.
      expect(objPantalla.blnPuedeEnviar()).toBe(false);

      // El `await` de la promesa, por el motivo del caso anterior: el `href` se escribe después.
      const objPromesa = objPantalla.guardarBorrador();
      await asentarHasta('PUT');
      const dicBorrador = dicBorradorEnviado();
      await objPromesa;

      expect(dicBorrador).not.toBeNull();
    } finally {
      objEspia.restaurar();
    }
  });

  it('ACT-009-02 · tras guardar bien, devuelve el frame superior a la bandeja', async () => {
    await montar();
    const objEspia = espiarNavegacionDelTope();

    try {
      const objPromesa = objPantalla.guardarBorrador();
      await asentarHasta('PUT');
      dicBorradorEnviado();
      await objPromesa;

      expect(objEspia.strDestino()).toContain('/tasks');
    } finally {
      objEspia.restaurar();
    }
  });

  it('⚠ ACT-009-02 · si el guardado FALLA, no redirige (perdería lo escrito sin avisar)', async () => {
    await montar();
    const objEspia = espiarNavegacionDelTope();

    try {
      const objPromesa = objPantalla.guardarBorrador();
      await asentarHasta('PUT');
      dicBorradorEnviado(true); // 500
      await objPromesa;

      // Medido en SCR-0052: sin `espiarNavegacionDelTope()` esta aserción no podía fallar, porque
      // jsdom ignora la escritura de `location.href` y el `href` leído era el mismo en los dos casos.
      expect(objEspia.strDestino()).toBeNull();
    } finally {
      objEspia.restaurar();
    }
  });

  // ── S7 · el estado del envío a la SFC (fusión de la ex SCR-010) ─────────────────────────────────

  it('S7 · muestra "Pendiente" y 0 intentos en un caso que nunca se envió', async () => {
    await montar();

    expect(strTexto()).toContain('Pendiente');
    expect(strTexto()).not.toContain('Último error registrado');
    expect(strTexto()).not.toContain('Envío rechazado por SFC');
  });

  it('S7 · con estado "Rechazado (400)" pinta la alerta y el último error', async () => {
    await montar({
      ...datosTarea(),
      [QD.strM3ClosureStatus]: 'Rechazado (400)',
      [QD.strM3ClosureAttempts]: '3',
      [QD.strLastError]: 'campo motivo_sfc inválido',
    });

    expect(strTexto()).toContain('Rechazado (400)');
    expect(strTexto()).toContain('Envío rechazado por SFC');
    expect(strTexto()).toContain('campo motivo_sfc inválido');
    expect(strTexto()).toContain('3');
  });

  it('S7 · el rótulo del botón de envío cambia a "Reenviar" cuando la SFC rechazó', async () => {
    await montar({ ...datosTarea(), [QD.strM3ClosureStatus]: 'Rechazado (400)' });

    expect(objPantalla.blnRechazado()).toBe(true);
    expect(objPantalla.strRotuloEnviar()).toBe('Reenviar Cierre (corrección) ▶');
    expect(strTexto()).toContain('Reenviar Cierre (corrección)');
  });

  it('S7 · con el estado normal, el rótulo es el de envío por primera vez', async () => {
    await montar();

    // La otra mitad: un rótulo fijo pasaría el caso de arriba o este, pero no los dos.
    expect(objPantalla.blnRechazado()).toBe(false);
    expect(objPantalla.strRotuloEnviar()).toBe('Enviar a SmartSupervision ▶');
  });

  it('⚠ S7 · el rechazo se compara contra el literal exacto, no por "contiene 400"', async () => {
    // `'Aceptado (200)'` y `'Rechazado (400)'` son los literales que escribe el back. Un estado que
    // solo se parezca no es un rechazo, y un `includes('400')` lo trataría como tal.
    await montar({ ...datosTarea(), [QD.strM3ClosureStatus]: 'Reintentando (400 previo)' });

    expect(objPantalla.blnRechazado()).toBe(false);
    expect(strTexto()).not.toContain('Envío rechazado por SFC');
  });

  // ── Estados de carga y error ────────────────────────────────────────────────────────────────────

  it('muestra el error de PM4 en vez del formulario si la tarea no carga', async () => {
    fijarQueryString(`?task_id=${INT_TASK_ID}`);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
      ],
    });
    objFixture = TestBed.createComponent(FormularioSuperintendencia);
    objPantalla = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);
    objFixture.detectChanges();
    objMock
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush({ message: 'Tarea no encontrada' }, { status: 404, statusText: 'Not Found' });
    await asentarHastaQue(() => objPantalla.strError() !== '');

    // ⚠ Los 12 catálogos se piden **igual** cuando la tarea falla, y hay que drenarlos acá.
    // No es un descuido de la pantalla: los dispara el `effect()` de montaje, que no depende del
    // `await cargar()`, así que ya están en vuelo cuando llega el 404. Sin este drenado quedan 12 GET
    // sin responder y el `verify()` del `afterEach` pone **este** caso en rojo por una petición
    // legítima — que es lo que pasó al escribir el archivo. Nótese que es lo contrario de lo que
    // hace el spec de la SCR-003: allá los catálogos nacen después de que la tarea resuelve, así que
    // en la rama de error nunca se piden y su caso equivalente no drena nada.
    await drenarPeticiones();

    expect(strTexto()).toContain('Error al cargar el formulario');
    // Y no monta el formulario: enviar un cierre regulatorio sin los datos del caso sería peor que
    // no mostrar nada.
    expect(cllCamposDs()).toHaveLength(0);
  });
});
