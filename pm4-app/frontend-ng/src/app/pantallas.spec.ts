import { describe, expect, it } from 'vitest';
import { DIC_ALIAS, DIC_PANTALLAS, listarSlugsEnrutables } from './pantallas';

/**
 * **La guarda de inventario.** Equivalente de `frontend/src/App.smoke.test.tsx` y el único
 * mecanismo del proyecto que no depende de la buena voluntad de quien programa: registrar una
 * pantalla sin su spec pone la suite **roja nombrando el slug**.
 *
 * ── Por qué existe, en una línea ─────────────────────────────────────────────────────────────
 * Porque los cuatro anillos de `verify` atrapan *"rompiste algo"*, no *"no lo testeaste"*. Nada
 * más en el proyecto obliga a escribir el test de una pantalla nueva. Esto sí.
 *
 * ── Se escribe en la Fase 4, ANTES de que exista la primera pantalla ─────────────────────────
 * Es deliberado y es el punto entero: una guarda escrita después se escribe, sin querer, a la
 * medida de lo que ya se construyó. Escrita antes, cada pantalla de la Fase 5 se encuentra un
 * requisito que ya estaba puesto.
 *
 * ── ⚠ Cómo se agrega una pantalla en la Fase 5: DOS listas, las dos obligatorias ────────────
 * 1. Su entrada en `DIC_PANTALLAS` (`pantallas.ts`), con el slug real de PM4 y su `loadComponent`.
 * 2. Su slug en `CLL_SLUGS_CON_SPEC`, **abajo**, y solo si de verdad tiene un spec propio.
 *
 * Poner el slug en la lista de abajo sin escribir el spec es posible —ninguna guarda puede
 * impedirlo— pero es una mentira explícita y deliberada, no un olvido. Eso es exactamente lo que
 * esta guarda compra: convierte el modo de falla barato (olvidarse) en uno que hay que elegir.
 *
 * ── Por qué se compara en las DOS direcciones ────────────────────────────────────────────────
 * Se hereda de `App.smoke.test.tsx`, que reporta `cllSinCubrir` y `cllFantasma` por separado:
 * - **Sin cubrir**: hay pantalla y no hay spec. Es el caso que motiva la guarda.
 * - **Fantasma**: hay slug en la lista y no hay pantalla. Pasa al renombrar un slug o al borrar
 *   una pantalla, y es igual de malo: la lista deja de ser un inventario y se vuelve un archivo
 *   que nadie puede confiar. Sin esta mitad la guarda se degrada sola con el tiempo.
 */

/**
 * Los slugs que **tienen** su propio spec de pantalla.
 *
 * Las dos listas crecen juntas, de a una por pantalla: las 12 de la Fase 5 —**once** formularios de
 * negocio más el visor de la doc del Web Service, que cierra la fase—. La primera fue la SCR-008 y la
 * segunda la SCR-004; cada spec vive en la carpeta de su pantalla (`revision-respuesta-sac.spec.ts`,
 * `revision-error-tecnico-api.spec.ts`) y cubre un caso por RUL/ACT, no un smoke.
 *
 * La 12.ª es la excepción a ese "por RUL/ACT" y vale nombrarla: `smartsupervision-api-docs` no tiene
 * anexo, ni campos, ni reglas —es un `<iframe>` a un asset estático—, así que sus casos cubren el otro
 * contrato que tiene una pantalla así: el markup **y que el archivo que el `src` nombra exista en el
 * disco**. Sigue sin ser un smoke.
 *
 * ⚠ **Los alias NO van acá.** Un alias no es una pantalla nueva (ver `DIC_ALIAS`): no hay nada
 * propio que cubrir, y exigirle un spec forzaría un archivo duplicado del de su destino. Lo que sí
 * se asevera de un alias es que siga enrutando, y eso lo cubre `app.routes.spec.ts`. Hoy `DIC_ALIAS`
 * está vacío (la ex SCR-010 se eliminó del proyecto), así que la distinción no tiene ejemplo vivo —
 * pero el mecanismo sigue vigilado por los casos de abajo.
 */
const CLL_SLUGS_CON_SPEC: string[] = [
  // Fase 5 — un slug por pantalla portada, en el mismo commit que su spec.
  'COL_QD_SCR-008_Revision_Respuesta_SAC',
  'COL_QD_SCR-004_Revision_Error_Tecnico_API',
  'COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga',
  'COL_QD_SCR-012_Revision_Error_Funcional_Prorroga',
  'COL_QD_SCR-003_Correccion_Error_Funcional',
  // La única de Otras Solicitudes hasta ahora, y la única con DOS specs: la pantalla
  // (`gestion-linea2.spec.ts`) y su modal de reasignación (`reasignar-caso-modal.spec.ts`).
  'COL_OS_SCR-003_Bandeja_Gestion_Linea2',
  'COL_QD_SCR-0052_Respuesta_Area_Responsable',
  'COL_QD_SCR-009_Formulario_Superintendencia',
  // La segunda con DOS specs: la pantalla (`detalle-reasignacion-respuesta.spec.ts`) y su modal de
  // expediente (`expediente-completo-modal.spec.ts`), que tiene su propia regla aseverable —el
  // bloque sin campos con dato desaparece completo, título incluido— y no depende del form.
  'COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta',
  // La primera con **cinco** archivos de test: la pantalla (`dashboard-gestion-casos.spec.ts`), su
  // modal (`detalle-caso-modal.spec.ts`), su tabla (`tabla-casos.spec.ts`), sus helpers puros
  // (`dashboard-helpers.spec.ts`) y su servicio de carga (`casos-dashboard.service.spec.ts`). Es la
  // única pantalla sin `task_id`, así que su carga paginada es lógica propia y se cubre aparte; y la
  // tabla tiene spec propio porque las reglas de los dos huecos de `TableZ` —los `id` literales
  // `start`/`end`, el typo `generciEndName` y el empty state como hermano— se degradan **sin** poner
  // rojo nada de la pantalla.
  'COL_QD_SCR-013_Dashboard_Gestion_Casos',
  // La única Web Entry, y la que cierra la brecha declarada del spec React: allá el envío exitoso
  // era inaseverable (~20 obligatorios en selects del DS no interactuables bajo jsdom, más el
  // municipio que RUL-000-09 vacía en la propia precarga), acá los controles se llenan con
  // `patchValue` y las **dos** ramas de envío se aseveran por la URL que sale al backend.
  'COL_QD_SCR-000_CrearRecibirQueja',
  // La que cierra la Fase 5, y la única que no es un formulario: el visor de la doc del Web Service
  // Smartsupervisión. Su spec no es un smoke aunque la pantalla sea un solo `<iframe>` — asevera el
  // markup **y que el asset exista en `public/`**, que es la mitad que React no cubría (allá el caso
  // quedaba verde con la carpeta `public/docs/` ausente).
  'smartsupervision-api-docs',
];

describe('guarda de inventario de pantallas', () => {
  it('toda pantalla registrada tiene su spec, y todo spec listado tiene su pantalla', () => {
    const setConSpec = new Set(CLL_SLUGS_CON_SPEC);
    const setRegistradas = new Set(Object.keys(DIC_PANTALLAS));

    const cllSinCubrir = [...setRegistradas].filter((in_strSlug) => !setConSpec.has(in_strSlug));
    const cllFantasma = [...setConSpec].filter((in_strSlug) => !setRegistradas.has(in_strSlug));

    // Los slugs van **dentro del string** de la aserción, no en un objeto: es lo que hace que el
    // mensaje del fallo nombre la pantalla que falta en vez de un diff de arrays que hay que ir a
    // leer. Es la diferencia entre una guarda que dice qué hacer y una que solo dice que algo pasa.
    expect(
      `sin spec: [${cllSinCubrir.join(', ')}] · fantasma: [${cllFantasma.join(', ')}]`,
    ).toBe('sin spec: [] · fantasma: []');
  });

  it('los slugs enrutables son las pantallas más los alias, sin perder ninguno', () => {
    const cllEsperados = [...Object.keys(DIC_PANTALLAS), ...Object.keys(DIC_ALIAS)];

    // Guarda de `listarSlugsEnrutables()`, que es de quien dependen el índice y las rutas. Si
    // alguien la "simplificara" a devolver solo `DIC_PANTALLAS`, los alias desaparecerían del
    // índice sin que nada más se ponga rojo.
    //
    // ⚠ Con los dos diccionarios vacíos este caso pasa por vacuidad (`[] === []`), y eso es
    // conocido, no un descuido: el caso de abajo (`la unión no se degrada a DIC_PANTALLAS`) es el
    // que mantiene la aserción con contenido mientras el registro esté vacío.
    expect(listarSlugsEnrutables().sort()).toEqual(cllEsperados.sort());
  });

  it('⚠ la unión no se degrada a DIC_PANTALLAS, aunque hoy no haya alias', () => {
    // **Este caso existe porque los dos diccionarios están vacíos y el de arriba, solo, no guarda
    // nada.** `listarSlugsEnrutables()` es de quien dependen el índice y la tabla de rutas, y con
    // `{}` y `{}` cualquier implementación equivocada —devolver solo las pantallas, solo los alias,
    // o un array fijo vacío— pasa igual. Se le pasan diccionarios de mentira para que la aserción
    // tenga contenido **hoy**, no recién cuando la Fase 5 registre la primera pantalla.
    //
    // ⚠ **La primera versión de este caso no servía, y la mutación lo demostró.** Comparaba un
    // `fnUnir` escrito acá contra `fnUnir(DIC_PANTALLAS, DIC_ALIAS)`: la primera mitad probaba una
    // copia de la lógica escrita en el test —no el código de producción— y la segunda volvía a ser
    // `[] === []`. Degradar la función real a `[...Object.keys(DIC_PANTALLAS)]` dejaba **los 5 casos
    // de este archivo verdes**. Por eso `listarSlugsEnrutables()` toma los diccionarios por
    // parámetro: es lo que permite aseverar sobre **la función misma** con datos distinguibles.
    //
    // La ex SCR-010 era el único alias real y se eliminó del proyecto (ago-2026), así que sin este
    // caso la mitad "más los alias" de la función se quedaría sin vigilancia hasta que aparezca el
    // próximo slug renombrado — que es exactamente cuando un olvido cuesta un iframe en blanco.
    const dicPantallasFalsas = { 'pantalla-a': async () => ({}) };
    const dicAliasFalsos = { 'alias-b': 'pantalla-a' };

    // El orden importa y es parte del contrato: las pantallas primero, los alias después. Es el
    // orden en que `generarRutasDePantallas()` inserta las rutas.
    expect(listarSlugsEnrutables(dicPantallasFalsas, dicAliasFalsos)).toEqual([
      'pantalla-a',
      'alias-b',
    ]);

    // Y las dos mitades por separado, para que perder cualquiera de las dos se nombre sola en vez
    // de salir como un diff de arrays que hay que ir a leer.
    expect(listarSlugsEnrutables(dicPantallasFalsas, {})).toEqual(['pantalla-a']);
    expect(listarSlugsEnrutables({}, dicAliasFalsos)).toEqual(['alias-b']);
  });

  it('⚠ no quedó ningún alias de la ex SCR-010, que se eliminó del proyecto', () => {
    // **Es una guarda de borrado, no un residuo del alias que había.** La SCR-010 (Cierre M3) se
    // fusionó en la SCR-009 y después se eliminó, y el usuario indicó explícitamente quitarla. La
    // versión anterior de este archivo aseveraba lo **contrario** —que el alias siguiera declarado,
    // con el motivo de que había nodos del BPM apuntando al slug viejo—, así que sin este caso el
    // requisito quedaría solo en un comentario y un `git log`.
    //
    // Nótese que `frontend/src/App.tsx:52` **todavía** lo declara: React se borra entero en la Fase
    // 7, y tocarlo ahora sería un cambio funcional en la app que hoy está desplegada. La diferencia
    // es deliberada y queda anotada acá porque es donde se va a notar al comparar los dos registros.
    expect(Object.keys(DIC_ALIAS)).not.toContain('COL_QD_SCR-010_cierre-m3');
    expect(Object.keys(DIC_PANTALLAS)).not.toContain('COL_QD_SCR-010_cierre-m3');
    expect(listarSlugsEnrutables()).not.toContain('COL_QD_SCR-010_cierre-m3');
  });

  it('todo alias apunta a una pantalla que existe en el registro', () => {
    // ⚠ **El `length > 0` no es un truco para pasar: es la mitad que hace que esta guarda sirva.**
    // Hoy el único alias apunta a la SCR-009, que se porta en la Fase 5, así que sin ese guarda este
    // caso nacería rojo — y un test que nace rojo se termina borrando o comentando, que es peor que
    // no tenerlo. Con el guarda queda **armado**: en cuanto haya una sola pantalla registrada, la
    // condición se activa y el alias tiene que apuntar a algo que exista.
    //
    // Es la otra mitad del `continue` de `generarRutasDePantallas()`: allá se decide **no crear** una
    // ruta rota (que sería un iframe en blanco), acá se decide **avisar** cuando ya no hay excusa
    // para que falte el destino.
    const blnHayPantallas = Object.keys(DIC_PANTALLAS).length > 0;
    const cllRotos = Object.entries(DIC_ALIAS)
      .filter(([, in_strDestino]) => blnHayPantallas && !DIC_PANTALLAS[in_strDestino])
      .map(([in_strAlias, in_strDestino]) => `${in_strAlias} → ${in_strDestino}`);

    expect(`alias rotos: [${cllRotos.join(', ')}]`).toBe('alias rotos: []');
  });
});
