# Documentación Funcional — Flujo Combinado: Detalle / Reasignación / Respuesta

> **Port a Angular 21 (Fase 5, pantalla 9 de 12).** La trazabilidad funcional de las §1–§11 se
> conserva **textual** respecto de la versión React: los FLD/RUL/MSG/ACT son contrato con el Anexo02,
> no con el framework. Lo único que se actualizó ahí son los **archivos de implementación** (§1), los
> nombres de los controles del DS (§4–§8) y los puntos donde el port **corrigió un hecho** de la ficha
> 1.0 — esos van marcados con `> **⚠ corregido en 2.0**` en el lugar exacto, no reescritos en silencio.
> Lo que el port agregó está en la **§12**, al final.

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-0051** / PAN-05.1 — Flujo Combinado: Detalle / Reasignación / Respuesta |
| Tipo | Pantalla combinada (detalle + asignación/reasignación + elaboración de respuesta) — fusiona PAN-05 + PAN-06 + PAN-07 |
| Tareas BPMN | **SP2-T01** (Asignar) / **SP2-T03** (Reasignar) / **SP2-T02** (Analizar y elaborar respuesta) / SP2-T05 |
| Proceso | SP2 — Gestionar Respuesta Interna y Revisión SAC |
| Rol responsable | Analista SAC (VER+EDITAR) · Área Responsable (VER+EDITAR) · Líder SAC (VER) · Control SLA (INFORMADO) |
| Evento de apertura | SP1 exitoso (HTTP 201) → bandeja SAC |
| Acción de cierre | Enviar → "En revisión SAC" (SP2-T04) · o Reasignar (SP2-T03) · o Solicitar Prórroga (SP4-T01) |
| Slug / `?screen=` | `COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta` |
| Archivos de implementación | `detalle-reasignacion-respuesta.ts/.html` · `seccion-detalle-caso.ts/.html` · `seccion-asignacion.ts/.html` · `seccion-respuesta.ts/.html` · `expediente-completo-modal.ts/.html` · `respuestaFinalTemplate.ts` (config centralizada en `../fields/fields.ts`; usuarios de PM4 vía `core/pm4-groups.service.ts`) |
| Versión | 2.0 — 2026-08-17 (port a Angular 21; 1.0 React, 2026-06-30) |

> **Nota de nomenclatura:** el SLUG solicitado fue `COL_QD_Detalle_ Reasignación_Respuesta` (con
> espacio y tilde). Se normalizó a `COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta` (ASCII, sin
> espacios, con código SCR) por la convención de las pantallas QD hermanas y porque el parámetro
> de URL `?screen=` no admite espacios ni acentos. Ver §10.

---

## 2. Resumen

Vista integrada que centraliza la gestión SP2 de una queja radicada: muestra el expediente
completo (datos del consumidor, clasificación regulatoria M1 y descripción, todo solo
lectura), permite **asignar** un responsable (primera vez),
**reasignar / solicitar ayuda** a otras áreas (hasta 4 ayudantes con historial), y **elaborar el
borrador de respuesta** al cliente con sus soportes internos. Reemplaza la navegación entre
PAN-05/06/07. El cierre habitual es "Enviar" (→ "En revisión SAC"); también permite guardar
borrador y solicitar prórroga regulatoria cuando el SLA es crítico.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-0051.md` | Campos (FLD-066..350), acciones (ACT-0051-*), reglas (RUL-0051-*), mensajes (MSG-0051-*), permisos, trazabilidad, historia/criterio |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-047..056 (orden, visibilidad/condición) |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos exactos MSG-0051-01..06 |
| Anexo02 (índice .md) | `masters/07_Catalogs.md` | CAT-AREA, CAT-USUARIOS-ROLE, CAT-MOTIVO-REASIG, CAT-FAVOR (estado/origen) |
| Anexo02 (índice .md) | `masters/01_Pantallas.md` | Contexto y proceso de SP2 |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` / `4. Pantallas` | Definición y RACI de SP2-T01/02/03; lineamientos/controles |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | Tareas de Usuario SP2-T01/02/03 → sin variables canónicas (tareas no automatizadas) |

---

## 4. Campos Implementados

### Cabecera (`info-bar`, solo lectura) — `DetalleReasignacionRespuesta.tsx`

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Case | `qd_strBpmCaseId` | `info-bar` | FLD-300 en SCR-000 |
| SLA | `qd_strSlaAssigned` | `info-bar` ("N días hábiles") | Inferido de RUL-0051-03 (§10), unificado con SCR-008 |
| Estado | (SLA por proximidad al vencimiento) | `info-bar` + `zds-status-badge` (`estadoSlaVariant()`) | Misma regla que el dashboard SCR-013 |
| SmartSupervision | `qd_strSfcCode` | `info-bar` | FLD-120/140/173 en SCR-008/009/010 |
| Radicación SFC | `qd_strFilingDate` | `info-bar` | FLD-081 — antes en S4 (eliminada, ago-2026) |

### S1 — Datos del Consumidor (SEC-047, solo lectura) — `SeccionDetalleCaso.tsx`

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Nombre del Consumidor | (derivado de `qd_strFirstName` + `qd_strLastName` / `qd_strCompanyName`) | `zds-input` `[soloLectura]` | No | Anexo02 > SCR-0051 > FLD-066 |
| Tipo y N.° de Identificación | (derivado de `qd_strIdType` + `qd_strIdNumber`) | `zds-input` `[soloLectura]` | No | Anexo02 > SCR-0051 > FLD-067 |
| Correo Electrónico | `qd_strEmail` | `zds-input` `[soloLectura]` | No | Anexo02 > SCR-0051 > FLD-068 |
| Tipo de Persona | `qd_strPersonType` | `zds-input` `[soloLectura]` | No | Anexo02 > SCR-0051 > FLD-069 |

### S2 — Clasificación Regulatoria (precargada M1, re-editable en M3)

Producto SFC, Momento, Servicio/Placa y Motivo SFC son **editables** con la misma cascada
`cat_matriz_motivos` (colección 45) de SCR-000 (seguro → momento → (servicio/placa) → motivo).
Llegan precargados con la selección de M1 y pueden corregirse. Canal, Instancia, Admisión y
Ente de Control siguen siendo de solo lectura (calculados en M1).

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Producto SFC (seguro) | `qd_strSfcProduct` | `zds-select` (col. `sfcProduct`) | FLD-071 |
| Momento | `qd_strInteraction` | `zds-select` (cascada matriz) | Anexo02 |
| Servicio (solo si momento = Asistencias) | `qd_strServiceProvided` | `zds-select` (cascada matriz) | Anexo02 #31 |
| Placa (solo si producto = Autos) | `qd_strPlate` | `zds-input` | Anexo02 #25 |
| Motivo SFC | `qd_strSfcReason` | `zds-select` (cascada matriz) | FLD-072 |
| Canal de Recepción | `qd_strChannel` | `info-bar` readOnly | FLD-070 |
| Instancia / Punto de Recepción | `qd_strReceptionInstance` | `zds-input` `[soloLectura]` | FLD-073 |
| Admisión | `qd_strAdmission` | `info-bar` readOnly | FLD-074 |
| Ente de Control | `qd_strControlEntity` | `zds-input` `[soloLectura]` | FLD-075 |

**Regulatorios re-derivados al corregir el motivo (no visibles, pero persistidos en el form):**
al cambiar `qd_strSfcReason` se reescriben desde la fila de `cat_matriz_motivos` correspondiente
—misma lógica que SCR-000/`SeccionDetalleQueja`— para que la corrección quede consistente con la
matriz:

| Variable | Columna de la matriz (id 45) | Notas |
|---|---|---|
| `qd_strOmbudsmanEscalation` | `escalamientoAdministrador` | Escalamiento al Defensor del Consumidor |
| `qd_strCompensation` | `resarcimientoAdministrador` | Resarcimiento del administrador |
| `qd_strFraudRelated` | `relacionFraude` (→ `SI`/`NO`) | Gatilla los campos de fraude en SCR-009 |

A diferencia de SCR-000, la re-derivación **no limpia** los campos a ciegas por cambio de
dependencia (el form llega precargado): solo se reescriben cuando hay una fila de motivo válida
seleccionada, evitando vaciar los valores heredados de M1 mientras la matriz aún carga.

> **Decisión de negocio:** el **SLA** (`qd_strSlaAssigned`) y el **rol responsable**
> (`qd_strResponsableRole`) **NO se recalculan** en M3 aunque también salgan de la matriz —
> conservan el valor asignado en M1.

### S3 — Descripción de la Queja (SEC-049, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Asunto de la Queja | `qd_strSfcReason` | `zds-input` `[soloLectura]` | FLD-076 |
| Descripción / Texto de la Queja | `qd_strComplaintText` | `zds-textarea` `[soloLectura]` | FLD-077 |

> **S4 — Estado SmartSupervision (SEC-050) eliminada (ago-2026):** mostraba Estado
> SmartSupervision (`qd_strSsStatus`), Intentos M1/M2 (`qd_strM1M2Attempts`) y Fecha/Hora
> radicación SFC (`qd_strFilingDate`), todo solo lectura. Se retiró la sección completa por
> pedido del usuario; `qd_strFilingDate` se movió a la cabecera (`info-bar`, ver arriba).
> `qd_strSsStatus`/`qd_strM1M2Attempts` ya no se muestran en esta pantalla (los campos siguen
> viajando en `task.data` por si se necesitan más adelante).

### S5 — Asignación de Responsable (SEC-051, condicional) — `SeccionAsignacion.tsx`

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Área responsable | `qd_strAssigneeArea` | `zds-select` (CAT-AREA) | **Sí** | FLD-082 |
| Usuario responsable | `qd_strAssigneeUser` | `zds-select` filtrado por área | **Sí** | FLD-083 |
| Observaciones de asignación | `qd_strAssignmentRemarks` | `zds-textarea` | No | FLD-084 |

### S6 — Reasignación de Caso (SEC-052, condicional)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| ¿Necesitas de otras áreas? (toggle) | `qd_strNeedsOtherAreas` | `zds-radio` inline (SI/NO) | — | Inferido de RUL-0051-07 (§10) |
| Responsable actual | `qd_strCurrentAssignee` | usado en historial | No | FLD-090 |
| Área destino | `qd_strTargetArea` | `zds-select` (CAT-AREA) | **Sí** | FLD-091 |
| Responsable (auto) | `qd_strNewAssignee` | `zds-select` disabled (auto por área) | **Sí** (auto) | FLD-092 |
| ~~Motivo de reasignación~~ | `qd_strReassignReason` | **retirado de la UI** | — | FLD-093 |
| Observaciones (justificación) | `qd_strReassignRemarks` | `zds-textarea` | **Sí** | FLD-094 |

> **⚠ corregido en 2.0 — FLD-093 está retirado, no obligatorio.** La 1.0 lo declara `zds-select`
> (CAT-MOTIVO-REASIG) y **obligatorio**; la implementación real (React y Angular) ya no lo captura ni
> lo valida. `qd_strReassignReason` **sigue viajando vacío** en el payload de la ayuda, a propósito,
> por compatibilidad con el resto del proceso. Está anotado en el docstring de `blnAyudaCompleta` en
> `seccion-asignacion.ts`. El gate real de la ayuda son **dos** campos (área destino + observaciones),
> no tres — ver la corrección de RUL-0051-04 en §7. **A reportar al negocio:** el Anexo02 sigue
> declarando FLD-093 como obligatorio.

### S7 — Historial de Asignaciones (SEC-053, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Historial de asignaciones previas | `qd_lstAssignHistory` | Tabla `za-table` (Fecha\|De\|Para\|Observaciones\|Respondió\|Comentario\|Adjunto) | FLD-095 |

> **⚠ ago-2026 — la columna *Motivo* salió de la tabla.** Es el mismo FLD-093 retirado de S6: como ya
> no se captura, `registrarAyuda()` escribe `motivo: ''` y la columna pintaba vacío en todas las filas
> nuevas. La clave **sigue** en `AsignacionHistorial` (los casos históricos ya la traen con dato y el
> spread de `registrarRespuesta()` la conserva): se deja de mostrar, no se saca del modelo. El
> Expediente completo (ACT-0051-06) ya la omitía, así que ahí no cambió nada.

### S8 — Elaboración de Respuesta Técnica (SEC-054) — `SeccionRespuesta.tsx`

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Observaciones SAC | `qd_strSacRemarks` | `zds-textarea` `[soloLectura]` (condicional) | No | FLD-131 en SCR-008 |
| Respuesta al Cliente (borrador) | `qd_strClientResponse` | `zds-textarea` | **Sí** | FLD-110 |
| Acciones Tomadas | `qd_strActionsTaken` | `zds-textarea` (condicional) | No | FLD-111 |
| ¿Reconocimiento al cliente? | `qd_strAcknowledgment` | `zds-input` `[soloLectura]` (back) | No | FLD-112 |

### S9 — Soportes Internos (SEC-055)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Adjuntos internos de soporte (máx 10) | `qd_strSupport01..10` | `DocSupportUploader` (multi) | FLD-113 |

### S10 — Configuración de Respuesta (SEC-056)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Respuesta a favor de | `qd_strFavorability` | `zds-select` (CAT-FAVOR) | **Sí** | FLD-151/177/350 (unificado SCR-009/010/0051) |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_strAction` (`CONFIRMAR_ASIGNACION` \| `SOLICITAR_PRORROGA` \| `GUARDAR_BORRADOR` \| `ENVIAR`) | Inferido de ACT-0051-01/04/07/08 (§10) |
| Fecha de elaboración del borrador | `qd_strDraftDate` — se sella con `YYYY-MM-DD HH:mm` (hora local del navegador) **solo al ENVIAR** (ACT-0051-08); *Guardar Borrador* no la toca | Solicitud del usuario (2026-08-10): es lo que SCR-008 muestra como "Fecha de elaboración del borrador" |
| Versión bajo revisión | `qd_strRevisionVersion` — sube una versión en cada ENVIAR (`v1`, `v2`, `v3`…); v1 en el primer envío, v2 tras la primera devolución con observaciones del SAC, etc. Tolera el valor previo con o sin `v` (`'2'` ⇒ `v3`). Las demás acciones (borrador, prórroga, ayuda, reasignar) no la tocan | Solicitud del usuario (2026-08-10): es lo que SCR-008 muestra como "Versión bajo revisión" |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Respuesta al Cliente obligatoria | `rules.required` en `qd_strClientResponse`; botón "Enviar" deshabilitado si vacío | RUL-0051-05 · MSG-0051-02 · FLD-110 |
| Ayuda: área destino **y** observaciones obligatorias | `blnAyudaCompleta()` deshabilita "Confirmar Solicitud de Ayuda"; alerta MSG-0051-03. El motivo (FLD-093) **ya no se valida** — ver §4/S6 | RUL-0051-04 · MSG-0051-03 |
| Área/Usuario de asignación obligatorios | "Confirmar Reasignación" deshabilitado si el usuario no resuelve contra el grupo de PM4 (`blnPuedeConfirmarReasignacion()`) | FLD-082/083 (Oblig.) · ACT-0051-01 |
| Respuesta a favor de obligatoria | integrado en `blnPuedeEnviar()` | FLD-151/177/350 |
| Usuario filtrado por área | `qd_strAssigneeUser` carga los miembros del **grupo de PM4** que se llama igual que el área | RUL-0051-02 |
| Máx. 4 ayudantes | `blnTopeAyudantes()` reemplaza el formulario de añadir por MSG-0051-06 | RUL-0051-08 · MSG-0051-06 |
| SLA crítico | `blnSlaCritico() = blnSlaCalculable() && intDiasRestantes() <= 2` → banner rojo + habilita "Solicitar Prórroga" | RUL-0051-03 · MSG-0051-01 |

> **⚠ corregido en 2.0 — el SLA crítico exige que el SLA sea *calculable*.** La 1.0 lo escribe como
> `slaCritico = slaRestante <= 2` a secas. Sin la guarda de `blnSlaCalculable()`, un caso con
> `qd_strFilingDate` vacío o impresentable (que existen: el campo es string libre en PM4) daría
> "días restantes" indefinido, la comparación colapsaría a un valor engañoso y la pantalla habilitaría
> la prórroga regulatoria de un caso cuyo vencimiento nadie sabe. Con la guarda, un SLA no calculable
> **no es crítico** y la prórroga queda cerrada. Tiene su propio caso en el spec.

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-0051-01 SLA crítico | `blnSlaCritico()` (SLA calculable y ≤ 2) | `za-alert [config]="'negative'"` superior | 06_Mensajes > MSG-0051-01 |
| MSG-0051-02 Respuesta vacía | `qd_strClientResponse` vacío | `za-alert [config]="'info'"` + "Enviar" disabled | 06_Mensajes > MSG-0051-02 |
| MSG-0051-03 Reasignación incompleta | área destino u observaciones vacías (el motivo ya no, ver §4/S6) | `za-alert [config]="'info'"` en S6 + botón disabled | 06_Mensajes > MSG-0051-03 |
| MSG-0051-04 Asignación registrada | Tras confirmar asignación | **No en UI** — lo emite el BPM tras `completeTask` | 06_Mensajes > MSG-0051-04 |
| MSG-0051-05 Enviado a SAC | Tras enviar | **No en UI** — lo emite el BPM al avanzar a SP2-T04 | 06_Mensajes > MSG-0051-05 |
| MSG-0051-06 Límite de ayudantes | `blnTopeAyudantes()` (historial ≥ 4) | `za-alert [config]="'alert'"` en S6 | 06_Mensajes > MSG-0051-06 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-0051-01 — la sección se activa con "Reasignar Queja" | `blnModoReasignacion()`, que abre ACT-0051-02 | SCR-0051 > RUL-0051-01 |
| RUL-0051-02 — usuarios solo del área seleccionada | `Pm4GroupsService.usuariosDeGrupo(area)` — usuarios **reales** de PM4 | SCR-0051 > RUL-0051-02 |
| RUL-0051-03 — SLA ≤ 2 habilita prórroga + banner | `blnSlaCritico()` controla banner y botón | SCR-0051 > RUL-0051-03 |
| RUL-0051-04 (🔴) — reasignación con campos obligatorios | `blnAyudaCompleta()`: botón disabled + alerta | SCR-0051 > RUL-0051-04 |
| RUL-0051-05 (🔴) — respuesta obligatoria para enviar | `blnPuedeEnviar()`: botón disabled + alerta | SCR-0051 > RUL-0051-05 |
| RUL-0051-06 (🔴) — no asignar a usuario fuera del proceso | Cubierta **de verdad** en 2.0: la lista son los miembros del grupo de PM4 y el `user_id` sale de la opción elegida — no hay forma de nombrar a alguien que no esté en el grupo. Y si el username precargado no pertenece al grupo, el confirmar queda apagado (RUL-0051-01-bis) | SCR-0051 > RUL-0051-06 |
| RUL-0051-07 — mostrar reasignación si "¿otras áreas?" = Sí | `blnMostrarAyuda() = qd_strNeedsOtherAreas === 'SI'` | SCR-0051 > RUL-0051-07 |
| RUL-0051-08 — máx. 4 ayudantes | `blnTopeAyudantes()` (`>= SCR0051_MAX_AYUDANTES`) | SCR-0051 > RUL-0051-08 |
| RUL-0051-09 — "Acciones Tomadas" si favor = Cliente | `blnMostrarAcciones() = qd_strFavorability === '1'` (código CAT-FAVORAB) | SCR-0051 > RUL-0051-09 |

> **⚠ corregido en 2.0 — RUL-0051-01 y RUL-0051-06 estaban mal en la 1.0.**
>
> **RUL-0051-01.** La 1.0 dice "ocultar asignación si ya hay responsable" con
> `mostrarAsignacion = !qd_blnHasAssignee`. El Anexo02 dice lo contrario: *"la sección se muestra
> **siempre** (solo lectura). El usuario la activa con el botón 'Reasignar Queja' (ACT-0051-02)"*. La
> implementación sigue al Anexo02 (`blnModoReasignacion()`), así que la que estaba mal era la ficha.
> `qd_blnHasAssignee` sigue existiendo como control del form pero **ya no gobierna la visibilidad**.
>
> **RUL-0051-06.** La 1.0 la declaraba "cubierta parcialmente (catálogo placeholder)", y con los mapas
> estáticos era la descripción honesta: no había forma real de saber si un usuario pertenecía al
> proceso. Con `Pm4GroupsService` la regla queda **cubierta de verdad** (ver la fila de arriba).
>
> **⚠ Y un conflicto de numeración que se arrastró durante el port, a reportar al negocio.** En el
> código, la regla de la **marcación derivada** (si cambia la clasificación regulatoria,
> `qd_strMarking` pasa a `'2'`) estuvo trazada un tiempo como "RUL-0051-06", que es **otra regla**. Se
> corrigió: esa lógica **no es un RUL del Anexo02 de esta pantalla** — es el contrato de
> `qd_strMarking` (**FLD-156/179**), heredado de SCR-009, y así se traza ahora en el código y en el
> spec. El Anexo02 de SCR-0051 no declara ningún RUL para la marcación aunque la pantalla la escriba.

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Expediente completo solo lectura (S1-S3) | `SeccionDetalleCaso` con `zds-input`/`zds-textarea` `[soloLectura]` | SEC-047..049 |
| Añadir ayudante a historial | "Confirmar Solicitud de Ayuda" hace `push` a `qd_lstAssignHistory` y limpia el borrador | ACT-0051-03 · FLD-095 |
| Responsable cargado por área | `effect` acotado → `Pm4GroupsService.usuariosDeGrupo(area)`. **Ya no autocompleta un mapa**; carga las opciones reales del grupo — ver §12.4 | FLD-092 |
| Acciones Tomadas condicional | `@if` por `qd_strFavorability` | RUL-0051-09 |
| Carga múltiple de soportes (máx 10) | `doc-support-uploader [intMax]="10"` | FLD-113 |
| Ver Expediente / Vista Previa | `za-modal` (link / secondary) | ACT-0051-06 / ACT-0051-05 |
| Estados loading/error/submitting | `za-loader`, `za-alert`, botones `loading/disabled` | CLAUDE.md |
| **Placa que se repone al volver a Autos** | `limpiarPlaca()` guarda el valor antes de vaciarlo y lo repone si el producto vuelve a ser de Autos y el campo está vacío | ⚠ decisión del usuario (ago-2026) — **no** está en el Anexo |

> **⚠ ago-2026 · la placa es el único punto de esta pantalla donde Angular NO se comporta como
> React.** El resto de la tanda de correcciones es paridad; esta es una mejora pedida por el usuario.
> En React (y en Angular hasta ago-2026) salir de un producto de Autos hacía `setValue('')` y el dato
> se perdía: un gestor que se equivocaba de producto y corregía tenía que volver a tipear una placa
> que ya había escrito. Ahora el valor se guarda en un campo privado de la sección y se repone al
> volver.
>
> Tres límites que son contrato, y están explicados en `limpiarPlaca()`:
> - **El stash NO es un control del form.** El payload se arma con `getRawValue()`, que incluye los
>   deshabilitados, así que un control extra viajaría a PM4 como una variable `qd_*` inexistente. Al
>   ser estado de UI de la sección, muere con ella: al recargar la pantalla la placa vuelve a ser la
>   que trae el caso, que es lo correcto.
> - **Solo repone sobre un campo vacío.** Si el usuario ya tipeó otra placa, lo que él escribió gana.
> - **La escritura emite** (a diferencia de sus hermanas con `emitEvent: false`), justamente para que
>   el espejo `sigValores` vea la placa repuesta y la marcación de FLD-156/179 se recalcule.

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strAssigneeArea` | `qd_strAssigneeUser` | Carga los miembros del grupo PM4 homónimo; lo deshabilita sin área | RUL-0051-02 |
| `qd_strTargetArea` | `qd_strNewAssignee` | Carga los miembros del grupo PM4 homónimo | FLD-092 |
| `qd_strNeedsOtherAreas` | S6 + S7 | Muestra/oculta el bloque de ayuda e historial | RUL-0051-07 |
| `qd_strFavorability` | `qd_strActionsTaken` | Muestra "Acciones Tomadas" si = Cliente | RUL-0051-09 |
| `qd_strSlaAssigned` | banner SLA + "Solicitar Prórroga" | Habilita si el SLA es **calculable** y ≤ 2 (ver §5) | RUL-0051-03 |
| `qd_lstAssignHistory` | formulario de ayudante | Lo reemplaza por MSG-0051-06 al llegar a 4 | RUL-0051-08 |
| `qd_strRegulatoryClass` | `qd_strMarking` | Si cambia respecto del snapshot inicial, la marcación pasa a `'2'` | FLD-156/179 |
| `qd_strSfcProduct` | `qd_strPlate` | Fuera de Autos se vacía (guardando el valor); al volver se repone si está vacío. Requiere el catálogo de productos ya cargado | ⚠ ago-2026, ver §8 |
| `qd_strPlate` | `qd_strMarking` | Es uno de los cinco campos de clasificación, así que la limpieza de la placa **mueve la marcación a `'2'`** y la reposición la devuelve a la original | FLD-156/179 |

> **⚠ corregido en 2.0 — se cayó una fila y ninguna de las dos primeras dependía de un mapa.** La
> 1.0 listaba `qd_blnHasAssignee` → "oculta asignación si ya hay responsable"; esa dependencia **no
> existe** (ver el bloque de §7: el Anexo dice que la sección se muestra siempre). El control sigue
> en el formulario porque viaja a PM4, pero no gobierna nada de la UI. En su lugar entra la
> dependencia de la **marcación derivada**, que la 1.0 no listaba aunque la implementaba.

---

## 10. Suposiciones Realizadas

- **Slug normalizado** (ver §1).
- **Catálogos como OPTIONS estáticas placeholder.** No se entregaron colecciones PM4 para
  CAT-AREA, CAT-USUARIOS-ROLE, CAT-MOTIVO-REASIG ni CAT-FAVOR (07_Catalogs los marca "Activo —
  Zurich/BPM" o "Pendiente TI"). Se implementaron como `OPTIONS`/mapas estáticos con los valores
  de ejemplo del insumo (`USUARIOS_POR_AREA`, `RESPONSABLE_POR_AREA`). Deben reemplazarse por
  `useCollection` cuando se entreguen los IDs.

  > **⚠ corregido en 2.0 — esta suposición ya no se cumple, y era la más caída de la 1.0.** El port
  > **eliminó los dos mapas estáticos**. Hoy:
  > - **Las dos "áreas"** (FLD-082 de S5 y FLD-091 de S6) **no** son CAT-AREA: se llenan con los
  >   valores únicos de una columna de `cat_matriz_motivos` (la misma colección de la cascada de S2),
  >   vía `leerColumnaMatriz()`. Está explicado en el docstring de cabecera de `seccion-asignacion.ts`.
  > - **Los usuarios** (FLD-083 y FLD-092) salen de **PM4 de verdad**, con `Pm4GroupsService`: el
  >   nombre del área es el nombre de un **grupo** de PM4, y la lista son sus miembros. Ver §12.3, que
  >   documenta la trampa del `member_id` — la que hacía que la reasignación devolviera 200 sin
  >   reasignar a nadie.
  >
  > CAT-MOTIVO-REASIG quedó sin uso (FLD-093 retirado, ver §4/S6). CAT-FAVOR sigue como OPTIONS
  > estáticas (`SCR0051_OPTIONS_FAVOR`), que es correcto: son dos valores fijos del regulador.
- **`qd_strNeedsOtherAreas`** (toggle SI/NO): no es un FLD del insumo; se añadió como control de UI
  para implementar la condición textual de RUL-0051-07 ("¿Necesitas de otras áreas?").
- **`qd_strSlaAssigned`**: no hay FLD explícito, pero RUL-0051-03 referencia `slaRestante`. Se añadió
  como campo de sistema (solo lectura) que alimenta el banner y la habilitación de prórroga.
- **`qd_strBpmCaseId` / `qd_strSfcCode` en la cabecera**: no son FLD propios de SCR-0051; se añadieron
  para mostrar "Case", "Estado" y "SmartSupervision" en la cabecera (pedido del usuario, jul-2026),
  reutilizando los mismos `data_name` que ya produce SCR-000 (`qd_strBpmCaseId`, FLD-300) y que
  consumen SCR-008/009/010 (`qd_strSfcCode`, FLD-120/140/173), para mantener la correlación de
  variables del proceso.
- **`qd_strSacRemarks` en S8**: no es un FLD propio de SCR-0051; se añadió (pedido del usuario,
  jul-2026) reutilizando el mismo `data_name` que ya escribe el Analista SAC en SCR-008
  (`qd_strSacRemarks`, FLD-131) al devolver el caso al área responsable. Se muestra readOnly y
  solo si el campo trae contenido (caso devuelto); si el caso nunca fue devuelto, el campo llega
  vacío y la sección lo oculta.
- **`qd_blnHasAssignee`**: flag de sistema inferido para implementar la visibilidad "solo la
  primera vez" de RUL-0051-01.
- **Añadir ayudante = push local al historial.** ACT-0051-03 "añade el ayudante al historial"; se
  implementó como manipulación local del arreglo `qd_lstAssignHistory` (no completa la tarea).
  El enrutamiento BPMN a SP2-T03 ocurre en el back según la acción enviada.
- **`qd_strAction`** (metadato): no es un FLD; se deriva del botón presionado para informar la decisión
  al BPM (ACT-0051-01/04/07/08).
- **`maxLength`** (2000/5000) en textareas: límites estándar del proyecto, no especificados en el insumo.
- **FLD-092 como `zds-select` deshabilitado** (en vez de label): el DS no tiene un control "label de solo
  lectura autocompletado" en la fachada; se usó un select deshabilitado con una sola opción para
  mostrar el valor autocompletado de forma coherente con el resto de la sección.
- **MSG-0051-04/05** (éxito de asignación/envío) los emite el BPM tras `completeTask`; no se renderizan en UI.
- **ACT-0051-04 Solicitar Prórroga / ACT-0051-05 Vista Previa / ACT-0051-06 Ver Expediente**: la
  prórroga llama a `completeTask` con `qd_strAction='SOLICITAR_PRORROGA'` (el POST a SP4 lo resuelve el
  back); vista previa y expediente abren modales informativos (placeholder hasta integrar el
  generador de PDF / visor de expediente reales).
- **Adjuntos `qd_strSupport01..10`**: nombres `data_name` provisionales; se subirán vía
  `POST /requests/{id}/files?data_name=` al enviar (patrón estándar del proyecto).

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-066..350) | 27/29 | FLD-079/080 (Estado SS / Intentos M1-M2) retirados de UI, ago-2026 — ver nota en S4 |
| Secciones (SEC-047..056) | 9/10 | S1-S3, S5-S10 — SEC-050 (S4) eliminada, ago-2026 |
| Acciones (ACT-0051-01..08) | 8/8 (100%) | Asignar, Reasignar(toggle), Confirmar Reasig., Prórroga, Vista Previa, Expediente, Borrador, Enviar |
| Reglas (RUL-0051-01..09) | 9/9 (100%) | **⚠ en 2.0, RUL-0051-06 pasa a cubierta de verdad** (grupos reales de PM4). Ver el bloque de §7 |
| Mensajes (MSG-0051-01..06) | 4/6 en UI | MSG-0051-04/05 los emite el BPM |
| Catálogos (CAT-AREA/USUARIOS/MOTIVO/FAVOR) | **2/4 reales · 1/4 estático correcto · 1/4 sin uso** | Ver el bloque de §10 |

**Elementos inferidos:** prefijo `qd_*`, `qd_strAction`, `qd_strNeedsOtherAreas`, `qd_strSlaAssigned`,
`qd_blnHasAssignee`, límites `maxLength`, modales de vista previa/expediente como placeholder.

> **⚠ corregido en 2.0 —** salen de esta lista los "catálogos estáticos placeholder" (ya no lo son) y
> "FLD-092 como select disabled" (hoy es un select cargado desde PM4, deshabilitado solo mientras no
> haya área). Cada spec del port tiene **un caso por RUL**, así que la cobertura de la tabla es
> verificable y no declarativa: ver §12.5.

---

## 12. Notas del port a Angular 21

Esta sección **no existe en la 1.0** — es propia del port. Documenta lo que cambió de forma no
mecánica: el mapeo del formulario, lo que esta pantalla estrenó en la migración, y las dos fallas
que el port encontró y arregló (una silenciosa en producción, una de rendimiento).

### 12.1 `react-hook-form` → Reactive Forms

| React 19 | Angular 21 | Nota |
|---|---|---|
| `useForm<Scr0051FormData>()` | `FormGroup` tipado con un `FormControl` por campo | Los **nombres de los controles no cambiaron**: son los mismos `qd_*` que viajan a PM4 |
| `reset(task.data)` | `this.form.patchValue(objDatos)` | `patchValue` ignora las claves que no son controles; `reset` las borraría |
| `control` + `<Controller>` | `[formControlName]` sobre el control de la fachada | La fachada `zds-*` implementa `ControlValueAccessor` |
| `watch('campo')` | `computed()` sobre un signal del valor del formulario | Ver el ⚠ de §12.4: la granularidad del `watch` **no** se hereda gratis |
| `rules={{ required: … }}` | `Validators.required` en el `FormControl` | El input de la fachada se llama `obligatorio`, no `required` |
| Secciones como componentes con `control` en props | Componentes con `form` como `@Input()` | `SeccionAsignacion`, `SeccionRespuesta`, `SeccionDetalleCaso` |
| `useEffect` | `effect()` | Y ahí está la trampa de §12.4 |

### 12.2 Qué estrena esta pantalla en la migración

- **`Pm4GroupsService`** (`core/pm4-groups.service.ts`) — port de `core/pm4Groups.ts`. Es el primer
  servicio del port que resuelve **usuarios reales de PM4**, y lo comparte con OS-SCR-003.
- **La cadena de dos GET** que hay detrás de "dame los usuarios de un área":
  `GET /api/groups?filter=<nombre>&per_page=100` para resolver el **nombre** a un id, y luego
  `GET /api/groups/{id}/users`. El filtro de PM4 es por substring, así que pedir "Siniestros" trae
  también "Siniestros Autos": se prefiere el match exacto tras normalizar y solo como último recurso
  el primero de la lista.
- **La resolución por nombre en vuelo**, no por registro. Regla 6 del proyecto, con una diferencia
  respecto de las colecciones: un grupo **no está en `pm4-registry.json`**, porque el catálogo de
  grupos lo mantiene el área de negocio y cambia sin pasar por el repo. Mismo principio, resuelto en
  runtime.

### 12.3 ⚠ La trampa del `member_id` — una falla silenciosa, no un detalle de tipado

El OpenAPI de PM4 (`docs (4).json`) documenta la respuesta de `GET /groups/{id}/users` como usuarios
planos. **En la práctica devuelve registros con forma de pivote `GroupMember`:** el `id` de primer
nivel es el id de la **fila de `group_members`**, y el id real del usuario viaja en **`member_id`**.

Por qué importa más que cualquier otra cosa de este port: ese id alimenta el `user_id` del PUT de
reasignación. Tomar el `id` del pivote reasigna la tarea **a otro usuario, o a ninguno** — y
**PM4 responde `200` igual**. No hay excepción, no hay alerta, no hay nada que mirar en la pantalla.
Se descubre semanas después, cuando alguien reclama que el caso nunca le llegó.

Por eso `usuariosDeGrupo()` hace `String(in_objUser.member_id ?? in_objUser.id)` —`member_id`
primero, `id` solo como respaldo por si alguna instancia sí devuelve el usuario plano— y por eso la
regla tiene caso propio en dos niveles: en `core/pm4-groups.service.spec.ts` y en el spec de la
pantalla. Invertir esa precedencia pone en rojo cinco casos.

### 12.4 ⚠ `leer()` lee el objeto entero: el `effect` desbocado

`watch('campo')` de react-hook-form se suscribe **a un campo**. Su equivalente en el port,
`leer(campo)`, hace `this.sigValores()()[campo]`: lee el **objeto de valores completo** y recién
después indexa. Dentro de un `computed` eso es inocuo. Dentro de un `effect` que **también escribe**
en el formulario, es una realimentación:

```
escribir cualquier campo → cambia el objeto de valores → el effect se re-dispara
   → cargarUsuariosDelAreaDestino() escribe qd_strNewAssignee → cambia el objeto → …
```

El resultado no es un error: es una tormenta de peticiones a `/api/groups` cada vez que el usuario
teclea en la respuesta al cliente. Invisible en la pantalla, visible en la pestaña de red.

El arreglo, en `seccion-asignacion.ts`, tiene **dos mitades y las dos son necesarias**:

1. Un **`computed` por campo** para la dependencia. Recomputa en cada cambio del formulario, pero
   solo **notifica** cuando cambia *su* string. Eso acota qué re-dispara el `effect`.
2. **`untracked()`** alrededor de la escritura, para que lo que el `effect` escribe no cuente como
   dependencia suya.

**Y una advertencia sobre el test que lo cubre, porque es la parte que más cuesta:** el primer caso
que escribí para esta regla **pasaba con el bug puesto**. Contaba peticiones a `/api/groups` después
de escribir un campo ajeno, lo cual es la medición correcta — pero el área destino no estaba resuelta
y el drenado contestaba `{data:[]}`, así que `cargarUsuariosDelAreaDestino()` nunca escribía nada, no
había realimentación, y no había nada que contar. Para que el caso sirva hay que **resolver el área
antes de medir** y **responder con la forma real del pivote dentro del bucle de conteo**. Está
anotado dentro del propio caso (`«effect acotado»`), y el mensaje de error del drenado apunta ahí en
vez de sugerir que le falten vueltas.

Es el ejemplo más limpio de la regla del proyecto: sin nombrar la línea que se rompió y el test que
se puso rojo, el test no cuenta. Este leía perfecto y no valía nada.

### 12.5 Verificación

- **27 casos** en `detalle-reasignacion-respuesta.spec.ts` — uno por cada RUL de la tabla de §7, más
  los del contrato de PUT, el gate de envío, la prórroga en dos pasos, la marcación derivada y el
  `effect` acotado. `core/pm4-groups.service.spec.ts` cubre la cadena de dos GET y el pivote.
- **Nueve mutaciones verificadas** sobre `detalle-reasignacion-respuesta.ts`,
  `seccion-asignacion.ts`, `core/pm4-groups.service.ts`, `seccion-asignacion.html` y
  `seccion-respuesta.html`. Cada una puso en rojo exactamente el caso que dice cubrir la regla, con
  dos solapamientos legítimos: la mutación del PUT también rompe el caso del borrador (comparten el
  camino), y la del `effect` desbocado rompe cinco casos de escritura (por el drenado). Todas
  revertidas y re-verificadas en verde.
- **`window.location` no se stubea en este spec.** Reemplazarlo por `{ href: '' }` pone los 27 casos
  en rojo, porque el resolvedor de `task_id` y `fijarQueryString()` leen el `location` real. El
  `Error: Not implemented: navigation` que aparece al pie de la corrida es **ruido aceptado y
  documentado**: lo emite el camino de éxito de `guardarBorrador()`, que navega el frame superior a
  la bandeja de PM4. Hay un comentario en el `beforeEach` para que no se vuelva a intentar.
