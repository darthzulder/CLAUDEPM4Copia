# Documentación Funcional — Respuesta del Área Responsable

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-0052** / PAN-05.2 — Respuesta del Área Responsable |
| Tipo | Vista del caso asignado — registro de comentario y adjunto |
| Tarea BPMN | **SP2-T02** — Analizar queja (registro de comentario) |
| Proceso | SP2 — Gestionar Respuesta Interna y Revisión SAC |
| Rol responsable | Área Responsable (VER+EDITAR) · Analista SAC (VER) · Líder SAC (VER) · Control SLA (INFORMADO) |
| Evento de apertura | Caso asignado a la bandeja del área |
| Acción de cierre | Enviar comentario → continúa SP2-T02 |
| Slug / `?screen=` | `COL_QD_SCR-0052_Respuesta_Area_Responsable` |
| Archivos de implementación | `RespuestaAreaResponsable.tsx`, `variables.ts` |
| Versión | 1.0 — 2026-06-30 |

> **Nota de nomenclatura:** el SLUG solicitado (`COL_QD_Respuesta_Area_Responsable`) se normalizó a
> `COL_QD_SCR-0052_Respuesta_Area_Responsable` (con código SCR) por consistencia con las pantallas
> QD hermanas. Ver §10.

---

## 2. Resumen

Pantalla que ve el Área Responsable cuando un caso llega asignado a su bandeja. Muestra el
expediente en solo lectura (datos del consumidor, clasificación regulatoria M1, descripción de la
queja y datos de la asignación) y permite registrar un **comentario obligatorio** con un **adjunto
de soporte opcional**, que quedan en el historial del caso. El cierre es "Enviar comentario"
(continúa SP2-T02); también permite guardar borrador o volver a la bandeja.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-0052.md` | Campos (FLD-066..077, 351..355), acciones (ACT-0052-*), regla RUL-0052-01, mensajes MSG-0052-*, permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-057..061 (orden, visibilidad) |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-0052-01/02 |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP2-T02 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP2-T02 es tarea de Usuario → sin variables canónicas |

> Sin catálogos (07_Catalogs): la pantalla no tiene listas desplegables.

---

## 4. Campos Implementados

### S1 — Datos del Consumidor (SEC-059, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Nombre del Consumidor | `qd_nombreConsumidor` | `ZdsInput` readOnly | FLD-066 |
| Tipo y N.° de Identificación | `qd_identificacion` | `ZdsInput` readOnly | FLD-067 |
| Correo Electrónico | `qd_correoElectronico` | `ZdsInput` readOnly | FLD-068 |
| Tipo de Persona | `qd_tipoPersona` | `ZdsInput` readOnly | FLD-069 |

### S2 — Clasificación Regulatoria (SEC-060, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Canal de Recepción | `qd_canal` | `ZdsInput` readOnly | FLD-070 |
| Producto SFC | `qd_productoSFC` | `ZdsInput` readOnly | FLD-071 |
| Motivo SFC | `qd_motivoSFC` | `ZdsInput` readOnly | FLD-072 |
| Instancia / Punto de Recepción | `qd_instanciaPunto` | `ZdsInput` readOnly | FLD-073 |
| Admisión | `qd_admision` | `ZdsInput` readOnly | FLD-074 |
| Ente de Control | `qd_enteControl` | `ZdsInput` readOnly | FLD-075 |

### S3 — Descripción de la Queja (SEC-061, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Asunto de la Queja | `qd_resumen` | `ZdsInput` readOnly | FLD-076 |
| Descripción / Texto de la Queja | `qd_textoQueja` | `ZdsTextarea` readOnly | FLD-077 |

### S4 — Datos de la Asignación (SEC-057, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Área | `qd_areaAsignada` | `ZdsInput` readOnly | FLD-351 |
| Responsable | `qd_responsableAsignado` | `ZdsInput` readOnly | FLD-352 |
| Observaciones | `qd_observacionesAsignacion` | `ZdsTextarea` readOnly | FLD-353 |

### S5 — Comentario y Adjunto (SEC-058, editable)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Comentario | `qd_comentarioArea` | `ZdsTextarea` | **Sí** | FLD-354 |
| Adjuntar archivo | `qd_adjuntoArea` | `ZdsFileInput` (máx 10 MB) | No | FLD-355 |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_accion` (`ENVIAR` \| `GUARDAR_BORRADOR`) | Inferido de ACT-0052-01/02 (§10) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Comentario obligatorio | `rules.required` en `qd_comentarioArea`; "Enviar comentario" deshabilitado si vacío | RUL-0052-01 · MSG-0052-01 · FLD-354 |
| Tipo/tamaño de adjunto | `ZdsFileInput` valida extensión (PDF/DOC/DOCX/XLS/XLSX/JPG/PNG) y ≤ 10 MB | FLD-355 |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-0052-01 Comentario obligatorio | `qd_comentarioArea` vacío | `ZrAlert config="info"` en S5 + botón "Enviar" deshabilitado | 06_Mensajes > MSG-0052-01 |
| MSG-0052-02 Comentario enviado | Tras enviar | **No en UI** — lo emite el BPM tras `completeTask` | 06_Mensajes > MSG-0052-02 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-0052-01 (🔴 BLOQUEA) — comentario vacío bloquea envío | `puedeEnviar = !!comentario.trim()`; botón disabled + alerta MSG-0052-01 | SCR-0052 > RUL-0052-01 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Expediente solo lectura (S1-S4) | `ZdsInput`/`ZdsTextarea` con `readOnly` | SEC-057..061 |
| Adjunto de soporte único | `ZdsFileInput` + `fileRegistry` (upload en `onSubmit`) | FLD-355 · CLAUDE.md (patrón de subida) |
| Guardar borrador | `completeTask` con `qd_accion='GUARDAR_BORRADOR'` (sin validación bloqueante) | ACT-0052-02 |
| Volver | `ZrButton config="link"` → `window.history.back()` | ACT-0052-03 |
| Estados loading/error/submitting | `ZrLoader`, `ZrAlert`, botones `loading/disabled` | CLAUDE.md |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_comentarioArea` | Botón "Enviar comentario" | Habilita el envío solo si el comentario no está vacío | RUL-0052-01 |

---

## 10. Suposiciones Realizadas

- **Slug normalizado** (ver §1).
- **Nombres `data_name` (`qd_*`)** provisionales — Anexo03 no tiene variables para SP2-T02 (tarea
  de Usuario, no automatizada). Se actualizarán con el diccionario final.
- **`qd_accion`** (metadato): no es un FLD; se deriva del botón presionado (ACT-0052-01/02) para
  informar la decisión al BPM.
- **`maxLength=2000`** en el comentario: límite estándar del proyecto, no especificado en el insumo.
- **Adjunto único con `data_name=qd_adjuntoArea`**: se sube vía `POST /requests/{id}/files` al
  enviar (patrón estándar del proyecto). El insumo (FLD-355) permite PDF/DOCX/XLSX/JPG/PNG, máx 10 MB.
- **MSG-0052-02** (éxito) lo emite el BPM tras `completeTask`; no se renderiza en la pantalla.
- **"Guardar Borrador"** completa la tarea con la acción de borrador; si el flujo BPMN real
  requiere un endpoint distinto (no completar la tarea), deberá ajustarse cuando se defina.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-066..077, 351..355) | 17/17 (100%) | Todos implementados |
| Secciones (SEC-057..061) | 5/5 (100%) | S1-S5 |
| Acciones (ACT-0052-01/02/03) | 3/3 (100%) | Enviar, Guardar Borrador, Volver |
| Reglas (RUL-0052-01) | 1/1 (100%) | Comentario obligatorio |
| Mensajes (MSG-0052-01/02) | 1/2 en UI | MSG-0052-02 lo emite el BPM |
| Catálogos | N/A | La pantalla no usa catálogos |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_accion`, `maxLength=2000`, comportamiento de
"Guardar Borrador" como `completeTask`.
