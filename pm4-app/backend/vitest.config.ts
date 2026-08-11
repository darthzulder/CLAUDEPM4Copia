import { defineConfig } from 'vitest/config';

// El backend solo tiene lógica pura testeable (lib/*.ts): entorno 'node', sin DOM ni setup.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
