import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { Type } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { FormGroup } from '@angular/forms';
import dicParidad from './paridad-react.json' with { type: 'json' };
import { cllCamposDeLaFachada } from './contrato-pantalla';
import { PM4_ENV_FALLBACKS } from '../../core/pm4-context.service';
import { RevisionRespuestaSac } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-008_Revision_Respuesta_SAC/revision-respuesta-sac';
import { RevisionErrorTecnicoApi } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-004_Revision_Error_Tecnico_API/revision-error-tecnico-api';
import { RevisionErrorTecnicoProrroga } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga/revision-error-tecnico-prorroga';
import { ErrorFuncionalProrroga } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-012_Revision_Error_Funcional_Prorroga/error-funcional-prorroga';
import { CorreccionErrorFuncional } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-003_Correccion_Error_Funcional/correccion-error-funcional';

/**
 * ⚠ **Paridad contra el contrato de campos que declaraba React, congelado como dato de migración.**
 *
 * ── Qué problema resuelve, y por qué ningún otro archivo lo cubre ─────────────────────────────
 * De los tres defectos que el port de la SCR-008 dejó pasar con la suite verde, uno era **tres
 * textarea sin `[maxLength]`**: el contador visual del DS (`9/5000`) apagado. Ni la guarda de
 * `campo-base.ts` ni `aseverarContratoDeCampos()` pueden atraparlo, y el motivo es de fondo: si un
 * campo lleva `maxLength` **no es decidible sin saber qué pasaba React**. Es dato de la pantalla, no
 * una invariante de la fachada, y el único origen de esa verdad es el `.tsx`.
 *
 * El `.tsx` desaparece en la Fase 7. De ahí `paridad-react.json`: lo que React declaraba, extraído
 * una vez con el compilador de TypeScript (`scripts/extraer-paridad-react.mjs`) y **commiteado como
 * dato**, no como infraestructura. No hay dependencia de runtime, no hay hook de build y —regla 3,
 * BFF— no hay ninguna llamada de red: es un `.json` que se lee y se compara.
 *
 * ── Por qué existe este spec y no solo el JSON ────────────────────────────────────────────────
 * Porque un dataset que nadie lee **se desincroniza en silencio**, que es exactamente la vacuidad que
 * costó los gates 2 y 4 con otro disfraz: un archivo prolijo que no asevera nada. Su mutación es que
 * **borrar un `[maxLength]` de un template ponga rojo**, y eso solo pasa si algo lo compara.
 *
 * ── Qué asevera, y qué deliberadamente NO ─────────────────────────────────────────────────────
 * Asevera lo que el port puede perder sin que nada más se queje:
 *
 *  1. **`props.maxLength`** — el **contador visual** del DS. React lo pasaba como
 *     `maxLength={5000}`; en Angular es el `[maxLength]` del wrapper, que la fachada repone como
 *     atributo `max-length` sobre el `z-textarea`.
 *  2. **`validadores.maxLength`** — el que de verdad **invalida** (`rules={{ maxLength: {...} }}` en
 *     React → `Validators.maxLength()` en el control). ⚠ **Son dos contratos distintos y hacen falta
 *     los dos**; el JSON los guarda separados a propósito, porque colapsarlos a un número dejaría
 *     pasar un port que copió solo una mitad. Ver el comentario del `maxLength` en
 *     `revision-respuesta-sac.ts`.
 *  3. **La cobertura del inventario** — que cada campo que la pantalla monta exista en el dataset.
 *     Sin esto, un `name` mal escrito al portar haría que el `for` de comparación no encontrara nada
 *     que comparar y el caso pasara vacío.
 *
 * **No** asevera rótulos, `helpText` ni `placeholder`: ya los cubren los specs de paridad de cada
 * pantalla, con el texto del Anexo02 al lado del FLD, que es más útil que un diff contra React.
 *
 * ── Alcance: 3 de 11 pantallas, y eso es correcto hoy ─────────────────────────────────────────
 * El dataset congela **11 pantallas / 128 campos**, pero acá se comparan las **portadas hasta hoy**
 * (SCR-008, SCR-004 y SCR-011). Las otras no se pueden montar todavía. **Ese es el valor del
 * dataset**: el `.tsx` se borra en la Fase 7 y los datos de las que faltan sobreviven; cada pantalla
 * nueva de la Fase 5 se suma a `CLL_PORTADAS` en una línea y hereda la comparación. El caso de
 * inventario de abajo se pone rojo si alguien porta una pantalla y se olvida de sumarla.
 */

/** El JSON tiene forma libre; se tipa mínimo para leerlo sin `any` suelto. */
interface CampoParidad {
  readonly wrapper: string;
  readonly props?: { readonly maxLength?: number };
  readonly validadores?: { readonly maxLength?: { readonly valor?: number } };
}

const dicPantallasReact = dicParidad.pantallas as unknown as Record<
  string,
  Record<string, CampoParidad>
>;

/**
 * Las pantallas ya portadas, con el slug que las identifica en el dataset.
 *
 * ⚠ El slug es el de la carpeta `COL_*`, que es **contrato con PM4** (regla 1) y por eso es la misma
 * cadena en React, en Angular y en el JSON. Un slug que no matchee no es un detalle de nomenclatura:
 * significa que se comparó contra la pantalla equivocada, o contra ninguna.
 *
 * ⚠ El tipo va **explícito** y sin `as const`, por dos motivos que dan error de compilación:
 *  - Con `as const`, `objTipo` se infiere como la **unión** de los dos constructores, y una unión de
 *    `new () => A | new () => B` no es asignable a `new () => A` — `montar()` no acepta ninguno de los
 *    dos. `Type<unknown>` unifica sin castear en cada llamada.
 *  - `strSlug` se infiere como unión de literales, así que `cllComparadas.includes(<string>)` no
 *    compila. Con `string` el `filter` de la guarda de inventario funciona.
 */
const CLL_PORTADAS: readonly { readonly strSlug: string; readonly objTipo: Type<unknown> }[] = [
  { strSlug: 'COL_QD_SCR-008_Revision_Respuesta_SAC', objTipo: RevisionRespuestaSac },
  { strSlug: 'COL_QD_SCR-004_Revision_Error_Tecnico_API', objTipo: RevisionErrorTecnicoApi },
  { strSlug: 'COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga', objTipo: RevisionErrorTecnicoProrroga },
  { strSlug: 'COL_QD_SCR-012_Revision_Error_Funcional_Prorroga', objTipo: ErrorFuncionalProrroga },
  { strSlug: 'COL_QD_SCR-003_Correccion_Error_Funcional', objTipo: CorreccionErrorFuncional },
];

/**
 * Los campos que React declaraba con un **nombre dinámico**, y que por eso NO están en el dataset.
 *
 * ── Por qué existe esta exención, y por qué no es un agujero ──────────────────────────────────
 * El extractor resuelve el `name` de cada campo por análisis estático del `.tsx`. Cuando el nombre es
 * una expresión que no se puede evaluar sin correr el código —`name={`edit-${strVar}`}` dentro de un
 * `.map()`, o `name={nmErrorCode}` calculado desde `task.data`— **no lo puede saber**, así que descarta
 * el campo y lo reporta como `dinamico:<expr>` / `template-dinamico`. Esos campos existían en React,
 * pero el dataset no los nombra. Verificado con `node scripts/extraer-paridad-react.mjs --check`, que
 * los lista uno por uno y cierra con `✓ el dataset congelado coincide con el .tsx de React`: son un
 * límite del análisis estático, no un dataset desactualizado.
 *
 * Sin la exención, la SCR-003 —la primera pantalla portada con campos de nombre dinámico— pone rojo el
 * caso de inventario con **44 huérfanos** que en realidad están bien portados.
 *
 * ── Por qué es por pantalla y por prefijo, y no una lista global de nombres ────────────────────
 * Porque la exención tiene que ser **más angosta que el defecto que el caso persigue**. El caso existe
 * para atrapar un campo *renombrado al portar* (`qd_strSacRemark` sin la `s`), y eso sigue vivo: un
 * campo de nombre **estático** en React que se porte mal cae fuera de toda exención y pone rojo igual.
 * Lo que se exime es solo el juego de nombres que el extractor declaró que no pudo ver, en la pantalla
 * donde los declaró. Una pantalla sin entrada acá no exime nada.
 *
 * ⚠ Agregar un prefijo acá **no** es una forma legítima de silenciar un huérfano. Antes de sumar uno,
 * correr el `--check` del extractor y confirmar que ese campo aparece en su lista de "sin resolver".
 * Si no aparece, el nombre era estático y el huérfano es un defecto del port de verdad.
 */
const DIC_NOMBRES_DINAMICOS: Readonly<Record<string, readonly string[]>> = {
  // Los 3 de S1 (`dinamico:nmErrorCode` / `nmAttempt` / `nmErrorMessage`) se atan al nombre que el caso
  // REALMENTE trae, con fallback al del anexo: FLD-040..045 están declarados pero ningún script los
  // escribe hoy. Los del editor de payload (`dinamico:strName`) salen de un `@for` sobre las 20 claves.
  'COL_QD_SCR-003_Correccion_Error_Funcional': [
    // S1 · los tres campos de nombre resuelto en runtime. Solo van los del juego que este fixture monta
    // de verdad: con `data: {}` el fallback elige el juego que consume la SCR-004
    // (`sfcCamposErrorTecnico()`). Los del anexo (`qd_strErrorCodeSFC`, `qd_intAttemptNumber`,
    // `qd_strErrorMessageSFC`) **no se listan** aunque la pantalla los sepa montar: la guarda de abajo
    // los rechaza por no estar montados, y con razón — una exención que este fixture no ejercita es una
    // exención que nadie verifica. Si algún día el fixture trae esas claves, se suman acá.
    'qd_strHttpCode',
    'qd_strAttemptNum',
    'qd_strApiTechMessage',
    // S2 · el editor de payload. Cada una de las 20 claves monta hasta tres controles con el nombre
    // armado en el `@for`: el valor (`<clave>`), el checkbox de habilitación (`edit-<clave>`) y, solo
    // para el producto, el select traducido (`ui-<clave>`). Los prefijos van por `startsWith`; los
    // nombres pelados se enumeran **uno por uno** a propósito: exentar `qd_*` entero desactivaría el
    // caso para toda la pantalla, y lo que se quiere es exentar estas 19 claves y nada más.
    'edit-',
    'ui-',
    'qd_strCountryCode',
    'qd_strDepartment',
    'qd_strCity',
    'qd_strChannel',
    'qd_strInteraction',
    'qd_strServiceProvided',
    'qd_strSfcReason',
    'qd_strFilingDate',
    'qd_strCompanyName',
    'qd_strFirstName',
    'qd_strLastName',
    'qd_strIdType',
    'qd_strIdNumber',
    'qd_strPersonType',
    'qd_strReceptionInstance',
    'qd_strReceptionPoint',
    'qd_strAdmission',
    'qd_strComplaintText',
    'qd_strControlEntity',
  ],
};

/**
 * Predicado de exención para una pantalla: `true` si el nombre montado es uno de los que React
 * declaraba dinámicamente. Se compara por **prefijo** para los juegos generados en bucle (`edit-<var>`,
 * `ui-<var>`) y por igualdad exacta para los nombres sueltos.
 */
function fnExencionDeNombreDinamico(in_strSlug: string): (in_strNombre: string) => boolean {
  const cllExentos = DIC_NOMBRES_DINAMICOS[in_strSlug] ?? [];

  return (in_strNombre) =>
    cllExentos.some((in_strExento) =>
      in_strExento.endsWith('-') ? in_strNombre.startsWith(in_strExento) : in_strNombre === in_strExento,
    );
}

const INT_TASK_ID = 7;

/**
 * `Pm4ContextService` cae a `PM4_ENV_FALLBACKS`, cuyo default lee `src/env.generated.ts` (generado desde
 * `pm4-app/.env`). Sin este override, en la máquina de un dev con `VITE_TASK_ID` cargado la pantalla
 * pediría **otra** tarea y estos casos se pondrían rojos por estado local ajeno al código.
 */
const OBJ_ENV_VACIO = { token: '', taskId: '', caseId: '' } as const;

describe('paridad con el contrato de campos de React (dataset congelado)', () => {
  let objMock: HttpTestingController | null = null;

  beforeEach(() => {
    TestBed.resetTestingModule();
    objMock = null;
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    // ⚠ El `?? null` no es defensivo por gusto: el primer caso del archivo (la guarda de vacuidad) lee
    // solo el JSON y **no monta nada**, así que no hay controlador que verificar. Sin el guard, ese caso
    // fallaba con `Cannot read properties of undefined (reading 'verify')` — un fallo del test que se leía
    // como si el dataset estuviera roto.
    objMock?.verify();
    objMock = null;
    window.history.replaceState({}, '', '/');
  });

  /**
   * Monta una pantalla portada con su tarea ya cargada.
   *
   * ⚠ **El orden de las cuatro líneas es el contrato**, y equivocarlo produce fallos que se leen como
   * defectos de la pantalla (está documentado largo en `revision-respuesta-sac.spec.ts`):
   *  1. La query string va **antes** de `createComponent`: `ngOnInit` lee el `task_id` de la URL.
   *  2. `detectChanges()` va **entre** `createComponent` y el `expectOne`, porque bajo
   *     `provideZonelessChangeDetection()` **`createComponent()` no corre `ngOnInit`** — sin esa línea la
   *     cola de peticiones está vacía y el `expectOne` falla con "found none".
   *  3. El `flush` va **antes** del `await`: la precarga corre cuando ese `await` resuelve.
   *  4. `whenStable()` → `detectChanges()` en ese orden: `whenStable()` por sí solo **no repinta** en
   *     zoneless, y sin el segundo repintado el template se queda en la rama `@if (blnCargando())`.
   *
   * Los campos se dejan **vacíos** a propósito (`data: {}`): este spec asevera límites de longitud, y un
   * valor precargado tendría que restaurarse con exactitud tras cada `setValue` de prueba. Con vacío, la
   * restauración es trivial y no hay dato de la pantalla del que este archivo dependa.
   */
  async function montar<T>(in_objTipo: Type<T>): Promise<ComponentFixture<T>> {
    window.history.replaceState({}, '', `/?task_id=${INT_TASK_ID}`);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PM4_ENV_FALLBACKS, useValue: OBJ_ENV_VACIO },
      ],
    });

    const objFixture = TestBed.createComponent(in_objTipo);
    const objControlador = TestBed.inject(HttpTestingController);
    objMock = objControlador;

    objFixture.detectChanges();

    objControlador
      .expectOne((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`)
      .flush({ id: INT_TASK_ID, process_request_id: 70, data: {} });

    await objFixture.whenStable();
    objFixture.detectChanges();

    // ⚠ **Hay que drenar, y la primera versión de este helper no lo hacía por un supuesto equivocado.**
    // El spec de la SCR-004 documenta que ahí el GET de la tarea es la única petición del montaje, y
    // asumí que valía para las dos pantallas portadas. Medido: **no**. La SCR-008 deja 3 pendientes —
    // `GET /api/collections/46/records?per_page=500` (consume una colección) y **dos**
    // `GET /api/requests/70/files` (monta dos `RequestFileList`)—, así que el `verify()` del `afterEach`
    // ponía en rojo los 3 casos de esa pantalla por una causa del test.
    //
    // Se drena con respuestas **vacías** y sin aseverar qué se pidió: cada pantalla ya tiene su spec para
    // eso, y este archivo solo mira `maxLength`. Lo que sí conserva el `verify()` es su valor real: una
    // petición nueva que este bucle no sepa satisfacer sigue poniendo rojo.
    //
    // ⚠ **Se drena por condición, en vueltas, no de una sola pasada.** Las peticiones llegan en
    // **cascada**: los dos `GET /requests/70/files` salen al montar, y el
    // `GET /collections/46/records` aparece recién en el repintado que dispara el flush de esos dos. Una
    // sola pasada dejaba esa tercera pendiente y el `verify()` ponía rojos los 3 casos de la SCR-008
    // (medido). El tope de vueltas es un cortacircuitos: una cascada infinita colgaría el spec, y un
    // spec colgado es peor que uno que falla nombrando la petición que quedó abierta.
    for (let numVuelta = 0; numVuelta < 5; numVuelta += 1) {
      const cllPendientes = objControlador.match(() => true);
      if (cllPendientes.length === 0) break;

      for (const objPeticion of cllPendientes) {
        if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
      }

      await objFixture.whenStable();
      objFixture.detectChanges();
    }

    return objFixture;
  }

  /**
   * Guarda de vacuidad del dataset mismo, y va primera a propósito.
   *
   * Si `paridad-react.json` se vaciara —un extractor que no encuentra el mapa de nombres, un merge que
   * lo deja en `{}`— **todos los casos de abajo pasarían solos**: sus `for` no iterarían y sus
   * `Object.entries` serían `[]`. Es literalmente el mismo modo de falla que dejó tres casos verdes
   * sobre una grilla borrada en el gate 4, y la lección de ahí fue que cuando el dato de entrada de un
   * spec sale de un módulo que puede estar vacío, hay que fijar su tamaño.
   */
  it('⚠ el dataset congelado no está vacío (anti-vacuidad)', () => {
    const cllSlugs = Object.keys(dicPantallasReact);

    expect(cllSlugs.length, 'paridad-react.json quedó sin pantallas').toBeGreaterThan(5);

    const numCampos = cllSlugs.reduce(
      (in_numAcc, in_strSlug) => in_numAcc + Object.keys(dicPantallasReact[in_strSlug]).length,
      0,
    );

    expect(numCampos, 'paridad-react.json quedó sin campos').toBeGreaterThan(100);

    // Y que las dos pantallas que este archivo compara estén **en** el dataset: sin esto, un slug mal
    // escrito en `CLL_PORTADAS` haría que los casos de abajo comparen contra `{}` y pasen vacíos.
    for (const { strSlug } of CLL_PORTADAS) {
      expect(dicPantallasReact[strSlug], `${strSlug} no está en el dataset`).toBeDefined();
    }
  });

  for (const { strSlug, objTipo } of CLL_PORTADAS) {
    describe(strSlug, () => {
      /**
       * Los campos que la pantalla monta tienen que existir en el dataset.
       *
       * Cubre el port que **renombra** un campo: `formControlName="qd_strSacRemark"` (sin la `s`) sigue
       * pasando el contrato estructural —el `name` del wrapper coincide con la clave del control, que es
       * todo lo que esa guarda puede saber— y en cambio rompe el contrato con PM4, porque el dato
       * llegaría con una clave que el proceso no espera. Acá se ve, porque React no declaraba ese nombre.
       */
      it('⚠ todo campo montado existe en el contrato que declaraba React', async () => {
        const objFixture = await montar(objTipo);
        const dicReact = dicPantallasReact[strSlug];

        const cllMontados = cllCamposDeLaFachada(objFixture).map((in_objCampo) =>
          in_objCampo.name(),
        );

        // El conteo primero, por lo mismo de siempre: una pantalla que no montó nada dejaría el `filter`
        // de abajo en `[]` y el caso pasaría sin comparar un solo campo.
        expect(cllMontados.length, 'la pantalla no montó ningún campo').toBeGreaterThan(0);

        const fnEsDinamico = fnExencionDeNombreDinamico(strSlug);
        const cllHuerfanos = cllMontados.filter(
          (in_strNombre) => !dicReact[in_strNombre] && !fnEsDinamico(in_strNombre),
        );

        expect(
          cllHuerfanos,
          `estos campos no existen en el contrato de React: ¿se renombraron al portar? ` +
            `Los qd_* son contrato con PM4 (regla 1) y renombrar rompe el proceso.`,
        ).toEqual([]);

        // ── Guarda de la exención misma ──
        // Una entrada de `DIC_NOMBRES_DINAMICOS` que ya no corresponde a ningún campo montado es peor
        // que ruido: si mañana ese nombre reaparece por un port mal hecho, la exención lo tapa. Así que
        // cada nombre exento tiene que estar **efectivamente montado** por la pantalla. Es la misma
        // lógica de las dos direcciones de la guarda de inventario de `pantallas.spec.ts`.
        const cllExentosDeclarados = DIC_NOMBRES_DINAMICOS[strSlug] ?? [];
        const cllExentosSinUsar = cllExentosDeclarados.filter((in_strExento) =>
          in_strExento.endsWith('-')
            ? !cllMontados.some((in_strNombre) => in_strNombre.startsWith(in_strExento))
            : !cllMontados.includes(in_strExento),
        );

        expect(
          cllExentosSinUsar,
          `estos nombres están exentos en DIC_NOMBRES_DINAMICOS pero la pantalla no los monta: ` +
            `una exención que no corresponde a ningún campo taparía un rename de verdad el día que ` +
            `ese nombre reaparezca. Sacalos de la lista.`,
        ).toEqual([]);
      });

      /**
       * El contador visual: `props.maxLength` de React ↔ el atributo `max-length` que el DS lee.
       *
       * ⚠ Se asevera sobre el **atributo del `z-*` renderizado**, no sobre el input del wrapper, y la
       * diferencia importa: la cadena real es `[maxLength]` → wrapper de la fachada → (el
       * `[attr.max-length]` del `lib-*-z` **muere ahí**) → el `afterRenderEffect` de la fachada repone el
       * atributo sobre el `z-*`, que es el único elemento que el DS mira para pintar el contador. Leer
       * `componentInstance.maxLength()` se queda un eslabón corto de donde vive el defecto: probaría que
       * la plantilla pasa el número, y seguiría verde con los contadores apagados.
       */
      it('⚠ los maxLength del contador visual coinciden con los de React', async () => {
        const objFixture = await montar(objTipo);
        const dicReact = dicPantallasReact[strSlug];

        const cllEsperados = Object.entries(dicReact).filter(
          ([, in_objCampo]) => typeof in_objCampo.props?.maxLength === 'number',
        );

        // React declaraba `maxLength` en estas pantallas; si el filtro diera vacío, el `for` no correría
        // y el caso pasaría sin aseverar nada. Es la guarda que convierte este caso en un test.
        expect(
          cllEsperados.length,
          `${strSlug} no tiene ningún maxLength en el dataset: ¿el extractor los perdió?`,
        ).toBeGreaterThan(0);

        const objRaiz = objFixture.nativeElement as HTMLElement;

        for (const [strCampo, objCampo] of cllEsperados) {
          const numEsperado = objCampo.props!.maxLength!;

          // Se busca por el `id="field-<name>"` del wrapper —contrato de la fachada, con su propio caso—
          // en vez de por posición, así este spec no agrega una suposición nueva sobre el template.
          const objElemento = objRaiz.querySelector(`#field-${strCampo} [max-length]`);

          expect(
            objElemento,
            `${strCampo}: React pasaba maxLength=${numEsperado} y el DS no recibe ningún ` +
              `max-length. Sin él el contador visual (N/${numEsperado}) queda apagado — es el ` +
              `defecto 2 del port de la SCR-008, que la suite entera no veía.`,
          ).not.toBeNull();

          expect(
            objElemento!.getAttribute('max-length'),
            `${strCampo}: el contador del DS no coincide con el de React`,
          ).toBe(String(numEsperado));
        }
      });

      /**
       * El límite que de verdad invalida: `rules.maxLength` de React ↔ `Validators.maxLength` del control.
       *
       * Se asevera **por comportamiento** y no leyendo el validador: se escribe un valor un carácter más
       * largo que el límite y se exige que el control quede inválido con la clave `maxlength`. Un
       * `control.hasValidator()` probaría que la función está puesta, no que está puesta con el número
       * correcto — y el número es justamente el dato que se está congelando.
       */
      it('⚠ los maxLength que invalidan coinciden con los que declaraba React', async () => {
        const objFixture = await montar(objTipo);
        const dicReact = dicPantallasReact[strSlug];
        const objPantalla = objFixture.componentInstance as { form: FormGroup };

        const cllEsperados = Object.entries(dicReact).filter(
          ([, in_objCampo]) => typeof in_objCampo.validadores?.maxLength?.valor === 'number',
        );

        // ⚠ No se exige `> 0` acá, y la diferencia con el caso de arriba es real: React declaraba el
        // `rules.maxLength` en unas pantallas y no en otras (la SCR-008 tiene los tres contadores
        // visuales **sin** `rules`, la SCR-004 tiene los dos con ambos). Exigir que siempre haya alguno
        // pondría rojo un port correcto. La cobertura de que el dataset no esté vacío la da el primer
        // caso del archivo, que es donde corresponde.
        if (!cllEsperados.length) {
          expect(cllEsperados).toEqual([]);

          return;
        }

        for (const [strCampo, objCampo] of cllEsperados) {
          const numLimite = objCampo.validadores!.maxLength!.valor!;
          const objControl = objPantalla.form.get(strCampo);

          expect(objControl, `${strCampo} no existe en el FormGroup de la pantalla`).not.toBeNull();

          const strPrevio = objControl!.value;

          // Un carácter de más: el mínimo que distingue "el límite es N" de "el límite es cualquier otro
          // número". Con un texto arbitrariamente largo, un `maxLength(10)` mal portado también fallaría
          // y el caso pasaría igual, sin detectar nada.
          objControl!.setValue('x'.repeat(numLimite + 1));

          expect(
            objControl!.hasError('maxlength'),
            `${strCampo}: React invalidaba a partir de ${numLimite} caracteres y el control acepta ` +
              `${numLimite + 1}. Falta el Validators.maxLength(${numLimite}) — es el límite que de ` +
              `verdad invalida, distinto del contador visual del DS.`,
          ).toBe(true);

          objControl!.setValue('x'.repeat(numLimite));

          expect(
            objControl!.hasError('maxlength'),
            `${strCampo}: el límite quedó por debajo de los ${numLimite} que React permitía`,
          ).toBe(false);

          objControl!.setValue(strPrevio);
        }
      });
    });
  }

  /**
   * Guarda de inventario: una pantalla portada tiene que estar en `CLL_PORTADAS`.
   *
   * Es el mismo mecanismo que la guarda de rutas de la Fase 4, y por el mismo motivo: sin él, portar la
   * SCR-011 y olvidarse de sumarla acá no pone nada rojo, y el dataset deja de cubrir la pantalla
   * exactamente cuando empezaría a servir. Se compara contra el router, que es donde una pantalla queda
   * declarada como portada.
   */
  it('⚠ toda pantalla enrutada con datos congelados está comparada acá', async () => {
    const { DIC_PANTALLAS } = await import('../../app/pantallas');

    const cllEnrutadas = Object.keys(DIC_PANTALLAS);

    expect(cllEnrutadas.length, 'no hay pantallas enrutadas: ¿se vació DIC_PANTALLAS?').toBeGreaterThan(
      0,
    );

    // Solo las que el dataset conoce: una pantalla enrutada sin datos de React (la `gate-fachada`, que
    // no existe en React, o `ds-catalog`) no tiene nada que comparar y no es un olvido.
    const cllConDatos = cllEnrutadas.filter((in_strSlug) => dicPantallasReact[in_strSlug]);
    const cllComparadas = CLL_PORTADAS.map((in_obj) => in_obj.strSlug);
    const cllFaltantes = cllConDatos.filter((in_strSlug) => !cllComparadas.includes(in_strSlug));

    expect(
      cllFaltantes,
      'estas pantallas ya están enrutadas y tienen contrato congelado de React, pero nadie compara ' +
        'sus maxLength: sumalas a CLL_PORTADAS (una línea) para que hereden los casos de arriba.',
    ).toEqual([]);
  });
});
