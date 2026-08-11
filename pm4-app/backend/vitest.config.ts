import { defineConfig } from 'vitest/config';

// El backend solo tiene lógica pura testeable (lib/*.ts): entorno 'node', sin DOM ni setup.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Misma zona fija que el frontend, por el mismo motivo: la expiración del token cifrado
    // se calcula con epoch (inmune a TZ), pero cualquier test de fecha futuro no lo sería.
    env: { TZ: 'America/Bogota' },
  },
});
