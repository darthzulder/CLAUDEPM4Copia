# Documentación — Dashboard — Gestión de Casos (SCR-013 / PAN-13) — **v2.0 (Angular)**

> **Qué cambió respecto de la 1.0 y cómo leer esta ficha.** La 1.0 documentaba la implementación
> React. Esta 2.0 documenta el **port a Angular 21** (Fase 5, pantalla 10 de 12) y hace dos cosas
> distintas que conviene no confundir:
>
> - Los bloques **`⚠ corregido en 2.0`** son lugares donde la ficha 1.0 **no coincidía con su propio
>   código React**. No los introduce el port: ya estaban así. Se corrige el texto de la ficha, y el
>   comportamiento se deja como estaba.
> - La **§13** es nueva y es del port: qué se ve distinto en Angular y por qué.
>
> **Nada de lo que esta ficha reporta como bug se arregló en el port.** Es una migración de framework:
> cambiar comportamiento acá sería un cambio funcional encubierto, imposible de distinguir de una
> regresión al comparar las dos apps. Cada hallazgo va a §14 para que negocio decida, y el más grave
> (el filtro de Área) queda **cubierto por un `it()` que asevera el comportamiento actual** y nombra
> el campo que haría falta, para que el día que se decida el test se ponga rojo señalando la línea.

## 1. Encabezado

| Campo | Valor |
|---|---|
| Pantalla | **SCR-013 · PAN-13 — Dashboard — Gestión de Casos** |
| Tarea BPMN (según prompt) | `P01-T09` *(ver nota crítica abajo)* |
| Proceso | P01 — Gestión de Quejas Directas |
| Subproceso | — (vista transversal de supervisión) |
| Rol | Supervisor / Jefe SAC |
| Versión mockup | Anexo02 v3.0 (HTML) + hoja `SCR-013` de v3_2 |
| Slug / carpeta | `COL_QD_SCR-013_Dashboard_Gestion_Casos` |
| Archivos de implementación (Angular) | `dashboard-gestion-casos.ts`/`.html`, `tabla-casos.ts`/`.html`, `detalle-caso-modal.ts`/`.html`, `casos-dashboard.service.ts`, `dashboard-helpers.ts` (config en `fields/fields.ts` + `fields/types.ts`), estilos en `shared.css` (`.kpi-warn`/`.kpi-danger`/`.kpi-ok`), + ruta backend `GET /api/requests` ya existente |
| Archivos de test | **cinco** — `dashboard-gestion-casos.spec.ts` (21), `tabla-casos.spec.ts` (8), `detalle-caso-modal.spec.ts` (8), `dashboard-helpers.spec.ts`, `casos-dashboard.service.spec.ts` · **77 casos en total** |

> ⚠️ **Nota de trazabilidad (se mantiene de la 1.0).** Esta pantalla nació **sin especificación formal
> en los insumos Excel** (era *mockup-only*): su estructura se derivó del mockup HTML
> `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.html` (bloque `SCR-013`, líneas ~1396–1619). Desde
> 2026-07-24 está formalizada en `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` (hoja `SCR-013`,
> FLD-360…377, ACT-013-01…05, RUL-013-01…04, MSG-013-01…03).
>
> **Salvedades vigentes:** en `Matrices > 4. Pantallas` el inventario **no** incluye PAN-13, y el
> código `P01-T09` en `Matrices > 1. Tareas` corresponde a **"Enviar encuesta de satisfacción al
> cliente"** (tarea automática de tipo *Envío*), **no** a un dashboard de supervisión.

---

## 2. Resumen

Vista consolidada de **solo lectura** para el Supervisor / Jefe SAC, con KPIs de SLA, barra de
filtros, tabla paginada y modal de detalle por caso.

**Es la única pantalla del proceso que no completa ninguna tarea de PM4.** No hay `task_id`, no hay
`TaskService` y no hay `completeTask`: es un tablero. Eso la hace estructuralmente distinta de las
otras once del port y explica por qué su carga de datos es un servicio propio con spec aparte.

**Origen de datos:** `GET /api/requests?include=data&per_page=100&page=N&type=all` paginado hasta
`meta.last_page`, acotado al proceso QD por PMQL `process_id = N`, con auto-recuperación en cliente si
el servidor rechaza el PMQL. Segunda pasada por `GET /tasks?status=ACTIVE&include=data` para ubicar
dónde está parado el flujo. Los filtros operan **cliente-side**.

**Acción principal:** "Descargar reporte" exporta a CSV el resultado filtrado actual.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja / Sección | Descripción de uso |
|---|---|---|
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.html` | Bloque `SCR-013` (líneas ~1396–1619) | **Fuente única de estructura**: alerta, top bar, KPIs, filtros, tabla, paginación y modal. |
| API PM4 `GET /api/1.0/requests?include=data` | — | **Fuente de datos** de los casos. Lógica de paginado + PMQL + auto-recuperación replicada del script PHP entregado por el usuario. |
| API PM4 `GET /api/1.0/tasks?status=ACTIVE` | — | Segunda pasada: ubica la tarea activa por caso. |
| `screens/…/quejas-directas/fields/fields.ts` | Registro `QD` + `SCR013_*` | Nombres canónicos `qd_*` y las constantes de la pantalla. |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | Hoja `SCR-013` + matrices | Especificación formal (agregada 2026-07-24). |
| `Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx` | `1. Tareas`, `4. Pantallas` | Verificación de ausencia de PAN-13 y del significado real de `P01-T09`. |
| `core/collections.ts` | `GLOBAL_COLLECTIONS` | `QD_COLLECTIONS.requestType` (id 18), `area` (id 35), feriados (id 48). |

---

## 4. Campos / Columnas Implementados

### 4.1 KPIs (tarjetas de SLA)

| KPI (UI) | Variable / cálculo | Tipo | Fuente |
|---|---|---|---|
| Casos abiertos | `calcularKpis().abiertos` = casos con `estado='Abierta'` | derivado | HTML SCR-013 |
| Próximos a vencer | `porVencer` = casos con `estado='Por Vencer'` | derivado | HTML SCR-013 |
| Vencidos | `vencidos` = casos con `estado='Vencida'` | derivado | HTML SCR-013 |
| Cerrados | `cerrados` = casos con `estado='Cerrada'` | derivado | HTML SCR-013 |

> ⚠ **corregido en 2.0 — el umbral de "Próximos a vencer" es 2, no 3.** La ficha 1.0 (§7 y §10.5)
> declaraba **3** días "alineado con el umbral crítico de SCR-008". El código dice
> `SCR013_SLA_UMBRAL_PROXIMO = 2` (`fields/fields.ts:1222`) y así se portó. La ficha estaba mal, no el
> código.
>
> ⚠ **corregido en 2.0 — "Cancelada" no suma en NINGÚN KPI.** No estaba dicho en la 1.0 y es
> deliberado: un caso cancelado no está abierto ni cerrado. Con los 8 `SAMPLE_CASES` (uno de ellos
> `Cancelada`) los KPIs dan `2/2/2/1` y **suman 7, no 8**. Cubierto por dos casos, uno en
> `dashboard-helpers.spec.ts` y otro en el spec de pantalla.

### 4.2 Filtros

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Tipo de solicitud | `filtroTipo` | select colección `requestType` (id 18) | No | HTML SCR-013 |
| Estado | `filtroEstado` | select estático (`SCR013_OPTIONS_ESTADO`) | No | HTML SCR-013 |
| Área responsable | `filtroArea` | select colección `area` (id 35) | No | HTML SCR-013 |
| Buscar por caso o responsable | `filtroBuscar` | texto (`zds-input`, icono `search`) | No | HTML SCR-013 |

> **Estado** es un valor operativo derivado de `request.status` + SLA (no un catálogo), por eso queda
> estático. La opción "todos" va primero en los dos selects de colección, con **rótulo por género**
> ("Todos" para Tipo, "Todas" para Área) igual que en React: no es un descuido que valga unificar.
>
> ### ⚠ corregido en 2.0 — **el filtro de Área está ROTO, y es un bug de comportamiento, no de texto**
>
> La 1.0 (§4.2, línea 78) declara que el `value` del filtro "coincide con el código almacenado en
> `qd_strAssigneeArea`". **No es lo que hace el código, en React ni en Angular.**
> `mapRequestToCaso` llena `areaResponsable` desde **`qd_strResponsableRole`**, que es un **rol**
> ("Analista SAC"), no un código de área. El filtro compara entonces un código de colección (`'35'`)
> contra un nombre de rol: **no matchea nunca**, y elegir cualquier área vacía la tabla.
>
> Está **replicado tal cual** en Angular y **cubierto por un `it()`** que asevera el comportamiento
> actual (`⚠ BUG HEREDADO DE REACT — filtrar por Área no devuelve NADA`), con el campo que cerraría el
> círculo —`qd_strAssigneeArea`— nombrado en el comentario. Qué campo debe gobernar el filtro (¿área o
> rol?) es una decisión de negocio. **Es el hallazgo de mayor prioridad de §14.**

### 4.3 Tabla de casos (`CasoDashboard`)

> `CasoDashboard` es un modelo de presentación derivado, no un conjunto de variables PM4 — por eso sus
> miembros NO llevan el prefijo `qd_` (ver `fields/types.ts`).

| Columna (UI) | Variable | Tipo | Nota del port |
|---|---|---|---|
| **Estado** | `estado` → `estadoVariante()` (`zds-status-badge`) | enum | **Primera columna en Angular** — ver §13 |
| # Caso | `numeroCaso` | string | Sin `<strong>` — ver §13 |
| Tipo | `tipoSolicitud` → descripción | string | Resuelto por `tipoMap` antes de entrar a la tabla |
| Creación | `fechaCreacion` | string | |
| SLA | `sla` → `${sla} días` / `—` | string | |
| Vencimiento | `fechaVencimiento` | string | |
| Días restantes | `diasRestantes` → `diasRestantesTexto()` | texto | Solo texto, sin ícono |
| Área | `areaResponsable` → descripción | string | Resuelto por `areaMap` |
| Responsable | `responsable` | string | |
| **Acción** | botón "Ver" → modal | acción | **Última columna** — ver §13 |

### 4.4 Modal de detalle (`detalle-caso-modal`)

Siete filas en `app-info-bar` (Estado · Tipo de solicitud · Fecha de creación · SLA asignado · Fecha de
vencimiento · Días restantes · Área responsable) más título, subtítulo y descripción. El **Estado va
como píldora** (viaja por `TemplateRef`), las otras seis como texto.

> ⚠ El sufijo del SLA en el modal es **"días hábiles"** y en la tabla es **"días"**. La diferencia se
> copió de React tal cual; un unificado bienintencionado lo detecta el spec del modal.

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| — | Pantalla de solo lectura: **no hay validaciones de formulario** ni envío de datos a PM4. El `FormGroup` de los cuatro filtros no tiene validadores (un filtro vacío significa "todos"). | HTML SCR-013 |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| Aviso informativo de la vista en tiempo real | Siempre visible | `za-alert config="info"` con `[hide-close]="true"` | HTML SCR-013 |
| "No se pudieron cargar los casos desde PM4 (…). Mostrando datos de ejemplo." | `/requests` falló (y también su reintento sin PMQL) | `za-alert config="negative"` | Suposición (§10) |
| "No hay casos que coincidan con los filtros seleccionados." | Lista filtrada vacía | Párrafo **hermano** de la tabla — ver §13 | Suposición (§10) |
| "Sin casos" / "Mostrando X–Y de N casos" | Resumen de paginación | `strResumenPagina()` | HTML SCR-013 |

> ⚠ **A diferencia de las nueve pantallas anteriores del port, un error NO reemplaza la pantalla.**
> Este tablero degrada a datos de ejemplo y sigue siendo usable, así que el error va como una caja más
> arriba de la tabla, no como rama exclusiva.

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| Fecha límite del caso | `qd_strFilingDate` + `qd_strSlaAssigned` **días hábiles** (feriados de la colección 48) | Script PM4 `COL_UTIL_Dias_Habiles` (id 95) |
| Días restantes | Días **hábiles** entre hoy y la fecha límite | idem |
| Texto de días restantes | `N días` / `1 día` / `Vence hoy` (0) / `N días de mora` (negativo) / `—` para Cerrada y Cancelada | Solicitud del usuario |
| Píldora de estado | `estadoVariante()`: Abierta→info, Por Vencer→warning, Vencida→danger, Cerrada→success, Cancelada→neutral | HTML SCR-013 |
| "Próximos a vencer" | `0 ≤ diasRestantes ≤ SCR013_SLA_UMBRAL_PROXIMO` (**= 2**) | Suposición (§10) |
| Estado derivado del request | `COMPLETED`→Cerrada · `CANCELED`/`CANCELLED`→Cancelada · activo con mora→Vencida · resto→Abierta | Script PHP del usuario |
| Cruce con la tarea activa | Por `case_number` **y** exigiendo `case_title === SCR013_CASE_TITLE` | Ver §8 |

> ⚠ **corregido en 2.0 — la fecha base es `qd_strFilingDate` y los días son HÁBILES.** La 1.0 (§7 y
> §10.3) describía `(created_at + SLA) − hoy` en días corridos, con fallback a `qd_fechaVencimiento`.
> El código usa la **fecha de radicación SFC** (`qd_strFilingDate`, `DD/MM/YYYY`) y **días hábiles**,
> que es la misma regla del script PM4 id 95; `created_at` refleja cuándo se abrió la tarea en el BPM,
> no cuándo se radicó el caso. Y **`qd_fechaVencimiento` ya no existe en el código** (era además el
> único campo del proceso sin nombre canónico confirmado, ver §10.2 de la 1.0). Sin radicación no hay
> fecha límite y los días restantes quedan en `—`, no en 0.
>
> ⚠ **corregido en 2.0 — `responsable` sale de `data._user.fullname`.** La 1.0 (§10.3) decía
> `qd_strAssignee || qd_strAssigneeRole`. El código lee el usuario del caso que devuelve PM4.

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Draft vs aplicado | `FormGroup` (el borrador) + un `signal` **aparte** de filtros aplicados. "Aplicar filtros" copia uno al otro y vuelve a página 1; "Limpiar" resetea **los dos** | HTML SCR-013 |
| Filtrado cliente-side | `computed()` sobre los filtros **aplicados**: tipo, estado, área + búsqueda libre | HTML SCR-013 |
| Búsqueda libre | Mira # caso, responsable y **la descripción** del tipo (no su código); ignora mayúsculas y espacios de sobra | HTML SCR-013 |
| Paginación cliente-side | `SCR013_PAGE_SIZE = 8`, con la página **acotada** al total (`Math.min`) | HTML SCR-013 |
| Abrir detalle | Botón "Ver" → modal de solo lectura; cierra por el botón **y por el `(close)` del modal del DS** | HTML SCR-013 |
| "Descargar reporte" | CSV de lo **filtrado**, con BOM UTF-8, nombre `reporte-casos-quejas-directas.csv`; deshabilitado sin filas; `revokeObjectURL` en `finally` | Solicitud del usuario |
| Carga de datos | `CasosDashboardService`: paginado de `/requests` + auto-recuperación de PMQL + segunda pasada por `/tasks`; fallback a `SAMPLE_CASES` si no devuelve casos | Script PHP + patrón del proyecto |

> **Por qué el draft y lo aplicado son dos estados y no uno.** Sobre 100+ casos, filtrar en cada tecla
> recalcularía la tabla y la paginación por carácter. Es el `watch()` + `useState` de React portado tal
> cual, y las dos mitades están cubiertas (que el draft **no** filtra hasta aplicar, y que "Limpiar"
> resetea los dos y vuelve a página 1).
>
> **Por qué el cruce con `/tasks` exige el `case_title`.** PM4 numera `case_number` por colaboración,
> no globalmente: un `case_number` de otra colección de procesos puede coincidir por accidente y
> pisaría la fila con datos de otro proceso. Cubierto por un caso propio del spec del servicio.
>
> **Por qué un fallo de `/tasks` NO tira el dashboard.** La segunda pasada es una mejora sobre datos
> que ya son reales: si falla, se sigue mostrando el dato del request raíz y **no** se reporta error
> (se registra en `console.error`). Un cartel rojo haría creer que la tabla no sirve, y sí sirve.
>
> ⚠ **`SAMPLE_CASES` se dispara con la lista VACÍA, no solo con error.** Un tenant legítimamente sin
> casos muestra 8 casos de ejemplo **sin decirlo** (el cartel de "datos de ejemplo" solo aparece si
> además hubo error). Es comportamiento heredado de React y se porta como está; queda en §14.

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento |
|---|---|---|
| `estado` | Columna "Estado" (píldora) y su color | La variante de `zds-status-badge` se deriva del estado |
| `estado` + fecha límite + feriados | `diasRestantes` y el estado derivado | Los feriados llegan asincrónicamente; el `computed()` recalcula solo cuando llegan |
| Filtros aplicados | KPIs | **NO dependen**: los KPIs se calculan sobre la lista **completa** |
| Filtros aplicados | Página actual | Aplicar vuelve a página 1; si el filtro reduce el total, la página se **acota** |

> **Los KPIs sobre la lista completa es una decisión, no un descuido.** Los contadores son el estado
> del proceso, no del recorte que el supervisor está mirando: si siguieran al filtro, elegir "Cerrada"
> mostraría "Vencidos: 0" y parecería que no hay nada vencido. Tiene un caso propio, y romperlo
> (`cllCasos()` → `cllFiltrados()`) pone rojo exactamente ese caso.

---

## 10. Suposiciones Realizadas

1. **Pantalla mockup-only.** PAN-13 no está en Matrices; `P01-T09` corresponde funcionalmente a la
   encuesta de satisfacción, no a un dashboard. Se conserva como identificador del prompt.
2. **Umbral "Próximos a vencer" = 2 días hábiles** (`SCR013_SLA_UMBRAL_PROXIMO`). El mockup no fija el
   número. ⚠ La 1.0 decía 3 — ver §4.1.
3. **Origen y mapeo de datos.** `process_id` = el mismo default que el Web Entry de SCR-000.
   `numeroCaso` ← `qd_strSfcCode || case_number || id`; `descripcion` ← `qd_strComplaintText`;
   `responsable` ← `data._user.fullname`; fecha base `qd_strFilingDate`.
4. **KPIs derivados de la lista completa.** El mockup muestra KPIs globales (12/3/5/20) distintos a las
   8 filas visibles; se implementan como conteos derivados para garantizar consistencia.
5. **Filtros por colección (Tipo id 18, Área id 35).** ⚠ El de Área no funciona — ver §4.2.
6. **Campo "Rango de fechas" → "Buscar".** El mockup rotula el 4.º filtro como "Rango de fechas" pero
   el control es un `input` de texto con `placeholder="Buscar por caso…"`. Se implementó como búsqueda
   de texto. Si se requiere un rango real, cambiar a dos `zds-date`.
7. **Exportación CSV en el navegador** (Blob + BOM UTF-8). No hay endpoint de reporte server-side.
8. **Manejo de error / lista vacía.** Textos redactados por el desarrollador (no especificados).

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura vs. mockup HTML | Notas |
|---|---|---|
| Estructura / layout | ~100% | Alerta, top bar, KPIs, filtros, tabla, paginación y modal replicados. |
| Campos / columnas | ~100% | Las diez columnas y todos los campos del modal, con **Estado reordenado** (§13). |
| Reglas de negocio | Parcial (inferidas) | Umbrales de SLA inferidos; sin fuente numérica formal. |
| Validaciones | N/A | Pantalla de solo lectura. |
| Trazabilidad a Excel/Matrices | Parcial | Hoja `SCR-013` existe desde v3_2; PAN-13 sigue ausente de Matrices. |
| **Tests** | **77 casos en 5 archivos** | Un caso por regla, no un smoke. Ver §13.4. |

---

## 12. Mapeo elemento → componente DS (Angular)

| Elemento del mockup | Componente Angular | Tipo de decisión |
|---|---|---|
| Alerta informativa superior | `za-alert config="info"` (inline, no la cola imperativa) | Componente DS (fachada) |
| Barra título + "Descargar reporte" | `z-flex="100" z-align="between:center"` + `.section-title` + `lib-button-z type="primary:s"` | Primitivos DS + DS |
| Tarjetas KPI | `za-kpi-value` + clases `.kpi-warn`/`.kpi-danger`/`.kpi-ok` | Componente DS + CSS tokenizado |
| Filtros (selects) | `zds-select` + `CatalogosService.de(...)` | Fachada + colecciones PM4 |
| Filtro búsqueda | `zds-input icon="search:line"` | Fachada |
| Botones Aplicar/Limpiar | `lib-button-z` + `z-flex`/`z-align` | DS + primitivos de layout |
| Sección "Filtros" | `app-form-section` | Componente propio |
| Tabla de casos | `lib-table-z` (`TableZ`) con sus **dos** huecos | Componente DS — ver §13.1 |
| Píldora de estado | `zds-status-badge` (sobre `za-tag`) | Fachada |
| Botón "Ver" | `lib-button-z type="secondary:s"` | DS |
| Paginación | `za-pagination` escrito por `viewChild` — ver §13.2 | Componente DS |
| Modal de detalle | `lib-modal-z` + `app-info-bar` + `zds-status-badge` | DS / propios |
| Loader | `lib-loader-z` | DS |

> **Los colores de KPI no van inline.** React los pone con `style={{'--z-kpi-value--color': …}}`; el
> proyecto prohíbe estilos ad-hoc, así que van como tres clases tokenizadas al final de `shared.css`.
> El input `config` de `za-kpi-value` **no sirve** para esto: solo tiñe el `difference`, que esta
> pantalla no usa.

---

## 13. Notas del port a Angular (nuevo en 2.0)

### 13.1 La tabla pierde el orden de columnas de React, y es la decisión de diseño del port

React arma un `<table>` a mano dentro de `ZrTable` y pinta diez columnas en su orden natural, dos de
ellas con markup: **Estado** (píldora) y **Acción** (botón Ver). En Angular `ZrTable` **es** `TableZ`
de `lib-zurich`, que **no proyecta markup**: arma la tabla desde `[headers]`/`[data]` y expone
exactamente **dos** huecos templateables, `start` y `end`. Su `columnTemplates` está declarado pero se
llena en `ngAfterContentInit` y **nunca se lee**.

Con exactamente dos celdas no-texto y exactamente dos slots, la asignación es forzada:

| React (orden original) | Angular |
|---|---|
| …, Días restantes, **Estado**, Área, Responsable, **Ver** | **Estado** (`start`), las ocho de texto, **Ver** (`end`) |

Se eligió esto y no degradar la píldora a texto porque la regla del proyecto es explícita —"gana el
componente del DS"— y porque el color del estado es lo que un supervisor lee primero.

**Descartado `isTag`**, que sería la vía sin slots: colorea comparando el texto contra un vocabulario
fijo **en inglés** (`Error`/`OK`/`Warning`/`Archivado`…) y arranca en `#000000`. Ninguno de los cinco
estados de esta pantalla está ahí: serían cinco píldoras negras.

Tres detalles frágiles de esa tabla, cada uno con su caso en `tabla-casos.spec.ts` porque **ninguno
pone rojo nada por sí solo**:
- Los `id="start"`/`id="end"` son literales que `TableZ` compara en un `switch`. Otro id cae en
  `columnTemplates` y la celda **desaparece sin error**.
- **`generciEndName` va con el typo de la librería.** Su hermano `genericStartName` está bien escrito,
  así que "corregirlo" es el error natural — y el rótulo de Acción se cae.
- El empty state es un **hermano** de la tabla, no un `@if` que la envuelva: el `<tbody>` de `TableZ`
  es un `@for` pelado sin rama de lista vacía, así que envolverla se comería los diez rótulos justo
  cuando el usuario necesita ver contra qué está filtrando.

### 13.2 ⚠ `[ngModel]` es INUSABLE en esta pantalla, y afecta a cualquier pantalla futura igual

`za-pagination` lleva su página por el input `ngModel` (hereda de `ZaModelElement`, donde `ngModel` es
un `@Input` común, **no** un `ControlValueAccessor`). Pero esta pantalla importa `ReactiveFormsModule`
para los cuatro filtros, y ese módulo exporta `NgControlStatus`, cuyo selector es
`[formControlName],[ngModel],[formControl]`. Un `[ngModel]` pelado en la plantilla **lo matchea**, y esa
directiva hace `inject(NgControl)` **sin fallback**: `ZaModelElement` no provee ningún `NgControl`, así
que el render explota con **NG0201 y la pantalla entera no monta**.

No hay forma de desactivar el matcheo por elemento y el input no se puede renombrar (es del DS). La
salida es escribirlo **desde la clase** por `viewChild(ZrPagination)` + `effect`, donde no hay selector
que matchear. Lo destapó el caso de paginación del spec.

**Vale para cualquier pantalla futura que combine un control `ZaModelElement` con Reactive Forms** —
va a §14.

### 13.3 Diferencias visuales menores, deliberadas

- **`# Caso` pierde el `<strong>`.** React lo pinta en negrita; `TableZ` pinta texto plano y no hay
  dónde meter markup en una columna de `[headers]`.
- **Tipo y Área pierden la búsqueda dentro del select.** React usa `withSearch`; `zds-select` no tiene
  ese input. Con ~20 opciones de Área es una molestia, no un bloqueo.
- **El tamaño de los botones va encadenado en `type`** (`type="primary:s"`), porque `ButtonZ` no tiene
  `size`. Y `[disabled]` es obligatorio explícito: su default es `true`, así que sin él el botón pinta
  igual y no dispara nunca.

### 13.4 Los cinco archivos de test, y por qué son cinco

| Archivo | Qué cubre | Por qué aparte |
|---|---|---|
| `dashboard-helpers.spec.ts` | KPIs, `estadoVariante`, `diasRestantesTexto`, `casosToCSV`, `mapRequestToCaso` | Lógica pura, sin framework |
| `casos-dashboard.service.spec.ts` | Paginado, auto-recuperación de PMQL, cruce por `case_title`, degradación de `/tasks`, error | El hook React **no tenía spec**: su lógica era la menos cubierta del proyecto |
| `tabla-casos.spec.ts` | Los dos slots, los rótulos, el typo, el empty state, el `output` por fila | Las tres reglas de §13.1 se degradan sin poner rojo la pantalla |
| `detalle-caso-modal.spec.ts` | Las siete filas, la píldora por `TemplateRef`, el `(close)` del DS | Entradas puras; probarlo desde la pantalla costaría el montaje completo |
| `dashboard-gestion-casos.spec.ts` | Los 7 casos de React **+ los 2 que React declaró imposibles + el bug de Área** | — |

**Se cerró una brecha que el spec React declaraba imposible.** Su comentario dice que la rama "filtro
sin resultados ⇒ Descargar bloqueado + 'Sin casos'" no se puede cubrir porque en jsdom no se puede
escribir en un control del DS. En Angular el filtro es un `FormControl`: se escribe con `patchValue()`
y la brecha se cierra. **Y fue justamente eso lo que destapó el bug del filtro de Área** (§4.2): el
bug existía en React desde el principio y su spec no podía verlo, precisamente por esa limitación.

**Dos bugs reales del port los encontró el spec, no la revisión visual** — los dos habrían hecho fallar
la pantalla en el navegador en la primera carga, con NG0201:
1. `HolidaysService` provisto pelado. Hace `inject(CollectionService)`, que el injector de la pantalla
   no tiene. Va con su propio `Injector.create` hijo (mismo patrón fijado en SCR-0051), y además con su
   **propia** instancia de `CollectionService`, porque una instancia retiene **una** colección:
   compartirla haría que la carga de feriados pisara la del catálogo.
2. El `[ngModel]` de §13.2.

---

## 14. A reportar al negocio

Ordenado por prioridad. **Nada de esto se cambió en el port.**

1. **🔴 El filtro de Área no funciona** (§4.2). Compara un código de colección contra
   `qd_strResponsableRole`, que es un rol. Elegir cualquier área vacía la tabla. Existe en React desde
   el principio. **Decisión requerida:** ¿el filtro debe gobernar por área (y entonces el mapeo debe
   leer `qd_strAssigneeArea`) o por rol (y entonces el select debe ofrecer roles)? Hay un `it()` que
   asevera el comportamiento actual y se pondrá rojo señalando la línea el día que se decida.
2. **🟠 `SAMPLE_CASES` se muestra sin avisar cuando la lista viene vacía** (§8). Un tenant sin casos ve
   8 casos de ejemplo y ningún cartel. **Decisión requerida:** ¿empty state real, o mantener el
   fallback y agregar el cartel siempre?
3. **🟡 La ficha 1.0 no coincidía con su código en cuatro puntos** — umbral 3 vs 2; `created_at` +
   días corridos vs `qd_strFilingDate` + días hábiles; `qd_fechaVencimiento` (ya inexistente);
   `responsable` desde `qd_strAssignee` vs `data._user.fullname`. Corregidos en esta 2.0.
4. **🟡 `P01-T09` no es esta pantalla.** En `Matrices > 1. Tareas` corresponde a "Enviar encuesta de
   satisfacción al cliente", y PAN-13 no figura en `Matrices > 4. Pantallas`.
5. **🟡 Limitaciones del DS que afectan al diseño** (§13.1, §13.3), varias ya reportadas en SCR-0051 y
   ahora con una segunda pantalla afectada:
   - `TableZ.columnTemplates` está muerto: solo hay **dos** huecos templateables, así que una tabla de
     diez columnas con más de dos celdas no-texto no se puede armar. Acá alcanzó justo.
   - `isTag` colorea contra un vocabulario fijo en inglés: inservible para estados en español.
   - `zds-select` no tiene `withSearch`.
   - `ButtonZ` no tiene `size` (va encadenado en `type`) y su `disabled` default es `true`.
   - **Nuevo:** `[ngModel]` de un `ZaModelElement` es inusable en cualquier plantilla que importe
     `ReactiveFormsModule` (§13.2). Afecta a toda pantalla futura que combine `za-pagination` —o
     cualquier otro control del DS con `ngModel`— con Reactive Forms.
6. **🟢 Diferencias visuales del port** (§13.1, §13.3): Estado pasa a ser la primera columna, `# Caso`
   pierde la negrita, y los dos selects de colección pierden la búsqueda interna.
