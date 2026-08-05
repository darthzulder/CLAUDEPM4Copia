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
| Archivos de implementación | `CorreccionErrorFuncional.tsx` + `SeccionCamposPayload.tsx` (config centralizada en `fields/fields.ts`; cascada del motivo en `fields/useMatrizMotivos.ts`) |
| Versión | 2.0 — 2026-08-04 (editor del payload de Momento 2) · 1.0 — 2026-06-30 |

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
| Código de Error SFC / HTTP | `qd_strSfcErrorCode` | `qd_strHttpCode` | `ZdsInput` readOnly | FLD-040 / script M2 |
| Tipo de Error | `qd_strErrorType` | — | `ZdsInput` readOnly | script M2 (`sfcClasificarError`) |
| Intento N.° actual (M1/M2) | `qd_strM1M2AttemptNum` | `qd_strAttemptNum` | `ZdsInput` readOnly | FLD-044 / script M2 |
| Endpoint Invocado | `qd_strEndpointCalled` | — | `ZdsInput` readOnly | script M2 |
| Mensaje de Error SFC | `qd_strSfcErrorMessage` | `qd_strApiTechMessage` | `ZdsTextarea` readOnly | FLD-043 / script M2 |
| Payload Enviado (JSON) | `qd_strPayloadSent` | — | `ZdsTextarea` readOnly (igual que SCR-004) | FLD-054 |
| Log técnico completo (modal) | `qd_strCompleteLogAPI` | — | `ZdsTextarea` readOnly | script M2 |

> **Campos retirados de la UI** (ningún script los emite, salían siempre vacíos):
> `qd_strAffectedField` (FLD-041), `qd_strRejectedValue` (FLD-042) y `qd_strRejectionDate`
> (FLD-045). Las variables siguen en el formulario: si el caso las trae, `qd_strAffectedField`
> alimenta la píldora "Señalado por la SFC" de S2 y las tres viajan en el `completeTask`. La
> fecha/hora del rechazo consta en el log completo (`timestamp` de `_sfc_respons_logs`).
>
> El **Payload Enviado** se muestra en S1 en solo lectura (a diferencia de SCR-004, donde es
> editable): en SCR-003 la corrección se hace campo por campo en S2 y el body se regenera.

### S2 — Campos a Corregir (SEC-009, editable) — editor del payload de Momento 2

Una fila por clave del body que arma `buildBodyMomento2()`, en el mismo orden. Cada fila
muestra la clave del body, la variable del caso y el valor actual; el control se habilita solo
al marcar su checkbox **"Editar"** (al desmarcarlo se restaura el valor original). Descriptor
único: `SCR003_PAYLOAD_M2_FIELDS` en `fields/fields.ts`.

| Clave del body | Variable | Control | Catálogo PM4 |
|---|---|---|---|
| `tipo_entidad`, `entidad_cod`, `codigo_queja` | — | solo lectura (sin checkbox) | constantes del CORE / derivado del caso BPM |
| `codigo_pais` | `qd_strCountryCode` | `ZdsSelect` | 13 · `countryCode` |
| `departamento_cod` | `qd_strDepartment` | `ZdsSelect` | 14 · `department` |
| `municipio_cod` | `qd_strCity` | `ZdsSelect` | 15 · `city` (filtrado por departamento) |
| `canal_cod` | `qd_strChannel` | `ZdsSelect` | 10 · `channel` |
| `producto_cod` | `qd_strSfcProduct` | `ZdsSelect` con values de UI desambiguados | 16 · `sfcProduct` |
| — (auxiliar) | `qd_strInteraction` | `ZdsSelect` | 45 · `cat_matriz_motivos` (momento) |
| — (auxiliar) | `qd_strServiceProvided` | `ZdsSelect` | 45 · solo si el momento es "Asistencias" |
| `macro_motivo_cod` | `qd_strSfcReason` | `ZdsSelect` | 45 · cascada producto → momento → (servicio) → motivo |
| `fecha_creacion` | `qd_strFilingDate` | `ZdsInput` con validación `DD/MM/AAAA` | — |
| `nombres` | `qd_strCompanyName` · `qd_strFirstName` · `qd_strLastName` | `ZdsInput` (3 filas) | — (razón social tiene precedencia, ver `sfcNombres`) |
| `tipo_id_CF` | `qd_strIdType` | `ZdsSelect` | 11 · `idType` |
| `numero_id_CF` | `qd_strIdNumber` | `ZdsInput` (solo dígitos) | — |
| `tipo_persona` | `qd_strPersonType` | `ZdsSelect` | 12 · `personType` |
| `insta_recepcion` | `qd_strReceptionInstance` | `ZdsSelect` | 19 · `receptionInstance` |
| `punto_recepcion` | `qd_strReceptionPoint` | `ZdsSelect` | 20 · `receptionPoint` |
| `admision` | `qd_strAdmission` | `ZdsSelect` | 21 · `admission` |
| `texto_queja` | `qd_strComplaintText` | `ZdsTextarea` | — |
| `anexo_queja` | `qd_strFinalReplyAttach` | `ZdsRadio` SÍ/NO | — (el script lo envía como booleano) |
| `ente_control` | `qd_strControlEntity` | `ZdsSelect` | 22 · `controlEntity` |

Cada campo de catálogo guarda el **código** y sincroniza su compañera `<campo>_desc`
(`useSyncDesc`), según la convención del proyecto.

### S2b — Justificación (SEC-009, editable)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Justificación de la corrección | `qd_strCorrectionJustif` | `ZdsTextarea` (máx. 2000) | No | Anexo02 > SCR-003 > FLD-047 |
| Campos modificados (auto) | `qd_strFieldCorrection` | derivado, sin control visible | — | FLD-046 (ver §10) |

### S3 — Historial de Intentos (SEC-010, solo lectura)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Historial de intentos anteriores | `qd_lstAttemptHistory` | Tabla `ZrTable` (Intento \| Fecha \| Campo afectado \| Código error) | No | Anexo02 > SCR-003 > FLD-048 |

### Metadato de flujo (no visible)

| Campo | Variable | Tipo | Fuente |
|---|---|---|---|
| Acción/decisión BPMN | `qd_strAction` | `'CORREGIR_REENVIAR' \| 'ESCALAR_SOPORTE'` | Inferido de ACT-003-01 / ACT-003-02 (ver §10) |
| Payload del reenvío (se vacía al corregir) | `qd_strPayloadSent` | `''` al reenviar | Regla de `opMomento2` (ver §7) |
| Flag de ajuste de payload | `qd_strPayloadAdjustNeeded` | `'NO'` al reenviar | FLD-058 (compartido con SCR-004) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Formato de `fecha_creacion` | `validate` tolerante con vacío: `DD/MM/AAAA` (lo que espera `sfcFechaIso`) | Script M2 (`sfcFechaIso`) |
| `numero_id_CF` solo dígitos | `validate` tolerante con vacío: `^\d+$` | Anexo02 (formato de identificación) |
| Valor de catálogo válido | Los campos de colección solo aceptan opciones del catálogo (`ZdsSelect`) → no se puede escribir un código fuera de catálogo | Lineamiento 🟢 (Matrices > 2. Directrices fila 30) |
| Coherencia de la cascada | Al cambiar producto/momento/servicio, el valor aguas abajo que ya no existe en las opciones se limpia y su fila queda marcada como editable | Derivado de `cat_matriz_motivos` (igual que SCR-000/0051) |
| Coherencia departamento → municipio | Al cambiar el departamento se recarga el catálogo de municipios y se limpia el municipio si no pertenece | Colección 15 (`dependsOn: qd_strDepartment`) |
| Sugerencia por múltiples intentos | Si el intento (`qd_strM1M2AttemptNum` ó `qd_strAttemptNum`) `>= 3` (`UMBRAL_INTENTOS`) se muestra alerta sugiriendo escalar | Anexo02 > SCR-003 > RUL-003-02 |
| Justificación máx. 2000 caracteres | `maxLength={2000}` en textarea | Suposición (límite estándar del proyecto; ver §10) |
| ~~Campo de corrección obligatorio~~ | **Retirada**: `qd_strFieldCorrection` ya no es un input manual (se autocompleta, ver §10) | — |
| ~~Bloqueo por campo no modificado~~ | **Retirada**: el reenvío ya no se bloquea (decisión de negocio, ver §7) | — |

---

## 6. Mensajes de Error

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-003-01 "Sin corrección" | El campo señalado no fue modificado | **Retirado como bloqueo** (ver §7). En su lugar, S2 muestra una alerta informativa permanente que explica el checkbox "Editar" y que el body se regenera | Anexo02 > 06_Mensajes > MSG-003-01 |
| MSG-003-02 "Múltiples intentos" | Intento `>= 3` | `ZrAlert config="alert"` en S1 | Anexo02 > 06_Mensajes > MSG-003-02 |
| MSG-003-03 "Reenvío iniciado" | Tras reenviar con éxito | **No implementado en UI** — lo emite el BPM al avanzar a SP1-T02 tras `completeTask`. Ver §10 | Anexo02 > 06_Mensajes > MSG-003-03 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-003-01 (🔴 BLOQUEA) — no reenviar si el campo no fue modificado | **No se implementa como bloqueo** (decisión de negocio 2026-08-04): un 400 funcional puede resolverse sin cambiar datos (p.ej. duplicado ya cerrado en la SFC), así que el botón "Corregir y Reenviar" está siempre habilitado. La trazabilidad se conserva en `qd_strFieldCorrection`, que registra los campos modificados o "Reenvío sin cambios en el payload" | Anexo02 > SCR-003 > RUL-003-01 · Matrices > 2. Directrices fila 29 (🔴 Restricción) |
| **Regeneración del body (nueva)** | Al reenviar se envía `qd_strPayloadSent = ''` y `qd_strPayloadAdjustNeeded = 'NO'`. `opMomento2` compara el body regenerado contra `qd_strPayloadSent`: si difieren envía **la variable**, así que dejar el payload viejo haría que las correcciones se descartaran y se reenviara el body anterior | `Solo Momento 2.php` > `opMomento2` / `sfcPayloadEditado` |
| RUL-003-02 (info) — sugerir escalamiento si el intento `>= 3` | Alerta de advertencia condicional en S1 (`blnMultipleAttempts`) | Anexo02 > SCR-003 > RUL-003-02 |
| Lineamiento 🟢 — validar campos/formatos que causaron el rechazo antes de ajustar | Cubierto: los campos de catálogo solo aceptan valores válidos, fecha e identificación se validan por formato, y las filas que la SFC señala se marcan con una píldora "Señalado por la SFC" | Matrices > 2. Directrices fila 30 (🟢 Lineamiento) |
| Sin reclasificación del caso | Cambiar el motivo **no** recalcula SLA (`qd_strSlaAssigned`) ni rol responsable (`qd_strResponsableRole`) ni los regulatorios derivados — misma decisión de negocio que SCR-0051 | Ver §10 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Panel de error con acento rojo | `FormSection color="var(--z-red)"` (igual que SCR-004) | Anexo02 > SCR-003 > tipo "Panel de error" |
| Banner de error 400 funcional | `ZrAlert config="negative"` con el número de intento | Anexo02 > SCR-003 (contexto/criterio de aceptación) |
| "Ver Log Completo" abre modal | `ACT-003-03`: `ZrButton config="link"` → `ZrModal` (`.modal-wide` + `.modal-scroll-body`) con `qd_strCompleteLogAPI` — mismo patrón que SCR-004 | Anexo02 > SCR-003 > ACT-003-03 |
| Edición bajo checkbox | Cada fila del payload trae un `ZrCheckbox` "Editar" (estado local de UI, **no** viaja a PM4): desmarcado ⇒ `readOnly`/`disabled`; al desmarcar se restaura el valor original de `task.data` | Requerimiento 2026-08-04 |
| Desbloqueo en cascada | Marcar "Editar" en departamento o producto deja editables las filas dependientes (municipio / momento / servicio / motivo) | Derivado de las dependencias de catálogo |
| Píldoras por fila | `ZdsStatusBadge` "Modificado" (valor ≠ original) y "Señalado por la SFC" (la clave del body o su token aparece en `qd_strAffectedField` / el mensaje de error) | Patrón del proyecto |
| Contexto por fila | Bajo cada control, `.field-hint` con la clave del body, la variable `qd_*`, el valor actual (descripción del catálogo) y el original si cambió | Requerimiento 2026-08-04 |
| Layout sin CSS nuevo | `form-row cols-2 row-align-bottom` (control \| checkbox) dentro de `z-flex="col:150"`; tipografías `.info-bar-label` / `.field-hint` | CLAUDE.md (jerarquía de UI) |
| Historial vacío | Fila `.record-empty` "Sin intentos anteriores registrados" | Patrón del proyecto (shared.css) |
| Estados loading/error/submitting | `ZrLoader`, `ZrAlert`, botones con `loading`/`disabled` desde `useTask()` | CLAUDE.md (convención) |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strDepartment` | `qd_strCity` | Recarga el catálogo de municipios (PMQL por departamento) y limpia el municipio si queda fuera de la lista | Colección 15 |
| `qd_strSfcProduct` | `qd_strInteraction` → `qd_strServiceProvided` → `qd_strSfcReason` | Cascada `cat_matriz_motivos` (45): cada eslabón filtra el siguiente; el valor que queda fuera de opciones se limpia y su fila queda editable | `fields/useMatrizMotivos.ts` (misma lógica que SCR-000/0051) |
| `qd_strInteraction` | `qd_strServiceProvided` | El servicio solo aplica cuando el momento es "Asistencias"; fuera de ese caso se limpia | Anexo02 #31 |
| `qd_strCompanyName` | `qd_strFirstName` / `qd_strLastName` | Si la razón social tiene valor, el script envía solo ella como `nombres` e ignora nombre+apellido | Script M2 (`sfcNombres`) |
| Todos los campos del payload | `qd_strFieldCorrection` | Se autocompleta con el resumen `clave: original → nuevo (descripción)` de cada campo modificado | FLD-046 (ver §10) |
| Todos los campos del payload | `qd_strPayloadSent` | Al reenviar se vacía para forzar la regeneración del body en Momento 2 | §7 |
| Cualquier campo de catálogo | `<campo>_desc` | `useSyncDesc` mantiene la descripción legible en la variable compañera | CLAUDE.md (convención `_desc`) |
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
  consume SCR-004. Se verificó contra el `task.data` real de un rechazo 400 (caso BPM 216):
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
  contrario, se replicaría el `useEffect` de re-derivación de SCR-0051.
- **Fecha en `DD/MM/AAAA` y no `ZdsDate`.** `qd_strFilingDate` viaja como texto DD/MM/AAAA y
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
reenviar, `maxLength` 2000/4000, render del historial como tabla `ZrTable`, mapa payload→variable
derivado del script PHP (no del Anexo02), y la píldora "Señalado por la SFC" (heurística sobre el
texto del error).
