# Formato de export de ProcessMaker 4 — referencia

> Extraído de un documento de planificación (`MIGRACION_PANTALLAS.md`, ago-2026) que
> describía una herramienta de migración masiva nunca construida. El enfoque real de este
> proyecto es replicar pantallas una por una con ayuda de Claude (ver `pm4-app/CLAUDE.md`
> § "Cómo agregar una nueva pantalla"), no importar paquetes JSON en bloque. Lo que sigue
> es la parte de ese documento que sigue siendo un hecho verificado: la estructura real de
> un export de PM4, útil cuando se recibe un `.json` exportado como insumo para construir
> o entender una pantalla.

---

## El paquete (`screen_package`)

Los archivos exportados desde PM4 son **paquetes**, no screens individuales. Cada archivo
JSON tiene esta estructura raíz:

```json
{
  "type": "screen_package",
  "version": 2,
  "screens": [ ...array de screens... ],
  "screen_categories": [ ...puede estar vacío... ],
  "scripts": [ ...scripts PHP/JS referenciados por watchers... ]
}
```

Un solo paquete puede contener **múltiples screens** (en export reales, entre 2 y 20).

## Estructura de cada screen

```json
{
  "id": 100,
  "uuid": "a01d9b23-40a9-4f32-baff-c22193c319ea",
  "screen_category_id": null,
  "title": "COL - CUW LIAB - Form - Solicitud Cotización",
  "description": "...",
  "type": "FORM",
  "status": "ACTIVE",
  "key": null,
  "config": [ ...array de páginas... ],
  "computed": [ ...array de propiedades calculadas... ],
  "watchers": [ ...array de watchers... ],
  "custom_css": "/* CSS personalizado, puede ser muy largo (hasta 36KB) */",
  "translations": {},
  "is_template": false,
  "asset_type": "screen",
  "is_default": false,
  "projects": [],
  "categories": []
}
```

## Estructura de `config` (páginas)

`config` es un array de páginas. Cada página:

```json
{
  "name": "Nombre de la página",
  "order": 1,
  "items": [ ...array de componentes... ]
}
```

## Componentes de PM4

Ver `pm4-app/CLAUDE.md` § "Estructura de un paquete PM4 exportado" para la lista completa
de componentes que existen (`FormInput`, `FormMultiColumn`, `FormHtmlViewer`,
`FormNestedScreen`, `FormSelectList`, `FormDatePicker`, `BWrapperComponent`). El detalle de
schema completo solo está verificado para los primeros cuatro:

### `FormInput` — Campo de texto

```json
{
  "uuid": "edc0c348-b193-4993-a54a-b229a9331953",
  "label": "Line Input",
  "component": "FormInput",
  "config": {
    "icon": "far fa-square",
    "name": "frm_titulo",
    "type": "text",
    "label": "titulo",
    "helper": null,
    "readonly": false,
    "dataFormat": "string",
    "validation": [],
    "placeholder": null,
    "defaultValue": { "mode": "js", "value": null },
    "conditionalHide": null,
    "customCssSelector": null
  },
  "inspector": [ ...metadata interna de PM4, NO modificar... ],
  "editor-control": "FormInput",
  "editor-component": "FormInput"
}
```

Valores posibles de `dataFormat`: `string`, `int`, `currency`, `percentage`, `float`,
`datetime`, `date`, `password`.

### `FormMultiColumn` — Layout en columnas

```json
{
  "uuid": "74a0a5fa-...",
  "component": "FormMultiColumn",
  "config": {
    "icon": "...",
    "label": "Multi Column",
    "options": [...],
    "conditionalHide": null
  },
  "items": [
    [ ...array de componentes de la columna 1... ],
    [ ...array de componentes de la columna 2... ]
  ]
}
```

**Atención**: `items` en `FormMultiColumn` es un **array de arrays** (una por columna).
Cada columna contiene componentes con la misma estructura que los items de una página.

### `FormHtmlViewer` — Bloque HTML / Rich Text

```json
{
  "uuid": "ec1c75c0-...",
  "label": "Rich Text",
  "component": "FormHtmlViewer",
  "config": {
    "icon": "fas fa-pencil-ruler",
    "label": null,
    "content": "<p><strong>Título de sección</strong></p>...",
    "interactive": true,
    "renderVarHtml": false,
    "conditionalHide": null,
    "customCssSelector": "accordion-solid"
  }
}
```

### `FormNestedScreen` — Subformulario embebido

```json
{
  "uuid": "...",
  "component": "FormNestedScreen",
  "config": {
    "icon": "fas fa-file-invoice",
    "name": "Nested Screen",
    "label": "Pantalla anidada",
    "value": null,
    "screen": 101,
    "variant": "primary",
    "customCssSelector": "encabezado-screen"
  }
}
```

**CRÍTICO**: `config.screen` es el **ID numérico** de otra screen en PM4. Este ID cambia al
importar en una nueva instancia (ver "Remapeo de IDs" abajo).

## Estructura de `computed` (propiedades calculadas)

```json
{
  "id": 1,
  "name": "frm_caso",
  "type": "javascript",
  "order": 1,
  "byPass": false,
  "formula": "return this._request.case_number",
  "property": "frm_caso"
}
```

Las fórmulas son JavaScript. Algunas usan `this._request` para acceder a datos del proceso
de PM4.

## Estructura de `watchers`

```json
{
  "name": "Obtener token Tia",
  "watching": "campo_tokens",
  "run_onload": true,
  "synchronous": false,
  "show_async_loading": false,
  "input_data": "{}",
  "script_configuration": "{\"dataSource\": \"4\", \"dataMapping\": [...]}",
  "script": {
    "id": "script-43",
    "uuid": "a02d8c22-cdf4-4104-998d-f75ecf56233e",
    "title": "NombreDelScript"
  }
}
```

`script_configuration` es un **string JSON** (JSON dentro de JSON). Parsearlo solo para
mostrar en UI, nunca modificarlo.

## Estructura de `scripts` (nivel paquete)

```json
{
  "id": 4,
  "uuid": "9fe28eba-13b2-4874-be88-8ee3c8d98b31",
  "title": "DocuSignSendTemplate",
  "language": "php",
  "code": "<?php\n...",
  "description": "..."
}
```

Los scripts pueden ser PHP o JavaScript y contienen lógica de negocio crítica. **No
modificar bajo ninguna circunstancia.**

## Screens compartidas entre paquetes

En los archivos exportados, varias screens pueden aparecer en **múltiples paquetes** —
suelen ser librerías de estilos/funciones globales (CSS/JS compartido de decenas de KB) que
se referencian desde varias pantallas de negocio. Cualquier proceso que consuma varios
paquetes exportados **debe deduplicar por `uuid`** antes de usarlos — de lo contrario se
generan copias redundantes de la misma screen-librería.

## Remapeo de IDs al reimportar en otra instancia

Si `FormNestedScreen.config.screen` apunta a un ID numérico y la screen se reimporta en una
instancia distinta, ese ID cambia y hay que reescribirlo. Pseudocódigo:

```typescript
function remapNestedIds(pages: PM4Page[], idMap: Record<number, number>): PM4Page[] {
  return pages.map(page => ({
    ...page,
    items: remapItems(page.items, idMap)
  }));
}

function remapItems(items: PM4Component[], idMap: Record<number, number>): PM4Component[] {
  return items.map(item => {
    if (item.component === 'FormNestedScreen') {
      const oldId = item.config.screen as number;
      const newId = idMap[oldId];
      if (!newId) throw new Error(`ID ${oldId} no encontrado en el mapa. ¿Se importó la dependencia?`);
      return { ...item, config: { ...item.config, screen: newId } };
    }
    if (item.component === 'FormMultiColumn') {
      return { ...item, items: item.items!.map(col => remapItems(col, idMap)) };
    }
    return item;
  });
}
```

Este es el problema **paralelo** al que resuelve `pm4-app/scripts/pm4-registry-sync.mjs`
para colecciones/scripts/procesos usados en runtime por esta app — ver
`pm4-app/CLAUDE.md` § "Registro de IDs PM4". Aquel resuelve IDs por nombre en el código de
esta app; esto describe el remapeo de IDs dentro de un `config` de screen exportado, un
problema distinto (y sin herramienta construida en este repo).

## Lo que nunca debe modificarse al reempaquetar/reimportar un export

- El array `inspector` de cualquier componente.
- El campo `custom_css` de cualquier screen.
- Las fórmulas en `computed[].formula`.
- El código en `scripts[].code`.
- El `uuid` de ninguna screen ni componente.
