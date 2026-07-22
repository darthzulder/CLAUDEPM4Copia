// ESLint (flat config) — guardrail de arquitectura del proyecto.
//
// Objetivo único y deliberado: que el Zurich DS se consuma SIEMPRE desde dos
// únicos puntos autorizados, nunca importando `@zurich/*` directo en
// screens/componentes:
//   - `components/fields/ZdsFields`  → componentes (web-components + wrappers)
//   - `zds-setup`                    → assets globales (base.css + javascript.js)
// Fuera de ahí, cualquier import de @zurich/* es un error de arquitectura.
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
          group: [
            '@zurich/web-components', '@zurich/web-components/*',
            '@zurich/css-components', '@zurich/css-components/*',
          ],
          message:
            'No importes @zurich/* directo. Componentes → fachada components/fields/ZdsFields; assets globales (base.css/javascript.js) → zds-setup.',
        }],
      }],
    },
  },
  {
    // Únicos puntos autorizados a importar @zurich/* directo:
    //  - ZdsFields → componentes (web-components + wrappers React)
    //  - zds-setup → assets globales (base.css + javascript.js)
    files: ['src/components/fields/ZdsFields.tsx', 'src/zds-setup.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
];
