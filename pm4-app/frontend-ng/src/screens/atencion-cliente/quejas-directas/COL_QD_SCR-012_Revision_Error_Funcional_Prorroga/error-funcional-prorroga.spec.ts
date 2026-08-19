import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CampoBase } from '../../../../components/fields/campo-base';
import {
  aseverarContratoDeCampos,
  cllCamposDeLaFachada,
  objHijoDelDs,
} from '../../../../components/fields/contrato-pantalla';
import { PM4_ENV_FALLBACKS } from '../../../../core/pm4-context.service';
import { QD } from '../fields/fields';
import { ErrorFuncionalProrroga } from './error-funcional-prorroga';

/**
 * SCR-012 · Corrección Error Funcional Prórroga — **un caso por RUL/ACT/MSG del anexo**, no un smoke.
 *
 * Hereda el método de los tres specs de pantalla anteriores (servicios reales +
 * `HttpTestingController` en vez de `vi.mock`, aserción sobre el `FormControl` y no sobre el shadow
 * DOM, más el puente form↔componente del punto 2b de SCR-008). Lo que este archivo agrega, y el porqué:
 *
 * ── 1. RUL-012-01 se prueba con TRES fechas, y la del medio es la única que vale ─────────────────
 * La regla dice *"posterior a la fecha actual"*. Un `>=` puesto donde va un `>` pasa **igual** el caso
 * de la fecha pasada y **igual** el de la fecha futura: los dos quedan verdes con la implementación
 * rota. El único input que distingue las dos implementaciones es **la fecha de hoy**, así que tiene su
 * propio `it()` y es el que se muta. Sin él, este archivo tendría dos casos de fecha que no guardan
 * nada — la misma tautología que mordió en el gate 4, con otra cara.
 *
 * Las tres fechas se calculan con [`isoDesplazado()`](#isoDesplazado) sobre la **misma** referencia que
 * usa la pantalla (`new Date()` en UTC), nunca literales: un `'2026-08-20'` escrito a mano queda en el
 * pasado el día que alguien corra la suite después de esa fecha, y el caso de "fecha futura" pasaría a
 * probar el de "fecha pasada" sin que nada se ponga rojo.
 *
 * ── 2. `drenarPeticiones()` en el `montar()`, porque esta pantalla provee `CollectionService` ─────
 * FLD-204 carga `CAT-MOTIVO-PRORR`, así que además del GET de la tarea sale un GET de colección. Se
 * drena en el montaje —igual que en SCR-008— para que el `objMock.verify()` del `afterEach` no falle
 * por una petición legítima que ningún caso nombró. El filtro es **solo GET**: ver el comentario de la
 * función, que explica por qué drenar el PUT rompería en silencio el caso de "no completa la tarea".
 *
 * ── 3. El caso que asevera que el mensaje de fecha NO se muestra ──────────────────────────────────
 * `lib-input-date-z` no tiene `helpText`, así que `strErrorFecha()` calcula un texto que **nunca se
 * pinta** (documentado en el punto 1 de la cabecera del `.ts`). Eso no es un descuido a corregir, es la
 * divergencia con React que la pantalla hereda del DS. Sin un caso que la fije, el próximo que lea
 * `strErrorFecha()` "arreglaría" el campo agregándole un `[helpText]` que el DS descarta en silencio —
 * un cambio que se ve correcto, compila, y no muestra nada.
 */
const INT_TASK_ID = 1;
const OBJ_ENV_VACIO = { strTaskId: '', strCaseId: '', strProcessId: '', strEventId: '', strToken: '' };

/** Tope del `maxLength` de FLD-207. Duplicado a propósito: si el `.ts` lo cambia, este caso avisa. */
const INT_MAX_TEXTO = 2000;

let objFixture: ComponentFixture<ErrorFuncionalProrroga>;
let objPantalla: ErrorFuncionalProrroga;
let objMock: HttpTestingController;

/**
 * Rótulos del anexo, campo por campo. Es el sujeto del caso de paridad de rótulos.
 *
 * ⚠ **Copiados de `insumos/Quejas directas/Anexo02_Index/screens/SCR-012.md`** (tabla "Campos de la
 * Pantalla", columna *Etiqueta*, sin el `* ` del obligatorio), **no** de la plantilla. La distinción
 * no es formal: el primer borrador de esta constante transcribió los rótulos que el `.html` ya tenía,
 * y con eso el caso de paridad quedó **verde contra los valores equivocados** — cinco de los ocho
 * habían derivado ("Código de Error" por "Código de Error SFC Prórroga", "Intento Actual" por
 * "Intento N.° actual", "Contador de Prórroga**s**" en plural, etc.). Un rótulo aseverado contra sí
 * mismo es una tautología, la misma familia de vacuidad que el gate 4 encontró tres veces.
 *
 * O sea: si esta tabla y el `.html` discrepan, **el que se corrige es el `.html`** — salvo que el
 * anexo haya cambiado, y en ese caso se re-copia de ahí, no de acá.
 */
const DIC_ROTULOS: Record<string, string> = {
  [QD.strExtErrorCode]: 'Código de Error SFC Prórroga',
  [QD.strExtAffectedField]: 'Campo Afectado',
  [QD.strExtCurrentAttempt]: 'Intento N.° actual',
  [QD.strExtErrorMessage]: 'Mensaje de Error SFC',
  [QD.strExtensionReason]: 'Motivo de Prórroga',
  [QD.strNewDeadline]: 'Nueva Fecha Límite',
  [QD.strExtensionCounter]: 'Contador de Prórroga',
  [QD.strExtensionJustif]: 'Justificación',
};

/**
 * Fecha ISO `YYYY-MM-DD` desplazada `n` días respecto de hoy.
 *
 * ⚠ **Usa `Date.UTC` y `getUTC*`, igual que el `hoyISO()` de la pantalla.** Si acá se usara la hora
 * local (`getDate()`/`setDate()`), en la franja 19:00–23:59 de Bogotá —donde UTC ya pasó de día— el
 * `isoDesplazado(0)` daría un día **anterior** al `strHoy` de la pantalla, y el caso del borde probaría
 * "fecha pasada" creyendo probar "hoy". El spec y la implementación tienen que compartir referencia.
 */
function isoDesplazado(in_intDias: number): string {
  const objHoy = new Date();
  const objFecha = new Date(
    Date.UTC(objHoy.getUTCFullYear(), objHoy.getUTCMonth(), objHoy.getUTCDate() + in_intDias),
  );
  return objFecha.toISOString().slice(0, 10);
}

/** `task.data` con los 8 campos de la pantalla ya poblados y una fecha válida. */
function datosTarea(): Record<string, unknown> {
  return {
    [QD.strExtErrorCode]: 'SS-FUNC-014',
    [QD.strExtAffectedField]: 'qd_strExtensionReason',
    [QD.strExtCurrentAttempt]: '2',
    [QD.strExtErrorMessage]: 'El motivo de prórroga no corresponde al tipo de queja.',
    [QD.strExtensionReason]: '3',
    [QD.strNewDeadline]: isoDesplazado(10),
    [QD.strExtensionCounter]: '1',
    [QD.strExtensionJustif]: 'Se requiere ampliar el plazo para obtener el concepto del área técnica.',
    // Ruido deliberado: `task.data` trae el caso entero. La pantalla debe descartarlo (ver `precargar`).
    qd_strCaseNumber: 'QD-2026-000123',
    qd_strChannel: '13',
  };
}

function tarea(in_dicDatos: Record<string, unknown>): Record<string, unknown> {
  return { id: INT_TASK_ID, process_request_id: 55, data: in_dicDatos };
}

function fijarQueryString(in_strQuery: string): void {
  // jsdom navega dentro del mismo origen sin recargar, así que esto alcanza para que
  // `Pm4ContextService` resuelva el `task_id` de la URL.
  window.history.replaceState({}, '', '/' + in_strQuery);
}

/**
 * ⚠ El orden importa y está medido: **`await whenStable()` por sí solo NO repinta** bajo
 * `provideZonelessChangeDetection()`. Sin el `detectChanges()` de abajo el template se queda en la rama
 * `@if (blnCargando())` para siempre y ningún campo existe.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  objFixture.detectChanges();
}

const INT_MAX_VUELTAS_DRENADO = 6;

/**
 * Consume las peticiones que la pantalla dispara por su cuenta (el GET de `CAT-MOTIVO-PRORR`), para
 * que el `objMock.verify()` del `afterEach` no falle por una petición legítima.
 *
 * **Drena solo `GET`, y el filtro —no el orden de llamada— es lo que mantiene honesto a
 * `dicPayloadEnviado()`.** El `PUT` de completado es lo que ese helper asevera, así que drenarlo acá lo
 * dejaría consumido y devolvería `null` — es decir, el caso de "NO completa la tarea" pasaría **igual
 * que si la pantalla sí la hubiera completado**.
 *
 * El bucle existe porque una respuesta puede desencadenar otra petición; si no converge, el `throw`
 * nombra las que quedaron en vez de dejar el caso colgado.
 */
async function drenarPeticiones(): Promise<void> {
  for (let intVuelta = 0; intVuelta < INT_MAX_VUELTAS_DRENADO; intVuelta++) {
    await asentar();
    const cllPendientes = objMock.match((in_objReq) => in_objReq.method === 'GET');
    if (cllPendientes.length === 0) return;
    // La forma `{data: []}` cubre a los consumidores: leen `data` del cuerpo.
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
 *    `provideZonelessChangeDetection()` **`createComponent()` por sí solo NO corre `ngOnInit`** (medido:
 *    la cola está vacía antes y tiene el GET después).
 * 3. El `flush` **antes** del `await`, porque `precargar()` corre recién cuando `await cargar()` resuelve.
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
  objFixture = TestBed.createComponent(ErrorFuncionalProrroga);
  objPantalla = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);
  objFixture.detectChanges();
  objMock
    .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
    .flush(tarea(in_dicDatos));
  await drenarPeticiones();
}

/**
 * El `data` del PUT de completado, o `null` si la pantalla **no** completó la tarea. Consume el PUT, así
 * que se llama una vez por caso.
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
 * Los wrappers `zds-*` de la fachada que la pantalla montó, deduplicados por el `Set` que vive dentro
 * del helper (`componentInstance` reporta el wrapper también para sus nodos internos: 18 nodos para 9
 * campos en la SCR-008 — ver su docstring).
 */
function cllCamposDs(): CampoBase<string>[] {
  return cllCamposDeLaFachada<string>(objFixture);
}

/**
 * El **wrapper** de un campo, buscado por su `name`.
 *
 * ⚠ Devuelve el `CampoBase`, no el componente del DS que hay debajo. La distinción importa y es la que
 * hace útil al caso del puente: los `input()` de la fachada (`label`, `readOnly`, `error`,
 * `obligatorio`) se leen **acá**, y el valor que efectivamente llegó al `lib-*-z` se lee con
 * [`objHijoDs()`](#objHijoDs), que baja un nivel más. Aseverar el input del wrapper prueba que la
 * plantilla lo declaró; aseverar el `model` del hijo prueba que el puente entregó.
 */
function objCampo(in_strNombre: string): CampoBase<string> {
  const objEncontrado = cllCamposDs().find((in_objCampo) => in_objCampo.name() === in_strNombre);

  // Sin esta guarda, un campo que desapareciera del template haría fallar con "Cannot read properties
  // of undefined", que se lee como error del test y no como el defecto que es.
  expect(objEncontrado, `la pantalla no montó el campo ${in_strNombre}`).toBeDefined();
  return objEncontrado!;
}

/**
 * El componente del DS (`lib-input-text-z`, `lib-textarea-z`, …) que el wrapper renderiza adentro.
 * Es el extremo lejano del puente form→DS: su `model` es lo más profundo que jsdom permite mirar,
 * porque el `<input>` real vive en un shadow root que el upgrade de Lit nunca crea.
 */
// El tipo de retorno se **omite** a propósito: `objHijoDelDs()` ya devuelve `any` (con su propio
// `eslint-disable` y el motivo documentado en `contrato-pantalla.ts`), así que anotarlo acá otra vez
// no agrega tipado y deja un directive que no tapa nada — eslint lo reporta como
// "Unused eslint-disable directive" y con `--max-warnings=0` el lint falla.
function objHijoDs(in_strNombre: string) {
  return objHijoDelDs<string>(objFixture, objCampo(in_strNombre));
}

describe('SCR-012 · Corrección Error Funcional Prórroga', () => {
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

  it('precarga los 8 campos de la tarea y descarta las claves ajenas a la pantalla', async () => {
    await montar();

    const dicDatos = datosTarea();
    for (const strCampo of Object.keys(DIC_ROTULOS)) {
      expect(objPantalla.form.get(strCampo)?.value, `precarga de ${strCampo}`).toBe(
        dicDatos[strCampo],
      );
    }

    // El ruido de `task.data` no entra al form: `precargar()` filtra por las claves declaradas.
    expect(objPantalla.form.get('qd_strCaseNumber')).toBeNull();
    expect(objPantalla.form.get('qd_strChannel')).toBeNull();
  });

  it('los 8 campos declaran formControlName y llegan al componente del DS (puente form↔DS)', async () => {
    await montar();

    // Mitad 1 · el contrato genérico de la fachada: `name`, `formControlName` y el `id="field-<name>"`.
    aseverarContratoDeCampos(objFixture);

    // Mitad 2 · el extremo lejano del puente. Sin esto, 8 campos sin `formControlName` —muertos en el
    // navegador— dejarían este archivo entero en verde, porque todos los demás casos empujan el
    // `FormGroup` a mano. Es exactamente el defecto que SCR-008 dejó pasar (punto 2b de su spec).
    const dicDatos = datosTarea();
    expect(cllCamposDs().map((in_objCampo) => in_objCampo.name()).sort()).toEqual(
      Object.keys(DIC_ROTULOS).sort(),
    );
    for (const strCampo of Object.keys(DIC_ROTULOS)) {
      // Se lee el `model` del **hijo del DS**, no el `FormControl`: el control lo empuja el
      // `patchValue` de `precargar()` y estaría poblado igual con los 8 `formControlName` borrados.
      // El `model` del `lib-*-z` solo se escribe si el CVA del wrapper corrió, o sea si hubo
      // `NgControl`. Es el defecto que la SCR-008 dejó pasar con 10 casos verdes (punto 2b).
      expect(objHijoDs(strCampo).model, `valor que llegó al DS en ${strCampo}`).toBe(
        dicDatos[strCampo],
      );
    }
  });

  it('los rótulos de los 8 campos son los del anexo', async () => {
    await montar();

    const dicReal: Record<string, string> = {};
    for (const objUno of cllCamposDs()) {
      dicReal[objUno.name()] = objUno.label();
    }

    // La guarda de conteo va **primero**: sin ella, un campo que desaparezca del template dejaría su
    // entrada sin comparar y el `for` de abajo pasaría igual.
    expect(Object.keys(dicReal).sort()).toEqual(Object.keys(DIC_ROTULOS).sort());
    for (const [strCampo, strRotulo] of Object.entries(DIC_ROTULOS)) {
      expect(dicReal[strCampo], `rótulo de ${strCampo} fuera del anexo`).toBe(strRotulo);
    }

    // ⚠ Se asevera el **input `label` del wrapper**, no el texto renderizado: bajo jsdom los custom
    // elements de Lit no hacen upgrade, así que un `textContent.toContain(rótulo)` saldría rojo con los
    // 8 rótulos correctos (trampa 2 de testing-conventions.md).
  });

  it('los cuatro campos de S1 son de solo lectura y los de S2 no', async () => {
    await montar();

    for (const strCampo of [
      QD.strExtErrorCode,
      QD.strExtAffectedField,
      QD.strExtCurrentAttempt,
      QD.strExtErrorMessage,
    ]) {
      expect(objCampo(strCampo).readOnly(), `${strCampo} debe ser readOnly`).toBe(true);
    }
    for (const strCampo of [
      QD.strExtensionReason,
      QD.strNewDeadline,
      QD.strExtensionCounter,
      QD.strExtensionJustif,
    ]) {
      expect(objCampo(strCampo).readOnly(), `${strCampo} debe ser editable`).toBe(false);
      expect(objCampo(strCampo).obligatorio(), `${strCampo} debe pedir el asterisco`).toBe(true);
    }
  });

  it('los títulos de sección son los de SEC-039/SEC-040 y no quedó el de otra pantalla', async () => {
    await montar();
    const strTexto = (objFixture.nativeElement as HTMLElement).textContent ?? '';

    expect(strTexto).toContain('Panel de Error — Prórroga');
    expect(strTexto).toContain('Campos de Prórroga a Corregir');
    expect(strTexto).toContain('Corrección Error Funcional Prórroga');

    // La mitad negativa, que es la que distingue "el texto correcto está" de "además quedó el de
    // SCR-011 pegado al lado" — exactamente lo que produce un copy-paste a medio corregir. Acá el
    // `textContent` **sí** es aseverable: los títulos viven en plantillas propias, no en un custom
    // element de Lit.
    expect(strTexto).not.toContain('Error Técnico');
  });

  // ── RUL-012-01 · la nueva fecha límite debe ser POSTERIOR a hoy ────────────────────────────────

  it('RUL-012-01 · una fecha futura es válida y no muestra el aviso', async () => {
    await montar();

    objPantalla.form.get(QD.strNewDeadline)!.setValue(isoDesplazado(5));
    await asentar();

    expect(objPantalla.blnFechaValida()).toBe(true);
    expect(objPantalla.blnMostrarAvisoFecha()).toBe(false);
  });

  it('RUL-012-01 · una fecha pasada es inválida y muestra MSG-012-01', async () => {
    await montar();

    objPantalla.form.get(QD.strNewDeadline)!.setValue(isoDesplazado(-1));
    await asentar();

    expect(objPantalla.blnFechaValida()).toBe(false);
    expect(objPantalla.blnMostrarAvisoFecha()).toBe(true);
    expect((objFixture.nativeElement as HTMLElement).textContent ?? '').toMatch(
      /posterior a la fecha actual/,
    );
  });

  it('RUL-012-01 · ⚠ la fecha de HOY bloquea (es el caso que distingue `>` de `>=`)', async () => {
    await montar();

    objPantalla.form.get(QD.strNewDeadline)!.setValue(isoDesplazado(0));
    await asentar();

    // Los dos casos de arriba pasan igual con un `>=` mal puesto. Este es el único input que los
    // distingue, y por eso es el que se muta para validar el archivo.
    expect(objPantalla.blnFechaValida()).toBe(false);
    expect(objPantalla.blnMostrarAvisoFecha()).toBe(true);
    expect(objPantalla.blnPuedeReenviar()).toBe(false);
  });

  it('RUL-012-01 · con el campo vacío NO se muestra el aviso (vacío ≠ elegido mal)', async () => {
    await montar();

    objPantalla.form.get(QD.strNewDeadline)!.setValue('');
    await asentar();

    expect(objPantalla.blnFechaValida()).toBe(false);
    // El aviso es para "eligió una fecha y no sirve". Sin fecha el estado es "todavía no eligió", y
    // pintar MSG-012-01 ahí acusaría al usuario de un error que no cometió.
    expect(objPantalla.blnMostrarAvisoFecha()).toBe(false);
    expect((objFixture.nativeElement as HTMLElement).textContent ?? '').not.toMatch(
      /posterior a la fecha actual/,
    );
  });

  it('⚠ el mensaje de error de la fecha se calcula pero el DS NO lo muestra (divergencia con React)', async () => {
    await montar();

    objPantalla.form.get(QD.strNewDeadline)!.setValue(isoDesplazado(-1));
    objPantalla.reenviar();
    await asentar();

    // El texto existe y llega al `[error]` del wrapper...
    expect(objPantalla.strErrorFecha()).toBe('La fecha debe ser posterior a hoy');
    expect(objCampo(QD.strNewDeadline).error()).toBe('La fecha debe ser posterior a hoy');

    // ...y `lib-input-date-z` lo descarta: no tiene `helpText`. Es la pérdida de paridad heredada del
    // DS que el punto 1 de la cabecera del `.ts` documenta, y este caso la **fija**: sin él, agregarle
    // un `[helpText]` al campo se vería como el arreglo correcto y no mostraría nada igual. Nótese que
    // el string del `[error]` NO aparece en el DOM, y sí aparece el de MSG-012-01, que es la mitad que
    // el usuario realmente lee.
    const strTexto = (objFixture.nativeElement as HTMLElement).textContent ?? '';
    expect(strTexto).not.toContain('La fecha debe ser posterior a hoy');
    expect(strTexto).toMatch(/posterior a la fecha actual/);
  });

  // ── FLD-206 · el contador de prórroga solo admite dígitos ──────────────────────────────────────
  //
  // ⚠ Es una restricción **de campo**, no una regla. El anexo tiene una sola regla para SCR-012
  // (`RUL-012-01`); estos dos casos se titulaban `RUL-012-02`, un identificador que **no existe** en
  // `screens/SCR-012.md`. Importa más de lo que parece: los títulos de los casos son lo que se lee
  // como cobertura de reglas al auditar la trazabilidad, así que un ID inventado acá simula una regla
  // cubierta que el anexo nunca pidió — y de paso oculta que RUL-012-01 es la única que hay.

  it('FLD-206 · el contador rechaza un valor no numérico y lo dice', async () => {
    await montar();

    objPantalla.form.get(QD.strExtensionCounter)!.setValue('dos');
    objPantalla.reenviar();
    await asentar();

    expect(objPantalla.form.get(QD.strExtensionCounter)!.hasError('pattern')).toBe(true);
    expect(objPantalla.strErrorContador()).toBe('Solo dígitos');
    expect(objPantalla.blnPuedeReenviar()).toBe(false);
    expect(dicPayloadEnviado()).toBeNull();
  });

  it('FLD-206 · el contador acepta dígitos', async () => {
    await montar();

    objPantalla.form.get(QD.strExtensionCounter)!.setValue('12');
    await asentar();

    expect(objPantalla.form.get(QD.strExtensionCounter)!.valid).toBe(true);
    expect(objPantalla.strErrorContador()).toBe('');
  });

  // ── FLD-207 · el tope de la justificación ─────────────────────────────────────────────────────

  it(`FLD-207 · la justificación tope en ${INT_MAX_TEXTO} y el contador del DS lo refleja`, async () => {
    await montar();

    // Mitad 1 · el validador del control, que es lo que bloquea el envío.
    objPantalla.form.get(QD.strExtensionJustif)!.setValue('x'.repeat(INT_MAX_TEXTO + 1));
    objPantalla.reenviar();
    await asentar();
    expect(objPantalla.form.get(QD.strExtensionJustif)!.hasError('maxlength')).toBe(true);
    expect(objPantalla.strErrorJustif()).toBe(`Máximo ${INT_MAX_TEXTO} caracteres`);
    expect(dicPayloadEnviado()).toBeNull();

    // Mitad 2 · el contador **visual**, que es un canal distinto: el validador puede estar bien y el
    // usuario igual no ver cuánto le queda. Se lee del atributo que el wrapper escribe en el elemento
    // del DS, que es lo más profundo que jsdom permite (el `<textarea>` real vive en un shadow root
    // que nunca se crea).
    const objTextarea = objFixture.nativeElement.querySelector(
      `#field-${QD.strExtensionJustif} za-textarea z-textarea`,
    ) as HTMLElement | null;
    expect(objTextarea?.getAttribute('max-length')).toBe(String(INT_MAX_TEXTO));
  });

  // ── ACT-012-01 · reenviar la prórroga corregida ───────────────────────────────────────────────

  it('ACT-012-01 · con el formulario completo y una fecha válida, completa la tarea con REENVIAR', async () => {
    await montar();

    // La precarga deja los cuatro campos de S2 completos y con fecha futura, así que el gate ya está
    // habilitado sin tocar nada. Este caso es el que delató que `blnPuedeReenviar` leía `form.valid`
    // —un getter, no un signal— y por lo tanto se quedaba con el `false` de la primera evaluación.
    expect(objPantalla.blnPuedeReenviar()).toBe(true);

    objPantalla.reenviar();
    await asentar();

    const dicPayload = dicPayloadEnviado();
    expect(dicPayload).not.toBeNull();
    expect(dicPayload![QD.strAction]).toBe('REENVIAR');
    // Los 8 campos viajan, no solo los editables: PM4 espera el caso completo de esta pantalla.
    for (const strCampo of Object.keys(DIC_ROTULOS)) {
      expect(dicPayload![strCampo], `${strCampo} en el payload`).toBe(datosTarea()[strCampo]);
    }
  });

  it('ACT-012-01 · con un campo obligatorio vacío NO completa la tarea', async () => {
    await montar();

    objPantalla.form.get(QD.strExtensionJustif)!.setValue('');
    objPantalla.reenviar();
    await asentar();

    expect(objPantalla.blnPuedeReenviar()).toBe(false);
    expect(objPantalla.strErrorJustif()).toBe('Campo requerido');
    expect(dicPayloadEnviado()).toBeNull();
  });

  it('ACT-012-01 · con la fecha de hoy NO completa la tarea (RUL-012-01 bloquea el envío)', async () => {
    await montar();

    // El complemento del caso del borde: allá se aseveró el `computed`, acá que la regla efectivamente
    // **corta el PUT**. Un `blnFechaValida()` correcto que nadie consultara en `reenviar()` dejaría el
    // otro caso verde y esta pantalla mandando fechas inválidas a PM4.
    objPantalla.form.get(QD.strNewDeadline)!.setValue(isoDesplazado(0));
    objPantalla.reenviar();
    await asentar();

    expect(dicPayloadEnviado()).toBeNull();
  });

  it('los mensajes de error recién aparecen después del primer intento de envío', async () => {
    await montar();

    objPantalla.form.get(QD.strExtensionReason)!.setValue('');
    await asentar();

    // Un formulario recién montado con obligatorios vacíos no se pinta entero en rojo.
    expect(objPantalla.blnIntentoEnvio()).toBe(false);
    expect(objPantalla.strErrorMotivo()).toBe('');

    objPantalla.reenviar();
    await asentar();

    expect(objPantalla.blnIntentoEnvio()).toBe(true);
    expect(objPantalla.strErrorMotivo()).toBe('Campo requerido');
    expect(dicPayloadEnviado()).toBeNull();
  });

  // ── ACT-012-02 · cancelar la prórroga (la salida de excepción) ─────────────────────────────────

  it('ACT-012-02 · ⚠ cancela con los campos de S2 VACÍOS (no valida nada, y es el contrato)', async () => {
    await montar();

    // El escenario real de ACT-012-02 es "no se puede corregir", así que S2 está sin completar. Si
    // alguien le pusiera a `cancelar()` la guarda de `reenviar()` —que es lo que parece correcto
    // leyendo solo RUL-012-01— la salida de excepción quedaría inalcanzable con la suite en verde.
    for (const strCampo of [
      QD.strExtensionReason,
      QD.strNewDeadline,
      QD.strExtensionCounter,
      QD.strExtensionJustif,
    ]) {
      objPantalla.form.get(strCampo)!.setValue('');
    }
    await asentar();
    expect(objPantalla.form.valid).toBe(false);

    objPantalla.cancelar();
    await asentar();

    const dicPayload = dicPayloadEnviado();
    expect(dicPayload).not.toBeNull();
    expect(dicPayload![QD.strAction]).toBe('CANCELAR');
  });

  it('ACT-012-02 · cancelar tampoco enciende los mensajes de error', async () => {
    await montar();

    objPantalla.form.get(QD.strExtensionJustif)!.setValue('');
    objPantalla.cancelar();
    await asentar();

    // Corolario del caso anterior: si `cancelar()` levantara `blnIntentoEnvio`, el usuario vería el
    // formulario pintarse en rojo justo mientras la pantalla completa la tarea correctamente.
    expect(objPantalla.blnIntentoEnvio()).toBe(false);
    expect(objPantalla.strErrorJustif()).toBe('');
    expect(dicPayloadEnviado()).not.toBeNull();
  });

  // ── Estados de la pantalla ────────────────────────────────────────────────────────────────────

  it('muestra el error de carga y ningún campo cuando la tarea falla', async () => {
    fijarQueryString(`?task_id=${INT_TASK_ID}`);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
      ],
    });
    objFixture = TestBed.createComponent(ErrorFuncionalProrroga);
    objPantalla = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);
    objFixture.detectChanges();
    objMock
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush({ message: 'Tarea no encontrada' }, { status: 404, statusText: 'Not Found' });
    await drenarPeticiones();

    expect(objPantalla.strError()).toBeTruthy();
    expect((objFixture.nativeElement as HTMLElement).textContent ?? '').toContain(
      'Error al cargar el formulario',
    );
    // La rama del error reemplaza al formulario entero: no hay campos donde escribir un dato que no
    // se va a poder enviar.
    expect(objFixture.debugElement.queryAll(By.css('zds-input'))).toHaveLength(0);
  });

  it('FLD-203 · el sufijo del intento solo aparece si la tarea lo trajo', async () => {
    const dicSinIntento = { ...datosTarea(), [QD.strExtCurrentAttempt]: '' };
    await montar(dicSinIntento);

    expect(objPantalla.strIntentoActual()).toBe('');
    expect((objFixture.nativeElement as HTMLElement).textContent ?? '').not.toContain(
      'Intento actual',
    );
  });

  it('FLD-203 · con el intento presente, la alerta de S1 lo nombra', async () => {
    await montar();

    expect(objPantalla.strIntentoActual()).toBe('2');
    const strTexto = (objFixture.nativeElement as HTMLElement).textContent ?? '';
    expect(strTexto).toContain('Intento actual');
    expect(strTexto).toContain('#2');
  });
});
