import { defineConfig } from 'vitest/config';

// Config separada de vite.config.ts a propósito: la de build depende de loadEnv()
// contra el .env de pm4-app (VITE_RECAPTCHA_SITE_KEY, __COMMIT_HASH__) que no aporta
// nada a tests de lógica pura y solo añadiría ruido/acoplamiento al entorno de test.
//
// Dos "projects" (reemplazo de `environmentMatchGlobs`, removido en Vitest 4): los
// .test.ts de lógica pura corren en 'node' sin DOM (rápido, sin ruido); los .test.tsx de
// componentes/pantallas con React Testing Library corren en 'jsdom' (ver
// docs/guides/testing-conventions.md).
export default defineConfig({
  // `__COMMIT_HASH__` lo inyecta vite.config.ts en el build real; acá se define para que el
  // índice de pantallas (App.tsx → ScreenIndex, que lo imprime) pueda renderizarse en el smoke
  // test. Sin esto sería un ReferenceError.
  define: { __COMMIT_HASH__: '"test"' },
  test: {
    // Zona horaria FIJA para toda la suite. Sin esto, cualquier aserción de fecha depende de
    // la zona de la máquina: pasa en local (Colombia, UTC-5) y falla en CI (UTC). Se elige
    // America/Bogota y no UTC porque es la zona de negocio y porque `fechaHora.ts` convierte
    // UTC→local a propósito para mostrar; además no tiene DST, así que es determinista todo
    // el año. Verificado por el test de guardia en core/fechaHora.test.ts.
    env: { TZ: 'America/Bogota' },
    // Limpia `mock.calls`/`mock.results` antes de cada test, para que un archivo sin
    // `vi.clearAllMocks()` propio no arrastre llamadas de un test al siguiente (varios
    // asertan sobre `completeTask.mock.calls`).
    //
    // ⚠️ `clearMocks`, NO `mockReset`/`resetMocks`: `clearMocks` conserva la
    // IMPLEMENTACIÓN del mock, mientras que `mockReset` la borra. Varios tests declaran a
    // nivel de módulo cosas como `completeTask: vi.fn(() => Promise.resolve({}))` porque la
    // pantalla encadena `.catch()` sobre el resultado; con `mockReset` esa implementación
    // desaparecería y esas pantallas explotarían con "cannot read .catch of undefined".
    clearMocks: true,
    // El default de Vitest (5s) alcanza justo para las pantallas más pesadas y se vuelve
    // intermitente bajo carga: SCR-003 monta SeccionCamposPayload + useMatrizMotivos (3
    // useCollection) sobre jsdom, y con varios workers en paralelo su primer render llegó a
    // rozar los 5s y tumbó el gate sin que nada estuviera roto. 15s da margen en máquinas
    // cargadas y en el runner de CI. No enmascara cuelgues reales: un bucle de render
    // infinito revienta antes por memoria (OOM), no por timeout.
    testTimeout: 15_000,
    // Cobertura para `npm run coverage`. NO hay `thresholds` a propósito: el gate de este
    // proyecto es que el test se ponga rojo cuando se rompe el código (ver
    // docs/guides/testing-conventions.md), y un umbral obligatorio premia justo lo contrario —
    // tests que ejecutan líneas sin asertar nada, que es la deuda que ya se pagó una vez.
    // El lcov lo consume scripts/coverage-diff.mjs para reportar solo las líneas del diff.
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      // Nada de esto es código de producto cuya cobertura signifique algo: los *.test.* son
      // el instrumento de medición, `main.tsx`/`zds-setup.ts` son bootstrap que solo corre en
      // el navegador real, y los `*.types.ts` no emiten runtime.
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test-setup.ts',
        'src/main.tsx',
        'src/zds-setup.ts',
        'src/**/*.types.ts',
      ],
    },
    projects: [
      {
        extends: true,
        test: { name: 'logic', environment: 'node', include: ['src/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test-setup.ts'],
        },
      },
    ],
  },
});
