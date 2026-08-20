import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController, TestRequest, provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Component, ErrorHandler, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GLOBAL_COLLECTIONS } from '../../../../core/collections';
import { DEFAULT_COUNTRY_CODE, QD } from '../fields/fields';
import { RGX_SOLO_LETRAS, SeccionConsumidor } from './seccion-consumidor';

/**
 * S2 · Datos del Consumidor Financiero — **un caso por regla**, no un smoke.
 *
 * ── Por qué esta sección tiene spec propio y no se cubre desde la pantalla ───────────────────────
 * Porque sus seis efectos son **reglas de negocio con nombre de anexo** (RUL-000-02/03, -09, -10,
 * FLD-315, FLD-320/321/322) y todas se degradan **sin poner rojo nada** de
 * `crear-recibir-queja.spec.ts`: ese archivo llena los obligatorios con `patchValue` y asevera sobre la
 * petición que sale al backend, así que un default que dejó de sembrarse o un país que se movió viajan
 * igual en el payload y el submit sigue verde. La única de las seis que la pantalla toca de refilón es
 * RUL-000-09, y solo porque le **estorba** al fixture (ver el ⚠ de `llenarObligatorios()` allá).
 *
 * ── Lo que se asevera es el `FormControl`, no el shadow DOM ──────────────────────────────────────
 * Los seis efectos escriben sobre el form del padre; ninguno pinta nada por su cuenta. Y bajo jsdom
 * los custom elements de Lit no hacen upgrade (trampa 2 de `docs/guides/testing-conventions.md`), así
 * que el DOM de un `zds-select` está vacío de todos modos. Las dos ramas de `@if` (natural/jurídica)
 * sí se leen del DOM, porque ahí lo aseverable es **qué se montó**, y eso el control no lo dice.
 *
 * ── ⚠ `HttpTestingController.match()` es DESTRUCTIVO ────────────────────────────────────────────
 * Saca de la cola lo que devuelve. Cualquier helper de acá construido sobre `match()` **consume** la
 * petición, así que quien después la quiera responder tiene que hacerlo sobre el `TestRequest` que el
 * helper devuelve, no volver a buscarla con un `expectOne` — que fallaría con
 * `Expected one matching request […] found none`, un mensaje que se lee como "la sección nunca pidió
 * el catálogo" cuando la verdad es la contraria. Es la trampa que costó cinco casos en
 * `crear-recibir-queja.spec.ts`; queda nombrada acá porque este archivo pide **siete** catálogos.
 */

/** `codigo_tipo_persona` que marca jurídica en `cat_tipo_identificacion`. Ver `STR_COD_JURIDICA`. */
const STR_COD_JURIDICA = '2';

/** Un `codigo_tipo_persona` cualquiera que **no** sea el de jurídica: todo lo demás es natural. */
const STR_COD_NATURAL = '1';

const INT_COL_ID_TYPE = GLOBAL_COLLECTIONS.idType.id;
const INT_COL_DEPARTMENT = GLOBAL_COLLECTIONS.department.id;
const INT_COL_CITY = GLOBAL_COLLECTIONS.city.id;
const INT_COL_PERSON_TYPE = GLOBAL_COLLECTIONS.personType.id;
const INT_COL_SEX = GLOBAL_COLLECTIONS.sex.id;
const INT_COL_LGBTIQ = GLOBAL_COLLECTIONS.lgbtiq.id;
const INT_COL_SPECIAL = GLOBAL_COLLECTIONS.specialCondition.id;

/**
 * Dos de los tres regex de la pantalla, **copiados** de `crear-recibir-queja.ts`.
 *
 * ⚠ Se copian y no se importan porque allá son constantes de módulo privadas. La copia es deuda
 * declarada y acotada: lo que este archivo asevera es **qué mensaje sale por qué clave de error**, no
 * que el regex sea el correcto (eso lo cubre la pantalla, cuyo `llenarObligatorios()` no pasaría con
 * un regex distinto). Si divergen, los casos de patrón siguen siendo válidos: lo único que cambiaría
 * es qué string de entrada hace fallar el control, y las entradas de acá son claramente inválidas para
 * cualquier versión razonable de los dos.
 *
 * `RGX_SOLO_LETRAS` es la excepción y **sí se importa**: desde el arreglo de la obligatoriedad por rama
 * lo exporta `seccion-consumidor.ts`, porque su tabla `CLL_VALIDADORES_PERSONA` lo necesita. Acá se usa
 * el de verdad, así que los cinco campos de nombre del fixture quedan idénticos a los de producción.
 */
const RGX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RGX_CELULAR = /^\d{10}$/;

/**
 * Los 17 controles que S2 toca, con los validadores **reales** de la pantalla
 * (`crear-recibir-queja.ts:236-277`).
 *
 * No es el `FormGroup` completo de SCR-000 (46 controles) a propósito: esta sección solo escribe sobre
 * estos, y montar los 46 acá haría que agregar un campo a otra sección pusiera rojo este archivo.
 *
 * ⚠ **Los validadores no se pueden "aproximar", y dos de ellos parecen al revés de lo que se espera:**
 * - `strIdNumber` lleva **solo `required`**, sin patrón, aunque `DIC_MSG_PATRON` tenga una entrada
 *   suya ("Verifica el formato según el tipo de documento"). Esa entrada está **inalcanzable hoy** y
 *   queda anotada como tal en el caso que la nombra — el validador que la activaría dependería del
 *   tipo de documento y no existe.
 * - `strEmail` falla por **`pattern`**, no por `Validators.email`: la pantalla usa `RGX_EMAIL`. O sea
 *   que un correo mal escrito da el mensaje de formato, no el genérico.
 *
 * ⚠ Los cinco campos de nombre **no llevan `required` en su declaración**, igual que en la pantalla: lo
 * pone `alternarValidadoresPersona()` por rama, y por eso el fixture tiene que arrancar **sin** él — si
 * se lo pusiera acá, los casos de rama pasarían por vacuidad y no verían si el efecto corre. Ver el ⚠
 * de ese método.
 */
function crearForm(): FormGroup {
  return new FormGroup({
    [QD.strIdType]: new FormControl('', [Validators.required]),
    [QD.strIdNumber]: new FormControl('', [Validators.required]),
    [QD.strFirstName]: new FormControl('', [Validators.pattern(RGX_SOLO_LETRAS)]),
    [QD.strLastName]: new FormControl('', [Validators.pattern(RGX_SOLO_LETRAS)]),
    [QD.strCompanyName]: new FormControl(''),
    [QD.strContactFirstName]: new FormControl('', [Validators.pattern(RGX_SOLO_LETRAS)]),
    [QD.strContactLastName]: new FormControl('', [Validators.pattern(RGX_SOLO_LETRAS)]),
    [QD.strEmail]: new FormControl('', [Validators.required, Validators.pattern(RGX_EMAIL)]),
    [QD.strPhone]: new FormControl('', [Validators.required, Validators.pattern(RGX_CELULAR)]),
    [QD.strPersonType]: new FormControl(''),
    [QD.strCountryCode]: new FormControl(''),
    [QD.strDepartment]: new FormControl('', [Validators.required]),
    [QD.strCity]: new FormControl('', [Validators.required]),
    [QD.strAddress]: new FormControl(''),
    [QD.strSex]: new FormControl(''),
    [QD.strLgbtiq]: new FormControl(''),
    [QD.strSpecialCondition]: new FormControl(''),
  });
}

/**
 * Host de la sección, porque sus dos inputs principales son `input.required<...>()`.
 *
 * `sigValores` no se deriva del form con un `computed()`: se replica el idioma de la pantalla real —un
 * `signal` alimentado desde `valueChanges`— porque es **eso** lo que hace que los efectos de la
 * sección se re-disparen. Un `computed()` sobre `form.value` no crearía dependencia (`value` no es un
 * signal) y todos los casos de cascada pasarían por vacuidad.
 */
@Component({
  standalone: true,
  imports: [SeccionConsumidor],
  template: `
    <app-seccion-consumidor
      [form]="form"
      [sigValores]="sigValores"
      [blnIntentoEnvio]="blnIntentoEnvio()"
    />
  `,
})
class HostPrueba {
  readonly form = crearForm();
  readonly sigValores = signal<Record<string, unknown>>(this.form.getRawValue());
  readonly blnIntentoEnvio = signal(false);

  constructor() {
    // Mismo cableado que la pantalla: `getRawValue()` y no `value`, porque el municipio se
    // deshabilita cuando no hay departamento y un control deshabilitado **desaparece** de `value`.
    this.form.valueChanges.subscribe(() => this.sigValores.set(this.form.getRawValue()));
  }
}

/** Un `throw` en un efecto va al ErrorHandler global y **NO** pone rojo el spec. Hay que capturarlo. */
class ErroresDePrueba implements ErrorHandler {
  readonly lstErrores: unknown[] = [];
  handleError(in_genError: unknown): void {
    this.lstErrores.push(in_genError);
  }
}

let objFixture: ComponentFixture<HostPrueba>;
let objHost: HostPrueba;
let objMock: HttpTestingController;
let objErrores: ErroresDePrueba;

/**
 * Deja resolver las promesas pendientes **y** repinta.
 *
 * El macrotask cubre la cadena de `cargar()` (promesa propia de `CollectionService`, que el scheduler
 * no conoce) sin tener que contar cuántos `await` tiene — mismo motivo que documenta el `asentar()` de
 * `crear-recibir-queja.spec.ts`.
 */
async function asentar(): Promise<void> {
  await objFixture.whenStable();
  await new Promise((in_fnListo) => setTimeout(in_fnListo, 0));
  objFixture.detectChanges();
}

/**
 * Responde con `[]` todos los GET de colección pendientes.
 *
 * Se responde vacío porque la mayoría de los casos asevera sobre el control, no sobre las opciones:
 * lo que viaja a PM4 es el **código**. Los casos que sí necesitan registros los responden a mano con
 * `responderCatalogo()` **antes** de llamar a esto.
 *
 * ⚠ Tiene que poder llamarse muchas veces: cada escritura del departamento dispara un GET nuevo del
 * catálogo de municipios, y un drenaje único al montar lo dejaría afuera — el `objMock.verify()` del
 * `afterEach` pondría rojo el caso hablando de la colección 15 y no del código bajo prueba.
 */
function drenarColecciones(): void {
  for (const objReq of objMock.match((in_objReq) => in_objReq.url.includes('/collections/'))) {
    objReq.flush({ data: [], meta: { total: 0 } });
  }
}

/**
 * Los GET pendientes de una colección concreta.
 *
 * ⚠ **Devuelve los `TestRequest` y por eso los consume**: `match()` los saca de la cola. Quien llame
 * a esto se queda con la responsabilidad de responderlos (o de dejarlos sin responder a propósito, si
 * el caso es sobre cuántos se pidieron y no sobre qué contestaron) — `drenarColecciones()` después ya
 * no los va a encontrar. Ver el ⚠ de la cabecera.
 */
function getsDeColeccion(in_intId: number): TestRequest[] {
  return objMock.match((in_objReq) => in_objReq.url === `/api/collections/${in_intId}/records`);
}

/**
 * Responde el (único) GET de una colección con registros crudos de PM4.
 *
 * Los registros van con la forma real —`{ data: { … } }`— porque `CollectionService` resuelve
 * `valueField`/`labelField` por path (`data.codigo`), así que un registro plano produciría opciones
 * con value vacío que el servicio **filtra**, y el caso fallaría diciendo que el catálogo llegó vacío.
 */
function responderCatalogo(in_intId: number, in_cllRegistros: Record<string, unknown>[]): void {
  const cllGets = getsDeColeccion(in_intId);
  expect(cllGets.length).toBeGreaterThan(0);
  for (const objReq of cllGets) {
    objReq.flush({ data: in_cllRegistros, meta: { total: in_cllRegistros.length } });
  }
}

/** Un registro de `cat_tipo_identificacion` con su columna `codigo_tipo_persona`. */
function tipoDoc(
  in_strCodigo: string,
  in_strDesc: string,
  in_strTipoPersona: string,
): Record<string, unknown> {
  return {
    data: {
      codigo: in_strCodigo,
      descripcion: in_strDesc,
      codigo_tipo_persona: in_strTipoPersona,
    },
  };
}

/** Un registro de catálogo plano `{codigo, descripcion}` — sexo, LGBTIQ+, condición, tipo de persona. */
function catPlano(in_strCodigo: string, in_strDesc: string): Record<string, unknown> {
  return { data: { codigo: in_strCodigo, descripcion: in_strDesc } };
}

/**
 * Monta el host y deja los siete catálogos respondidos vacíos.
 *
 * Los casos que necesitan registros reales llaman `responderCatalogo()` **antes** del primer
 * `drenarColecciones()`, o sea pasando `in_fnResponder`.
 */
async function montar(in_fnResponder?: () => void): Promise<void> {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ErrorHandler, useValue: objErrores },
    ],
  });

  objFixture = TestBed.createComponent(HostPrueba);
  objHost = objFixture.componentInstance;
  objMock = TestBed.inject(HttpTestingController);

  // Bajo `provideZonelessChangeDetection()` `createComponent()` por sí solo no corre los efectos, así
  // que sin esta línea la cola está genuinamente vacía y `responderCatalogo()` falla con "found none"
  // — un fallo que se lee como "la sección no pide catálogos" cuando es el test el que no la arrancó.
  objFixture.detectChanges();
  await asentar();

  in_fnResponder?.();
  drenarColecciones();
  await asentar();
}

/** Escribe en el form del host **por el canal real** (el control), para que `sigValores` se mueva. */
async function escribir(in_dicValores: Record<string, unknown>): Promise<void> {
  objHost.form.patchValue(in_dicValores);
  await asentar();
}

function leer(in_strCampo: string): unknown {
  return objHost.form.getRawValue()[in_strCampo];
}

/** La instancia de la sección, para llamar a sus miembros `protected` (visibilidad de TS, no runtime). */
function seccion(): SeccionConsumidor {
  return objFixture.debugElement.children[0].componentInstance as SeccionConsumidor;
}

/**
 * `true` si la sección montó el campo de ese nombre.
 *
 * ⚠ **Se pregunta por el elemento y su `[name]`, NO por el texto de la etiqueta**, y no es una
 * preferencia de estilo: la etiqueta de un `zds-input` viaja a `lib-input-text-z`, un custom element de
 * Lit que **bajo jsdom no hace upgrade** (trampa 2 de `docs/guides/testing-conventions.md`), así que su
 * shadow DOM está vacío y `textContent` no la contiene. Un caso que aseverara
 * `textoDom()).toContain('Razón social')` fallaría **con la rama correcta montada** —el fallo se lee
 * como "el `@if` no abrió" cuando lo que pasó es que nadie pintó el label— y, peor, su negación
 * (`not.toContain`) pasaría **siempre**, con la rama abierta o cerrada. El `[name]` sí queda en el DOM
 * porque es un binding del wrapper propio, no del componente de la lib.
 */
function montoCampo(in_strCampo: string): boolean {
  return (objFixture.nativeElement as HTMLElement)
    .querySelector(`[name="${in_strCampo}"]`) !== null;
}

beforeEach(() => {
  objErrores = new ErroresDePrueba();
  // Los GET de colección loguean el PMQL y el conteo por consola (es diagnóstico de dev, ver
  // `CollectionService`): sin silenciarlos, 30 casos × 7 catálogos ensucian la salida hasta tapar el
  // fallo real. `() => undefined` y no `vi.fn()` pelado, para no acumular llamadas que nadie lee.
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  // `verify()` es la mitad que atrapa los GET de más: es lo que destapó las **seis** peticiones
  // idénticas a la colección 15 que tenía `aplicarCascadaMunicipio()` sin guarda.
  objMock.verify();
  expect(objErrores.lstErrores).toEqual([]);
  vi.restoreAllMocks();
  TestBed.resetTestingModule();
});

describe('S2 · carga de catálogos', () => {
  it('pide los seis catálogos independientes al montar, y NO el de municipios', async () => {
    // ⚠ La ausencia del séptimo es la mitad aseverable: `city` tiene `dependsOn: qd_strDepartment`, y
    // sin departamento `CollectionService.cargar()` sale sin pedir nada. Si alguien lo agregara al
    // `vincular()` junto a los otros seis, el primer GET saldría con el PMQL filtrando por `""` —que
    // devuelve 0 registros— y el select de municipio quedaría vacío para siempre sin error visible.
    objFixture = TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ErrorHandler, useValue: objErrores },
      ],
    }).createComponent(HostPrueba);
    objHost = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);
    objFixture.detectChanges();
    await asentar();

    for (const intId of [
      INT_COL_ID_TYPE, INT_COL_DEPARTMENT, INT_COL_PERSON_TYPE,
      INT_COL_SEX, INT_COL_LGBTIQ, INT_COL_SPECIAL,
    ]) {
      expect(getsDeColeccion(intId).length, `colección ${intId}`).toBe(1);
    }
    // El de municipios: **ni uno**, y la aserción nombra el motivo por si se pone roja.
    expect(
      `GETs a la colección de municipios sin departamento: ${getsDeColeccion(INT_COL_CITY).length}`,
    ).toBe('GETs a la colección de municipios sin departamento: 0');

    drenarColecciones();
    await asentar();
  });

  it('carga los catálogos una sola vez, aunque el form se escriba muchas veces', async () => {
    // La guarda `blnVinculado`: el efecto de vinculación depende de `this.form()`, pero
    // `vincular()` engancha siete `sincronizarDesc()` y dispara seis GET. Sin la guarda, cada
    // re-corrida del efecto los repetiría.
    await montar();

    await escribir({ [QD.strIdNumber]: '1020304050' });
    await escribir({ [QD.strEmail]: 'a@b.com' });
    await escribir({ [QD.strPhone]: '3001234567' });

    // Ningún GET nuevo de los seis independientes: los tres `escribir()` no tocaron el departamento.
    for (const intId of [
      INT_COL_ID_TYPE, INT_COL_DEPARTMENT, INT_COL_PERSON_TYPE,
      INT_COL_SEX, INT_COL_LGBTIQ, INT_COL_SPECIAL,
    ]) {
      expect(getsDeColeccion(intId).length, `colección ${intId} recargada`).toBe(0);
    }
  });
});

describe('RUL-000-09 · cascada Departamento → Municipio', () => {
  it('pide el catálogo de municipios con el PMQL del departamento elegido', async () => {
    await montar();

    await escribir({ [QD.strDepartment]: '11' });

    const cllGets = getsDeColeccion(INT_COL_CITY);
    expect(cllGets.length).toBe(1);
    // El PMQL es el criterio: un GET sin él traería los 1000+ municipios del país.
    expect(cllGets[0].request.params.get('pmql')).toBe('data.codigo_departamento = "11"');
    cllGets[0].flush({ data: [], meta: { total: 0 } });
    await asentar();
  });

  it('vacía el municipio elegido cuando cambia el departamento', async () => {
    // La regla del anexo, textual: "al cambiar Departamento se limpia Municipio". El municipio
    // pertenece al departamento, así que conservarlo produciría una dirección que no existe.
    await montar();

    await escribir({ [QD.strDepartment]: '11' });
    drenarColecciones();
    await asentar();

    await escribir({ [QD.strCity]: '11001' });
    expect(leer(QD.strCity)).toBe('11001');

    await escribir({ [QD.strDepartment]: '05' });

    expect(leer(QD.strCity)).toBe('');
    drenarColecciones();
    await asentar();
  });

  it('⚠ NO refresca el catálogo de municipios cuando se escribe un campo cualquiera', async () => {
    // **Primera mitad del defecto que este spec destapó.** El efecto depende de `sigValores()`, que se
    // mueve en **cada** escritura de los 46 controles de la pantalla, no solo del departamento. Sin la
    // guarda `strDeptoCargado`, cada tecla de cualquier campo disparaba un GET de 1000+ registros con
    // el mismo PMQL — `CollectionService.cargar()` no deduplica, a propósito.
    await montar();

    await escribir({ [QD.strDepartment]: '11' });
    drenarColecciones();
    await asentar();

    await escribir({ [QD.strIdNumber]: '1020304050' });
    await escribir({ [QD.strEmail]: 'ciudadano@example.com' });
    await escribir({ [QD.strPhone]: '3001234567' });

    expect(
      `GETs de municipio por tres escrituras ajenas: ${getsDeColeccion(INT_COL_CITY).length}`,
    ).toBe('GETs de municipio por tres escrituras ajenas: 0');
  });

  it('⚠ el municipio elegido SOBREVIVE a la escritura de un campo cualquiera', async () => {
    // **Segunda mitad del mismo defecto, y la que se veía en producción.** La limpieza estaba fuera de
    // la guarda con el argumento de que "es la regla de negocio y tiene que correr siempre que el
    // efecto corra", y era falso: el efecto corre por cualquier escritura. O sea que elegir municipio
    // y después tocar **otro** campo lo borraba, y el ciudadano perdía el dato con el form marcándole
    // el municipio en rojo sin motivo visible. Se destapó cuando `llenarObligatorios()` dejaba
    // `qd_strCity` con `{required: true}` sosteniendo el valor que se le acababa de escribir.
    //
    // Los dos casos van juntos porque los dos lados del `if` son **la misma regla**, no una regla y
    // una optimización: el catálogo se recarga y el municipio se vacía *cuando el departamento cambió*.
    await montar();

    await escribir({ [QD.strDepartment]: '11' });
    drenarColecciones();
    await asentar();
    await escribir({ [QD.strCity]: '11001' });

    await escribir({ [QD.strIdNumber]: '1020304050' });
    await escribir({ [QD.strFirstName]: 'Nelson' });

    expect(leer(QD.strCity)).toBe('11001');
    expect(objHost.form.get(QD.strCity)?.valid).toBe(true);
  });

  it('deshabilita el municipio mientras no haya departamento, y lo habilita después', async () => {
    // `zds-select` **no tiene input `disabled`** (el `disable` sin "d" que declara la lib nunca se
    // lee), así que el único canal real es el estado del `FormControl`. Aseverar sobre el DOM acá no
    // serviría: bajo jsdom el custom element no hace upgrade.
    await montar();

    expect(objHost.form.get(QD.strCity)?.disabled).toBe(true);

    await escribir({ [QD.strDepartment]: '11' });
    expect(objHost.form.get(QD.strCity)?.enabled).toBe(true);

    drenarColecciones();
    await asentar();

    await escribir({ [QD.strDepartment]: '' });
    expect(objHost.form.get(QD.strCity)?.disabled).toBe(true);
  });

  it('el placeholder del municipio dice por qué está bloqueado', async () => {
    // Sin departamento el select además está gris, así que el texto es la única pista de por qué.
    // "Seleccione municipio..." sobre un control deshabilitado se lee como un error de la pantalla.
    await montar();

    expect(seccion()['strPlaceholderMunicipio']()).toBe('Seleccione primero el departamento');

    await escribir({ [QD.strDepartment]: '11' });
    expect(seccion()['strPlaceholderMunicipio']()).toBe('Seleccione municipio...');

    drenarColecciones();
    await asentar();
  });
});

describe('RUL-000-02/03 · tipo de persona derivado del tipo de documento', () => {
  /** Monta con `cat_tipo_identificacion` real: NIT jurídico ('2') y CC natural ('1'). */
  async function montarConTiposDoc(): Promise<void> {
    await montar(() => {
      responderCatalogo(INT_COL_ID_TYPE, [
        tipoDoc('1', 'Cédula de ciudadanía', STR_COD_NATURAL),
        tipoDoc('31', 'NIT', STR_COD_JURIDICA),
      ]);
      responderCatalogo(INT_COL_PERSON_TYPE, [
        catPlano(STR_COD_NATURAL, 'Natural'),
        catPlano(STR_COD_JURIDICA, 'Jurídica'),
      ]);
    });
  }

  it('con documento natural monta nombres y apellidos, y NO razón social', async () => {
    await montarConTiposDoc();

    await escribir({ [QD.strIdType]: '1' });

    expect(seccion()['blnEsJuridica']()).toBe(false);
    expect(montoCampo(QD.strFirstName)).toBe(true);
    expect(montoCampo(QD.strLastName)).toBe(true);
    expect(montoCampo(QD.strCompanyName)).toBe(false);
  });

  it('con documento jurídico monta razón social y contacto, y NO nombres del titular', async () => {
    // La rama se decide por la columna `codigo_tipo_persona` del registro elegido, no por el código
    // del documento: negocio puede reordenar `cat_tipo_identificacion` sin avisar.
    await montarConTiposDoc();

    await escribir({ [QD.strIdType]: '31' });

    expect(seccion()['blnEsJuridica']()).toBe(true);
    expect(montoCampo(QD.strCompanyName)).toBe(true);
    expect(montoCampo(QD.strContactFirstName)).toBe(true);
    expect(montoCampo(QD.strContactLastName)).toBe(true);
    expect(montoCampo(QD.strFirstName)).toBe(false);
  });

  it('FLD-315 · escribe el CÓDIGO derivado en qd_strPersonType, y la etiqueta en su `_desc`', async () => {
    // El BPM bifurca por el código; la etiqueta viaja aparte, en el compañero `_desc` de la convención
    // del proyecto (`MAPEO_qd_old_new.md`). Escribir la etiqueta en el campo del código dejaría al
    // proceso sin poder decidir la rama, y es un error que **no se ve en pantalla**: la celda de solo
    // lectura muestra "Jurídica" igual, porque lo que pinta es `strTipoPersonaDesc()`, no el control.
    //
    // ⚠ El `_desc` se asevera **presente**, no ausente: `sincronizarDesc()` **crea** el control si no
    // existe, así que un `toBeUndefined()` acá no aseveraría "la etiqueta no contamina el código" sino
    // que fallaría por el mecanismo mismo que hace viajar la etiqueta.
    await montarConTiposDoc();

    await escribir({ [QD.strIdType]: '31' });

    expect(leer(QD.strPersonType)).toBe(STR_COD_JURIDICA);
    expect(leer(`${QD.strPersonType}_desc`)).toBe('Jurídica');
    expect(seccion()['strTipoPersonaDesc']()).toBe('Jurídica');
  });

  it('sin catálogo cargado NO deriva nada, aunque haya un tipo de documento precargado', async () => {
    // Al montar un caso precargado, un valor sin catálogo todavía **no** significa "este documento no
    // tiene tipo de persona". Derivar ahí escribiría `''` sobre `qd_strPersonType` y pisaría el valor
    // que el BPM ya había resuelto en otra pantalla.
    await montar(() => {
      // El catálogo de tipos de documento responde **vacío** a propósito.
      responderCatalogo(INT_COL_ID_TYPE, []);
    });

    objHost.form.get(QD.strPersonType)?.setValue(STR_COD_JURIDICA);
    await escribir({ [QD.strIdType]: '31' });

    expect(leer(QD.strPersonType)).toBe(STR_COD_JURIDICA);
    expect(seccion()['blnEsJuridica']()).toBe(false);
  });

  it('el tipo de persona se pinta de SOLO LECTURA, no como select', async () => {
    // Es derivado: dejarlo editable permitiría un caso con "CC" + "Jurídica", que es exactamente la
    // combinación que RUL-000-02/03 existe para impedir.
    await montarConTiposDoc();

    await escribir({ [QD.strIdType]: '31' });

    const objRo = (objFixture.nativeElement as HTMLElement).querySelector('app-pqr-readonly');
    expect(objRo?.textContent).toContain('Tipo de persona');
    expect(objRo?.textContent).toContain('Jurídica');
    // Y ningún select apuntando al campo derivado.
    expect(
      (objFixture.nativeElement as HTMLElement)
        .querySelector(`zds-select[name="${QD.strPersonType}"]`),
    ).toBeNull();
  });
});

/**
 * La obligatoriedad de los cinco nombres, que es de la rama — `alternarValidadoresPersona()`.
 *
 * ── Qué se asevera acá y qué NO puede aseverarse bajo jsdom ──────────────────────────────────────
 * Los dos bugs que este método arregla nacen de un closure que el DS **compone** sobre el control real
 * y que sobrevive al desmontaje del widget (`errorRequired` con el `model` congelado en `''`). Ese
 * closure **no se puede reproducir en estos casos**: los custom elements de Lit no hacen upgrade bajo
 * jsdom, así que `lib-input-text-z` nunca corre su `ngOnInit` y nunca compone nada. Fingirlo con un
 * `setValidators` a mano probaría que nuestro `setValidators` gana contra un validador que nosotros
 * mismos pusimos — un test tautológico.
 *
 * Lo que sí es aseverable, y es lo que decide los dos bugs, es **la tabla**: que la columna de la rama
 * quede aplicada sobre el `FormGroup` y que la de la otra rama **se vaya**. Con eso, el estado final
 * del control es el correcto sin importar qué le compuso el DS antes, que es justamente el argumento
 * del arreglo. La prueba de que el closure existía es la medición en el navegador que documenta el
 * método; acá se asevera el invariante que la vuelve inofensiva.
 */
describe('RUL-000-02/03 · la obligatoriedad de los nombres sigue a la rama', () => {
  async function montarConTiposDoc(): Promise<void> {
    await montar(() => {
      responderCatalogo(INT_COL_ID_TYPE, [
        tipoDoc('1', 'Cédula de ciudadanía', STR_COD_NATURAL),
        tipoDoc('31', 'NIT', STR_COD_JURIDICA),
      ]);
      responderCatalogo(INT_COL_PERSON_TYPE, [
        catPlano(STR_COD_NATURAL, 'Natural'),
        catPlano(STR_COD_JURIDICA, 'Jurídica'),
      ]);
    });
  }

  /** `true` si el control exige valor, preguntándoselo al validador y no a una lista de identidades. */
  function exigeValor(in_strCampo: string): boolean {
    return !!objHost.form.get(in_strCampo)?.hasError('required');
  }

  it('al montar, sin documento elegido, los obligatorios son los de persona NATURAL', async () => {
    // La rama inicial es la natural porque al abrir no hay documento — y el guardia arranca en `''`
    // justamente para que esta primera aplicación ocurra sin esperar un cambio de tipo.
    await montarConTiposDoc();

    expect(exigeValor(QD.strFirstName)).toBe(true);
    expect(exigeValor(QD.strLastName)).toBe(true);
    expect(exigeValor(QD.strCompanyName)).toBe(false);
    expect(exigeValor(QD.strContactFirstName)).toBe(false);
    expect(exigeValor(QD.strContactLastName)).toBe(false);
  });

  it('⚠ con NIT, los nombres del titular DEJAN de ser obligatorios y el form se puede enviar', async () => {
    // Éste es el bug #1: antes, `qd_strFirstName`/`qd_strLastName` quedaban inválidos **estando
    // desmontados**, así que el form nunca era válido y "Enviar" no hacía nada. Y no había nada en rojo
    // que lo explicara, porque `scrollToFirstError()` busca el `id` de un campo que no está en el DOM.
    await montarConTiposDoc();

    await escribir({ [QD.strIdType]: '31' });

    expect(exigeValor(QD.strFirstName)).toBe(false);
    expect(exigeValor(QD.strLastName)).toBe(false);
    // Y la obligatoriedad se mudó al bloque que sí está montado, no desapareció.
    expect(exigeValor(QD.strCompanyName)).toBe(true);
    expect(exigeValor(QD.strContactFirstName)).toBe(true);
    expect(exigeValor(QD.strContactLastName)).toBe(true);
  });

  it('⚠ volviendo de NIT a Cédula, un nombre con texto correcto queda VÁLIDO', async () => {
    // Éste es el bug #2, y es el que se veía en pantalla: los campos decían "Campo requerido" con
    // "Nelson" y "Bravo" escritos. Se asevera sobre `valid` y no sobre `hasError('required')` para que
    // el caso cubra **cualquier** clave de error pegada al control, que es la forma real del defecto
    // (la clave del DS era `errorRequired`, no `required`).
    await montarConTiposDoc();

    await escribir({ [QD.strIdType]: '31' });
    await escribir({ [QD.strIdType]: '1', [QD.strFirstName]: 'Nelson', [QD.strLastName]: 'Bravo' });

    expect(objHost.form.get(QD.strFirstName)?.valid).toBe(true);
    expect(objHost.form.get(QD.strLastName)?.valid).toBe(true);
  });

  it('el `pattern` sobrevive a los dos cruces: sigue siendo "solo letras" en las dos ramas', async () => {
    // La tabla escribe la columna **completa**, así que el riesgo real de este arreglo es perder por el
    // camino un validador que no es de la rama. "Solo letras" es del dato, no de la rama: un apellido
    // con números tiene que fallar tanto con CC como con NIT.
    await montarConTiposDoc();

    await escribir({ [QD.strIdType]: '31', [QD.strContactLastName]: 'Bravo123' });
    expect(objHost.form.get(QD.strContactLastName)?.hasError('pattern')).toBe(true);

    await escribir({ [QD.strIdType]: '1', [QD.strLastName]: 'Bravo123' });
    expect(objHost.form.get(QD.strLastName)?.hasError('pattern')).toBe(true);
  });

  it('la obligatoriedad de la rama SOBREVIVE a la escritura de otro campo', async () => {
    // El efecto corre con cada tecla de cualquiera de los 46 controles, así que lo aseverable es que
    // pasar por él muchas veces no degrade el estado: la columna de la rama sigue puesta después de
    // escribir un campo que no tiene nada que ver.
    //
    // ⚠ **Esto NO asevera el guardia de rama**, y conviene decirlo acá porque el nombre del test se
    // presta a creer lo contrario. Mutación verificada: comentando el `if (strRama === ...) return;` la
    // suite queda **verde, 1304/1304**. El daño real de perder el guardia es que la reescritura por
    // tecla borra el validador que el DS **compuso** sobre el control mientras el widget está montado,
    // y bajo jsdom los custom elements de Lit no hacen upgrade, así que el DS no compone nada y no hay
    // nada que borrar — el escenario que lo distinguiría no existe en este entorno. El guardia se
    // conserva por el argumento de diseño (y por paridad con `alternarValidadoresDetalle()`, que lo
    // documenta igual), no porque un test lo defienda. Si algún día la fachada se prueba con los
    // componentes del DS montados de verdad, **este** es el párrafo que hay que leer.
    await montarConTiposDoc();
    await escribir({ [QD.strIdType]: '31' });

    await escribir({ [QD.strAddress]: 'Calle 1' });

    expect(exigeValor(QD.strCompanyName)).toBe(true);
    expect(exigeValor(QD.strFirstName)).toBe(false);
  });
});

describe('FLD-320/321/322 · los tres defaults que se resuelven contra su catálogo', () => {
  it('siembra sexo, LGBTIQ+ y condición especial buscando su etiqueta', async () => {
    // Se buscan **por etiqueta** y no por código fijo porque el código de "No aplica" es distinto en
    // cada colección y negocio lo puede reordenar. Los códigos de este fixture (`9`, `7`, `8`) son
    // deliberadamente distintos entre sí y ninguno es `1`: un default hardcodeado los fallaría.
    await montar(() => {
      responderCatalogo(INT_COL_SEX, [catPlano('1', 'Masculino'), catPlano('9', 'No Aplica')]);
      responderCatalogo(INT_COL_LGBTIQ, [catPlano('1', 'Sí'), catPlano('7', 'No')]);
      responderCatalogo(INT_COL_SPECIAL, [
        catPlano('1', 'Discapacidad'),
        catPlano('8', 'Ninguna - No aplica'),
      ]);
    });

    expect(leer(QD.strSex)).toBe('9');
    expect(leer(QD.strLgbtiq)).toBe('7');
    expect(leer(QD.strSpecialCondition)).toBe('8');
  });

  it('⚠ el regex de LGBTIQ+ está ANCLADO: "No aplica" y "Ninguno" no valen como "No"', async () => {
    // `/^no$/i` y no `/no/i`: un regex suelto haría match con la primera etiqueta que **contenga**
    // "no", y en un catálogo donde "No aplica" o "Ninguno" van antes que "No" sembraría el código
    // equivocado. Que el valor correcto vaya **último** en este fixture es lo que hace aseverable el
    // ancla: sin ella el caso se pone rojo con el código de "No aplica".
    await montar(() => {
      responderCatalogo(INT_COL_LGBTIQ, [
        catPlano('5', 'No aplica'),
        catPlano('6', 'Ninguno'),
        catPlano('7', 'No'),
      ]);
    });

    expect(leer(QD.strLgbtiq)).toBe('7');
  });

  it('⚠ el regex de sexo y condición NO está anclado: matchea "No aplica" con prefijo', async () => {
    // La contracara del caso de arriba, y por qué los tres regex **no** se unifican: las etiquetas
    // reales de sexo y condición traen prefijos y sufijos ("3. No aplica", "Ninguna - No aplica"), así
    // que un `/^no aplica$/i` no encontraría nada y el campo viajaría vacío al BPM.
    await montar(() => {
      responderCatalogo(INT_COL_SEX, [catPlano('1', 'Masculino'), catPlano('9', '3. No Aplica')]);
      responderCatalogo(INT_COL_SPECIAL, [catPlano('8', 'Ninguna - No aplica')]);
    });

    expect(leer(QD.strSex)).toBe('9');
    expect(leer(QD.strSpecialCondition)).toBe('8');
  });

  it('NO pisa un valor que el caso ya traía precargado', async () => {
    // La guarda de vacío: SCR-009 sí deja elegir estos tres, así que un caso que vuelve de allá tiene
    // que conservar lo que negocio respondió. Sembrar encima perdería el dato sin avisar.
    objFixture = TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ErrorHandler, useValue: objErrores },
      ],
    }).createComponent(HostPrueba);
    objHost = objFixture.componentInstance;
    objMock = TestBed.inject(HttpTestingController);

    // Se siembra **antes** del primer `detectChanges()`, que es cuando corren los efectos: así el
    // valor está puesto cuando el catálogo llega, igual que en una precarga real desde `task.data`.
    objHost.form.get(QD.strSex)?.setValue('1');
    objHost.form.get(QD.strLgbtiq)?.setValue('1');

    objFixture.detectChanges();
    await asentar();
    responderCatalogo(INT_COL_SEX, [catPlano('1', 'Masculino'), catPlano('9', 'No Aplica')]);
    responderCatalogo(INT_COL_LGBTIQ, [catPlano('1', 'Sí'), catPlano('7', 'No')]);
    drenarColecciones();
    await asentar();

    expect(leer(QD.strSex)).toBe('1');
    expect(leer(QD.strLgbtiq)).toBe('1');
  });

  it('con el catálogo vacío deja el campo vacío en vez de inventar un código', async () => {
    await montar();

    expect(leer(QD.strSex)).toBe('');
    expect(leer(QD.strLgbtiq)).toBe('');
    expect(leer(QD.strSpecialCondition)).toBe('');
  });
});

describe('RUL-000-10 · el país queda fijo en Colombia', () => {
  it('siembra el código de país aunque el campo no tenga widget', async () => {
    await montar();

    expect(leer(QD.strCountryCode)).toBe(DEFAULT_COUNTRY_CODE);
  });

  it('lo RE-ESCRIBE si algo lo movió', async () => {
    // No alcanza con sembrarlo en `SCR000_DEFAULTS`: el campo no tiene widget, así que si un
    // `patchValue` de precarga o un watcher lo mueve, nadie lo corregiría y el payload viajaría con un
    // país que la pantalla no ofrece elegir. `LOCK_COUNTRY` es el opt-out y es *opt-out*: apagarlo
    // requiere escribir literalmente `false`.
    await montar();

    await escribir({ [QD.strCountryCode]: '999' });

    expect(leer(QD.strCountryCode)).toBe(DEFAULT_COUNTRY_CODE);
  });
});

describe('mensajes de error', () => {
  it('no pinta ningún mensaje antes del primer intento de envío', async () => {
    // Los ~20 obligatorios arrancan vacíos: sin esta guarda la pantalla se abriría **en rojo entero**
    // antes de que nadie escriba nada.
    await montar();

    expect(objHost.form.get(QD.strIdNumber)?.valid).toBe(false);
    expect(seccion()['mensajeDeError'](QD.strIdNumber)).toBe('');
  });

  it('después del intento de envío dice "Campo requerido" en los vacíos', async () => {
    await montar();

    objHost.blnIntentoEnvio.set(true);
    await asentar();

    expect(seccion()['mensajeDeError'](QD.strIdNumber)).toBe('Campo requerido');
    expect(seccion()['mensajeDeError'](QD.strEmail)).toBe('Campo requerido');
  });

  it('⚠ cada campo con patrón dice QUÉ se espera, no un "Formato inválido" genérico', async () => {
    // La mitad del valor del mensaje está en el texto: "exactamente 10 dígitos" le dice al ciudadano
    // qué corregir, "Formato inválido" lo deja adivinando. Se aseveran los tres textos distintos, así
    // que unificarlos en uno solo pone rojo el caso nombrando el campo.
    await montar();
    objHost.blnIntentoEnvio.set(true);

    await escribir({
      [QD.strEmail]: 'no-es-un-correo',
      [QD.strPhone]: '300',
      [QD.strFirstName]: 'Nelson123',
    });

    expect(seccion()['mensajeDeError'](QD.strPhone))
      .toBe('Debe contener exactamente 10 dígitos');
    expect(seccion()['mensajeDeError'](QD.strFirstName)).toBe('Solo letras');
    // ⚠ El correo va por **`pattern`**, no por `Validators.email`: la pantalla lo valida con
    // `RGX_EMAIL`. O sea que un correo mal escrito da el mensaje de formato y no el genérico — lo
    // contrario de lo que sugiere el nombre del validador que uno esperaría encontrar ahí.
    expect(seccion()['mensajeDeError'](QD.strEmail))
      .toBe('Formato esperado: usuario@dominio.com');
  });

  it('un campo inválido por algo que NO es patrón cae al mensaje de requerido', async () => {
    // Fija la rama del `hasError('pattern')`: `strIdType` solo tiene `required`, así que vacío da el
    // mensaje genérico. Si alguien cambiara ese `hasError` por un `!valid`, el mensaje de patrón se
    // pintaría en campos que no tienen patrón y este caso se pone rojo.
    await montar();
    objHost.blnIntentoEnvio.set(true);
    await asentar();

    expect(objHost.form.get(QD.strIdType)?.hasError('required')).toBe(true);
    expect(seccion()['mensajeDeError'](QD.strIdType)).toBe('Campo requerido');
  });

  it('⚠ la entrada de DIC_MSG_PATRON del número de documento está INALCANZABLE hoy', async () => {
    // **Es una anomalía documentada, no un caso que celebre el comportamiento.** `DIC_MSG_PATRON`
    // tiene una entrada para `strIdNumber` ("Verifica el formato según el tipo de documento"), pero el
    // control lleva **solo `required`** (`crear-recibir-queja.ts:237`): no hay ningún `pattern` que la
    // pueda activar, así que un número con letras es *válido* para el form y el mensaje nunca sale.
    //
    // Se asevera el estado real —no el deseable— para que quede fijado: si alguien agrega el validador
    // que falta (el patrón dependería del tipo de documento, que es por qué no está), este caso se pone
    // rojo y obliga a decidirlo a propósito en vez de descubrirlo por accidente. Es el mismo criterio
    // que el resto de la migración: un hueco preexistente se **reporta**, no se arregla de contrabando.
    await montar();
    objHost.blnIntentoEnvio.set(true);

    await escribir({ [QD.strIdNumber]: 'abc-no-es-un-numero' });

    expect(objHost.form.get(QD.strIdNumber)?.hasError('pattern')).toBe(false);
    expect(seccion()['mensajeDeError'](QD.strIdNumber)).toBe('');
  });

  it('⚠ el mensaje DESAPARECE al corregir el campo, sin tocar nada más', async () => {
    // `form.get().valid` **no es un signal**, así que sin el `void this.sigValores()()` del método el
    // mensaje quedaría pegado en pantalla después de arreglar el campo — el ciudadano corrige, ve el
    // rojo intacto y no sabe qué más hacer. Es el caso que fija esa línea aparentemente inútil.
    await montar();
    objHost.blnIntentoEnvio.set(true);

    await escribir({ [QD.strPhone]: '300' });
    expect(seccion()['mensajeDeError'](QD.strPhone)).toBe('Debe contener exactamente 10 dígitos');

    await escribir({ [QD.strPhone]: '3001234567' });
    expect(seccion()['mensajeDeError'](QD.strPhone)).toBe('');
  });

  it('un campo que no existe en el form no rompe el mensaje', async () => {
    await montar();
    objHost.blnIntentoEnvio.set(true);
    await asentar();

    expect(seccion()['mensajeDeError']('qd_strNoExiste')).toBe('');
  });
});
