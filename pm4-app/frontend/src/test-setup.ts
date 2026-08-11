// Setup global de Vitest para tests con DOM (.test.tsx). Se carga antes de cada archivo de
// test del project 'components' (ver vitest.config.ts). No aplica a los .test.ts de lógica
// pura, que corren en el project 'logic' con entorno 'node' y sin este setup.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// React Testing Library solo auto-registra su cleanup cuando existe un `afterEach` GLOBAL,
// y este proyecto corre con `globals: false` (default de Vitest). Sin este registro
// explícito, cada render() de un mismo archivo se acumula en el document.body y el segundo
// `getBy*` falla con "Found multiple elements". Verificado: sin esta línea, un archivo con
// 3 it() que renderizan la misma pantalla falla en el 2º.
afterEach(cleanup);
