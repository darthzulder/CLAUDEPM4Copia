// ESLint (flat config) del BFF — guardrail de arquitectura, igual criterio que el del
// frontend: NO es un linter de estilo. Lo que tsc ya detecta no se repite acá, y no se
// prohíben cosas con falsos positivos legítimos. Solo se blindan los límites que, si se
// cruzan, rompen el diseño del backend de forma difícil de ver en review.
//
// Hasta ahora el backend no tenía lint en absoluto: `npm run lint` de la raíz solo corría el
// workspace de frontend, así que al código del proxy únicamente lo miraba `tsc`.

import tsParser from '@typescript-eslint/parser';

/** Únicos archivos autorizados a leer secretos del entorno. */
const CLL_ARCHIVOS_CON_SECRETOS = [
  'src/lib/token.ts',              // PM4_TOKEN + IFRAME_ENCRYPTION_KEY
  'src/routes/recaptcha.routes.ts', // RECAPTCHA_SECRET_KEY
  'src/**/*.test.ts',              // los tests los setean/limpian para poder cubrir la lógica
];

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            // El BFF es la frontera: el frontend habla con él por HTTP (`/api/*`), nunca por
            // import. Un import cruzado acopla los dos builds y rompe el despliegue, donde
            // backend/dist y frontend/dist son artefactos separados.
            group: ['**/frontend/**', '../../frontend', '../../frontend/*'],
            message: 'El backend no importa código del frontend. La frontera es HTTP (/api/*), no el módulo.',
          },
          {
            // Un paquete del Design System no tiene nada que hacer en un proxy sin UI.
            group: ['@zurich/*'],
            message: 'El Zurich DS es del frontend. El backend no renderiza nada.',
          },
        ],
      }],
      // Los secretos se leen en UN solo lugar por secreto. Si una ruta nueva lee
      // process.env.PM4_TOKEN por su cuenta, se duplica la política de resolución del token
      // (descifrado AES + expiración) que `lib/token.ts` centraliza y que está testeada.
      'no-restricted-syntax': ['error', {
        selector:
          "MemberExpression[object.object.name='process'][object.property.name='env']" +
          "[property.name=/^(PM4_TOKEN|IFRAME_ENCRYPTION_KEY|RECAPTCHA_SECRET_KEY)$/]",
        message:
          'Los secretos se leen solo en lib/token.ts (PM4_TOKEN, IFRAME_ENCRYPTION_KEY) y routes/recaptcha.routes.ts (RECAPTCHA_SECRET_KEY). Pedí el valor a esos módulos.',
      }],
    },
  },
  {
    files: CLL_ARCHIVOS_CON_SECRETOS,
    rules: { 'no-restricted-syntax': 'off' },
  },
];
