# Matrices_Maduracion_TO-BE_QuejaDirectas_v2.0

## Portada

| MATRICES DE MADURACIÓN — TO-BE Gestión de Quejas Directas \| SmartSupervision \| Zurich Seguros Colombia |
| --- |
|  |
|  |
|  |
|  |
|  |
|  |
|  |
|  |
| CONTENIDO DEL ARCHIVO |
|  |
|  |
|  |
|  |
|  |
|  |


## 1. Tareas

| INVENTARIO DE TAREAS — Gestión de Quejas Directas TO-BE \| Zurich Seguros Colombia |  |  |  |  |  | MATRIZ DE ROLES Y RESPONSABILIDADES |
| --- | --- | --- | --- | --- | --- | --- |
| # | Proceso | Código Tarea | Nombre de la Tarea | Tipo de Tarea | Descripción | Gestor de Experiencia |
| 1 | P01 | P01-T01 | Recibir y registrar queja | Usuario | El Gestor de Experiencia completa o valida el formulario de la queja cuando el canal es call center, WhatsApp, sucursal  | RESPONSABLE |
| 2 | P01 | P01-T02 | Registrar queja | Servicio | El sistema recibe la señal de entrada (canal SFC/Web o canal alterno) y crea automáticamente el registro de la queja en  | INFORMADO |
| 3 | P01 | P01-T03 | Verificar quejas similares del cliente | Script | Consulta en la base de datos del BPM si el cliente tiene quejas activas o históricas con el mismo tipo, subtipo y produc | INFORMADO |
| 4 | P01 | P01-T04 | Priorizar caso y recalcular SLA | Script | El BPM ejecuta cuando existe recurrencia. Marca el caso como prioritario en el registro, aplica el factor de SLA diferen | INFORMADO |
| 5 | P01 | P01-T05 | Calcular SLA | Script | El BPM calcula la fecha límite de respuesta a partir de la fecha de radicación sumando el número de días hábiles configu | INFORMADO |
| 6 | P01 | Ev-Msg | Notificación de registro | Evento-Mensaje | Intermediario (throw) disparado tras el cálculo de SLA. Envía al cliente la notificación automática con el número de rad | INFORMADO |
| 7 | P01 | Ev-Msg2 | Notificación de priorización | Evento-Mensaje | Intermediario (throw) disparado cuando el caso es priorizado. Notifica al analista SAC y al supervisor que el caso tiene | INFORMADO |
| 8 | P01 | P01-T06 | Validar datos del formulario | Script | El BPM realiza validación preventiva ejecutado antes del envío a SmartSupervision. Verifica: campos obligatorios, format | INFORMADO |
| 9 | P01 | Ev-Msg3 | Notificación de correcciones | Evento-Mensaje | Envia (throw) que notifica al Gestor de Experiencia los campos con error detectados por la validación. Muestra campo esp | INFORMADO |
| 10 | P01 | P01-T07 | Corregir datos del formulario | Usuario | El Gestor de Experiencia corrige los campos señalados por la notificación de correcciones. El formulario resalta en rojo | RESPONSABLE |
| 11 | P01 | P01-SP1 | SP1: Validar y Radicar ante SmartSupervision | Subproceso | Gestiona los Momentos 1 y 2 de integración con SmartSupervision: homologación de catálogos, envío del payload de creació | INFORMADO |
| 12 | P01 | P01-SP2 | SP2: Gestionar Respuesta Interna y Revisión SAC | Subproceso | Cubre el ciclo completo de gestión interna: revisión y asignación a área responsable, reasignación si aplica, análisis y | — |
| 13 | P01 | P01-SP4 | SP4: Gestionar Prórroga Regulatoria | Subproceso | Invocado cuando el caso requiere ampliación del plazo de respuesta. Gestiona el envío del payload de prórroga a SmartSup | — |
| 14 | P01 | P01-SP3 | SP3: Cerrar Queja ante SmartSupervision | Subproceso | Subproceso del Momento 3: validaciones previas de cierre, envío del payload regulatorio completo con PDF adjunto a Smart | — |
| 15 | P01 | P01-T08 | Enviar respuesta final al cliente | Envío | Envío automático ejecutada EXCLUSIVAMENTE después de la confirmación HTTP 200 de SmartSupervision. El BPM envía al corre | INFORMADO |
| 16 | P01 | P01-T09 | Enviar encuesta de satisfacción al cliente | Envío | Envío automático del enlace parametrizado de encuesta de satisfacción al cliente como parte del cierre del caso. Se ejec | INFORMADO |
| 17 | P01 | P01-T10 | Gestionar vencimiento de SLA | Manual | El analista SAC y supervisor al recibir la escalada por vencimiento del SLA. Revisan el caso, definen el plan de acción  | INFORMADO |
| 18 | SP1 | SP1-T01 | Homologar catálogos internos con catálogos SFC | Script | El BPM transforma automáticamente los valores internos de Zurich (Producto, Motivo, Canal, Instancia de Recepción, Punto | — |
| 19 | SP1 | SP1-T02 | Enviar payload de creación a API (M1)/(M2) | Servicio | El BPM invoca la API intermediaria de SmartSupervision. Construye el payload JSON con todos los campos requeridos por SF | — |
| 20 | SP1 | SP1-T03 | Registrar código radicado SFC | Script | El BPM ejecuta tras HTTP 201 exitoso. Extrae el código de radicado (iniciando con 1391) de la respuesta de la API y lo p | — |
| 21 | SP1 | SP1-T04 | Registrar error en log de trazabilidad | Script | El BPM ejecuta cuando SmartSupervision devuelve error (HTTP 400, 401, 5xx o timeout). Registra en el log estructurado: c | — |
| 22 | SP1 | SP1-T05 | Corregir datos según error funcional | Usuario | El Gestor de Experiencia corrige los campos del formulario indicados como inválidos por el error funcional de SmartSuper | RESPONSABLE |
| 23 | SP1 | SP1-T06 | Revisar y corregir error técnico API | Usuario | El Analista Técnico revisa el error de integración (falla de comunicación, timeout, autenticación, error de estructura d | — |
| 24 | SP2 | SP2-T01 | Revisar queja radicada y asignar responsable | Usuario | El Gestor de Experiencia revisa el expediente completo de la queja ya radicada ante SFC (datos del cliente, clasificació | — |
| 25 | SP2 | SP2-T02 | Analizar queja y elaborar respuesta técnica | Usuario | El Usuario Zurich del Área Responsable analiza el expediente completo de la queja: revisa el historial del cliente, iden | — |
| 26 | SP2 | SP2-T03 | Reasignar caso a responsable correcto | Usuario | El Usuario Zurich del Área Responsable reasigna el caso al usuario autorizado del área especializada correspondiente (Si | — |
| 27 | SP2 | SP2-T04 | Revisar respuesta borrador (SAC) | Usuario | El Analista SAC revisa la respuesta borrador elaborada por el Área Responsable evaluando: coherencia con los hechos, cla | — |
| 28 | SP2 | SP2-T05 | Ajustar respuesta según observaciones SAC | Usuario | El Área Responsable ajusta el borrador de respuesta incorporando las observaciones del analista SAC. La respuesta correg | — |
| 29 | SP2 | SP2-T06 | Generar PDF de respuesta final | Script | El BPM genera automáticamente el PDF de la carta de respuesta final aplicando la plantilla corporativa de Zurich. Valida | — |
| 30 | SP2 | SP2-T07 | Diligenciar formulario Superintendencia | Usuario | El Usuario Zurich del Área Responsable completa el formulario regulatorio requerido por SFC: Sexo, LGBTIQ+, Condición Es | RESPONSABLE |
| 31 | SP3 | SP3-T01 | Preparar formulario de cierre regulatorio | Usuario | El Usuario Zurich del Área Responsable  completa el formulario de cierre M3 con todos los campos regulatorios de SmartSu | — |
| 32 | SP3 | SP3-T02 | Validar coherencia Fecha Actualización = Fecha Cierre | Script | El BPM realiza validación crítica que compara en tiempo real la Fecha de Actualización y la Fecha de Cierre del formular | — |
| 33 | SP3 | SP3-T03 | Validar nomenclatura y tipo PDF | Script | El BPM valida el archivo adjunto de respuesta final: (1) extensión .pdf válida, (2) nombre cumple el patrón NombreClient | — |
| 34 | SP3 | SP3-T04 | Corregir campos de cierre | Usuario | El Usuario Zurich del Área Responsable corrige los campos señalados por las validaciones previas (T02 y T03): fechas inc | — |
| 35 | SP3 | SP3-T05 | Enviar payload de cierre a API (M3) | Servicio | El sistema construye el payload completo de cierre (30+ campos regulatorios + PDF adjunto codificado) e invoca la API in | — |
| 36 | SP3 | SP3-T06 | Registrar confirmación cierre aceptado | Script | Tras HTTP 200 de SmartSupervision. Registra en el log la confirmación de cierre regulatorio. Actualiza el estado del cas | — |
| 37 | SP3 | SP3-T07 | Registrar rechazo en log | Script | Cuando SmartSupervision devuelve HTTP 400 en el Momento 3. Registra en el log estructurado: código de error, campo(s) re | — |
| 38 | SP3 | SP3-T08 | Corregir error funcional de cierre | Usuario | El Usuario Zurich del Área Responsable corrige los errores funcionales del formulario de cierre indicados por SmartSuper | — |
| 39 | SP3 | SP3-T09 | Corregir error técnico de API en cierre | Usuario | El Analista Técnico revisa el error de integración en el Momento 3 (autenticación, timeout, estructura del payload, fall | — |
| 40 | SP4 | SP4-T01 | Enviar payload de prórroga a API (M2) | Servicio | El BPM construye el payload de solicitud de prórroga con los campos requeridos por SmartSupervision (número de caso SFC, | — |
| 41 | SP4 | SP4-T02 | Registrar rechazo en log | Script | Cuando SmartSupervision rechaza la solicitud de prórroga. Registra en el log: código de error, campo(s) afectados, númer | — |
| 42 | SP4 | SP4-T03 | Notificar prórroga al cliente | Envío | Se envia automáticamente al cliente de la comunicación de prórroga: informa la ampliación del plazo de respuesta, la nue | — |
| 43 | SP4 | SP4-T04 | Actualizar SLA con nueva fecha | Script | Se actualiza el temporizador de SLA del caso con la nueva fecha límite aprobada por SmartSupervision. Recalcula los umbr | — |
| 44 | SP4 | SP4-T05 | Corregir error técnico de API en prorroga | Usuario | El Analista Técnico revisa el error técnico de la API en la solicitud de prórroga (autenticación, timeout, falla de comu | — |
| 45 | SP4 | SP4-T06 | Corregir error funcional de cierre | Usuario | El Área Responsable corrige los campos del formulario de prórroga rechazados por SmartSupervision (motivo inválido, fech | — |


## 2. Directrices

| DIRECTRICES — Lineamientos · Controles · Restricciones · Reglas de Negocio \| TO-BE |
| --- |
| # |
| 1 |
| 2 |
| 3 |
| 4 |
| 5 |
| 6 |
| 7 |
| 8 |
| 9 |
| 10 |
| 11 |
| 12 |
| 13 |
| 14 |
| 15 |
| 16 |
| 17 |
| 18 |
| 19 |
| 20 |
| 21 |
| 22 |
| 23 |
| 24 |
| 25 |
| 26 |
| 27 |
| 28 |
| 29 |
| 30 |
| 31 |
| 32 |
| 33 |
| 34 |
| 35 |
| 36 |
| 37 |
| 38 |
| 39 |
| 40 |
| 41 |
| 42 |
| 43 |
| 44 |
| 45 |
| 46 |
| 47 |
| 48 |
| 49 |
| 50 |
| 51 |
| 52 |
| 53 |
| 54 |
| 55 |
| 56 |
| 57 |


## 3. Roles

| MATRIZ DE ROLES Y RESPONSABILIDADES — Gestión de Quejas Directas TO-BE |
| --- |
| # |
| 1 |
| 2 |
| 3 |
| 4 |
| 5 |
| 6 |
| 7 |
| 8 |
| 9 |
| 10 |
| 11 |
| 12 |
| 13 |
| 14 |
| 15 |
| 16 |
| 17 |
| 18 |
| 19 |
| 20 |
| 21 |
| 22 |
| 23 |
| 24 |
| 25 |
| 26 |
| 27 |
| 28 |
| 29 |
| 30 |
| 31 |
| 32 |
| 33 |
| 34 |
| 35 |
| 36 |
| 37 |
| 38 |
| 39 |
| 40 |
| 41 |
| 42 |
| 43 |
| 44 |


## 4. Pantallas

| INVENTARIO DE PANTALLAS — Historias de Usuario + Criterios de Aceptación \| Solo tareas de Usuario |
| --- |
| # |
| 1 |
| 2 |
| 3 |
| 4 |
| 5 |
| 6 |
| 7 |
| 8 |
| 9 |
| 10 |
| 11 |
| 12 |
| 13 |
| 14 |
| 15 |


## 5. Documentos

| DOCUMENTOS DE ENTRADA Y SALIDA — Gestión de Quejas Directas TO-BE |
| --- |
| # |
| 1 |
| 2 |
| 3 |
| 4 |
| 5 |
| 6 |
| 7 |
| 8 |
| 9 |
| 10 |
| 11 |
| 12 |
| 13 |
| 14 |
| 15 |


## 6. Riesgos

| MATRIZ DE RIESGOS OPERATIVOS — Gestión de Quejas Directas TO-BE |
| --- |
| # |
| 1 |
| 2 |
| 3 |
| 4 |
| 5 |
| 6 |
| 7 |
| 8 |
| 9 |
| 10 |
| 11 |
| 12 |

