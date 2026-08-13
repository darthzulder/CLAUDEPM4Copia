# Vendor — `@zurich/angular-components` (Zurich Design System) y sus dependencias

**Por qué existen estos `.tgz` acá:** el ZDS DevKit fue decomisionado el 31-dic-2025; los
paquetes `@zurich/*` ya no reciben soporte y solo resuelven desde el npm público
(`registry.npmjs.org`), sin registro privado. Vendorizarlos ahora, mientras el paquete sigue
publicado, blinda contra un eventual *unpublish* futuro — aunque hoy (2026-08-13) todavía no
existe ningún proyecto Angular en este repo que los consuma. Esto es preparación para un
proyecto Angular futuro (ver conversación que originó esta carpeta).

Este vendor es independiente del de `pm4-app/frontend/vendor/` (que trae solo los paquetes
usados por el frontend React actual: `css-components`, `web-components`, `design-tokens`,
`dev-utils`, esos sí **parcheados** para React 19 — ver su propio `README.md`). Los `.tgz` de
esta carpeta son **descargas sin modificar, tal cual publicadas en el registry público** — no
se aplicó ningún parche porque Angular no usa el `jsx-runtime` de React (el único punto que
requirió parche en el vendor de React).

## Contenido (todos `0.8.1`, descargados directo del registry público el 2026-08-13)

| Archivo | Paquete | shasum (sha1) |
|---|---|---|
| `zurich-angular-components-0.8.1.tgz` | `@zurich/angular-components@0.8.1` | `180c2e4eb80f19a0fa025bc915efa1a94c295355` |
| `zurich-web-components-0.8.1.tgz` | `@zurich/web-components@0.8.1` | `25a7062ad6fb4a1de3d302196062d5ced0a10713` |
| `zurich-design-tokens-0.8.1.tgz` | `@zurich/design-tokens@0.8.1` | `69a7dc58688a5e00d5e2740275fa027b12df00cc` |
| `zurich-dev-utils-0.8.1.tgz` | `@zurich/dev-utils@0.8.1` | `e54ae5ac9bf268d99429f3e7c09f187d0e055bdd` |

Fuente: `https://registry.npmjs.org/@zurich/<paquete>/-/<paquete>-0.8.1.tgz`. Los shasum de
arriba fueron verificados contra los reportados por el registry al momento de la descarga
(`curl` directo, no `npm pack` — no hay ningún proyecto Angular instalado localmente del cual
empaquetar).

## Por qué estos 4 paquetes

`@zurich/angular-components@0.8.1` declara como dependencias directas:
```json
{
  "rxjs": "~7.8.1",
  "tslib": "^2.6.2",
  "@zurich/dev-utils": "0.8.1",
  "@zurich/design-tokens": "0.8.1",
  "@zurich/web-components": "0.8.1"
}
```
`rxjs` y `tslib` **no** se vendorizaron (no son `@zurich/*`, no están en riesgo de
decommission, y se resuelven del registry público normalmente). Los 3 paquetes `@zurich/*`
(`dev-utils`, `design-tokens`, `web-components`) sí se vendorizaron porque comparten el mismo
riesgo de unpublish que `angular-components`.

`web-components` a su vez depende de `lit@^3.2.1` (no vendorizado, mismo criterio que
`rxjs`/`tslib`) + los mismos `dev-utils`/`design-tokens`.

## Peer dependencies que deberá aportar el proyecto Angular futuro

```json
{
  "@angular/core": ">= 17.0.0",
  "@angular/forms": ">= 17.0.0",
  "@angular/common": ">= 17.0.0"
}
```
(Además de `@zurich/dev-utils`/`design-tokens`/`web-components` en `0.8.1`, ya cubiertos por
este vendor.)

## Cómo consumir esto cuando exista el proyecto Angular

En el `package.json` de ese proyecto, referenciar los 4 `.tgz` vía `file:`, con ruta relativa
hacia esta carpeta, por ejemplo:
```json
{
  "dependencies": {
    "@zurich/angular-components": "file:../../vendor/zurich-angular/zurich-angular-components-0.8.1.tgz",
    "@zurich/web-components": "file:../../vendor/zurich-angular/zurich-web-components-0.8.1.tgz",
    "@zurich/design-tokens": "file:../../vendor/zurich-angular/zurich-design-tokens-0.8.1.tgz",
    "@zurich/dev-utils": "file:../../vendor/zurich-angular/zurich-dev-utils-0.8.1.tgz"
  }
}
```
Ajustar la profundidad relativa según dónde viva el proyecto Angular. Ver la lección
documentada en `pm4-app/frontend/vendor/README.md` sobre por qué NO usar `overrides` a nivel
raíz para los `file:` de dependencias transitivas anidadas (rutas relativas mal resueltas en
workspaces npm) — si el proyecto Angular termina viviendo en un workspace npm con otros
paquetes, aplica la misma precaución.

## Estado y lo que falta

- ✅ Descargados y verificados por shasum contra el registry (2026-08-13).
- ✅ Sin parches — no hay evidencia de que se necesite ninguno (Angular no usa jsx-runtime;
  no se ha detectado ningún otro choke-point específico de framework en `web-components`,
  `design-tokens` o `dev-utils`).
- ⬜ **No probado.** No se instaló contra ningún proyecto Angular real todavía — no hay
  garantía de que `npm install` resuelva sin `ERESOLVE` ni de que los componentes rendericen.
  Cuando exista el proyecto Angular consumidor, validar instalación limpia (`npm ci` con
  `node_modules` borrado) antes de asumir que este vendor "funciona".
- ⬜ Si en el futuro se detecta necesidad de parche (por ejemplo, incompatibilidad con una
  versión de Angular más nueva que 17), documentarlo en este mismo README siguiendo el formato
  usado en `pm4-app/frontend/vendor/README.md`.

## Cómo actualizar/re-descargar

```bash
curl -sL -o zurich-angular-components-0.8.1.tgz https://registry.npmjs.org/@zurich/angular-components/-/angular-components-0.8.1.tgz
curl -sL -o zurich-web-components-0.8.1.tgz https://registry.npmjs.org/@zurich/web-components/-/web-components-0.8.1.tgz
curl -sL -o zurich-design-tokens-0.8.1.tgz https://registry.npmjs.org/@zurich/design-tokens/-/design-tokens-0.8.1.tgz
curl -sL -o zurich-dev-utils-0.8.1.tgz https://registry.npmjs.org/@zurich/dev-utils/-/dev-utils-0.8.1.tgz
```
Verificar el shasum resultante contra `https://registry.npmjs.org/@zurich/<paquete>` antes de
reemplazar los archivos existentes (el registry sigue activo pero deprecado — un `unpublish`
podría ocurrir sin aviso).
