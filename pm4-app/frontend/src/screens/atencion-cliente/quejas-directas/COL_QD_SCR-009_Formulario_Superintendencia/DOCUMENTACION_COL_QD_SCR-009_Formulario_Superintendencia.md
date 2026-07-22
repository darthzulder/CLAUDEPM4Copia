# Documentación Funcional — Formulario Superintendencia

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-009** / PAN-09 — Formulario Superintendencia (F.1000-166 / Formato 411) |
| Tipo | Formulario regulatorio SFC |
| Tarea BPMN | **SP2-T07** — Diligenciar formulario Superintendencia |
| Proceso | SP2 — Gestionar Respuesta Interna y Revisión SAC |
| Rol responsable | Analista SAC (VER+EDITAR) · Líder SAC (VER) · Control SLA (INFORMADO) |
| Evento de apertura | Respuesta aprobada + PDF generado (SP2-T06) |
| Acción de cierre | Guardar Formulario → habilita SP3 (PAN-10) |
| Slug / `?screen=` | `COL_QD_SCR-009_Formulario_Superintendencia` |
| Archivos de implementación | `FormularioSuperintendencia.tsx`, `SeccionFraudeAnexos.tsx` (config centralizada en fields/fields.ts) |
| Versión | 1.0 — 2026-06-30 |

---

## 2. Resumen

Formulario regulatorio que **revisa** el Analista SAC tras aprobarse la respuesta y generarse el
PDF. **Alineado con el Excel `Formulario PQRS - Proyecto V3.0.xlsx`, los campos regulatorios los
calcula el back** ("Back"/"Automático"/"Por default"): sexo, LGBTIQ+, producto digital y toda la
Condición de la Queja (estado, favorabilidad, aceptación, rectificación, desistimiento, tutela,
marcación, queja exprés), además de fraude (CE-019/2024) y prórroga. Todos se muestran en **solo
lectura** (label del catálogo). Los **únicos campos editables** son **Condición Especial** (Front,
obligatorio SFC) y los **dos indicadores de anexos**; el guardado se bloquea hasta completarlos.
Los datos de clasificación de M1 viajan en el payload sin UI. Al guardar se habilita el subproceso
SP3 de cierre regulatorio.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-009.md` | Campos (FLD-140..166), acciones (ACT-009-*), reglas (RUL-009-*), mensajes (MSG-009-*), permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-028..032 (incl. S4 condicional) |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-009-01..04 |
| Anexo02 (índice .md) | `masters/07_Catalogs.md` | CAT-SEXO, LGBTIQ, COND-ESP, PROD-DIGITAL, ESTADO-QUEJA, FAVORAB, ACEPTACION, RECTIF, DESIST, TUTELA, MARCACION, EXPRES, TIPO-FRAUDE, MOD-FRAUDE (estado/ejemplos) |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP2-T07 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP2-T07 es tarea de Usuario → sin variables canónicas |

---

## 4. Campos Implementados

### S1 — Datos Precargados M1 (SEC-028, RUL-009-02) — sin UI propia

`qd_strSfcCode`, `qd_strChannel`, `qd_strSfcProduct`, `qd_strSfcReason`, `qd_strAdmission` y
`qd_strControlEntity` (FLD-140..145) ya llegan pre-cargados en `task.data` desde SCR-000 y viajan
en el `payload` del formulario (vía `reset()`), pero **no se renderizan** en esta pantalla: son
datos de clasificación de M1 que el usuario ya vio en pantallas previas y no aportan valor
mostrarlos de nuevo como solo lectura aquí. Se removió el bloque `ZdsInput readOnly` de S1.

### S2 — Datos del Consumidor — Campos SFC (SEC-029)

| Campo (UI) | Variable | Presentación | Origen |
|---|---|---|---|
| Sexo | `qd_strSex` | label resuelto (info-bar) | 🔴 Back, default "No aplica" (Excel #21) |
| LGBTIQ+ | `qd_strLgbtiq` | label resuelto (info-bar) | 🔴 Back, default "No aplica" (Excel #22) |
| Producto Digital | `qd_strDigitalProduct` | label resuelto (info-bar) | 🔴 Back, default "No" (Excel #54) |
| **Condición Especial** | `qd_strSpecialCondition` | `ZdsSelect` (editable, requerido) | 🟢 **Front, obligatorio SFC** (Excel #23/#26) |

### S3 — Condición de la Queja (SEC-030) — todos solo lectura (Back)

| Campo (UI) | Variable | Presentación | Origen (Back) |
|---|---|---|---|
| Estado de la Queja o Reclamo | `qd_strComplaintStatus` | label resuelto (info-bar) | MomentoIII "Automático" |
| Favorabilidad | `qd_strFavorability` | label resuelto (info-bar) | Derivada de `qd_strReplyFavorOf`: Cliente→1, Compañía→3 |
| Aceptación | `qd_strAcceptance` | label resuelto (info-bar) | Default "1" (Excel #51) |
| Rectificación | `qd_strRectification` | label resuelto (info-bar) | Default 1, solo si Defensor (Excel #52) |
| Desistimiento | `qd_strWithdrawal` | label resuelto (info-bar) | Default 2 (Excel #53) |
| Tutela | `qd_strTutela` | label resuelto (info-bar) | Default "No" (Excel #37) |
| Marcación | `qd_strMarking` | label resuelto (info-bar) | Back (Excel #56) |
| Queja Exprés | `qd_strExpressComplaint` | label resuelto (info-bar) | Back, default (Excel #38/#41) |

> Los códigos se muestran como **descripción** del catálogo (`useCollection` + helper `descOpt()`) pero **conservan el código** que espera el BPM/SFC; se reenvían intactos vía `reset()` al guardar.

#### Defaults "Back" garantizados al llegar a SCR-009

Los campos marcados con valor por default en el Excel deben **existir y estar llenos** al abrir SCR-009. El front lo garantiza (`SCR009_BACK_DEFAULTS` en `fields.ts` + relleno en el `useEffect`): si el proceso no trae el valor o lo manda vacío, se rellena con su default marcado antes de renderizar/guardar.

| Campo | Default (código) | Fuente |
|---|---|---|
| Aceptación (`qd_strAcceptance`) | `1` | Excel #51 · Lista_Aceptación |
| Rectificación (`qd_strRectification`) | `1` | Excel #52 · Lista_Rectificación |
| Desistimiento (`qd_strWithdrawal`) | `2` | Excel #53 · Lista_Desistimiento |
| Producto Digital (`qd_strDigitalProduct`) | `No` ⚠ provisional | Excel #54 (código de catálogo a confirmar con TI) |

> **Producto Digital** se rellena con `"No"` **provisionalmente**: el default de negocio es "No" (Excel #54) pero el código exacto de catálogo (colección PM4 id 25) no está confirmado con TI. Confirmar el código real y reemplazar el literal `'No'` si difiere.

> **Pendientes de código de catálogo (los llena el back, NO el front):** Sexo ("No aplica"), LGBTIQ+ ("No aplica"), Tutela ("No") y Ente de Control ("Otros"). El Excel `Homologación SFC` los marca "Es requerida su creación / No existe": su código no está confirmado con TI, y hard-codearlo arriesgaría un envío inválido a la SFC. El back debe poblarlos con el código correcto antes de M3.

### S4 — Datos de Fraude CE-019-2024 (SEC-031, condicional) — solo lectura (Back)

| Campo (UI) | Variable | Presentación | Origen (Back) |
|---|---|---|---|
| ¿Relacionada con Fraude? | `qd_strFraudRelated` | valor Sí/No (info-bar) | Back (depende del cierre, Excel #57/#60) |
| Tipo de Fraude | `qd_strFraudType` | label resuelto (info-bar) | Back (Excel #57) |
| Modalidad de Fraude | `qd_strFraudModality` | label resuelto (info-bar) | Back, lo fija el responsable si cierre=fraude (Excel #58/#61) |
| Monto Reclamado (COP) | `qd_strClaimedAmount` | valor (info-bar) | Back |
| Monto Reconocido (COP) | `qd_strAcknowledgedAmount` | valor (info-bar) | Back |

### S5 — Anexos del Formulario (SEC-032)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| **¿Incluye Anexos a la Queja?** | `qd_strIncludesComplaintAnnex` | `ZdsRadio` inline (editable) | **Sí** | FLD-163 |
| **¿Incluye Adjunto Respuesta Final?** | `qd_strIncludesReplyAttach` | `ZdsRadio` inline (editable) | **Sí** | FLD-164 |
| PDF Respuesta Final (generado) | `qd_strFinalReplyPdf` | `RequestFileList` (previsualizar + descargar) | No | FLD-165 |
| Prórroga (días, si aplica) | `qd_strExtensionDays` | solo lectura (info-bar) | 🔴 Back, automático (Excel #55) | FLD-166 |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_strAction` (`GUARDAR` \| `GUARDAR_BORRADOR`) | Inferido de ACT-009-01/02 (§10) |

---

## 5. Validaciones Implementadas

Los campos regulatorios ya no se validan en front (son Back, solo lectura). Solo se valida lo editable.

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Condición Especial + anexos completos | `blnCanSave = blnSpecialCondOk && blnAnnexesComplete`; botón "Guardar Formulario" deshabilitado si falta alguno; alerta MSG-009-02 | Excel #23/#26 · FLD-163/164 |
| ~~Campos SFC obligatorios (12 selects)~~ | **Eliminada** — son Back, solo lectura | — |
| ~~Campos de fraude obligatorios~~ | **Eliminada** — fraude es Back, solo lectura | — |
| ~~Montos/prórroga solo dígitos~~ | **Eliminada** — solo lectura | — |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| ~~MSG-009-01 Campos fraude obligatorios~~ | — | **Eliminado** — fraude es solo lectura | 06_Mensajes > MSG-009-01 |
| MSG-009-02 Editables incompletos | Falta Condición Especial o anexos | `ZrAlert config="info"` + "Guardar" disabled | 06_Mensajes > MSG-009-02 |
| MSG-009-03 Formulario guardado | Tras guardar | **No en UI** — lo emite el BPM tras `completeTask` | 06_Mensajes > MSG-009-03 |
| ~~MSG-009-04 LGBTIQ+ pendiente~~ | — | **Eliminado** — LGBTIQ+ ahora es solo lectura (Back) | 06_Mensajes > MSG-009-04 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-009-01 — fraude | **Reinterpretada:** fraude es Back → solo lectura, se muestra si `qd_strFraudRelated='SI'` (sin validación de captura) | Excel PQRS V3.0 #57/#58 |
| RUL-009-02 (info) — precargar M1 no editable | Datos M1 viajan en el `payload` (`reset()`) sin renderizarse en UI (ya vistos en pantallas previas desde SCR-000) | SCR-009 > RUL-009-02 |
| RUL-009-03 — bloquear guardar | `blnCanSave` deshabilita el botón hasta completar Condición Especial + anexos + alerta MSG-009-02 | Excel #23/#26 · FLD-163/164 |

> **Regla de negocio confirmada (cálculo del back):** favorabilidad `qd_strReplyFavorOf → qd_strFavorability`: **Cliente → "1"**, **Compañía → "3"**. Mismo mapeo que SCR-010; debe resolverlo el back.

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Precarga M1 sin UI (ya vista en SCR-000) | No se renderiza S1; los valores viajan en el `payload` vía `reset()` | SEC-028 · RUL-009-02 |
| Campos regulatorios solo lectura | Pares label/valor (`Ro` + `descOpt`) en grids `cols-2`/`cols-3`; conservan el código en el payload | Excel PQRS V3.0 sección "Cierre" |
| Único select editable | Condición Especial (`ZdsSelect` requerido) | Excel #23/#26 |
| Sección de fraude condicional (solo lectura) | render por `qd_strFraudRelated='SI'` | SEC-031 |
| Anexos editables | 2 `ZdsRadio` requeridos (`qd_strIncludesComplaintAnnex`, `qd_strIncludesReplyAttach`) | FLD-163/164 |
| Previsualizar/descargar el PDF generado | `RequestFileList` filtra los archivos del request por `data_name=qd_strFinalReplyPdf` | FLD-165 |
| Estados loading/error/submitting | `ZrLoader`, `ZrAlert`, botones `loading/disabled` | CLAUDE.md |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strFraudRelated` | tipo/modalidad/montos de fraude | Muestra y hace obligatorios los campos de fraude si = Sí | RUL-009-01 |
| 12 campos SFC + anexos | Botón "Guardar Formulario" | Habilita guardar solo si todos están completos | RUL-009-03 |
| `qd_strFinalReplyPdf` (id del archivo subido al request) | `RequestFileList` | Se muestra la fila solo si ya existe un archivo con ese `data_name` en el request | FLD-165 |

---

## 10. Suposiciones Realizadas

- **Slug normalizado** a `COL_QD_SCR-009_Formulario_Superintendencia` (con código SCR).
- **Catálogos SFC como OPTIONS estáticas placeholder.** Todos los `CAT-*` de esta pantalla están
  "Pendiente TI" en 07_Catalogs. Se implementaron con los valores de ejemplo del insumo; los que no
  tenían ejemplos (CAT-ACEPTACION, CAT-RECTIF, CAT-DESIST, CAT-MARCACION) usan placeholder Sí/No.
  Deben reemplazarse por los catálogos oficiales / `useCollection` cuando se entreguen.
- **CAT-LGBTIQ ("PENDIENTE CRÍTICO")**: placeholder Sí/No/No informa + advertencia permanente
  MSG-009-04. No transmitir a SFC sin confirmar con TI.
- **Montos y prórroga como `ZdsInput` de texto con `pattern` de dígitos**: la fachada no expone
  `inputType="number"` (solo text/email/tel). Se validan como enteros.
- **PDF (FLD-165)**: `qd_strFinalReplyPdf` deja de tratarse como texto/URL y se interpreta como el
  `data_name` con el que SP2-T06 sube el archivo al request (mismo patrón que `ADJUNTO_KEYS` en
  otras pantallas de Quejas Directas). Se reusa `RequestFileList` (`requestId={task.process_request_id}`,
  `docKeys={[qd_strFinalReplyPdf]}`) para previsualizar y descargar, igual que SCR-008/SCR-0051.
- **`qd_strAction`** (metadato): no es un FLD; se deriva del botón presionado (ACT-009-01/02).
- **MSG-009-03** (éxito) lo emite el BPM tras `completeTask`; no se renderiza en la pantalla.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-140..166) | 27/27 (100%) | Todos implementados |
| Secciones (SEC-028..032) | 5/5 (100%) | S1-S5 (S4 condicional) |
| Acciones (ACT-009-01/02) | 2/2 (100%) | Guardar Formulario, Guardar Borrador |
| Reglas (RUL-009-01/02/03) | 3/3 (100%) | Fraude condicional, precarga M1, bloqueo SFC |
| Mensajes (MSG-009-01..04) | 3/4 en UI | MSG-009-03 lo emite el BPM |
| Catálogos SFC (14) | 14/14 como placeholder | Todos "Pendiente TI" / LGBTIQ crítico |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_strAction`, catálogos estáticos placeholder
(incl. los sin ejemplos), montos como texto con `pattern`, descarga de PDF por URL, orden interno
de S4/S5 en un archivo de sección separado.
