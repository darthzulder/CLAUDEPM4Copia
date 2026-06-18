# Mockups TO-BE v2.0 — Gestión de Quejas Directas | Zurich Seguros Colombia

> **CRITICO:** RESTRICCIONES REGULATORIAS CRÍTICAS: RUL-010-01: fechaActualizacion DEBE ser igual a fechaCierre (PAN-10). RUL-010-04: Notificación al cliente SOLO tras HTTP 200 SmartSupervision. FLD-147: Catálogo LGBTIQ+ pendiente confirmación con TI. CE 019/2024: Campos de fraude obligatorios desde 1 julio 2025.

---
## Indice de pantallas

- **Zurich · Quejas Directas TO-BE v2.0** — Crear / Recibir Queja: Formulario de alta — Inicio del proceso _👤 Gestor de Experiencia_
- **SCR-002 · PAN-02 · P01-T07** — Corrección de Datos: Corrección preventiva de errores de validación _👤 Gestor de Experiencia_
- **SCR-003 · PAN-03 · SP1-T05** — Corrección Error Funcional M1/M2: Rechazo SmartSupervision HTTP 400 funcional _👤 Gestor de Experiencia_
- **SCR-004 · PAN-04 · SP1-T06** — Revisión Error Técnico API: Error técnico de integración escalado _🔧 Analista Técnico_
- **SCR-005 · PAN-05 · SP2-T01** — Detalle del Caso / Asignación: Revisión expediente y asignación post-radicación SFC _📋 Analista SAC_
- **SCR-006 · PAN-06 · SP2-T03** — Reasignación de Caso: Reasignación a área especializada con trazabilidad _📋 Analista SAC_
- **SCR-007 · PAN-07 · SP2-T02/T05** — Gestión Queja — Área Responsable: Análisis y elaboración de respuesta técnica _🏢 Área Responsable_
- **SCR-008 · PAN-08 · SP2-T04** — Revisión Respuesta SAC: Aprobación o devolución del borrador _📋 Analista SAC_
- **SCR-009 · PAN-09 · SP2-T07** — Formulario Superintendencia: F.1000-166 / Formato 411 | CE 039/2011 · CE 019/2024 _📋 Analista SAC_
- **SCR-010 · PAN-10 · SP3-T01/T04/T08** — Formulario Cierre M3: Cierre regulatorio Momento 3 — Validaciones en tiempo real _📋 Analista SAC_
- **SCR-011 · PAN-11 · SP4-T05** — Revisión Error Técnico Prórroga: Error técnico en envío de solicitud de prórroga _🔧 Analista Técnico_
- **SCR-012 · PAN-12 · SP4-T06** — Corrección Error Funcional Prórroga: Rechazo HTTP 400 funcional en prórroga _📋 Analista SAC / Área Responsable_

---
## Detalle de pantallas

### SCR-001 · PAN-01 — Crear / Recibir Queja
**Tarea:** P01-T01 — Recibir y registrar queja · Inicio del proceso  
**Rol:** 👤 Gestor de Experiencia

> [i] ℹ Complete todos los campos del consumidor y la queja. Al presionar Crear Queja el sistema ejecutará validación preventiva automática antes de activar la radicación ante SmartSupervision.

> [!] ⚠ Al presionar Crear Queja el sistema ejecuta automáticamente P01-T06 validación preventiva de todos los campos antes de radicar ante SmartSupervision. Si detecta errores, resalta los campos sin enviar nada.

#### 📋 Encabezado del Caso

- **Número de Caso (ID BPM)** (solo lectura) — _FLD-001 · Asignado por el BPM. No editable._
- **Canal de Recepción *** * — _FLD-002 · CAT-CANAL · Se captura solo una vez (RUL-001-05)._
  - Opciones: 5. Centro de atención telefónica / 3. Portal Web / 1. Presencial / 2. Correo electrónico / 6. Canal SFC / 7. Defensor del Consumidor Financiero / +1 mas
- **Fecha y Hora de Creación** (solo lectura) — _FLD-003 · Timestamp generado por el BPM al guardar._
#### 👤 Datos del Consumidor Financiero

- **Nombre o Razón Social *** * — _FLD-004 · Máx. 200 car. Sin caracteres no permitidos por SFC._
- **Tipo de Identificación *** * — _FLD-005 · CAT-TIPO-ID_
  - Opciones: 1. Cédula de ciudadanía / 2. Cédula de extranjería / 3. NIT / 4. Pasaporte / 5. Tarjeta de identidad
- **Número de Identificación *** * — _FLD-006 · Solo dígitos. Mín. 6, máx. 15 caracteres._
- **Correo Electrónico *** * — _FLD-007 · Formato RFC 5321. Destino del correo de respuesta final. Obligatorio (RUL-001-01)._
- **Tipo de Persona *** * — _FLD-008 · CAT-TIPO-PERSONA_
  - Opciones: 1. Natural / 2. Jurídica
- **Código País *** * — _FLD-009 · CAT-PAIS · Por defecto: 170._
  - Opciones: 170 — Colombia
- **Departamento *** * — _FLD-010 · CAT-DPTO · Carga municipios al seleccionar (RUL-001-03)._
  - Opciones: Antioquia / Atlántico / Bogotá D.C. / Bolívar / Cundinamarca / Magdalena / +3 mas
- **Municipio *** * — _FLD-011 · CAT-MPIO · Dependiente del departamento. Se limpia si cambia dpto._
#### 📁 Clasificación y Datos de la Queja

- **Asunto / Resumen *** * — _FLD-012 · Máx. 500 car. Sin caracteres especiales no permitidos por SFC (RUL-001-04)._
- **Descripción de la Queja** — _FLD-013 · Máx. 4000 caracteres. Registrar de forma clara y objetiva._
- **Producto SFC *** * — _FLD-014 · CAT-PRODUCTO-SFC · Homologado a catálogo SFC._
  - Opciones: 101. Seguro de automóviles / 102. Seguro de vida individual / 103. Seguro de hogar / 104. Seguro colectivo de vida / 109. Otros seguros generales
- **Motivo SFC *** * — _FLD-015 · CAT-MOTIVO-SFC · Campo crítico: condiciona campos de fraude en M3._
  - Opciones: 301. No pago de siniestro / 302. Demora en el pago de siniestro / 303. Terminación unilateral del contrato / 304. Cobro de prima o descuento / 305. Incumplimiento en cobertura / 399. Otro motivo
- **Tipo de Solicitud (Zurich) *** * — _FLD-016 · CAT-TIPO-SOL · Solo uso interno Zurich. No va a SFC._
  - Opciones: Queja Directa SmartSupervision / Requerimiento / Sugerencia / Felicitación / Derecho de petición
- **Instancia de Recepción *** * — _FLD-017 · CAT-INSTANCIA_
  - Opciones: 1. Defensor del Consumidor Financiero / 2. Entidad vigilada / 3. SFC
- **Punto de Recepción *** * — _FLD-018 · CAT-PUNTO_
  - Opciones: 1. Presencial / 2. Virtual / 3. Escrito / 4. Telefónico / 5. Call Center
- **Admisión *** * — _FLD-019 · CAT-ADMISION_
  - Opciones: 1. Admitida / 2. No admitida / 9. No aplica
- **Ente de Control *** * — _FLD-020 · CAT-ENTE_
  - Opciones: 1. SFC / 2. Defensor del Consumidor Financiero / 99. Otros
#### 📎 Adjuntos

- **¿Incluye Anexos a la Queja? *** * — _FLD-021 · Indicador regulatorio SFC obligatorio._
  - Valores: Sí / No
- **Archivos Adjuntos** — _FLD-022 · Opcional. Sin validación de nomenclatura en esta etapa._

**Acciones:** Cancelar | 💾 Guardar Borrador | Crear Queja ▶

---

### SCR-002 · PAN-02 — Corrección de Datos
**Tarea:** P01-T07 — Corregir datos del formulario · Validación preventiva detectó errores  
**Rol:** 👤 Gestor de Experiencia

_Contexto: 📁 Caso: CASE-2026-00342 | 📅 SLA: 12 días hábiles | 📌 Estado: En corrección preventiva | ⚡ Errores pendientes: 3_

> [X] ✗ 3 errores de validación detectados. Corrija cada campo resaltado. El botón "Guardar Correcciones" se habilitará únicamente cuando el contador de errores llegue a 0 (RUL-002-01).

> [X] ✗ FLD-007 · Correo Electrónico: Valor rechazado: "juan.perez@" — El correo no tiene formato válido (RFC 5321). Formato esperado: usuario@dominio.com

> [X] ✗ FLD-006 · Número de Identificación: Valor rechazado: "12 34 56" — Contiene espacios. Solo se aceptan dígitos sin separadores.

> [X] ✗ FLD-011 · Municipio: El municipio seleccionado no pertenece al departamento "Antioquia" (RUL-001-03). Seleccione un municipio de la lista habilitada.

> [!] ⚠ Al guardar, el sistema re-ejecutará automáticamente P01-T06 . Si quedan errores, continuará mostrando esta pantalla. El botón de envío a SmartSupervision solo se activa cuando contador = 0.

#### 🗂 Datos del Caso (solo lectura)

- **Número de Caso** (solo lectura) — _FLD-030_
- **Canal de Recepción** (solo lectura) — _FLD-031 · No editable en corrección._
- **SLA Restante** (solo lectura) — _FLD-032 · Semaforizado._
#### 🔴 Campos con Error — Corrija cada uno

- **Correo Electrónico *** *
- **Número de Identificación *** *
- **Departamento *** *
  - Opciones: Antioquia
- **Municipio *** *
  - Opciones: — Seleccione municipio de Antioquia — / Medellín / Bello / Envigado / Itagüí

**Acciones:** Cancelar Corrección | Guardar Correcciones (3 errores pendientes)

---

### SCR-003 · PAN-03 — Corrección Error Funcional M1/M2
**Tarea:** SP1-T05 — Corregir datos según error funcional SmartSupervision  
**Rol:** 👤 Gestor de Experiencia

_Contexto: 📁 CASE-2026-00342 | 🔢 139165202510091650182078 | 📍 Rechazado SmartSupervision (HTTP 400) | 🔄 Intentos M1/M2: 2 intentos_

> [!] ⚠ Corrija únicamente el campo motivoSFC indicado. El sistema reenviará el payload completo con la corrección aplicada (RUL-003-01).

#### 🔴 Detalle del Error — SmartSupervision HTTP 400 Funcional

- **Código de Error SFC** (solo lectura) — _FLD-040_
- **Campo Afectado** (solo lectura) — _FLD-041 · Nombre del campo rechazado._
- **Valor Rechazado** (solo lectura) — _FLD-042 · Valor enviado que fue rechazado._
- **Mensaje de Error SFC** (solo lectura) — _FLD-043 · Mensaje literal devuelto por SmartSupervision._
- **Intento N.° actual (M1/M2)** (solo lectura) — _FLD-044_
- **Fecha/Hora del rechazo** (solo lectura) — _FLD-045_
#### ✏ Campo a Corregir — Edite solo el campo señalado

- **Motivo SFC * (campo afectado)** *
  - Opciones: 301. No pago de siniestro / 302. Demora en el pago de siniestro / 303. Terminación unilateral del contrato / 304. Cobro de prima o descuento / 305. Incumplimiento en cobertura
- **Justificación de la corrección** — _FLD-047 · Opcional. Queda registrado en el log del caso._

| Intento | Fecha/Hora | Campo afectado | Código error | Resultado |
| --- | --- | --- | --- | --- |
| 1 | 2026-05-12 09:14:32 | motivoSFC | HTTP 400 | ✗ Rechazado |
| 2 | 2026-05-12 09:31:18 | motivoSFC | HTTP 400 | ✗ Rechazado |


**Acciones:** 👁 Ver Log Completo | ⚡ Escalar a Soporte Técnico | Corregir y Reenviar ▶

---

### SCR-004 · PAN-04 — Revisión Error Técnico API
**Tarea:** SP1-T06 — Revisar y corregir error técnico de integración  
**Rol:** 🔧 Analista Técnico

> [X] ✗ Error técnico de integración. El BPM escaló el caso tras superar 3 intentos fallidos. Identifique la causa raíz, registre la corrección aplicada y autorice el reenvío del payload.

#### 🔌 Detalle del Error Técnico

- **Código HTTP** (solo lectura) — _FLD-050_
- **Tipo de Error** (solo lectura) — _FLD-051_
- **Mensaje técnico de la API** — _FLD-052 · Stack técnico completo de la respuesta._
- **Endpoint invocado** (solo lectura) — _FLD-053_
- **Número de intento acumulado** (solo lectura) — _FLD-055_
#### 🛠 Registro de Corrección Técnica — Obligatorio

- **Causa Raíz Identificada *** * — _FLD-056 · Obligatorio. Registrado en el log para auditoría._
- **Corrección Aplicada *** * — _FLD-057 · Obligatorio antes de autorizar reenvío (RUL-004-01)._
- **¿Requiere ajuste en el payload? *** * — _FLD-058 · Indica si se modificó el JSON del payload para el reenvío._
  - Valores: Sí — Se modificó la estructura / No — Solo credenciales

**Acciones:** 👁 Ver Log Completo | ⚠ Escalar a Proveedor API | ✓ Autorizar Reenvío

---

### SCR-005 · PAN-05 — Detalle del Caso / Asignación
**Tarea:** SP2-T01 — Revisar queja radicada y asignar responsable  
**Rol:** 📋 Analista SAC

_Contexto: 📁 CASE-2026-00342 | 🔢 139165202510091650182078 | 📅 SLA: 8 días hábiles | 📍 Radicado ante SFC | ⚡ SmartSupervision: HTTP 201 ✓_

> [!] ⚠ 8 días hábiles restantes. Asigne el caso al área y usuario correctos antes de iniciar el análisis (RUL-005-02).

#### 👤 Datos del Consumidor

- **Nombre del Consumidor** (solo lectura) — _FLD-066_
- **Identificación** (solo lectura) — _FLD-067_
- **Correo Electrónico** (solo lectura) — _FLD-068 · Destino del correo de respuesta final._
- **Tipo de Persona** (solo lectura) — _FLD-069_
#### 📊 Clasificación Regulatoria (precargada desde M1)

- **Canal de Recepción** (solo lectura) — _FLD-070_
- **Producto SFC** (solo lectura) — _FLD-071_
- **Motivo SFC** (solo lectura) — _FLD-072_
- **Instancia / Punto de Recepción** (solo lectura) — _FLD-073_
- **Admisión** (solo lectura) — _FLD-074_
- **Ente de Control** (solo lectura) — _FLD-075_
#### 📝 Descripción de la Queja

- **Descripción** (solo lectura)
#### 🔗 Estado SmartSupervision

- **Estado SmartSupervision** (solo lectura) — _FLD-079_
- **Intentos M1/M2** (solo lectura) — _FLD-080_
- **Fecha/Hora Radicación SFC** (solo lectura) — _FLD-081_
#### 👥 Asignación de Responsable

- **Área Responsable *** * — _FLD-082 · CAT-AREA · Filtra usuarios disponibles._
  - Opciones: Siniestros Automóviles / Siniestros Vida / Pagos y Cobros / Producto / SAC
- **Usuario Responsable *** * — _FLD-083 · CAT-USUARIOS-ROLE · Solo usuarios con rol autorizado para quejas (RUL-005-01)._
  - Opciones: María Fernanda López — Analista Siniestros Auto / Carlos Rodríguez — Gestor Siniestros Auto
- **Observaciones de Asignación** — _FLD-084 · Opcional._

**Acciones:** ← Volver | 🕐 Solicitar Prórroga | Reasignar Caso | ✓ Confirmar Asignación ▶

---

### SCR-006 · PAN-06 — Reasignación de Caso
**Tarea:** SP2-T03 — Reasignar caso a responsable correcto  
**Rol:** 📋 Analista SAC

> [i] ℹ La reasignación quedará registrada en el historial del caso con: usuario anterior, usuario nuevo, fecha/hora y motivo. Solo puede asignar a usuarios con rol autorizado para gestionar quejas directas (RUL-006-01, RUL-006-03).

#### 🔄 Datos de la Reasignación

- **Responsable Actual** (solo lectura) — _FLD-090_
- **Área Destino *** * — _FLD-091 · CAT-AREA_
  - Opciones: Siniestros Automóviles / Siniestros Vida / Pagos y Cobros / Producto Automóviles / SAC
- **Nuevo Responsable *** * — _FLD-092 · CAT-USUARIOS-ROLE · Filtrado por área y rol. Prohibida asignación fuera del proceso._
  - Opciones: Ana Milena García — Analista Siniestros Vida / Pedro Jiménez — Gestor Siniestros Vida
- **Motivo de Reasignación *** * — _FLD-093 · CAT-MOTIVO-REASIG_
  - Opciones: Error en asignación inicial / Área equivocada — producto diferente / Derivación por tipo de cobertura / Solicitud del responsable actual / Otro motivo
- **Observaciones *** * — _FLD-094 · Obligatorio (RUL-006-02). Queda en historial del caso._

| Fecha/Hora | De | Para | Motivo |
| --- | --- | --- | --- |
| 2026-05-12 09:48:00 | Gestor CX — Creación automática | María Fernanda López (Siniestros Auto) | Asignación inicial por clasificación de producto |


**Acciones:** Cancelar | ✓ Confirmar Reasignación ▶

---

### SCR-007 · PAN-07 — Gestión de Queja — Área Responsable
**Tarea:** SP2-T02 / SP2-T05 — Analizar queja y elaborar respuesta técnica  
**Rol:** 🏢 Usuario Zurich / Área Responsable

_Contexto: 📁 CASE-2026-00342 | 🔢 139165... | 📅 SLA: 8 días hábiles | 📍 En análisis | 🔁 Revisión: 1ª_

#### 📋 Datos del Caso (solo lectura)

- **ID Caso / Código SFC** (solo lectura) — _FLD-100_
- **Producto SFC / Motivo** (solo lectura) — _FLD-103_
- **Nombre del Consumidor** (solo lectura) — _FLD-104_
- **Texto de la Queja** (solo lectura) — _FLD-105_
#### ✏ Elaboración de Respuesta Técnica

- **Causa Raíz Identificada *** * — _FLD-108 · Obligatorio (RUL-007-01)._
- **Posición de Zurich *** * — _FLD-109 · Obligatorio (RUL-007-01)._
- **Respuesta al Cliente (borrador) *** * — _FLD-110 · Obligatorio (RUL-007-01). Irá en la carta PDF de respuesta final enviada al cliente._
- **Acciones Tomadas** — _FLD-111 · Opcional._
- **¿Reconocimiento al cliente? *** * — _FLD-112 · Indica si se realizará reconocimiento económico o simbólico._
  - Valores: Sí / No

**Acciones:** 👁 Ver Expediente Completo | 💾 Guardar Borrador | Enviar a Revisión SAC ▶

---

### SCR-008 · PAN-08 — Revisión Respuesta SAC
**Tarea:** SP2-T04 — Revisar respuesta borrador — Aprobar o devolver con observaciones  
**Rol:** 📋 Analista SAC

_Contexto: 📁 CASE-2026-00342 | 📅 SLA: 6 días hábiles | 📍 En revisión SAC | 🔁 Versión: 1 | 🏢 Área: Siniestros Automóviles_

> [i] ℹ Si aprueba : el sistema genera el PDF de respuesta final y habilita el Formulario Superintendencia. Si devuelve : las observaciones son obligatorias y el área responsable recibirá notificación con el ciclo de revisión incrementado (RUL-008-01).

#### 📋 Contexto del Caso

- **ID Caso / Código SFC** (solo lectura)
- **Área Responsable** (solo lectura)
- **Fecha elaboración** (solo lectura)
#### 📝 Respuesta Elaborada por Área (solo lectura para revisión)

- **Acciones Tomadas** (solo lectura)
#### ✏ Decisión del Analista SAC

- **Observaciones SAC** — _FLD-131 · Obligatorio al devolver (RUL-008-01)._

**Acciones:** Reasignar Caso | ↩ Devolver con Observaciones | ✓ Aprobar Respuesta ▶

---

### SCR-009 · PAN-09 — Formulario Superintendencia
**Tarea:** SP2-T07 — Proforma F.1000-166 / Formato 411 | CE 039/2011 · CE 019/2024  
**Rol:** 📋 Analista SAC

> [OK] ✓ Respuesta aprobada por SAC. PDF generado automáticamente por SP2-T06. Complete todos los campos regulatorios para habilitar el subproceso SP3 de cierre ante SmartSupervision.

> [!] ⚠ CE 019/2024 vigente desde 1 julio 2025: Si la queja está relacionada con fraude, los campos a continuación son obligatorios y se transmitirán a SmartSupervision (RUL-009-01).

#### 📊 Datos Precargados desde M1 (solo lectura — RUL-009-02)

- **Código SFC** (solo lectura) — _FLD-140_
- **Canal (precargado M1)** (solo lectura) — _FLD-141 · No editable. Precargado desde Momento 1._
- **Producto (precargado M1)** (solo lectura) — _FLD-142 · No editable._
- **Motivo (precargado M1)** (solo lectura) — _FLD-143 · No editable._
- **Admisión (precargado M1)** (solo lectura) — _FLD-144 · No editable._
- **Ente de Control (precargado M1)** (solo lectura) — _FLD-145 · No editable._
#### 👤 Datos del Consumidor — Campos SFC

- **Sexo *** * — _FLD-146 · CAT-SEXO_
  - Opciones: M. Masculino / F. Femenino / I. No informa
- **LGBTIQ+ *** * — _FLD-147 · ⚠ CAT-LGBTIQ — Pendiente confirmación con TI (CE 019/2024). Valide antes de transmitir._
  - Opciones: 1. Sí / 2. No / 3. No informa
- **Condición Especial *** * — _FLD-148 · CAT-COND-ESP_
  - Opciones: 1. Ninguna / 2. Adulto mayor / 3. Discapacidad física / 4. Discapacidad cognitiva / 5. Población vulnerable
- **Producto Digital *** * — _FLD-149 · CAT-PROD-DIGITAL_
  - Opciones: 1. Sí / 2. No
#### ⚖ Condición de la Queja

- **Estado de la Queja o Reclamo *** * — _FLD-150 · CAT-ESTADO-QUEJA_
  - Opciones: 1. Cerrada a favor del CF / 2. Cerrada a favor de la entidad / 3. Desistida / 4. Rectificada
- **Favorabilidad *** * — _FLD-151 · CAT-FAVORAB_
  - Opciones: 1. A favor del consumidor financiero / 2. A favor de la entidad vigilada / 3. Favorabilidad parcial
- **Aceptación *** * — _FLD-152 · CAT-ACEPTACION_
  - Opciones: 1. Respuesta final a favor CF aceptada / 2. Respuesta final CF no aceptada
- **Rectificación *** * — _FLD-153 · CAT-RECTIF_
  - Opciones: 1. Rectificada por entidad / 2. No rectificada
- **Desistimiento *** * — _FLD-154 · CAT-DESIST_
  - Opciones: 1. Desistida por CF / 2. No desistida
- **Tutela *** * — _FLD-155 · CAT-TUTELA_
  - Opciones: 1. Sí / 2. No
- **Marcación *** * — _FLD-156 · CAT-MARCACION_
  - Opciones: 1. Positiva / 2. Negativa / 3. Cerrada por entidad — no es queja
- **Queja Exprés *** * — _FLD-157 · CAT-EXPRES_
  - Opciones: 1. Sí / 2. No
#### 🚨 Datos de Fraude — CE 019/2024 (Obligatorio desde 1 julio 2025)

- **Tipo de Fraude * (cond.)** — _FLD-159 · CAT-TIPO-FRAUDE · CE 019/2024_
  - Opciones: Fraude externo / Fraude interno / Phishing / Suplantación de identidad
- **Modalidad de Fraude * (cond.)** — _FLD-160 · CAT-MOD-FRAUDE · CE 019/2024_
  - Opciones: Robo de información / Falsificación de documentos / Manipulación de sistema
- **Monto Reclamado (COP) * (cond.)** — _FLD-161 · CE 019/2024_
- **Monto Reconocido (COP) * (cond.)** — _FLD-162 · CE 019/2024_
#### 📎 Anexos del Formulario

- **¿Incluye Anexos a la Queja? *** * — _FLD-163 · Indicador regulatorio SFC._
  - Valores: Sí / No
- **¿Incluye Adjunto Respuesta Final? *** * — _FLD-164 · Debe ser Sí cuando PDF está adjunto._
  - Valores: Sí / No
- **PDF Respuesta Final (generado automáticamente por SP2-T06)** (solo lectura) — _FLD-165 · Nomenclatura correcta. Descargable para revisión antes de continuar._

**Acciones:** 💾 Guardar Borrador | ✓ Guardar Formulario — Habilitar SP3 ▶

---

### SCR-010 · PAN-10 — Formulario Cierre M3
**Tarea:** SP3-T01 / SP3-T04 / SP3-T08 — Cierre Regulatorio Momento 3  
**Rol:** 📋 Analista SAC

_Contexto: 📁 CASE-2026-00342 | 🔢 139165202510091650182078 | 📅 SLA: 3 días hábiles ⚠ | 📍 Pendiente cierre regulatorio | 🔄 Intentos M3: 0_

> [!!] 🔒 RESTRICCIÓN REGULATORIA CRÍTICA — RUL-010-04: La notificación al cliente (P01-T08) se enviará EXCLUSIVAMENTE después de recibir HTTP 200 de SmartSupervision. No se generará ninguna comunicación al cliente durante este proceso de cierre ni en los reintentos.

> [!] ⚠ RUL-010-01 CRÍTICO: La Fecha de Actualización y la Fecha de Cierre deben ser exactamente iguales . El botón de envío está deshabilitado mientras no coincidan.

> [OK] ✓ Fechas correctas: Fecha de Actualización = Fecha de Cierre. Validación superada.

> [X] ✗ MSG-010-01 ⚠ Las fechas no coinciden. La Fecha de Actualización y la Fecha de Cierre deben ser exactamente iguales para enviar a SmartSupervision. El botón de envío está deshabilitado.

> [i] ℹ El sistema valida automáticamente la nomenclatura: NombreCliente_NumeroIdentificacion_RESP_FINAL_SFC_N y que el archivo sea un PDF válido. No se puede enviar a SmartSupervision sin estas validaciones superadas.

> [!!] 🔐 BOTÓN HABILITADO SOLO CUANDO: (1) Fecha Actualización = Fecha Cierre ✓, (2) Nomenclatura PDF correcta ✓, (3) Todos los campos obligatorios completos ✓. El incumplimiento de cualquier condición mantiene el botón deshabilitado (RUL-010-03).

#### 🔗 Estado del Cierre SmartSupervision

- **Estado Cierre M3** (solo lectura) — _FLD-170_
- **Intentos Cierre M3** (solo lectura) — _FLD-171_
- **Código SFC** (solo lectura) — _FLD-173_
#### 📅 Datos del Cierre — Validación en Tiempo Real

- **Estado de la Queja *** * — _FLD-174 · CAT-ESTADO-QUEJA_
  - Opciones: 1. Cerrada a favor del CF / 2. Cerrada a favor de la entidad / 3. Desistida / 4. Rectificada
- **Fecha de Actualización *** * — _FLD-175 · ⚠ DEBE ser igual a Fecha de Cierre (RUL-010-01)._
- **Fecha de Cierre *** * — _FLD-176 · ⚠ DEBE ser igual a Fecha de Actualización (RUL-010-01)._
- **Favorabilidad *** * — _FLD-177 · Precargado de PAN-09. Editable si hubo error._
  - Opciones: 1. A favor del consumidor financiero / 2. A favor de la entidad vigilada
- **Aceptación *** * — _FLD-178 · Precargado de PAN-09._
  - Opciones: 1. Respuesta final CF aceptada / 2. Respuesta final CF no aceptada
- **Marcación *** * — _FLD-179_
  - Opciones: 1. Positiva / 2. Negativa / 3. Cerrada por entidad
- **Queja Exprés *** * — _FLD-180_
  - Opciones: 2. No / 1. Sí
#### 📄 PDF de Respuesta Final — Validación Automática (RUL-010-02)

- **PDF Respuesta Final *** * (solo lectura) — _FLD-181 · Generado por SP2-T06. RUL-010-02._
- **¿Adjunto a la respuesta final? *** * — _FLD-183_
  - Valores: Sí / No
#### 🔒 Campos Fraude CE 019/2024 (solo lectura — precargados desde PAN-09)

- **¿Relacionada con fraude?** (solo lectura) — _FLD-184_
- **Tipo / Modalidad de Fraude** (solo lectura) — _FLD-185_

**Acciones:** 📥 Ver PDF | 👁 Ver Log de Intentos M3 | Enviar a SmartSupervision — Cierre M3 ▶ (Complete validaciones)

---

### SCR-011 · PAN-11 — Revisión Error Técnico Prórroga
**Tarea:** SP4-T05 — Corregir error técnico de API en solicitud de prórroga  
**Rol:** 🔧 Analista Técnico

> [X] ✗ Error técnico en solicitud de prórroga. El BPM escaló el caso al Analista Técnico. Identifique la causa, registre la corrección y autorice el reenvío del payload de prórroga.

#### 🔌 Detalle del Error Técnico — Prórroga

- **Código HTTP prórroga** (solo lectura) — _FLD-190_
- **Tipo de Error** (solo lectura) — _FLD-191_
- **Mensaje técnico de la API** — _FLD-192_
- **Payload de prórroga enviado (JSON)** — _FLD-193_
- **Número de intento prórroga** (solo lectura) — _FLD-194_
#### 🛠 Registro de Corrección — Prórroga

- **Causa Raíz *** * — _FLD-195 · Obligatorio (RUL-011-01)._
- **Corrección Aplicada *** * — _FLD-196 · Obligatorio (RUL-011-01)._

**Acciones:** ⚠ Escalar a Proveedor | ✓ Autorizar Reenvío Prórroga ▶

---

### SCR-012 · PAN-12 — Corrección Error Funcional Prórroga
**Tarea:** SP4-T06 — SmartSupervision rechazó solicitud de prórroga HTTP 400 funcional  
**Rol:** 📋 Analista SAC / Área Responsable

#### 🔴 Panel de Error — Prórroga HTTP 400 Funcional

- **Código de Error SFC Prórroga** (solo lectura) — _FLD-200_
- **Campo Afectado** (solo lectura) — _FLD-201_
- **Mensaje de Error SFC** (solo lectura) — _FLD-202_
- **Intento N.° actual** (solo lectura) — _FLD-203_
#### ✏ Campos de Prórroga a Corregir

- **Motivo de Prórroga *** * — _FLD-204_
  - Opciones: 1. Complejidad técnica del caso / 2. Requerimiento de información adicional al cliente / 3. Intervención de terceros / 4. Caso con elementos de fraude
- **Nueva Fecha Límite *** * — _FLD-205 · Debe ser posterior a la fecha actual (RUL-012-01)._
- **Contador de Prórroga *** * — _FLD-206 · N.° de prórroga solicitada. Validar contra límite SFC._
- **Justificación *** * — _FLD-207 · Obligatorio._

**Acciones:** ✗ Cancelar Prórroga | Reenviar Prórroga ▶

---
