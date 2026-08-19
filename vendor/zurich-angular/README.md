# Vendor — Zurich Design System para Angular (`lib-zurich` + `@zurich/*`)

**Por qué existen estos `.tgz` acá:** el ZDS DevKit fue decomisionado el 31-dic-2025, así que los
paquetes `@zurich/*` ya no reciben soporte. Vendorizarlos mientras siguen publicados blinda contra
un eventual *unpublish*. Este vendor es el **respaldo**, no la fuente primaria: la jerarquía vigente
del proyecto es `InsumosZurich/` (+ el feed de Azure) → este vendor → preguntar.

Este vendor es independiente del de `pm4-app/frontend/vendor/` (los paquetes del frontend React
actual, esos sí **parcheados** para React 19 — ver su propio `README.md`). Los `.tgz` de esta carpeta
son **descargas sin modificar**: Angular no usa el `jsx-runtime` de React, que fue el único punto que
requirió parche en el vendor de React.

## Contenido vigente — `0.8.2` + `lib-zurich@2.6.16` (2026-08-13)

| Archivo | Paquete | shasum (sha1) |
|---|---|---|
| `zurich-col-lib-zurich-2.6.16.tgz` | `@zurich-col/lib-zurich@2.6.16` | `a01690e83541f8a39f8ea0d981158dcd0f53dd71` |
| `zurich-angular-components-0.8.2.tgz` | `@zurich/angular-components@0.8.2` | `89c3a54995b51c3aff98825f2477033f50755603` |
| `zurich-web-components-0.8.2.tgz` | `@zurich/web-components@0.8.2` | `ff48b09bc6c75f11c139e640400389f90aef3ec6` |
| `zurich-design-tokens-0.8.2.tgz` | `@zurich/design-tokens@0.8.2` | `067056bbc06c76382d9c9e80ba450c0a55427698` |
| `zurich-dev-utils-0.8.2.tgz` | `@zurich/dev-utils@0.8.2` | `d2a19076256dc4d5da0374d967940a3470de8080` |
| `zurich-css-components-0.8.2.tgz` | `@zurich/css-components@0.8.2` | `1ff9e093788447958573748322743c51c6685075` |

**Fuente: el feed de Azure Artifacts**, vía `npm pack` (ver `InsumosZurich/FEED-ZURICH.md`), **no** el
npm público — `@zurich-col/lib-zurich` es la librería de Zurich Colombia y solo existe en el feed
privado. Los 6 shasum de arriba fueron verificados uno por uno contra los que reporta el feed
(`npm view <pkg> dist.shasum`): **los 6 coinciden**.

### Por qué son 6 y no 4

Dos paquetes que la versión anterior de este vendor no tenía:

- **`@zurich-col/lib-zurich`** es la capa nueva: 27 componentes `lib-*-z` que envuelven a los `za-*`
  de `angular-components`. Es la base de UI elegida para la migración a Angular.
- **`@zurich/css-components`** no es dependencia de nadie — es de **primer nivel**. Se descubrió
  porque `pm4-app/frontend/src/zds-setup.ts` lo importa directo (`base.css`, `javascript.js`). Sin él
  faltarían estilos base, y ningún `npm install` avisaría, porque nadie lo declara como dependencia.

`rxjs`, `tslib`, `lit` y `primeflex` **no** se vendorizan: no son `@zurich/*`, no están en riesgo de
decommission y resuelven del registry público con normalidad.

## Estado: ✅ PROBADO contra Angular 21 real (2026-08-13)

Esto es lo que cambió respecto de la versión anterior de este README, que decía "⬜ NO PROBADO".
Se levantó un proyecto Angular **21.2.20** desechable y se instaló este conjunto desde el feed:

- ✅ **`npm install` limpio**: 625 paquetes, `found 0 vulnerabilities`, **sin `ERESOLVE` y sin
  `--legacy-peer-deps`**. Angular `21.2.20` satisface el peer `^21.2.13` de `lib-zurich@2.6.16`.
- ✅ **`ng build --configuration production` verde.** Es el punto que más importaba:
  `angular-components@0.8.2` está compilado con Angular **18.2.13** (compilación parcial,
  `ɵɵngDeclare*`) y `lib-zurich@2.6.16` con **21.2.14**. El **linker de Angular** recompiló ambos
  contra 21.2.20 sin problemas — `ngDeclareComponent` residual en el bundle = **0**.
- ✅ **Renderizado bajo `TestBed`** (Vitest + jsdom, el runner por defecto de Angular 21): un
  `lib-input-text-z` y un `lib-input-select-z` con Reactive Forms, más `za-select` y `za-icon`.
- ⬜ **Render visual en navegador**: `ng serve` responde 200, pero que los componentes *pinten* con
  los estilos del DS es verificación de ojo humano y queda para los gates manuales de la migración.

### Dos cosas a saber antes de usarlos

1. **El tamaño del bundle.** El mínimo con este DS pesa **6.16 MB raw / 768 kB transferido** con dos
   campos en pantalla. Los `budgets` que trae un `ng new` de fábrica (500 kB warning / 1 MB error)
   hacen **fallar** el build de producción aunque la compilación esté perfecta. Hay que subirlos.
2. **`lib-zurich@2.6.16` arrastra `karma-sonarqube-unit-reporter@0.0.23`** como peerDependency, y npm
   lo **instala de verdad**. Es una fuga de la config de test interna de esa librería: un paquete de
   Karma entrando al árbol de un proyecto que usa Vitest, sin aportar nada. No rompe el build; vale
   saberlo al auditar dependencias o al explicar por qué aparece Karma en un `npm ls`.
3. **`@zurich/css-components` es el que trae los tokens**, y hay que importarlo a mano
   (`base.css` + `javascript.js`, los mismos dos imports que usa `pm4-app/frontend/src/zds-setup.ts`).
   Al hacerlo por import de módulo ES, Angular lo emite como **lazy chunk de ~494 kB** cargado desde
   el `main.js`, y el `styles-*.css` del `<link>` queda en **0 bytes**. Es normal, no un fallo: los
   tokens llegan igual (verificado: 478 `--z-`, 214 `--zc-`, 156 `--zf-`, 77 `--zs-`, 61 `--zg-`).
   Un `styles.css` vacío es un falso negativo fácil de creer.

## Peer dependencies que aporta el proyecto consumidor

```json
{
  "@angular/common": "^21.2.13",
  "@angular/core":   "^21.2.13",
  "@angular/forms":  "^21.2.13",
  "primeflex":       "^4.0.0"
}
```
Esos son los peers de `lib-zurich@2.6.16`; los `@zurich/*` que también pide como peer ya están
cubiertos por este vendor. (`angular-components@0.8.2` por su lado pide solo `>= 17.0.0`, mucho más
laxo — el que manda es `lib-zurich`.)

**`^21.2.13` no acepta Angular 22.** Es la restricción que fija la versión de Angular del proyecto:
`21.2.20` es la más alta de la línea 21.2 para el framework (`21.2.21` es del `@angular/cli`, que
versiona por separado).

## Cómo consumir estos `.tgz`

Solo si el feed no está disponible — la vía normal es instalar del feed. Referenciar vía `file:` con
ruta relativa:
```json
{
  "dependencies": {
    "@zurich-col/lib-zurich":      "file:../../vendor/zurich-angular/zurich-col-lib-zurich-2.6.16.tgz",
    "@zurich/angular-components":  "file:../../vendor/zurich-angular/zurich-angular-components-0.8.2.tgz",
    "@zurich/web-components":      "file:../../vendor/zurich-angular/zurich-web-components-0.8.2.tgz",
    "@zurich/design-tokens":       "file:../../vendor/zurich-angular/zurich-design-tokens-0.8.2.tgz",
    "@zurich/dev-utils":           "file:../../vendor/zurich-angular/zurich-dev-utils-0.8.2.tgz",
    "@zurich/css-components":      "file:../../vendor/zurich-angular/zurich-css-components-0.8.2.tgz"
  }
}
```
Ajustar la profundidad relativa según dónde viva el proyecto. Ver la lección en
`pm4-app/frontend/vendor/README.md` sobre por qué **no** usar `overrides` a nivel raíz para `file:`
de dependencias transitivas anidadas (rutas relativas mal resueltas en workspaces npm).

## Cómo actualizar/re-descargar

Desde el feed (requiere el PAT del `.npmrc` raíz — **nunca copiar ese archivo a otro directorio**):
```bash
npm pack @zurich-col/lib-zurich@<ver> @zurich/angular-components@<ver> \
         @zurich/web-components@<ver> @zurich/design-tokens@<ver> \
         @zurich/dev-utils@<ver> @zurich/css-components@<ver>
```
Fuera del árbol del repo, npm no ve su `.npmrc`. La receta correcta —que **no** mueve la credencial—
apunta `userconfig` al `.npmrc` del repo y repone por entorno el `strict-ssl=false` que ese archivo
desplaza (vive en el `.npmrc` **de usuario**, no en el del repo):
```bash
npm_config_userconfig="<repo>/.npmrc" npm_config_strict_ssl=false npm pack <pkg>@<ver>
```
Sin el `strict-ssl=false`, el proxy corporativo (`CN=ssldecrypt.latam.zurich.com`) hace fallar todo
con `SELF_SIGNED_CERT_IN_CHAIN` — y, peor, durante la resolución del árbol npm lo disfraza de
`ERESOLVE ... Found: <pkg>@undefined`, que parece un conflicto de versiones y no lo es. La pista es
el **`undefined`**: un choque real nombra las dos versiones.

Verificar siempre el shasum contra `npm view <pkg>@<ver> dist.shasum` antes de reemplazar los
archivos existentes.

## Histórico — `0.8.1` (conservados a propósito)

`zurich-{angular-components,web-components,design-tokens,dev-utils}-0.8.1.tgz` quedan en la carpeta
como respaldo de la versión anterior. Fueron descargados del **npm público** el 2026-08-13 con
`curl`, y **nunca se probaron contra un Angular real**. No se usan: `lib-zurich@2.6.16` exige
`@zurich/* >= 0.8.2`, así que 0.8.1 no sirve para la migración a Angular. Se pueden borrar cuando
0.8.2 lleve tiempo en producción.

| Archivo | shasum (sha1) |
|---|---|
| `zurich-angular-components-0.8.1.tgz` | `180c2e4eb80f19a0fa025bc915efa1a94c295355` |
| `zurich-web-components-0.8.1.tgz` | `25a7062ad6fb4a1de3d302196062d5ced0a10713` |
| `zurich-design-tokens-0.8.1.tgz` | `69a7dc58688a5e00d5e2740275fa027b12df00cc` |
| `zurich-dev-utils-0.8.1.tgz` | `e54ae5ac9bf268d99429f3e7c09f187d0e055bdd` |
