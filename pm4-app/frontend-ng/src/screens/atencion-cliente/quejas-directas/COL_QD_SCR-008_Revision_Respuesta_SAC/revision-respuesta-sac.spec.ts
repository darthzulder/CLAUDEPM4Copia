import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CampoBase } from '../../../../components/fields/campo-base';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { QD } from '../fields/fields';
import { RevisionRespuestaSac } from './revision-respuesta-sac';

/**
 * SCR-008 · Revisión Respuesta SAC — **un caso por RUL/ACT del anexo**, no un smoke.
 *
 * Paridad 1:1 con los 9 casos de `frontend/src/.../RevisionRespuestaSac.test.tsx`, con dos cambios
 * de método que hacen las aserciones más fuertes, no solo distintas:
 *
 * ── 1. Se asevera sobre el PUT que sale, no sobre un espía ───────────────────────────────────────
 * React mockeaba el módulo `core/useTask` y aseveraba `expect(completeTask).toHaveBeenCalledWith(...)`.
 * Acá se monta `TaskService` **de verdad** y se intercepta la red con `HttpTestingController`, así que
 * lo que se asevera es la **petición HTTP real**: método, URL y cuerpo. La diferencia importa porque
 * el contrato de `qd_blnSACApproved` es un contrato con PM4, no con una función nuestra — un mock
 * podría recibir la llamada correcta y el servicio igual mandar otra cosa en el `data`.
 *
 * Y `objMock.verify()` en cada `afterEach` es una guarda que React no tenía: si la pantalla dispara
 * una petición que ningún caso esperaba, el caso falla en vez de pasar inadvertida.
 *
 * ⚠ **Consecuencia de montar los servicios reales:** `vi.mock()` está prohibido sobre imports
 * relativos bajo Angular 21, así que no habría forma de mockear `RequestFilesService` ni
 * `CollectionService` aunque se quisiera. No hace falta: los dos hablan por `HttpClient`, así que la
 * misma intercepción los cubre y sus peticiones se drenan en [`drenarPeticiones()`](#drenarPeticiones).
 *
 * ── 2. Se asevera sobre el FormControl y los computeds, no sobre el shadow DOM ────────────────────
 * React leía `document.querySelector('z-text-input#field-...').model`. Bajo jsdom los custom elements
 * de Lit **no hacen upgrade**, así que esa propiedad existe por el binding de React y no por el
 * componente; en Angular el equivalente honesto es el estado del `FormControl` (que es lo que viaja a
 * PM4) y el `computed` que gobierna la regla. Es exactamente la trampa 2 de
 * `docs/guides/testing-conventions.md`: no se asevera el pintado del DS, se asevera el contrato.
 *
 * El único caso que **sí** mira el DOM es el del banner de SLA, porque ahí lo que se porta es una
 * rama `@if` del template propio (un `za-alert`), no un input de un componente del DS.
 *
 * ── ⚠ 2b. Y por qué los DOS últimos casos son una excepción DELIBERADA a lo que dice el punto 2 ────
 * El razonamiento de arriba es correcto **y fue el que dejó pasar el defecto más grave de esta
 * pantalla**. "Manejar el form directo" es honesto para probar una regla de negocio, pero convierte al
 * `FormGroup` en el único sujeto del archivo, y entonces nadie asevera el **puente** entre el form y
 * los campos. Esta pantalla nació sin `formControlName` en ninguno de sus 9 `zds-*`: los 9 estaban
 * muertos en el navegador —React pintaba 8 de 9 con datos reales, Angular los 9 vacíos— y los 10 casos
 * de acá estaban **verdes**, porque los 10 empujaban el `FormGroup` a mano y ninguno preguntaba si el
 * valor había llegado al componente. Un `patchValue()` sobre controles que nadie escucha se ve
 * idéntico a uno que funciona, si solo se lee el control.
 *
 * Así que el punto 2 se mantiene con un límite explícito: **no se asevera el pintado del DS (sigue
 * siendo imposible), pero sí que el valor SALGA del `FormGroup` y LLEGUE al componente del DS.** Ese es
 * el extremo lejano del puente y el punto más profundo que jsdom permite: `lib-*-z` y `za-*` son
 * componentes de Angular y montan de verdad; lo que no ocurre es el upgrade de Lit, así que el
 * `<input>`/`<textarea>` real vive en un shadow root que nunca se crea.
 *
 * Y el valor **no es aseverable por DOM**, esto se midió y no se supuso: los dos `lib-*-z` reenvían con
 * `[(ngModel)]="model"`, o sea una **propiedad** vía `NgModel`, no un atributo. No hay nada que leer con
 * `getAttribute` sobre el `z-text-input`/`z-textarea` (a diferencia del `max-length` de
 * `zds-textarea.spec.ts`, que sí es atributo y por eso allá el final de la cadena se asevera por DOM).
 * Queda la propiedad `model` del componente hijo, que es lo que leen los dos casos vía `objHijoDs()`.
 */

/**
 * `Pm4ContextService` cae a `PM4_ENV_FALLBACKS`, cuyo default lee `src/env.generated.ts` (generado
 * desde `pm4-app/.env`). Acá sale vacío, pero **en la máquina de un dev con `VITE_TASK_ID` cargado la
 * pantalla pediría otra tarea** y estos casos se pondrían rojos por estado local ajeno al código.
 * Proveerlo vacío los deja dependiendo solo de la query string que fija cada caso.
 */
const OBJ_ENV_VACIO = { token: '', taskId: '', caseId: '' } as const;

const INT_TASK_ID = 1;
const INT_REQUEST_ID = 10;

/**
 * Tope de vueltas de [`drenarPeticiones()`](#drenarPeticiones). Hoy convergen en 2 (colección 46, y
 * después las dos de `RequestFileList` cuando aparece el `process_request_id`); el margen es para que
 * una petición encadenada nueva no rompa el archivo, y el tope para que un bucle salga como fallo
 * nombrado en vez de colgar la suite.
 */
const INT_MAX_VUELTAS_DRENADO = 6;

/**
 * Fixture **fresco por caso** (función, no constante).
 *
 * Es la misma lección que dejó anotada el spec de React: antes se mutaba un objeto compartido y se
 * restauraba al final del cuerpo del test, así que **si una aserción fallaba en el medio el restore no
 * corría** y el resto del archivo quedaba con datos corruptos — un fallo real disfrazado de varios.
 */
const datosTarea = (): Record<string, unknown> => ({
  [QD.strSfcCode]: '13950001',
  [QD.strSlaAssigned]: '10',
  [QD.strRevisionVersion]: 'v1',
  [QD.strResponsableRole]: 'Siniestros Autos',
  [QD.strDraftDate]: '01/08/2026 10:00',
  [QD.strComplaintText]: 'Texto original de la queja',
  [QD.strClientResponse]: '',
  [QD.strActionsTaken]: '',
  [QD.strCompensation]: '',
  [QD.strSacRemarks]: '',
});

const tarea = (in_dicDatos: Record<string, unknown>) => ({
  id: INT_TASK_ID,
  status: 'ACTIVE',
  process_request_id: INT_REQUEST_ID,
  created_at: '2026-08-01T10:00:00.000Z',
  data: in_dicDatos,
});

let objFixture: ComponentFixture<RevisionRespuestaSac>;
let objPantalla: RevisionRespuestaSac;
let objMock: HttpTestingController;

/** Igual que en `task.service.spec.ts`: jsdom navega dentro del mismo origen sin recargar. */
function fijarQueryString(in_strQuery: string): void {
  window.history.replaceState({}, '', `/${in_strQuery}`);
}

/**
 * Deja que las promesas pendientes resuelvan **y** repinta la vista.
 *
 * ⚠ **`await whenStable()` por sí solo no repinta bajo `provideZonelessChangeDetection()`**, y ese
 * detalle costó una vuelta entera de diagnóstico: con solo `whenStable()` el template se quedaba en la
 * rama `@if (blnCargando())` para siempre, así que `nativeElement.textContent` era `' \n'` y las
 * aserciones de DOM fallaban con "expected ' \n' to contain 'Revisión Respuesta SAC'" — que se lee
 * como "la pantalla no pintó el título" cuando lo que pasó es que nadie la volvió a pintar.
 *
 * Y el efecto no era solo cosmético: sin repintar, el `[requestId]` de los dos `RequestFileList` nunca
 * se re-evaluaba, así que sus GET no salían durante el drenado y reaparecían después, matando los 10
 * casos en el `objMock.verify()` del `afterEach`.
 *
 * El orden es `whenStable` → `detectChanges` y no al revés: primero se deja resolver el `await` que
 * tiene pendiente la pantalla (que es lo que cambia el estado) y después se pinta ese estado nuevo.
 *
 * Es la misma convención que ya usa todo el resto de la suite —los specs de la fachada propagan
 * `[model]` con un `detectChanges()` explícito—, acá envuelta en un nombre porque se necesita en cada
 * caso después de cada acción, y repetir las dos líneas invita a olvidarse de la segunda.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

/**
 * Drena las peticiones **secundarias** que la pantalla dispara al montar y que ningún caso de este
 * archivo asevera: la colección 46 (plantillas de correo de la vista previa) y las dos instancias de
 * `RequestFileList` (adjuntos del radicador + soportes internos).
 *
 * Se responden con listas vacías, que es el escenario del spec de React (ahí se mockeaban
 * `useCollection` y `useRequestFiles` devolviendo vacío). Se drenan en vez de ignorarse porque
 * `objMock.verify()` falla con peticiones pendientes — y esa severidad es deseable: si mañana la
 * pantalla empieza a pedir algo más, un caso se pone rojo y hay que venir a decidir qué es.
 *
 * ⚠ **Solo drena `GET`.** El `PUT` de completado es lo que asevera `dicPayloadEnviado()`, así que
 * drenarlo acá lo dejaría consumido y ese helper devolvería `null` — es decir, el caso de "NO completa
 * la tarea" pasaría **igual que si la pantalla sí la hubiera completado**. Hoy el orden hace que esto
 * corra antes de cualquier acción, pero el filtro es lo que lo hace seguro independientemente del
 * orden, y por eso está puesto y no confiado a la secuencia.
 */
async function drenarPeticiones(): Promise<void> {
  // ⚠ Se drena **por vueltas hasta que no queda nada**, no de una sola pasada, porque las tres no
  // están encoladas al mismo tiempo: la colección 46 se pide recién cuando el `await cargar()` de
  // `ngOnInit` resuelve, y las dos de `RequestFileList` recién cuando `objTarea()` deja de ser `null`
  // y el `[requestId]` del hijo se re-evalúa. Con una sola pasada quedaban 3 peticiones abiertas y
  // los 10 casos morían en el `objMock.verify()` del `afterEach` — con las aserciones ya en verde,
  // que es el modo de falla que más confunde.
  //
  // La condición de corte es "no hay nada pendiente", no un número de vueltas: si mañana la pantalla
  // agrega una petición encadenada, esto sigue funcionando sin tocarlo.
  for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DRENADO; intVuelta++) {
    await asentar();

    const cllPendientes = objMock.match((in_objReq) => in_objReq.method === 'GET');
    if (cllPendientes.length === 0) return;

    // La forma de `{data: []}` cubre a los tres consumidores: los tres leen `data` del cuerpo.
    for (const objPeticion of cllPendientes) {
      if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
    }
  }

  // Si se agotan las vueltas hay una cadena de peticiones que no converge (o un bucle), y eso tiene
  // que salir como fallo del test y no como un `verify()` misterioso al final.
  throw new Error(
    `El drenado no convergió en ${INT_MAX_VUELTAS_DRENADO} vueltas: ` +
      objMock
        .match(() => true)
        .map((in_objPet) => `${in_objPet.request.method} ${in_objPet.request.urlWithParams}`)
        .join(', '),
  );
}

/**
 * Monta la pantalla con la tarea ya cargada y el `ngOnInit` completo.
 *
 * ⚠ El orden es el contrato y por eso está acá y no repartido en cada caso, en tres partes:
 *
 * 1. `fijarQueryString` va **antes** de `createComponent` porque `ngOnInit` llama `cargar()`, que lee
 *    el `task_id` de la URL al empezar.
 * 2. `detectChanges()` va **entre** `createComponent` y el `expectOne`, y no es cosmético: bajo
 *    `provideZonelessChangeDetection()` **`createComponent()` por sí solo NO corre `ngOnInit`**, así
 *    que sin esta línea la cola de peticiones está genuinamente vacía y los 10 casos fallan con
 *    `Expected one matching request, found none` — un fallo que se lee como "la pantalla no pide la
 *    tarea" cuando en realidad es el test el que nunca la dejó arrancar. Medido: antes de
 *    `detectChanges()` la cola es `[]`; después, `['GET /api/tasks/1?include=data']`.
 *    (Por eso `task.service.spec.ts` no se topa con esto: allá se llama `objSvc.cargar()` directo.)
 * 3. El `flush` del GET va **antes** del `await`, porque `precargar()` corre recién cuando ese
 *    `await cargar()` resuelve — sin la respuesta puesta primero, el `patchValue` nunca ocurre y todos
 *    los casos de precarga fallarían por una causa del test.
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

  objFixture = TestBed.createComponent(RevisionRespuestaSac);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);

  // Dispara `ngOnInit` → `cargar()`. Ver el punto 2 del comentario de arriba: sin esto no sale
  // ninguna petición y el `expectOne` de abajo falla por culpa del test, no de la pantalla.
  objFixture.detectChanges();

  objMock.expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`).flush(
    tarea(in_dicDatos),
  );

  await drenarPeticiones();
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
 * Los campos `zds-*` del template, en el orden en que aparecen y **sin repetidos**.
 *
 * ⚠ El `Set` no es defensivo, es necesario, y esto se midió: `queryAll` devuelve **18 nodos para 9
 * campos**. `DebugElement.componentInstance` no es "el componente que este nodo ES", es "el componente
 * **dueño** de este nodo", así que el `<div class="zds-field-wrap">` de adentro de cada wrapper también
 * reporta el wrapper. Sin deduplicar, cada campo aparece dos veces (`ZDS-INPUT` + `DIV`) y la aserción
 * de conteo de abajo falla por una causa del test.
 */
function cllCamposDs(): CampoBase<string>[] {
  const cllInstancias = objFixture.debugElement
    .queryAll((in_objNodo) => in_objNodo.componentInstance instanceof CampoBase)
    .map((in_objNodo) => in_objNodo.componentInstance as CampoBase<string>);

  return [...new Set(cllInstancias)];
}

/**
 * El componente del DS que el wrapper de la fachada renderiza adentro (`lib-input-text-z` o
 * `lib-textarea-z`), tipado como `any` a propósito.
 *
 * ⚠ **No se importa la clase del DS, y eso no es comodidad: sería un error de lint.** El
 * `no-restricted-imports` de `eslint.config.mjs` prohíbe `@zurich-col/lib-zurich` en todo el
 * workspace salvo `src/components/fields/**` y `src/zds-setup.ts` —la regla 2 de CLAUDE.md hecha
 * ejecutable—, y un spec de pantalla no está en esa lista. Por eso `zds-textarea.spec.ts` **sí** puede
 * buscar su hijo con `instanceof TextareaZ` (vive en la fachada) y acá hay que hacerlo por posición.
 * Ensanchar la excepción para que un test importe cómodo sería cambiar el guardrail por el test.
 *
 * El descubrimiento va por el **árbol de `DebugElement`**, no por `viewChild` ni por tag: el hijo es el
 * primer nodo debajo del wrapper cuyo `componentInstance` **no es** el wrapper. Con eso alcanza porque
 * la plantilla de los dos wrappers es un `<div class="zds-field-wrap">` con **un solo** componente
 * adentro (ver `zds-input.ts` / `zds-textarea.ts`).
 *
 * ⚠ El `!== in_objCampo` es lo que hace el trabajo, y no es una guarda trivial:
 * `DebugElement.componentInstance` devuelve el componente **dueño** del nodo, no el que el nodo es, así
 * que el `<div class="zds-field-wrap">` del propio wrapper también responde con el wrapper. Medido: un
 * `queryAll` de `instanceof CampoBase` sobre esta pantalla da **18 nodos para 9 campos** por ese motivo.
 *
 * El `any` está sancionado para specs y **no lleva `eslint-disable`**: el bloque
 * `files: ['src/**\/*.spec.ts']` de la config ya apaga `no-explicit-any` para todo este archivo, así
 * que un directivo acá sale como `Unused eslint-disable directive` y con `--max-warnings=0` **rompe el
 * lint**. Y no se pierde nada tipándolo así — lo único que se lee es `model` (la propiedad que el
 * wrapper le escribe por `[model]`) y `modelChange` (el `EventEmitter` de vuelta), que son contrato
 * del DS, no de la fachada.
 */
function objHijoDs(in_objCampo: CampoBase<string>): any {
  const objWrapper = objFixture.debugElement.query(
    (in_objNodo) => in_objNodo.componentInstance === in_objCampo,
  );

  const objHijo = objWrapper
    .queryAll((in_objNodo) => !!in_objNodo.componentInstance)
    .find((in_objNodo) => in_objNodo.componentInstance !== in_objCampo);

  // Sin esto un cambio de plantilla que sacara el `lib-*-z` haría que las aserciones de abajo
  // fallaran con `Cannot read properties of undefined`, que se lee como error del test y no como el
  // defecto que es.
  expect(objHijo, `el wrapper de ${in_objCampo.name()} no renderizó ningún componente del DS`).toBeDefined();

  return objHijo!.componentInstance;
}

beforeEach(() => {
  TestBed.resetTestingModule();
  fijarQueryString('');

  // ⚠ `scrollIntoView` no existe en jsdom, y `devolver()` sin observaciones llama
  // `scrollToFirstError()`. Sin este stub el `TypeError` sale como **error no manejado** en vez de
  // como fallo del caso —Vitest reporta `Tests 10 passed` + `Errors 1`, un verde con una excepción
  // suelta al lado— porque la implementación difiere el scroll en un `setTimeout(0)`, así que la
  // excepción escapa después de que el `it()` terminó. Es la misma trampa 1 que ya documenta
  // `core/scroll-to-first-error.spec.ts`, y se neutraliza igual: stub en el prototipo.
  //
  // Se stubea sin aseverar sobre él a propósito: **qué** hace el scroll ya está cubierto en el spec
  // propio de esa función. Acá lo único que importa es que no ensucie el resultado de la pantalla.
  //
  // El cuerpo vacío ES el stub —hacer nada es todo lo que se le pide—, así que
  // `no-empty-function` se desactiva acá y no en la config: en cualquier otro lugar del
  // workspace una función vacía sí es sospechosa de código a medio escribir.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Element.prototype.scrollIntoView = (() => {}) as Element['scrollIntoView'];
});

afterEach(() => {
  objMock.verify();
  fijarQueryString('');
});

describe('RevisionRespuestaSac (SCR-008)', () => {
  it('renderiza la pantalla y precarga el contexto del caso', async () => {
    await montar();

    // El título prueba que se pintó la rama principal del template y no la de carga ni la de error
    // (las tres son exclusivas: sin esto, un `strError` inesperado pasaría por un render válido).
    expect(objFixture.nativeElement.textContent).toContain('Revisión Respuesta SAC');
    expect(objPantalla.form.get(QD.strSfcCode)?.value).toBe('13950001');
    expect(objPantalla.form.get(QD.strResponsableRole)?.value).toBe('Siniestros Autos');
  });

  it('sin qd_strSfcCode cae al número de caso BPM (respaldo antes de radicar ante la SFC)', async () => {
    // Cadena de respaldo 1 de `precargar()`: la SFC asigna el código al radicar, que en SP2 todavía
    // no pasó, así que el SAC vería el campo vacío y no sabría qué caso tiene enfrente.
    await montar({ ...datosTarea(), [QD.strSfcCode]: '', [QD.strBpmCaseId]: '999' });

    expect(objPantalla.form.get(QD.strSfcCode)?.value).toBe('999');
  });

  it('sin fecha de borrador ni versión cae al created_at de la tarea y a v1', async () => {
    // Cadenas de respaldo 2 y 3, que el spec de React no cubría. Van juntas porque comparten el
    // escenario (un caso ya en curso, anterior a que SCR-0051 sellara estos dos datos).
    const dicDatos = { ...datosTarea() };
    delete dicDatos[QD.strDraftDate];
    delete dicDatos[QD.strRevisionVersion];

    await montar(dicDatos);

    expect(objPantalla.form.get(QD.strRevisionVersion)?.value).toBe('v1');
    // No se asevera la cadena exacta —el formato lo fija `selloFechaHoraDesdeIso` y tiene su propio
    // spec— sino que **hubo respaldo**: el campo dejó de estar vacío. Aseverar el formato acá
    // duplicaría ese contrato y ataría este caso a un cambio de presentación ajeno a la regla.
    expect(objPantalla.form.get(QD.strDraftDate)?.value).toBeTruthy();
  });

  it('RUL-008-02 · SLA crítico (≤3 días) muestra el banner de prioridad', async () => {
    await montar({ ...datosTarea(), [QD.strSlaAssigned]: '2' });

    expect(objPantalla.blnSlaCritico()).toBe(true);
    // El único caso que mira el DOM, y a propósito: lo que se porta es la rama `@if` del template
    // propio, no un input de un componente del DS. Si el `@if` se borrara, el computed seguiría en
    // `true` y el SAC no vería nada.
    expect(objFixture.nativeElement.textContent).toContain('Priorice la');
  });

  it('RUL-008-02 · con SLA holgado NO muestra el banner de prioridad', async () => {
    // Contraparte obligatoria del anterior: sin esto, el caso de arriba no distingue "el banner
    // aparece por el SLA" de "el banner aparece siempre". Fixture: qd_strSlaAssigned = '10'.
    await montar();

    expect(objPantalla.blnSlaCritico()).toBe(false);
    expect(objFixture.nativeElement.textContent).not.toContain('Priorice la');
  });

  it('RUL-008-01 · "Devolver" arranca bloqueado porque faltan observaciones', async () => {
    await montar();

    expect(objPantalla.blnPuedeDevolver()).toBe(false);
  });

  it('ACT-008-01 · "Aprobar" completa con APROBAR y qd_blnSACApproved=true', async () => {
    await montar();

    objPantalla.aprobar();
    await asentar();

    expect(dicPayloadEnviado()).toMatchObject({
      [QD.strAction]: 'APROBAR',
      [QD.blnSacApproved]: true,
    });
  });

  it('⚠ ACT-008-03 · "Reasignar" PRESERVA el qd_blnSACApproved que ya venía', async () => {
    // El fixture entra con `true` **a propósito**: el default del form es `''`, así que aseverar un
    // valor falsy acá no probaría nada — pasaría igual si REASIGNAR sobrescribiera el campo con
    // `false`. Con `true`, si alguien agrega la rama que el nombre del caso prohíbe, esto se pone
    // rojo. Reasignar no es una decisión sobre la respuesta: marcarla `false` daría el borrador por
    // rechazado por el solo hecho de haber cambiado de responsable.
    await montar({ ...datosTarea(), [QD.blnSacApproved]: true });

    objPantalla.reasignar();
    await asentar();

    expect(dicPayloadEnviado()).toMatchObject({
      [QD.strAction]: 'REASIGNAR',
      [QD.blnSacApproved]: true,
    });
  });

  it('RUL-008-01 · "Devolver" sin observaciones marca el error y NO completa la tarea', async () => {
    await montar();

    objPantalla.devolver();
    await asentar();

    // Las dos mitades de la regla. El `null` es la que importa: la guarda vive en el handler y no en
    // el `[disabled]` del botón, porque un control del DS deshabilitado igual dispara su handler
    // (trampa 1 de testing-conventions.md) — que es justamente por qué este caso invoca el método
    // directo en vez de simular un click, replicando la vía por la que el defecto entraría.
    expect(dicPayloadEnviado()).toBeNull();
    expect(objPantalla.form.get(QD.strSacRemarks)?.errors).toEqual({ required: true });
    // Y el `touched`, sin el cual el wrapper deja el campo inválido pero pintado como si nada: su
    // estado de error es `invalid && touched`.
    expect(objPantalla.form.get(QD.strSacRemarks)?.touched).toBe(true);
    expect(objPantalla.strErrorObservaciones()).toBe('Campo requerido');
  });

  it('ACT-008-02 · con observaciones, "Devolver" completa con DEVOLVER y qd_blnSACApproved=false', async () => {
    // La única rama que escribe `false`.
    await montar({
      ...datosTarea(),
      [QD.strSacRemarks]: 'Falta detallar el análisis de la póliza.',
    });

    // El computed tiene que haber visto la precarga: es el puente `valueChanges` → `sigValores`, y si
    // se rompiera, el botón quedaría deshabilitado para siempre y el `devolver()` de abajo cortaría
    // por la guarda en vez de enviar — con lo que este caso fallaría por el motivo correcto.
    expect(objPantalla.blnPuedeDevolver()).toBe(true);

    objPantalla.devolver();
    await asentar();

    expect(dicPayloadEnviado()).toMatchObject({
      [QD.strAction]: 'DEVOLVER',
      [QD.blnSacApproved]: false,
    });
  });

  /**
   * ⚠ La guarda que faltaba, y el defecto que la obligó a existir.
   *
   * Los 10 casos de arriba se quedaron **verdes** mientras los 9 campos `zds-*` de esta pantalla
   * estaban **muertos en el navegador**: el template tenía `[formGroup]` y `name="qd_*"` en todos,
   * pero **ninguno tenía `formControlName`**. Sin `formControlName` no hay `NgControl`, y `CampoBase`
   * lo inyecta **opcional** (`get(NgControl, null, {optional: true, self: true})`), así que en vez de
   * fallar cae a `grupoPropio()` —un `FormGroup` fabricado— y las dos direcciones del CVA se cortan:
   * `writeValue()` nunca corre (el `patchValue()` de la precarga escribía controles que nadie
   * escuchaba) y el `(modelChange)` de vuelta muere en el no-op de `fnAlCambiar`.
   *
   * Medido lado a lado con la task 171840: React pintaba 8 de 9 campos con datos reales, Angular los
   * 9 vacíos. Y ningún caso lo veía porque **todos manejan el form directo** (`form.get(...)`,
   * `patchValue`, y los computeds que derivan de él): aseveran el arranque de la cadena, no el final.
   * Es la misma familia de defecto que el `max-length` de `zds-textarea` (el par bool+num estaba
   * perfecto sobre la instancia del hijo y el valor moría un nivel más abajo).
   *
   * Por eso este caso asevera **el `model` del componente hijo del DS**, que es el otro extremo del
   * puente. Es lo más profundo que jsdom permite: `lib-*-z` y `za-*` son componentes de Angular y sí
   * montan, pero el `z-*` de Lit no hace upgrade, así que el `<input>`/`<textarea>` real vive en un
   * shadow root que nunca se crea. El límite queda declarado: lo que se prueba acá es que el valor
   * **salió del `FormGroup` y llegó al componente**; que el DS lo pinte se verificó en el navegador.
   */
  it('⚠ la precarga llega a los campos RENDERIZADOS, no solo al FormGroup (formControlName)', async () => {
    await montar({
      ...datosTarea(),
      [QD.strSfcCode]: '130',
      [QD.strSlaAssigned]: '2',
      [QD.strResponsableRole]: 'Grupo_Asistencias_1',
      [QD.strDraftDate]: '2026-07-26 09:19',
      [QD.strComplaintText]: 'No me entregaron el vehículo de reemplazo.',
      [QD.strClientResponse]: 'Testeando',
      [QD.strActionsTaken]: 'Mis acciones',
      [QD.strCompensation]: 'SI',
    });

    // Los 8 que la task 171840 trae con dato. `qd_strSacRemarks` queda afuera a propósito: es el
    // campo que el analista SAC escribe, así que en PM4 llega vacío y aseverar `''` sobre él no
    // distinguiría "llegó el vacío" de "no llegó nada" — exactamente la tautología que dejó pasar
    // este defecto. Su dirección de vuelta ya la cubre el caso de RUL-008-01.
    const dicEsperado: Record<string, string> = {
      [QD.strSfcCode]: '130',
      [QD.strSlaAssigned]: '2',
      [QD.strResponsableRole]: 'Grupo_Asistencias_1',
      [QD.strDraftDate]: '2026-07-26 09:19',
      [QD.strComplaintText]: 'No me entregaron el vehículo de reemplazo.',
      [QD.strClientResponse]: 'Testeando',
      [QD.strActionsTaken]: 'Mis acciones',
      [QD.strCompensation]: 'SI',
    };

    // Se recorren los campos **encontrados en el template**, no la lista de esperados, y por eso el
    // conteo se asevera aparte: recorrer `dicEsperado` con un `find` que devuelve `undefined` haría
    // que un campo borrado del HTML se saltee en silencio.
    const cllCampos = cllCamposDs().filter((in_objCampo) => in_objCampo.name() in dicEsperado);

    expect(
      cllCampos.map((in_objCampo) => in_objCampo.name()).sort(),
      'faltan campos del template: o se borró un `zds-*`, o perdió su `formControlName`',
    ).toEqual(Object.keys(dicEsperado).sort());

    for (const objCampo of cllCampos) {
      const strNombre = objCampo.name();

      // El extremo lejano del puente: el `model` que el wrapper le pasa al `lib-*-z`. Si el campo
      // no tuviera `formControlName`, `writeValue()` no correría y esto sería `''` — que es
      // literalmente lo que se veía en el navegador.
      expect(
        objHijoDs(objCampo).model,
        `el valor de ${strNombre} no llegó al componente del DS (¿le falta formControlName?)`,
      ).toBe(dicEsperado[strNombre]);
    }
  });

  /**
   * La otra dirección, sobre uno de los 3 campos editables.
   *
   * Es la mitad del defecto que un usuario habría notado primero —tipear en "Respuesta al Cliente" y
   * que el texto no viajara a PM4— y no la cubre el caso de arriba: `writeValue()` y `fnAlCambiar`
   * son dos caminos distintos, y ambos dependían del mismo `formControlName` ausente. Se emite el
   * `modelChange` sobre la instancia del hijo, que es la vía real por la que el DS reporta un cambio
   * (no se puede tipear en el `z-textarea`: su shadow root no existe bajo jsdom).
   */
  it('⚠ lo que el usuario escribe en un campo del DS llega al FormGroup y viaja en el payload', async () => {
    await montar({ ...datosTarea(), [QD.strSacRemarks]: 'Observación previa.' });

    const objCampo = cllCamposDs().find(
      (in_objCampo) => in_objCampo.name() === QD.strClientResponse,
    );

    expect(objCampo, `no se encontró el campo ${QD.strClientResponse} en el template`).toBeDefined();

    objHijoDs(objCampo!).modelChange.emit('Respuesta corregida por el SAC');
    await asentar();

    expect(objPantalla.form.get(QD.strClientResponse)?.value).toBe('Respuesta corregida por el SAC');

    // Y que de verdad salga: sin esto el caso probaría que el control se escribió, no que el dato
    // llega a PM4 — que es el contrato que le importa al negocio.
    objPantalla.aprobar();
    await asentar();

    expect(dicPayloadEnviado()).toMatchObject({
      [QD.strClientResponse]: 'Respuesta corregida por el SAC',
    });
  });

  /**
   * ⚠ El tercer defecto de esta pantalla que ningún caso veía, y el mismo mecanismo que los otros dos:
   * un comentario que era cierto cuando se escribió y dejó de serlo.
   *
   * React pasa `maxLength={5000}` / `{5000}` / `{2000}` en los tres textarea editables, y el DS pinta
   * un contador (`9/5000`). Esta pantalla se portó **sin** los tres inputs, porque el comentario del
   * `form` afirmaba que el input de la fachada no existía y que pasarlo sería un falso verde — cierto
   * hasta que `zds-textarea` neutralizó el bug de `lib-textarea-z` reponiendo el atributo con un
   * `afterRenderEffect`. Medido lado a lado con la task 171840: React pintaba `9/5000`, `12/5000` y
   * `0/2000`; Angular ninguno de los tres.
   *
   * **Los `Validators.maxLength` NO son esta guarda y no la reemplazan.** Son el límite efectivo y
   * estaban bien desde el principio; lo que faltaba era lo visual, que es un contrato distinto y con
   * un punto de falla distinto. Aseverar el validador acá dejaría pasar exactamente este defecto.
   *
   * Y a diferencia del valor —que viaja por `[(ngModel)]`, o sea una **propiedad**, y por eso los dos
   * casos de arriba tienen que leer `model` del componente hijo—, el `max-length` **sí es aseverable
   * por DOM**: la cadena termina en un atributo sobre el `z-textarea`, que es el elemento que el DS
   * lee para pintar el contador. Así que la aserción va donde va el defecto, sobre el DOM real, sin
   * pasar por ninguna instancia intermedia (que es donde el bug de la lib se veía "cableado").
   */
  it('⚠ el contador del DS recibe su límite: `max-length` llega al z-textarea (paridad con React)', async () => {
    await montar();

    // Los 3 editables. `qd_strComplaintText` queda afuera **porque en React tampoco lo lleva**: es
    // solo lectura, el texto del radicador, y un contador ahí sería una divergencia al revés.
    const dicEsperado: Record<string, string> = {
      [QD.strClientResponse]: '5000',
      [QD.strActionsTaken]: '5000',
      [QD.strSacRemarks]: '2000',
    };

    for (const [strNombre, strLimite] of Object.entries(dicEsperado)) {
      // Se busca por `id` del wrapper y no por posición: el `id="field-<name>"` es contrato de la
      // fachada (lo necesita `scrollToFirstError`) y ya tiene su propio spec, así que apoyarse en él
      // no agrega una suposición nueva.
      const objTextarea = (objFixture.nativeElement as HTMLElement).querySelector(
        `#field-${strNombre} za-textarea z-textarea`,
      );

      // Sin esta guarda, un `querySelector` que no encuentra nada haría que el `getAttribute` de
      // abajo explote con `Cannot read properties of null` — que se lee como error del test y no
      // como el defecto que sería (el `zds-textarea` borrado, o su `id` cambiado).
      expect(objTextarea, `no se encontró el z-textarea de ${strNombre}`).not.toBeNull();

      expect(
        objTextarea!.getAttribute('max-length'),
        `${strNombre} no le pasa el límite al contador del DS (¿le falta [maxLength]?)`,
      ).toBe(strLimite);
    }
  });
});
