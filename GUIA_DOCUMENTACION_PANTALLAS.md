# Guía — Generación de Documentación Funcional por Pantalla

> **Cómo usar este archivo:** al pedir a Claude que cree (o termine) una pantalla, referenciar este documento.
> Ejemplo: *"Crea la pantalla `corregir-datos` siguiendo `GUIA_DOCUMENTACION_PANTALLAS.md` y genera también su documentación."*
> El objetivo es que **cada pantalla** tenga un archivo `DOCUMENTACION_<slug>.md` con **trazabilidad completa** entre lo implementado y los archivos de Insumos.

---

## Regla general

Cuando se genere una pantalla nueva, **siempre** se debe generar, en la misma carpeta de la pantalla, el archivo:

```
frontend/src/screens/<slug>/DOCUMENTACION_<slug>.md
```

donde `<slug>` es el nombre de la carpeta de la pantalla (p. ej. `recibir-queja`).

La documentación **no es opcional**: forma parte del entregable de la pantalla. Si se modifica una pantalla existente, se debe **actualizar** su `DOCUMENTACION_<slug>.md`.

---

## Fuente de verdad: carpeta Insumos

Todos los insumos están en `pm4-app/insumos/`. Para Quejas Directas son:

| Archivo | Para qué sirve |
|---|---|
| `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0.xlsx` | **Fuente principal.** Campos, secciones, acciones, reglas, mensajes, catálogos y permisos por pantalla. |
| `Matrices_Maduracion_TO-BE_QuejaDirectas_v2.0.xlsx` | Tareas BPMN, **directrices y reglas de negocio**, roles, documentos de entrada/salida. |
| `Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v1_0.xlsx` | Variables de entrada/salida de las tareas automatizadas (nombres canónicos de variable, obligatoriedad). |

> Si en el futuro se agregan otros `.xlsx` a `insumos/`, analizarlos también. **Nunca documentar sin haber leído los insumos.**

### Hojas clave del Anexo02 (Mockups)

| Hoja | Contenido | Filtrar por |
|---|---|---|
| `01_Pantallas` | Inventario maestro: SCR/PAN, tarea BPMN, historia de usuario, criterio de aceptación | fila de la `SCR-xxx` |
| `<SCR-xxx>` (p. ej. `SCR-001`) | Hoja dedicada: historia de usuario, **campos (FLD-…)**, **acciones (ACT-…)**, **reglas críticas (RUL-…)** | toda la hoja |
| `02_Secciones` | Secciones (SEC-…), orden, columnas, visibilidad/condición | columna `ID Pantalla (SCR)` |
| `03_Campos` | Diccionario maestro de campos (referencia cruzada de FLD) | columna de pantalla |
| `04_Acciones` | Botones: etiqueta, tipo, condición de habilitación, siguiente paso BPMN | columna `SCR` |
| `05_Reglas` | Reglas de validación/control/negocio: condición, acción, severidad, bloquea, mensaje | columna `SCR` |
| `06_Mensajes` | Mensajes del sistema (MSG-…): tipo, título, texto, cuándo se muestra | columna `SCR` |
| `07_Catalogs` | Catálogos (CAT-…): origen (SFC/Zurich/BPM), estado, dependencia | por catálogo usado |
| `08_Permisos` | Permisos por rol y pantalla | columna `SCR` |
| `10_Trazabilidad_BPMN` | Mapeo pantalla → tarea/subproceso, evento de apertura, acción de cierre, compuerta, datos in/out | fila de la `SCR-xxx` |

### Hojas clave de Matrices

| Hoja | Contenido | Filtrar por |
|---|---|---|
| `1. Tareas` | Inventario de tareas BPMN + matriz RACI por rol | `Código Tarea` (p. ej. `P01-T01`) |
| `2. Directrices` | Lineamientos 🟢 / Controles 🟠 / Restricciones 🔴 / Reglas de negocio 🔵 | `Código Tarea` |
| `4. Pantallas` | Historias de usuario + criterios de aceptación (solo tareas de Usuario) | `Código` |
| `5. Documentos` | Documentos de entrada y salida por tarea | `Código Tarea` |

### Hojas clave de Anexo03

| Hoja | Contenido | Filtrar por |
|---|---|---|
| `01_Inventario` | Inventario de tareas automatizadas (scripts/servicios/eventos) | `Código Tarea` |
| `05_Variables_Entrada` | Variables de entrada por tarea: nombre, tipo dato, obligatoria, descripción | `Código Tarea` |
| `06_Variables_Salida` | Variables de salida por tarea | `Código Tarea` |

> La tarea de servicio que **registra** la queja/caso (p. ej. `P01-T02`) suele contener los **nombres canónicos de variable** que corresponden 1:1 a los campos del formulario. Es la mejor fuente para el mapeo *campo UI → variable BPM*.

---

## Procedimiento paso a paso

1. **Identificar la pantalla.** Determinar el código `SCR-xxx` / `PAN-xx` y la **tarea BPMN** (`Pnn-Txx`) a partir de `01_Pantallas` y `10_Trazabilidad_BPMN`. Anotar proceso, subproceso y rol responsable.

2. **Leer los insumos relevantes.** Extraer y leer (no asumir): la hoja `SCR-xxx`, las filas de la pantalla en `02_Secciones`, `04_Acciones`, `05_Reglas`, `06_Mensajes`, `07_Catalogs`, `08_Permisos`; las filas de su tarea en Matrices `1. Tareas`, `2. Directrices`, `5. Documentos`; y las variables en Anexo03 `05_Variables_Entrada`/`06_Variables_Salida`.

   > **Cómo leer los `.xlsx`:** usar Python con `openpyxl` (`load_workbook(path, data_only=True, read_only=True)`). En Windows la consola puede fallar con UTF-8; **volcar la salida a un archivo `.txt` con `io.open(..., encoding="utf-8")`** y leer ese archivo. Borrar los `.txt` temporales al terminar.

3. **Leer la implementación.** Revisar todos los archivos de la carpeta de la pantalla (`*.tsx`, `variables.ts`) y los posibles estilos añadidos en `shared.css` para saber qué se implementó realmente: campos, `rules` de validación, `pattern`/`maxLength`, render condicional, `defaultValues`, dependencias (`useEffect`), botones y acciones. *Nota: No se deben crear archivos `styles.css` locales; toda personalización necesaria debe residir en `shared.css` de manera DRY.*

4. **Cruzar implementación ↔ insumos.** Para cada elemento implementado, encontrar su origen exacto y anotar la referencia: `Archivo > Hoja > ID/fila`. Para cada elemento del insumo que **no** se implementó, documentarlo igualmente como no implementado/pendiente con su fuente.

5. **Escribir `DOCUMENTACION_<slug>.md`** con la estructura de la sección siguiente.

6. **Limpiar** archivos temporales y verificar que el `.md` quedó en la carpeta de la pantalla.

---

## Estructura obligatoria del documento

El archivo `DOCUMENTACION_<slug>.md` debe contener, en este orden:

1. **Encabezado** — pantalla (SCR/PAN), tarea BPMN, proceso, rol, versión, archivos de implementación.
2. **Resumen** — breve descripción funcional de la pantalla y su rol en el flujo.
3. **Archivos de Insumo Analizados** — tabla `Archivo | Hoja | Descripción de uso`.
4. **Campos Implementados** — tabla `Campo (UI) | Variable | Tipo | Obligatorio | Fuente` (una sección por cada sección del formulario).
5. **Validaciones Implementadas** — tabla `Validación | Comportamiento implementado | Fuente`.
6. **Mensajes de Error** — tabla `Mensaje | Condición | Implementación | Fuente`.
7. **Reglas de Negocio** — tabla `Regla | Implementación | Fuente`.
8. **Comportamientos de UI** — tabla `Comportamiento | Implementación | Fuente`.
9. **Dependencias Entre Campos** — tabla `Campo Origen | Campo Dependiente | Comportamiento | Fuente`.
10. **Suposiciones Realizadas** — toda decisión NO definida explícitamente en los insumos (ver reglas abajo).
11. **Cobertura de Trazabilidad** — % estimado por categoría + lista de elementos inferidos.

> Referencia de un documento ya elaborado con esta estructura:
> `frontend/src/screens/recibir-queja/DOCUMENTACION_recibir-queja.md`.

---

## Reglas de trazabilidad (no negociables)

- **Toda fila debe citar su fuente** con el formato `Archivo > Hoja > ID/fila`, p. ej. `Anexo02 > SCR-001 > FLD-006 (fila 21)` o `Matrices > 2. Directrices fila 14`.
- **No omitir nada.** Cada campo, validación, mensaje, comportamiento, regla de negocio y dependencia detectado en los insumos debe aparecer.
- **Si una regla proviene de varias fuentes**, citarlas todas.
- **Lo no implementado también se documenta**, marcado claramente como *no implementado* / *pendiente*, con su fuente y el motivo.
- **Lo inferido va en "Suposiciones realizadas".** Cualquier decisión de implementación sin respaldo explícito en los insumos (convenciones de nombres, catálogos placeholder, comportamiento de UX, formatos añadidos, textos redactados por el desarrollador) debe declararse ahí.
- **Catálogos "Pendiente TI".** Si `07_Catalogs` marca un catálogo como pendiente y se implementó como lista estática, decirlo explícitamente como suposición/pendiente.
- **No inventar** IDs, filas, valores ni reglas. Si un dato no está en los insumos, se declara como suposición, no como hecho.

---

## Checklist final

- [ ] Existe `frontend/src/screens/<slug>/DOCUMENTACION_<slug>.md`.
- [ ] Todos los insumos `.xlsx` de la carpeta `insumos/` fueron analizados.
- [ ] Todas las secciones obligatorias del documento están presentes.
- [ ] Cada elemento implementado tiene fuente citada (`Archivo > Hoja > ID/fila`).
- [ ] Los elementos de insumo no implementados están documentados como pendientes con su fuente.
- [ ] Las decisiones inferidas están en "Suposiciones realizadas".
- [ ] La sección "Cobertura de Trazabilidad" reporta % por categoría.
- [ ] Se eliminaron los archivos temporales usados para leer los Excel.
