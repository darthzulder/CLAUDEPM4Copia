# Master Sheet: 04_Acciones

| ID Acción | SCR | Etiqueta | Tipo / Estilo | Condición de habilitación | Descripción / Resultado | Siguiente Paso BPMN | Regla Asociada |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ACT-001-01 | SCR-001 | Crear Queja | Primaria | Todos los campos obligatorios válidos | Ejecuta P01-T06 validación preventiva. Si OK → crea caso y activa SP1. Si error → resalta campos. | P01-T06 validación → SP1 radicación | — |
| ACT-001-02 | SCR-001 | Guardar Borrador | Secundaria | Siempre | Guarda el formulario sin crear caso ni ejecutar validación completa. | P01-T06 validación → SP1 radicación | — |
| ACT-001-03 | SCR-001 | Cancelar | Destructiva | Siempre | Descarta el formulario sin guardar cambios. | P01-T06 validación → SP1 radicación | — |
| ACT-002-01 | SCR-002 | Guardar Correcciones | Primaria | Solo cuando contadorErrores = 0 | Re-ejecuta P01-T06. Si OK → habilita SP1. | Re-ejecuta P01-T06 → SP1 | — |
| ACT-002-02 | SCR-002 | Cancelar Corrección | Secundaria | Siempre | Devuelve el caso a estado 'Pendiente corrección'. | Re-ejecuta P01-T06 → SP1 | — |
| ACT-003-01 | SCR-003 | Corregir y Reenviar | Primaria | Campo afectado fue modificado | Guarda y ejecuta SP1-T02 para reenvío M2. | SP1-T02 reenvío M2 | — |
| ACT-003-02 | SCR-003 | Escalar a Soporte Técnico | Secundaria | Siempre | Envía a Analista Técnico si el error requiere intervención técnica. | SP1-T02 reenvío M2 | — |
| ACT-003-03 | SCR-003 | Ver Log Completo | Link | Siempre | Abre vista del log detallado de transmisiones. | SP1-T02 reenvío M2 | — |
| ACT-004-01 | SCR-004 | Autorizar Reenvío | Primaria | causaRaiz y correccionAplicada no vacíos | Registra en log y ejecuta SP1-T02. | SP1-T02 reenvío autorizado | — |
| ACT-004-02 | SCR-004 | Escalar a Proveedor | Secundaria | Siempre | Genera ticket de incidente con el proveedor de la API. | SP1-T02 reenvío autorizado | — |
| ACT-004-03 | SCR-004 | Ver Log Completo | Link | Siempre | — | SP1-T02 reenvío autorizado | — |
| ACT-005-01 | SCR-005 | Confirmar Asignación | Primaria | usuarioResponsable seleccionado | Registra asignación, notifica responsable. Estado → 'En análisis'. | Si confirma → SP2-T02; si reasigna → PAN-06 | — |
| ACT-005-02 | SCR-005 | Reasignar Caso | Secundaria | Siempre | Abre PAN-06 para reasignación detallada. | Si confirma → SP2-T02; si reasigna → PAN-06 | — |
| ACT-005-03 | SCR-005 | Solicitar Prórroga | Terciaria | SLA en riesgo | Inicia SP4 Prórroga Regulatoria. | Si confirma → SP2-T02; si reasigna → PAN-06 | — |
| ACT-006-01 | SCR-006 | Confirmar Reasignación | Primaria | Todos los campos obligatorios completos | Registra historial. Notifica nuevo responsable. | SP2-T02 en nueva área | — |
| ACT-006-02 | SCR-006 | Cancelar | Secundaria | Siempre | Cierra modal sin reasignar. | SP2-T02 en nueva área | — |
| ACT-007-01 | SCR-007 | Enviar a Revisión SAC | Primaria | causaRaiz, posicionZurich, respuestaCliente no vacíos | Estado → 'En revisión SAC'. Notifica Analista SAC. | SP2-T04 Revisión SAC | — |
| ACT-007-02 | SCR-007 | Guardar Borrador | Secundaria | Siempre | — | SP2-T04 Revisión SAC | — |
| ACT-007-03 | SCR-007 | Ver Expediente Completo | Link | Siempre | — | SP2-T04 Revisión SAC | — |
| ACT-008-01 | SCR-008 | Aprobar Respuesta | Primaria | Siempre | Habilita SP2-T06 (generar PDF). Estado → 'Respuesta aprobada'. | Si aprueba → SP2-T06 PDF; si devuelve → PAN-07 | — |
| ACT-008-02 | SCR-008 | Devolver con Observaciones | Destructiva | observacionesSAC no vacío | Devuelve al área responsable. Estado → 'Ajuste en progreso'. | Si aprueba → SP2-T06 PDF; si devuelve → PAN-07 | — |
| ACT-008-03 | SCR-008 | Reasignar Caso | Terciaria | Siempre | Abre PAN-06 para reasignación. | Si aprueba → SP2-T06 PDF; si devuelve → PAN-07 | — |
| ACT-008-04 | SCR-008 | Vista Previa Respuesta Final | Secundaria | Siempre | Muestra la vista previa de la carta de respuesta final (formato SFC) con los textos aprobados. | — | — |
| ACT-009-01 | SCR-009 | Guardar Formulario | Primaria | Todos los campos obligatorios SFC completos | Valida, guarda y habilita SP3. | SP3 — Cerrar Queja ante SmartSupervision | — |
| ACT-009-02 | SCR-009 | Guardar Borrador | Secundaria | Siempre | No habilita SP3. | SP3 — Cerrar Queja ante SmartSupervision | — |
| ACT-010-01 | SCR-010 | Enviar a SmartSupervision | Primaria | fechaActualizacion=fechaCierre AND nomenclatura PDF OK AND todos obligatorios | Habilitado SOLO cuando todas las validaciones pasan (RUL-10-01, RUL-10-02, RUL-10-03). | P01-T08 Enviar respuesta final (SOLO tras HTTP 200 | — |
| ACT-010-02 | SCR-010 | Reenviar Cierre (corrección) | Primaria (corrección) | Visible cuando estado='Rechazado (400)' | Registra corrección y ejecuta reenvío. | P01-T08 Enviar respuesta final (SOLO tras HTTP 200 | — |
| ACT-010-03 | SCR-010 | Ver Log de Intentos M3 | Link | Siempre | — | P01-T08 Enviar respuesta final (SOLO tras HTTP 200 | — |
| ACT-011-01 | SCR-011 | Autorizar Reenvío Prórroga | Primaria | causaRaizProrroga y correccionProrroga no vacíos | Registra corrección y ejecuta SP4-T01 reenvío. | SP4-T01 reenvío autorizado | — |
| ACT-011-02 | SCR-011 | Escalar a Proveedor | Secundaria | Siempre | — | SP4-T01 reenvío autorizado | — |
| ACT-012-01 | SCR-012 | Reenviar Prórroga | Primaria | Todos los campos de prórroga completos | Registra corrección y ejecuta SP4-T01 reenvío. | SP4-T01 reenvío payload corregido | — |
| ACT-012-02 | SCR-012 | Cancelar Prórroga | Destructiva | Siempre | Cancela prórroga y retorna al flujo principal. | SP4-T01 reenvío payload corregido | — |
| ACT-000-01 | SCR-000 | Enviar PQRS | Primaria | Autorización de datos aceptada AND captcha válido AND todos los campos obligatorios válidos | Valida los datos, crea el caso con ID único y ejecuta P01-T01 (recibir y registrar la queja). Asigna instancia y punto de recepción según rol. | P01-T01 recepción → P01-T06 validación | RUL-000-07 |
| ACT-000-02 | SCR-000 | Limpiar Formulario | Secundaria | Siempre | Limpia todos los campos del formulario sin crear caso. | — | — |
| ACT-000-03 | SCR-000 | Cancelar | Destructiva | Siempre | Descarta el formulario y sale del portal de autoservicio. | — | — |
| ACT-0051-01 | SCR-0051 | Confirmar Asignación | Primaria | usuarioResponsable seleccionado | Registra la asignación inicial y notifica al responsable. Estado → 'En análisis'. | SP2-T01 → SP2-T02 | RUL-0051-02 |
| ACT-0051-02 | SCR-0051 | Reasignar Queja | Secundaria | Siempre | Habilita la edición de la asignación y despliega el bloque de reasignación (PAN-06). | SP2-T03 Reasignar | RUL-0051-01 |
| ACT-0051-03 | SCR-0051 | Confirmar Reasignación | Primaria | Área destino, motivo y observaciones completos | Registra la reasignación en el historial y notifica al nuevo responsable. | SP2-T03 → SP2-T02 nueva área | RUL-0051-04 |
| ACT-0051-04 | SCR-0051 | Solicitar Prórroga Regulatoria | Terciaria | SLA ≤ 2 días hábiles | Inicia SP4 Prórroga Regulatoria (POST /api/1.0/workflow → SP4-T01). | SP4-T01 Solicitar Prórroga | RUL-0051-03 |
| ACT-0051-05 | SCR-0051 | Vista Previa Respuesta Final | Secundaria | Siempre | Muestra la vista previa de la carta de respuesta final (formato SFC) con los textos elaborados. | — | — |
| ACT-0051-06 | SCR-0051 | Ver Expediente Completo | Link | Siempre | Abre el expediente completo del caso. | — | — |
| ACT-0051-07 | SCR-0051 | Guardar Borrador | Secundaria | Siempre | Guarda el borrador de respuesta sin enviar a revisión. | — | — |
| ACT-0051-08 | SCR-0051 | Enviar | Primaria | respuestaCliente no vacío | Guarda el borrador y notifica al Analista SAC. Estado → 'En revisión SAC'. | SP2-T04 Revisión SAC | RUL-0051-05 |
| ACT-0052-01 | SCR-0052 | Enviar comentario | Primaria | comentario no vacío | Registra el comentario y el adjunto en el historial del caso y notifica al responsable. | SP2-T02 | RUL-0052-01 |
| ACT-0052-02 | SCR-0052 | Guardar Borrador | Secundaria | Siempre | Guarda el comentario como borrador sin enviarlo. | — | — |
| ACT-0052-03 | SCR-0052 | Volver | Link | Siempre | Regresa a la bandeja / pantalla anterior sin guardar. | — | — |
