import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CampoBase } from '../../../../components/fields/campo-base';
import { cllCamposDeLaFachada } from '../../../../components/fields/contrato-pantalla';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { OS, SCR003_MIN_ANALISIS } from '../fields/fields';
import { GestionLinea2 } from './gestion-linea2';

/**
 * SCR-003 (Otras Solicitudes) · Bandeja de Tareas / Gestión Línea 2 — **un caso por RUL/ACT/MSG del
 * anexo**, no un smoke.
 *
 * Hereda el método de los cinco specs de pantalla anteriores: servicios reales +
 * `HttpTestingController` en vez de `vi.mock`, aserción sobre el `FormControl` y no sobre el shadow
 * DOM del DS, y `detectChanges()` explícito porque bajo `provideZonelessChangeDetection()` un
 * `whenStable()` solo no repinta. Lo que este archivo agrega, y por qué:
 *
 * ── 1. RUL-003-01 se prueba en las DOS direcciones, y la tercera es la que muerde ────────────────
 * La regla dice *"sin análisis técnico no se puede confirmar la atención"*. Un caso con el campo vacío
 * y otro con el campo lleno dejan pasar una implementación rota: `blnPuedeConfirmar = true` fijo pasa
 * el segundo, y `false` fijo pasa el primero. El input que distingue las implementaciones reales es el
 * **campo con solo espacios**: es lo único que separa `!!valor` de `!!valor.trim()`, y `required` de
 * Angular no lo rechaza. Tiene su propio `it()` y es el que se muta.
 *
 * ── 2. ACT-003-02 se asevera por el MÉTODO y la URL de la petición, no por el spy de un servicio ──
 * Lo que hay que fijar de reasignar es que **no completa la tarea**: el `PUT /tasks/{id}` lleva solo
 * `{user_id}` y **no** `{status: 'COMPLETED'}`. Un spy sobre `reasignarTarea` probaría que la pantalla
 * llamó al método correcto, que es exactamente lo que ya se ve leyendo el `.ts`; lo que puede estar
 * roto sin que se note es que alguien cambie ese método por `completarTarea` y el caso siga verde
 * porque solo miraba "se llamó a algo". Se asevera sobre el cuerpo real que sale por HTTP.
 *
 * ── 3. El caso del SLA usa tres valores, y el del umbral es el único que vale ────────────────────
 * El banner rojo aparece con `slaRestante <= 2`. Con 10 y con 0 un `<= -99` (la mutación que la ficha
 * de React registra como verificada) sigue verde en uno de los dos. El valor **2 exacto** es el que
 * distingue `<= 2` de `< 2` y de `<= -99`, así que va aparte.
 *
 * ── 4. Por qué no hay caso del uploader de S4 ───────────────────────────────────────────────────
 * `DocSupportUploaderComponent` tiene su propio spec (`doc-support-uploader.spec.ts`) que cubre el
 * registro del binario, el desplazamiento de slots y el tope. Repetirlo acá probaría el componente por
 * segunda vez, no la pantalla. Lo que sí es de esta pantalla —que el `FormGroup` que recibe es el de
 * ella, y que sus 10 claves existen como controles— sí tiene caso.
 */
const INT_TASK_ID = 1;
const INT_REQUEST_ID = 55;
const OBJ_ENV_VACIO = { strTaskId: '', strCaseId: '', strProcessId: '', strEventId: '', strToken: '' };

let objFixture: ComponentFixture<GestionLinea2>;
let objPantalla: GestionLinea2;
let objMock: HttpTestingController;

/**
 * Rótulos del anexo, campo por campo. Sujeto del caso de paridad de rótulos.
 *
 * ⚠ **Copiados de la ficha de trazabilidad de la pantalla** (`DOCUMENTACION_...md`, tablas de S1–S3,
 * columna *Etiqueta*), no de la plantilla. Transcribirlos del `.html` haría que el caso se asevere
 * contra sí mismo: quedaría verde con un rótulo derivado. Si esta tabla y el `.html` discrepan, **el
 * que se corrige es el `.html`** — salvo que el anexo haya cambiado, y entonces se re-copia de ahí.
 */
const DIC_ROTULOS: Record<string, string> = {
  [OS.strBpmCaseId]: 'ID Caso / Código Radicado',
  [OS.strDueDate]: 'Fecha Límite',
  [OS.strConsumerName]: 'Nombre del Consumidor',
  [OS.strIdentification]: 'Tipo y N.° de Identificación',
  [OS.strProductLine]: 'Producto / Ramo',
  [OS.strCaseDescription]: 'Descripción del Caso',
  [OS.strTechAnalysis]: 'Análisis Técnico / Resolución',
  [OS.strSystemActions]: 'Acciones Ejecutadas en Sistemas',
};

/** Un análisis que supera el mínimo de 100 caracteres de FLD-049. */
const STR_ANALISIS_VALIDO =
  'Se revisó la solicitud en el core de pólizas y en el gestor documental. ' +
  'Se confirmó la vigencia del amparo y se ajustó el valor asegurado según la carátula vigente del contrato.';

/** `task.data` con los campos de la pantalla poblados. El SLA queda holgado a propósito. */
function datosTarea(in_dicExtra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    [OS.strBpmCaseId]: 'OS-2026-000987',
    [OS.strCaseType]: 'Solicitud de Corrección de Datos',
    [OS.intSlaRemaining]: 10,
    [OS.strDueDate]: '2026-09-30',
    [OS.strConsumerName]: 'María Fernanda Ríos',
    [OS.strIdentification]: 'CC 1.020.334.556',
    [OS.strProductLine]: 'Autos — Todo Riesgo',
    [OS.strCaseDescription]: 'El consumidor solicita corregir la placa registrada en la póliza.',
    // Ruido deliberado: `task.data` trae el caso entero, con campos de otras pantallas del proceso.
    // La pantalla tiene que descartarlos (ver `precargar`), y el caso del payload lo asevera.
    os_strRequestChannel: 'web',
    qd_strCaseNumber: 'QD-2026-000123',
    ...in_dicExtra,
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
 * Suplanta `window.top` por un doble cuyo `location.href` es una propiedad **escribible**, y devuelve
 * un lector de lo último que se le asignó (`null` si nadie navegó) junto con el `restaurar()`.
 *
 * ⚠ **Por qué un doble y no leer `window.top.location.href` antes y después.** En jsdom el fixture
 * corre en el frame de arriba, así que `window.top === window`; y asignarle `location.href` **no
 * cambia el valor** —jsdom emite `Not implemented: navigation` y sigue—. O sea que un
 * `expect(href).toBe(hrefDeAntes)` pasa **igual haya navegado o no**: una aserción que no puede
 * fallar.
 *
 * ⚠ **Este archivo la tenía, y era infalible — medido acá, no heredado.** El caso *«si PM4 falla …
 * NO navega el frame superior»* comparaba `window.top?.location.href` contra sí mismo: degradar el
 * `if (!blnOk) return;` de `guardarBorrador()` a un `void 0` dejaba **los 30 casos verdes**. Es el
 * mismo agujero que ya estaba documentado en SCR-0052 y SCR-009; esta pantalla es la tercera con la
 * misma navegación y era la única que había quedado sin el doble.
 *
 * Idéntico al de `formulario-superintendencia.spec.ts` y `respuesta-area-responsable.spec.ts`. Se
 * duplica en vez de extraerse a un helper compartido porque un arnés de test que se comparte entre
 * pantallas acopla sus specs: cambiar el doble por una pantalla obliga a revalidar las otras dos.
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

/**
 * ⚠ El orden importa: **`await whenStable()` por sí solo NO repinta** bajo
 * `provideZonelessChangeDetection()`. Sin el `detectChanges()` el template se queda en la rama
 * `@if (blnCargando())` para siempre y ningún campo existe.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

const INT_MAX_VUELTAS_DRENADO = 6;

/**
 * Consume las peticiones que la pantalla dispara por su cuenta —el GET de archivos del request que hace
 * `RequestFileList` para FLD-048— para que el `objMock.verify()` del `afterEach` no falle por una
 * petición legítima que ningún caso nombró.
 *
 * **Drena solo `GET`, y ese filtro es lo que mantiene honestos a los helpers de payload.** El `PUT` es
 * justamente lo que se asevera: drenarlo acá lo dejaría consumido, y el caso de "reasignar NO completa
 * la tarea" pasaría **igual que si la pantalla sí la hubiera completado**.
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
 * Monta la pantalla con la tarea ya respondida. Las tres partes del orden son contrato:
 *
 * 1. `fijarQueryString` **antes** de `createComponent`, porque `ngOnInit` llama `cargar()` y ahí se lee
 *    el `task_id`.
 * 2. `detectChanges()` **entre** `createComponent` y el `expectOne`: bajo
 *    `provideZonelessChangeDetection()` `createComponent()` por sí solo NO corre `ngOnInit`.
 * 3. El `flush` **antes** del `await`, porque `precargar()` corre cuando `await cargar()` resuelve.
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
  objFixture = TestBed.createComponent(GestionLinea2);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  objFixture.detectChanges();
  objMock
    .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
    .flush(tarea(in_dicDatos));
  await drenarPeticiones();
}

/**
 * El cuerpo completo del `PUT /tasks/{id}`, o `null` si la pantalla no lo emitió.
 *
 * Devuelve el cuerpo **entero** y no solo su `data`, porque el caso de reasignación necesita ver que
 * `status` **no** está: es la diferencia entre completar la tarea y solo cambiar el responsable.
 */
function objPutTarea(): Record<string, unknown> | null {
  const cllPuts = objMock.match(
    (in_objReq) => in_objReq.method === 'PUT' && in_objReq.url === `/api/tasks/${INT_TASK_ID}`,
  );
  if (cllPuts.length === 0) return null;
  const objCuerpo = cllPuts[0].request.body as Record<string, unknown>;
  cllPuts[0].flush({});
  return objCuerpo;
}

/** El `data` del `PUT /requests/{id}` (el borrador y el guardado de la reasignación), o `null`. */
function dicPutRequest(): Record<string, unknown> | null {
  const cllPuts = objMock.match(
    (in_objReq) => in_objReq.method === 'PUT' && in_objReq.url === `/api/requests/${INT_REQUEST_ID}`,
  );
  if (cllPuts.length === 0) return null;
  const objCuerpo = cllPuts[0].request.body as { data: Record<string, unknown> };
  cllPuts[0].flush({});
  return objCuerpo.data;
}

/**
 * ⚠ **Las acciones se lanzan SIN `await`, y después va `asentar()`.**
 *
 * Es el contrato de estos dos helpers y la trampa más cara del archivo. `confirmarAtencion()` queda
 * suspendida en el `await` de su propio PUT, y quien lo destraba es el `flush()` que hacen
 * `objPutTarea()`/`dicPutRequest()`. Escribir `await objPantalla.confirmarAtencion()` es un
 * **deadlock**: la promesa espera el flush, el flush está después del await, y el caso muere a los
 * 5000 ms. Peor que perder un caso: un `it()` que expira **no llega a su `afterEach`**, así que
 * `resetTestingModule()` no corre y TODOS los casos siguientes fallan con "the test module has
 * already been instantiated" — un solo cuelgue se lee como 17 pantallas rotas.
 *
 * Los casos que necesitan el resultado de la promesa (los de error, que aseveran `strErrorEnvio`) sí
 * la guardan en una variable, pero flushean **entre** el lanzamiento y el `await`.
 */

/** Los wrappers `zds-*` que la pantalla montó, deduplicados por el `Set` interno del helper. */
function cllCamposDs(): CampoBase<string>[] {
  return cllCamposDeLaFachada<string>(objFixture);
}

/** El **wrapper** de un campo, buscado por su `name`. */
function objCampo(in_strNombre: string): CampoBase<string> {
  const objEncontrado = cllCamposDs().find((in_objC) => in_objC.name() === in_strNombre);
  if (!objEncontrado) {
    throw new Error(
      `No se encontró el campo "${in_strNombre}". Montados: ` +
        cllCamposDs()
          .map((in_objC) => in_objC.name())
          .join(', '),
    );
  }
  return objEncontrado;
}

/** Texto plano de toda la pantalla, para aseverar alertas y rótulos que no son de un campo. */
function strTextoPantalla(): string {
  return (objFixture.nativeElement as HTMLElement).textContent ?? '';
}

/** Los `lib-button-z` de la barra de acciones, en el orden en que la plantilla los declara. */
function cllBotones(): { strEtiqueta: string; blnDeshabilitado: boolean }[] {
  return objFixture.debugElement
    .queryAll(By.css('app-action-bar lib-button-z'))
    .map((in_objDebug) => {
      const objComp = in_objDebug.componentInstance as { label?: string; disabled?: boolean };
      return {
        strEtiqueta: String(objComp.label ?? ''),
        blnDeshabilitado: objComp.disabled === true,
      };
    });
}

function objBoton(in_strEtiqueta: string): { strEtiqueta: string; blnDeshabilitado: boolean } {
  const objEncontrado = cllBotones().find((in_obj) => in_obj.strEtiqueta === in_strEtiqueta);
  if (!objEncontrado) {
    throw new Error(
      `No hay botón "${in_strEtiqueta}". Presentes: ` +
        cllBotones()
          .map((in_obj) => in_obj.strEtiqueta)
          .join(' · '),
    );
  }
  return objEncontrado;
}

/** Escribe en un control del form como lo haría el usuario, y repinta. */
async function escribir(in_strCampo: string, in_strValor: string): Promise<void> {
  objPantalla.form.get(in_strCampo)?.setValue(in_strValor);
  await asentar();
}

/**
 * Los dos hooks van **una sola vez, en el nivel raíz del archivo**, y `montar()` se llama **dentro de
 * cada `it()`**, nunca en un `beforeEach` de bloque. No es estilo: `TestBed.configureTestingModule()`
 * truena con *"the test module has already been instantiated"* si un `beforeEach` de un bloque monta
 * cuando otro ya instanció el módulo, y el error se lee como falla de la pantalla.
 */
beforeEach(() => {
  // `scrollToFirstError` difiere el scroll en un `setTimeout(0)`, así que sin este stub el `TypeError`
  // de jsdom sale como **error no manejado** en vez de como fallo del caso — Vitest reporta
  // `Tests N passed` + `Errors 1`, que es fácil de leer como una suite verde.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  // ⚠ El `try/finally` es lo que impide que UN caso roto se lea como quince.
  //
  // `verify()` **tira** si quedó una petición sin flushear, y un `throw` en el `afterEach` aborta el
  // hook: sin el `finally`, `resetTestingModule()` no corre, el TestBed queda instanciado y **todos**
  // los casos siguientes mueren con "the test module has already been instantiated". El primer
  // recorrido de este archivo mostró exactamente eso — 15 rojos de los cuales 14 eran daño colateral,
  // y el caso realmente roto quedaba enterrado en la mitad del listado.
  //
  // El `?` es load-bearing por el motivo hermano: un caso que falla antes de `montar()` deja `objMock`
  // sin asignar, y sin el `?` el error real quedaría tapado por un `Cannot read properties of
  // undefined`.
  try {
    objMock?.verify();
  } finally {
    TestBed.resetTestingModule();
  }
});

describe('SCR-003 OS · Gestión Línea 2 — precarga y contrato de campos', () => {
  it('precarga los campos del caso desde task.data', async () => {
    await montar();
    expect(objPantalla.form.get(OS.strBpmCaseId)?.value).toBe('OS-2026-000987');
    expect(objPantalla.form.get(OS.strConsumerName)?.value).toBe('María Fernanda Ríos');
    expect(objPantalla.form.get(OS.strCaseDescription)?.value).toContain('corregir la placa');
  });

  it('NO adopta los campos ajenos que vienen en task.data', async () => {
    await montar();
    // `precargar()` itera las claves del form, no las de `task.data`. Sin ese filtro la pantalla
    // devolvería en su payload campos de otras pantallas del proceso, pisándolos con lo que tuviera
    // en memoria.
    expect(Object.keys(objPantalla.form.controls)).not.toContain('os_strRequestChannel');
    expect(Object.keys(objPantalla.form.controls)).not.toContain('qd_strCaseNumber');
  });

  it('declara los 10 slots de soporte interno de FLD-052 como controles del form', async () => {
    await montar();
    // Son los que `DocSupportUploader` escribe: si faltara uno, el uploader pintaría el slot y el
    // nombre del archivo no llegaría nunca al payload.
    for (const strClave of objPantalla.cllDocsSoporte) {
      expect(Object.keys(objPantalla.form.controls)).toContain(strClave);
    }
    expect(objPantalla.cllDocsSoporte.length).toBe(10);
  });

  it('usa los rótulos del anexo en cada campo', async () => {
    await montar();
    for (const [strCampo, strRotulo] of Object.entries(DIC_ROTULOS)) {
      expect(objCampo(strCampo).label(), `rótulo de ${strCampo}`).toBe(strRotulo);
    }
  });

  it('deja de solo lectura todo S1 y S2, y editable solo S3', async () => {
    await montar();
    // SEC-009 y SEC-010 son "solo lectura" en el anexo: es lo que impide que Línea 2 edite los datos
    // que radicó el cliente. Un `readOnly` que se cayera no rompe nada visible hasta que alguien
    // cambia el nombre del consumidor desde acá.
    for (const strCampo of [
      OS.strBpmCaseId,
      OS.strDueDate,
      OS.strConsumerName,
      OS.strIdentification,
      OS.strProductLine,
      OS.strCaseDescription,
    ]) {
      expect(objCampo(strCampo).readOnly(), `${strCampo} debe ser de solo lectura`).toBe(true);
    }
    expect(objCampo(OS.strTechAnalysis).readOnly()).toBe(false);
    expect(objCampo(OS.strSystemActions).readOnly()).toBe(false);
  });

  it('marca como obligatorio solo el análisis técnico (FLD-049)', async () => {
    await montar();
    expect(objCampo(OS.strTechAnalysis).obligatorio()).toBe(true);
    expect(objCampo(OS.strSystemActions).obligatorio()).toBe(false);
  });
});

describe('SCR-003 OS · RUL-003-01 — sin análisis técnico no se confirma la atención', () => {
  it('con el análisis vacío el botón principal está deshabilitado y se muestra MSG-003-01', async () => {
    await montar();
    expect(objPantalla.blnPuedeConfirmar()).toBe(false);
    expect(objBoton('Confirmar Atención ▶').blnDeshabilitado).toBe(true);
    expect(strTextoPantalla()).toContain(
      'Debe documentar el análisis o resolución antes de confirmar la atención',
    );
  });

  it('con el análisis escrito el botón se habilita y MSG-003-01 desaparece', async () => {
    await montar();
    await escribir(OS.strTechAnalysis, STR_ANALISIS_VALIDO);

    expect(objPantalla.blnPuedeConfirmar()).toBe(true);
    expect(objBoton('Confirmar Atención ▶').blnDeshabilitado).toBe(false);
    expect(strTextoPantalla()).not.toContain('antes de confirmar la atención');
  });

  it('con el análisis en BLANCOS sigue bloqueado — el caso que distingue trim() de !!valor', async () => {
    await montar();
    // ⚠ Este es el caso que muerde. `Validators.required` acepta '   ' (no es cadena vacía), así que
    // sin el `.trim()` de `blnPuedeConfirmar` la pantalla dejaría confirmar la atención con un análisis
    // que en PM4 se lee como vacío. Los otros dos casos de este bloque pasan igual sin el trim.
    await escribir(OS.strTechAnalysis, '     ');

    expect(objPantalla.blnPuedeConfirmar()).toBe(false);
    expect(objBoton('Confirmar Atención ▶').blnDeshabilitado).toBe(true);
  });

  it('al intentar confirmar con el análisis vacío NO completa la tarea y muestra el mensaje del anexo', async () => {
    await montar();
    // Acá el `await` SÍ es seguro: el gate corta antes de cualquier petición, así que la promesa
    // resuelve sola. Es justamente lo que el caso asevera.
    await objPantalla.confirmarAtencion();
    await asentar();

    expect(objPutTarea()).toBeNull();
    expect(objPantalla.strErrorAnalisis()).toBe(
      'Debe documentar el análisis o resolución antes de confirmar la atención.',
    );
  });

  it('el mensaje del campo NO habla antes del primer intento de envío', async () => {
    await montar();
    // Un campo obligatorio vacío al abrir la pantalla no es todavía un error del usuario: es el
    // estado inicial. El `blnIntentoEnvio` es lo que separa las dos situaciones.
    expect(objPantalla.strErrorAnalisis()).toBe('');
    expect(objCampo(OS.strTechAnalysis).error()).toBe('');
  });
});

describe('SCR-003 OS · FLD-049 — mínimo de 100 caracteres', () => {
  it('con menos del mínimo NO completa la tarea y avisa el largo exigido', async () => {
    await montar();
    await escribir(OS.strTechAnalysis, 'Se revisó y se corrigió.');
    // El validador de largo corta antes del PUT, así que la promesa resuelve sin flush.
    await objPantalla.confirmarAtencion();
    await asentar();

    expect(objPutTarea()).toBeNull();
    expect(objPantalla.strErrorAnalisis()).toBe(
      `El análisis debe tener al menos ${SCR003_MIN_ANALISIS} caracteres.`,
    );
  });

  it('el mínimo NO apaga el botón principal — el gate es solo "hay texto"', async () => {
    await montar();
    // Paridad con React, que pone el gate del botón en `!!analisis.trim()` y deja que el mínimo lo
    // reporte el campo al enviar. Si alguien moviera el mínimo al gate, el botón quedaría apagado
    // hasta el carácter 100 y eso es un cambio de afordancia, no un arreglo.
    await escribir(OS.strTechAnalysis, 'Corto.');

    expect(objPantalla.blnPuedeConfirmar()).toBe(true);
    expect(objBoton('Confirmar Atención ▶').blnDeshabilitado).toBe(false);
  });
});

describe('SCR-003 OS · ACT-003-01 — Confirmar Atención', () => {
  it('completa la tarea con os_strAction=CONFIRMAR_ATENCION y el análisis escrito', async () => {
    await montar();
    await escribir(OS.strTechAnalysis, STR_ANALISIS_VALIDO);
    void objPantalla.confirmarAtencion();
    await asentar();

    const objCuerpo = objPutTarea();
    expect(objCuerpo).not.toBeNull();
    // El `status: COMPLETED` es lo que hace avanzar el flujo BPM al siguiente nodo.
    expect(objCuerpo?.['status']).toBe('COMPLETED');
    const dicDatos = objCuerpo?.['data'] as Record<string, unknown>;
    expect(dicDatos[OS.strAction]).toBe('CONFIRMAR_ATENCION');
    expect(dicDatos[OS.strTechAnalysis]).toBe(STR_ANALISIS_VALIDO);
  });

  it('el payload NO arrastra los campos ajenos de task.data', async () => {
    await montar();
    await escribir(OS.strTechAnalysis, STR_ANALISIS_VALIDO);
    void objPantalla.confirmarAtencion();
    await asentar();

    const dicDatos = objPutTarea()?.['data'] as Record<string, unknown>;
    expect(dicDatos).not.toHaveProperty('os_strRequestChannel');
    expect(dicDatos).not.toHaveProperty('qd_strCaseNumber');
  });
});

describe('SCR-003 OS · ACT-003-02 — Reasignar Caso', () => {
  it('cambia el responsable SIN completar la tarea', async () => {
    await montar();
    void objPantalla.reasignar('4242');
    await asentar();

    const objCuerpo = objPutTarea();
    expect(objCuerpo).not.toBeNull();
    // ⚠ El contrato completo de la acción está en estas tres aserciones: el PUT lleva el `user_id`,
    // y NO lleva `status` ni `data`. Con `status: 'COMPLETED'` el caso avanzaría de nodo y el usuario
    // reasignado recibiría una tarea que ya no existe — y PM4 respondería 200 igual.
    expect(objCuerpo?.['user_id']).toBe('4242');
    expect(objCuerpo).not.toHaveProperty('status');
    expect(objCuerpo).not.toHaveProperty('data');

    // La SEGUNDA mitad del contrato de dos PUT se consume acá aunque este caso no la asevere (eso lo
    // hace el caso que sigue): `reasignarTarea` la dispara en cuanto el primer PUT resuelve, y dejarla
    // colgada haría fallar el `verify()` del `afterEach` con un "Expected no open requests" que se lee
    // como un defecto de la pantalla y no como una petición legítima que este caso no mira.
    await asentar();
    expect(dicPutRequest()).not.toBeNull();
  });

  it('guarda los datos del caso aparte, con os_strAction=REASIGNAR', async () => {
    await montar();
    await escribir(OS.strTechAnalysis, STR_ANALISIS_VALIDO);
    void objPantalla.reasignar('4242');
    await asentar();

    // El primer PUT se flushea para destrabar la segunda mitad del contrato de `reasignarTarea`: el
    // PUT a `/requests/{id}` solo sale cuando el de `/tasks/{id}` ya resolvió.
    objPutTarea();
    await asentar();
    const dicDatos = dicPutRequest();
    expect(dicDatos).not.toBeNull();
    expect(dicDatos?.[OS.strAction]).toBe('REASIGNAR');
    expect(dicDatos?.[OS.strTechAnalysis]).toBe(STR_ANALISIS_VALIDO);
  });

  it('reasignar NO exige el análisis técnico — es la salida del "no puedo resolverlo"', async () => {
    await montar();
    // El escenario real de reasignar es justamente que el análisis no está escrito. Si el botón
    // dependiera de `blnPuedeConfirmar()`, el usuario quedaría sin salida.
    expect(objPantalla.blnPuedeConfirmar()).toBe(false);
    expect(objBoton('Reasignar Caso').blnDeshabilitado).toBe(false);
  });

  it('cierra el modal al reasignar bien, y lo deja abierto si PM4 falla', async () => {
    await montar();
    objPantalla.blnModalReasignar.set(true);
    const objPromesa = objPantalla.reasignar('4242');
    await asentar();
    objMock
      .expectOne((in_objReq) => in_objReq.method === 'PUT' && in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush({ message: 'Sin permiso para reasignar.' }, { status: 403, statusText: 'Forbidden' });
    await objPromesa;
    await asentar();

    // El modal se queda abierto a propósito: es donde está el select con el usuario elegido, así que
    // cerrarlo obligaría a rehacer la selección para reintentar.
    expect(objPantalla.blnModalReasignar()).toBe(true);
    expect(objPantalla.strErrorEnvio()).toBe('Sin permiso para reasignar.');
  });
});

describe('SCR-003 OS · ACT-003-03 — Cancelar', () => {
  it('descarta lo escrito volviendo a los valores del caso, y NO llama a PM4', async () => {
    await montar();
    await escribir(OS.strTechAnalysis, STR_ANALISIS_VALIDO);
    objPantalla.cancelar();
    await asentar();

    expect(objPantalla.form.get(OS.strTechAnalysis)?.value).toBe('');
    // Los datos del caso vuelven, no se pierden: cancelar descarta lo del usuario, no la precarga.
    expect(objPantalla.form.get(OS.strConsumerName)?.value).toBe('María Fernanda Ríos');
    // Es una acción LOCAL: no tiene `os_strAction` ni petición. Ver el tipo `AccionGestionLinea2`.
    expect(objPutTarea()).toBeNull();
    expect(dicPutRequest()).toBeNull();
  });

  it('sigue alcanzable con S3 vacío', async () => {
    await montar();
    expect(objPantalla.blnPuedeConfirmar()).toBe(false);
    expect(objBoton('Cancelar').blnDeshabilitado).toBe(false);
  });
});

describe('SCR-003 OS · ACT-003-04 — Guardar Borrador', () => {
  it('guarda en el request sin completar la tarea, con os_strAction=GUARDAR_BORRADOR', async () => {
    await montar();
    await escribir(OS.strTechAnalysis, 'Avance parcial del análisis.');
    // El espía va aunque este caso no asevere la navegación: el guardado sale bien, así que
    // `guardarBorrador()` **navega**, y contra el `window.top` real jsdom escupe un
    // `Not implemented: navigation` al pie de la corrida. Con el doble puesto, la escritura queda
    // contenida y la salida de la suite no arrastra un error que no es un fallo.
    const objEspia = espiarNavegacionDelTope();

    try {
      const objPromesa = objPantalla.guardarBorrador();
      await asentar();

      const dicDatos = dicPutRequest();
      expect(dicDatos?.[OS.strAction]).toBe('GUARDAR_BORRADOR');
      expect(dicDatos?.[OS.strTechAnalysis]).toBe('Avance parcial del análisis.');
      // Guardar borrador NO avanza el flujo: si completara la tarea, el caso saldría de P02-T12 con el
      // análisis a medio escribir.
      expect(objPutTarea()).toBeNull();
      await objPromesa;
    } finally {
      objEspia.restaurar();
    }
  });

  it('no exige el análisis: el borrador existe para guardar trabajo incompleto', async () => {
    await montar();
    expect(objPantalla.blnPuedeConfirmar()).toBe(false);
    expect(objBoton('Guardar Borrador').blnDeshabilitado).toBe(false);
  });

  it('tras guardar bien, devuelve el frame superior a la bandeja', async () => {
    await montar();
    const objEspia = espiarNavegacionDelTope();

    try {
      // ⚠ **La promesa se espera DENTRO del `try`.** `guardarBorrador()` escribe
      // `window.top.location.href` detrás de su último `await`: con un `void` suelto ese `href` cae
      // cuando el `finally` ya restauró el `window.top` real y jsdom lo reporta **fuera** del caso.
      const objPromesa = objPantalla.guardarBorrador();
      await asentar();
      objMock
        .expectOne(
          (in_objReq) =>
            in_objReq.method === 'PUT' && in_objReq.url === `/api/requests/${INT_REQUEST_ID}`,
        )
        .flush({ id: INT_REQUEST_ID });
      await objPromesa;

      // El destino es el `'/tasks'` de `urlBandejaTareas()` — un defecto preexistente de la app React
      // que se porta sin arreglar y está fijado en `pm4-context.service.spec.ts`. Acá solo importa que
      // se haya navegado; el valor lo gobierna ese otro spec.
      expect(objEspia.strDestino()).toContain('/tasks');
    } finally {
      objEspia.restaurar();
    }
  });

  it('⚠ si PM4 falla, muestra el error y NO navega el frame superior', async () => {
    await montar();
    const objEspia = espiarNavegacionDelTope();

    try {
      const objPromesa = objPantalla.guardarBorrador();
      await asentar();
      objMock
        .expectOne(
          (in_objReq) =>
            in_objReq.method === 'PUT' && in_objReq.url === `/api/requests/${INT_REQUEST_ID}`,
        )
        .flush(
          { message: 'El caso está bloqueado por otro usuario.' },
          { status: 409, statusText: 'Conflict' },
        );
      await objPromesa;
      await asentar();

      // ⚠ La navegación va SOLO si el guardado salió bien: navegar tras un fallo perdería el trabajo
      // del usuario sin decirle nada. Es el motivo de que `enviarCon()` devuelva un booleano.
      //
      // ⚠ **Medido acá:** con la versión anterior de este caso —que comparaba
      // `window.top?.location.href` contra el valor leído antes— degradar el `if (!blnOk) return;` a
      // un `void 0` dejaba los 30 casos del archivo verdes. Ver `espiarNavegacionDelTope()`.
      expect(objPantalla.strErrorEnvio()).toBe('El caso está bloqueado por otro usuario.');
      expect(objEspia.strDestino()).toBeNull();
      expect(strTextoPantalla()).toContain('No se pudo enviar');
    } finally {
      objEspia.restaurar();
    }
  });
});

describe('SCR-003 OS · FLD-042 — semáforo del SLA', () => {
  it('con SLA holgado no muestra el banner y el badge queda en informativo', async () => {
    await montar(datosTarea({ [OS.intSlaRemaining]: 10 }));

    expect(objPantalla.blnSlaCritico()).toBe(false);
    expect(objPantalla.strEstadoSla()).toBe('Abierta');
    expect(objPantalla.strVarianteSla()).toBe('info');
    expect(strTextoPantalla()).not.toContain('Priorice el análisis técnico');
  });

  it('con el SLA en el umbral exacto (2) ya muestra el banner — el caso que fija el <=', async () => {
    // ⚠ Este es el caso que muerde. Con 10 y con 0 una mutación del umbral a `<= -99` (registrada como
    // verificada en la ficha de React) sigue verde en uno de los dos. El valor 2 exacto es lo único que
    // distingue `<= 2` de `< 2` y de `<= -99`.
    await montar(datosTarea({ [OS.intSlaRemaining]: 2 }));

    expect(objPantalla.blnSlaCritico()).toBe(true);
    expect(objPantalla.strEstadoSla()).toBe('Por Vencer');
    expect(objPantalla.strVarianteSla()).toBe('warning');
    expect(strTextoPantalla()).toContain('Priorice el análisis técnico');
  });

  it('con el SLA vencido el badge pasa a danger', async () => {
    await montar(datosTarea({ [OS.intSlaRemaining]: -1 }));

    expect(objPantalla.blnSlaCritico()).toBe(true);
    expect(objPantalla.strEstadoSla()).toBe('Vencida');
    expect(objPantalla.strVarianteSla()).toBe('danger');
  });

  it('sin SLA calculado no semaforiza nada y la barra muestra un guión', async () => {
    // Un caso recién enrutado a Línea 2 puede llegar con el SLA vacío: ahí el banner rojo sería una
    // alarma inventada.
    await montar(datosTarea({ [OS.intSlaRemaining]: '' }));

    expect(objPantalla.blnTieneSlaVisible()).toBe(false);
    expect(objPantalla.blnSlaCritico()).toBe(false);
    const objItemSla = objPantalla.cllInfoItems().find((in_obj) => in_obj.label === 'SLA');
    expect(objItemSla?.value).toBe('—');
  });
});

describe('SCR-003 OS · barra de contexto y orden de las acciones', () => {
  it('rotula el estado fijo como "Asignado a Línea 2"', async () => {
    await montar();
    // No es un campo del anexo: mientras esta pantalla está abierta la tarea ES P02-T12. Ver el ⚠ de
    // `cllInfoItems`. El caso fija que nadie lo convierta en una variable `os_*` inventada.
    expect(objPantalla.cllInfoItems().map((in_obj) => in_obj.label)).toEqual([
      'Caso',
      'SLA',
      'Tipología',
      'Estado',
    ]);
    expect(strTextoPantalla()).toContain('Asignado a Línea 2');
  });

  it('presenta las 4 acciones en el orden de la maqueta', async () => {
    await montar();
    expect(cllBotones().map((in_obj) => in_obj.strEtiqueta)).toEqual([
      'Cancelar',
      'Reasignar Caso',
      'Guardar Borrador',
      'Confirmar Atención ▶',
    ]);
  });
});
