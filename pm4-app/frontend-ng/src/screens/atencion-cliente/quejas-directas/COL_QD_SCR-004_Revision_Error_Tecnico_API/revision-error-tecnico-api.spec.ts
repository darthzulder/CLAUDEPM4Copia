import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { QD } from '../fields/fields';
import { RevisionErrorTecnicoApi } from './revision-error-tecnico-api';

/**
 * SCR-004 · Revisión Error Técnico API — **un caso por RUL/ACT del anexo**, no un smoke.
 *
 * Mismo método que `revision-respuesta-sac.spec.ts` (SCR-008), por las mismas dos razones:
 *
 * 1. **Se asevera el PUT real, no un espía.** `TaskService` se monta de verdad y la red se intercepta
 *    con `HttpTestingController`, así que lo que se verifica es el cuerpo que sale hacia PM4. El
 *    `qd_strAction` / `qd_strPayloadSent` del payload es contrato con el script de Momento 3, y un mock
 *    puede recibir la llamada correcta mientras el servicio manda otra cosa en el `data`.
 * 2. **Se asevera el `FormControl` y los computeds, no el shadow DOM.** Bajo jsdom los custom elements
 *    de Lit no hacen upgrade, así que leer `.model` de un `za-textarea` mediría el binding y no el
 *    componente (trampa 2 de `docs/guides/testing-conventions.md`).
 *
 * ── Lo que este archivo cubre y SCR-008 no tenía por qué cubrir ─────────────────────────────────
 * El caso de `getRawValue()` vs `value`. Esta pantalla deshabilita `qd_strPayloadSent` cuando FLD-058
 * está en `'NO'`, y `form.value` **omite los controles deshabilitados** — o sea que un `enviar()` que
 * usara `value` dejaría al script de M3 sin el payload del intento fallido. Es el costo de haber puesto
 * el bloqueo en el control en vez de en la vista, y por eso tiene un caso propio y no una nota.
 */

/**
 * `Pm4ContextService` cae a `PM4_ENV_FALLBACKS`, cuyo default lee `src/env.generated.ts` (generado
 * desde `pm4-app/.env`). Acá sale vacío, pero **en la máquina de un dev con `VITE_TASK_ID` cargado la
 * pantalla pediría otra tarea** y estos casos se pondrían rojos por estado local ajeno al código.
 */
const OBJ_ENV_VACIO = { token: '', taskId: '', caseId: '' } as const;

const INT_TASK_ID = 4;
const INT_REQUEST_ID = 40;

/** El JSON del body de cierre que el script de M2 dejó en el caso, tal como llega de PM4. */
const STR_PAYLOAD_ORIGINAL = '{"caseId":"13950001","status":"CLOSED"}';

/**
 * Fixture **fresco por caso** (función, no constante): si una aserción falla en el medio de un caso que
 * mutó un objeto compartido, el resto del archivo corre con datos corruptos y un fallo real se
 * multiplica en varios. Misma lección que dejó anotada el spec de React.
 */
const datosTarea = (): Record<string, unknown> => ({
  [QD.strHttpCode]: '500',
  [QD.strErrorType]: 'TIMEOUT',
  [QD.strAttemptNum]: '2',
  [QD.strEndpointCalled]: 'https://smartsupervision/api/v1/cierre',
  [QD.strApiTechMessage]: 'Gateway timeout tras 30s',
  [QD.strCompleteLogAPI]: 'POST /cierre → 500\nstack completo…',
  [QD.strPayloadSent]: STR_PAYLOAD_ORIGINAL,
  [QD.strRootCause]: '',
  [QD.strCorrectionApplied]: '',
  [QD.strPayloadAdjustNeeded]: 'NO',
});

const tarea = (in_dicDatos: Record<string, unknown>) => ({
  id: INT_TASK_ID,
  status: 'ACTIVE',
  process_request_id: INT_REQUEST_ID,
  created_at: '2026-08-01T10:00:00.000Z',
  data: in_dicDatos,
});

let objFixture: ComponentFixture<RevisionErrorTecnicoApi>;
let objPantalla: RevisionErrorTecnicoApi;
let objMock: HttpTestingController;

/** Igual que en `task.service.spec.ts`: jsdom navega dentro del mismo origen sin recargar. */
function fijarQueryString(in_strQuery: string): void {
  window.history.replaceState({}, '', `/${in_strQuery}`);
}

/**
 * Deja que las promesas pendientes resuelvan **y** repinta la vista.
 *
 * ⚠ El orden es `whenStable` → `detectChanges` y no al revés: primero se deja resolver el `await` que
 * tiene pendiente la pantalla (que es lo que cambia el estado) y después se pinta ese estado nuevo.
 * `whenStable()` por sí solo **no repinta** bajo `provideZonelessChangeDetection()`, así que sin la
 * segunda línea el template se queda en la rama `@if (blnCargando())` y las aserciones de DOM fallan
 * con un "expected ' \n' to contain …" que se lee como "la pantalla no pintó" cuando lo que pasó es que
 * nadie la volvió a pintar. Está documentado largo en `revision-respuesta-sac.spec.ts`.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

/**
 * Monta la pantalla con la tarea ya cargada y el `ngOnInit` completo.
 *
 * ⚠ El orden es el contrato, en tres partes:
 * 1. `fijarQueryString` va **antes** de `createComponent` porque `ngOnInit` llama `cargar()`, que lee el
 *    `task_id` de la URL al empezar.
 * 2. `detectChanges()` va **entre** `createComponent` y el `expectOne`: bajo
 *    `provideZonelessChangeDetection()` **`createComponent()` por sí solo NO corre `ngOnInit`**, así que
 *    sin esa línea la cola de peticiones está genuinamente vacía y el `expectOne` falla con
 *    `Expected one matching request, found none` — un fallo que se lee como "la pantalla no pide la
 *    tarea" cuando es el test el que nunca la dejó arrancar.
 * 3. El `flush` del GET va **antes** del `await`, porque `precargar()` corre recién cuando ese
 *    `await cargar()` resuelve.
 *
 * ⚠ **Acá no hay `drenarPeticiones()`, y su ausencia es una aserción.** SCR-004 no consume ninguna
 * colección (§4 del Anexo02: no referencia catálogos `CAT-*`) ni monta `RequestFileList`, así que la
 * única petición del montaje es el GET de la tarea. El `objMock.verify()` del `afterEach` es lo que
 * mantiene eso verdadero: si alguien agrega un provider de `CollectionService` o un `app-request-file-list`,
 * su GET queda pendiente y **los 12 casos se ponen rojos**. Es deliberado que se note.
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

  objFixture = TestBed.createComponent(RevisionErrorTecnicoApi);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);

  objFixture.detectChanges();

  objMock
    .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
    .flush(tarea(in_dicDatos));

  await asentar();
}

/** El cuerpo `data` del PUT de completado, o `null` si la pantalla no completó la tarea. */
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
 * Llena los dos campos que RUL-004-01 exige y asienta.
 *
 * Escribe por `setValue` sobre el `FormControl` y no simulando tipeo en el DOM: los controles del DS no
 * son interactuables bajo jsdom (trampa 3 de `testing-conventions.md`), y lo que viaja a PM4 es el
 * valor del control.
 */
async function registrarDiagnostico(): Promise<void> {
  objPantalla.form.patchValue({
    [QD.strRootCause]: 'El endpoint de cierre agotó el timeout de 30s.',
    [QD.strCorrectionApplied]: 'Se amplió el timeout del conector a 90s.',
  });
  await asentar();
}

/**
 * Los `label` de todos los wrappers de la fachada de la pantalla, indexados por su `name` (`qd_*`).
 *
 * Recorre los componentes hijos por `DebugElement` en vez de leer el DOM: los rótulos viven dentro de
 * los `lib-*-z`, que bajo jsdom no hacen upgrade y no pintan nada (ver el comentario del caso que lo
 * usa). Se filtra por la presencia de los inputs `name`/`label` —el contrato de `CampoBase`— porque esa
 * clase es `@Directive()` abstracta sin selector, así que `By.directive()` no la matchea.
 */
function rotulosDeLaFachada(): Record<string, string> {
  const dicRotulos: Record<string, string> = {};

  for (const objNodo of objFixture.debugElement.queryAll(By.css('*'))) {
    const objInstancia: unknown = objNodo.componentInstance;
    if (!(objInstancia instanceof Object)) continue;

    const objCampo = objInstancia as { name?: () => string; label?: () => string };
    if (typeof objCampo.name !== 'function' || typeof objCampo.label !== 'function') continue;

    dicRotulos[objCampo.name()] = objCampo.label();
  }

  return dicRotulos;
}

beforeEach(() => {
  TestBed.resetTestingModule();
  fijarQueryString('');

  // ⚠ `scrollIntoView` no existe en jsdom, y `autorizar()` sin diagnóstico llama
  // `scrollToFirstError()`. Sin este stub el `TypeError` sale como **error no manejado** en vez de como
  // fallo del caso —Vitest reporta los tests en verde con una excepción suelta al lado— porque la
  // implementación difiere el scroll en un `setTimeout(0)` y la excepción escapa después de que el
  // `it()` terminó. Misma trampa que ya documenta `core/scroll-to-first-error.spec.ts`.
  //
  // El cuerpo vacío ES el stub: hacer nada es todo lo que se le pide.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Element.prototype.scrollIntoView = (() => {}) as Element['scrollIntoView'];
});

afterEach(() => {
  objMock.verify();
});

describe('SCR-004 · Revisión Error Técnico API', () => {
  it('monta y precarga el detalle del error desde task.data', async () => {
    await montar();

    expect(objFixture.nativeElement.textContent).toContain('Revisión Error Técnico API');

    // FLD-050..055 — los campos de solo lectura de S1 llegan del caso, no de un default.
    expect(objPantalla.form.get(QD.strHttpCode)?.value).toBe('500');
    expect(objPantalla.form.get(QD.strErrorType)?.value).toBe('TIMEOUT');
    expect(objPantalla.form.get(QD.strEndpointCalled)?.value).toBe(
      'https://smartsupervision/api/v1/cierre',
    );
    expect(objPantalla.form.get(QD.strApiTechMessage)?.value).toBe('Gateway timeout tras 30s');
    // `getRawValue()` y no `.value` del form: este control está deshabilitado con ajuste en 'NO'.
    expect(objPantalla.form.getRawValue()[QD.strPayloadSent]).toBe(STR_PAYLOAD_ORIGINAL);

    // FLD-055 · el sufijo del intento acumulado en la alerta de S1.
    expect(objPantalla.strIntento()).toBe('2');
    expect(objFixture.nativeElement.textContent).toContain('Intento acumulado #2');
  });

  // ── Paridad de rótulos con el anexo ─────────────────────────────────────────────────────────────
  //
  // Existe porque la revisión visual del gate 5 encontró **cinco** divergencias de texto contra React
  // —tres rótulos, la redacción de la alerta y los contadores de caracteres— con la suite entera en
  // verde: ningún caso aseveraba un `label`, así que el rótulo era libre de derivar del insumo sin que
  // nada se pusiera rojo. Los rótulos NO son cosmética: son la trazabilidad FLD del Anexo02 que el
  // negocio audita contra `DOCUMENTACION_*.md`, y son lo único que el analista lee para saber qué
  // campo está llenando.
  //
  // ⚠ Se asevera el **input `label` del wrapper de la fachada**, no el texto renderizado. El primer
  // intento fue `textContent.toContain(rótulo)` y salió rojo con los 9 rótulos correctos: bajo jsdom los
  // custom elements de Lit no hacen upgrade, así que el `<label>` del `lib-*-z` **nunca se pinta** y el
  // `textContent` de la pantalla trae solo el título, los headers de sección, la alerta y el botón
  // (trampa 2 de `docs/guides/testing-conventions.md`). Aseverar el render acá no es "más real": es
  // inaseverable, y de yapa habría hecho pasar en falso al caso del contador.
  it('los rótulos de los campos son textualmente los del Anexo02 (FLD-050…058)', async () => {
    await montar();

    const dicEsperado: Record<string, string> = {
      [QD.strHttpCode]: 'Código HTTP', // FLD-050
      [QD.strErrorType]: 'Tipo de Error', // FLD-051
      [QD.strApiTechMessage]: 'Mensaje Técnico de la API', // FLD-052
      [QD.strEndpointCalled]: 'Endpoint Invocado', // FLD-053
      [QD.strPayloadSent]: 'Payload Enviado (JSON)', // FLD-054
      [QD.strAttemptNum]: 'Número de Intento Acumulado', // FLD-055 — NO "Intento acumulado"
      [QD.strRootCause]: 'Causa Raíz Identificada', // FLD-056 — NO "Causa Raíz del Error"
      [QD.strCorrectionApplied]: 'Corrección Aplicada', // FLD-057
      [QD.strPayloadAdjustNeeded]: '¿Requiere ajuste en payload?', // FLD-058
    };

    const dicReal = rotulosDeLaFachada();

    // El conteo primero: sin esto, un campo que desaparezca del template dejaría su entrada sin
    // comparar y el `for` de abajo pasaría igual — la tautología que ya mordió en el gate 4.
    expect(Object.keys(dicReal).sort()).toEqual(Object.keys(dicEsperado).sort());

    for (const [strCampo, strRotulo] of Object.entries(dicEsperado)) {
      expect(dicReal[strCampo], `rótulo de ${strCampo} fuera del anexo`).toBe(strRotulo);
    }
  });

  it('los dos textarea de S2 llevan el contador de 2000 del DS, no solo el validador', async () => {
    await montar();

    // Dos mecanismos distintos y los dos hacen falta (ver el comentario de `zds-textarea.ts`): el
    // `Validators.maxLength` decide la validez del control y el `[maxLength]` numérico es lo único que
    // enciende el contador visual `N/2000` del DS. React pasa los dos; tener solo el validador deja la
    // pantalla sin el contador que el analista usa para saber cuánto le queda, y **no** rompe ningún
    // otro caso — por eso se asevera acá.
    // ⚠ La aserción va sobre el **atributo `max-length` del `z-textarea`**, no sobre el input de la
    // fachada. Antes leía `componentInstance.maxLength()`, que solo prueba que la plantilla pasa el
    // valor y se queda un eslabón corto de donde vive el defecto: la cadena real es
    // `[maxLength]` → `zds-textarea` → (el `[attr.max-length]` de `lib-textarea-z` **muere acá**) →
    // el `afterRenderEffect` de la fachada repone el atributo sobre el `z-textarea`, que es el único
    // elemento que el DS lee para pintar el contador. Si ese efecto se rompiera, la versión anterior
    // de este caso seguía verde con los contadores apagados. Medido: gutear el `setAttribute` de
    // `zds-textarea.ts` pone en rojo la guarda equivalente de SCR-008 **y** el spec de la fachada.
    for (const strCampo of [QD.strRootCause, QD.strCorrectionApplied]) {
      // Se busca por `id` del wrapper y no por posición: el `id="field-<name>"` es contrato de la
      // fachada (lo necesita `scrollToFirstError`) y ya tiene su propio caso, así que apoyarse en él
      // no agrega una suposición nueva.
      const objTextarea = (objFixture.nativeElement as HTMLElement).querySelector(
        `#field-${strCampo} za-textarea z-textarea`,
      );

      // Sin esta guarda, un `querySelector` que no encuentra nada haría explotar el `getAttribute` de
      // abajo con `Cannot read properties of null` — que se lee como error del test y no como el
      // defecto que sería (el `zds-textarea` borrado, o su `id` cambiado).
      expect(objTextarea, `no se encontró el z-textarea de ${strCampo}`).not.toBeNull();

      expect(
        objTextarea!.getAttribute('max-length'),
        `${strCampo} no le pasa el límite al contador del DS (¿le falta [maxLength]?)`,
      ).toBe('2000');
    }
  });

  it('no pinta los campos de S2 en rojo al montar (el error espera el primer intento de envío)', async () => {
    await montar();

    // Los dos controles SÍ están inválidos —arrancan vacíos con `Validators.required`—, pero el mensaje
    // se calla hasta que el analista intenta autorizar. Sin esta distinción la pantalla abriría con dos
    // campos en rojo sin que nadie haya hecho nada, que es lo contrario de lo que RUL-004-01 comunica.
    expect(objPantalla.form.get(QD.strRootCause)?.invalid).toBe(true);
    expect(objPantalla.blnIntentoEnvio()).toBe(false);
    expect(objPantalla.strErrorCausaRaiz()).toBe('');
    expect(objPantalla.strErrorCorreccion()).toBe('');
  });

  // ── RUL-004-01 · sin causa raíz Y corrección aplicada no se autoriza el reenvío ─────────────────

  it('RUL-004-01 · no autoriza sin causa raíz ni corrección, y muestra MSG-004-01', async () => {
    await montar();

    expect(objPantalla.blnPuedeAutorizar()).toBe(false);
    // MSG-004-01 pintado, que es el par del `[disabled]`: la afordancia dice "no podés", el mensaje
    // dice por qué. Se asevera el texto porque es una rama `@if` del template propio, no un input del DS.
    expect(objFixture.nativeElement.textContent).toContain('antes de autorizar el reenvío');

    // ⚠ Se invoca el handler directo en vez de clickear: un `lib-button-z` deshabilitado **igual**
    // dispara su handler bajo jsdom (trampa 1), así que un click no probaría el corte — probaría que el
    // DS no se hizo cargo. Lo que se asevera es que el corte de `autorizar()` existe.
    objPantalla.autorizar();
    await asentar();

    expect(dicPayloadEnviado()).toBeNull();
    // El corte deja el rastro que el wrapper necesita para pintar (`invalid && touched`).
    expect(objPantalla.blnIntentoEnvio()).toBe(true);
    expect(objPantalla.form.get(QD.strRootCause)?.touched).toBe(true);
    expect(objPantalla.strErrorCausaRaiz()).toBe('Campo requerido');
    expect(objPantalla.strErrorCorreccion()).toBe('Campo requerido');
  });

  it('RUL-004-01 · tampoco autoriza con solo uno de los dos campos', async () => {
    await montar();

    objPantalla.form.patchValue({ [QD.strRootCause]: 'Timeout del endpoint de cierre.' });
    await asentar();

    expect(objPantalla.blnPuedeAutorizar()).toBe(false);

    objPantalla.autorizar();
    await asentar();
    expect(dicPayloadEnviado()).toBeNull();
    // El que sí se llenó no queda marcado en error; el que falta, sí. Si el mensaje fuera global esto
    // pasaría igual, así que la aserción separada es la que distingue las dos ramas.
    expect(objPantalla.strErrorCausaRaiz()).toBe('');
    expect(objPantalla.strErrorCorreccion()).toBe('Campo requerido');
  });

  it('RUL-004-01 · un texto de solo espacios NO satisface la regla', async () => {
    await montar();

    // `Validators.required` de Angular acepta `'   '` (solo rechaza `''` y `null`), así que sin el
    // `trim()` de `blnPuedeAutorizar` se podría autorizar el reenvío sin diagnóstico alguno. Por eso el
    // computed no se puede reemplazar por `form.valid`, y por eso este caso está separado del anterior.
    objPantalla.form.patchValue({
      [QD.strRootCause]: '   ',
      [QD.strCorrectionApplied]: '\n\t ',
    });
    await asentar();

    expect(objPantalla.form.get(QD.strRootCause)?.valid).toBe(true);
    expect(objPantalla.blnPuedeAutorizar()).toBe(false);

    objPantalla.autorizar();
    await asentar();
    expect(dicPayloadEnviado()).toBeNull();
  });

  // ── FLD-058 · el ajuste del payload abre y cierra la edición del control ────────────────────────

  it('FLD-058 · el payload arranca deshabilitado y se habilita al marcar el ajuste', async () => {
    await montar();

    // El bloqueo vive en el CONTROL, no en un `[readOnly]` de la vista: `control.disabled` es estado de
    // Angular y es verificable, mientras que el `readonly` del `za-textarea` es un atributo de un
    // custom element de Lit que bajo jsdom no se refleja (trampa 2).
    expect(objPantalla.blnAjustaPayload()).toBe(false);
    expect(objPantalla.form.get(QD.strPayloadSent)?.disabled).toBe(true);

    objPantalla.form.patchValue({ [QD.strPayloadAdjustNeeded]: 'SI' });
    await asentar();

    expect(objPantalla.blnAjustaPayload()).toBe(true);
    expect(objPantalla.form.get(QD.strPayloadSent)?.enabled).toBe(true);
    expect(objFixture.nativeElement.textContent).toContain(
      'en la sección superior antes de autorizar el reenvío',
    );

    // Y vuelve a cerrarse: la reacción es bidireccional, no un one-way al marcar.
    objPantalla.form.patchValue({ [QD.strPayloadAdjustNeeded]: 'NO' });
    await asentar();
    expect(objPantalla.form.get(QD.strPayloadSent)?.disabled).toBe(true);
  });

  // ── El gate del JSON · el script de M3 descarta un body que no sea objeto ───────────────────────

  it('bloquea la autorización si el payload ajustado no parsea como JSON', async () => {
    await montar();
    await registrarDiagnostico();
    expect(objPantalla.blnPuedeAutorizar()).toBe(true);

    objPantalla.form.patchValue({ [QD.strPayloadAdjustNeeded]: 'SI' });
    await asentar();
    objPantalla.form.patchValue({ [QD.strPayloadSent]: '{"caseId": roto' });
    await asentar();

    expect(objPantalla.blnPayloadJsonOk()).toBe(false);
    expect(objPantalla.blnPuedeAutorizar()).toBe(false);
    // La alerta importa porque la causa del bloqueo vive en un campo de OTRA sección: sin ella el
    // analista vería el botón deshabilitado sin saber por qué.
    expect(objFixture.nativeElement.textContent).toContain('no es un objeto JSON válido');

    objPantalla.autorizar();
    await asentar();
    expect(dicPayloadEnviado()).toBeNull();
  });

  it('bloquea también un JSON válido que NO sea objeto (null, array, escalar)', async () => {
    await montar();
    await registrarDiagnostico();

    objPantalla.form.patchValue({ [QD.strPayloadAdjustNeeded]: 'SI' });
    await asentar();

    // Las tres formas que `JSON.parse` acepta y el script de M3 descartaría. Cada una toca una
    // condición distinta del `return` de `blnPayloadJsonOk`, y por eso las tres están acá: con solo el
    // caso de `'null'` (o solo el del array) las otras dos condiciones podrían borrarse en verde.
    for (const strPayload of ['null', '[1,2]', '"solo texto"', '42']) {
      objPantalla.form.patchValue({ [QD.strPayloadSent]: strPayload });
      await asentar();
      expect(objPantalla.blnPayloadJsonOk(), `payload ${strPayload}`).toBe(false);
      expect(objPantalla.blnPuedeAutorizar(), `payload ${strPayload}`).toBe(false);
    }

    // Y el objeto sí pasa, que es lo que distingue el gate de un "siempre false".
    objPantalla.form.patchValue({ [QD.strPayloadSent]: '{"caseId":"1"}' });
    await asentar();
    expect(objPantalla.blnPayloadJsonOk()).toBe(true);
    expect(objPantalla.blnPuedeAutorizar()).toBe(true);
  });

  it('no valida el JSON cuando no hay ajuste marcado', async () => {
    await montar();
    await registrarDiagnostico();

    // Con FLD-058 en 'NO' el payload del intento fallido puede ser cualquier cosa —el script lo
    // reconstruye— así que el gate tiene que estar apagado. Si validara siempre, un caso cuyo
    // `qd_strPayloadSent` llegó vacío de PM4 quedaría imposible de autorizar.
    objPantalla.form.get(QD.strPayloadSent)?.setValue('esto no es JSON', { emitEvent: true });
    await asentar();

    expect(objPantalla.blnAjustaPayload()).toBe(false);
    expect(objPantalla.blnPayloadJsonOk()).toBe(true);
    expect(objPantalla.blnPuedeAutorizar()).toBe(true);
  });

  // ── ACT-004-01 · Autorizar Reenvío ─────────────────────────────────────────────────────────────

  it('ACT-004-01 · autoriza el reenvío con el payload y la acción correctos', async () => {
    await montar();
    await registrarDiagnostico();

    expect(objPantalla.blnPuedeAutorizar()).toBe(true);
    objPantalla.autorizar();
    await asentar();

    const dicEnviado = dicPayloadEnviado();
    expect(dicEnviado).not.toBeNull();

    // El contrato con el script de Momento 3: la acción y el diagnóstico registrado.
    expect(dicEnviado?.[QD.strAction]).toBe('AUTORIZAR_REENVIO');
    expect(dicEnviado?.[QD.strRootCause]).toBe('El endpoint de cierre agotó el timeout de 30s.');
    expect(dicEnviado?.[QD.strCorrectionApplied]).toBe('Se amplió el timeout del conector a 90s.');
    expect(dicEnviado?.[QD.strPayloadAdjustNeeded]).toBe('NO');
  });

  it('ACT-004-01 · el payload deshabilitado SÍ viaja a PM4 (getRawValue, no value)', async () => {
    await montar();
    await registrarDiagnostico();

    // Con el ajuste en 'NO' el control está deshabilitado, y `form.value` **omite** los controles
    // deshabilitados. Si `enviar()` usara `value`, el `qd_strPayloadSent` del intento fallido no
    // llegaría a PM4 y el script de M3 lo recibiría como faltante. Es el costo de haber puesto el
    // bloqueo en el control, y ésta es la aserción que lo cobra.
    expect(objPantalla.form.get(QD.strPayloadSent)?.disabled).toBe(true);
    expect(QD.strPayloadSent in objPantalla.form.value).toBe(false);

    objPantalla.autorizar();
    await asentar();

    expect(dicPayloadEnviado()?.[QD.strPayloadSent]).toBe(STR_PAYLOAD_ORIGINAL);
  });

  it('ACT-004-01 · con ajuste marcado viaja el payload EDITADO', async () => {
    await montar();
    await registrarDiagnostico();

    objPantalla.form.patchValue({ [QD.strPayloadAdjustNeeded]: 'SI' });
    await asentar();
    objPantalla.form.patchValue({ [QD.strPayloadSent]: '{"caseId":"13950001","status":"OPEN"}' });
    await asentar();

    objPantalla.autorizar();
    await asentar();

    const dicEnviado = dicPayloadEnviado();
    expect(dicEnviado?.[QD.strPayloadSent]).toBe('{"caseId":"13950001","status":"OPEN"}');
    expect(dicEnviado?.[QD.strPayloadAdjustNeeded]).toBe('SI');
  });

  // ── ACT-004-03 · modal del log completo ────────────────────────────────────────────────────────

  it('ACT-004-03 · abre y cierra el modal del log completo', async () => {
    await montar();

    expect(objPantalla.blnVerLog()).toBe(false);

    objPantalla.abrirLog();
    await asentar();
    expect(objPantalla.blnVerLog()).toBe(true);
    // El contenido del slot se pinta recién con el modal abierto (el `@if` va DENTRO del
    // `ng-template libZTemplate`, nunca alrededor — ver el punto 3 del comentario del template).
    expect(objFixture.nativeElement.textContent).toContain('Log completo del error técnico');

    // La pantalla baja su propia bandera: `ModalZ.change()` muta su propio input `open`, así que si no
    // se sincronizara el segundo `abrirLog()` no cambiaría el valor del `[open]` y el modal no abriría.
    objPantalla.cerrarLog();
    await asentar();
    expect(objPantalla.blnVerLog()).toBe(false);

    objPantalla.abrirLog();
    await asentar();
    expect(objPantalla.blnVerLog()).toBe(true);
  });

  // ── Estados de la tarea ────────────────────────────────────────────────────────────────────────

  it('muestra el error de carga cuando PM4 falla, sin pintar el formulario', async () => {
    fijarQueryString(`?task_id=${INT_TASK_ID}`);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
      ],
    });

    objFixture = TestBed.createComponent(RevisionErrorTecnicoApi);
    objPantalla = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);
    objFixture.detectChanges();

    objMock
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush({ message: 'Tarea no encontrada' }, { status: 404, statusText: 'Not Found' });
    await asentar();

    expect(objPantalla.strError()).toBeTruthy();
    // La rama del error **reemplaza** al form: si las tres ramas del `@if` no fueran exclusivas, la
    // pantalla mostraría un formulario vacío junto al mensaje de error y el analista podría intentar
    // autorizar una tarea que nunca cargó.
    expect(objFixture.nativeElement.textContent).toContain('Error al cargar el formulario');
    expect(objFixture.nativeElement.textContent).not.toContain('Registro de Corrección Técnica');
  });
});
