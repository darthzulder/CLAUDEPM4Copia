# Documentación Funcional — Respuesta del Área Responsable

> **Port a Angular 21 (Fase 5, pantalla 7 de 12).** La trazabilidad funcional de las §1–§11 es
> contrato con el Anexo02, no con el framework, así que se conserva. Pero **en esta pantalla no se
> pudo conservar textual**: la ficha de React documentaba una S4 que el código no envía y un
> "Guardar Borrador" que no hace lo que decía. Las correcciones están marcadas con **⚠ corregido en
> 2.0** en el lugar donde viven, y el porqué de cada una en la §12.8. Lo que el port agregó está en
> la **§12**.

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-0052** / PAN-05.2 — Respuesta del Área Responsable |
| Tipo | Vista del caso asignado — registro de comentario y adjunto |
| Tarea BPMN | **SP2-T02** — Analizar queja (registro de comentario) |
| Proceso | SP2 — Gestionar Respuesta Interna y Revisión SAC |
| Rol responsable | Área Responsable (VER+EDITAR) · Analista SAC (VER) · Líder SAC (VER) · Control SLA (INFORMADO) |
| Evento de apertura | Caso asignado a la bandeja del área |
| Acción de cierre | Enviar comentario → continúa SP2-T02 |
| Slug / `?screen=` | `COL_QD_SCR-0052_Respuesta_Area_Responsable` |
| Archivos de implementación | `respuesta-area-responsable.ts` · `respuesta-area-responsable.html` · `respuesta-area-responsable.spec.ts` (config centralizada en `../fields/fields.ts`) |
| Versión | 2.0 — 2026-08-17 (port a Angular 21; 1.0 React, 2026-06-30) |

> **Nota de nomenclatura:** el SLUG solicitado (`COL_QD_Respuesta_Area_Responsable`) se normalizó a
> `COL_QD_SCR-0052_Respuesta_Area_Responsable` (con código SCR) por consistencia con las pantallas
> QD hermanas. Ver §10.

> **Es la única pantalla del proyecto que corre dentro de un subproceso**, y por lo tanto la única que
> tiene que escribir en variables que viven en el request **padre**. Eso no es un detalle de
> implementación: es la fuente del riesgo funcional descrito en §7 (RUL-0052-02) y el motivo de que el
> port haya estrenado `ParentRequestService`. Ver §12.2.

---

## 2. Resumen

Pantalla que ve el Área Responsable cuando un caso llega asignado a su bandeja. Muestra el
expediente en solo lectura (datos del consumidor, clasificación regulatoria M1, descripción de la
queja y la **solicitud de ayuda que se le hizo**) y permite registrar un **comentario obligatorio**
con un **adjunto de soporte opcional**, que quedan en el historial del caso. El cierre es "Enviar
comentario" (continúa SP2-T02); también permite guardar borrador o volver a la bandeja.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-0052.md` | Campos (FLD-066..077, 351..355), acciones (ACT-0052-*), regla RUL-0052-01, mensajes MSG-0052-*, permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-057..061 (orden, visibilidad) |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-0052-01/02 |
| Anexo02 (índice .md) | `masters/07_Catalogs.md` | CAT-CANAL / CAT-PROD-SFC / CAT-MOT-SFC / CAT-ADMISION — **⚠ corregido en 2.0**, ver abajo |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP2-T02 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP2-T02 es tarea de Usuario → sin variables canónicas |

> **⚠ corregido en 2.0.** La ficha de React decía *"Sin catálogos (07_Catalogs): la pantalla no tiene
> listas desplegables"*. Lo segundo es cierto y lo primero no se sigue de ello: la pantalla **carga
> cuatro colecciones** para resolver los códigos de S2 a su etiqueta legible (a un área responsable el
> `"13"` de `qd_strChannel` no le dice nada). No hay `select`, pero sí hay catálogo. Ver §12.2.

> **Los rótulos se re-copiaron del anexo durante el port** (columna *Etiqueta* de la tabla "Campos de
> la Pantalla" de `screens/SCR-0052.md`, sin el `* ` del obligatorio), con **una** divergencia
> deliberada respecto del anexo: FLD-073. Ver §10.

---

## 4. Campos Implementados

### S1 — Datos del Consumidor (SEC-059, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Nombre del Consumidor | (derivado de `qd_strFirstName` + `qd_strLastName` / `qd_strCompanyName`) | texto (`info-bar-value`) | FLD-066 |
| Tipo y N.° de Identificación | (derivado de `qd_strIdType` + `qd_strIdNumber`) | texto (`info-bar-value`) | FLD-067 |
| Correo Electrónico | `qd_strEmail` | `zds-input` readOnly | FLD-068 |
| Tipo de Persona | `qd_strPersonType_desc` | `zds-input` readOnly | FLD-069 |

> Los dos primeros **no son controles**: son valores derivados que se calculan de cuatro campos del
> caso, así que van como texto sobre el mismo `zds-field-wrap` que usan los wrappers (es lo que
> mantiene la altura y el espaciado de la grilla alineados con los campos vecinos). La ficha de React
> los listaba como `ZdsInput`, pero el `.tsx` los monta como texto igual que acá.

### S2 — Clasificación Regulatoria (SEC-060, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Canal de Recepción | `qd_strChannel` → `descDe('channel')` | texto (catálogo) | FLD-070 |
| Producto SFC | `qd_strSfcProduct` → `descDe('sfcProduct')` | texto (catálogo) | FLD-071 |
| Motivo SFC | `qd_strSfcReason` → `descDe('sfcReason')` | texto (catálogo) | FLD-072 |
| Instancia de Recepción | `qd_strReceptionInstance_desc` | `zds-input` readOnly | FLD-073 |
| Admisión | `qd_strAdmission` → `descDe('admission')` | texto (catálogo) | FLD-074 |
| Ente de Control | `qd_strControlEntity_desc` | `zds-input` readOnly | FLD-075 |

> **Los cuatro de catálogo se muestran por su etiqueta, no por el código.** El código sigue viajando
> en el control, que es el contrato con PM4; lo que se resuelve es solo la pintura.
>
> **Los tres `_desc` que van como CAMPO y no como texto** (`qd_strPersonType_desc`,
> `qd_strReceptionInstance_desc`, `qd_strControlEntity_desc`) se leen directo de `task.data`, sin
> `descDe()`: esos códigos vienen ya resueltos por SCR-000 y esta pantalla no los edita, así que
> cargar tres colecciones más para volver a resolver una etiqueta que ya viaja en el caso serían tres
> GET por nada. Van como campo porque **es como los monta React** (`<ZdsInput readOnly>`), y por eso
> los tres figuran en el dataset congelado de `paridad-react.spec.ts`. Ver §12.4.

### S3 — Descripción de la Queja (SEC-061, solo lectura)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Asunto de la Queja | `qd_strSfcReason` → `descDe('sfcReason')` | texto (catálogo) | FLD-076 |
| Descripción / Texto de la Queja | `qd_strComplaintText` | `zds-textarea` readOnly | FLD-077 |

> ⚠ "Asunto de la Queja" repite el **mismo** valor que S2 muestra como "Motivo SFC". Está así en React
> (líneas 231 y 249 del `.tsx`) y se porta tal cual: es una duplicación del original, no un descuido
> del port. Ver §10.

### S4 — Solicitud de Ayuda (SEC-057, solo lectura) — **⚠ corregido en 2.0**

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Fecha de solicitud | `qd_lstAssignHistory[qd_intHelpNumber - 1].fecha` | texto (`info-bar-value`) | — (ver abajo) |
| Solicitado por | `…[…].de` | texto (`info-bar-value`) | — |
| Motivo | `…[…].motivo` | texto (`info-bar-value`) | — |
| Observaciones | `…[…].observaciones` | texto multilínea (`pre-wrap`) | — |

> **⚠ corregido en 2.0 — la ficha de React documentaba esta sección como "Datos de la Asignación" con
> tres campos propios (`qd_strAssigneeArea` / `qd_strAssigneeUser` / `qd_strAssignmentRemarks`,
> FLD-351/352/353), y eso NO es lo que el código monta.** El `.tsx` pinta los **cuatro** campos de la
> fila del historial de ayudas, indexada por `qd_intHelpNumber - 1` (líneas 52–55 y 262–272). Se porta
> el **código**, porque es lo que hoy está desplegado y lo que el usuario ve; la ficha quedó vieja. El
> spec fija los cuatro rótulos y anota que **no están en el anexo**, para que la próxima lectura no los
> "corrija" hacia la tabla equivocada. Ver §12.8.
>
> Los tres campos de FLD-351/352/353 **siguen en el caso y siguen usándose**, solo que no como pintura
> de S4: `qd_strAssigneeUser`/`qd_strAssigneeArea` son de dónde sale el "quién responde" que se escribe
> en la respuesta (§7, RUL-0052-03).
>
> **Sin fila se muestran los cuatro guiones, no una alerta.** Es lo que hace React
> (`objRequest?.fecha || '—'`, con `objRequest` posiblemente `undefined`) y cambiarlo sería
> reinterpretar la pantalla. Tiene su caso en el spec.

### S5 — Comentario y Adjunto (SEC-058, editable)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Comentario | `qd_strAreaComment` | `zds-textarea` (`maxLength` 2000) | **Sí** | FLD-354 |
| Adjuntar archivo | `qd_strAreaAttach` | `zds-file-input` (máx 10 MB) | No | FLD-355 |

### Metadatos de flujo (no visibles)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_strAction` (`ENVIAR` \| `GUARDAR_BORRADOR`) | Inferido de ACT-0052-01/02 (§10) |
| Historial de asignaciones | `qd_lstAssignHistory` (fila marcada `respondio: 'si'`) | Ver §7 |
| Respuestas de ayuda | `qd_lstHelpResponses` (una entrada por ayuda) | Ver §7 |
| Id del binario subido | `qd_strAreaAttach_id` | CLAUDE.md (patrón de subida) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Comentario obligatorio | `Validators.required` + `blnPuedeEnviar()` derivado de `sigValores()`; "Enviar comentario" deshabilitado si vacío | RUL-0052-01 · MSG-0052-01 · FLD-354 |
| Comentario ≤ 2000 | `Validators.maxLength(2000)` (límite efectivo) + `[maxLength]` del wrapper (contador visual `0/2000`) | §10 |
| Extensión del adjunto | `zds-file-input` valida PDF/DOC/DOCX/XLS/XLSX/JPG/PNG y **limpia** el que ya estaba si rechaza | FLD-355 |
| Tamaño del adjunto | ≤ 10 MB (`SCR0052_MAX_ADJUNTO_MB`), interpolado en el mensaje | FLD-355 |

> **`blnPuedeEnviar()` se deriva de `sigValores()`, nunca de `form.valid`.** `valid` es un *getter* de
> `AbstractControl`, no un signal: leerlo dentro de un `computed` no crea dependencia reactiva y el
> computed queda con el valor del primer render (form vacío ⇒ inválido), o sea el botón principal
> apagado **para siempre**. Está medido y documentado en la §12.5 de SCR-012, y acá se aplicó desde el
> principio en vez de volver a pagarlo.

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-0052-01 Comentario obligatorio | `qd_strAreaComment` vacío | `za-alert config="info"` **dentro** de S5 + botón "Enviar" deshabilitado | 06_Mensajes > MSG-0052-01 |
| MSG-0052-02 Comentario enviado | Tras enviar | **No en UI** — lo emite el BPM tras completar la tarea | 06_Mensajes > MSG-0052-02 |
| Error de envío | El PUT falla | `za-alert config="negative"` con el mensaje del back; **la tarea no se completa** | §12.3 |
| Error de carga | El GET de la tarea falla | `za-alert config="negative"` en lugar del formulario | CLAUDE.md |

> **El bloqueo de MSG-0052-01 se explica de forma permanente mientras el comentario esté vacío**, no
> solo al intentar enviar: el botón principal está apagado y sin ese texto la pantalla no diría por
> qué. Va dentro de la tarjeta, como en React.
>
> **El error de envío se muestra y no se traga**, y el motivo es funcional: si la tarea no se completa,
> PM4 **no cierra el iframe** y el usuario se queda mirando esta pantalla. Tragarse el fallo lo dejaría
> creyendo que envió. Ver §12.3.

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-0052-01 (🔴 BLOQUEA) — comentario vacío bloquea envío | `blnPuedeEnviar()` = comentario con `trim()` no vacío; botón disabled + alerta MSG-0052-01 | SCR-0052 > RUL-0052-01 |
| **RUL-0052-02** (🔴 BLOQUEA, *inferida*) — la respuesta no puede borrar el trabajo de otro usuario | Se **relee** el request padre antes de escribir; el snapshot solo se usa si la relectura falla | Inferido (§10) — ver abajo |
| **RUL-0052-03** (*inferida*) — la respuesta se escribe en la fila que se le pidió, no en la última | Índice **1-based** `qd_intHelpNumber - 1`; sin número, la respuesta se **empuja** al final | Inferido (§10) |
| **RUL-0052-04** (*inferida*) — un borrador no es una respuesta | `guardarBorrador()` **no** pasa por `registrarRespuesta()`: no relee el padre ni marca la fila | Inferido (§10) |

> **RUL-0052-02 es el riesgo funcional central de la pantalla, y es específico de que corra en un
> subproceso.** El subproceso arranca con un **snapshot** de las variables del padre. Si la pantalla
> guardara ese snapshot con su respuesta encima, borraría cualquier fila de ayuda que el Analista SAC
> hubiera agregado **mientras el ayudante redactaba**. No es "un dato viejo": es una escritura
> destructiva sobre trabajo de otro usuario que no deja rastro. Por eso se relee el padre y lo fresco
> **gana** sobre el snapshot. Si la relectura falla se **degrada** al snapshot en vez de bloquear: peor
> dato, pero el ayudante no pierde su comentario por un problema que no es suyo.
>
> Las tres reglas inferidas **existían en el código de React** (sin ficha y sin un solo test). El port
> las nombró, las documentó y les puso un caso a cada una. Ver §12.2 y §12.6.

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Expediente solo lectura (S1–S4) | `zds-input`/`zds-textarea` con `[readOnly]` y texto `info-bar-value` | SEC-057..061 |
| Etiquetas de catálogo en vez de códigos | `descDe()` sobre `CatalogosService` (4 colecciones) | §12.2 |
| Adjunto de soporte único | `zds-file-input` + `FileRegistryService`; el binario sube **antes** de completar | FLD-355 · CLAUDE.md |
| Observaciones multilínea | clase `texto-multilinea` (`white-space: pre-wrap`) | — |
| Guardar borrador | `PUT /requests/{id}` con `qd_strAction='GUARDAR_BORRADOR'`; **⚠ corregido en 2.0** | ACT-0052-02 |
| Guardar borrador → bandeja | Navega el **frame de arriba** a la bandeja, **solo si el guardado salió bien** | ACT-0052-02 · §12.3 |
| Volver | `lib-button-z type="link"` con flecha → `window.history.back()`, sin `disabled` | ACT-0052-03 |
| Estados loading/error/submitting | `lib-loader-z`, `za-alert`, botones `[loading]`/`[disabled]` | CLAUDE.md |

> **⚠ corregido en 2.0 — "Guardar Borrador" NO completa la tarea.** La §8 y la §10 de la ficha de React
> decían que guardaba con `completeTask` y que *"si el flujo BPMN real requiere un endpoint distinto
> (no completar la tarea), deberá ajustarse"*. Ese ajuste **ya estaba hecho en el código**: el `.tsx`
> llama `saveDraft()` (línea 151), que va a `PUT /requests/{id}` y **no** completa la tarea. La ficha
> nunca se actualizó. Se documenta el comportamiento real, y el spec lo fija por lo que **no** hace:
> no hay PUT a `/tasks/{id}`, no relee el padre y no marca la fila.
>
> **"Guardar Borrador" no mira `blnPuedeEnviar()`**, a propósito: guardar a medio escribir es
> precisamente para lo que sirve. Apagarlo con el comentario vacío dejaría al usuario sin forma de
> salir de la pantalla conservando lo poco que hubiera escrito.
>
> **"Volver" no lleva `[disabled]` atado al envío**, como en React: volver no escribe nada, así que
> apagarlo mientras se envía dejaría al usuario encerrado si el PUT se cuelga.

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strAreaComment` | Botón "Enviar comentario" | Habilita el envío solo si el comentario (con `trim()`) no está vacío | RUL-0052-01 |
| `qd_intHelpNumber` | S4 completa · fila escrita en `qd_lstAssignHistory` · `numero` de la respuesta | Selecciona la fila 1-based; ausente ⇒ S4 en guiones y la respuesta se empuja al final | RUL-0052-03 |
| `qd_strAreaAttach` (binario) | `qd_strAreaAttach_id` · `adjuntoFileId` de la fila y de la respuesta | El POST del binario sale **antes** del PUT, porque el id que PM4 devuelve viaja dentro del mismo `data` | FLD-355 |
| `qd_strAssigneeUser` / `qd_strAssigneeArea` | `respondio` de la entrada en `qd_lstHelpResponses` | Usuario si el BPM lo nombró, si no el área, si no `—` | RUL-0052-03 |

---

## 10. Suposiciones Realizadas

- **Slug normalizado** (ver §1).
- **Nombres `data_name` (`qd_*`)** provisionales — Anexo03 no tiene variables para SP2-T02 (tarea
  de Usuario, no automatizada). Se actualizarán con el diccionario final.
- **`qd_strAction`** (metadato): no es un FLD; se deriva del botón presionado (ACT-0052-01/02).
- **`maxLength=2000`** en el comentario: límite estándar del proyecto, no especificado en el insumo.
- **Adjunto único con `data_name=qd_strAreaAttach`**: se sube vía `POST /requests/{id}/files` al
  enviar (patrón estándar del proyecto). El insumo (FLD-355) permite PDF/DOCX/XLSX/JPG/PNG, máx 10 MB.
  **Las extensiones se pasan explícitas** porque el default del wrapper no incluye `xls`/`xlsx`, que es
  el formato en el que un área responsable tiene sus liquidaciones.
- **MSG-0052-02** (éxito) lo emite el BPM tras completar la tarea; no se renderiza en la pantalla.
- **RUL-0052-02/03/04 son inferidas del código de React**, no del anexo: el anexo solo declara
  RUL-0052-01. Están en §7 con ese marcado porque son reglas de negocio ejecutables que alguien podría
  "simplificar" sin saber qué protegen — que es exactamente lo que pasó con la relectura del padre, que
  llegó al port sin ficha y sin test.
- **FLD-073 · el rótulo diverge del anexo, a propósito.** El anexo rotula *"Instancia / Punto de
  Recepción"* y React pone *"Instancia de Recepción"*. Se porta **el de React**: la migración no cambia
  el copy de la app que hoy está desplegada. La divergencia queda anotada en la plantilla, en el spec y
  acá, porque un `expect` que discrepa del insumo sin explicación se "arregla" solo la próxima vez que
  alguien lo lea. El punto de recepción (`qd_strReceptionPoint`) es un campo aparte que esta pantalla
  nunca mostró.
- **"Asunto de la Queja" (FLD-076) duplica el "Motivo SFC" (FLD-072).** Es así en React y se porta tal
  cual. Si el negocio quería otro campo ahí, es un cambio funcional que se decide aparte — no algo que
  el port arregle de contrabando.
- **La S4 documentada en el anexo no es la que el código monta** (ver §4/S4 y §12.8). Se porta el
  código; la corrección de la ficha va del lado del negocio.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-066..077) | 12/12 (100%) | S1–S3, todos en solo lectura |
| Campos (FLD-354/355) | 2/2 (100%) | S5, los dos editables |
| Campos (FLD-351/352/353) | 3/3 en el caso, **0/3 como pintura de S4** | El código no los muestra; se usan para el "quién responde" (§4/S4) |
| Secciones (SEC-057..061) | 5/5 (100%) | S1–S5 |
| Acciones (ACT-0052-01/02/03) | 3/3 (100%) | Enviar, Guardar Borrador, Volver |
| Reglas (RUL-0052-01) | 1/1 (100%) | Comentario obligatorio |
| Reglas inferidas (RUL-0052-02/03/04) | 3/3 | Del código de React; sin ficha ni test previos |
| Mensajes (MSG-0052-01/02) | 1/2 en UI | MSG-0052-02 lo emite el BPM |
| Catálogos | 4 colecciones | **⚠ corregido en 2.0**: la ficha de React decía "N/A" |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_strAction`, `maxLength=2000`, las tres reglas
RUL-0052-02/03/04, y el contrato de escritura sobre el request padre.

---

## 12. El port a Angular 21 — qué cambió y qué destapó

### 12.1 Mapeo react-hook-form → Reactive Forms

| React | Angular 21 |
|---|---|
| `useForm<RespuestaAreaData>()` | `FormGroup` tipado con un `FormControl` por campo |
| `reset(task.data)` | `patchValue(…)` sobre las claves que la pantalla declara |
| `watch()` | `sigValores` (signal espejo, actualizado por `valueChanges`) |
| `<ZdsTextarea control={control} …>` | `<zds-textarea formControlName="…" …>` |
| `rules={{ required: … }}` | `Validators.required` en el `FormControl` |
| `required` (prop del wrapper) | `[obligatorio]` — renombrado para no chocar con el atributo nativo |
| `fileRegistry` (`useRef(new Map())`) | `FileRegistryService` (provisto por pantalla) |
| `useCollection` × 4 | `CatalogosService` (una instancia, cuatro colecciones) |
| lectura del padre inline en el submit | `ParentRequestService` (con su propio spec) |

**La precarga descarta las claves ajenas.** `task.data` trae el caso entero (número de radicado, punto
de recepción, etc.); `patchValue` recibe solo las claves que la pantalla declara. Si mandara el objeto
completo, el `getRawValue()` del submit devolvería basura que la pantalla nunca mostró.

### 12.2 Las dos cosas que esta pantalla estrena en el proyecto

**a) `ParentRequestService` — la relectura del request padre.** Es el estreno importante y el motivo
está en §7 (RUL-0052-02). En React vivía **inline dentro del submit** y no tenía ni un test; acá es un
servicio con su propio spec, y la pantalla tiene tres casos que lo ejercitan por sus tres caras: lo
fresco gana, la fila que se responde conserva lo que escribió SCR-005, y si la relectura falla se
degrada al snapshot.

**b) Cuatro catálogos en una pantalla portada, vía `CatalogosService`.** Las pantallas anteriores usaban
uno solo y lo declaraban en `providers: [CollectionService]`. Eso **no escala al segundo**, porque el
array `providers` resuelve por token: repetirlo da una sola instancia, no dos. `CatalogosService`
envuelve las cuatro y cachea por clave.

### 12.3 El booleano de `enviarCon()` es un contrato, no un detalle

`enviarCon()` devuelve `boolean` y el `catch` deja el mensaje en `strErrorEnvio`. Eso lo consumen dos
lugares con consecuencias distintas:

- **`enviar()`** — si falla, la tarea **no se completa**, PM4 no cierra el iframe, y el usuario tiene
  que ver por qué. De ahí la `za-alert` negativa (§6).
- **`guardarBorrador()`** — navega el frame de arriba a la bandeja de PM4 **solo si `blnOk`**. Navegar
  tras un fallo perdería el comentario del usuario **sin decirle nada**, porque la bandeja se cargaría
  encima de la pantalla y el mensaje de error nunca se vería.

**`window.top` y no `window.location`:** la pantalla vive en un iframe dentro de PM4, así que navegar el
frame propio dejaría la bandeja embebida dentro del formulario. El `window.top!` de React se reemplazó
por una guarda real (`top` es `null` en un contexto cross-origin sin permiso, y ahí es mejor no navegar
que reventar **después** de un guardado exitoso).

### 12.4 Los tres `_desc` van como CAMPO, y pintarlos como texto es contrabando

El primer intento de este port pintó `qd_strPersonType_desc`, `qd_strReceptionInstance_desc` y
`qd_strControlEntity_desc` como `info-bar-value`, que es más limpio: son valores de solo lectura sin
control detrás. Pero React los monta como `<ZdsInput readOnly>` (líneas 213/235/240 del `.tsx`), y los
tres figuran en el dataset congelado de `paridad-react.spec.ts` como `ZdsInput`. Cambiar el render es un
cambio visible: **se ven distinto y desaparecen del DOM como campos**. La migración porta la
estructura, no la reinterpreta.

### 12.5 Mutaciones verificadas (gate 5 del plan)

Cada una sobre la **implementación**, no sobre el spec, revertida y verificada con `diff`.

| # | Línea mutada | Rojos | Caso que se puso rojo |
|---|---|---|---|
| 1 | `cllHistorial = [...dicFrescas[lstAssignHistory]]` → se queda con el snapshot | 1 | *la relectura GANA sobre el snapshot* |
| 2 | el spread de la fila pierde `fecha`/`de`/`motivo`/`observaciones` | 1 | *la fila respondida CONSERVA los cuatro campos de SCR-005* |
| 3 | `if (intIndice >= 0) … else push` → siempre por índice (escribe en `lst[-1]`) | 1 | *sin `qd_intHelpNumber` la respuesta se EMPUJA al final* |
| 4 | `guardarBorrador()`: se le saca el `if (!blnOk) return;` | 1 | *navega a la bandeja SOLO si el guardado salió bien* |
| 5 | `intIndice` tratado como 0-based (se le saca el `- 1`) | **5** | los cuatro de ACT-0052-01 más el del adjunto |
| 6 | la relectura fallida lanza en vez de degradar | 1 | *si la relectura del padre falla, degrada al snapshot* |

**La mutación 4 no pasaba, y ese es el hallazgo del gate.** Ver §12.7.

**La mutación 2 solo compila si se degradan los cuatro campos a `''`**; borrar el spread entero lo
rechaza el tipo `AsignacionHistorial`, o sea que ahí el compilador ya es una barrera. Se dejó la versión
que compila para que la aserción quede probada de todos modos.

**Nota de método, aprendida acá:** un `if (false && …)` que deja una variable sin usar **no compila**, y
`ng test` sobre un bundle que no se generó imprime `Application bundle generation failed` y **cero
tests**. Un harness de mutación que solo busque la línea de resumen lee eso como "todo verde" y reporta
la mutación como no detectada — que fue exactamente lo que pasó en la primera pasada de este gate, en
tres de las seis. El harness ahora distingue *no compila* de *no detectada*, y solo la segunda es un
agujero del spec.

### 12.6 Lo que el spec fija y en React no estaba cubierto

En React esta pantalla tenía **un smoke test**. El port la deja con **35 casos**, y los que cubren
territorio que antes no tenía ninguna red son:

- **La escritura sobre el request padre** (RUL-0052-02), por sus tres caras. Era el código más riesgoso
  de la pantalla y el menos protegido.
- **El índice 1-based y el caso `-1`** (RUL-0052-03). Un off-by-one acá no rompe nada visible:
  **responde la ayuda equivocada**. Y con `qd_intHelpNumber` ausente, `cll[-1] = obj` crearía una
  propiedad `"-1"` que no es un elemento del array y que el Analista SAC nunca vería.
- **Que el borrador NO sea una respuesta** (RUL-0052-04), aseverado por lo que no hace: sin PUT a
  `/tasks`, sin relectura del padre, y con `respondio` sin marcar. Escribir `respondio: 'si'` al guardar
  dejaría al Analista SAC viendo una ayuda respondida con un comentario a medio escribir, y el BPM
  podría avanzar sobre eso.
- **El orden POST-antes-de-PUT del adjunto**, porque el `fileUploadId` que PM4 devuelve viaja dentro del
  mismo `data` que el PUT.

### 12.7 Los cuatro hallazgos del port

**a) El título de un caso afirmaba algo que el caso no comprobaba.** El caso *"navega a la bandeja SOLO
si el guardado salió bien"* solo aseveraba que el mensaje de error se mostraba — que ya es lo que
asevera **otro** caso. La palabra "SOLO" no estaba testeada: **borrar el `if (!blnOk) return;` de
`guardarBorrador()` dejaba la suite entera en verde** (mutación 4). Lo destapó el gate de mutación, no
la suite.

Y el arreglo obvio no servía: **el precedente que había en OS_SCR-003 comparaba
`window.top?.location.href` antes y después, y esa aserción no puede fallar.** En jsdom el fixture corre
en el frame de arriba (`window.top === window`) y asignarle `location.href` **no cambia el valor** —
jsdom emite `Not implemented: navigation` y sigue. Así que el "antes === después" pasa igual haya
navegado o no. Se cerró suplantando `window.top` por un doble cuyo `location.href` es una propiedad
escribible (`espiarNavegacionDelTope()`), lo que hace la escritura observable y permite aseverar las dos
mitades del "SOLO": que navega cuando el guardado sale bien, y que **no** navega cuando falla.
**La misma aserción vacua está en el spec de OS_SCR-003** y queda anotada como deuda.

**b) El docstring del spec prometía un caso que no existía.** El bloque de cabecera enumeraba tres casos
sobre `registrarRespuesta()`, incluido *"la fila que se responde conserva los cuatro campos que escribió
SCR-005"*. Los otros dos estaban; ese no. Se escribió (es la mutación 2). Salió de leer el docstring
contra la lista de `it()`, no de ninguna corrida.

**c) Un caso de settle que se quedaba a un repintado del final.** Dos casos fallaban con el signal del
error **ya seteado** y el DOM sin la alerta. La causa no era el número de vueltas de espera: el efecto
nace **detrás** del `await` de la vuelta, o sea después del `detectChanges()` que esa misma vuelta ya
corrió. La sonda lo ve —el valor está en el signal— pero la plantilla se pintó con el valor viejo.
Medido: `strErrorEnvio` poblado en la vuelta 0 con `querySelectorAll('za-alert').length === 0`, y
`length === 1` tras un `detectChanges()` más. El helper ahora repinta **al observar** el efecto.

Y el diagnóstico dependió de una sonda que **no consume**: el `match()` de `HttpTestingController`
**saca de la cola todo lo que su predicado acepta**, así que la primera instrumentación se comía el
propio PUT que el caso iba a aseverar y la traza parecía decir que la petición se retractaba. Una sonda
que cuenta tiene que devolver `false` siempre.

**d) Una expectativa escrita contra una forma que el servicio no usa.** El caso del adjunto buscaba el
POST con `url === '/api/requests/55/files'` y leía el `data_name` de `request.params`. Pero
`AttachmentsService.subir()` interpola el `data_name` **dentro del string de la URL**, así que
`request.url` conserva la query y `request.params` queda **vacío**: el predicado no matcheaba nada, el
POST quedaba colgado, y el `verify()` del `afterEach` **abortaba el hook antes de
`resetTestingModule()`** — lo que hacía fallar los dos casos siguientes del archivo con
`Cannot configure the test module when the test module has already been instantiated`. Una petición
filtrada envenena el resto del archivo. El error real era elocuente y fácil de leer al revés:
`found none. Requests received are: POST /api/requests/55/files?data_name=…` — la petición correcta,
rechazada por la expectativa. Y la forma del servicio es la del contrato documentado en CLAUDE.md
(`?data_name=` en la query), así que **lo que se corrigió fue el spec**.

### 12.8 Lo que la ficha de React documentaba mal, y por qué se corrige acá y no allá

Tres cosas, todas verificadas contra el `.tsx` antes de tocar nada:

| Decía la ficha 1.0 | Hace el código | Dónde queda corregido |
|---|---|---|
| S4 = "Datos de la Asignación" con FLD-351/352/353 | pinta los 4 campos de la fila del historial | §4/S4 |
| "Guardar Borrador" completa la tarea | `saveDraft()` → `PUT /requests/{id}` | §8 |
| "Sin catálogos: no tiene listas desplegables" | carga 4 colecciones para resolver S2 | §3, §11 |

En los tres casos **se porta el código**, porque es lo que hoy está desplegado y lo que el usuario ve.
Esta es una migración de framework: un desacuerdo entre la ficha y el código es un hallazgo que se
reporta y se decide del lado del negocio, no algo que el port resuelva cambiando la pantalla. Lo único
que el port hace es dejar la divergencia escrita donde se va a leer — acá, en el `.html` y en el spec —
para que la próxima lectura no "corrija" el código hacia una ficha vieja.

**El caso de "Guardar Borrador" es el más instructivo:** la ficha 1.0 no solo describía mal el
comportamiento, además dejaba escrito *"deberá ajustarse cuando se defina"* para un ajuste que **ya
estaba hecho en el código**. Una suposición que se cumplió y que nadie volvió a mirar es peor que una
suposición pendiente, porque se lee como trabajo por hacer.

### 12.9 Cobertura de los 35 casos del spec

Un caso por RUL/ACT/FLD, no un smoke.

**Estructura y montaje** — (1) precarga los campos de la tarea y **descarta las claves ajenas** ·
(2) los 6 campos de la fachada declaran `formControlName` y llegan al componente del DS ·
(3) los 6 rótulos son los del anexo · (4) el rótulo de FLD-355, aseverado aparte (ver abajo) ·
(5) los rótulos de texto plano de S1–S4 · (6) los títulos de sección · (7) los campos de S1–S3 son de
solo lectura y los de S5 no.

**S4, la solicitud de ayuda** — (8) pinta la fila **1-based** correcta, no la última · (9) sin fila
muestra los cuatro guiones y **no** una alerta · (10) las observaciones conservan los saltos de línea.

**S2, los catálogos** — (11) los cuatro códigos se pintan por su etiqueta · (12) un código que el
catálogo no tiene cae al propio código y no a vacío.

**RUL-0052-01** — (13) el botón principal está apagado con el comentario vacío y MSG-0052-01 visible ·
(14) con comentario se enciende y la alerta desaparece · (15) **espacios no alcanzan** (el `trim()`) ·
(16) `enviar()` con el comentario vacío **no** completa la tarea.

**ACT-0052-01, el envío** — (17) completa la tarea con el comentario, la acción y las dos listas ·
(18) **la relectura GANA sobre el snapshot** (la aserción central del archivo) · (19) la fila respondida
**conserva** los cuatro campos de SCR-005 · (20) si la relectura falla, **degrada** y no pierde la
respuesta · (21) sin `qd_intHelpNumber` la respuesta se **empuja** al final, no a `lst[-1]` · (22) la
entrada de `qd_lstHelpResponses` lleva el "quién responde" resuelto · (23) el PUT va con
`include=data` · (24) el error de envío **se muestra**, no se traga.

**ACT-0052-02, el borrador** — (25) guarda **sin completar la tarea** y sin pasar por
`registrarRespuesta()` · (26) guarda aunque el comentario esté vacío (**no** mira RUL-0052-01) ·
(27) si sale bien, navega el frame de **arriba** a la bandeja · (28) navega **SOLO** si salió bien
(§12.7a).

**ACT-0052-03** — (29) Volver no guarda nada: es navegación del navegador.

**FLD-354/355** — (30) el comentario tope en 2000 y el contador del DS lo refleja · (31) un adjunto
aceptado deja el **nombre** en el control y el binario para el submit · (32) el POST del binario sale
**antes** del PUT y su id viaja en el `data` · (33) un adjunto rechazado **limpia** el que ya estaba, no
solo pinta el error · (34) el mensaje de extensión interpola el tope de MB de la constante ·
(35) el rótulo de FLD-355.

> **Por qué FLD-355 se asevera aparte de los otros seis campos.** `cllCamposDeLaFachada()` filtra por
> `instanceof CampoBase`, y `ZdsFileInput` extiende `CampoZaBase` — una jerarquía **paralela**, para los
> `za-*`, que no deriva de `CampoBase`. Así que el helper compartido **no lo ve**, por diseño. Meterlo en
> la tabla de rótulos pondría en rojo los tres casos que comparan el conjunto completo contra la salida
> del helper, y el defecto estaría en la expectativa, no en la pantalla. Se alcanza con
> `query(By.directive(ZdsFileInput))`, que no depende de ese filtro.
