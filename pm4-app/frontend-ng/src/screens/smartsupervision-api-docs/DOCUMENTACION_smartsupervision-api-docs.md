# `smartsupervision-api-docs` — Visor de la documentación del Web Service Smartsupervisión (SFC)

> **Versión 2.0 (Angular)** · port de `frontend/src/screens/smartsupervision-api-docs/SmartsupervisionApiDocs.tsx`
> Pantalla **12 de 12** de la Fase 5 — cierra la migración React 19 → Angular 21.

---

## 1. Qué es, y por qué no tiene la estructura de las otras fichas

Las once fichas anteriores están organizadas por **trazabilidad funcional**: cada campo contra su
FLD del Anexo02, cada regla contra su RUL, cada mensaje contra su MSG. Esta no puede tenerla, y no es
una omisión:

**No hay anexo detrás de esta pantalla.** No es un formulario de PM4. No tiene campos, no tiene
reglas de negocio, no valida nada, no completa ninguna tarea y no escribe una sola variable `qd_*`.
Es un **visor**: muestra un documento HTML autónomo que documenta, estilo Swagger, el Web Service de
Smartsupervisión de la Superintendencia Financiera.

Inventar una tabla FLD/RUL/MSG acá sería exactamente el tipo de documento que la guía de fichas
advierte no producir: trazabilidad decorativa contra un insumo que no existe.

Lo que sí tiene contrato —y es lo que documenta esta ficha— son **dos cosas**: el markup del iframe y
el asset del otro lado.

---

## 2. Ubicación y registro

| | |
|---|---|
| **Slug** | `smartsupervision-api-docs` |
| **Componente** | `SmartsupervisionApiDocsComponent` (`smartsupervision-api-docs.ts`) |
| **Plantilla** | `smartsupervision-api-docs.html` |
| **Spec** | `smartsupervision-api-docs.spec.ts` — 7 casos |
| **Asset** | `frontend-ng/public/docs/` — 7 archivos, ~1,95 MB |
| **CSS** | `.doc-viewer-frame` (`shared.css`, un solo bloque de geometría) |
| **URL** | `?screen=smartsupervision-api-docs` |

Registrada en `app/pantallas.ts` (`DIC_PANTALLAS`) y en `app/pantallas.spec.ts`
(`CLL_SLUGS_CON_SPEC`). **Sin** entrada en `paridad-react.spec.ts` — ver §5.

---

## 3. El asset: qué se copió y por qué como unidad

`frontend/public/docs/` → `frontend-ng/public/docs/`, verificado **byte a byte** con `diff -r`:

| Archivo | Bytes |
|---|---|
| `smartsupervision-webservice.html` | 86 243 |
| `smartsupervision-openapi.yaml` | 22 644 |
| `swagger-ui.html` | 10 533 |
| `swagger/swagger-ui-bundle.js` | 1 452 754 |
| `swagger/swagger-ui-standalone-preset.js` | 230 294 |
| `swagger/swagger-ui.css` | 152 073 |
| `swagger/VERSION.txt` | 13 (`VER=5.17.14`) |

**El grafo de referencias es cerrado**: todo lo que la doc carga son hermanos relativos dentro de
`docs/`, sin ningún CDN externo. Por eso el directorio se porta como unidad y sin tocar nada: no hay
ninguna referencia que reescribir. El spec lo asevera en vez de dejarlo como afirmación de esta ficha
(caso *«los assets que la doc CARGA resuelven dentro de `public/docs/`»*).

**Sin cambio en `angular.json`.** Su bloque de assets ya es `[{ "glob": "**/*", "input": "public" }]`,
así que el directorio se copia solo. Verificado sobre el build real: los 7 archivos aparecen en
`dist/frontend-ng/browser/docs/`.

> **Swagger UI 5.17.14 queda vendorizado por duplicado** (una copia en `frontend/public/`, otra en
> `frontend-ng/public/`), ~1,9 MB cada una. Es lo correcto **mientras las dos apps coexistan**: son
> dos builds independientes y compartirlo exigiría un paso de build que hoy no existe. Cuando se
> retire el React, la copia de `frontend/` se va con él. Queda anotado en §6.

---

## 4. El único contrato técnico: por qué un iframe

La doc es una página **autónoma**: trae su propio tema oscuro, sus propios `<style>` y su propio
`<script>`. El iframe existe para **aislarla**, y en Angular el argumento pesa más que en React:

El CSS global del proyecto (`base.css` del DS + `shared.css`) se carga por el array `styles` de
`angular.json`, o sea **para todo el documento**. Inyectar el HTML de la doc en el árbol de la app lo
dejaría bajo esas reglas y las dos hojas se pisarían en ambos sentidos. El iframe le da un documento
aparte — que es exactamente el límite que hace falta.

Y no hay alternativa razonable: `[innerHTML]` no sirve, porque el `DomSanitizer` **borra** los
`<style>` y los `<script>`, así que la doc llegaría sin tema y sin comportamiento. El
`bypassSecurityTrustHtml` que lo evitaría sería inyectar HTML sin sanear para reimplementar peor el
aislamiento que el iframe ya da gratis.

### 4.1 `src` estático vs `[title]` enlazado — la asimetría es deliberada

Angular clasifica `iframe[src]` como contexto **`RESOURCE_URL`**, el más estricto: un valor
**enlazado** sin sanear lanza `NG0904: unsafe value used in a resource URL context` en render. Es lo
que obligó a `pdf-viewer.ts` a usar `bypassSecurityTrustResourceUrl` para su `blob:` URL.

Acá no hace falta, y la razón importa: **un atributo estático no es un binding**, así que no hay nada
que sanear ni que saltear. Importar `DomSanitizer` para envolver una constante fija agregaría la
llamada que hay que justificar caso por caso justamente donde no se necesita, y dejaría el precedente
de un bypass sobre algo que mañana alguien podría volver interpolable.

El `title` sí va enlazado (`[title]`): es texto, no URL, así que no pasa por ese contexto. Y enlazado
sirve de algo — el spec lee la constante `DOC_TITULO` y asevera el DOM, así que renombrar el título en
un solo lado pone el caso rojo.

### 4.2 Divergencias con React

| React | Angular | Por qué |
|---|---|---|
| `style={{ position:'fixed', inset:0, … }}` en línea | clase `.doc-viewer-frame` en `shared.css` | El proyecto no admite CSS *ad-hoc* en el markup. Un caso del spec asevera **la ausencia** del `style` además de la presencia de la clase. |
| `src` como atributo JSX | `src` como atributo **estático** (no `[src]`) | `RESOURCE_URL` — §4.1. |
| `title` como atributo JSX | `[title]` enlazado a `DOC_TITULO` | Para que el spec asevere contra la constante y no contra una copia del literal. |

Ninguna cambia lo que el usuario ve.

---

## 5. Tests — 7 casos, y el que React no tenía

El spec React (`SmartsupervisionApiDocs.test.tsx`, 13 líneas) asevera dos cosas: que el iframe está en
el documento y que su `src` es `docs/smartsupervision-webservice.html`.

**Ese spec queda verde con la carpeta `public/docs/` ausente**, que es justo el estado en que estaba
`frontend-ng/` antes de este port. O sea: la pantalla habría montado, el iframe habría pedido la doc,
el servidor habría contestado el `index.html` de la SPA y el usuario habría visto **la app dentro de sí
misma**, sin un solo test rojo. Es el mismo tipo de agujero que motivó `css-global.spec.ts`: el defecto
no vive en la lógica, vive en si el archivo está donde el markup dice.

| # | Caso | Qué cubre |
|---|---|---|
| 1 | apunta al HTML de la doc servido desde `public/` | El `src` del DOM contra `DOC_URL`. `getAttribute`, no `.src` — ver ⚠ abajo |
| 2 | la ruta de la doc es relativa, no absoluta | Despliegue bajo subpath |
| 3 | lleva nombre accesible | `title` contra `DOC_TITULO` |
| 4 | la geometría va por clase, no por `style` en línea | Clase presente **y** `style` ausente |
| 5 | **⚠ el HTML de la doc EXISTE en `public/`** | **La mitad que React no cubría** |
| 6 | la doc trae su propio tema y su propio JS | Mide el archivo real: es lo que justifica el iframe |
| 7 | los assets que la doc CARGA resuelven dentro de `public/docs/` | Ninguna ruta absoluta ni referencia local faltante |

> **⚠ El caso 1 usa `getAttribute('src')` y no la propiedad `.src`, y no es estilo.** La propiedad
> devuelve la URL **resuelta** contra el origen de jsdom, así que `/docs/...` y `docs/...` dan el mismo
> string y el error de subpath pasaría verde. Verificado en la mutación 4.

### 5.1 Mutaciones verificadas

Sin nombrar la línea rota y el caso que se puso rojo, el test no cuenta:

| # | Qué rompí | Qué se puso rojo |
|---|---|---|
| 1 | `DOC_URL` → `…-INEXISTENTE.html` (divergencia constante/plantilla) | **4 casos**: 1, 5, 6 y 7. El 5 con su mensaje accionable (*«Copialo de frontend/public/docs/…»*) |
| 2 | Quité `[title]="STR_TITULO"` de la plantilla | Solo el 3 |
| 3 | Cambié la clase por `style="position:fixed;inset:0;border:none"` (o sea, volví a React) | Solo el 4 |
| 4 | `src="docs/…"` → `src="/docs/…"` | Solo el 1 — confirma que `getAttribute` era load-bearing |

### 5.2 Por qué NO va en `paridad-react.spec.ts`

Es una exención **que ya existía**, no una que este port inventó. La guarda de inventario de esa hoja
filtra los slugs enrutados a los que tienen datos congelados en `paridad-react.json`
(`paridad-react.spec.ts:728`), y su comentario nombra `ds-catalog` como el precedente: *«una pantalla
enrutada sin datos de React … no tiene nada que comparar y no es un olvido»*.

`paridad-react.json` contiene exactamente **11** slugs — las once pantallas con campos, todas
portadas. Esta no tiene campos, así que no lleva entrada en `CLL_PORTADAS` ni en
`DIC_MAXLENGTH_ESPERADOS`. La guarda corre verde con el slug registrado (60/60 casos).

---

## 6. A reportar (no arreglado acá — esta es una migración de framework)

1. **🟠 El enlace «Volver al índice» de la doc usa `href="/"`.**
   `public/docs/smartsupervision-webservice.html:190` —
   `<a class="back-index" href="/" target="_top">`. El `target="_top"` es correcto (navega el frame
   padre, no el iframe), pero el `/` absoluto asume que la app está servida en la **raíz** del host.
   Bajo un subpath —o embebida en PM4— ese enlace sale de la app. Es comportamiento **heredado de
   React**, idéntico en las dos versiones, así que se reporta y no se corrige por contrabando.
   *Detalle del port:* el caso 7 del spec mide solo los assets que el navegador **carga** (`src` y
   `<link href>`) y excluye los `<a href>` a propósito — un enlace de navegación y un asset tienen
   contratos opuestos, y medirlos con la misma regla ponía el caso rojo por el enlace que sí funciona.
   Fue un hallazgo del propio spec, no una suposición.

2. **🟡 Swagger UI queda vendorizado por duplicado** (~1,9 MB en `frontend/public/` + ~1,9 MB en
   `frontend-ng/public/`) mientras las dos apps coexistan. Se resuelve solo al retirar el React; no
   vale la pena un paso de build compartido para una convivencia temporal.

3. **🟡 El iframe a pantalla completa tapa el banner de token de debug** de `app.html` cuando se corre
   en dev con token de fallback. React tiene la misma forma (`position: fixed` en línea), así que es
   paridad, no un defecto nuevo. Solo afecta a dev.

4. **🟢 `ds-catalog` sigue sin portar y no estaba en el plan de la Fase 5.** React registra 14 slugs y
   Angular ahora 12. De los dos que faltan, `COL_QD_SCR-010_cierre-m3` es un **alias muerto** (la
   carpeta no existe en React; `App.tsx:52` lo apunta a `FormularioSuperintendencia`), ya documentado
   en `pantallas.ts` y cubierto por un caso de `app.routes.spec.ts`. El otro, `ds-catalog`, es la
   referencia visual viva del DS —un catálogo de componentes, no una pantalla de negocio— y **nunca
   estuvo en el alcance de la Fase 5**. Queda como decisión del usuario si se porta.

---

## 7. Verificación

```
✅ smartsupervision-api-docs.spec.ts        7/7
✅ pantallas · paridad-react · app.routes · indice-pantallas   60/60
✅ tsc -p tsconfig.app.json --noEmit
✅ tsc -p tsconfig.spec.json --noEmit
✅ ng build                                 (los 7 archivos del asset en dist/…/browser/docs/)
✅ npm run verify                           11/11 aplicables · 177,7s
```

En esa corrida `verify` enumeraba 12 pasos y el de `pytest` salía **saltado**, porque el
microservicio Python ya no estaba en el árbol (lo eliminó `d4e63a4`). Ese paso se retiró después,
así que hoy los 11 son la lista completa y no hay nada que se salte.
