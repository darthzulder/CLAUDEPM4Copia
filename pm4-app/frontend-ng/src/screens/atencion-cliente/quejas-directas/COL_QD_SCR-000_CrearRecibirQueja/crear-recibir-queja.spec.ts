import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController, TestRequest, provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RecaptchaWidgetComponent } from '../../../../components/recaptcha-widget';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import {
  buildSfcCode, QD, QD_COLLECTIONS,
  SCR000_OS_SIMILAR_CASES_SCRIPT_ID,
  SCR000_OS_WEB_ENTRY_EVENT_ID, SCR000_OS_WEB_ENTRY_PROCESS_ID,
  SCR000_SIMILAR_CASES_SCRIPT_ID,
  SCR000_WEB_ENTRY_EVENT_ID, SCR000_WEB_ENTRY_PROCESS_ID,
} from '../fields/fields';
import { CrearRecibirQueja } from './crear-recibir-queja';
import { SeccionDetalleQueja } from './seccion-detalle-queja';

/**
 * SCR-000 · Crear/Recibir Queja — **un caso por regla**, no un smoke.
 *
 * ── Este archivo cierra la brecha que el spec React declaró por escrito ──────────────────────────
 * `CrearRecibirQueja.test.tsx:1-25` dice, textual, que **no cubre el envío exitoso**: react-hook-form
 * exige ~20 obligatorios repartidos en selects del DS que `fireEvent` no puede tocar bajo jsdom, y
 * encima RUL-000-09 vacía el municipio en cada cambio de departamento —**incluida la precarga**—, así
 * que ni con un fixture el form quedaba válido. En Angular esos 20 campos son `FormControl`s y se
 * llenan con `patchValue`, así que las **dos** ramas de envío pasan a ser aseverables por la URL que
 * sale al backend. Es el mismo hueco que se cerró en SCR-013 con los filtros.
 *
 * Los cinco casos que React no pudo escribir están marcados `⚠ imposible en React` abajo.
 *
 * ── Lo que esta pantalla tiene y ninguna de las diez anteriores tenía ────────────────────────────
 * 1. **Dos modos de envío en el mismo componente**, y la rama la decide la **ausencia** de `task_id`.
 *    Hay un caso por dirección y cada uno pasaría con la implementación del otro si estuviera solo:
 *    el de Web Entry asevera el `POST /process_events/31?event=node_661`, el de tarea asevera que va
 *    por `PUT /tasks/{id}` **y que no hay ningún `process_events`**.
 * 2. **`qd_strSfcCode` no puede existir antes del envío**: su tercer componente es el `case_number`
 *    que PM4 asigna al radicar. Se asevera sobre el **segundo** PUT, el de después de crear el caso.
 * 3. **El gate de envío es de dos mitades** (autorización + token de captcha) y una de ellas se
 *    apaga sola a los dos minutos. `(expirado)` tiene caso propio.
 * 4. **Radica en DOS procesos distintos**, y la rama la decide el tipo de solicitud de S1: una queja
 *    abre un caso del 31 con variables `qd_*` y el script 70; cualquier otro tipo abre uno del 36 con
 *    variables `os_*` y el script 101. Los casos de esa bifurcación aseveran **el destino y el
 *    vocabulario de la petición**, no el `computed()` que los elige: `blnEsQueja()` cableado a `true`
 *    dejaría verde cualquier caso que solo mirara el signal.
 *
 * ── Se asevera sobre el `FormControl` y sobre la petición, no sobre el shadow DOM ────────────────
 * Bajo jsdom los custom elements de Lit no hacen upgrade (trampa 2 de
 * `docs/guides/testing-conventions.md`), así que el DOM de un `lib-*-z` está vacío. Lo que se lee es
 * el control, el `computed()` y el `HttpTestingController`.
 */

/**
 * `Pm4ContextService` cae a `PM4_ENV_FALLBACKS`, cuyo default lee `src/env.generated.ts` (generado
 * desde `pm4-app/.env`).
 *
 * ⚠ Acá es **más crítico que en las otras diez**: esta pantalla decide su rama de envío por
 * `!taskId() && !caseId()`, así que en la máquina de un dev con `VITE_TASK_ID` cargado los casos de
 * Web Entry irían por `completarTarea` y se pondrían rojos por estado local ajeno al código — con un
 * mensaje que se lee como "la pantalla eligió mal la rama".
 */
const OBJ_ENV_VACIO = { token: '', taskId: '', caseId: '' } as const;

const INT_TASK_ID = 7000;
const INT_REQUEST_ID = 70000;

/** `id` interno del request que devuelve el `process_events` de la radicación web. */
const INT_REQUEST_CREADO = 90210;

/** El número de queja que ve el ciudadano. **No** es el `id`: PM4 los expone por separado. */
const INT_CASE_NUMBER = 4321;

/** Un texto de queja que pasa el `minLength(50)` de FLD-327. */
const STR_QUEJA_VALIDA = 'La póliza fue expedida con una placa distinta de la que informé al asesor '
  + 'en la sucursal, y llevo tres semanas sin respuesta.';

/** El detalle de la **otra** sección, la que reemplaza a S3 cuando el tipo no es una queja. */
const STR_DETALLE_SOLICITUD = 'Necesito el certificado de mi póliza de hogar para el banco.';

/** Token que el widget emite al tildar el checkbox. */
const STR_TOKEN = 'token-de-prueba-03AGdBq';

/**
 * Los obligatorios de las tres secciones, **fresco por caso** (función, no constante).
 *
 * Son los `Validators.required` del `FormGroup` de la pantalla: si una aserción falla en medio de un
 * caso que mutó un objeto compartido, el resto del archivo corre con datos corruptos y un fallo real
 * se multiplica en varios.
 *
 * ⚠ El municipio (`strCity`) va acá pero **se escribe último y aparte** — ver `llenarObligatorios()`.
 */
const dicObligatorios = (): Record<string, unknown> => ({
  // ⚠ **`'3'` es Queja, y el valor es una precondición, no un dato de relleno.** Los cuatro
  // obligatorios de S3 (producto, interacción, motivo y el relato de 50 caracteres) solo existen en la
  // rama de queja: con cualquier otro tipo la pantalla monta "Detalle de la Solicitud" y
  // `alternarValidadoresDetalle()` los libera, así que este diccionario dejaría el form válido **por el
  // motivo equivocado** y los once casos que dependen de él no ejercitarían S3. La rama de solicitud
  // tiene su propio llenado: `llenarObligatoriosSolicitud()`.
  //
  // Va el **código** y no la etiqueta porque `drenarColecciones()` responde CAT-TIPO-SOL con `[]`: sin
  // etiqueta, `esTipoQueja()` cae al código, que es exactamente el respaldo que ese helper documenta.
  [QD.strRequestType]: '3',
  [QD.strFilerRole]: '1',
  [QD.strReceptionPoint]: '1',
  [QD.strIdType]: '1',
  [QD.strIdNumber]: '1020304050',
  // ⚠ **Nombre y apellido no llevan `Validators.required` en el `FormGroup`, y hacen falta igual.**
  // Su obligatoriedad la compone el DS desde el `[obligatorio]="true"` de la plantilla, y sigue a la
  // rama que el `@if` montó (persona natural acá, que es el default). Ver el ⚠ de los cinco campos de
  // nombre en `crear-recibir-queja.ts`. Sin estas dos líneas el form queda inválido con `errorRequired`
  // —la clave del DS, no de Angular— y `enviar()` sale por el `return` del `form.invalid`.
  [QD.strFirstName]: 'Nelson',
  [QD.strLastName]: 'Bravo',
  [QD.strEmail]: 'ciudadano@example.com',
  [QD.strPhone]: '3001234567',
  [QD.strDepartment]: '11',
  [QD.strSfcProduct]: '104',
  [QD.strInteraction]: '2',
  [QD.strSfcReason]: '55',
  [QD.strComplaintText]: STR_QUEJA_VALIDA,
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

let objFixture: ComponentFixture<CrearRecibirQueja>;
let objPantalla: CrearRecibirQueja;
let objMock: HttpTestingController;
let objErrores: ErroresDePrueba;

/** Igual que en `task.service.spec.ts`: jsdom navega dentro del mismo origen sin recargar. */
function fijarQueryString(in_strQuery: string): void {
  window.history.replaceState({}, '', `/${in_strQuery}`);
}

/**
 * Deja que las promesas pendientes resuelvan **y** repinta la vista.
 *
 * ⚠ El orden es `whenStable` → `detectChanges`: `whenStable()` por sí solo **no repinta** bajo
 * `provideZonelessChangeDetection()`, así que sin la segunda línea el template se queda en la rama
 * `@if (blnCargando())` y las aserciones de DOM fallan con un mensaje que se lee como "la pantalla no
 * pintó" cuando lo que pasó es que nadie la volvió a pintar.
 *
 * ⚠ **El `setTimeout(0)` es el que hace aseverable el submit, y no es un "esperar por si acaso".**
 * `whenStable()` espera a que el *scheduler* de Angular quede quieto, pero la cadena del envío
 * —`enviar()` → `chequearSimilares()` → `detallarSimilares()` → `Promise.all` → `radicar()`— son
 * promesas propias que el scheduler no conoce: no hay nada "inestable" mientras esos `.then` esperan su
 * turno en la cola de microtasks. Con `whenStable()` solo, responder el script 70 y volver acá deja la
 * cadena a mitad de camino, y el fallo sale como `expected undefined to be 2` o
 * `Expected one matching request […] found none` — los dos se leen como "la pantalla no hizo nada"
 * cuando en realidad todavía no llegó a hacerlo. Un macrotask corre **después** de toda la cola de
 * microtasks pendiente, así que cubre la cadena completa sin tener que contar cuántos `await` tiene.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  await new Promise((in_fnListo) => setTimeout(in_fnListo, 0));
  objFixture.detectChanges();
}

/**
 * Descarta los GET de catálogos de la pantalla y de sus dos secciones.
 *
 * ⚠ **No se enumeran ni se cuentan**, igual que en SCR-003 y por el mismo motivo: son los seis de S1
 * más los siete de S2 más los `matriz:*` de S3, y fijar el número acá pondría rojo todo el archivo
 * cada vez que alguien agregue un catálogo a una sección — un cambio que este archivo no vigila y que
 * ya tiene guardas propias en `catalogos.service.spec.ts` y `matriz-motivos.service.spec.ts`.
 *
 * Los `matriz:*` de S3 **no** están entre los del montaje: la sección solo existe si el tipo de
 * solicitud es Queja, y al montar no hay tipo elegido. Aparecen recién en el drenaje que sigue a
 * elegir el tipo — que es el motivo por el que varios casos llaman a esta función dos veces.
 *
 * ⚠ **Y tiene que poder llamarse más de una vez.** El catálogo del municipio se recarga desde un
 * `effect` de S2, así que **cada escritura sobre el departamento dispara un GET nuevo** con el PMQL
 * del departamento actual. Un drenaje único al montar deja ese GET afuera y el `objMock.verify()` del
 * `afterEach` pone rojo el caso hablando de la colección del municipio y no del código bajo prueba.
 *
 * Se responde `[]` porque la mayoría de los casos de acá no depende de las opciones: lo que viaja a
 * PM4 es el **código** del control. Los que sí las necesitan montan con `montarConCatalogosS1()`.
 */
function drenarColecciones(): void {
  for (const objReq of objMock.match((in_objReq) => in_objReq.url.includes('/collections/'))) {
    objReq.flush({ data: [], meta: { total: 0 } });
  }
}

/** Un registro de colección con el par `{codigo, descripcion}` que usan CAT-PUNTO y CAT-INSTANCIA. */
const registro = (in_strCodigo: string, in_strDesc: string) => ({
  data: { codigo: in_strCodigo, descripcion: in_strDesc },
});

/**
 * Monta como Web Entry **con opciones de verdad en el punto y en la instancia de recepción**.
 *
 * ⚠ Hace falta un montaje propio y no alcanza con `montarWebEntry()`: las cuatro derivaciones de S1
 * (`sembrarPunto`, `sembrarInstancia`, `derivarCanal`, `limpiarAlianza`) resuelven el código **contra
 * el catálogo** en vez de escribir un literal, así que con el `[]` de `drenarColecciones()` todas
 * salen por su guarda de "catálogo vacío" y **no escriben nada**. Un caso escrito sobre el montaje
 * normal pasaría en verde con las derivaciones borradas — que es exactamente lo que pasó: estas
 * cuatro estuvieron sin registrar en ningún `effect()` y las 26 aserciones del archivo siguieron
 * verdes (ver el caso de abajo).
 *
 * Los ids son los de `core/collections.ts`: **20** CAT-PUNTO, **19** CAT-INSTANCIA. Se responden por
 * separado y **antes** del drenaje general, que se lleva los otros once.
 *
 * El punto `'2'` (Aplicación móvil) va incluido a propósito aunque `CLL_PUNTOS_OCULTOS` lo esconda: es
 * lo que permite que el caso de los puntos retirados asevere sobre un catálogo que **sí** lo trae.
 *
 * `in_dicPrecarga` monta **como tarea** en vez de Web Entry y precarga esos datos. Es lo que necesita el
 * caso de la guarda de no-pisar: sin opciones reales `sembrarPunto()` sale por su *otra* guarda (la de
 * catálogo vacío) y el caso pasa **vacuamente** — medido, con la guarda de no-pisar borrada el caso
 * seguía verde.
 */
async function montarConCatalogosS1(
  in_dicPrecarga?: Record<string, unknown>,
): Promise<void> {
  fijarQueryString(in_dicPrecarga ? `?task_id=${INT_TASK_ID}` : '');
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
      { provide: ErrorHandler, useValue: objErrores },
    ],
  });

  objFixture = TestBed.createComponent(CrearRecibirQueja);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);

  objFixture.detectChanges();
  if (in_dicPrecarga) {
    objMock
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush(tarea(in_dicPrecarga));
  }
  await asentar();

  objMock
    .expectOne((in_objReq) => in_objReq.url.includes('/collections/20/records'))
    .flush({
      data: [
        registro('2', 'Aplicación móvil'),
        registro('4', 'Oficina'),
        registro('1', 'Internet'),
      ],
    });
  objMock
    .expectOne((in_objReq) => in_objReq.url.includes('/collections/19/records'))
    .flush({ data: [registro('2', 'Entidad vigilada'), registro('3', 'Defensor del Consumidor')] });

  drenarColecciones();
  await asentar();
}

/**
 * Monta la pantalla **como Web Entry**: sin `task_id` ni `case_id` en la URL.
 *
 * Es el modo por defecto porque es el real de esta pantalla —una página pública— y porque es el que
 * `blnEsWebEntry` reconoce por **ausencia**: cualquier `task_id` colado en la URL (incluido el de
 * `.env`, ver `OBJ_ENV_VACIO`) la manda por la otra rama sin avisar.
 *
 * ⚠ Sin `task_id` **no hay GET de tarea que drenar**: `TaskService.cargar()` sale temprano. Por eso
 * acá no hay `expectOne` del GET, al contrario de las otras diez pantallas.
 */
async function montarWebEntry(): Promise<void> {
  fijarQueryString('');
  await crear();
}

/**
 * Monta la pantalla **como tarea normal**: con `task_id`, o sea el modo en que la abre un funcionario
 * sobre un caso que ya existe.
 *
 * El `flush` del GET va **antes** del `await`, porque `precargar()` corre recién cuando ese
 * `await cargar()` resuelve.
 */
async function montarComoTarea(in_dicDatos: Record<string, unknown> = {}): Promise<void> {
  fijarQueryString(`?task_id=${INT_TASK_ID}`);
  await crear(() => {
    objMock
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush(tarea(in_dicDatos));
  });
}

/**
 * El montaje común a las dos ramas.
 *
 * ⚠ `detectChanges()` va **entre** `createComponent` y el `flush` de la tarea: bajo
 * `provideZonelessChangeDetection()` **`createComponent()` por sí solo NO corre `ngOnInit`**, así que
 * sin esa línea la cola está genuinamente vacía y el `expectOne` falla con "found none" — un fallo que
 * se lee como "la pantalla no pide la tarea" cuando es el test el que nunca la dejó arrancar.
 *
 * `drenarColecciones()` va **después** del primer `asentar()`: los catálogos de S2 y S3 los piden las
 * secciones, que no existen hasta que la pantalla sale de la rama de carga y pinta el formulario.
 */
async function crear(in_fnResponderTarea?: () => void): Promise<void> {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
      { provide: ErrorHandler, useValue: objErrores },
    ],
  });

  objFixture = TestBed.createComponent(CrearRecibirQueja);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);

  objFixture.detectChanges();
  in_fnResponderTarea?.();

  await asentar();
  drenarColecciones();
  await asentar();
}

/** El `FormGroup` de la pantalla. `protected` es visibilidad de TypeScript, no de runtime. */
function form(): import('@angular/forms').FormGroup {
  return (objPantalla as unknown as { form: import('@angular/forms').FormGroup }).form;
}

function leer(in_strCampo: string): unknown {
  return form().getRawValue()[in_strCampo];
}

/**
 * La instancia de S3, para llegar al control satélite del picker de producto.
 *
 * Hace falta la instancia real —y no un `patchValue` sobre `qd_strSfcProduct`— porque el `_desc` del
 * producto se escribe desde el `valueChanges` de ese satélite: escribir el código directo saltea el
 * único código que lo produce.
 */
function seccionDetalle(): SeccionDetalleQueja {
  return objFixture.debugElement.query(By.directive(SeccionDetalleQueja)).componentInstance;
}

/**
 * Llena los ~20 obligatorios de las tres secciones y deja el form **válido**.
 *
 * ⚠ **El municipio se escribe último y en su propio `patchValue`, y ahí está toda la brecha de React.**
 * RUL-000-09 vacía `qd_strCity` en cada cambio de `qd_strDepartment` desde un `effect` de S2, así que
 * un `patchValue` único con los dos campos deja el municipio en `''` y el form inválido — que es
 * exactamente el motivo por el que el fixture de React no servía. Acá se resuelve dándole al efecto la
 * vuelta que necesita (`asentar()`) **entre** el departamento y el municipio.
 *
 * ⚠ Y hay que drenar después: la escritura del departamento pide el catálogo del municipio.
 */
async function llenarObligatorios(): Promise<void> {
  form().patchValue(dicObligatorios());
  await asentar();
  drenarColecciones();
  await asentar();

  form().patchValue({ [QD.strCity]: '11001' });
  await asentar();

  exigirFormValido();
}

/**
 * Lo mismo, pero para la rama de **Otras Solicitudes**: tipo distinto de Queja y el detalle de S3'.
 *
 * ⚠ **Los cuatro obligatorios de S3 se escriben VACÍOS a propósito, y ahí está la mordida del helper.**
 * Es la precondición de los casos de la rama `os_`, y a la vez el único lugar donde se asevera que
 * `alternarValidadoresDetalle()` **liberó** los `required` de la sección que el `@if` desmontó: sin ese
 * efecto, producto/interacción/motivo/relato siguen siendo obligatorios sobre el mismo `FormGroup`, el
 * `exigirFormValido()` de abajo los nombra y los tres casos de la rama se ponen rojos antes de llegar a
 * la petición. Medido: borrando ese efecto, el fallo sale acá con los cuatro nombres.
 *
 * Y `strComplaintText` va con un texto **corto** en vez de `''`: así el caso también cubre la mitad
 * fácil de olvidar, que es el `minLength(50)`. Un `''` la dejaría pasar por casualidad —el `required` y
 * el mínimo fallan juntos sobre un campo vacío—, y el form quedaría inválido por un mínimo sobre un
 * campo que ya no se ve sin que ningún caso lo notara.
 */
async function llenarObligatoriosSolicitud(): Promise<void> {
  form().patchValue({
    ...dicObligatorios(),
    [QD.strRequestType]: '1', // "Solicitud" en CAT-TIPO-SOL: cualquier cosa que no sea queja.
    [QD.strSfcProduct]: '',
    [QD.strInteraction]: '',
    [QD.strSfcReason]: '',
    [QD.strComplaintText]: 'Corto.',
    [QD.strCaseDescription]: STR_DETALLE_SOLICITUD,
  });
  await asentar();
  drenarColecciones();
  await asentar();

  form().patchValue({ [QD.strCity]: '11001' });
  await asentar();

  exigirFormValido();
}

/**
 * ⚠ **La aserción va en un helper y no en el `it()`, y es deliberado.** Es la precondición de catorce
 * casos; si el llenado deja el form inválido, `enviar()` sale por el `return` del `form.invalid` y el
 * fallo aparece doce líneas después como un `expectOne` que "no encontró el POST del script de
 * similares" — un mensaje que manda a depurar la cadena de envío cuando el defecto está en el llenado.
 * Nombrar los controles inválidos acá convierte ese fallo en la lista de lo que falta.
 */
function exigirFormValido(): void {
  const cllInvalidos = Object.entries(form().controls)
    .filter(([, in_objControl]) => in_objControl.invalid)
    // El nombre **y** los errores: `errorRequired` (del DS) y `required` (de Angular) son dos
    // mecanismos distintos y se arreglan de forma distinta, así que el mensaje tiene que decir cuál es.
    .map(([in_strNombre, in_objControl]) =>
      `${in_strNombre} ${JSON.stringify(in_objControl.errors)}`);
  expect(`obligatorios sin llenar: [${cllInvalidos.join(', ')}]`).toBe('obligatorios sin llenar: []');
}

/** Tilda la autorización de datos (la mitad del gate que sí depende del form). */
async function autorizar(): Promise<void> {
  form().patchValue({ [QD.blnDataAuth]: true });
  await asentar();
}

/**
 * Emite `(verificado)` desde el widget **real**, no llamando al método de la pantalla.
 *
 * Es la diferencia entre aseverar el cableado y aseverar el cuerpo del handler: si alguien borra el
 * `(verificado)="alVerificarCaptcha($event)"` del template, un `objPantalla.alVerificarCaptcha(...)`
 * seguiría verde y la pantalla quedaría con un captcha que no habilita nada.
 */
async function verificarCaptcha(in_strToken: string = STR_TOKEN): Promise<void> {
  widget().verificado.emit(in_strToken);
  await asentar();
}

/** Igual que arriba, para el `(expirado)` de los dos minutos. */
async function expirarCaptcha(): Promise<void> {
  widget().expirado.emit();
  await asentar();
}

function widget(): RecaptchaWidgetComponent {
  return objFixture.debugElement.query(By.directive(RecaptchaWidgetComponent))
    .componentInstance as RecaptchaWidgetComponent;
}

/** Responde el `POST /recaptcha/verify` que `radicar()` hace antes de enviar. */
function responderVerify(in_blnExito = true): void {
  objMock
    .expectOne((in_objReq) => in_objReq.url === '/api/recaptcha/verify')
    .flush({ success: in_blnExito });
}

/**
 * Responde el script de similares con la cantidad pedida y sus ids.
 *
 * `in_blnOs` responde con las claves del script **101** (`os_*`) en vez de las del 70: son dos scripts
 * distintos con el mismo contrato salvo el prefijo, y la pantalla lee la salida con el vocabulario del
 * proceso destino. Un `false` acá contra la rama de Otras Solicitudes haría que la cantidad se lea como
 * `undefined` → `0`, o sea "no hay similares" — el modal no se abriría y el caso pasaría vacuamente.
 */
function responderSimilares(
  in_intCantidad = 0, in_cllIds: number[] = [], in_blnOs = false,
): void {
  const clave = (in_strClave: string): string =>
    in_blnOs ? in_strClave.replace(/^qd_/, 'os_') : in_strClave;
  objMock
    .expectOne((in_objReq) => in_objReq.url.includes('/scripts/') && in_objReq.url.endsWith('/execute'))
    .flush({
      response: {
        // Sin prefijo en los dos scripts: es el diagnóstico del watcher, no una variable del proyecto.
        [QD.strSimilarCheckStatus]: in_intCantidad > 0 ? 'DUPLICADOS' : 'OK',
        [clave(QD.arridSimilarCases)]: in_cllIds,
        [clave(QD.intCountSimilarCases)]: in_intCantidad,
      },
    });
}

/**
 * El `POST /process_events/{proceso}` de la rama Web Entry, o `null` si la pantalla no lo hizo.
 *
 * ⚠ **Devuelve el `TestRequest`, y por eso el `objPeticion` de vuelta no es un detalle de tipos.**
 * `HttpTestingController.match()` **saca** de la cola lo que devuelve, así que llamar a este helper
 * consume el POST: quien después quiera responderlo tiene que hacerlo sobre **este mismo** objeto, no
 * volver a buscarlo con un `expectOne`. Un `expectOne` posterior falla con
 * `Expected one matching request […] found none` — un mensaje que se lee como "la pantalla nunca hizo
 * el POST" cuando la verdad es la contraria: lo hizo, y este helper ya se lo llevó.
 *
 * Se usa `match` y no `expectOne` a propósito: los casos que aseveran que la rama Web Entry **no** se
 * tomó necesitan poder recibir `null` en vez de un fallo del arnés.
 */
function postWebEntry(): {
  url: string;
  params: string;
  body: Record<string, unknown>;
  objPeticion: TestRequest;
} | null {
  const cllPosts = objMock.match(
    (in_objReq) => in_objReq.method === 'POST' && in_objReq.url.includes('/process_events/'),
  );
  if (cllPosts.length === 0) return null;
  const objReq = cllPosts[0].request;
  return {
    url: objReq.url,
    params: objReq.params.get('event') ?? '',
    body: objReq.body as Record<string, unknown>,
    objPeticion: cllPosts[0],
  };
}

beforeEach(() => {
  TestBed.resetTestingModule();
  fijarQueryString('');
  objErrores = new ErroresDePrueba();

  // ⚠ `scrollIntoView` no existe en jsdom, y `enviar()` con el form inválido llama
  // `scrollToFirstError()`. Sin este stub el `TypeError` sale como **error no manejado** en vez de
  // como fallo del caso —Vitest reporta los tests en verde con una excepción suelta al lado— porque
  // la implementación difiere el scroll en un `setTimeout(0)` y la excepción escapa después de que
  // el `it()` terminó. El cuerpo vacío ES el stub: hacer nada es todo lo que se le pide.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Element.prototype.scrollIntoView = (() => {}) as Element['scrollIntoView'];

  // Mismo motivo, para el `setTimeout(window.scrollTo)` de `limpiarFormulario()`.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  window.scrollTo = (() => {}) as typeof window.scrollTo;

  // Stub de `window.grecaptcha`, para que el widget real no se quede sondeando.
  //
  // El `RecaptchaWidget` está montado en la pantalla (se emite `(verificado)` desde él a propósito, para
  // que borrar el binding del template ponga rojo el spec), así que su `ngOnInit` llama al
  // `RecaptchaLoaderService`. jsdom **no ejecuta el `src`** de un `<script>` inyectado, así que
  // `grecaptcha.render` nunca aparece y el servicio sondea 10 segundos antes de rechazar. Con el stub
  // puesto, `cargar()` toma su primer atajo (`if (window.grecaptcha?.render)`) y resuelve sin tocar el
  // DOM. Es el mismo stub que `recaptcha-modal.spec.ts` y que el test de React.
  //
  // ⚠ **No es lo que arregló los `Test timed out in 5000ms` de este archivo, y conviene decirlo acá
  // porque la coincidencia es muy convincente.** Esos timeouts eran un `await enviar()` esperando el
  // flush del POST del script 70 que la línea siguiente del propio caso iba a hacer — un abrazo mortal
  // del arnés, no una espera de red. Se midió: quitando este stub los 23 casos siguen verdes. Se
  // conserva porque el sondeo de 10s es real y deja un `[recaptcha] no se pudo cargar api.js` en la
  // salida que se lee como si algo estuviera fallando, no porque ningún caso dependa de él.
  window.grecaptcha = { render: vi.fn(() => 7), reset: vi.fn() };
});

afterEach(() => {
  // Destruir la fixture ANTES de drenar y verificar, en ese orden y por dos motivos distintos:
  // 1. `resetTestingModule()` del `beforeEach` **no destruye** la fixture del caso anterior, así que
  //    sin esto los `effect()` de las pantallas ya usadas siguen vivos y siguen pidiendo el catálogo
  //    del municipio. Se ve en el conteo del `verify()`: crece caso a caso en vez de quedarse fijo,
  //    que es la firma de una fuga y no de un GET que falta drenar.
  // 2. Destruir dispara la última vuelta de efectos, así que el drenaje va DESPUÉS.
  objFixture?.destroy();
  drenarColecciones();
  objMock.verify();

  // Se saca para que un caso futuro que quiera probar la rama "grecaptcha no está" no herede el stub.
  delete window.grecaptcha;
});

describe('SCR-000 · Crear/Recibir Queja', () => {
  // ── Estructura y chrome ─────────────────────────────────────────────────────────────────────────

  /**
   * ⚠ **Timeout explícito de 15s, y no es un test lento que haya que arreglar.** Es el primer `it()`
   * del archivo, así que paga el primer montaje del módulo —la subida de los custom elements del DS—
   * para la pantalla más grande del proceso: 46 controles y **tres** componentes con sus propios
   * catálogos. Aislado corre en ~1s; con los 70 archivos de la suite compitiendo por los workers
   * cruza el default de 5000ms. Es el mismo ⚠ que llevan SCR-003 y SCR-013.
   */
  it('monta con el banner de la página pública y las cuatro secciones visibles', async () => {
    await montarWebEntry();

    const strTexto = objFixture.nativeElement.textContent as string;
    expect(strTexto).toContain('Radicación PQRs');
    expect(strTexto).toContain('Tipo de solicitud');
    expect(strTexto).toContain('Autorización y envío');

    // El chrome es el de sitio público, no el de pantalla embebida: es la divergencia #3 de la
    // cabecera de la clase, y si alguien lo cambiara por `app-screen-header` esto lo nombra.
    expect(objFixture.debugElement.query(By.css('app-pqr-page'))).not.toBeNull();
    expect(objFixture.debugElement.query(By.css('app-seccion-consumidor'))).not.toBeNull();

    // ⚠ La cuarta sección al montar es **"Detalle de la Solicitud"**, no S3: sin tipo elegido el
    // dropdown de S1 está vacío y vacío no es "queja". Es lectura literal de la regla, y es la que le
    // da a la pantalla algo que mostrar en el estado inicial en vez de un hueco entre S2 y S4.
    expect(objFixture.debugElement.query(By.css('app-seccion-detalle-queja'))).toBeNull();
    expect(strTexto).toContain('Detalle de la Solicitud');

    expect(objErrores.lstErrores).toEqual([]);
  }, 15_000);

  // ── S3 · las dos secciones de detalle ───────────────────────────────────────────────────────────

  it('S3 · "Detalle de la queja" solo con Queja; con cualquier otro tipo, la de Solicitud', async () => {
    await montarWebEntry();

    // Arranca en la sección de solicitud, con **un solo** campo. El conteo es la mitad que asevera el
    // "solo tenga el campo de Ingresa el detalle de la solicitud" del pedido: los otros dos textarea de
    // la pantalla (el relato de la queja y el argumento de la réplica) viven los dos en S3, así que si
    // alguien montara S3 acá o le agregara campos a la sección nueva, este número lo dice.
    expect(objFixture.debugElement.queryAll(By.css('zds-textarea')).length).toBe(1);
    expect(objFixture.nativeElement.textContent).not.toContain('Detalle de la queja');

    // Queja (código '3' de CAT-TIPO-SOL) → se cambia de sección.
    form().patchValue({ [QD.strRequestType]: '3' });
    await asentar();
    drenarColecciones(); // S3 recién montada pide sus catálogos `matriz:*`.
    await asentar();

    expect(objFixture.debugElement.query(By.css('app-seccion-detalle-queja'))).not.toBeNull();
    expect(objFixture.nativeElement.textContent).toContain('Detalle de la queja');
    expect(objFixture.nativeElement.textContent).not.toContain('Detalle de la Solicitud');

    // Y de vuelta: la sección de solicitud reaparece. La transición en los dos sentidos importa
    // porque el `@if` gobierna qué obligatorios cuentan — ver el caso de abajo.
    form().patchValue({ [QD.strRequestType]: '5' }); // Derecho de petición.
    await asentar();

    expect(objFixture.debugElement.query(By.css('app-seccion-detalle-queja'))).toBeNull();
    expect(objFixture.nativeElement.textContent).toContain('Detalle de la Solicitud');
  });

  /**
   * ⚠ **Este caso cubre el modo de falla silencioso de todo el cambio.**
   *
   * Las dos secciones comparten el `FormGroup` de la pantalla, así que el `@if` esconde los widgets
   * pero **no** los `Validators.required`. Sin `alternarValidadoresDetalle()` la rama de solicitud
   * queda inenviable: `enviar()` sale por el `return` del `form.invalid` y `scrollToFirstError()` busca
   * el `id="field-…"` de campos que no están en el DOM, así que el botón Enviar no hace **nada** y no
   * hay un solo campo en rojo que lo explique.
   *
   * Se asevera por el estado de los controles y no con `hasValidator()` a propósito: el DS **compone**
   * sus propios validadores encima (`setValidators(compose([previo, generateValidation]))`, ver
   * `campo-base.ts`), así que el array de validadores crudos no es una lectura fiel de lo que el
   * control exige. Lo que exige se ve en `errors`.
   */
  it('los obligatorios del detalle viajan de una sección a la otra, en los dos sentidos', async () => {
    await montarWebEntry();

    // Rama de solicitud (sin tipo elegido): el detalle nuevo es obligatorio y el relato de la queja no.
    expect(form().get(QD.strCaseDescription)?.hasError('required')).toBe(true);
    expect(form().get(QD.strComplaintText)?.valid).toBe(true);

    // Y el mínimo de 50 tampoco cuenta: 'Corto.' es válido en esta rama. Es la mitad que se olvida —
    // la columna de solicitud de `CLL_VALIDADORES_DETALLE` tiene que dejar el tope de 2000 y **soltar**
    // el mínimo; si conservara los validadores declarados en el `FormControl`, este `valid` sería `false`.
    form().patchValue({ [QD.strComplaintText]: 'Corto.' });
    await asentar();
    expect(form().get(QD.strComplaintText)?.valid).toBe(true);

    // Queja: los obligatorios se dan vuelta.
    form().patchValue({ [QD.strRequestType]: '3', [QD.strCaseDescription]: '' });
    await asentar();
    drenarColecciones();
    await asentar();

    expect(form().get(QD.strCaseDescription)?.valid).toBe(true);
    // El relato de 6 caracteres que era válido hace tres líneas ahora falla por el mínimo de 50.
    expect(form().get(QD.strComplaintText)?.hasError('minlength')).toBe(true);
    // Y el producto SFC vuelve a ser obligatorio. Es el que **no tiene red del DS**: su
    // `[obligatorio]` viaja sobre el control satélite `objProductoUi`, así que el `required` que pone
    // `alternarValidadoresDetalle()` es el único que ese campo tiene en toda la pantalla.
    expect(form().get(QD.strSfcProduct)?.hasError('required')).toBe(true);

    form().patchValue({ [QD.strComplaintText]: STR_QUEJA_VALIDA });
    await asentar();
    expect(form().get(QD.strComplaintText)?.valid).toBe(true);

    // ⚠ **Y la vuelta después de que S3 estuvo montada, que es el caso difícil y el motivo por el que
    // `alternarValidadoresDetalle()` escribe la columna entera con `setValidators()`.** Los
    // `zds-select` de la sección **componen** su propio `errorRequired` sobre el control real al
    // montarse (`setValidators(compose([previo, generateValidation]))`, ver `campo-base.ts`), y ese
    // closure no se va cuando el `@if` desmonta la sección —ningún campo de la lib tiene `ngOnDestroy`—:
    // sobrevive al componente que lo puso, leyendo el `model` de una instancia destruida. Un
    // `removeValidators(Validators.required)` no lo saca (después de la composición el control ya no
    // tiene esa función, tiene el closure) y tampoco falla, así que la rama de solicitud quedaría
    // inválida para siempre por dos campos que no están en el DOM. **Estos tres `errors` en `null` son
    // la medición de que la tabla pisa lo que el DS compuso.**
    form().patchValue({ [QD.strRequestType]: '1', [QD.strCaseDescription]: STR_DETALLE_SOLICITUD });
    await asentar();

    for (const strCampo of [QD.strSfcProduct, QD.strInteraction, QD.strSfcReason]) {
      expect(`${strCampo} ${JSON.stringify(form().get(strCampo)?.errors)}`)
        .toBe(`${strCampo} null`);
    }
  });

  it('S6 · la sección de responsable está ausente sin asignado y presente con él', async () => {
    await montarWebEntry();
    expect(objFixture.nativeElement.textContent).not.toContain('Responsable asignado');

    form().patchValue({ [QD.strAssigneeRole]: 'Siniestros Autos' });
    await asentar();

    // En una radicación nueva esto nunca pasa (el caso todavía no tiene responsable); la sección
    // existe para quien abre la pantalla como tarea sobre un caso ya asignado.
    expect(objFixture.nativeElement.textContent).toContain('Responsable asignado');
  });

  it('RUL-000-01 · el campo Alianza solo aparece con el rol Empleado Zurich', async () => {
    await montarWebEntry();

    form().patchValue({ [QD.strFilerRole]: '1' });
    await asentar();
    expect(objPantalla['blnEsEmpleadoZurich']()).toBe(false);

    form().patchValue({ [QD.strFilerRole]: '3' });
    await asentar();
    expect(objPantalla['blnEsEmpleadoZurich']()).toBe(true);
  });

  // ── Las cuatro derivaciones de S1 ───────────────────────────────────────────────────────────────
  //
  // ⚠ **Este bloque existe porque las cuatro estuvieron escritas y sin ejecutar.** `sembrarPunto()`,
  // `sembrarInstancia()`, `derivarCanal()` y `limpiarAlianza()` estaban definidas, correctas y **sin
  // un solo call site**: las dos secciones hijas registran sus derivaciones en un `effect()` del
  // constructor (`seccion-consumidor.ts:98-115`, `seccion-detalle-queja.ts:134-150`) y la pantalla
  // padre nunca tuvo constructor. `tsc` no las marcó (son métodos de clase, no variables locales), el
  // lint tampoco, y las 26 aserciones del archivo pasaban verdes. Se destapó **visualmente**, con el
  // MCP de Playwright contra el dev server: React muestra "Punto de recepción: Internet" y Angular lo
  // mostraba vacío, con el control en `''` y `qd_strChannel` vacío como consecuencia.
  //
  // De ahí que estos casos asevaren **el valor del control**, no la existencia del método: un caso
  // sobre "el método hace lo correcto" habría pasado desde el primer día sin que la pantalla derivara
  // nada. Lo que fija la regla es que el efecto **corra**.

  it('⚠ siembra "Internet" como punto de recepción por defecto, y de ahí deriva el canal', async () => {
    // La regla que la revisión visual destapó. Va **por etiqueta** (`/internet/i`) y no por código
    // fijo, igual que React, así que el caso la ejercita con un catálogo donde Internet no es el
    // primero ni el único.
    await montarConCatalogosS1();

    expect(leer(QD.strReceptionPoint)).toBe('1');

    // `derivarCanal()` cuelga del punto: sembrarlo sin derivar el canal deja `qd_strChannel` vacío
    // viajando a PM4, que es el estado que tenía la pantalla antes del arreglo. Internet (punto 1) →
    // canal 13 (CAT-CANAL). El literal va escrito acá y **no** importado de `DIC_CANAL_POR_PUNTO`:
    // importarlo haría que el caso compare la tabla contra sí misma y sobreviva a que la editen.
    expect(leer(QD.strChannel)).toBe('13');

    // Y una segunda derivación con otro resultado, porque el caso de arriba solo también pasaría con
    // un `qd_strChannel` cableado al literal '13'. Oficina (punto 4) → canal 14.
    form().patchValue({ [QD.strReceptionPoint]: '4' });
    await asentar();
    expect(leer(QD.strChannel)).toBe('14');
  });

  it('el punto sembrado sale de los VISIBLES, no del catálogo completo', async () => {
    // `cllPuntosVisibles()` descarta los tres retirados (`'2'`, `'6'`, `'99'`). El catálogo del helper
    // trae el `'2'` (Virtual) a propósito: si la siembra leyera `cllPuntos()` en vez de la lista
    // filtrada, el select ofrecería un punto que el ciudadano no puede elegir.
    await montarConCatalogosS1();

    expect(objPantalla['cllPuntos']().map((in_objO) => in_objO.value)).toContain('2');
    expect(objPantalla['cllPuntosVisibles']().map((in_objO) => in_objO.value)).not.toContain('2');
  });

  it('NO pisa un punto de recepción que ya venía precargado', async () => {
    // La guarda `if (this.leer(QD.strReceptionPoint) || …) return`. Un caso abierto como tarea sobre un
    // caso viejo conserva su punto en vez de que la siembra lo mueva a Internet.
    //
    // ⚠ **Con catálogo de verdad, y eso es lo que hace que el caso muerda.** Escrito sobre el montaje
    // normal (catálogo `[]`) pasaba **vacuamente**: `sembrarPunto()` salía por la *otra* mitad de la
    // guarda —la de lista vacía— así que nada podía pisar nada. Medido: borrando la mitad que este caso
    // dice cubrir, seguía verde. Ahora Internet está disponible y la siembra tiene con qué pisar.
    await montarConCatalogosS1({ [QD.strReceptionPoint]: '4' });

    expect(leer(QD.strReceptionPoint)).toBe('4');
    // Y el canal se deriva del punto conservado, no del que se habría sembrado (Internet → '13').
    expect(leer(QD.strChannel)).toBe('14');
  });

  it('RUL-000-04 · la instancia de recepción se deriva del rol, y queda bloqueada', async () => {
    // Los cuatro roles "vigilada" (Cliente, Intermediario, Empleado Zurich, No cliente) resuelven a
    // `'2'`; el Defensor del Consumidor Financiero (`'4'`) a `'3'`. Se asevera **una de cada grupo**,
    // porque un mapeo escrito con un solo `if` pasaría con solo aseverar el default.
    await montarConCatalogosS1();

    form().patchValue({ [QD.strFilerRole]: '1' });
    await asentar();
    expect(leer(QD.strReceptionInstance)).toBe('2');

    form().patchValue({ [QD.strFilerRole]: '4' });
    await asentar();
    expect(leer(QD.strReceptionInstance)).toBe('3');

    // Y el control queda deshabilitado: RUL-000-01 la asigna, el ciudadano no la elige. Va por estado
    // del `FormControl` porque `zds-select` no tiene input `disabled` (ver `bloquearInstancia()`), así
    // que el único canal que la deshabilita de verdad es éste — y `getRawValue()` es lo que la lee.
    expect(form().get(QD.strReceptionInstance)?.disabled).toBe(true);
  });

  it('⚠ la instancia de recepción NO se pinta, y el valor viaja igual', async () => {
    // Negocio pidió esconderla: es una variable que el BPM maneja por detrás. Las dos mitades van en el
    // mismo caso a propósito — quitar el widget es trivial, y el riesgo entero está en que al hacerlo se
    // le corte el dato al backend sin que nada lo note (el campo no se ve, así que nadie lo extrañaría
    // hasta que el proceso bifurque mal). El `_desc` va también: es la convención del proyecto y lo que
    // hace legible el caso en PM4.
    await montarConCatalogosS1();

    form().patchValue({ [QD.strFilerRole]: '1' });
    await asentar();

    expect(
      (objFixture.nativeElement as HTMLElement)
        .querySelector(`[name="${QD.strReceptionInstance}"]`),
    ).toBeNull();
    // El punto de recepción, que compartía la fila, sí sigue pintado.
    expect(
      (objFixture.nativeElement as HTMLElement)
        .querySelector(`[name="${QD.strReceptionPoint}"]`),
    ).not.toBeNull();

    // Y el dato sigue ahí, con su `_desc`: se lee por `getRawValue()` porque el control va deshabilitado.
    const dicCrudo = form().getRawValue() as Record<string, unknown>;
    expect(dicCrudo[QD.strReceptionInstance]).toBe('2');
    expect(dicCrudo[`${QD.strReceptionInstance}_desc`]).toBeTruthy();
  });

  it('RUL-000-01 · al salir del rol Empleado Zurich se LIMPIA la alianza elegida', async () => {
    // La otra mitad de RUL-000-01: el caso de arriba asevera que el campo se oculta, éste que el valor
    // no se queda escondido detrás del `@if`. Sin esto una alianza elegida por error viajaría a PM4
    // junto a un rol que no la admite.
    await montarConCatalogosS1();

    form().patchValue({ [QD.strFilerRole]: '3', [QD.strAlliance]: 'ALIANZA-X' });
    await asentar();
    expect(leer(QD.strAlliance)).toBe('ALIANZA-X');

    form().patchValue({ [QD.strFilerRole]: '1' });
    await asentar();
    expect(leer(QD.strAlliance)).toBe('');
  });

  // ── El gate de envío ────────────────────────────────────────────────────────────────────────────

  it('el gate arranca cerrado, y ni la autorización ni el captcha solos lo abren', async () => {
    await montarWebEntry();
    expect(objPantalla['blnPuedeEnviar']()).toBe(false);

    // Solo la autorización: falta el captcha.
    await autorizar();
    expect(objPantalla['blnPuedeEnviar']()).toBe(false);

    // Se destilda y se marca solo el captcha: falta la autorización. Es la mitad que el spec React
    // no aseveraba por separado, y sin ella un gate escrito con `||` pasaría igual.
    form().patchValue({ [QD.blnDataAuth]: false });
    await asentar();
    await verificarCaptcha();
    expect(objPantalla['blnPuedeEnviar']()).toBe(false);
  });

  it('el gate se abre con las dos mitades, aseverado como transición', async () => {
    await montarWebEntry();
    await autorizar();

    // La transición y no solo el estado final: `blnPuedeEnviar` es un `computed()` sobre
    // `sigValores()` y un signal del token, y un computed que no depende de lo que dice depender se
    // congela en su primera evaluación. Ver la cabecera de la clase.
    expect(objPantalla['blnPuedeEnviar']()).toBe(false);
    await verificarCaptcha();
    expect(objPantalla['blnPuedeEnviar']()).toBe(true);
  });

  /**
   * ⚠ **Imposible en React** — el spec de allá no cubría el ciclo de vida del token.
   *
   * El token de reCAPTCHA v2 caduca a los dos minutos y el widget reemite `(expirado)`. Sin esta
   * mitad la pantalla seguiría creyendo que hay validación humana y el `siteverify` del backend
   * contestaría `timeout-or-duplicate` sobre un checkbox que el usuario ve tildado.
   */
  it('⚠ (expirado) invalida el token y vuelve a cerrar el gate', async () => {
    await montarWebEntry();
    await autorizar();
    await verificarCaptcha();
    expect(objPantalla['blnPuedeEnviar']()).toBe(true);

    await expirarCaptcha();

    // La autorización sigue tildada: lo único que cambió es el token, y alcanza para cerrar el gate.
    expect(leer(QD.blnDataAuth)).toBe(true);
    expect(objPantalla['blnPuedeEnviar']()).toBe(false);
  });

  it('sin captcha, "Enviar" no llega ni al script de similares y pinta el mensaje', async () => {
    await montarWebEntry();
    await llenarObligatorios();
    await autorizar();

    await objPantalla['enviar']();
    await asentar();

    expect(objPantalla['strErrorEnvio']()).toContain('No soy un robot');
    // Y sobre todo: **ninguna** petición salió. El orden del flujo es contrato (captcha barato y
    // local primero), así que un submit que corriera el script 70 antes de pedir el captcha dejaría
    // este `verify()` con una petición sin drenar.
    expect(objMock.match(() => true)).toEqual([]);
  });

  it('con el form incompleto, "Enviar" marca todo como tocado y no radica', async () => {
    await montarWebEntry();
    await autorizar();
    await verificarCaptcha();

    // Solo la autorización y el captcha: los ~20 obligatorios siguen vacíos.
    await objPantalla['enviar']();
    await asentar();

    expect(form().invalid).toBe(true);
    expect(objPantalla['blnIntentoEnvio']()).toBe(true);
    expect(objMock.match(() => true)).toEqual([]);
  });

  // ── El envío · las dos ramas ────────────────────────────────────────────────────────────────────

  /**
   * ⚠ **Imposible en React** — es el caso que su spec declaró inaseverable por escrito.
   *
   * Asevera las cuatro cosas que definen la rama Web Entry:
   * 1. la URL es `POST /process_events/{proceso}` con el `event` como **query param**;
   * 2. el payload lleva el captcha resuelto y `qd_blnSmartSupervisionCase = false`;
   * 3. `qd_strSfcCode` viaja en un **segundo** PUT, porque su tercer componente es el `case_number`
   *    que PM4 recién asignó — no puede existir en el primer POST;
   * 4. la pantalla pasa al resumen MSG-000-08 con ese número de caso.
   */
  it('⚠ envío exitoso por Web Entry: POST a process_events y el SfcCode en el segundo PUT', async () => {
    await montarWebEntry();
    await llenarObligatorios();
    await autorizar();
    await verificarCaptcha();

    const objEnvio = objPantalla['enviar']();
    await asentar();

    // 1 · el script de similares, que no encuentra nada → se radica sin modal.
    responderSimilares(0);
    await asentar();

    // 2 · el verify server-side, bloqueante.
    responderVerify(true);
    await asentar();

    // 3 · la creación del caso.
    const objPost = postWebEntry();
    expect(objPost).not.toBeNull();
    expect(objPost?.url).toBe(`/api/process_events/${SCR000_WEB_ENTRY_PROCESS_ID}`);
    expect(objPost?.params).toBe(SCR000_WEB_ENTRY_EVENT_ID);
    expect(objPost?.body[QD.blnCaptcha]).toBe(true);
    expect(objPost?.body[QD.blnSmartSupervisionCase]).toBe(false);
    expect(objPost?.body[QD.strComplaintText]).toBe(STR_QUEJA_VALIDA);
    // El código SFC **no** puede estar acá: el caso todavía no existe.
    expect(objPost?.body[QD.strSfcCode]).toBeUndefined();

    // Se responde **sobre el handle** que devolvió `postWebEntry()`: ese helper ya sacó el POST de la
    // cola del mock, así que buscarlo de nuevo con un `expectOne` no lo encuentra. Ver su docstring.
    objPost?.objPeticion.flush({ id: INT_REQUEST_CREADO, case_number: INT_CASE_NUMBER });
    await asentar();

    // 4 · el segundo PUT, con el código SFC que recién ahora se puede construir.
    const objPut = objMock.expectOne(
      (in_objReq) => in_objReq.method === 'PUT'
        && in_objReq.url === `/api/requests/${INT_REQUEST_CREADO}`,
    );
    const dicDatos = (objPut.request.body as { data: Record<string, unknown> }).data;
    expect(dicDatos[QD.strSfcCode]).toBe(buildSfcCode(INT_CASE_NUMBER));
    objPut.flush({});

    await objEnvio;
    await asentar();

    // 5 · el resumen MSG-000-08, con el número de caso que PM4 asignó.
    expect(objPantalla['blnEnviado']()).toBe(true);
    const cllResumen = objPantalla['cllResumen']();
    expect(cllResumen[0]).toEqual({ label: 'Número de caso', value: String(INT_CASE_NUMBER) });
  });

  /**
   * ⚠ **Imposible en React** — la otra mitad, y la que hace que el caso de arriba signifique algo.
   *
   * Cada uno de los dos pasaría con la implementación del otro si estuviera solo: lo que distingue
   * las ramas es la **ausencia** de `task_id`, así que un `enviarAPm4()` que siempre fuera por
   * `process_events` dejaría verde el caso de arriba. La aserción central es la negativa:
   * `postWebEntry()` tiene que ser `null`.
   */
  it('⚠ envío exitoso como tarea normal: va por completarTarea y NO por process_events', async () => {
    await montarComoTarea();
    await llenarObligatorios();
    await autorizar();
    await verificarCaptcha();

    const objEnvio = objPantalla['enviar']();
    await asentar();
    responderSimilares(0);
    await asentar();
    responderVerify(true);
    await asentar();

    // El caso ya existe, así que la pantalla pide su `case_number` para el código SFC.
    objMock
      .expectOne((in_objReq) => in_objReq.method === 'GET'
        && in_objReq.url === `/api/requests/${INT_REQUEST_ID}`)
      .flush({ case_number: INT_CASE_NUMBER });
    await asentar();

    // **La aserción que distingue las dos ramas.**
    expect(postWebEntry()).toBeNull();

    const objPut = objMock.expectOne(
      (in_objReq) => in_objReq.method === 'PUT' && in_objReq.url === `/api/tasks/${INT_TASK_ID}`,
    );
    const objCuerpo = objPut.request.body as { status: string; data: Record<string, unknown> };
    expect(objCuerpo.status).toBe('COMPLETED');
    // Acá sí viaja en el **mismo** envío: el caso ya existía antes del submit.
    expect(objCuerpo.data[QD.strSfcCode]).toBe(buildSfcCode(INT_CASE_NUMBER));
    objPut.flush({});

    await objEnvio;
    await asentar();
    expect(objPantalla['blnEnviado']()).toBe(true);
  });

  /**
   * ⚠ **La radicación de la rama que NO es queja: otro proceso y otro vocabulario.**
   *
   * Las tres mitades del pedido que viven en el envío, en un solo caso porque son un solo POST:
   * el **proceso 36** en vez del 31, el evento de ese proceso, y **todas** las variables con `os_`.
   *
   * Las dos aserciones que hacen que el caso signifique algo son las negativas:
   * - `not.toBe(SCR000_WEB_ENTRY_PROCESS_ID)` — si alguien apuntara las dos ramas al mismo proceso,
   *   la aserción positiva seguiría verde y este caso no diría nada;
   * - `filter(k => k.startsWith('qd_'))` vacío — aseverar que `os_strIdNumber` **está** no prueba que
   *   se haya renombrado: un payload con las dos familias de claves pasaría igual, y el proceso 36
   *   recibiría el doble de variables de las que su BPMN conoce.
   */
  it('⚠ la rama de solicitud radica en el proceso 36 y con TODAS las variables en `os_`', async () => {
    await montarWebEntry();
    await llenarObligatoriosSolicitud();
    await autorizar();
    await verificarCaptcha();

    const objEnvio = objPantalla['enviar']();
    await asentar();
    responderSimilares(0, [], true);
    await asentar();
    responderVerify(true);
    await asentar();

    const objPost = postWebEntry();
    expect(objPost).not.toBeNull();
    expect(objPost?.url).toBe(`/api/process_events/${SCR000_OS_WEB_ENTRY_PROCESS_ID}`);
    expect(objPost?.params).toBe(SCR000_OS_WEB_ENTRY_EVENT_ID);
    // Los dos procesos son distintos de verdad — si no, la aserción de arriba no distingue nada.
    expect(SCR000_OS_WEB_ENTRY_PROCESS_ID).not.toBe(SCR000_WEB_ENTRY_PROCESS_ID);
    expect(SCR000_OS_WEB_ENTRY_EVENT_ID).not.toBe(SCR000_WEB_ENTRY_EVENT_ID);

    const dicCuerpo = objPost?.body ?? {};
    // El campo de la sección nueva, que es el que el proceso 36 lee como `os_strCaseDescription`
    // (Anexo 02 FLD-047, ya consumido por su propia pantalla de gestión en línea 2).
    expect(dicCuerpo['os_strCaseDescription']).toBe(STR_DETALLE_SOLICITUD);
    // Y el renombre alcanza a **todo**, no solo al campo nuevo: datos del consumidor, banderas de la
    // pantalla y los `_desc` de colección (el sufijo tiene que quedar al final, no partir la clave).
    expect(dicCuerpo['os_strIdNumber']).toBe('1020304050');
    expect(dicCuerpo['os_blnCaptcha']).toBe(true);
    expect(dicCuerpo['os_blnSmartSupervisionCase']).toBe(false);
    expect('os_strRequestType_desc' in dicCuerpo).toBe(true);
    expect(Object.keys(dicCuerpo).filter((in_strK) => in_strK.startsWith('qd_'))).toEqual([]);

    // `similar_check_status` es la **excepción**: es el diagnóstico del watcher y no lleva prefijo de
    // proyecto en ninguna de las dos ramas, así que el renombre mecánico tiene que dejarla quieta.
    expect(dicCuerpo[QD.strSimilarCheckStatus]).toBe('OK');
    expect('os_similar_check_status' in dicCuerpo).toBe(false);

    objPost?.objPeticion.flush({ id: INT_REQUEST_CREADO, case_number: INT_CASE_NUMBER });
    await asentar();

    // El segundo PUT viaja con el mismo vocabulario: es el que lleva el código SFC, y si se quedara en
    // `qd_` el caso del proceso 36 terminaría sin radicado visible.
    const objPut = objMock.expectOne(
      (in_objReq) => in_objReq.method === 'PUT'
        && in_objReq.url === `/api/requests/${INT_REQUEST_CREADO}`,
    );
    const dicExtra = (objPut.request.body as { data: Record<string, unknown> }).data;
    expect(dicExtra['os_strSfcCode']).toBe(buildSfcCode(INT_CASE_NUMBER));
    expect(Object.keys(dicExtra).filter((in_strK) => in_strK.startsWith('qd_'))).toEqual([]);
    objPut.flush({});

    await objEnvio;
    await asentar();
    expect(objPantalla['blnEnviado']()).toBe(true);
  });

  /**
   * ⚠ **El chequeo de similitudes de la rama de solicitud es OTRO script.**
   *
   * Son dos scripts distintos porque consultan procesos distintos: el 70 busca duplicados entre las
   * quejas del proceso 31 y el 101 entre las solicitudes del 36. Mandarle el caso al script equivocado
   * no da error — contesta que **no** hay similares, porque busca en el proceso donde el caso no está.
   * O sea que el modo de falla es un falso negativo silencioso, y por eso va aseverado en los dos
   * sentidos (`toBe` del correcto y `not.toBe` del otro).
   *
   * La segunda mitad cierra el círculo del renombre: la **respuesta** también viene con `os_`, así que
   * la pantalla tiene que leerla con `clave()`. Si leyera las claves `qd_` fijas, el conteo sería
   * `undefined → 0` y el modal de duplicados no se abriría nunca en esta rama.
   */
  it('⚠ la rama de solicitud chequea similitudes con el script 101, y lee su respuesta en `os_`', async () => {
    await montarWebEntry();
    await llenarObligatoriosSolicitud();
    await autorizar();
    await verificarCaptcha();

    void objPantalla['enviar']();
    await asentar();

    const objReq = objMock.expectOne(
      (in_objReq) => in_objReq.url.includes('/scripts/') && in_objReq.url.endsWith('/execute'),
    );
    expect(objReq.request.url).toBe(`/api/scripts/${SCR000_OS_SIMILAR_CASES_SCRIPT_ID}/execute`);
    expect(SCR000_OS_SIMILAR_CASES_SCRIPT_ID).not.toBe(SCR000_SIMILAR_CASES_SCRIPT_ID);

    const objCuerpo = objReq.request.body as { data: string; config: string; sync: boolean };
    const dicEntrada = JSON.parse(objCuerpo.data) as Record<string, unknown>;
    // La entrada del script va con el mismo vocabulario que el caso que va a buscar.
    expect(dicEntrada['os_strIdNumber']).toBe('1020304050');
    expect(Object.keys(dicEntrada).filter((in_strK) => in_strK.startsWith('qd_'))).toEqual([]);
    // Y el proceso donde buscar es el 36: con el 31 acá, el script 101 no encontraría nada nunca.
    expect(dicEntrada['process_id']).toBe(SCR000_OS_WEB_ENTRY_PROCESS_ID);

    // La respuesta llega con las claves de **su** proceso.
    objReq.flush({
      response: {
        [QD.strSimilarCheckStatus]: 'DUPLICADOS',
        os_arridSimilarCases: [111],
        os_intCountSimilarCases: 2,
      },
    });
    await asentar();
    objMock.expectOne((in_objReq) => in_objReq.url === '/api/requests/111').flush({ id: 111 });
    await asentar();

    // Que el conteo llegue al modal es la prueba de que la respuesta se leyó con `clave()`.
    expect(objPantalla['objAvisoSimilares']()?.intCantidad).toBe(2);

    objPantalla['cancelarSimilares']();
    await asentar();
    expect(objMock.match(() => true)).toEqual([]);
  });

  /**
   * ⚠ **Imposible en React** — la cadena completa en su orden, que es contrato.
   *
   * Submit → script 70 → **modal** → decisión del usuario → verify → envío. El modal es un aviso y
   * no un bloqueo: el ciudadano tiene derecho a radicar igual.
   */
  it('⚠ con casos similares el envío se detiene en el modal y "Continuar" lo reanuda', async () => {
    await montarWebEntry();
    await llenarObligatorios();
    await autorizar();
    await verificarCaptcha();

    // ⚠ **`enviar()` NO se puede `await`ear acá, y el modo de falla no lo dice.** La promesa no resuelve
    // hasta que el POST del script 70 tenga respuesta, y quien la responde es la línea de abajo — así que
    // un `await` en esta línea se queda esperando un flush que nunca va a llegar y Vitest lo reporta como
    // `Test timed out in 5000ms`, que se lee como "la pantalla se colgó".
    //
    // Va con `void` y sin guardar el handle: la cadena se reanuda por `confirmarSimilares()` más abajo y es
    // **esa** promesa la que se `await`ea al final. Guardar esta en una variable que nadie espera fue un
    // error de lint (`no-unused-vars`) y, peor, sugería que había que esperarla.
    void objPantalla['enviar']();
    await asentar();

    responderSimilares(2, [111, 222]);
    await asentar();

    // El script devuelve solo los ids; el detalle de cada caso se resuelve aparte.
    for (const intId of [111, 222]) {
      objMock
        .expectOne((in_objReq) => in_objReq.url === `/api/requests/${intId}`)
        .flush({ id: intId, status: 'ACTIVE', data: { [QD.strBpmCaseId]: `900${intId}` } });
    }
    await asentar();

    // La cadena está **detenida**: hay modal y no salió ni el verify ni el envío.
    expect(objPantalla['objAvisoSimilares']()?.intCantidad).toBe(2);
    expect(objPantalla['strTextoSimilares']()).toContain('2 casos activos');
    // El número visible es `qd_strBpmCaseId` y **no** el id interno del request: son distintos y el
    // ciudadano/gestor conoce el primero. El `· ACTIVE` sale del `status` del request.
    expect(objPantalla['cllLineasSimilares']()).toEqual([
      'Caso #900111 · ACTIVE',
      'Caso #900222 · ACTIVE',
    ]);
    expect(objMock.match(() => true)).toEqual([]);

    // El usuario decide radicar igual.
    const objConfirma = objPantalla['confirmarSimilares']();
    await asentar();
    expect(objPantalla['objAvisoSimilares']()).toBeNull();

    responderVerify(true);
    await asentar();

    const objPost = postWebEntry();
    // El resultado del chequeo viaja **en** el payload: es la evidencia de que se avisó y se siguió.
    expect(objPost?.body[QD.intCountSimilarCases]).toBe(2);
    expect(objPost?.body[QD.arridSimilarCases]).toEqual([111, 222]);

    objPost?.objPeticion.flush({ id: INT_REQUEST_CREADO, case_number: INT_CASE_NUMBER });
    await asentar();
    objMock.expectOne(
      (in_objReq) => in_objReq.method === 'PUT'
        && in_objReq.url === `/api/requests/${INT_REQUEST_CREADO}`,
    ).flush({});

    await objConfirma;
    await asentar();
    expect(objPantalla['blnEnviado']()).toBe(true);
  });

  it('"No continuar" cierra el modal sin radicar, y cerrar con la X hace lo mismo', async () => {
    await montarWebEntry();
    await llenarObligatorios();
    await autorizar();
    await verificarCaptcha();

    // Mismo motivo que en el caso de arriba: `enviar()` está bloqueado en el POST del script 70 y
    // quien lo responde es `responderSimilares()`, dos líneas abajo. Con similares > 0 `enviar()`
    // retorna en el `return` que espera la decisión del usuario, así que la promesa **sí** resuelve —
    // pero no antes del flush, y por eso el `await` no puede ir en esta línea.
    const objEnvio = objPantalla['enviar']();
    await asentar();
    responderSimilares(1, [111]);
    await asentar();
    objMock.expectOne((in_objReq) => in_objReq.url === '/api/requests/111').flush({ id: 111 });
    await asentar();

    expect(objPantalla['strTextoSimilares']()).toContain('1 caso activo');

    objPantalla['cancelarSimilares']();
    await asentar();

    // Es una negativa, no una confirmación: tratar el cierre como "seguir" radicaría exactamente el
    // caso duplicado que este modal existe para evitar. Nada salió al backend.
    expect(objPantalla['objAvisoSimilares']()).toBeNull();
    expect(objPantalla['blnEnviado']()).toBe(false);
    expect(objMock.match(() => true)).toEqual([]);

    await objEnvio;
  });

  it('el script de similares caído NO bloquea la radicación', async () => {
    const objAviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await montarWebEntry();
    await llenarObligatorios();
    await autorizar();
    await verificarCaptcha();

    const objEnvio = objPantalla['enviar']();
    await asentar();

    // El detector de duplicados se cae con un 500.
    objMock
      .expectOne((in_objReq) => in_objReq.url.includes('/scripts/'))
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    await asentar();

    // Y la radicación **sigue**: un detector caído no puede bloquear el derecho a radicar. Es lo
    // contrario del captcha, que sí es bloqueante (caso de abajo).
    responderVerify(true);
    await asentar();
    const objPost = postWebEntry();
    expect(objPost).not.toBeNull();

    objPost?.objPeticion.flush({ id: INT_REQUEST_CREADO, case_number: INT_CASE_NUMBER });
    await asentar();
    objMock.expectOne(
      (in_objReq) => in_objReq.method === 'PUT'
        && in_objReq.url === `/api/requests/${INT_REQUEST_CREADO}`,
    ).flush({});

    await objEnvio;
    await asentar();
    expect(objPantalla['blnEnviado']()).toBe(true);
    objAviso.mockRestore();
  });

  it('el verify del captcha rechazado SÍ bloquea, y descarta el token', async () => {
    await montarWebEntry();
    await llenarObligatorios();
    await autorizar();
    await verificarCaptcha();

    const objEnvio = objPantalla['enviar']();
    await asentar();
    responderSimilares(0);
    await asentar();

    responderVerify(false);
    await objEnvio;
    await asentar();

    // Nada se radicó, y el token se descartó para exigir una marca nueva: un token que `siteverify`
    // rechaza significa que no hay validación humana, y radicar sin eso convierte el captcha en un
    // checkbox decorativo.
    expect(postWebEntry()).toBeNull();
    expect(objPantalla['blnEnviado']()).toBe(false);
    expect(objPantalla['blnPuedeEnviar']()).toBe(false);
    expect(objPantalla['strErrorEnvio']()).toContain('No pudimos validar la seguridad');
  });

  // ── Las derivaciones del payload ────────────────────────────────────────────────────────────────

  /**
   * Réplica "Sí" **y** cero similares ⇒ el detector automático no atrapó la duplicidad, así que SAC
   * tiene que escalarla a mano. Es la única condición que enciende las dos claves a la vez.
   *
   * ⚠ La segunda aserción es la que vale: `qd_strMarking` **no tiene control** en esta pantalla (la
   * asigna SCR-009 al clasificar), así que un `?:` como el de React haría viajar `undefined` como
   * clave explícita y PM4 la escribiría sobre el `$data`, borrando lo que la otra pantalla gobierna.
   */
  it('réplica sin similares escala a SAC y marca; con similares, ninguna de las dos', async () => {
    await montarWebEntry();
    await llenarObligatorios();
    form().patchValue({ [QD.strReply]: 'SI', [QD.strReplyArgument]: 'Ya radiqué esto en julio.' });
    await autorizar();
    await verificarCaptcha();

    const objEnvio = objPantalla['enviar']();
    await asentar();
    responderSimilares(0);
    await asentar();
    responderVerify(true);
    await asentar();

    const objPost = postWebEntry();
    expect(objPost?.body[QD.strReconsiderationSacEscalation]).toBe(true);
    expect(objPost?.body[QD.strMarking]).toBe('1');

    objPost?.objPeticion.flush({ id: INT_REQUEST_CREADO, case_number: INT_CASE_NUMBER });
    await asentar();
    objMock.expectOne(
      (in_objReq) => in_objReq.method === 'PUT'
        && in_objReq.url === `/api/requests/${INT_REQUEST_CREADO}`,
    ).flush({});
    await objEnvio;
    await asentar();
  });

  it('sin réplica, la marcación NO viaja como clave (ni vacía ni undefined)', async () => {
    await montarWebEntry();
    await llenarObligatorios();
    await autorizar();
    await verificarCaptcha();

    const objEnvio = objPantalla['enviar']();
    await asentar();
    responderSimilares(0);
    await asentar();
    responderVerify(true);
    await asentar();

    const objPost = postWebEntry();
    expect(objPost?.body[QD.strReconsiderationSacEscalation]).toBe(false);
    // `in` y no `=== undefined`: la clave tiene que estar **ausente** del objeto. Con `undefined`
    // presente, `HttpClient` la serializa igual y PM4 la escribe sobre el caso.
    expect(QD.strMarking in (objPost?.body ?? {})).toBe(false);

    objPost?.objPeticion.flush({ id: INT_REQUEST_CREADO, case_number: INT_CASE_NUMBER });
    await asentar();
    objMock.expectOne(
      (in_objReq) => in_objReq.method === 'PUT'
        && in_objReq.url === `/api/requests/${INT_REQUEST_CREADO}`,
    ).flush({});
    await objEnvio;
    await asentar();
  });

  it('el chequeo de similares NO manda la clave `_request`', async () => {
    await montarWebEntry();
    await llenarObligatorios();
    await autorizar();
    await verificarCaptcha();

    void objPantalla['enviar']();
    await asentar();

    const objReq = objMock.expectOne((in_objReq) => in_objReq.url.includes('/scripts/'));
    const objCuerpo = objReq.request.body as { data: string; config: string; sync: boolean };
    const dicEntrada = JSON.parse(objCuerpo.data) as Record<string, unknown>;

    // PM4 trata `_request` como reservada y **sobrescribe el `$data` del script**, borrando las
    // variables de entrada: el script contestaba "Faltan variables obligatorias". Es un contrato con
    // PM4 que no se puede leer del código del script, así que va aseverado.
    expect('_request' in dicEntrada).toBe(false);
    expect(dicEntrada[QD.strIdNumber]).toBe('1020304050');
    expect(dicEntrada['process_id']).toBe(SCR000_WEB_ENTRY_PROCESS_ID);
    // PM4 espera los dos como **strings JSON**, no como objetos, y `sync: true`.
    expect(typeof objCuerpo.data).toBe('string');
    expect(objCuerpo.sync).toBe(true);

    objReq.flush({ response: { [QD.intCountSimilarCases]: 0 } });
    await asentar();
    responderVerify(false); // se corta acá: lo que se venía a aseverar ya está.
    await asentar();
  });

  // ── Precarga ────────────────────────────────────────────────────────────────────────────────────

  /**
   * ⚠ **Imposible en React** — es literalmente el motivo que su spec da para no poder armar el
   * fixture: *"el Municipio se limpia deliberadamente cada vez que cambia el Departamento
   * (RUL-000-09) — incluida la precarga inicial desde task.data"*.
   *
   * Acá se asevera como la regla que es, no como un obstáculo: el municipio precargado **tiene** que
   * quedar vacío, porque un municipio de otro departamento es un dato inválido que la SFC rechaza.
   */
  it('⚠ RUL-000-09 · la precarga de Depto+Municipio deja el Municipio vacío', async () => {
    await montarComoTarea({ [QD.strDepartment]: '11', [QD.strCity]: '11001' });

    expect(leer(QD.strDepartment)).toBe('11');
    expect(leer(QD.strCity)).toBe('');
  });

  /**
   * ⚠ El `_desc` del producto tiene que llegar al **espejo reactivo**, no solo al control.
   *
   * Son los dos defectos que dejaban "Producto: —" en el resumen MSG-000-08 y el producto ilegible en
   * SCR-0051, y ninguno se veía desde los specs que ya había:
   *
   * 1. `qd_strSfcProduct_desc` **no estaba declarado** en el `FormGroup` de la pantalla, y a diferencia
   *    del resto de los `_desc` a este **nadie lo crea**: `sincronizarDesc()` (que hace el `addControl`)
   *    está deliberadamente fuera del producto, porque la colección 16 repite códigos. El único que lo
   *    escribe es `syncProductDesc()`, y arranca con un `if (!objControl) return`.
   * 2. Ese `setValue` va con `emitEvent: false`, así que aunque el control exista **no** dispara el
   *    `valueChanges` que alimenta `sigValores` — y `cllResumen` lee de `sigValores`, no del form.
   *
   * `seccion-detalle-queja.spec.ts` no podía verlo: su `crearForm()` declara el `_desc` a mano y lee el
   * control con `getRawValue()`, o sea que puentea las dos mitades. Por eso este caso va acá, sobre el
   * `FormGroup` **real** de la pantalla y contra `cllResumen()`, que es lo que ve el ciudadano.
   *
   * Y el producto se elige **por el picker**, no con un `patchValue`: escribir `strSfcProduct` directo
   * (lo que hace `dicObligatorios()`) nunca pasa por `syncProductDesc()`, que es el código bajo prueba.
   */
  it('⚠ el `_desc` del producto llega al resumen MSG-000-08 y al payload', async () => {
    await montarWebEntry();

    // S3 solo existe en la rama de queja, así que hay que elegir el tipo antes de poder alcanzar la
    // sección: sin esto `seccionDetalle()` desreferencia un `null`. El `drenarColecciones()` contesta
    // los `matriz:*` que la sección pide al montar; sin él, el `expectOne` de la colección 16 de más
    // abajo encontraría dos peticiones y fallaría por ambigüedad, no por el mecanismo bajo prueba.
    form().patchValue({ [QD.strRequestType]: '3' });
    await asentar();
    drenarColecciones();
    await asentar();

    // El catálogo del producto lo pide la cascada (`matriz:sfcProduct`, colección 16). `drenarColecciones()`
    // ya lo respondió con `[]` al montar, así que hay que recargarlo con opciones de verdad: sin ellas
    // `toUiOptions()` no tiene de dónde sacar la etiqueta y el caso pasaría vacuamente.
    const objCatalogo = seccionDetalle()['objMatriz']['objProducto'];
    void objCatalogo.cargar(QD_COLLECTIONS.sfcProduct);
    await asentar();
    objMock
      .expectOne((in_objReq) => in_objReq.url.includes('/collections/16/records'))
      .flush({
        data: [
          { data: { codigo_producto_sfc: '104', nombre_producto_sfc: 'Garantía extendida' } },
          { data: { codigo_producto_sfc: '104', nombre_producto_sfc: 'Copropiedades' } },
        ],
      });
    await asentar();

    // El value de UI del **segundo** de los dos que comparten el 104: es el que distingue este mecanismo
    // de un `sincronizarDesc()` normal, que resolvería por código y elegiría el primero.
    seccionDetalle()['objProductoUi'].setValue('104::Copropiedades');
    await asentar();

    // El código puro es lo que viaja como dato del caso, y eso ya funcionaba.
    expect(leer(QD.strSfcProduct)).toBe('104');
    // La etiqueta tiene que estar en el control **y** en el espejo reactivo del que lee el resumen.
    expect(leer(`${QD.strSfcProduct}_desc`)).toBe('Copropiedades');
    expect(objPantalla['sigValores']()[`${QD.strSfcProduct}_desc`]).toBe('Copropiedades');

    // Lo que ve el ciudadano en MSG-000-08. Un `'—'` acá es el bug reportado.
    const objFila = objPantalla['cllResumen']().find((in_objF) => in_objF.label === 'Producto');
    expect(objFila?.value).toBe('Copropiedades');
  });

  it('la precarga no convierte los booleanos en el string "false"', async () => {
    await montarComoTarea({ [QD.strIdNumber]: 9999 });

    // `String(false)` sería el literal `'false'`, que es *truthy*: tildaría el checkbox de
    // autorización solo y abriría el gate de envío sin que nadie lo haya aceptado.
    expect(leer(QD.blnDataAuth)).toBe(false);
    expect(objPantalla['blnAutorizo']()).toBe(false);
    // Y los no booleanos sí se normalizan a string, que es lo que PM4 espera.
    expect(leer(QD.strIdNumber)).toBe('9999');
  });

  it('los defaults de SCR000_DEFAULTS llegan a los controles que existen', async () => {
    await montarComoTarea();

    // Dos campos de back sin widget que tienen que viajar desde la radicación (Excel #54 y col. 42).
    expect(leer(QD.strDigitalProduct)).toBe('2');
    expect(leer(QD.strComplaintStatus)).toBe('2');
    // Y el dato del caso gana sobre el default cuando viene: es el orden del contrato.
    expect(leer(QD.strReply)).toBe('NO');
  });

  // ── Limpiar ─────────────────────────────────────────────────────────────────────────────────────

  it('"Limpiar queja" vacía el texto, baja el intento de envío y re-precarga los defaults', async () => {
    await montarWebEntry();
    await llenarObligatorios();
    await autorizar();
    await verificarCaptcha();

    // Deja `blnIntentoEnvio` en true y se corta en el verify, que responde `success: false`. El handle
    // no se puede `await`ear en esta línea: `enviar()` está bloqueado en el POST del script 70 que
    // responde `responderSimilares()` dos líneas abajo. Ver el docstring de `asentar()`.
    const objEnvio = objPantalla['enviar']();
    await asentar();
    responderSimilares(0);
    await asentar();
    responderVerify(false);
    await asentar();
    await objEnvio;
    expect(objPantalla['blnIntentoEnvio']()).toBe(true);

    objPantalla['limpiarFormulario']();
    await asentar();
    drenarColecciones();
    await asentar();

    expect(leer(QD.strComplaintText)).toBe('');
    expect(objPantalla['blnIntentoEnvio']()).toBe(false);
    expect(objPantalla['strErrorEnvio']()).toBe('');
    // El `reset()` deja todo en `null`, así que sin el `precargar()` de después los defaults de back
    // se perderían y el próximo envío viajaría sin ellos.
    expect(leer(QD.strDigitalProduct)).toBe('2');
  });

  // ── Estados de carga y error ────────────────────────────────────────────────────────────────────

  it('la carga pinta el spinner DENTRO del chrome público, no suelto', async () => {
    fijarQueryString(`?task_id=${INT_TASK_ID}`);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
        { provide: ErrorHandler, useValue: objErrores },
      ],
    });
    objFixture = TestBed.createComponent(CrearRecibirQueja);
    objPantalla = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);
    objFixture.detectChanges();

    // Es una página pública: un ciudadano con la red lenta tiene que ver la marca y el titular de
    // Zurich, no un spinner huérfano sobre fondo blanco. En una pantalla embebida no importaría
    // (el chrome de PM4 rodea el iframe); acá no hay nada alrededor.
    const objPagina = objFixture.debugElement.query(By.css('app-pqr-page'));
    expect(objPagina).not.toBeNull();
    expect(objPagina.query(By.css('.screen-loading'))).not.toBeNull();

    objMock.expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`).flush(tarea({}));
    await asentar();
    drenarColecciones();
    await asentar();

    expect(objFixture.debugElement.query(By.css('.screen-loading'))).toBeNull();
  });

  it('el error de carga se pinta como alerta inline, también dentro del chrome', async () => {
    fijarQueryString(`?task_id=${INT_TASK_ID}`);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
        { provide: ErrorHandler, useValue: objErrores },
      ],
    });
    objFixture = TestBed.createComponent(CrearRecibirQueja);
    objPantalla = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);
    objFixture.detectChanges();

    objMock
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush({ message: 'Tarea no encontrada' }, { status: 404, statusText: 'Not Found' });
    await asentar();

    expect(objFixture.nativeElement.textContent).toMatch(/Error al cargar el formulario/);
    // Y el formulario **no** se pinta: sin datos del caso, mostrarlo vacío invitaría a radicar sobre
    // una tarea que no se pudo leer.
    expect(objFixture.debugElement.query(By.css('form.pqr-form'))).toBeNull();
  });
});
