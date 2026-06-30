# Documentación Funcional — Pantalla `COL_QD_SCR-000_CrearRecibirQueja`

**Pantalla (insumo):** SCR-000 · PAN-01.2 — Formulario de Radicación PQRS (Autoservicio)
**Tarea BPMN:** P01-T00 — Radicar PQRS por autoservicio (portal público)
**Proceso:** P01 — Gestión de Quejas Directas (ACZ-QD-001)
**Rol responsable:** Consumidor Financiero (Cliente / Intermediario / Empleado Zurich / Defensor del Consumidor)
**Versión del diseño:** TO-BE v3.0
**Archivos de implementación:** `CrearRecibirQueja.tsx`, `SeccionConsumidor.tsx`, `SeccionDetalleQueja.tsx`, `variables.ts`, `errorHelper.ts`

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
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx` | `SCR-000` | **Fuente principal.** Historia de usuario, 42 campos (FLD-300…FLD-341), acciones (ACT-000-*) y reglas críticas (RUL-000-*). |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx` | `01_Pantallas` | Inventario maestro: fila SCR-000 / PAN-01.2 → P01-T00. |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx` | `02_Secciones` | SEC-041 a SEC-046 de SCR-000, orden y condición de visibilidad. |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx` | `04_Acciones` | Botones ACT-000-01/02/03 (Enviar PQRS, Limpiar, Cancelar). |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx` | `05_Reglas` | Reglas RUL-000-01…13. **Fuente principal de validaciones y dependencias.** |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx` | `06_Mensajes` | Mensajes MSG-000-01…08. **Fuente principal de mensajes.** |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx` | `07_Catalogs` | Catálogos CAT-ROL-RADICADOR, CAT-TIPO-SOLIC-PQRS, CAT-TIPO-ID, CAT-PAIS, CAT-DPTO, CAT-MPIO, CAT-PRODUCTO-SFC, CAT-MOTIVO-SFC, CAT-COND-ESP, CAT-ADMISION, etc. |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx` | `08_Permisos` | SCR-000: Consumidor Financiero radica; Gestor CX recibe (VER). |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx` | `10_Trazabilidad_BPMN` | SCR-000 → P01-T00, compuerta `¿Autorización aceptada y captcha válido?`, datos in/out. |
| `Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx` | `1. Tareas` / `2. Directrices` / `5. Documentos` | Directrices de registro (canal único, correo obligatorio); documento de entrada del formulario. (No existe fila dedicada a P01-T00; se referencia el contexto de P01-T01.) |
| `Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx` | `05_Variables_Entrada` | Variables de las tareas automatizadas posteriores (P01-T02 en adelante). P01-T00 no tiene fila por ser tarea de formulario front. |

Catálogos implementados como **colecciones dinámicas PM4** (no listas estáticas), definidos en `core/collections.ts` (`GLOBAL_COLLECTIONS`):

| Catálogo (insumo) | Colección PM4 (id) | Campo |
|---|---|---|
| CAT-TIPO-SOLIC-PQRS | `qd_tipoSolicitud` (43) | `qd_tipoSolicitud` |
| CAT-ROL-RADICADOR | `qd_rol` (39) | `qd_rol` |
| CAT-TIPO-ID | `qd_tipoIdentificacion` (11) | `qd_tipoIdentificacion` |
| CAT-PAIS | `qd_pais` (13) | `qd_pais` |
| CAT-DPTO | `qd_departamento` (14) | `qd_departamento` |
| CAT-MPIO | `qd_ciudad` (15, depende de `qd_departamento`) | `qd_ciudad` |
| CAT-COND-ESP | `qd_condicionEspecial` (24) | `qd_condicionEspecial` |
| CAT-PRODUCTO-SFC | `qd_seguro` (16) | `qd_seguro` |
| CAT-MOTIVO-SFC | `qd_motivo` (17) | `qd_motivo` |
| CAT-ADMISION | `qd_admision` (21) | `qd_admision` |

---

## Campos Implementados

**S1 — Tipo de Solicitud y Rol** (`CrearRecibirQueja.tsx`):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Número de Caso (ID BPM) | `qd_numeroCaso` | Texto, solo lectura | No | Anexo02 > SCR-000 > FLD-300 (fila 16) |
| Fecha y Hora de Creación | `qd_fechaHoraCreacion` | Texto, solo lectura | No | Anexo02 > SCR-000 > FLD-301 (fila 17) |
| ¿A qué está asociado tu comentario? | `qd_tipoSolicitud` | Select (CAT-TIPO-SOLIC-PQRS) | Sí | Anexo02 > SCR-000 > FLD-302 (fila 18) |
| Selecciona tu rol | `qd_rol` | Select (CAT-ROL-RADICADOR) | Sí | Anexo02 > SCR-000 > FLD-303 (fila 19) — "Determina instancia y punto de recepción" |
| Punto de Recepción | `qd_puntoRecepcion` | Texto, solo lectura (back) | Sí | Anexo02 > SCR-000 > FLD-304 (fila 20) |
| Instancia de Recepción | `qd_instanciaRecepcion` | Texto, solo lectura (computado de rol) | Sí | Anexo02 > SCR-000 > FLD-305 (fila 21) |

**S2 — Datos del Consumidor Financiero** (`SeccionConsumidor.tsx`):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Tipo de identificación | `qd_tipoIdentificacion` | Select (CAT-TIPO-ID) con búsqueda | Sí | Anexo02 > SCR-000 > FLD-306 (fila 22) |
| Número de identificación | `qd_numeroIdentificacion` | Texto (alfanumérico 5–15) | Sí | Anexo02 > SCR-000 > FLD-307 (fila 23) |
| ¿Cuáles son tus nombres? | `qd_nombres` | Texto, solo letras | Sí (si Natural) | Anexo02 > SCR-000 > FLD-308 (fila 24) |
| ¿Cuáles son tus apellidos? | `qd_apellidos` | Texto, solo letras | Sí (si Natural) | Anexo02 > SCR-000 > FLD-309 (fila 25) |
| Razón social | `qd_razonSocial` | Texto | Sí (si Jurídica/NIT) | Anexo02 > SCR-000 > FLD-310 (fila 26) |
| Nombres persona de contacto | `qd_contactoNombres` | Texto, solo letras | Sí (si Jurídica) | Anexo02 > SCR-000 > FLD-311 (fila 27) |
| Apellidos persona de contacto | `qd_contactoApellidos` | Texto, solo letras | Sí (si Jurídica) | Anexo02 > SCR-000 > FLD-312 (fila 28) |
| Celular | `qd_celular` | Tel (10 dígitos) | Sí | Anexo02 > SCR-000 > FLD-313 (fila 29) |
| Correo electrónico | `qd_correoElectronico` | Email | Sí | Anexo02 > SCR-000 > FLD-314 (fila 30) |
| Tipo de persona | `qd_tipoPersona` | Texto, solo lectura (computado) | Sí | Anexo02 > SCR-000 > FLD-315 (fila 31) |
| País | `qd_pais` | Select (CAT-PAIS), default `170` | Sí | Anexo02 > SCR-000 > FLD-316 (fila 32) |
| Departamento | `qd_departamento` | Select (CAT-DPTO) con búsqueda | Sí | Anexo02 > SCR-000 > FLD-317 (fila 33) |
| Ciudad | `qd_ciudad` | Select (CAT-MPIO), dependiente | Sí | Anexo02 > SCR-000 > FLD-318 (fila 34) |
| Dirección | `qd_direccion` | Texto, solo lectura (back) | Sí | Anexo02 > SCR-000 > FLD-319 (fila 35) — "default vacío, pendiente API SFC" |
| Sexo | `qd_sexo` | Texto, solo lectura (back) | Sí | Anexo02 > SCR-000 > FLD-320 (fila 36) — default "No aplica" |
| LGBTIQ+ | `qd_lgbtiq` | Texto, solo lectura (back) | Sí | Anexo02 > SCR-000 > FLD-321 (fila 37) — catálogo pendiente TI |
| Condición especial | `qd_condicionEspecial` | Select (CAT-COND-ESP) | Sí | Anexo02 > SCR-000 > FLD-322 (fila 38) |

**S3 — Detalle de la Queja** (`SeccionDetalleQueja.tsx`):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Selecciona el seguro | `qd_seguro` | Select (CAT-PRODUCTO-SFC) con búsqueda | Sí | Anexo02 > SCR-000 > FLD-323 (fila 39) |
| Detalle del producto | `qd_detalleProducto` | Texto, solo lectura (back) | Sí | Anexo02 > SCR-000 > FLD-324 (fila 40) |
| ¿Ya habías radicado / es reconsideración? | `qd_replica` | Radio Sí/No | Sí | Anexo02 > SCR-000 > FLD-325 (fila 41) — Réplica SFC |
| Argumento de la réplica | `qd_argumentoReplica` | Textarea (máx 2000) | No (visible si réplica=Sí) | Anexo02 > SCR-000 > FLD-326 (fila 42) |
| Escalamiento al Defensor del Consumidor | `qd_escalamientoDefensor` | Texto, solo lectura (computado) | Sí | Anexo02 > SCR-000 > FLD-327 (fila 43) |
| Cuéntanos el motivo | `qd_motivo` | Select (CAT-MOTIVO-SFC) con búsqueda | Sí | Anexo02 > SCR-000 > FLD-328 (fila 44) — "crítico: condiciona fraude en M3" |
| Ingresa el detalle | `qd_detalle` | Textarea (50–2000) | Sí | Anexo02 > SCR-000 > FLD-329 (fila 45) |
| Ingresa archivos adjuntos | `qd_adjunto_01…05` | Upload multi (máx 5) | Sí | Anexo02 > SCR-000 > FLD-330 (fila 46) — "pdf, jpg, png, docx. Máx 5 MB" |
| Admisión | `qd_admision` | Select (si Defensor) / solo lectura | Sí | Anexo02 > SCR-000 > FLD-331 (fila 47) |
| Ente de control | `qd_enteControl` | Texto, solo lectura (back), default "Otros" | Sí | Anexo02 > SCR-000 > FLD-332 (fila 48) |
| Tutela | `qd_tutela` | Texto, solo lectura (back), default "No" | Sí | Anexo02 > SCR-000 > FLD-333 (fila 49) |
| Queja Exprés | `qd_quejaExpres` | Texto, solo lectura (back), default "No" | Sí | Anexo02 > SCR-000 > FLD-334 (fila 50) |

**S4 — Autorización y Envío** (`CrearRecibirQueja.tsx`):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Autorización de tratamiento de datos | `qd_autorizacionDatos` | Checkbox | Sí | Anexo02 > SCR-000 > FLD-335 (fila 51) |
| Captcha (validación de seguridad) | `qd_captcha` | Checkbox (placeholder de captcha) | Sí | Anexo02 > SCR-000 > FLD-336 (fila 52) |
| ¿Enviar copia de la respuesta a otro correo? | `qd_correoCopia` | Email | No | Anexo02 > SCR-000 > FLD-337 (fila 53) |

**S5 — Estado ante la SFC** y **S6 — Responsable Asignado** (post-radicación, solo lectura, render condicional):

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Estado SmartSupervision | `qd_estadoSmartSupervision` | Semáforo (`ZdsStatusBadge`) | No | Anexo02 > SCR-000 > FLD-338 (fila 54) |
| Fecha y hora radicación SFC | `qd_fechaRadicacionSFC` | Texto, solo lectura | No | Anexo02 > SCR-000 > FLD-339 (fila 55) |
| Rol (Grupo) | `qd_rolGrupo` | Texto, solo lectura | No | Anexo02 > SCR-000 > FLD-340 (fila 56) |
| Responsable | `qd_responsable` | Texto, solo lectura | No | Anexo02 > SCR-000 > FLD-341 (fila 57) |

---

## Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Celular = exactamente 10 dígitos | `pattern` `/^\d{10}$/` en `qd_celular` | Anexo02 > 05_Reglas > **RUL-000-04** (fila 39) → MSG-000-01 |
| Correo con formato válido | `pattern` `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` en `qd_correoElectronico` | Anexo02 > 05_Reglas > **RUL-000-05** (fila 40) → MSG-000-02 |
| Detalle 50–2000 caracteres | `minLength 50` + `maxLength 2000` en `qd_detalle` | Anexo02 > 05_Reglas > **RUL-000-06** (fila 41) → MSG-000-03 |
| Autorización de datos obligatoria | Botón Enviar deshabilitado (`puedeEnviar`) + alerta si submit sin marcar | Anexo02 > 05_Reglas > **RUL-000-07** (fila 42) → MSG-000-04 |
| Captcha obligatorio | Botón Enviar deshabilitado (`puedeEnviar`) + alerta si submit sin marcar | Anexo02 > 05_Reglas > **RUL-000-08** (fila 43) → MSG-000-05 |
| Número de identificación según tipo doc | `pattern` `/^[A-Za-z0-9]{5,15}$/` en `qd_numeroIdentificacion` | Anexo02 > 05_Reglas > **RUL-000-13** (fila 43) → MSG-000-07 |
| Nombres/Apellidos solo letras | `pattern` `/^[A-Za-zÀ-ÿ\s]+$/` en nombres, apellidos y contacto | Anexo02 > SCR-000 FLD-308/309/311/312 ("Solo letras") |
| Correo de copia (opcional) con formato | `pattern` de email en `qd_correoCopia` (sin `required`) | Anexo02 > SCR-000 > FLD-337 (fila 53) |
| Campos obligatorios restantes | `required` en selects/radios obligatorios de S1–S3 | Anexo02 > SCR-000 (columna Oblig. = Sí) |
| Argumento de réplica máx. 2000 | `maxLength 2000` en `qd_argumentoReplica` | Anexo02 > SCR-000 > FLD-326 (fila 42) |
> **Comportamiento de visualización de errores (UX):** Se utiliza la opción `mode: 'onTouched'` de React Hook Form nativa. Esto evita marcar en rojo campos vacíos que el usuario aún no ha enfocado y desenfocado, y recién empieza a validar conforme interactúa con ellos o cuando intenta enviar el formulario.

---

## Mensajes de Error

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| "Debe contener exactamente 10 dígitos (MSG-000-01)" | Celular ≠ 10 dígitos | Mensaje del `pattern` de `qd_celular` | Anexo02 > 06_Mensajes > **MSG-000-01** (fila 51) |
| "Formato esperado: usuario@dominio.com (MSG-000-02)" | Correo inválido | Mensaje del `pattern` de `qd_correoElectronico` | Anexo02 > 06_Mensajes > **MSG-000-02** (fila 52) |
| "Mínimo 50 / Máximo 2000 caracteres (MSG-000-03)" | Detalle fuera de rango | Mensajes de `minLength`/`maxLength` de `qd_detalle` | Anexo02 > 06_Mensajes > **MSG-000-03** (fila 53) |
| "Debe aceptar el tratamiento de datos… (MSG-000-04)" | Autorización sin marcar al enviar | `ZrAlert config="alert"` condicional | Anexo02 > 06_Mensajes > **MSG-000-04** (fila 54) |
| "Debe completar la validación de seguridad (captcha)… (MSG-000-05)" | Captcha sin marcar al enviar | `ZrAlert config="negative"` condicional | Anexo02 > 06_Mensajes > **MSG-000-05** (fila 55) |
| "Verifica el formato según el tipo de documento (MSG-000-07)" | Identificación con formato inválido | Mensaje del `pattern` de `qd_numeroIdentificacion` | Anexo02 > 06_Mensajes > **MSG-000-07** (fila 57) |
| (No implementado en frontend) "Solo se permiten archivos pdf, jpg, png o docx, máx 5 MB (MSG-000-06)" | Archivo no permitido o > 5 MB | Delegado a `DocSupportUploader` (no verificado en este código) | Anexo02 > 06_Mensajes > **MSG-000-06** (fila 56); RUL-000-11 |
| (No aplica en frontend) "Su solicitud fue radicada exitosamente. Número de caso: [ID]… (MSG-000-08)" | PQRS radicada | Pantalla muestra `ZrAlert` de éxito propio ("Tu solicitud fue radicada exitosamente…") tras enviar | Anexo02 > 06_Mensajes > **MSG-000-08** (fila 58) |

---

## Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| El rol determina instancia y punto de recepción | `useEffect` sobre `qd_rol`: Defensor → instancia "1. Defensor del Consumidor Financiero", resto → "2. Entidad vigilada"; punto siempre "2. Virtual" | Anexo02 > 05_Reglas > **RUL-000-01** (fila 36); SCR-000 FLD-303/304/305 |
| Tipo de documento define el tipo de persona | `esJuridica = tipoIdentificacion === 'NIT'`; `useEffect` fija `qd_tipoPersona` = Jurídica/Natural | Anexo02 > 05_Reglas > **RUL-000-02 / RUL-000-03** (filas 37–38); FLD-315 |
| País precargado a Colombia (`170`) | `DEFAULTS.qd_pais = '170'` | Anexo02 > 05_Reglas > **RUL-000-10** (fila 40); FLD-316 |
| El correo es el destino de la respuesta final → obligatorio y validado | `required` + `pattern` en `qd_correoElectronico` | Anexo02 > SCR-000 FLD-314; Matrices > 2. Directrices fila 3 (P01-T01, 🟠 Control) |
| Admisión editable solo si rol = Defensor | Render condicional: `ZdsSelect` si Defensor, `ZdsInput` readonly si no; default "No aplica" | Anexo02 > 05_Reglas > RUL-000-01 (fila 36); SCR-000 FLD-331 |
| Escalamiento al Defensor computado | `useEffect`: Defensor → "Sí", resto → "No" (readonly) | Anexo02 > SCR-000 > FLD-327 (fila 43) |
| Campos regulatorios asignados por back (defaults) | `DEFAULTS`: `qd_enteControl='Otros'`, `qd_tutela='No'`, `qd_quejaExpres='No'`, `qd_sexo='No aplica'`, `qd_lgbtiq='No aplica'`, `qd_direccion=''`, `qd_admision='No aplica'` | Anexo02 > SCR-000 FLD-319/320/321/331/332/333/334 (filas 35–52) |
| Motivo SFC condiciona campos de fraude en M3 | `qd_motivo` obligatorio (la activación de fraude ocurre en SCR-009/SCR-010, fuera de esta pantalla) | Anexo02 > SCR-000 > FLD-328 (fila 44) |

---

## Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| S1–S4 siempre visibles | `FormSection` × 4 | Anexo02 > 02_Secciones SEC-041…SEC-044 (filas 45–48) — "Visible: Siempre" |
| S5 (Estado SFC) y S6 (Responsable) visibles solo tras radicación | Render condicional `tieneEstadoSFC` / `tieneResponsable` | Anexo02 > 02_Secciones SEC-045/SEC-046 (filas 49–50) — "Visible tras la radicación/asignación" |
| Campos de persona natural vs. jurídica alternados | Render condicional `esJuridica` (NIT) | Anexo02 > 05_Reglas RUL-000-02/03 (filas 37–38) |
| Ciudad deshabilitada hasta seleccionar Departamento | `disabled={!w.qd_departamento}` + placeholder dinámico | Anexo02 > 05_Reglas RUL-000-09 (fila 39); SCR-000 FLD-318 |
| Argumento de réplica visible solo si réplica = Sí | Render condicional `w.qd_replica === 'SI'` | Anexo02 > 05_Reglas RUL-000-12 (fila 42); SCR-000 FLD-326 |
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
| `qd_rol` | `qd_instanciaRecepcion`, `qd_puntoRecepcion`, `qd_admision` | Defensor → instancia "Defensor" y Admisión editable; resto → "Entidad vigilada" y Admisión "No aplica". Punto = "Virtual" | Anexo02 > 05_Reglas RUL-000-01 (fila 36); FLD-303/304/305/331 |
| `qd_rol` | `qd_escalamientoDefensor` | Defensor → "Sí"; resto → "No" | Anexo02 > SCR-000 FLD-327 (fila 43) |
| `qd_tipoIdentificacion` | `qd_tipoPersona` + bloque de campos (Natural vs. Jurídica) | NIT → Jurídica (Razón Social + contacto); resto → Natural (Nombres/Apellidos) | Anexo02 > 05_Reglas RUL-000-02/03 (filas 37–38); FLD-315 |
| `qd_departamento` | `qd_ciudad` | Al cambiar departamento se limpia la ciudad y se recarga el catálogo (colección 15, `dependsOn: qd_departamento`); ciudad deshabilitada sin departamento | Anexo02 > 05_Reglas RUL-000-09 (fila 39); FLD-317/318 |
| `qd_replica` (= Sí) | `qd_argumentoReplica` | Muestra el campo de argumento | Anexo02 > 05_Reglas RUL-000-12 (fila 42); FLD-325/326 |
| `qd_motivo` | Campos de fraude (Tipo/Modalidad/Montos) | Condiciona obligatoriedad de fraude — **efecto fuera de esta pantalla** (SCR-009/SCR-010) | Anexo02 > SCR-000 FLD-328 (fila 44) |

---

## Suposiciones Realizadas

1. **Nomenclatura SCR-000.** La carpeta y los archivos se denominan `COL_QD_SCR-000_CrearRecibirQueja` dado que el código y los IDs de campo (FLD-300…341) corresponden a **SCR-000 (PQRS Autoservicio, P01-T00)** del insumo v3.0. El encabezado de subtítulo de la pantalla muestra "SCR-000 · P01-T00", confirmando la correspondencia.

2. **Versión de insumo v3.0.** La carpeta `insumos/` fue actualizada a v3.0 (`Anexo02_..._v3_0`, `Matrices_..._v3.0`, `Anexo03_..._v2_0`). SCR-000 solo existe en v3.0; la doc se basa en esa versión.

3. **Catálogos dinámicos PM4.** A diferencia de versiones previas con listas estáticas, todos los catálogos se consumen como **colecciones PM4** vía `useCollection` (`GLOBAL_COLLECTIONS.qd_*`). Los IDs (39, 43, 11, 13, 14, 15, 16, 17, 21, 24) deben verificarse en cada instancia de PM4.

4. **Captcha representado con checkbox.** FLD-336 especifica un componente *Captcha*; el DS no provee widget de captcha, por lo que se implementó un checkbox de confirmación ("No soy un robot") con el mismo patrón visual hasta integrar el widget real. (Comentario explícito en `CrearRecibirQueja.tsx`.)

5. **Validación de archivos (RUL-000-11 / MSG-000-06) delegada.** La restricción de formato/tamaño de adjuntos se delega al componente `DocSupportUploader` (no verificada en el código de esta pantalla). Pendiente confirmar que el uploader bloquea formatos no permitidos y > 5 MB y muestra MSG-000-06.

6. **Número de identificación: patrón único 5–15 alfanumérico.** RUL-000-13 indica "según el tipo de documento" (formato diferenciado por tipo). Se implementó un patrón genérico `/^[A-Za-z0-9]{5,15}$/` sin diferenciar por tipo de documento. Pendiente la matriz de formatos por tipo (RC/TI/CC/CE/PA/PPT/NIT).

7. **Comportamiento `isSubmitted` para mostrar errores.** No definido en los insumos; decisión de UX implementada en `errorHelper.ts`.

8. **Web Entry (radicación pública).** El `onSubmit` distingue `isWebEntry` (POST a `/process_events/${WEB_ENTRY_PROCESS_ID=31}?event=${WEB_ENTRY_EVENT_ID='node_661'}`) vs. tarea normal (`completeTask`). Los IDs de proceso/evento son específicos de la instancia y no provienen del insumo funcional.

9. **Mensaje de éxito propio.** La pantalla muestra un texto de confirmación propio ("Tu solicitud fue radicada exitosamente. Recibirás una confirmación…") en lugar del literal de MSG-000-08 ("Número de caso: [ID]…"), porque en modo Web Entry el ID puede no estar disponible inmediatamente en el front.

10. **Defaults de campos de back.** Valores `DEFAULTS` (sexo, lgbtiq, admisión, ente de control, tutela, queja exprés, dirección) se precargan en el front como placeholder mientras la API SFC / TI confirma las listas; varios catálogos están marcados "Pendiente TI" en `07_Catalogs`.

11. **Banner informativo (S1).** El texto del `ZrAlert` informativo es redacción propia derivada de la historia de usuario y el criterio de aceptación de SCR-000; no es una cadena literal del insumo.

---

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
