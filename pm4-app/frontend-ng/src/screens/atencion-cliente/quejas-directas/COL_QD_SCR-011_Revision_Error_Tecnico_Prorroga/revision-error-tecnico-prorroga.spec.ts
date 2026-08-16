import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aseverarContratoDeCampos } from '../../../../components/fields/contrato-pantalla';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { QD } from '../fields/fields';
import { RevisionErrorTecnicoProrroga } from './revision-error-tecnico-prorroga';

/**
 * SCR-011 · Revisión Error Técnico Prórroga — **un caso por RUL/ACT/MSG del anexo**, no un smoke.
 *
 * Mismo método que su gemela SCR-004 y que SCR-008: se asevera el **PUT real** (con
 * `HttpTestingController`, no un espía, porque el `qd_strAction` del `data` es contrato con el script de
 * Momento 3) y el **`FormControl` con los computeds**, no el shadow DOM (bajo jsdom los custom elements
 * de Lit no hacen upgrade — trampa 2 de `docs/guides/testing-conventions.md`).
 *
 * ── ⚠ Lo que este archivo cubre y el de SCR-004 NO PUEDE cubrir ─────────────────────────────────
 * Las cuatro divergencias de la gemela, que son la razón de ser del port (ver el docstring de
 * `revision-error-tecnico-prorroga.ts`). Tres tienen caso propio acá y ninguno tiene equivalente allá:
 *
 * 1. **ACT-011-02 existe.** En SCR-004 esa acción se retiró y su tipo tiene un único literal, así que
 *    ningún caso de allá puede aseverar que se envía `ESCALAR_PROVEEDOR`.
 * 2. **Escalar NO valida RUL-011-01.** Es el caso que más importa del archivo: se escala con causa raíz
 *    y corrección **vacías** y el PUT tiene que salir igual. Sin esta aserción, "arreglar" la pantalla
 *    metiéndole la guarda de `autorizar()` a `escalar()` —que es lo que parece correcto si uno solo lee
 *    RUL-011-01— dejaría la suite verde y la salida de excepción inalcanzable.
 * 3. **El mensaje de requerido NO sale de `Validators.required`.** Consecuencia del punto 2: los dos
 *    campos de S2 no llevan ese validador (lo llevarían y escalar dejaría el form inválido), así que
 *    `mensajeDeError()` decide por el valor. Hay un caso que fija que el form queda **válido** con S2
 *    vacío y que el mensaje aparece igual tras intentar autorizar — las dos mitades, porque cada una
 *    sola pasaría con la implementación equivocada.
 *
 * La cuarta divergencia (los rótulos con "prórroga") la cubre el caso de paridad de rótulos, que es el
 * mismo mecanismo que en SCR-004 pero con los textos de **este** anexo.
 */

/**
 * `Pm4ContextService` cae a `PM4_ENV_FALLBACKS`, cuyo default lee `src/env.generated.ts` (generado
 * desde `pm4-app/.env`). Acá sale vacío, pero **en la máquina de un dev con `VITE_TASK_ID` cargado la
 * pantalla pediría otra tarea** y estos casos se pondrían rojos por estado local ajeno al código.
 */
const OBJ_ENV_VACIO = { token: '', taskId: '', caseId: '' } as const;

const INT_TASK_ID = 11;
const INT_REQUEST_ID = 110;

/** El JSON del body de prórroga que el script de M2 dejó en el caso, tal como llega de PM4. */
const STR_PAYLOAD_ORIGINAL = '{"caseId":"13950011","prorrogaDias":10}';

/**
 * Fixture **fresco por caso** (función, no constante): si una aserción falla en el medio de un caso que
 * mutó un objeto compartido, el resto del archivo corre con datos corruptos y un fallo real se
 * multiplica en varios.
 */
const datosTarea = (): Record<string, unknown> => ({
  [QD.strHttpCode]: '502',
  [QD.strErrorType]: 'BAD_GATEWAY',
  [QD.strAttemptNum]: '3',
  [QD.strEndpointCalled]: 'https://smartsupervision/api/v1/prorroga',
  [QD.strApiTechMessage]: 'Bad gateway al solicitar la prórroga',
  [QD.strCompleteLogAPI]: 'POST /prorroga → 502\nstack completo…',
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

let objFixture: ComponentFixture<RevisionErrorTecnicoProrroga>;
let objPantalla: RevisionErrorTecnicoProrroga;
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
 * segunda línea el template se queda en la rama `@if (blnCargando())` y las aserciones de DOM fallan con
 * un "expected ' \n' to contain …" que se lee como "la pantalla no pintó" cuando lo que pasó es que
 * nadie la volvió a pintar.
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
 * ⚠ **Acá no hay `drenarPeticiones()`, y su ausencia es una aserción.** Igual que SCR-004, esta pantalla
 * no consume ninguna colección (su único campo de valores cerrados es el radio Sí/No, que sale de la
 * constante `OPTIONS_SI_NO`) ni monta `RequestFileList`, así que la única petición del montaje es el GET
 * de la tarea. El `objMock.verify()` del `afterEach` es lo que mantiene eso verdadero: si alguien agrega
 * un provider de `CollectionService`, su GET queda pendiente y **todos los casos se ponen rojos**. Es
 * deliberado que se note — SCR-008 sí deja 3 pendientes y por eso allá el drenaje existe.
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

  objFixture = TestBed.createComponent(RevisionErrorTecnicoProrroga);
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
 * Llena los dos campos que RUL-011-01 exige y asienta.
 *
 * Escribe por `patchValue` sobre el `FormGroup` y no simulando tipeo en el DOM: los controles del DS no
 * son interactuables bajo jsdom (trampa 3 de `testing-conventions.md`), y lo que viaja a PM4 es el valor
 * del control.
 */
async function registrarDiagnostico(): Promise<void> {
  objPantalla.form.patchValue({
    [QD.strRootCause]: 'El gateway del proveedor devolvió 502 al pedir la prórroga.',
    [QD.strCorrectionApplied]: 'Se reintentó contra el nodo secundario del proveedor.',
  });
  await asentar();
}

/**
 * Los `label` de todos los wrappers de la fachada de la pantalla, indexados por su `name` (`qd_*`).
 *
 * Recorre los componentes hijos por `DebugElement` en vez de leer el DOM: los rótulos viven dentro de los
 * `lib-*-z`, que bajo jsdom no hacen upgrade y no pintan nada. Se filtra por la presencia de los inputs
 * `name`/`label` —el contrato de `CampoBase`— porque esa clase es `@Directive()` abstracta sin selector,
 * así que `By.directive()` no la matchea.
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

  // ⚠ `scrollIntoView` no existe en jsdom, y `autorizar()` sin diagnóstico llama `scrollToFirstError()`.
  // Sin este stub el `TypeError` sale como **error no manejado** en vez de como fallo del caso —Vitest
  // reporta los tests en verde con una excepción suelta al lado— porque la implementación difiere el
  // scroll en un `setTimeout(0)` y la excepción escapa después de que el `it()` terminó.
  //
  // El cuerpo vacío ES el stub: hacer nada es todo lo que se le pide.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Element.prototype.scrollIntoView = (() => {}) as Element['scrollIntoView'];
});

afterEach(() => {
  objMock.verify();
});

describe('SCR-011 · Revisión Error Técnico Prórroga', () => {
  /**
   * El contrato **estructural** de la fachada, en una línea. La lógica vive en
   * [contrato-pantalla.ts](../../../../components/fields/contrato-pantalla.ts), así que cada defecto
   * nuevo que se descubra cubre esta pantalla sin tocar este archivo.
   */
  it('cumple el contrato estructural de campos de la fachada', async () => {
    await montar();

    aseverarContratoDeCampos(objFixture);
  });

  it('monta y precarga el detalle del error de prórroga desde task.data', async () => {
    await montar();

    expect(objFixture.nativeElement.textContent).toContain('Revisión Error Técnico Prórroga');

    // FLD-190..196 — los campos de solo lectura de S1 llegan del caso, no de un default.
    expect(objPantalla.form.get(QD.strHttpCode)?.value).toBe('502');
    expect(objPantalla.form.get(QD.strErrorType)?.value).toBe('BAD_GATEWAY');
    expect(objPantalla.form.get(QD.strEndpointCalled)?.value).toBe(
      'https://smartsupervision/api/v1/prorroga',
    );
    expect(objPantalla.form.get(QD.strApiTechMessage)?.value).toBe(
      'Bad gateway al solicitar la prórroga',
    );
    // `getRawValue()` y no `.value` del form: este control está deshabilitado con ajuste en 'NO'.
    expect(objPantalla.form.getRawValue()[QD.strPayloadSent]).toBe(STR_PAYLOAD_ORIGINAL);

    // FLD-194 · el sufijo del intento acumulado en la alerta de S1.
    expect(objPantalla.strIntento()).toBe('3');
    expect(objFixture.nativeElement.textContent).toContain('Intento acumulado #3');
  });

  // ── Paridad de rótulos y textos con el anexo de SCR-011 ─────────────────────────────────────────
  //
  // ⚠ **Es la divergencia 4 con SCR-004, y la más fácil de perder en un port.** Los rótulos de esta
  // pantalla dicen "prórroga" porque describen otro momento del proceso; copiarlos de la gemela dejaría
  // al analista leyendo que revisa el error de la respuesta al ciudadano cuando revisa el de la
  // solicitud de prórroga. La revisión visual del gate 5 de SCR-004 encontró **cinco** divergencias de
  // texto contra React con la suite entera en verde, y esta pantalla nace con el doble de riesgo: su
  // fuente de copy-paste es una pantalla cuyos rótulos son *casi* los correctos.
  //
  // ⚠ Se asevera el **input `label` del wrapper de la fachada**, no el texto renderizado: bajo jsdom los
  // custom elements de Lit no hacen upgrade, así que el `<label>` del `lib-*-z` nunca se pinta y un
  // `textContent.toContain(rótulo)` saldría rojo con los 9 rótulos correctos (trampa 2).
  it('los rótulos de los campos son textualmente los del Anexo02 (FLD-190…196)', async () => {
    await montar();

    const dicEsperado: Record<string, string> = {
      [QD.strHttpCode]: 'Código HTTP prórroga', // FLD-190 — NO "Código HTTP" (ese es SCR-004)
      [QD.strErrorType]: 'Tipo de Error', // FLD-191
      [QD.strApiTechMessage]: 'Mensaje Técnico de la API', // FLD-192
      [QD.strEndpointCalled]: 'Endpoint Invocado', // FLD-193
      [QD.strPayloadSent]: 'Payload de prórroga enviado (JSON)', // FLD-193 — NO "Payload Enviado (JSON)"
      [QD.strAttemptNum]: 'Número de intento prórroga', // FLD-194
      [QD.strRootCause]: 'Causa Raíz', // FLD-195 — NO "Causa Raíz Identificada"
      [QD.strCorrectionApplied]: 'Corrección Aplicada', // FLD-196
      [QD.strPayloadAdjustNeeded]: '¿Requiere ajuste en payload?', // FLD-058 (≡ SCR-004)
    };

    const dicReal = rotulosDeLaFachada();

    // El conteo primero: sin esto, un campo que desaparezca del template dejaría su entrada sin comparar
    // y el `for` de abajo pasaría igual — la tautología que ya mordió en el gate 4.
    expect(Object.keys(dicReal).sort()).toEqual(Object.keys(dicEsperado).sort());

    for (const [strCampo, strRotulo] of Object.entries(dicEsperado)) {
      expect(dicReal[strCampo], `rótulo de ${strCampo} fuera del anexo`).toBe(strRotulo);
    }
  });

  it('los títulos de sección y la alerta de S1 nombran la prórroga', async () => {
    await montar();

    // Los headers de sección y el cuerpo de la alerta SÍ son template propio (no inputs de un `lib-*-z`),
    // así que acá el `textContent` sí se puede aseverar. Son SEC-037 y SEC-038 del anexo.
    const strTexto = objFixture.nativeElement.textContent as string;
    expect(strTexto).toContain('Detalle del Error Técnico — Prórroga');
    expect(strTexto).toContain('Registro de Corrección — Prórroga');
    expect(strTexto).toContain('solicitud de prórroga');

    // Y NO los de la gemela: es la mitad que distingue "el texto correcto está" de "además quedó el
    // de SCR-004 pegado al lado", que es exactamente lo que produce un copy-paste a medio corregir.
    expect(strTexto).not.toContain('Registro de Corrección Técnica');
  });

  it('los dos textarea de S2 llevan el contador de 2000 del DS, no solo el validador', async () => {
    await montar();

    // Dos mecanismos distintos y los dos hacen falta (ver el comentario de `zds-textarea.ts`): el
    // `Validators.maxLength` decide la validez del control y el `[maxLength]` numérico es lo único que
    // enciende el contador visual `N/2000` del DS. React pasa los dos; tener solo el validador deja la
    // pantalla sin el contador que el analista usa para saber cuánto le queda, y **no** rompe ningún otro
    // caso — por eso se asevera acá.
    // ⚠ La aserción va sobre el **atributo `max-length` del `z-textarea`**, no sobre el input de la
    // fachada: la cadena real es `[maxLength]` → `zds-textarea` → (el `[attr.max-length]` de
    // `lib-textarea-z` **muere acá**) → el `afterRenderEffect` de la fachada repone el atributo sobre el
    // `z-textarea`, que es el único elemento que el DS lee. Leer `componentInstance.maxLength()` se queda
    // un eslabón corto de donde vive el defecto.
    for (const strCampo of [QD.strRootCause, QD.strCorrectionApplied]) {
      // Se busca por `id` del wrapper y no por posición: el `id="field-<name>"` es contrato de la fachada
      // (lo necesita `scrollToFirstError`) y ya tiene su propio caso.
      const objTextarea = (objFixture.nativeElement as HTMLElement).querySelector(
        `#field-${strCampo} za-textarea z-textarea`,
      );

      // Sin esta guarda, un `querySelector` que no encuentra nada haría explotar el `getAttribute` de
      // abajo con `Cannot read properties of null` — que se lee como error del test y no como el defecto
      // que sería (el `zds-textarea` borrado, o su `id` cambiado).
      expect(objTextarea, `no se encontró el z-textarea de ${strCampo}`).not.toBeNull();

      expect(
        objTextarea!.getAttribute('max-length'),
        `${strCampo} no le pasa el límite al contador del DS (¿le falta [maxLength]?)`,
      ).toBe('2000');
    }
  });

  it('no pinta los campos de S2 en rojo al montar (el error espera el primer intento de autorizar)', async () => {
    await montar();

    expect(objPantalla.blnIntentoEnvio()).toBe(false);
    expect(objPantalla.strErrorCausaRaiz()).toBe('');
    expect(objPantalla.strErrorCorreccion()).toBe('');
  });

  // ── ⚠ Divergencia 3 · los controles de S2 NO llevan `Validators.required` ───────────────────────

  it('el form queda VÁLIDO con S2 vacío (para que escalar sea alcanzable), y aun así el mensaje aparece', async () => {
    await montar();

    // **Primera mitad.** Es lo contrario de SCR-004, cuyo spec asevera
    // `form.get(strRootCause).invalid === true` al montar. Acá los dos campos de S2 son obligatorios
    // para ACT-011-01, no para la pantalla: con `Validators.required` en el control, escalar con los
    // campos vacíos —el caso normal de ACT-011-02— dejaría el form inválido, declarando una
    // obligatoriedad que una de las dos salidas no tiene. Ver el punto 3 del docstring del componente.
    expect(objPantalla.form.get(QD.strRootCause)?.value).toBe('');
    expect(objPantalla.form.get(QD.strRootCause)?.valid).toBe(true);
    expect(objPantalla.form.get(QD.strCorrectionApplied)?.valid).toBe(true);
    expect(objPantalla.form.valid).toBe(true);

    // **Segunda mitad, y las dos hacen falta.** Sin `Validators.required`, un `mensajeDeError()` que
    // preguntara por `hasError('required')` —que es lo que hace la gemela— devolvería `''` para siempre
    // y el analista se quedaría con el botón deshabilitado y ni una pista de qué le falta. Con solo la
    // primera aserción, esa implementación pasaría; con solo la segunda, pasaría la que repone el
    // validador y rompe escalar.
    objPantalla.autorizar();
    await asentar();

    expect(objPantalla.strErrorCausaRaiz()).toBe('Campo requerido');
    expect(objPantalla.strErrorCorreccion()).toBe('Campo requerido');
  });

  it('el maxLength de 2000 SÍ vive en el control (es el único límite que aplica a las dos salidas)', async () => {
    await montar();

    // El `required` no está pero el `maxLength` sí, y la distinción no es arbitraria: el límite de 2000
    // aplica igual se autorice o se escale, así que puede vivir en el control sin volver inalcanzable
    // ninguna salida. Si alguien "simplificara" quitando los dos validadores de S2, este caso lo ataja.
    const objControl = objPantalla.form.get(QD.strRootCause);
    objControl?.setValue('x'.repeat(2001));
    await asentar();
    expect(objControl?.hasError('maxlength')).toBe(true);
    expect(objPantalla.strErrorCausaRaiz()).toBe('');

    // Y el mensaje de exceso gana sobre el de requerido cuando se intenta autorizar.
    objPantalla.autorizar();
    await asentar();
    expect(objPantalla.strErrorCausaRaiz()).toBe('Máximo 2000 caracteres');

    objControl?.setValue('x'.repeat(2000));
    await asentar();
    expect(objControl?.hasError('maxlength')).toBe(false);
  });

  // ── RUL-011-01 · sin causa raíz Y corrección aplicada no se autoriza el reenvío ─────────────────

  it('RUL-011-01 · no autoriza sin causa raíz ni corrección, y muestra MSG-011-01', async () => {
    await montar();

    expect(objPantalla.blnPuedeAutorizar()).toBe(false);
    // MSG-011-01 pintado, que es el par del `[disabled]`: la afordancia dice "no podés", el mensaje dice
    // por qué. El texto es de **esta** pantalla ("…del reenvío de la prórroga"), no el de la gemela.
    expect(objFixture.nativeElement.textContent).toContain(
      'antes de autorizar el reenvío de la prórroga',
    );

    // ⚠ Se invoca el handler directo en vez de clickear: un `lib-button-z` deshabilitado **igual** dispara
    // su handler bajo jsdom (trampa 1), así que un click no probaría el corte — probaría que el DS no se
    // hizo cargo. Lo que se asevera es que el corte de `autorizar()` existe.
    objPantalla.autorizar();
    await asentar();

    expect(dicPayloadEnviado()).toBeNull();
    // El corte deja el rastro que el wrapper necesita para pintar (`invalid && touched`).
    expect(objPantalla.blnIntentoEnvio()).toBe(true);
    expect(objPantalla.form.get(QD.strRootCause)?.touched).toBe(true);
  });

  it('RUL-011-01 · tampoco autoriza con solo uno de los dos campos', async () => {
    await montar();

    objPantalla.form.patchValue({ [QD.strRootCause]: 'Gateway 502 del proveedor.' });
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

  it('RUL-011-01 · un texto de solo espacios NO satisface la regla', async () => {
    await montar();

    // El `trim()` de `blnPuedeAutorizar` es lo que impide autorizar con un diagnóstico de solo espacios.
    // Acá es más importante que en la gemela: allá `Validators.required` al menos atajaba el `''`, y acá
    // no hay validador de requerido en absoluto, así que este computed es la **única** guarda de la regla.
    //
    // ⚠ Los dos campos se prueban **de a uno**, con el otro lleno de verdad, y no juntos en un solo
    // `patchValue`. La primera versión de este caso los ponía a los dos en espacios a la vez, y eso lo
    // volvía **vacuo**: al ser un `&&`, el `trim()` de cualquiera de los dos alcanzaba para dar `false`,
    // así que sacarle el `trim()` a `strRootCause` dejaba el caso **verde** (comprobado con mutación) y
    // el archivo entero en 24/24. Un campo se tapaba la falta del otro. Es la misma vacuidad de la
    // Fase 4: la aserción se cumple sin ejercitar la línea que dice cubrir.
    for (const strCampo of [QD.strRootCause, QD.strCorrectionApplied]) {
      objPantalla.form.patchValue({
        [QD.strRootCause]: 'Causa diagnosticada',
        [QD.strCorrectionApplied]: 'Corrección aplicada',
        [strCampo]: '   \n\t ',
      });
      await asentar();

      expect(objPantalla.blnPuedeAutorizar(), `${strCampo} con solo espacios habilitó autorizar`).toBe(
        false,
      );

      objPantalla.autorizar();
      await asentar();
      expect(dicPayloadEnviado(), `${strCampo} con solo espacios completó la tarea`).toBeNull();
    }

    // Y con los dos en espacios, obviamente tampoco.
    objPantalla.form.patchValue({
      [QD.strRootCause]: '   ',
      [QD.strCorrectionApplied]: '\n\t ',
    });
    await asentar();

    expect(objPantalla.blnPuedeAutorizar()).toBe(false);

    objPantalla.autorizar();
    await asentar();
    expect(dicPayloadEnviado()).toBeNull();

    // Y el mensaje también trata los espacios como vacío: si `mensajeDeError()` no hiciera el mismo
    // `trim()`, el campo se vería sin error mientras el botón sigue deshabilitado — el peor estado
    // posible, porque el analista no tendría en pantalla ninguna pista de qué le falta.
    expect(objPantalla.strErrorCausaRaiz()).toBe('Campo requerido');
  });

  // ── FLD-058 · el ajuste del payload abre y cierra la edición del control ────────────────────────

  it('FLD-058 · el payload arranca deshabilitado y se habilita al marcar el ajuste', async () => {
    await montar();

    // El bloqueo vive en el CONTROL, no en el `[readOnly]` de la vista que usaba React (divergencia 4):
    // `control.disabled` es estado de Angular y es verificable, mientras que el `readonly` del
    // `za-textarea` es un atributo de un custom element de Lit que bajo jsdom no se refleja (trampa 2).
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
    objPantalla.form.patchValue({ [QD.strPayloadSent]: '{"prorrogaDias": roto' });
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

    // Las tres formas que `JSON.parse` acepta y el script de M3 descartaría. Cada una toca una condición
    // distinta del `return` de `blnPayloadJsonOk`, y por eso las tres están acá: con solo el caso de
    // `'null'` (o solo el del array) las otras dos condiciones podrían borrarse en verde.
    for (const strPayload of ['null', '[1,2]', '"solo texto"', '42']) {
      objPantalla.form.patchValue({ [QD.strPayloadSent]: strPayload });
      await asentar();
      expect(objPantalla.blnPayloadJsonOk(), `payload ${strPayload}`).toBe(false);
      expect(objPantalla.blnPuedeAutorizar(), `payload ${strPayload}`).toBe(false);
    }

    // Y el objeto sí pasa, que es lo que distingue el gate de un "siempre false".
    objPantalla.form.patchValue({ [QD.strPayloadSent]: '{"prorrogaDias":10}' });
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

  // ── ACT-011-01 · Autorizar Reenvío Prórroga ────────────────────────────────────────────────────

  it('ACT-011-01 · autoriza el reenvío con el payload y la acción correctos', async () => {
    await montar();
    await registrarDiagnostico();

    expect(objPantalla.blnPuedeAutorizar()).toBe(true);
    objPantalla.autorizar();
    await asentar();

    const dicEnviado = dicPayloadEnviado();
    expect(dicEnviado).not.toBeNull();

    // El contrato con el script de Momento 3: la acción y el diagnóstico registrado.
    expect(dicEnviado?.[QD.strAction]).toBe('AUTORIZAR_REENVIO');
    expect(dicEnviado?.[QD.strRootCause]).toBe(
      'El gateway del proveedor devolvió 502 al pedir la prórroga.',
    );
    expect(dicEnviado?.[QD.strCorrectionApplied]).toBe(
      'Se reintentó contra el nodo secundario del proveedor.',
    );
    expect(dicEnviado?.[QD.strPayloadAdjustNeeded]).toBe('NO');
  });

  it('ACT-011-01 · el payload deshabilitado SÍ viaja a PM4 (getRawValue, no value)', async () => {
    await montar();
    await registrarDiagnostico();

    // Con el ajuste en 'NO' el control está deshabilitado, y `form.value` **omite** los controles
    // deshabilitados. Si `enviar()` usara `value`, el `qd_strPayloadSent` del intento fallido no llegaría
    // a PM4 y el script de M3 lo recibiría como faltante. Es el costo de haber puesto el bloqueo en el
    // control, y ésta es la aserción que lo cobra.
    expect(objPantalla.form.get(QD.strPayloadSent)?.disabled).toBe(true);
    expect(QD.strPayloadSent in objPantalla.form.value).toBe(false);

    objPantalla.autorizar();
    await asentar();

    expect(dicPayloadEnviado()?.[QD.strPayloadSent]).toBe(STR_PAYLOAD_ORIGINAL);
  });

  it('ACT-011-01 · con ajuste marcado viaja el payload EDITADO', async () => {
    await montar();
    await registrarDiagnostico();

    objPantalla.form.patchValue({ [QD.strPayloadAdjustNeeded]: 'SI' });
    await asentar();
    objPantalla.form.patchValue({ [QD.strPayloadSent]: '{"caseId":"13950011","prorrogaDias":20}' });
    await asentar();

    objPantalla.autorizar();
    await asentar();

    const dicEnviado = dicPayloadEnviado();
    expect(dicEnviado?.[QD.strPayloadSent]).toBe('{"caseId":"13950011","prorrogaDias":20}');
    expect(dicEnviado?.[QD.strPayloadAdjustNeeded]).toBe('SI');
  });

  // ── ⚠ ACT-011-02 · Escalar a Proveedor — LA ACCIÓN QUE SCR-004 NO TIENE ─────────────────────────

  it('ACT-011-02 · escala al proveedor con los campos de S2 VACÍOS (no valida RUL-011-01)', async () => {
    await montar();

    // **El caso más importante del archivo.** Es la salida que el analista usa cuando NO puede
    // diagnosticar la falla —el error es del proveedor—, así que exigirle causa raíz la volvería
    // inalcanzable justo en su escenario. En React es un `onClick` que ni pasa por `handleSubmit`.
    //
    // Si alguien "arreglara" la pantalla metiéndole a `escalar()` la misma guarda que tiene
    // `autorizar()` —lo que parece correcto si uno solo lee RUL-011-01— este caso es lo único que se
    // pondría rojo. Y el modo de falla es invisible en producción: el botón sigue ahí, el analista lo
    // aprieta y no pasa nada.
    expect(objPantalla.blnPuedeAutorizar()).toBe(false);

    objPantalla.escalar();
    await asentar();

    const dicEnviado = dicPayloadEnviado();
    expect(dicEnviado, 'escalar no completó la tarea: ¿le pusieron la guarda de autorizar?').not.toBeNull();
    expect(dicEnviado?.[QD.strAction]).toBe('ESCALAR_PROVEEDOR');
    expect(dicEnviado?.[QD.strRootCause]).toBe('');
    expect(dicEnviado?.[QD.strCorrectionApplied]).toBe('');
  });

  it('ACT-011-02 · escalar NO pinta S2 en rojo (no levanta el intento de envío)', async () => {
    await montar();

    objPantalla.escalar();
    await asentar();
    dicPayloadEnviado();

    // Pintar los campos en rojo al escalar sería reprochar al analista la falta de un diagnóstico que
    // está derivando a propósito. `autorizar()` sí levanta la bandera; ésta es la aserción que las
    // distingue, y sin ella `escalar()` podría copiar el `blnIntentoEnvio.set(true)` de su hermana sin
    // que nada se queje.
    expect(objPantalla.blnIntentoEnvio()).toBe(false);
    expect(objPantalla.strErrorCausaRaiz()).toBe('');
    expect(objPantalla.strErrorCorreccion()).toBe('');
  });

  it('ACT-011-02 · el payload deshabilitado también viaja al escalar', async () => {
    await montar();

    // El `getRawValue()` tiene que estar en **las dos** salidas. `enviar()` es compartido, así que hoy es
    // una sola línea — pero el modo de falla es idéntico y silencioso en ambas, y un refactor que
    // separara los dos envíos podría arreglar uno y no el otro.
    objPantalla.escalar();
    await asentar();

    expect(dicPayloadEnviado()?.[QD.strPayloadSent]).toBe(STR_PAYLOAD_ORIGINAL);
  });

  it('ACT-011-02 · el botón de escalar está disponible aunque la regla no se cumpla', async () => {
    await montar();

    // La afordancia acompaña al handler: el botón de autorizar se apaga con RUL-011-01 sin cumplir, el de
    // escalar NO. Si los dos se apagaran juntos, el caso de arriba (que invoca el handler directo)
    // seguiría verde y el analista no tendría forma de alcanzar la acción.
    expect(objPantalla.blnPuedeAutorizar()).toBe(false);
    expect(objFixture.nativeElement.textContent).toContain('Escalar a Proveedor');

    const cllBotones = (objFixture.nativeElement as HTMLElement).querySelectorAll('lib-button-z');
    const objEscalar = [...cllBotones].find((in_objNodo) =>
      (in_objNodo.textContent ?? '').includes('Escalar a Proveedor'),
    );
    expect(objEscalar, 'no se encontró el botón de escalar').toBeDefined();

    // Se lee el input del `ButtonZ`, no un atributo del DOM: `disabled` es un `@Input()` y su valor no
    // se refleja como atributo del host (y el `za-button` de adentro no hace upgrade bajo jsdom).
    const objInstancia = objFixture.debugElement
      .queryAll(By.css('lib-button-z'))
      .find((in_objNodo) => in_objNodo.nativeElement === objEscalar);
    expect((objInstancia?.componentInstance as { disabled: boolean }).disabled).toBe(false);
  });

  // ── Modal del log completo ─────────────────────────────────────────────────────────────────────

  it('abre y cierra el modal del log completo', async () => {
    await montar();

    expect(objPantalla.blnVerLog()).toBe(false);

    objPantalla.abrirLog();
    await asentar();
    expect(objPantalla.blnVerLog()).toBe(true);
    // El contenido del slot se pinta recién con el modal abierto (el `@if` va DENTRO del
    // `ng-template libZTemplate`, nunca alrededor — ver el punto 3 del comentario del template).
    expect(objFixture.nativeElement.textContent).toContain(
      'Log completo del error técnico de prórroga',
    );

    // La pantalla baja su propia bandera: `ModalZ.change()` muta su propio input `open`, así que si no se
    // sincronizara el segundo `abrirLog()` no cambiaría el valor del `[open]` y el modal no abriría.
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

    objFixture = TestBed.createComponent(RevisionErrorTecnicoProrroga);
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
    // escalar o autorizar una tarea que nunca cargó.
    expect(objFixture.nativeElement.textContent).toContain('Error al cargar el formulario');
    expect(objFixture.nativeElement.textContent).not.toContain('Registro de Corrección — Prórroga');
  });
});
