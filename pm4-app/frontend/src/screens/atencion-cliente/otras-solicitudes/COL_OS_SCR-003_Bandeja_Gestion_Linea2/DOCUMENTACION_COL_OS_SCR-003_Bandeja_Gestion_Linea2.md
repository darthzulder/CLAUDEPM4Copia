# DOCUMENTACIÓN — COL_OS_SCR-003_Bandeja_Gestion_Linea2

## 1. Encabezado

| Dato | Valor |
|---|---|
| **Pantalla** | SCR-003 · PAN-03 — Bandeja de Tareas — Gestión Línea 2 |
| **Proceso BPMN** | P02 — Otras Solicitudes |
| **Tarea BPMN** | P02-T12 — Gestión Línea 2 |
| **Rol responsable** | Usuario de Línea 2 (área especializada) |
| **Slug (`?screen=`)** | `COL_OS_SCR-003_Bandeja_Gestion_Linea2` |
| **Versión del insumo** | Anexo02 Mockups TO-BE Otras Solicitudes **v3.1** (ago-2026) |
| **Archivos de implementación** | [`GestionLinea2.tsx`](GestionLinea2.tsx) · [`ReasignarCasoModal.tsx`](ReasignarCasoModal.tsx) · [`../fields/fields.ts`](../fields/fields.ts) · [`GestionLinea2.test.tsx`](GestionLinea2.test.tsx) |
| **Componentes reusados** | `ScreenHeader`, `InfoBar`, `FormSection`, `RequestFileList`, `DocSupportUploader`, `ActionBar`, `ZdsInput`, `ZdsTextarea`, `ZdsSelect`, `ZdsStatusBadge` |

Es la **primera pantalla del proceso Otras Solicitudes**, así que además del formulario
crea el registro de campos `os_*` (`otras-solicitudes/fields/fields.ts`), equivalente al
registro `QD` de Quejas Directas.

---

## 2. Resumen

El usuario del área especializada (Línea 2) recibe en su bandeja los casos que la compuerta
**¿Requiere Línea 2?** le enrutó. La pantalla le muestra el estado del caso y su SLA (S1), el
detalle completo del caso y los documentos que cargó el cliente (S2, solo lectura), y le pide
documentar el **análisis técnico / resolución** y las **acciones ejecutadas en sistemas** (S3),
más los **soportes internos** que respaldan el análisis y que *no* se envían al cliente (S4).

Al confirmar la atención, la respuesta de Línea 2 queda en el expediente y el caso retorna al
flujo principal (P02 → SP05 o cierre interno).

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02_Index (OS) | `screens/SCR-003.md` | Ficha completa de la pantalla: secciones, campos, acciones, reglas, mensajes, permisos, trazabilidad |
| Anexo02_Index (OS) | `masters/01_Pantallas` | Tipo de pantalla, tarea BPMN, rol, historia de usuario y criterio de aceptación |
| Anexo02_Index (OS) | `masters/02_Secciones` | SEC-009..SEC-012: orden, columnas visuales, visibilidad |
| Anexo02_Index (OS) | `masters/03_Campos` | Diccionario maestro FLD-040..FLD-052 (fuente de verdad de los campos) |
| Anexo02_Index (OS) | `masters/04_Acciones` | ACT-003-01..04: etiqueta, tipo, condición, siguiente paso BPMN |
| Anexo02_Index (OS) | `masters/05_Reglas` | RUL-003-01 (bloqueante) |
| Anexo02_Index (OS) | `masters/06_Mensajes` | MSG-003-01 |
| Anexo02_Index (OS) | `masters/07_Catalogs` | CAT-AREA (áreas responsables, usado por el modal de reasignación) |
| Anexo02_Index (OS) | `masters/08_Permisos` | PER-005 / PER-006 |
| Anexo02_Index (OS) | `masters/10_Trazabilidad_BPMN` | Evento de apertura, acción de cierre, compuerta, datos in/out |
| Anexo02 Mockups OS | `Anexo02_Mockups_TOBE_OtrasSolicitudes_v3_1.html` (`#screen-scr003`) | Maqueta visual: orden de secciones, ctx-bar, grillas g4/g2, textos de placeholder y ayuda, orden de los botones |

---

## 4. Campos Implementados

### S1 · Encabezado Estado del Caso (SEC-009)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| ID Caso / Código Radicado | `os_strBpmCaseId` | Texto (solo lectura) | No | Anexo02 > 03_Campos > FLD-040 (`idCaso`) |
| Tipología del Caso | `os_strCaseType` | Badge/Estado (solo lectura) | No | Anexo02 > 03_Campos > FLD-041 (`tipologia`) |
| SLA: Días Hábiles Restantes | `os_intSlaRemaining` | Número, badge semaforizado (solo lectura) | No | Anexo02 > 03_Campos > FLD-042 (`slaRestante`, "Semaforizado") |
| Fecha Límite | `os_strDueDate` | Fecha como texto (solo lectura) | No | Anexo02 > 03_Campos > FLD-043 (`fechaLimite`) |

### S2 · Detalle del Caso Asignado (SEC-010)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Nombre del Consumidor | `os_strConsumerName` | Texto (solo lectura) | No | Anexo02 > 03_Campos > FLD-044 (`nombreConsumidor`) |
| Tipo y N.° de Identificación | `os_strIdentification` | Texto (solo lectura) | No | Anexo02 > 03_Campos > FLD-045 (`identificacion`) |
| Producto / Ramo | `os_strProductLine` | Texto (solo lectura) | No | Anexo02 > 03_Campos > FLD-046 (`productoRamo`) |
| Descripción del Caso | `os_strCaseDescription` | Área de texto (solo lectura) | No | Anexo02 > 03_Campos > FLD-047 (`descripcion`) |
| Documentos del Cliente | `os_strAttach01..05` (vía `RequestFileList`) | Lista de adjuntos (ver/descargar) | No | Anexo02 > 03_Campos > FLD-048 (`adjuntos`, "Solo visualización y descarga") |

### S3 · Análisis y Respuesta Técnica (SEC-011)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Análisis Técnico / Resolución | `os_strTechAnalysis` | Área de texto | **Sí** (mín. 100 car.) | Anexo02 > 03_Campos > FLD-049 (`analisisTecnico`) |
| Acciones Ejecutadas en Sistemas | `os_strSystemActions` | Área de texto | No | Anexo02 > 03_Campos > FLD-050 (`accionesEjecutadas`) |

### S4 · Soportes Internos (SEC-012)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Adjuntos de Soporte Interno | `os_strSupportDoc01..10` (vía `DocSupportUploader`) | Archivo (multi, máx 10) | No | Anexo02 > 03_Campos > FLD-052 (`adjuntosSoporte`, "Máx 10 archivos · No van al cliente") |

### Campos de soporte sin FLD

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Área especializada (modal de reasignación) | `os_strAssigneeArea` | Select (CAT-AREA) | Inferido — ver §10 |
| Usuario de Línea 2 (modal de reasignación) | `os_strAssigneeUser` | Select (usuarios del grupo PM4) | Inferido — ver §10 |
| Acción de flujo con la que se cerró la pantalla | `os_strAction` | Texto (`CONFIRMAR_ATENCION`/`REASIGNAR`/`GUARDAR_BORRADOR`) | Inferido — ver §10 |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Análisis técnico no vacío | `rules.required` en `os_strTechAnalysis` + el botón *Confirmar Atención* queda deshabilitado mientras esté vacío | Anexo02 > 03_Campos > FLD-049 ("Campo no vacío") · 05_Reglas > RUL-003-01 |
| Análisis técnico mínimo 100 caracteres | `rules.minLength = 100`; el mensaje se muestra en el campo al enviar | Anexo02 > 03_Campos > FLD-049 ("Mín 100 car.") |
| Soportes internos máx. 10 archivos | `DocSupportUploader max={10}` (no deja agregar un slot 11) | Anexo02 > 03_Campos > FLD-052 ("Máx 10 archivos") |
| Tipo/tamaño de cada soporte | Heredado de `DocSupportUploader`: pdf/doc/docx/jpg/jpeg/png, máx 5 MB | Inferido — ver §10 |

---

## 6. Mensajes de Error

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| **MSG-003-01** — *"Debe documentar el análisis o resolución antes de confirmar la atención."* | `analisisTecnico` vacío | `ZrAlert config="info"` permanente sobre la barra de acciones mientras el campo esté vacío, + `rules.required` con el mismo texto sobre el campo | Anexo02 > 06_Mensajes > MSG-003-01 · 05_Reglas > RUL-003-01 |
| Aviso de SLA en zona de vencimiento | `slaRestante ≤ 2` días hábiles | `ZrAlert config="negative"` bajo el `InfoBar` | Anexo02 > 03_Campos > FLD-042 ("Semaforizado") — texto redactado, ver §10 |
| Error de envío a PM4 | La llamada a `completeTask`/`saveDraft`/`reassignTask` falla | `ZrAlert config="negative"` con el mensaje devuelto por PM4 | Convención del proyecto (no del insumo) — ver §10 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| **RUL-003-01** (🔴 BLOQUEA) — `analisisTecnico` vacío al confirmar → bloquear y mostrar MSG-003-01 | `blnCanSubmit = !!os_strTechAnalysis.trim()` deshabilita *Confirmar Atención*; `handleSubmit` no llega a `completeTask` si la validación falla | Anexo02 > 05_Reglas > RUL-003-01 |
| **ACT-003-01** Confirmar Atención Línea 2 → registra la respuesta y retorna el caso al flujo principal (P02 → SP05 o cierre interno) | `completeTask({ …form, os_strAction: 'CONFIRMAR_ATENCION' })` tras subir los soportes | Anexo02 > 04_Acciones > ACT-003-01 |
| **ACT-003-02** Reasignar Caso → modal de reasignación a otro usuario de Línea 2 | `ReasignarCasoModal` + `reassignTask(payload, userId)` (PUT `/tasks/{id}` solo con `user_id`): cambia el responsable **sin** completar la tarea | Anexo02 > 04_Acciones > ACT-003-02 |
| **ACT-003-03** Cancelar → descarta los cambios | `reset()` a los valores de `task.data` + limpieza del `fileRegistry` | Anexo02 > 04_Acciones > ACT-003-03 |
| **ACT-003-04** Guardar Borrador → guarda el progreso sin avanzar el flujo | `saveDraft(payload)` y, si sale bien, devuelve el frame superior al home de tareas de PM4 | Anexo02 > 04_Acciones > ACT-003-04 |
| **PER-005 / PER-006** — Línea 2 y Líder/Analista SAC pueden ver y editar; nadie aprueba ni rechaza | No hay acciones de aprobar/rechazar en la pantalla. El control de acceso lo aplica PM4 al asignar la tarea, no el frontend | Anexo02 > 08_Permisos > PER-005, PER-006 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Barra de contexto del caso (caso, SLA, tipología, estado) | `InfoBar` con 4 items; SLA y tipología como `ZdsStatusBadge` | Maqueta HTML `#screen-scr003` > `.ctx-bar` |
| Semáforo del SLA | `estadoSlaPorDiasRestantes` + `estadoSlaVariant` (`core/businessDays.ts`) con umbral 2: `info` (Abierta) / `warning` (Por Vencer) / `danger` (Vencida) | Anexo02 > 03_Campos > FLD-042 · umbral tomado de Quejas Directas (ver §10) |
| S1 en 4 columnas / S2-S3 en 2 columnas | `form-row cols-4` y `form-row cols-2`/`cols-1` | Maqueta HTML: `.g4` en S1, `.g2` (+ `span2`) en S2/S3 |
| Campos de S1 y S2 en solo lectura | `readOnly` en los `ZdsInput`/`ZdsTextarea`; los badges no son editables | Anexo02 > 03_Campos (columna *Solo Lectura* = Sí en FLD-040..048) |
| Documentos del cliente: ver y descargar | `RequestFileList` (previsualizar + descargar), sin opción de borrar | Anexo02 > 03_Campos > FLD-048 |
| Soportes internos: agregar/quitar hasta 10 filas | `DocSupportUploader` con leyenda "No van al cliente" | Anexo02 > 03_Campos > FLD-052 · maqueta HTML `.file-zone` |
| Orden de los botones: Cancelar · Reasignar Caso · Guardar Borrador · Confirmar Atención | `ActionBar` en ese orden; solo *Confirmar Atención* es primaria (`config="positive"`) | Maqueta HTML `.actions` · Anexo02 > 04_Acciones (tipo Primaria/Secundaria) |
| Estados de carga y error de la tarea | `ZrLoader` mientras carga, `ZrAlert` si `useTask` falla | Convención del proyecto |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `os_strTechAnalysis` | Botón *Confirmar Atención* | Vacío → botón deshabilitado + MSG-003-01 visible | Anexo02 > 05_Reglas > RUL-003-01 |
| `os_intSlaRemaining` | Badge de SLA (InfoBar y S1) + banner de SLA crítico | ≤ 2 días hábiles → badge `warning`/`danger` y banner rojo | Anexo02 > 03_Campos > FLD-042 |
| `os_strAssigneeArea` (modal) | `os_strAssigneeUser` (modal) | Al cambiar el área se recargan los usuarios del grupo PM4 homónimo y se preselecciona el primero | Inferido — ver §10 |
| `os_strAssigneeUser` (modal) | Botón *Confirmar reasignación* | Sin usuario resuelto → botón deshabilitado | Inferido — ver §10 |

---

## 10. Suposiciones Realizadas

1. **Nombres físicos `os_*`.** El Anexo02 da el "Nombre Técnico" en español (`idCaso`,
   `analisisTecnico`, …); se aplicó la convención del proyecto —`os_` + prefijo de tipo +
   nombre en inglés— igual que en Quejas Directas
   (`docs/guides/nomenclatura-variables.md`). El mapeo FLD ↔ nombre físico está comentado
   campo por campo en `fields/fields.ts`. **Son contrato con PM4**: el proceso P02 debe
   emitir/esperar exactamente estos nombres.
2. **`os_strAttach01..05` para los documentos del cliente (FLD-048).** El Anexo02 declara
   `adjuntos` como una *lista* de archivos del caso, pero SCR-003 es hoy la primera pantalla
   OS implementada, así que **no existe todavía la pantalla de radicación que los produce** y
   sus `data_name` reales no están definidos en ningún insumo. Se asumieron 5 slots, igual
   que en Quejas Directas. **A confirmar** cuando se construya la pantalla de radicación de
   Otras Solicitudes; si los nombres cambian, solo se toca `OS_CLIENT_DOC_KEYS`.
3. **`os_strSupportDoc01..10` para FLD-052.** El insumo dice "Archivo (multi), máx 10" sin
   nombrar los slots; se usó un `data_name` por slot, que es como PM4 recibe los archivos
   (`?data_name=`).
4. **Campos de la reasignación (`os_strAssigneeArea`, `os_strAssigneeUser`).**
   ACT-003-02 describe el modal pero `03_Campos` no le asigna ningún FLD. Se añadieron los
   dos campos para dejar registrado en el caso a quién se reasignó.
5. **El área del modal usa CAT-AREA y su etiqueta es el nombre del grupo PM4.** El insumo no
   dice de dónde salen los usuarios de Línea 2; se resuelven con `fetchGroupUsers`
   (`core/pm4Groups.ts`) buscando el grupo PM4 cuyo nombre coincide con la etiqueta del
   catálogo. Si en PM4 los grupos se llaman distinto, hay que ajustar `OPTIONS_AREA`.
   `CAT-USUARIOS-ROLE` está marcado como **DUMMY** en `07_Catalogs` ("catálogo dinámico: BPM
   lo resuelve filtrado por área y rol autorizado"), y por eso no se usó como lista estática.
6. **Umbral de semáforo del SLA = 2 días hábiles.** FLD-042 dice "Semaforizado" pero no da el
   corte; se tomó el mismo umbral que Quejas Directas (SCR-0051/SCR-013) para que el color
   signifique lo mismo en los dos procesos.
7. **`os_intSlaRemaining` llega ya calculado.** A diferencia de Quejas Directas —donde los
   días restantes se derivan en el cliente de la fecha de radicación + SLA—, aquí FLD-042
   tiene *Fuente = Sistema*, así que la pantalla solo lo lee y semaforiza. Se parsea de forma
   defensiva (`Number.parseInt(String(...))`) porque PM4 puede mandarlo vacío o como texto.
8. **"Estado: Asignado a Línea 2" es un rótulo fijo.** Aparece en la ctx-bar de la maqueta
   pero no es un campo de `03_Campos`; mientras la pantalla está abierta la tarea *es* la de
   Línea 2 (P02-T12), así que se rotula fijo en vez de inventar una variable.
9. **`os_strAction`.** No está en el Anexo02; replica la convención de Quejas Directas para
   que el gateway BPMN sepa con qué botón se cerró la pantalla.
10. **Validación de tipo/tamaño de los soportes internos** (pdf/doc/docx/jpg/jpeg/png, 5 MB):
    viene de `DocSupportUploader`, no del insumo. El Anexo02 solo topa la cantidad.
11. **Textos redactados** que no están literales en el insumo: el banner de SLA crítico, el
    aviso de error de envío y la ayuda del modal de reasignación.
12. **Campo de la maqueta que NO se implementó: "Número de Póliza"** (S2 del HTML). No existe
    en `03_Campos` para SCR-003 y, por la política del Anexo02 de Otras Solicitudes, **ante
    conflicto entre maqueta y maestro gana el maestro**. Si el campo debe existir, primero hay
    que darlo de alta en `03_Campos` con su FLD.
13. **Refactor asociado:** `fetchGroupUsers` estaba embebido en `SeccionAsignacion.tsx`
    (SCR-0051 de Quejas Directas); se movió sin cambios de comportamiento a
    `core/pm4Groups.ts` para que las dos pantallas usen la misma resolución de usuarios de
    grupo PM4 (incluida la trampa `member_id` vs `id`), y se cubrió con tests.

---

## 11. Cobertura de Trazabilidad

| Categoría | Elementos en el insumo | Implementados | Cobertura |
|---|---|---|---|
| Secciones (SEC-009..012) | 4 | 4 | **100 %** |
| Campos (FLD-040..052) | 12 | 12 | **100 %** |
| Acciones (ACT-003-01..04) | 4 | 4 | **100 %** |
| Reglas (RUL-003-01) | 1 | 1 | **100 %** |
| Mensajes (MSG-003-01) | 1 | 1 | **100 %** |
| Catálogos | 0 declarados para SCR-003 | — (CAT-AREA usado por la reasignación, inferido) | n/a |
| Permisos (PER-005/006) | 2 | 2 (delegados a PM4) | **100 %** |
| Trazabilidad BPMN | 1 fila | 1 (`os_strAction` marca la salida) | **100 %** |

**Elementos inferidos** (sin respaldo explícito en el insumo): los `data_name` de los adjuntos
del cliente y de los soportes internos, los dos campos del modal de reasignación, `os_strAction`,
el umbral del semáforo de SLA, el origen de los usuarios de Línea 2 y los textos redactados.
Detalle en §10.

**Pendiente de validación con negocio/TI:**
- `data_name` reales de los documentos del cliente (dependen de la pantalla de radicación OS).
- Nombres de los grupos PM4 de las áreas de Línea 2 (`OPTIONS_AREA`).
- Si "Número de Póliza" debe existir en S2 (hoy fuera del maestro).

---

## 12. Tests

| Archivo | Qué cubre |
|---|---|
| [`GestionLinea2.test.tsx`](GestionLinea2.test.tsx) | Render de las 4 secciones · precarga de `task.data` en los campos `os_*` · **RUL-003-01** en sus dos sentidos (bloquea vacío / habilita con análisis) · semáforo y banner de SLA (con y sin holgura) · presencia de las 4 acciones |
| [`../../../../core/pm4Groups.test.ts`](../../../../core/pm4Groups.test.ts) | `fetchGroupUsers`: match exacto de grupo, normalización de nombre, fallback al primero, grupo inexistente, `member_id` vs `id`, descarte de registros sin username |
| `App.smoke.test.tsx` | Monta la pantalla por su slug real (guarda de inventario) |

**Mutaciones verificadas** (se rompió el código a propósito y el test se puso en rojo):

| Mutación | Test que falló |
|---|---|
| `blnCanSubmit = true` (anula RUL-003-01) | *bloquea Confirmar Atención mientras no haya análisis técnico* |
| Umbral del semáforo `≤ 2` → `≤ -99` | *semaforiza el SLA y avisa cuando quedan pocos días hábiles* |
| `member_id ?? id` → `id` en `fetchGroupUsers` | *toma el user_id de member_id* y *descarta los registros sin username* |
