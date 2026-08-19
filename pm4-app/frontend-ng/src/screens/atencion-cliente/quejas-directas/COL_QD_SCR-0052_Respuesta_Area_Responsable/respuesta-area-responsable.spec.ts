import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CampoBase } from '../../../../components/fields/campo-base';
import {
  aseverarContratoDeCampos,
  cllCamposDeLaFachada,
  objHijoDelDs,
} from '../../../../components/fields/contrato-pantalla';
import { ZdsFileInput } from '../../../../components/fields/zds-file-input';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { QD } from '../fields/fields';
import type { AsignacionHistorial, RespuestaAyuda } from '../fields/types';
import { RespuestaAreaResponsable } from './respuesta-area-responsable';

/**
 * SCR-0052 · Respuesta del Área Responsable — **un caso por RUL/ACT del anexo**, no un smoke.
 *
 * Hereda el método de los specs de pantalla anteriores (servicios reales + `HttpTestingController` en
 * vez de `vi.mock`, aserción sobre el `FormControl` y sobre el `model` del hijo del DS —el puente del
 * punto 2b de SCR-008—, rótulos copiados del anexo y no de la plantilla). Lo que **este** archivo
 * agrega, y el porqué de cada cosa:
 *
 * ── 1. La escritura destructiva sobre el request padre es el caso central ─────────────────────────
 * Esta pantalla corre dentro de un subproceso, así que arranca con un *snapshot* de las variables del
 * padre y tiene que escribir dentro de un array que vive allá. El defecto que hay que impedir no es un
 * dato viejo: es **borrar la fila de ayuda que otro usuario agregó** mientras el ayudante redactaba.
 * Por eso hay tres casos sobre `registrarRespuesta()`:
 *   a. la relectura **gana** sobre el snapshot (fila nueva del padre sobrevive al envío),
 *   b. la fila que se responde **conserva** los cuatro campos que escribió SCR-005 (`fecha`, `de`,
 *      `motivo`, `observaciones`) — o sea que el spread no se puede reemplazar por un objeto nuevo,
 *   c. si la relectura falla, se **degrada** al snapshot en vez de perder la respuesta.
 * En React esto vivía inline dentro del submit y **no tenía ni un test**.
 *
 * ── 2. El índice 1-based tiene su caso, y el `-1` también ─────────────────────────────────────────
 * `qd_intHelpNumber` es 1-based y `qd_lstAssignHistory` es 0-based. Un off-by-one acá no rompe nada
 * visible: responde la ayuda equivocada. Y con `qd_intHelpNumber` ausente el índice queda en `-1`, que
 * es el caso donde `cll[-1] = obj` crearía una propiedad `"-1"` que no es un elemento del array y que
 * el Analista SAC nunca vería — por eso el `push` tiene su propio caso.
 *
 * ── 3. `GUARDAR_BORRADOR` se prueba por lo que NO hace ────────────────────────────────────────────
 * Un borrador no es una respuesta. El caso asevera que el PUT del borrador **no** trae las dos listas
 * del historial: escribir `respondio: 'si'` al guardar dejaría al Analista SAC viendo una ayuda
 * respondida con un comentario a medio escribir, y el BPM podría avanzar sobre eso.
 *
 * ── 4. El drenado corta con DOS vueltas vacías seguidas, no con una ───────────────────────────────
 * `ngOnInit` hace `await this.objTareas.cargar()` y **después** dispara los cuatro catálogos, así que
 * nacen un microtask más tarde que el flush de la tarea: la traza medida es `v0=0 v1=4 v2=0`. Un bucle
 * que cortara en la primera cola vacía dejaría las cuatro peticiones colgadas y el `objMock.verify()`
 * del `afterEach` haría fallar **todos** los casos por una petición legítima. Es el mismo defecto que
 * esta pantalla destapó en el helper de `paridad-react.spec.ts`.
 *
 * ── 5. Los rótulos se copian del ANEXO, y las dos divergencias con React quedan explícitas ────────
 * Ver [`DIC_ROTULOS_CAMPOS`](#DIC_ROTULOS_CAMPOS) y [`DIC_ROTULOS_TEXTO`](#DIC_ROTULOS_TEXTO).
 */
const INT_TASK_ID = 1;
const INT_REQUEST_ID = 55;
const INT_PADRE_ID = 900;
const OBJ_ENV_VACIO = { strTaskId: '', strCaseId: '', strProcessId: '', strEventId: '', strToken: '' };

/** Tope del `maxLength` de FLD-354. Duplicado a propósito: si el `.ts` lo cambia, este caso avisa. */
const INT_MAX_COMENTARIO = 2000;

let objFixture: ComponentFixture<RespuestaAreaResponsable>;
let objPantalla: RespuestaAreaResponsable;
let objMock: HttpTestingController;

/**
 * Rótulos de los **campos de la fachada** (los que tienen `name`, o sea los que `cllCamposDs()` ve).
 *
 * ⚠ **Copiados de `insumos/Quejas directas/Anexo02_Index/screens/SCR-0052.md`** (tabla "Campos de la
 * Pantalla", columna *Etiqueta*, sin el `* ` del obligatorio), **no** de la plantilla: un rótulo
 * aseverado contra sí mismo es una tautología, y en SCR-012 esa tautología dejó cinco rótulos
 * derivados en verde. Si esta tabla y el `.html` discrepan, **el que se corrige es el `.html`**.
 *
 * ⚠ **La excepción, y por qué es una excepción y no un descuido:** el anexo rotula FLD-073
 * *"Instancia / Punto de Recepción"* y React pone *"Instancia de Recepción"*. Se porta el de React —la
 * migración no cambia el copy de la app que hoy está desplegada— así que este archivo fija el rótulo
 * **de React** para ese campo y solo para ese. Queda anotado acá, en la plantilla y en la ficha,
 * porque un `expect` que discrepa del insumo sin explicación se "arregla" solo la próxima vez que
 * alguien lo lea.
 *
 * ⚠ **FLD-355 (`qd_strAreaAttach`) NO está en esta tabla**, y no es un olvido:
 * `cllCamposDeLaFachada()` filtra por `instanceof CampoBase`, y `ZdsFileInput` extiende
 * [`CampoZaBase`](../../../../components/fields/campo-za-base.ts) —una jerarquía **paralela**, para los
 * `za-*`, que no deriva de `CampoBase`—, así que el helper no lo ve. Por eso el adjunto se asevera
 * aparte, en `DIC_ROTULOS_ZA`: meterlo acá pondría en rojo los tres casos que comparan el conjunto
 * completo contra la salida del helper, y el defecto estaría en la expectativa, no en la pantalla.
 */
const DIC_ROTULOS_CAMPOS: Record<string, string> = {
  [QD.strEmail]: 'Correo Electrónico', // FLD-068
  [`${QD.strPersonType}_desc`]: 'Tipo de Persona', // FLD-069
  // FLD-073 · el rótulo de React, NO el del anexo. Ver el bloque de arriba.
  [`${QD.strReceptionInstance}_desc`]: 'Instancia de Recepción',
  [`${QD.strControlEntity}_desc`]: 'Ente de Control', // FLD-075
  [QD.strComplaintText]: 'Descripción / Texto de la Queja', // FLD-077
  [QD.strAreaComment]: 'Comentario', // FLD-354
};

/**
 * Los campos de la fachada que salen de `CampoZaBase` (los `za-*`), invisibles para
 * `cllCamposDeLaFachada()` por la razón del bloque de arriba. Hoy es uno solo.
 *
 * Se aseveran consultando el componente por su clase, que es la única forma de alcanzarlos: el
 * `query(By.directive(...))` no depende del filtro `instanceof CampoBase` del helper compartido.
 */
const DIC_ROTULOS_ZA: Record<string, string> = {
  [QD.strAreaAttach]: 'Adjuntar archivo', // FLD-355
};

/**
 * Rótulos de los valores que van como **texto plano** (`info-bar-label`), no como campos del form.
 *
 * Son los que React monta sin `ZdsInput` porque no hay control detrás: dos son derivados
 * (`strNombre()`, `strIdentificacion()`), cuatro salen de un catálogo vía `descDe()` y cuatro más de
 * la fila del historial. No los ve `cllCamposDs()`, así que se aseveran leyendo el DOM.
 *
 * ⚠ Los cuatro de S4 (*Fecha de solicitud*, *Solicitado por*, *Motivo*, *Observaciones*) **no están
 * en el anexo**: el anexo documenta esa sección como "Datos de la Asignación" con FLD-351/352/353
 * (*Área*, *Responsable*, *Observaciones*) y el código envía otra cosa. La ficha quedó vieja; se porta
 * el código y la divergencia se documenta. Estos cuatro son los únicos rótulos de este archivo
 * copiados del `.tsx` de React y no del insumo, y por eso van en su propio bloque.
 */
const DIC_ROTULOS_TEXTO: string[] = [
  'Nombre del Consumidor', // FLD-066
  'Tipo y N.° de Identificación', // FLD-067
  'Canal de Recepción', // FLD-070
  'Producto SFC', // FLD-071
  'Motivo SFC', // FLD-072
  'Admisión', // FLD-074
  'Asunto de la Queja', // FLD-076
  // Los cuatro de S4, del `.tsx` — ver el bloque de arriba.
  'Fecha de solicitud',
  'Solicitado por',
  'Motivo',
  'Observaciones',
];

/** Una fila del historial con los cuatro campos que escribió SCR-005 ya poblados. */
function filaHistorial(in_strSufijo: string): AsignacionHistorial {
  return {
    fecha: `2026-08-1${in_strSufijo}`,
    de: `analista.sac.${in_strSufijo}`,
    para: `Área Técnica ${in_strSufijo}`,
    motivo: `Motivo de la ayuda ${in_strSufijo}`,
    observaciones: `Observaciones del Analista SAC ${in_strSufijo}\ncon un salto de línea`,
  };
}

/**
 * `task.data` del caso: dos filas de historial y `qd_intHelpNumber = 2`, o sea que esta rama del
 * subproceso responde la **segunda** fila (índice 1). Los valores están elegidos para que un
 * off-by-one se note: la fila 0 y la 1 tienen contenido distinguible.
 */
function datosTarea(): Record<string, unknown> {
  return {
    // S1
    [QD.strFirstName]: 'Ana',
    [QD.strLastName]: 'Pérez',
    [QD.strCompanyName]: '',
    [QD.strIdType]: 'CC',
    [QD.strIdNumber]: '1020304050',
    [QD.strEmail]: 'ana.perez@example.com',
    [QD.strPersonType]: '1',
    [`${QD.strPersonType}_desc`]: 'Persona Natural',
    // S2 — los cuatro códigos que resuelve el catálogo, más los dos `_desc` que vienen resueltos.
    [QD.strChannel]: '13',
    [QD.strSfcProduct]: '7',
    [QD.strSfcReason]: '41',
    [QD.strReceptionInstance]: '2',
    [`${QD.strReceptionInstance}_desc`]: 'Sucursal',
    [QD.strAdmission]: '1',
    [QD.strControlEntity]: '5',
    [`${QD.strControlEntity}_desc`]: 'Superintendencia Financiera',
    // S3
    [QD.strComplaintText]: 'No me aplicaron el descuento pactado en la renovación de la póliza.',
    // S4 — el contexto del subproceso.
    [QD.strAssigneeArea]: 'Área Técnica',
    [QD.strAssigneeUser]: 'usuario.area',
    [QD.strAssignmentRemarks]: 'Revisar la liquidación del siniestro.',
    [QD.intHelpNumber]: 2,
    [QD.lstAssignHistory]: [filaHistorial('0'), filaHistorial('1')],
    [QD.lstHelpResponses]: [],
    // El id del padre, en la forma que usa la instancia real. Ver `ParentRequestService.idDelPadre`.
    _request: { parent_request_id: INT_PADRE_ID },
    // Ruido deliberado: `task.data` trae el caso entero. La pantalla debe descartarlo (ver `precargar`).
    qd_strCaseNumber: 'QD-2026-000123',
    qd_strReceptionPoint: '4',
  };
}

function tarea(in_dicDatos: Record<string, unknown>): Record<string, unknown> {
  return { id: INT_TASK_ID, process_request_id: INT_REQUEST_ID, data: in_dicDatos };
}

function fijarQueryString(in_strQuery: string): void {
  // jsdom navega dentro del mismo origen sin recargar, así que esto alcanza para que
  // `Pm4ContextService` resuelva el `task_id` de la URL.
  window.history.replaceState({}, '', '/' + in_strQuery);
}

/**
 * ⚠ El orden importa y está medido: **`await whenStable()` por sí solo NO repinta** bajo
 * `provideZonelessChangeDetection()`. Sin el `detectChanges()` de abajo el template se queda en la
 * rama `@if (blnCargando())` para siempre y ningún campo existe.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

const INT_MAX_VUELTAS_DRENADO = 8;
const INT_VACIAS_PARA_CORTAR = 2;

/**
 * Consume los GET que la pantalla dispara por su cuenta (los cuatro catálogos de S2), para que el
 * `objMock.verify()` del `afterEach` no falle por una petición legítima que ningún caso nombró.
 *
 * **Drena solo `GET`, y el filtro —no el orden de llamada— es lo que mantiene honestos a
 * `dicPayloadEnviado()` y `dicBorradorEnviado()`.** Los PUT son lo que esos helpers aseveran, así que
 * drenarlos acá los dejaría consumidos y devolverían `null`: el caso de "NO completa la tarea" pasaría
 * **igual que si la pantalla sí la hubiera completado**.
 *
 * ⚠ **Corta con DOS vueltas vacías seguidas, no con una, y eso lo obliga esta pantalla (medido).**
 * `ngOnInit` hace `await this.objTareas.cargar()` y **después** llama `cargarCatalogos()`, así que los
 * cuatro GET nacen un microtask más tarde que el flush de la tarea: la traza real es
 * `v0=0 v1=4 v2=0`. Cortar en la primera cola vacía dejaría los cuatro colgados.
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
    // La forma `{data: []}` cubre a los consumidores: leen `data` del cuerpo.
    for (const objPeticion of cllPendientes) {
      if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
    }
  }

  const cllQuedaron = objMock.match((in_objReq) => in_objReq.method === 'GET');
  if (cllQuedaron.length > 0) {
    // Nombrarlas: si el drenado no converge, un caso colgado no dice qué pasó.
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
 *    resuelve — y `cargarCatalogos()` recién después de eso (ver `drenarPeticiones`).
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
  objFixture = TestBed.createComponent(RespuestaAreaResponsable);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  objFixture.detectChanges();
  objMock
    .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
    .flush(tarea(in_dicDatos));
  await drenarPeticiones();
}

/**
 * Cuántas veces hay que asentar después de responder la relectura del padre para que el PUT de
 * completado ya esté en la cola del mock. **Está medido, no elegido de más:** con una sola vuelta el
 * `dicPayloadEnviado()` devolvía `null` y el `verify()` del `afterEach` reportaba
 * `Expected no open requests, found 1: PUT /api/tasks/1` — o sea que el PUT existía, un microtask más
 * tarde que la aserción.
 *
 * El motivo es la cadena de `await` que la respuesta destraba: `leerVariables()` resuelve →
 * `registrarRespuesta()` retorna → `enviarCon()` sigue → `completarTarea()` recién ahí emite. Cada
 * `await` come un microtask propio y `whenStable()` no los colapsa, así que **contar vueltas fijas es
 * exactamente el error que este archivo ya cometió en el drenado**: el número correcto de hoy es una
 * propiedad de cuántos `await` tiene `enviarCon()`, y agregarle uno pondría el spec en rojo por un
 * refactor que no cambió el comportamiento. Por eso se asienta **hasta que el PUT aparezca**, con tope.
 */
const INT_MAX_VUELTAS_DE_ESPERA = 12;

/**
 * Cuenta las peticiones de un método en cola **sin consumirlas**. El `match()` de
 * `HttpTestingController` **saca de la cola todo lo que su predicado acepta**, así que una sonda que
 * devolviera `true` dejaría a `dicPayloadEnviado()` mirando una cola vacía y reportando "la pantalla no
 * envió nada". Devolver siempre `false` es lo que la convierte en sonda y no en consumidor.
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
 * Asienta hasta que se cumpla `in_fnListo`, y **repinta una vez más cuando se cumple**.
 *
 * Las dos mitades son necesarias y por motivos distintos:
 *
 * **1. Asentar hasta el efecto, no un número fijo de vueltas.** Contar vueltas es el error que este
 * archivo ya cometió en el drenado: el número correcto de hoy es una propiedad de cuántos `await`
 * tiene la implementación, así que un refactor que agregue uno pondría el spec en rojo sin cambiar el
 * comportamiento.
 *
 * **2. El `detectChanges()` de salida — medido, y es lo que destrabó los dos casos de error.** El
 * efecto que se espera (el signal del mensaje, la petición en cola) nace *detrás* del `await` de
 * `asentar()`, o sea **después** del `detectChanges()` que esa misma vuelta ya corrió. La sonda lo ve
 * —el valor está en el signal— pero la plantilla todavía se pintó con el valor viejo, así que el
 * `@if (strErrorEnvio())` seguía cerrado y el DOM no tenía ni una `za-alert`. Medido:
 * `SONDA-ERR v0 "PM4 rechazó el completado" alerts=0` y, tras un `detectChanges()` más,
 * `alerts=1 texto=true`. Sin esta línea el caso fallaba en la aserción del DOM **con el signal ya
 * seteado** — un rojo que apuntaba al lugar equivocado.
 *
 * **No lanza si el efecto no aparece**, y es deliberado: hay casos donde *no debe* aparecer (el
 * borrador no completa la tarea, un adjunto rechazado no se sube) y el que decide si esa ausencia es
 * un defecto es el caso, no el helper. Lo que el bucle garantiza es que cuando el caso mire, la cadena
 * de `await` ya terminó — o sea que un `null`/`0` significa "la pantalla no lo emitió" y no "lo miré un
 * microtask antes". Sin esto, los dos son indistinguibles y el caso pasa por el motivo equivocado.
 */
async function asentarHastaQue(in_fnListo: () => boolean): Promise<void> {
  for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DE_ESPERA; intVuelta++) {
    await asentar();
    if (in_fnListo()) {
      // Ver el punto 2 del docstring: el efecto llegó tarde para el repintado de esta vuelta.
      objFixture.detectChanges();
      return;
    }
  }
}

/** Asienta hasta que haya una petición del método pedido en cola. Ver `asentarHastaQue()`. */
async function asentarHasta(in_strMetodo: string): Promise<void> {
  await asentarHastaQue(() => intEnCola(in_strMetodo) > 0);
}

/** Asienta hasta que `strErrorEnvio()` deje de estar vacío. Ver `asentarHastaQue()`. */
async function asentarHastaElError(): Promise<void> {
  await asentarHastaQue(() => objPantalla.strErrorEnvio() !== '');
}

/**
 * Responde la relectura del request padre con las variables `in_dicFrescas`, o la hace **fallar** con
 * `null` para ejercitar la degradación.
 *
 * Es un `match` y no un `expectOne` porque hay casos donde la relectura **no debe ocurrir** (el
 * borrador) y ahí devolver `false` es la aserción. El `include=data` se asevera en su propio caso.
 *
 * ⚠ **Deja el envío asentado antes de volver** (ver `asentarHastaElPut`). Asentar acá y no en cada caso
 * es deliberado: la cadena de `await` que destraba esta respuesta es una propiedad de la relectura, no
 * de los ocho casos que la usan, y repartida en los ocho se desincroniza en cuanto `enviarCon()` gane o
 * pierda un `await`.
 */
async function responderPadre(in_dicFrescas: Record<string, unknown> | null): Promise<boolean> {
  const cllGets = objMock.match(
    (in_objReq) => in_objReq.method === 'GET' && in_objReq.url === `/api/requests/${INT_PADRE_ID}`,
  );
  if (cllGets.length === 0) return false;

  if (in_dicFrescas === null) {
    cllGets[0].flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  } else {
    cllGets[0].flush({ data: in_dicFrescas });
  }

  await asentarHasta('PUT');
  return true;
}

/**
 * El `data` del PUT de **completado** (ACT-0052-01), o `null` si la pantalla no completó la tarea.
 * Consume el PUT, así que se llama una vez por caso.
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
 * El `data` del PUT del **borrador** (ACT-0052-02), o `null` si no se guardó. Va a
 * `/requests/{process_request_id}` y **no** lleva `status`: es la diferencia con el completado, y es
 * lo que hace que confundir las dos acciones no pueda pasar inadvertido.
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

/**
 * El **wrapper** de un campo, buscado por su `name`. Devuelve el `CampoBase`, no el componente del DS
 * que hay debajo: los `input()` de la fachada (`label`, `readOnly`, `error`) se leen acá, y el valor
 * que efectivamente llegó al `lib-*-z` se lee con `objHijoDs()`.
 */
function objCampo(in_strNombre: string): CampoBase<string> {
  const objEncontrado = cllCamposDs().find((in_objCampo) => in_objCampo.name() === in_strNombre);

  // Sin esta guarda, un campo que desapareciera del template fallaría con "Cannot read properties of
  // undefined", que se lee como error del test y no como el defecto que es.
  expect(objEncontrado, `la pantalla no montó el campo ${in_strNombre}`).toBeDefined();
  return objEncontrado!;
}

/**
 * El componente del DS (`lib-input-text-z`, `lib-textarea-z`, …) que el wrapper renderiza adentro. Es
 * el extremo lejano del puente form→DS: su `model` es lo más profundo que jsdom permite mirar, porque
 * el `<input>` real vive en un shadow root que el upgrade de Lit nunca crea.
 */
// El tipo de retorno se omite a propósito: `objHijoDelDs()` ya devuelve `any` (con su propio
// `eslint-disable` documentado en `contrato-pantalla.ts`), así que anotarlo acá no agrega tipado y
// deja un directive que no tapa nada — con `--max-warnings=0` el lint falla por eso.
function objHijoDs(in_strNombre: string) {
  return objHijoDelDs<string>(objFixture, objCampo(in_strNombre));
}

/**
 * El wrapper del adjunto (FLD-355). Va por `By.directive` y no por `cllCamposDs()` porque
 * `ZdsFileInput` extiende `CampoZaBase`, que no es un `CampoBase` — ver `DIC_ROTULOS_ZA`.
 */
function objCampoZa(): ZdsFileInput {
  const objNodo = objFixture.debugElement.query(By.directive(ZdsFileInput));
  expect(objNodo, 'la pantalla no montó el zds-file-input de FLD-355').toBeTruthy();
  return objNodo.componentInstance as ZdsFileInput;
}

/** El texto completo del `<form>`, para aseverar los valores que van como texto plano. */
function strTextoDelForm(): string {
  return (objFixture.nativeElement as HTMLElement).textContent ?? '';
}

/**
 * Suplanta `window.top` por un doble cuyo `location.href` es una propiedad **escribible**, y devuelve
 * un lector de lo último que se le asignó (`null` si nadie navegó) junto con el `restaurar()`.
 *
 * ⚠ **Por qué un doble y no leer `window.top.location.href` antes y después.** En jsdom el fixture
 * corre en el frame de arriba, así que `window.top === window`; y asignarle `location.href` **no
 * cambia el valor** —jsdom emite `Not implemented: navigation (except hash changes)` y sigue—. O sea
 * que un `expect(href).toBe(hrefDeAntes)` pasa **igual haya navegado o no**: es una aserción que no
 * puede fallar. Con esta suplantación la escritura queda observable y el "SOLO si el guardado salió
 * bien" de ACT-0052-02 se puede aseverar por sus dos mitades.
 *
 * Está medido: sin esto, borrar el `if (!blnOk) return;` de `guardarBorrador()` dejaba la suite
 * **entera en verde**, con el título del caso afirmando justo lo que nadie comprobaba.
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
  // `window.top` es un getter de solo lectura, así que se redefine la propiedad y se repone después.
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

/** Escribe el comentario de S5 como lo haría el usuario, y deja el DOM asentado. */
async function escribirComentario(in_strTexto: string): Promise<void> {
  objPantalla.form.get(QD.strAreaComment)!.setValue(in_strTexto);
  await asentar();
}

describe('SCR-0052 · Respuesta del Área Responsable', () => {
  beforeEach(() => {
    // `scrollToFirstError` difiere el scroll en un `setTimeout(0)`, así que sin este stub el
    // `TypeError` de jsdom sale como **error no manejado** en vez de como fallo del caso — Vitest
    // reporta `Tests N passed` + `Errors 1`, que es fácil de leer como una suite verde.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    Element.prototype.scrollIntoView = () => {};
  });

  afterEach(() => {
    // Si la pantalla dispara una petición que ningún caso esperaba, el caso falla acá en vez de pasar
    // inadvertida. El `?` es load-bearing: un caso que falla antes de `montar()` deja `objMock` sin
    // asignar y sin el `?` el error real quedaría tapado por un `Cannot read properties of undefined`.
    objMock?.verify();
    TestBed.resetTestingModule();
  });

  // ── Precarga y contrato de campos ──────────────────────────────────────────────────────────────

  it('precarga los campos declarados y descarta las claves ajenas a la pantalla', async () => {
    await montar();

    const dicDatos = datosTarea();
    // Los dos grupos juntos: la precarga es del `FormGroup`, y ahí el adjunto es un control como
    // cualquier otro. La partición en `CampoBase`/`CampoZaBase` solo importa cuando se consulta el DOM.
    for (const strCampo of [...Object.keys(DIC_ROTULOS_CAMPOS), ...Object.keys(DIC_ROTULOS_ZA)]) {
      expect(objPantalla.form.get(strCampo)?.value, `precarga de ${strCampo}`).toBe(
        // El comentario y el adjunto son los dos únicos editables y no vienen en el caso: quedan en ''.
        dicDatos[strCampo] ?? '',
      );
    }

    // El contexto del subproceso también entra, y de él sale toda la S4.
    expect(objPantalla.form.get(QD.intHelpNumber)?.value).toBe(2);
    expect(objPantalla.form.get(QD.lstAssignHistory)?.value).toHaveLength(2);

    // El ruido de `task.data` no entra al form: `precargar()` filtra por las claves declaradas.
    expect(objPantalla.form.get('qd_strCaseNumber')).toBeNull();
    // ⚠ `qd_strReceptionPoint` en particular: React **no** lo monta (cero ocurrencias en el `.tsx`) y
    // el dataset congelado de `paridad-react.spec.ts` no lo tiene. Un borrador de este port lo montaba,
    // y este caso es lo que impide que vuelva de contrabando.
    expect(objPantalla.form.get('qd_strReceptionPoint')).toBeNull();
  });

  it('los 6 campos de la fachada declaran formControlName y llegan al componente del DS', async () => {
    await montar();

    // Mitad 1 · el contrato genérico de la fachada: `name`, `formControlName` y el `id="field-<name>"`.
    aseverarContratoDeCampos(objFixture);

    // Mitad 2 · el extremo lejano del puente. Sin esto, 6 campos sin `formControlName` —muertos en el
    // navegador— dejarían este archivo entero en verde, porque todos los demás casos empujan el
    // `FormGroup` a mano. Es exactamente el defecto que SCR-008 dejó pasar (punto 2b de su spec).
    expect(cllCamposDs().map((in_objCampo) => in_objCampo.name()).sort()).toEqual(
      Object.keys(DIC_ROTULOS_CAMPOS).sort(),
    );

    const dicDatos = datosTarea();
    for (const strCampo of Object.keys(DIC_ROTULOS_CAMPOS)) {
      // Se lee el `model` del **hijo del DS**, no el `FormControl`: el control lo empuja el
      // `patchValue` de `precargar()` y estaría poblado igual con los `formControlName` borrados.
      expect(objHijoDs(strCampo).model, `valor que llegó al DS en ${strCampo}`).toBe(
        dicDatos[strCampo] ?? '',
      );
    }
  });

  it('los tres `_desc` son CAMPOS del form, no texto plano (paridad de render con React)', async () => {
    await montar();

    // React monta los tres como `<ZdsInput readOnly>` (líneas 213/235/240 del `.tsx`) y el dataset
    // congelado de `paridad-react.spec.ts` los declara como `ZdsInput`. El primer borrador de este port
    // los pintaba como `info-bar-value`: se veían distinto y **desaparecían del DOM como campos**, o
    // sea que un `formControlName` roto en ellos no habría tenido forma de ponerse rojo.
    //
    // Este caso es lo que fija la decisión. No es redundante con el del puente: aquel asevera el
    // conjunto completo, este nombra los tres que se reinterpretaron y por qué.
    for (const strDesc of [QD.strPersonType, QD.strReceptionInstance, QD.strControlEntity]) {
      const strCampo = `${strDesc}_desc`;
      expect(objCampo(strCampo).readOnly(), `${strCampo} debe ser de solo lectura`).toBe(true);
      expect(objHijoDs(strCampo).model, `${strCampo} sin valor en el DS`).toBe(
        datosTarea()[strCampo],
      );
    }
  });

  it('los rótulos de los campos de la fachada son los del anexo', async () => {
    await montar();

    const dicReal: Record<string, string> = {};
    for (const objUno of cllCamposDs()) {
      dicReal[objUno.name()] = objUno.label();
    }

    // La guarda de conteo va **primero**: sin ella, un campo que desaparezca del template dejaría su
    // entrada sin comparar y el `for` de abajo pasaría igual.
    expect(Object.keys(dicReal).sort()).toEqual(Object.keys(DIC_ROTULOS_CAMPOS).sort());
    for (const [strCampo, strRotulo] of Object.entries(DIC_ROTULOS_CAMPOS)) {
      expect(dicReal[strCampo], `rótulo de ${strCampo} fuera del anexo`).toBe(strRotulo);
    }

    // ⚠ Se asevera el **input `label` del wrapper**, no el texto renderizado: bajo jsdom los custom
    // elements de Lit no hacen upgrade, así que un `textContent.toContain(rótulo)` saldría rojo con los
    // rótulos correctos (trampa 2 de testing-conventions.md).
  });

  it('el rótulo del adjunto de FLD-355 es el del anexo', async () => {
    await montar();

    // Caso aparte del de arriba porque el adjunto es un `CampoZaBase` y `cllCamposDs()` no lo alcanza
    // (ver `DIC_ROTULOS_ZA`). Se asevera lo mismo —el input `label` del wrapper— por la misma razón.
    const objAdjunto = objCampoZa();
    expect(objAdjunto.name()).toBe(QD.strAreaAttach);
    expect(objAdjunto.label()).toBe(DIC_ROTULOS_ZA[QD.strAreaAttach]);
  });

  it('los rótulos de los valores de solo lectura están en el DOM', async () => {
    await montar();

    // Estos SÍ se leen del DOM, y puede hacerse justamente porque no son componentes del DS: son
    // `<span class="info-bar-label">` que Angular renderiza sin depender de ningún upgrade de Lit.
    const strTexto = strTextoDelForm();
    for (const strRotulo of DIC_ROTULOS_TEXTO) {
      expect(strTexto, `falta el rótulo de solo lectura "${strRotulo}"`).toContain(strRotulo);
    }
  });

  // ── S1 · los dos valores derivados ─────────────────────────────────────────────────────────────

  it('el nombre a mostrar usa la razón social cuando el consumidor es empresa', async () => {
    await montar({ ...datosTarea(), [QD.strCompanyName]: 'Comercial XYZ S.A.S.' });

    // La razón social **gana** sobre nombre+apellido. Sin este caso, un `||` invertido pasaría igual
    // con el fixture de persona natural, donde la razón social está vacía.
    expect(objPantalla.strNombre()).toBe('Comercial XYZ S.A.S.');
    expect(strTextoDelForm()).toContain('Comercial XYZ S.A.S.');
  });

  it('el nombre concatena nombre y apellido', async () => {
    await montar();
    expect(objPantalla.strNombre()).toBe('Ana Pérez');
  });

  it('el nombre no deja un espacio colgando cuando falta el apellido', async () => {
    // Va en su propio `it()` y no como segunda mitad del de arriba: remontar dentro de un caso exige
    // `resetTestingModule()` a mano, y ahí el `objMock` del primer montaje queda huérfano — el
    // `verify()` del `afterEach` pasaría a mirar un mock que ya nadie usa.
    await montar({ ...datosTarea(), [QD.strLastName]: '' });

    // El `trim()` de la implementación: sin él, la persona natural sin apellido mostraría "Ana " con un
    // espacio final que en un `info-bar-value` se ve como un salto de alineación.
    expect(objPantalla.strNombre()).toBe('Ana');
  });

  it('la identificación concatena tipo y número', async () => {
    await montar();
    expect(objPantalla.strIdentificacion()).toBe('CC 1020304050');
  });

  // ── S2 · los cuatro catálogos ──────────────────────────────────────────────────────────────────

  it('los cuatro catálogos se piden UNA vez cada uno, después de precargar', async () => {
    fijarQueryString(`?task_id=${INT_TASK_ID}`);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
      ],
    });
    objFixture = TestBed.createComponent(RespuestaAreaResponsable);
    objPantalla = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);
    objFixture.detectChanges();

    // ⚠ Antes del flush de la tarea **no hay ni un GET de colección**: `ngOnInit` hace
    // `await cargar()` primero. Es el hecho medido que obliga al drenado de dos vueltas vacías, y sin
    // esta aserción quedaría solo en un comentario.
    expect(objMock.match((in_objReq) => in_objReq.url.includes('/collections/'))).toHaveLength(0);

    objMock
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush(tarea(datosTarea()));
    await asentar();

    // Cuatro colecciones distintas, una petición cada una. Si `CatalogosService` devolviera una sola
    // instancia compartida (el defecto que motivó ese servicio: `providers` resuelve por token, así que
    // `[CollectionService, CollectionService]` da UNA), acá habría menos de cuatro URLs distintas.
    const cllColecciones = objMock.match((in_objReq) => in_objReq.url.includes('/collections/'));
    const setUrls = new Set(cllColecciones.map((in_objPet) => in_objPet.request.url));
    expect(cllColecciones).toHaveLength(4);
    expect(setUrls.size).toBe(4);

    for (const objPeticion of cllColecciones) objPeticion.flush({ data: [] });
    await drenarPeticiones();
  });

  it('los campos de catálogo se muestran por su etiqueta, no por el código', async () => {
    await montar();

    // El catálogo se drenó con `{data: []}`, así que `descOf()` no resuelve y cae al código. Eso es el
    // contrato documentado ("cae al código si no resolvió") y acá se fija: un `descDe()` que devolviera
    // '' con el catálogo vacío dejaría la pantalla mostrando cuatro huecos.
    expect(objPantalla.descDe('channel')).toBe('13');
    expect(objPantalla.descDe('sfcProduct')).toBe('7');
    expect(objPantalla.descDe('sfcReason')).toBe('41');
    expect(objPantalla.descDe('admission')).toBe('1');
  });

  // ── S4 · la fila del historial, por índice 1-based ─────────────────────────────────────────────

  it('S4 pinta la fila que `qd_intHelpNumber` señala, contando desde 1', async () => {
    await montar();

    // `qd_intHelpNumber = 2` ⇒ índice 1 ⇒ la **segunda** fila. Las dos filas del fixture tienen
    // contenido distinguible justamente para que un off-by-one no pueda pasar: sin el `- 1` esto
    // devolvería `undefined` (no hay índice 2) y con un `- 2` devolvería la fila '0'.
    expect(objPantalla.objSolicitud()?.de).toBe('analista.sac.1');
    expect(objPantalla.objSolicitud()?.motivo).toBe('Motivo de la ayuda 1');

    const strTexto = strTextoDelForm();
    expect(strTexto).toContain('analista.sac.1');
    expect(strTexto).not.toContain('analista.sac.0');
  });

  it('sin `qd_intHelpNumber` S4 muestra guiones, NO una alerta de "no hay solicitud"', async () => {
    const dicSinNumero = { ...datosTarea() };
    delete dicSinNumero[QD.intHelpNumber];
    await montar(dicSinNumero);

    // Índice `-1` ⇒ `objSolicitud()` es `undefined` ⇒ los cuatro `|| '—'`. Es lo que hace React
    // (`objRequest?.fecha || '—'`), y pintar una alerta en su lugar —que fue la tentación al portar—
    // sería reinterpretar la pantalla.
    expect(objPantalla.objSolicitud()).toBeUndefined();

    const strTexto = strTextoDelForm();
    expect(strTexto).toContain('Fecha de solicitud');
    expect(strTexto).toContain('—');
    expect(strTexto).not.toContain('no hay solicitud');
  });

  // ── RUL-0052-01 · el gate del comentario ───────────────────────────────────────────────────────

  it('RUL-0052-01 · con el comentario vacío no se puede enviar y se explica por qué', async () => {
    await montar();

    expect(objPantalla.blnPuedeEnviar()).toBe(false);
    // MSG-0052-01, permanente mientras el comentario esté vacío: el botón principal está apagado y sin
    // este texto la pantalla no diría por qué.
    expect(strTextoDelForm()).toContain('antes de enviarlo');
  });

  it('RUL-0052-01 · un comentario de solo espacios NO habilita el envío', async () => {
    await montar();
    await escribirComentario('   \n\t  ');

    // **Este es el caso que distingue la implementación correcta de la rota.** `Validators.required`
    // solo rechaza `''` y `null`, así que un gate escrito como `form.valid` o como
    // `!!valor` pasaría igual el caso del vacío y el del texto real: los espacios son el único input
    // que los separa. Es el `trim()` del `blnPuedeEnviar()`.
    expect(objPantalla.blnPuedeEnviar()).toBe(false);
  });

  it('RUL-0052-01 · con comentario el envío se habilita', async () => {
    await montar();
    await escribirComentario('El descuento no se aplicó por un error en la carátula.');

    expect(objPantalla.blnPuedeEnviar()).toBe(true);
    // Y el mensaje de bloqueo desaparece: es la otra mitad del `@if (!blnPuedeEnviar())`.
    expect(strTextoDelForm()).not.toContain('antes de enviarlo');
  });

  it('RUL-0052-01 · enviar con el comentario vacío NO completa la tarea', async () => {
    await montar();

    // Sin `await`: `enviar()` es asíncrono y el caso necesita asentar el DOM entre medio. Acá el gate
    // corta antes de cualquier HTTP, y eso es justamente lo que se asevera.
    void objPantalla.enviar();
    await asentar();

    expect(dicPayloadEnviado(), 'no debe haber PUT de completado').toBeNull();
    // El error del campo aparece recién ahora, después del primer intento: un campo obligatorio vacío
    // al abrir la pantalla no es un error del usuario todavía.
    expect(objPantalla.strErrorComentario()).toContain('antes de enviarlo');
  });

  it('el error de longitud del comentario habla siempre, sin esperar el intento de envío', async () => {
    await montar();
    await escribirComentario('x'.repeat(INT_MAX_COMENTARIO + 1));

    // A diferencia del `required`, el `maxlength` solo puede dispararse con algo tipeado, así que no
    // necesita el `blnIntentoEnvio`. Y el envío queda bloqueado por `form.invalid`, no por el gate:
    // `blnPuedeEnviar()` mira el `trim()` y con 2001 caracteres da `true`.
    expect(objPantalla.strErrorComentario()).toContain('2000');
    expect(objPantalla.blnPuedeEnviar()).toBe(true);

    void objPantalla.enviar();
    await asentar();
    expect(dicPayloadEnviado(), 'un comentario de 2001 caracteres no debe enviarse').toBeNull();
  });

  // ── ACT-0052-01 · enviar comentario ────────────────────────────────────────────────────────────

  it('ACT-0052-01 · completa la tarea con el comentario, la acción y las dos listas', async () => {
    await montar();
    await escribirComentario('Se validó la póliza y el descuento corresponde.');

    void objPantalla.enviar();
    await asentar();
    // La relectura del padre devuelve las mismas dos filas: este caso mira el payload, no la fusión.
    expect(await responderPadre({ [QD.lstAssignHistory]: [filaHistorial('0'), filaHistorial('1')] })).toBe(
      true,
    );

    const dicPayload = dicPayloadEnviado();
    expect(dicPayload).not.toBeNull();
    expect(dicPayload![QD.strAreaComment]).toBe('Se validó la póliza y el descuento corresponde.');
    expect(dicPayload![QD.strAction]).toBe('ENVIAR');

    // La fila respondida queda marcada, y en la posición que el índice 1-based señala.
    const cllHistorial = dicPayload![QD.lstAssignHistory] as AsignacionHistorial[];
    expect(cllHistorial[1].respondio).toBe('si');
    expect(cllHistorial[1].comentario).toBe('Se validó la póliza y el descuento corresponde.');
    // Y la fila que NO se responde queda intacta: sin esto, un `map` que marcara todas pasaría igual.
    expect(cllHistorial[0].respondio).toBeUndefined();

    // La respuesta también se registra en su lista propia, con el número de ayuda 1-based.
    const cllRespuestas = dicPayload![QD.lstHelpResponses] as RespuestaAyuda[];
    expect(cllRespuestas[1].numero).toBe(2);
    expect(cllRespuestas[1].respondio).toBe('usuario.area');
  });

  it('ACT-0052-01 · la fila respondida CONSERVA los cuatro campos que escribió SCR-005', async () => {
    await montar();
    await escribirComentario('Respuesta del área.');

    void objPantalla.enviar();
    await asentar();
    expect(await responderPadre({ [QD.lstAssignHistory]: [filaHistorial('0'), filaHistorial('1')] })).toBe(
      true,
    );

    // **El spread de `registrarRespuesta()` no se puede reemplazar por un objeto nuevo.** `fecha`, `de`,
    // `motivo`, `observaciones` y `para` los escribió SCR-005 y esta pantalla no los conoce: armar la
    // fila desde cero los borraría, y el Analista SAC vería una ayuda respondida sin saber qué había
    // pedido ni cuándo. El caso de arriba (`respondio: 'si'`) pasaría **igual** con ese defecto.
    const cllHistorial = dicPayloadEnviado()![QD.lstAssignHistory] as AsignacionHistorial[];
    const objOriginal = filaHistorial('1');
    expect(cllHistorial[1].fecha).toBe(objOriginal.fecha);
    expect(cllHistorial[1].de).toBe(objOriginal.de);
    expect(cllHistorial[1].para).toBe(objOriginal.para);
    expect(cllHistorial[1].motivo).toBe(objOriginal.motivo);
    expect(cllHistorial[1].observaciones).toBe(objOriginal.observaciones);
  });

  it('ACT-0052-01 · relee el padre con `include=data` antes de escribir', async () => {
    await montar();
    await escribirComentario('Respuesta del área.');

    void objPantalla.enviar();
    await asentar();

    // Sin `include=data` PM4 devuelve el request **sin las variables del caso**: la respuesta llega con
    // 200 y el array vacío, indistinguible de "el padre no tiene historial". O sea que omitirlo
    // convierte la relectura en la escritura destructiva que venía a evitar, en silencio.
    const objGet = objMock.expectOne(
      (in_objReq) => in_objReq.method === 'GET' && in_objReq.url === `/api/requests/${INT_PADRE_ID}`,
    );
    expect(objGet.request.params.get('include')).toBe('data');

    // Se flushea a mano (el `expectOne` de arriba ya consumió la petición) y se asienta con el mismo
    // criterio que `responderPadre()`: contar vueltas fijas acá volvería a atar el caso al número de
    // `await` de `enviarCon()`.
    objGet.flush({ data: { [QD.lstAssignHistory]: [filaHistorial('0'), filaHistorial('1')] } });
    await asentarHasta('PUT');
    expect(dicPayloadEnviado()).not.toBeNull();
  });

  it('ACT-0052-01 · ⚠ la relectura GANA sobre el snapshot: no borra la fila que agregó otro', async () => {
    await montar();
    await escribirComentario('Respuesta del área.');

    void objPantalla.enviar();
    await asentar();

    // El escenario real, y el motivo entero de `ParentRequestService`: mientras el ayudante redactaba,
    // el Analista SAC pidió una **tercera** ayuda. El snapshot con el que arrancó el subproceso tiene
    // dos filas; el padre tiene tres.
    expect(
      await responderPadre({
        [QD.lstAssignHistory]: [filaHistorial('0'), filaHistorial('1'), filaHistorial('2')],
        [QD.lstHelpResponses]: [],
      }),
    ).toBe(true);

    // Si la pantalla escribiera su snapshot, el PUT llevaría **dos** filas y la tercera desaparecería:
    // no es un dato viejo, es una escritura destructiva sobre trabajo de otro usuario que no deja
    // rastro. Este `toHaveLength(3)` es la aserción central del archivo.
    const cllHistorial = dicPayloadEnviado()![QD.lstAssignHistory] as AsignacionHistorial[];
    expect(cllHistorial).toHaveLength(3);
    expect(cllHistorial[2].de).toBe('analista.sac.2');
    // Y la respuesta sigue yendo a la fila correcta, no a la última.
    expect(cllHistorial[1].respondio).toBe('si');
    expect(cllHistorial[2].respondio).toBeUndefined();
  });

  it('ACT-0052-01 · la fila respondida CONSERVA los cuatro campos que escribió SCR-005', async () => {
    await montar();
    await escribirComentario('Respuesta del área.');

    void objPantalla.enviar();
    await asentar();
    expect(
      await responderPadre({
        [QD.lstAssignHistory]: [filaHistorial('0'), filaHistorial('1')],
        [QD.lstHelpResponses]: [],
      }),
    ).toBe(true);

    // El `...cllHistorial[intIndice]` del `.ts` no es cosmético: `fecha`, `de`, `motivo` y
    // `observaciones` los escribió **SCR-005** (el Analista SAC al pedir la ayuda) y esta pantalla no
    // los conoce ni los tiene en su form. Reemplazar el spread por un objeto nuevo dejaría la tarjeta
    // del historial sin saber quién pidió la ayuda ni por qué — y el envío seguiría "funcionando".
    const objFila = (dicPayloadEnviado()![QD.lstAssignHistory] as AsignacionHistorial[])[1];
    expect(objFila.fecha).toBe(filaHistorial('1').fecha);
    expect(objFila.de).toBe(filaHistorial('1').de);
    expect(objFila.motivo).toBe(filaHistorial('1').motivo);
    expect(objFila.observaciones).toBe(filaHistorial('1').observaciones);
    // Y encima de eso, lo que sí escribe esta pantalla.
    expect(objFila.respondio).toBe('si');
    expect(objFila.comentario).toBe('Respuesta del área.');
  });

  it('ACT-0052-01 · si la relectura del padre falla, degrada al snapshot y NO pierde la respuesta', async () => {
    // La consola se silencia: `ParentRequestService` avisa con `console.warn` a propósito (el fallo es
    // esperado acá), y dejarlo suelto ensucia la salida de una suite verde.
    const objWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      await montar();
      await escribirComentario('Respuesta del área.');

      void objPantalla.enviar();
      await asentar();
      expect(await responderPadre(null)).toBe(true); // 500

      // Degradar, no bloquear. Si esto lanzara, el ayudante no podría enviar su comentario por un
      // problema que no es suyo y que no puede resolver — peor dato, pero la respuesta se guarda.
      const dicPayload = dicPayloadEnviado();
      expect(dicPayload, 'un fallo de la relectura no debe abortar el envío').not.toBeNull();
      const cllHistorial = dicPayload![QD.lstAssignHistory] as AsignacionHistorial[];
      expect(cllHistorial).toHaveLength(2);
      expect(cllHistorial[1].respondio).toBe('si');
      expect(objPantalla.strErrorEnvio()).toBe('');
    } finally {
      objWarn.mockRestore();
    }
  });

  it('ACT-0052-01 · sin `qd_intHelpNumber` la respuesta se EMPUJA al final, no a `lst[-1]`', async () => {
    const dicSinNumero = { ...datosTarea() };
    delete dicSinNumero[QD.intHelpNumber];
    await montar(dicSinNumero);
    await escribirComentario('Respuesta sin número de ayuda.');

    void objPantalla.enviar();
    await asentar();
    expect(await responderPadre({ [QD.lstHelpResponses]: [] })).toBe(true);

    // Con índice `-1`, un `cll[intIndice] = obj` crearía la propiedad `"-1"`: el array seguiría con
    // `length` 0 y el Analista SAC nunca vería la respuesta. El `push` la deja como elemento real.
    const cllRespuestas = dicPayloadEnviado()![QD.lstHelpResponses] as RespuestaAyuda[];
    expect(cllRespuestas).toHaveLength(1);
    expect(cllRespuestas[0].comentario).toBe('Respuesta sin número de ayuda.');
    // El `numero` cae a `length + 1` cuando no hay `qd_intHelpNumber`, así la tarjeta no muestra un 0.
    expect(cllRespuestas[0].numero).toBe(1);
  });

  it('ACT-0052-01 · el error de envío se muestra, no se traga', async () => {
    const objError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await montar();
      await escribirComentario('Respuesta del área.');

      void objPantalla.enviar();
      await asentar();
      expect(await responderPadre({ [QD.lstAssignHistory]: [filaHistorial('0'), filaHistorial('1')] })).toBe(
        true,
      );

      objMock
        .expectOne(
          (in_objReq) => in_objReq.method === 'PUT' && in_objReq.url === `/api/tasks/${INT_TASK_ID}`,
        )
        .flush({ message: 'PM4 rechazó el completado' }, { status: 500, statusText: 'Error' });
      await asentarHastaElError();

      // Si la tarea no se completa, PM4 **no cierra el iframe** y el usuario se queda mirando esta
      // pantalla. Tragarse el error lo dejaría creyendo que envió: el `catch` tiene que dejar el
      // mensaje visible.
      expect(objPantalla.strErrorEnvio()).not.toBe('');
      expect(strTextoDelForm()).toContain('No se pudo enviar');
    } finally {
      objError.mockRestore();
    }
  });

  // ── ACT-0052-02 · guardar borrador ─────────────────────────────────────────────────────────────

  it('ACT-0052-02 · guarda sin completar la tarea y sin pasar por `registrarRespuesta`', async () => {
    await montar();
    await escribirComentario('Voy a medio camino.');

    void objPantalla.guardarBorrador();
    await asentar();

    // **Un borrador no es una respuesta.** No relee el padre —no hay nada que fusionar— y sobre todo no
    // marca la fila: escribir `respondio: 'si'` al guardar dejaría al Analista SAC viendo una ayuda
    // respondida con un comentario a medio escribir, y el BPM podría avanzar sobre eso.
    expect(
      objMock.match(
        (in_objReq) => in_objReq.url === `/api/requests/${INT_PADRE_ID}`,
      ),
      'el borrador no debe releer el request padre',
    ).toHaveLength(0);

    const dicBorrador = dicBorradorEnviado();
    expect(dicBorrador).not.toBeNull();
    expect(dicBorrador![QD.strAreaComment]).toBe('Voy a medio camino.');
    expect(dicBorrador![QD.strAction]).toBe('GUARDAR_BORRADOR');
    // Las dos listas viajan **tal como estaban** (son parte del `getRawValue()`), sin la marca de
    // respondida. Esta es la aserción que separa el borrador del envío.
    const cllHistorial = dicBorrador![QD.lstAssignHistory] as AsignacionHistorial[];
    expect(cllHistorial[1].respondio).toBeUndefined();
    expect(dicBorrador![QD.lstHelpResponses]).toEqual([]);

    // Y no hay PUT de completado: el borrador va al request, no a la tarea.
    expect(dicPayloadEnviado()).toBeNull();
  });

  it('ACT-0052-02 · guarda aunque el comentario esté vacío (NO mira RUL-0052-01)', async () => {
    await montar();

    // Guardar a medio escribir es precisamente para lo que sirve. Apagarlo con el comentario vacío
    // dejaría al usuario sin forma de salir conservando lo poco que hubiera escrito, así que el gate
    // del envío **no** aplica acá — y sin este caso, agregárselo pasaría inadvertido.
    expect(objPantalla.blnPuedeEnviar()).toBe(false);

    void objPantalla.guardarBorrador();
    await asentar();

    expect(dicBorradorEnviado()).not.toBeNull();
  });

  it('ACT-0052-02 · si el guardado sale bien, navega el frame de ARRIBA a la bandeja', async () => {
    const objTope = espiarNavegacionDelTope();
    try {
      await montar();
      await escribirComentario('Voy a medio camino.');

      void objPantalla.guardarBorrador();
      await asentar();
      expect(dicBorradorEnviado()).not.toBeNull();
      await asentarHastaQue(() => objTope.strDestino() !== null);

      // El frame de **arriba**, no el propio: la pantalla vive en un iframe dentro de PM4, así que
      // navegar `window.location` dejaría la bandeja embebida dentro del formulario.
      expect(objTope.strDestino()).toBe('/tasks');
    } finally {
      objTope.restaurar();
    }
  });

  it('ACT-0052-02 · navega a la bandeja SOLO si el guardado salió bien', async () => {
    const objError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const objTope = espiarNavegacionDelTope();
    try {
      await montar();
      await escribirComentario('Voy a medio camino.');

      void objPantalla.guardarBorrador();
      await asentar();
      dicBorradorEnviado(true); // 500
      await asentarHastaElError();

      // El booleano de `enviarCon()` es el contrato con `guardarBorrador()`: navegar ante un fallo
      // perdería el comentario del usuario **sin decirle nada**, porque la bandeja de PM4 se cargaría
      // encima de la pantalla y el mensaje de error nunca se vería.
      //
      // ⚠ Esta es la aserción que le da sentido al "SOLO" del título, y **faltaba**: el caso solo
      // miraba el mensaje de error —que ya es lo que asevera el caso de ACT-0052-01— así que borrar el
      // `if (!blnOk) return;` de `guardarBorrador()` dejaba la suite entera en verde. Ver
      // `espiarNavegacionDelTope()` para por qué comparar el `href` de antes y después no alcanza.
      expect(objTope.strDestino(), 'un guardado fallido NO debe navegar la bandeja').toBeNull();
      expect(objPantalla.strErrorEnvio()).not.toBe('');
      expect(strTextoDelForm()).toContain('No se pudo enviar');
    } finally {
      objTope.restaurar();
      objError.mockRestore();
    }
  });

  // ── ACT-0052-03 · volver ───────────────────────────────────────────────────────────────────────

  it('ACT-0052-03 · Volver no guarda nada: es navegación del navegador', async () => {
    await montar();
    const objBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    try {
      objPantalla.volver();
      await asentar();

      expect(objBack).toHaveBeenCalledOnce();
      // Y ni un PUT: "Regresa a la bandeja sin guardar" (ACT-0052-03 del anexo).
      expect(dicPayloadEnviado()).toBeNull();
      expect(dicBorradorEnviado()).toBeNull();
    } finally {
      objBack.mockRestore();
    }
  });

  // ── FLD-355 · el adjunto ───────────────────────────────────────────────────────────────────────

  it('FLD-355 · un adjunto aceptado deja el NOMBRE en el control y el binario para el submit', async () => {
    await montar();
    await escribirComentario('Adjunto la liquidación.');

    // El contrato de la convención de adjuntos: el control guarda el nombre (es lo que viaja a PM4 y
    // lo que el usuario ve), el binario queda en `FileRegistryService` hasta el submit.
    objPantalla.alAceptarAdjunto(new File(['xx'], 'liquidacion.xlsx'));
    await asentar();
    expect(objPantalla.form.get(QD.strAreaAttach)?.value).toBe('liquidacion.xlsx');
    expect(objPantalla.strErrorAdjunto()).toBe('');

    void objPantalla.enviar();
    // El POST no nace en el mismo microtask que el `enviar()`: `enviarCon()` lo dispara detrás de sus
    // propios `await`, así que un solo `asentar()` dejaba al `expectOne` de abajo sin encontrar nada
    // —y el POST colgado, que hacía fallar el `verify()` del `afterEach` y con él los dos casos
    // siguientes del archivo. Ver `asentarHasta()`.
    await asentarHasta('POST');

    // Y el POST del binario sale **antes** del PUT: el `<docKey>_id` que PM4 devuelve viaja dentro del
    // mismo `data`, así que sin subir primero no hay id que mandar ni que meter en la fila.
    //
    // ⚠ Se compara contra `urlWithParams` y **no** contra `url` + `request.params`, porque
    // `AttachmentsService.subir()` interpola el `data_name` **dentro del string de la URL**
    // (`/requests/${id}/files?data_name=${docKey}`) en vez de pasarlo por `HttpParams`. Con esa forma,
    // `request.url` conserva la query y `request.params` queda **vacío**: el predicado que comparaba
    // `url === '/api/requests/55/files'` no matcheaba nada y el POST quedaba colgado, lo que hacía
    // fallar el `verify()` del `afterEach` y con él los dos casos siguientes del archivo. El error
    // decía `found none. Requests received are: POST /api/requests/55/files?data_name=...` — la
    // petición correcta, rechazada por la expectativa. Y la forma del servicio es la del contrato
    // documentado (`?data_name=` en la query), así que lo que se corrige es el spec.
    const objPost = objMock.expectOne(
      (in_objReq) =>
        in_objReq.method === 'POST' &&
        in_objReq.urlWithParams ===
          `/api/requests/${INT_REQUEST_ID}/files?data_name=${QD.strAreaAttach}`,
    );
    objPost.flush({ fileUploadId: 4242 });
    await asentar();

    expect(await responderPadre({ [QD.lstAssignHistory]: [filaHistorial('0'), filaHistorial('1')] })).toBe(
      true,
    );

    const dicPayload = dicPayloadEnviado();
    expect(dicPayload![`${QD.strAreaAttach}_id`]).toBe(4242);
    // El id también entra en la fila del historial, que es de donde el Analista SAC lo descarga.
    const cllHistorial = dicPayload![QD.lstAssignHistory] as AsignacionHistorial[];
    expect(cllHistorial[1].adjunto).toBe('liquidacion.xlsx');
    expect(cllHistorial[1].adjuntoFileId).toBe(4242);
  });

  it('FLD-355 · un adjunto rechazado LIMPIA el que ya estaba, no solo pinta el error', async () => {
    await montar();

    objPantalla.alAceptarAdjunto(new File(['xx'], 'valido.pdf'));
    await asentar();
    expect(objPantalla.form.get(QD.strAreaAttach)?.value).toBe('valido.pdf');

    objPantalla.alRechazarAdjunto('El archivo excede 10 MB');
    await asentar();

    // **La limpieza es la mitad que importa.** Si el usuario ya había elegido un archivo válido y el
    // segundo se rechaza, dejar el anterior mandaría a PM4 un nombre que no corresponde al archivo que
    // el usuario cree que subió — y el error pintado hace pensar que nada se guardó.
    expect(objPantalla.strErrorAdjunto()).toBe('El archivo excede 10 MB');
    expect(objPantalla.form.get(QD.strAreaAttach)?.value).toBe('');

    // Y sin binario en el registro, el submit no dispara ningún POST.
    await escribirComentario('Sigo sin adjunto.');
    void objPantalla.enviar();
    await asentar();
    expect(
      objMock.match((in_objReq) => in_objReq.method === 'POST'),
      'un adjunto rechazado no debe subirse',
    ).toHaveLength(0);

    expect(await responderPadre({ [QD.lstAssignHistory]: [filaHistorial('0'), filaHistorial('1')] })).toBe(
      true,
    );
    expect(dicPayloadEnviado()).not.toBeNull();
  });

  it('FLD-355 · el mensaje de extensión interpola el tope de MB de la constante', async () => {
    await montar();

    // El número sale de `SCR0052_MAX_ADJUNTO_MB`, no de un literal en la plantilla: es lo que impide
    // que el texto y el `[maxSizeMb]` se despeguen la primera vez que alguien cambie el tope.
    expect(objPantalla.intMaxAdjuntoMb).toBe(10);
    expect(objPantalla.strMensajeExtension).toContain('máx 10 MB');

    // Y las extensiones se pasan explícitas porque el default del wrapper NO incluye `xls`/`xlsx`, que
    // es el formato en el que un área responsable tiene sus liquidaciones.
    expect(objPantalla.cllExtensiones).toContain('xlsx');
    expect(objPantalla.cllExtensiones).toContain('xls');
  });
});
