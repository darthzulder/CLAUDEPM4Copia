# Documentación Funcional — Flujo Combinado: Detalle / Reasignación / Respuesta

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
| Archivos de implementación | `DetalleReasignacionRespuesta.tsx`, `SeccionDetalleCaso.tsx`, `SeccionAsignacion.tsx`, `SeccionRespuesta.tsx` (config centralizada en fields/fields.ts) |
| Versión | 1.0 — 2026-06-30 |

> **Nota de nomenclatura:** el SLUG solicitado fue `COL_QD_Detalle_ Reasignación_Respuesta` (con
> espacio y tilde). Se normalizó a `COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta` (ASCII, sin
> espacios, con código SCR) por la convención de las pantallas QD hermanas y porque el parámetro
> de URL `?screen=` no admite espacios ni acentos. Ver §10.

---

## 2. Resumen

Vista integrada que centraliza la gestión SP2 de una queja radicada: muestra el expediente
completo (datos del consumidor, clasificación regulatoria M1, descripción y estado
SmartSupervision, todo solo lectura), permite **asignar** un responsable (primera vez),
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

### Cabecera (`InfoBar`, solo lectura) — `DetalleReasignacionRespuesta.tsx`

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Case | `qd_strBpmCaseId` | `InfoBar` | FLD-300 en SCR-000 (unificado con SCR-002) |
| SLA | `qd_strSlaAssigned` | `InfoBar` ("N días hábiles") | Inferido de RUL-0051-03 (§10), unificado con SCR-002/008 |
| Estado | `qd_strSsStatus` | `InfoBar` + `ZdsStatusBadge` (`estadoVariant()`) | FLD-079 |
| SmartSupervision | `qd_strSfcCode` | `InfoBar` | FLD-120/140/173 en SCR-008/009/010 |

### S1 — Datos del Consumidor (SEC-047, solo lectura) — `SeccionDetalleCaso.tsx`

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Nombre del Consumidor | (derivado de `qd_strFirstName` + `qd_strLastName` / `qd_strCompanyName`) | `ZdsInput` readOnly | No | Anexo02 > SCR-0051 > FLD-066 |
| Tipo y N.° de Identificación | (derivado de `qd_strIdType` + `qd_strIdNumber`) | `ZdsInput` readOnly | No | Anexo02 > SCR-0051 > FLD-067 |
| Correo Electrónico | `qd_strEmail` | `ZdsInput` readOnly | No | Anexo02 > SCR-0051 > FLD-068 |
| Tipo de Persona | `qd_strPersonType` | `ZdsInput` readOnly | No | Anexo02 > SCR-0051 > FLD-069 |

### S2 — Clasificación Regulatoria M1 (SEC-048, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Canal de Recepción | `qd_strChannel` | `ZdsInput` readOnly | FLD-070 |
| Producto SFC | `qd_strSfcProduct` | `ZdsInput` readOnly | FLD-071 |
| Motivo SFC | `qd_strSfcReason` | `ZdsInput` readOnly | FLD-072 |
| Instancia / Punto de Recepción | `qd_strReceptionInstance` | `ZdsInput` readOnly | FLD-073 |
| Admisión | `qd_strAdmission` | `ZdsInput` readOnly | FLD-074 |
| Ente de Control | `qd_strControlEntity` | `ZdsInput` readOnly | FLD-075 |

### S3 — Descripción de la Queja (SEC-049, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Asunto de la Queja | `qd_strSfcReason` | `ZdsInput` readOnly | FLD-076 |
| Descripción / Texto de la Queja | `qd_strComplaintText` | `ZdsTextarea` readOnly | FLD-077 |

### S4 — Estado SmartSupervision (SEC-050, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Estado SmartSupervision | `qd_strSsStatus` | `ZdsStatusBadge` (semáforo) | FLD-079 |
| Intentos M1/M2 | `qd_strM1M2Attempts` | `ZdsInput` readOnly | FLD-080 |
| Fecha/Hora radicación SFC | `qd_strFilingDate` | `ZdsInput` readOnly | FLD-081 |
| Días hábiles SLA restantes | `qd_strSlaAssigned` | (sistema, alimenta RUL-0051-03) | Inferido de RUL-0051-03 (§10) |

### S5 — Asignación de Responsable (SEC-051, condicional) — `SeccionAsignacion.tsx`

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Área responsable | `qd_strAssigneeArea` | `ZdsSelect` (CAT-AREA) | **Sí** | FLD-082 |
| Usuario responsable | `qd_strAssigneeUser` | `ZdsSelect` filtrado por área | **Sí** | FLD-083 |
| Observaciones de asignación | `qd_strAssignmentRemarks` | `ZdsTextarea` | No | FLD-084 |

### S6 — Reasignación de Caso (SEC-052, condicional)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| ¿Necesitas de otras áreas? (toggle) | `qd_strNeedsOtherAreas` | `ZdsRadio` inline (SI/NO) | — | Inferido de RUL-0051-07 (§10) |
| Responsable actual | `qd_strCurrentAssignee` | usado en historial | No | FLD-090 |
| Área destino | `qd_strTargetArea` | `ZdsSelect` (CAT-AREA) | **Sí** | FLD-091 |
| Responsable (auto) | `qd_strNewAssignee` | `ZdsSelect` disabled (auto por área) | **Sí** (auto) | FLD-092 |
| Motivo de reasignación | `qd_strReassignReason` | `ZdsSelect` (CAT-MOTIVO-REASIG) | **Sí** | FLD-093 |
| Observaciones (justificación) | `qd_strReassignRemarks` | `ZdsTextarea` | **Sí** | FLD-094 |

### S7 — Historial de Asignaciones (SEC-053, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Historial de asignaciones previas | `qd_lstAssignHistory` | Tabla `ZrTable` (Fecha\|De\|Para\|Motivo\|Observaciones\|Respondió\|Comentario\|Adjunto) | FLD-095 |

### S8 — Elaboración de Respuesta Técnica (SEC-054) — `SeccionRespuesta.tsx`

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Observaciones SAC | `qd_strSacRemarks` | `ZdsTextarea` readOnly (condicional) | No | FLD-131 en SCR-008 |
| Respuesta al Cliente (borrador) | `qd_strClientResponse` | `ZdsTextarea` | **Sí** | FLD-110 |
| Acciones Tomadas | `qd_strActionsTaken` | `ZdsTextarea` (condicional) | No | FLD-111 |
| ¿Reconocimiento al cliente? | `qd_strAcknowledgment` | `ZdsInput` readOnly (back) | No | FLD-112 |

### S9 — Soportes Internos (SEC-055)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Adjuntos internos de soporte (máx 10) | `qd_strSupport01..10` | `DocSupportUploader` (multi) | FLD-113 |

### S10 — Configuración de Respuesta (SEC-056)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Respuesta a favor de | `qd_strFavorability` | `ZdsSelect` (CAT-FAVOR) | **Sí** | FLD-151/177/350 (unificado SCR-009/010/0051) |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_strAction` (`CONFIRMAR_ASIGNACION` \| `SOLICITAR_PRORROGA` \| `GUARDAR_BORRADOR` \| `ENVIAR`) | Inferido de ACT-0051-01/04/07/08 (§10) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Respuesta al Cliente obligatoria | `rules.required` en `qd_strClientResponse`; botón "Enviar" deshabilitado si vacío | RUL-0051-05 · MSG-0051-02 · FLD-110 |
| Reasignación: área/motivo/observaciones obligatorios | `reasignacionCompleta` deshabilita "Confirmar Reasignación"; alerta MSG-0051-03 | RUL-0051-04 · MSG-0051-03 |
| Área/Usuario de asignación obligatorios | `rules.required` en FLD-082/083; "Confirmar Asignación" deshabilitado sin usuario | FLD-082/083 (Oblig.) · ACT-0051-01 |
| Respuesta a favor de obligatoria | `rules.required` en `qd_strFavorability`; integrado en `puedeEnviar` | FLD-151/177/350 |
| Usuario filtrado por área | `qd_strAssigneeUser` carga `USUARIOS_POR_AREA[area]`; disabled sin área | RUL-0051-02 |
| Máx. 4 ayudantes | `ayudantesAlcanzado` oculta el formulario de añadir y muestra MSG-0051-06 | RUL-0051-08 · MSG-0051-06 |
| SLA crítico | `slaCritico = slaRestante <= 2` → banner rojo + habilita "Solicitar Prórroga" | RUL-0051-03 · MSG-0051-01 |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-0051-01 SLA crítico | `slaRestante <= 2` | `ZrAlert config="negative"` superior | 06_Mensajes > MSG-0051-01 |
| MSG-0051-02 Respuesta vacía | `respuestaCliente` vacío | `ZrAlert config="info"` + "Enviar" disabled | 06_Mensajes > MSG-0051-02 |
| MSG-0051-03 Reasignación incompleta | área/motivo/obs vacíos | `ZrAlert config="info"` en S6 + botón disabled | 06_Mensajes > MSG-0051-03 |
| MSG-0051-04 Asignación registrada | Tras confirmar asignación | **No en UI** — lo emite el BPM tras `completeTask` | 06_Mensajes > MSG-0051-04 |
| MSG-0051-05 Enviado a SAC | Tras enviar | **No en UI** — lo emite el BPM al avanzar a SP2-T04 | 06_Mensajes > MSG-0051-05 |
| MSG-0051-06 Límite de ayudantes | `historial >= 4` | `ZrAlert config="alert"` en S6 | 06_Mensajes > MSG-0051-06 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-0051-01 — ocultar asignación si ya hay responsable | `mostrarAsignacion = !qd_blnHasAssignee` | SCR-0051 > RUL-0051-01 |
| RUL-0051-02 — usuarios solo del área seleccionada | `USUARIOS_POR_AREA[area]` (placeholder) | SCR-0051 > RUL-0051-02 |
| RUL-0051-03 — SLA ≤ 2 habilita prórroga + banner | `slaCritico` controla banner y botón | SCR-0051 > RUL-0051-03 |
| RUL-0051-04 (🔴) — reasignación con campos obligatorios | botón disabled + alerta | SCR-0051 > RUL-0051-04 |
| RUL-0051-05 (🔴) — respuesta obligatoria para enviar | botón disabled + alerta | SCR-0051 > RUL-0051-05 |
| RUL-0051-06 (🔴) — no asignar a usuario fuera del proceso | Cubierto parcialmente: solo se ofrecen usuarios del catálogo placeholder (no hay entrada libre) | SCR-0051 > RUL-0051-06 |
| RUL-0051-07 — mostrar reasignación si "¿otras áreas?" = Sí | `mostrarReasignacion = necesitaOtrasAreas === 'SI'` | SCR-0051 > RUL-0051-07 |
| RUL-0051-08 — máx. 4 ayudantes | `ayudantesAlcanzado` | SCR-0051 > RUL-0051-08 |
| RUL-0051-09 — "Acciones Tomadas" si favor = Cliente | `mostrarAcciones = qd_strFavorability === '1'` (código CAT-FAVORAB) | SCR-0051 > RUL-0051-09 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Expediente completo solo lectura (S1-S4) | `SeccionDetalleCaso` con `ZdsInput/ZdsTextarea readOnly` + badge | SEC-047..050 |
| Semáforo de estado SFC | `ZdsStatusBadge` con `estadoVariant()` | FLD-079 |
| Añadir ayudante a historial | "Confirmar Reasignación" hace `push` a `qd_lstAssignHistory` y limpia el draft | ACT-0051-03 · FLD-095 |
| Responsable autocompletado por área | `useEffect` → `RESPONSABLE_POR_AREA[areaDestino]` | FLD-092 |
| Acciones Tomadas condicional | render condicional por `qd_strFavorability` | RUL-0051-09 |
| Carga múltiple de soportes (máx 10) | `DocSupportUploader max=10` | FLD-113 |
| Ver Expediente / Vista Previa | `ZrModal` (link / secondary) | ACT-0051-06 / ACT-0051-05 |
| Estados loading/error/submitting | `ZrLoader`, `ZrAlert`, botones `loading/disabled` | CLAUDE.md |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strAssigneeArea` | `qd_strAssigneeUser` | Filtra la lista de usuarios; lo deshabilita sin área | RUL-0051-02 |
| `qd_strTargetArea` | `qd_strNewAssignee` | Autocompleta el responsable | FLD-092 |
| `qd_strNeedsOtherAreas` | S6 + S7 | Muestra/oculta reasignación e historial | RUL-0051-07 |
| `qd_strFavorability` | `qd_strActionsTaken` | Muestra "Acciones Tomadas" si = Cliente | RUL-0051-09 |
| `qd_blnHasAssignee` | S5 + botón "Confirmar Asignación" | Oculta asignación si ya hay responsable | RUL-0051-01 |
| `qd_strSlaAssigned` | banner SLA + "Solicitar Prórroga" | Habilita si ≤ 2 | RUL-0051-03 |
| `qd_lstAssignHistory` | formulario de ayudante | Oculta al llegar a 4 | RUL-0051-08 |

---

## 10. Suposiciones Realizadas

- **Slug normalizado** (ver §1).
- **Catálogos como OPTIONS estáticas placeholder.** No se entregaron colecciones PM4 para
  CAT-AREA, CAT-USUARIOS-ROLE, CAT-MOTIVO-REASIG ni CAT-FAVOR (07_Catalogs los marca "Activo —
  Zurich/BPM" o "Pendiente TI"). Se implementaron como `OPTIONS`/mapas estáticos con los valores
  de ejemplo del insumo (`USUARIOS_POR_AREA`, `RESPONSABLE_POR_AREA`). Deben reemplazarse por
  `useCollection` cuando se entreguen los IDs.
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
- **FLD-092 como `ZdsSelect` disabled** (en vez de label): el DS no tiene un control "label de solo
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
| Campos (FLD-066..350) | 29/29 (100%) | Todos implementados (incl. `slaRestante`/toggle como inferidos) |
| Secciones (SEC-047..056) | 10/10 (100%) | S1-S10 |
| Acciones (ACT-0051-01..08) | 8/8 (100%) | Asignar, Reasignar(toggle), Confirmar Reasig., Prórroga, Vista Previa, Expediente, Borrador, Enviar |
| Reglas (RUL-0051-01..09) | 9/9 (100%) | RUL-0051-06 cubierta parcialmente (catálogo placeholder) |
| Mensajes (MSG-0051-01..06) | 4/6 en UI | MSG-0051-04/05 los emite el BPM |
| Catálogos (CAT-AREA/USUARIOS/MOTIVO/FAVOR) | 4/4 como placeholder | Pendiente colección PM4 |

**Elementos inferidos:** prefijo `qd_*`, `qd_strAction`, `qd_strNeedsOtherAreas`, `qd_strSlaAssigned`,
`qd_blnHasAssignee`, catálogos estáticos placeholder, FLD-092 como select disabled, límites
`maxLength`, modales de vista previa/expediente como placeholder.
