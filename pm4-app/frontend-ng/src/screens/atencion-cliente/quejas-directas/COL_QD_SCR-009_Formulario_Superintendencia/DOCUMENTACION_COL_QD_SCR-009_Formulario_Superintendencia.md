# Documentación Funcional — Formulario Superintendencia

> **Port a Angular 21 (Fase 5, pantalla 8 de 12).** La trazabilidad funcional de las §1–§11 es
> la de la ficha de React, revisada campo por campo contra el anexo durante el port: lo que se
> corrigió va marcado **⚠ corregido en 3.0** con su motivo. La §12 es nueva y documenta el port en
> sí — el mapeo de framework, las mutaciones verificadas y lo que el gate destapó.
>
> **Esta es la pantalla que cierra el caso ante el regulador.** Es la única del proyecto cuyo submit
> tiene consecuencia externa irreversible (dispara el envío M3 a SmartSupervision), y eso gobierna
> varias decisiones de abajo: la confirmación previa, el gate de envío y el sellado de fechas.

---

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-009** / PAN-09 — Formulario Superintendencia (F.1000-166 / Formato 411) |
| Tipo | Formulario regulatorio SFC |
| Tarea BPMN | **SP2-T07** — Diligenciar formulario Superintendencia · **SP3-T01/T04/T08** — Cierre Regulatorio M3 (fusionado) |
| Proceso | SP2 — Gestionar Respuesta Interna y Revisión SAC · SP3 — Cierre Regulatorio |
| Rol responsable | Analista SAC (VER+EDITAR) · Gestor de Experiencia / Backoffice SFC (envío M3) · Líder SAC (VER) · Control SLA (INFORMADO) |
| Evento de apertura | Respuesta aprobada + PDF generado (SP2-T06) |
| Acción de cierre | **Enviar a SmartSupervision** → dispara el cierre M3 a la SFC · Guardar Borrador → no habilita SP3 |
| Slug / `?screen=` | `COL_QD_SCR-009_Formulario_Superintendencia` (alias legacy: `COL_QD_SCR-010_cierre-m3`) |
| Archivos de implementación | `formulario-superintendencia.ts` · `formulario-superintendencia.html` · `seccion-fraude-anexos.ts` / `.html` · `seccion-cierre-envio.ts` / `.html` · `confirmar-envio-modal.ts` · `hoy-bogota.ts` (config centralizada en `../fields/fields.ts`) |
| Especificaciones | `formulario-superintendencia.spec.ts` (44 casos) · `hoy-bogota.spec.ts` (6 casos) |
| Versión | 3.0 — 2026-08-17 (port a Angular 21; 2.0 React con fusión SCR-010, 2026-07-24; 1.0 React) |

> **Fusión SCR-010 → SCR-009 (2026-07-24, heredada del React):** la pantalla de Cierre Regulatorio M3
> (ex `COL_QD_SCR-010_cierre-m3`) se consolidó en esta pantalla. Se migraron sus campos de cierre
> (estado del envío a SFC, intentos, último error, código SFC, fechas de actualización/cierre,
> tipo/código de entidad, adjunto de respuesta final), la sección **Estado del Envío a
> SmartSupervision (SFC)** (`seccion-cierre-envio.*`) y la acción **`ENVIAR_SFC`** (botón "Enviar a
> SmartSupervision" / "Reenviar Cierre (corrección)" si la SFC rechazó). El slug antiguo queda como
> alias para no romper nodos del BPM que aún lo referencien.

---

## 2. Resumen

Formulario regulatorio que **revisa** el Analista SAC tras aprobarse la respuesta y generarse el
PDF. **Alineado con el Excel `Formulario PQRS - Proyecto V3.0.xlsx`, los campos regulatorios los
calcula el back** ("Back"/"Automático"/"Por default"): toda la Condición de la Queja (favorabilidad,
aceptación, rectificación, desistimiento, tutela, queja exprés), además de fraude (CE-019/2024) y
prórroga — se muestran en **solo lectura** (label del catálogo). **Sexo, LGBTIQ+, Producto Digital y
Marcación** llegan precargados y aquí **sí son editables**: un `zds-select` por campo que muestra la
descripción del catálogo pero guarda el código/ID por detrás (su `_desc` compañera viaja sola, sin
input propio), sin bloquear el envío. El único editable **obligatorio incondicional** es **Condición
Especial** (Front, obligatorio SFC); los **dos indicadores de anexos** se pintan bloqueados pero el
gate los sigue mirando, y los **4 campos de fraude** son obligatorios si `qd_strFraudRelated='SI'`.
Los datos de clasificación de M1 viajan en el payload sin UI.

El envío es de **dos fases** —el botón valida y abre un popup; la confirmación es la que completa la
tarea— porque completar cierra el caso ante la SFC y no se puede deshacer.

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

> **Los rótulos se re-copiaron del anexo durante el port**, no de la plantilla de React, y el spec los
> asevera desde su propia tabla (`DIC_ROTULOS_CAMPOS` / `DIC_ROTULOS_ZA` / `CLL_ROTULOS_TEXTO`). Es lo
> que hizo visible la divergencia de FLD-166 (§12.7).

---

## 4. Campos Implementados

### S1 — Datos Precargados M1 (SEC-028, RUL-009-02) — sin UI propia

`qd_strSfcCode`, `qd_strChannel`, `qd_strSfcProduct`, `qd_strSfcReason`, `qd_strAdmission` y
`qd_strControlEntity` (FLD-140..145) ya llegan pre-cargados en `task.data` desde SCR-000 y viajan
en el payload del formulario, pero **no se renderizan** en esta pantalla: son datos de clasificación
de M1 que el usuario ya vio en pantallas previas.

> `qd_strSfcCode` (FLD-140) **sí se muestra**, pero en S7 y como parte del estado del envío ("Código
> SFC / Número de Radicado"), no como campo de S1.

### S2 — Datos del Consumidor — Campos SFC (SEC-029)

| Campo (UI) | Variable | Presentación | Origen |
|---|---|---|---|
| **Sexo** | `qd_strSex` (+ `qd_strSex_desc` compañera, sin campo propio) | `zds-select` (CAT-SEXO, colección 23): muestra la descripción, guarda el código | 🟢 Editable aquí; llega precargado desde SCR-000 (default "No Aplica", Excel #21) |
| **LGBTIQ+** | `qd_strLgbtiq` (+ `qd_strLgbtiq_desc` compañera) | `zds-select` (CAT-LGBTIQ, colección 41) | 🟢 Editable aquí; llega precargado desde SCR-000 (default "No", Excel #22) |
| **Producto Digital** | `qd_strDigitalProduct` (+ `qd_strDigitalProduct_desc` compañera) | `zds-select` (colección 25) | 🟢 Editable aquí; default "No" = código `'2'` (Excel #54) · **⚠ divergencia con el anexo, ver §12.7** |
| **Condición Especial** | `qd_strSpecialCondition` | `zds-select` (editable, requerido) | 🟢 **Front, obligatorio SFC** (Excel #23/#26) |

### S3 — Condición de la Queja (SEC-030) — solo lectura (Back), salvo Marcación

| Campo (UI) | Variable | Presentación | Origen (Back) |
|---|---|---|---|
| ~~Estado de la Queja o Reclamo~~ | `qd_strComplaintStatus` (+ `_desc`) | ⛔ **No se muestra** en la pantalla | Se fuerza a "Cerrada" = código `'4'` en la precarga (colección 42: 1=Recibida, 2=Abierta, 4=Cerrada) y viaja en el payload · **⚠ divergencia, §12.7** |
| Favorabilidad | `qd_strFavorability` | label resuelto (info-bar) | Derivada de `qd_strReplyFavorOf`: Cliente→1, Compañía→3 |
| Aceptación | `qd_strAcceptance` | label resuelto (info-bar) | Default "1" (Excel #51) |
| Rectificación | `qd_strRectification` | label resuelto (info-bar) | Default 1, solo si Defensor (Excel #52) |
| Desistimiento | `qd_strWithdrawal` | label resuelto (info-bar) | Default 2 (Excel #53) |
| Tutela | `qd_strTutela` | label resuelto (info-bar) | Default "No" (Excel #37) |
| **Marcación** | `qd_strMarking` (+ `_desc`) | `zds-select` (colección 31): opción inicial "-" (valor vacío) | 🟢 Editable aquí; sin default (Excel #56) · **⚠ divergencia, §12.7** |
| Queja Exprés | `qd_strExpressComplaint` | label resuelto (info-bar) | Back, default (Excel #38/#41) |

> Los códigos se muestran como **descripción** del catálogo (`CatalogosService` + `descOf()`) pero
> **conservan el código** que espera el BPM/SFC y viajan intactos en el payload.

#### Defaults "Back" garantizados al llegar a SCR-009

Los campos marcados con valor por default en el Excel deben **existir y estar llenos** al abrir
SCR-009. El front lo garantiza (`SCR009_BACK_DEFAULTS` en `fields.ts` + relleno en `precargar()`): si
el proceso no trae el valor o lo manda vacío, se rellena con su default antes de renderizar/guardar.

| Campo | Default (código) | Fuente |
|---|---|---|
| Estado de la Queja (`qd_strComplaintStatus`) | `4` (= "Cerrada") — **forzado siempre**, no solo cuando llega vacío (campo oculto en la UI) | colección 42 |
| Aceptación (`qd_strAcceptance`) | `1` | Excel #51 · Lista_Aceptación |
| Rectificación (`qd_strRectification`) | `1` | Excel #52 · Lista_Rectificación |
| Desistimiento (`qd_strWithdrawal`) | `2` | Excel #53 · Lista_Desistimiento |
| Producto Digital (`qd_strDigitalProduct`) | `2` (= "No") | Excel #54 · colección 25 |

> **La diferencia entre los dos mecanismos es funcional y tiene caso de test.** Los de la tabla se
> escriben **solo si llegaron vacíos** (`if (!dicParche[strClave])`); el Estado de la Queja se
> **pisa siempre**, porque SCR-009 *es* el cierre. El spec lo asevera con un caso cuyo fixture manda
> `'2'` (Abierta) a propósito: con `'4'` de entrada el caso pasaría sin que la precarga hiciera nada.

> **Pendientes de código de catálogo (los llena el back, NO el front):** Tutela ("No") y Ente de
> Control ("Otros"). El Excel `Homologación SFC` los marca "Es requerida su creación / No existe":
> su código no está confirmado con TI, y hard-codearlo arriesgaría un envío inválido a la SFC.

### S4 — Datos de Fraude CE-019-2024 (SEC-031, condicional)

| Campo (UI) | Variable | Presentación | Origen |
|---|---|---|---|
| ¿Relacionada con Fraude? | `qd_strFraudRelated` | valor Sí/No (info-bar) | 🔴 Back (depende del cierre, Excel #60) · FLD-158 |
| Tipo de Fraude | `qd_strFraudType` | `zds-select` (editable) — colección `cat-tipo-fraude` | 🟢 **Front, editable**; obligatorio si fraude=Sí (Excel #57) · FLD-159 |
| Modalidad de Fraude | `qd_strFraudModality` | `zds-select` (editable) — colección `cat-mod-fraude` | 🟢 **Front, editable**; obligatorio si fraude=Sí (Excel #58/#61) · FLD-160 |
| Monto Reclamado (COP) | `qd_strClaimedAmount` | `zds-input` texto (editable) | 🟢 **Front, editable**; obligatorio si fraude=Sí · FLD-161 |
| Monto Reconocido (COP) | `qd_strAcknowledgedAmount` | `zds-input` texto (editable) | 🟢 **Front, editable**; obligatorio si fraude=Sí · FLD-162 |

> Cambio 2026-07-23 (heredado): Tipo/Modalidad de Fraude y los dos montos dejaron de ser "Back" solo
> lectura y pasaron a ser editables por el Analista SAC, alineado con RUL-009-01. Solo
> `qd_strFraudRelated` sigue siendo Back.

### S5 — Anexos del Formulario (SEC-032)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| **¿Incluye Anexos a la Queja?** | `qd_strIncludesComplaintAnnex` | `zds-radio` inline, fijo en "Sí", **bloqueado por opción** | **Sí** (lo mira el gate) | FLD-163 · **⚠ divergencia, §12.7** |
| **¿Incluye Adjunto Respuesta Final?** | `qd_strIncludesReplyAttach` | `zds-radio` inline, fijo en "Sí", **bloqueado por opción** | **Sí** (lo mira el gate) | FLD-164 · **⚠ divergencia, §12.7** |
| PDF Respuesta Final (generado) | `qd_strFinalReplyPdf` | `app-request-file-list` (previsualizar + descargar) | No | FLD-165 |
| Prórroga (Código) | `qd_strSlaDaysProlognated` | solo lectura (texto), default `'1'` | 🔴 Back, automático (Excel #55) | FLD-166 · **⚠ divergencia, §12.7** |

### S6 — Datos de Cierre Regulatorio (fusión ex SCR-010)

| Campo (UI) | Variable | Presentación | Origen |
|---|---|---|---|
| Fecha de Actualización | `qd_strUpdateDate` | `zds-input` `readOnly` | Sellada por el front en la precarga (§12.4) |
| Fecha de Cierre | `qd_strClosureDate` | `zds-input` `readOnly` | Sellada por el front, **mismo instante** que la anterior |

### S7 — Estado del Envío a SmartSupervision (SFC) (fusión ex SCR-010)

| Campo (UI) | Variable | Presentación | Origen |
|---|---|---|---|
| Estado del envío a SFC | `qd_strM3ClosureStatus` | par label/valor (info-bar); `'Pendiente'` si vacío | Back (lo escribe el script de envío M3) |
| Intentos de envío | `qd_strM3ClosureAttempts` | par label/valor (info-bar) | Back |
| Código SFC / Número de Radicado | `qd_strSfcCode` | `zds-input` `readOnly` | Back / M1 (FLD-140) |
| Último error registrado | `qd_strLastError` | bloque de texto, **solo si hay error** | Back |
| Alerta de rechazo | — | `za-alert config="negative"` "Envío rechazado por SFC", solo si el estado es exactamente `'Rechazado (400)'` | Derivado |
| Tipo / Código de entidad | `qd_strEntityType` / `qd_strEntityCode` | sin UI, viajan en el payload | Defaults `'13'` / `'9'` |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_strAction` (`ENVIAR_SFC` \| `GUARDAR_BORRADOR`; default `'GUARDAR'`) | ACT-009-01/02 (§10) · **⚠ divergencia, §12.7** |

---

## 5. Validaciones Implementadas

Los campos regulatorios ya no se validan en front (son Back, solo lectura). Solo se valida lo editable.

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Condición Especial + anexos + fraude completos | `blnPuedeEnviar() = blnCondEspecialOk() && blnAnexosCompletos() && blnFraudeCompleto()`; botón de envío deshabilitado si falta alguno; alerta MSG-009-02 | Excel #23/#26 · FLD-163/164 · RUL-009-01 |
| Condición Especial obligatoria | `Validators.required` en el `FormControl`, y el error se pinta **recién tras el primer intento** (`blnIntentoEnvio`) | Excel #23/#26 |
| Tipo/Modalidad/Montos de fraude obligatorios si `qd_strFraudRelated='SI'` | Los cuatro entran en `blnFraudeCompleto()`, que es una mitad del gate | RUL-009-01 / MSG-009-01 |
| ~~Campos SFC obligatorios (12 selects)~~ | **Eliminada** — son Back, solo lectura | — |
| ~~Prórroga solo dígitos~~ | **Eliminada** — solo lectura | — |

> **`blnPuedeEnviar()` se deriva de `sigValores()`, nunca de `form.valid`.** `valid` es un *getter* de
> `FormGroup`, así que leerlo dentro de un `computed()` **no crea dependencia** y el gate quedaría
> congelado en su primer valor. Misma regla y mismo motivo que en SCR-0052.
>
> **La guarda vive en `solicitarEnvio()`, no solo en el `[disabled]` del botón.** Bajo jsdom un
> componente del DS deshabilitado **igual invoca su handler** (trampa 1 de `testing-conventions.md`),
> así que sin el corte en el método se podría abrir el popup —y desde ahí enviar— con el formulario
> incompleto. Tiene caso de test.

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-009-01 Campos fraude obligatorios | Falta tipo/modalidad/monto con fraude=Sí | Los cuatro entran en el gate; el aviso de bloqueo nombra "datos de fraude" cuando aplica | 06_Mensajes > MSG-009-01 |
| MSG-009-02 Editables incompletos | Falta Condición Especial, anexos o (si aplica) datos de fraude | `za-alert config="info"` **hijo directo del `<form>`** + botón de envío disabled | 06_Mensajes > MSG-009-02 |
| MSG-009-03 Formulario guardado | Tras enviar | **No en UI** — lo emite el BPM tras completar la tarea | 06_Mensajes > MSG-009-03 |
| ~~MSG-009-04 LGBTIQ+ pendiente~~ | — | **Eliminado** — el anexo lo marca obsoleto: LGBTIQ+ se resuelve contra CAT-LGBTIQ (colección 41) | 06_Mensajes > MSG-009-04 |
| Error de carga | La tarea no responde | Reemplaza el formulario entero ("Error al cargar el formulario") | CLAUDE.md |
| Error de envío | PM4 rechaza el PUT | Se muestra y **no se traga**: si la tarea no se completó, el gestor tiene que saberlo | CLAUDE.md |

> **El aviso de MSG-009-02 se explica de forma permanente mientras el gate esté cerrado**, no solo al
> intentar enviar: es lo que hace que un botón deshabilitado tenga explicación. El error **por campo**
> de Condición Especial, en cambio, aparece recién tras el primer intento (equivalente del
> `isSubmitted` de react-hook-form).

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-009-01 — fraude | Tipo/Modalidad/Montos editables y obligatorios cuando `qd_strFraudRelated='SI'`; `qd_strFraudRelated` sigue siendo Back | Excel PQRS V3.0 #57/#58 |
| RUL-009-02 (info) — precargar M1 no editable | Datos M1 viajan en el payload sin renderizarse (ya vistos desde SCR-000) | SCR-009 > RUL-009-02 |
| RUL-009-03 — bloquear el envío | `blnPuedeEnviar()` deshabilita el botón hasta completar Condición Especial + anexos (+ fraude si aplica) y pinta MSG-009-02 | Excel #23/#26 · FLD-163/164 |

> **Regla de negocio confirmada (cálculo del back):** favorabilidad `qd_strReplyFavorOf →
> qd_strFavorability`: **Cliente → "1"**, **Compañía → "3"**. Debe resolverlo el back.

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Precarga M1 sin UI (ya vista en SCR-000) | No se renderiza S1; los valores viajan en el payload | SEC-028 · RUL-009-02 |
| Campos regulatorios solo lectura (S3) | Pares label/valor con la descripción del catálogo; conservan el código en el payload | Excel PQRS V3.0 sección "Cierre" |
| Selects editables | Sexo, LGBTIQ+, Producto Digital, Marcación y Condición Especial (esta última requerida) | Excel #21/#22/#23/#54/#56 |
| Sección de fraude condicional | Los 4 campos se piden solo si `qd_strFraudRelated='SI'`; el indicador es solo lectura | SEC-031 |
| Anexos fijos en "Sí" | 2 `zds-radio` con `disabled` **por opción** y valor `'SI'`; el valor sigue viajando y sigue alimentando el gate (§12.2) | FLD-163/164 |
| Previsualizar/descargar el PDF generado | `app-request-file-list` filtra los archivos del request por `data_name=qd_strFinalReplyPdf` | FLD-165 |
| **Envío en dos fases** | El botón valida y abre `app-confirmar-envio-modal`; la confirmación es la que completa la tarea | ACT-009-01 |
| Rótulo del botón según el estado | "Enviar a SmartSupervision ▶" / "Reenviar Cierre (corrección) ▶" si la SFC rechazó | S7 |
| Guardar Borrador redirige a la bandeja | Y **solo si el guardado salió bien**: redirigir tras un fallo perdería lo escrito sin avisar | ACT-009-02 |
| Estados loading/error/submitting | Loader del DS, `za-alert`, botones `loading/disabled` | CLAUDE.md |

> **"Guardar Borrador" no mira `blnPuedeEnviar()`**, a propósito: el anexo lo marca "Siempre". Si
> compartiera el gate del envío, el gestor perdería lo escrito justo cuando más lo necesita.
>
> **El modal se monta siempre y el `@if` va adentro de su slot.** `lib-modal-z` indexa su contenido
> una única vez en `ngAfterContentInit`; si naciera detrás de un `@if`, al abrirse ya perdió la
> oportunidad de leer el slot y abriría **vacío**. Las tres trampas están en la cabecera de
> `confirmar-envio-modal.ts`.

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strFraudRelated` | tipo/modalidad/montos de fraude | Hace obligatorios (y visibles) los 4 campos si = Sí | RUL-009-01 |
| Condición Especial + anexos + fraude | Botón de envío | Habilita el envío solo si están completos | RUL-009-03 |
| `qd_strFinalReplyPdf` (id del archivo del request) | `app-request-file-list` | Se muestra la fila solo si ya existe un archivo con ese `data_name` | FLD-165 |
| `qd_strM3ClosureStatus` | rótulo del botón · alerta de rechazo · "Último error" | `'Rechazado (400)'` (literal exacto) cambia el rótulo y pinta la alerta | S7 |
| `qd_strFraudType` / `qd_strFraudModality` | sus `_desc` compañeras | `sincronizarDesc()` escribe la descripción cuando responde el catálogo | Convención `_desc` |

---

## 10. Suposiciones Realizadas

- **Slug normalizado** a `COL_QD_SCR-009_Formulario_Superintendencia` (con código SCR).
- **⚠ corregido en 3.0 — los catálogos SFC NO son placeholders estáticos.** La ficha de React (§10/§11)
  decía *"Catálogos SFC como OPTIONS estáticas placeholder … Deben reemplazarse por los catálogos
  oficiales / `useCollection` cuando se entreguen"*, y también que CAT-LGBTIQ era un *"PENDIENTE
  CRÍTICO"* con placeholder Sí/No y advertencia permanente MSG-009-04. **Ninguna de las dos cosas
  describe el código**: la pantalla carga **12 colecciones reales** de PM4 vía `CatalogosService`
  (`CLL_CATALOGOS`), y el propio anexo marca MSG-009-04 como *"(Obsoleto/eliminado) LGBTIQ+ ya no está
  pendiente: se resuelve contra CAT-LGBTIQ (colección 41)"*. La ficha quedó desactualizada respecto de
  su propio código; se corrige acá.
- **Montos y prórroga como `zds-input` de texto**: la fachada no expone `inputType="number"`.
- **PDF (FLD-165)**: `qd_strFinalReplyPdf` se interpreta como el `data_name` con el que SP2-T06 sube el
  archivo al request, y se reusa `app-request-file-list` (mismo patrón que SCR-008/SCR-0051).
- **`qd_strAction`** (metadato): no es un FLD; se deriva del botón presionado.
- **MSG-009-03** (éxito) lo emite el BPM tras completar la tarea; no se renderiza en la pantalla.
- **El sello de fechas lo pone el front** (`selloBogotaSfc()`), en zona `America/Bogota` y formato
  `YYYY-MM-DDThh:mm:ss`. Es lo que hacía React; ver §12.4 para por qué vive en su propio archivo.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-140..166) | 27/27 (100%) | Todos implementados; 5 con divergencia declarada (§12.7) |
| Secciones (SEC-028..032) | 5/5 (100%) | S1–S5 (S4 condicional) + S6/S7 de la fusión SCR-010 |
| Acciones (ACT-009-01/02) | 2/2 (100%) | El envío a SFC y el borrador · **⚠ la acción real es `ENVIAR_SFC`, §12.7** |
| Reglas (RUL-009-01/02/03) | 3/3 (100%) | Fraude condicional, precarga M1, bloqueo del envío |
| Mensajes (MSG-009-01..04) | 2/4 en UI | MSG-009-03 lo emite el BPM; MSG-009-04 está obsoleto por el anexo |
| Catálogos SFC | 12 colecciones reales de PM4 | **⚠ corregido en 3.0** — no son placeholders (§10) |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_strAction`, montos como texto, orden interno de
S4/S5 y S6/S7 en archivos de sección separados.

---

## 12. El port a Angular 21 — qué cambió y qué destapó

### 12.1 Mapeo react-hook-form → Reactive Forms

| React | Angular 21 |
|---|---|
| `useForm<FormularioSfcData>()` | `FormGroup` construido desde `Object.keys(SCR009_DEFAULTS)` |
| `reset(task.data)` | `patchValue(…)` en `precargar()` |
| `watch()` | `sigValores` (signal espejo, actualizado por `valueChanges`) |
| `<ZdsSelect control={control} …>` | `<zds-select formControlName="…" …>` |
| `<ZdsRadio … disabled />` (atributo de grupo) | `disabled` **por opción** dentro de `[options]` (§12.2) |
| `rules={{ required: … }}` | `Validators.required` en el `FormControl` |
| `required` (prop del wrapper) | `[obligatorio]` — renombrado para no chocar con el atributo nativo |
| `useCollection` × 12 | `CatalogosService` (una instancia, doce colecciones) |
| `useSyncDesc` | `sincronizarDesc()` |
| `hoyBogotaISO()` (leía `new Date()` directo) | `selloBogotaSfc(in_dtValue = new Date())` — parámetro **para poder testearlo** |
| `setBlnShowConfirm` + `<ZrModal>` | `app-confirmar-envio-modal` con `abierto`/`enviando` + `atras`/`confirmar` |

**`DIC_CAMPO_DE_CATALOGO` se declara ARRIBA de la clase**, no debajo: el constructor lo itera, y una
`const` de módulo declarada después queda en zona muerta temporal — `ReferenceError` en runtime que
`tsc` **no** ve.

### 12.2 El bloqueo de los dos radios de anexos: tres caminos, uno correcto

Los radios de FLD-163/164 se pintan bloqueados pero sus valores **tienen que seguir viajando** a la
SFC y seguir alimentando el gate. Los tres caminos posibles y por qué gana el tercero:

1. **`disabled` de grupo como en React** — `zds-radio` deliberadamente **no** lo expone (sería un
   segundo camino para lo que ya gobierna el control, con precedencia ambigua).
2. **`control.disable()`** — un control deshabilitado **desaparece de `form.value`**. Acá no rompe
   nada porque la pantalla lee `getRawValue()` en todas partes (§12.5, mutación 8), pero es
   redundante: no apaga el `disabled` por opción, porque son canales independientes.
3. **`disabled` por opción** ✅ — viaja dentro de `[options]`, `cllOpcionesZa` lo preserva, y el web
   component de Lit lo resuelve como `?disabled=${this.disabled || opt.disabled}` sobre el
   `<input type="radio">`. O sea: **el mismo atributo en el mismo elemento** que producía el
   `disabled` de grupo de React, con el `FormControl` intacto.

`CLL_SI_NO_BLOQUEADO` se calcula **una vez a nivel de módulo** y no en un `computed()`: es una
constante, y recrear el array en cada CD haría que `za-radio-select` re-renderizara sus opciones sin
motivo.

### 12.3 El envío es de dos fases, y las dos mitades se aseveran

`solicitarEnvio()` **no envía**: marca el intento, valida y abre el popup. `confirmarEnvio()` es la
que completa la tarea. El spec tiene un caso por mitad, más el del popup que se cierra tras enviar
(para que un segundo click no reenvíe).

El `setErrors({required:true})` va **antes** del `scrollToFirstError()`: esa función camina el árbol
podando por `valid`, así que es el `setErrors` lo que hace que el control sea el inválido que va a
encontrar. Y `markAsTouched()` acompaña porque el estado de error del wrapper es `invalid && touched`.

### 12.4 `selloBogotaSfc()` vive en su propio archivo, y con su propio spec

Port de `hoyBogotaISO()`. **No** se metió en `core/fecha-hora.ts` por dos razones: es **otro formato y
otra zona** (los de `core/` son `'YYYY-MM-DD HH:mm'` en hora local y son para *mostrar*; este es
`…Thh:mm:ss` fijo en `America/Bogota` y es lo que **viaja a la SFC**), y hoy tiene **un solo
consumidor** (el umbral de reúso del proyecto es ≥3).

`hourCycle: 'h23'` es obligatorio y **no cosmético**: sin él la medianoche sale `24:00:00` en varias
implementaciones de `Intl`, y `2026-08-17T24:00:00` no es una hora válida para la SFC. La docstring lo
promete con caso de test, y `hoy-bogota.spec.ts` lo cumple (6 casos, incluido el que atrapa una
"simplificación" a `toISOString().slice(0,19)`, que devolvería el **día equivocado** — una fecha de
cierre adelantada un día ante el regulador).

**Las dos fechas se sellan con UNA sola llamada**, no con dos: dos llamadas podrían caer en segundos
distintos y el formulario iría a la SFC con una actualización posterior a su propio cierre.

### 12.5 Mutaciones verificadas (gate 5 del plan)

Cada una sobre la **implementación**, no sobre el spec, revertida y verificada con `diff`.

| # | Línea mutada | Rojos | Caso que se puso rojo |
|---|---|---|---|
| 1 | se borra `[QD.strComplaintStatus]: '4'` del `patchValue` | 2 | *fuerza Estado de la Queja a "4" pisando el "2" que trae el caso* |
| 2 | se borra `[QD.strClosureDate]: strSelloSfc` | 1 | *sella las dos fechas con el MISMO instante* |
| 3 | `=== 'Rechazado (400)'` → `.includes('400')` | 1 | *el rechazo se compara contra el literal exacto* |
| 4 | se saca `blnAnexosCompletos()` del gate | 1 | *el gate sigue mirando los dos flags* |
| 5 | `guardarBorrador()`: se le saca el `if (!blnOk) return;` | 1 | *si el guardado FALLA, no redirige* |
| 6 | se borra el `disabled: true` por opción | 1 | *los dos radios llegan con sus opciones DESHABILITADAS* |
| 7 | se agrega `control.disable()` a los dos radios | **0** | — **no es un defecto**, ver abajo |
| 8 | payload: `getRawValue()` → `value` | **0 → 1** | *un control deshabilitado igual viaja a la SFC* — **el hallazgo** |
| 9 | mutaciones 7 + 8 juntas | 2 | los dos del payload de anexos |

**La mutación 8 es el hallazgo del gate.** `enviarCon()` lee `getRawValue()` por la regla del proyecto
(un control deshabilitado desaparece de `value`), pero **ninguna** parte de esta pantalla deshabilita
un control, así que las dos lecturas devolvían lo mismo y cambiar una por la otra dejaba los 43 casos
**verdes**. La precaución existía sin estar ejercitada. Se agregó un caso que deshabilita un control y
asevera que el flag **igual** llega al payload — con una aserción de premisa que comprueba que el
control efectivamente salió de `value`, para que el caso no pueda pasar por vacuidad.

**La mutación 7 no es un agujero, y confundirla con uno habría llevado a escribir un caso falso.**
Agregar `control.disable()` deja los 44 verdes por dos razones **medidas**: (a) no apaga el `disabled`
por opción, porque el estado del control viaja por el `setDisabledState` del CVA nativo y nunca toca
`[options]`; y (b) no vacía el payload ni rompe el gate, porque los dos leen `getRawValue()`. O sea que
un `disable()` acá es redundante, no dañino. La combinación 7+8 **sí** es el defecto real —los dos
flags salen vacíos hacia el regulador— y la atrapan dos casos.

### 12.6 Lo que el spec fija y en React no estaba cubierto

En React esta pantalla tenía **un smoke test**. El port la deja con **44 casos** (más 6 de
`selloBogotaSfc`). Los que no tenían equivalente:

- **La precarga con consecuencia regulatoria**: el forzado de Estado de la Queja pisando el valor
  entrante, el sello único para las dos fechas, y `qd_strFinalReplyAttach` a `'SI'`.
- **El gate por sus cuatro mitades**, incluida la que mira los dos flags de anexos bloqueados.
- **El envío en dos fases**, con el caso de que pulsar con el form incompleto **no** abre el popup y
  **no** dispara PUT.
- **La diferencia entre los dos PUT**: el envío va a `/api/tasks/{id}` con `status:'COMPLETED'`; el
  borrador a `/api/requests/{process_request_id}` **sin** `status`. Confundirlos no puede pasar
  inadvertido.
- **La redirección del borrador por sus dos caras** (navega si salió bien, **no** navega si falló),
  observable gracias a `espiarNavegacionDelTope()`.
- **El literal exacto del rechazo**, contra un `includes('400')` que trataría
  `'Reintentando (400 previo)'` como rechazo.

### 12.7 Divergencias con el anexo — declaradas, no corregidas

**Esto es una migración de framework.** Ninguna de estas divergencias se toca acá: se porta lo que
hace React y se declara. Decidir cuál vale es del negocio.

| # | Elemento | Anexo | Código (React y port) |
|---|---|---|---|
| 1 | **ACT** de envío | Solo declara **ACT-009-01 "Guardar Formulario"** y ACT-009-02 "Guardar Borrador" | Manda `qd_strAction = 'ENVIAR_SFC'` con el botón "Enviar a SmartSupervision". El anexo **nunca declara** esa acción, y a la inversa, **"Guardar Formulario" no existe** en el código |
| 2 | **FLD-149 Producto Digital** | "Label/Solo lectura", origen **Back** | `zds-select` **editable** |
| 3 | **FLD-156 Marcación** | "Label/Solo lectura", origen **Back (Automático)** | `zds-select` **editable** |
| 4 | **FLD-150 Estado de la Queja** | "Label/Solo lectura (info-bar)". Conserva el código | **No se renderiza** y se **fuerza** a `'4'` |
| 5 | **FLD-166 Prórroga** | *"Prórroga (días, si aplica)"*, tipo **Número**, default **`0`** | *"Prórroga (Código)"*, default **`'1'`** |
| 6 | **FLD-163/164 anexos** | "Radio Sí/No", origen **Usuario**, obligatorio Sí | Radios **bloqueados**, fijos en `'SI'` |

**La 5 es la más riesgosa de las seis** y por eso queda anotada también en el código
(`seccion-fraude-anexos.ts`): `0 días` y el código de catálogo `1` **no significan lo mismo para la
SFC**. No es un rótulo cosmético, son dos contratos distintos.

**La 1 tiene consecuencia BPMN.** El anexo dice que ACT-009-01 "habilita SP3"; el código completa la
tarea con `ENVIAR_SFC`. Si el BPM ramifica por el valor de `qd_strAction`, el nombre importa.

**La 6 explica por qué el gate mira los dos flags** aunque estén bloqueados: el anexo los declara de
origen *Usuario* y obligatorios, así que si el back los mandara vacíos, el envío no debe salir con dos
indicadores en blanco hacia el regulador.

### 12.8 Lo que la ficha de React documentaba mal, y por qué se corrige acá

- **§10/§11 "catálogos SFC como placeholders estáticos" y "CAT-LGBTIQ pendiente crítico + MSG-009-04
  permanente".** El código carga 12 colecciones reales de PM4, y el propio anexo marca MSG-009-04 como
  obsoleto. La ficha describía un estado anterior de su propio código. Corregido en §10 y §11.
- **§4 S2 decía que Producto Digital es editable "🟢" sin señalar que el anexo lo marca Back**, y lo
  mismo con Marcación en S3. Ser editable es lo que hace el código; que el anexo diga lo contrario es
  una divergencia y ahora está declarada (§12.7), no implícita.
- **§1 "Acción de cierre: Guardar Formulario → habilita SP3"** quedó desalineada tras la fusión de la
  SCR-010: la acción real es el envío a SmartSupervision. Corregido en §1 y anotado en §12.7.

Se corrige **acá y no en la ficha de React** porque el React sigue siendo el sistema de referencia en
producción: cambiarle la documentación durante una migración de framework mezclaría dos cosas que
conviene poder comparar.

### 12.9 Cobertura de los 44 casos del spec

| Bloque | Casos | Qué fijan |
|---|---|---|
| Montaje y contrato de campos | 5 | Las 6 secciones **en orden**; los 8 campos `CampoBase` y los 2 `CampoZaBase` con sus rótulos del anexo *y ninguno más*; los textos de solo lectura |
| Precarga | 6 | Estado forzado a `'4'`, el sello único de las dos fechas, `strFinalReplyAttach:'SI'`, los defaults "Back" solo si llegan vacíos, tipo/código de entidad |
| Catálogos y `_desc` | 4 | Las 12 colecciones se piden; la descripción se pinta; `sincronizarDesc` escribe los `_desc` de fraude |
| Gate (RUL-009-03 / MSG-009-02) | 8 | Las cuatro mitades del gate, el aviso con su texto, y el error por campo que aparece recién tras el intento |
| Fraude (RUL-009-01) | 4 | Los 4 campos obligatorios solo si fraude=Sí; el indicador es solo lectura |
| Anexos bloqueados (FLD-163/164) | 3 | `options` deshabilitadas, el valor **en el payload**, y el gate vivo |
| Envío (ACT-009-01) | 6 | Las dos fases, el PUT correcto, el payload completo, el `getRawValue()`, el popup que se cierra |
| Borrador (ACT-009-02) | 4 | El PUT al request sin `status`, sin gate, y la redirección por sus dos caras |
| S7 (estado del envío) | 5 | "Pendiente" por default, la alerta de rechazo, el rótulo "Reenviar", el literal exacto |
| Carga y error | 2 | El loader y el error que reemplaza el formulario |

> **Por qué los dos radios se aseveran aparte de los otros 8 campos.** `cllCamposDeLaFachada()` filtra
> por `instanceof CampoBase`, y `ZdsRadio` extiende **`CampoZaBase`** — la jerarquía **paralela** de los
> `za-*`, que no deriva de `CampoBase`. O sea que el helper **no los ve**. Van en su propia tabla
> (`DIC_ROTULOS_ZA`) con sus propios accesores por `By.directive(ZdsRadio)`. Meterlos en la tabla
> principal pone rojo el caso que compara el conjunto completo, con el defecto en la **expectativa** y
> no en la pantalla — que es exactamente lo que pasó al escribir el spec. Es la misma partición que
> SCR-0052 documenta para su `ZdsFileInput`.

### 12.10 Las tres trampas que el spec documenta desde su propia medición

1. **`za-alert[config="info"]` es ambiguo: hay dos legítimos.** El aviso de MSG-009-02 y el estado
   vacío de `app-request-file-list` (*"Aún no se ha generado el PDF…"*). Un `querySelector` sobre el
   fixture ganaba el segundo (está antes en el DOM) y los cuatro casos del aviso medían el texto
   equivocado. Se filtra por `config="info"` **y** por ser hijo directo del `<form>`.
2. **`confirmarEnvio()` va sin `await` en el helper del spec.** Su promesa recién resuelve cuando el
   PUT responde, y el que lo responde es el `asentarHasta('PUT')` de la línea siguiente: con el `await`
   puesto el caso se cuelga y deja la petición abierta, lo que hace fallar el `verify()` del
   `afterEach` — cuyo throw se come el `resetTestingModule()` y **cascadea** a la veintena de casos
   siguientes.
3. **Los 12 catálogos se piden igual cuando la tarea falla**, porque los dispara el `effect()` de
   montaje y no el `await cargar()`. El caso de la rama de error tiene que drenarlos. Es lo **contrario**
   de SCR-003, donde los catálogos nacen después de que la tarea resuelve.

Y una del `href`: la redirección del borrador se escribe sobre `window.top.location.href` **detrás de
un `await`**, así que el caso tiene que esperar la promesa **dentro** del `try` que restaura el espía.
Con un `void` suelto, el `href` cae cuando el `finally` ya restauró el `window.top` real y jsdom lo
reporta como error **fuera** del caso: Vitest muestra `44 passed` + `Errors 2`, que se lee como verde.
