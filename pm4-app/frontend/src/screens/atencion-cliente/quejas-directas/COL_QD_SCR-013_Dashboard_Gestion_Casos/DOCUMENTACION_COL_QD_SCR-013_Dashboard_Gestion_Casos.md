# Documentación — Dashboard — Gestión de Casos (SCR-013 / PAN-13)

## 1. Encabezado

| Campo | Valor |
|---|---|
| Pantalla | **SCR-013 · PAN-13 — Dashboard — Gestión de Casos** |
| Tarea BPMN (según prompt) | `P01-T09` |
| Proceso | P01 — Gestión de Quejas Directas |
| Subproceso | — (vista transversal de supervisión) |
| Rol | Supervisor / Jefe SAC |
| Versión mockup | Anexo02 v3.0 (HTML) |
| Slug / carpeta | `COL_QD_SCR-013_Dashboard_Gestion_Casos` |
| Archivos de implementación | `DashboardGestionCasos.tsx`, `TablaCasos.tsx`, `DetalleCasoModal.tsx`, `useCasosDashboard.ts`, `dashboardHelpers.ts` (config centralizada en `fields/fields.ts` + `fields/types.ts`), estilos en `shared.css` (bloque *dashboard-gestion-casos*), + ruta backend `GET /api/requests` en `backend/src/routes/pm4.routes.ts` |

> ⚠️ **Nota crítica de trazabilidad.** Esta pantalla **no tiene especificación formal en los insumos Excel**:
> - `Anexo02_Mockups_TOBE_QuejaDirectas_v3_1.xlsx` **no tiene hoja `SCR-013`** (las hojas dedicadas terminan en `SCR-012`) y `01_Pantallas` **no lista PAN-13** (llega hasta SCR-012).
> - En `Matrices > 4. Pantallas` el inventario de pantallas **termina en PAN-12**; no existe fila para PAN-13.
> - El código `P01-T09` en `Matrices > 1. Tareas` corresponde a **"Enviar encuesta de satisfacción al cliente"** (tarea automática de tipo *Envío*), **no** a un dashboard de supervisión.
>
> Por tanto, **la única fuente de esta pantalla es el mockup HTML** `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.html` (bloque `SCR-013`, líneas ~1396–1619). Todos los campos, columnas, filtros, KPIs y textos se derivan de ese mockup. Cualquier detalle no visible en el HTML se declara como suposición en §10.

---

## 2. Resumen

Vista consolidada de **solo lectura** para el Supervisor / Jefe SAC. Muestra todos los casos
(quejas y solicitudes) del proceso con:
- **KPIs de SLA** (casos abiertos, próximos a vencer, vencidos, cerrados),
- una **barra de filtros** (tipo, estado, área, búsqueda de texto),
- una **tabla paginada** de casos con semáforo de días y estado, y
- un **modal de detalle** por caso con acceso al expediente completo.

No completa ninguna tarea de PM4 (no hay `completeTask`): es un tablero de monitoreo.

**Origen de datos:** los casos se obtienen de la API PM4 `GET /api/1.0/requests?include=data`
(paginado hasta `last_page`), acotando al proceso QD (`process_id = 31`) vía PMQL, con
auto-recuperación en cliente si el PMQL falla (misma lógica que el script PHP de referencia).
Cada request se mapea a un `CasoDashboard`. Los filtros operan **cliente-side** sobre esa lista.

**Acción principal:** "Descargar reporte" exporta a **CSV** el resultado filtrado actual.
El modal de detalle es solo lectura con un único botón "Cerrar".

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja / Sección | Descripción de uso |
|---|---|---|
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.html` | Bloque `SCR-013` (líneas ~1396–1619) | **Fuente única de estructura**: alerta, top bar, KPIs, filtros, tabla, paginación y modal de detalle. |
| API PM4 `GET /api/1.0/requests?include=data` | — | **Fuente de datos** de los casos (proceso 31). Lógica de paginado + PMQL + auto-recuperación replicada del script PHP entregado por el usuario. |
| `screens/…/quejas-directas/fields/fields.ts` | Registro `QD` | Nombres canónicos de campos `qd_*` que viven en `request.data` (mapeo de columnas). |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_1.xlsx` | `01_Pantallas`, hojas `SCR-*` | Verificación de ausencia: **no hay SCR-013**. Confirma que la pantalla es mockup-only. |
| `Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx` | `1. Tareas`, `4. Pantallas` | Verificación de ausencia de PAN-13 y del significado real de `P01-T09` (encuesta de satisfacción). |
| `core/collections.ts` | `GLOBAL_COLLECTIONS` | Referencia de colecciones existentes (`qd_tipoSolicitud` id 18, `qd_estadoQueja` id 42, `qd_area` id 35) como posible origen futuro de los filtros. |

---

## 4. Campos / Columnas Implementados

### 4.1 KPIs (tarjetas de SLA)

| KPI (UI) | Variable / cálculo | Tipo | Fuente |
|---|---|---|---|
| Casos abiertos | `calcularKpis().abiertos` = casos con `estado='Abierta'` | derivado | HTML SCR-013 (`.kpi-card`, "Casos abiertos") |
| Próximos a vencer | `porVencer` = abiertos con `0 ≤ diasRestantes ≤ 3` | derivado | HTML SCR-013 (`.kpi-card.kpi-warn`) |
| Vencidos | `vencidos` = `estado='Vencida'` o abierto con `diasRestantes<0` | derivado | HTML SCR-013 (`.kpi-card.kpi-danger`) |
| Cerrados | `cerrados` = `estado='Cerrada'` | derivado | HTML SCR-013 (`.kpi-card.kpi-ok`) |

### 4.2 Filtros

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Tipo de solicitud | `filtroTipo` | select **colección** `qd_tipoSolicitud` (id 18) | No | HTML SCR-013 + `collections.ts` |
| Estado | `filtroEstado` | select estático (`OPTIONS.estado`) — estado operativo | No | HTML SCR-013 (`select` Estado) |
| Área responsable | `filtroArea` | select **colección** `qd_area` (id 35) | No | HTML SCR-013 + `collections.ts` |
| Buscar por caso o responsable | `filtroBuscar` | texto (`ZdsInput`, icono `search`) | No | HTML SCR-013 (`input placeholder="Buscar por caso…"`) |

> Tipo y Área se conectan a colecciones PM4: el `value` del filtro es el **código** de la colección y coincide con el código almacenado en `request.data.qd_strRequestType` / `qd_strAssigneeArea` (`QD.strRequestType` / `QD.strAssigneeArea`). La tabla y el modal resuelven código → descripción con el mapa de la colección. **Estado** es un valor operativo derivado de `request.status` + SLA (no un catálogo), por eso queda estático.

### 4.3 Tabla de casos (`CasoDashboard`)

> `CasoDashboard` es un modelo de presentación derivado (mezcla el id de sistema del request y
> valores computados en el cliente), no un conjunto de variables PM4 — por eso sus miembros NO
> llevan el prefijo `qd_` (ver `fields/types.ts`).

| Columna (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| # Caso | `numeroCaso` | string | HTML SCR-013 (`th # Caso`) |
| Tipo | `tipoSolicitud` | string | HTML SCR-013 (`th Tipo`) |
| Creación | `fechaCreacion` | string | HTML SCR-013 (`th Creación`) |
| Vencimiento | `fechaVencimiento` | string | HTML SCR-013 (`th Vencimiento`) |
| Días restantes | `diasRestantes` → `diasRestantesTexto()` (solo texto) | number → texto | HTML SCR-013 (`th Días`) + solicitud del usuario |
| Estado | `estado` → `estadoVariante()` (`ZdsStatusBadge`) | enum | HTML SCR-013 (`th Estado`, `.pill-*`) |
| Área | `areaResponsable` | string | HTML SCR-013 (`th Área`) |
| Responsable | `responsable` | string | HTML SCR-013 (`th Responsable`) |
| Acción | botón "Ver" → modal | acción | HTML SCR-013 (`th Acción`, `btn-link` Ver) |

### 4.4 Modal de detalle (`DetalleCasoModal`)

| Campo (UI) | Variable | Fuente |
|---|---|---|
| Título "Caso #N — Tipo" | `numeroCaso` + `tipoSolicitud` | HTML modal (`#cm-title`) |
| Subtítulo "Área · Responsable: N" | `areaResponsable` + `responsable` | HTML modal (`#cm-sub`) |
| Estado | `estado` (badge DS) | HTML modal (`#cm-estado`) |
| Tipo de solicitud | `tipoSolicitud` | HTML modal (`#cm-tipo`) |
| Fecha de creación | `fechaCreacion` | HTML modal (`#cm-creacion`) |
| Fecha de vencimiento | `fechaVencimiento` | HTML modal (`#cm-vencimiento`) |
| Días restantes | `diasRestantes` → `diasRestantesTexto()` (solo texto) | HTML modal (`#cm-dias`) |
| Área responsable | `areaResponsable` | HTML modal (`#cm-area`) |
| Responsable asignado | `responsable` | HTML modal (`#cm-responsable`) |
| Descripción / Motivo | `descripcion` | HTML modal (`#cm-descripcion`) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| — | La pantalla es de solo lectura; **no hay validaciones de formulario** ni envío de datos a PM4. | HTML SCR-013 (sin campos editables persistentes) |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| Aviso informativo de la vista en tiempo real | Siempre visible | `ZrAlert config="info"` con el texto del mockup | HTML SCR-013 (`.alert.alert-info`) |
| "No se pudieron cargar los casos desde PM4… Mostrando datos de ejemplo." | `useTask()` retorna `error` | `ZrAlert config="alert"` | Suposición (§10) — manejo de error no especificado |
| "No hay casos que coincidan con los filtros seleccionados." | Tabla filtrada vacía | Texto en `TablaCasos` | Suposición (§10) — UX de lista vacía |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| Cálculo de días restantes | `calcularDiasRestantes()`: `(created_at + qd_strSlaAssigned días) − hoy`, redondeado hacia arriba. Fallback a `qd_fechaVencimiento − hoy`; si no, 0. | Solicitud del usuario |
| Texto de días restantes | `diasRestantesTexto()`: `N días` / `1 día`; `Vence hoy` (0); `N días de mora` (negativo); `—` para Cerrada/Cancelada. Solo texto, sin ícono. | Solicitud del usuario |
| Píldora de estado por estado del caso | `estadoVariante()`: Abierta→info, Cerrada→success, Vencida→danger, Cancelada→neutral | HTML SCR-013 (`.pill-open/.pill-closed/.pill-overdue/.pill-cancelled`) |
| "Próximos a vencer" = SLA ≤ 3 días hábiles | `SLA_UMBRAL_PROXIMO = 3` | Suposición (§10) — el mockup no fija el umbral numérico |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Filtros con botones "Aplicar filtros" / "Limpiar" | Draft en `useForm`; "Aplicar" copia draft → estado aplicado; "Limpiar" resetea ambos y vuelve a página 1 | HTML SCR-013 (botones Aplicar/Limpiar) |
| Filtrado cliente-side | `filtrados` (useMemo) sobre tipo/estado/área + búsqueda de texto (# caso, responsable, tipo) | HTML SCR-013 (barra de filtros) |
| Paginación cliente-side | `PAGE_SIZE = 8`; "Mostrando X–Y de Z"; Anterior / N / Siguiente | HTML SCR-013 (`Mostrando 8 de 40` + paginador) |
| Abrir detalle de caso | Botón "Ver" → `DetalleCasoModal` (`ZrModal`), solo lectura, único botón "Cerrar" | HTML SCR-013 (`openCaseModal`) + solicitud del usuario (sin "Abrir caso completo") |
| "Descargar reporte" | Exporta a CSV (`casosToCSV`) el resultado **filtrado** actual; deshabilitado si no hay filas; nombre `reporte-casos-quejas-directas.csv`, con BOM UTF-8 | Solicitud del usuario (reemplaza "Nuevo caso") |
| Carga de datos | `useCasosDashboard`: GET `/requests?include=data&per_page=100&page=N&type=all&pmql=process_id=31`, pagina hasta `last_page`, reintenta sin PMQL si falla, mapea con `mapRequestToCaso`; fallback a `SAMPLE_CASES` si la API no devuelve casos | Script PHP del usuario + patrón del proyecto |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `estado` + `diasRestantes` | Columna "Días" (badge) | El color/etiqueta del semáforo se deriva de ambos | `diasBadge()` — HTML SCR-013 |
| `estado` | Columna "Estado" (píldora) | La variante de `ZdsStatusBadge` se deriva del estado | `estadoVariante()` — HTML SCR-013 |
| Filtros aplicados | KPIs | **No dependen**: los KPIs se calculan sobre la lista completa (no la filtrada), como en el mockup (KPIs globales). | Decisión de diseño (§10) |

---

## 10. Suposiciones Realizadas

1. **Pantalla mockup-only.** PAN-13 no está en Anexo02.xlsx ni en Matrices; toda la estructura se tomó del HTML. `P01-T09` (encuesta de satisfacción) se conserva como identificador del prompt, aunque no corresponde funcionalmente a un dashboard.
2. **Nombres de variables `qd_*`.** Los 143 campos del proceso QD ya tienen nombre canónico en el registro `QD` (`fields/fields.ts`, nomenclatura Zurich RPA, coordinada con la migración de PM4 — ver `fields/MAPEO_qd_old_new.md`). La única excepción es `qd_fechaVencimiento`: no forma parte de esos 143 campos migrados y su `data_name` real sigue pendiente de confirmar con TI, por lo que se referencia literal.
3. **Origen y mapeo de datos.** Los casos salen de `GET /api/1.0/requests?include=data` filtrando `process_id = 31` (mismo default que el Web Entry de SCR-000, `VITE_QD_PROCESS_ID` para override). Cada `request` se mapea a `CasoDashboard` (`mapRequestToCaso`): `numeroCaso` ← `data.qd_strSfcCode || case_number || id`; `diasRestantes` ← `data.qd_strSlaAssigned` (interpretado como plazo en días desde la creación) o estimado desde `data.qd_fechaVencimiento`; `estado` derivado de `request.status` (COMPLETED→Cerrada, CANCELED→Cancelada, ACTIVE con mora→Vencida, resto→Abierta); `responsable` ← `data.qd_strAssignee || qd_strAssigneeRole`; `descripcion` ← `data.qd_strComplaintText`. Fallback a `SAMPLE_CASES` solo en dev cuando la API no devuelve casos.
4. **KPIs derivados de la lista completa.** El mockup muestra KPIs globales (12/3/5/20) distintos a las 8 filas visibles; se implementan como conteos derivados de la lista cargada para garantizar consistencia (los números del mockup son datos de ejemplo).
5. **Umbral "Próximos a vencer" = 3 días hábiles.** El mockup no fija el número; se alineó con el umbral crítico de SLA usado en SCR-008 (`SLA_UMBRAL_CRITICO = 3`).
6. **Filtros por colección (Tipo y Área).** Se conectan a `qd_tipoSolicitud` (id 18) y `qd_area` (id 35) vía `useCollection`; el `value` del filtro es el código y coincide con el código guardado en `request.data`. **Estado** queda estático porque es un valor operativo (derivado de `request.status` + SLA), no un catálogo. Si se quisiera un catálogo de estado (`qd_estadoQueja` id 42), habría que redefinir el significado de las píldoras/KPIs.
7. **Campo "Rango de fechas" → "Buscar".** El mockup rotula el 4.º filtro como "Rango de fechas" pero el control es un `input` de texto con `placeholder="Buscar por caso…"`. Se implementó como **búsqueda de texto** (# caso, responsable, tipo). Si se requiere un rango de fechas real, cambiar a dos `ZdsDate`.
8. **Exportación CSV.** "Descargar reporte" genera el CSV en el navegador (Blob + BOM UTF-8) con las columnas de la tabla resolviendo código→descripción. No hay endpoint de reporte server-side.
9. **Manejo de error / lista vacía.** Textos de UI redactados por el desarrollador (no especificados en insumos). Ante error de API se muestra alerta y se cae a datos de ejemplo (dev).

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura vs. mockup HTML | Notas |
|---|---|---|
| Estructura / layout | ~100% | Alerta, top bar, KPIs, filtros, tabla, paginación y modal replicados. |
| Campos / columnas | ~100% | Todas las columnas y campos del modal del HTML implementados. |
| Reglas de negocio | Parcial (inferidas) | Umbrales de SLA y semáforo inferidos; sin fuente numérica formal. |
| Validaciones | N/A | Pantalla de solo lectura. |
| Trazabilidad a Excel/Matrices | 0% | **No existe** especificación formal (SCR-013/PAN-13 ausentes). |

**Elementos inferidos** (sin respaldo formal en insumos): umbral de "próximos a vencer", origen de datos (`qd_casos`), destinos de navegación, opciones estáticas de filtros, textos de error/vacío, KPIs derivados. Ver §10.

---

## 12. Mapeo elemento → componente DS

| Elemento del mockup | Componente / clase usada | Tipo de decisión |
|---|---|---|
| Alerta informativa superior | `ZrAlert config="info"` | Componente DS (fachada) |
| Barra título + "Descargar reporte" | `.dashboard-toolbar` + `.section-title` + `ZrButton config="primary:s" icon="download:line"` | Layout dominio (space-between) + DS |
| Tarjetas KPI | `.kpi-grid` / `.kpi-card` / `.kpi-card--{warn,danger,ok}` | **Dominio tokenizado** (sin componente KPI en DS) |
| Filtros (selects) | `ZdsSelect` (Controller) + `useCollection` (Tipo id 18, Área id 35) | Wrapper DS + colecciones PM4 |
| Filtro búsqueda | `ZdsInput icon="search:line"` | Wrapper DS |
| Botones Aplicar/Limpiar | `ZrButton` + `z-flex`/`z-align` | DS + primitivos de layout |
| Sección "Filtros" | `FormSection` | Componente propio |
| Tabla de casos | `ZrTable` + `<table>` | Componente DS |
| Píldora de estado | `ZdsStatusBadge variant=…` | Wrapper DS |
| Días restantes | Texto plano (`diasRestantesTexto`) en la celda | Sin componente ni CSS (texto) |
| Botón "Ver" | `ZrButton config="secondary:s"` | DS |
| Paginación | `.dashboard-pagination` + `ZrButton` | Layout dominio + DS |
| Modal de detalle | `ZrModal` + `InfoBar` + `ZdsStatusBadge` | Componentes DS / propios |

**Quedó como dominio tokenizado y por qué:**
- **KPI cards** (`.kpi-*`): el DS 0.8.1 no expone un componente de KPI/estadística; se construyó con tokens (`--zg-white`, `--z-card-border`, `--z-card-shadow`, `--zf-h-28`, `--z-orange/red/green`).
- **Layout `.dashboard-toolbar` / `.dashboard-pagination`**: patrones `space-between` no expresables con `z-flex`/`z-align` (que no ofrecen "between"); clases nombradas por componente, con tokens de espaciado.
