# Documentación Funcional — Revisión Respuesta SAC

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-008** / PAN-08 — Revisión Respuesta SAC |
| Tipo | Pantalla de revisión y aprobación |
| Tarea BPMN | **SP2-T04** — Revisar respuesta borrador (SAC) |
| Proceso | SP2 — Gestionar Respuesta Interna y Revisión SAC |
| Rol responsable | Analista SAC (VER+APROBAR) · Área Responsable (VER) · Líder SAC (VER) · Control SLA (INFORMADO) |
| Evento de apertura | El área envía el borrador para revisión |
| Acción de cierre | Aprobar → SP2-T06 (PDF) · Devolver → SP2-T05 (PAN-07) |
| Slug / `?screen=` | `COL_QD_SCR-008_Revision_Respuesta_SAC` |
| Archivos de implementación | `RevisionRespuestaSac.tsx`, `variables.ts` |
| Versión | 1.0 — 2026-06-30 |

> **Nota de nomenclatura:** el SLUG solicitado (`COL_QD_Revisión_Respuesta_SAC`, con tilde) se
> normalizó a `COL_QD_SCR-008_Revision_Respuesta_SAC` (ASCII, con código SCR) por la convención de
> las pantallas QD hermanas y porque `?screen=` no admite acentos. Ver §10.

---

## 2. Resumen

Pantalla del Analista SAC para revisar el borrador de respuesta elaborado por el Área Responsable.
Muestra el contexto del caso y la respuesta del área en solo lectura (incluida la lista de soportes
internos) y permite **Aprobar** la respuesta (→ SP2-T06, genera el PDF) o **Devolver con
observaciones** (→ SP2-T05 / PAN-07, "Ajuste en progreso"), además de reasignar el caso o ver la
vista previa de la carta final. Las observaciones son obligatorias solo para devolver.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-008.md` | Campos (FLD-120..131), acciones (ACT-008-*), reglas (RUL-008-*), mensajes (MSG-008-*), permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-025/026/027 |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-008-01..04 |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP2-T04 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP2-T04 es tarea de Usuario → sin variables canónicas |

> Sin catálogos (07_Catalogs): la pantalla no tiene listas desplegables.

---

## 4. Campos Implementados

### S1 — Contexto del Caso (SEC-025, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| ID Caso / Código SFC | `qd_idCasoSFC` | `ZdsInput` readOnly | FLD-120 |
| SLA: Días hábiles restantes | `qd_slaRestante` | `ZdsInput` readOnly | FLD-121 |
| Versión bajo revisión | `qd_versionRevision` | `ZdsInput` readOnly | FLD-122 |
| Área Responsable | `qd_areaResponsable` | `ZdsInput` readOnly | FLD-123 |
| Fecha de elaboración del borrador | `qd_fechaElaboracion` | `ZdsInput` readOnly | FLD-124 |

### S2 — Respuesta del Área (SEC-026, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Respuesta al Cliente | `qd_respuestaCliente` | `ZdsTextarea` readOnly | FLD-127 |
| Acciones Tomadas | `qd_accionesTomadas` | `ZdsTextarea` readOnly | FLD-128 |
| ¿Reconocimiento al cliente? | `qd_reconocimiento` | `ZdsInput` readOnly | FLD-129 |
| Soportes internos adjuntos | `qd_adjuntosSoporte` | Lista de `.file-name-chip` (solo visualización) | FLD-130 |

### S3 — Decisión del Analista SAC (SEC-027)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Observaciones SAC | `qd_observacionesSAC` | `ZdsTextarea` | Condicional (al devolver) | FLD-131 |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_accion` (`APROBAR` \| `DEVOLVER` \| `REASIGNAR`) | Inferido de ACT-008-01/02/03 (§10) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Observaciones obligatorias al devolver | `puedeDevolver = !!observaciones.trim()` deshabilita "Devolver"; validación manual con `setError` en el handler | RUL-008-01 · MSG-008-01 · FLD-131 |
| Aprobar sin observaciones | "Aprobar Respuesta" no exige observaciones | ACT-008-01 (Cond. "Siempre") |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-008-01 Observaciones vacías | Devolver con observaciones vacías | `ZrAlert config="info"` en S3 + botón "Devolver" disabled | 06_Mensajes > MSG-008-01 |
| MSG-008-02 SLA crítico | `slaRestante <= 3` | `ZrAlert config="negative"` superior | 06_Mensajes > MSG-008-02 |
| MSG-008-03 Respuesta aprobada | Tras aprobar | **No en UI** — lo emite el BPM tras `completeTask` | 06_Mensajes > MSG-008-03 |
| MSG-008-04 Respuesta devuelta | Tras devolver | **No en UI** — lo emite el BPM | 06_Mensajes > MSG-008-04 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-008-01 (🔴 BLOQUEA) — no devolver sin observaciones | botón "Devolver" disabled + `setError` + alerta MSG-008-01 | SCR-008 > RUL-008-01 |
| RUL-008-02 (info) — banner SLA si `slaRestante <= 3` | `slaCritico` controla el banner rojo | SCR-008 > RUL-008-02 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Contexto y respuesta solo lectura | `ZdsInput`/`ZdsTextarea` con `readOnly` | SEC-025/026 |
| Lista de soportes (solo visualización) | `z-flex="col:50"` de `.file-name-chip`; nota si vacío | FLD-130 |
| Devolver como acción destructiva | `ZrButton config="negative"` | ACT-008-02 (tipo Destructiva) |
| Reasignar caso | `completeTask` con `qd_accion='REASIGNAR'` | ACT-008-03 |
| Vista Previa Respuesta Final | `ZrModal` con la respuesta al cliente | ACT-008-04 |
| Estados loading/error/submitting | `ZrLoader`, `ZrAlert`, botones `loading/disabled` | CLAUDE.md |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_observacionesSAC` | Botón "Devolver con Observaciones" | Habilita el devolver solo si hay observaciones | RUL-008-01 |
| `qd_slaRestante` | Banner SLA | Muestra banner rojo si ≤ 3 | RUL-008-02 |

---

## 10. Suposiciones Realizadas

- **Slug normalizado** (ver §1).
- **Nombres `data_name` (`qd_*`)** provisionales — Anexo03 no tiene variables para SP2-T04 (tarea
  de Usuario). Se actualizarán con el diccionario final.
- **`qd_accion`** (metadato): no es un FLD; se deriva del botón presionado (ACT-008-01/02/03) para
  informar la decisión al BPM.
- **`maxLength=2000`** en observaciones: límite estándar del proyecto, no especificado en el insumo.
- **FLD-130 soportes como `.file-name-chip`**: el insumo pide "lista de adjuntos, solo
  visualización". Se renderiza como lista de chips de nombre (clase existente en `shared.css`), sin
  descarga/preview (no especificado). Estructura esperada: arreglo de `{ nombre }`.
- **Reasignar (ACT-008-03)** abre PAN-06 en el mockup; aquí se implementó como `completeTask` con
  `qd_accion='REASIGNAR'` (el enrutamiento a PAN-06/SP2-T03 lo resuelve el BPM). Si debe abrir un
  modal in-situ, se ajustará.
- **Vista Previa (ACT-008-04)**: modal informativo con el texto de respuesta (placeholder hasta
  integrar el generador de PDF real).
- **MSG-008-03/04** los emite el BPM tras `completeTask`; no se renderizan en la pantalla.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-120..131) | 10/10 (100%) | Todos implementados |
| Secciones (SEC-025/026/027) | 3/3 (100%) | S1-S3 |
| Acciones (ACT-008-01..04) | 4/4 (100%) | Aprobar, Devolver, Reasignar, Vista Previa |
| Reglas (RUL-008-01/02) | 2/2 (100%) | Observaciones obligatorias + banner SLA |
| Mensajes (MSG-008-01..04) | 2/4 en UI | MSG-008-03/04 los emite el BPM |
| Catálogos | N/A | La pantalla no usa catálogos |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_accion`, `maxLength=2000`, render de soportes
como chips, "Reasignar"/"Vista Previa" resueltos por BPM/modal placeholder.
