# `frontend-ng` — frontend Angular 21 (migración en curso)

Workspace nuevo de la migración **React 19 → Angular 21**. Convive con `frontend/` (React, vivo y
desplegado) hasta la Fase 7 del plan, donde React se elimina y este workspace se renombra a
`frontend`.

**No es una app funcional todavía.** Andamiaje de la Fase 1: no hay pantallas, la fachada del DS está
vacía y `app.routes.ts` no tiene rutas.

## Comandos

```bash
npm run dev      --workspace=frontend-ng   # ng serve en :4200, proxy /api → :3001
npm run build    --workspace=frontend-ng
npm run lint     --workspace=frontend-ng   # eslint + tsc --noEmit
npm run test     --workspace=frontend-ng   # Vitest + jsdom
npm run coverage --workspace=frontend-ng   # + lcov para coverage:diff y (a futuro) Sonar
```

> **`npm install` no se corre desde acá ni desde `pm4-app/`.** El `.npmrc` con el feed de Zurich y
> el PAT vive en la **raíz del repo**, y npm solo lee el `.npmrc` del directorio donde se lo invoca:
> desde `pm4-app/` los `@zurich*` se piden a `registry.npmjs.org` y salen **404**. La receta (no
> copiar el `.npmrc` a ningún lado — lleva la credencial), desde `pm4-app/`:
>
> ```bash
> npm_config_userconfig="<raíz-del-repo>/.npmrc" npm_config_strict_ssl=false npm install
> ```
>
> El `strict_ssl=false` repone por entorno lo que el `userconfig` desplaza: ese flag vive en el
> `.npmrc` **de usuario**, y apuntar `userconfig` al del repo lo sustituye. Sin él, las descargas
> mueren por `SELF_SIGNED_CERT_IN_CHAIN` disfrazado de `ERESOLVE ... @undefined`.

Todos entran en `npm run verify` desde la raíz de `pm4-app`, que sigue siendo la **única definición
de verde** del proyecto.

## Decisiones de configuración que no son obvias

Cada una responde a un hallazgo concreto del gate 0 de la migración, no a preferencia:

| Qué | Por qué |
|---|---|
| **Angular fijado en `21.2.20` exacto**, no `^21.2.0` | `@zurich-col/lib-zurich@2.6.16` pide el peer `^21.2.13`, que **no acepta Angular 22**. `21.2.20` es la más alta de la línea 21.2 para el framework (`21.2.21` es del `@angular/cli`, que versiona aparte). Un caret dejaría que un `npm update` trajera 22.x y rompiera el peer. |
| **Budgets de bundle en 1.5 MB / 2.5 MB**, no los 500 kB/1 MB del `ng new` | El bundle mínimo con el DS de Zurich pesa **6.16 MB raw / 768 kB transferido** con *dos* campos en pantalla. Con el default, `ng build --configuration production` falla por presupuesto con la compilación perfecta. |
| **`@zurich/css-components` declarado explícitamente** en `package.json` | Es de **primer nivel**: dependencia de nadie. Ningún `npm install` lo arrastraría solo, y su ausencia no rompe la instalación — se manifiesta como estilos base faltantes en runtime. Lo importa [`src/zds-setup.ts`](src/zds-setup.ts). |
| **`shared.css` se importa desde `main.ts`**, no desde el array `styles` de `angular.json` | Preserva la cascada: tokens del DS primero, alias `--z-*` del proyecto después. Ver el comentario en [`src/styles.css`](src/styles.css). |
| **`TZ=America/Bogota` vía `cross-env` en el script `test`** | `@angular/build:unit-test` no expone un `env` propio como opción del builder, así que no se puede fijar en `angular.json` como sí hace `frontend/vitest.config.ts`. La guarda está en [`src/core/zona-horaria.spec.ts`](src/core/zona-horaria.spec.ts): si alguien saca la variable del script, ese spec falla primero y con mensaje claro. |
| **`provideZonelessChangeDetection()`** | Es lo que usa el harness de desarrollo de Zurich (`InsumosZurich/fe-lib-zurich`). Los componentes del DS son bindings sobre custom elements de Lit: emiten eventos nativos y no dependen de que zone.js parchee nada. |

Y dos que se descubrieron al instalar y correr esto de verdad (Fase 1):

| Qué | Por qué |
|---|---|
| **La cobertura sale en `coverage/frontend-ng/`**, no en `coverage/` | `@angular/build:unit-test` anida un nivel por nombre de proyecto, a diferencia de Vitest invocado a mano. `scripts/coverage-diff.mjs` apunta ahí explícitamente; si se apuntara a `coverage/lcov.info` **no fallaría con error** — el `existsSync` lo saltea en silencio y el workspace quedaría invisible en el informe del PR. |
| **`coverageThresholds`, no `thresholds`** | El nombre de la opción en el builder de Angular difiere del de la config nativa de Vitest, y `angular.json` **ignora** en silencio una clave que no esté en el schema. Verificado que los cuatro umbrales fallan de verdad (con un archivo sin specs a propósito): salen los 4 `ERROR:` y el exit code es 1. Lo mismo con **`coverageInclude`**: no existe `coverageAll`, y sin el include los archivos que ningún spec carga no aparecen en el lcov — que para Sonar se lee como "cubierto", no como "sin tests". |

### ⚠ Un backtick dentro de un `template:` inline: el error apunta SIEMPRE al lugar equivocado

Costó **cuatro** ciclos de diagnóstico en la Fase 4, y el patrón que lo dispara es inocente: un
comentario HTML dentro del template que nombra un símbolo entre comillas invertidas.

```ts
@Component({
  template: `
    <!-- la condición es "abierto Y hay cuerpo", igual que el `isOpen && children` de React -->
    …                                            ^^^^^^^^^^^^^^^^^^^^^ acá termina el string
  `,
  imports: [ZrIcon],
})
```

Ese backtick **cierra el template literal**, así que el resto del archivo se parsea como código. El
compilador entonces reporta una cascada que **nunca menciona la línea del backtick**:

```
TS1005: ';' expected
TS2304: Cannot find name 'children'   ← palabras del comentario, leídas como identificadores
TS2304: Cannot find name 'imports'    ← apunta al decorador, no al template
TS1135: Argument expression expected
```

**La firma para reconocerlo en un segundo:** `Cannot find name 'imports'` (o `'label'`, `'title'`,
`'config'`) señalando el `@Component({`, el `imports:` o el `})` de cierre. Ninguno de esos tres
lugares es el defecto; buscá comillas invertidas en el template. Los docstrings **arriba** del
decorador sí las admiten — viven fuera del literal.

> **No hay regla de ESLint que lo atrape, y está medido.** Se escribió un `no-restricted-syntax` con
> el selector `Property[key.name="template"] > TemplateLiteral > TemplateElement[value.raw=/…/]` y se
> probó contra un archivo roto a propósito: ESLint devolvió `Parsing error: ';' expected` y exit 1
> **desde el parser**, sin llegar a evaluar ninguna regla. Una regla que opera sobre el AST no puede
> detectar un defecto cuya naturaleza es *impedir que exista un AST*. La regla se quitó en vez de
> dejar un guardrail que no dispara: un guardrail que no funciona es peor que ninguno, porque se
> confía en él. Si algún día se quiere mecanizar, tiene que ser un chequeo de **texto crudo** anterior
> al parser (un paso de `pre-commit` o un script), no un plugin de lint.

Dos cosas que parecen fallos y no lo son, verificadas en el gate 0:

- **El `styles-*.css` emitido queda en 0 bytes** y el CSS del DS aparece como *lazy chunk* de
  ~494 kB cargado desde `main.js`. Es la consecuencia de importarlo como módulo ES (que es lo que
  replica el contrato de `zds-setup.ts` de React). Los tokens llegan igual.
- **`npm ls` muestra `karma-sonarqube-unit-reporter`.** Es una fuga de las `peerDependencies` de
  `lib-zurich@2.6.16` — un paquete de Karma en un proyecto que usa Vitest. No rompe nada.

## Estructura

```
src/
├── main.ts                 ← bootstrap; importa zds-setup ANTES de shared.css
├── zds-setup.ts            ← punto único de assets globales del DS  ⚠ autorizado a importar @zurich/*
├── shared.css              ← copia verbatim de frontend/src/shared.css (1449 líneas)
├── styles.css              ← vacío a propósito (ver comentario adentro)
├── api/pm4Client.ts        ← urlApi() + interceptor x-pm4-token sobre /api/* (regla BFF)
├── core/                   ← servicios (ex-hooks) + lógica pura       · Fase 3
├── components/fields/      ← la fachada: wrappers CVA                 · Fase 2  ⚠ autorizado
├── components/             ← los 12 componentes propios              · Fase 4
├── screens/                ← las 14 pantallas                        · Fase 5
└── app/                    ← App raíz, rutas, providers
```

Los dos ⚠ son los **únicos** puntos autorizados a importar `@zurich/*` / `@zurich-col/*`; lo aplica
[`eslint.config.mjs`](eslint.config.mjs). Ver
[`src/components/fields/README.md`](src/components/fields/README.md) para el contrato de la fachada.
