# Documentación Funcional — Revisión Error Técnico Prórroga

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-011** / PAN-11 — Revisión Error Técnico Prórroga |
| Tipo | Pantalla de análisis técnico (prórroga) |
| Tarea BPMN | **SP4-T05** — Corregir error técnico de API en prórroga |
| Proceso | SP4 — Gestionar Prórroga Regulatoria |
| Rol responsable | Analista Técnico (VER+EDITAR) · Analista SAC (INFORMADO) · Control SLA (INFORMADO) |
| Evento de apertura | SP4-T01 falla técnicamente → escala |
| Acción de cierre | Autorizar Reenvío Prórroga → SP4-T01 |
| Slug / `?screen=` | `COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga` |
| Archivos de implementación | `RevisionErrorTecnicoProrroga.tsx` (config centralizada en fields/fields.ts) |
| Versión | 1.1 — 2026-08-03 |

> Es el análogo, para el flujo de **prórroga (SP4)**, de SCR-004 (error técnico de radicación).
> Desde la v1.1 **comparte exactamente las mismas variables que SCR-004**: los scripts de
> Momento 2/3 escriben siempre `qd_strHttpCode`, `qd_strErrorType`, `qd_strApiTechMessage`,
> `qd_strCompleteLogAPI`, `qd_strEndpointCalled`, `qd_strPayloadSent`, `qd_strAttemptNum`
> ante un fallo de la API — la prórroga viaja como `prorroga_queja` dentro del body de cierre,
> no en una llamada aparte — por lo que las variantes `qd_strExt*` (FLD-190..196) nunca se
> poblaban y se retiraron. Solo cambian los textos y las acciones de la pantalla.

---

## 2. Resumen

Pantalla a la que SP4 escala el caso cuando el envío del payload de **prórroga** a
SmartSupervision falla por un error técnico. El Analista Técnico revisa el log del error (código
HTTP, tipo, mensaje técnico, payload, número de intento — todo solo lectura), documenta la **causa
raíz** y la **corrección aplicada** (obligatorias) y **autoriza el reenvío** (vuelve a SP4-T01) o
**escala el incidente al proveedor**.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-011.md` | Campos (FLD-190..196), acciones (ACT-011-*), regla RUL-011-01, mensajes MSG-011-*, permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-037/038 |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-011-01/02 |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP4-T05 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP4-T05 es tarea de Usuario → sin variables canónicas |

> Sin catálogos (07_Catalogs): la pantalla no tiene listas desplegables.

---

## 4. Campos Implementados

### S1 — Detalle del Error Técnico — Prórroga (SEC-037, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Código HTTP prórroga | `qd_strHttpCode` | `ZdsInput` readOnly | FLD-190 ≡ FLD-050 |
| Tipo de Error | `qd_strErrorType` | `ZdsInput` readOnly | FLD-191 ≡ FLD-051 |
| Número de intento prórroga | `qd_strAttemptNum` | `ZdsInput` readOnly | FLD-194 ≡ FLD-055 |
| Endpoint Invocado | `qd_strEndpointCalled` | `ZdsInput` readOnly | FLD-053 (paridad SCR-004) |
| Mensaje técnico de la API | `qd_strApiTechMessage` | `ZdsTextarea` readOnly | FLD-192 ≡ FLD-052 |
| Payload de prórroga enviado (JSON) | `qd_strPayloadSent` | `ZdsTextarea` (editable si requiere ajuste) | FLD-193 ≡ FLD-054 |
| Log Completo (modal) | `qd_strCompleteLogAPI` | `ZdsTextarea` readOnly | sin FLD · script M2/M3 |

### S2 — Registro de Corrección — Prórroga (SEC-038, editable)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Causa Raíz | `qd_strRootCause` | `ZdsTextarea` | **Sí** | FLD-195 ≡ FLD-056 |
| Corrección Aplicada | `qd_strCorrectionApplied` | `ZdsTextarea` | **Sí** | FLD-196 ≡ FLD-057 |
| ¿Requiere ajuste en payload? | `qd_strPayloadAdjustNeeded` | `ZdsRadio` SÍ/NO | **Sí** | FLD-058 (paridad SCR-004) |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_strAction` (`AUTORIZAR_REENVIO` \| `ESCALAR_PROVEEDOR`) | Inferido de ACT-011-01/02 (§10) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Causa raíz obligatoria | `rules.required` + `maxLength 2000` | FLD-195 · RUL-011-01 |
| Corrección aplicada obligatoria | `rules.required` + `maxLength 2000` | FLD-196 · RUL-011-01 |
| Autorizar solo con ambos campos | `blnCanAuthorize` deshabilita el botón + alerta MSG-011-01 | RUL-011-01 |
| Payload JSON válido si requiere ajuste | Con `qd_strPayloadAdjustNeeded='SI'`, `qd_strPayloadSent` debe parsear como objeto JSON; si no, se bloquea autorizar | Paridad SCR-004 · script M2/M3 descarta payload inválido |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-011-01 Campos vacíos | causa o corrección vacías | `ZrAlert config="info"` + "Autorizar" disabled | 06_Mensajes > MSG-011-01 |
| MSG-011-02 Reenvío prórroga autorizado | Tras autorizar | **No en UI** — lo emite el BPM tras `completeTask` | 06_Mensajes > MSG-011-02 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-011-01 (🔴 BLOQUEA) — no autorizar sin causa y corrección | `blnCanAuthorize` deshabilita el botón + alerta MSG-011-01 | SCR-011 > RUL-011-01 |
| Payload editado debe ser objeto JSON | `blnPayloadJsonOk` se suma a `blnCanAuthorize` + alerta negativa | Paridad SCR-004 (script M2/M3) |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Panel de error con acento rojo | `FormSection color="var(--z-red)"` (igual que SCR-004) | Tipo "análisis técnico" |
| Banner de error técnico de prórroga | `ZrAlert config="negative"` con número de intento | Contexto SCR-011 |
| Escalar a proveedor | `completeTask` con `qd_strAction='ESCALAR_PROVEEDOR'` | ACT-011-02 |
| Estados loading/error/submitting | `ZrLoader`, `ZrAlert`, botones `loading/disabled` | CLAUDE.md |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strRootCause` + `qd_strCorrectionApplied` | Botón "Autorizar Reenvío Prórroga" | Habilita autorizar solo si ambos están completos | RUL-011-01 |
| `qd_strPayloadAdjustNeeded` | `qd_strPayloadSent` | `SI` ⇒ el payload pasa a editable + alerta de ajuste; `NO` ⇒ solo lectura | Paridad SCR-004 |
| `qd_strPayloadSent` | Botón "Autorizar Reenvío Prórroga" | Con ajuste marcado, JSON inválido bloquea autorizar | Paridad SCR-004 |

---

## 10. Suposiciones Realizadas

- **Slug** `COL_QD_SCR-011_Revision_Error_Tecnico_Prorroga` — coincide con el solicitado (ASCII),
  con código SCR consistente con las hermanas.
- **Nombres `data_name` (`qd_*`)** — ya no son propios de SCR-011: se reusan los de SCR-004
  porque son las variables que realmente escribe el script de Momento 2/3 ante un fallo de la
  API (incluido el fallo al enviar la prórroga). Anexo03 no define variables para SP4-T05
  (tarea de Usuario), por lo que FLD-190..196 quedan mapeados a los FLD-050..058 de SCR-004.
- **`qd_strAction`** (metadato): no es un FLD; se deriva del botón presionado (ACT-011-01/02).
- **`maxLength=2000`** en causa/corrección: límite estándar del proyecto, no especificado en el insumo.
- **MSG-011-02** (éxito) lo emite el BPM tras `completeTask`; no se renderiza en la pantalla.
- **"Ver Log Completo"** no figura en el insumo de SCR-011, pero se agregó por paridad con
  SCR-004: el log lo emite el mismo script en `qd_strCompleteLogAPI` y sin el modal el analista
  técnico perdería el detalle (paso fallido, cURL, cuerpo crudo). Igual criterio para
  "Endpoint Invocado" y "¿Requiere ajuste en payload?".

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-190..196) | 7/7 (100%) | Implementados con las variables de SCR-004 (+3 campos de paridad: endpoint, log completo, ajuste de payload) |
| Secciones (SEC-037/038) | 2/2 (100%) | S1-S2 |
| Acciones (ACT-011-01/02) | 2/2 (100%) | Autorizar Reenvío, Escalar a Proveedor |
| Reglas (RUL-011-01) | 1/1 (100%) | Causa + corrección obligatorias |
| Mensajes (MSG-011-01/02) | 1/2 en UI | MSG-011-02 lo emite el BPM |
| Catálogos | N/A | La pantalla no usa catálogos |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_strAction`, `maxLength=2000`, reuso de las
variables de SCR-004 y los 3 campos de paridad (endpoint, log completo, ajuste de payload).
