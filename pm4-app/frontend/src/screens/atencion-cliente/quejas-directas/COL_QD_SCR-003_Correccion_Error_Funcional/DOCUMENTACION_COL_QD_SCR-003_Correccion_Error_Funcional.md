# Documentación Funcional — Corrección Error Funcional M1/M2

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-003** / PAN-03 — Corrección Error Funcional M1/M2 |
| Tipo | Panel de corrección de error funcional |
| Tarea BPMN | **SP1-T05** — Corregir datos según error funcional |
| Proceso / Subproceso | SP1 — Validar y Radicar ante SmartSupervision |
| Rol responsable | Gestor de Experiencia (RESPONSABLE) · Analista SAC (APOYO) |
| Evento de apertura | SmartSupervision devuelve HTTP 400 **funcional** |
| Acción de cierre | "Corregir y Reenviar" → SP1-T02 (reenvío M2) |
| Slug / `?screen=` | `COL_QD_SCR-003_Correccion_Error_Funcional` |
| Archivos de implementación | `CorreccionErrorFuncional.tsx`, `variables.ts` |
| Versión | 1.0 — 2026-06-30 |

> **Nota de nomenclatura:** el SLUG solicitado fue `COL_QD_Corrección_Error_Funcional`. Se
> normalizó a `COL_QD_SCR-003_Correccion_Error_Funcional` (sin tilde, con código SCR) para
> respetar la convención de las pantallas hermanas QD y evitar caracteres no-ASCII en el
> parámetro de URL `?screen=`. Ver §10.

---

## 2. Resumen

Pantalla a la que el subproceso de radicación (SP1) deriva el caso cuando SmartSupervision
**rechaza la radicación con un error 400 funcional** (datos inválidos, caracteres no
permitidos, valor fuera de catálogo). Muestra al Gestor de Experiencia el detalle del error
—código SFC, campo afectado, valor rechazado, mensaje literal, intento actual y fecha— para
que **corrija únicamente el campo señalado** y reenvíe a SmartSupervision (vuelve a SP1-T02),
o **escale a soporte técnico** si el problema persiste. Incluye un historial de intentos
anteriores (solo lectura) y un modal con el log completo del rechazo.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-003.md` | Campos (FLD-040..048), acciones (ACT-003-*), reglas (RUL-003-*), mensajes (MSG-003-*), permisos, trazabilidad BPMN, historia/criterio de aceptación |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-008/009/010 (orden, columnas, visibilidad) |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos exactos de MSG-003-01/02/03 |
| Anexo02 (índice .md) | `masters/01_Pantallas.md` | Historia de usuario y criterio de aceptación de SCR-003 |
| Anexo02 (índice .md) | `masters/10_Trazabilidad_BPMN.md` | Mapeo SCR-003 → SP1-T05, compuerta, datos in/out |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` (fila 22) | Definición y RACI de SP1-T05 |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `2. Directrices` (filas 29-30) | Restricción 🔴 (bloqueo de reenvío) y Lineamiento 🟢 |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `4. Pantallas` (fila 4) | Historia de usuario / criterio de aceptación |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | **Sin filas para SP1-T05** (tarea de Usuario, no automatizada) → no aporta data_name canónicos |

---

## 4. Campos Implementados

### S1 — Panel de Error SmartSupervision (SEC-008, solo lectura)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Código de Error SFC | `ef_codigoErrorSFC` | `ZdsInput` readOnly | No | Anexo02 > SCR-003 > FLD-040 |
| Campo Afectado | `ef_campoAfectado` | `ZdsInput` readOnly | No | Anexo02 > SCR-003 > FLD-041 |
| Valor Rechazado | `ef_valorRechazado` | `ZdsInput` readOnly | No | Anexo02 > SCR-003 > FLD-042 |
| Mensaje de Error SFC | `ef_mensajeErrorSFC` | `ZdsTextarea` readOnly | No | Anexo02 > SCR-003 > FLD-043 |
| Intento N.° actual (M1/M2) | `ef_numeroIntento` | `ZdsInput` readOnly | No | Anexo02 > SCR-003 > FLD-044 |
| Fecha/Hora del rechazo | `ef_fechaRechazo` | `ZdsInput` readOnly | No | Anexo02 > SCR-003 > FLD-045 |

### S2 — Campo a Corregir (SEC-009, editable)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Campo específico en corrección | `ef_campoCorreccion` | `ZdsInput` (texto) | **Sí** | Anexo02 > SCR-003 > FLD-046 |
| Justificación de la corrección | `ef_justificacionCorreccion` | `ZdsTextarea` | No | Anexo02 > SCR-003 > FLD-047 |

### S3 — Historial de Intentos (SEC-010, solo lectura)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Historial de intentos anteriores | `ef_historialIntentos` | Tabla `ZrTable` (Intento \| Fecha \| Campo afectado \| Código error) | No | Anexo02 > SCR-003 > FLD-048 |

### Metadato de flujo (no visible)

| Campo | Variable | Tipo | Fuente |
|---|---|---|---|
| Acción/decisión BPMN | `ef_accion` | `'CORREGIR_REENVIAR' \| 'ESCALAR_SOPORTE'` | Inferido de ACT-003-01 / ACT-003-02 (ver §10) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Campo de corrección obligatorio | `rules={{ required }}` en `ef_campoCorreccion`; error tras submit | Anexo02 > SCR-003 > FLD-046 (Oblig. Sí) |
| Campo debe ser **modificado** antes de reenviar | `campoModificado = correccion !== '' && correccion !== valorRechazado`; botón "Corregir y Reenviar" deshabilitado mientras sea falso | Anexo02 > SCR-003 > RUL-003-01 · Matrices > 2. Directrices fila 29 |
| Sugerencia por múltiples intentos | Si `ef_numeroIntento >= 3` (`UMBRAL_INTENTOS`) se muestra alerta de advertencia sugiriendo escalar | Anexo02 > SCR-003 > RUL-003-02 |
| Justificación máx. 2000 caracteres | `maxLength={2000}` en textarea | Suposición (límite estándar del proyecto; ver §10) |

---

## 6. Mensajes de Error

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-003-01 "Sin corrección" | El campo señalado no fue modificado | `ZrAlert config="info"` en S2 + botón de reenvío deshabilitado (`!campoModificado`) | Anexo02 > 06_Mensajes > MSG-003-01 |
| MSG-003-02 "Múltiples intentos" | `ef_numeroIntento >= 3` | `ZrAlert config="alert"` en S1 | Anexo02 > 06_Mensajes > MSG-003-02 |
| MSG-003-03 "Reenvío iniciado" | Tras reenviar con éxito | **No implementado en UI** — lo emite el BPM al avanzar a SP1-T02 tras `completeTask`. Ver §10 | Anexo02 > 06_Mensajes > MSG-003-03 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-003-01 (🔴 BLOQUEA) — no reenviar si el campo no fue modificado | Botón "Corregir y Reenviar" `disabled` hasta que `campoModificado` sea verdadero; alerta MSG-003-01 visible mientras tanto | Anexo02 > SCR-003 > RUL-003-01 · Matrices > 2. Directrices fila 29 (🔴 Restricción) |
| RUL-003-02 (info) — sugerir escalamiento si `numerIntentoM1M2 >= 3` | Alerta de advertencia condicional en S1 (`multiplesIntentos`) | Anexo02 > SCR-003 > RUL-003-02 |
| Lineamiento 🟢 — validar campos/formatos que causaron el rechazo antes de ajustar | Cubierto indirectamente: el panel muestra mensaje SFC, campo y valor rechazado para guiar la corrección | Matrices > 2. Directrices fila 30 (🟢 Lineamiento) |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Panel de error con acento rojo | `FormSection color="var(--z-red)"` (igual que SCR-004) | Anexo02 > SCR-003 > tipo "Panel de error" |
| Banner de error 400 funcional | `ZrAlert config="negative"` con código de intento | Anexo02 > SCR-003 (contexto/criterio de aceptación) |
| "Ver Log Completo" abre modal | `ACT-003-03`: `ZrButton config="link"` → `ZrModal` con todos los campos read-only del rechazo | Anexo02 > SCR-003 > ACT-003-03 |
| Etiqueta dinámica del campo a corregir | Label `Corrección — {ef_campoAfectado}` si llega el nombre del campo | Anexo02 > SCR-003 > FLD-046 (Control "Dinámico") |
| Historial vacío | Fila `.record-empty` "Sin intentos anteriores registrados" | Patrón del proyecto (shared.css) |
| Estados loading/error/submitting | `ZrLoader`, `ZrAlert`, botones con `loading`/`disabled` desde `useTask()` | CLAUDE.md (convención) |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `ef_valorRechazado` | `ef_campoCorreccion` | Habilita "Corregir y Reenviar" solo si la corrección difiere del valor rechazado | Anexo02 > SCR-003 > RUL-003-01 |
| `ef_numeroIntento` | Alerta MSG-003-02 | Muestra advertencia de escalamiento si `>= 3` | Anexo02 > SCR-003 > RUL-003-02 |
| `ef_campoAfectado` | Label de `ef_campoCorreccion` | El nombre del campo afectado titula el control de corrección | Anexo02 > SCR-003 > FLD-046 |

---

## 10. Suposiciones Realizadas

- **Nombres `data_name` (`ef_*`).** Anexo03 no contiene variables para SP1-T05 (tarea de
  Usuario, no automatizada) → no hay diccionario canónico. Se usaron nombres descriptivos con
  prefijo `ef_` (Error Funcional), a actualizar cuando negocio/TI los entreguen. (Patrón idéntico
  al de SCR-004 con prefijo `et_`.)
- **Slug normalizado.** Se cambió `COL_QD_Corrección_Error_Funcional` por
  `COL_QD_SCR-003_Correccion_Error_Funcional` (ver §1).
- **FLD-046 control "Dinámico (Texto o Lista)".** Sin catálogo asociado en 07_Catalogs, se
  implementó como `ZdsInput` de texto. Si el campo afectado fuese de catálogo, requeriría
  resolver dinámicamente a `ZdsSelect` (pendiente del diccionario PM4).
- **Definición de "campo modificado" (RUL-003-01).** El insumo no especifica cómo se detecta la
  modificación; se asumió "valor de corrección no vacío y distinto del valor rechazado original".
- **`maxLength=2000`** en la justificación: límite estándar del proyecto, no especificado en el insumo.
- **MSG-003-03** (éxito de reenvío) lo emite el BPM tras avanzar a SP1-T02; no se renderiza en esta pantalla.
- **`ef_accion`** (metadato CORREGIR_REENVIAR / ESCALAR_SOPORTE): no es un FLD del insumo; se
  deriva del botón presionado para informar la decisión al BPM (ACT-003-01 / ACT-003-02).
- **Historial (FLD-048)** se lee de `task.data.ef_historialIntentos` como arreglo de objetos
  `{intento, fecha, campoAfectado, codigoError}`; la forma exacta del arreglo se confirmará con TI.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-040..048) | 9/9 (100%) | Todos implementados |
| Acciones (ACT-003-01/02/03) | 3/3 (100%) | Reenviar, Escalar, Ver Log |
| Reglas (RUL-003-01/02) | 2/2 (100%) | Bloqueo de reenvío + sugerencia de escalamiento |
| Mensajes (MSG-003-01/02/03) | 2/3 en UI | MSG-003-03 lo emite el BPM (no UI) |
| Secciones (SEC-008/009/010) | 3/3 (100%) | Panel error / Campo a corregir / Historial |

**Elementos inferidos (sin respaldo literal en el insumo):** prefijo `ef_*`, metadato
`ef_accion`, definición operativa de "campo modificado", `maxLength=2000`, render del historial
como tabla `ZrTable`, etiqueta dinámica del campo a corregir.
