# Documentación Funcional — Corrección Error Funcional M1/M2

> **Porte a Angular 21 (Fase 5, pantalla 5 de 12).** Este archivo es el equivalente Angular de
> `frontend/src/screens/.../DOCUMENTACION_COL_QD_SCR-003_Correccion_Error_Funcional.md`. Las
> secciones §1 a §11 son **la misma trazabilidad funcional** —FLD/RUL/MSG/SEC contra el Anexo02 y el
> script PHP de Momento 2—, con los nombres de los controles del DS actualizados a los de la fachada
> Angular. **El contrato con PM4 no cambió**: ni un `qd_*`, ni el slug, ni una clave del body.
>
> Lo que sí es nuevo vive en **§12**, que es el delta del porte: qué se hizo distinto de React, por
> qué, y qué encontró el porte que ningún test podía encontrar.

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
| Archivos de implementación | `correccion-error-funcional.ts` + `.html` + `.spec.ts` · `seccion-campos-payload.ts` + `.html` (config centralizada en `components/fields/fields.ts`; cascada del motivo en `core/matriz-motivos.service.ts`) |
| Versión | 3.0 — 2026-08-16 (porte a Angular 21) · 2.0 — 2026-08-04 (editor del payload de Momento 2) · 1.0 — 2026-06-30 |

> **Nota de nomenclatura:** el SLUG solicitado fue `COL_QD_Corrección_Error_Funcional`. Se
> normalizó a `COL_QD_SCR-003_Correccion_Error_Funcional` (sin tilde, con código SCR) para
> respetar la convención de las pantallas hermanas QD y evitar caracteres no-ASCII en el
> parámetro de URL `?screen=`. Ver §10.

---

## 2. Resumen

Pantalla a la que el subproceso de radicación (SP1) deriva el caso cuando SmartSupervision
**rechaza la radicación con un error 400 funcional** (datos inválidos, caracteres no
permitidos, valor fuera de catálogo). Muestra al Gestor de Experiencia el detalle del error
—código HTTP/SFC, tipo de error, endpoint, mensaje literal e intento acumulado— y, debajo,
la **lista completa de los campos del body de Momento 2** (`buildBodyMomento2` del script
PHP): cada campo en su propio control, ligado a la **variable del caso** de la que el script
lo lee, con un checkbox **"Editar"** que desbloquea la edición y con dropdown de catálogo PM4
(guardando el código) cuando aplica.

Al **corregir y reenviar** (vuelve a SP1-T02) las variables corregidas se guardan en el caso
y se **vacía `qd_strPayloadSent`**, de modo que la siguiente corrida de Momento 2 regenere el
body desde los campos ya corregidos. También puede **escalar a soporte técnico** si el
problema persiste. Incluye historial de intentos (solo lectura) y un modal con el log técnico
completo + el payload enviado.

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
| `Solo Momento 2.php` (script PM4 de radicación) | — | `buildBodyMomento2()` → claves del body y variable `qd_*` de cada una (base de `SCR003_PAYLOAD_M2_FIELDS`); `sfcCamposErrorTecnico()` → variables de error que el script realmente emite; `opMomento2()` → regla de precedencia de `qd_strPayloadSent` sobre el body regenerado |
| `task.data` real (caso BPM 216 / request 34251) | — | Confirmación de qué variables llegan a la pantalla en un rechazo 400 funcional |

---

## 4. Campos Implementados

### S1 — Panel de Error SmartSupervision (SEC-008, solo lectura)

Los FLD-040..045 se muestran **si el caso los trae**; como ningún script los escribe hoy
(ver §10), cada uno cae a la variable equivalente que sí emite el Momento 2:

| Campo (UI) | Variable | Fallback real | Tipo | Fuente |
|---|---|---|---|---|
| Código de Error SFC / HTTP | `qd_strSfcErrorCode` | `qd_strHttpCode` | `zds-input` `[readOnly]` | FLD-040 / script M2 |
| Tipo de Error | `qd_strErrorType` | — | `zds-input` `[readOnly]` | script M2 (`sfcClasificarError`) |
| Intento N.° actual (M1/M2) | `qd_strM1M2AttemptNum` | `qd_strAttemptNum` | `zds-input` `[readOnly]` | FLD-044 / script M2 |
| Endpoint Invocado | `qd_strEndpointCalled` | — | `zds-input` `[readOnly]` | script M2 |
| Mensaje de Error SFC | `qd_strSfcErrorMessage` | `qd_strApiTechMessage` | `zds-textarea` `[readOnly]` | FLD-043 / script M2 |
| Payload Enviado (JSON) | `qd_strPayloadSent` | — | `zds-textarea` `[readOnly]` (igual que la ex SCR-004) | FLD-054 |
| Log técnico completo (modal) | `qd_strCompleteLogAPI` | — | `zds-textarea` `[readOnly]` | script M2 |

> **Campos retirados de la UI** (ningún script los emite, salían siempre vacíos):
> `qd_strAffectedField` (FLD-041), `qd_strRejectedValue` (FLD-042) y `qd_strRejectionDate`
> (FLD-045). Las variables siguen en el formulario: si el caso las trae, `qd_strAffectedField`
> alimenta la píldora "Señalado por la SFC" de S2 y las tres viajan en el `completeTask`. La
> fecha/hora del rechazo consta en el log completo (`timestamp` de `_sfc_respons_logs`).
>
> El **Payload Enviado** se muestra en S1 en solo lectura (a diferencia de la ex SCR-004, donde era
> editable): en SCR-003 la corrección se hace campo por campo en S2 y el body se regenera.

### S2 — Campos a Corregir (SEC-009, editable) — editor del payload de Momento 2

Una fila por clave del body que arma `buildBodyMomento2()`, en el mismo orden. Cada fila
muestra la clave del body, la variable del caso y el valor actual; el control se habilita solo
al marcar su checkbox **"Editar"** (al desmarcarlo se restaura el valor original). Descriptor
único: `SCR003_PAYLOAD_M2_FIELDS` en `components/fields/fields.ts`.

| Clave del body | Variable | Control | Catálogo PM4 |
|---|---|---|---|
| `tipo_entidad`, `entidad_cod`, `codigo_queja` | — | solo lectura (sin checkbox) | constantes del CORE / derivado del caso BPM |
| `codigo_pais` | `qd_strCountryCode` | `zds-select` | 13 · `countryCode` |
| `departamento_cod` | `qd_strDepartment` | `zds-select` | 14 · `department` |
| `municipio_cod` | `qd_strCity` | `zds-select` | 15 · `city` (filtrado por departamento) |
| `canal_cod` | `qd_strChannel` | `zds-select` | 10 · `channel` |
| `producto_cod` | `qd_strSfcProduct` | `zds-select` con values de UI desambiguados | 16 · `sfcProduct` |
| — (auxiliar) | `qd_strInteraction` | `zds-select` | 45 · `cat_matriz_motivos` (momento) |
| — (auxiliar) | `qd_strServiceProvided` | `zds-select` | 45 · solo si el momento es "Asistencias" |
| `macro_motivo_cod` | `qd_strSfcReason` | `zds-select` | 45 · cascada producto → momento → (servicio) → motivo |
| `fecha_creacion` | `qd_strFilingDate` | `zds-input` con validación `DD/MM/AAAA` | — |
| `nombres` | `qd_strCompanyName` · `qd_strFirstName` · `qd_strLastName` | `zds-input` (3 filas) | — (razón social tiene precedencia, ver `sfcNombres`) |
| `tipo_id_CF` | `qd_strIdType` | `zds-select` | 11 · `idType` |
| `numero_id_CF` | `qd_strIdNumber` | `zds-input` (solo dígitos) | — |
| `tipo_persona` | `qd_strPersonType` | `zds-select` | 12 · `personType` |
| `insta_recepcion` | `qd_strReceptionInstance` | `zds-select` | 19 · `receptionInstance` |
| `punto_recepcion` | `qd_strReceptionPoint` | `zds-select` | 20 · `receptionPoint` |
| `admision` | `qd_strAdmission` | `zds-select` | 21 · `admission` |
| `texto_queja` | `qd_strComplaintText` | `zds-textarea` | — |
| `anexo_queja` | `qd_strFinalReplyAttach` | `zds-radio` SÍ/NO | — (el script lo envía como booleano) |
| `ente_control` | `qd_strControlEntity` | `zds-select` | 22 · `controlEntity` |

Cada campo de catálogo guarda el **código** y sincroniza su compañera `<campo>_desc`
(`sincronizarDesc()`), según la convención del proyecto.

### S2b — Justificación (SEC-009, editable)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Justificación de la corrección | `qd_strCorrectionJustif` | `zds-textarea` (máx. 2000) | No | Anexo02 > SCR-003 > FLD-047 |
| Campos modificados (auto) | `qd_strFieldCorrection` | derivado, sin control visible | — | FLD-046 (ver §10) |

### S3 — Historial de Intentos (SEC-010, solo lectura)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Historial de intentos anteriores | `qd_lstAttemptHistory` | Tabla `lib-table-z` **data-driven** (Intento \| Fecha \| Campo afectado \| Código error) | No | Anexo02 > SCR-003 > FLD-048 |

### Metadato de flujo (no visible)

| Campo | Variable | Tipo | Fuente |
|---|---|---|---|
| Acción/decisión BPMN | `qd_strAction` | `'CORREGIR_REENVIAR' \| 'ESCALAR_SOPORTE'` | Inferido de ACT-003-01 / ACT-003-02 (ver §10) |
| Payload del reenvío (se vacía al corregir) | `qd_strPayloadSent` | `''` al reenviar | Regla de `opMomento2` (ver §7) |
| Flag de ajuste de payload | `qd_strPayloadAdjustNeeded` | `'NO'` al reenviar | FLD-058 (lo compartía con la ex SCR-004) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Formato de `fecha_creacion` | `validadorFormato(RGX_FECHA)` **tolerante con vacío**: `DD/MM/AAAA` (lo que espera `sfcFechaIso`) | Script M2 (`sfcFechaIso`) |
| `numero_id_CF` solo dígitos | `validadorFormato(RGX_SOLO_DIGITOS)` tolerante con vacío: `^\d+$` | Anexo02 (formato de identificación) |
| Valor de catálogo válido | Los campos de colección solo aceptan opciones del catálogo (`zds-select`) → no se puede escribir un código fuera de catálogo | Lineamiento 🟢 (Matrices > 2. Directrices fila 30) |
| Coherencia de la cascada | Al cambiar producto/momento/servicio, el valor aguas abajo que ya no existe en las opciones se limpia y su fila queda marcada como editable | Derivado de `cat_matriz_motivos` (igual que SCR-000/0051) |
| Coherencia departamento → municipio | Al cambiar el departamento se recarga el catálogo de municipios y se limpia el municipio si no pertenece | Colección 15 (`dependsOn: qd_strDepartment`) |
| Sugerencia por múltiples intentos | Si el intento (`qd_strM1M2AttemptNum` ó `qd_strAttemptNum`) `>= 3` (`INT_UMBRAL_INTENTOS`) se muestra alerta sugiriendo escalar | Anexo02 > SCR-003 > RUL-003-02 |
| Justificación máx. 2000 caracteres | `Validators.maxLength(INT_MAX_JUSTIF)` **en el control** + `[maxLength]` en el widget | Suposición (límite estándar del proyecto; ver §10) |
| ~~Campo de corrección obligatorio~~ | **Retirada**: `qd_strFieldCorrection` ya no es un input manual (se autocompleta, ver §10) | — |
| ~~Bloqueo por campo no modificado~~ | **Retirada**: el reenvío ya no se bloquea (decisión de negocio, ver §7) | — |

---

## 6. Mensajes de Error

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-003-01 "Sin corrección" | El campo señalado no fue modificado | **Retirado como bloqueo** (ver §7). En su lugar, S2 muestra una alerta informativa permanente que explica el checkbox "Editar" y que el body se regenera | Anexo02 > 06_Mensajes > MSG-003-01 |
| MSG-003-02 "Múltiples intentos" | Intento `>= 3` | `za-alert config="alert"` en S1 | Anexo02 > 06_Mensajes > MSG-003-02 |
| MSG-003-03 "Reenvío iniciado" | Tras reenviar con éxito | **No implementado en UI** — lo emite el BPM al avanzar a SP1-T02 tras `completeTask`. Ver §10 | Anexo02 > 06_Mensajes > MSG-003-03 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-003-01 (🔴 BLOQUEA) — no reenviar si el campo no fue modificado | **No se implementa como bloqueo** (decisión de negocio 2026-08-04): un 400 funcional puede resolverse sin cambiar datos (p.ej. duplicado ya cerrado en la SFC), así que el botón "Corregir y Reenviar" está siempre habilitado. La trazabilidad se conserva en `qd_strFieldCorrection`, que registra los campos modificados o "Reenvío sin cambios en el payload" | Anexo02 > SCR-003 > RUL-003-01 · Matrices > 2. Directrices fila 29 (🔴 Restricción) |
| **Regeneración del body (nueva)** | Al reenviar se envía `qd_strPayloadSent = ''` y `qd_strPayloadAdjustNeeded = 'NO'`. `opMomento2` compara el body regenerado contra `qd_strPayloadSent`: si difieren envía **la variable**, así que dejar el payload viejo haría que las correcciones se descartaran y se reenviara el body anterior | `Solo Momento 2.php` > `opMomento2` / `sfcPayloadEditado` |
| RUL-003-02 (info) — sugerir escalamiento si el intento `>= 3` | Alerta de advertencia condicional en S1 (`blnMuchosIntentos()`) | Anexo02 > SCR-003 > RUL-003-02 |
| Lineamiento 🟢 — validar campos/formatos que causaron el rechazo antes de ajustar | Cubierto: los campos de catálogo solo aceptan valores válidos, fecha e identificación se validan por formato, y las filas que la SFC señala se marcan con una píldora "Señalado por la SFC" | Matrices > 2. Directrices fila 30 (🟢 Lineamiento) |
| Sin reclasificación del caso | Cambiar el motivo **no** recalcula SLA (`qd_strSlaAssigned`) ni rol responsable (`qd_strResponsableRole`) ni los regulatorios derivados — misma decisión de negocio que SCR-0051 | Ver §10 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Panel de error con acento rojo | `app-form-section color="var(--z-red)"` (igual que la ex SCR-004) | Anexo02 > SCR-003 > tipo "Panel de error" |
| Banner de error 400 funcional | `za-alert config="negative" [hide-close]="true"` con el número de intento | Anexo02 > SCR-003 (contexto/criterio de aceptación) |
| "Ver Log Completo" abre modal | `ACT-003-03`: `lib-button-z [type]="'link'"` en el slot `action` → `lib-modal-z tamanio="l"` con `qd_strCompleteLogAPI` — mismo patrón que la ex SCR-004 | Anexo02 > SCR-003 > ACT-003-03 |
| Edición bajo checkbox | Cada fila del payload trae un `zds-checkbox-field` "Editar" en un **FormGroup satélite** (estado local de UI, **no** viaja a PM4): desmarcado ⇒ el control queda `disabled`; al desmarcar se restaura el valor original de `task.data` | Requerimiento 2026-08-04 |
| Desbloqueo en cascada | Marcar "Editar" en departamento o producto deja editables las filas dependientes (municipio / momento / servicio / motivo) | Derivado de las dependencias de catálogo |
| Píldoras por fila | `zds-status-badge` "Modificado" (valor ≠ original) y "Señalado por la SFC" (`esSenalado()`: la clave del body o su token aparece en `qd_strAffectedField` / el mensaje de error) | Patrón del proyecto |
| Contexto por fila | Bajo cada control, `.field-hint` con la clave del body, la variable `qd_*`, el valor actual (descripción del catálogo) y el original si cambió | Requerimiento 2026-08-04 |
| Layout sin CSS nuevo | `form-row cols-2 row-align-bottom` (control \| checkbox); tipografías `.info-bar-label` / `.field-hint` | CLAUDE.md (jerarquía de UI) |
| Historial vacío | `.record-empty` "Sin intentos anteriores registrados", **fuera** de la tabla (ver §12.3) | Patrón del proyecto (shared.css) |
| Estados loading/error/submitting | `lib-loader-z`, `za-alert`, botones con `[loading]`/`[disabled]` desde `TaskService` | CLAUDE.md (convención) |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strDepartment` | `qd_strCity` | Recarga el catálogo de municipios (PMQL por departamento) y limpia el municipio si queda fuera de la lista | Colección 15 |
| `qd_strSfcProduct` | `qd_strInteraction` → `qd_strServiceProvided` → `qd_strSfcReason` | Cascada `cat_matriz_motivos` (45): cada eslabón filtra el siguiente; el valor que queda fuera de opciones se limpia y su fila queda editable | `core/matriz-motivos.service.ts` (misma lógica que SCR-000/0051) |
| `qd_strInteraction` | `qd_strServiceProvided` | El servicio solo aplica cuando el momento es "Asistencias"; fuera de ese caso se limpia | Anexo02 #31 |
| `qd_strCompanyName` | `qd_strFirstName` / `qd_strLastName` | Si la razón social tiene valor, el script envía solo ella como `nombres` e ignora nombre+apellido | Script M2 (`sfcNombres`) |
| Todos los campos del payload | `qd_strFieldCorrection` | Se autocompleta con el resumen `clave: original → nuevo (descripción)` de cada campo modificado (`lstCambios()`) | FLD-046 (ver §10) |
| Todos los campos del payload | `qd_strPayloadSent` | Al reenviar se vacía para forzar la regeneración del body en Momento 2 | §7 |
| Cualquier campo de catálogo | `<campo>_desc` | `sincronizarDesc()` mantiene la descripción legible en la variable compañera | CLAUDE.md (convención `_desc`) |
| Intento (`qd_strM1M2AttemptNum` / `qd_strAttemptNum`) | Alerta MSG-003-02 | Muestra advertencia de escalamiento si `>= 3` | Anexo02 > SCR-003 > RUL-003-02 |
| `qd_strAffectedField` / mensaje de error | Píldora "Señalado por la SFC" | Resalta las filas cuya clave del body aparece en el texto del error | Requerimiento 2026-08-04 |

---

## 10. Suposiciones Realizadas

- **Nombres `data_name` (`qd_*`).** Anexo03 no contiene variables para SP1-T05 (tarea de
  Usuario, no automatizada) → no hay diccionario canónico. Se usaron nombres descriptivos con
  prefijo `qd_` (unificado con las pantallas QD hermanas; antes `ef_`, Error Funcional), a
  actualizar cuando negocio/TI los entreguen.
- **Slug normalizado.** Se cambió `COL_QD_Corrección_Error_Funcional` por
  `COL_QD_SCR-003_Correccion_Error_Funcional` (ver §1).
- **FLD-040..045 no los emite ningún script.** `Solo Momento 2.php` (`sfcCamposErrorTecnico`)
  escribe `qd_strHttpCode`, `qd_strErrorType`, `qd_strEndpointCalled`, `qd_strApiTechMessage`,
  `qd_strCompleteLogAPI`, `qd_strAttemptNum` y `qd_strPayloadSent` — el mismo juego que
  consumía la ex SCR-004 (eliminada en ago-2026; hoy esta pantalla es la única que lo pinta,
  pero lo escribe el script de PM4, no el frontend). Se verificó contra el `task.data` real de un rechazo 400 (caso BPM 216):
  los campos propios de SCR-003 llegan ausentes. La pantalla los muestra si existen y, si no,
  cae a esas variables. **Pendiente con TI:** decidir si el script debe emitir además el
  campo afectado y el valor rechazado (hoy solo se pueden inferir del mensaje de la SFC).
- **FLD-046 control "Dinámico (Texto o Lista)".** Se reinterpretó como el editor completo del
  payload: `qd_strFieldCorrection` deja de ser un input manual y se **autocompleta** con el
  resumen `clave: original → nuevo (descripción)`, o `"Reenvío sin cambios en el payload"` si
  no se modificó nada. Preserva la variable como registro de trazabilidad para el BPM.
- **Alcance del editor = body de Momento 2.** El mapa `SCR003_PAYLOAD_M2_FIELDS` es espejo de
  `buildBodyMomento2()`: si el script cambia de claves o de variables, hay que actualizarlo.
  Las claves que lleguen en `qd_strPayloadSent` y no estén en el mapa no se renderizan como
  editables (no tendrían variable donde persistirse).
- **`tipo_entidad` / `entidad_cod` / `codigo_queja`** se muestran en solo lectura: los dos
  primeros son constantes de la configuración del CORE y el tercero se deriva de ellos + el
  número de caso BPM (`sfcCodigoQueja`), así que no hay variable editable detrás.
- **`macro_motivo_cod` por cascada.** Se eligió la cascada `cat_matriz_motivos` (id 45) sobre
  el catálogo plano de motivos (id 17) para mantener la coherencia producto → momento →
  servicio → motivo con SCR-000/SCR-0051. Las filas de momento y servicio son auxiliares: no
  viajan en el body de la SFC.
- **Sin reclasificación del caso.** Al cambiar el motivo no se recalculan SLA, rol responsable
  ni los regulatorios derivados de la matriz (escalamiento/resarcimiento/relación con fraude);
  el objetivo es que la SFC acepte el body, no reclasificar la queja. Si negocio pide lo
  contrario, se replicaría el efecto de re-derivación de SCR-0051.
- **Fecha en `DD/MM/AAAA` y no `zds-date`.** `qd_strFilingDate` viaja como texto DD/MM/AAAA y
  el script lo convierte con `sfcFechaIso`; un date-picker ISO cambiaría el formato guardado.
- **RUL-003-01 sin bloqueo** (decisión de negocio 2026-08-04, ver §7).
- **`maxLength`**: 2000 en la justificación (límite estándar del proyecto) y 4000 en
  `texto_queja` (no especificado en el insumo).
- **Escalamiento a soporte** no vacía `qd_strPayloadSent`: el payload queda como evidencia
  técnica para el analista.
- **MSG-003-03** (éxito de reenvío) lo emite el BPM tras avanzar a SP1-T02; no se renderiza en esta pantalla.
- **`qd_strAction`** (metadato CORREGIR_REENVIAR / ESCALAR_SOPORTE): no es un FLD del insumo; se
  deriva del botón presionado para informar la decisión al BPM (ACT-003-01 / ACT-003-02).
- **Historial (FLD-048)** se lee de `task.data.qd_lstAttemptHistory` como arreglo de objetos
  `{intento, fecha, campoAfectado, codigoError}`; la forma exacta del arreglo se confirmará con TI.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-040..048) | 6/9 en UI | FLD-041 (campo afectado), FLD-042 (valor rechazado) y FLD-045 (fecha del rechazo) se retiraron: ningún script los emite (§4). FLD-040/043/044 se muestran con fallback a las variables del script; se añade FLD-054 (payload enviado, solo lectura) |
| Campos del body de Momento 2 | 20/20 claves | Todas mapeadas a su variable `qd_*` o marcadas como constante/derivado (`SCR003_PAYLOAD_M2_FIELDS`) |
| Acciones (ACT-003-01/02/03) | 3/3 (100%) | Reenviar, Escalar, Ver Log |
| Reglas (RUL-003-01/02) | 1/2 + 1 nueva | RUL-003-01 retirada como bloqueo (decisión de negocio); se añade la regla de regeneración del body (§7) |
| Mensajes (MSG-003-01/02/03) | 1/3 en UI + 1 informativo | MSG-003-01 pasa a alerta informativa de la sección; MSG-003-03 lo emite el BPM |
| Secciones (SEC-008/009/010) | 3/3 (100%) | Panel error / Campos a corregir + justificación / Historial |

**Elementos inferidos (sin respaldo literal en el insumo):** prefijo `qd_*` (antes `ef_*`), metadato
`qd_strAction`, resumen automático en `qd_strFieldCorrection`, limpieza de `qd_strPayloadSent` al
reenviar, `maxLength` 2000/4000, render del historial como tabla del DS, mapa payload→variable
derivado del script PHP (no del Anexo02), y la píldora "Señalado por la SFC" (heurística sobre el
texto del error).

---

## 12. Delta del porte a Angular 21

Lo de arriba es funcionalidad y no cambió. Esto es **cómo** se logró lo mismo con otra
plataforma, y qué apareció en el camino.

### 12.1 Mapeo mecánico React → Angular

| React (`CorreccionErrorFuncional.tsx`) | Angular (`correccion-error-funcional.ts`) |
|---|---|
| `useForm<FormValues>()` | `FormGroup` tipado, campo de instancia |
| `Controller` + `ZdsX` | `formControlName` + `name` sobre el wrapper de la fachada |
| `watch()` | `sigValores`, un `signal` alimentado por `form.valueChanges` |
| `reset(task.data)` | `precargar()` → `form.patchValue(...)` |
| `getValues()` | `form.getRawValue()` — **nunca `value`**, ver §12.3 |
| `handleSubmit(reenviar)` | `(ngSubmit)="reenviar()"` |
| `useTask()` | `TaskService` inyectado |
| `useCollection()` × 13 | `CatalogosService`, en el `providers` de la **sección**, no de la pantalla |
| `useMatrizMotivos()` | `MatrizMotivosService`, ídem |
| `useSyncDesc()` | `sincronizarDesc()` sobre `valueChanges` |
| `useState(false)` del modal | `signal(false)` (`blnVerLog`) |
| `useMemo` de historial / payload / cambios | `computed()` (`cllHistorial`, `objPayloadEnviado`, `strSenalado`) |
| `SeccionCamposPayload` con `form` por prop | `app-seccion-campos-payload` con `input.required<FormGroup>()` |

### 12.2 Lo que esta pantalla estrena en el porte

Es la pantalla 5 de 12 y la primera que necesita tres cosas que ninguna anterior tenía:

1. **`lib-table-z` data-driven.** El historial (FLD-048) es la primera tabla del porte. React
   proyectaba un `<table>` crudo **dentro** de `ZrTable`; `TableZ` **no proyecta markup** — arma la
   tabla desde `[headers]` (`ModeloTablaZr[]`, con `{title, key}`) y `[data]`. Es además lo que manda
   la política de `shared.css` ("gana el componente del DS"), y las filas del historial mapean 1:1 a
   columnas.
2. **Nombres de control DINÁMICOS.** Tres campos de S1 (`[formControlName]`/`[name]` con un
   `computed()`) se atan al nombre que el caso **realmente** trae, con fallback al del anexo — es la
   consecuencia directa de que ningún script emita los FLD-040..045 (§10). Ninguna pantalla anterior
   tenía un nombre de control resuelto en runtime.
3. **El editor del payload como componente propio con su `FormGroup` satélite.** Ver abajo.

**El `FormGroup` satélite (`objGrupoEdicion`), y por qué no es un detalle.** Los checkboxes "Editar"
y el picker de producto son **estado de UI, no dato del caso**: nada llamado `edit-qd_strChannel`
puede llegar a PM4. Y el submit es `{...form.getRawValue()}`, así que un control extra en el
`FormGroup` de la pantalla **viajaría al BPM como un campo inventado**. Por eso viven en un group
aparte. Y tienen que ser **controles reales**, no signals: `ZdsCheckboxField` es un CVA, y sin
`formControlName` no hay nada donde escribir.

**Por qué el producto SFC necesita su propio control de UI y los otros 12 selects no.** La colección
16 **repite códigos** (el 104 es a la vez "Garantía extendida" y "Copropiedades") y el picker del DS
indexa por `value`. React lo resolvió con `toPickerValue`/`fromPickerValue`/`onPickerChange`, que
`zds-select` **no tiene**. Acá el select se ata a `ui-<variable>`, que guarda `código::etiqueta`, y un
`valueChanges` traduce al control real: **el form sigue guardando el código puro**, que es el contrato
con PM4. Sumar la tríada a la fachada sería más código en el punto más compartido del proyecto para un
caso que hoy tiene un solo usuario.

### 12.3 Dónde el porte divergió de React, y por qué

| Divergencia | Motivo |
|---|---|
| El empty state del historial va **afuera** de la tabla, que queda montada siempre | El `<tbody>` de `TableZ` es un `@for` pelado, **sin rama de lista vacía** (verificado sobre la plantilla del `.mjs`): con `data: []` pinta el encabezado y nada más — que es justo la paridad con React, donde los rótulos de columna se ven aunque no haya intentos. El `<td colspan="4" class="record-empty">` de React no tiene equivalente y lo resuelve la pantalla con un `@if (!length)` **hermano** de la tabla. **Ojo:** envolver la tabla en un `@if (length)` se come las cabeceras — así estuvo hasta la revisión visual del 2026-08-16, con la suite verde y el spec aseverando el defecto |
| `tamanio="l"` en lugar de la clase `.modal-wide` | El ancho lo gobierna el componente del DS (política de `shared.css`). Es lo que hacen las otras tres modales del proyecto |
| No hay botón "Cerrar" propio en el modal | `ModalZ` ya pinta su X, y el slot `buttons` quedaría redundante en una modal de solo lectura |
| El `_desc` se sincroniza con una **función**, no con el array | `sincronizarDesc()` recibe las opciones como thunk: pasarle el array captura el `[]` del primer instante (antes de que responda el GET) y el `_desc` nunca se escribe |
| El bloqueo de filas usa `control.disable()`, no `[disabled]` en la plantilla | `zds-select` **no se puede deshabilitar**: su input `disable` (sin "d" final) existe pero no se lee en ninguna parte de la lib, y `disabled` tampoco. Va con `emitEvent: false`, porque el efecto depende de `sigValores`, que se alimenta de `valueChanges` — emitir re-entraría en el mismo efecto |
| La reacción al checkbox va por `valueChanges` del control satélite, no por un `(output)` | `ZdsCheckboxField` es un CVA puro. **Y es lo correcto, no solo lo posible:** `marcarEditable()` escribe con `emitEvent: false`, así que las escrituras programáticas de las cascadas **no** re-entran y no pisan lo que la cascada acaba de limpiar. Solo el click de un gestor llega al handler |
| `getRawValue()` y nunca `value`, en las **dos** lecturas del form | `value` **omite los controles deshabilitados**, y en esta pantalla la mayoría de las filas están deshabilitadas por diseño: con `value` el reenvío mandaría los campos bloqueados **vacíos** en vez de con su valor. Es el defecto más caro que el porte podía introducir, y tiene dos casos que lo cubren (29 y 34) |
| El modal lleva un `[formGroup]="form"` local | El `lib-modal-z` es **hermano** del `<form>` en el árbol de la plantilla, así que su `formControlName` no tiene `formGroup` ancestro y sin el binding local tira **NG01050** en runtime |
| `validadorFormato()` propio en lugar de `Validators.pattern` | La tolerancia con el vacío es **la mitad del contrato**: ningún campo del payload es obligatorio (RUL-003-01 no bloquea), así que un validador de formato no puede colar un `required` de contrabando. `Validators.pattern` rechaza `''` |
| El tope de la justificación vive **en el control**, no solo en el widget | `[maxLength]` del widget es afordancia; `Validators.maxLength` es la regla. Un texto pegado desde el portapapeles supera el primero y no el segundo |

### 12.4 Afordancias que el DS obliga a declarar

- **`[disabled]="false"` explícito en todo `lib-button-z`.** Su default es **`true`**: omitirlo deja
  el botón muerto sin ningún aviso. Aplica a los tres botones de la pantalla.
- **`(ngSubmit)="reenviar()"` y NO `escalar()`.** El submit nativo del form (un Enter en cualquier
  campo) tiene que coincidir con la acción principal. Escalar es la salida de excepción y solo se
  alcanza por su botón — que un Enter derivara el caso a soporte técnico sería un accidente
  irreversible del lado de PM4.
- **No hace falta `type="button"` en escalar**, y además no existe: `ButtonZ` no es un `<button>`
  nativo (su plantilla es un `<za-button>`, custom element de Lit), así que no participa del submit
  implícito del `<form>`. Su input `type` es la **variante del DS** (`primary`/`secondary`/`positive`/
  `link`), no el `type` del HTML.
- **`[hide-close]="true"` bindeado** en cada `za-alert`: el input está tipado `boolean` y un atributo
  pelado vale `''`, que Angular 21 rechaza con TS2322.
- **`formControlName` *y* `name`, los dos, en todo campo de la fachada.** No es redundancia:
  `formControlName` ata el control al `FormGroup`, y `name` produce el `id="field-<name>"` que
  necesita `scrollToFirstError` y pre-crea el control que el `lib-*-z` adopta. Con solo `name` el
  campo pinta y **nunca llega al form**.
- **Las tres reglas del slot de `ModalZ`**, las tres con falla silenciosa: el contenido va en
  `<ng-template libZTemplate id="content">`; el `id` es **estático** (`@Attribute('id')` resuelve una
  sola vez, un `[id]` llega `null`); y el `ng-template` **no puede estar dentro de un `@if`**
  (`ngAfterContentInit` corre una vez). El `@if` va **adentro** del slot.
- **`(close)` es obligatorio, no opcional.** `ModalZ.change()` escribe `this.open = false` sobre su
  propio input, así que sin bajar la bandera de la pantalla el **segundo** `abrirLog()` no abriría
  nada. El defecto solo se ve en el segundo click, y hay un caso que lo cubre (35).
- **`cllColumnasHistorial` no puede ser `readonly`.** `TableZ` declara `headers: TableModel[]`
  (mutable), así que un array `readonly` falla con **TS4104** en la línea del `<lib-table-z>`. Y es
  campo de instancia, no `computed()`, para que `TableZ.ngOnChanges` no reconstruya la tabla en cada
  ciclo de detección.

### 12.5 Mutación (fase 5 del flujo de CLAUDE.md)

Sin poder nombrar la línea rota y el caso que se puso rojo, el test no vale. Siete mutaciones sobre la
**implementación** (nunca sobre el spec):

| # | Línea mutada | Resultado | Caso que la ataja |
|---|---|---|---|
| M1 | `getRawValue()` → `value` en `reenviar()` | 🔴 | 29 · `ACT-003-01 lleva los campos bloqueados con su valor, no vacíos` |
| M2 | `qd_strPayloadSent: ''` quitado de `reenviar()` | 🔴 | 27 · `ACT-003-01 vacía el payload para forzar la regeneración del body` |
| M3 | `escalar()` empieza a vaciar el payload | 🔴 | 32 · `ACT-003-02 NO vacía el payload: es la evidencia técnica del analista` |
| M4 | `Validators.maxLength` quitado del control (queda solo el `[maxLength]` del widget) | 🔴 | 18 · `el tope de la justificación vive en el control, no solo en el widget` |
| M5 | `ZrTemplate` quitado del `imports` del componente | 🔴 | 36 · `el contenido del slot del modal llega al DOM al abrirlo` |
| M6 | `cerrarLog()` vaciado (no baja la bandera) | 🔴 | 35 · `abre, cierra y reabre el modal del log` |
| M7 | `qd_strErrorType` → `qd_strErrorTyp` (nombre **estático**) en la plantilla | 🔴 **42 casos** | los 3 de paridad + ~39 del spec de pantalla |

**M5 es la mutación que justifica el caso 36 por sí sola:** al quitar `ZrTemplate`, `libZTemplate`
deja de matchear una directiva, `ModalZ` no encuentra el slot y **el modal abre vacío** — y tanto
`ng build` como la suite completa quedaban **verdes**. Es un modo de falla que ningún otro gate del
proyecto ve.

**M7 mide el alcance de la guarda de paridad, y confirma que es más angosta que el defecto.** Dropear
una letra de un nombre estático enrojece 42 casos, incluido `⚠ todo campo montado existe en el
contrato que declaraba React`. Pero `DIC_NOMBRES_DINAMICOS` —la exención de los tres nombres
dinámicos— **no** cubre ese caso: la guarda queda estrictamente por debajo del defecto que persigue.
**La mutación está revertida** (`correccion-error-funcional.html:70-75`).

### 12.6 Hallazgos que ningún test podía traer

Cuatro cosas que aparecieron por instrumentación o por lectura, no por un caso rojo:

1. **El dataset congelado de paridad React solo nombra los campos resolubles ESTÁTICAMENTE — y es por
   diseño, no por estar viejo.** `paridad-react.json` tiene **5** campos para SCR-003; la pantalla
   Angular monta ~44 más. `scripts/extraer-paridad-react.mjs` resuelve cada `name` por análisis de AST
   de TypeScript y **descarta** lo que no puede evaluar estáticamente, empujándolo a `cllSinResolver`
   —que se imprime en consola pero **no se persiste**. La fuente autoritativa es
   **`node scripts/extraer-paridad-react.mjs --check`**, que para SCR-003 lista los 7 `dinamico:*`
   irresolubles y cierra con `✓ el dataset congelado coincide con el .tsx de React`. Sin esto, el
   caso de inventario se veía como 44 huérfanos y parecía un dataset desactualizado. **Corolario:**
   una lista de exenciones necesita su propia guarda de "¿sigue siendo alcanzable?" — la primera
   versión tenía tres entradas inalcanzables (`qd_strErrorCodeSFC`, `qd_intAttemptNumber`,
   `qd_strErrorMessageSFC`, que no montan con `data: {}`) y las detectó esa guarda nueva.
2. **`ng build` no compila la plantilla de un componente que no está enrutado, así que `tsc` no vio un
   TS2345 real.** `SCR003_DEFAULTS` incluye `qd_lstAttemptHistory`, una **lista sin control**, y
   volcarla cruda en `patchValue` es un error de tipos. Lo encontró una **sonda de montaje** (un spec
   desechable que monta el componente para forzar la compilación de su plantilla), no el compilador.
   Arreglado pasando los defaults por el mismo filtro `Object.keys(this.form.controls)` que usa
   `precargar()`.
3. **El cuerpo de un `effect()` no es contexto de inyección (NG0203), y esta pantalla es la primera del
   porte que se choca con eso.** `sincronizarDesc()` hace `inject(DestroyRef)`, así que llamarla
   directo desde el efecto que cablea el form **tira NG0203 en el primer render** — invisible al
   compilar. Va con `runInInjectionContext`. **Y la diferencia con la ex SCR-012 es la que importa:** allá
   el `FormGroup` es un campo de instancia de la pantalla, disponible en el constructor. Acá el form
   llega por `input()`, y eso obliga a diferir el cableado a un efecto — que es justo donde el
   contexto de inyección ya no existe.
4. **Un `FormControl` DESHABILITADO reporta `hasError() === false` *y* `valid === false`, y no corre
   ningún validador.** No es solo un detalle de test (los casos 20/21/22 tienen que llamar
   `habilitarFila()` primero o fallan con un `expected false to be true` que no dice nada del
   validador): **es el comportamiento real de la pantalla.** Un formato roto en una fila que el gestor
   no desbloqueó **no bloquea el reenvío**. Queda dicho acá porque es una consecuencia funcional de la
   decisión de UI del §8, no un accidente.

### 12.7 Cobertura del spec — 39 casos

`correccion-error-funcional.spec.ts`, un caso por comportamiento y no un smoke:

| Bloque | Casos | Qué asevera |
|---|---|---|
| Contrato y montaje | 1-3 | Los campos de la fachada cumplen el contrato estructural · la precarga trae diagnóstico y payload desde `task.data` · la pantalla no monta en rojo |
| S1 · rótulos y fallbacks | 4-6 | Los 7 rótulos coinciden con el anexo (con conteo antes del `for`) · el diagnóstico cae al del script cuando faltan los FLD-040..045 · usa los del anexo cuando el caso **sí** los trae |
| RUL-003-02 · umbral | 7-9 | No advierte por debajo del umbral · advierte al alcanzarlo **sin deshabilitar ninguna acción** · un número no numérico no advierte |
| Payload rechazado | 10-12 | Lo expone parseado si es objeto JSON · `null` si no es parseable · `null` si es un **array** (un array pasa `typeof === 'object'` y daría `undefined` por fila, en silencio) |
| S3 · historial | 13-17 | Empty state **fuera** de la tabla · pinta filas · descarta las que no son objetos · `[]` si el caso trae algo que no es lista · las columnas declaran las `key` que `TableZ` lee de cada fila |
| Validadores | 18-22 | El tope vive en el control · el mensaje del tope calla hasta el primer intento · los formatos **toleran el vacío** · identificación solo dígitos · fecha `DD/MM/AAAA` |
| FLD-046 · `lstCambios()` | 23-26 | El literal cuando no hubo cambios · `rótulo: antes → ahora (etiqueta del valor nuevo)` · las filas auxiliares se rotulan por **variable** y no por `key` (su key es el literal `'—'`) · `(vacío)` en las dos direcciones |
| ACT-003-01 · reenviar | 27-31 | Vacía el payload · reenvía sin cambios (RUL-003-01 no bloquea) y deja la traza · lleva los bloqueados **con su valor** · lleva el valor corregido de una fila desbloqueada · no envía nada si un formato está roto |
| ACT-003-02 · escalar | 32-34 | **No** vacía el payload · escala aunque un formato esté roto · también lleva los bloqueados con su valor |
| ACT-003-03 · modal | 35-37 | Abre, cierra y **reabre** · el contenido del slot llega al DOM · el log sale del campo que escribe el script de Momento 2 |
| Guardas estructurales | 38-39 | Cada variable del descriptor tiene control en el form · la alerta reemplaza al formulario cuando la tarea no carga |

**Deuda declarada, no escondida:** la **sección del payload no tiene specs de comportamiento**. Nada
asevera hoy las cascadas, el bloqueo/desbloqueo de filas por `disable()`/`enable()`, la traducción del
picker de producto ni la restauración al desmarcar. `fmtPayload()` y `esSenalado()` están exportadas
y marcadas en el código como pendientes de caso — incluido el **piso de 5 caracteres** de
`esSenalado()`, que sin él hace que `id`/`cod` matcheen dentro de cualquier mensaje y **todas** las
filas salgan señaladas: peor que ninguna, porque el gestor pierde la única pista de dónde mirar.

**Nota de infraestructura del spec, porque el porte la estrena.** Este archivo necesita un
`drenarColecciones()` que la ex SCR-011 no necesitaba, y por un motivo concreto: `SeccionCamposPayload`
declara `CatalogosService`/`MatrizMotivosService` en **su propio** `providers`. Corre **dos veces** —en
`montar()` y en el `afterEach`, **antes** de `verify()`— porque el catálogo de municipios se recarga
desde un `effect`, así que **toda** escritura al departamento (incluida la de `precargar()`) dispara un
GET nuevo; un solo drenaje al montar deja ese GET afuera y el `verify()` enrojece el caso hablando de
la colección 15. El orden del `afterEach` es `destroy()` → drenar → `verify()`: destruir dispara la
última ronda de efectos, y `resetTestingModule()` **no** destruye el fixture anterior (el síntoma de
esa fuga es el conteo de `verify()` creciendo caso a caso — `found 1`, `found 2`, …). El conjunto
drenado **no se enumera ni se cuenta** a propósito: se deriva de `SCR003_PAYLOAD_M2_FIELDS` más los
tres `matriz:*`, así que fijar el número enrojecería todo el archivo cada vez que alguien agregue una
fila al descriptor — un cambio que este archivo no vigila (ya lo hacen `catalogos.service.spec.ts` y
`matriz-motivos.service.spec.ts`).

### Registro de la pantalla (tres archivos, los tres obligatorios)

Portar una pantalla son **tres** ediciones, y solo la primera es imposible de olvidar sin darse cuenta:

1. **`app/pantallas.ts`** — la entrada en `DIC_PANTALLAS` con el slug real de PM4 y su
   `loadComponent`. Sin esto la pantalla **no existe** para el router.
2. **`app/pantallas.spec.ts`** — el slug en `CLL_SLUGS_CON_SPEC`. Si falta, la guarda de inventario se
   pone roja **nombrando el slug**.
3. **`components/fields/paridad-react.spec.ts`** — la exención de paridad, cuando la pantalla monta
   campos que el extractor de React no puede resolver estáticamente (§12.6).

Las dos últimas **se auto-vigilan**, y por el mismo mecanismo: las dos recorren `DIC_PANTALLAS`. La
única omisión que **no enrojece nada** es la **primera**, justamente porque sin ella la pantalla no
está en el registro que las otras dos recorren, y ninguna de las dos guardas tiene forma de saber que
faltaba registrar algo. De ahí el orden de esta lista.
