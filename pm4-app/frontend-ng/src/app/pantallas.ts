/**
 * Inventario de pantallas de negocio: la fuente de verdad única de qué slugs existen.
 *
 * Es el equivalente del `SCREENS` exportado en `frontend/src/App.tsx`, y existe por el mismo
 * motivo que aquel: **para que la guarda de inventario pueda compararlo contra la lista de
 * pantallas con spec**. En React el comentario de esa exportación dice, textual, que no es API
 * para nadie más; acá vale igual, con un consumidor legítimo extra — la tabla de rutas se
 * **genera** de acá (ver `app.routes.ts`), así que registrar una pantalla es un solo cambio en
 * un solo archivo y es imposible que la ruta y el inventario se desincronicen.
 *
 * ── Por qué el registro está separado de las rutas, y no embebido en ellas ──────────────────
 * Porque la guarda tiene que poder leer los slugs **sin** disparar los `loadComponent`. Si el
 * inventario viviera dentro de `Routes`, recorrerlo para compararlo obligaría a resolver cada
 * `import()` —cada uno arrastra el chunk del DS, ~6 s en frío bajo jsdom según lo medido en
 * `app.routes.spec.ts`— y la guarda pasaría de instantánea a la parte más lenta de la suite.
 * Acá el slug es un string y el componente una función no invocada.
 *
 * ── Se escribió VACÍO en la Fase 4, y eso fue deliberado ────────────────────────────────────
 * Las 12 pantallas de la **Fase 5** se portan una por una (once formularios de negocio más el visor
 * de la doc del Web Service, que cierra la fase). Este archivo se escribió
 * en la Fase 4 —antes de que existiera la primera— justamente para que la guarda existiera
 * **antes** que las pantallas que tiene que vigilar: una guarda escrita después se escribe, sin
 * querer, a la medida de lo que ya se construyó. Escrita antes, cada pantalla portada se
 * encuentra un requisito que ya estaba puesto.
 *
 * **Ya no está vacío:** la primera pantalla portada fue `COL_QD_SCR-008_Revision_Respuesta_SAC`
 * (Fase 5, pantalla 1 de 12). Con eso se activaron por sí solos los casos que la Fase 4 dejó
 * *armados* y pasando por vacuidad —los de `indice-pantallas.spec.ts` y
 * `pantalla-no-encontrada.spec.ts`, que iteraban un registro vacío—, que era exactamente el
 * momento previsto para volver a leerlos.
 *
 * La segunda es `COL_QD_SCR-004_Revision_Error_Tecnico_API`, y con **dos** entradas empieza a
 * valer algo que con una sola no se podía distinguir: los casos que recorren el registro real
 * (el puente de `indice-pantallas.spec.ts`, el `strDisponibles` de `pantalla-no-encontrada`)
 * ahora se pondrían rojos ante un recorte que devolviera *una* pantalla, no solo ante `[]`.
 *
 * Agregar una pantalla en la Fase 5 son dos líneas, en dos archivos, y las dos son obligatorias:
 * 1. una entrada acá, con su slug real de PM4 y su `loadComponent`;
 * 2. su slug en `CLL_SLUGS_CON_SPEC` de `pantallas.spec.ts`, que solo se pone si de verdad
 *    tiene un spec propio.
 * Si falta la segunda, la suite se pone roja **nombrando el slug**. Ver `pantallas.spec.ts`.
 */
import { Route } from '@angular/router';

/**
 * Un componente cargado bajo demanda, tal como lo espera el `loadComponent` de una `Route`.
 *
 * ⚠ El tipo se toma **prestado de `Route`** (`NonNullable<Route['loadComponent']>`) en vez de
 * escribir un `() => Promise<unknown>` propio, y no es cosmético: con `unknown` el registro compila
 * y `generarRutasDePantallas()` **no**, porque `Route` exige que la promesa resuelva a un `Type<T>`.
 * Peor que el error de compilación es lo que un `unknown` permitiría si nadie lo notara — un
 * cargador que resuelve a cualquier cosa, incluido `undefined`, que es exactamente el defecto #3 del
 * gate 2 (suite entera verde, iframe en blanco). Derivarlo de `Route` hace que `tsc` lo ataje en el
 * registro, que es donde se escribe.
 */
export type CargadorDePantalla = NonNullable<Route['loadComponent']>;

/**
 * Slug de PM4 → cargador de su componente.
 *
 * Los slugs son **contrato con el BPM**: PM4 arma la URL del iframe con
 * `?screen=<slug>&task_id=<id>&token=<jwt>`, así que se escriben **tal cual**, con sus
 * mayúsculas y guiones (`COL_QD_SCR-009_...`). Normalizarlos a kebab o a minúsculas rompería
 * cada nodo del proceso que los referencia. La regla 1 de `pm4-app/CLAUDE.md` aplica igual acá
 * que a los campos `qd_*`: el nombre no es nuestro, es de PM4.
 */
export const DIC_PANTALLAS: Record<string, CargadorDePantalla> = {
  // Fase 5 — se pueblan de a una, en el orden del plan de migración.
  'COL_QD_SCR-008_Revision_Respuesta_SAC': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-008_Revision_Respuesta_SAC/revision-respuesta-sac'
    ).then((in_objModulo) => in_objModulo.RevisionRespuestaSac),
  'COL_QD_SCR-004_Revision_Error_Tecnico_API': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-004_Revision_Error_Tecnico_API/revision-error-tecnico-api'
    ).then((in_objModulo) => in_objModulo.RevisionErrorTecnicoApi),
  'COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga/revision-error-tecnico-prorroga'
    ).then((in_objModulo) => in_objModulo.RevisionErrorTecnicoProrroga),
  'COL_QD_SCR-012_Revision_Error_Funcional_Prorroga': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-012_Revision_Error_Funcional_Prorroga/error-funcional-prorroga'
    ).then((in_objModulo) => in_objModulo.ErrorFuncionalProrroga),
  'COL_QD_SCR-003_Correccion_Error_Funcional': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-003_Correccion_Error_Funcional/correccion-error-funcional'
    ).then((in_objModulo) => in_objModulo.CorreccionErrorFuncional),
  // Primera pantalla del proceso **P02 — Otras Solicitudes**: las cinco de arriba son de Quejas
  // Directas. El slug lleva `OS` donde las otras llevan `QD`, y es de PM4, no nuestro.
  'COL_OS_SCR-003_Bandeja_Gestion_Linea2': () =>
    import(
      '../screens/atencion-cliente/otras-solicitudes/COL_OS_SCR-003_Bandeja_Gestion_Linea2/gestion-linea2'
    ).then((in_objModulo) => in_objModulo.GestionLinea2),
  // La única pantalla del proyecto que corre dentro de un **subproceso** (SP2): escribe en variables
  // que viven en el request padre, de ahí su `ParentRequestService`.
  'COL_QD_SCR-0052_Respuesta_Area_Responsable': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-0052_Respuesta_Area_Responsable/respuesta-area-responsable'
    ).then((in_objModulo) => in_objModulo.RespuestaAreaResponsable),
  // El cierre regulatorio de Quejas Directas: el envío a SmartSupervision cierra el caso. Absorbió las
  // secciones de Momento 3 de la ex SCR-010, que ya no existe como pantalla propia.
  'COL_QD_SCR-009_Formulario_Superintendencia': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-009_Formulario_Superintendencia/formulario-superintendencia'
    ).then((in_objModulo) => in_objModulo.FormularioSuperintendencia),
  // El puesto de trabajo del Gestor de Quejas: detalle del caso, reasignación y redacción de la
  // respuesta, las tres en una sola pantalla. Es la más grande de Quejas Directas (tres secciones
  // propias más el modal de expediente) y la única que despacha **cinco** salidas distintas por el
  // mismo `<form>`, incluida la reasignación de dos PUT.
  'COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta/detalle-reasignacion-respuesta'
    ).then((in_objModulo) => in_objModulo.DetalleReasignacionRespuesta),
  // La única pantalla del proyecto que **no completa ninguna tarea**: un tablero de supervisión que
  // lista todos los casos del proceso. Por eso no recibe `task_id` y su carga es un fetch paginado
  // propio (`CasosDashboardService`) en vez de `TaskService`.
  'COL_QD_SCR-013_Dashboard_Gestion_Casos': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-013_Dashboard_Gestion_Casos/dashboard-gestion-casos'
    ).then((in_objModulo) => in_objModulo.DashboardGestionCasos),
  // La única publicada como **página web pública** (Web Entry): se abre sin `task_id` ni `case_id` y
  // **crea** el caso en vez de completar una tarea. De ahí sus dos modos de envío (`process_events`
  // vs `completarTarea`) y su chrome propio de sitio público (`app-pqr-page`) en vez del header de
  // pantalla embebida. Ver el docstring de `CrearRecibirQueja`.
  'COL_QD_SCR-000_CrearRecibirQueja': () =>
    import(
      '../screens/atencion-cliente/quejas-directas/COL_QD_SCR-000_CrearRecibirQueja/crear-recibir-queja'
    ).then((in_objModulo) => in_objModulo.CrearRecibirQueja),
  // La única que **no es un formulario PM4**: un visor de la documentación del Web Service
  // Smartsupervisión (SFC). No recibe `task_id`, no consume `TaskService` ni la fachada `zds-*` y no
  // completa ninguna tarea — es un `<iframe>` a un HTML autónomo de `public/docs/`, embebido así para
  // aislar el tema oscuro de la doc del CSS global del proyecto. Por eso también es la única sin datos
  // en `paridad-react.json`: no tiene campos que comparar (ver el filtro de `paridad-react.spec.ts`).
  'smartsupervision-api-docs': () =>
    import('../screens/smartsupervision-api-docs/smartsupervision-api-docs').then(
      (in_objModulo) => in_objModulo.SmartsupervisionApiDocsComponent,
    ),
};

/**
 * Alias de slugs viejos que tienen que seguir resolviendo.
 *
 * Se declaran aparte de `DIC_PANTALLAS` porque **no son pantallas**: son nombres muertos que
 * apuntan a una pantalla viva. La distinción importa para la guarda — un alias no necesita spec
 * propio (no hay nada nuevo que cubrir), pero sí necesita seguir enrutando, así que contarlo
 * como pantalla obligaría a un spec redundante y no contarlo dejaría de vigilar que la ruta
 * exista. Se cuenta como ruta, no como pantalla.
 *
 * ── ⚠ Está VACÍO, y el que había se ELIMINÓ por decisión explícita del usuario ───────────────
 * `frontend/src/App.tsx:52` todavía declara `COL_QD_SCR-010_cierre-m3` → `FormularioSuperintendencia`,
 * y este archivo lo portó con un comentario que decía que **no se podía borrar** (nodos del BPM
 * apuntando al slug viejo). Eso quedó desactualizado: **la pantalla SCR-010 ya no existe** y el
 * usuario indicó explícitamente eliminarla, así que ya no hay contrato con el BPM que preservar.
 *
 * El mecanismo se conserva igual —el tipo, `listarSlugsEnrutables()`, el recorrido de
 * `generarRutasDePantallas()` y sus specs— porque un alias vacío no cuesta nada y el próximo
 * slug renombrado va a necesitarlo. Se borró el **dato**, no la capacidad.
 *
 * Si alguna vez hace falta uno, es una entrada acá y nada más: la ruta se genera sola
 * (`app.routes.ts`) y la guarda de `pantallas.spec.ts` ya vigila que su destino exista.
 */
export const DIC_ALIAS: Record<string, string> = {
  // Sin alias vigentes. La ex SCR-010 se eliminó del proyecto (ago-2026).
};

/**
 * Los slugs enrutables: pantallas más alias. Es lo que el índice lista y las rutas cubren.
 *
 * ── ⚠ Por qué recibe los diccionarios en vez de leerlos del módulo ──────────────────────────
 * Los dos parámetros son **para poder testear la composición**, y no son un adorno: con
 * `DIC_PANTALLAS` y `DIC_ALIAS` los dos **vacíos** —el estado de la Fase 4— toda aserción sobre
 * el valor de retorno es `[] === []`, así que una implementación que devolviera solo las
 * pantallas, solo los alias, o un `[]` fijo pasaría idéntico. Se comprobó mutando: degradar el
 * cuerpo a `[...Object.keys(DIC_PANTALLAS)]` dejaba **los 5 casos verdes**.
 *
 * Con los diccionarios como parámetro, el spec le pasa datos donde las dos mitades se
 * distinguen (`{'pantalla-a': ...}` + `{'alias-b': 'pantalla-a'}`) y asevera sobre **esta**
 * función en vez de sobre una copia de su lógica escrita en el test — que era el agujero: el
 * caso anterior probaba un `fnUnir` local, no el código de producción.
 *
 * Los defaults son los diccionarios reales, así que ninguna llamada de la app pasa argumentos:
 * `app.routes.ts`, `indice-pantallas.ts` y `pantalla-no-encontrada.ts` la invocan sin nada.
 */
export function listarSlugsEnrutables(
  in_dicPantallas: Record<string, unknown> = DIC_PANTALLAS,
  in_dicAlias: Record<string, string> = DIC_ALIAS,
): string[] {
  return [...Object.keys(in_dicPantallas), ...Object.keys(in_dicAlias)];
}
