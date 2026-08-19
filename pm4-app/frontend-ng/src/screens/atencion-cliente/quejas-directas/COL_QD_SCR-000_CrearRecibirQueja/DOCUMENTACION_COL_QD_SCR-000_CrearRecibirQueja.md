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
| Archivos de test | **cuatro** — `crear-recibir-queja.spec.ts` (28), `seccion-detalle-queja.spec.ts` (39), `seccion-consumidor.spec.ts` (27), `pqr-page.spec.ts` (5) · **99 casos en total** |

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

**Es la única de las doce pantallas del port que se publica como página web (Web Entry) en vez de
embeberse como tarea de PM4, y la única que CREA el caso.** De ahí sus tres rasgos estructurales, que
condicionan todo el diseño del componente (§13.1):

1. Dos modos de envío en el mismo componente: Web Entry (`POST /process_events/31?event=node_661`) o
   tarea normal (`completarTarea`), según quién la abra.
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
| Instancia de recepción | `qd_strReceptionInstance` | `zds-select` (CAT-INSTANCIA, id 19) **deshabilitado**: la asigna la RUL-000-01 según el rol | Sí | Anexo02 > SCR-000 > FLD-305 (fila 21) |
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

**S3 — Detalle de la Queja** (`seccion-detalle-queja.html`):

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
| Autorización de datos obligatoria | Gate `blnPuedeEnviar` (botón deshabilitado) + `za-alert config="alert"` al intentar enviar | **RUL-000-07** → MSG-000-04 |
| Captcha obligatorio | Gate `blnPuedeEnviar` (exige token) + `za-alert config="negative"` | **RUL-000-08** → MSG-000-05 |
| Nombres/Apellidos solo letras | `pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/)` en los cuatro campos de nombre | Anexo02 > FLD-308/309/311/312 |
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

---

## 11. Cobertura de Trazabilidad

| Elemento | Cobertura | Observación |
|---|---|---|
| Campos documentados | 100% | 42/42 (FLD-300…FLD-341) trazados, **+1 no documentado en la 1.0** (`qd_strFraudRelated`). |
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
| Selects de colección | `zds-select` (×12) | Fachada + `CatalogosService` |
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
decide la rama: Web Entry → `POST /process_events/31?event=node_661` (crea el caso); tarea normal →
`completarTarea()` (avanza el que ya existe).

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

**El orden del flujo de envío es contrato:** submit → captcha presente → script 70 (similares) →
[modal si hay coincidencias] → `verify` server-side → envío. Si el script 70 falla se **radica igual**;
si el `verify` falla **no** se radica.

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
| `crear-recibir-queja.spec.ts` | **28** | Los 10 de React + los 5 de las derivaciones de S1 (§13.2) + los dos modos de envío + la cadena similitud→captcha→envío + `(expirado)` |
| `seccion-detalle-queja.spec.ts` | **39** | La cascada de 4 niveles, los 5 derivados del motivo, los 4 defaults por etiqueta, la placa, la réplica, el switch de anexos, `contarGets(40) === 0` |
| `seccion-consumidor.spec.ts` | **27** | Natural vs. Jurídica, RUL-000-09 (incluida la precarga), el bloqueo del municipio, el país fijo |
| `pqr-page.spec.ts` | **5** | Las tres divergencias del chrome (§13.4): el logo, el `category=""`, los tokens por `customStr` |

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

---

## 14. A reportar al negocio

Ordenado por prioridad. **Nada de esto se cambió en el port.**

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
