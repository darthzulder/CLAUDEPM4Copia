import { defineConfig } from 'vitest/config';

// Config separada de vite.config.ts a propósito: la de build depende de loadEnv()
// contra el .env de pm4-app (VITE_RECAPTCHA_SITE_KEY, __COMMIT_HASH__) que no aporta
// nada a tests de lógica pura y solo añadiría ruido/acoplamiento al entorno de test.
export default defineConfig({
  test: {
    environment: 'node', // lógica pura (hooks/utils), sin DOM
    include: ['src/**/*.test.ts'],
  },
});
