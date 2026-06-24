// ESLint (flat config) — guardrail de arquitectura del proyecto.
//
// Objetivo único y deliberado: que los componentes del Zurich DS se consuman
// SIEMPRE desde la fachada `components/fields/ZdsFields`, nunca importando
// `@zurich/web-components` directamente en screens/componentes. Esa fachada es
// la única fuente de verdad del DS en la app.
//
// NO se intenta prohibir `display:flex`/`style=` inline vía lint: hay usos
// legítimos (estilos dinámicos, tokens `--z-*` inline) y un ban produciría
// demasiados falsos positivos. Eso queda como convención (ver CLAUDE.md →
// "Jerarquía de decisión de UI") y se cubre en code review.
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    // Registramos react-hooks solo para que resuelvan las directivas
    // `// eslint-disable-next-line react-hooks/*` ya presentes en el código.
    // No activamos sus reglas: el alcance de este lint es el guardrail de imports.
    plugins: { 'react-hooks': reactHooks },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@zurich/web-components', '@zurich/web-components/*'],
          message:
            'Importa los componentes Zurich DS desde la fachada (components/fields/ZdsFields), no directamente desde @zurich/web-components.',
        }],
      }],
    },
  },
  {
    // La fachada es el ÚNICO lugar autorizado a importar @zurich/* directo.
    files: ['src/components/fields/ZdsFields.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
];
