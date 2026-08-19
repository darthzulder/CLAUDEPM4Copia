import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cllCamposDeLaFachada } from '../../../../components/fields/contrato-pantalla';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import {
  QD,
  SCR0051_MAX_AYUDANTES,
  SCR0051_SLA_UMBRAL_PRORROGA,
} from '../fields/fields';
import type { AsignacionHistorial } from '../fields/types';
import { DetalleReasignacionRespuesta } from './detalle-reasignacion-respuesta';
// Solo para el `By.directive()` del caso de las columnas de S7 — ver ahí por qué no va por el DOM.
import { SeccionAsignacion } from './seccion-asignacion';

/**
 * SCR-0051 · Detalle / Reasignación / Respuesta — **un caso por RUL del anexo**, no un smoke.
 *
 * Hereda el harness de SCR-012 (`fijarQueryString` antes de `createComponent`, `detectChanges()` antes
 * del `expectOne`, `flush` antes del `await`, drenado **solo GET**, `objMock.verify()` en el
 * `afterEach`). El expediente completo tiene su **propio** archivo
 * (`expediente-completo-modal.spec.ts`) porque se asevera desde un snapshot de datos puro, sin tarea ni
 * form. Lo que este archivo agrega respecto de los specs anteriores, y el porqué:
 *
 * ── 1. Los tres PUT distintos se distinguen por URL, no por orden ────────────────────────────────
 * La pantalla despacha por tres caminos y cada uno pega a un endpoint diferente:
 *   · `ENVIAR` / `AYUDA` / `SOLICITAR_PRORROGA` → `PUT /api/tasks/{id}` con `{status:'COMPLETED', data}`
 *   · `GUARDAR_BORRADOR`                        → `PUT /api/requests/{rid}` con `{data}`
 *   · `CONFIRMAR_ASIGNACION`                    → **DOS** PUT: `/tasks/{id}` con SOLO `{user_id}`, y
 *                                                 después `/requests/{rid}` con `{data}`
 * Aseverar "el primer PUT" haría verdes dos implementaciones distintas: la correcta y una que mande
 * `{status:'COMPLETED', data}` a `/tasks/{id}` en la reasignación (que PM4 acepta con 200 **y no
 * reasigna a nadie**). Por eso cada helper filtra por método **y** URL.
 *
 * ── 2. FLD-156/179 se prueba con el par cambio/no-cambio, y el "no cambio" es el que guarda ──────
 * La marcación derivada fuerza `qd_strMarking='2'` cuando algún campo de clasificación se movió
 * respecto del snapshot congelado en la precarga. Un `effect` que escriba `'2'` **siempre** pasa el
 * caso del cambio sin problema: el único input que lo distingue es un caso donde nada se movió y la
 * marcación tiene que **quedarse** en lo que trajo PM4. Van los dos, y el segundo es el que se muta.
 *
 * ── 3. RUL-0051-03 usa una fecha de radicación calculada, nunca un literal ───────────────────────
 * El SLA crítico se deriva de días hábiles restantes contra `new Date()`. Un `'2026-08-01'` escrito a
 * mano deja de ser "recién radicado" mañana, y el caso de SLA holgado pasaría a probar el crítico sin
 * que nada se ponga rojo. Misma trampa que en SCR-012, misma salida: `isoDesplazado()`.
 *
 * ── 4. `blnCargandoUsuarios` obliga a responder `/groups` con forma, no con `{data:[]}` ──────────
 * S5 resuelve el usuario elegido contra la lista que `usuariosDeGrupo()` trae de PM4, y el `user_id`
 * del PUT sale de **esa** lista (no de `qd_strAssigneeUser`, que guarda el username). Un drenado
 * genérico que devuelva `{data:[]}` deja la lista vacía, `objUsuarioElegido()` en `undefined` y el
 * botón de confirmar apagado — así que los casos de reasignación siembran los dos GET a mano
 * (`/groups` y `/groups/{id}/users`) antes de drenar el resto.
 */
const INT_TASK_ID = 51;
const INT_REQUEST_ID = 7051;

const OBJ_ENV_VACIO = { strTaskId: '', strCaseId: '', strProcessId: '', strEventId: '', strToken: '' };

/** El grupo PM4 que se usa en los casos de reasignación, y su id numérico. */
const STR_AREA = 'Servicio al Cliente';
const INT_GRUPO_ID = 9;

/**
 * El usuario al que se reasigna. `strUsername` es lo que guarda `qd_strAssigneeUser`; `intId` es el
 * único valor con el que PM4 reasigna de verdad, y es el que el PUT tiene que llevar.
 */
const STR_USUARIO = 'mrios';
const INT_USUARIO_ID = 412;

let objFixture: ComponentFixture<DetalleReasignacionRespuesta>;
let objPantalla: DetalleReasignacionRespuesta;
let objMock: HttpTestingController;

/**
 * Fecha ISO `DD/MM/YYYY` desplazada `n` días respecto de hoy — el formato con el que PM4 devuelve
 * `qd_strFilingDate` y que `parsePm4Date` espera (ver su docstring: `DD/MM`, no `MM/DD`).
 *
 * Se calcula y no se escribe a mano por lo dicho en el punto 3 de la cabecera.
 */
function fechaPm4Desplazada(in_intDias: number): string {
  const objHoy = new Date();
  const objFecha = new Date(objHoy.getFullYear(), objHoy.getMonth(), objHoy.getDate() + in_intDias);
  const strDia = String(objFecha.getDate()).padStart(2, '0');
  const strMes = String(objFecha.getMonth() + 1).padStart(2, '0');
  return `${strDia}/${strMes}/${objFecha.getFullYear()}`;
}

/**
 * `task.data` de un caso vivo: consumidor, clasificación, SLA holgado y sin respuesta redactada.
 *
 * El SLA arranca **holgado** (radicado hoy, 15 días) para que el gate de prórroga esté cerrado por
 * defecto: el caso crítico lo pide explícitamente, así que un cambio que deje `blnSlaCritico` siempre
 * en `true` rompe el caso holgado en vez de pasar los dos.
 */
function datosTarea(): Record<string, unknown> {
  return {
    [QD.strBpmCaseId]: 'QD-2026-000123',
    [QD.strSfcCode]: 'SFC-9911',
    [QD.strFirstName]: 'María Fernanda',
    [QD.strLastName]: 'Ríos',
    [QD.strIdType]: 'CC',
    [`${QD.strIdType}_desc`]: 'Cédula de Ciudadanía',
    [QD.strIdNumber]: '52.844.107',
    [QD.strRequestType]: '2',
    [QD.strComplaintText]: 'No recibí respuesta a mi solicitud de reembolso.',
    // Clasificación regulatoria — es el snapshot que congela FLD-156/179.
    //
    // ⚠ `qd_strInteraction` guarda la **prosa** de la columna `interaccion` de la matriz, no un código:
    // la matriz guarda texto en momento y servicio, y solo el motivo es un código real (ver
    // `limpiarSiFuera()`). Con un `'3'` acá, `blnIsAsistencias` —que es un `/asistencias/i.test()` sobre
    // este campo— da `false`, `limpiarServicio()` vacía el servicio precargado, y FLD-156/179 arranca
    // creyendo que la clasificación ya cambió. Costó un rato: el síntoma era una marcación en `'2'` recién
    // montada, sin que nadie hubiera escrito nada.
    //
    // Se elige un momento que NO es Asistencias, así que el servicio va vacío: es la combinación
    // coherente. El caso de Asistencias con servicio va aparte.
    [QD.strSfcProduct]: '104',
    [QD.strInteraction]: 'Venta',
    [QD.strServiceProvided]: '',
    [QD.strPlate]: 'ABC123',
    [QD.strSfcReason]: '77',
    [QD.strMarking]: '1',
    // SLA holgado: radicado hoy, 15 días hábiles.
    [QD.strFilingDate]: fechaPm4Desplazada(0),
    [QD.strSlaAssigned]: '15',
    // Asignación actual.
    [QD.strCurrentAssignee]: 'jperez',
    [QD.strAssigneeArea]: STR_AREA,
    [QD.strAssigneeUser]: STR_USUARIO,
    [QD.strRevisionVersion]: 'v2',
    // Ruido deliberado: `task.data` trae el caso entero y `precargar()` filtra por claves declaradas.
    qd_strNoExisteEnEstaPantalla: 'basura',
  };
}

function tarea(in_dicDatos: Record<string, unknown>): Record<string, unknown> {
  return { id: INT_TASK_ID, process_request_id: INT_REQUEST_ID, data: in_dicDatos };
}

function fijarQueryString(in_strQuery: string): void {
  window.history.replaceState({}, '', '/' + in_strQuery);
}

/** Bajo `provideZonelessChangeDetection()`, `whenStable()` por sí solo NO repinta. Ver SCR-012. */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

const INT_MAX_VUELTAS_DRENADO = 8;

/**
 * Consume las peticiones que la pantalla dispara por su cuenta (feriados, plantillas de correo, matriz
 * de motivos, grupos), para que el `verify()` del `afterEach` no falle por una petición legítima.
 *
 * **Drena solo `GET`.** Drenar los PUT dejaría consumido justo lo que aseveran `dicPayloadTarea()` y
 * `dicPayloadRequest()`: el caso de "no despacha nada" pasaría igual que si la pantalla hubiera
 * despachado. Es el mismo argumento de SCR-012, y acá pesa más porque hay tres endpoints de escritura.
 */
async function drenarPeticiones(): Promise<void> {
  for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DRENADO; intVuelta++) {
    await asentar();
    const cllPendientes = objMock.match((in_objReq) => in_objReq.method === 'GET');
    if (cllPendientes.length === 0) return;
    for (const objPeticion of cllPendientes) {
      if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
    }
  }
  throw new Error(
    `El drenado no convergió en ${INT_MAX_VUELTAS_DRENADO} vueltas: ` +
      objMock
        .match(() => true)
        .map((in_objPet) => `${in_objPet.request.method} ${in_objPet.request.urlWithParams}`)
        .join(', '),
  );
}

/**
 * Responde los dos GET de `Pm4GroupsService.usuariosDeGrupo()` con un grupo y un miembro reales.
 *
 * ⚠ El miembro llega con la forma **pivote** de PM4 (`group_members`): el `id` de arriba es el del
 * registro de pertenencia y el usuario real vive en `member`. Devolver `{id, username}` planos —lo
 * intuitivo— haría que el port resolviera el id del pivote como id de usuario, que es un fallo
 * silencioso: PM4 responde 200 y reasigna a otra persona (o a nadie). Ver `usuariosDeGrupo()`.
 */
/**
 * Cuando está en `true`, `responderGrupos()` devuelve el grupo **sin miembros utilizables**. Es el
 * escenario de RUL-0051-01-bis (dato legado: el username del caso no pertenece al grupo), y va como
 * bandera de módulo porque el drenado lo hacen `clic()`/`escribir()`, que no reciben opciones.
 *
 * Se resetea en el `beforeEach` para que un caso no herede el escenario del anterior.
 */
let blnGrupoVacio = false;

async function responderGrupos(): Promise<void> {
  // ⚠ Hacen falta DOS vueltas limpias seguidas para dar el drenado por terminado, no una.
  // `usuariosDeGrupo()` es una cadena de dos GET: al responder el `/groups` el segundo (`/{id}/users`)
  // no existe todavía en el `HttpTestingController` —nace del `then` del primero, o sea en un turno de
  // microtareas posterior—, y un `asentar()` que caiga en el hueco entre los dos ve la cola vacía y
  // corta. La petición aparece después, sin nadie que la responda, y el `verify()` del `afterEach`
  // revienta atribuyéndola al caso siguiente. Ya costó dos vueltas.
  let intVueltasLimpias = 0;
  for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DRENADO; intVuelta++) {
    await asentar();
    const cllPendientes = objMock.match((in_objReq) => in_objReq.method === 'GET');
    if (cllPendientes.length === 0) {
      if (++intVueltasLimpias >= 2) return;
      continue;
    }
    intVueltasLimpias = 0;

    // Un solo barrido que responde **cada** GET pendiente con la forma que le corresponde. Separar el
    // de grupos del drenado genérico en dos pasadas no funciona: los dos `/groups` (S5 y S6, área
    // destino) nacen del `effect` que reacciona al `patchValue`, así que aparecen recién después de la
    // primera vuelta y el drenado genérico los tomaría antes con `{data:[]}` — la lista de usuarios
    // quedaría vacía y el confirmar apagado, exactamente lo que estos casos quieren descartar.
    for (const objPeticion of cllPendientes) {
      if (objPeticion.cancelled) continue;
      const strUrl = objPeticion.request.url;
      if (strUrl === '/api/groups') {
        objPeticion.flush({ data: [{ id: INT_GRUPO_ID, name: STR_AREA }] });
      } else if (strUrl === `/api/groups/${INT_GRUPO_ID}/users`) {
        objPeticion.flush({
          data: blnGrupoVacio
            ? []
            : [
                {
                  // Forma **pivote** de PM4 (`group_members`), tal como la documenta
                  // `usuariosDeGrupo()`: los campos son planos y el id real del usuario viaja en
                  // `member_id`; el `id` de arriba es el de la fila de pertenencia. No va anidado bajo
                  // un `member` — inventar esa anidación deja el `username` en `undefined`, el registro
                  // se descarta por el `.filter()` del servicio y el confirmar queda apagado sin que
                  // ningún assert diga por qué. Ya costó una vuelta.
                  id: 88888, // id del PIVOTE — no debe viajar en el PUT.
                  member_id: INT_USUARIO_ID,
                  username: STR_USUARIO,
                  firstname: 'María',
                  lastname: 'Ríos',
                },
              ],
        });
      } else {
        objPeticion.flush({ data: [] });
      }
    }
  }
  // ⚠ Si esto revienta con peticiones a `/api/groups` en la lista, la causa más probable NO es que al
  // drenado le falten vueltas: es que los `effect()` de carga de usuarios en `seccion-asignacion.ts`
  // volvieron a rastrear todo el formulario. `leer()` lee el objeto de valores completo y
  // `cargarUsuariosDelAreaDestino()` escribe en el form, así que sin el `computed` de un campo + el
  // `untracked()` la cosa se realimenta y la cola nunca se vacía. Ver el caso "(effect acotado)".
  throw new Error(
    `El drenado con grupos no convergió en ${INT_MAX_VUELTAS_DRENADO} vueltas ` +
      '(¿los effect de carga de usuarios volvieron a rastrear todo el form? ver el caso ' +
      '«effect acotado»): ' +
      objMock
        .match(() => true)
        .map((in_objPet) => `${in_objPet.request.method} ${in_objPet.request.urlWithParams}`)
        .join(', '),
  );
}

/**
 * Monta la pantalla con la tarea ya respondida. El orden de las tres partes es contrato — ver el
 * docstring de `montar()` en el spec de SCR-012 (query string antes de crear, `detectChanges()` antes
 * del `expectOne`, `flush` antes del `await`).
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
  objFixture = TestBed.createComponent(DetalleReasignacionRespuesta);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  objFixture.detectChanges();
  objMock
    .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
    .flush(tarea(in_dicDatos));
  await responderGrupos();
}

/**
 * Escribe en el form como lo haría el usuario, y deja el `sigValores` ya propagado.
 *
 * El tipo del parámetro **no** es `Record<string, unknown>`: el `FormGroup` de la pantalla está tipado
 * y `patchValue` rechaza un `unknown` (TS2345). La unión es la del propio `FormGroup` — incluido
 * `AsignacionHistorial[]`, porque el control del historial no es de texto.
 */
async function escribir(
  in_dicCampos: Record<string, string | number | boolean | AsignacionHistorial[] | null>,
): Promise<void> {
  objPantalla.form.patchValue(in_dicCampos);
  // Igual que `clic()`: escribir el área destino de S6 dispara su propia carga de usuarios, así que el
  // drenado tiene que saber responder `/groups` con forma. Ver el comentario de `clic()`.
  await responderGrupos();
}

/**
 * El `data` del PUT a `/tasks/{id}` (completar), o `null` si no lo hubo. Consume la petición.
 *
 * ⚠ Filtra por método **y** URL, y además exige que el cuerpo traiga `data`: el PUT de reasignación
 * también pega a `/tasks/{id}`, pero con `{user_id}` solo. Sin esa distinción, el caso de
 * `CONFIRMAR_ASIGNACION` haría verde a una implementación que completara la tarea en vez de
 * reasignarla. Ver el punto 1 de la cabecera.
 */
function dicPayloadTarea(): Record<string, unknown> | null {
  const cllPuts = objMock.match(
    (in_objReq) =>
      in_objReq.method === 'PUT'
      && in_objReq.url === `/api/tasks/${INT_TASK_ID}`
      && !!(in_objReq.body as { data?: unknown } | null)?.data,
  );
  if (cllPuts.length === 0) return null;
  const objCuerpo = cllPuts[0].request.body as { status: string; data: Record<string, unknown> };
  expect(objCuerpo.status, 'el PUT de completado tiene que mandar status COMPLETED').toBe('COMPLETED');
  cllPuts[0].flush({});
  return objCuerpo.data;
}

/** El `data` del PUT a `/requests/{rid}` (borrador y segundo PUT de la reasignación). Consume. */
function dicPayloadRequest(): Record<string, unknown> | null {
  const cllPuts = objMock.match(
    (in_objReq) => in_objReq.method === 'PUT' && in_objReq.url === `/api/requests/${INT_REQUEST_ID}`,
  );
  if (cllPuts.length === 0) return null;
  const objCuerpo = cllPuts[0].request.body as { data: Record<string, unknown> };
  cllPuts[0].flush({});
  return objCuerpo.data;
}

/** El cuerpo del PUT de reasignación a `/tasks/{id}` — el que lleva SOLO `user_id`. Consume. */
function objPayloadReasignacion(): Record<string, unknown> | null {
  const cllPuts = objMock.match(
    (in_objReq) =>
      in_objReq.method === 'PUT'
      && in_objReq.url === `/api/tasks/${INT_TASK_ID}`
      && !(in_objReq.body as { data?: unknown } | null)?.data,
  );
  if (cllPuts.length === 0) return null;
  const objCuerpo = cllPuts[0].request.body as Record<string, unknown>;
  cllPuts[0].flush({});
  return objCuerpo;
}

/** Un `lib-button-z` por su rótulo, o `null`. */
function objBoton(in_strRotulo: string): HTMLElement | null {
  return objFixture.nativeElement.querySelector(
    `lib-button-z[label="${in_strRotulo}"]`,
  ) as HTMLElement | null;
}

/**
 * Hace clic en un botón del DS.
 *
 * ⚠ El handler vive en el `za-button` **interno**, no en el host `lib-button-z`: despachar el evento
 * sobre el host no dispara nada y el caso pasaría en verde sin haber hecho clic. Y un `lib-button-z`
 * deshabilitado **igual** dispara bajo jsdom (trampa 1 de testing-conventions.md), así que un clic
 * exitoso no prueba que el botón esté habilitado — para eso está `blnDeshabilitado()`.
 */
async function clic(in_strRotulo: string): Promise<void> {
  const objHost = objBoton(in_strRotulo);
  expect(objHost, `no se montó el botón «${in_strRotulo}»`).not.toBeNull();
  const objInterno = objHost!.querySelector('za-button');
  expect(objInterno, `el botón «${in_strRotulo}» no renderizó su za-button interno`).not.toBeNull();
  objInterno!.dispatchEvent(new Event('click', { bubbles: true }));
  // ⚠ Drena con `responderGrupos()` y no con `asentar()` a secas: entrar en modo reasignación es lo que
  // **dispara** la carga de usuarios de S5 (`cargarUsuariosDelArea()` corta temprano si
  // `blnModoReasignacion()` es `false`), así que los dos GET de `/groups` nacen del clic. Dejarlos sin
  // responder los deja abiertos y el caso falla recién en el `verify()` del `afterEach`, con el error
  // atribuido al caso siguiente —que además revienta con "test module already instantiated", porque el
  // `resetTestingModule()` quedó del otro lado del throw. Ya costó una vuelta.
  await responderGrupos();
}

/**
 * `[disabled]` tal como quedó bindeado en el `lib-button-z`.
 *
 * ⚠ Se lee de la **instancia del componente**, no del nodo del DOM: `ButtonZ` recibe `disabled` como
 * `@Input()` y lo reenvía a su `za-button` interno, pero **no** lo refleja como propiedad ni como
 * atributo del host. Leer `objHost.disabled` devuelve `undefined`, y un `expect(undefined).toBe(false)`
 * falla mientras un `toBeFalsy()` pasaría **siempre** — o sea, la variante permisiva de este helper no
 * asevera nada. Ya costó una vuelta: diez casos en rojo por esto.
 */
function blnDeshabilitado(in_strRotulo: string): boolean {
  const objDebug = objFixture.debugElement.query(By.css(`lib-button-z[label="${in_strRotulo}"]`));
  expect(objDebug, `no se montó el botón «${in_strRotulo}»`).not.toBeNull();
  const blnValor = (objDebug.componentInstance as { disabled: boolean }).disabled;
  expect(
    typeof blnValor,
    `el botón «${in_strRotulo}» no expone «disabled» como booleano — el helper quedó ciego`,
  ).toBe('boolean');
  return blnValor;
}

/** Texto plano de la pantalla, para aseverar avisos (`za-alert`) sin acoplarse a su markup interno. */
function strTexto(): string {
  return (objFixture.nativeElement as HTMLElement).textContent ?? '';
}

/**
 * `true` si la pantalla montó el campo `in_strNombre`.
 *
 * ⚠ Es lo que hay que usar para aseverar un bloque condicional **de campos**, no `strTexto()`. El
 * `label` de un `zds-*` viaja como `input()` al `lib-*-z`, que lo pinta dentro de su shadow root — y el
 * upgrade de Lit nunca corre bajo jsdom, así que la etiqueta **no aparece en `textContent`** ni cuando
 * el campo está perfectamente montado. Un `expect(strTexto()).toContain('Área Destino')` falla siempre y
 * su negación (`not.toContain`) pasa siempre: las dos direcciones mienten. `strTexto()` queda para los
 * `za-alert` y los textos que sí son hijos de luz.
 */
function blnCampoMontado(in_strNombre: string): boolean {
  return cllCamposDeLaFachada<string>(objFixture).some(
    (in_objCampo) => in_objCampo.name() === in_strNombre,
  );
}

describe('SCR-0051 · Detalle / Reasignación / Respuesta', () => {
  beforeEach(() => {
    // Sin el stub, el `setTimeout(0)` del scroll a error deja un `TypeError` como **error no
    // manejado**: Vitest reporta los casos en verde y un `Errors 1` aparte, fácil de leer como suite
    // limpia. Mismo motivo que en SCR-012.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    Element.prototype.scrollIntoView = () => {};
    blnGrupoVacio = false;
  });

  // ── Ruido aceptado: "Error: Not implemented: navigation (except hash changes)" ────────────────
  // Un borrador guardado con éxito navega el frame superior a la bandeja de PM4
  // (`objTop.location.href = ...`). jsdom no implementa la navegación y emite ese error al pie de
  // la corrida, **aparte** de los casos.
  //
  // NO se stubea `location`: se probó reemplazarlo por un objeto plano (`{ href: '' }`) y los 26
  // casos se pusieron rojos, porque el resolvedor de `task_id` y `fijarQueryString()` leen el
  // `location` real. El aviso es el precio de que el caso ejercite la navegación de verdad; se deja
  // documentado acá para que no se lea como suite sucia ni se vuelva a intentar el stub.

  afterEach(() => {
    // El `try/finally` es lo que evita que UNA petición sin responder se convierta en veinte rojos.
    // `verify()` **lanza**, así que sin el `finally` el `resetTestingModule()` queda del otro lado del
    // throw y todos los casos siguientes mueren con "Cannot configure the test module when the test
    // module has already been instantiated" — errores que no tienen nada que ver con lo que aseveran y
    // que tapan el fallo real. Con el `finally`, la fuga ensucia solo su propio caso.
    //
    // El `?` es load-bearing por lo mismo: un caso que falla antes de `montar()` deja `objMock` sin
    // asignar, y sin él el error real quedaría tapado por un "Cannot read properties of undefined".
    try {
      objMock?.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  // ── Precarga ───────────────────────────────────────────────────────────────────────────────────

  it('precarga el caso y descarta las claves ajenas a la pantalla', async () => {
    await montar();

    expect(objPantalla.form.get(QD.strBpmCaseId)?.value).toBe('QD-2026-000123');
    expect(objPantalla.form.get(QD.strSfcProduct)?.value).toBe('104');
    expect(objPantalla.form.get(QD.strAssigneeUser)?.value).toBe(STR_USUARIO);
    expect(objPantalla.form.get('qd_strNoExisteEnEstaPantalla')).toBeNull();
  });

  it('el historial llega como array y NO pasa por String() (quedaría "[object Object]")', async () => {
    await montar({
      ...datosTarea(),
      [QD.lstAssignHistory]: [
        { fecha: '2026-08-01', de: 'jperez', para: 'mrios', motivo: '', observaciones: 'Revisar' },
      ],
    });

    const genHistorial = objPantalla.form.get(QD.lstAssignHistory)?.value;
    expect(Array.isArray(genHistorial)).toBe(true);
    expect((genHistorial as { para: string }[])[0].para).toBe('mrios');
  });

  it('un historial que llega como basura (no array) queda en [] y no rompe la tabla', async () => {
    await montar({ ...datosTarea(), [QD.lstAssignHistory]: 'no soy un array' });

    expect(objPantalla.form.get(QD.lstAssignHistory)?.value).toEqual([]);
  });

  it('S7 · el historial no tiene columna Motivo (CAT-MOTIVO-REASIG retirado)', async () => {
    // ⚠ Hay que **sembrar** el historial: S7 va dentro de `@if (blnMostrarAyuda() || cllHistorial().length)`,
    // así que con el fixture por defecto la sección no existe y el `query` devuelve `null`. La primera
    // versión de este caso montaba pelado y fallaba por eso, no por las columnas — lo delató la guarda
    // de "la tabla tiene que estar montada", que por eso se queda.
    await montar({
      ...datosTarea(),
      [QD.lstAssignHistory]: [
        { fecha: '2026-08-01', de: 'jperez', para: 'mrios', motivo: 'dato histórico', observaciones: 'Revisar' },
      ],
    });

    // El *Motivo* (FLD-093) ya no se captura: `registrarAyuda()` escribe `motivo: ''`, así que la
    // columna pintaba vacío en todas las filas nuevas y salió en ago-2026. La clave **sigue** en
    // `AsignacionHistorial` —la fila de arriba la trae con dato a propósito— porque los casos
    // históricos ya la tienen guardada: esto asevera el display, no el modelo.
    //
    // ⚠ Se asevera el array de la sección y **no** el DOM de la tabla, y no por comodidad: bajo jsdom
    // `lib-table-z` es un custom element de Lit que no hace upgrade, y medido con una sonda, los
    // bindings de propiedad (`[headers]`, `[data]`, `[showGenericEnd]`) **no llegan a ninguna parte** —
    // ni a `nativeElement`, ni a `debugElement.properties`, ni a `attributes`, donde solo sobreviven
    // los atributos estáticos (`generciEndName`, `typeStyle`). O sea que un `querySelectorAll('th')` o
    // un `.headers` sale vacío con las columnas correctas Y con las incorrectas: sería la tautología
    // que el spec de SCR-0052 documenta. El array es el contrato que el componente ofrece a la tabla.
    const objSeccion = objFixture.debugElement.query(By.directive(SeccionAsignacion))
      ?.componentInstance as { cllColumnasHistorial?: readonly { title: string }[] } | undefined;
    const cllTitulos = (objSeccion?.cllColumnasHistorial ?? []).map((in_objCol) => in_objCol.title);

    expect(cllTitulos, 'la sección del historial tiene que estar montada').not.toHaveLength(0);
    expect(cllTitulos).not.toContain('Motivo');
    expect(cllTitulos).toEqual(['Fecha', 'De', 'Para', 'Observaciones', 'Respondió', 'Comentario']);
  });

  // ── RUL-0051-01 / 01-bis · reasignación y el usuario resuelto ──────────────────────────────────

  it('RUL-0051-01 · el modo reasignación arranca cerrado y lo abre «Reasignar Queja»', async () => {
    await montar();

    expect(objBoton('Confirmar Reasignación')).toBeNull();
    await clic('Reasignar Queja');
    expect(objBoton('Confirmar Reasignación')).not.toBeNull();
  });

  it('RUL-0051-01 · confirmar reasigna con el id numérico de PM4, NO con el username', async () => {
    await montar();
    await clic('Reasignar Queja');

    expect(blnDeshabilitado('Confirmar Reasignación')).toBe(false);
    await clic('Confirmar Reasignación');

    // Primer PUT: SOLO `user_id`, y con el id del `member` — no el del pivote ni el username.
    const objReasignacion = objPayloadReasignacion();
    expect(objReasignacion, 'la confirmación tiene que pegar a PUT /tasks/{id}').not.toBeNull();
    expect(objReasignacion![QD.strAssigneeUser]).toBeUndefined();
    expect(objReasignacion!['user_id']).toBe(String(INT_USUARIO_ID));
    expect(objReasignacion!['user_id']).not.toBe(STR_USUARIO);
    expect(objReasignacion!['user_id']).not.toBe('88888');

    // ⚠ El `await` es obligatorio, no cosmética: `reasignarTarea()` son dos PUT **en secuencia**, y el
    // segundo se emite en el `then` del primero. `objPayloadReasignacion()` recién acaba de hacerle
    // `flush()` al primero, así que en este instante el segundo todavía no existe en el
    // `HttpTestingController` — leerlo sin ceder el turno devuelve `null` y el caso falla acusando a la
    // implementación de no mandar el segundo PUT, que sí lo manda.
    await asentar();

    // Segundo PUT: los datos, a `/requests/{rid}`. Y la acción, para que PM4 rutee.
    const dicDatos = dicPayloadRequest();
    expect(dicDatos, 'el segundo PUT de la reasignación va a /requests/{rid}').not.toBeNull();
    expect(dicDatos![QD.strAction]).toBe('CONFIRMAR_ASIGNACION');

    // Y NO completa la tarea: un `{status:'COMPLETED'}` acá cerraría el nodo en vez de reasignarlo.
    expect(dicPayloadTarea()).toBeNull();
  });

  it('RUL-0051-01-bis · sin usuario resuelto avisa y deja apagado el confirmar', async () => {
    // El grupo existe pero no trae miembros: el username precargado no resuelve contra ninguna
    // opción, así que no hay `user_id` para el PUT. Es el caso del dato legado.
    blnGrupoVacio = true;
    await montar();
    await clic('Reasignar Queja');

    expect(blnDeshabilitado('Confirmar Reasignación')).toBe(true);
    expect(strTexto()).toContain('no tiene usuarios disponibles en ProcessMaker');

    // Y el clic sobre el botón apagado no despacha: el corte real vive en el handler, porque un
    // `lib-button-z` deshabilitado igual dispara bajo jsdom.
    await clic('Confirmar Reasignación');
    expect(objPayloadReasignacion()).toBeNull();
    expect(dicPayloadRequest()).toBeNull();
  });

  it('la carga de usuarios NO se re-dispara al escribir un campo ajeno al área (effect acotado)', async () => {
    // ── Qué regla cubre, y por qué existe ────────────────────────────────────────────────────────
    // Es una regla del PORTE, sin contraparte en React: allá las cargas colgaban de un `useEffect`
    // con `[area]` como dependencia, y el array es explícito. Acá son dos `effect()` de señales, y
    // el rastreo es **automático**: leen lo que toquen mientras corren.
    //
    // El cuerpo de los dos efectos llama a `leer()`, que hace `this.sigValores()()[campo]` — o sea
    // **lee el objeto de valores completo**, no un campo. Así que se suscriben a TODO el formulario.
    // Y `cargarUsuariosDelAreaDestino()` además **escribe** (`qd_strNewAssignee`). Escribir mueve
    // `sigValores` → el efecto se vuelve a disparar → dos GET más → vuelve a escribir: no converge.
    // En el navegador eso martilla `/api/groups` sin techo.
    //
    // El arreglo es doble, en `seccion-asignacion.ts`: dos `computed` de UN campo cada uno
    // (`strAreaGestor`/`strAreaDestino`) como única dependencia rastreada, y el cuerpo dentro de
    // `untracked()`. El `computed` recalcula con cada cambio pero solo **notifica** cuando su propio
    // string cambia, así que el efecto queda atado al área y a nada más.
    //
    // ── Por qué el assert cuenta peticiones y no mira la pantalla ────────────────────────────────
    // El bucle es invisible desde el DOM: la lista de usuarios termina igual. Y `responderGrupos()`
    // absorbe la avalancha —para eso drena en vueltas—, así que un caso que solo asertara sobre el
    // resultado quedaría verde con el efecto desbocado puesto. Lo único que delata la regla es
    // **cuántas veces** se pegó a `/api/groups`.
    // ⚠ El área destino tiene que estar RESUELTA antes de medir, y el drenado tiene que responder con
    // el grupo de verdad. `cargarUsuariosDelAreaDestino()` solo escribe (`qd_strNewAssignee`) cuando
    // el grupo trae usuarios utilizables: si el drenado contesta `{data:[]}`, no hay escritura, no hay
    // realimentación, y el caso se pone verde con el efecto desbocado puesto. Costó una vuelta de
    // mutación descubrirlo — es el modo exacto en que este caso puede volverse decorativo.
    await montar();
    await escribir({ [QD.strNeedsOtherAreas]: 'SI', [QD.strTargetArea]: STR_AREA });

    // El contador arranca DESPUÉS de eso: la precarga y la resolución del área tienen derecho a sus
    // cargas. Lo que se mide es el delta de una escritura ajena al área.
    expect(
      objMock.match(() => true).length,
      'el montaje y la resolución del área tenían que dejar la cola drenada',
    ).toBe(0);

    // Se escribe la respuesta al cliente: un campo que nada tiene que ver con las áreas. Con el
    // efecto acotado esto no dispara NINGÚN GET a grupos; con el rastreo abierto dispara los dos y
    // se realimenta.
    let intPeticionesGrupos = 0;
    objPantalla.form.patchValue({ [QD.strClientResponse]: 'Texto de respuesta al cliente.' });
    for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DRENADO; intVuelta++) {
      await asentar();
      const cllPendientes = objMock.match((in_objReq) => in_objReq.method === 'GET');
      if (cllPendientes.length === 0) break;
      for (const objPeticion of cllPendientes) {
        if (objPeticion.cancelled) continue;
        const strUrl = objPeticion.request.url;
        if (strUrl.startsWith('/api/groups')) intPeticionesGrupos++;
        // Se contesta con FORMA, no con `{data:[]}`, por el motivo del comentario de arriba: un grupo
        // vacío corta la realimentación y el caso dejaría de detectar la rotura.
        if (strUrl === '/api/groups') {
          objPeticion.flush({ data: [{ id: INT_GRUPO_ID, name: STR_AREA }] });
        } else if (strUrl === `/api/groups/${INT_GRUPO_ID}/users`) {
          objPeticion.flush({
            data: [{ id: 88888, member_id: INT_USUARIO_ID, username: STR_USUARIO }],
          });
        } else {
          objPeticion.flush({ data: [] });
        }
      }
    }

    expect(
      intPeticionesGrupos,
      'escribir un campo ajeno al área volvió a cargar los usuarios: el effect está rastreando todo ' +
        'el formulario (le falta el computed de un campo + untracked en seccion-asignacion.ts)',
    ).toBe(0);
  });

  // ── RUL-0051-03 · SLA y el gate de la prórroga ─────────────────────────────────────────────────

  it('RUL-0051-03 · con SLA holgado no hay banner crítico y la prórroga está apagada', async () => {
    await montar();

    expect(objPantalla.blnSlaCritico()).toBe(false);
    expect(blnDeshabilitado('Solicitar Prórroga Regulatoria')).toBe(true);
  });

  it('RUL-0051-03 · en zona crítica (≤ umbral) aparece el banner y se habilita la prórroga', async () => {
    // Radicado hace 30 días naturales con SLA de 1 día hábil: los días restantes quedan bien por
    // debajo del umbral sin depender de qué feriados traiga la colección (drenada en `{data:[]}`).
    await montar({
      ...datosTarea(),
      [QD.strFilingDate]: fechaPm4Desplazada(-30),
      [QD.strSlaAssigned]: '1',
    });

    expect(objPantalla.intDiasRestantes()).toBeLessThanOrEqual(SCR0051_SLA_UMBRAL_PRORROGA);
    expect(objPantalla.blnSlaCritico()).toBe(true);
    expect(strTexto()).toContain('solicitar prórroga regulatoria');
    expect(blnDeshabilitado('Solicitar Prórroga Regulatoria')).toBe(false);
  });

  it('sin fecha de radicación parseable el SLA no es calculable y la prórroga queda cerrada', async () => {
    await montar({ ...datosTarea(), [QD.strFilingDate]: '', [QD.strSlaAssigned]: '' });

    expect(objPantalla.blnSlaCalculable()).toBe(false);
    expect(objPantalla.blnSlaCritico()).toBe(false);
  });

  // ── RUL-0051-04 / 07 / 08 · la ayuda a otras áreas ─────────────────────────────────────────────

  it('RUL-0051-07 · el bloque de ayuda solo aparece con el radio en SI', async () => {
    await montar();

    expect(blnCampoMontado(QD.strTargetArea)).toBe(false);
    await escribir({ [QD.strNeedsOtherAreas]: 'SI' });
    expect(blnCampoMontado(QD.strTargetArea)).toBe(true);
  });

  it('RUL-0051-04 · sin área destino y sin observaciones el confirmar de ayuda está apagado', async () => {
    await montar();
    await escribir({ [QD.strNeedsOtherAreas]: 'SI' });

    expect(blnDeshabilitado('Confirmar Solicitud de Ayuda')).toBe(true);
    expect(strTexto()).toContain('Indique el área destino y qué necesita de ella');

    // Solo el área no alcanza: las observaciones también son obligatorias.
    await escribir({ [QD.strTargetArea]: STR_AREA });
    expect(blnDeshabilitado('Confirmar Solicitud de Ayuda')).toBe(true);

    // Espacios en blanco tampoco: el `trim()` es parte de la regla.
    await escribir({ [QD.strReassignRemarks]: '    ' });
    expect(blnDeshabilitado('Confirmar Solicitud de Ayuda')).toBe(true);

    await escribir({ [QD.strReassignRemarks]: 'Necesito el concepto técnico del siniestro.' });
    expect(blnDeshabilitado('Confirmar Solicitud de Ayuda')).toBe(false);
  });

  it('RUL-0051-04 · la ayuda despacha AYUDA con la fila nueva del historial y el número 1-based', async () => {
    await montar();
    await escribir({ [QD.strNeedsOtherAreas]: 'SI' });
    await escribir({
      [QD.strTargetArea]: STR_AREA,
      [QD.strReassignRemarks]: 'Necesito el concepto técnico del siniestro.',
    });
    await clic('Confirmar Solicitud de Ayuda');

    const dicDatos = dicPayloadTarea();
    expect(dicDatos, 'la ayuda completa la tarea (subproceso)').not.toBeNull();
    expect(dicDatos![QD.strAction]).toBe('AYUDA');
    expect(dicDatos![QD.intHelpNumber]).toBe(1);

    // El payload llega **armado por la sección**: los tres campos del mini-formulario viajan con el
    // valor que tenían, aunque los `setValue('')` de la limpieza ya los vaciaron en pantalla.
    expect(dicDatos![QD.strTargetArea]).toBe(STR_AREA);
    expect(dicDatos![QD.strReassignRemarks]).toBe('Necesito el concepto técnico del siniestro.');
    // CAT-MOTIVO-REASIG quedó retirado, pero el campo sigue viajando vacío por SCR-0052.
    expect(dicDatos![QD.strReassignReason]).toBe('');

    const cllHistorial = dicDatos![QD.lstAssignHistory] as { de: string; observaciones: string }[];
    expect(cllHistorial).toHaveLength(1);
    expect(cllHistorial[0].de).toBe('jperez');
    expect(cllHistorial[0].observaciones).toBe('Necesito el concepto técnico del siniestro.');
  });

  it('RUL-0051-08 · con el tope de ayudantes alcanzado se reemplaza el formulario por el aviso', async () => {
    const cllTope = Array.from({ length: SCR0051_MAX_AYUDANTES }, (_in_gen, in_intIdx) => ({
      fecha: '2026-08-0' + (in_intIdx + 1),
      de: 'jperez',
      para: 'ayudante' + in_intIdx,
      motivo: '',
      observaciones: 'Ayuda ' + in_intIdx,
    }));
    await montar({ ...datosTarea(), [QD.lstAssignHistory]: cllTope });
    await escribir({ [QD.strNeedsOtherAreas]: 'SI' });

    expect(strTexto()).toContain(`Ya se solicitó ayuda a ${SCR0051_MAX_AYUDANTES} áreas`);
    // No es un "deshabilitado": el formulario entero desaparece.
    expect(objBoton('Confirmar Solicitud de Ayuda')).toBeNull();
    expect(blnCampoMontado(QD.strTargetArea)).toBe(false);
  });

  // ── FLD-156/179 · la marcación derivada ────────────────────────────────────────────────────────

  it('FLD-156/179 · cambiar un campo de clasificación fuerza la marcación a 2', async () => {
    await montar();
    expect(objPantalla.form.get(QD.strMarking)?.value).toBe('1');

    await escribir({ [QD.strSfcProduct]: '999' });
    expect(objPantalla.form.get(QD.strMarking)?.value).toBe('2');
  });

  it('FLD-156/179 · sin cambio de clasificación la marcación queda como la trajo PM4', async () => {
    // El caso que distingue las implementaciones: escribir en un campo que NO es de clasificación
    // mueve `sigValores` igual, así que un effect que ponga `'2'` siempre se pone rojo acá.
    await montar();

    await escribir({ [QD.strClientResponse]: 'Su solicitud fue atendida.' });
    expect(objPantalla.form.get(QD.strMarking)?.value).toBe('1');
  });

  it('FLD-156/179 · deshacer el cambio devuelve la marcación original', async () => {
    await montar();

    await escribir({ [QD.strPlate]: 'XYZ789' });
    expect(objPantalla.form.get(QD.strMarking)?.value).toBe('2');

    await escribir({ [QD.strPlate]: 'ABC123' });
    expect(objPantalla.form.get(QD.strMarking)?.value).toBe('1');
  });

  // ── RUL-0051-08 · el gate de envío ─────────────────────────────────────────────────────────────

  it('RUL-0051-08 · sin respuesta al cliente el envío está bloqueado y avisa por qué', async () => {
    await montar();

    expect(objPantalla.blnPuedeEnviar()).toBe(false);
    expect(blnDeshabilitado('Enviar ▶')).toBe(true);
    expect(strTexto()).toContain('es obligatorio para enviar');

    // El corte real vive en `enviar()`, no en el `[disabled]`.
    await clic('Enviar ▶');
    expect(dicPayloadTarea()).toBeNull();
  });

  it('RUL-0051-08 · una respuesta de solo espacios no habilita el envío', async () => {
    await montar();
    await escribir({ [QD.strClientResponse]: '      ', [QD.strFavorability]: '1' });

    expect(objPantalla.blnPuedeEnviar()).toBe(false);
    expect(blnDeshabilitado('Enviar ▶')).toBe(true);
  });

  it('RUL-0051-08 · sin favorabilidad tampoco se puede enviar', async () => {
    await montar();
    await escribir({ [QD.strClientResponse]: 'Su solicitud fue atendida.' });

    expect(objPantalla.blnPuedeEnviar()).toBe(false);
    expect(blnDeshabilitado('Enviar ▶')).toBe(true);
  });

  it('RUL-0051-08 · con respuesta y favorabilidad, ENVIAR sella fecha y sube la versión', async () => {
    await montar();
    await escribir({
      [QD.strClientResponse]: 'Su solicitud fue atendida y se hizo el reembolso.',
      [QD.strFavorability]: '1',
    });

    expect(objPantalla.blnPuedeEnviar()).toBe(true);
    expect(blnDeshabilitado('Enviar ▶')).toBe(false);
    await clic('Enviar ▶');

    const dicDatos = dicPayloadTarea();
    expect(dicDatos, 'ENVIAR completa la tarea').not.toBeNull();
    expect(dicDatos![QD.strAction]).toBe('ENVIAR');
    // `v2` en el caso → `v3` en el envío.
    expect(dicDatos![QD.strRevisionVersion]).toBe('v3');
    expect(String(dicDatos![QD.strDraftDate] ?? '')).not.toBe('');
  });

  // ── RUL-0051-09 · las acciones tomadas ────────────────────────────────────────────────────────

  it('RUL-0051-09 · "Acciones Tomadas" solo aparece con la respuesta a favor del Cliente', async () => {
    await montar();

    expect(blnCampoMontado(QD.strActionsTaken)).toBe(false);

    // `'1'` es Cliente en `SCR0051_OPTIONS_FAVOR`; `'3'` es Compañía (no son 1/2).
    await escribir({ [QD.strFavorability]: '3' });
    expect(blnCampoMontado(QD.strActionsTaken)).toBe(false);

    await escribir({ [QD.strFavorability]: '1' });
    expect(blnCampoMontado(QD.strActionsTaken)).toBe(true);
  });

  // ── El resto de las acciones (ACT-0051-04/06/07) ──────────────────────────────────────────────

  it('ACT-0051-07 · el borrador va a PUT /requests/{rid} y NO completa la tarea', async () => {
    await montar();
    await escribir({ [QD.strClientResponse]: 'Borrador a medio escribir.' });
    await clic('Guardar Borrador');

    const dicDatos = dicPayloadRequest();
    expect(dicDatos, 'el borrador va al request, no a la tarea').not.toBeNull();
    expect(dicDatos![QD.strAction]).toBe('GUARDAR_BORRADOR');
    expect(dicDatos![QD.strClientResponse]).toBe('Borrador a medio escribir.');
    // El sello de fecha y la versión son exclusivos de ENVIAR.
    expect(dicDatos![QD.strDraftDate] ?? '').toBe('');
    expect(dicDatos![QD.strRevisionVersion]).toBe('v2');
    expect(dicPayloadTarea()).toBeNull();
  });

  it('ACT-0051-04 · la prórroga completa la tarea con SOLICITAR_PRORROGA', async () => {
    await montar({
      ...datosTarea(),
      [QD.strFilingDate]: fechaPm4Desplazada(-30),
      [QD.strSlaAssigned]: '1',
    });
    // ⚠ La prórroga son DOS pasos, no uno. "Solicitar Prórroga Regulatoria" solo **abre el modo**
    // (`abrirModoProrroga()`), que es lo que monta el select del motivo; el envío es el botón "Enviar
    // Prórroga ▶" que aparece recién ahí. Aseverar el PUT después del primer clic falla siempre, y el
    // motivo escrito antes de abrir el modo no tiene control donde caer.
    await clic('Solicitar Prórroga Regulatoria');
    expect(blnCampoMontado(QD.strExtensionReason)).toBe(true);
    await escribir({ [QD.strExtensionReason]: '3' });

    expect(blnDeshabilitado('Enviar Prórroga ▶')).toBe(false);
    await clic('Enviar Prórroga ▶');
    // `enviarCon()` arranca con un `await objAdjuntos.subir(...)`: aunque no haya archivos, el `await`
    // mete un salto de microtareas antes del PUT, así que el asiento del `clic()` no alcanza.
    await asentar();

    const dicDatos = dicPayloadTarea();
    expect(dicDatos, 'la prórroga completa la tarea').not.toBeNull();
    expect(dicDatos![QD.strAction]).toBe('SOLICITAR_PRORROGA');
    expect(dicDatos![QD.strExtensionReason]).toBe('3');
  });

  it('ACT-0051-06 · el expediente se monta solo al abrirlo y se desmonta al cerrar', async () => {
    await montar();

    expect(objFixture.nativeElement.querySelector('app-expediente-completo-modal')).toBeNull();
    await clic('Ver Expediente Completo');
    expect(objFixture.nativeElement.querySelector('app-expediente-completo-modal')).not.toBeNull();

    await clic('Cerrar');
    expect(objFixture.nativeElement.querySelector('app-expediente-completo-modal')).toBeNull();
  });

  // ── Estados de carga y error ──────────────────────────────────────────────────────────────────

  it('el fallo del GET de la tarea se muestra y no monta el formulario', async () => {
    fijarQueryString(`?task_id=${INT_TASK_ID}`);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
      ],
    });
    objFixture = TestBed.createComponent(DetalleReasignacionRespuesta);
    objPantalla = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);
    objFixture.detectChanges();
    objMock
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush({ message: 'Task not found' }, { status: 404, statusText: 'Not Found' });
    await drenarPeticiones();

    expect(strTexto()).toContain('Error al cargar el formulario');
    expect(objBoton('Enviar ▶')).toBeNull();
  });

  it('un fallo del PUT deja el error en pantalla y no navega ni pierde el borrador', async () => {
    await montar();
    await escribir({ [QD.strClientResponse]: 'Borrador que no se va a guardar.' });
    await clic('Guardar Borrador');
    // Igual que en la prórroga: el `await` de `subir()` corre antes del PUT. Ver ese caso.
    await asentar();

    const cllPuts = objMock.match(
      (in_objReq) => in_objReq.method === 'PUT' && in_objReq.url === `/api/requests/${INT_REQUEST_ID}`,
    );
    expect(cllPuts).toHaveLength(1);
    cllPuts[0].flush({ message: 'Boom' }, { status: 500, statusText: 'Server Error' });
    // Dos asientos, no uno: el `catch` de `enviarCon()` que escribe `strErrorEnvio` corre en un turno
    // posterior al `flush()`, así que el `detectChanges()` del primer `asentar()` todavía pinta con el
    // signal vacío y el `@if` de la alerta queda sin montar. El segundo es el que la pinta.
    await asentar();
    await asentar();

    // El mensaje de PM4 llega al signal…
    expect(objPantalla.strErrorEnvio()).toBe('Boom');
    // …y la pantalla monta la alerta que lo muestra. Se asevera el **nodo**, no el texto: el
    // `<za-alert>` interpola su contenido como hijo de luz, pero jsdom no corre el upgrade de Lit, así
    // que ese texto no aparece en `textContent`. Ver el docstring de `blnCampoMontado()`.
    expect(
      objFixture.nativeElement.querySelector('za-alert[config="negative"]'),
      'la pantalla tiene que montar la alerta del fallo de envío',
    ).not.toBeNull();
    expect(objPantalla.form.get(QD.strClientResponse)?.value).toBe('Borrador que no se va a guardar.');
  });
});
