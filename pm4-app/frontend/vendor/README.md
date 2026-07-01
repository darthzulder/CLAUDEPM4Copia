# Vendor — paquetes `@zurich/*` (Zurich Design System) vendorizados

**Por qué existen estos `.tgz` acá:** ZDS DevKit fue decomisionado el 31-dic-2025; los
paquetes `@zurich/*` ya no reciben soporte y solo resuelven del npm público, sin registro
privado. Vendorizarlos hace la build inmune a un eventual *unpublish*, y permite parchear
`web-components` para que funcione con React 19 (ver más abajo). Detalle completo del porqué
y las etapas de migración: [`../../outputs/migracion-react19-plan.md`](../../outputs/migracion-react19-plan.md)
(Anexo A) y la memoria de proyecto `project-zds-decommission`.

## Contenido (todos 0.8.1, empaquetados desde `node_modules` con `npm pack`)
- `zurich-css-components-0.8.1.tgz` — **parcheado** (ver "Parche a `css-components`" abajo).
- `zurich-design-tokens-0.8.1.tgz` — sin parches, tal cual instalado.
- `zurich-dev-utils-0.8.1.tgz` — sin parches, tal cual instalado.
- `zurich-web-components-0.8.1.tgz` — **parcheado** (ver "Parche a `web-components`" abajo).

## Parche aplicado a `web-components` (Etapa 1 de la migración a React 19)

El `dist` original de `@zurich/web-components@0.8.1` empaqueta una copia congelada del
`react/jsx-runtime` de React 18, usada por los ~25 wrappers React del paquete. Esa copia:
1. Lee `React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner` — React 19
   renombró ese objeto y **eliminó `ReactCurrentOwner`** → `TypeError` al cargar el módulo.
2. Crea elementos con `$$typeof: Symbol.for('react.element')` — React 19 usa
   `'react.transitional.element'` → los elementos no se reconocen.

**Fix:** se reemplazó el contenido de `dist/react/jsx-runtime.js` (ESM) y
`dist/cjs/jsx-runtime.js` (CJS) por un shim que re-exporta el `jsx-runtime` **real** de la
versión de React instalada, en vez de la copia congelada:
```js
// dist/react/jsx-runtime.js
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
const jsxRuntimeExports = { jsx, jsxs, Fragment };
export { jsxRuntimeExports as j };
```
También se amplió `peerDependencies` en el `package.json` del paquete:
`"react"`/`"react-dom"`: `"^18.0.0"` → `"^18.0.0 || ^19.0.0"`.

Verificado (Etapa 1, 2026-07-01): sin ningún otro punto de acceso a
`__SECRET_INTERNALS`/`ReactCurrentOwner`/`Symbol.for('react.element')` en el resto del `dist`
(grep completo). La app renderiza y funciona idéntica en React 18 con este parche aplicado
(control); en la Etapa 4 del plan se valida sobre React 19 (donde el shim deja de ser un no-op).

## Parche aplicado a `css-components` (Etapa 4 de la migración a React 19)

Al hacer un `npm install` **desde cero** (sin lockfile incremental previo) para instalar React
19 en la Etapa 4, apareció un `ERESOLVE` que la Etapa 1 no había detectado: `css-components`
también declara su propio `peerDependencies.@types/react: "^18.0.0"` (independiente del de
`web-components`). Los `npm install` incrementales de las etapas 1-3 nunca forzaron una
re-resolución completa del árbol, así que este peer quedó sin parchear hasta ahora.

Además, `css-components` **también** empaqueta su propia copia congelada del `jsx-runtime` de
React 18 en `dist/react/jsx-runtime.js` y `dist/cjs/jsx-runtime.js` (mismo síntoma exacto que
`web-components`: `ReactCurrentOwner` + símbolo `react.element`) — se aplicó el mismo shim.

**Fix:**
- `peerDependencies.@types/react`: `"^18.0.0"` → `"^18.0.0 || ^19.0.0"`.
- Mismo shim de jsx-runtime (ESM + CJS) que en `web-components`.

**Lección para reproducir este parche a futuro:** verificar el peer de **cada** paquete
`@zurich/*` vendorizado individualmente (no asumir que ampliar uno alcanza), y validar con un
`npm install` desde cero (borrando `node_modules` y `package-lock.json`, no solo `npm ci` sobre
un lockfile ya existente) — la resolución incremental de npm puede ocultar ERESOLVE reales.

## Cómo reproducir/actualizar este parche
1. Desde el contenedor: `npm pack ./node_modules/@zurich/<paquete>` (usa lo ya instalado, no el registry).
2. Extraer el `.tgz`, editar `dist/react/jsx-runtime.js` + `dist/cjs/jsx-runtime.js` (shim de arriba)
   y `package.json` (`peerDependencies`).
3. Re-empaquetar: `npm pack <carpeta-extraida> --pack-destination ./vendor`.
4. `frontend/package.json` referencia estos `.tgz` vía `file:vendor/<archivo>.tgz`
   (`design-tokens`/`dev-utils` como dependencias directas — necesario porque los `file:` en
   `overrides` a nivel raíz no resuelven bien rutas relativas para deps transitivas anidadas).
