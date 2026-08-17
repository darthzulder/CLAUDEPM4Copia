import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aseverarContratoDeCampos } from '../../../../components/fields/contrato-pantalla';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { QD, SCR003_PAYLOAD_M2_FIELDS, SCR003_UMBRAL_INTENTOS } from '../fields/fields';
import { CorreccionErrorFuncional } from './correccion-error-funcional';

/**
 * SCR-003 · Corrección Error Funcional M1/M2 — **un caso por RUL/ACT/MSG del anexo**, no un smoke.
 *
 * Mismo método que SCR-004/SCR-008/SCR-011: se asevera el **PUT real** (con `HttpTestingController`, no
 * un espía, porque el `qd_strAction` y el `qd_strPayloadSent` del `data` son contrato con el script de
 * Momento 2) y el **`FormControl` con los computeds**, no el shadow DOM — bajo jsdom los custom elements
 * de Lit no hacen upgrade (trampa 2 de `docs/guides/testing-conventions.md`).
 *
 * ── Lo que esta pantalla tiene y ninguna de las anteriores tenía ─────────────────────────────────
 * 1. **Los dos submits difieren en UNA línea** y esa línea es todo el porte: reenviar vacía
 *    `qd_strPayloadSent` para forzar la regeneración del body, escalar **no** lo vacía porque es la
 *    evidencia técnica. Hay un caso por dirección, y cada uno pasaría con la implementación del otro si
 *    estuviera solo.
 * 2. **RUL-003-01 NO bloquea.** Se reenvía sin cambios y el PUT tiene que salir igual, con
 *    `qd_strFieldCorrection` diciendo el literal. Es lo contrario del reflejo (un "corregir" que no
 *    exige corrección), así que sin caso propio "arreglarlo" dejaría la suite verde.
 * 3. **Tres nombres de control DINÁMICOS.** El anexo declara FLD-040..045 pero ningún script los
 *    escribe; los tres campos de S1 caen al juego que el script sí emite. Hay un caso por rama.
 * 4. **`getRawValue()` en las dos lecturas.** La sección deshabilita las filas bloqueadas, así que un
 *    `value` haría viajar vacíos los campos que el gestor no tocó. Se asevera sobre el PUT con un
 *    control efectivamente deshabilitado.
 *
 * ── ⚠ Acá SÍ hay `drenarColecciones()`, y en SCR-011 su ausencia era la aserción ─────────────────
 * `SeccionCamposPayload` declara `CatalogosService` y `MatrizMotivosService` en **su** `providers`, así
 * que montar la pantalla dispara los GET de los catálogos planos del payload más los `matriz:*`. No se
 * enumeran de a uno a propósito: el conteo exacto es un detalle de `SCR003_PAYLOAD_M2_FIELDS` y fijarlo
 * acá pondría rojo este archivo cada vez que alguien agregue una fila al descriptor, que es justo el
 * cambio que este archivo **no** vino a vigilar. Lo que sí se mantiene es el `objMock.verify()` del
 * `afterEach` sobre las peticiones que **sí** importan (el GET de la tarea y el PUT del submit).
 */

/**
 * `Pm4ContextService` cae a `PM4_ENV_FALLBACKS`, cuyo default lee `src/env.generated.ts` (generado
 * desde `pm4-app/.env`). Acá sale vacío, pero **en la máquina de un dev con `VITE_TASK_ID` cargado la
 * pantalla pediría otra tarea** y estos casos se pondrían rojos por estado local ajeno al código.
 */
const OBJ_ENV_VACIO = { token: '', taskId: '', caseId: '' } as const;

const INT_TASK_ID = 3003;
const INT_REQUEST_ID = 30030;

/** El body que la SFC rechazó, tal como el script de Momento 2 lo dejó en el caso. */
const STR_PAYLOAD_ORIGINAL = '{"codigo_pais":"170","municipio_cod":"11001","texto_queja":"…"}';

/**
 * Fixture **fresco por caso** (función, no constante): si una aserción falla en el medio de un caso que
 * mutó un objeto compartido, el resto del archivo corre con datos corruptos y un fallo real se
 * multiplica en varios.
 *
 * Trae el juego de diagnóstico **real** (el que `sfcCamposErrorTecnico()` emite), no los FLD-040..045
 * del anexo: es el caso que la pantalla ve en producción hoy. La rama del anexo la cubre su propio caso.
 */
const datosTarea = (): Record<string, unknown> => ({
  [QD.strHttpCode]: '400',
  [QD.strErrorType]: 'FUNCTIONAL_VALIDATION',
  [QD.strAttemptNum]: '1',
  [QD.strEndpointCalled]: 'https://smartsupervision/api/v1/quejas',
  [QD.strApiTechMessage]: 'El campo municipio_cod no corresponde al departamento informado',
  [QD.strCompleteLogAPI]: 'POST /quejas → 400\nstack completo…',
  [QD.strPayloadSent]: STR_PAYLOAD_ORIGINAL,
  [QD.strDepartment]: '11',
  [QD.strCity]: '11001',
  [QD.strIdNumber]: '1020304050',
  [QD.strFilingDate]: '01/08/2026',
  [QD.strComplaintText]: 'Texto de la queja original',
});

const tarea = (in_dicDatos: Record<string, unknown>) => ({
  id: INT_TASK_ID,
  status: 'ACTIVE',
  process_request_id: INT_REQUEST_ID,
  created_at: '2026-08-01T10:00:00.000Z',
  data: in_dicDatos,
});

/** Un `throw` en `afterRender` va al ErrorHandler global y **NO** pone rojo el spec. Hay que capturarlo. */
class ErroresDePrueba implements ErrorHandler {
  readonly lstErrores: unknown[] = [];
  handleError(in_genError: unknown): void {
    this.lstErrores.push(in_genError);
  }
}

let objFixture: ComponentFixture<CorreccionErrorFuncional>;
let objPantalla: CorreccionErrorFuncional;
let objMock: HttpTestingController;
let objErrores: ErroresDePrueba;

/** Igual que en `task.service.spec.ts`: jsdom navega dentro del mismo origen sin recargar. */
function fijarQueryString(in_strQuery: string): void {
  window.history.replaceState({}, '', `/${in_strQuery}`);
}

/**
 * Deja que las promesas pendientes resuelvan **y** repinta la vista.
 *
 * ⚠ El orden es `whenStable` → `detectChanges` y no al revés: `whenStable()` por sí solo **no repinta**
 * bajo `provideZonelessChangeDetection()`, así que sin la segunda línea el template se queda en la rama
 * `@if (blnCargando())` y las aserciones de DOM fallan con un mensaje que se lee como "la pantalla no
 * pintó" cuando lo que pasó es que nadie la volvió a pintar.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

/**
 * Descarta los GET de catálogos que dispara `SeccionCamposPayload`.
 *
 * ⚠ **No se enumeran ni se cuentan**, y eso es deliberado: el conjunto sale de
 * `SCR003_PAYLOAD_M2_FIELDS` y de los tres `matriz:*`, así que fijar el número acá pondría rojo todo el
 * archivo cuando alguien agregue una fila al descriptor — un cambio que este archivo no vigila y que ya
 * tiene sus propias guardas en `catalogos.service.spec.ts` y `matriz-motivos.service.spec.ts`.
 *
 * ⚠ **Y hay que poder llamarlo más de una vez, no solo al montar.** Es lo que costó dos pasadas: el
 * catálogo del municipio se recarga desde un `effect` (`aplicarCascadaMunicipio`), así que **cada
 * escritura sobre el departamento —incluida la de `precargar()`— dispara un GET nuevo** con el PMQL del
 * departamento actual. Un drenaje único al montar deja ese GET afuera y el `objMock.verify()` del
 * `afterEach` pone rojo el caso con un mensaje que habla de la colección 15 y no del código bajo
 * prueba. Por eso además de llamarse en `montar()` se llama en el `afterEach`, **antes** del `verify()`.
 *
 * Se responde `[]` porque ninguno de los casos de acá depende de las opciones: lo que viaja a PM4 es el
 * **código** del control, y las etiquetas (`_desc`) que sí se aseveran se escriben a mano en su caso.
 */
function drenarColecciones(): void {
  for (const objReq of objMock.match((in_objReq) => in_objReq.url.includes('/collections/'))) {
    objReq.flush({ data: [], meta: { total: 0 } });
  }
}

/**
 * Monta la pantalla con la tarea ya cargada y el `ngOnInit` completo.
 *
 * ⚠ El orden es el contrato, en cuatro partes:
 * 1. `fijarQueryString` va **antes** de `createComponent` porque `ngOnInit` llama `cargar()`, que lee el
 *    `task_id` de la URL al empezar.
 * 2. `detectChanges()` va **entre** `createComponent` y el `expectOne`: bajo
 *    `provideZonelessChangeDetection()` **`createComponent()` por sí solo NO corre `ngOnInit`**, así que
 *    sin esa línea la cola está genuinamente vacía y el `expectOne` falla con "found none" — un fallo
 *    que se lee como "la pantalla no pide la tarea" cuando es el test el que nunca la dejó arrancar.
 * 3. El `flush` del GET va **antes** del `await`, porque `precargar()` corre recién cuando ese
 *    `await cargar()` resuelve.
 * 4. `drenarColecciones()` va **después** del primer `asentar()`: los catálogos los pide la sección, que
 *    no existe hasta que la pantalla sale de la rama de carga y pinta el formulario.
 */
async function montar(in_dicDatos: Record<string, unknown> = datosTarea()): Promise<void> {
  fijarQueryString(`?task_id=${INT_TASK_ID}`);

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
      { provide: ErrorHandler, useValue: objErrores },
    ],
  });

  objFixture = TestBed.createComponent(CorreccionErrorFuncional);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);

  objFixture.detectChanges();

  objMock
    .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
    .flush(tarea(in_dicDatos));

  await asentar();
  drenarColecciones();
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
 * Los `label` de todos los wrappers de la fachada, indexados por su `name` (`qd_*`).
 *
 * Recorre los componentes hijos por `DebugElement` en vez de leer el DOM: los rótulos viven dentro de
 * los `lib-*-z`, que bajo jsdom no hacen upgrade y no pintan nada. Se filtra por la presencia de los
 * inputs `name`/`label` —el contrato de `CampoBase`— porque esa clase es `@Directive()` abstracta sin
 * selector, así que `By.directive()` no la matchea.
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

/** Marca una fila del payload como editable, que es lo único que la habilita (ver la sección). */
async function habilitarFila(in_strVariable: string): Promise<void> {
  const objSeccion = objFixture.debugElement.query(By.css('app-seccion-campos-payload'));
  const objGrupo = (objSeccion.componentInstance as { objGrupoEdicion: { get: (n: string) => { setValue: (v: unknown) => void } | null } }).objGrupoEdicion;
  objGrupo.get(`edit-${in_strVariable}`)?.setValue(true);
  await asentar();
}

beforeEach(() => {
  TestBed.resetTestingModule();
  fijarQueryString('');
  objErrores = new ErroresDePrueba();

  // ⚠ `scrollIntoView` no existe en jsdom, y `reenviar()` con un formato roto llama
  // `scrollToFirstError()`. Sin este stub el `TypeError` sale como **error no manejado** en vez de como
  // fallo del caso —Vitest reporta los tests en verde con una excepción suelta al lado— porque la
  // implementación difiere el scroll en un `setTimeout(0)` y la excepción escapa después de que el
  // `it()` terminó.
  //
  // El cuerpo vacío ES el stub: hacer nada es todo lo que se le pide.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Element.prototype.scrollIntoView = (() => {}) as Element['scrollIntoView'];
});

afterEach(() => {
  // Destruir la fixture ANTES de drenar y verificar, en ese orden y por dos motivos distintos:
  //
  // 1. `TestBed.resetTestingModule()` del `beforeEach` **no destruye** la fixture del caso anterior,
  //    así que sin esto los `effect()` de las pantallas ya usadas siguen vivos y siguen pidiendo el
  //    catálogo del municipio. Se veía en el conteo del `verify()`: crecía caso a caso (`found 1`,
  //    `found 2`, … `found 6`) en vez de quedarse fijo, que es la firma de una fuga y no de un GET
  //    que falta drenar.
  // 2. Destruir dispara la última vuelta de efectos, así que el drenaje va DESPUÉS — si no, el GET
  //    que provoca la destrucción queda en la cola justo para el `verify()`.
  objFixture?.destroy();
  drenarColecciones();
  objMock.verify();
});

describe('SCR-003 · Corrección Error Funcional M1/M2', () => {
  // ── Estructura y montaje ────────────────────────────────────────────────────────────────────────

  it('cumple el contrato estructural de campos de la fachada', async () => {
    await montar();
    aseverarContratoDeCampos(objFixture);
  });

  it('precarga el diagnóstico y el payload rechazado desde task.data', async () => {
    await montar();

    const dicValores = objPantalla.form.getRawValue() as Record<string, unknown>;
    expect(dicValores[QD.strHttpCode]).toBe('400');
    expect(dicValores[QD.strApiTechMessage]).toContain('municipio_cod');
    expect(dicValores[QD.strPayloadSent]).toBe(STR_PAYLOAD_ORIGINAL);
    expect(dicValores[QD.strCity]).toBe('11001');

    // No hay ningún error diferido: la plantilla monta y los `afterRender` corren limpios.
    expect(objErrores.lstErrores).toEqual([]);
  });

  it('no pinta la pantalla en rojo al montar', async () => {
    await montar();

    // El form arranca **válido**: ningún campo del payload es obligatorio (RUL-003-01 no bloquea), así
    // que un `invalid` acá significaría que alguien le puso un `required` de contrabando a una fila.
    expect(objPantalla.form.valid).toBe(true);
    expect(objPantalla.form.touched).toBe(false);
  });

  it('los rótulos de S1 coinciden con el anexo', async () => {
    await montar();

    const dicReal = rotulosDeLaFachada();
    const dicEsperado: Record<string, string> = {
      // Los tres dinámicos caen al juego que el script SÍ emite (ver el caso de la rama del anexo).
      [QD.strHttpCode]: 'Código de Error SFC / HTTP',
      [QD.strErrorType]: 'Tipo de Error',
      [QD.strAttemptNum]: 'Intento N.° actual (M1/M2)',
      [QD.strEndpointCalled]: 'Endpoint Invocado',
      [QD.strApiTechMessage]: 'Mensaje de Error SFC',
      [QD.strPayloadSent]: 'Payload Enviado (JSON)',
      [QD.strCorrectionJustif]: 'Justificación de la corrección',
    };

    // ⚠ El conteo va **antes** del `for`: sin esta línea, un rótulo que desapareciera del template
    // dejaría el bucle iterando sobre las claves que sí quedaron y el caso pasaría igual.
    for (const strClave of Object.keys(dicEsperado)) {
      expect(Object.keys(dicReal)).toContain(strClave);
    }
    for (const [strClave, strRotulo] of Object.entries(dicEsperado)) {
      expect(dicReal[strClave]).toBe(strRotulo);
    }
  });

  // ── Los tres nombres dinámicos de S1 (el hallazgo del porte) ────────────────────────────────────

  it('S1 cae al diagnóstico del script cuando el caso no trae los FLD-040..045', async () => {
    await montar();

    expect(objPantalla.nmErrorCode()).toBe(QD.strHttpCode);
    expect(objPantalla.nmErrorMessage()).toBe(QD.strApiTechMessage);
    expect(objPantalla.nmAttempt()).toBe(QD.strAttemptNum);
  });

  it('S1 usa los campos del anexo cuando el caso SÍ los trae', async () => {
    await montar({
      ...datosTarea(),
      [QD.strSfcErrorCode]: 'SFC-4001',
      [QD.strSfcErrorMessage]: 'Municipio no pertenece al departamento',
      [QD.strM1M2AttemptNum]: '2',
    });

    expect(objPantalla.nmErrorCode()).toBe(QD.strSfcErrorCode);
    expect(objPantalla.nmErrorMessage()).toBe(QD.strSfcErrorMessage);
    expect(objPantalla.nmAttempt()).toBe(QD.strM1M2AttemptNum);

    // El intento que nombra la alerta sale del campo elegido, no del otro.
    expect(objPantalla.strIntento()).toBe('2');
  });

  // ── RUL-003-02 / MSG-003-02 · advierte a partir de 3 intentos, NO bloquea ───────────────────────

  it('no advierte por intentos cuando el caso está por debajo del umbral', async () => {
    await montar();

    expect(objPantalla.blnMuchosIntentos()).toBe(false);
    expect(objFixture.nativeElement.textContent).not.toContain('considere');
  });

  it('advierte al alcanzar el umbral de intentos, sin deshabilitar ninguna acción', async () => {
    await montar({ ...datosTarea(), [QD.strAttemptNum]: String(SCR003_UMBRAL_INTENTOS) });

    expect(objPantalla.blnMuchosIntentos()).toBe(true);
    expect(objFixture.nativeElement.textContent).toContain('escalar a soporte técnico');

    // La mitad que importa: **advertir no es bloquear**. Los dos botones siguen vivos.
    for (const objBoton of objFixture.debugElement.queryAll(By.css('lib-button-z'))) {
      expect((objBoton.componentInstance as { disabled: boolean }).disabled).toBe(false);
    }
  });

  it('un número de intentos no numérico no advierte', async () => {
    // `NaN >= 3` es `false`, así que sin la guarda de `Number.isFinite` este caso pasaría igual — pero
    // pasaría por accidente. Lo que fija es que un dato sucio se comporte como "no sé cuántos hay".
    await montar({ ...datosTarea(), [QD.strAttemptNum]: 'tercer intento' });

    expect(objPantalla.blnMuchosIntentos()).toBe(false);
  });

  // ── El payload rechazado: parseo tolerante ─────────────────────────────────────────────────────

  it('expone el payload rechazado parseado cuando es un objeto JSON', async () => {
    await montar();

    expect(objPantalla.objPayloadEnviado()).toEqual({
      codigo_pais: '170',
      municipio_cod: '11001',
      texto_queja: '…',
    });
  });

  it('devuelve null cuando el payload no es JSON parseable', async () => {
    // El caso normal de un error: el script guarda ahí lo que respondió la SFC, que puede ser texto.
    await montar({ ...datosTarea(), [QD.strPayloadSent]: 'Bad Request: municipio_cod inválido' });

    expect(objPantalla.objPayloadEnviado()).toBeNull();
  });

  it('devuelve null cuando el payload es un array', async () => {
    // Un array pasa el `typeof === 'object'` y devolvería `undefined` en cada fila sin decir por qué.
    await montar({ ...datosTarea(), [QD.strPayloadSent]: '["municipio_cod"]' });

    expect(objPantalla.objPayloadEnviado()).toBeNull();
  });

  // ── FLD-048 · historial de intentos ────────────────────────────────────────────────────────────

  it('sin intentos deja la tabla montada y pinta el vacío afuera', async () => {
    await montar();

    // ⚠ El `<tbody>` de `TableZ` es un `@for` pelado **sin rama de lista vacía**, así que el empty
    // state tiene que vivir afuera — pero la tabla NO se desmonta: con `data: []` pinta solo el
    // encabezado, y esos rótulos de columna son la paridad con React, que los muestra igual cuando
    // no hay intentos. Las tres mitades: la lista vacía, la tabla presente, y el cartel.
    expect(objPantalla.cllHistorial()).toEqual([]);
    expect(objFixture.nativeElement.querySelector('lib-table-z')).not.toBeNull();
    expect(objFixture.nativeElement.textContent).toContain('Sin intentos anteriores registrados');
  });

  it('pinta la tabla del historial cuando el caso trae filas', async () => {
    await montar({
      ...datosTarea(),
      [QD.lstAttemptHistory]: [
        { intento: '1', fecha: '01/08/2026', campoAfectado: 'municipio_cod', codigoError: '400' },
      ],
    });

    expect(objPantalla.cllHistorial()).toHaveLength(1);
    expect(objFixture.nativeElement.querySelector('lib-table-z')).not.toBeNull();
    expect(objFixture.nativeElement.textContent).not.toContain('Sin intentos anteriores registrados');
  });

  it('descarta del historial las filas que no son objetos', async () => {
    await montar({
      ...datosTarea(),
      [QD.lstAttemptHistory]: [{ intento: '1' }, null, 'texto suelto', 42],
    });

    expect(objPantalla.cllHistorial()).toEqual([{ intento: '1' }]);
  });

  it('el historial es [] cuando el caso trae algo que no es una lista', async () => {
    await montar({ ...datosTarea(), [QD.lstAttemptHistory]: 'sin intentos' });

    expect(objPantalla.cllHistorial()).toEqual([]);
  });

  it('las columnas del historial declaran las keys que TableZ lee de cada fila', async () => {
    await montar({
      ...datosTarea(),
      [QD.lstAttemptHistory]: [
        { intento: '1', fecha: '01/08/2026', campoAfectado: 'municipio_cod', codigoError: '400' },
      ],
    });

    const objTabla = objFixture.debugElement.query(By.css('lib-table-z'));
    const cllHeaders = (objTabla.componentInstance as { headers: { key: string }[] }).headers;

    // `key` no es decorativo: es la propiedad que `TableZ` lee de cada fila, así que una key mal
    // escrita pinta la celda vacía y **sin ningún error**. Se asevera contra la fila real.
    const objFila = objPantalla.cllHistorial()[0] as Record<string, unknown>;
    expect(cllHeaders.map((in_objH) => in_objH.key)).toEqual(Object.keys(objFila));
  });

  // ── FLD-047 · justificación, tope de 2000 ──────────────────────────────────────────────────────

  it('el tope de la justificación vive en el control, no solo en el widget', async () => {
    await montar();

    const objControl = objPantalla.form.get(QD.strCorrectionJustif)!;
    objControl.setValue('x'.repeat(2001));
    expect(objControl.hasError('maxlength')).toBe(true);

    objControl.setValue('x'.repeat(2000));
    expect(objControl.valid).toBe(true);
  });

  it('el mensaje del tope calla hasta el primer intento de envío', async () => {
    await montar();

    objPantalla.form.get(QD.strCorrectionJustif)!.setValue('x'.repeat(2001));
    await asentar();

    // Antes de intentar: el campo es inválido pero la pantalla todavía no habla.
    expect(objPantalla.form.invalid).toBe(true);
    expect(objPantalla.strErrorJustif()).toBe('');

    objPantalla.reenviar();
    await asentar();

    expect(objPantalla.strErrorJustif()).toBe('Máximo 2000 caracteres');
    // Y el intento NO viajó: el formato es el único corte de `reenviar()`.
    expect(dicPayloadEnviado()).toBeNull();
  });

  // ── Validadores de formato: toleran vacío ──────────────────────────────────────────────────────

  it('los validadores de formato toleran el vacío', async () => {
    // Ningún campo del payload es obligatorio: el que decide si falta un dato es la SFC del otro lado.
    // Si un formato marcara `required` de contrabando, un caso que la SFC rechazó **por** venir vacío
    // sería imposible de reenviar desde esta pantalla.
    await montar({ ...datosTarea(), [QD.strIdNumber]: '', [QD.strFilingDate]: '' });

    // Las dos filas se desbloquean por el mismo motivo que los dos casos de abajo: con el control
    // deshabilitado su `status` es `DISABLED` y **ningún validador corre**, así que un `valid` acá no
    // diría nada del validador — que es justo lo que este caso vino a aseverar.
    await habilitarFila(QD.strIdNumber);
    await habilitarFila(QD.strFilingDate);

    expect(objPantalla.form.get(QD.strIdNumber)!.valid).toBe(true);
    expect(objPantalla.form.get(QD.strFilingDate)!.valid).toBe(true);
    expect(objPantalla.form.valid).toBe(true);
  });

  // ⚠ Los dos casos que siguen **tienen que** desbloquear su fila antes de escribir, y el motivo no es
  // cosmético: la sección deshabilita todas las filas al montar, y **un `FormControl` deshabilitado no
  // corre sus validadores** — `hasError()` devuelve `false` aunque el valor sea inválido. Sin el
  // `habilitarFila()` estos casos fallan con `expected false to be true` y el mensaje no dice nada del
  // validador, que es lo que se está aseverando. Es la misma verdad que el caso de ACT-003-01 asevera
  // desde el otro lado (`expect(form.get(QD.strCity)!.disabled).toBe(true)`).
  //
  // Y no es solo un detalle de test: es el comportamiento real de la pantalla. Un formato roto en una
  // fila que el gestor no desbloqueó **no bloquea el reenvío**, porque ese valor ni se edita.

  it('rechaza un número de identificación que no sea solo dígitos', async () => {
    await montar();
    await habilitarFila(QD.strIdNumber);

    const objControl = objPantalla.form.get(QD.strIdNumber)!;
    objControl.setValue('10203040-5');
    expect(objControl.hasError('digitos')).toBe(true);

    objControl.setValue('1020304050');
    expect(objControl.valid).toBe(true);
  });

  it('rechaza una fecha de creación fuera de DD/MM/AAAA', async () => {
    await montar();
    await habilitarFila(QD.strFilingDate);

    const objControl = objPantalla.form.get(QD.strFilingDate)!;
    objControl.setValue('2026-08-01');
    expect(objControl.hasError('fecha')).toBe(true);

    objControl.setValue('01/08/2026');
    expect(objControl.valid).toBe(true);
  });

  // ── FLD-046 · lstCambios(), la trazabilidad del lado del BPM ────────────────────────────────────

  it('lstCambios() dice el literal cuando no hubo cambios', async () => {
    await montar();

    // RUL-003-01 no bloquea, así que "reenviar sin cambios" es legítimo y tiene que quedar **dicho**
    // en el caso, no ausente: una cadena vacía se leería como "nadie registró nada".
    expect(objPantalla.lstCambios()).toBe('Reenvío sin cambios en el payload');
  });

  it('lstCambios() rotula un cambio con antes → ahora y la etiqueta del valor nuevo', async () => {
    await montar();
    await habilitarFila(QD.strCity);

    objPantalla.form.get(QD.strCity)!.setValue('11002');
    objPantalla.form.get(`${QD.strCity}_desc`)!.setValue('Otro Municipio');
    await asentar();

    // El formato es contrato, no cosmética: `<rótulo>: <antes> → <ahora> (<descripción>)`.
    expect(objPantalla.lstCambios()).toBe('municipio_cod: 11001 → 11002 (Otro Municipio)');
  });

  it('lstCambios() rotula las filas auxiliares por su variable y no por su key', async () => {
    await montar();
    await habilitarFila(QD.strInteraction);

    objPantalla.form.get(QD.strInteraction)!.setValue('Asistencias');
    await asentar();

    // La key de las auxiliares es el literal `'—'`, y una línea que dijera `—: → Asistencias` sería
    // ilegible para quien audite el caso.
    expect(objPantalla.lstCambios()).toContain(`${QD.strInteraction}: (vacío) → Asistencias`);
    expect(objPantalla.lstCambios()).not.toContain('—:');
  });

  it('lstCambios() marca el vacío como (vacío) en las dos direcciones', async () => {
    await montar();
    await habilitarFila(QD.strComplaintText);

    objPantalla.form.get(QD.strComplaintText)!.setValue('');
    await asentar();

    expect(objPantalla.lstCambios()).toBe(
      'texto_queja: Texto de la queja original → (vacío)',
    );
  });

  // ── ACT-003-01 · corregir y reenviar ───────────────────────────────────────────────────────────

  it('ACT-003-01 vacía el payload para forzar la regeneración del body', async () => {
    await montar();

    objPantalla.reenviar();
    await asentar();

    const dicEnviado = dicPayloadEnviado();
    expect(dicEnviado).not.toBeNull();
    expect(dicEnviado![QD.strAction]).toBe('CORREGIR_REENVIAR');

    // ⚠ **La línea que es todo el porte.** Si el payload viejo viajara, `opMomento2` compararía el body
    // regenerado contra él, vería diferencia y reenviaría **el viejo** — la corrección del gestor no
    // llegaría nunca a la SFC. Las dos claves van juntas y por el mismo motivo.
    expect(dicEnviado![QD.strPayloadSent]).toBe('');
    expect(dicEnviado![QD.strPayloadAdjustNeeded]).toBe('NO');
  });

  it('ACT-003-01 reenvía sin cambios (RUL-003-01 no bloquea) y deja la traza', async () => {
    await montar();

    objPantalla.reenviar();
    await asentar();

    const dicEnviado = dicPayloadEnviado();
    expect(dicEnviado).not.toBeNull();
    expect(dicEnviado![QD.strFieldCorrection]).toBe('Reenvío sin cambios en el payload');
  });

  it('ACT-003-01 lleva los campos bloqueados con su valor, no vacíos', async () => {
    await montar();

    // La sección deshabilita toda fila que el gestor no marcó, y **un control deshabilitado desaparece
    // de `form.value`**. Se asevera sobre un control efectivamente deshabilitado: sin `getRawValue()`
    // este campo viajaría vacío a PM4, que es peor que el error que la pantalla vino a corregir.
    expect(objPantalla.form.get(QD.strCity)!.disabled).toBe(true);

    objPantalla.reenviar();
    await asentar();

    expect(dicPayloadEnviado()![QD.strCity]).toBe('11001');
  });

  it('ACT-003-01 lleva el valor corregido de una fila desbloqueada', async () => {
    await montar();
    await habilitarFila(QD.strComplaintText);

    objPantalla.form.get(QD.strComplaintText)!.setValue('Texto corregido por el gestor');
    await asentar();

    objPantalla.reenviar();
    await asentar();

    const dicEnviado = dicPayloadEnviado()!;
    expect(dicEnviado[QD.strComplaintText]).toBe('Texto corregido por el gestor');
    expect(dicEnviado[QD.strFieldCorrection]).toContain('texto_queja:');
  });

  it('ACT-003-01 no envía nada si un formato está roto', async () => {
    await montar();
    await habilitarFila(QD.strIdNumber);

    objPantalla.form.get(QD.strIdNumber)!.setValue('no-son-digitos');
    await asentar();

    objPantalla.reenviar();
    await asentar();

    expect(dicPayloadEnviado()).toBeNull();
    // El corte marca todo tocado para que los mensajes de formato aparezcan.
    expect(objPantalla.form.touched).toBe(true);
  });

  // ── ACT-003-02 · escalar a soporte técnico ─────────────────────────────────────────────────────

  it('ACT-003-02 NO vacía el payload: es la evidencia técnica del analista', async () => {
    await montar();

    objPantalla.escalar();
    await asentar();

    const dicEnviado = dicPayloadEnviado();
    expect(dicEnviado).not.toBeNull();
    expect(dicEnviado![QD.strAction]).toBe('ESCALAR_SOPORTE');

    // ⚠ El contrapunto exacto del caso de ACT-003-01. Cada uno de los dos pasaría con la
    // implementación del otro si estuviera solo; juntos fijan que los submits difieren en esta línea.
    expect(dicEnviado![QD.strPayloadSent]).toBe(STR_PAYLOAD_ORIGINAL);
  });

  it('ACT-003-02 escala aunque un formato esté roto', async () => {
    await montar();
    await habilitarFila(QD.strIdNumber);

    objPantalla.form.get(QD.strIdNumber)!.setValue('no-son-digitos');
    await asentar();

    // Es la salida que el gestor usa **cuando la corrección no alcanza**: exigirle el formato de un
    // campo que igual va a revisar un analista la volvería inalcanzable en su propio escenario.
    objPantalla.escalar();
    await asentar();

    expect(objPantalla.form.invalid).toBe(true);
    expect(dicPayloadEnviado()![QD.strAction]).toBe('ESCALAR_SOPORTE');
  });

  it('ACT-003-02 también lleva los campos bloqueados con su valor', async () => {
    await montar();

    objPantalla.escalar();
    await asentar();

    expect(dicPayloadEnviado()![QD.strCity]).toBe('11001');
  });

  // ── ACT-003-03 · el modal del log completo ─────────────────────────────────────────────────────

  it('abre, cierra y reabre el modal del log', async () => {
    await montar();

    objPantalla.abrirLog();
    await asentar();
    expect(objPantalla.blnVerLog()).toBe(true);

    objPantalla.cerrarLog();
    await asentar();
    expect(objPantalla.blnVerLog()).toBe(false);

    // La segunda apertura es la que fallaría con un `[open]` de una sola vía: `ModalZ.change()` escribe
    // `this.open = false` sobre su propio input, y Angular no reevalúa una expresión que no cambió.
    objPantalla.abrirLog();
    await asentar();
    expect(objPantalla.blnVerLog()).toBe(true);
  });

  /**
   * El contenido del slot `content` llega al DOM cuando el modal está abierto.
   *
   * ⚠ **Este caso guarda un modo de falla que NINGÚN otro gate del proyecto ve.** Verificado por
   * mutación: al quitar `ZrTemplate` del `imports` del componente, el `libZTemplate` deja de matchear
   * una directiva, `ModalZ` no encuentra el slot y el modal abre **vacío** — y tanto `ng build` como la
   * suite completa quedaban **verdes**. Un aserto sobre la bandera `blnVerLog()` no alcanza: la bandera
   * sube igual, lo que no aparece es el contenido.
   *
   * Se asevera sobre el `<h3 class="modal-titulo">`, que es el primer nodo del slot. No sobre el
   * `zds-textarea`, porque ese depende **además** del `[formGroup]` local del modal (sin el cual tiraría
   * NG01050) y confundiría dos fallas distintas en un solo caso.
   */
  it('el contenido del slot del modal llega al DOM al abrirlo', async () => {
    await montar();

    // Cerrado no tiene que estar: el `@if (blnVerLog())` vive ADENTRO del slot, así que la ausencia acá
    // es lo que hace significativa la presencia de abajo (sin esto el caso pasaría con un slot que se
    // pinta siempre).
    expect(objFixture.nativeElement.querySelector('.modal-titulo')).toBeNull();

    objPantalla.abrirLog();
    await asentar();

    const objTitulo = objFixture.nativeElement.querySelector('.modal-titulo');
    expect(objTitulo).not.toBeNull();
    expect(objTitulo?.textContent).toContain('Log completo');

    expect(objErrores.lstErrores).toEqual([]);
  });

  it('el log del modal sale del campo que el script de Momento 2 escribe', async () => {
    await montar();

    objPantalla.abrirLog();
    await asentar();

    // `qd_strCompleteLogAPI` es un campo AGREGADO, sin FLD en el anexo (§10.5 de la DOCUMENTACION).
    expect(objPantalla.form.getRawValue()[QD.strCompleteLogAPI]).toContain('stack completo');
  });

  // ── El descriptor del payload es contrato con el script PHP ─────────────────────────────────────

  it('cada variable del descriptor tiene control en el form', async () => {
    await montar();

    // ⚠ La guarda que atrapa un renombre: `patchValue` descarta en silencio las claves que el
    // `FormGroup` no declara, así que una fila del descriptor sin control se pintaría vacía y viajaría
    // vacía **sin ningún error**. El conteo va antes del `for` por lo de siempre.
    const cllVariables = SCR003_PAYLOAD_M2_FIELDS
      .map((in_objDef) => in_objDef.variable)
      .filter((in_str): in_str is NonNullable<typeof in_str> => !!in_str);

    expect(cllVariables.length).toBeGreaterThan(0);
    for (const strVariable of cllVariables) {
      expect(objPantalla.form.get(strVariable), strVariable).not.toBeNull();
    }
  });

  // ── La rama de error de carga ─────────────────────────────────────────────────────────────────

  it('reemplaza el formulario por la alerta cuando la tarea no carga', async () => {
    fijarQueryString(`?task_id=${INT_TASK_ID}`);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
        { provide: ErrorHandler, useValue: objErrores },
      ],
    });

    objFixture = TestBed.createComponent(CorreccionErrorFuncional);
    objPantalla = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);
    objFixture.detectChanges();

    objMock
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush({ message: 'Tarea no encontrada' }, { status: 404, statusText: 'Not Found' });

    await asentar();

    expect(objFixture.nativeElement.textContent).toContain('Error al cargar el formulario');
    // Las dos mitades: el error aparece **y** el formulario no está. Sin la segunda, la rama `@else if`
    // podría estar pintando las dos cosas a la vez y el caso pasaría igual.
    expect(objFixture.nativeElement.querySelector('form')).toBeNull();
    expect(objFixture.nativeElement.querySelector('app-seccion-campos-payload')).toBeNull();
  });
});
