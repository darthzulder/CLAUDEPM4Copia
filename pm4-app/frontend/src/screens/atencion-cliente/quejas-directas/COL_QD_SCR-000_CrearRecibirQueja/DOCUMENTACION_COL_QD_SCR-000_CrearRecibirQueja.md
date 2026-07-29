# Documentación Funcional — Pantalla `COL_QD_SCR-000_CrearRecibirQueja`

**Pantalla (insumo):** SCR-000 · PAN-01.2 — Formulario de Radicación PQRS (Autoservicio)
**Tarea BPMN:** P01-T00 — Radicar PQRS por autoservicio (portal público)
**Proceso:** P01 — Gestión de Quejas Directas (ACZ-QD-001)
**Rol responsable:** Consumidor Financiero (Cliente / Intermediario / Empleado Zurich / Defensor del Consumidor)
**Versión del diseño:** TO-BE v3.0
**Archivos de implementación:** `CrearRecibirQueja.tsx`, `SeccionConsumidor.tsx`, `SeccionDetalleQueja.tsx`, `errorHelper.ts` (config centralizada en `fields/fields.ts`)

> ⚠️ **Nota de nomenclatura.** La carpeta y la pantalla implementada corresponden a **SCR-000 (PQRS Autoservicio / P01-T00)** del insumo v3.0 — campos FLD-300…FLD-341, reglas RUL-000-*, mensajes MSG-000-*. **No** es la SCR-001 (Crear/Recibir Queja, P01-T01, rol Gestor de Experiencia). Ver [Suposiciones realizadas](#suposiciones-realizadas).

---

## Resumen

Formulario **público de autoservicio** mediante el cual un Consumidor Financiero radica directamente su PQRS (petición, queja, reclamo, sugerencia o felicitación). Está organizado en 6 secciones: Tipo de Solicitud y Rol, Datos del Consumidor Financiero, Detalle de la Queja, Autorización y Envío, y dos secciones de solo lectura post-radicación (Estado ante la SFC y Responsable Asignado).

El usuario completa los campos obligatorios, acepta el tratamiento de datos, valida el captcha y presiona **Enviar PQRS**. El sistema asigna automáticamente la **instancia** y el **punto de recepción** según el rol, crea el caso con ID único y ejecuta **P01-T01** (recepción y registro) → **P01-T06** (validación preventiva). La pantalla puede operar como **Web Entry** (radicación pública, `POST /process_events/{id}`) o como tarea normal (`completeTask`).

---

## Archivos de Insumo Analizados

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
| `Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx` | `1. Tareas` / `2. Directrices` / `5. Documentos` | Directrices de registro (canal único, correo obligatorio); documento de entrada del formulario. (No existe fila dedicada a P01-T00; se referencia el contexto de P01-T01.) |
| `Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx` | `05_Variables_Entrada` | Variables de las tareas automatizadas posteriores (P01-T02 en adelante). P01-T00 no tiene fila por ser tarea de formulario front. |

Catálogos implementados como **colecciones dinámicas PM4** (no listas estáticas), definidos en `core/collections.ts` (`GLOBAL_COLLECTIONS`):

| Catálogo (insumo) | Colección PM4 (id) | Campo |
|---|---|---|
| CAT-TIPO-SOLIC-PQRS | `qd_strRequestType` (43) | `qd_strRequestType` |
| CAT-ROL-RADICADOR | `qd_strFilerRole` (39) | `qd_strFilerRole` |
| CAT-TIPO-ID | `qd_strIdType` (11) | `qd_strIdType` |
| CAT-PAIS | `qd_strCountryCode` (13) | `qd_strCountryCode` |
| CAT-DPTO | `qd_strDepartment` (14) | `qd_strDepartment` |
| CAT-MPIO | `qd_strCity` (15, depende de `qd_strDepartment`) | `qd_strCity` |
| CAT-COND-ESP | `qd_strSpecialCondition` (24) | `qd_strSpecialCondition` |
| CAT-PRODUCTO-SFC | `qd_strSfcProduct` (16) | `qd_strSfcProduct` |
| cat_matriz_motivos | `qd_matrizMotivos` (45, carga completa; cascada momento/servicio/motivo derivada **en cliente**) | `qd_strInteraction`, `qd_strServiceProvided`, `qd_strSfcReason`, `qd_strResponsableRole`, `qd_strOmbudsmanEscalation`, `qd_strCompensation`, `qd_strSlaAssigned` |
| CAT-MOTIVO-SFC *(legacy id 17)* | `qd_strSfcReason` (17, ya no lo usa SCR-000; sí SCR-002/0051/0052 en modo display) | `qd_strSfcReason` |
| CAT-ADMISION | `qd_strAdmission` (21) | `qd_strAdmission` |

---

## Campos Implementados

**S1 — Tipo de Solicitud y Rol** (`CrearRecibirQueja.tsx`):

> **Nota:** `qd_strBpmCaseId` (FLD-300) y `qd_fechaCreacion` (FLD-301) se retiraron del formulario:
> el caso y su timestamp los genera y captura el BPM al radicar, no el usuario en la creación.

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| ¿A qué está asociado tu comentario? | `qd_strRequestType` | Select (CAT-TIPO-SOLIC-PQRS) | Sí | Anexo02 > SCR-000 > FLD-302 (fila 18) |
| Selecciona tu rol | `qd_strFilerRole` | Select (CAT-ROL-RADICADOR) | Sí | Anexo02 > SCR-000 > FLD-303 (fila 19) — "Determina instancia y punto de recepción" |
| *(back, no visible)* | `qd_strChannel` | Texto, computado desde el punto de recepción elegido (ver regla abajo) | Sí (al radicar) | Solicitud del usuario (2026-07-22) — deja de ser seleccionable/visible; antes Select (CAT-CANAL, colección 10) |
| Punto de Recepción | `qd_strReceptionPoint` | Select (CAT-PUNTO, colección 20), default "Internet", excluye códigos 2 (Aplicación móvil), 6 (Audio respuesta) y 99 (Otros) | Sí | Anexo02 > SCR-000 > FLD-304 (fila 20) — ahora editable; exclusión de puntos a petición del usuario (2026-07-22) |
| Instancia de Recepción | `qd_strReceptionInstance` | Texto, solo lectura (computado de rol) | Sí | Anexo02 > SCR-000 > FLD-305 (fila 21) |
| Alianza | `qd_strAlliance` | Select (CAT-ALIANZA), visible solo si rol = Empleado Zurich | No | Requerimiento — colección `qd_strAlliance` (id 44) |

**S2 — Datos del Consumidor Financiero** (`SeccionConsumidor.tsx`):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Tipo de identificación | `qd_strIdType` | Select (CAT-TIPO-ID) con búsqueda | Sí | Anexo02 > SCR-000 > FLD-306 (fila 22) |
| Número de identificación | `qd_strIdNumber` | Texto (alfanumérico 5–15) | Sí | Anexo02 > SCR-000 > FLD-307 (fila 23) |
| ¿Cuáles son tus nombres? | `qd_strFirstName` | Texto, solo letras | Sí (si Natural) | Anexo02 > SCR-000 > FLD-308 (fila 24) |
| ¿Cuáles son tus apellidos? | `qd_strLastName` | Texto, solo letras | Sí (si Natural) | Anexo02 > SCR-000 > FLD-309 (fila 25) |
| Razón social | `qd_strCompanyName` | Texto | Sí (si Jurídica/NIT) | Anexo02 > SCR-000 > FLD-310 (fila 26) |
| Nombres persona de contacto | `qd_strContactFirstName` | Texto, solo letras | Sí (si Jurídica) | Anexo02 > SCR-000 > FLD-311 (fila 27) |
| Apellidos persona de contacto | `qd_strContactLastName` | Texto, solo letras | Sí (si Jurídica) | Anexo02 > SCR-000 > FLD-312 (fila 28) |
| Celular | `qd_strPhone` | Tel (10 dígitos) | Sí | Anexo02 > SCR-000 > FLD-313 (fila 29) |
| Correo electrónico | `qd_strEmail` | Email | Sí | Anexo02 > SCR-000 > FLD-314 (fila 30) |
| Tipo de persona | `qd_strPersonType` | Texto, solo lectura (computado) | Sí | Anexo02 > SCR-000 > FLD-315 (fila 31) |
| País | `qd_strCountryCode` | Select (CAT-PAIS), default `170` | Sí | Anexo02 > SCR-000 > FLD-316 (fila 32) |
| Departamento | `qd_strDepartment` | Select (CAT-DPTO) con búsqueda | Sí | Anexo02 > SCR-000 > FLD-317 (fila 33) |
| Ciudad | `qd_strCity` | Select (CAT-MPIO), dependiente | Sí | Anexo02 > SCR-000 > FLD-318 (fila 34) |
| Dirección | `qd_strAddress` | Variable de back, **oculta** (no se muestra) | — | Anexo02 > SCR-000 > FLD-319 (fila 35) — "default vacío, pendiente API SFC" |
| Sexo | `qd_strSex` | Variable de back, **oculta** (no se muestra), default "No Aplica" (CAT-SEXO, colección 23) | — | Anexo02 > SCR-000 > FLD-320 (fila 36) — corrección 2026-07-23: vuelve a oculta (editable en SCR-009) |
| LGBTIQ+ | `qd_strLgbtiq` | Variable de back, **oculta** (no se muestra), default "No" (CAT-LGBTIQ, colección 41) | — | Anexo02 > SCR-000 > FLD-321 (fila 37) — corrección 2026-07-23: vuelve a oculta (editable en SCR-009) |
| Condición especial | `qd_strSpecialCondition` | Select (CAT-COND-ESP) | Sí | Anexo02 > SCR-000 > FLD-322 (fila 38) |

**S3 — Detalle de la Queja** (`SeccionDetalleQueja.tsx`):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Selecciona el seguro | `qd_strSfcProduct` | Select (CAT-PRODUCTO-SFC) con búsqueda | Sí | Anexo02 > SCR-000 > FLD-323 (fila 39) |
| Ingrese la placa | `qd_strPlate` | Texto, visible solo si producto = "Autos" | Sí (si Autos) | Anexo02 > FormularioCreaciónPQRS #25 — "Si la pregunta 24 es = Autos" |
| Detalle del producto | `qd_strProductDetail` | Texto, solo lectura (back) | Sí | Anexo02 > SCR-000 > FLD-324 (fila 40) |
| ¿Ya habías radicado / es reconsideración? | `qd_strReply` | Radio Sí/No | Sí | Anexo02 > SCR-000 > FLD-325 (fila 41) — Réplica SFC |
| Argumento de la réplica | `qd_strReplyArgument` | Textarea (máx 2000) | No (visible si réplica=Sí) | Anexo02 > SCR-000 > FLD-326 (fila 42) |
| Escalamiento al Defensor del Consumidor | `qd_strOmbudsmanEscalation` | Texto, solo lectura (computado desde `cat_matriz_motivos.escalamientoAdministrador`) | Sí | Anexo02 > SCR-000 > FLD-327 (fila 43) |
| Selecciona el momento | `qd_strInteraction` | Select (`cat_matriz_motivos.interaccion`, cascada), deshabilitado hasta elegir seguro | Sí | Anexo02 > FormularioCreaciónPQRS #30 — "columna interaccion" |
| Selecciona el servicio | `qd_strServiceProvided` | Select (`cat_matriz_motivos.servicioPrestado`), visible solo si momento = "Asistencias" | Sí (si Asistencias) | Anexo02 > FormularioCreaciónPQRS #31 — "columna servicioPrestado" |
| Cuéntanos el motivo | `qd_strSfcReason` | Select (`cat_matriz_motivos`: value=`codigoMotivoSFC`, label=`motivoSFC`, cascada), deshabilitado hasta completar momento/servicio | Sí | Anexo02 > SCR-000 > FLD-328 (fila 44) — "crítico: condiciona fraude en M3" |
| *(back, no visible)* | `qd_strResponsableRole` | Texto, computado desde `cat_matriz_motivos.rolResponsable` | Sí (al radicar) | Solicitud del usuario (2026-07-09) — rol sugerido para ruteo BPM, distinto del `qd_strAssigneeRole` post-radicación (S6) |
| *(back, no visible)* | `qd_strCompensation` | Texto, computado desde `cat_matriz_motivos.resarcimientoAdministrador` | Sí (al radicar) | Solicitud del usuario (2026-07-09) |
| *(back, no visible)* | `qd_strSlaAssigned` | Texto, computado desde `cat_matriz_motivos.sla` | Sí (al radicar) | Solicitud del usuario (2026-07-09) — mismo campo que consumen SCR-002/008/0051 |
| Ingresa el detalle | `qd_strComplaintText` | Textarea (50–2000) | Sí | Anexo02 > SCR-000 > FLD-329 (fila 45) |
| Ingresa archivos adjuntos | `qd_strAttach01…05` | Upload multi (máx 5) | Sí | Anexo02 > SCR-000 > FLD-330 (fila 46) — "pdf, jpg, png, docx. Máx 5 MB" |
| Admisión | `qd_strAdmission` | Select (CAT-ADMISION), visible solo si rol = Defensor (código '4' de CAT-ROL-RADICADOR); oculto y fijo en "No aplica" (código 9) en los demás roles | Sí (si rol = Defensor) | Anexo02 > SCR-000 > FLD-331 (fila 47) — corregido 2026-07-09 (ver Suposiciones) |
| *(back, no visible)* | `qd_strControlEntity` | Texto, computado (back), default "Otros" | Sí | Anexo02 > SCR-000 > FLD-332 (fila 48) — sin campo visible desde 2026-07-09 |
| *(back, no visible)* | `qd_strTutela` | Texto, computado (back), default "No" | Sí | Anexo02 > SCR-000 > FLD-333 (fila 49) — sin campo visible desde 2026-07-09 |
| *(back, no visible)* | `qd_strExpressComplaint` | Texto, computado (back), default "No" | Sí | Anexo02 > SCR-000 > FLD-334 (fila 50) — sin campo visible desde 2026-07-09 |

**S4 — Autorización y Envío** (`CrearRecibirQueja.tsx`):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Autorización de tratamiento de datos | `qd_blnDataAuth` | Checkbox | Sí | Anexo02 > SCR-000 > FLD-335 (fila 51) |
| Captcha (validación de seguridad) | `qd_blnCaptcha` | Checkbox (placeholder de captcha) | Sí | Anexo02 > SCR-000 > FLD-336 (fila 52) |
| ¿Enviar copia de la respuesta a otro correo? | `qd_strCcEmail` | Email | No | Anexo02 > SCR-000 > FLD-337 (fila 53) |

**S5 — Estado ante la SFC** y **S6 — Responsable Asignado** (post-radicación, solo lectura, render condicional):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Estado SmartSupervision | `qd_strSmartSupStatus` | Semáforo (`ZdsStatusBadge`) | No | Anexo02 > SCR-000 > FLD-338 (fila 54) |
| Fecha y hora radicación SFC | `qd_strSfcFilingDate` | Texto, solo lectura | No | Anexo02 > SCR-000 > FLD-339 (fila 55) |
| Rol (Grupo) | `qd_strAssigneeRole` | Texto, solo lectura | No | Anexo02 > SCR-000 > FLD-340 (fila 56) |
| Responsable | `qd_strAssignee` | Texto, solo lectura | No | Anexo02 > SCR-000 > FLD-341 (fila 57) |

---

## Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Celular = exactamente 10 dígitos | `pattern` `/^\d{10}$/` en `qd_strPhone` | Anexo02 > 05_Reglas > **RUL-000-04** (fila 39) → MSG-000-01 |
| Correo con formato válido | `pattern` `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` en `qd_strEmail` | Anexo02 > 05_Reglas > **RUL-000-05** (fila 40) → MSG-000-02 |
| Detalle 50–2000 caracteres | `minLength 50` + `maxLength 2000` en `qd_strComplaintText` | Anexo02 > 05_Reglas > **RUL-000-06** (fila 41) → MSG-000-03 |
| Autorización de datos obligatoria | Botón Enviar deshabilitado (`puedeEnviar`) + alerta si submit sin marcar | Anexo02 > 05_Reglas > **RUL-000-07** (fila 42) → MSG-000-04 |
| Captcha obligatorio | Botón Enviar deshabilitado (`puedeEnviar`) + alerta si submit sin marcar | Anexo02 > 05_Reglas > **RUL-000-08** (fila 43) → MSG-000-05 |
| Número de identificación según tipo doc | `pattern` `/^[A-Za-z0-9]{5,15}$/` en `qd_strIdNumber` | Anexo02 > 05_Reglas > **RUL-000-13** (fila 43) → MSG-000-07 |
| Nombres/Apellidos solo letras | `pattern` `/^[A-Za-zÀ-ÿ\s]+$/` en nombres, apellidos y contacto | Anexo02 > SCR-000 FLD-308/309/311/312 ("Solo letras") |
| Correo de copia (opcional) con formato | `pattern` de email en `qd_strCcEmail` (sin `required`) | Anexo02 > SCR-000 > FLD-337 (fila 53) |
| Campos obligatorios restantes | `required` en selects/radios obligatorios de S1–S3 | Anexo02 > SCR-000 (columna Oblig. = Sí) |
| Argumento de réplica máx. 2000 | `maxLength 2000` en `qd_strReplyArgument` | Anexo02 > SCR-000 > FLD-326 (fila 42) |
> **Comportamiento de visualización de errores (UX):** Se utiliza la opción `mode: 'onTouched'` de React Hook Form nativa. Esto evita marcar en rojo campos vacíos que el usuario aún no ha enfocado y desenfocado, y recién empieza a validar conforme interactúa con ellos o cuando intenta enviar el formulario.

---

## Mensajes de Error

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| "Debe contener exactamente 10 dígitos (MSG-000-01)" | Celular ≠ 10 dígitos | Mensaje del `pattern` de `qd_strPhone` | Anexo02 > 06_Mensajes > **MSG-000-01** (fila 51) |
| "Formato esperado: usuario@dominio.com (MSG-000-02)" | Correo inválido | Mensaje del `pattern` de `qd_strEmail` | Anexo02 > 06_Mensajes > **MSG-000-02** (fila 52) |
| "Mínimo 50 / Máximo 2000 caracteres (MSG-000-03)" | Detalle fuera de rango | Mensajes de `minLength`/`maxLength` de `qd_strComplaintText` | Anexo02 > 06_Mensajes > **MSG-000-03** (fila 53) |
| "Debe aceptar el tratamiento de datos… (MSG-000-04)" | Autorización sin marcar al enviar | `ZrAlert config="alert"` condicional | Anexo02 > 06_Mensajes > **MSG-000-04** (fila 54) |
| "Debe completar la validación de seguridad (captcha)… (MSG-000-05)" | Captcha sin marcar al enviar | `ZrAlert config="negative"` condicional | Anexo02 > 06_Mensajes > **MSG-000-05** (fila 55) |
| "Verifica el formato según el tipo de documento (MSG-000-07)" | Identificación con formato inválido | Mensaje del `pattern` de `qd_strIdNumber` | Anexo02 > 06_Mensajes > **MSG-000-07** (fila 57) |
| (No implementado en frontend) "Solo se permiten archivos pdf, jpg, png o docx, máx 5 MB (MSG-000-06)" | Archivo no permitido o > 5 MB | Delegado a `DocSupportUploader` (no verificado en este código) | Anexo02 > 06_Mensajes > **MSG-000-06** (fila 56); RUL-000-11 |
| (No aplica en frontend) "Su solicitud fue radicada exitosamente. Número de caso: [ID]… (MSG-000-08)" | PQRS radicada | Pantalla muestra `ZrAlert` de éxito propio ("Tu solicitud fue radicada exitosamente…") tras enviar | Anexo02 > 06_Mensajes > **MSG-000-08** (fila 58) |

---

## Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| El rol determina instancia y punto de recepción | `useEffect` sobre `qd_strFilerRole`: Defensor → instancia "1. Defensor del Consumidor Financiero", resto → "2. Entidad vigilada"; punto siempre "2. Virtual" | Anexo02 > 05_Reglas > **RUL-000-01** (fila 36); SCR-000 FLD-303/304/305 |
| Tipo de documento define el tipo de persona | `esJuridica = tipoIdentificacion === 'NIT'`; `useEffect` fija `qd_strPersonType` = Jurídica/Natural | Anexo02 > 05_Reglas > **RUL-000-02 / RUL-000-03** (filas 37–38); FLD-315 |
| País precargado a Colombia (`170`) | `DEFAULTS.qd_strCountryCode = '170'` | Anexo02 > 05_Reglas > **RUL-000-10** (fila 40); FLD-316 |
| El correo es el destino de la respuesta final → obligatorio y validado | `required` + `pattern` en `qd_strEmail` | Anexo02 > SCR-000 FLD-314; Matrices > 2. Directrices fila 3 (P01-T01, 🟠 Control) |
| Admisión visible (select) solo si rol = Defensor (código '4'); oculta y fija en "No aplica" (código 9) en los demás roles | Render condicional en `SeccionDetalleQueja`: `ZdsSelect` si rol = Defensor; sin campo + default forzado si rol ≠ Defensor | Corregido 2026-07-09 a petición del usuario (restaura la regla original RUL-000-01, además de corregir el bug de comparación de `blnIsDefender` contra `'DEFENSOR'` en vez del código `'4'`) — Anexo02 > 05_Reglas > RUL-000-01 (fila 36); SCR-000 FLD-331 |
| Escalamiento al Defensor computado | `useEffect`: Defensor → "Sí", resto → "No" (readonly) | Anexo02 > SCR-000 > FLD-327 (fila 43) |
| Campos regulatorios asignados por back (defaults, sin campo visible), `qd_strAdmission` resuelto por rol | `qd_strControlEntity='Otros'`, `qd_strTutela='No'`, `qd_strExpressComplaint='No'`, `qd_strSex='No aplica'`, `qd_strLgbtiq='No aplica'`, `qd_strAddress=''`, `qd_strAdmission='No aplica'` (código 9) si Defensor / select manual si no | Anexo02 > SCR-000 FLD-319/320/321/331/332/333/334 (filas 35–52) |
| Motivo SFC condiciona campos de fraude en M3 | `qd_strSfcReason` obligatorio (la activación de fraude ocurre en SCR-009/SCR-010, fuera de esta pantalla) | Anexo02 > SCR-000 > FLD-328 (fila 44) |
| Canal derivado del punto de recepción (sin campo visible) | `useEffect` en `CrearRecibirQueja.tsx` (`CHANNEL_BY_RECEPTION_POINT`): punto 5 (Call center) → canal 5; puntos 1/3/7 (Internet/Correo electrónico/Redes sociales) → canal 13; punto 4 (Oficina) → canal 14. Sin regla → canal vacío (no ocurre con los puntos actualmente ofrecidos, ya que 2/6/99 están ocultos) | Solicitud del usuario (2026-07-22) |

---

## Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| S1–S4 siempre visibles | `FormSection` × 4 | Anexo02 > 02_Secciones SEC-041…SEC-044 (filas 45–48) — "Visible: Siempre" |
| S5 (Estado SFC) y S6 (Responsable) visibles solo tras radicación | Render condicional `tieneEstadoSFC` / `tieneResponsable` | Anexo02 > 02_Secciones SEC-045/SEC-046 (filas 49–50) — "Visible tras la radicación/asignación" |
| Campos de persona natural vs. jurídica alternados | Render condicional `esJuridica` (NIT) | Anexo02 > 05_Reglas RUL-000-02/03 (filas 37–38) |
| Ciudad deshabilitada hasta seleccionar Departamento | `disabled={!w.qd_strDepartment}` + placeholder dinámico | Anexo02 > 05_Reglas RUL-000-09 (fila 39); SCR-000 FLD-318 |
| Argumento de réplica visible solo si réplica = Sí | Render condicional `w.qd_strReply === 'SI'` | Anexo02 > 05_Reglas RUL-000-12 (fila 42); SCR-000 FLD-326 |
| Placa visible solo si producto = "Autos" | Render condicional `blnIsAutos` (label del seguro) + limpieza al salir de Autos | Anexo02 > FormularioCreaciónPQRS #25 |
| Servicio visible solo si momento = "Asistencias"; momento/motivo deshabilitados en cascada | Render condicional `blnIsAsistencias` + `disabled` encadenado en momento/servicio/motivo | Anexo02 > FormularioCreaciónPQRS #30/#31/#32 |
| Estado SmartSupervision como semáforo de color | `ZdsStatusBadge` + `estadoVariant()` (success/danger/info/neutral) | Anexo02 > SCR-000 FLD-338 (fila 54) — "Color tipo semáforo" |
| Botón "Enviar PQRS" (primaria) habilitado solo con autorización + captcha | `disabled={... || !puedeEnviar}` | Anexo02 > 04_Acciones > **ACT-000-01** (fila 36) — condición de habilitación |
| Botón "Limpiar Formulario" (secundaria) | `limpiarFormulario()` → `reset(DEFAULTS)` + limpia adjuntos | Anexo02 > 04_Acciones > **ACT-000-02** (fila 37) |
| Botón "Cancelar" (destructiva) | `window.history.back()` | Anexo02 > 04_Acciones > **ACT-000-03** (fila 38) |
| Pantalla de confirmación tras envío | Estado `sent` → `ZrAlert` positivo de radicación exitosa | Anexo02 > 06_Mensajes MSG-000-08 (fila 58); 10_Trazabilidad_BPMN (compuerta) |
| Adjuntos: PDF/JPG/PNG/DOCX, máx 5, 5 MB | `DocSupportUploader` con `ADJUNTO_KEYS` (5 claves), `max={5}` | Anexo02 > SCR-000 FLD-330 (fila 46); RUL-000-11 |
| Banner informativo de instrucciones | `ZrAlert config="info"` en S1 | Derivado de la historia de usuario / criterio de aceptación (ver Suposiciones) |

---

## Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strFilerRole` | `qd_strReceptionInstance`, `qd_strReceptionPoint`, `qd_strAdmission` | Defensor (código '4') → instancia "Defensor", Admisión **visible** (select manual); resto → "Entidad vigilada" y Admisión **oculta**, fija en "No aplica" (código 9). Punto = "Virtual" | Anexo02 > 05_Reglas RUL-000-01 (fila 36); FLD-303/304/305/331 — corregido 2026-07-09 |
| `qd_strInteraction` + `qd_strServiceProvided` + `qd_strSfcReason` | `qd_strResponsableRole`, `qd_strOmbudsmanEscalation`, `qd_strCompensation`, `qd_strSlaAssigned` | Al completar la cadena y elegir motivo, se toma la fila exacta de `cat_matriz_motivos` para ese motivo y se copian sus columnas `rolResponsable` / `escalamientoAdministrador` / `resarcimientoAdministrador` / `sla`; cualquier cambio aguas arriba (tipo solicitud/producto/momento/servicio) limpia las 4 variables hasta reelegir motivo | Solicitud del usuario (2026-07-09) |
| `qd_strIdType` | `qd_strPersonType` + bloque de campos (Natural vs. Jurídica) | NIT → Jurídica (Razón Social + contacto); resto → Natural (Nombres/Apellidos) | Anexo02 > 05_Reglas RUL-000-02/03 (filas 37–38); FLD-315 |
| `qd_strDepartment` | `qd_strCity` | Al cambiar departamento se limpia la ciudad y se recarga el catálogo (colección 15, `dependsOn: qd_strDepartment`); ciudad deshabilitada sin departamento | Anexo02 > 05_Reglas RUL-000-09 (fila 39); FLD-317/318 |
| `qd_strReply` (= Sí) | `qd_strReplyArgument` | Muestra el campo de argumento | Anexo02 > 05_Reglas RUL-000-12 (fila 42); FLD-325/326 |
| `qd_strSfcProduct` (= "Autos") | `qd_strPlate` | Muestra el campo de placa; fuera de Autos se oculta y limpia | Anexo02 > FormularioCreaciónPQRS #25 |
| `qd_strRequestType` + `qd_strSfcProduct` | `qd_strInteraction` | Cascada `cat_matriz_motivos` (id 45): carga los momentos (`interaccion`) filtrando por tipo de solicitud + producto; al cambiar cualquiera se limpia el momento | Anexo02 > FormularioCreaciónPQRS #30 |
| `qd_strInteraction` (= "Asistencias") | `qd_strServiceProvided` | Muestra el servicio y carga sus opciones (`servicioPrestado`) filtradas por la cadena; otros momentos lo ocultan/limpian | Anexo02 > FormularioCreaciónPQRS #31 |
| `qd_strRequestType` → `qd_strSfcProduct` → `qd_strInteraction` → `qd_strServiceProvided` | `qd_strSfcReason` | El motivo se filtra por toda la cadena (`cat_matriz_motivos.motivo`); deshabilitado hasta completar momento (y servicio si Asistencias); cambiar cualquier eslabón lo limpia | Anexo02 > FormularioCreaciónPQRS #32 |
| `qd_strSfcReason` | Campos de fraude (Tipo/Modalidad/Montos) | Condiciona obligatoriedad de fraude — **efecto fuera de esta pantalla** (SCR-009/SCR-010) | Anexo02 > SCR-000 FLD-328 (fila 44) |

---

## Suposiciones Realizadas

1. **Nomenclatura SCR-000.** La carpeta y los archivos se denominan `COL_QD_SCR-000_CrearRecibirQueja` dado que el código y los IDs de campo (FLD-300…341) corresponden a **SCR-000 (PQRS Autoservicio, P01-T00)** del insumo v3.0. El encabezado de subtítulo de la pantalla muestra "SCR-000 · P01-T00", confirmando la correspondencia.

2. **Versión de insumo v3.0.** La carpeta `insumos/` fue actualizada a v3.0 (`Anexo02_..._v3_0`, `Matrices_..._v3.0`, `Anexo03_..._v2_0`). SCR-000 solo existe en v3.0; la doc se basa en esa versión.

3. **Catálogos dinámicos PM4.** A diferencia de versiones previas con listas estáticas, todos los catálogos se consumen como **colecciones PM4** vía `useCollection` (`QD_COLLECTIONS.*` en `fields/fields.ts`, que referencia `GLOBAL_COLLECTIONS` en `core/collections.ts`). Los IDs (39, 43, 11, 13, 14, 15, 16, 17, 21, 24) deben verificarse en cada instancia de PM4.

4. **Captcha representado con checkbox.** FLD-336 especifica un componente *Captcha*; el DS no provee widget de captcha, por lo que se implementó un checkbox de confirmación ("No soy un robot") con el mismo patrón visual hasta integrar el widget real. (Comentario explícito en `CrearRecibirQueja.tsx`.)

5. **Validación de archivos (RUL-000-11 / MSG-000-06) delegada.** La restricción de formato/tamaño de adjuntos se delega al componente `DocSupportUploader` (no verificada en el código de esta pantalla). Pendiente confirmar que el uploader bloquea formatos no permitidos y > 5 MB y muestra MSG-000-06.

6. **Número de identificación: patrón único 5–15 alfanumérico.** RUL-000-13 indica "según el tipo de documento" (formato diferenciado por tipo). Se implementó un patrón genérico `/^[A-Za-z0-9]{5,15}$/` sin diferenciar por tipo de documento. Pendiente la matriz de formatos por tipo (RC/TI/CC/CE/PA/PPT/NIT).

7. **Comportamiento `isSubmitted` para mostrar errores.** No definido en los insumos; decisión de UX implementada en `errorHelper.ts`.

8. **Web Entry (radicación pública).** El `onSubmit` distingue `isWebEntry` (POST a `/process_events/${WEB_ENTRY_PROCESS_ID=31}?event=${WEB_ENTRY_EVENT_ID='node_661'}`) vs. tarea normal (`completeTask`). Los IDs de proceso/evento son específicos de la instancia y no provienen del insumo funcional.

9. **Mensaje de éxito propio.** La pantalla muestra un texto de confirmación propio ("Tu solicitud fue radicada exitosamente. Recibirás una confirmación…") en lugar del literal de MSG-000-08 ("Número de caso: [ID]…"), porque en modo Web Entry el ID puede no estar disponible inmediatamente en el front.

10. **Defaults de campos de back.** Valores `DEFAULTS` (sexo, lgbtiq, admisión, ente de control, tutela, queja exprés, dirección) se precargan en el front como placeholder mientras la API SFC / TI confirma las listas; varios catálogos están marcados "Pendiente TI" en `07_Catalogs`.

11. **Banner informativo (S1).** El texto del `ZrAlert` informativo es redacción propia derivada de la historia de usuario y el criterio de aceptación de SCR-000; no es una cadena literal del insumo.

12. **Cascada `cat_matriz_motivos` (id 45) — filtrada en cliente.** Los campos momento (`qd_strInteraction`), servicio (`qd_strServiceProvided`) y motivo (`qd_strSfcReason`) se derivan de una única colección PM4 (id **45**) con la cadena tipo de solicitud → producto → momento → servicio → motivo. **Decisión de diseño:** la matriz se carga completa (≈385 filas) y la cascada se filtra en **cliente** (`SeccionDetalleQueja`), no por PMQL, porque: (a) las columnas de filtro `tipoSolicitud`/`productoZurich` guardan el **texto** ("Queja", "Vida"), no el código que guarda el form → hay que comparar por *label*; (b) los datos traen **espacios sobrantes** ("Hogar ", "No aplica ") y variaciones de mayúsculas que romperían la igualdad exacta de PMQL. En cliente se normaliza con `trim` + minúsculas. Columnas usadas (camelCase, bajo `data.*`): `tipoSolicitud`, `productoZurich`, `interaccion`, `servicioPrestado`, `codigoMotivoSFC` (código → `qd_strSfcReason`), `motivoSFC` (descripción visible). El momento y el servicio se guardan como su texto (`interaccion`/`servicioPrestado`); el motivo guarda el **código** `codigoMotivoSFC`. Detección de "Autos" (placa) y "Asistencias" (servicio) por regex sobre el *label* (`/autos/i`, `/asistencias/i`).

---

13. **Variables de ruteo extraídas de `cat_matriz_motivos` (2026-07-09).** A petición del usuario, `qd_strResponsableRole`, `qd_strOmbudsmanEscalation`, `qd_strCompensation` y `qd_strSlaAssigned` se computan (`SeccionDetalleQueja.tsx`) desde las columnas `rolResponsable`, `escalamientoAdministrador`, `resarcimientoAdministrador` y `sla` de la fila de la matriz que corresponde al motivo elegido — nombres de columna indicados por el usuario, no verificados por Claude contra el esquema real de la colección 45 en PM4. Esto **reemplaza** la regla anterior de `qd_strOmbudsmanEscalation` (computada por rol radicador); `qd_strResponsableRole` es una variable nueva, distinta de `qd_strAssigneeRole` (S6, post-radicación). Pendiente confirmar en PM4 que la colección 45 realmente expone esas 4 columnas.

14. **Admisión (bug de comparación + campos de back sin UI, 2026-07-09).** A petición del usuario: (a) `qd_strControlEntity` (Ente de control), `qd_strTutela` y `qd_strExpressComplaint` dejan de tener campo visible en el form — se siguen calculando y enviando igual que `qd_strAddress`/`qd_strSex` (variables de back sin `Controller` montado); (b) `qd_strAdmission` vuelve a la regla original (RUL-000-01): rol = Defensor → campo **visible** (`ZdsSelect` editable, requerido); rol ≠ Defensor → campo **oculto**, fijo en "No aplica" (código 9 de CAT-ADMISION, colección `qd_admision` id 21, `value=data.codigo`) — confirmado contra el catálogo real en PM4 (`codigo="9"` → `"No Aplica"`, fallback por regex `/no aplica/i` sobre el label si el código no calza). Durante la implementación se detectó y corrigió además un bug preexistente: `blnIsDefender` comparaba `qd_strFilerRole` contra el string `'DEFENSOR'`, que nunca coincide con el código real de CAT-ROL-RADICADOR (colección `qd_rol` id 39, `value=data.codigo_rol_radicador`); ahora compara contra `'4'` (confirmado en PM4: código `4` = "Defensor del consumidor"), el mismo código que ya usaba correctamente la RUL-000-01 en `CrearRecibirQueja.tsx` para resolver instancia/punto de recepción.

15. **Canal (`qd_strChannel`) deja de ser seleccionable (2026-07-22).** A petición del usuario, el campo Canal ya no se muestra ni se selecciona manualmente: se deriva del punto de recepción elegido (`CHANNEL_BY_RECEPTION_POINT` en `CrearRecibirQueja.tsx`) — punto 5 → canal 5; puntos 1, 3, 7 → canal 13; punto 4 → canal 14. Además se ocultan del selector de Punto de Recepción los códigos 2 (Aplicación móvil), 6 (Audio respuesta) y 99 (Otros Puntos de recepción) (`RECEPTION_POINTS_HIDDEN`). Tras esa exclusión, los 5 puntos que quedan seleccionables (1, 3, 4, 5, 7) coinciden exactamente con los que tienen regla de canal definida, por lo que el canal nunca queda vacío en la práctica. Catálogo real verificado en `pm4-app/insumos/CATALOGOS v2.xlsx` (bloque `cat-punto-recepcion`, colección PM4 id 20).

16. **`qd_strSfcCode` se envía tras crear el caso (2026-07-29, corregido 2026-07-29).** A petición del usuario, se agrega el envío de `qd_strSfcCode` (FLD-120, no listado entre los 42 campos de SCR-000 pero requerido como dato de salida hacia la integración SFC): `codigo_queja = tipo_entidad(13) + entidad_cod(9) + número de queja` (caso BPM, el mismo valor que otras pantallas leen como `qd_strBpmCaseId`, ver nota de la fila FLD-300 arriba). Los componentes fijos (`13`/`9`) son los mismos que ya usa SCR-010 vía `qd_strEntityType`/`qd_strEntityCode` (Excel Cierre #46/#47); se definieron de nuevo como `SCR000_SFC_TIPO_ENTIDAD`/`SCR000_SFC_ENTIDAD_COD` + helper `buildSfcCode()` en `fields/fields.ts` porque el tercer componente (número de queja) solo existe **después** de radicar, no en el payload inicial: en Web Entry se resuelve con un `PUT /requests/{id}` de seguimiento inmediatamente después del `POST /process_events` que crea el caso; en modo tarea normal (`completeTask`), se agrega directo al payload de `completeTask`.
    **Corrección:** la primera implementación usaba el `id`/`request_id` interno del request como "número de queja", lo cual da un código distinto al correcto. PM4 expone el `id` interno y el `case_number` (número de caso/queja real) como campos **independientes** en la respuesta de `POST /process_events` (schema `processRequest`, ver `docs (4).json`); `qd_strSfcCode` debe construirse con `case_number`, no con `id`. En Web Entry ambos vienen en la misma respuesta de `process_events`. En modo tarea normal, `task.process_request_id` es el `id` interno (no el `case_number`), así que se resuelve con un `GET /requests/{id}` adicional (`fetchCaseNumber()`) antes de completar la tarea.

## Cobertura de Trazabilidad

| Elemento | Cobertura | Observación |
|---|---|---|
| Campos documentados | 100% | 42/42 campos (FLD-300…FLD-341) trazados a Anexo02 > SCR-000. |
| Validaciones documentadas | 100% | RUL-000-04/05/06/07/08/13 implementadas y trazadas; RUL-000-11 documentada como delegada/no verificada. |
| Mensajes documentados | 100% | MSG-000-01…08 trazados; los no renderizados/delegados quedan justificados. |
| Reglas de negocio documentadas | ~95% | Reglas de rol→instancia, tipo persona, dependencias y defaults cubiertas; reglas de fraude/SLA actúan en pantallas posteriores y se referencian. |
| Comportamientos de UI documentados | 100% | Secciones, visibilidad condicional, acciones y semáforo trazados a Anexo02 (02_Secciones, 04_Acciones, SCR-000). |
| Dependencias entre campos documentadas | 100% | Rol→instancia/admisión/escalamiento, tipoDoc→persona, Dpto→Ciudad, Réplica→argumento, Motivo→fraude trazadas. |

**Elementos sin fuente directa en insumos (inferidos):** discrepancia de nomenclatura de carpeta, captcha como checkbox, patrón único de identificación, comportamiento `isSubmitted`, IDs de Web Entry/colecciones, texto del banner y del mensaje de éxito — todos listados en *Suposiciones realizadas*.

---

*Elaborado por BeePM — Beesmartec | Para: Zurich Seguros Colombia | Confidencial | Junio 2026*
