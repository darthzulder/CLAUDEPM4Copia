# Vendor — paquetes `@zurich/*` (Zurich Design System) vendorizados

**Por qué existen estos `.tgz` acá:** ZDS DevKit fue decomisionado el 31-dic-2025; los
paquetes `@zurich/*` ya no reciben soporte y solo resuelven del npm público, sin registro
privado. Vendorizarlos hace la build inmune a un eventual *unpublish*, y permite parchear
`web-components` para que funcione con React 19 (ver más abajo). Detalle completo del porqué
y las etapas de migración: [`../../outputs/migracion-react19-plan.md`](../../outputs/migracion-react19-plan.md)
(Anexo A) y la memoria de proyecto `project-zds-decommission`.

## Contenido (todos 0.8.1, empaquetados desde `node_modules` con `npm pack`)
- `zurich-css-components-0.8.1.tgz` — sin parches, tal cual instalado.
- `zurich-design-tokens-0.8.1.tgz` — sin parches, tal cual instalado.
- `zurich-dev-utils-0.8.1.tgz` — sin parches, tal cual instalado.
- `zurich-web-components-0.8.1.tgz` — **parcheado** (ver abajo).

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

## Cómo reproducir/actualizar este parche
1. Desde el contenedor: `npm pack ./node_modules/@zurich/<paquete>` (usa lo ya instalado, no el registry).
2. Extraer el `.tgz`, editar `dist/react/jsx-runtime.js` + `dist/cjs/jsx-runtime.js` (shim de arriba)
   y `package.json` (`peerDependencies`).
3. Re-empaquetar: `npm pack <carpeta-extraida> --pack-destination ./vendor`.
4. `frontend/package.json` referencia estos `.tgz` vía `file:vendor/<archivo>.tgz`
   (`design-tokens`/`dev-utils` como dependencias directas — necesario porque los `file:` en
   `overrides` a nivel raíz no resuelven bien rutas relativas para deps transitivas anidadas).
