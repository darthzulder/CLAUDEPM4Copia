import { defineConfig } from 'vitest/config';

/**
 * Suite de los utilitarios de `scripts/` (Node puro, sin DOM ni React).
 *
 * Va en un config aparte y no como un project más de `frontend/vitest.config.ts` porque estos
 * módulos no pertenecen a ningún workspace: son tooling del repo, corren con `node` suelto y no
 * pasan por Vite ni por el build de la app.
 *
 * Se engancha al gate como un paso propio de `scripts/verify.mjs` (`test · scripts`). No alcanza
 * con agregarlo al script `test` del package.json: `verify.mjs` mantiene su propia lista de pasos
 * y nunca invoca `npm run test`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.mjs'],
    // Los tests de historial.mjs crean repos git temporales; el default de 5s se queda corto en
    // Windows, donde cada `git init` paga el arranque del proceso.
    testTimeout: 20_000,
  },
});
