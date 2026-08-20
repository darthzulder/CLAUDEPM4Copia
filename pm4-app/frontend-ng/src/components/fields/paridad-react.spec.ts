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
import { CorreccionErrorFuncional } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-003_Correccion_Error_Funcional/correccion-error-funcional';
import { GestionLinea2 } from '../../screens/atencion-cliente/otras-solicitudes/COL_OS_SCR-003_Bandeja_Gestion_Linea2/gestion-linea2';
import { RespuestaAreaResponsable } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-0052_Respuesta_Area_Responsable/respuesta-area-responsable';
import { FormularioSuperintendencia } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-009_Formulario_Superintendencia/formulario-superintendencia';
import { DetalleReasignacionRespuesta } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta/detalle-reasignacion-respuesta';
import { DashboardGestionCasos } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-013_Dashboard_Gestion_Casos/dashboard-gestion-casos';
import { CrearRecibirQueja } from '../../screens/atencion-cliente/quejas-directas/COL_QD_SCR-000_CrearRecibirQueja/crear-recibir-queja';

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
 * ── Alcance: las portadas hasta hoy, no las 11 del dataset ────────────────────────────────────
 * El dataset congela **11 pantallas / 128 campos**, pero acá se comparan las que ya se pueden montar
 * (ver `CLL_PORTADAS`, que es la lista viva). Las otras no se pueden montar todavía. **Ese es el valor del
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
  // Las SCR-004, 011 y 012 se comparaban acá hasta que se eliminaron del proyecto (PM4 ya no las
  // usa). Sus entradas siguen en `paridad-react.json` —el dataset es una foto congelada de React y
  // no se reescribe a mano—, pero la guarda de inventario de abajo compara contra `DIC_PANTALLAS`,
  // así que un slug que ya no está enrutado no exige comparación.
  { strSlug: 'COL_QD_SCR-003_Correccion_Error_Funcional', objTipo: CorreccionErrorFuncional },
  { strSlug: 'COL_OS_SCR-003_Bandeja_Gestion_Linea2', objTipo: GestionLinea2 },
  { strSlug: 'COL_QD_SCR-0052_Respuesta_Area_Responsable', objTipo: RespuestaAreaResponsable },
  { strSlug: 'COL_QD_SCR-009_Formulario_Superintendencia', objTipo: FormularioSuperintendencia },
  { strSlug: 'COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta', objTipo: DetalleReasignacionRespuesta },
  { strSlug: 'COL_QD_SCR-013_Dashboard_Gestion_Casos', objTipo: DashboardGestionCasos },
  { strSlug: 'COL_QD_SCR-000_CrearRecibirQueja', objTipo: CrearRecibirQueja },
];

/**
 * Cuántos campos con `maxLength` declaraba React en cada pantalla portada.
 *
 * Es la guarda de anti-vacuidad del caso de los contadores, y está por pantalla —en vez de un
 * `toBeGreaterThan(0)` global— porque **cero es un valor legítimo**: la OS_SCR-003 no declaraba ningún
 * `maxLength` en su `.tsx`. Con el tope global, esa pantalla ponía el caso en rojo por estar bien
 * portada, y la única salida habría sido sacarla de `CLL_PORTADAS` — o sea, dejar de comparar sus
 * campos justo para no ver un cero.
 *
 * ⚠ El número se lee del **dataset**, no del template de Angular: es el contrato congelado de React, y
 * por eso solo se actualiza cuando cambia `paridad-react.json` (o sea, cuando el extractor vuelve a
 * correr contra el `.tsx`). Bajar un número acá para "que pase" es tapar exactamente el defecto que el
 * caso persigue: un contador que se apagó al portar.
 */
const DIC_MAXLENGTH_ESPERADOS: Readonly<Record<string, number>> = {
  'COL_QD_SCR-008_Revision_Respuesta_SAC': 3,
  'COL_QD_SCR-003_Correccion_Error_Funcional': 1,
  // ⚠ Cero DECLARADO, verificado por grep sobre `GestionLinea2.tsx`/`ReasignarCasoModal.tsx` de React:
  // ningún campo llevaba `maxLength`. La pantalla igual hereda el caso de huérfanos de arriba, que es
  // el que atrapa un rename — que es el defecto grave, no el contador.
  'COL_OS_SCR-003_Bandeja_Gestion_Linea2': 0,
  // Uno solo: el `qd_strAreaComment` (2000). Los otros 6 campos de la pantalla son de solo lectura, y
  // un campo `readOnly` no lleva contador porque no se tipea en él.
  'COL_QD_SCR-0052_Respuesta_Area_Responsable': 1,
  // ⚠ Cero DECLARADO, leído del dataset: los 14 campos de la SCR-009 son 7 selects, 5 inputs y 2
  // radios, y **ninguno** trae `props.maxLength` ni `validadores.maxLength`. Es el mismo caso legítimo
  // que la OS_SCR-003 — los 5 inputs son los tres `readOnly` del cierre (fechas y código SFC) más los
  // dos montos de fraude, y React no le puso tope a ninguno.
  'COL_QD_SCR-009_Formulario_Superintendencia': 0,
  // Cuatro, leídos del dataset: los dos comentarios de S5 (2000 cada uno), la respuesta al cliente
  // (5000) y las acciones tomadas (2000, en S8).
  //
  // ⚠ **Dos de los cuatro viven detrás de un `@if`** y no se montan con el fixture pelado, así que esta
  // pantalla es la primera que necesita una entrada en `DIC_APERTURA_DE_RAMAS`. El número se mantiene en
  // 4 —el del dataset— y lo que se ajusta es el fixture; bajarlo a 2 dejaría los dos condicionales sin
  // vigilar para siempre, que es exactamente lo que el párrafo de arriba prohíbe.
  'COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta': 4,
  // ⚠ Cero DECLARADO, leído del dataset: los 4 campos de la SCR-013 son los tres selects de filtro y el
  // input de búsqueda, y React no le puso `maxLength` a ninguno. Tercer cero legítimo, después de la
  // OS_SCR-003 y la SCR-009, y por un motivo distinto a los dos: acá **no hay ningún campo de captura**
  // —es un tablero de solo lectura y sus cuatro controles son filtros—, así que un tope de longitud no
  // tendría a qué aplicarse. La pantalla igual hereda el caso de huérfanos, que es el que atrapa un
  // rename de filtro al portar.
  'COL_QD_SCR-013_Dashboard_Gestion_Casos': 0,
  // Dos, contados del dataset: los **únicos** dos `ZdsTextarea` de la pantalla, los dos con
  // `maxLength: 2000`. Se distinguen por sus validadores: el que además trae `minLength(50)` es
  // `qd_strComplaintText` (FLD-327), y el pelado es `qd_strReplyArgument`. Que sean 2 sobre 29 campos no
  // es un olvido de React: los otros 27 son selects, radios, fechas y el checkbox de autorización, y a
  // ninguno le aplica un tope de longitud.
  //
  // ⚠ **Uno de los dos vive detrás de un `@if`**, así que esta pantalla necesita su entrada en
  // `DIC_APERTURA_DE_RAMAS` — igual que la SCR-0051 y por el mismo motivo. Sin sembrar la rama, el caso
  // encontraría 1 contador y fallaría nombrando un textarea que nunca se montó.
  'COL_QD_SCR-000_CrearRecibirQueja': 2,
};

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
 *
 * ── La SEGUNDA causa legítima: un control SATÉLITE que el port tuvo que inventar ────────────────
 * Descubierta al portar la SCR-0051, y anotada acá porque el párrafo de arriba, solo, la habría
 * rechazado. Hay nombres montados que React **nunca** declaró y que igual son correctos: los controles
 * de andamiaje que el port necesita porque la fachada de Angular no tiene el equivalente de una prop de
 * React. El caso vivo es `ui-qd_strSfcProduct`: React resolvía los códigos duplicados de la colección 16
 * con el triplete `toPickerValue`/`fromPickerValue`/`onPickerChange` de `ZdsSelect`, y `zds-select` es un
 * CVA puro cuyo único canal es el `FormControl` — así que el port ata el picker a un control satélite y
 * traduce al control real en su `valueChanges`.
 *
 * **Estos NO aparecen en el `--check` del extractor** (verificado: sus 8 "sin resolver" son todos de la
 * SCR-003), porque el nombre no es que React no lo pudiera resolver: es que en React no existía.
 *
 * Lo que hace que la exención siga siendo angosta —y no una puerta para tapar un rename— es que el
 * satélite **no viaja a PM4**: vive en un `FormGroup` propio de la sección, fuera del form de la
 * pantalla, así que no puede entrar en el payload. Ese es el criterio para sumar un nombre por esta vía,
 * y hay que comprobarlo leyendo dónde se declara el control, no asumirlo por el prefijo `ui-`.
 */
const DIC_NOMBRES_DINAMICOS: Readonly<Record<string, readonly string[]>> = {
  // Los 3 de S1 (`dinamico:nmErrorCode` / `nmAttempt` / `nmErrorMessage`) se atan al nombre que el caso
  // REALMENTE trae, con fallback al del anexo: FLD-040..045 están declarados pero ningún script los
  // escribe hoy. Los del editor de payload (`dinamico:strName`) salen de un `@for` sobre las 20 claves.
  'COL_QD_SCR-003_Correccion_Error_Funcional': [
    // S1 · los tres campos de nombre resuelto en runtime. Solo van los del juego que este fixture monta
    // de verdad: con `data: {}` el fallback elige el juego de error técnico
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

  // Exención por la SEGUNDA causa (control satélite del port), no por nombre dinámico de React: ver el
  // último bloque del docstring. Es **un solo prefijo** y a propósito — la pantalla monta ~22 campos y
  // todos los demás son nombres estáticos que React sí declaraba, así que un rename en cualquiera de
  // ellos sigue poniendo el caso rojo.
  //
  // El `ui-` no vale para exentar lo que quiera empezar con eso: el único control satélite de la pantalla
  // es `ui-qd_strSfcProduct`, declarado en el `objGrupoUi` de `seccion-detalle-caso.ts` —un `FormGroup`
  // aparte del de la pantalla— así que no puede colarse en el payload de PM4. Si aparece un segundo
  // `ui-*` que sí viva en el form del caso, esta exención lo taparía: por eso el criterio se verifica en
  // el archivo de la sección, no acá.
  'COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta': ['ui-'],
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

/**
 * Cómo abrir las ramas condicionales que esconden un campo con `maxLength`.
 *
 * ── Por qué hace falta, y por qué es lo honesto ────────────────────────────────────────────────
 * El caso de los contadores compara el dataset contra el DOM, y un campo detrás de un `@if` no está en
 * el DOM salvo que su rama esté abierta. Con el fixture pelado (`data: {}`) el caso fallaría nombrando
 * un contador apagado — un falso positivo, porque el campo está bien portado y simplemente no se montó.
 *
 * La alternativa era declarar en `DIC_MAXLENGTH_ESPERADOS` solo los campos visibles, y es justo lo que
 * el comentario de esa constante prohíbe: el número se lee del dataset, no de lo que este fixture logra
 * mostrar. Bajarlo dejaría a los condicionales **sin vigilar para siempre** — que es el defecto que el
 * caso persigue, con otro disfraz. Así que se abre la rama.
 *
 * `datos` siembra `task.data` (para las ramas que dependen de un valor del caso) y `fnAbrir` corre
 * después del montaje (para las que dependen de estado local, alcanzable solo por interacción). Cada
 * entrada acopla este archivo a un template concreto, así que se agrega **solo** cuando un `maxLength`
 * del dataset vive detrás de un `@if`; una pantalla sin campos condicionales no va acá.
 */
const DIC_APERTURA_DE_RAMAS: Readonly<
  Record<string, { readonly datos?: Record<string, unknown>; readonly fnAbrir?: (in_objRaiz: HTMLElement) => void }>
> = {
  // TRES de los cuatro `maxLength` de la SCR-0051 son condicionales, y por dos vías distintas:
  //  · `qd_strReassignRemarks` vive en el bloque de ayuda a otras áreas (RUL-0051-07), que depende del
  //    radio `qd_strNeedsOtherAreas` — o sea, de un dato del caso. Se siembra.
  //  · `qd_strActionsTaken` vive en "Acciones Tomadas" (RUL-0051-09), que solo se muestra cuando la
  //    respuesta sale a favor del **Cliente**: `blnMostrarAcciones()` compara `qd_strFavorability === '1'`,
  //    y el `'1'` es el value de la opción "Cliente" en `SCR0051_OPTIONS_FAVOR` (el otro es `'3'`,
  //    Compañía — no son 1/2). También es un dato del caso, así que también se siembra.
  //  · `qd_strAssignmentRemarks` vive en el modo reasignación, que es una señal local que arranca en
  //    `false` y solo abre el botón "Reasignar Queja". Se hace clic.
  //
  // El clic va por el `<za-button>` interno y no por el host `lib-button-z`: el handler está enganchado
  // ahí dentro (`(click)` sobre el `za-button` del template de `ButtonZ`), así que un `click()` sobre el
  // host no dispara nada. El `label` es el ancla porque `lib-button-z` no expone `id`.
  'COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta': {
    datos: { qd_strNeedsOtherAreas: 'SI', qd_strFavorability: '1' },
    fnAbrir: (in_objRaiz) => {
      const cllBotones = Array.from(in_objRaiz.querySelectorAll('lib-button-z'));
      const objHost = cllBotones.find(
        (in_objBoton) => in_objBoton.getAttribute('label') === 'Reasignar Queja',
      );

      // Sin `expect` acá a propósito: este helper no es el caso. Si el botón no aparece, el que falla es
      // el caso de los contadores, nombrando el campo que no encontró — que es el mensaje útil.
      objHost?.querySelector('za-button')?.dispatchEvent(new Event('click', { bubbles: true }));
    },
  },
  // Uno de los dos `maxLength` de la SCR-000 es condicional: `qd_strReplyArgument` (el argumento de la
  // réplica) vive detrás del `@if` que se abre cuando `qd_strReply === 'SI'`. Es un dato del caso, así
  // que alcanza con sembrarlo — no hace falta `fnAbrir`.
  //
  // ⚠ El valor es el literal `'SI'` y no un `true`: el checkbox de réplica es un `zds-checkbox-field` con
  // `checkedValue`/`uncheckedValue` en `'SI'`/`'NO'`, que es el contrato de PM4 para ese campo. Sembrar
  // `true` dejaría el `@if` cerrado y el caso fallaría nombrando el textarea que no montó.
  //
  // ⚠ **Y desde 2026-08-19 la réplica tiene un `@if` ANCESTRO que también hay que abrir.** La pantalla
  // atiende dos procesos: la sección de detalle completa (con el relato, la réplica y su argumento) se
  // monta **solo si el tipo de solicitud es una queja**; con cualquier otro tipo la reemplaza "Detalle de
  // la Solicitud", de un solo campo. Sin `qd_strRequestType` sembrado no hay tipo elegido, así que la
  // rama por default es la de solicitud y S3 entera desaparece: el caso de los contadores fallaba
  // nombrando `qd_strReplyArgument` y el de los huérfanos nombraba `qd_strCaseDescription` (el campo de
  // la otra rama, que React no declara porque **no existía**). Los dos son el mismo hecho.
  //
  // Se abre la rama de **queja** y no se exime el campo nuevo, y la razón es que este archivo compara
  // contra el contrato congelado de React: la SCR-000 de React mostraba siempre el detalle de la queja,
  // así que la rama de queja **es** la que corresponde comparar. Eximir `qd_strCaseDescription` en
  // `DIC_NOMBRES_DINAMICOS` habría sido la salida corta y dejaba los ~12 campos de S3 sin comparar para
  // siempre — que es justo el tipo de pérdida silenciosa que el resto de este archivo persigue.
  //
  // El `'3'` es el código de "Queja" del catálogo 18. `esTipoQueja()` decide por la **etiqueta** de la
  // opción y cae al código solo si el catálogo no cargó; acá el helper drena todas las colecciones con
  // `{data: []}`, así que el que aplica es el código.
  'COL_QD_SCR-000_CrearRecibirQueja': {
    datos: { qd_strRequestType: '3', qd_strReply: 'SI' },
  },
};

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
   * Los campos se dejan **vacíos** por default (`data: {}`): este spec asevera límites de longitud, y un
   * valor precargado tendría que restaurarse con exactitud tras cada `setValue` de prueba. Con vacío, la
   * restauración es trivial y no hay dato de la pantalla del que este archivo dependa.
   *
   * ── Las dos excepciones, y por qué son datos de la pantalla y no del helper ────────────────────
   * `DIC_APERTURA_DE_RAMAS` permite sembrar `task.data` y disparar una acción después del montaje. Existe
   * porque un campo con `maxLength` puede vivir **detrás de un `@if`**, y entonces el caso de los
   * contadores busca su `max-length` en un DOM donde el campo no está: falla nombrando un contador
   * apagado que en realidad nunca se montó. La SCR-0051 fue la primera con ese caso (dos de sus cuatro
   * textarea son condicionales) y la salida tentadora era bajar su número en `DIC_MAXLENGTH_ESPERADOS`
   * a los que sí se ven — o sea, exactamente lo que el comentario de esa constante prohíbe.
   */
  async function montar<T>(in_objTipo: Type<T>, in_strSlug = ''): Promise<ComponentFixture<T>> {
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

    // ⚠ **El GET de la tarea es CONDICIONAL, y lo obligó la SCR-013 (la primera pantalla sin `task_id`).**
    // Hasta acá el `expectOne` iba pelado porque las nueve pantallas anteriores completan una tarea de
    // PM4 y ese GET es su primera petición sin excepción. La SCR-013 es un **tablero**: no completa
    // ninguna tarea, no lee `task_id` y su carga sale de `GET /requests` paginado, así que el `expectOne`
    // fallaba con "found none" — un fallo que se lee como defecto de la pantalla cuando es del helper.
    //
    // Se busca con `match()` en vez de `expectOne()` a propósito: `match()` devuelve `[]` sin lanzar,
    // así que la rama "esta pantalla no pide su tarea" es un dato, no una excepción atrapada. Y las
    // peticiones propias del tablero no quedan sin drenar — caen en el bucle genérico de abajo, que ya
    // responde `{data: []}` a lo que sea que esté pendiente.
    const cllTarea = objControlador.match((in_objReq) => in_objReq.url === `/api/tasks/${INT_TASK_ID}`);
    if (cllTarea.length > 0) {
      cllTarea[0].flush({
        id: INT_TASK_ID,
        process_request_id: 70,
        data: DIC_APERTURA_DE_RAMAS[in_strSlug]?.datos ?? {},
      });
    }

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
    // (medido).
    // ⚠ **Corta con DOS vueltas vacías seguidas, no con una, y eso lo obligó la SCR-0052 (medido).**
    // El `break` en la primera cola vacía asumía que "vacío" significa "ya drenó", y para las pantallas
    // que piden sus colecciones en el mismo tick del flush de la tarea es verdad. La SCR-0052 hace
    // `await this.objTareas.cargar()` y **después** dispara sus cuatro catálogos, así que sus peticiones
    // nacen un microtask más tarde: la traza real es `v0=0 v1=4 v2=0`, o sea que el `break` de la vuelta
    // 0 se iba con la cola vacía y dejaba las cuatro abiertas — y el `verify()` del `afterEach` ponía en
    // rojo los 3 casos de esa pantalla nombrando 4 GET de colección, un fallo que se lee como defecto de
    // la pantalla y no del helper.
    //
    // Con dos vacías el criterio pasa a ser "no nació nada nuevo después de drenar", que es la condición
    // que de verdad interesa. El tope de vueltas sigue siendo el cortacircuitos: una cascada infinita
    // colgaría el spec, y un spec colgado es peor que uno que falla nombrando lo que quedó abierto.
    let numVaciasSeguidas = 0;
    for (let numVuelta = 0; numVuelta < 8 && numVaciasSeguidas < 2; numVuelta += 1) {
      const cllPendientes = objControlador.match(() => true);
      numVaciasSeguidas = cllPendientes.length === 0 ? numVaciasSeguidas + 1 : 0;

      for (const objPeticion of cllPendientes) {
        if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
      }

      await objFixture.whenStable();
      objFixture.detectChanges();
    }

    // La apertura de ramas de estado local va **después** del drenaje: abrir el modo reasignación de la
    // SCR-0051 monta los selects de su bloque, que piden sus usuarios, y esas peticiones tienen que caer
    // en un drenaje también. De ahí el segundo bucle, con el mismo criterio de dos vueltas vacías.
    const fnAbrir = DIC_APERTURA_DE_RAMAS[in_strSlug]?.fnAbrir;
    if (fnAbrir) {
      fnAbrir(objFixture.nativeElement as HTMLElement);
      await objFixture.whenStable();
      objFixture.detectChanges();

      numVaciasSeguidas = 0;
      for (let numVuelta = 0; numVuelta < 8 && numVaciasSeguidas < 2; numVuelta += 1) {
        const cllPendientes = objControlador.match(() => true);
        numVaciasSeguidas = cllPendientes.length === 0 ? numVaciasSeguidas + 1 : 0;

        for (const objPeticion of cllPendientes) {
          if (!objPeticion.cancelled) objPeticion.flush({ data: [] });
        }

        await objFixture.whenStable();
        objFixture.detectChanges();
      }
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

      // Y que declare su conteo de contadores. Sin esto, una pantalla nueva en `CLL_PORTADAS` sin
      // entrada en `DIC_MAXLENGTH_ESPERADOS` compararía `0` contra `undefined` y el caso de los
      // contadores fallaría con un mensaje que no dice qué falta. Peor: si alguien lo "arreglara" con un
      // `?? 0`, el cero pasaría a ser el default silencioso y la guarda de anti-vacuidad moriría para
      // toda pantalla que se olviden de declarar.
      expect(
        DIC_MAXLENGTH_ESPERADOS[strSlug],
        `${strSlug} está en CLL_PORTADAS pero no declara cuántos maxLength traía de React: ` +
          `sumalo a DIC_MAXLENGTH_ESPERADOS (contá los campos con props.maxLength en el dataset). ` +
          `Cero es un valor válido, pero tiene que estar escrito.`,
      ).toBeTypeOf('number');
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
        const objFixture = await montar(objTipo, strSlug);
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
        const objFixture = await montar(objTipo, strSlug);
        const dicReact = dicPantallasReact[strSlug];

        const cllEsperados = Object.entries(dicReact).filter(
          ([, in_objCampo]) => typeof in_objCampo.props?.maxLength === 'number',
        );

        // ── Anti-vacuidad, y por qué NO es un `toBeGreaterThan(0)` ──
        // Si el filtro diera vacío el `for` no correría y el caso pasaría sin aseverar nada, así que hay
        // que fijar su tamaño. Pero el tope no puede ser "toda pantalla tiene al menos uno": la
        // OS_SCR-003 **no tiene ninguno en React** (verificado con un grep sobre su `.tsx`, no supuesto),
        // y con el `> 0` este caso se ponía rojo por una pantalla bien portada.
        //
        // Así que el conteo esperado se **declara** por pantalla, en `DIC_MAXLENGTH_ESPERADOS`. El cero
        // queda permitido pero **escrito**, que es lo que separa "esta pantalla no usaba contadores" de
        // "el extractor los perdió": las dos dan `[]` acá y solo la primera está declarada. Un dataset
        // que pierda los `maxLength` de una pantalla que sí los tenía sigue poniendo rojo.
        expect(
          cllEsperados.length,
          `${strSlug} declara ${DIC_MAXLENGTH_ESPERADOS[strSlug]} maxLength en ` +
            `DIC_MAXLENGTH_ESPERADOS y el dataset trae ${cllEsperados.length}: si React sí los ` +
            `declaraba, el extractor los perdió; si de verdad cambió, actualizá la constante.`,
        ).toBe(DIC_MAXLENGTH_ESPERADOS[strSlug]);

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
        const objFixture = await montar(objTipo, strSlug);
        const dicReact = dicPantallasReact[strSlug];
        const objPantalla = objFixture.componentInstance as { form: FormGroup };

        const cllEsperados = Object.entries(dicReact).filter(
          ([, in_objCampo]) => typeof in_objCampo.validadores?.maxLength?.valor === 'number',
        );

        // ⚠ No se exige `> 0` acá, y la diferencia con el caso de arriba es real: React declaraba el
        // `rules.maxLength` en unas pantallas y no en otras (la SCR-008 tiene los tres contadores
        // visuales **sin** `rules`; otras los traían con ambos). Exigir que siempre haya alguno
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
