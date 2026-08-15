// ESLint (flat config) — guardrail de arquitectura del workspace Angular.
//
// Mismo objetivo y misma forma que `frontend/eslint.config.mjs`, que es el precedente de
// este repo: el Zurich DS se consume SIEMPRE desde dos únicos puntos autorizados, nunca
// importando `@zurich/*` / `@zurich-col/*` directo en pantallas o componentes:
//   - `components/fields/`  → componentes (los wrappers CVA sobre lib-*-z y za-*)
//   - `zds-setup.ts`        → assets globales (base.css + javascript.js)
// Fuera de ahí, cualquier import del DS es un error de arquitectura. Es la regla 2 de
// pm4-app/CLAUDE.md hecha ejecutable.
//
// Dos diferencias respecto de la config de React, ambas obligadas por la migración:
//
// 1. El grupo prohibido incluye `@zurich-col/*`. En React no existía porque `lib-zurich`
//    (la librería de Zurich Colombia) es la base de UI **nueva** — se eligió al migrar a
//    Angular. Sin esa entrada, el guardrail tendría un agujero del tamaño de los 27
//    componentes `lib-*-z`, que son justamente los que las pantallas van a querer importar
//    de más.
// 2. El punto autorizado es la CARPETA `components/fields/`, no un archivo único. La
//    fachada React caben en un `ZdsFields.tsx` de 695 líneas porque un wrapper con
//    `Controller` son ~15 líneas; en Angular cada wrapper es un componente standalone con
//    su clase CVA, así que un solo archivo violaría el límite de 300 líneas del proyecto.
//    El choke point sigue siendo uno a nivel arquitectura, solo que es un directorio.
import tsParser from '@typescript-eslint/parser';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default tseslint.config(
  {
    // ⚠ `src/env.generated.ts` NO se lintea, y el motivo es que la regla y el archivo se
    // contradicen por diseño. Lo emite `scripts/gen-env-define.mjs` con una anotación
    // `: string` **explícita en cada constante**, que `no-inferrable-types` marca como
    // redundante — y no lo es: sin ella el tipo es el **literal** del valor (`"true"`, `""`),
    // y `tsc` rechaza cualquier comparación contra otro literal con `TS2367` aunque el valor
    // salga del `.env` de la máquina que buildea y no sea un hecho de compilación (es el
    // `LOCK_COUNTRY` de `fields/fields.ts`, `VITE_LOCK_COUNTRY !== 'false'`). O sea que
    // obedecer a ESLint acá rompería el typecheck del mismo `npm run lint`.
    //
    // Se ignora en vez de meter un `eslint-disable` en la plantilla del generador porque el
    // archivo es **generado y gitignoreado**: lintear su salida no protege nada (nadie lo
    // edita a mano) y el `--max-warnings=0` del script lo convertía en un rojo de `verify`
    // que depende de qué claves tenga el `.env` de cada uno. `tsc` sí lo sigue chequeando,
    // que es donde el archivo importa.
    ignores: ['src/env.generated.ts'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@zurich/web-components', '@zurich/web-components/*',
                '@zurich/css-components', '@zurich/css-components/*',
                '@zurich/angular-components', '@zurich/angular-components/*',
                '@zurich-col/lib-zurich', '@zurich-col/lib-zurich/*',
              ],
              message:
                'No importes el DS directo. Componentes → fachada components/fields/; assets globales (base.css/javascript.js) → zds-setup.ts.',
            },
          ],
        },
      ],
      // El prefijo `app` del scaffold no aplica: los componentes de este workspace son
      // pantallas y wrappers de fachada, no una librería con namespace propio. Se
      // desactiva en vez de renombrar 14 pantallas por una convención que no aporta acá.
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/directive-selector': 'off',
      // La nomenclatura del proyecto (prefijo de tipo: `strNombre`, `objForm`, `cllItems`,
      // `blnFlag`) choca de frente con el camelCase-estricto de naming-convention, y la
      // nomenclatura gana: es contrato con PM4 para los `qd_*` y convención documentada en
      // docs/guides/nomenclatura-variables.md para el resto.
      '@typescript-eslint/naming-convention': 'off',
      // El prefijo `_` marca "descartado a propósito". Hace falta por el idiom de omitir una clave
      // destructurando (`const { screen: _x, ...resto } = params` en `app.routes.ts`), donde la
      // variable **no se usa por definición**: usarla sería el bug. Sin esto la única salida sería
      // un `delete` sobre una copia, que es más código para el mismo efecto y menos claro.
      // `caughtErrors: 'none'` acompaña al `catch {}` de `writeValue`, que ignora el error a
      // propósito y explica por qué en su comentario.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
  {
    // Únicos puntos autorizados a importar el DS directo (ver cabecera).
    files: ['src/components/fields/**/*.ts', 'src/zds-setup.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Los specs pueden asertar sobre `any` sin que aporte nada tiparlo: varias aserciones
    // leen propiedades internas de una instancia de componente Zurich vía DebugElement.
    files: ['src/**/*.spec.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
