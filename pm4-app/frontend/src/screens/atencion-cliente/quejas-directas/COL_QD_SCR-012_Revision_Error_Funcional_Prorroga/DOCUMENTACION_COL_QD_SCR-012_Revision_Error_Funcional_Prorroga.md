# Documentación Funcional — Corrección Error Funcional Prórroga

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-012** / PAN-12 — Corrección Error Funcional Prórroga |
| Tipo | Formulario de corrección (prórroga) |
| Tarea BPMN | **SP4-T06** — Corregir error funcional de cierre prórroga |
| Proceso | SP4 — Gestionar Prórroga Regulatoria |
| Rol responsable | Analista SAC (VER+EDITAR) · Área Responsable (VER+EDITAR) · Líder SAC (VER) |
| Evento de apertura | SmartSupervision rechaza prórroga HTTP 400 funcional |
| Acción de cierre | Reenviar Prórroga → SP4-T01 |
| Slug / `?screen=` | `COL_QD_SCR-012_Revision_Error_Funcional_Prorroga` |
| Archivos de implementación | `ErrorFuncionalProrroga.tsx`, `variables.ts` |
| Versión | 1.0 — 2026-06-30 |

> Es el análogo, para el flujo de **prórroga (SP4)**, de SCR-003 (corrección error funcional de radicación).

---

## 2. Resumen

Panel al que SP4 deriva el caso cuando SmartSupervision rechaza la solicitud de **prórroga** con un
error 400 funcional. Muestra el detalle del error en solo lectura (código SFC, campo afectado,
mensaje, intento) y permite corregir los campos de la prórroga (motivo, nueva fecha límite,
contador y justificación) para **reenviar** (vuelve a SP4-T01) o **cancelar** la prórroga.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-012.md` | Campos (FLD-200..207), acciones (ACT-012-*), regla RUL-012-01, mensajes MSG-012-*, permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-039/040 |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-012-01/02 |
| Anexo02 (índice .md) | `masters/07_Catalogs.md` | CAT-MOTIVO-PRORR (origen/estado) |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP4-T06 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP4-T06 es tarea de Usuario → sin variables canónicas |

---

## 4. Campos Implementados

### S1 — Panel de Error — Prórroga (SEC-039, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Código de Error SFC Prórroga | `qd_codigoErrorProrroga` | `ZdsInput` readOnly | FLD-200 |
| Campo Afectado | `qd_campoAfectadoProrroga` | `ZdsInput` readOnly | FLD-201 |
| Mensaje de Error SFC | `qd_mensajeErrorProrroga` | `ZdsTextarea` readOnly | FLD-202 |
| Intento N.° actual | `qd_intentoActualProrroga` | `ZdsInput` readOnly | FLD-203 |

### S2 — Campos de Prórroga a Corregir (SEC-040, editable)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Motivo de Prórroga | `qd_motivoProrroga` | `ZdsSelect` (CAT-MOTIVO-PRORR) | **Sí** | FLD-204 |
| Nueva Fecha Límite | `qd_nuevaFechaLimite` | `ZdsDate` (`min=hoy`) | **Sí** | FLD-205 |
| Contador de Prórroga | `qd_contadorProrroga` | `ZdsInput` (dígitos) | **Sí** | FLD-206 |
| Justificación | `qd_justificacionProrroga` | `ZdsTextarea` | **Sí** | FLD-207 |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_accion` (`REENVIAR` \| `CANCELAR`) | Inferido de ACT-012-01/02 (§10) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Nueva fecha límite posterior a hoy | `ZdsDate min=hoy` + `rules.validate (v > hoy)`; alerta MSG-012-01 | RUL-012-01 · FLD-205 |
| Motivo obligatorio | `rules.required` en `ZdsSelect` | FLD-204 |
| Contador obligatorio y numérico | `rules.required` + `pattern /^\d+$/` | FLD-206 |
| Justificación obligatoria | `rules.required` + `maxLength 2000` | FLD-207 |
| Reenviar solo con todo completo | `puedeReenviar` deshabilita el botón | ACT-012-01 |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-012-01 Fecha inválida | `nuevaFechaLimite <= hoy` | `ZrAlert config="negative"` en S2 + validación de campo | 06_Mensajes > MSG-012-01 |
| MSG-012-02 Prórroga reenviada | Tras reenviar | **No en UI** — lo emite el BPM tras `completeTask` | 06_Mensajes > MSG-012-02 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-012-01 (🔴 BLOQUEA) — fecha límite debe ser posterior a hoy | `fechaValida` + `ZdsDate min` + `validate` + alerta MSG-012-01 | SCR-012 > RUL-012-01 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Panel de error con acento rojo | `FormSection color="var(--z-red)"` | Tipo "corrección" |
| Banner de error 400 de prórroga | `ZrAlert config="negative"` con número de intento | Contexto SCR-012 |
| Cancelar prórroga (destructiva) | `ZrButton config="negative"` → `completeTask` con `qd_accion='CANCELAR'` | ACT-012-02 |
| Estados loading/error/submitting | `ZrLoader`, `ZrAlert`, botones `loading/disabled` | CLAUDE.md |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_nuevaFechaLimite` | Botón "Reenviar Prórroga" + alerta | Bloquea reenvío si la fecha no es posterior a hoy | RUL-012-01 |
| motivo + fecha + contador + justificación | Botón "Reenviar Prórroga" | Habilita reenviar solo si todos están completos y la fecha es válida | ACT-012-01 |

---

## 10. Suposiciones Realizadas

- **Slug** `COL_QD_SCR-012_Revision_Error_Funcional_Prorroga` — coincide con el solicitado (ASCII),
  con código SCR consistente con las hermanas.
- **CAT-MOTIVO-PRORR como OPTIONS estáticas placeholder.** El catálogo está "Pendiente TI" en
  07_Catalogs y sin valores de ejemplo; se propusieron motivos genéricos. A reemplazar por el
  catálogo SFC oficial / `useCollection` cuando se entregue.
- **Nombres `data_name` (`qd_*`)** provisionales — Anexo03 no tiene variables para SP4-T06 (tarea
  de Usuario). Se actualizarán con el diccionario final.
- **"Fecha de hoy"** se calcula en el navegador (`new Date().toISOString()`), coherente con el uso
  cliente de la validación RUL-012-01.
- **Contador de Prórroga** como `ZdsInput` de texto con `pattern` de dígitos (la fachada no expone
  `inputType="number"`). El insumo también pide "validar contra catálogo SFC" — pendiente de catálogo.
- **`qd_accion`** (metadato): no es un FLD; se deriva del botón presionado (ACT-012-01/02).
- **MSG-012-02** (éxito) lo emite el BPM tras `completeTask`; no se renderiza en la pantalla.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-200..207) | 8/8 (100%) | Todos implementados |
| Secciones (SEC-039/040) | 2/2 (100%) | S1-S2 |
| Acciones (ACT-012-01/02) | 2/2 (100%) | Reenviar Prórroga, Cancelar Prórroga |
| Reglas (RUL-012-01) | 1/1 (100%) | Fecha posterior a hoy |
| Mensajes (MSG-012-01/02) | 1/2 en UI | MSG-012-02 lo emite el BPM |
| Catálogos (CAT-MOTIVO-PRORR) | 1/1 como placeholder | Pendiente TI |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_accion`, catálogo de motivo placeholder,
contador como texto con `pattern`, `maxLength=2000`, cálculo de "hoy" en cliente.
