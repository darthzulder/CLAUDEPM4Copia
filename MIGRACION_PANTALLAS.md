# Guía de migración de pantallas PM4 — Basada en estructura real

> **Para Claude Code**: Lee este documento COMPLETO antes de escribir cualquier código relacionado con la migración. Contiene la estructura real de los archivos de PM4 analizada de los exports existentes. Sigue los pasos en orden y **pregunta al usuario antes de ejecutar cada fase**.

---

## Lo que necesitas saber antes de empezar

### El formato real de un export de PM4

Los archivos exportados desde PM4 son **paquetes** (`screen_package`), no screens individuales. Cada archivo JSON tiene esta estructura raíz:

```json
{
  "type": "screen_package",
  "version": 2,
  "screens": [ ...array de screens... ],
  "screen_categories": [ ...puede estar vacío... ],
  "scripts": [ ...scripts PHP/JS referenciados por watchers... ]
}
```

Un solo paquete puede contener **múltiples screens** (en los ejemplos reales: entre 2 y 20 screens por archivo).

### Estructura de cada screen

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

### Estructura de `config` (páginas)

`config` es un array de páginas. Cada página:

```json
{
  "name": "Nombre de la página",
  "order": 1,
  "items": [ ...array de componentes... ]
}
```

### Componentes encontrados en tus screens reales

Solo se usan **4 tipos de componentes** en tus screens actuales:

#### 1. `FormInput` — Campo de texto

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

Valores posibles de `dataFormat`: `string`, `int`, `currency`, `percentage`, `float`, `datetime`, `date`, `password`

#### 2. `FormMultiColumn` — Layout en columnas

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

**Atención**: `items` en `FormMultiColumn` es un **array de arrays** (una por columna). Cada columna contiene componentes con la misma estructura que los items de una página.

#### 3. `FormHtmlViewer` — Bloque HTML / Rich Text

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

#### 4. `FormNestedScreen` — Subformulario embebido

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

**CRÍTICO**: `config.screen` es el **ID numérico** de otra screen en PM4. Este ID cambiará al importar en una nueva instancia. Ver Fase 4 para el manejo obligatorio de esto.

### Estructura de `computed` (propiedades calculadas)

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

Las fórmulas son JavaScript. Algunas usan `this._request` para acceder a datos del proceso de PM4.

### Estructura de `watchers`

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

`script_configuration` es un **string JSON** (JSON dentro de JSON). Parsearlo solo para mostrar en UI, nunca modificarlo.

### Estructura de `scripts` (nivel paquete)

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

Los scripts pueden ser PHP o JavaScript y contienen lógica de negocio crítica. **No modificar bajo ninguna circunstancia.**

---

## Patrón importante: screens compartidas entre paquetes

En los archivos exportados, varias screens aparecen en **múltiples paquetes**:

| Screen | Paquetes donde aparece | Rol |
|--------|------------------------|-----|
| `FF - Subform estilos y funciones - Zurich Regional` | 5 de 5 | Librería CSS/JS global — 36KB de CSS |
| `CIMMR - Subform estilos - Genérico` | 4 de 5 | Librería de estilos genérica |
| `COL - CUW LIAB - Subform estilos y funciones - extended` | 2 de 5 | Librería extendida |

El sistema de migración **debe deduplicar por `uuid`** antes de importar. Si no lo hace, se crearán múltiples copias de la misma screen librería en PM4 destino.

---

## Fase 0 — Confirmaciones obligatorias antes de empezar

Pregunta al usuario todo esto antes de escribir código:

1. **¿Vas a importar archivos JSON exportados localmente, o vas a leer las screens directamente desde la API de PM4?**
   - Opción A (archivos locales): el usuario tiene los `.json` ya descargados.
   - Opción B (API live): se leerán desde `GET /api/1.0/screens`.
   La Fase 1 cambia según la respuesta.

2. **¿Tienes todos los paquetes `.json` que quieres migrar?**
   Si SÍ: pide que los coloque en `data/imports/` antes de continuar.

3. **¿La instancia PM4 destino es la misma que el origen, o diferente?**
   - Misma instancia: los IDs numéricos de `FormNestedScreen` siguen siendo válidos.
   - Instancia diferente: los IDs cambiarán y **deben remapearse**. Ver Fase 4.

4. **¿Quieres usar `POST /screens/import` (importa el paquete completo con scripts) o `POST /screens` (screen por screen)?**
   Recomendado: `POST /screens/import`. Solo usar screen-por-screen si necesitas control granular de cuáles importar.

5. **¿Los scripts PHP/JS de los watchers ya existen en PM4 destino?**
   Si es la misma instancia: sí. Si es otra: necesitan importarse también (están en el array `scripts` del paquete).

---

## Fase 1 — Ingesta de los paquetes

### Script `scripts/ingest-packages.ts`

Este script lee los archivos locales y construye el inventario. Debe:

1. Leer todos los `.json` de `data/imports/`.
2. Validar que cada archivo tiene `type === "screen_package"` y `version === 2`. Si no, reportar el archivo como inválido y continuar con el siguiente.
3. Extraer todas las screens de todos los paquetes.
4. **Deduplicar por `uuid`**: si la misma screen aparece en varios paquetes, conservar una sola copia (la del paquete más reciente, comparando `updated_at`).
5. Registrar qué screens estaban duplicadas.
6. Extraer todos los scripts de todos los paquetes y deduplicar por `uuid`.
7. Guardar en `data/processed/all-screens.json` y `data/processed/all-scripts.json`.
8. Imprimir resumen: archivos procesados, screens únicas, screens duplicadas encontradas, scripts únicos.

**Mostrar el script al usuario antes de ejecutarlo.**

### Reporte post-ingesta

Generar `data/processed/ingestion-report.md` con:

- Total de screens únicas (después de deduplicar).
- Desglose por tipo (FORM, DISPLAY, etc.).
- Tabla con: título, uuid, páginas, computed, watchers, tamaño CSS, tiene nested screens.
- Lista de screens identificadas como "librerías compartidas" (aparecen en múltiples paquetes).
- Screens que tienen watchers con sus scripts referenciados.
- Screens con `FormNestedScreen` y los IDs a los que apuntan.

Mostrar al usuario y pedir confirmación antes de continuar.

---

## Fase 2 — Análisis de dependencias

### Script `scripts/build-dependency-map.ts`

Para cada screen, construir:

```typescript
interface ScreenDependency {
  uuid: string;
  id: number;
  title: string;
  dependsOn: { id: number; uuid: string; title: string }[];
  dependedOnBy: { id: number; uuid: string; title: string }[];
  scripts: { uuid: string; title: string }[];
  isSharedLibrary: boolean;
  importOrder: number;  // 1 = importar primero (sin dependencias)
}
```

Las screens "librería de estilos" (sin dependencias de otras screens) deben tener `importOrder: 1`.

Mostrar al usuario el orden de importación propuesto para validación. **No continuar sin aprobación.**

---

## Fase 3 — Representación en la nueva app

### Tipos TypeScript

```typescript
interface LocalScreen {
  uuid: string;
  pm4IdOrigin: number | null;
  pm4IdDestino: number | null;   // null hasta que se importe
  title: string;
  type: string;
  description: string | null;
  status: string;
  config: PM4Page[];
  computed: PM4Computed[];
  watchers: PM4Watcher[];
  custom_css: string;
  translations: Record<string, unknown>;
  is_template: boolean;
  scriptsUuids: string[];
  nestedScreenIds: number[];
  nestedScreenUuids: string[];
  localStatus: 'pending' | 'imported' | 'error' | 'skipped';
  importError?: string;
  importedAt?: string;
  isSharedLibrary: boolean;
  complexity: {
    pages: number;
    computed: number;
    watchers: number;
    customCssBytes: number;
    hasNestedScreens: boolean;
    hasScripts: boolean;
  };
}

interface PM4Page {
  name: string;
  order: number;
  items: PM4Component[];
}

interface PM4Component {
  uuid: string;
  label: string;
  component: 'FormInput' | 'FormMultiColumn' | 'FormHtmlViewer' | 'FormNestedScreen';
  config: Record<string, unknown>;
  inspector?: unknown[];    // Metadata interna de PM4 — preservar, nunca modificar
  items?: PM4Component[][];  // Solo FormMultiColumn: array de columnas, cada columna es array de componentes
  'editor-control'?: string;
  'editor-component'?: string;
}
```

### Qué mostrar en la UI para cada screen

1. **Cabecera**: título, uuid (truncado), tipo, badge de estado, botones de acción.
2. **Árbol de estructura**: páginas expandibles → items → columnas si es FormMultiColumn → items de cada columna.
3. **Computed**: listado con nombre, fórmula (monospace, solo lectura).
4. **Watchers**: nombre, campo que observa (`watching`), script asociado, `run_onload`.
5. **Dependencias**: "Usa estas screens" y "Es usada por estas screens".
6. **CSS**: tamaño en KB. Si es > 10KB, mostrar aviso: `⚠️ Librería CSS compartida — no modificar`.
7. **Botón importar**: deshabilitado si hay dependencias pendientes. Mostrar cuáles faltan.

---

## Fase 4 — Importación a PM4

### Opción A — `POST /screens/import` (recomendado)

```
POST /api/1.0/screens/import
Content-Type: multipart/form-data
Body: { file: <JSON del paquete reconstruido> }
```

Para usarlo, reconstruir el objeto `screen_package` con las screens e scripts que se quieren importar, en el orden correcto (librerías primero). Enviar como archivo en el campo `file`.

Capturar los nuevos IDs en la respuesta y guardar en `data/processed/id-mapping.json`:

```json
{
  "screens": {
    "76": 201,
    "101": 202
  },
  "scripts": {
    "4": 15,
    "7": 16
  }
}
```

### Opción B — `POST /screens` screen por screen

Si se usa esta opción, **el remapeo de IDs es obligatorio**:

1. Importar primero las screens sin dependencias.
2. Capturar sus nuevos IDs.
3. Antes de importar cada screen dependiente, recorrer su `config` buscando todos los `FormNestedScreen` y reemplazar `config.screen` (ID origen) por el ID destino del mapa.
4. Solo entonces enviar a `POST /screens`.

**Función de remapeo** (pseudocódigo):
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
      return {
        ...item,
        items: item.items!.map(col => remapItems(col, idMap))
      };
    }
    return item;
  });
}
```

### Lo que NUNCA debe modificarse al importar

- El array `inspector` de cualquier componente.
- El campo `custom_css` de cualquier screen.
- Las fórmulas en `computed[].formula`.
- El código en `scripts[].code`.
- El `uuid` de ninguna screen ni componente.

---

## Fase 5 — Verificación post-importación

Para cada screen importada:

1. `GET /api/1.0/screens/{nuevo_id}` — verificar que el `uuid` y `title` coinciden.
2. Verificar que `config` tiene el mismo número de páginas.
3. Verificar que `computed` tiene el mismo número de entradas.
4. Verificar que `watchers` tiene el mismo número de entradas.
5. Si hay `FormNestedScreen`, verificar que los IDs nuevos existen en PM4.
6. Actualizar `localStatus` a `'imported'` o `'error'`.

### Checklist final para el usuario

- [ ] Screens importadas exitosamente vs. con error.
- [ ] Screens "librería" importadas exactamente una vez (sin duplicados).
- [ ] Screens con `FormNestedScreen` verificadas manualmente en PM4.
- [ ] Screens con watchers: scripts existen en PM4 destino.
- [ ] Archivo `id-mapping.json` guardado como referencia permanente.

---

## `.gitignore` obligatorio

```
data/imports/
data/processed/
.env
```

---

*Documento generado a partir del análisis de 5 paquetes reales: 63 screens únicas, 9 scripts PHP/JS, 4 tipos de componentes (FormInput, FormMultiColumn, FormHtmlViewer, FormNestedScreen)*
