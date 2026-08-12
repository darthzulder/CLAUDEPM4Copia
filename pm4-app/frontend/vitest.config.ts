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
