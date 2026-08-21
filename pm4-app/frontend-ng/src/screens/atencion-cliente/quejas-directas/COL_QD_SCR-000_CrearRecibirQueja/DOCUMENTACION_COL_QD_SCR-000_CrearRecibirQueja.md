# Documentación Funcional — `COL_QD_SCR-000_CrearRecibirQueja` — **v2.0 (Angular)**

> **Qué cambió respecto de la 1.0 y cómo leer esta ficha.** La 1.0 documentaba la implementación
> React. Esta 2.0 documenta el **port a Angular 21** (Fase 5, pantalla 11 de 12) y hace dos cosas
> distintas que conviene no confundir:
>
> - Los bloques **`⚠ corregido en 2.0`** son lugares donde la ficha 1.0 **no coincidía con su propio
>   código React**. No los introduce el port: ya estaban así. Se corrige el texto de la ficha, y el
>   comportamiento se deja como estaba. Son **siete**.
> - La **§13** es nueva y es del port: qué se ve distinto en Angular y por qué.
>
> **Nada de lo que esta ficha reporta como bug se arregló en el port.** Es una migración de framework:
> cambiar comportamiento acá sería un cambio funcional encubierto, imposible de distinguir de una
> regresión al comparar las dos apps. Cada hallazgo va a §14 para que negocio decida. El más grave
> —`qd_strProductDetail` viaja **vacío** a PM4, y no "sin filtrar" como decía la documentación— queda
> **cubierto por un `it()` que asevera el comportamiento actual** (`contarGets(40) === 0`), para que
> el día que se decida alinear los tokens el test se ponga rojo señalando la línea.

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla (insumo) | **SCR-000** · **PAN-01.2** — Formulario de Radicación PQRS (Autoservicio) |
| Tarea BPMN | **P01-T00** — Radicar PQRS por autoservicio (portal público) |
| Proceso | **P01** — Gestión de Quejas Directas (`ACZ-QD-001`) |
| Rol responsable | Consumidor Financiero (Cliente / Intermediario / Empleado Zurich / Defensor del Consumidor) |
| Versión del diseño | TO-BE v3.0 |
| Slug / carpeta | `COL_QD_SCR-000_CrearRecibirQueja` |
| Archivos de implementación (Angular) | `crear-recibir-queja.ts`/`.html` · `seccion-consumidor.ts`/`.html` · `seccion-detalle-queja.ts`/`.html` · `pqr-page.ts`/`.html` · `pqr-section.ts`/`.html` · `pqr-readonly.ts`/`.html` (config centralizada en `../fields/fields.ts`; cascada en `../fields/matriz-motivos.service.ts`; catálogos en `core/catalogos.service.ts`) |
| Archivos de test | **cuatro** — `crear-recibir-queja.spec.ts` (33), `seccion-detalle-queja.spec.ts` (39), `seccion-consumidor.spec.ts` (27), `pqr-page.spec.ts` (5) · **104 casos en total** |

> ⚠️ **Nota de nomenclatura (se mantiene de la 1.0).** La carpeta y la pantalla implementada
> corresponden a **SCR-000 (PQRS Autoservicio / P01-T00)** del insumo v3.0 — campos FLD-300…FLD-341,
> reglas RUL-000-*, mensajes MSG-000-*. **No** es la SCR-001 (Crear/Recibir Queja, P01-T01, rol Gestor
> de Experiencia). Ver [Suposiciones realizadas](#10-suposiciones-realizadas).

---

## 2. Resumen

Formulario **público de autoservicio** mediante el cual un Consumidor Financiero radica directamente su
PQRS (petición, queja, reclamo, sugerencia o felicitación). Está organizado en 6 secciones: Tipo de
Solicitud y Rol, Datos del Consumidor Financiero, Detalle de la Queja, Autorización y Envío, y dos
secciones de solo lectura post-radicación (Estado ante la SFC y Responsable Asignado).

El usuario completa los campos obligatorios, acepta el tratamiento de datos, resuelve el captcha y
presiona **Enviar PQR**. El sistema asigna automáticamente la **instancia** y el **punto de recepción**
según el rol, crea el caso con ID único y ejecuta **P01-T01** (recepción y registro) → **P01-T06**
(validación preventiva).

> **⚠ Desde 2026-08-19 la pantalla atiende DOS procesos, no uno** (solicitud del usuario, §13.6). Lo
> que se elige en "¿A qué está asociado tu comentario?" decide todo lo de abajo: una **queja** sigue el
> camino histórico (S3 completa, proceso **31**, variables `qd_*`, similitudes por el script **70**);
> cualquier otro tipo de PQR muestra la sección **"Detalle de la Solicitud"** de un solo campo y radica
> en el proceso **36** (Otras Solicitudes) con las variables renombradas a **`os_*`** y las similitudes
> por el script **101**. Al abrir la pantalla no hay tipo elegido, así que el estado inicial es el de
> solicitud.

**Es la única de las doce pantallas del port que se publica como página web (Web Entry) en vez de
embeberse como tarea de PM4, y la única que CREA el caso.** De ahí sus tres rasgos estructurales, que
condicionan todo el diseño del componente (§13.1):

1. Dos modos de envío en el mismo componente: Web Entry (`POST /process_events/{31|36}?event={node_661|node_535}`)
   o tarea normal (`completarTarea`), según quién la abra.
2. `case_number`, `qd_strSfcCode` y el estado ante la SFC **no existen** mientras se llena el
   formulario. PM4 los asigna al radicar.
3. Su chrome es de sitio público (`app-pqr-page`/`-section`/`-readonly`), no de bandeja de tareas
   (`app-screen-header`/`app-form-section`).

---

## 3. Archivos de Insumo Analizados

Todos en `pm4-app/insumos/` (versión vigente **v3.0**).

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | `SCR-000` | **Fuente principal.** Historia de usuario, 42 campos (FLD-300…FLD-341), acciones (ACT-000-*) y reglas críticas (RUL-000-*). |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | `01_Pantallas` | Inventario maestro: fila SCR-000 / PAN-01.2 → P01-T00. |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | `02_Secciones` | SEC-041 a SEC-046 de SCR-000, orden y condición de visibilidad. |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | `04_Acciones` | Botones ACT-000-01/02/03 (Enviar PQRS, Limpiar, Cancelar). |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | `05_Reglas` | Reglas RUL-000-01…13. **Fuente principal de validaciones y dependencias.** |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | `06_Mensajes` | Mensajes MSG-000-01…08. **Fuente principal de mensajes.** |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | `07_Catalogs` | Catálogos CAT-ROL-RADICADOR, CAT-TIPO-SOLIC-PQRS, CAT-TIPO-ID, CAT-PAIS, CAT-DPTO, CAT-MPIO, CAT-PRODUCTO-SFC, CAT-MOTIVO-SFC, CAT-COND-ESP, CAT-ADMISION, etc. |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | `08_Permisos` | SCR-000: Consumidor Financiero radica; Gestor CX recibe (VER). |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx` | `10_Trazabilidad_BPMN` | SCR-000 → P01-T00, compuerta `¿Autorización aceptada y captcha válido?`, datos in/out. |
| `CATALOGOS v2.xlsx` | `cat-punto-recepcion` | Códigos de CAT-PUNTO (colección 20) — verificación de los tres puntos retirados y del default Internet. |
| `Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx` | `1. Tareas` / `2. Directrices` / `5. Documentos` | Directrices de registro (canal único, correo obligatorio). No existe fila dedicada a P01-T00; se referencia el contexto de P01-T01. |
| `Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx` | `05_Variables_Entrada` | Variables de las tareas automatizadas posteriores (P01-T02 en adelante). P01-T00 no tiene fila por ser tarea de formulario front. |

Catálogos implementados como **colecciones dinámicas PM4** (no listas estáticas), definidos en
`core/collections.ts` (`GLOBAL_COLLECTIONS`) y consumidos por pantalla vía `CatalogosService.de(clave)`.
Todos los ids se resuelven **por nombre** (`resolveCollectionId`, regla 6); el número es solo el
fallback de la instancia actual.

| Catálogo (insumo) | Clave / id | Campo |
|---|---|---|
| CAT-TIPO-SOLIC-PQRS | `requestType` (**18**) | `qd_strRequestType` |
| CAT-ROL-RADICADOR | `filerRole` (39) | `qd_strFilerRole` |
| CAT-TIPO-ID | `idType` (11) | `qd_strIdType` |
| CAT-DPTO | `department` (14) | `qd_strDepartment` |
| CAT-MPIO | `city` (15, `dependsOn: qd_strDepartment`) | `qd_strCity` |
| CAT-PRODUCTO-SFC | `sfcProduct` (16) | `qd_strSfcProduct` |
| cat_matriz_motivos | `matrixMotivos` (45, carga completa; cascada derivada **en cliente**) | `qd_strInteraction`, `qd_strServiceProvided`, `qd_strSfcReason` + los 5 derivados |
| CAT-ADMISION | `admission` (21) | `qd_strAdmission` |
| CAT-PUNTO | `receptionPoint` (**20**) | `qd_strReceptionPoint` |
| CAT-INSTANCIA | `receptionInstance` (**19**) | `qd_strReceptionInstance` |
| CAT-CANAL | `channel` (10) | `qd_strChannel` (derivado, sin widget) |
| CAT-ALIANZA | `alliance` (44) | `qd_strAlliance` |
| CAT-ENTE-CONTROL | `controlEntity` (22) | `qd_strControlEntity` (default por etiqueta) |
| CAT-TUTELA | `tutela` (30) | `qd_strTutela` (default por etiqueta) |
| CAT-QUEJA-EXPRES | `expressComplaint` (32) | `qd_strExpressComplaint` (default por etiqueta) |
| CAT-DETALLE-PRODUCTO | `productDetail` (40, `dependsOn: qd_strLegacyInsurance`) | `qd_strProductDetail` — **nunca llega**, ver §13.3 |

> **⚠ corregido en 2.0 (1 de 7).** La ficha 1.0 daba `qd_strRequestType` como colección **43**. El
> código React dice **18** (`frontend/src/core/collections.ts:12`), igual que el Angular. No es un
> cambio del port: la ficha estaba desactualizada respecto de su propio código.

---

## 4. Campos Implementados

**S1 — Tipo de solicitud y rol** (`crear-recibir-queja.html`):

> **⚠ corregido en 2.0 (2 de 7).** La ficha 1.0 abría esta sección con una nota que describe *"el
> número de caso (FLD-300) y la fecha/hora de creación (FLD-301) como línea de solo lectura al inicio
> de la sección"*. **Esa línea ya no existe en el código React**, y no puede existir: SCR-000 es la
> pantalla que **crea** el caso, así que en ese punto ni el número ni el timestamp han sido asignados
> todavía (el comentario que lo explica está en `CrearRecibirQueja.tsx:489-492`). El número de caso se
> muestra recién **después** de radicar, en el modal resumen (MSG-000-08).

> **⚠ corregido en 2.0 (3 de 7).** La ficha 1.0 pone `qd_strRequestType` como *"(movido a S3, junto al
> motivo)"*. En el código React es el **primer campo de S1**, en su propia fila
> (`CrearRecibirQueja.tsx:486`), y así se portó. La cascada de la matriz lo **lee** desde S3, pero el
> widget está en S1.

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| ¿A qué está asociado tu comentario? | `qd_strRequestType` | `zds-select` (CAT-TIPO-SOLIC-PQRS) | Sí | Anexo02 > SCR-000 > FLD-302 (fila 18) — primer campo de S1 |
| Selecciona tu rol | `qd_strFilerRole` | `zds-select` (CAT-ROL-RADICADOR) | Sí | Anexo02 > SCR-000 > FLD-303 (fila 19) — "Determina instancia y punto de recepción" |
| *(back, sin widget)* | `qd_strChannel` | Texto, derivado del punto de recepción (`DIC_CANAL_POR_PUNTO`) | Sí (al radicar) | Solicitud del usuario (2026-07-22) |
| Punto de recepción | `qd_strReceptionPoint` | `zds-select` (CAT-PUNTO, id 20) **editable**, default **Internet**, excluye los códigos 2 (Aplicación móvil), 6 (Audio respuesta) y 99 (Otros) | Sí | Anexo02 > SCR-000 > FLD-304 (fila 20) |
| *(back, sin widget desde 2026-08-20)* | `qd_strReceptionInstance` | **Sin select**: la asigna la RUL-000-01 según el rol y el control queda deshabilitado. Se escondió a pedido del usuario — es una variable que el BPM maneja por detrás. El valor y su `_desc` viajan igual (`getRawValue()`) | Sí (al radicar) | Anexo02 > SCR-000 > FLD-305 (fila 21) + solicitud del usuario (2026-08-20) |
| Alianza | `qd_strAlliance` | `zds-select` (CAT-ALIANZA), visible solo si rol = Empleado Zurich (código `'3'`) | No | Requerimiento — colección `alliance` (id 44) |

**S2 — Datos del Consumidor Financiero** (`seccion-consumidor.html`):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Tipo de identificación | `qd_strIdType` | `zds-select` (CAT-TIPO-ID) | Sí | Anexo02 > SCR-000 > FLD-306 (fila 22) |
| Número de identificación | `qd_strIdNumber` | Texto | Sí | Anexo02 > SCR-000 > FLD-307 (fila 23) — ver §5 |
| Nombres | `qd_strFirstName` | Texto, solo letras | Sí (si Natural) | Anexo02 > SCR-000 > FLD-308 (fila 24) |
| Apellidos | `qd_strLastName` | Texto, solo letras | Sí (si Natural) | Anexo02 > SCR-000 > FLD-309 (fila 25) |
| Razón social | `qd_strCompanyName` | Texto | Sí (si Jurídica/NIT) | Anexo02 > SCR-000 > FLD-310 (fila 26) |
| Nombres persona de contacto | `qd_strContactFirstName` | Texto, solo letras | Sí (si Jurídica) | Anexo02 > SCR-000 > FLD-311 (fila 27) |
| Apellidos persona de contacto | `qd_strContactLastName` | Texto, solo letras | Sí (si Jurídica) | Anexo02 > SCR-000 > FLD-312 (fila 28) |
| Celular | `qd_strPhone` | Texto (10 dígitos) | Sí | Anexo02 > SCR-000 > FLD-313 (fila 29) |
| Correo electrónico | `qd_strEmail` | Texto (email) | Sí | Anexo02 > SCR-000 > FLD-314 (fila 30) |
| Tipo de persona | `qd_strPersonType` | Derivado del tipo de documento, sin widget editable | Sí | Anexo02 > SCR-000 > FLD-315 (fila 31) |
| *(back, sin widget)* | `qd_strCountryCode` | Texto, fijo en `170` (Colombia) | Sí | Anexo02 > SCR-000 > FLD-316 (fila 32) — RUL-000-10 |
| Departamento | `qd_strDepartment` | `zds-select` (CAT-DPTO) | Sí | Anexo02 > SCR-000 > FLD-317 (fila 33) |
| Municipio | `qd_strCity` | `zds-select` (CAT-MPIO), dependiente y **deshabilitado** sin departamento | Sí | Anexo02 > SCR-000 > FLD-318 (fila 34) |
| *(back, sin widget)* | `qd_strAddress` | Texto, default vacío | — | Anexo02 > SCR-000 > FLD-319 (fila 35) |
| *(back, sin widget)* | `qd_strSex` | Default "No Aplica" (CAT-SEXO, id 23) | — | Anexo02 > SCR-000 > FLD-320 (fila 36) — editable en SCR-009 |
| *(back, sin widget)* | `qd_strLgbtiq` | Default "No" (CAT-LGBTIQ, id 41) | — | Anexo02 > SCR-000 > FLD-321 (fila 37) — editable en SCR-009 |
| *(back, sin widget)* | `qd_strSpecialCondition` | Default "No aplica" (CAT-COND-ESP, id 24) | — | Anexo02 > SCR-000 > FLD-322 (fila 38) |

**S3 — Detalle de la Queja** (`seccion-detalle-queja.html`) — **visible solo si el tipo de solicitud es
una queja**; con cualquier otro tipo la reemplaza S3' (abajo). Ninguno de estos campos es obligatorio
—ni existe— fuera de la rama queja:

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Producto | `qd_strSfcProduct` | `zds-select` (CAT-PRODUCTO-SFC) | Sí | Anexo02 > SCR-000 > FLD-323 (fila 39) |
| Ingrese la placa | `qd_strPlate` | Texto, visible solo si producto = "Autos" | Sí (si Autos) | Anexo02 > FormularioCreaciónPQRS #25 |
| *(back, sin widget)* | `qd_strProductDetail` | **Viaja vacío**: el catálogo 40 nunca llega. Ver §13.3 | Sí (según ficha) | Anexo02 > SCR-000 > FLD-324 (fila 40) |
| Momento | `qd_strInteraction` | `zds-select` (`matrixMotivos.interaccion`), deshabilitado hasta tipo de solicitud **y** producto | Sí | Anexo02 > FormularioCreaciónPQRS #30 |
| Servicio | `qd_strServiceProvided` | `zds-select` (`servicioPrestado`), visible solo si momento = "Asistencias" | Sí (si Asistencias) | Anexo02 > FormularioCreaciónPQRS #31 |
| Motivo de la queja | `qd_strSfcReason` | `zds-select` (`codigoMotivoSFC`/`motivoSFC`), deshabilitado hasta completar momento/servicio | Sí | Anexo02 > SCR-000 > FLD-328 (fila 44) |
| Ingresa el detalle | `qd_strComplaintText` | `zds-textarea` (50–2000), `helpText` "Mínimo 50 caracteres." | Sí | Anexo02 > SCR-000 > FLD-329 (fila 45) — ver §13.4 |
| ¿Ya habías radicado / es reconsideración? | `qd_strReply` | `zds-checkbox-field` con contrato `'SI'`/`'NO'` | No | Anexo02 > SCR-000 > FLD-325 (fila 41) — Réplica SFC |
| Argumento de la réplica | `qd_strReplyArgument` | `zds-textarea` (máx 2000), visible si réplica = `'SI'` | No | Anexo02 > SCR-000 > FLD-326 (fila 42) |
| ¿Incluye anexos a la queja? | *(estado de UI, no viaja a PM4)* | `za-switch` que revela el cargador; al apagarlo descarta los archivos ya elegidos | No | Diseño web (switch al pie de la sección) |
| Ingresa archivos adjuntos | `qd_strAttach01…05` | `app-doc-support-uploader` (máx 5), tras el switch | No | Anexo02 > SCR-000 > FLD-330 (fila 46) |
| Admisión | `qd_strAdmission` | `zds-select` (CAT-ADMISION) visible solo si rol = Defensor (`'4'`); oculto y fijo en "No aplica" (código 9) en los demás roles | Sí (si Defensor) | Anexo02 > SCR-000 > FLD-331 (fila 47) |
| *(back, sin widget)* | `qd_strControlEntity` | Default por etiqueta `/otros/i` | Sí (al radicar) | Anexo02 > SCR-000 > FLD-332 (fila 48) |
| *(back, sin widget)* | `qd_strTutela` | Default por etiqueta `/^\d?\.?\s*no$/i` | Sí (al radicar) | Anexo02 > SCR-000 > FLD-333 (fila 49) |
| *(back, sin widget)* | `qd_strExpressComplaint` | Default por etiqueta `/^\d?\.?\s*no$/i` | Sí (al radicar) | Anexo02 > SCR-000 > FLD-334 (fila 50) |
| *(back, sin widget)* | `qd_strResponsableRole` | Derivado de `matrixMotivos.rolResponsable` | Sí (al radicar) | Solicitud del usuario (2026-07-09) |
| *(back, sin widget)* | `qd_strOmbudsmanEscalation` | Derivado de `escalamientoAdministrador` | Sí (al radicar) | Anexo02 > SCR-000 > FLD-327 (fila 43) |
| *(back, sin widget)* | `qd_strCompensation` | Derivado de `resarcimientoAdministrador` | Sí (al radicar) | Solicitud del usuario (2026-07-09) |
| *(back, sin widget)* | `qd_strSlaAssigned` | Derivado de `sla` | Sí (al radicar) | Solicitud del usuario (2026-07-09) |
| *(back, sin widget)* | `qd_strFraudRelated` | Derivado de `relacionFraude`, normalizado a `'SI'`/`'NO'` | Sí (al radicar) | **⚠ corregido en 2.0 (4 de 7)** — implementado en `SeccionDetalleQueja.tsx:154,169` y **ausente de la ficha 1.0** |

**S3' — Detalle de la Solicitud** (`crear-recibir-queja.html`, maquetada en línea) — **la sección que
ocupa el lugar de S3 cuando el tipo elegido NO es una queja**. Tiene un solo campo, por pedido explícito:

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Ingresa el detalle de la solicitud | `qd_strCaseDescription` → viaja como **`os_strCaseDescription`** | `zds-textarea` (máx 2000, **sin mínimo de 50**) | Sí (en esta rama) | Solicitud del usuario (2026-08-19) · Anexo02 > **FLD-047** (la variable que el proceso 36 ya lee en su propia pantalla de gestión) |

> Se maqueta en la plantilla de la pantalla y **no** como componente propio porque es un campo: S1 y S4
> están en línea por la misma razón, y el umbral de reúso del proyecto es ≥3.

**S4 — Autorización y envío** (`crear-recibir-queja.html`):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Autorizo el tratamiento de mis datos personales… | `qd_blnDataAuth` | `zds-checkbox-field` | Sí | Anexo02 > SCR-000 > FLD-335 (fila 51) |
| No soy un robot | `qd_blnCaptcha` | **reCAPTCHA v2 real en línea** (`app-recaptcha-widget`); el token se verifica server-side al radicar y `qd_blnCaptcha` viaja en `true` | Sí | Anexo02 > SCR-000 > FLD-336 (fila 52) — **⚠ corregido en 2.0 (5 de 7)**, ver §10.4 |
| Correo electrónico adicional | `qd_strCcEmail` | `zds-input` (email) | No | Anexo02 > SCR-000 > FLD-337 (fila 53) |

**S5 — Estado ante la SFC** y **S6 — Responsable Asignado** (post-radicación, solo lectura):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Estado SmartSupervision | `qd_strSmartSupStatus` | *(sin widget en esta pantalla — no existe al radicar)* | No | Anexo02 > SCR-000 > FLD-338 (fila 54) |
| Fecha y hora radicación SFC | `qd_strSfcFilingDate` | *(ídem)* | No | Anexo02 > SCR-000 > FLD-339 (fila 55) |
| Rol (Grupo) | `qd_strAssigneeRole` | `zds-input` de solo lectura, dentro de "Responsable asignado" | No | Anexo02 > SCR-000 > FLD-340 (fila 56) |
| Responsable | `qd_strAssignee` | `zds-input` de solo lectura | No | Anexo02 > SCR-000 > FLD-341 (fila 57) |

> **S5 no tiene widgets, y es correcto.** El estado ante la SFC lo produce la integración
> SmartSupervision **después** de radicar, así que en una radicación nueva no hay nada que mostrar;
> quien abre la pantalla como tarea sobre un caso ya asignado ve S6. Es el mismo motivo por el que la
> línea de número de caso desapareció de S1 (⚠ 2 de 7).

---

## 5. Validaciones Implementadas

Los validadores viven en el `FormGroup` de la pantalla (`crear-recibir-queja.ts:222-342`), porque son
parte de la **definición del campo**; el *texto* de cada error vive en el `mensajeDeError()` de la
sección que lo pinta. Es la misma separación que SCR-003.

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Celular = exactamente 10 dígitos | `Validators.pattern(/^\d{10}$/)` | Anexo02 > 05_Reglas > **RUL-000-04** → MSG-000-01 |
| Correo con formato válido | `Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)` en `qd_strEmail` | **RUL-000-05** → MSG-000-02 |
| Detalle 50–2000 caracteres | `minLength(50)` + `maxLength(2000)` en `qd_strComplaintText` | **RUL-000-06** → MSG-000-03 |
| Los obligatorios del detalle cambian de sección con el tipo | `CLL_VALIDADORES_DETALLE` + `alternarValidadoresDetalle()`: la rama queja exige producto/momento/motivo/relato (con el mínimo de 50), la rama solicitud exige **solo** `qd_strCaseDescription` (sin mínimo) | Solicitud del usuario (2026-08-19) — ver §13.6 |
| Autorización de datos obligatoria | Gate `blnPuedeEnviar` (botón deshabilitado) + `za-alert config="alert"` al intentar enviar | **RUL-000-07** → MSG-000-04 |
| Captcha obligatorio | Gate `blnPuedeEnviar` (exige token) + `za-alert config="negative"` | **RUL-000-08** → MSG-000-05 |
| Nombres/Apellidos solo letras | `pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/)` en los cuatro campos de nombre, en **las dos** ramas de persona: es del dato, no de la rama | Anexo02 > FLD-308/309/311/312 |
| Los obligatorios de los nombres cambian de bloque con el tipo de persona | `CLL_VALIDADORES_PERSONA` + `alternarValidadoresPersona()` (en `seccion-consumidor.ts`): la rama natural exige nombres+apellidos, la jurídica exige razón social + nombres/apellidos de contacto | **RUL-000-02/03** + arreglo de 2026-08-20 — ver §13.7 |
| Placa colombiana | `pattern(/^[A-Za-z]{3} ?[0-9]{3}$/)` en `qd_strPlate` | Anexo02 > FormularioCreaciónPQRS #25 |
| Correo de copia (opcional) con formato | Mismo patrón de email, sin `required` | Anexo02 > FLD-337 |
| Argumento de réplica máx. 2000 | `maxLength(2000)` | Anexo02 > FLD-326 |
| Campos obligatorios restantes | `Validators.required` en los ~20 controles obligatorios de S1–S3 | Anexo02 > SCR-000 (columna Oblig. = Sí) |

> **⚠ corregido en 2.0 (6 de 7) — `qd_strIdNumber` no tiene patrón, y no lo tiene en React tampoco.**
> La ficha 1.0 declara `pattern /^[A-Za-z0-9]{5,15}$/` sobre el número de identificación (RUL-000-13 →
> MSG-000-07). El control lleva **solo `Validators.required`**: no hay patrón que lo restrinja a 5–15
> alfanuméricos. Corolario: la entrada `qd_strIdNumber` de `DIC_MSG_PATRON` es **código inalcanzable**
> — el mensaje MSG-000-07 no puede dispararse porque ningún validador de patrón falla. Se porta tal
> cual (React se comporta igual) y va a §14.

> **Comportamiento de visualización de errores (UX).** Los mensajes esperan el primer intento de envío
> (`blnIntentoEnvio`). Sin esa guarda la pantalla se abriría **entera en rojo**: son ~20 controles
> obligatorios que arrancan vacíos, y un ciudadano que entra a radicar vería un formulario que parece
> ya haber fallado. Es el equivalente del `mode: 'onTouched'` de React Hook Form.

---

## 6. Mensajes de Error

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| "Debe contener exactamente 10 dígitos (MSG-000-01)" | Celular ≠ 10 dígitos | `mensajeDeError()` de S2 | **MSG-000-01** (fila 51) |
| "Formato esperado: usuario@dominio.com (MSG-000-02)" | Correo inválido | `mensajeDeError()` de S2 | **MSG-000-02** (fila 52) |
| "Mínimo 50 / Máximo 2000 caracteres (MSG-000-03)" | Detalle fuera de rango | `mensajeDeError()` de S3 | **MSG-000-03** (fila 53) |
| "Debe aceptar el tratamiento de datos… (MSG-000-04)" | Autorización sin marcar al enviar | `za-alert config="alert"` condicional en S4 | **MSG-000-04** (fila 54) |
| "Debe completar la validación de seguridad (captcha)… (MSG-000-05)" | Captcha sin resolver al enviar | `za-alert config="negative"` en S4 | **MSG-000-05** (fila 55) |
| "Verifica el formato según el tipo de documento (MSG-000-07)" | — | **Inalcanzable**: el control no tiene validador de patrón (§5) | **MSG-000-07** (fila 57) |
| "Solo se permiten archivos pdf, jpg, png o docx, máx 5 MB (MSG-000-06)" | Archivo no permitido o > 5 MB | Delegado a `app-doc-support-uploader`, que **hardcodea** las extensiones, el tope y el literal del mensaje | **MSG-000-06** (fila 56); RUL-000-11 |
| "Su solicitud fue radicada exitosamente. Número de caso: [ID]…" | PQRS radicada | **Modal resumen** con número de caso y fecha (`cllResumen`) | **MSG-000-08** (fila 58) — **⚠ corregido en 2.0 (7 de 7)**, ver §10.9 |

---

## 7. Reglas de Negocio

Las cinco derivaciones de S1 se registran como `effect()` en el **constructor** de la pantalla
(`crear-recibir-queja.ts:396-401`). Ver §13.2: estar escritas no alcanzaba, y ese es el hallazgo más
importante del port.

| Regla | Implementación | Fuente |
|---|---|---|
| El rol determina la **instancia** de recepción, que queda **bloqueada** | `sembrarInstancia()` + `bloquearInstancia()`: Defensor (`'4'`) → instancia `'3'`; roles `1/2/3/5` → instancia `'2'` (Entidad vigilada). El control se `disable({emitEvent:false})` | **RUL-000-01**; FLD-303/305 |
| El **punto de recepción** es un select editable con **Internet** por defecto | `sembrarPunto()`: si el control está vacío, busca `/internet/i` entre los puntos **visibles** y lo escribe. **No pisa** un valor precargado | **⚠ corregido en 2.0** — la ficha 1.0 dice "punto siempre 2. Virtual". Ver §10.3 |
| Se ocultan tres puntos del catálogo | `CLL_PUNTOS_OCULTOS = ['2','6','99']` (Aplicación móvil, Audio respuesta, Otros). El catálogo **completo** sigue enganchado al `_desc`, así que un caso histórico con uno de esos puntos se sigue leyendo | Solicitud del usuario (2026-07-22); CATALOGOS v2 |
| Canal derivado del punto de recepción (sin widget) | `derivarCanal()` sobre `DIC_CANAL_POR_PUNTO`: punto 5 → canal 5; puntos 1/3/7 → canal 13; punto 4 → canal 14. Sin regla → canal vacío (no ocurre con los 5 puntos ofrecidos) | Solicitud del usuario (2026-07-22) |
| Al salir del rol Empleado Zurich se **limpia** la alianza | `limpiarAlianza()`: si el rol ≠ `'3'` y hay alianza elegida, la vacía. Sin esto una alianza quedaría pegada a un caso cuyo radicador ya no es empleado | **RUL-000-01**; FLD-303 |
| Tipo de documento define el tipo de persona | `derivarTipoPersona()` en S2: NIT → Jurídica (Razón social + contacto); resto → Natural | **RUL-000-02 / RUL-000-03**; FLD-315 |
| Al cambiar Departamento se **limpia** Municipio, siempre | `aplicarCascadaMunicipio()` en S2 — incluida la precarga desde `task.data` | **RUL-000-09**; FLD-317/318 |
| País precargado a Colombia (`170`) | `fijarPais()` con `DEFAULT_COUNTRY_CODE` / `LOCK_COUNTRY` | **RUL-000-10**; FLD-316 |
| Admisión visible solo si rol = Defensor; fija en "No aplica" (código 9) en los demás | `@if` en S3 + `sembrarAdmision()`, que resuelve primero por código `'9'` y cae a `/no aplica/i` sobre la etiqueta | **RUL-000-01**; FLD-331 |
| Campos regulatorios con default **por etiqueta del catálogo** | Ente de control `/otros/i`; tutela y queja exprés `/^\d?\.?\s*no$/i` — el ancla y el prefijo opcional son obligatorios porque las etiquetas vienen numeradas (`"1. No"`) y un `/no/i` suelto haría match con "No aplica" | FLD-332/333/334 |
| Los cinco campos derivados del motivo | `objSelectedReasonRow` de la matriz → `rolResponsable`, `escalamientoAdministrador`, `resarcimientoAdministrador`, `sla`, `relacionFraude` (este último normalizado a `'SI'`/`'NO'`) | Solicitud del usuario (2026-07-09); FLD-327 |
| Argumento de réplica visible solo si réplica = `'SI'` | `@if` en S3 | **RUL-000-12**; FLD-325/326 |
| Chequeo de **similares** antes de radicar, best-effort | Script `SCR000_SIMILAR_CASES_SCRIPT_ID` (70) → modal de confirmación si hay coincidencias. **Si el script falla, se radica igual**: un detector de duplicados caído no puede bloquear el derecho a radicar | Requerimiento |
| El captcha **se verifica server-side** o no se radica | `POST /api/recaptcha/verify` antes del envío. Si el verify falla, **no** se radica | **RUL-000-08**; FLD-336 |
| `qd_strSfcCode` se escribe **después** de crear el caso | `buildSfcCode(case_number)` en un segundo PUT (Web Entry) o directo en el payload (tarea normal) | Solicitud del usuario (2026-07-29) |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Maquetado de página pública (barra navy + banner azul + hoja de secciones + footer corporativo) | `app-pqr-page` / `app-pqr-section` / `app-pqr-readonly` sobre las clases `.pqr-*` de `shared.css`, tokenizadas. **Es la única pantalla del port que no usa `app-screen-header`/`app-form-section`** | Maqueta HTML de radicación PQRs (2026-08-04) |
| S1–S4 siempre visibles | Cuatro `app-pqr-section` | Anexo02 > 02_Secciones SEC-041…SEC-044 |
| S6 (Responsable) visible solo si hay responsable | `@if (blnTieneResponsable())` | SEC-046 |
| Campos de persona natural vs. jurídica alternados | `@if` sobre `blnEsJuridica()` en S2 | RUL-000-02/03 |
| Municipio deshabilitado hasta elegir Departamento | `sincronizarBloqueoMunicipio()` — es el único canal, porque `zds-select` no tiene input `disabled` | RUL-000-09; FLD-318 |
| Placa visible solo si producto = "Autos" | `@if (blnIsAutos())` (regex `/autos/i` sobre la etiqueta) + limpieza al salir | FormularioCreaciónPQRS #25 |
| Servicio visible solo si momento = "Asistencias"; momento/motivo deshabilitados en cascada | `@if` + deshabilitado encadenado, resuelto por `MatrizMotivosService` | #30/#31/#32 |
| Botón "Enviar PQR" habilitado solo con autorización + captcha | `[disabled]="!blnPuedeEnviar()"`. **El gate se deriva de `sigValores()`, nunca de `form.valid`** — ver §13.1 | ACT-000-01 |
| Botón "Limpiar queja" | `limpiarFormulario()` → `reset(SCR000_DEFAULTS)` + limpia el registro de archivos | ACT-000-02 |
| Botón "Cancelar" retirado | La maqueta web contempla dos acciones; ACT-000-03 queda sin botón | Maqueta (2026-08-04) |
| Overlay de radicación | `lib-loader-z` + "Radicando tu solicitud..." mientras `blnRadicando()` | — |
| Modal resumen tras radicar | `lib-modal-z` con `cllResumen()` (número de caso, fecha, tipo de solicitud…) | MSG-000-08 |
| Modal de casos similares | `lib-modal-z` con `strTextoSimilares()` + confirmar/cancelar | Requerimiento |
| Adjuntos tras un switch de UI | `za-switch` (estado local, **no** un campo de PM4) + `app-doc-support-uploader` con las 5 claves | FLD-330; RUL-000-11 |
| Instrucciones de radicación | `.pqr-intro`, **fuera** del banner — ver §13.4 | Maqueta (2026-08-04) |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strFilerRole` | `qd_strReceptionInstance`, `qd_strAdmission`, `qd_strAlliance` | Defensor (`'4'`) → instancia `'3'` + Admisión **visible**; roles `1/2/3/5` → instancia `'2'` + Admisión oculta y fija en `'9'`; rol ≠ `'3'` **limpia** la alianza | RUL-000-01; FLD-303/305/331 |
| `qd_strReceptionPoint` | `qd_strChannel` | Tabla `DIC_CANAL_POR_PUNTO`. El punto arranca en Internet por defecto, así que el canal arranca en 13 | Solicitud del usuario (2026-07-22) |
| `qd_strIdType` | `qd_strPersonType` + bloque de campos | NIT → Jurídica (Razón social + contacto); resto → Natural | RUL-000-02/03; FLD-315 |
| `qd_strDepartment` | `qd_strCity` | Limpia la ciudad y recarga el catálogo (id 15, `dependsOn`); ciudad deshabilitada sin departamento | RUL-000-09; FLD-317/318 |
| **`qd_strRequestType`** | **S3 vs S3', el proceso, el vocabulario y el script de similares** | Queja → S3 completa, proceso **31**, variables `qd_*`, script **70**; cualquier otro tipo → S3' *"Detalle de la Solicitud"*, proceso **36**, variables **`os_*`**, script **101**. Los obligatorios del detalle se recalculan por rama (`CLL_VALIDADORES_DETALLE`). Sin tipo elegido: rama solicitud | Solicitud del usuario (2026-08-19) — §13.6 |
| `qd_strRequestType` + `qd_strSfcProduct` | `qd_strInteraction` | Cascada `matrixMotivos` (id 45) filtrada en cliente; al cambiar cualquiera se limpia el momento | #30 |
| `qd_strInteraction` (= "Asistencias") | `qd_strServiceProvided` | Muestra el servicio y carga sus opciones; otros momentos lo ocultan/limpian | #31 |
| Toda la cadena | `qd_strSfcReason` | Filtrado por los cuatro niveles; cambiar cualquier eslabón lo limpia | #32 |
| `qd_strSfcReason` | `qd_strResponsableRole`, `qd_strOmbudsmanEscalation`, `qd_strCompensation`, `qd_strSlaAssigned`, **`qd_strFraudRelated`** | Se toma la fila exacta de la matriz y se copian sus cinco columnas; cualquier cambio aguas arriba las limpia hasta reelegir motivo | Solicitud del usuario (2026-07-09) |
| `qd_strSfcProduct` (= "Autos") | `qd_strPlate` | Muestra el campo; fuera de Autos se oculta y limpia | #25 |
| `qd_strReply` (= `'SI'`) | `qd_strReplyArgument` | Muestra el argumento | RUL-000-12; FLD-325/326 |
| `qd_strLegacyInsurance` *(nunca escrito)* | `qd_strProductDetail` | **La dependencia está rota**: el filtro viaja como `qd_strProductFilter` y el `dependsOn` dice `qd_strLegacyInsurance`, así que el GET **se cancela**. Ver §13.3 | MAPEO_qd_old_new.md #3 |

---

## 10. Suposiciones Realizadas

Se conservan las 17 de la 1.0; abajo van solo las que **cambian** en la 2.0. Las no listadas siguen
vigentes tal cual (nomenclatura SCR-000, insumo v3.0, catálogos dinámicos, validación de archivos
delegada, Web Entry, defaults de back, texto del banner, cascada en cliente, variables de ruteo,
admisión, canal derivado, `qd_strSfcCode`, `qd_blnSmartSupervisionCase`).

**10.3 — ⚠ corregido en 2.0. El punto de recepción NO es "siempre 2. Virtual".** La ficha 1.0 lo
declara fijo. El código React lo hace un **select editable** sobre CAT-PUNTO (id 20) con **Internet**
por defecto, ocultando los códigos 2/6/99. Y hay un matiz que el port destapó y que vale registrar: en
el código *Angular*, hasta la corrección de §13.2, el default **no se aplicaba** — la derivación estaba
escrita y nunca corría, así que el punto salía vacío y el canal con él.

**10.4 — ⚠ corregido en 2.0. El captcha NO es un checkbox de confirmación.** La 1.0 dice que, a falta
de widget en el DS, se implementó un checkbox "No soy un robot" con el mismo patrón visual. El código
usa **reCAPTCHA v2 real** (`app-recaptcha-widget`, site key en el entorno) y **verifica el token
server-side** (`POST /api/recaptcha/verify`) antes de radicar. En el port se agrega una mitad que React
ya tenía y que es fácil de omitir: `(expirado)`, porque el token vive 2 minutos y el widget destilda el
checkbox al vencer — sin esa mitad la pantalla seguiría creyendo que hay validación humana y el
`siteverify` contestaría `timeout-or-duplicate` sobre una casilla que el usuario ve tildada.

**10.6 — ⚠ corregido en 2.0. No hay patrón de identificación.** La 1.0 declara `/^[A-Za-z0-9]{5,15}$/`
como "patrón genérico implementado". No existe: el control lleva solo `required` (§5). La matriz de
formatos por tipo de documento (RC/TI/CC/CE/PA/PPT/NIT) que RUL-000-13 pide sigue pendiente, y ahora
sin ningún piso.

**10.9 — ⚠ corregido en 2.0. El mensaje de éxito no es un texto propio: es el modal resumen.** La 1.0
dice que la pantalla muestra un texto propio *"porque en modo Web Entry el ID puede no estar disponible
inmediatamente en el front"*. El código abre un **modal resumen** con el número de caso y la fecha
(`cllResumen()`), que es exactamente MSG-000-08. El ID **sí** está disponible: la respuesta de
`POST /process_events` trae `case_number` junto al `id` interno, y de ahí sale también
`buildSfcCode()`.

**10.18 (nueva) — El chrome divergente del DS es deliberado y está medido.** Tres piezas del maquetado
público no salen del componente del DS que uno esperaría, y en los tres casos el motivo está verificado
contra la librería, no supuesto. Ver §13.4.

**10.19 (nueva, 2026-08-19) — Los cuatro supuestos de la bifurcación por tipo.** El pedido de dos
procesos (§13.6) se implementó con la lectura literal de *"solo si está escogido queja"*, y eso deja
cuatro decisiones tomadas por defecto: (a) el detalle de la solicitud **no** tiene mínimo de 50
caracteres —el piso es de la SFC sobre el relato de una queja—; (b) al abrir la pantalla, sin tipo
elegido, se muestra *"Detalle de la Solicitud"*; (c) los campos de queja ya tipeados **no se limpian** al
cruzar de rama y viajan al 36 como `os_*` con el valor que quedó; (d) el 36 recibe el juego **completo**
de variables espejado, no un subconjunto. Las cuatro están listadas para confirmación en §14.

---

## 11. Cobertura de Trazabilidad

| Elemento | Cobertura | Observación |
|---|---|---|
| Campos documentados | 100% | 42/42 (FLD-300…FLD-341) trazados, **+1 no documentado en la 1.0** (`qd_strFraudRelated`) y **+1 nuevo en 2026-08-19** (`qd_strCaseDescription`, que viaja como `os_strCaseDescription` = **FLD-047** del Anexo 02 de Otras Solicitudes — el único campo de esta pantalla cuya trazabilidad apunta al anexo del otro proceso). |
| Validaciones documentadas | 100% | RUL-000-04/05/06/07/08 implementadas; **RUL-000-13 documentada como NO implementada** (§5); RUL-000-11 delegada. |
| Mensajes documentados | 100% | MSG-000-01…08 trazados; MSG-000-07 marcado **inalcanzable**. |
| Reglas de negocio documentadas | 100% | Las cinco derivaciones de S1 tienen caso propio en el spec desde el port (§13.2). |
| Comportamientos de UI documentados | 100% | Secciones, visibilidad condicional, acciones y los dos modales trazados. |
| Dependencias entre campos documentadas | 100% | Incluida la dependencia **rota** de `productDetail` (§13.3). |
| **Tests** | **99 casos en 4 archivos** | Un caso por regla, no un smoke. Ver §13.5. |

**Elementos sin fuente directa en insumos (inferidos):** discrepancia de nomenclatura de carpeta,
matriz de formatos de identificación, comportamiento de mostrado de errores, ids de Web
Entry/colecciones, texto del banner — todos en *Suposiciones realizadas*.

---

## 12. Mapeo elemento → componente DS (Angular)

| Elemento de la maqueta | Componente Angular | Tipo de decisión |
|---|---|---|
| Barra navy con logo | `.pqr-topnav` + `<img>` — **NO** `lib-navigation-z` | CSS propio (el wrapper no tiene `<ng-content>`, §13.4) |
| Banner azul | `lib-stage-banner-z shape="3"` + `category=""` + `[customStr]` | Componente DS |
| Texto introductorio | `.pqr-intro`, **fuera** del banner | CSS propio (§13.4) |
| Hoja de secciones | `app-pqr-section` (`.pqr-section-title` + `-divider`) | Componente propio |
| Pares label/valor de solo lectura | `app-pqr-readonly` | Componente propio |
| Campos de texto / email / tel | `zds-input` (×12) | Fachada |
| Selects de colección | `zds-select` (×13, uno de ellos solo para el Defensor — §13.8) | Fachada + `CatalogosService` |
| Textareas | `zds-textarea` (×2, con contador `maxLength`) | Fachada |
| Checkboxes (autorización, réplica) | `zds-checkbox-field` (×2, con `checkedValue`/`uncheckedValue`) | Fachada |
| Switch de anexos | `za-switch` (CVA nativo → `[formControl]` directo) | DS |
| Cargador de adjuntos | `app-doc-support-uploader` | Componente propio |
| Captcha | `app-recaptcha-widget` | Componente propio |
| Alertas de autorización / error de envío | `za-alert config="alert"|"negative"` (inline) | DS |
| Botones (Enviar, Limpiar, los de los modales) | `lib-button-z` (×5), `[disabled]` **siempre explícito** | DS |
| Modales (resumen, similares) | `lib-modal-z` (×2) + `libZTemplate` | DS |
| Overlay de radicación | `lib-loader-z` (×2) | DS |
| Footer corporativo | `.pqr-footer*` — **NO** `lib-footer-z` | CSS propio (`FooterZ` está vacía) |

> **Las ~20 clases `.pqr-*` ya estaban** en `shared.css` desde React (`shared.css:1405-1666+`), así
> que el port agregó **tres bloques y nada más**, los tres derivados de las divergencias de §13.4 y
> los tres tokenizados:
>
> - **`.pqr-topnav` revive.** Se había borrado al migrar la barra a `ZrNavigation` en React; acá vuelve
>   a maquetarse a mano porque `lib-navigation-z` no proyecta contenido. Cae bajo la regla explícita de
>   la política de la hoja ("layout o estructura → CSS propio"): lo que se necesita es una barra de
>   altura fija con un logo, no navegación con rutas y redes.
> - **`.pqr-intro` es nueva**, y existe porque el párrafo sale del banner. No reusa `.pqr-note`: ese
>   margen asume estar dentro del card blanco, y el intro va sobre el fondo gris.
> - **Dos declaraciones de `color`** en `.pqr-modal-icon--info/--warning`, que React ponía como `style`
>   en línea sobre el `za-icon`. Van en la clase porque el par fondo+color es un patrón compartido por
>   los dos modales. Alcanza con setearlo en el contenedor: `z-icon` no es un SVG con `fill` sino un
>   `background-color: var(--z-icon--color, currentColor)` recortado por una `mask`, así que hereda por
>   `currentColor` (verificado en `@zurich/css-components/dist/Icon.css`).

---

## 13. Notas del port a Angular (nuevo en 2.0)

### 13.1 Tres rasgos únicos, y cómo condicionan el componente

**Los dos modos de envío.** `TaskService.blnEsWebEntry` es un **getter** (`!taskId() && !caseId()`) y
decide la rama: Web Entry → `POST /process_events/{31|36}?event={node_661|node_535}` (crea el caso, en
el proceso que corresponda al tipo elegido — §13.6); tarea normal → `completarTarea()` (avanza el que ya
existe, y ahí no hay elección de proceso posible: el caso ya está donde está).

⚠ **Y la rama de Web Entry NO usa `TaskService.iniciarProceso()`, a propósito.** Es lo primero que uno
intenta y no puede funcionar: `iniciarProceso()` resuelve proceso y evento desde `Pm4ContextService`,
que los lee **solo del query string**, y la URL de una Web Entry no trae `process_id` ni `event_id` (si
los trajera no sería una Web Entry, sería un arranque parametrizado). El `if (!strProcessId) throw`
dispara y la radicación muere antes del POST. Los ids salen del **registro**
(`SCR000_WEB_ENTRY_PROCESS_ID`/`_EVENT_ID`, resueltos por nombre — regla 6). React esquiva su propio
hook por el mismo motivo (`CrearRecibirQueja.tsx:236-238`), así que el POST directo es **paridad, no
atajo**.

**El gate de envío se deriva de `sigValores()`, nunca de `form.valid`.** `form.valid` es un **getter**,
no un signal: leerlo dentro de un `computed()` no crea dependencia y el computed se congela en el valor
de su primera evaluación (form vacío ⇒ inválido) **para siempre** — el botón nunca se habilitaría. El
gate real son dos condiciones sobre el espejo reactivo (autorización + token de captcha); la validez
del form se chequea **imperativamente** en el submit, que es donde sí se puede leer.

**`getRawValue()` en todas las lecturas del form, y no es preferencia.** S2 **deshabilita** el
municipio mientras no haya departamento (único canal: `zds-select` no tiene input `disabled`), y **un
control deshabilitado desaparece de `form.value`**. Con `value`, el municipio viajaría ausente a PM4 en
el caso más común de todos.

**El orden del flujo de envío es contrato:** submit → captcha presente → script de similares
(**70** en la rama queja, **101** en la de solicitud) → [modal si hay coincidencias] → `verify`
server-side → envío. Si el script de similares falla se **radica igual**; si el `verify` falla **no** se
radica. Lo único que cambia entre ramas es *cuál* script se llama y con qué prefijo viajan sus
variables de entrada y de salida — el orden y las dos políticas de error son las mismas.

### 13.2 ⚠ El hallazgo del port: cinco reglas correctas, completas, y que nunca se ejecutaban

Las cinco derivaciones de S1 —`sembrarPunto`, `derivarCanal`, `sembrarInstancia`, `bloquearInstancia`,
`limpiarAlianza`— estaban **escritas, correctas y sin un solo call site**. Las dos secciones hijas
registran sus derivaciones en `effect()` dentro del **constructor**
(`seccion-consumidor.ts:98-115`, `seccion-detalle-queja.ts:134-150`); la pantalla padre **no tenía
constructor**.

**Ningún gate automático lo vio:**

| Gate | Por qué no lo vio |
|---|---|
| `tsc --noEmit` | No marca **métodos de clase** sin usar. Solo locals y parámetros. |
| ESLint | Tampoco. |
| `ng build` | Compiló sin una advertencia. |
| La suite (26 casos verdes) | Ningún caso aseveraba **el valor del control**; los que tocaban el tema pasaban por otra vía. |

Lo destapó la **comparación visual contra React en el navegador** (MCP de Playwright contra el dev
server): React muestra "Punto de recepción: Internet" y Angular lo mostraba **vacío**, con
`qd_strChannel` vacío como consecuencia.

**La corrección** es un constructor con las cinco registraciones (`crear-recibir-queja.ts:396-401`), y
tiene dos restricciones de ubicación que no son cosméticas:

- **Va en el constructor, no en `ngOnInit`.** `effect()` exige contexto de inyección, y este `ngOnInit`
  tiene un `await` en el medio (deja de serlo después). Además las derivaciones tienen que estar
  escuchando **antes** de que `precargar()` escriba los códigos que las disparan.
- **Va después de `form` y `sigValores` en el orden de declaración**, que en una clase es el orden de
  ejecución: los cuerpos leen `sigValores()` a través de `leer()`, y un constructor declarado arriba
  correría con el campo todavía `undefined`.

**Los cinco casos que lo fijan** están en `crear-recibir-queja.spec.ts` bajo *"Las cuatro derivaciones
de S1"*, y **asevaran el valor del control**, no la existencia del método: un caso sobre "el método
hace lo correcto" habría pasado desde el primer día sin que la pantalla derivara nada. Lo que fija la
regla es que el efecto **corra**.

**Y hay un segundo hallazgo dentro del primero, que salió de la pasada de mutación.** Los cinco casos
necesitaron un montaje propio (`montarConCatalogosS1()`) porque **el montaje normal responde `[]` a
todas las colecciones**, y las cuatro derivaciones resuelven su código **contra el catálogo** en vez de
escribir un literal. Con catálogo vacío, cada una sale por su guarda de "lista vacía" y no escribe
nada: un caso escrito sobre el montaje normal **pasa en verde con la regla borrada**. Se midió: la
mutación de la guarda de "no pisar un punto precargado" volvió **verde**, y solo se puso roja
(`expected '1' to be '4'`) después de rehacer el caso con opciones reales **y** datos precargados.

**Lección transferible, y por eso está en la ficha y no solo en un comentario:** en este proyecto *"el
método es correcto"* y *"el método se ejecuta"* son dos cosas **independientemente verificables**, y la
segunda no la cubre ningún gate. Vale revisar las otras diez pantallas portadas por el mismo patrón.

### 13.3 ⚠ El bug de `productDetail` es peor de lo que decía la documentación, y se preserva

`MAPEO_qd_old_new.md` #3 documentaba el desajuste `qd_strProductFilter` (la clave que viaja) vs
`dependsOn: 'qd_strLegacyInsurance'` (lo que la colección espera) como *"el filtro no se aplica y el
catálogo llega completo"*. **Medido, no es eso.** `CollectionService.cargar()` abre con un gate duro
(`collection.service.ts:102-105`):

```ts
if (in_objDef.dependsOn && !in_dicWatchValues?.[in_objDef.dependsOn]) { this.limpiar(); return; }
```

La clave ausente no degrada el filtro: **cancela la petición**. El catálogo no llega ni completo ni
filtrado — no llega. Comprobado por las dos vías: en jsdom, al montar se piden los ids
`[16,18,45,21,22,30,32]` y el **40 no aparece**; y contra el backend real en el navegador, mismo
resultado en el log de red.

**El corolario cae sobre FLD-324:** `sembrarDetalleProducto()` no tiene de dónde tomar "la primera
opción", así que **`qd_strProductDetail` viaja siempre vacío a PM4** — y lo hace hoy en **producción
React** también. Se porta idéntico y se **reporta**: alinear los tokens cambiaría un dato que el
proceso viene recibiendo vacío desde siempre, y eso es un cambio funcional, no una migración.
Cubierto por un caso que asevera `contarGets(40) === 0`, para que el día que se decida el test se ponga
rojo señalando la línea. La ampliación medida quedó anexada a `MAPEO_qd_old_new.md` #3.

### 13.4 Las tres divergencias del chrome, todas verificadas contra la librería

**1 · El logo no va en un slot de `lib-navigation-z`.** React hace
`<ZrNavigation><img slot="logo" …/></ZrNavigation>`. El wrapper de Colombia **no tiene `<ng-content>`
en ninguna parte** — su plantilla compilada es entera `<za-navigation config="" [routes]="routes"
[social]="social">`, coherente con el `never` en la posición de `ngContentSelectors` de su `ɵcmp`. Un
hijo `<img slot="logo">` no tendría dónde proyectarse: Angular lo descartaría **en silencio** y la
barra saldría sin logo. Peor: de los ocho inputs que `za-navigation` declara, el wrapper reenvía tres
(`config` fijo en `""`, `routes`, `social`) y ninguno sirve para un logo. Por eso la barra se maqueta a
mano.

**2 · El intro sale del banner, y el titular GANA tipografía.** React compone titular y párrafo
*dentro* de `content` con `font` inline, aprovechando que su wrapper tipa
`content: string | ReactNode`. El de Colombia tipa `content: string` y lo rinde como interpolación de
texto, así que un `TemplateRef` no compila y un string con markup se escaparía literal. Y el
`z-stage-banner` de abajo sí tiene dos slots, pero **su orden es fijo y el chico va arriba**
(`<h6>{category}</h6>` sobre `<h3>{content}</h3>`): meter el intro en `category` pintaría el párrafo
chico **encima** del titular grande, invertido respecto del diseño aprobado. Así que el titular viaja
por `content` y el intro sale como `.pqr-intro`. Lo que se pierde es el párrafo sobre fondo azul; lo
que se gana es que el titular pase a **`--zf-h-48`**, que es exactamente lo que usaba
`.pqr-banner-title` antes de las dos migraciones — React lo había bajado a `--zf-h-44` al forzar el
font inline. Sobre el eje de paridad del proyecto ("gana el componente del DS"), esto es el DS
**acercándose** al diseño.

⚠ **`category=""` es obligatorio, no cosmético:** su default es el literal `'Category Header'`, que se
pintaría en inglés arriba del titular.

**3 · Los colores van por `customStr`, no por un `style` del host.** React los seteaba inline porque su
wrapper no ofrecía otra vía. El de Colombia expone `customStr`, que reenvía a `[custom-str]` y el
getter `_cssTokens` lo convierte en tokens `--z-stage-banner--{clave}` puestos **sobre el elemento que
los consume** en vez de heredados del host. Se usa esa vía porque si mañana el DS agrega su propio
`custom-str` por default, un `style` en el host perdería contra él **en silencio**.

**Y una divergencia de texto deliberada, la única de la pantalla:** el detalle de la queja lleva
`helpText="Mínimo 50 caracteres."`, que React no tiene. React pone "Por favor ingresa el detalle de la
queja" como **`placeholder`**, y `lib-textarea-z` **no tiene input `placeholder`** (verificado en los
tipos del DS: de sus 13 inputs, ninguno lo es). El `helpText` es el único canal de texto de apoyo del
componente, y se aprovecha para adelantar el mínimo de 50 — que en React recién aparece como mensaje de
error, o sea después de fallar.

> **Tres textos que sí eran deriva del port, y se corrigieron a paridad** (no son divergencias
> justificadas, eran descuidos): el título de S1 decía "Tipo de solicitud" en vez de "Tipo de solicitud
> y rol"; el checkbox de réplica decía "Deseo ejercer mi derecho de réplica" en vez de "¿Ya habías
> radicado previamente la misma queja o es una reconsideración?"; y el textarea del detalle decía
> "Describe tu queja" en vez de "Ingresa el detalle". Los tres los destapó la comparación visual contra
> React, igual que §13.2.

### 13.5 Los cuatro archivos de test, y la brecha que React declaraba imposible

| Archivo | Casos | Qué cubre |
|---|---|---|
| `crear-recibir-queja.spec.ts` | **33** | Los 10 de React + los 5 de las derivaciones de S1 (§13.2) + los dos modos de envío + la cadena similitud→captcha→envío + `(expirado)` + los **4 de la bifurcación por tipo** (§13.6: qué sección monta, el traspaso de obligatorios en los dos sentidos, el proceso 36 con todo en `os_`, y el script 101 con su respuesta leída en `os_`) |
| `seccion-detalle-queja.spec.ts` | **39** | La cascada de 4 niveles, los 5 derivados del motivo, los 4 defaults por etiqueta, la placa, la réplica, el switch de anexos, `contarGets(40) === 0` |
| `seccion-consumidor.spec.ts` | **27** | Natural vs. Jurídica, RUL-000-09 (incluida la precarga), el bloqueo del municipio, el país fijo |
| `pqr-page.spec.ts` | **5** | Las tres divergencias del chrome (§13.4): el logo, el `category=""`, los tokens por `customStr` |

Hay un **quinto** archivo que vigila esta pantalla sin vivir en su carpeta:
`components/fields/paridad-react.spec.ts`, la guarda de paridad que monta cada pantalla portada y compara
sus campos contra el dataset congelado de React. No cuenta como cobertura de la pantalla, pero **cualquier
`@if` nuevo alrededor de un campo la pone roja** — pasó con este cambio, ver §13.6.

**El spec React declaraba por escrito que no cubría el envío exitoso** (`CrearRecibirQueja.test.tsx:1-25`):
react-hook-form exige ~20 campos obligatorios repartidos en selects del DS que no se pueden interactuar
vía `fireEvent` en jsdom, y además el Municipio se limpia deliberadamente cada vez que cambia el
Departamento (RUL-000-09) —incluida la precarga— así que *"ni siquiera queda satisfecho con un
fixture"*.

**En Angular esos 20 campos son `FormControl`s escribibles con `patchValue`, y la brecha se cierra.**
El envío exitoso pasa a ser aseverable en sus **dos** ramas: el `POST /process_events/31?event=node_661`
con su `qd_strSfcCode = buildSfcCode(case_number)`, y `completarTarea` (aseverando que **no** pasa por
`process_events`, que es lo que distingue las dos). Es la misma clase de cierre que SCR-013 hizo con
sus filtros.

**Pasada de mutación: seis mutaciones, cada una nombrando su línea y su caso.** MUT-1 `derivarCanal`
→ rojo (`'' to be '13'`) · MUT-2 `bloquearInstancia` → rojo (`false to be true`) · MUT-3
`sembrarInstancia` → rojo (`'' to be '2'`) · MUT-4 `limpiarAlianza` → rojo (`'ALIANZA-X' to be ''`) ·
MUT-5 `sembrarPunto` → rojo (`'' to be '1'`) · MUT-6 la guarda de no-pisar → **verde**, que es cómo se
descubrió el caso vacuo de §13.2; rehecho el caso, rojo (`'1' to be '4'`). Todas revertidas.

### 13.6 ⚠ Una pantalla, dos procesos: la bifurcación por tipo de solicitud (2026-08-19)

Pedido del usuario, cuatro cambios que son **uno**: lo que se elige en *"¿A qué está asociado tu
comentario?"* (`qd_strRequestType`) decide sección, proceso, vocabulario y watcher.

| | Rama **queja** | Rama **solicitud** (cualquier otro tipo) |
|---|---|---|
| Sección de detalle | S3 completa (`app-seccion-detalle-queja`) | S3' *"Detalle de la Solicitud"*, un solo campo |
| Proceso (Web Entry) | **31** · `node_661` | **36** · `node_535` (*COL - Otras Solicitudes*) |
| Vocabulario de variables | `qd_*` | **`os_*`** |
| Script de similares | **70** (`COL_QD_Check_Similitud`) | **101** (`COL_OS_Check_Similitud`) |

Los cuatro ids salen del registro por nombre (regla 6): `quejasDirectasWebEntry`,
`otrasSolicitudesWebEntry`, `similarCasesQuejas`, `similarCasesOtrasSolicitudes`.

**Sin tipo elegido no hay queja, así que la pantalla abre en la rama de solicitud.** Es la lectura
literal del pedido —*"que se muestre Detalle de la queja **solo si** está escogido queja"*— y tiene una
consecuencia visible: al montar, lo que se ve es *"Detalle de la Solicitud"*. `esTipoQueja()` decide por
**etiqueta** (`/queja/i` sobre la opción del catálogo 18) y cae al **código `'3'`** solo si el catálogo
no cargó todavía; al revés sería un id de colección hardcodeado disfrazado de constante.

**El renombre `qd_` → `os_` vive en el borde HTTP, no en el form.** Adentro —controles, `sigValores`,
`SCR000_DEFAULTS`, los `_desc`, el modal de similares, el resumen— **todo es `qd_` siempre**, y
`aPrefijoOs()` traduce el diccionario en los cuatro puntos donde sale a la red: el
`POST /process_events/36`, su PUT de seguimiento a `/requests/{id}`, la entrada del script 101 y —vía
`clave()`— la lectura de su respuesta. Un renombre adentro obligaría a duplicar la mitad de la pantalla
y dejaría a las secciones hijas leyendo claves que dependen de un select.

⚠ **`enviarPorTarea()` queda deliberadamente afuera del renombre.** Un caso que llega como tarea **ya
existe en el 31 con variables `qd_*`**, y un `PUT /tasks/{id}` no puede moverlo de proceso: traducir ahí
solo lograría escribirle un juego paralelo de variables que ninguna pantalla del 31 lee. La elección de
proceso es una decisión de **radicación**, y por eso vive donde se radica.

⚠ **Las claves sin prefijo `qd_` no se tocan, y eso es intencional.** `similar_check_status` (el flag que
lee el modal) y `process_id` (parámetro del script) atraviesan `conPrefijoOs()` sin cambio porque el
renombre es *por prefijo*, no por nombre. Los dos scripts esperan exactamente eso.

#### ⚠ La trampa que forzó reescribir el manejo de validadores

Un `@if` desmonta widgets; **no toca el `FormGroup`**. Los `required` de la sección que se va siguen
contando para `form.invalid`, y el gate de envío no diría nunca por qué. Eso ya se sabía. Lo que no era
obvio es por qué **no** alcanza con agregar y quitar validadores:

> Los `zds-select` de S3 (`qd_strInteraction`, `qd_strSfcReason`) llevan `[obligatorio]="true"`, y
> `lib-input-select-z.ngOnInit()` **compone su propio `required` sobre el control real de esta
> pantalla**: `setValidators(Validators.compose([elValidadorQueHabía, () => this.generateValidation()]))`.
> Después de eso el control tiene **un solo** validador —una clausura anónima—, así que
> `removeValidators(Validators.required)` (que compara por identidad) **no remueve nada y no falla**, y
> `hasValidator(Validators.required)` devuelve `false`. Y **ningún componente `lib-*-z` tiene
> `ngOnDestroy`**: al desmontarse S3, la clausura se queda. Resultado con `removeValidators`: la rama de
> solicitud **inválida para siempre** por dos campos que no están en el DOM.

Por eso `alternarValidadoresDetalle()` aplica **`setValidators()` con la columna entera** de
`CLL_VALIDADORES_DETALLE` —los cinco campos de detalle, las dos ramas, completas— y no un delta: pisar
es lo único que sobrevive a lo que el DS compuso. La tabla va como lista de tripletes y no como dos
diccionarios paralelos porque así el tipo **obliga** a declarar las dos ramas de cada campo.

El guardia `strRamaDetalle` (inicial `''`) no es una optimización: el efecto corre en **cada**
`valueChanges`, y reescribir la tabla en cada tecleo borraría el `required` que el DS compuso mientras
los widgets siguen montados. El `''` fuerza la primera aplicación al montar, donde la rama es solicitud.

Que el efecto corra **antes** del refresco de la plantilla del propio componente es lo que hace correcto
el orden: al cruzar a queja, los `required` se aplican y *después* monta S3, así que el DS compone sobre
una base ya correcta. El `emitEvent: false` es seguro por lo mismo.

**La medición de todo esto** es el tramo de vuelta de
`it('los obligatorios del detalle viajan de una sección a la otra, en los dos sentidos')`: tras pasar de
queja a solicitud, los `errors` de `qd_strSfcProduct`/`qd_strInteraction`/`qd_strSfcReason` tienen que
quedar en `null`. Con `removeValidators` ese caso es rojo — **verificado, ver MUT-7b abajo**.

#### Pasada de mutación de esta tanda (2026-08-19) — siete mutaciones, todas rojas y revertidas

Baseline de la tanda: los 59 casos de `crear-recibir-queja.spec.ts` + `components/fields/paridad-react.spec.ts`
en verde. Cada mutación nombra la línea rota y el caso que la atrapó.

| # | Qué se rompió | Rojo |
|---|---|---|
| **1** | `intProcesoDestino` → `return SCR000_WEB_ENTRY_PROCESS_ID` (siempre el 31) | 2 casos · `expected '/api/process_events/31' to be '/api/process_events/36'` |
| **2** | `conVocabularioDestino` → `return in_dic` (sin renombrar a `os_`) | 2 casos · `expected undefined to be 'Necesito el certificado de mi póliza…'` |
| **3** | `intScriptSimilares` → `return SCR000_SIMILAR_CASES_SCRIPT_ID` (siempre el 70) | 1 caso · `expected '/api/scripts/70/execute' to be '/api/scripts/101/execute'` |
| **4** | `clave()` → `return in_strClave` (lee la respuesta del 101 con nombres `qd_`) | 1 caso · el modal de similares **no abre** (cuenta 0 y sigue al captcha): `Expected one matching request… found none` |
| **5** | `@if (blnEsQueja())` → `@if (true)` en la plantilla | 4 casos · `expected ' Radicación PQRs…' not to contain 'Detalle de la queja'` y los dos submit de `os_` con `obligatorios sin llenar: [qd_strInteraction…]` |
| **6** | `alternarValidadoresDetalle()` con un `return` al principio | 3 casos · `expected false to be true` (el detalle nuevo no es obligatorio) + los dos submit con `[qd_strSfcProduct…]` |
| **7** | La tabla aplicada con `removeValidators(Validators.required)` en vez de `setValidators()` | 3 casos, pero **el primero que corta es otro**: el mínimo de 50 sobrevive en la rama de solicitud (`qd_strComplaintText` inválido con `'Corto.'`, línea 661 del spec) |
| **7b** | Ídem, pero **solo** sobre `strSfcProduct`/`strInteraction`/`strSfcReason`, para llegar al tramo de vuelta | 1 caso · exactamente la aserción de arriba: `expected 'qd_strInteraction {"required":true,"errorRequired":true}' to be 'qd_strInteraction null'` |

MUT-7b es la que cierra el argumento de esta sección, y hacen falta las dos formas para verlo: con la
mutación general (7) el caso muere **antes** del tramo de vuelta, por el mínimo de 50 que
`removeValidators` no toca; aislándola a los tres selects (7b) el caso llega al final y falla ahí. El
`errorRequired: true` junto al `required` es la huella del DS: es la clave que pone su
`generateValidation()`, o sea la prueba directa de que **lo que quedó colgado es el closure compuesto por
un widget ya desmontado**, no el `Validators.required` que había puesto la pantalla.

Un matiz que la mutación corrige de la explicación de arriba: de los tres campos, `qd_strSfcProduct`
**no** filtra — su `[obligatorio]` viaja sobre el control satélite `objProductoUi`, así que nunca hubo
composición sobre el control real. Los que filtran son `qd_strInteraction` y `qd_strSfcReason`. La tabla
los cubre a los tres igual, que es lo correcto: qué campo tiene red del DS y qué campo no es un detalle
de implementación de la sección, no un contrato con el que valga la pena acoplar la clase.

#### La guarda de paridad con React también pedía un ajuste

`components/fields/paridad-react.spec.ts` monta cada pantalla portada y compara sus campos montados
contra el dataset congelado de React. Con este cambio dio **2 rojos** —`qd_strCaseDescription` como campo
"que no existe en el contrato de React", y `qd_strReplyArgument` sin el `maxLength=2000` que React
pasaba— y los dos eran **el mismo hecho**: su fixture montaba SCR-000 sin tipo de solicitud, o sea en la
rama de solicitud, donde S3 entera está ausente. El `@if` de la réplica ahora tiene un `@if` **ancestro**.

Se arregló sembrando `qd_strRequestType: '3'` en `DIC_APERTURA_DE_RAMAS`, no exceptuando
`qd_strCaseDescription` en `DIC_NOMBRES_DINAMICOS`: la SCR-000 de React **siempre** mostraba el detalle
de la queja, así que la rama de queja es la que corresponde comparar, y la excepción habría dejado los
~12 campos de S3 sin comparar para siempre. El `'3'` alcanza porque el helper drena los catálogos vacíos,
así que la búsqueda de etiqueta de `esTipoQueja()` no encuentra nada y aplica el fallback por código.

`npm run verify` **verde** (128.9s). Esa corrida enumeraba 12 pasos y el `pytest` del microservicio
Python salía saltado —el servicio ya no estaba en el árbol, lo eliminó `d4e63a4`—, igual que antes del
cambio; ese paso se retiró después, así que hoy la lista son 11 pasos sin nada saltado. Suite Angular
completa: **1285 casos en 87 archivos**.

*(De paso: las cuentas de test de la 2.0 estaban corridas en uno — el archivo tenía **29** casos, no 28,
y el total era **100**, no 99. Los números de §1 y de la tabla de arriba son los medidos hoy.)*

#### Deuda de la misma clase que este cambio deja a la vista

`qd_strServiceProvided` (bajo el `@if` de Asistencias) y `qd_strPlate` (bajo el de Autos) son campos
`[obligatorio]="true"` **dentro** de S3, detrás de sus propios `@if`. Es exactamente la misma situación
—`required` del DS sobre un control cuyo widget puede no estar montado— y **no se tocó**: está fuera del
alcance del pedido. Vale revisarla junto con el punto 5 de §14.

---

### 13.7 ⚠ La deuda de §13.6 se cobró en S2 (2026-08-20)

Tres pedidos del usuario, y los dos primeros resultaron ser **un solo defecto** — el que la sección
anterior había dejado anotado como deuda, cobrado en el bloque de nombres de S2.

**Lo reportado:**

1. Con el tipo de identificación **NIT** y todos los datos llenos, no aparece ningún error de validación
   visible, pero "Enviar PQR" se comporta como si alguna validación hubiera fallado.
2. Eligiendo NIT y volviendo después a, por ejemplo, Registro Civil de Nacimiento, **Nombres** y
   **Apellidos** muestran "Campo requerido" con texto correcto escrito.
3. *(ajuste aparte)* El campo **Instancia de recepción** no debería verse: la variable la maneja el back.

**Reproducido en el navegador antes de tocar código**, con la pantalla corriendo como Web Entry y el
estado del form leído por `window.ng.getComponent(...)`:

```
// con NIT y todo lo visible lleno con valores válidos:
{"formValid": false, "invalid": {
   "qd_strFirstName": {"value": "", "errors": {"errorRequired": true}},
   "qd_strLastName":  {"value": "", "errors": {"errorRequired": true}}}}

// tras volver a Cédula y escribir por los inputs reales del shadow DOM:
{"firstName": {"v": "Nelson", "e": {"errorRequired": true}},
 "lastName":  {"v": "Bravo",  "e": {"errorRequired": true}}}
```

Dos detalles de esa medición son los que cierran el diagnóstico. **Falta la clave `required`**: esos dos
controles solo declaraban `Validators.pattern`, así que el error no lo puso Angular. Y `errorRequired`
**no se cae**: ni con un `updateValueAndValidity()` sincrónico ni 400 ms después, porque el closure lee un
`model` congelado en `''`.

**La causa**, la misma que MUT-7b había dejado documentada: `generateControl()` de `lib-zurich`
**compone** su validador sobre el control real de la pantalla, ese closure lee **`this.model` del
componente hijo** —no el valor del control— y **ningún `lib-*-z` tiene `ngOnDestroy`** (`ngOnDestroy`
aparece 2 veces en el `.mjs` contra 7 de `generateControl`). Cuando el `@if` de la rama desmonta el
widget, el closure sobrevive enganchado al `FormControl`; y como cada remontaje compone **encima** de lo
que ya había, los closures muertos se apilan.

Por qué el síntoma 1 es invisible: `scrollToFirstError()` resuelve `document.getElementById('field-<name>')`,
y `field-qd_strFirstName` no está en el DOM. Por qué el síntoma 2 dice "Campo requerido": el
`mensajeDeError()` de S2 solo distingue `pattern`, así que cualquier otra clave —incluida la del DS— cae
al mensaje genérico.

**El arreglo** es el mismo patrón que §13.6, aplicado ahora en S2: `CLL_VALIDADORES_PERSONA` +
`alternarValidadoresPersona()`, con guardia de rama y `setValidators()` de la **columna completa**. Escribir
la columna entera deja el control en el estado que le toca a la rama sin importar qué le compuso el DS
antes, que es lo que un `removeValidators` no puede hacer (compara por identidad de función contra un
closure compuesto: no saca nada y no falla). Los `[obligatorio]="true"` de la plantilla **se conservan** —
pintan el asterisco—, pero ya no son la fuente de verdad de la validez.

De paso, `RGX_SOLO_LETRAS` pasó a exportarse desde `seccion-consumidor.ts`: ahora el patrón lo necesitan
la declaración del `FormGroup` y la tabla de ramas, y dos copias que se desincronizaran dejarían el
`pattern` puesto en una rama y ausente en la otra. El spec de S2 también lo importa, así que su fixture
dejó de tener copia propia.

**El ajuste 3** salió del mismo cambio: se quitó el `zds-select` de la instancia de recepción y su fila
quedó en `cols-1` con el punto de recepción solo. Lo que **no** se tocó es nada de la escritura del dato:
`sembrarInstancia()` sigue derivándolo del rol, `bloquearInstancia()` sigue deshabilitando el control
—hace falta igual, para que un `patchValue` no pueda dejar la pantalla inválida por un campo que nadie
puede corregir porque nadie lo ve— y `sincronizarDesc()` sigue manteniendo el `_desc`; ese último llega
por la vía de las opciones y no por `valueChanges`, que es justo el caso que su docstring nombra para
este campo. `cllInstancias()` pasó a `private`: ya no lo lee la plantilla, pero sí `sembrarInstancia()`
para resolver el código contra el catálogo.

#### Pasada de mutación de esta tanda (2026-08-20) — cuatro mutaciones

Baseline: **1305 casos en 89 archivos**, verde.

| # | Qué se rompió | Rojo |
|---|---|---|
| **1** | `effect(() => this.alternarValidadoresPersona())` comentado | 3 casos de los 5 nuevos de S2 |
| **2** | El guardia `if (strRama === this.strRamaPersona) return;` quitado | **VERDE, 1304/1304** — ver abajo |
| **3** | Tabla rota en dos columnas a la vez: `cllJuridica` de `strCompanyName` vaciada y el `pattern` sacado de la rama jurídica de `strContactLastName` | 3 casos (incluido el de "el `pattern` sobrevive a los dos cruces") |
| **4** | El `zds-select` de la instancia de recepción repuesto en la plantilla | 1 caso · `⚠ la instancia de recepción NO se pinta, y el valor viaja igual` |

**MUT-2 quedó verde, y es un hueco real que conviene no disimular.** El guardia de rama existe para que
la tabla no se reescriba en cada tecla, porque una reescritura con los widgets montados borra el validador
que el DS compuso al montar y que nada vuelve a componer hasta un remontaje. Ese escenario **no es
observable bajo jsdom**: los custom elements de Lit no hacen upgrade (trampa 2 de
`docs/guides/testing-conventions.md`), así que el DS no compone nada y no hay nada que borrar. Fingirlo con
un `setValidators` a mano probaría que nuestro `setValidators` gana contra un validador que pusimos
nosotros — un test tautológico. El guardia se conserva por el argumento de diseño y por paridad con
`alternarValidadoresDetalle()`, que lo documenta igual; el caso "la obligatoriedad de la rama SOBREVIVE a
la escritura de otro campo" **nombra el hueco en el propio test** en vez de decorarlo. Si algún día la
fachada se prueba con los componentes del DS montados de verdad, ése es el momento de escribirlo.

**Lo que estos 5 casos nuevos SÍ aseveran** es la tabla: que la columna de la rama quede aplicada y que la
de la otra se vaya. Con eso el estado final del control es el correcto sin importar qué compuso el DS, que
es el argumento entero del arreglo. La prueba de que el closure existía es la medición en el navegador de
arriba, no un caso de jsdom.

#### Comprobación en el navegador DESPUÉS del arreglo (2026-08-20)

Como el defecto solo era observable con el DS montado de verdad, el cierre se midió donde se había medido
el síntoma: la pantalla como Web Entry (`?screen=COL_QD_SCR-000_CrearRecibirQueja&case_id=&task_id=`,
los dos parámetros **vacíos a propósito** para vencer los fallbacks de `.env`), manejando los `zds-select`
por su radio real dentro del shadow DOM y leyendo el form con `window.ng.getComponent(...)`.

```
// 1) NIT elegido, y los campos de la rama jurídica llenos:
{"valid": false, "campos": {
   "qd_strIdType":           {"v": "7",                     "e": null},
   "qd_strFirstName":        {"v": "",                      "e": null},   // ← antes: {errorRequired: true}
   "qd_strLastName":         {"v": "",                      "e": null},   // ← antes: {errorRequired: true}
   "qd_strCompanyName":      {"v": "Zurich Colombia S.A.S", "e": null},
   "qd_strContactFirstName": {"v": "Nelson",                "e": null},
   "qd_strContactLastName":  {"v": "Bravo",                 "e": null}}}

// 2) de vuelta a Registro Civil de Nacimiento, con los nombres del titular escritos:
{"valid": false, "campos": {
   "qd_strIdType":    {"v": "1",      "e": null},
   "qd_strFirstName": {"v": "Nelson", "e": null},   // ← antes: {errorRequired: true}
   "qd_strLastName":  {"v": "Bravo",  "e": null}}}
```

Dos cosas que vale leer con cuidado de esa medición:

- **Los dos nombres del titular quedan `null` estando VACÍOS bajo NIT** (medición 1). Eso es el síntoma 1
  cerrado: eran los dos controles que bloqueaban el envío sin pintar nada.
- **`valid` sigue en `false` en las dos**, y está bien: quedan sin llenar los obligatorios que no son parte
  de este arreglo (tipo de solicitud, rol, correo, teléfono, departamento, detalle…). Lo que se aseveró es
  el estado de las **seis** columnas de la tabla, no la validez global de un formulario a medio llenar.
- Un barrido del DOM **incluyendo los shadow roots** buscando `/requerid/i` devolvió **cero nodos** con los
  nombres escritos: el "Campo requerido" del síntoma 2 no aparece ni dentro del DS.

El único error de consola es un `ERR_CERT_DATE_INVALID` sobre `ZurichSans-Regular.ttf` de
`bpm.beesmart.ec` — el certificado de la fuente corporativa remota, ajeno a la aplicación.

El ajuste 3 se comprobó en la misma corrida: "Punto de recepción" se ve, "Instancia de recepción" no
aparece por ningún lado.

#### Lo que este cambio corrige de la ficha y del código

El bloque de comentario de `crear-recibir-queja.ts` que justificaba dejarle la obligatoriedad al DS
afirmaba que el validador "**se monta y desmonta con el `@if`**", y descartaba explícitamente la
alternativa del `setValidators()` por efecto con el argumento de que "su ventaja no se cobra porque el DS
compone igual". La primera mitad es falsa y la segunda es justamente al revés — el DS compone igual, y
**por eso** hace falta escribir la columna completa. El bloque quedó reescrito apuntando acá.

#### Deuda que este cambio NO cierra

La de §13.6 sigue abierta tal cual: `qd_strServiceProvided` y `qd_strPlate` siguen siendo
`[obligatorio]="true"` detrás de sus propios `@if` dentro de S3, sin tabla que los cubra. Con dos
secciones ya cobradas por el mismo defecto del vendor, esa tercera es el próximo lugar donde va a
aparecer.

---

### 13.8 ⚠ El campo de Admisión nunca se portó: un widget entero que faltaba (2026-08-20)

Reporte del usuario: *"cuando seleccionamos Defensor del consumidor debería aparecer el campo Admisión
pero no lo hace en Detalle queja, ese comportamiento funcionaba en react"*. Es exacto, y es una
**regresión del port**, no una decisión de diseño.

**La ficha tenía razón y el código se le había apartado** — al revés de §13.6/§13.7, donde lo que estaba
mal era la ficha. Las filas de §4 (FLD-331), §5, §7 (RUL-000-01) y §9 ya decían lo correcto desde 1.0:
*"`zds-select` (CAT-ADMISION) visible solo si rol = Defensor (`'4'`); oculto y fijo en "No aplica"
(código 9) en los demás roles"*, con las mismas palabras que el anexo (`03_Campos.md:113` y
`05_Reglas.md:15`). React lo pinta (`SeccionDetalleQueja.tsx`, `blnIsDefender`).

Lo que se portó fue **la mitad invisible**: `sembrarAdmision()` ya respetaba el rol —no sembraba el `'9'`
cuando el radicador era el Defensor, justamente para no pisarle su respuesta— pero el `zds-select` que le
daba de dónde responder nunca se escribió. El efecto quedaba cuidando un valor que nadie podía elegir. Y
la cabecera de la clase de S3 sellaba el hueco declarando los cuatro catálogos planos como *"variables de
back sin widget"*, que era cierto para tres.

#### Por qué el arreglo no fue una línea de plantilla

Poner el `@if` y salir habría reproducido, por tercera vez en esta pantalla, el defecto de §13.6/§13.7: un
`[obligatorio]="true"` compone el `required` del DS sobre el control, el `@if` desmonta el widget, y el
validador **sobrevive en el `FormGroup`**. Un ciudadano que pasara por el rol Defensor y siguiera a otro
rol dejaría el formulario inenviable sin un solo campo en rojo, porque `scrollToFirstError()` busca un
`field-qd_strAdmission` que ya no está en el DOM. Así que el widget llegó con el tratamiento completo:

| Pieza | Dónde | Qué hace |
|---|---|---|
| `blnEsDefensor` | `seccion-detalle-queja.ts` | `computed()` del rol contra `'4'` — lo leen la plantilla y los dos efectos |
| `@if (blnEsDefensor())` | `seccion-detalle-queja.html` | pinta el `zds-select` a media fila (con el hueco de la segunda columna, como React) |
| `alternarValidadorAdmision()` | `seccion-detalle-queja.ts` | pone y **saca** el `required` con el rol, con guardia de cruce; `setValidators()` de la columna completa, no `removeValidators()` (que compara por identidad contra el closure compuesto del DS y no saca nada) |
| `sembrarAdmision()`, reescrito | `seccion-detalle-queja.ts` | detecta los **dos cruces** del rol: al entrar limpia el `'9'` del default, al salir lo fuerza de vuelta |

El `required` **no** se declara en el `FormGroup` de la pantalla, y el comentario de esa línea lo dice: es
del rol, no del campo.

#### ⚠ Una divergencia de paridad DELIBERADA con React (decisión del usuario, 2026-08-20)

Los dos cruces del rol no son simetría decorativa:

- **Al entrar** a Defensor se limpia el `'9'` que se había sembrado para el rol anterior. Si no, su select
  abriría con "No Aplica" ya elegido y el `required` quedaría satisfecho por el default — elegiría por
  omisión, que es justo lo que FLD-331 no quiere. Solo se limpia lo que puso el default
  (`strAdmisionSembrada`), nunca una elección propia.
- **Al salir** se fuerza `'9'` **sobre lo que el Defensor hubiera elegido**. Acá React tiene un hueco: su
  effect corta con `if (blnIsDefender || …) return` y después solo escribe si el valor difiere, así que un
  "Queja o reclamo admitida por el DCF" elegido por el Defensor sobrevive al cambio de rol y viaja al
  proceso con el campo ya **oculto** — una admisión que nadie puede ver ni corregir. Se cierra porque el
  anexo dice "fijo en No Aplica" y por decisión explícita del usuario. Es la única divergencia
  intencional de este arreglo, y va a §14.

#### Pasada de mutación de esta tanda (2026-08-20) — cinco mutaciones

Baseline: **1310 casos en 89 archivos**, verde (desde 1305).

| # | Qué se rompió | Rojo |
|---|---|---|
| **1** | `effect(() => this.alternarValidadorAdmision())` comentado | 1 caso · `⚠ el required LLEGA con el Defensor y SE VA con el rol siguiente` |
| **2** | `@if (blnEsDefensor())` → `@if (true)` en la plantilla | **13 casos**, incluido `el campo NO se monta para un rol cualquiera, y SÍ para el Defensor` |
| **3** | El forzado de salida: `&& !blnSalioDeDefensor` quitado (o sea, el comportamiento de React) | 1 caso · `⚠ salir del rol Defensor FUERZA "No aplica" sobre lo que él había elegido` |
| **4** | La limpieza de entrada quitada de `sembrarAdmision()` | 1 caso · `entrar al rol Defensor LIMPIA el "No aplica" que se había sembrado` |
| **5** | `setValidators(blnDefensor ? [required] : [])` → solo agrega, nunca saca | **VERDE la primera vez** — ver abajo |

**MUT-5 sobrevivió, y el caso que decía cubrirla estaba mal escrito.** El caso aseveraba
`hasError('required') === false` después de salir del rol Defensor — pero `sembrarAdmision()` acababa de
forzar `'9'` en ese mismo control, y **un control con valor no dispara `required` ni con el validador
puesto**. La aserción pasaba por el motivo equivocado. MUT-1 sí la había atrapado, pero por otra vía: allá
el efecto no corría nunca y fallaba la aserción *anterior*, la de que el `required` llega. O sea que el
"se va" no estaba probado por nadie.

Se agregó una tercera aserción que **vacía el control a mano** después del cruce
(`seccion-detalle-queja.spec.ts:806-812`): con el campo vacío, `hasError('required') === false` solo puede
significar que el validador se fue. Con eso MUT-5 se puso roja. Queda anotado en el propio caso, porque es
el tipo de aserción que la próxima persona borraría por parecer redundante.

#### Comprobación en el navegador (2026-08-20)

Bajo jsdom los `lib-*-z` no hacen upgrade, así que el `required` del DS —el que de verdad se apila— no
existe en el spec. Se midió en la pantalla como Web Entry
(`?screen=COL_QD_SCR-000_CrearRecibirQueja&case_id=&task_id=`), con tipo de solicitud = Queja (`'3'`),
moviendo `qd_strFilerRole` y leyendo el control con `window.ng.getComponent(...)`:

```
{"paso": "tipo=Queja, sin rol",   "valor": "",  "montado": false, "errores": null,                                      "invalido": false}
{"paso": "rol=3 (no Defensor)",   "valor": "9", "montado": false, "errores": null,                                      "invalido": false}
{"paso": "rol=4 (DEFENSOR)",      "valor": "",  "montado": true,  "errores": {"required": true, "errorRequired": true}, "invalido": true}
{"paso": "Defensor elige '1'",    "valor": "1", "montado": true,  "errores": null,                                      "invalido": false}
{"paso": "salió a rol=1",         "valor": "9", "montado": false, "errores": null,                                      "invalido": false}
{"paso": "oculto y vaciado",      "valor": "9", "montado": false, "errores": null,                                      "invalido": false}
```

Cuatro cosas que confirma esa medición y el spec no puede:

- **`errorRequired` junto a `required`** en el paso del Defensor: es el validador del DS apilándose sobre el
  nuestro, exactamente lo que §13.7 describe. Confirma que la elección de `setValidators()` de la columna
  completa era la correcta y no una precaución teórica.
- **El `'1'` del Defensor se fuerza a `'9'` al salir** — la divergencia deliberada, en el DOM real.
- **El `required` viejo se fue de verdad**: `errores: null` e `invalido: false` incluso vaciando el control
  oculto a mano. Es la mitad que MUT-5 destapó, medida donde el validador del vendor sí existe. (El vaciado
  lo vuelve a sembrar en `'9'` acto seguido, que es lo correcto.)
- El `zds-select` mide **489×48 px** con la etiqueta "Admisión" visible en un barrido que atraviesa los
  shadow roots: media fila, con el hueco de la segunda columna como en React.

**El catálogo real (colección 21) trae `1` "Queja o reclamo inadmitida y/o rechazada por el DCF", `2`
"Queja o reclamo admitida por el DCF" y `9` "No Aplica".** O sea que la vía del **código** `'9'` es la que
dispara contra los datos de producción, y el respaldo `/no aplica/i` también haría match — el orden que
documenta `sembrarAdmision()` se comprobó contra el dato, no solo contra el fixture.

El único error de consola sigue siendo el `ERR_CERT_DATE_INVALID` de `ZurichSans-Regular.ttf` en
`bpm.beesmart.ec`, ajeno a la aplicación. Ningún NG0xxx.

#### Lo que este cambio corrige de la ficha y del código

La cabecera de la clase de S3 decía *"Los cuatro son variables de back sin widget"*. Son **tres**: la
admisión sí tiene widget, y solo para un rol. Quedó reescrita, y §12 pasó a contar 13 `zds-select` en vez
de 12. Las filas de campos, validaciones, reglas y dependencias **no se tocaron**: ya estaban bien.

---

### 13.9 El argumento de la réplica quedaba pegado al checkbox: un defecto de la grilla, compartido con React (2026-08-20)

Al marcar *"¿Ya habías radicado previamente la misma queja o es una reconsideración?"* (FLD-325), el
textarea del argumento (FLD-326) aparecía **sin ningún aire** contra el texto de la pregunta.

**La causa no es de la réplica: `.form-row` no separa a sus hermanas.** El bloque es
`display: grid; gap: var(--zs-150); margin-bottom: 0`, y el `gap` de una grilla separa las celdas
**dentro** de una fila, no una fila de la siguiente. Medido en el navegador sobre S3, el `bottom` de cada
fila es exactamente el `top` de la que sigue:

| Fila | `top` | `bottom` | `margin-top` |
|---|---|---|---|
| Producto SFC + momento | 1215 | 1283 | 0px |
| (huecos de servicio/placa) | 1283 | 1283 | 0px |
| Motivo SFC | 1283 | 1351 | 0px |
| Detalle de la queja | 1351 | 1517 | 0px |
| Checkbox de réplica | 1517 | **1541** | 0px |

En las filas de inputs no se ve porque el control del DS trae su propio padding vertical. La fila del
checkbox mide **24px** de alto (1517→1541): es la única que no aporta relleno, así que es la única donde
el defecto queda a la vista.

**Se corrige con una clase de la fila que aparece, no tocando `.form-row`.** `.form-row` la usan las ~11
pantallas de los dos frontends y su propio bloque cita el requisito de paridad, así que un
`margin-bottom` global movería el espaciado de todas. Va entonces
`.form-row.row-tras-checkbox { margin-top: var(--zs-100) }` al final de `shared.css` — el mismo recurso y
el mismo token que ya usan `.pqr-toggle-row` y `.section-spacer`. Verificado en el navegador:
`marginTop: 16px`, hueco **0px → 16px**.

**⚠ React tiene el defecto IGUAL**, mismo markup (`SeccionDetalleQueja.tsx`) y misma hoja
(`shared.css`, el bloque es byte-idéntico). **No es una divergencia del port**, así que la paridad no da
la respuesta acá: la decisión es criterio visual, y queda como divergencia deliberada a favor de Angular
(ver §14).

**El test asevera la clase, no los 16px.** `getBoundingClientRect()` devuelve 0 para todo bajo jsdom, así
que el hueco real **no es observable** en el spec — lo que sí se puede romper en silencio editando la
plantilla es que la clase llegue al `div`, y eso es lo que cubre el caso nuevo de `las tres ramas
condicionales`. La mutación (quitar `row-tras-checkbox` del markup) lo pone rojo nombrándolo; los 16px
se midieron en el navegador y quedan en la tabla de arriba.

---

## 14. A reportar al negocio

**⚠ Primero, lo único de esta ficha que SÍ se cambió: los supuestos de la bifurcación por tipo
(2026-08-19, §13.6).** Los cuatro cambios se implementaron según la lectura literal del pedido, y esa
lectura dejó cuatro decisiones tomadas por defecto que conviene confirmar:

- **El detalle de la solicitud no tiene mínimo de 50 caracteres**, solo el tope de 2000. El piso de 50 es
  un requisito de la SFC sobre el relato de una **queja** (RUL-000-06), y extenderlo a una felicitación o
  a una sugerencia no se pidió. Si negocio quiere un mínimo ahí, es una línea en
  `CLL_VALIDADORES_DETALLE`.
- **Al abrir la pantalla, sin tipo elegido, se ve *"Detalle de la Solicitud"*.** Es la consecuencia de
  *"solo si está escogido queja"*. La alternativa —no mostrar ninguna de las dos hasta que haya tipo— es
  igual de defendible y cambia la primera impresión de una pantalla pública.
- **Los campos de queja ya tipeados no se limpian al cambiar a solicitud**, y por lo tanto viajan al
  proceso 36 como `os_strSfcProduct`/`os_strSfcReason` con el valor que quedó. No estorban (el script 101
  tolera cadenas vacías y el 36 no los usa en su flujo), pero si negocio prefiere que el caso de Otras
  Solicitudes llegue limpio, hay que decidir **si se descartan** al cruzar de rama.
- **El proceso 36 recibe el juego COMPLETO de variables espejado a `os_*`**, no un subconjunto: el
  consumidor financiero, la autorización de datos, el correo adicional, el `os_strSfcCode`, todo. Es lo
  que hace que el renombre sea mecánico y auditable; si el 36 espera menos, ignora lo que le sobra.

Del lado técnico no queda pendiente: la pasada de mutación de esta tanda son **siete mutaciones rojas**
y `npm run verify` está verde (§13.6). Lo único que no pudo correr es `graphify update .` — la
herramienta no está instalada en esta máquina.

**⚠ Segundo, la única divergencia DELIBERADA con React que introdujo la tanda de fixes (2026-08-20,
§13.8).** Al salir del rol Defensor del Consumidor, la admisión se **fuerza** a "No Aplica" (`'9'`) aunque
el Defensor hubiera elegido otra cosa. React deja el valor: un "Queja o reclamo admitida por el DCF"
elegido por el Defensor sobrevive al cambio de rol y viaja al proceso con el campo ya **oculto**, donde
nadie puede verlo ni corregirlo. Se cerró porque FLD-331 dice "fijo en No Aplica" y por decisión del
usuario. **A confirmar con negocio:** si un caso llega a cambiar de radicador *después* de que el Defensor
dictaminó, esta pantalla descarta el dictamen — y es probable que ese escenario no exista (el radicador se
elige al abrir el caso), pero conviene decirlo en voz alta. Si negocio prefiere conservarlo, es la
condición `!blnSalioDeDefensor` de `sembrarAdmision()`, con su caso de test.

**⚠ Tercero, un defecto visual que React también tiene y que acá SÍ se corrigió (§13.9).** El argumento de
la réplica quedaba pegado al checkbox porque `.form-row` no separa a sus hermanas — es de la hoja
compartida, no del port. Angular quedó con `+16px` en esa fila y React sin ellos, así que las dos
pantallas ya **no se ven idénticas en ese punto**. Es la corrección de un defecto, no deriva; si se
quisiera paridad estricta, la misma clase va a `frontend/src/shared.css` y al `div` de
`SeccionDetalleQueja.tsx`. **Vale revisarlo con negocio/diseño para las demás pantallas:** el hueco de 0px
entre filas está en las ~11 que usan `.form-row`, y solo se nota donde arriba hay un control bajo.

El resto de la sección: ordenado por prioridad, y **nada de eso se cambió en el port.**

1. **🔴 `qd_strProductDetail` (FLD-324) viaja VACÍO a PM4, hoy y en React producción** (§13.3). El
   desajuste `qd_strProductFilter` vs `dependsOn: 'qd_strLegacyInsurance'` no "omite el filtro": el
   gate de `CollectionService.cargar()` **cancela la petición**, así que el catálogo 40 no llega nunca
   y no hay de dónde sembrar el detalle. Medido en jsdom y contra el backend real. **Decisión
   requerida:** ¿se alinean los tokens (y entonces el proceso empieza a recibir un dato que nunca
   recibió), o se retira FLD-324 del contrato? Hay un `it()` que asevera el comportamiento actual.
2. **🟠 RUL-000-13 / MSG-000-07 no están implementados** (§5). El número de identificación lleva solo
   `required`: no hay patrón, ni genérico ni por tipo de documento, y por eso la entrada
   `qd_strIdNumber` de `DIC_MSG_PATRON` es código **inalcanzable**. La ficha 1.0 declaraba un patrón
   `5–15` alfanumérico que el código no tiene. **Decisión requerida:** hace falta la matriz de formatos
   por tipo (RC/TI/CC/CE/PA/PPT/NIT).
3. **🟠 La ficha 1.0 no coincidía con su propio código React en siete puntos**, todos corregidos acá:
   colección de `qd_strRequestType` (43 → **18**); la línea de solo lectura de número de caso/fecha/hora
   en S1 (**ya no existe**, y no puede existir); `qd_strRequestType` "movido a S3" (**está en S1**);
   `qd_strFraudRelated` implementado y **ausente** de la ficha; el captcha como checkbox (**es
   reCAPTCHA v2 real con verify server-side**); el patrón de identificación (**no existe**); y el
   mensaje de éxito propio (**es el modal resumen MSG-000-08 con número de caso**).
4. **🟠 El punto de recepción no es fijo** (§10.3). La ficha 1.0 dice "siempre 2. Virtual"; es un select
   editable con **Internet** por defecto que oculta tres códigos del catálogo (2/6/99). Confirmar que
   ofrecer los cinco puntos restantes al ciudadano es lo que negocio quiere.
5. **🟡 Un defecto de clase, no de esta pantalla: código correcto que no se ejecuta** (§13.2). Cinco
   reglas de S1 estuvieron escritas y sin registrar, invisibles para `tsc`, el lint, `ng build` y 26
   casos verdes. Se destapó **visualmente**. **Recomendación:** revisar las otras diez pantallas
   portadas buscando métodos privados sin call site — ningún gate automático los reporta.
6. **🟡 Límites del DS que esta pantalla golpea más fuerte que ninguna:**
   - **`zds-select` no tiene `withSearch`**, y acá hay **doce** selects, varios de catálogos largos
     (tipo de documento, departamento, municipio, producto SFC, momento, servicio, motivo). Es el peor
     caso del proyecto. Ya reportado en SCR-013 y SCR-0051.
   - **`lib-textarea-z` no tiene `placeholder`** (§13.4). Nuevo.
   - **`lib-navigation-z` no expone ningún slot de contenido** y reenvía 3 de los 8 inputs de
     `za-navigation`: inservible para una barra con logo (§13.4).
   - **`lib-stage-banner-z` tipa `content: string`** (no admite markup) y su `category` **default es el
     literal visible `'Category Header'`** (§13.4).
   - **`lib-footer-z` (`FooterZ`) está vacía.**
   - **`lib-button-z`** no tiene `size` (va encadenado en `type`), su `disabled` default es `true`, y
     **no emite submit nativo**.
   - **`DocSupportUploader` hardcodea** las extensiones, el tope de 5 MB y el literal de MSG-000-06 de
     esta pantalla: cualquier otra que lo use hereda las reglas de SCR-000.
   - **`TaskService.iniciarProceso()` no puede servir a una Web Entry** cuya URL no trae
     `process_id`/`event_id` (§13.1).
7. **🟢 Detalles de contrato con PM4 que conviene tener por escrito:**
   - La llamada al script de similares **no debe incluir** una clave `_request`.
   - `SCR000_DEFAULTS` **no declara `qd_strMarking`** aunque `radicar()` lo derive.
   - `campo-base.ts` documenta `obligatorio` de un modo que **no coincide** con el comportamiento
     medido de `zds-input`/`zds-select`; afecta a todas las pantallas, no solo a esta.

---

*Elaborado por BeePM — Beesmartec | Para: Zurich Seguros Colombia | Confidencial | Agosto 2026*
