# DOCUMENTACIÓN — COL_OS_SCR-003_Bandeja_Gestion_Linea2

> **Port a Angular 21 (Fase 5, pantalla 6 de 12).** La trazabilidad funcional de las §1–§11 se
> conserva **textual** respecto de la versión React: los FLD/RUL/MSG/ACT son contrato con el Anexo02,
> no con el framework. Lo único que se actualizó ahí son los **archivos de implementación** (§1) y los
> nombres de los componentes y helpers, porque nombran cosas que sí cambiaron. Lo que el port agregó
> está en la **§12**, al final.
>
> Es la **primera pantalla portada del proceso P02 — Otras Solicitudes**, así que también es la primera
> del registro `os_*` en Angular.

## 1. Encabezado

| Dato | Valor |
|---|---|
| **Pantalla** | SCR-003 · PAN-03 — Bandeja de Tareas — Gestión Línea 2 |
| **Proceso BPMN** | P02 — Otras Solicitudes |
| **Tarea BPMN** | P02-T12 — Gestión Línea 2 |
| **Rol responsable** | Usuario de Línea 2 (área especializada) |
| **Slug (`?screen=`)** | `COL_OS_SCR-003_Bandeja_Gestion_Linea2` |
| **Versión del insumo** | Anexo02 Mockups TO-BE Otras Solicitudes **v3.1** (ago-2026) |
| **Archivos de implementación** | [`gestion-linea2.ts`](gestion-linea2.ts) · [`gestion-linea2.html`](gestion-linea2.html) · [`reasignar-caso-modal.ts`](reasignar-caso-modal.ts) · [`../fields/fields.ts`](../fields/fields.ts) |
| **Specs** | [`gestion-linea2.spec.ts`](gestion-linea2.spec.ts) (30 casos) · [`reasignar-caso-modal.spec.ts`](reasignar-caso-modal.spec.ts) (11 casos) |
| **Componentes reusados** | `ScreenHeaderComponent`, `InfoBarComponent`, `FormSectionComponent`, `RequestFileListComponent`, `DocSupportUploaderComponent`, `ActionBarComponent`, `ZdsInput`, `ZdsTextarea`, `ZdsSelect`, `ZdsStatusBadge`, `ZrAlertInline`, `ZrButton`, `ZrLoader` |
| **Versión** | 2.0 — 2026-08-17 (port a Angular 21; 1.0 React, ago-2026) |

Es la **primera pantalla del proceso Otras Solicitudes**, así que además del formulario
estrena el registro de campos `os_*` ([`../fields/fields.ts`](../fields/fields.ts)), equivalente al
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
| Documentos del Cliente | `os_strAttach01..05` (vía `RequestFileListComponent`) | Lista de adjuntos (ver/descargar) | No | Anexo02 > 03_Campos > FLD-048 (`adjuntos`, "Solo visualización y descarga") |

### S3 · Análisis y Respuesta Técnica (SEC-011)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Análisis Técnico / Resolución | `os_strTechAnalysis` | Área de texto | **Sí** (mín. 100 car.) | Anexo02 > 03_Campos > FLD-049 (`analisisTecnico`) |
| Acciones Ejecutadas en Sistemas | `os_strSystemActions` | Área de texto | No | Anexo02 > 03_Campos > FLD-050 (`accionesEjecutadas`) |

### S4 · Soportes Internos (SEC-012)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Adjuntos de Soporte Interno | `os_strSupportDoc01..10` (vía `DocSupportUploaderComponent`) | Archivo (multi, máx 10) | No | Anexo02 > 03_Campos > FLD-052 (`adjuntosSoporte`, "Máx 10 archivos · No van al cliente") |

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
| Análisis técnico no vacío | `Validators.required` en `os_strTechAnalysis` + el botón *Confirmar Atención* queda deshabilitado mientras esté vacío (`blnPuedeConfirmar`, con `trim()`) | Anexo02 > 03_Campos > FLD-049 ("Campo no vacío") · 05_Reglas > RUL-003-01 |
| Análisis técnico mínimo 100 caracteres | `Validators.minLength(SCR003_MIN_ANALISIS)`; el mensaje se muestra en el campo. **No apaga el botón** — ver §12.3 | Anexo02 > 03_Campos > FLD-049 ("Mín 100 car.") |
| Soportes internos máx. 10 archivos | `DocSupportUploaderComponent [max]="10"` (no deja agregar un slot 11) | Anexo02 > 03_Campos > FLD-052 ("Máx 10 archivos") |
| Tipo/tamaño de cada soporte | Heredado de `DocSupportUploaderComponent`: pdf/doc/docx/jpg/jpeg/png, máx 5 MB | Inferido — ver §10 |

---

## 6. Mensajes de Error

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| **MSG-003-01** — *"Debe documentar el análisis o resolución antes de confirmar la atención."* | `analisisTecnico` vacío | `ZrAlertInline config="info"` permanente sobre la barra de acciones mientras el campo esté vacío, + el mismo texto como error del campo **después del primer intento de confirmar** (`strErrorAnalisis`) | Anexo02 > 06_Mensajes > MSG-003-01 · 05_Reglas > RUL-003-01 |
| Aviso de SLA en zona de vencimiento | `slaRestante ≤ 2` días hábiles | `ZrAlertInline config="negative"` bajo el `InfoBarComponent` (`blnSlaCritico`) | Anexo02 > 03_Campos > FLD-042 ("Semaforizado") — texto redactado, ver §10 |
| Error de envío a PM4 | La llamada a `completarTarea`/`guardarBorrador`/`reasignarTarea` falla | `ZrAlertInline config="negative"` con el mensaje devuelto por PM4 (`strErrorEnvio`, vía `mensajeDeError`) | Convención del proyecto (no del insumo) — ver §10 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| **RUL-003-01** (🔴 BLOQUEA) — `analisisTecnico` vacío al confirmar → bloquear y mostrar MSG-003-01 | `blnPuedeConfirmar = !!analisis.trim()` deshabilita *Confirmar Atención*; `confirmarAtencion()` no llega a `completarTarea` si la validación falla (early-return + `markAllAsTouched` + `scrollToFirstError`) | Anexo02 > 05_Reglas > RUL-003-01 |
| **ACT-003-01** Confirmar Atención Línea 2 → registra la respuesta y retorna el caso al flujo principal (P02 → SP05 o cierre interno) | `completarTarea({ …form, os_strAction: 'CONFIRMAR_ATENCION' })` tras subir los soportes | Anexo02 > 04_Acciones > ACT-003-01 |
| **ACT-003-02** Reasignar Caso → modal de reasignación a otro usuario de Línea 2 | `ReasignarCasoModal` + `reasignarTarea(payload, userId)` (PUT `/tasks/{id}` solo con `user_id`): cambia el responsable **sin** completar la tarea | Anexo02 > 04_Acciones > ACT-003-02 |
| **ACT-003-03** Cancelar → descarta los cambios | `form.reset()` a los valores de `task.data` + `objRegistro.limpiar()` del `FileRegistryService`. **Sin PUT**: es local, y por eso no tiene valor de `os_strAction` | Anexo02 > 04_Acciones > ACT-003-03 |
| **ACT-003-04** Guardar Borrador → guarda el progreso sin avanzar el flujo | `guardarBorrador(payload)` y, **solo si sale bien**, devuelve el frame superior al home de tareas de PM4 | Anexo02 > 04_Acciones > ACT-003-04 |
| **PER-005 / PER-006** — Línea 2 y Líder/Analista SAC pueden ver y editar; nadie aprueba ni rechaza | No hay acciones de aprobar/rechazar en la pantalla. El control de acceso lo aplica PM4 al asignar la tarea, no el frontend | Anexo02 > 08_Permisos > PER-005, PER-006 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Barra de contexto del caso (caso, SLA, tipología, estado) | `InfoBarComponent` con 4 items; SLA, tipología y estado como `ZdsStatusBadge` pasados como `TemplateRef` | Maqueta HTML `#screen-scr003` > `.ctx-bar` |
| Semáforo del SLA | `estadoSlaPorDiasRestantes` + `estadoSlaVariant` (`core/business-days.ts`) con umbral 2 (`SCR003_SLA_UMBRAL_PROXIMO`): `info` (Abierta) / `warning` (Por Vencer) / `danger` (Vencida) | Anexo02 > 03_Campos > FLD-042 · umbral tomado de Quejas Directas (ver §10) |
| S1 en 4 columnas / S2-S3 en 2 columnas | `form-row cols-4` y `form-row cols-2`/`cols-1` | Maqueta HTML: `.g4` en S1, `.g2` (+ `span2`) en S2/S3 |
| Campos de S1 y S2 en solo lectura | `[readOnly]="true"` en los `ZdsInput`/`ZdsTextarea`; los badges no son editables | Anexo02 > 03_Campos (columna *Solo Lectura* = Sí en FLD-040..048) |
| Documentos del cliente: ver y descargar | `RequestFileListComponent` (previsualizar + descargar), sin opción de borrar | Anexo02 > 03_Campos > FLD-048 |
| Soportes internos: agregar/quitar hasta 10 filas | `DocSupportUploaderComponent` con leyenda "No van al cliente" | Anexo02 > 03_Campos > FLD-052 · maqueta HTML `.file-zone` |
| Orden de los botones: Cancelar · Reasignar Caso · Guardar Borrador · Confirmar Atención | `ActionBarComponent` en ese orden; solo *Confirmar Atención* es primaria (`config="positive"`) | Maqueta HTML `.actions` · Anexo02 > 04_Acciones (tipo Primaria/Secundaria) |
| Estados de carga y error de la tarea | `ZrLoader` mientras carga, `ZrAlertInline` si la carga de `TaskService` falla | Convención del proyecto |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `os_strTechAnalysis` | Botón *Confirmar Atención* | Vacío (o solo blancos) → botón deshabilitado + MSG-003-01 visible | Anexo02 > 05_Reglas > RUL-003-01 |
| `os_intSlaRemaining` | Badge de SLA (InfoBar y S1) + banner de SLA crítico | ≤ 2 días hábiles → badge `warning`/`danger` y banner rojo | Anexo02 > 03_Campos > FLD-042 |
| `os_strAssigneeArea` (modal) | `os_strAssigneeUser` (modal) | Al cambiar el área se recargan los usuarios del grupo PM4 homónimo y se preselecciona el primero | Inferido — ver §10 |
| `os_strAssigneeUser` (modal) | Botón *Confirmar reasignación* | Sin usuario resuelto → botón deshabilitado, y `confirmar()` no emite | Inferido — ver §10 |

---

## 10. Suposiciones Realizadas

1. **Nombres físicos `os_*`.** El Anexo02 da el "Nombre Técnico" en español (`idCaso`,
   `analisisTecnico`, …); se aplicó la convención del proyecto —`os_` + prefijo de tipo +
   nombre en inglés— igual que en Quejas Directas
   (`docs/guides/nomenclatura-variables.md`). El mapeo FLD ↔ nombre físico está comentado
   campo por campo en `fields/fields.ts`. **Son contrato con PM4**: el proceso P02 debe
   emitir/esperar exactamente estos nombres. El port a Angular los copia **literales**.
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
   dice de dónde salen los usuarios de Línea 2; se resuelven con `Pm4GroupsService.usuariosDeGrupo()`
   (`core/pm4-groups.service.ts`) buscando el grupo PM4 cuyo nombre coincide con la **etiqueta** del
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
   que el gateway BPMN sepa con qué botón se cerró la pantalla. *Cancelar* **no tiene valor**:
   es una acción local, y darle uno le haría creer al gateway que existe una salida BPMN que no existe.
10. **Validación de tipo/tamaño de los soportes internos** (pdf/doc/docx/jpg/jpeg/png, 5 MB):
    viene de `DocSupportUploaderComponent`, no del insumo. El Anexo02 solo topa la cantidad.
11. **Textos redactados** que no están literales en el insumo: el banner de SLA crítico, el
    aviso de error de envío y la ayuda del modal de reasignación.
12. **Campo de la maqueta que NO se implementó: "Número de Póliza"** (S2 del HTML). No existe
    en `03_Campos` para SCR-003 y, por la política del Anexo02 de Otras Solicitudes, **ante
    conflicto entre maqueta y maestro gana el maestro**. Si el campo debe existir, primero hay
    que darlo de alta en `03_Campos` con su FLD.
13. **Refactor asociado (heredado de React).** `fetchGroupUsers` estaba embebido en
    `SeccionAsignacion.tsx` (SCR-0051 de Quejas Directas); se movió sin cambios de comportamiento a
    `core/pm4Groups.ts` para que las dos pantallas usen la misma resolución de usuarios de grupo PM4
    (incluida la trampa `member_id` vs `id`). En Angular el equivalente es
    `core/pm4-groups.service.ts`, ya portado en la Fase 4 y con su propio spec.

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

## 12. El port a Angular 21 — qué cambió y qué destapó

### 12.1 Mapeo react-hook-form → Reactive Forms

Idéntico al de las cinco pantallas anteriores de la Fase 5 (§12.1 de sus documentos): `useForm` →
`FormGroup` tipado, `Controller` → `formControlName` sobre el wrapper CVA, `watch(...)` → `computed()`
sobre una `signal` alimentada por `form.valueChanges`, `reset(task.data)` → `precargar()` con
`patchValue`, `handleSubmit` → guarda explícita + `scrollToFirstError(this.form)`.

`precargar()` copia **solo las claves que el form declara**, iterando `Object.keys(this.form.controls)`.
`task.data` trae el caso **entero** —decenas de `os_*` de otros nodos del P02—, y copiar las ajenas
haría que un campo agregado por otra pantalla viajara de vuelta en el PUT sin que nadie lo pidiera.
Hay un caso por cada mitad: *precarga los campos del caso* y *NO adopta los campos ajenos*, más un
tercero sobre el payload (*el payload NO arrastra los campos ajenos de task.data*), porque filtrar al
entrar y filtrar al salir son dos cosas distintas.

La `signal` espejo (`sigValores`) se siembra con `getRawValue()` y **no** con `{}`: los computeds se
leen en el primer render, antes de que ningún `valueChanges` haya emitido.

### 12.2 Las dos cosas que esta pantalla estrena en el proyecto

**1. `FileRegistryService` + `AttachmentsService` en una pantalla real (FLD-052).** Ninguna de las cinco
pantallas portadas antes subía archivos, así que acá se ejercita por primera vez el par
registro-por-pantalla / servicio-de-root que la Fase 4 dejó armado. El `FileRegistryService` va en los
`providers` del **componente**, no en root: si fuera singleton, los adjuntos de una pantalla viajarían a
la siguiente dentro del mismo iframe. Es la misma razón por la que `CollectionService` se provee por
pantalla en SCR-012 (§12.2 de su documento).

Los adjuntos se suben **antes** del PUT, y el orden es contrato: el `<docKey>_id` que PM4 devuelve al
subir cada archivo viaja dentro del mismo `data`, así que sin subir primero no hay id que mandar.

**2. El modal de reasignación (ACT-003-02), y con él la única acción del proyecto que cambia el
responsable sin completar la tarea.** `reasignarTarea` hace `PUT /tasks/{id}` con **solo `{user_id}`** y
el caso sigue parado en P02-T12. Si alguien la implementara con `completarTarea`, el caso avanzaría de
nodo y el usuario reasignado recibiría una tarea que ya no existe — **y PM4 respondería 200 igual**.
La mutación 3 de §12.5 es exactamente ese defecto.

### 12.3 El gate de RUL-003-01 se deriva de `sigValores()`, nunca de `form.valid`

⚠ No se puede escribir `this.form.valid` dentro de un `computed`: `valid` es un *getter* de
`AbstractControl`, **no un signal**, así que no crea dependencia reactiva y el computed queda con el
valor cacheado del primer render (form vacío → inválido). El síntoma es que el botón principal no se
habilita nunca y la acción queda **inalcanzable**. Está medido y documentado en SCR-012 (§12.5 de su
documento), que lo aprendió a los golpes; acá se aplicó desde el principio, así que esta pantalla es la
primera del port donde el defecto **no ocurrió**.

Lo mismo vale para `hasError()`: `strErrorAnalisis` lee `this.sigValores()` en su primera línea —sin
usar el valor— justamente para crear la dependencia que el `hasError()` del control no crea solo.

**El mínimo de 100 caracteres NO entra en el gate, y es deliberado.** `blnPuedeConfirmar` es
`!!analisis.trim()` y nada más. React ponía el gate del botón en `!!analisis.trim()` y reportaba el
mínimo en el campo al enviar; mover el mínimo al gate cambiaría la afordancia de la pantalla —el botón
quedaría apagado hasta el carácter 100, sin decir por qué— y eso sería un cambio funcional de
contrabando en una migración de framework. Hay un caso que lo fija en positivo: *el mínimo NO apaga el
botón principal — el gate es solo "hay texto"*.

El `trim()` va más allá del `Validators.required` a propósito: `required` solo rechaza `''` y `null`,
así que un textarea con espacios dejaría confirmar sin análisis. Ese es el caso *con el análisis en
BLANCOS sigue bloqueado*, que es el único que distingue `trim()` de `!!valor` — los otros dos pasan con
las dos implementaciones.

### 12.4 Cancelar y Reasignar siguen siendo alcanzables con S3 vacío

`os_strTechAnalysis` lleva `required` + `minLength(100)`, pero *Cancelar* y *Reasignar* no miran
`form.valid` en ningún momento. El escenario real de reasignar es justamente *"no puedo resolverlo, que
lo tome otro"*, con el análisis sin escribir; y *Guardar Borrador* existe para guardar trabajo
**incompleto**. Es el mismo contrato que `cancelar()` en SCR-012 (§12.3 de su documento), y acá hay un
caso por cada una de las tres acciones: *reasignar NO exige el análisis técnico*, *sigue alcanzable con
S3 vacío* y *no exige el análisis: el borrador existe para guardar trabajo incompleto*.

`cancelar()` además **baja** `blnIntentoEnvio`: descartar los cambios no debería dejar encendidos los
mensajes de error del intento anterior.

### 12.5 Mutaciones verificadas (gate 5 del plan)

Ocho, cada una sobre la **implementación** —nunca sobre el spec— y todas revertidas con `diff`
verificado. Dos de ellas viven en archivos que no son de esta pantalla, y se explica abajo por qué.

| # | Archivo · línea mutada | Rojos | Mensaje |
|---|---|---|---|
| 1 | `gestion-linea2.ts`: `.trim()` fuera de `blnPuedeConfirmar` | 1 | *con el análisis en BLANCOS sigue bloqueado* |
| 2 | `gestion-linea2.ts`: `SCR003_SLA_UMBRAL_PROXIMO` → `-99` | **2** | *el umbral exacto (2)* y *el SLA vencido* |
| 3 | `core/task.service.ts`: `status: 'COMPLETED'` agregado al PUT de reasignación | 1 | *cambia el responsable SIN completar la tarea* |
| 4 | `gestion-linea2.ts`: la rama del borrador → `if (false as boolean)` | **2** | el caso del borrador y el de "PM4 falla" |
| 5 | `reasignar-caso-modal.ts`: guarda de `intGeneracion` anulada | 1 | *descarta la respuesta de un área que ya no es la elegida* |
| 6 | `reasignar-caso-modal.ts`: `?.id` → `?.value` en `strUserId` | 1 | *emite el user_id del PIVOTE (member_id)* |
| 7 | `reasignar-caso-modal.ts`: el grupo se busca por `value` y no por etiqueta | **8** | los 8 casos que cargan usuarios |
| 8 | `reasignar-caso-modal.ts`: `if (strId)` fuera de `confirmar()` | 1 | *sin usuario resuelto NO emite nada* |

**La mutación 3 no cabía en la pantalla, y eso es un dato del contrato, no una comodidad.** El intento
obvio —cambiar `reasignarTarea` por `completarTarea` en `reasignar()`— **no compila**: las dos difieren
en aridad (2 argumentos contra 1). O sea que el defecto "reasignar completando la tarea" está fuera del
alcance de un error de tipeo en esta pantalla, y para mutarlo de verdad hay que ir a donde vive el
contrato de los dos PUT (`task.service.ts`). Ahí sí type-checkea, y ahí es exactamente el defecto que
el caso dice atrapar: mezclar `status` en el cuerpo del PUT de reasignación hace que **PM4 no reasigne**
y responda 200 igual.

**La mutación 8 salió verde la primera vez, y eso destapó una debilidad del spec, no del código.**
Sacar el `if (strId)` de `confirmar()` no rompía nada porque el host de prueba guardaba **solo la última
emisión**: con `strUserId()` devolviendo `''`, "no emitió" y "emitió la cadena vacía" eran el mismo
estado observable. Se cerró cambiando el host para que acumule **todas** las emisiones en un `string[]`,
y ahí la aserción pasa a ser `toEqual([])` contra `toEqual([''])` — que es justamente la diferencia
entre no abrir un PUT de reasignación y abrirlo sin destinatario. La mutación 8 se puso roja después.

Es la quinta aparición en el port de la familia **"la aserción no distingue los dos estados que
importan"**, y la primera en la que el estado indistinguible era *la ausencia* de un evento.

### 12.6 Tres problemas del arnés de test que costaron una corrida de 17 rojos

Ninguno era un defecto de la pantalla, y los tres quedaron documentados en el spec para que la próxima
pantalla los herede.

**a) `await` sobre una acción que hace HTTP es un deadlock.** Escribir
`await objPantalla.confirmarAtencion()` cuelga el caso: la promesa espera su propio PUT, y el `flush`
que lo liberaría está en una línea **posterior** al `await`. El caso muere a los 5000 ms. El contrato
es lanzar **sin** `await` (`void objPantalla.confirmarAtencion()`), después `await asentar()`, y recién
ahí flushear. Se mantiene el `await` solo donde el gate corta **antes** de cualquier HTTP, y en esos
casos va con un comentario que lo dice.

**b) Un `verify()` que tira aborta el `afterEach` y envenena todos los casos siguientes.**
`objMock.verify()` lanza si quedó una petición sin consumir, y un throw en el hook impide que
`TestBed.resetTestingModule()` —la línea de abajo— llegue a correr. El resultado es que **un** caso
roto se lee como quince: los siguientes fallan con *"the test module has already been instantiated"*.
Se cierra con `try { objMock?.verify(); } finally { TestBed.resetTestingModule(); }`.

Lo que puso el diagnóstico en el camino correcto fue un dato del reporte, no una hipótesis: un caso
fallando en **2 ms sin una línea de consola**. Con eso quedaba descartado que hubiera hecho HTTP, y por
lo tanto que la causa estuviera en la pantalla. La primera hipótesis —una colisión entre los
`beforeEach` de cada `describe`— era **falsa**, y reestructurarlos no cambió el conteo (17 → 17).

**c) `scrollIntoView` no existe en jsdom, y su fallo NO pone rojo el caso.** `scrollToFirstError` lo
llama dentro de un `setTimeout`, así que la excepción sale como *unhandled process error* y Vitest
imprime `Tests N passed` seguido de `Errors 1` — que es fácil de leer como verde. Se stubea en un
`beforeEach` de raíz. Es la misma trampa que el spec de SCR-012 ya documentaba.

**Y hay un mensaje de jsdom que sí es esperado:** `Not implemented: navigation (except hash changes)`
en el caso feliz del borrador. Es jsdom registrando la asignación real de `window.top.location.href`
(ACT-003-04). Se **loguea**, no se lanza, y su ausencia sería el problema.

### 12.7 Cobertura de los 41 casos

Un caso por RUL/ACT/FLD, no un smoke. **30 en la pantalla** y **11 en el modal**, en dos archivos
porque el modal decide cosas propias que la pantalla no puede aseverar por él.

**`gestion-linea2.spec.ts` — precarga y contrato de campos (6)** — precarga desde `task.data` · descarta
las claves ajenas · declara los 10 slots de FLD-052 como controles · los 8 rótulos son los del anexo ·
S1 y S2 de solo lectura y S3 editable · el único obligatorio es FLD-049.

**RUL-003-01, en sus cinco caras (5)** — con el análisis vacío el botón está apagado y MSG-003-01
visible · con el análisis escrito se habilita y el mensaje desaparece · **con el análisis en BLANCOS
sigue bloqueado** (el que muerde) · al intentar confirmar vacío no completa la tarea y muestra el texto
literal del anexo · el mensaje del campo **no habla antes del primer intento**.

**FLD-049, el mínimo (2)** — con menos de 100 no completa la tarea y avisa el largo exigido · el mínimo
**no** apaga el botón (§12.3).

**ACT-003-01 (2)** — completa la tarea con `os_strAction=CONFIRMAR_ATENCION` · el payload no arrastra
los campos ajenos.

**ACT-003-02 (4)** — cambia el responsable **sin** completar la tarea · guarda los datos aparte con
`os_strAction=REASIGNAR` · no exige el análisis · cierra el modal al reasignar bien y lo deja **abierto**
si PM4 falla.

**ACT-003-03 (2)** — descarta lo escrito volviendo a los valores del caso y **no llama a PM4** · sigue
alcanzable con S3 vacío.

**ACT-003-04 (3)** — guarda en el request sin completar la tarea · no exige el análisis · si PM4 falla
muestra el error y **no navega** el frame superior.

**FLD-042, el semáforo (4)** — SLA holgado: sin banner y badge informativo · **en el umbral exacto (2)
ya avisa**, que es el caso que fija el `<=` · vencido: badge `danger` · sin SLA no semaforiza nada y la
barra muestra un guión.

**Barra de contexto y acciones (2)** — el estado se rotula fijo *"Asignado a Línea 2"* (suposición 8) ·
las 4 acciones en el orden de la maqueta.

**`reasignar-caso-modal.spec.ts` (11)** — carga de usuarios (5): con el modal cerrado **no consulta
nada** · busca el grupo por su **etiqueta**, no por su `value` (suposición 5) · preselecciona el primer
usuario · emite el `member_id` del pivote y no el username ni el id de la fila · sin usuario resuelto no
emite. La **guarda de generación** (2): descarta la respuesta de un área ya descartada (se flushean las
dos cargas **en orden invertido**) · al volver el área a vacío limpia la lista. Las **cuatro afordancias
excluyentes** (4): helpText sin área · spinner durante la carga sin avisar de lista vacía · grupo real
pero vacío sí avisa · error de búsqueda muestra el error y **no** el aviso de vacío.

**Lo que deliberadamente no tiene caso: el uploader de S4.** `DocSupportUploaderComponent` ya tiene su
propio spec (tope de 10, tipos, tamaño) y el `FileRegistryService` el suyo. Un caso acá que simulara un
`change` de `<input type=file>` bajo jsdom probaría el componente hijo por tercera vez y no la decisión
de esta pantalla, que es *cuándo* sube (antes del PUT) — y eso lo cubre el caso de ACT-003-01 al
aseverar el cuerpo del PUT.

**Sobre `drenarPeticiones()`:** este spec lo necesita porque el montaje dispara más de un GET (la tarea,
y el `GET /requests/{id}/files` del `RequestFileListComponent` de S2, en cascada). Drena **solo `GET`**,
así que los PUT de las acciones siguen siendo aseverables caso por caso, y converge por condición con un
tope de vueltas — una cascada infinita colgaría el spec, y un spec colgado es peor que uno que falla
nombrando la petición abierta.

### 12.8 Lo que este port cambió fuera de su carpeta

**`paridad-react.spec.ts`: la guarda de anti-vacuidad del caso de los contadores era demasiado
estricta.** Ese caso exigía `cllEsperados.length > 0` —"toda pantalla portada declara al menos un
`maxLength` en React"—, cierto para las cinco de Quejas Directas y **falso para esta**: verificado con un
grep sobre `GestionLinea2.tsx`/`ReasignarCasoModal.tsx`, React no declaraba ninguno. Sumar la pantalla a
`CLL_PORTADAS` ponía ese caso en rojo por estar **bien** portada.

Se cerró **sin debilitar la guarda**: el conteo esperado pasó a declararse por pantalla en
`DIC_MAXLENGTH_ESPERADOS`, y el caso compara contra ese número exacto. Así el cero queda permitido pero
**escrito**, que es lo que separa *"esta pantalla no usaba contadores"* de *"el extractor los perdió"* —
las dos producen una lista vacía y solo la primera está declarada. Un `?? 0` habría hecho del cero el
default silencioso y matado la guarda para toda pantalla que se olviden de declarar; por eso el caso de
inventario ahora también exige que cada slug de `CLL_PORTADAS` tenga su entrada.

Verificado con una novena mutación: declarar `0` para la SCR-008 (que trae 3) pone el caso rojo con el
mensaje *"declara 0 maxLength en DIC_MAXLENGTH_ESPERADOS y el dataset trae 3"*. Revertida.

---

**Registro de la pantalla (tres archivos, los tres obligatorios):** entrada en `DIC_PANTALLAS`
(`app/pantallas.ts`) · slug en `CLL_SLUGS_CON_SPEC` (`app/pantallas.spec.ts`) · entrada en
`CLL_PORTADAS` **y** en `DIC_MAXLENGTH_ESPERADOS` (`components/fields/paridad-react.spec.ts`).

Los dos últimos se auto-guardan contra `DIC_PANTALLAS`, que es donde una pantalla queda declarada como
portada: si falta el slug en `CLL_SLUGS_CON_SPEC`, la guarda de inventario de `pantallas.spec.ts` pone la
suite roja nombrándolo; si falta en `CLL_PORTADAS`, el caso *⚠ toda pantalla enrutada con datos
congelados está comparada acá* hace lo mismo. La única omisión que **no** pone nada rojo es la del
primero: sin la entrada en `DIC_PANTALLAS` la pantalla no existe para el router, y las otras dos guardas
no tienen de dónde saber que había algo que registrar.
