import { defineConfig } from 'vitest/config';

// El backend solo tiene lógica pura testeable (lib/*.ts): entorno 'node', sin DOM ni setup.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Misma zona fija que el frontend, por el mismo motivo: la expiración del token cifrado
    // se calcula con epoch (inmune a TZ), pero cualquier test de fecha futuro no lo sería.
    env: { TZ: 'America/Bogota' },
    // Ver la nota extendida en frontend/vitest.config.ts: clearMocks limpia las llamadas
    // pero conserva la implementación; mockReset la borraría y rompería los mocks de módulo.
    clearMocks: true,
    // Sin `thresholds` a propósito (mismo criterio que el frontend): el lcov existe para que
    // scripts/coverage-diff.mjs pueda reportar las líneas del diff, no para imponer un número.
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.ts'],
      // `server.ts` queda fuera: es el arranque de Express (app.listen), no hay forma de
      // ejecutarlo en un test unitario sin levantar el servidor, y su lógica testeable ya se
      // extrajo a lib/. Las rutas quedan DENTRO a propósito, para que su falta de cobertura
      // sea visible en vez de estar escondida por una exclusión.
      exclude: ['src/**/*.test.ts', 'src/server.ts'],
    },
  },
});
