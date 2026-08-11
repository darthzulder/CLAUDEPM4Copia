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
