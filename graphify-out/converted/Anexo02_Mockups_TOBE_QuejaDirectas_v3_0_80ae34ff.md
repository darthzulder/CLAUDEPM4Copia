<!-- converted from Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx -->

## Sheet: 00_Instrucciones
|  | MOCKUPS TO-BE v2.0 — Gestión de Quejas Directas | Zurich Seguros Colombia |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | IDENTIFICACIÓN |  |  |  |  |  |  |  |
|  | Archivo | Anexo02_Mockups_TOBE_QuejaDirectas_v2_0 |  |  |  |  |  |  |
|  | Proceso | Gestión de Quejas Directas con SmartSupervision SFC | ACZ-QD-001 |  |  |  |  |  |  |
|  | Marco regulatorio | Ley 1328/2009 · CE 039/2011 · CE 019/2024 |  |  |  |  |  |  |
|  | Plataforma objetivo | ProcessMaker 4 BPMS |  |  |  |  |  |  |
|  | Versión | 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |
|  | Elaborado por | BeePM — Beesmartec |  |  |  |  |  |  |
|  | Fuente base | Matrices_Maduracion_TOBE_QuejaDirectas_v2_0.xlsx — Hoja 4. Pantallas |  |  |  |  |  |  |
|  | HOJAS DEL ARCHIVO |  |  |  |  |  |  |  |
|  | 00_Instrucciones | Uso del archivo, convenciones y notas críticas regulatorias. |  |  |  |  |  |  |
|  | 01_Pantallas | Inventario maestro: 12 pantallas TO-BE con Historia de Usuario y Criterio de Aceptación. |  |  |  |  |  |  |
|  | 02_Secciones | Secciones de cada pantalla con condiciones de visibilidad. |  |  |  |  |  |  |
|  | 03_Campos | Diccionario completo de campos — FUENTE DE VERDAD editable por negocio. |  |  |  |  |  |  |
|  | 04_Acciones | Botones y acciones con condición de habilitación y resultado BPMN. |  |  |  |  |  |  |
|  | 05_Reglas | Reglas de negocio, validación, visibilidad y control. Coloreadas por tipo. |  |  |  |  |  |  |
|  | 06_Mensajes | Mensajes del sistema por tipo, disparador y resultado. |  |  |  |  |  |  |
|  | 07_Catalogs | Catálogos referenciados — 32 listas. Mayoría pendiente parametrización con TI. |  |  |  |  |  |  |
|  | 08_Permisos | Visibilidad y edición por rol para cada pantalla. |  |  |  |  |  |  |
|  | 10_Trazabilidad_BPMN | Relación pantalla → tarea BPMN → compuerta → resultado de flujo. |  |  |  |  |  |  |
|  | 11_Checklist_QA | Control de calidad: 10 criterios × 12 pantallas = 120 ítems. |  |  |  |  |  |  |
|  | SCR-001 ... SCR-012 | 12 hojas visuales de mockup — una por pantalla. Editables por negocio. |  |  |  |  |  |  |
|  | CONVENCIONES DE IDs |  |  |  |  |  |  |  |
|  | SCR-### | Identificador de pantalla (SCR-001 a SCR-012) |  |  |  |  |  |  |
|  | SEC-### | Identificador de sección |  |  |  |  |  |  |
|  | FLD-### | Identificador de campo |  |  |  |  |  |  |
|  | ACT-###-## | Identificador de acción/botón |  |  |  |  |  |  |
|  | RUL-###-## | Identificador de regla |  |  |  |  |  |  |
|  | MSG-###-## | Identificador de mensaje |  |  |  |  |  |  |
|  | CAT-XXX | Identificador de catálogo |  |  |  |  |  |  |
|  | PER-### | Identificador de permiso |  |  |  |  |  |  |
|  | ⚠ NOTAS CRÍTICAS REGULATORIAS |  |  |  |  |  |  |  |
|  | RUL-010-01 ⚠ | CRÍTICO: fechaActualizacion DEBE ser IGUAL a fechaCierre antes de enviar M3. Botón deshabilitado si no coinciden. |  |  |  |  |  |  |
|  | RUL-010-02 ⚠ | CRÍTICO: PDF debe cumplir nomenclatura exacta: NombreCliente_NumeroIdentificacion_RESP_FINAL_SFC_N |  |  |  |  |  |  |
|  | RUL-010-04 ⚠ | CRÍTICO ARQUITECTURA: Notificación al cliente (P01-T08) SOLO tras recibir HTTP 200 de SmartSupervision. Bloqueo técnico. |  |  |  |  |  |  |
|  | FLD-147 ⚠ | PENDIENTE: Catálogo LGBTIQ+ debe confirmarse con TI antes de implementar. |  |  |  |  |  |  |
|  | CE 019/2024 ⚠ | Campos de fraude (FLD-158 a FLD-162) obligatorios desde 1 julio 2025. Validar implementación. |  |  |  |  |  |  |
|  | CAT-CATALOGOS | 32 catálogos referenciados — la mayoría pendientes de parametrización con el equipo TI Zurich. |  |  |  |  |  |  |
## Sheet: 01_Pantallas
|  | INVENTARIO MAESTRO DE PANTALLAS TO-BE |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |  |  |  |  |
|  | Detalle de la Pantalla |  |  |  |  | Historia de Usuario |  |  | Criterio de Aceptación |  |  |  |
|  | SCR / PAN | Nombre Pantalla | Tipo | Proceso BPMN | Código Tarea | Rol Responsable | Como (Rol) | Quiero (Func.) | Para (Beneficio) | Dado que (Contexto) | Cuando (Acción) | Entonces (Resultado) |
|  | SCR-001
PAN-01 | Crear / Recibir Queja | Formulario de alta | P01 | P01-T01 | Gestor de Experiencia | Gestor de Experiencia | registrar una nueva queja directa con todos los datos del cliente y la descripción de la inconformidad | crear el caso en el BPM con la información completa y activar el proceso de radicación ante SmartSupervision | tengo todos los datos del cliente (nombre, ID, correo, tipo persona), el canal de ingreso y la descripción de la queja | completo el formulario y presiono 'Crear Queja' | el sistema valida los datos, crea el caso con ID único, activa automáticamente la verificación de similares y muestra confirmación con el número de caso asignado |
|  | SCR-002
PAN-02 | Corrección de Datos | Formulario de corrección | P01 | P01-T07 | Gestor de Experiencia | Gestor de Experiencia | ver exactamente cuál campo tiene error de validación y el formato correcto esperado para corregirlo | corregir los datos sin necesidad de interpretar mensajes técnicos y poder continuar con la radicación | el sistema detectó errores en el formulario tras ejecutar la validación preventiva | el sistema resalta en rojo los campos con error y presiono 'Guardar correcciones' | el sistema bloquea el avance hasta que todos los errores sean corregidos, re-ejecuta la validación automáticamente y habilita el botón de envío a SmartSupervision solo cuando todos los campos son válidos |
|  | SCR-003
PAN-03 | Corrección Error Funcional M1/M2 | Panel de corrección de error funcional | SP1 | SP1-T05 | Gestor de Experiencia | Gestor de Experiencia | ver el detalle del error funcional devuelto por SmartSupervision con el campo específico afectado y el valor rechazado | corregir el problema de forma rápida y precisa sin navegar por todo el formulario | SmartSupervision rechazó la radicación con error 400 por datos inválidos | el sistema muestra el panel de error con campo afectado y presiono 'Corregir y reenviar' | puedo editar directamente el campo señalado, guardar la corrección y ejecutar el reenvío a SmartSupervision sin tener que navegar por el formulario completo |
|  | SCR-004
PAN-04 | Revisión Error Técnico API | Pantalla de análisis técnico | SP1 | SP1-T06 | Analista Técnico | Analista Técnico | revisar el detalle del error técnico de la API de SmartSupervision y registrar la corrección aplicada | resolver el error de integración, documentar la causa raíz y autorizar el reenvío del payload | el BPM escaló el caso por error técnico después de múltiples intentos fallidos | reviso el log de error, identifico la causa técnica, aplico la corrección y presiono 'Autorizar reenvío' | el sistema registra la corrección técnica en el log del caso, actualiza el número de intento y ejecuta automáticamente el reenvío del payload corregido a SmartSupervision |
|  | SCR-005
PAN-05 | Detalle del Caso / Asignación | Pantalla de detalle + asignación | SP2 | SP2-T01 | Usuario Zurich / Área Responsable | Usuario Zurich / Área Responsable | revisar el expediente completo de la queja radicada y confirmar o cambiar el responsable de gestión | garantizar que el caso esté asignado al área y usuario correctos antes de iniciar el análisis interno | la queja fue radicada exitosamente ante SmartSupervision y está en mi bandeja para asignación | reviso el expediente y presiono 'Confirmar asignación' o 'Reasignar caso' | el sistema registra la decisión, notifica al responsable asignado y cambia el estado del caso a 'En análisis' |
|  | SCR-006
PAN-06 | Reasignación de Caso | Modal de reasignación | SP2 | SP2-T03 | Usuario Zurich / Área Responsable | Usuario Zurich / Área Responsable | reasignar el caso a un usuario específico del área responsable correcta seleccionando de una lista filtrada por roles autorizados | garantizar que la queja sea analizada por quien tiene el conocimiento técnico y la autorización para responderla | el caso requiere análisis especializado de otra área (Siniestros, Pagos, Vida, Producto u otra) | selecciono el nuevo responsable de la lista filtrada, registro el motivo de la reasignación y presiono 'Reasignar' | el sistema registra en el historial: usuario anterior, usuario nuevo, fecha/hora y motivo; notifica al nuevo responsable y actualiza el panel de responsable actual del caso |
|  | SCR-007
PAN-07 | Gestión de Queja — Área Responsable | Formulario de análisis y respuesta técnica | SP2 | SP2-T02 / SP2-T05 | Usuario Zurich / Área Responsable | Usuario Zurich / Área Responsable | ver el detalle completo de la queja asignada y elaborar el borrador de respuesta técnica con análisis de causa raíz | documentar el análisis de Zurich y la posición técnica de forma trazable para el cierre regulatorio | tengo el caso asignado en mi bandeja y accedo al detalle con expediente del cliente, código SFC y SLA vigente | redacto el borrador de respuesta en el campo habilitado, adjunto soportes internos si aplica y presiono 'Enviar a revisión SAC' | el sistema registra el borrador de respuesta, envía notificación al Analista SAC para revisión y cambia el estado a 'En revisión SAC' |
|  | SCR-008
PAN-08 | Revisión Respuesta SAC | Pantalla de revisión y aprobación | SP2 | SP2-T04 | Analista SAC | Analista SAC | revisar la respuesta borrador elaborada por el área responsable y aprobarla o devolverla con observaciones específicas | garantizar que el cliente reciba una respuesta clara, suficiente, regulatoriamente correcta y orientada a su experiencia | el área responsable envió el borrador de respuesta para mi revisión y aparece en mi bandeja | reviso la respuesta completa y presiono 'Aprobar respuesta' o 'Devolver con observaciones' | si apruebo: el sistema habilita la generación del PDF y continúa el flujo hacia el formulario Superintendencia; si devuelvo: notifica al responsable con mis observaciones y retorna el caso a 'Ajuste en progreso' |
|  | SCR-009
PAN-09 | Formulario Superintendencia | Formulario regulatorio (F.1000-166/Formato 411) | SP2 | SP2-T07 | Usuario Zurich / Área Responsable | Usuario Zurich / Área Responsable | completar el formulario regulatorio requerido por la Superintendencia con los datos de condición del cliente y cierre de la queja | cumplir con el requisito regulatorio del formulario SFC y habilitar el subproceso SP3 de cierre regulatorio | la respuesta fue aprobada por SAC y el PDF fue generado correctamente | completo todos los campos del formulario (Sexo, LGBTIQ+, Condición Especial, Estado, Favorabilidad, campos de fraude si aplica) y presiono 'Guardar formulario' | el sistema valida que todos los campos obligatorios de SmartSupervision estén completos, guarda el formulario en el expediente y habilita el subproceso SP3 de cierre regulatorio |
|  | SCR-010
PAN-10 | Formulario Cierre M3 | Formulario de cierre regulatorio (Momento 3) | SP3 | SP3-T01 / SP3-T04 / SP3-T08 | Usuario Zurich / Área Responsable | Usuario Zurich / Área Responsable | diligenciar el formulario de cierre M3 con validación en tiempo real de fechas y nomenclatura del PDF adjunto | evitar rechazos en SmartSupervision por inconsistencias preventivamente corregibles antes del envío | tengo el PDF de respuesta final generado y el formulario Superintendencia completado | completo el formulario de cierre M3 con las fechas de actualización y cierre, adjunto el PDF y presiono 'Enviar a SmartSupervision' | el sistema valida en tiempo real: (1) que Fecha Actualización = Fecha Cierre, (2) que el PDF tenga nomenclatura correcta, (3) que todos los campos regulatorios estén completos. El botón de envío solo se activa cuando todas las validaciones pasan |
|  | SCR-011
PAN-11 | Revisión Error Técnico Prórroga | Pantalla de análisis técnico (prórroga) | SP4 | SP4-T05 | Analista Técnico | Analista Técnico | revisar el error técnico de la API al enviar la solicitud de prórroga y registrar la corrección aplicada | resolver el error de integración en la solicitud de prórroga y autorizar el reenvío | el BPM escaló el caso por error técnico en el envío del payload de prórroga a SmartSupervision | reviso el log de error de prórroga, identifico la causa técnica, aplico la corrección y presiono 'Autorizar reenvío' | el sistema registra la corrección técnica en el log, actualiza el número de intento y ejecuta automáticamente el reenvío del payload de prórroga |
|  | SCR-012
PAN-12 | Corrección Error Funcional Prórroga | Formulario de corrección (prórroga) | SP4 | SP4-T06 | Analista SAC / Área Responsable | Analista SAC / Área Responsable | corregir los campos del formulario de prórroga rechazados por SmartSupervision | resolver el rechazo funcional y obtener la aceptación de la prórroga por parte de SmartSupervision | SmartSupervision rechazó la solicitud de prórroga con error 400 funcional | corrijo los campos señalados (motivo, fechas, contador) y presiono 'Reenviar prórroga' | el sistema registra la corrección en el log y ejecuta el reenvío del payload de prórroga corregido |
|  | SCR-000
PAN-01.2 | Formulario de Radicación PQRS (Autoservicio) | Formulario de autoservicio (radicación pública) | P01 | P01-T00 | Consumidor Financiero (Cliente / Intermediario / Empleado Zurich / Defensor del Consumidor) | Consumidor Financiero (cliente, intermediario, empleado Zurich o defensor del consumidor) | radicar mi PQRS (petición, queja, reclamo, sugerencia o felicitación) por un único formulario de autoservicio con mis datos y el detalle de la inconformidad | presentar mi solicitud directamente, sin intermediarios, y recibir respuesta en mi correo cumpliendo el formato exigido por SmartSupervision SFC | tengo mi identificación, datos de contacto, el seguro/producto asociado y la descripción de mi solicitud | completo el formulario, acepto el tratamiento de datos, valido el captcha y presiono 'Enviar PQRS' | el sistema valida los datos, crea el caso con ID único, asigna automáticamente la instancia y el punto de recepción según mi rol, y muestra confirmación con el número de radicado |
## Sheet: 02_Secciones
|  | SECCIONES POR PANTALLA |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |  |
|  | ID Sección | ID Pantalla (SCR) | Nombre Sección | Tipo Sección | Orden | Cols. Visuales | Visible por Defecto | Condición de Visibilidad | Descripción / Propósito |
|  | SEC-001 | SCR-001 | S1 Encabezado del Caso | Sección de formulario | 1 | 2 | Sí | Siempre |  |
|  | SEC-002 | SCR-001 | S2 Datos del Consumidor Financiero | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-003 | SCR-001 | S3 Clasificación y Datos de la Queja | Sección de formulario | 3 | 2 | Sí | Siempre |  |
|  | SEC-004 | SCR-001 | S4 Adjuntos | Sección de formulario | 4 | 2 | Sí | Siempre |  |
|  | SEC-005 | SCR-002 | S1 Datos del Caso (solo lectura) | Sección de formulario | 1 | 2 | Sí | Siempre |  |
|  | SEC-006 | SCR-002 | S2 Resumen de Errores | Sección de formulario | 2 | 2 | Sí | Siempre visible en esta pantalla |  |
|  | SEC-007 | SCR-002 | S3 Campos con Error | Sección de formulario | 3 | 2 | Sí | Siempre visible en esta pantalla |  |
|  | SEC-008 | SCR-003 | S1 Panel de Error SmartSupervision | Sección de formulario | 1 | 2 | Sí | Siempre visible en esta pantalla |  |
|  | SEC-009 | SCR-003 | S2 Campo a Corregir | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-010 | SCR-003 | S3 Historial de Intentos | Sección de formulario | 3 | 2 | Sí | Siempre |  |
|  | SEC-011 | SCR-004 | S1 Detalle del Error Técnico | Sección de formulario | 1 | 2 | Sí | Siempre visible en esta pantalla |  |
|  | SEC-012 | SCR-004 | S2 Registro de Corrección Técnica | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-013 | SCR-005 | S1 Encabezado Estado del Caso | Sección de formulario | 1 | 2 | Sí | Siempre |  |
|  | SEC-014 | SCR-005 | S2 Datos del Consumidor | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-015 | SCR-005 | S3 Clasificación Regulatoria | Sección de formulario | 3 | 2 | Sí | Siempre |  |
|  | SEC-016 | SCR-005 | S4 Descripción de la Queja | Sección de formulario | 4 | 2 | Sí | Siempre |  |
|  | SEC-017 | SCR-005 | S5 Estado SmartSupervision | Sección de formulario | 5 | 2 | Sí | Siempre |  |
|  | SEC-018 | SCR-005 | S6 Asignación de Responsable | Sección de formulario | 6 | 2 | Sí | Siempre |  |
|  | SEC-019 | SCR-006 | S1 Datos de Reasignación | Sección de formulario | 1 | 2 | Sí | Siempre |  |
|  | SEC-020 | SCR-006 | S2 Historial de Asignaciones | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-021 | SCR-007 | S1 Datos del Caso (solo lectura) | Sección de formulario | 1 | 2 | Sí | Siempre |  |
|  | SEC-022 | SCR-007 | S2 Observaciones SAC (visible si es ajuste) | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-023 | SCR-007 | S3 Elaboración de Respuesta Técnica | Sección de formulario | 3 | 2 | Sí | Siempre |  |
|  | SEC-024 | SCR-007 | S4 Soportes Internos | Sección de formulario | 4 | 2 | Sí | Siempre |  |
|  | SEC-025 | SCR-008 | S1 Contexto del Caso | Sección de formulario | 1 | 2 | Sí | Siempre |  |
|  | SEC-026 | SCR-008 | S2 Respuesta del Área (solo lectura) | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-027 | SCR-008 | S3 Decisión del Analista SAC | Sección de formulario | 3 | 2 | Sí | Siempre |  |
|  | SEC-028 | SCR-009 | S1 Datos Precargados M1 (solo lectura) | Sección de formulario | 1 | 2 | Sí | Siempre |  |
|  | SEC-029 | SCR-009 | S2 Datos del Consumidor — Campos SFC | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-030 | SCR-009 | S3 Condición de la Queja | Sección de formulario | 3 | 2 | Sí | Siempre |  |
|  | SEC-031 | SCR-009 | S4 Datos de Fraude CE-019-2024 (condicional) | Sección de formulario | 4 | 2 | Condicional | Solo si relacionadaFraude = Sí |  |
|  | SEC-032 | SCR-009 | S5 Anexos del Formulario | Sección de formulario | 5 | 2 | Sí | Siempre |  |
|  | SEC-033 | SCR-010 | S1 Estado del Cierre SmartSupervision | Sección de formulario | 1 | 2 | Sí | Siempre |  |
|  | SEC-034 | SCR-010 | S2 Datos del Cierre | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-035 | SCR-010 | S3 PDF de Respuesta Final | Sección de formulario | 3 | 2 | Sí | Siempre |  |
|  | SEC-036 | SCR-010 | S4 Campos Fraude CE-019-2024 (solo lectura) | Sección de formulario | 4 | 2 | Sí | Siempre |  |
|  | SEC-037 | SCR-011 | S1 Detalle del Error Técnico — Prórroga | Sección de formulario | 1 | 2 | Sí | Siempre visible en esta pantalla |  |
|  | SEC-038 | SCR-011 | S2 Registro de Corrección — Prórroga | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-039 | SCR-012 | S1 Panel de Error — Prórroga | Sección de formulario | 1 | 2 | Sí | Siempre visible en esta pantalla |  |
|  | SEC-040 | SCR-012 | S2 Campos de Prórroga a Corregir | Sección de formulario | 2 | 2 | Sí | Siempre |  |
|  | SEC-041 | SCR-000 | S1 Tipo de Solicitud y Rol | Sección de formulario | 1 | 2 | Sí | Siempre | Clasificación inicial: tipo de solicitud y rol del radicador. Determina instancia y punto de recepción. |
|  | SEC-042 | SCR-000 | S2 Datos del Consumidor Financiero | Sección de formulario | 2 | 2 | Sí | Siempre | Identificación y datos de contacto del consumidor financiero. |
|  | SEC-043 | SCR-000 | S3 Detalle de la Queja | Sección de formulario | 3 | 2 | Sí | Siempre | Producto, motivo, detalle y adjuntos de la solicitud. |
|  | SEC-044 | SCR-000 | S4 Autorización y Envío | Sección de formulario | 4 | 2 | Sí | Siempre | Autorización de tratamiento de datos, captcha y correo de copia. |
|  | SEC-045 | SCR-000 | S5 Estado ante la SFC | Sección de formulario | 5 | 2 | No | Visible tras la radicación | Estado SmartSupervision en formato semáforo — solo lectura. |
|  | SEC-046 | SCR-000 | S6 Responsable Asignado | Sección de formulario | 6 | 2 | No | Visible tras la asignación | Rol y responsable del caso — solo lectura. |
## Sheet: 03_Campos
|  | DICCIONARIO DE CAMPOS — FUENTE DE VERDAD |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ID Campo | SCR | Sección | Orden | Etiqueta Visible | Nombre Técnico | Tipo Dato | Control UI | Obligatorio | Editable | Solo Lectura | Valor por Defecto | Fuente de Datos | Catálogo | Validación / Regla | Ayuda al Usuario |
|  | FLD-001 | SCR-001 | S1 Encabezado del Caso | 1 | Número de Caso (ID BPM) | idCasoBPM | Texto | Label/Solo lectura | No | No | Sí | [Auto] | Sistema BPM |  | — | Asignado por el BPM al crear el registro. |
|  | FLD-002 | SCR-001 | S1 Encabezado del Caso | 2 | Canal de Recepción | canalRecepcion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-CANAL | Canal habilitado en catálogo activo | Solo se captura una vez. No se vuelve a pedir en pantallas posteriores. |
|  | FLD-003 | SCR-001 | S1 Encabezado del Caso | 3 | Fecha y Hora de Creación | fechaCreacion | Fecha/Hora | Label/Solo lectura | No | No | Sí | [Auto] | Sistema BPM |  | — | Timestamp automático del sistema. |
|  | FLD-004 | SCR-001 | S2 Datos del Consumidor Financiero | 1 | Nombre o Razón Social | nombreConsumidor | Texto | Texto | Sí | Sí | No | — | Usuario |  | Máx 200 car. Sin caracteres no permitidos SFC |  |
|  | FLD-005 | SCR-001 | S2 Datos del Consumidor Financiero | 2 | Tipo de Identificación | tipoIdentificacion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-TIPO-ID | Valor en catálogo SFC activo | CC, CE, NIT, Pasaporte, TI... |
|  | FLD-006 | SCR-001 | S2 Datos del Consumidor Financiero | 3 | Número de Identificación | numeroIdentificacion | Texto | Texto | Sí | Sí | No | — | Usuario |  | Solo dígitos. Mín 6, máx 15 caracteres |  |
|  | FLD-007 | SCR-001 | S2 Datos del Consumidor Financiero | 4 | Correo Electrónico | correoElectronico | Correo | Correo | Sí | Sí | No | — | Usuario |  | Formato RFC 5321 obligatorio | Destino del correo de respuesta final. Obligatorio (bloquea si vacío o inválido). |
|  | FLD-008 | SCR-001 | S2 Datos del Consumidor Financiero | 5 | Tipo de Persona | tipoPersona | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-TIPO-PERSONA | Valor en catálogo | Natural / Jurídica |
|  | FLD-009 | SCR-001 | S2 Datos del Consumidor Financiero | 6 | Código País | codigoPais | Catálogo | Lista desplegable | Sí | Sí | No | 170 — Colombia | Catálogo SFC | CAT-PAIS | Valor en catálogo | Por defecto: 170 — Colombia. |
|  | FLD-010 | SCR-001 | S2 Datos del Consumidor Financiero | 7 | Departamento | departamento | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-DPTO | Valor en catálogo | Carga Municipio dinámicamente al seleccionar. |
|  | FLD-011 | SCR-001 | S2 Datos del Consumidor Financiero | 8 | Municipio | municipio | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-MPIO | Pertenece al Departamento seleccionado | Habilitado solo cuando Departamento está seleccionado. Si se cambia dpto., se limpia. |
|  | FLD-012 | SCR-001 | S3 Clasificación y Datos de la Queja | 1 | Asunto / Resumen | resumen | Texto | Texto | Sí | Sí | No | — | Usuario |  | Máx 500 car. Sin caracteres no SFC |  |
|  | FLD-013 | SCR-001 | S3 Clasificación y Datos de la Queja | 2 | Descripción de la Queja | textoQueja | Texto | Área de texto | No | Sí | No | — | Usuario |  | Máx 4000 caracteres |  |
|  | FLD-014 | SCR-001 | S3 Clasificación y Datos de la Queja | 3 | Producto SFC | productoSFC | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-PRODUCTO-SFC | Valor en catálogo SFC | Homologado a catálogo SFC para envío a SmartSupervision. |
|  | FLD-015 | SCR-001 | S3 Clasificación y Datos de la Queja | 4 | Motivo SFC | motivoSFC | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-MOTIVO-SFC | Valor en catálogo SFC | Campo crítico: condiciona campos de fraude en M3. |
|  | FLD-016 | SCR-001 | S3 Clasificación y Datos de la Queja | 5 | Tipo de Solicitud (Zurich) | tipoSolicitudInterno | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo Zurich | CAT-TIPO-SOL | Valor en catálogo | Solo uso interno. No va a SmartSupervision. |
|  | FLD-017 | SCR-001 | S3 Clasificación y Datos de la Queja | 6 | Instancia de Recepción | instanciaRecepcion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-INSTANCIA | Valor en catálogo |  |
|  | FLD-018 | SCR-001 | S3 Clasificación y Datos de la Queja | 7 | Punto de Recepción | puntoRecepcion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-PUNTO | Valor en catálogo |  |
|  | FLD-019 | SCR-001 | S3 Clasificación y Datos de la Queja | 8 | Admisión | admision | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-ADMISION | Valor en catálogo |  |
|  | FLD-020 | SCR-001 | S3 Clasificación y Datos de la Queja | 9 | Ente de Control | enteControl | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-ENTE | Valor en catálogo |  |
|  | FLD-021 | SCR-001 | S4 Adjuntos | 1 | ¿Incluye Anexos a la Queja? | incluyeAnexos | Booleano | Radio Sí/No | Sí | Sí | No | No | Usuario |  | Sí o No | Indicador regulatorio SFC. Obligatorio. |
|  | FLD-022 | SCR-001 | S4 Adjuntos | 2 | Archivos Adjuntos | adjuntosQueja | Archivo | Archivo (multi) | No | Sí | No | — | Usuario |  | PDF/JPG/PNG. Máx 5 archivos, 5 MB c/u |  |
|  | FLD-030 | SCR-002 | S1 Datos del Caso (solo lectura) | 1 | Número de Caso | idCasoBPM | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-031 | SCR-002 | S1 Datos del Caso (solo lectura) | 2 | Canal de Recepción | canalRecepcion | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-032 | SCR-002 | S1 Datos del Caso (solo lectura) | 3 | SLA Restante (días hábiles) | slaRestante | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — | Semaforizado: verde >5d, amarillo 3-5d, rojo <3d, negro = vencido. |
|  | FLD-033 | SCR-002 | S2 Resumen de Errores | 1 | Total de errores pendientes | contadorErrores | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — | El botón 'Guardar' se habilita cuando llega a 0. |
|  | FLD-034 | SCR-002 | S2 Resumen de Errores | 2 | Panel de errores detectados | panelErrores | Lista de registros | Tabla/Grid | No | No | Sí | — | Sistema (P01-T06) |  | — | Columnas: Campo | Valor rechazado | Mensaje de error | Formato esperado. |
|  | FLD-035 | SCR-002 | S3 Campos con Error | 1 | Campo(s) con error (dinámico) | camposConError | Dinámico | Texto o Lista según campo | Sí | Sí | No | — | Sistema → Usuario |  | Según tipo de campo | El sistema muestra SOLO los campos que fallaron. Resaltados en rojo con mensaje específico. |
|  | FLD-040 | SCR-003 | S1 Panel de Error SmartSupervision | 1 | Código de Error SFC | codigoErrorSFC | Texto | Label/Solo lectura | No | No | Sí | — | API SmartSupervision |  | — | Código HTTP y código funcional devuelto por SmartSupervision. |
|  | FLD-041 | SCR-003 | S1 Panel de Error SmartSupervision | 2 | Campo Afectado | campoAfectado | Texto | Label/Solo lectura | No | No | Sí | — | API SmartSupervision |  | — | Nombre exacto del campo rechazado. |
|  | FLD-042 | SCR-003 | S1 Panel de Error SmartSupervision | 3 | Valor Rechazado | valorRechazado | Texto | Label/Solo lectura | No | No | Sí | — | API SmartSupervision |  | — | El valor que fue enviado y rechazado. |
|  | FLD-043 | SCR-003 | S1 Panel de Error SmartSupervision | 4 | Mensaje de Error SFC | mensajeErrorSFC | Texto | Label/Solo lectura | No | No | Sí | — | API SmartSupervision |  | — | Mensaje literal devuelto por SmartSupervision. |
|  | FLD-044 | SCR-003 | S1 Panel de Error SmartSupervision | 5 | Intento N.° actual (M1/M2) | numerIntentoM1M2 | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-045 | SCR-003 | S1 Panel de Error SmartSupervision | 6 | Fecha/Hora del rechazo | fechaRechazo | Fecha/Hora | Label/Solo lectura | No | No | Sí | — | Sistema |  | — | Timestamp registrado en log. |
|  | FLD-046 | SCR-003 | S2 Campo a Corregir | 1 | Campo específico en corrección | campoCorreccion | Dinámico | Texto o Lista | Sí | Sí | No | — | Sistema → Usuario |  | Según campo | Solo el campo afectado. No el formulario completo. |
|  | FLD-047 | SCR-003 | S2 Campo a Corregir | 2 | Justificación de la corrección | justificacionCorreccion | Texto | Área de texto | No | Sí | No | — | Usuario |  | — | Comentario opcional del gestor. |
|  | FLD-048 | SCR-003 | S3 Historial de Intentos | 1 | Historial de intentos anteriores | historialIntentos | Lista de registros | Tabla/Grid | No | No | Sí | — | Sistema |  | — | Columnas: Intento | Fecha | Campo afectado | Código error. Solo lectura. |
|  | FLD-050 | SCR-004 | S1 Detalle del Error Técnico | 1 | Código HTTP | codigoHTTP | Texto | Label/Solo lectura | No | No | Sí | — | API |  | — | Ej: 401, 500, 503, Timeout. |
|  | FLD-051 | SCR-004 | S1 Detalle del Error Técnico | 2 | Tipo de Error | tipoError | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — | Autenticación / Timeout / Estructura payload / Servidor. |
|  | FLD-052 | SCR-004 | S1 Detalle del Error Técnico | 3 | Mensaje técnico de la API | mensajeTecnicoAPI | Texto | Área de texto | No | No | Sí | — | API |  | — | Stack trace o mensaje técnico completo. |
|  | FLD-053 | SCR-004 | S1 Detalle del Error Técnico | 4 | Endpoint invocado | endpointInvocado | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — | URL del endpoint de la API intermediaria. |
|  | FLD-054 | SCR-004 | S1 Detalle del Error Técnico | 5 | Payload enviado (JSON) | payloadEnviado | Texto | Área de texto | No | No | Sí | — | Sistema |  | — | JSON del payload del intento fallido. |
|  | FLD-055 | SCR-004 | S1 Detalle del Error Técnico | 6 | Número de intento acumulado | numeroIntento | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-056 | SCR-004 | S2 Registro de Corrección Técnica | 1 | Causa Raíz Identificada | causaRaiz | Texto | Área de texto | Sí | Sí | No | — | Analista Técnico |  | Campo no vacío | Descripción técnica de la causa del error. |
|  | FLD-057 | SCR-004 | S2 Registro de Corrección Técnica | 2 | Corrección Aplicada | correccionAplicada | Texto | Área de texto | Sí | Sí | No | — | Analista Técnico |  | Campo no vacío | Acciones técnicas tomadas. |
|  | FLD-058 | SCR-004 | S2 Registro de Corrección Técnica | 3 | ¿Requiere ajuste en payload? | requiereAjustePayload | Booleano | Radio Sí/No | Sí | Sí | No | — | Analista Técnico |  | — |  |
|  | FLD-060 | SCR-005 | S1 Encabezado Estado del Caso | 1 | ID Caso BPM | idCasoBPM | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-061 | SCR-005 | S1 Encabezado Estado del Caso | 2 | Código SFC (Radicado) | codigoSFC | Texto | Label/Solo lectura | No | No | Sí | — | SmartSupervision |  | — | Código 1391... Solo lectura. |
|  | FLD-062 | SCR-005 | S1 Encabezado Estado del Caso | 3 | Estado actual del caso | estadoCaso | Texto | Badge/Estado | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-063 | SCR-005 | S1 Encabezado Estado del Caso | 4 | SLA: Días hábiles restantes | slaRestante | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — | Semaforizado: verde >5d, amarillo 3-5d, rojo <3d, negro = vencido. |
|  | FLD-064 | SCR-005 | S1 Encabezado Estado del Caso | 5 | Fecha límite de respuesta | fechaLimite | Fecha | Label/Solo lectura | No | No | Sí | — | Sistema (P01-T05) |  | — | Calculada en días hábiles Colombia. |
|  | FLD-065 | SCR-005 | S1 Encabezado Estado del Caso | 6 | Responsable actual | responsableActual | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-066 | SCR-005 | S2 Datos del Consumidor | 1 | Nombre del Consumidor | nombreConsumidor | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-067 | SCR-005 | S2 Datos del Consumidor | 2 | Tipo y N.° de Identificación | identificacion | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-068 | SCR-005 | S2 Datos del Consumidor | 3 | Correo Electrónico | correoElectronico | Correo | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-069 | SCR-005 | S2 Datos del Consumidor | 4 | Tipo de Persona | tipoPersona | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-070 | SCR-005 | S3 Clasificación Regulatoria | 1 | Canal de Recepción | canal | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-071 | SCR-005 | S3 Clasificación Regulatoria | 2 | Producto SFC | productoSFC | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-072 | SCR-005 | S3 Clasificación Regulatoria | 3 | Motivo SFC | motivoSFC | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-073 | SCR-005 | S3 Clasificación Regulatoria | 4 | Instancia / Punto de Recepción | instanciaPunto | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-074 | SCR-005 | S3 Clasificación Regulatoria | 5 | Admisión | admision | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-075 | SCR-005 | S3 Clasificación Regulatoria | 6 | Ente de Control | enteControl | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-076 | SCR-005 | S4 Descripción de la Queja | 1 | Asunto de la Queja | resumen | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-077 | SCR-005 | S4 Descripción de la Queja | 2 | Descripción / Texto de la Queja | textoQueja | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-078 | SCR-005 | S4 Descripción de la Queja | 3 | Adjuntos del cliente | adjuntosCliente | Archivo | Lista de adjuntos | No | No | Sí | — | Caso |  | — | Solo visualización y descarga. |
|  | FLD-079 | SCR-005 | S5 Estado SmartSupervision | 1 | Estado SmartSupervision | estadoSS | Texto | Badge/Estado | No | No | Sí | — | Sistema |  | — | Pendiente / Radicado (201) / Rechazado (400) / Cerrado (200). |
|  | FLD-080 | SCR-005 | S5 Estado SmartSupervision | 2 | Intentos M1/M2 | intentosM1M2 | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-081 | SCR-005 | S5 Estado SmartSupervision | 3 | Fecha/Hora radicación SFC | fechaRadicacion | Fecha/Hora | Label/Solo lectura | No | No | Sí | — | Sistema |  | — | Timestamp del HTTP 201 exitoso. |
|  | FLD-082 | SCR-005 | S6 Asignación de Responsable | 1 | Área responsable | areaResponsable | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo Zurich | CAT-AREA | Valor en catálogo | Áreas habilitadas para quejas. |
|  | FLD-083 | SCR-005 | S6 Asignación de Responsable | 2 | Usuario responsable | usuarioResponsable | Catálogo | Lista desplegable filtrada | Sí | Sí | No | — | Sistema (usuarios BPM) | CAT-USUARIOS-ROLE | Filtrado por área y rol autorizado | Solo usuarios autorizados para gestionar quejas. |
|  | FLD-084 | SCR-005 | S6 Asignación de Responsable | 3 | Observaciones de asignación | observacionesAsignacion | Texto | Área de texto | No | Sí | No | — | Usuario |  | — |  |
|  | FLD-090 | SCR-006 | S1 Datos de Reasignación | 1 | Responsable actual | responsableActual | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-091 | SCR-006 | S1 Datos de Reasignación | 2 | Área destino | areaDestino | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo Zurich | CAT-AREA | Valor en catálogo |  |
|  | FLD-092 | SCR-006 | S1 Datos de Reasignación | 3 | Nuevo responsable | nuevoResponsable | Catálogo | Lista desplegable filtrada | Sí | Sí | No | — | Sistema (BPM) | CAT-USUARIOS-ROLE | Solo usuarios autorizados | Filtrado por área y rol. Prohibida asignación a usuarios fuera del proceso. |
|  | FLD-093 | SCR-006 | S1 Datos de Reasignación | 4 | Motivo de reasignación | motivoReasignacion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo Zurich | CAT-MOTIVO-REASIG | Valor en catálogo |  |
|  | FLD-094 | SCR-006 | S1 Datos de Reasignación | 5 | Observaciones (justificación) | observacionesReasignacion | Texto | Área de texto | Sí | Sí | No | — | Usuario |  | Campo no vacío | Obligatorio. Queda en historial para auditoría. |
|  | FLD-095 | SCR-006 | S2 Historial de Asignaciones | 1 | Historial de asignaciones previas | historialAsignaciones | Lista de registros | Tabla/Grid | No | No | Sí | — | Sistema |  | — | Columnas: Fecha | De | Para | Motivo. Solo lectura. |
|  | FLD-100 | SCR-007 | S1 Datos del Caso (solo lectura) | 1 | ID Caso / Código SFC | idCasoSFC | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-101 | SCR-007 | S1 Datos del Caso (solo lectura) | 2 | SLA: Días hábiles restantes | slaRestante | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — | Semaforizado. |
|  | FLD-102 | SCR-007 | S1 Datos del Caso (solo lectura) | 3 | Estado del caso | estadoCaso | Texto | Badge/Estado | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-103 | SCR-007 | S1 Datos del Caso (solo lectura) | 4 | Producto SFC / Motivo SFC | productoMotivo | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-104 | SCR-007 | S1 Datos del Caso (solo lectura) | 5 | Nombre del Consumidor | nombreConsumidor | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-105 | SCR-007 | S1 Datos del Caso (solo lectura) | 6 | Texto de la queja | textoQueja | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-106 | SCR-007 | S2 Observaciones SAC (visible si es ajuste) | 1 | Observaciones del Analista SAC | observacionesSAC | Texto | Label/Solo lectura | No | No | Sí | — | SAC (SP2-T04) |  | — | Visible solo cuando fue devuelto por SAC. |
|  | FLD-107 | SCR-007 | S2 Observaciones SAC (visible si es ajuste) | 2 | Versión de revisión actual | versionRevision | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — | Revisión 1, 2... |
|  | FLD-108 | SCR-007 | S3 Elaboración de Respuesta Técnica | 1 | Causa Raíz Identificada | causaRaiz | Texto | Área de texto | Sí | Sí | No | — | Usuario |  | Campo no vacío |  |
|  | FLD-109 | SCR-007 | S3 Elaboración de Respuesta Técnica | 2 | Posición de Zurich | posicionZurich | Texto | Área de texto | Sí | Sí | No | — | Usuario |  | Campo no vacío |  |
|  | FLD-110 | SCR-007 | S3 Elaboración de Respuesta Técnica | 3 | Respuesta al Cliente (borrador) | respuestaCliente | Texto | Área de texto | Sí | Sí | No | — | Usuario |  | Campo no vacío | Este texto irá en la carta PDF de respuesta final. |
|  | FLD-111 | SCR-007 | S3 Elaboración de Respuesta Técnica | 4 | Acciones Tomadas | accionesTomadas | Texto | Área de texto | No | Sí | No | — | Usuario |  | — |  |
|  | FLD-112 | SCR-007 | S3 Elaboración de Respuesta Técnica | 5 | ¿Reconocimiento al cliente? | reconocimiento | Booleano | Radio Sí/No | Sí | Sí | No | — | Usuario |  | — |  |
|  | FLD-113 | SCR-007 | S4 Soportes Internos | 1 | Adjuntos internos de soporte | adjuntosSoporte | Archivo | Archivo (multi) | No | Sí | No | — | Usuario |  | Máx 10 archivos | No van al cliente ni a SFC. Solo uso interno. |
|  | FLD-120 | SCR-008 | S1 Contexto del Caso | 1 | ID Caso / Código SFC | idCasoSFC | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-121 | SCR-008 | S1 Contexto del Caso | 2 | SLA: Días hábiles restantes | slaRestante | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-122 | SCR-008 | S1 Contexto del Caso | 3 | Versión bajo revisión | versionRevision | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-123 | SCR-008 | S1 Contexto del Caso | 4 | Área Responsable | areaResponsable | Texto | Label/Solo lectura | No | No | Sí | — | Caso |  | — |  |
|  | FLD-124 | SCR-008 | S1 Contexto del Caso | 5 | Fecha de elaboración del borrador | fechaElaboracion | Fecha/Hora | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-125 | SCR-008 | S2 Respuesta del Área (solo lectura) | 1 | Causa Raíz | causaRaiz | Texto | Label/Solo lectura | No | No | Sí | — | Área (PAN-07) |  | — |  |
|  | FLD-126 | SCR-008 | S2 Respuesta del Área (solo lectura) | 2 | Posición de Zurich | posicionZurich | Texto | Label/Solo lectura | No | No | Sí | — | Área (PAN-07) |  | — |  |
|  | FLD-127 | SCR-008 | S2 Respuesta del Área (solo lectura) | 3 | Respuesta al Cliente | respuestaCliente | Texto | Label/Solo lectura | No | No | Sí | — | Área (PAN-07) |  | — |  |
|  | FLD-128 | SCR-008 | S2 Respuesta del Área (solo lectura) | 4 | Acciones Tomadas | accionesTomadas | Texto | Label/Solo lectura | No | No | Sí | — | Área (PAN-07) |  | — |  |
|  | FLD-129 | SCR-008 | S2 Respuesta del Área (solo lectura) | 5 | ¿Reconocimiento al cliente? | reconocimiento | Texto | Label/Solo lectura | No | No | Sí | — | Área (PAN-07) |  | — |  |
|  | FLD-130 | SCR-008 | S2 Respuesta del Área (solo lectura) | 6 | Soportes internos adjuntos | adjuntosSoporte | Archivo | Lista de adjuntos | No | No | Sí | — | Área (PAN-07) |  | — | Solo visualización. |
|  | FLD-131 | SCR-008 | S3 Decisión del Analista SAC | 1 | Observaciones SAC | observacionesSAC | Texto | Área de texto | Cond. | Sí | No | — | Analista SAC |  | Obligatorio si devuelve | Obligatorio al devolver. Opcional al aprobar. |
|  | FLD-140 | SCR-009 | S1 Datos Precargados M1 (solo lectura) | 1 | Código SFC | codigoSFC | Texto | Label/Solo lectura | No | No | Sí | — | SmartSupervision |  | — |  |
|  | FLD-141 | SCR-009 | S1 Datos Precargados M1 (solo lectura) | 2 | Canal (precargado M1) | canal | Texto | Label/Solo lectura | No | No | Sí | — | Caso M1 |  | — | No editable. Precargado desde Momento 1. |
|  | FLD-142 | SCR-009 | S1 Datos Precargados M1 (solo lectura) | 3 | Producto (precargado M1) | productoSFC | Texto | Label/Solo lectura | No | No | Sí | — | Caso M1 |  | — | No editable. |
|  | FLD-143 | SCR-009 | S1 Datos Precargados M1 (solo lectura) | 4 | Motivo (precargado M1) | motivoSFC | Texto | Label/Solo lectura | No | No | Sí | — | Caso M1 |  | — | No editable. |
|  | FLD-144 | SCR-009 | S1 Datos Precargados M1 (solo lectura) | 5 | Admisión (precargado M1) | admision | Texto | Label/Solo lectura | No | No | Sí | — | Caso M1 |  | — | No editable. |
|  | FLD-145 | SCR-009 | S1 Datos Precargados M1 (solo lectura) | 6 | Ente de Control (precargado M1) | enteControl | Texto | Label/Solo lectura | No | No | Sí | — | Caso M1 |  | — | No editable. |
|  | FLD-146 | SCR-009 | S2 Datos del Consumidor — Campos SFC | 1 | Sexo | sexo | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-SEXO | Valor en catálogo |  |
|  | FLD-147 | SCR-009 | S2 Datos del Consumidor — Campos SFC | 2 | LGBTIQ+ | lgbtiq | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-LGBTIQ | Valor en catálogo | ⚠ Catálogo pendiente confirmación con TI (CE 019/2024). |
|  | FLD-148 | SCR-009 | S2 Datos del Consumidor — Campos SFC | 3 | Condición Especial | condicionEspecial | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-COND-ESP | Valor en catálogo |  |
|  | FLD-149 | SCR-009 | S2 Datos del Consumidor — Campos SFC | 4 | Producto Digital | productoDigital | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-PROD-DIGITAL | Valor en catálogo |  |
|  | FLD-150 | SCR-009 | S3 Condición de la Queja | 1 | Estado de la Queja o Reclamo | estadoQueja | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-ESTADO-QUEJA | Valor en catálogo |  |
|  | FLD-151 | SCR-009 | S3 Condición de la Queja | 2 | Favorabilidad | favorabilidad | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-FAVORAB | Valor en catálogo | A favor cliente / A favor entidad / Parcial. |
|  | FLD-152 | SCR-009 | S3 Condición de la Queja | 3 | Aceptación | aceptacion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-ACEPTACION | Valor en catálogo |  |
|  | FLD-153 | SCR-009 | S3 Condición de la Queja | 4 | Rectificación | rectificacion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-RECTIF | Valor en catálogo |  |
|  | FLD-154 | SCR-009 | S3 Condición de la Queja | 5 | Desistimiento | desistimiento | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-DESIST | Valor en catálogo |  |
|  | FLD-155 | SCR-009 | S3 Condición de la Queja | 6 | Tutela | tutela | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-TUTELA | Valor en catálogo |  |
|  | FLD-156 | SCR-009 | S3 Condición de la Queja | 7 | Marcación | marcacion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-MARCACION | Valor en catálogo |  |
|  | FLD-157 | SCR-009 | S3 Condición de la Queja | 8 | Queja Exprés | quejaExpres | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-EXPRES | Valor en catálogo |  |
|  | FLD-158 | SCR-009 | S4 Datos de Fraude CE-019-2024 (condicional) | 1 | ¿Relacionada con Fraude? | relacionadaFraude | Booleano | Radio Sí/No | Sí | Sí | No | No | Usuario |  | — | Si Sí, habilita campos FLD-159 a FLD-162. |
|  | FLD-159 | SCR-009 | S4 Datos de Fraude CE-019-2024 (condicional) | 2 | Tipo de Fraude | tipoFraude | Catálogo | Lista desplegable | Cond. | Sí | No | — | Catálogo SFC | CAT-TIPO-FRAUDE | Obligatorio si relacionadaFraude=Sí | CE 019/2024. Desde 1 jul 2025. |
|  | FLD-160 | SCR-009 | S4 Datos de Fraude CE-019-2024 (condicional) | 3 | Modalidad de Fraude | modalidadFraude | Catálogo | Lista desplegable | Cond. | Sí | No | — | Catálogo SFC | CAT-MOD-FRAUDE | Obligatorio si relacionadaFraude=Sí | CE 019/2024. |
|  | FLD-161 | SCR-009 | S4 Datos de Fraude CE-019-2024 (condicional) | 4 | Monto Reclamado (COP) | montoReclamado | Moneda | Número | Cond. | Sí | No | — | Usuario |  | Obligatorio si relacionadaFraude=Sí | CE 019/2024. |
|  | FLD-162 | SCR-009 | S4 Datos de Fraude CE-019-2024 (condicional) | 5 | Monto Reconocido (COP) | montoReconocido | Moneda | Número | Cond. | Sí | No | — | Usuario |  | Obligatorio si relacionadaFraude=Sí | CE 019/2024. |
|  | FLD-163 | SCR-009 | S5 Anexos del Formulario | 1 | ¿Incluye Anexos a la Queja? | incluyeAnexosQueja | Booleano | Radio Sí/No | Sí | Sí | No | — | Usuario |  | — | Indicador regulatorio SFC. |
|  | FLD-164 | SCR-009 | S5 Anexos del Formulario | 2 | ¿Incluye Adjunto Respuesta Final? | incluyeAdjuntoRespuesta | Booleano | Radio Sí/No | Sí | Sí | No | Sí | Usuario |  | — | Debe ser Sí cuando PDF está adjunto. |
|  | FLD-165 | SCR-009 | S5 Anexos del Formulario | 3 | PDF Respuesta Final (generado) | pdfRespuestaFinal | Archivo | Label/Solo lectura + descarga | No | No | Sí | — | Sistema (SP2-T06) |  | — | Generado por SP2-T06. Solo descarga. |
|  | FLD-166 | SCR-009 | S5 Anexos del Formulario | 4 | Prórroga (días, si aplica) | diasProrroga | Número | Número | No | Sí | No | 0 | Usuario |  | — | Solo cuando viene de SP4. |
|  | FLD-170 | SCR-010 | S1 Estado del Cierre SmartSupervision | 1 | Estado del cierre M3 | estadoCierreM3 | Texto | Badge/Estado | No | No | Sí | — | Sistema |  | — | Pendiente / Enviando / Rechazado (400) / Aceptado (200). |
|  | FLD-171 | SCR-010 | S1 Estado del Cierre SmartSupervision | 2 | Intentos cierre M3 | intentosCierreM3 | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-172 | SCR-010 | S1 Estado del Cierre SmartSupervision | 3 | Último error (si aplica) | ultimoError | Texto | Panel de error | No | No | Sí | — | API SmartSupervision |  | — | Mensaje y campo del último rechazo. |
|  | FLD-173 | SCR-010 | S2 Datos del Cierre | 1 | Código SFC | codigoSFC | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-174 | SCR-010 | S2 Datos del Cierre | 2 | Estado de la Queja | estadoQueja | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-ESTADO-QUEJA | Valor en catálogo |  |
|  | FLD-175 | SCR-010 | S2 Datos del Cierre | 3 | Fecha de Actualización | fechaActualizacion | Fecha | Calendario | Sí | Sí | No | — | Usuario |  | ⚠ DEBE = fechaCierre (validación en tiempo real) | RUL-10-01 CRÍTICO: bloquea botón si no coincide con fechaCierre. |
|  | FLD-176 | SCR-010 | S2 Datos del Cierre | 4 | Fecha de Cierre | fechaCierre | Fecha | Calendario | Sí | Sí | No | — | Usuario |  | ⚠ DEBE = fechaActualizacion (validación en tiempo real) | RUL-10-01 CRÍTICO. |
|  | FLD-177 | SCR-010 | S2 Datos del Cierre | 5 | Favorabilidad | favorabilidad | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC / PAN-09 | CAT-FAVORAB | Valor en catálogo | Precargado de PAN-09. Editable si hubo error. |
|  | FLD-178 | SCR-010 | S2 Datos del Cierre | 6 | Aceptación | aceptacion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC / PAN-09 | CAT-ACEPTACION | Valor en catálogo | Precargado de PAN-09. |
|  | FLD-179 | SCR-010 | S2 Datos del Cierre | 7 | Marcación | marcacion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC / PAN-09 | CAT-MARCACION | Valor en catálogo |  |
|  | FLD-180 | SCR-010 | S2 Datos del Cierre | 8 | Queja Exprés | quejaExpres | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC / PAN-09 | CAT-EXPRES | Valor en catálogo |  |
|  | FLD-181 | SCR-010 | S3 PDF de Respuesta Final | 1 | PDF Respuesta Final | pdfRespuestaFinal | Archivo | Archivo + Validación automática | Sí | Sí | No | — | Sistema (SP2-T06) / Usuario |  | ⚠ Nomenclatura: NombreCliente_NumId_RESP_FINAL_SFC_N. Solo PDF. | RUL-10-02: sistema valida nombre y tipo. Bloquea si no cumple. |
|  | FLD-182 | SCR-010 | S3 PDF de Respuesta Final | 2 | Resultado validación nomenclatura | validacionNomenclatura | Texto | Label estado validación | No | No | Sí | — | Sistema |  | — | ✓ Nomenclatura correcta / ✗ Error específico. |
|  | FLD-183 | SCR-010 | S3 PDF de Respuesta Final | 3 | ¿Adjunto a la respuesta final? | adjuntoRespuestaFinal | Booleano | Radio Sí/No | Sí | Sí | No | Sí | Usuario |  | — |  |
|  | FLD-184 | SCR-010 | S4 Campos Fraude CE-019-2024 (solo lectura) | 1 | ¿Relacionada con fraude? | relacionadaFraude | Texto | Label/Solo lectura | No | No | Sí | — | PAN-09 |  | — | Precargado. |
|  | FLD-185 | SCR-010 | S4 Campos Fraude CE-019-2024 (solo lectura) | 2 | Tipo de Fraude (si aplica) | tipoFraude | Texto | Label/Solo lectura | No | No | Sí | — | PAN-09 |  | — |  |
|  | FLD-186 | SCR-010 | S4 Campos Fraude CE-019-2024 (solo lectura) | 3 | Monto Reclamado (si aplica) | montoReclamado | Moneda | Label/Solo lectura | No | No | Sí | — | PAN-09 |  | — |  |
|  | FLD-187 | SCR-010 | S4 Campos Fraude CE-019-2024 (solo lectura) | 4 | Monto Reconocido (si aplica) | montoReconocido | Moneda | Label/Solo lectura | No | No | Sí | — | PAN-09 |  | — |  |
|  | FLD-190 | SCR-011 | S1 Detalle del Error Técnico — Prórroga | 1 | Código HTTP prórroga | codigoHTTPProrroga | Texto | Label/Solo lectura | No | No | Sí | — | API |  | — |  |
|  | FLD-191 | SCR-011 | S1 Detalle del Error Técnico — Prórroga | 2 | Tipo de Error | tipoErrorProrroga | Texto | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-192 | SCR-011 | S1 Detalle del Error Técnico — Prórroga | 3 | Mensaje técnico de la API | mensajeTecnicoProrroga | Texto | Área de texto | No | No | Sí | — | API |  | — |  |
|  | FLD-193 | SCR-011 | S1 Detalle del Error Técnico — Prórroga | 4 | Payload de prórroga enviado | payloadProrroga | Texto | Área de texto | No | No | Sí | — | Sistema |  | — | JSON del payload enviado. |
|  | FLD-194 | SCR-011 | S1 Detalle del Error Técnico — Prórroga | 5 | Número de intento prórroga | intentoProrroga | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-195 | SCR-011 | S2 Registro de Corrección — Prórroga | 1 | Causa Raíz | causaRaizProrroga | Texto | Área de texto | Sí | Sí | No | — | Analista Técnico |  | Campo no vacío |  |
|  | FLD-196 | SCR-011 | S2 Registro de Corrección — Prórroga | 2 | Corrección Aplicada | correccionProrroga | Texto | Área de texto | Sí | Sí | No | — | Analista Técnico |  | Campo no vacío |  |
|  | FLD-200 | SCR-012 | S1 Panel de Error — Prórroga | 1 | Código de Error SFC Prórroga | codigoErrorProrroga | Texto | Label/Solo lectura | No | No | Sí | — | API |  | — |  |
|  | FLD-201 | SCR-012 | S1 Panel de Error — Prórroga | 2 | Campo Afectado | campoAfectadoProrroga | Texto | Label/Solo lectura | No | No | Sí | — | API |  | — |  |
|  | FLD-202 | SCR-012 | S1 Panel de Error — Prórroga | 3 | Mensaje de Error SFC | mensajeErrorProrroga | Texto | Label/Solo lectura | No | No | Sí | — | API |  | — |  |
|  | FLD-203 | SCR-012 | S1 Panel de Error — Prórroga | 4 | Intento N.° actual | intentoActualProrroga | Número | Label/Solo lectura | No | No | Sí | — | Sistema |  | — |  |
|  | FLD-204 | SCR-012 | S2 Campos de Prórroga a Corregir | 1 | Motivo de Prórroga | motivoProrroga | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-MOTIVO-PRORR | Valor en catálogo SFC | Motivo aceptado por SmartSupervision. |
|  | FLD-205 | SCR-012 | S2 Campos de Prórroga a Corregir | 2 | Nueva Fecha Límite | nuevaFechaLimite | Fecha | Calendario | Sí | Sí | No | — | Usuario |  | Fecha > fecha actual | Nueva fecha de respuesta solicitada. |
|  | FLD-206 | SCR-012 | S2 Campos de Prórroga a Corregir | 3 | Contador de Prórroga | contadorProrroga | Número | Número | Sí | Sí | No | — | Sistema/Usuario |  | Validar contra catálogo SFC | N.° de prórroga (1, 2...). |
|  | FLD-207 | SCR-012 | S2 Campos de Prórroga a Corregir | 4 | Justificación | justificacionProrroga | Texto | Área de texto | Sí | Sí | No | — | Usuario |  | Campo no vacío | Justificación de la necesidad de prórroga. |
|  | FLD-300 | SCR-000 | S1 Tipo de Solicitud y Rol | 1 | Número de Caso (ID BPM) | idCasoBPM | Texto | Label/Solo lectura | No | No | Sí | [Auto] | Sistema BPM |  | — | Se asigna automáticamente por el sistema al radicar. |
|  | FLD-301 | SCR-000 | S1 Tipo de Solicitud y Rol | 2 | Fecha y Hora de Creación | fechaCreacion | Fecha/Hora | Label/Solo lectura | No | No | Sí | [Auto] | Sistema BPM |  | — | Timestamp automático del sistema. |
|  | FLD-302 | SCR-000 | S1 Tipo de Solicitud y Rol | 3 | ¿A qué está asociado tu comentario? | tipoSolicitud | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo Zurich | CAT-TIPO-SOLIC-PQRS | Valor en catálogo (Lista #2) | Solicitud, Felicitación, Queja, Sugerencia, Derecho de petición. |
|  | FLD-303 | SCR-000 | S1 Tipo de Solicitud y Rol | 4 | Selecciona tu rol | rolRadicador | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo Zurich | CAT-ROL-RADICADOR | Valor en catálogo | Cliente / Intermediario / Empleado Zurich / Defensor del Consumidor. Determina instancia y punto de recepción. |
|  | FLD-304 | SCR-000 | S1 Tipo de Solicitud y Rol | 5 | Punto de Recepción | puntoRecepcion | Catálogo | Label/Solo lectura | Sí | No | Sí | — | Catálogo SFC | CAT-PUNTO | Valor en catálogo (Lista #1) | Campo back. Se asigna automáticamente según el canal/rol. Obligatorio SFC. |
|  | FLD-305 | SCR-000 | S1 Tipo de Solicitud y Rol | 6 | Instancia de Recepción | instanciaRecepcion | Catálogo | Label/Solo lectura | Sí | No | Sí | — | Catálogo SFC | CAT-INSTANCIA | Valor en catálogo (Lista #5) | Back. = "Entidad vigilada" si rol Cliente/Intermediario/Empleado; = "Defensor del consumidor" si rol Defensor. |
|  | FLD-306 | SCR-000 | S2 Datos del Consumidor Financiero | 1 | Selecciona tu tipo de identificación | tipoIdentificacion | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-TIPO-ID | Valor en catálogo (Lista #3) | RC, TI, CC, CE, PA, PPT (Natural) / NIT (Jurídica). Define el tipo de persona. |
|  | FLD-307 | SCR-000 | S2 Datos del Consumidor Financiero | 2 | Número de identificación | numeroIdentificacion | Alfanumérico | Texto | Sí | Sí | No | — | Usuario |  | Solo números, o números y letras según tipo de documento | Validación según el tipo de documento seleccionado. |
|  | FLD-308 | SCR-000 | S2 Datos del Consumidor Financiero | 3 | ¿Cuáles son tus nombres? | nombres | Alfanumérico | Texto | Sí | Sí | No | — | Usuario |  | Solo permite letras | Aparece si el tipo de documento corresponde a Persona Natural. |
|  | FLD-309 | SCR-000 | S2 Datos del Consumidor Financiero | 4 | ¿Cuáles son tus apellidos? | apellidos | Alfanumérico | Texto | Sí | Sí | No | — | Usuario |  | Solo permite letras | Aparece si el tipo de documento corresponde a Persona Natural. |
|  | FLD-310 | SCR-000 | S2 Datos del Consumidor Financiero | 5 | Razón social | razonSocial | Alfanumérico | Texto | Sí | Sí | No | — | Usuario |  | Solo permite letras | Aparece si el tipo de documento = NIT (Persona Jurídica). |
|  | FLD-311 | SCR-000 | S2 Datos del Consumidor Financiero | 6 | Nombres de la persona de contacto | nombresContacto | Alfanumérico | Texto | Sí | Sí | No | — | Usuario |  | Solo permite letras | Aparece si Persona Jurídica. |
|  | FLD-312 | SCR-000 | S2 Datos del Consumidor Financiero | 7 | Apellidos de la persona de contacto | apellidosContacto | Alfanumérico | Texto | Sí | Sí | No | — | Usuario |  | Solo permite letras | Aparece si Persona Jurídica. |
|  | FLD-313 | SCR-000 | S2 Datos del Consumidor Financiero | 8 | Celular | telefono | Numérico | Texto | Sí | Sí | No | — | Usuario |  | Solo 10 dígitos, sin espacios ni caracteres especiales | Teléfono de contacto. |
|  | FLD-314 | SCR-000 | S2 Datos del Consumidor Financiero | 9 | Correo electrónico | correoElectronico | Correo | Correo | Sí | Sí | No | — | Usuario |  | Validar formato de correo electrónico | Destino del correo de respuesta final. |
|  | FLD-315 | SCR-000 | S2 Datos del Consumidor Financiero | 10 | Tipo de persona | tipoPersona | Catálogo | Label/Solo lectura | Sí | No | Sí | — | Catálogo SFC | CAT-TIPO-PERSONA | Asignado automáticamente según tipo de documento (Lista #1) | Back. Natural / Jurídica. |
|  | FLD-316 | SCR-000 | S2 Datos del Consumidor Financiero | 11 | País | codigoPais | Catálogo | Lista desplegable | Sí | No | Sí | 170 — Colombia | Catálogo SFC | CAT-PAIS | Valor en catálogo | El sistema deja por defecto "Colombia". |
|  | FLD-317 | SCR-000 | S2 Datos del Consumidor Financiero | 12 | Departamento | departamento | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-DPTO | Valor en catálogo (Divipola) | Carga la Ciudad dinámicamente al seleccionar. |
|  | FLD-318 | SCR-000 | S2 Datos del Consumidor Financiero | 13 | Ciudad | municipio | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-MPIO | Pertenece al Departamento seleccionado (Divipola) | Habilitado solo cuando el Departamento está seleccionado. |
|  | FLD-319 | SCR-000 | S2 Datos del Consumidor Financiero | 14 | Dirección | direccion | Alfanumérico | Label/Solo lectura | Sí | No | Sí | vacío | Sistema |  | Enviar por default "vacío" | Back. Pendiente confirmar con API SFC. |
|  | FLD-320 | SCR-000 | S2 Datos del Consumidor Financiero | 15 | Sexo | sexo | Catálogo | Label/Solo lectura | Sí | No | Sí | No aplica | Catálogo SFC | CAT-SEXO | Enviar por default "No aplica" | Back. Pendiente confirmar con API SFC. |
|  | FLD-321 | SCR-000 | S2 Datos del Consumidor Financiero | 16 | LGBTIQ+ | lgbtiq | Catálogo | Label/Solo lectura | Sí | No | Sí | No aplica | Catálogo SFC | CAT-LGBTIQ | Enviar por default "No aplica" | ⚠ Back. Catálogo pendiente confirmar con TI antes de implementar. |
|  | FLD-322 | SCR-000 | S2 Datos del Consumidor Financiero | 17 | Condición especial | condicionEspecial | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-COND-ESP | Valor en catálogo | Pendiente confirmar lista con TI/SFC. |
|  | FLD-323 | SCR-000 | S3 Detalle de la Queja | 1 | Selecciona el seguro | productoSFC | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-PRODUCTO-SFC | Valor en catálogo SFC | Se realiza homologación entre la lista del Front y lo enviado a SFC. |
|  | FLD-324 | SCR-000 | S3 Detalle de la Queja | 2 | Detalle del producto | detalleProducto | Catálogo | Label/Solo lectura | Sí | No | Sí | — | Catálogo SFC | CAT-DETALLE-PRODUCTO | Valor en catálogo | Back. Pendiente confirmar lista. |
|  | FLD-325 | SCR-000 | S3 Detalle de la Queja | 3 | ¿Ya había radicado previamente la misma queja o es una reconsideración? | replica | Booleano | Radio Sí/No | Sí | Sí | No | — | Usuario |  | Sí / No | Campo Réplica SFC. |
|  | FLD-326 | SCR-000 | S3 Detalle de la Queja | 4 | Argumento de la réplica | argumentoReplica | Texto | Área de texto | No | Sí | No | — | Usuario |  | Texto largo | Visible si Réplica = Sí. Pendiente confirmar (back/condicional). |
|  | FLD-327 | SCR-000 | S3 Detalle de la Queja | 5 | Escalamiento al Defensor del Consumidor Financiero | escalamientoDefensor | Catálogo | Label/Solo lectura | Sí | No | Sí | No | Sistema |  | Si Instancia = Defensor → "Sí"; de lo contrario "No" | Back. Derivado del rol/instancia. |
|  | FLD-328 | SCR-000 | S3 Detalle de la Queja | 6 | Cuéntanos el motivo | motivoSFC | Catálogo | Lista desplegable | Sí | Sí | No | — | Catálogo SFC | CAT-MOTIVO-SFC | Valor en catálogo (Motivos SFC) | Campo crítico: condiciona campos de fraude en M3. |
|  | FLD-329 | SCR-000 | S3 Detalle de la Queja | 7 | Ingresa el detalle | textoQueja | Texto | Área de texto | Sí | Sí | No | — | Usuario |  | Mínimo 50, máximo 2000 caracteres | Descripción de la queja o reclamo. |
|  | FLD-330 | SCR-000 | S3 Detalle de la Queja | 8 | Ingresa archivos adjuntos | anexos | Archivo (multi) | Archivo | Sí | Sí | No | — | Usuario |  | Extensiones pdf, jpg, png, docx. Máx 5 MB por archivo | Anexos de la queja o reclamo. |
|  | FLD-331 | SCR-000 | S3 Detalle de la Queja | 9 | Admisión | admision | Catálogo | Label/Solo lectura | Sí | No | Sí | No aplica | Catálogo SFC | CAT-ADMISION | Valor en catálogo (Lista #4) | Back. Si el rol = Defensor del Consumidor es editable; si no, default "No aplica". |
|  | FLD-332 | SCR-000 | S3 Detalle de la Queja | 10 | Ente de control | enteControl | Catálogo | Label/Solo lectura | Sí | No | Sí | Otros | Catálogo SFC | CAT-ENTE | Valor en catálogo | Back. Por default "Otros". |
|  | FLD-333 | SCR-000 | S3 Detalle de la Queja | 11 | Tutela | tutela | Catálogo | Label/Solo lectura | Sí | No | Sí | No | Catálogo SFC | CAT-TUTELA | Valor en catálogo | Back. Por default "No". |
|  | FLD-334 | SCR-000 | S3 Detalle de la Queja | 12 | Queja Exprés | quejaExpres | Catálogo | Label/Solo lectura | Sí | No | Sí | — | Catálogo SFC | CAT-EXPRES | Valor en catálogo | Back. Revisar tabla para definir Sí/No — confirmar con SFC. |
|  | FLD-335 | SCR-000 | S4 Autorización y Envío | 1 | Autorización de tratamiento de datos | autorizacionDatos | Booleano | Checkbox | Sí | Sí | No | — | Usuario |  | Debe aceptarse para continuar | El usuario debe aceptar el tratamiento de datos personales. |
|  | FLD-336 | SCR-000 | S4 Autorización y Envío | 2 | Captcha | captcha | Validación | Captcha | Sí | Sí | No | — | Sistema |  | Validación de usuario | Para evitar envíos automatizados. |
|  | FLD-337 | SCR-000 | S4 Autorización y Envío | 3 | ¿Quieres enviar copia de la respuesta a otro correo electrónico? | correoCopia | Correo | Correo | No | Sí | No | — | Usuario |  | Formato de correo electrónico (opcional) | Correo adicional para recibir copia de la respuesta. |
|  | FLD-338 | SCR-000 | S5 Estado ante la SFC | 1 | Estado SmartSupervision | estadoSmartSupervision | Texto | Label/Semáforo | No | No | Sí | — | Sistema/API |  | — | Color tipo semáforo (verde/amarillo/rojo) según el estado ante la SFC. |
|  | FLD-339 | SCR-000 | S5 Estado ante la SFC | 2 | Fecha y hora radicación SFC | fechaRadicacionSFC | Fecha/Hora | Label/Solo lectura | No | No | Sí | [Auto] | API SFC |  | — | No es necesario mostrarla al usuario; se usa para reportes. |
|  | FLD-340 | SCR-000 | S6 Responsable Asignado | 1 | Rol (Grupo) | rolResponsable | Texto | Label/Solo lectura | No | No | Sí | — | Sistema BPM |  | — | Grupo de rol al que pertenece el responsable. |
|  | FLD-341 | SCR-000 | S6 Responsable Asignado | 2 | Responsable | responsable | Texto | Label/Solo lectura | No | No | Sí | — | Sistema BPM |  | — | Nombres y apellidos del responsable asignado. |
## Sheet: 04_Acciones
|  | ACCIONES Y BOTONES |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | ID Acción | SCR | Etiqueta | Tipo / Estilo | Condición de habilitación | Descripción / Resultado | Siguiente Paso BPMN | Regla Asociada |
|  | ACT-001-01 | SCR-001 | Crear Queja | Primaria | Todos los campos obligatorios válidos | Ejecuta P01-T06 validación preventiva. Si OK → crea caso y activa SP1. Si error → resalta campos. | P01-T06 validación → SP1 radicación | — |
|  | ACT-001-02 | SCR-001 | Guardar Borrador | Secundaria | Siempre | Guarda el formulario sin crear caso ni ejecutar validación completa. | P01-T06 validación → SP1 radicación | — |
|  | ACT-001-03 | SCR-001 | Cancelar | Destructiva | Siempre | Descarta el formulario sin guardar cambios. | P01-T06 validación → SP1 radicación | — |
|  | ACT-002-01 | SCR-002 | Guardar Correcciones | Primaria | Solo cuando contadorErrores = 0 | Re-ejecuta P01-T06. Si OK → habilita SP1. | Re-ejecuta P01-T06 → SP1 | — |
|  | ACT-002-02 | SCR-002 | Cancelar Corrección | Secundaria | Siempre | Devuelve el caso a estado 'Pendiente corrección'. | Re-ejecuta P01-T06 → SP1 | — |
|  | ACT-003-01 | SCR-003 | Corregir y Reenviar | Primaria | Campo afectado fue modificado | Guarda y ejecuta SP1-T02 para reenvío M2. | SP1-T02 reenvío M2 | — |
|  | ACT-003-02 | SCR-003 | Escalar a Soporte Técnico | Secundaria | Siempre | Envía a Analista Técnico si el error requiere intervención técnica. | SP1-T02 reenvío M2 | — |
|  | ACT-003-03 | SCR-003 | Ver Log Completo | Link | Siempre | Abre vista del log detallado de transmisiones. | SP1-T02 reenvío M2 | — |
|  | ACT-004-01 | SCR-004 | Autorizar Reenvío | Primaria | causaRaiz y correccionAplicada no vacíos | Registra en log y ejecuta SP1-T02. | SP1-T02 reenvío autorizado | — |
|  | ACT-004-02 | SCR-004 | Escalar a Proveedor | Secundaria | Siempre | Genera ticket de incidente con el proveedor de la API. | SP1-T02 reenvío autorizado | — |
|  | ACT-004-03 | SCR-004 | Ver Log Completo | Link | Siempre |  | SP1-T02 reenvío autorizado | — |
|  | ACT-005-01 | SCR-005 | Confirmar Asignación | Primaria | usuarioResponsable seleccionado | Registra asignación, notifica responsable. Estado → 'En análisis'. | Si confirma → SP2-T02; si reasigna → PAN-06 | — |
|  | ACT-005-02 | SCR-005 | Reasignar Caso | Secundaria | Siempre | Abre PAN-06 para reasignación detallada. | Si confirma → SP2-T02; si reasigna → PAN-06 | — |
|  | ACT-005-03 | SCR-005 | Solicitar Prórroga | Terciaria | SLA en riesgo | Inicia SP4 Prórroga Regulatoria. | Si confirma → SP2-T02; si reasigna → PAN-06 | — |
|  | ACT-006-01 | SCR-006 | Confirmar Reasignación | Primaria | Todos los campos obligatorios completos | Registra historial. Notifica nuevo responsable. | SP2-T02 en nueva área | — |
|  | ACT-006-02 | SCR-006 | Cancelar | Secundaria | Siempre | Cierra modal sin reasignar. | SP2-T02 en nueva área | — |
|  | ACT-007-01 | SCR-007 | Enviar a Revisión SAC | Primaria | causaRaiz, posicionZurich, respuestaCliente no vacíos | Estado → 'En revisión SAC'. Notifica Analista SAC. | SP2-T04 Revisión SAC | — |
|  | ACT-007-02 | SCR-007 | Guardar Borrador | Secundaria | Siempre |  | SP2-T04 Revisión SAC | — |
|  | ACT-007-03 | SCR-007 | Ver Expediente Completo | Link | Siempre |  | SP2-T04 Revisión SAC | — |
|  | ACT-008-01 | SCR-008 | Aprobar Respuesta | Primaria | Siempre | Habilita SP2-T06 (generar PDF). Estado → 'Respuesta aprobada'. | Si aprueba → SP2-T06 PDF; si devuelve → PAN-07 | — |
|  | ACT-008-02 | SCR-008 | Devolver con Observaciones | Destructiva | observacionesSAC no vacío | Devuelve al área responsable. Estado → 'Ajuste en progreso'. | Si aprueba → SP2-T06 PDF; si devuelve → PAN-07 | — |
|  | ACT-008-03 | SCR-008 | Reasignar Caso | Terciaria | Siempre | Abre PAN-06 para reasignación. | Si aprueba → SP2-T06 PDF; si devuelve → PAN-07 | — |
|  | ACT-009-01 | SCR-009 | Guardar Formulario | Primaria | Todos los campos obligatorios SFC completos | Valida, guarda y habilita SP3. | SP3 — Cerrar Queja ante SmartSupervision | — |
|  | ACT-009-02 | SCR-009 | Guardar Borrador | Secundaria | Siempre | No habilita SP3. | SP3 — Cerrar Queja ante SmartSupervision | — |
|  | ACT-010-01 | SCR-010 | Enviar a SmartSupervision | Primaria | fechaActualizacion=fechaCierre AND nomenclatura PDF OK AND todos obligatorios | Habilitado SOLO cuando todas las validaciones pasan (RUL-10-01, RUL-10-02, RUL-10-03). | P01-T08 Enviar respuesta final (SOLO tras HTTP 200 | — |
|  | ACT-010-02 | SCR-010 | Reenviar Cierre (corrección) | Primaria (corrección) | Visible cuando estado='Rechazado (400)' | Registra corrección y ejecuta reenvío. | P01-T08 Enviar respuesta final (SOLO tras HTTP 200 | — |
|  | ACT-010-03 | SCR-010 | Ver Log de Intentos M3 | Link | Siempre |  | P01-T08 Enviar respuesta final (SOLO tras HTTP 200 | — |
|  | ACT-011-01 | SCR-011 | Autorizar Reenvío Prórroga | Primaria | causaRaizProrroga y correccionProrroga no vacíos | Registra corrección y ejecuta SP4-T01 reenvío. | SP4-T01 reenvío autorizado | — |
|  | ACT-011-02 | SCR-011 | Escalar a Proveedor | Secundaria | Siempre |  | SP4-T01 reenvío autorizado | — |
|  | ACT-012-01 | SCR-012 | Reenviar Prórroga | Primaria | Todos los campos de prórroga completos | Registra corrección y ejecuta SP4-T01 reenvío. | SP4-T01 reenvío payload corregido | — |
|  | ACT-012-02 | SCR-012 | Cancelar Prórroga | Destructiva | Siempre | Cancela prórroga y retorna al flujo principal. | SP4-T01 reenvío payload corregido | — |
|  | ACT-000-01 | SCR-000 | Enviar PQRS | Primaria | Autorización de datos aceptada AND captcha válido AND todos los campos obligatorios válidos | Valida los datos, crea el caso con ID único y ejecuta P01-T01 (recibir y registrar la queja). Asigna instancia y punto de recepción según rol. | P01-T01 recepción → P01-T06 validación | RUL-000-07 |
|  | ACT-000-02 | SCR-000 | Limpiar Formulario | Secundaria | Siempre | Limpia todos los campos del formulario sin crear caso. | — | — |
|  | ACT-000-03 | SCR-000 | Cancelar | Destructiva | Siempre | Descarta el formulario y sale del portal de autoservicio. | — | — |
## Sheet: 05_Reglas
|  | REGLAS DE NEGOCIO, VALIDACIÓN Y VISIBILIDAD |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |  |  |  |
|  | ID Regla | SCR | Campo / Acción | Tipo Regla | Momento de Ejecución | Condición | Acción del Sistema | Severidad | Bloquea Avance | Mensaje Asociado | Impacto BPMN |
|  | RUL-001-01 | SCR-001 | FLD-007 | Restricción | Al guardar | correoElectronico no tiene formato RFC 5321 | Bloquear. Mostrar MSG-001-01 | Error | Sí | MSG-001-01 | Bloquea compuerta ¿Datos válidos? |
|  | RUL-001-02 | SCR-001 | FLD-006 | Restricción | Al guardar | numeroIdentificacion contiene letras o longitud <6 o >15 | Bloquear. Mostrar MSG-001-02 | Error | Sí | MSG-001-02 | Bloquea compuerta ¿Datos válidos? |
|  | RUL-001-03 | SCR-001 | FLD-011 | Control | Al cambiar FLD-010 | departamento está vacío o cambia | Deshabilitar y limpiar campo municipio | Control | No | — | No afecta flujo directo |
|  | RUL-001-04 | SCR-001 | FLD-012/004 | Restricción | Al guardar | resumen o nombreConsumidor contienen caracteres no permitidos SFC | Bloquear. Mostrar MSG-001-03 | Error | Sí | MSG-001-03 | Bloquea compuerta ¿Datos válidos? |
|  | RUL-001-05 | SCR-001 | FLD-002 | Restricción | Al cargar | Canal ya capturado en canal de entrada | Precargar canal. No solicitar nuevamente | Lineamiento | No | — | No aplica |
|  | RUL-002-01 | SCR-002 | ACT-002-01 | Restricción | Al cargar y al cambiar | contadorErrores > 0 | Deshabilitar botón 'Guardar Correcciones' | Error | Sí | MSG-002-01 | Bloquea avance a SP1 |
|  | RUL-002-02 | SCR-002 | — | Lineamiento | Al guardar | Siempre | Re-ejecutar P01-T06 automáticamente al guardar | Info | No | — | Vuelve a compuerta ¿Datos válidos? |
|  | RUL-002-03 | SCR-002 | — | Lineamiento | Al cargar | Siempre | Mostrar SOLO los campos que fallaron. No todo el formulario | Info | No | — | No aplica |
|  | RUL-003-01 | SCR-003 | ACT-003-01 | Restricción | Al reenviar | campoCorrección no fue modificado | Bloquear reenvío. Mostrar MSG-003-01 | Error | Sí | MSG-003-01 | No reenvía a SmartSupervision |
|  | RUL-003-02 | SCR-003 | FLD-044 | Control | Al cargar | numerIntentoM1M2 >= 3 | Mostrar advertencia y sugerir escalamiento técnico | Advertencia | No | MSG-003-02 | No bloquea, sugiere escalar |
|  | RUL-004-01 | SCR-004 | ACT-004-01 | Restricción | Al autorizar | causaRaiz o correccionAplicada vacíos | Bloquear autorización. Mostrar MSG-004-01 | Error | Sí | MSG-004-01 | No ejecuta SP1-T02 |
|  | RUL-005-01 | SCR-005 | FLD-083 | Restricción | Al cambiar área | Siempre | Cargar solo usuarios autorizados del área seleccionada | Control | No | — | Filtro de catálogo |
|  | RUL-005-02 | SCR-005 | — | Control | Al cargar | slaRestante <= 3 | Mostrar banner rojo de SLA crítico. MSG-005-01 | Advertencia | No | MSG-005-01 | No bloquea |
|  | RUL-006-01 | SCR-006 | FLD-092 | Restricción | Al cambiar área | Siempre | Solo usuarios con rol habilitado para quejas | Control | No | — | Filtro de catálogo |
|  | RUL-006-02 | SCR-006 | ACT-006-01 | Restricción | Al confirmar | motivoReasignacion o observaciones vacíos | Bloquear. Mostrar MSG-006-01 | Error | Sí | MSG-006-01 | No reasigna |
|  | RUL-006-03 | SCR-006 | FLD-092 | Restricción | Al confirmar | Asignación a usuario fuera del proceso | Bloquear | Error | Sí | MSG-006-02 | No reasigna |
|  | RUL-007-01 | SCR-007 | ACT-007-01 | Restricción | Al enviar a SAC | causaRaiz, posicionZurich o respuestaCliente vacíos | Bloquear envío. Mostrar MSG-007-01 | Error | Sí | MSG-007-01 | No avanza a SP2-T04 |
|  | RUL-007-02 | SCR-007 | FLD-107 | Lineamiento | Al enviar | Siempre | Incrementar versionRevision automáticamente | Info | No | — | No afecta flujo |
|  | RUL-007-03 | SCR-007 | — | Control | Al cargar | slaRestante <= 3 | Mostrar banner de alerta rojo | Advertencia | No | MSG-007-02 | No bloquea |
|  | RUL-008-01 | SCR-008 | ACT-008-02 | Restricción | Al devolver | observacionesSAC vacío y acción = devolver | Bloquear. Mostrar MSG-008-01 | Error | Sí | MSG-008-01 | No devuelve sin observaciones |
|  | RUL-008-02 | SCR-008 | — | Control | Al cargar | slaRestante <= 3 | Mostrar banner rojo SLA crítico | Advertencia | No | MSG-008-02 | No bloquea |
|  | RUL-009-01 | SCR-009 | FLD-159 a FLD-162 | Regla de Negocio | Al cambiar FLD-158 | relacionadaFraude = Sí | Mostrar y hacer obligatorios: tipoFraude, modalidadFraude, montoReclamado, montoReconocido | Control | Sí | MSG-009-01 | Campos de fraude obligatorios |
|  | RUL-009-02 | SCR-009 | FLD-141 a FLD-145 | Lineamiento | Al cargar | Siempre | Precargar canal, producto, motivo, admisión, enteControl desde M1. No editables | Info | No | — | No afecta flujo |
|  | RUL-009-03 | SCR-009 | ACT-009-01 | Restricción | Al guardar | Algún campo obligatorio SFC vacío | Bloquear. Mostrar MSG-009-02 | Error | Sí | MSG-009-02 | No habilita SP3 |
|  | RUL-010-01 | SCR-010 | FLD-175/FLD-176 | Restricción | Al cambiar cualquier fecha | fechaActualizacion ≠ fechaCierre | Alerta roja. Deshabilitar botón envío. MSG-010-01 | Error | Sí | MSG-010-01 | CRÍTICO: Bloquea envío M3 |
|  | RUL-010-02 | SCR-010 | FLD-181 | Restricción | Al adjuntar archivo | Nombre no cumple NombreCliente_NumId_RESP_FINAL_SFC_N | Bloquear. Mostrar MSG-010-02 | Error | Sí | MSG-010-02 | CRÍTICO: Bloquea envío M3 |
|  | RUL-010-03 | SCR-010 | ACT-010-01 | Restricción | Al cargar y al cambiar | Cualquier validación pendiente (RUL-10-01 o RUL-10-02 o campos vacíos) | Mantener botón deshabilitado hasta que TODAS las validaciones pasen | Error | Sí | — | CRÍTICO |
|  | RUL-010-04 | SCR-010 | P01-T08 | Restricción | Después de envío M3 | HTTP 200 no recibido | BLOQUEAR P01-T08. No enviar correo al cliente | Error | Sí | MSG-010-03 | CRÍTICO ARQUITECTURA: Notificación cliente solo tras HTTP 200 |
|  | RUL-010-05 | SCR-010 | FLD-171 | Lineamiento | Al reenviar | Siempre | Incrementar intentosCierreM3 y registrar en log | Info | No | — | Trazabilidad auditoria |
|  | RUL-011-01 | SCR-011 | ACT-011-01 | Restricción | Al autorizar | causaRaizProrroga o correccionProrroga vacíos | Bloquear. Mostrar MSG-011-01 | Error | Sí | MSG-011-01 | No ejecuta SP4-T01 |
|  | RUL-012-01 | SCR-012 | FLD-205 | Restricción | Al seleccionar fecha | nuevaFechaLimite <= fecha actual | Bloquear. Mostrar MSG-012-01 | Error | Sí | MSG-012-01 | No reenvía prórroga |
|  | RUL-000-01 | SCR-000 | FLD-303 | Control | Al cambiar rol | rol = "Defensor del Consumidor" | Habilitar Admisión (FLD-331) y asignar Instancia = "Defensor del consumidor". Si no, Admisión = "No aplica" e Instancia = "Entidad vigilada". | Control | No | — | Define instancia/punto de recepción |
|  | RUL-000-02 | SCR-000 | FLD-306 | Control | Al seleccionar tipo de identificación | tipoIdentificacion = NIT (Persona Jurídica) | Mostrar Razón Social y persona de contacto; ocultar Nombres/Apellidos. Asignar tipoPersona = Jurídica. | Control | No | — | Lista #3 define tipo de persona |
|  | RUL-000-03 | SCR-000 | FLD-306 | Control | Al seleccionar tipo de identificación | tipoIdentificacion ≠ NIT (Persona Natural) | Mostrar Nombres/Apellidos; ocultar campos de Persona Jurídica. Asignar tipoPersona = Natural. | Control | No | — | Lista #3 define tipo de persona |
|  | RUL-000-04 | SCR-000 | FLD-313 | Restricción | Al guardar | telefono no tiene exactamente 10 dígitos numéricos | Bloquear. Mostrar MSG-000-01 | Error | Sí | MSG-000-01 | Bloquea radicación |
|  | RUL-000-05 | SCR-000 | FLD-314 | Restricción | Al guardar | correoElectronico no tiene formato válido | Bloquear. Mostrar MSG-000-02 | Error | Sí | MSG-000-02 | Bloquea radicación |
|  | RUL-000-06 | SCR-000 | FLD-329 | Restricción | Al guardar | textoQueja tiene menos de 50 o más de 2000 caracteres | Bloquear. Mostrar MSG-000-03 | Error | Sí | MSG-000-03 | Bloquea radicación |
|  | RUL-000-07 | SCR-000 | FLD-335 | Restricción | Al enviar | autorizacionDatos no aceptada | Deshabilitar botón 'Enviar PQRS'. Mostrar MSG-000-04 | Error | Sí | MSG-000-04 | Bloquea radicación |
|  | RUL-000-08 | SCR-000 | FLD-336 | Restricción | Al enviar | captcha no validado | Bloquear envío. Mostrar MSG-000-05 | Error | Sí | MSG-000-05 | Bloquea radicación |
|  | RUL-000-09 | SCR-000 | FLD-318 | Control | Al cambiar departamento | departamento está vacío o cambia | Deshabilitar y limpiar el campo Ciudad (municipio). | Control | No | — | No afecta flujo directo |
|  | RUL-000-10 | SCR-000 | FLD-316 | Lineamiento | Al cargar | Siempre | Precargar País = "170 — Colombia" por defecto. | Info | No | — | No aplica |
|  | RUL-000-11 | SCR-000 | FLD-330 | Restricción | Al adjuntar archivo | Archivo no es pdf/jpg/png/docx o supera 5 MB | Bloquear adjunto. Mostrar MSG-000-06 | Error | Sí | MSG-000-06 | Bloquea radicación |
|  | RUL-000-12 | SCR-000 | FLD-325 | Control | Al cambiar Réplica | replica = "Sí" | Mostrar el campo Argumento de la réplica (FLD-326). | Control | No | — | No aplica |
|  | RUL-000-13 | SCR-000 | FLD-307 | Restricción | Al guardar | numeroIdentificacion no cumple el formato según el tipo de documento | Bloquear. Mostrar MSG-000-07 | Error | Sí | MSG-000-07 | Bloquea radicación |
## Sheet: 06_Mensajes
|  | MENSAJES DEL SISTEMA |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |
|  | ID Mensaje | SCR | Tipo | Título | Texto del Mensaje | Se Muestra Cuando | Resultado BPMN |
|  | MSG-001-01 | SCR-001 | Error | Correo inválido | El correo electrónico no tiene formato válido. Formato esperado: usuario@dominio.com | Al validar o al ejecutar acción en SCR-001 | Bloquea |
|  | MSG-001-02 | SCR-001 | Error | ID inválido | El número de identificación debe contener solo dígitos, entre 6 y 15 caracteres. | Al validar o al ejecutar acción en SCR-001 | Bloquea |
|  | MSG-001-03 | SCR-001 | Error | Caracteres no permitidos | El campo contiene caracteres no permitidos por SmartSupervision. Corrija antes de continuar. | Al validar o al ejecutar acción en SCR-001 | Bloquea |
|  | MSG-001-04 | SCR-001 | Éxito | Caso creado | Queja creada exitosamente. Número de caso: [ID]. Iniciando radicación ante SmartSupervision. | Al validar o al ejecutar acción en SCR-001 | Continúa |
|  | MSG-002-01 | SCR-002 | Advertencia | Errores pendientes | Tiene [N] campos con error. Corrija todos los campos resaltados para continuar. | Al validar o al ejecutar acción en SCR-002 | Informa |
|  | MSG-002-02 | SCR-002 | Éxito | Sin errores | Todos los campos son válidos. Puede continuar con la radicación ante SmartSupervision. | Al validar o al ejecutar acción en SCR-002 | Continúa |
|  | MSG-003-01 | SCR-003 | Error | Sin corrección | Debe modificar el campo señalado antes de reenviar a SmartSupervision. | Al validar o al ejecutar acción en SCR-003 | Bloquea |
|  | MSG-003-02 | SCR-003 | Advertencia | Múltiples intentos | Ha intentado [N] veces. Si el problema persiste, considere escalar a soporte técnico. | Al validar o al ejecutar acción en SCR-003 | Informa |
|  | MSG-003-03 | SCR-003 | Éxito | Reenvío iniciado | Corrección registrada. Reenviando payload a SmartSupervision (Intento [N+1]). | Al validar o al ejecutar acción en SCR-003 | Continúa |
|  | MSG-004-01 | SCR-004 | Error | Campos vacíos | Debe registrar la causa raíz y la corrección aplicada antes de autorizar el reenvío. | Al validar o al ejecutar acción en SCR-004 | Bloquea |
|  | MSG-004-02 | SCR-004 | Éxito | Reenvío autorizado | Corrección técnica registrada. Reenvío autorizado. Ejecutando payload (Intento [N+1]). | Al validar o al ejecutar acción en SCR-004 | Continúa |
|  | MSG-005-01 | SCR-005 | Advertencia | SLA crítico | ⚠ El caso tiene [N] día(s) hábil(es) restante(s). Asigne inmediatamente para cumplir el plazo regulatorio. | Al validar o al ejecutar acción en SCR-005 | Informa |
|  | MSG-005-02 | SCR-005 | Éxito | Asignación confirmada | Caso asignado a [Usuario]. Notificación enviada al responsable. | Al validar o al ejecutar acción en SCR-005 | Continúa |
|  | MSG-006-01 | SCR-006 | Error | Campos vacíos | El motivo y las observaciones son obligatorios para registrar la reasignación. | Al validar o al ejecutar acción en SCR-006 | Bloquea |
|  | MSG-006-02 | SCR-006 | Error | Usuario no autorizado | El usuario seleccionado no tiene el rol autorizado para gestionar quejas directas. | Al validar o al ejecutar acción en SCR-006 | Bloquea |
|  | MSG-006-03 | SCR-006 | Éxito | Reasignación exitosa | Caso reasignado a [Nuevo Responsable] ([Área]). Historial actualizado. Notificación enviada. | Al validar o al ejecutar acción en SCR-006 | Continúa |
|  | MSG-007-01 | SCR-007 | Error | Campos obligatorios vacíos | Los campos Causa Raíz, Posición Zurich y Respuesta al Cliente son obligatorios para enviar a revisión SAC. | Al validar o al ejecutar acción en SCR-007 | Bloquea |
|  | MSG-007-02 | SCR-007 | Advertencia | SLA crítico | ⚠ El caso tiene [N] día(s) hábil(es). Priorice el análisis para cumplir el plazo regulatorio. | Al validar o al ejecutar acción en SCR-007 | Informa |
|  | MSG-007-03 | SCR-007 | Éxito | Enviado a SAC | Borrador de respuesta enviado al Analista SAC para revisión (Versión [N]). | Al validar o al ejecutar acción en SCR-007 | Continúa |
|  | MSG-008-01 | SCR-008 | Error | Observaciones vacías | Debe documentar las observaciones para devolver la respuesta al área responsable. | Al validar o al ejecutar acción en SCR-008 | Bloquea |
|  | MSG-008-02 | SCR-008 | Advertencia | SLA crítico | ⚠ El caso tiene [N] día(s) hábil(es). Priorice la revisión. | Al validar o al ejecutar acción en SCR-008 | Informa |
|  | MSG-008-03 | SCR-008 | Éxito | Respuesta aprobada | Respuesta aprobada. El sistema generará el PDF de respuesta final automáticamente. | Al validar o al ejecutar acción en SCR-008 | Continúa |
|  | MSG-008-04 | SCR-008 | Información | Respuesta devuelta | Respuesta devuelta al área responsable con observaciones. Versión [N+1] pendiente. | Al validar o al ejecutar acción en SCR-008 | Informa |
|  | MSG-009-01 | SCR-009 | Advertencia | Campos fraude obligatorios | La queja está relacionada con fraude. Complete los campos requeridos por CE 019/2024: Tipo, Modalidad, Montos. | Al validar o al ejecutar acción en SCR-009 | Informa |
|  | MSG-009-02 | SCR-009 | Error | Campos SFC incompletos | Existen campos obligatorios de SmartSupervision sin completar. Complete todos antes de guardar. | Al validar o al ejecutar acción en SCR-009 | Bloquea |
|  | MSG-009-03 | SCR-009 | Éxito | Formulario guardado | Formulario regulatorio guardado. Subproceso SP3 de cierre habilitado. | Al validar o al ejecutar acción en SCR-009 | Continúa |
|  | MSG-009-04 | SCR-009 | Advertencia | LGBTIQ+ pendiente | ⚠ El catálogo LGBTIQ+ está pendiente de confirmación con TI. Verifique antes de transmitir a SmartSupervision. | Al validar o al ejecutar acción en SCR-009 | Informa |
|  | MSG-010-01 | SCR-010 | Error | Fechas no coinciden | ⚠ CRÍTICO: La Fecha de Actualización y la Fecha de Cierre deben ser exactamente iguales para enviar a SmartSupervision. | Al validar o al ejecutar acción en SCR-010 | Bloquea |
|  | MSG-010-02 | SCR-010 | Error | Nomenclatura PDF inválida | El archivo PDF no cumple la nomenclatura requerida: NombreCliente_NumeroIdentificacion_RESP_FINAL_SFC_N | Al validar o al ejecutar acción en SCR-010 | Bloquea |
|  | MSG-010-03 | SCR-010 | Éxito | Cierre aceptado HTTP 200 | ✓ SmartSupervision aceptó el cierre (HTTP 200). Habilitando envío de respuesta al cliente (P01-T08). | Al validar o al ejecutar acción en SCR-010 | Continúa |
|  | MSG-010-04 | SCR-010 | Error | Cierre rechazado HTTP 400 | SmartSupervision rechazó el cierre. Campo: [campo]. Error: [mensaje SFC]. Corrija y reenvíe. | Al validar o al ejecutar acción en SCR-010 | Bloquea |
|  | MSG-010-05 | SCR-010 | Advertencia | Múltiples intentos M3 | Ha realizado [N] intentos de cierre M3. Si el problema persiste, escale a soporte técnico. | Al validar o al ejecutar acción en SCR-010 | Informa |
|  | MSG-011-01 | SCR-011 | Error | Campos vacíos | Debe registrar la causa raíz y la corrección aplicada antes de autorizar el reenvío de la prórroga. | Al validar o al ejecutar acción en SCR-011 | Bloquea |
|  | MSG-011-02 | SCR-011 | Éxito | Reenvío prórroga autorizado | Corrección técnica registrada. Reenviando solicitud de prórroga (Intento [N+1]). | Al validar o al ejecutar acción en SCR-011 | Continúa |
|  | MSG-012-01 | SCR-012 | Error | Fecha inválida | La nueva fecha límite debe ser posterior a la fecha actual. | Al validar o al ejecutar acción en SCR-012 | Bloquea |
|  | MSG-012-02 | SCR-012 | Éxito | Prórroga reenviada | Solicitud de prórroga corregida y reenviada a SmartSupervision (Intento [N+1]). | Al validar o al ejecutar acción en SCR-012 | Continúa |
|  | MSG-000-01 | SCR-000 | Error | Teléfono inválido | El número de celular debe contener exactamente 10 dígitos, sin espacios ni caracteres especiales. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
|  | MSG-000-02 | SCR-000 | Error | Correo inválido | El correo electrónico no tiene formato válido. Formato esperado: usuario@dominio.com | Al validar o al ejecutar acción en SCR-000 | Bloquea |
|  | MSG-000-03 | SCR-000 | Error | Detalle insuficiente | El detalle de la queja debe tener mínimo 50 y máximo 2000 caracteres. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
|  | MSG-000-04 | SCR-000 | Advertencia | Autorización requerida | Debe aceptar el tratamiento de datos personales para poder radicar su solicitud. | Al validar o al ejecutar acción en SCR-000 | Informa |
|  | MSG-000-05 | SCR-000 | Error | Captcha pendiente | Debe completar la validación de seguridad (captcha) antes de enviar. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
|  | MSG-000-06 | SCR-000 | Error | Archivo no permitido | Solo se permiten archivos pdf, jpg, png o docx, de máximo 5 MB cada uno. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
|  | MSG-000-07 | SCR-000 | Error | Identificación inválida | El número de identificación no cumple el formato requerido para el tipo de documento seleccionado. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
|  | MSG-000-08 | SCR-000 | Éxito | PQRS radicada | Su solicitud fue radicada exitosamente. Número de caso: [ID]. Recibirá la respuesta en el correo registrado. | Al validar o al ejecutar acción en SCR-000 | Continúa |
## Sheet: 07_Catalogs
|  | CATÁLOGOS REFERENCIADOS |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |
|  | ID Catálogo | Nombre | Origen | Descripción / Valores de ejemplo | Estado | Dependencia | Observaciones |
|  | CAT-CANAL | Canal de Recepción | SFC | Ej: 5. Centro atención telefónica, 3. Web, 1. Presencial... | Pendiente TI | — | Validar lista completa con SmartSupervision. |
|  | CAT-TIPO-ID | Tipo de Identificación | SFC | CC, CE, NIT, Pasaporte, TI | Pendiente TI | — |  |
|  | CAT-TIPO-PERSONA | Tipo de Persona | SFC | 1. Natural / 2. Jurídica | Pendiente TI | — |  |
|  | CAT-PAIS | Código País | SFC | 170. Colombia y demás países | Pendiente TI | — | Por defecto: 170. |
|  | CAT-DPTO | Departamentos | SFC | 32 depts + D.C. | Pendiente TI | CAT-MPIO | Carga dinámica municipios. |
|  | CAT-MPIO | Municipios | SFC | Municipios por departamento | Pendiente TI | CAT-DPTO | Dependiente del departamento. |
|  | CAT-PRODUCTO-SFC | Producto SFC | SFC | 101. Automóviles, 102. Vida, 103. Hogar... | Pendiente TI | — | Homologar con Producto Zurich. |
|  | CAT-MOTIVO-SFC | Motivo SFC | SFC | 301. No pago siniestro, 302. Demora pago... | Pendiente TI | — | Campo crítico: condiciona fraude. |
|  | CAT-TIPO-SOL | Tipo Solicitud Zurich | Zurich | Queja Directa SmartSupervision, Requerimiento, Sugerencia... | Activo — Zurich | — | No va a SFC. Solo uso interno. |
|  | CAT-INSTANCIA | Instancia de Recepción | SFC | 2. Entidad vigilada, 1. Defensor CF, 3. SFC | Pendiente TI | — |  |
|  | CAT-PUNTO | Punto de Recepción | SFC | 5. Call Center, 1. Presencial, 2. Virtual, 3. Escrito | Pendiente TI | — |  |
|  | CAT-ADMISION | Admisión | SFC | 9. No aplica, 1. Admitida, 2. No admitida | Pendiente TI | — |  |
|  | CAT-ENTE | Ente de Control | SFC | 99. Otros, 1. SFC, 2. Defensor CF | Pendiente TI | — |  |
|  | CAT-SEXO | Sexo | SFC | M. Masculino / F. Femenino / I. No informa | Pendiente TI | — |  |
|  | CAT-LGBTIQ | LGBTIQ+ | SFC | ⚠ PENDIENTE CONFIRMACIÓN CON TI — catálogo no confirmado | PENDIENTE CRÍTICO | — | Campo FLD-147 identificado en SCR-09 AS-IS. Confirmar con TI antes de implementar. |
|  | CAT-COND-ESP | Condición Especial | SFC | Ninguna, Adulto mayor, Discapacidad física, Cognitiva, Vulnerable | Pendiente TI | — |  |
|  | CAT-PROD-DIGITAL | Producto Digital | SFC | 1. Sí / 2. No | Pendiente TI | — |  |
|  | CAT-ESTADO-QUEJA | Estado Queja/Reclamo | SFC | Cerrada a favor CF, Cerrada a favor entidad, Desistida, Rectificada | Pendiente TI | — |  |
|  | CAT-FAVORAB | Favorabilidad | SFC | 1. CF / 2. Entidad / 3. Parcial | Pendiente TI | — |  |
|  | CAT-ACEPTACION | Aceptación | SFC | Valores catálogo SFC | Pendiente TI | — |  |
|  | CAT-RECTIF | Rectificación | SFC | Valores catálogo SFC | Pendiente TI | — |  |
|  | CAT-DESIST | Desistimiento | SFC | Valores catálogo SFC | Pendiente TI | — |  |
|  | CAT-TUTELA | Tutela | SFC | 2. No / 1. Sí | Pendiente TI | — |  |
|  | CAT-MARCACION | Marcación | SFC | Valores catálogo SFC | Pendiente TI | — |  |
|  | CAT-EXPRES | Queja Exprés | SFC | 2. No / 1. Sí | Pendiente TI | — |  |
|  | CAT-TIPO-FRAUDE | Tipo de Fraude | SFC — CE 019/2024 | Fraude externo / Fraude interno / Phishing... | Pendiente TI | — | ⚠ Obligatorio desde 1 julio 2025. |
|  | CAT-MOD-FRAUDE | Modalidad de Fraude | SFC — CE 019/2024 | Robo info / Falsificación docs / Suplantación... | Pendiente TI | — | ⚠ Obligatorio desde 1 julio 2025. |
|  | CAT-AREA | Área Responsable Zurich | Zurich | Siniestros Auto, Siniestros Vida, Pagos, Producto, SAC | Activo — Zurich | CAT-USUARIOS-ROLE | Filtro de usuarios. |
|  | CAT-USUARIOS-ROLE | Usuarios por Rol | BPM | Usuarios autorizados por área y rol | Activo — BPM | CAT-AREA | Filtrado dinámico. |
|  | CAT-MOTIVO-REASIG | Motivo Reasignación | Zurich | Error asignación inicial, Área equivocada, Derivación producto... | Pendiente TI | — |  |
|  | CAT-MOTIVO-PRORR | Motivo Prórroga | SFC | Motivos aceptados por SmartSupervision para prórroga | Pendiente TI | — | Validar con catálogo SFC vigente. |
|  | CAT-ROL-RADICADOR | Rol del Radicador | Zurich | Cliente / Intermediario / Empleado Zurich / Defensor del Consumidor | Activo — Zurich | CAT-INSTANCIA | Determina la instancia y el punto de recepción SFC. |
|  | CAT-TIPO-SOLIC-PQRS | Tipo de Solicitud (PQRS Front) | Zurich | Solicitud, Felicitación, Queja, Sugerencia, Derecho de petición | Activo — Zurich | — | Lista #2 del formulario PQRS. Homologar con CAT-TIPO-SOL. |
|  | CAT-DETALLE-PRODUCTO | Detalle del Producto | SFC | Subnivel del producto SFC seleccionado | Pendiente TI | CAT-PRODUCTO-SFC | Pendiente confirmar lista con TI/SFC. |
## Sheet: 08_Permisos
|  | PERMISOS POR ROL Y PANTALLA |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |  |
|  | SCR | Nombre Pantalla | Gestor de Experiencia | Analista SAC | Área Responsable | Analista Técnico | Líder SAC | Control SLA | Observaciones |
|  | SCR-001 | Crear / Recibir Queja | VER + CREAR + EDITAR | — | — | — | — | INFORMADO | Solo Gestor CX puede crear la queja. |
|  | SCR-002 | Corrección de Datos | VER + EDITAR | — | — | — | — | — | Solo Gestor CX corrige datos preventivos. |
|  | SCR-003 | Corrección Error Funcional M1/M2 | VER + EDITAR | APOYO | — | — | — | — | Gestor CX corrige campos específicos. |
|  | SCR-004 | Revisión Error Técnico API | — | INFORMADO | — | VER + EDITAR | — | INFORMADO | Solo Analista Técnico resuelve error técnico. |
|  | SCR-005 | Detalle del Caso / Asignación | — | VER + EDITAR | — | — | VER | INFORMADO | Analista SAC asigna. Líder solo consulta. |
|  | SCR-006 | Reasignación de Caso | — | VER + EDITAR | — | — | VER | INFORMADO | Solo Analista SAC reasigna. |
|  | SCR-007 | Gestión Queja — Área Responsable | — | VER (lectura) | VER + EDITAR | — | VER | INFORMADO | Área Responsable elabora respuesta. |
|  | SCR-008 | Revisión Respuesta SAC | — | VER + APROBAR | VER (lectura) | — | VER | INFORMADO | Solo Analista SAC aprueba o devuelve. |
|  | SCR-009 | Formulario Superintendencia | — | VER + EDITAR | — | — | VER | INFORMADO | Solo Analista SAC diligencia formulario SFC. |
|  | SCR-010 | Formulario Cierre M3 | — | VER + EDITAR | — | — | VER | INFORMADO | Solo Analista SAC envía M3. |
|  | SCR-011 | Revisión Error Técnico Prórroga | — | INFORMADO | — | VER + EDITAR | — | INFORMADO | Solo Analista Técnico. |
|  | SCR-012 | Corrección Error Funcional Prórroga | — | VER + EDITAR | VER + EDITAR | — | VER | — | SAC y Área Responsable pueden corregir. |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | VER | — | — | — | — | INFORMADO | Formulario público de autoservicio. Radica el Consumidor Financiero (Cliente, Intermediario, Empleado Zurich o Defensor). El Gestor CX recibe el caso creado. |
## Sheet: 10_Trazabilidad_BPMN
|  | TRAZABILIDAD PANTALLAS → BPMN 2.0 |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |  |  |  |
|  | SCR / PAN | Nombre Pantalla | Proceso BPMN | Tarea / Subproceso | Carril / Rol | Evento de Apertura | Acción de Cierre | Compuerta Afectada | Datos de Entrada | Datos de Salida | Resultado BPMN |
|  | SCR-001
PAN-01 | Crear / Recibir Queja | P01 | P01-T01 Recibir y registrar queja | Gestor de Experiencia | Evento de inicio (queja recibida por canal) | Crear Queja → ejecuta P01-T06 | ¿Datos válidos? (divergente exclusiva) | Datos del cliente, clasificación, canal, adjuntos | ID Caso BPM, datos del caso creado | Si OK → SP1 radicación; si error → P01-T07 |
|  | SCR-002
PAN-02 | Corrección de Datos | P01 | P01-T07 Corregir datos del formulario | Gestor de Experiencia | P01-T06 detecta errores (Ev-Msg3 notificación) | Guardar correcciones → re-ejecuta P01-T06 | ¿Corrección completa y válida? | Campos con error señalados por P01-T06 | Campos corregidos | Si OK → SP1; si persiste error → vuelve a PAN-02 |
|  | SCR-003
PAN-03 | Corrección Error Funcional M1/M2 | SP1 | SP1-T05 Corregir datos según error funcional | Gestor de Experiencia | SmartSupervision devuelve HTTP 400 funcional | Corregir y Reenviar → SP1-T02 | ¿Error corregido? (convergente) | Detalle error SFC, campo afectado, valor rechazado | Campo corregido, log actualizado | Reenvío SP1-T02 → si 201 → SP2; si 400 → vuelve PAN-03 |
|  | SCR-004
PAN-04 | Revisión Error Técnico API | SP1 | SP1-T06 Revisar y corregir error técnico API | Analista Técnico | SP1-T04 clasifica error como técnico (> 3 intentos) | Autorizar Reenvío → SP1-T02 | ¿Error técnico resuelto? (convergente) | Log técnico, payload fallido, código HTTP | Causa raíz, corrección, autorización en log | Reenvío autorizado SP1-T02 |
|  | SCR-005
PAN-05 | Detalle del Caso / Asignación | SP2 | SP2-T01 Revisar queja radicada y asignar responsable | Usuario Zurich / Área Responsable | SP1 exitoso HTTP 201 → bandeja SAC | Confirmar Asignación o Reasignar | ¿Área correcta? (divergente exclusiva) | Expediente completo, código SFC, SLA | Decisión de asignación, notificación | Si confirma → SP2-T02; si reasigna → SP2-T03 (PAN-06) |
|  | SCR-006
PAN-06 | Reasignación de Caso | SP2 | SP2-T03 Reasignar caso a responsable correcto | Usuario Zurich / Área Responsable | SAC selecciona 'Reasignar' en PAN-05 o PAN-08 | Confirmar Reasignación | ¿Reasignación válida? (convergente) | Caso, historial de asignaciones, lista usuarios | Historial actualizado, notificación enviada | Notifica nuevo responsable → SP2-T02 |
|  | SCR-007
PAN-07 | Gestión Queja — Área Responsable | SP2 | SP2-T02 Analizar queja y elaborar respuesta / SP2-T05 Ajustar | Usuario Zurich / Área Responsable | Caso asignado a bandeja / devuelto por SAC | Enviar a Revisión SAC | ¿Respuesta completa? (compuerta al salir) | Expediente, observaciones SAC (si aplica) | Borrador respuesta (causa raíz, posición, texto cliente) | Estado → 'En revisión SAC' → SP2-T04 (PAN-08) |
|  | SCR-008
PAN-08 | Revisión Respuesta SAC | SP2 | SP2-T04 Revisar respuesta borrador (SAC) | Analista SAC | Área envía borrador para revisión | Aprobar o Devolver con Observaciones | ¿Respuesta aprobada? (divergente exclusiva) | Borrador respuesta, soportes internos | Aprobación o devolución con observaciones | Si aprueba → SP2-T06 PDF; si devuelve → SP2-T05 (PAN-07) |
|  | SCR-009
PAN-09 | Formulario Superintendencia | SP2 | SP2-T07 Diligenciar formulario Superintendencia | Usuario Zurich / Área Responsable | Respuesta aprobada + PDF generado (SP2-T06) | Guardar Formulario → habilita SP3 | ¿Formulario completo? (compuerta al salir) | Datos M1 precargados, PDF generado | Formulario regulatorio completo (30+ campos) | Si completo → habilita SP3 (PAN-10) |
|  | SCR-010
PAN-10 | Formulario Cierre M3 | SP3 | SP3-T01 / SP3-T04 / SP3-T08 Cierre M3 | Usuario Zurich / Área Responsable | SP3 iniciado / Rechazo HTTP 400 M3 | Enviar/Reenviar a SmartSupervision | ¿SmartSupervision acepta cierre HTTP 200? (divergente exclusiva) | Formulario superintendencia, PDF nomenclatura validada | Payload M3 completo, log cierre | Si HTTP 200 → P01-T08 (solo entonces); si 400 → corregir |
|  | SCR-011
PAN-11 | Revisión Error Técnico Prórroga | SP4 | SP4-T05 Corregir error técnico de API en prórroga | Analista Técnico | SP4-T01 falla técnicamente → escala | Autorizar Reenvío Prórroga | ¿Error técnico prórroga resuelto? | Log técnico prórroga, payload prórroga fallido | Corrección técnica registrada, autorización | Reenvío SP4-T01 |
|  | SCR-012
PAN-12 | Corrección Error Funcional Prórroga | SP4 | SP4-T06 Corregir error funcional de cierre prórroga | Analista SAC / Área Responsable | SmartSupervision rechaza prórroga HTTP 400 funcional | Reenviar Prórroga → SP4-T01 | ¿Error funcional prórroga corregido? | Detalle error SFC prórroga, campos afectados | Campos prórroga corregidos, log actualizado | Reenvío SP4-T01 → si OK → SP4-T03 notif. cliente |
|  | SCR-000
PAN-01.2 | Formulario de Radicación PQRS (Autoservicio) | P01 | P01-T00 Radicar PQRS por autoservicio (portal público) | Consumidor Financiero / Canal digital | El consumidor accede al portal público de PQRS | Enviar PQRS → ejecuta P01-T01 | ¿Autorización aceptada y captcha válido? (divergente exclusiva) | Datos del consumidor, rol, clasificación, motivo, adjuntos | Caso radicado con ID, datos del formulario | Si válido → P01-T01 (PAN-01) recepción y validación; si no → permanece en el formulario |
## Sheet: 11_Checklist_QA
|  | CHECKLIST QA — PANTALLAS TO-BE |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |
|  | SCR | Nombre Pantalla | Criterio de Calidad (BeePM) | Cumple | Observación | Responsable | Fecha Rev. |
|  | SCR-001 | Crear / Recibir Queja | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-001 | Crear / Recibir Queja | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-001 | Crear / Recibir Queja | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-001 | Crear / Recibir Queja | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-001 | Crear / Recibir Queja | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-001 | Crear / Recibir Queja | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-001 | Crear / Recibir Queja | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-001 | Crear / Recibir Queja | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-001 | Crear / Recibir Queja | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-001 | Crear / Recibir Queja | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-002 | Corrección de Datos | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-003 | Corrección Error Funcional M1/M2 | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-004 | Revisión Error Técnico API | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-005 | Detalle del Caso / Asignación | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-006 | Reasignación de Caso | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-007 | Gestión de Queja — Área Responsable | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-008 | Revisión Respuesta SAC | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-009 | Formulario Superintendencia | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-010 | Formulario Cierre M3 | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-011 | Revisión Error Técnico Prórroga | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-012 | Corrección Error Funcional Prórroga | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Mayo 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | ID único (SCR-###) asignado y nombre que describe la intención de negocio | Pendiente |  | Zurich/BeePM | Junio 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | Tipo de pantalla definido (formulario, aprobación, corrección, cierre, etc.) | Pendiente |  | Zurich/BeePM | Junio 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | Proceso BPMN y tarea/subproceso relacionado documentado en 10_Trazabilidad_BPMN | Pendiente |  | Zurich/BeePM | Junio 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | Rol/carril responsable definido y consistente con matriz de roles | Pendiente |  | Zurich/BeePM | Junio 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | Evento de apertura y acción de cierre documentados | Pendiente |  | Zurich/BeePM | Junio 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | Todos los campos tienen etiqueta, tipo de dato y control UI definidos | Pendiente |  | Zurich/BeePM | Junio 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | Todos los campos obligatorios tienen validación y mensaje de error en 06_Mensajes | Pendiente |  | Zurich/BeePM | Junio 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | Todas las listas tienen catálogo referenciado en 07_Catalogs | Pendiente |  | Zurich/BeePM | Junio 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | Todo campo solo lectura tiene fuente, momento de carga y regla documentados | Pendiente |  | Zurich/BeePM | Junio 2026 |
|  | SCR-000 | Formulario de Radicación PQRS (Autoservicio) | HTML de referencia refleja fielmente el Excel (fuente de verdad) | Pendiente |  | Zurich/BeePM | Junio 2026 |
## Sheet: SCR-000
|  | SCR-000 — Formulario de Radicación PQRS (Autoservicio) |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: P01 — Gestión de Quejas Directas  |  Tarea: P01-T00  |  Rol: Consumidor Financiero (Cliente / Intermediario / Empleado / Defensor)  |  Estado: Radicación (autoservicio) |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Consumidor Financiero (cliente, intermediario, empleado Zurich o defensor del consumidor) |  |  |  |  |  |  |
|  | Quiero | radicar mi PQRS (petición, queja, reclamo, sugerencia o felicitación) por un único formulario de autoservicio con mis datos y el detalle de la inconformidad |  |  |  |  |  |  |
|  | Para | presentar mi solicitud directamente, sin intermediarios, y recibir respuesta en mi correo cumpliendo el formato exigido por SmartSupervision SFC |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | tengo mi identificación, datos de contacto, el seguro/producto asociado y la descripción de mi solicitud |  |  |  |  |  |  |
|  | Cuando | completo el formulario, acepto el tratamiento de datos, valido el captcha y presiono 'Enviar PQRS' |  |  |  |  |  |  |
|  | Entonces | el sistema valida los datos, crea el caso con ID único, asigna automáticamente la instancia y el punto de recepción según mi rol, y muestra confirmación con el número de radicado |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-300 | S1 Tipo de Solicitud y Rol | Número de Caso (ID BPM) | No | Label/Solo lectura | Sistema BPM |  | Se asigna automáticamente por el sistema al radicar. |
|  | FLD-301 | S1 Tipo de Solicitud y Rol | Fecha y Hora de Creación | No | Label/Solo lectura | Sistema BPM |  | Timestamp automático del sistema. |
|  | FLD-302 | S1 Tipo de Solicitud y Rol | * ¿A qué está asociado tu comentario? | Sí | Lista desplegable | Catálogo Zurich | CAT-TIPO-SOLIC-PQRS | Solicitud, Felicitación, Queja, Sugerencia, Derecho de petición. |
|  | FLD-303 | S1 Tipo de Solicitud y Rol | * Selecciona tu rol | Sí | Lista desplegable | Catálogo Zurich | CAT-ROL-RADICADOR | Cliente / Intermediario / Empleado Zurich / Defensor. Determina instancia y punto de recepción. |
|  | FLD-304 | S1 Tipo de Solicitud y Rol | * Punto de Recepción | Sí | Label/Solo lectura | Catálogo SFC | CAT-PUNTO | Back. Se asigna automáticamente según canal/rol (Lista #1). |
|  | FLD-305 | S1 Tipo de Solicitud y Rol | * Instancia de Recepción | Sí | Label/Solo lectura | Catálogo SFC | CAT-INSTANCIA | Back. Entidad vigilada (Cliente/Interm./Empleado) o Defensor (rol Defensor) — Lista #5. |
|  | FLD-306 | S2 Datos del Consumidor Financiero | * Selecciona tu tipo de identificación | Sí | Lista desplegable | Catálogo SFC | CAT-TIPO-ID | RC, TI, CC, CE, PA, PPT, NIT (Lista #3). Define el tipo de persona. |
|  | FLD-307 | S2 Datos del Consumidor Financiero | * Número de identificación | Sí | Texto | Usuario |  | Solo números, o números y letras según tipo de documento. |
|  | FLD-308 | S2 Datos del Consumidor Financiero | * ¿Cuáles son tus nombres? | Sí | Texto | Usuario |  | Solo letras. Aparece si Persona Natural. |
|  | FLD-309 | S2 Datos del Consumidor Financiero | * ¿Cuáles son tus apellidos? | Sí | Texto | Usuario |  | Solo letras. Aparece si Persona Natural. |
|  | FLD-310 | S2 Datos del Consumidor Financiero | * Razón social | Sí | Texto | Usuario |  | Solo letras. Aparece si Persona Jurídica (NIT). |
|  | FLD-311 | S2 Datos del Consumidor Financiero | * Nombres de la persona de contacto | Sí | Texto | Usuario |  | Solo letras. Aparece si Persona Jurídica. |
|  | FLD-312 | S2 Datos del Consumidor Financiero | * Apellidos de la persona de contacto | Sí | Texto | Usuario |  | Solo letras. Aparece si Persona Jurídica. |
|  | FLD-313 | S2 Datos del Consumidor Financiero | * Celular | Sí | Texto | Usuario |  | Solo 10 dígitos, sin espacios ni caracteres especiales. |
|  | FLD-314 | S2 Datos del Consumidor Financiero | * Correo electrónico | Sí | Correo | Usuario |  | Validar formato. Destino del correo de respuesta final. |
|  | FLD-315 | S2 Datos del Consumidor Financiero | * Tipo de persona | Sí | Label/Solo lectura | Catálogo SFC | CAT-TIPO-PERSONA | Back. Asignado automáticamente según tipo de documento (Lista #1). |
|  | FLD-316 | S2 Datos del Consumidor Financiero | * País | Sí | Lista desplegable | Catálogo SFC | CAT-PAIS | Por defecto "170 — Colombia". |
|  | FLD-317 | S2 Datos del Consumidor Financiero | * Departamento | Sí | Lista desplegable | Catálogo SFC | CAT-DPTO | Carga la Ciudad dinámicamente (Divipola). |
|  | FLD-318 | S2 Datos del Consumidor Financiero | * Ciudad | Sí | Lista desplegable | Catálogo SFC | CAT-MPIO | Habilitada solo cuando el Departamento está seleccionado. |
|  | FLD-319 | S2 Datos del Consumidor Financiero | * Dirección | Sí | Label/Solo lectura | Sistema |  | Back. Enviar por default "vacío". Pendiente API SFC. |
|  | FLD-320 | S2 Datos del Consumidor Financiero | * Sexo | Sí | Label/Solo lectura | Catálogo SFC | CAT-SEXO | Back. Default "No aplica". Pendiente API SFC. |
|  | FLD-321 | S2 Datos del Consumidor Financiero | * LGBTIQ+ | Sí | Label/Solo lectura | Catálogo SFC | CAT-LGBTIQ | ⚠ Back. Default "No aplica". Catálogo pendiente confirmar con TI. |
|  | FLD-322 | S2 Datos del Consumidor Financiero | * Condición especial | Sí | Lista desplegable | Catálogo SFC | CAT-COND-ESP | Pendiente confirmar lista con TI/SFC. |
|  | FLD-323 | S3 Detalle de la Queja | * Selecciona el seguro | Sí | Lista desplegable | Catálogo SFC | CAT-PRODUCTO-SFC | Homologación entre la lista del Front y lo enviado a SFC. |
|  | FLD-324 | S3 Detalle de la Queja | * Detalle del producto | Sí | Label/Solo lectura | Catálogo SFC | CAT-DETALLE-PRODUCTO | Back. Pendiente confirmar lista. |
|  | FLD-325 | S3 Detalle de la Queja | * ¿Ya había radicado previamente la misma queja o es una reconsideración? | Sí | Radio Sí/No | Usuario |  | Campo Réplica SFC. |
|  | FLD-326 | S3 Detalle de la Queja | Argumento de la réplica | No | Área de texto | Usuario |  | Visible si Réplica = Sí. Pendiente confirmar. |
|  | FLD-327 | S3 Detalle de la Queja | * Escalamiento al Defensor del Consumidor | Sí | Label/Solo lectura | Sistema |  | Back. Si Instancia = Defensor → "Sí"; de lo contrario "No". |
|  | FLD-328 | S3 Detalle de la Queja | * Cuéntanos el motivo | Sí | Lista desplegable | Catálogo SFC | CAT-MOTIVO-SFC | Motivos SFC. Campo crítico: condiciona campos de fraude en M3. |
|  | FLD-329 | S3 Detalle de la Queja | * Ingresa el detalle | Sí | Área de texto | Usuario |  | Mínimo 50, máximo 2000 caracteres. |
|  | FLD-330 | S3 Detalle de la Queja | * Ingresa archivos adjuntos | Sí | Archivo (multi) | Usuario |  | pdf, jpg, png, docx. Máx 5 MB por archivo. |
|  | FLD-331 | S3 Detalle de la Queja | * Admisión | Sí | Label/Solo lectura | Catálogo SFC | CAT-ADMISION | Back. Editable si rol = Defensor; si no, default "No aplica" (Lista #4). |
|  | FLD-332 | S3 Detalle de la Queja | * Ente de control | Sí | Label/Solo lectura | Catálogo SFC | CAT-ENTE | Back. Por default "Otros". |
|  | FLD-333 | S3 Detalle de la Queja | * Tutela | Sí | Label/Solo lectura | Catálogo SFC | CAT-TUTELA | Back. Por default "No". |
|  | FLD-334 | S3 Detalle de la Queja | * Queja Exprés | Sí | Label/Solo lectura | Catálogo SFC | CAT-EXPRES | Back. Revisar tabla; confirmar con SFC. |
|  | FLD-335 | S4 Autorización y Envío | * Autorización de tratamiento de datos | Sí | Checkbox | Usuario |  | El usuario debe aceptar el tratamiento de datos personales. |
|  | FLD-336 | S4 Autorización y Envío | * Captcha | Sí | Captcha | Sistema |  | Validación de usuario para evitar envíos automatizados. |
|  | FLD-337 | S4 Autorización y Envío | ¿Quieres enviar copia de la respuesta a otro correo? | No | Correo | Usuario |  | Formato de correo (opcional). |
|  | FLD-338 | S5 Estado ante la SFC | Estado SmartSupervision | No | Label/Semáforo | Sistema/API |  | Color tipo semáforo (verde/amarillo/rojo) según estado ante la SFC. |
|  | FLD-339 | S5 Estado ante la SFC | Fecha y hora radicación SFC | No | Label/Solo lectura | API SFC |  | Para reportes. No es necesario mostrarla al usuario. |
|  | FLD-340 | S6 Responsable Asignado | Rol (Grupo) | No | Label/Solo lectura | Sistema BPM |  | Grupo de rol al que pertenece el responsable. |
|  | FLD-341 | S6 Responsable Asignado | Responsable | No | Label/Solo lectura | Sistema BPM |  | Nombres y apellidos del responsable asignado. |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-000-01 | Enviar PQRS | Primaria | Autorización aceptada AND captcha válido AND obligatorios válidos | Valida los datos, crea el caso con ID único y ejecuta P01-T01 (recibir y registrar). Asigna instancia y punto de recepción según rol. |  |  |  |
|  | ACT-000-02 | Limpiar Formulario | Secundaria | Siempre | Limpia todos los campos del formulario sin crear caso. |  |  |  |
|  | ACT-000-03 | Cancelar | Destructiva | Siempre | Descarta el formulario y sale del portal de autoservicio. |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-000-01 | Control | rol = "Defensor del Consumidor" |  | Habilitar Admisión y asignar Instancia = "Defensor del consumidor" |  | info | — |
|  | RUL-000-02 | Control | tipoIdentificacion = NIT (Jurídica) |  | Mostrar Razón Social y contacto; tipoPersona = Jurídica |  | info | — |
|  | RUL-000-03 | Control | tipoIdentificacion ≠ NIT (Natural) |  | Mostrar Nombres/Apellidos; tipoPersona = Natural |  | info | — |
|  | RUL-000-04 | Restricción | telefono ≠ 10 dígitos numéricos |  | Bloquear. Mostrar MSG-000-01 |  | 🔴 BLOQUEA | MSG-000-01 |
|  | RUL-000-05 | Restricción | correoElectronico con formato inválido |  | Bloquear. Mostrar MSG-000-02 |  | 🔴 BLOQUEA | MSG-000-02 |
|  | RUL-000-06 | Restricción | textoQueja < 50 o > 2000 caracteres |  | Bloquear. Mostrar MSG-000-03 |  | 🔴 BLOQUEA | MSG-000-03 |
|  | RUL-000-07 | Restricción | autorizacionDatos no aceptada |  | Deshabilitar 'Enviar PQRS'. Mostrar MSG-000-04 |  | 🔴 BLOQUEA | MSG-000-04 |
|  | RUL-000-08 | Restricción | captcha no validado |  | Bloquear envío. Mostrar MSG-000-05 |  | 🔴 BLOQUEA | MSG-000-05 |
|  | RUL-000-09 | Control | departamento vacío o cambia |  | Deshabilitar y limpiar el campo Ciudad |  | info | — |
|  | RUL-000-10 | Lineamiento | Siempre (al cargar) |  | Precargar País = "170 — Colombia" |  | info | — |
|  | RUL-000-11 | Restricción | Archivo no permitido o > 5 MB |  | Bloquear adjunto. Mostrar MSG-000-06 |  | 🔴 BLOQUEA | MSG-000-06 |
|  | RUL-000-12 | Control | replica = "Sí" |  | Mostrar el campo Argumento de la réplica |  | info | — |
|  | RUL-000-13 | Restricción | numeroIdentificacion no cumple formato por tipo doc |  | Bloquear. Mostrar MSG-000-07 |  | 🔴 BLOQUEA | MSG-000-07 |
## Sheet: SCR-001
|  | SCR-001 — Crear / Recibir Queja |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: P01 — Gestión de Quejas Directas  |  Tarea: P01-T01  |  Rol: Gestor de Experiencia  |  Estado: Inicio del proceso |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Gestor de Experiencia |  |  |  |  |  |  |
|  | Quiero | registrar una nueva queja directa con todos los datos del cliente y la descripción de la inconformidad |  |  |  |  |  |  |
|  | Para | crear el caso en el BPM con la información completa y activar el proceso de radicación ante SmartSupervision |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | tengo todos los datos del cliente (nombre, ID, correo, tipo persona), el canal de ingreso y la descripción de la queja |  |  |  |  |  |  |
|  | Cuando | completo el formulario y presiono 'Crear Queja' |  |  |  |  |  |  |
|  | Entonces | el sistema valida los datos, crea el caso con ID único, activa automáticamente la verificación de similares y muestra confirmación con el número de caso asignado |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-001 | S1 Encabezado del Caso | Número de Caso (ID BPM) | No | Label/Solo lectura | Sistema BPM |  | Asignado por el BPM al crear el registro. |
|  | FLD-002 | S1 Encabezado del Caso | * Canal de Recepción | Sí | Lista desplegable | Catálogo SFC | CAT-CANAL | Solo se captura una vez. No se vuelve a pedir en pantallas posteriores. |
|  | FLD-003 | S1 Encabezado del Caso | Fecha y Hora de Creación | No | Label/Solo lectura | Sistema BPM |  | Timestamp automático del sistema. |
|  | FLD-004 | S2 Datos del Consumidor Financiero | * Nombre o Razón Social | Sí | Texto | Usuario |  | Máx 200 car. Sin caracteres no permitidos SFC |
|  | FLD-005 | S2 Datos del Consumidor Financiero | * Tipo de Identificación | Sí | Lista desplegable | Catálogo SFC | CAT-TIPO-ID | CC, CE, NIT, Pasaporte, TI... |
|  | FLD-006 | S2 Datos del Consumidor Financiero | * Número de Identificación | Sí | Texto | Usuario |  | Solo dígitos. Mín 6, máx 15 caracteres |
|  | FLD-007 | S2 Datos del Consumidor Financiero | * Correo Electrónico | Sí | Correo | Usuario |  | Destino del correo de respuesta final. Obligatorio (bloquea si vacío o inválido). |
|  | FLD-008 | S2 Datos del Consumidor Financiero | * Tipo de Persona | Sí | Lista desplegable | Catálogo SFC | CAT-TIPO-PERSONA | Natural / Jurídica |
|  | FLD-009 | S2 Datos del Consumidor Financiero | * Código País | Sí | Lista desplegable | Catálogo SFC | CAT-PAIS | Por defecto: 170 — Colombia. |
|  | FLD-010 | S2 Datos del Consumidor Financiero | * Departamento | Sí | Lista desplegable | Catálogo SFC | CAT-DPTO | Carga Municipio dinámicamente al seleccionar. |
|  | FLD-011 | S2 Datos del Consumidor Financiero | * Municipio | Sí | Lista desplegable | Catálogo SFC | CAT-MPIO | Habilitado solo cuando Departamento está seleccionado. Si se cambia dpto., se limpia. |
|  | FLD-012 | S3 Clasificación y Datos de la Queja | * Asunto / Resumen | Sí | Texto | Usuario |  | Máx 500 car. Sin caracteres no SFC |
|  | FLD-013 | S3 Clasificación y Datos de la Queja | Descripción de la Queja | No | Área de texto | Usuario |  | Máx 4000 caracteres |
|  | FLD-014 | S3 Clasificación y Datos de la Queja | * Producto SFC | Sí | Lista desplegable | Catálogo SFC | CAT-PRODUCTO-SFC | Homologado a catálogo SFC para envío a SmartSupervision. |
|  | FLD-015 | S3 Clasificación y Datos de la Queja | * Motivo SFC | Sí | Lista desplegable | Catálogo SFC | CAT-MOTIVO-SFC | Campo crítico: condiciona campos de fraude en M3. |
|  | FLD-016 | S3 Clasificación y Datos de la Queja | * Tipo de Solicitud (Zurich) | Sí | Lista desplegable | Catálogo Zurich | CAT-TIPO-SOL | Solo uso interno. No va a SmartSupervision. |
|  | FLD-017 | S3 Clasificación y Datos de la Queja | * Instancia de Recepción | Sí | Lista desplegable | Catálogo SFC | CAT-INSTANCIA | Valor en catálogo |
|  | FLD-018 | S3 Clasificación y Datos de la Queja | * Punto de Recepción | Sí | Lista desplegable | Catálogo SFC | CAT-PUNTO | Valor en catálogo |
|  | FLD-019 | S3 Clasificación y Datos de la Queja | * Admisión | Sí | Lista desplegable | Catálogo SFC | CAT-ADMISION | Valor en catálogo |
|  | FLD-020 | S3 Clasificación y Datos de la Queja | * Ente de Control | Sí | Lista desplegable | Catálogo SFC | CAT-ENTE | Valor en catálogo |
|  | FLD-021 | S4 Adjuntos | * ¿Incluye Anexos a la Queja? | Sí | Radio Sí/No | Usuario |  | Indicador regulatorio SFC. Obligatorio. |
|  | FLD-022 | S4 Adjuntos | Archivos Adjuntos | No | Archivo (multi) | Usuario |  | PDF/JPG/PNG. Máx 5 archivos, 5 MB c/u |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-001-01 | Crear Queja | Primaria | Todos los campos obligatorios válidos | Ejecuta P01-T06 validación preventiva. Si OK → crea caso y activa SP1. Si error → resalta campos. |  |  |  |
|  | ACT-001-02 | Guardar Borrador | Secundaria | Siempre | Guarda el formulario sin crear caso ni ejecutar validación completa. |  |  |  |
|  | ACT-001-03 | Cancelar | Destructiva | Siempre | Descarta el formulario sin guardar cambios. |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-001-01 | Restricción | correoElectronico no tiene formato RFC 5321 |  | Bloquear. Mostrar MSG-001-01 |  | 🔴 BLOQUEA | MSG-001-01 |
|  | RUL-001-02 | Restricción | numeroIdentificacion contiene letras o longitud <6 o >15 |  | Bloquear. Mostrar MSG-001-02 |  | 🔴 BLOQUEA | MSG-001-02 |
|  | RUL-001-03 | Control | departamento está vacío o cambia |  | Deshabilitar y limpiar campo municipio |  | info | — |
|  | RUL-001-04 | Restricción | resumen o nombreConsumidor contienen caracteres no permitidos SFC |  | Bloquear. Mostrar MSG-001-03 |  | 🔴 BLOQUEA | MSG-001-03 |
|  | RUL-001-05 | Restricción | Canal ya capturado en canal de entrada |  | Precargar canal. No solicitar nuevamente |  | info | — |
## Sheet: SCR-002
|  | SCR-002 — Corrección de Datos |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: P01 — Gestión de Quejas Directas  |  Tarea: P01-T07  |  Rol: Gestor de Experiencia  |  Estado: En corrección preventiva |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Gestor de Experiencia |  |  |  |  |  |  |
|  | Quiero | ver exactamente cuál campo tiene error de validación y el formato correcto esperado para corregirlo |  |  |  |  |  |  |
|  | Para | corregir los datos sin necesidad de interpretar mensajes técnicos y poder continuar con la radicación |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | el sistema detectó errores en el formulario tras ejecutar la validación preventiva |  |  |  |  |  |  |
|  | Cuando | el sistema resalta en rojo los campos con error y presiono 'Guardar correcciones' |  |  |  |  |  |  |
|  | Entonces | el sistema bloquea el avance hasta que todos los errores sean corregidos, re-ejecuta la validación automáticamente y habilita el botón de envío a SmartSupervision solo cuando todos los campos son válidos |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-030 | S1 Datos del Caso (solo lectura) | Número de Caso | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-031 | S1 Datos del Caso (solo lectura) | Canal de Recepción | No | Label/Solo lectura | Caso |  | — |
|  | FLD-032 | S1 Datos del Caso (solo lectura) | SLA Restante (días hábiles) | No | Label/Solo lectura | Sistema |  | Semaforizado: verde >5d, amarillo 3-5d, rojo <3d, negro = vencido. |
|  | FLD-033 | S2 Resumen de Errores | Total de errores pendientes | No | Label/Solo lectura | Sistema |  | El botón 'Guardar' se habilita cuando llega a 0. |
|  | FLD-034 | S2 Resumen de Errores | Panel de errores detectados | No | Tabla/Grid | Sistema (P01-T06) |  | Columnas: Campo | Valor rechazado | Mensaje de error | Formato esperado. |
|  | FLD-035 | S3 Campos con Error | * Campo(s) con error (dinámico) | Sí | Texto o Lista según campo | Sistema → Usuario |  | El sistema muestra SOLO los campos que fallaron. Resaltados en rojo con mensaje específico. |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-002-01 | Guardar Correcciones | Primaria | Solo cuando contadorErrores = 0 | Re-ejecuta P01-T06. Si OK → habilita SP1. |  |  |  |
|  | ACT-002-02 | Cancelar Corrección | Secundaria | Siempre | Devuelve el caso a estado 'Pendiente corrección'. |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-002-01 | Restricción | contadorErrores > 0 |  | Deshabilitar botón 'Guardar Correcciones' |  | 🔴 BLOQUEA | MSG-002-01 |
|  | RUL-002-02 | Lineamiento | Siempre |  | Re-ejecutar P01-T06 automáticamente al guardar |  | info | — |
|  | RUL-002-03 | Lineamiento | Siempre |  | Mostrar SOLO los campos que fallaron. No todo el formulario |  | info | — |
## Sheet: SCR-003
|  | SCR-003 — Corrección Error Funcional M1/M2 |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP1 — Validar y Radicar ante SmartSupervision  |  Tarea: SP1-T05  |  Rol: Gestor de Experiencia  |  Estado: Rechazado SmartSupervision HTTP 400 funcional |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Gestor de Experiencia |  |  |  |  |  |  |
|  | Quiero | ver el detalle del error funcional devuelto por SmartSupervision con el campo específico afectado y el valor rechazado |  |  |  |  |  |  |
|  | Para | corregir el problema de forma rápida y precisa sin navegar por todo el formulario |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | SmartSupervision rechazó la radicación con error 400 por datos inválidos |  |  |  |  |  |  |
|  | Cuando | el sistema muestra el panel de error con campo afectado y presiono 'Corregir y reenviar' |  |  |  |  |  |  |
|  | Entonces | puedo editar directamente el campo señalado, guardar la corrección y ejecutar el reenvío a SmartSupervision sin tener que navegar por el formulario completo |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  |   S1 Panel de Error SmartSupervision |  |  |  |  |  |  |  |
|  | FLD-040 | S1 Panel de Error SmartSupervision | Código de Error SFC | No | Label/Solo lectura | API SmartSupervision |  | Código HTTP y código funcional devuelto por SmartSupervision. |
|  | FLD-041 | S1 Panel de Error SmartSupervision | Campo Afectado | No | Label/Solo lectura | API SmartSupervision |  | Nombre exacto del campo rechazado. |
|  | FLD-042 | S1 Panel de Error SmartSupervision | Valor Rechazado | No | Label/Solo lectura | API SmartSupervision |  | El valor que fue enviado y rechazado. |
|  | FLD-043 | S1 Panel de Error SmartSupervision | Mensaje de Error SFC | No | Label/Solo lectura | API SmartSupervision |  | Mensaje literal devuelto por SmartSupervision. |
|  | FLD-044 | S1 Panel de Error SmartSupervision | Intento N.° actual (M1/M2) | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-045 | S1 Panel de Error SmartSupervision | Fecha/Hora del rechazo | No | Label/Solo lectura | Sistema |  | Timestamp registrado en log. |
|  | FLD-046 | S2 Campo a Corregir | * Campo específico en corrección | Sí | Texto o Lista | Sistema → Usuario |  | Solo el campo afectado. No el formulario completo. |
|  | FLD-047 | S2 Campo a Corregir | Justificación de la corrección | No | Área de texto | Usuario |  | Comentario opcional del gestor. |
|  | FLD-048 | S3 Historial de Intentos | Historial de intentos anteriores | No | Tabla/Grid | Sistema |  | Columnas: Intento | Fecha | Campo afectado | Código error. Solo lectura. |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-003-01 | Corregir y Reenviar | Primaria | Campo afectado fue modificado | Guarda y ejecuta SP1-T02 para reenvío M2. |  |  |  |
|  | ACT-003-02 | Escalar a Soporte Técnico | Secundaria | Siempre | Envía a Analista Técnico si el error requiere intervención técnica. |  |  |  |
|  | ACT-003-03 | Ver Log Completo | Link | Siempre | Abre vista del log detallado de transmisiones. |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-003-01 | Restricción | campoCorrección no fue modificado |  | Bloquear reenvío. Mostrar MSG-003-01 |  | 🔴 BLOQUEA | MSG-003-01 |
|  | RUL-003-02 | Control | numerIntentoM1M2 >= 3 |  | Mostrar advertencia y sugerir escalamiento técnico |  | info | MSG-003-02 |
## Sheet: SCR-004
|  | SCR-004 — Revisión Error Técnico API |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP1 — Validar y Radicar ante SmartSupervision  |  Tarea: SP1-T06  |  Rol: Analista Técnico  |  Estado: Error técnico de integración API |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Analista Técnico |  |  |  |  |  |  |
|  | Quiero | revisar el detalle del error técnico de la API de SmartSupervision y registrar la corrección aplicada |  |  |  |  |  |  |
|  | Para | resolver el error de integración, documentar la causa raíz y autorizar el reenvío del payload |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | el BPM escaló el caso por error técnico después de múltiples intentos fallidos |  |  |  |  |  |  |
|  | Cuando | reviso el log de error, identifico la causa técnica, aplico la corrección y presiono 'Autorizar reenvío' |  |  |  |  |  |  |
|  | Entonces | el sistema registra la corrección técnica en el log del caso, actualiza el número de intento y ejecuta automáticamente el reenvío del payload corregido a SmartSupervision |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-050 | S1 Detalle del Error Técnico | Código HTTP | No | Label/Solo lectura | API |  | Ej: 401, 500, 503, Timeout. |
|  | FLD-051 | S1 Detalle del Error Técnico | Tipo de Error | No | Label/Solo lectura | Sistema |  | Autenticación / Timeout / Estructura payload / Servidor. |
|  | FLD-052 | S1 Detalle del Error Técnico | Mensaje técnico de la API | No | Área de texto | API |  | Stack trace o mensaje técnico completo. |
|  | FLD-053 | S1 Detalle del Error Técnico | Endpoint invocado | No | Label/Solo lectura | Sistema |  | URL del endpoint de la API intermediaria. |
|  | FLD-054 | S1 Detalle del Error Técnico | Payload enviado (JSON) | No | Área de texto | Sistema |  | JSON del payload del intento fallido. |
|  | FLD-055 | S1 Detalle del Error Técnico | Número de intento acumulado | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-056 | S2 Registro de Corrección Técnica | * Causa Raíz Identificada | Sí | Área de texto | Analista Técnico |  | Descripción técnica de la causa del error. |
|  | FLD-057 | S2 Registro de Corrección Técnica | * Corrección Aplicada | Sí | Área de texto | Analista Técnico |  | Acciones técnicas tomadas. |
|  | FLD-058 | S2 Registro de Corrección Técnica | * ¿Requiere ajuste en payload? | Sí | Radio Sí/No | Analista Técnico |  | — |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-004-01 | Autorizar Reenvío | Primaria | causaRaiz y correccionAplicada no vacíos | Registra en log y ejecuta SP1-T02. |  |  |  |
|  | ACT-004-02 | Escalar a Proveedor | Secundaria | Siempre | Genera ticket de incidente con el proveedor de la API. |  |  |  |
|  | ACT-004-03 | Ver Log Completo | Link | Siempre |  |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-004-01 | Restricción | causaRaiz o correccionAplicada vacíos |  | Bloquear autorización. Mostrar MSG-004-01 |  | 🔴 BLOQUEA | MSG-004-01 |
## Sheet: SCR-005
|  | SCR-005 — Detalle del Caso / Asignación |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP2 — Gestionar Respuesta Interna y Revisión SAC  |  Tarea: SP2-T01  |  Rol: Analista SAC  |  Estado: Radicado ante SFC / En revisión asignación |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Analista SAC |  |  |  |  |  |  |
|  | Quiero | revisar el expediente completo de la queja radicada y confirmar o cambiar el responsable de gestión |  |  |  |  |  |  |
|  | Para | garantizar que el caso esté asignado al área y usuario correctos antes de iniciar el análisis interno |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | la queja fue radicada exitosamente ante SmartSupervision y está en mi bandeja para asignación |  |  |  |  |  |  |
|  | Cuando | reviso el expediente y presiono 'Confirmar asignación' o 'Reasignar caso' |  |  |  |  |  |  |
|  | Entonces | el sistema registra la decisión, notifica al responsable asignado y cambia el estado del caso a 'En análisis' |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-060 | S1 Encabezado Estado del Caso | ID Caso BPM | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-061 | S1 Encabezado Estado del Caso | Código SFC (Radicado) | No | Label/Solo lectura | SmartSupervision |  | Código 1391... Solo lectura. |
|  | FLD-062 | S1 Encabezado Estado del Caso | Estado actual del caso | No | Badge/Estado | Sistema |  | — |
|  | FLD-063 | S1 Encabezado Estado del Caso | SLA: Días hábiles restantes | No | Label/Solo lectura | Sistema |  | Semaforizado: verde >5d, amarillo 3-5d, rojo <3d, negro = vencido. |
|  | FLD-064 | S1 Encabezado Estado del Caso | Fecha límite de respuesta | No | Label/Solo lectura | Sistema (P01-T05) |  | Calculada en días hábiles Colombia. |
|  | FLD-065 | S1 Encabezado Estado del Caso | Responsable actual | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-066 | S2 Datos del Consumidor | Nombre del Consumidor | No | Label/Solo lectura | Caso |  | — |
|  | FLD-067 | S2 Datos del Consumidor | Tipo y N.° de Identificación | No | Label/Solo lectura | Caso |  | — |
|  | FLD-068 | S2 Datos del Consumidor | Correo Electrónico | No | Label/Solo lectura | Caso |  | — |
|  | FLD-069 | S2 Datos del Consumidor | Tipo de Persona | No | Label/Solo lectura | Caso |  | — |
|  | FLD-070 | S3 Clasificación Regulatoria | Canal de Recepción | No | Label/Solo lectura | Caso |  | — |
|  | FLD-071 | S3 Clasificación Regulatoria | Producto SFC | No | Label/Solo lectura | Caso |  | — |
|  | FLD-072 | S3 Clasificación Regulatoria | Motivo SFC | No | Label/Solo lectura | Caso |  | — |
|  | FLD-073 | S3 Clasificación Regulatoria | Instancia / Punto de Recepción | No | Label/Solo lectura | Caso |  | — |
|  | FLD-074 | S3 Clasificación Regulatoria | Admisión | No | Label/Solo lectura | Caso |  | — |
|  | FLD-075 | S3 Clasificación Regulatoria | Ente de Control | No | Label/Solo lectura | Caso |  | — |
|  | FLD-076 | S4 Descripción de la Queja | Asunto de la Queja | No | Label/Solo lectura | Caso |  | — |
|  | FLD-077 | S4 Descripción de la Queja | Descripción / Texto de la Queja | No | Label/Solo lectura | Caso |  | — |
|  | FLD-078 | S4 Descripción de la Queja | Adjuntos del cliente | No | Lista de adjuntos | Caso |  | Solo visualización y descarga. |
|  | FLD-079 | S5 Estado SmartSupervision | Estado SmartSupervision | No | Badge/Estado | Sistema |  | Pendiente / Radicado (201) / Rechazado (400) / Cerrado (200). |
|  | FLD-080 | S5 Estado SmartSupervision | Intentos M1/M2 | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-081 | S5 Estado SmartSupervision | Fecha/Hora radicación SFC | No | Label/Solo lectura | Sistema |  | Timestamp del HTTP 201 exitoso. |
|  | FLD-082 | S6 Asignación de Responsable | * Área responsable | Sí | Lista desplegable | Catálogo Zurich | CAT-AREA | Áreas habilitadas para quejas. |
|  | FLD-083 | S6 Asignación de Responsable | * Usuario responsable | Sí | Lista desplegable filtrada | Sistema (usuarios BPM) | CAT-USUARIOS-ROLE | Solo usuarios autorizados para gestionar quejas. |
|  | FLD-084 | S6 Asignación de Responsable | Observaciones de asignación | No | Área de texto | Usuario |  | — |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-005-01 | Confirmar Asignación | Primaria | usuarioResponsable seleccionado | Registra asignación, notifica responsable. Estado → 'En análisis'. |  |  |  |
|  | ACT-005-02 | Reasignar Caso | Secundaria | Siempre | Abre PAN-06 para reasignación detallada. |  |  |  |
|  | ACT-005-03 | Solicitar Prórroga | Terciaria | SLA en riesgo | Inicia SP4 Prórroga Regulatoria. |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-005-01 | Restricción | Siempre |  | Cargar solo usuarios autorizados del área seleccionada |  | info | — |
|  | RUL-005-02 | Control | slaRestante <= 3 |  | Mostrar banner rojo de SLA crítico. MSG-005-01 |  | info | MSG-005-01 |
## Sheet: SCR-006
|  | SCR-006 — Reasignación de Caso |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP2 — Gestionar Respuesta Interna y Revisión SAC  |  Tarea: SP2-T03  |  Rol: Analista SAC  |  Estado: En análisis / Requiere reasignación |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Analista SAC |  |  |  |  |  |  |
|  | Quiero | reasignar el caso a un usuario específico del área responsable correcta seleccionando de una lista filtrada por roles autorizados |  |  |  |  |  |  |
|  | Para | garantizar que la queja sea analizada por quien tiene el conocimiento técnico y la autorización para responderla |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | el caso requiere análisis especializado de otra área (Siniestros, Pagos, Vida, Producto u otra) |  |  |  |  |  |  |
|  | Cuando | selecciono el nuevo responsable de la lista filtrada, registro el motivo de la reasignación y presiono 'Reasignar' |  |  |  |  |  |  |
|  | Entonces | el sistema registra en el historial: usuario anterior, usuario nuevo, fecha/hora y motivo; notifica al nuevo responsable y actualiza el panel de responsable actual del caso |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-090 | S1 Datos de Reasignación | Responsable actual | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-091 | S1 Datos de Reasignación | * Área destino | Sí | Lista desplegable | Catálogo Zurich | CAT-AREA | Valor en catálogo |
|  | FLD-092 | S1 Datos de Reasignación | * Nuevo responsable | Sí | Lista desplegable filtrada | Sistema (BPM) | CAT-USUARIOS-ROLE | Filtrado por área y rol. Prohibida asignación a usuarios fuera del proceso. |
|  | FLD-093 | S1 Datos de Reasignación | * Motivo de reasignación | Sí | Lista desplegable | Catálogo Zurich | CAT-MOTIVO-REASIG | Valor en catálogo |
|  | FLD-094 | S1 Datos de Reasignación | * Observaciones (justificación) | Sí | Área de texto | Usuario |  | Obligatorio. Queda en historial para auditoría. |
|  | FLD-095 | S2 Historial de Asignaciones | Historial de asignaciones previas | No | Tabla/Grid | Sistema |  | Columnas: Fecha | De | Para | Motivo. Solo lectura. |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-006-01 | Confirmar Reasignación | Primaria | Todos los campos obligatorios completos | Registra historial. Notifica nuevo responsable. |  |  |  |
|  | ACT-006-02 | Cancelar | Secundaria | Siempre | Cierra modal sin reasignar. |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-006-01 | Restricción | Siempre |  | Solo usuarios con rol habilitado para quejas |  | info | — |
|  | RUL-006-02 | Restricción | motivoReasignacion o observaciones vacíos |  | Bloquear. Mostrar MSG-006-01 |  | 🔴 BLOQUEA | MSG-006-01 |
|  | RUL-006-03 | Restricción | Asignación a usuario fuera del proceso |  | Bloquear |  | 🔴 BLOQUEA | MSG-006-02 |
## Sheet: SCR-007
|  | SCR-007 — Gestión de Queja — Área Responsable |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP2 — Gestionar Respuesta Interna y Revisión SAC  |  Tarea: SP2-T02 / SP2-T05  |  Rol: Usuario Zurich / Área Responsable  |  Estado: En análisis / Ajuste en progreso |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Usuario Zurich / Área Responsable |  |  |  |  |  |  |
|  | Quiero | ver el detalle completo de la queja asignada y elaborar el borrador de respuesta técnica con análisis de causa raíz |  |  |  |  |  |  |
|  | Para | documentar el análisis de Zurich y la posición técnica de forma trazable para el cierre regulatorio |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | tengo el caso asignado en mi bandeja y accedo al detalle con expediente del cliente, código SFC y SLA vigente |  |  |  |  |  |  |
|  | Cuando | redacto el borrador de respuesta en el campo habilitado, adjunto soportes internos si aplica y presiono 'Enviar a revisión SAC' |  |  |  |  |  |  |
|  | Entonces | el sistema registra el borrador de respuesta, envía notificación al Analista SAC para revisión y cambia el estado a 'En revisión SAC' |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-100 | S1 Datos del Caso (solo lectura) | ID Caso / Código SFC | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-101 | S1 Datos del Caso (solo lectura) | SLA: Días hábiles restantes | No | Label/Solo lectura | Sistema |  | Semaforizado. |
|  | FLD-102 | S1 Datos del Caso (solo lectura) | Estado del caso | No | Badge/Estado | Sistema |  | — |
|  | FLD-103 | S1 Datos del Caso (solo lectura) | Producto SFC / Motivo SFC | No | Label/Solo lectura | Caso |  | — |
|  | FLD-104 | S1 Datos del Caso (solo lectura) | Nombre del Consumidor | No | Label/Solo lectura | Caso |  | — |
|  | FLD-105 | S1 Datos del Caso (solo lectura) | Texto de la queja | No | Label/Solo lectura | Caso |  | — |
|  | FLD-106 | S2 Observaciones SAC (visible si es ajuste) | Observaciones del Analista SAC | No | Label/Solo lectura | SAC (SP2-T04) |  | Visible solo cuando fue devuelto por SAC. |
|  | FLD-107 | S2 Observaciones SAC (visible si es ajuste) | Versión de revisión actual | No | Label/Solo lectura | Sistema |  | Revisión 1, 2... |
|  | FLD-108 | S3 Elaboración de Respuesta Técnica | * Causa Raíz Identificada | Sí | Área de texto | Usuario |  | Campo no vacío |
|  | FLD-109 | S3 Elaboración de Respuesta Técnica | * Posición de Zurich | Sí | Área de texto | Usuario |  | Campo no vacío |
|  | FLD-110 | S3 Elaboración de Respuesta Técnica | * Respuesta al Cliente (borrador) | Sí | Área de texto | Usuario |  | Este texto irá en la carta PDF de respuesta final. |
|  | FLD-111 | S3 Elaboración de Respuesta Técnica | Acciones Tomadas | No | Área de texto | Usuario |  | — |
|  | FLD-112 | S3 Elaboración de Respuesta Técnica | * ¿Reconocimiento al cliente? | Sí | Radio Sí/No | Usuario |  | — |
|  | FLD-113 | S4 Soportes Internos | Adjuntos internos de soporte | No | Archivo (multi) | Usuario |  | No van al cliente ni a SFC. Solo uso interno. |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-007-01 | Enviar a Revisión SAC | Primaria | causaRaiz, posicionZurich, respuestaCliente no vacíos | Estado → 'En revisión SAC'. Notifica Analista SAC. |  |  |  |
|  | ACT-007-02 | Guardar Borrador | Secundaria | Siempre |  |  |  |  |
|  | ACT-007-03 | Ver Expediente Completo | Link | Siempre |  |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-007-01 | Restricción | causaRaiz, posicionZurich o respuestaCliente vacíos |  | Bloquear envío. Mostrar MSG-007-01 |  | 🔴 BLOQUEA | MSG-007-01 |
|  | RUL-007-02 | Lineamiento | Siempre |  | Incrementar versionRevision automáticamente |  | info | — |
|  | RUL-007-03 | Control | slaRestante <= 3 |  | Mostrar banner de alerta rojo |  | info | MSG-007-02 |
## Sheet: SCR-008
|  | SCR-008 — Revisión Respuesta SAC |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP2 — Gestionar Respuesta Interna y Revisión SAC  |  Tarea: SP2-T04  |  Rol: Analista SAC  |  Estado: En revisión SAC |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Analista SAC |  |  |  |  |  |  |
|  | Quiero | revisar la respuesta borrador elaborada por el área responsable y aprobarla o devolverla con observaciones específicas |  |  |  |  |  |  |
|  | Para | garantizar que el cliente reciba una respuesta clara, suficiente, regulatoriamente correcta y orientada a su experiencia |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | el área responsable envió el borrador de respuesta para mi revisión y aparece en mi bandeja |  |  |  |  |  |  |
|  | Cuando | reviso la respuesta completa y presiono 'Aprobar respuesta' o 'Devolver con observaciones' |  |  |  |  |  |  |
|  | Entonces | si apruebo: el sistema habilita la generación del PDF y continúa el flujo hacia el formulario Superintendencia; si devuelvo: notifica al responsable con mis observaciones y retorna el caso a 'Ajuste en progreso' |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-120 | S1 Contexto del Caso | ID Caso / Código SFC | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-121 | S1 Contexto del Caso | SLA: Días hábiles restantes | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-122 | S1 Contexto del Caso | Versión bajo revisión | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-123 | S1 Contexto del Caso | Área Responsable | No | Label/Solo lectura | Caso |  | — |
|  | FLD-124 | S1 Contexto del Caso | Fecha de elaboración del borrador | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-125 | S2 Respuesta del Área (solo lectura) | Causa Raíz | No | Label/Solo lectura | Área (PAN-07) |  | — |
|  | FLD-126 | S2 Respuesta del Área (solo lectura) | Posición de Zurich | No | Label/Solo lectura | Área (PAN-07) |  | — |
|  | FLD-127 | S2 Respuesta del Área (solo lectura) | Respuesta al Cliente | No | Label/Solo lectura | Área (PAN-07) |  | — |
|  | FLD-128 | S2 Respuesta del Área (solo lectura) | Acciones Tomadas | No | Label/Solo lectura | Área (PAN-07) |  | — |
|  | FLD-129 | S2 Respuesta del Área (solo lectura) | ¿Reconocimiento al cliente? | No | Label/Solo lectura | Área (PAN-07) |  | — |
|  | FLD-130 | S2 Respuesta del Área (solo lectura) | Soportes internos adjuntos | No | Lista de adjuntos | Área (PAN-07) |  | Solo visualización. |
|  | FLD-131 | S3 Decisión del Analista SAC | ◉ Observaciones SAC | Cond. | Área de texto | Analista SAC |  | Obligatorio al devolver. Opcional al aprobar. |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-008-01 | Aprobar Respuesta | Primaria | Siempre | Habilita SP2-T06 (generar PDF). Estado → 'Respuesta aprobada'. |  |  |  |
|  | ACT-008-02 | Devolver con Observaciones | Destructiva | observacionesSAC no vacío | Devuelve al área responsable. Estado → 'Ajuste en progreso'. |  |  |  |
|  | ACT-008-03 | Reasignar Caso | Terciaria | Siempre | Abre PAN-06 para reasignación. |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-008-01 | Restricción | observacionesSAC vacío y acción = devolver |  | Bloquear. Mostrar MSG-008-01 |  | 🔴 BLOQUEA | MSG-008-01 |
|  | RUL-008-02 | Control | slaRestante <= 3 |  | Mostrar banner rojo SLA crítico |  | info | MSG-008-02 |
## Sheet: SCR-009
|  | SCR-009 — Formulario Superintendencia |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP2 — Gestionar Respuesta Interna y Revisión SAC  |  Tarea: SP2-T07  |  Rol: Analista SAC  |  Estado: Respuesta aprobada / Preparando cierre regulatorio |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Analista SAC |  |  |  |  |  |  |
|  | Quiero | completar el formulario regulatorio requerido por la Superintendencia con los datos de condición del cliente y cierre de la queja |  |  |  |  |  |  |
|  | Para | cumplir con el requisito regulatorio del formulario SFC y habilitar el subproceso SP3 de cierre regulatorio |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | la respuesta fue aprobada por SAC y el PDF fue generado correctamente |  |  |  |  |  |  |
|  | Cuando | completo todos los campos del formulario (Sexo, LGBTIQ+, Condición Especial, Estado, Favorabilidad, campos de fraude si aplica) y presiono 'Guardar formulario' |  |  |  |  |  |  |
|  | Entonces | el sistema valida que todos los campos obligatorios de SmartSupervision estén completos, guarda el formulario en el expediente y habilita el subproceso SP3 de cierre regulatorio |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-140 | S1 Datos Precargados M1 (solo lectura) | Código SFC | No | Label/Solo lectura | SmartSupervision |  | — |
|  | FLD-141 | S1 Datos Precargados M1 (solo lectura) | Canal (precargado M1) | No | Label/Solo lectura | Caso M1 |  | No editable. Precargado desde Momento 1. |
|  | FLD-142 | S1 Datos Precargados M1 (solo lectura) | Producto (precargado M1) | No | Label/Solo lectura | Caso M1 |  | No editable. |
|  | FLD-143 | S1 Datos Precargados M1 (solo lectura) | Motivo (precargado M1) | No | Label/Solo lectura | Caso M1 |  | No editable. |
|  | FLD-144 | S1 Datos Precargados M1 (solo lectura) | Admisión (precargado M1) | No | Label/Solo lectura | Caso M1 |  | No editable. |
|  | FLD-145 | S1 Datos Precargados M1 (solo lectura) | Ente de Control (precargado M1) | No | Label/Solo lectura | Caso M1 |  | No editable. |
|  | FLD-146 | S2 Datos del Consumidor — Campos SFC | * Sexo | Sí | Lista desplegable | Catálogo SFC | CAT-SEXO | Valor en catálogo |
|  | FLD-147 | S2 Datos del Consumidor — Campos SFC | * LGBTIQ+ | Sí | Lista desplegable | Catálogo SFC | CAT-LGBTIQ | ⚠ Catálogo pendiente confirmación con TI (CE 019/2024). |
|  | FLD-148 | S2 Datos del Consumidor — Campos SFC | * Condición Especial | Sí | Lista desplegable | Catálogo SFC | CAT-COND-ESP | Valor en catálogo |
|  | FLD-149 | S2 Datos del Consumidor — Campos SFC | * Producto Digital | Sí | Lista desplegable | Catálogo SFC | CAT-PROD-DIGITAL | Valor en catálogo |
|  | FLD-150 | S3 Condición de la Queja | * Estado de la Queja o Reclamo | Sí | Lista desplegable | Catálogo SFC | CAT-ESTADO-QUEJA | Valor en catálogo |
|  | FLD-151 | S3 Condición de la Queja | * Favorabilidad | Sí | Lista desplegable | Catálogo SFC | CAT-FAVORAB | A favor cliente / A favor entidad / Parcial. |
|  | FLD-152 | S3 Condición de la Queja | * Aceptación | Sí | Lista desplegable | Catálogo SFC | CAT-ACEPTACION | Valor en catálogo |
|  | FLD-153 | S3 Condición de la Queja | * Rectificación | Sí | Lista desplegable | Catálogo SFC | CAT-RECTIF | Valor en catálogo |
|  | FLD-154 | S3 Condición de la Queja | * Desistimiento | Sí | Lista desplegable | Catálogo SFC | CAT-DESIST | Valor en catálogo |
|  | FLD-155 | S3 Condición de la Queja | * Tutela | Sí | Lista desplegable | Catálogo SFC | CAT-TUTELA | Valor en catálogo |
|  | FLD-156 | S3 Condición de la Queja | * Marcación | Sí | Lista desplegable | Catálogo SFC | CAT-MARCACION | Valor en catálogo |
|  | FLD-157 | S3 Condición de la Queja | * Queja Exprés | Sí | Lista desplegable | Catálogo SFC | CAT-EXPRES | Valor en catálogo |
|  | FLD-158 | S4 Datos de Fraude CE-019-2024 (condicional) | * ¿Relacionada con Fraude? | Sí | Radio Sí/No | Usuario |  | Si Sí, habilita campos FLD-159 a FLD-162. |
|  | FLD-159 | S4 Datos de Fraude CE-019-2024 (condicional) | ◉ Tipo de Fraude | Cond. | Lista desplegable | Catálogo SFC | CAT-TIPO-FRAUDE | CE 019/2024. Desde 1 jul 2025. |
|  | FLD-160 | S4 Datos de Fraude CE-019-2024 (condicional) | ◉ Modalidad de Fraude | Cond. | Lista desplegable | Catálogo SFC | CAT-MOD-FRAUDE | CE 019/2024. |
|  | FLD-161 | S4 Datos de Fraude CE-019-2024 (condicional) | ◉ Monto Reclamado (COP) | Cond. | Número | Usuario |  | CE 019/2024. |
|  | FLD-162 | S4 Datos de Fraude CE-019-2024 (condicional) | ◉ Monto Reconocido (COP) | Cond. | Número | Usuario |  | CE 019/2024. |
|  | FLD-163 | S5 Anexos del Formulario | * ¿Incluye Anexos a la Queja? | Sí | Radio Sí/No | Usuario |  | Indicador regulatorio SFC. |
|  | FLD-164 | S5 Anexos del Formulario | * ¿Incluye Adjunto Respuesta Final? | Sí | Radio Sí/No | Usuario |  | Debe ser Sí cuando PDF está adjunto. |
|  | FLD-165 | S5 Anexos del Formulario | PDF Respuesta Final (generado) | No | Label/Solo lectura + descarga | Sistema (SP2-T06) |  | Generado por SP2-T06. Solo descarga. |
|  | FLD-166 | S5 Anexos del Formulario | Prórroga (días, si aplica) | No | Número | Usuario |  | Solo cuando viene de SP4. |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-009-01 | Guardar Formulario | Primaria | Todos los campos obligatorios SFC completos | Valida, guarda y habilita SP3. |  |  |  |
|  | ACT-009-02 | Guardar Borrador | Secundaria | Siempre | No habilita SP3. |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-009-01 | Regla de Negocio | relacionadaFraude = Sí |  | Mostrar y hacer obligatorios: tipoFraude, modalidadFraude, montoReclamado, montoReconocido |  | 🔴 BLOQUEA | MSG-009-01 |
|  | RUL-009-02 | Lineamiento | Siempre |  | Precargar canal, producto, motivo, admisión, enteControl desde M1. No editables |  | info | — |
|  | RUL-009-03 | Restricción | Algún campo obligatorio SFC vacío |  | Bloquear. Mostrar MSG-009-02 |  | 🔴 BLOQUEA | MSG-009-02 |
## Sheet: SCR-010
|  | SCR-010 — Formulario Cierre M3 |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP3 — Cerrar Queja ante SmartSupervision  |  Tarea: SP3-T01 / SP3-T04 / SP3-T08  |  Rol: Analista SAC  |  Estado: Pendiente cierre regulatorio / En corrección M3 |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Usuario Zurich / Área Responsable |  |  |  |  |  |  |
|  | Quiero | diligenciar el formulario de cierre M3 con validación en tiempo real de fechas y nomenclatura del PDF adjunto |  |  |  |  |  |  |
|  | Para | evitar rechazos en SmartSupervision por inconsistencias preventivamente corregibles antes del envío |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | tengo el PDF de respuesta final generado y el formulario Superintendencia completado |  |  |  |  |  |  |
|  | Cuando | completo el formulario de cierre M3 con las fechas de actualización y cierre, adjunto el PDF y presiono 'Enviar a SmartSupervision' |  |  |  |  |  |  |
|  | Entonces | el sistema valida en tiempo real: (1) que Fecha Actualización = Fecha Cierre, (2) que el PDF tenga nomenclatura correcta, (3) que todos los campos regulatorios estén completos. El botón de envío solo se activa cuando todas las validaciones pasan |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-170 | S1 Estado del Cierre SmartSupervision | Estado del cierre M3 | No | Badge/Estado | Sistema |  | Pendiente / Enviando / Rechazado (400) / Aceptado (200). |
|  | FLD-171 | S1 Estado del Cierre SmartSupervision | Intentos cierre M3 | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-172 | S1 Estado del Cierre SmartSupervision | Último error (si aplica) | No | Panel de error | API SmartSupervision |  | Mensaje y campo del último rechazo. |
|  | FLD-173 | S2 Datos del Cierre | Código SFC | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-174 | S2 Datos del Cierre | * Estado de la Queja | Sí | Lista desplegable | Catálogo SFC | CAT-ESTADO-QUEJA | Valor en catálogo |
|  | FLD-175 | S2 Datos del Cierre | * Fecha de Actualización | Sí | Calendario | Usuario |  | RUL-10-01 CRÍTICO: bloquea botón si no coincide con fechaCierre. |
|  | FLD-176 | S2 Datos del Cierre | * Fecha de Cierre | Sí | Calendario | Usuario |  | RUL-10-01 CRÍTICO. |
|  | FLD-177 | S2 Datos del Cierre | * Favorabilidad | Sí | Lista desplegable | Catálogo SFC / PAN-09 | CAT-FAVORAB | Precargado de PAN-09. Editable si hubo error. |
|  | FLD-178 | S2 Datos del Cierre | * Aceptación | Sí | Lista desplegable | Catálogo SFC / PAN-09 | CAT-ACEPTACION | Precargado de PAN-09. |
|  | FLD-179 | S2 Datos del Cierre | * Marcación | Sí | Lista desplegable | Catálogo SFC / PAN-09 | CAT-MARCACION | Valor en catálogo |
|  | FLD-180 | S2 Datos del Cierre | * Queja Exprés | Sí | Lista desplegable | Catálogo SFC / PAN-09 | CAT-EXPRES | Valor en catálogo |
|  | FLD-181 | S3 PDF de Respuesta Final | * PDF Respuesta Final | Sí | Archivo + Validación automática | Sistema (SP2-T06) / Usuario |  | RUL-10-02: sistema valida nombre y tipo. Bloquea si no cumple. |
|  | FLD-182 | S3 PDF de Respuesta Final | Resultado validación nomenclatura | No | Label estado validación | Sistema |  | ✓ Nomenclatura correcta / ✗ Error específico. |
|  | FLD-183 | S3 PDF de Respuesta Final | * ¿Adjunto a la respuesta final? | Sí | Radio Sí/No | Usuario |  | — |
|  | FLD-184 | S4 Campos Fraude CE-019-2024 (solo lectura) | ¿Relacionada con fraude? | No | Label/Solo lectura | PAN-09 |  | Precargado. |
|  | FLD-185 | S4 Campos Fraude CE-019-2024 (solo lectura) | Tipo de Fraude (si aplica) | No | Label/Solo lectura | PAN-09 |  | — |
|  | FLD-186 | S4 Campos Fraude CE-019-2024 (solo lectura) | Monto Reclamado (si aplica) | No | Label/Solo lectura | PAN-09 |  | — |
|  | FLD-187 | S4 Campos Fraude CE-019-2024 (solo lectura) | Monto Reconocido (si aplica) | No | Label/Solo lectura | PAN-09 |  | — |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-010-01 | Enviar a SmartSupervision | Primaria | fechaActualizacion=fechaCierre AND nomenclatura PDF OK AND todos obligatorios | Habilitado SOLO cuando todas las validaciones pasan (RUL-10-01, RUL-10-02, RUL-10-03). |  |  |  |
|  | ACT-010-02 | Reenviar Cierre (corrección) | Primaria (corrección) | Visible cuando estado='Rechazado (400)' | Registra corrección y ejecuta reenvío. |  |  |  |
|  | ACT-010-03 | Ver Log de Intentos M3 | Link | Siempre |  |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-010-01 | Restricción | fechaActualizacion ≠ fechaCierre |  | Alerta roja. Deshabilitar botón envío. MSG-010-01 |  | 🔴 BLOQUEA | MSG-010-01 |
|  | RUL-010-02 | Restricción | Nombre no cumple NombreCliente_NumId_RESP_FINAL_SFC_N |  | Bloquear. Mostrar MSG-010-02 |  | 🔴 BLOQUEA | MSG-010-02 |
|  | RUL-010-03 | Restricción | Cualquier validación pendiente (RUL-10-01 o RUL-10-02 o campos vacíos) |  | Mantener botón deshabilitado hasta que TODAS las validaciones pasen |  | 🔴 BLOQUEA | — |
|  | RUL-010-04 | Restricción | HTTP 200 no recibido |  | BLOQUEAR P01-T08. No enviar correo al cliente |  | 🔴 BLOQUEA | MSG-010-03 |
|  | RUL-010-05 | Lineamiento | Siempre |  | Incrementar intentosCierreM3 y registrar en log |  | info | — |
## Sheet: SCR-011
|  | SCR-011 — Revisión Error Técnico Prórroga |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP4 — Gestionar Prórroga Regulatoria  |  Tarea: SP4-T05  |  Rol: Analista Técnico  |  Estado: Error técnico en envío de prórroga |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Analista Técnico |  |  |  |  |  |  |
|  | Quiero | revisar el error técnico de la API al enviar la solicitud de prórroga y registrar la corrección aplicada |  |  |  |  |  |  |
|  | Para | resolver el error de integración en la solicitud de prórroga y autorizar el reenvío |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | el BPM escaló el caso por error técnico en el envío del payload de prórroga a SmartSupervision |  |  |  |  |  |  |
|  | Cuando | reviso el log de error de prórroga, identifico la causa técnica, aplico la corrección y presiono 'Autorizar reenvío' |  |  |  |  |  |  |
|  | Entonces | el sistema registra la corrección técnica en el log, actualiza el número de intento y ejecuta automáticamente el reenvío del payload de prórroga |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-190 | S1 Detalle del Error Técnico — Prórroga | Código HTTP prórroga | No | Label/Solo lectura | API |  | — |
|  | FLD-191 | S1 Detalle del Error Técnico — Prórroga | Tipo de Error | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-192 | S1 Detalle del Error Técnico — Prórroga | Mensaje técnico de la API | No | Área de texto | API |  | — |
|  | FLD-193 | S1 Detalle del Error Técnico — Prórroga | Payload de prórroga enviado | No | Área de texto | Sistema |  | JSON del payload enviado. |
|  | FLD-194 | S1 Detalle del Error Técnico — Prórroga | Número de intento prórroga | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-195 | S2 Registro de Corrección — Prórroga | * Causa Raíz | Sí | Área de texto | Analista Técnico |  | Campo no vacío |
|  | FLD-196 | S2 Registro de Corrección — Prórroga | * Corrección Aplicada | Sí | Área de texto | Analista Técnico |  | Campo no vacío |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-011-01 | Autorizar Reenvío Prórroga | Primaria | causaRaizProrroga y correccionProrroga no vacíos | Registra corrección y ejecuta SP4-T01 reenvío. |  |  |  |
|  | ACT-011-02 | Escalar a Proveedor | Secundaria | Siempre |  |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-011-01 | Restricción | causaRaizProrroga o correccionProrroga vacíos |  | Bloquear. Mostrar MSG-011-01 |  | 🔴 BLOQUEA | MSG-011-01 |
## Sheet: SCR-012
|  | SCR-012 — Corrección Error Funcional Prórroga |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Proceso: Gestión de Quejas Directas | ACZ-QD-001  |  Versión: 2.0 TO-BE | Mayo 2026 |  |  |  |  |  |  |  |
|  | Servicio: Atención al Consumidor Financiero – Zurich Seguros Colombia  |  Plataforma: ProcessMaker 4 BPMS |  |  |  |  |  |  |  |
|  | Proceso: SP4 — Gestionar Prórroga Regulatoria  |  Tarea: SP4-T06  |  Rol: Analista SAC / Área Responsable  |  Estado: Prórroga rechazada HTTP 400 funcional |  |  |  |  |  |  |  |
|  | 📖 HISTORIA DE USUARIO |  |  |  |  |  |  |  |
|  | Como (Rol) | Analista SAC / Área Responsable |  |  |  |  |  |  |
|  | Quiero | corregir los campos del formulario de prórroga rechazados por SmartSupervision |  |  |  |  |  |  |
|  | Para | resolver el rechazo funcional y obtener la aceptación de la prórroga por parte de SmartSupervision |  |  |  |  |  |  |
|  | ✅ CRITERIO DE ACEPTACIÓN |  |  |  |  |  |  |  |
|  | Dado que | SmartSupervision rechazó la solicitud de prórroga con error 400 funcional |  |  |  |  |  |  |
|  | Cuando | corrijo los campos señalados (motivo, fechas, contador) y presiono 'Reenviar prórroga' |  |  |  |  |  |  |
|  | Entonces | el sistema registra la corrección en el log y ejecuta el reenvío del payload de prórroga corregido |  |  |  |  |  |  |
|  | 📋 CAMPOS DE LA PANTALLA |  |  |  |  |  |  |  |
|  | ID Campo | Sección | Etiqueta | Oblig. | Control UI | Fuente | Catálogo | Ayuda/Validación |
|  | FLD-200 | S1 Panel de Error — Prórroga | Código de Error SFC Prórroga | No | Label/Solo lectura | API |  | — |
|  | FLD-201 | S1 Panel de Error — Prórroga | Campo Afectado | No | Label/Solo lectura | API |  | — |
|  | FLD-202 | S1 Panel de Error — Prórroga | Mensaje de Error SFC | No | Label/Solo lectura | API |  | — |
|  | FLD-203 | S1 Panel de Error — Prórroga | Intento N.° actual | No | Label/Solo lectura | Sistema |  | — |
|  | FLD-204 | S2 Campos de Prórroga a Corregir | * Motivo de Prórroga | Sí | Lista desplegable | Catálogo SFC | CAT-MOTIVO-PRORR | Motivo aceptado por SmartSupervision. |
|  | FLD-205 | S2 Campos de Prórroga a Corregir | * Nueva Fecha Límite | Sí | Calendario | Usuario |  | Nueva fecha de respuesta solicitada. |
|  | FLD-206 | S2 Campos de Prórroga a Corregir | * Contador de Prórroga | Sí | Número | Sistema/Usuario |  | N.° de prórroga (1, 2...). |
|  | FLD-207 | S2 Campos de Prórroga a Corregir | * Justificación | Sí | Área de texto | Usuario |  | Justificación de la necesidad de prórroga. |
|  | 🎯 ACCIONES |  |  |  |  |  |  |  |
|  | ID | Etiqueta | Tipo | Condición | Descripción / Resultado BPMN |  |  |  |
|  | ACT-012-01 | Reenviar Prórroga | Primaria | Todos los campos de prórroga completos | Registra corrección y ejecuta SP4-T01 reenvío. |  |  |  |
|  | ACT-012-02 | Cancelar Prórroga | Destructiva | Siempre | Cancela prórroga y retorna al flujo principal. |  |  |  |
|  | ⚠ REGLAS CRÍTICAS |  |  |  |  |  |  |  |
|  | RUL-012-01 | Restricción | nuevaFechaLimite <= fecha actual |  | Bloquear. Mostrar MSG-012-01 |  | 🔴 BLOQUEA | MSG-012-01 |