import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App, { SCREENS } from './App';

// Smoke test de ARRANQUE: monta cada pantalla registrada por su slug real (`?screen=…`) y
// verifica que no revienta al montar.
//
// Cubre un hueco que ni el build ni los tests unitarios alcanzan. `tsc` detecta un import roto,
// pero no un error de RUNTIME al montar: un hook que lee una propiedad de undefined, un
// componente del DS usado con props que no existen, un import circular que resuelve a
// undefined. Y los tests por pantalla solo protegen a las pantallas que ya tienen test —
// quedan varios archivos sin uno. Este archivo le pone una red mínima a TODAS.
//
// Lo que este test NO es: una prueba de comportamiento. No asserta reglas de negocio ni valores.
// Que una pantalla monte no dice nada de si funciona; para eso está su test propio. Acá el único
// contrato es "no explota", y el valor está en que cubre las 13 de golpe y a costo casi cero.
//
// Cómo detecta la explosión: no con try/catch, sino a través del ErrorBoundary de App, que
// convierte cualquier throw del árbol en el texto "Error de Render" en el DOM. Eso lo vuelve una
// aserción normal, y además prueba de paso que el propio boundary sigue funcionando.

// ── Mocks ─────────────────────────────────────────────────────────────────────────────────
// Referencias a nivel de MÓDULO, nunca literales frescos dentro de la factory: un objeto nuevo
// por llamada cambia de identidad en cada render, los efectos que lo tienen como dependencia
// se vuelven a disparar y el resultado es un bucle infinito de render que muere por OOM a los
// ~5 minutos. Está documentado como trampa nº1 en docs/guides/testing-conventions.md.

const OBJ_RESPUESTA_VACIA = { data: [] };
const OBJ_PM4 = {
  get: vi.fn(() => Promise.resolve(OBJ_RESPUESTA_VACIA)),
  post: vi.fn(() => Promise.resolve(OBJ_RESPUESTA_VACIA)),
  put: vi.fn(() => Promise.resolve(OBJ_RESPUESTA_VACIA)),
  delete: vi.fn(() => Promise.resolve(OBJ_RESPUESTA_VACIA)),
};

// Se mockea el cliente HTTP y NO `useCollection`: así los hooks de catálogos corren de verdad
// (con respuestas vacías) en vez de quedar cortocircuitados, que es más código real ejercitado
// por el mismo precio.
vi.mock('./api/pm4Client', () => ({ default: OBJ_PM4 }));

const OBJ_TASK = {
  id: 1,
  status: 'ACTIVE',
  process_request_id: 10,
  // Sin datos precargados a propósito: es el caso más hostil para una pantalla —todo
  // undefined— y el que revienta si alguien lee `task.data.algo.otro` sin guarda.
  data: {} as Record<string, unknown>,
};

const OBJ_USE_TASK = {
  task: OBJ_TASK,
  loading: false,
  error: null as string | null,
  submitting: false,
  // Devuelven promesas resueltas porque varias pantallas encadenan `.catch()` sobre el
  // resultado; un `vi.fn()` pelado devuelve undefined y explota con "cannot read .catch of
  // undefined" — que sería un falso positivo del smoke test, no un bug de la pantalla.
  completeTask: vi.fn(() => Promise.resolve({})),
  saveDraft: vi.fn(() => Promise.resolve({})),
  reassignTask: vi.fn(() => Promise.resolve({})),
  startProcess: vi.fn(() => Promise.resolve({})),
  isWebEntry: false,
};

vi.mock('./core/useTask', () => ({ useTask: () => OBJ_USE_TASK }));

// ── Inventario de pantallas ───────────────────────────────────────────────────────────────

/** Slugs que este smoke test monta. */
const CLL_SLUGS = [
  'COL_QD_SCR-000_CrearRecibirQueja',
  'COL_QD_SCR-003_Correccion_Error_Funcional',
  'COL_QD_SCR-004_Revision_Error_Tecnico_API',
  'COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta',
  'COL_QD_SCR-0052_Respuesta_Area_Responsable',
  'COL_QD_SCR-008_Revision_Respuesta_SAC',
  'COL_QD_SCR-009_Formulario_Superintendencia',
  'COL_QD_SCR-010_cierre-m3',
  'COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga',
  'COL_QD_SCR-012_Revision_Error_Funcional_Prorroga',
  'COL_QD_SCR-013_Dashboard_Gestion_Casos',
  'COL_OS_SCR-003_Bandeja_Gestion_Linea2',
  'ds-catalog',
  'smartsupervision-api-docs',
];

beforeEach(() => {
  OBJ_TASK.data = {};
  OBJ_USE_TASK.loading = false;
  OBJ_USE_TASK.error = null;
  // SCR-000 espera el widget de reCAPTCHA: sin este stub, loadRecaptcha() aguarda el script
  // real de Google y expira a los 10s.
  window.grecaptcha = { render: vi.fn(() => 1), reset: vi.fn() };
  // jsdom no implementa scrollTo y algunas pantallas lo llaman al montar.
  window.scrollTo = vi.fn();
});

/** Apunta la URL al slug pedido: App lee `window.location.search` en cada render. */
function irA(in_strSlug: string) {
  window.history.replaceState({}, '', `/?screen=${in_strSlug}`);
}

describe('Arranque de la app (smoke)', () => {
  // Guarda de inventario. Sin esto el archivo se degrada solo: se agrega una pantalla a
  // App.tsx, nadie se acuerda de sumarla acá, y el smoke test sigue verde cubriendo una
  // pantalla menos — exactamente la clase de falso verde que este proyecto ya tuvo.
  it('la lista de este test cubre TODAS las pantallas registradas en App.tsx', () => {
    const setRegistradas = new Set(Object.keys(SCREENS));
    const setCubiertas = new Set(CLL_SLUGS);

    // Se reportan las diferencias en ambos sentidos con el nombre del slug: si falla, el
    // mensaje dice QUÉ pantalla falta, no solo que dos números no coinciden.
    const cllSinCubrir = [...setRegistradas].filter((in_strSlug) => !setCubiertas.has(in_strSlug));
    const cllFantasma = [...setCubiertas].filter((in_strSlug) => !setRegistradas.has(in_strSlug));

    expect(cllSinCubrir).toEqual([]);
    expect(cllFantasma).toEqual([]);
  });

  it('una pantalla inexistente muestra el mensaje de no encontrada, sin reventar', async () => {
    irA('pantalla-que-no-existe');
    render(<App />);

    expect(await screen.findByText(/Pantalla no encontrada/)).toBeInTheDocument();
    expect(screen.queryByText('Error de Render')).not.toBeInTheDocument();
  });

  it('sin ?screen renderiza el índice de pantallas', async () => {
    window.history.replaceState({}, '', '/');
    render(<App />);

    expect(await screen.findByText('PM4 Screens')).toBeInTheDocument();
    expect(screen.getByText(`${Object.keys(SCREENS).length} pantallas disponibles`)).toBeInTheDocument();
  });

  // Un `it` por pantalla en vez de un bucle dentro de uno solo: así el reporte dice cuál
  // pantalla se rompió, y una que explota no impide que se prueben las demás.
  for (const strSlug of CLL_SLUGS) {
    it(`monta sin errores: ${strSlug}`, async () => {
      irA(strSlug);
      const { container } = render(<App />);

      // Las pantallas son `lazy()`, así que primero aparece el fallback de Suspense. Esperar a
      // que el `.loading-overlay` desaparezca es la señal de que el chunk resolvió y el árbol
      // real se montó — sin esto el test asertaría sobre el spinner y pasaría siempre.
      //
      // El `timeout` explícito NO es cosmético: el default de RTL es 1000 ms, mientras que el
      // `testTimeout` de vitest.config.ts es 15_000. Esa asimetría era la causa real de la
      // intermitencia que el encabezado de scripts/verify.mjs atribuía a Docker: con los 34
      // archivos de la suite compitiendo por el pool de workers, resolver el chunk de una
      // pantalla cargada de componentes del DS pasa del segundo, y `waitFor` abandonaba cuando
      // al test le quedaban 14 s de presupuesto sin usar. Aislado (`vitest run
      // src/App.smoke.test.tsx`) pasaba 17/17 siempre; en la suite completa fallaban 1-2
      // pantallas distintas por corrida, y con `--maxWorkers=1` volvían a pasar 413/413. Alinear
      // los dos números elimina la carrera sin ocultar una rotura real: si una pantalla explota
      // de verdad, el ErrorBoundary la pinta y la aserción de abajo falla igual, sin esperar.
      await waitFor(() => {
        expect(container.querySelector('.loading-overlay')).toBeNull();
      }, { timeout: 15_000 });

      // El ErrorBoundary de App atrapa cualquier throw del árbol y lo pinta como "Error de
      // Render" junto al stack, así que el mensaje de fallo ya trae el diagnóstico.
      const objError = screen.queryByText('Error de Render');
      const strDetalle = objError ? (container.querySelector('pre')?.textContent ?? '') : '';
      expect(objError, `La pantalla ${strSlug} explotó al montar:\n${strDetalle}`).toBeNull();
    });
  }
});
