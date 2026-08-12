# Master Sheet: 04_Acciones

| ID Acción | SCR | Etiqueta | Tipo / Estilo | Condición de habilitación | Descripción / Resultado | Siguiente Paso BPMN |
| --- | --- | --- | --- | --- | --- | --- |
| ACT-003-01 | SCR-003 | Confirmar Atención Línea 2 | Primaria | analisisTecnico no vacío | Registra la respuesta de Línea 2 y retorna el caso al flujo principal. | Retorno a P02 → SP05 o cierre interno |
| ACT-003-02 | SCR-003 | Reasignar Caso | Secundaria | Siempre | Abre modal de reasignación a otro usuario de Línea 2. | Reasignación |
| ACT-003-03 | SCR-003 | Cancelar | Secundaria | Siempre | Descarta los cambios. | — |
| ACT-003-04 | SCR-003 | Guardar Borrador | Secundaria | Siempre | Guarda el progreso del análisis técnico sin avanzar el flujo. | — |
| ACT-004-01 | SCR-004 | Confirmar Reporte SIC | Primaria | Campos sección S2 y S3 completos | Registra el reporte, adjunta acuse de recibo y avanza el flujo. | SP01-T04 Análisis de Impacto |
| ACT-004-02 | SCR-004 | No Aplica Reporte | Secundaria | requiereReporteSIC = No | Registra que no aplica reporte y avanza directamente al análisis de impacto. | SP01-T04 Análisis de Impacto |
| ACT-004-03 | SCR-004 | Cancelar | Destructiva | Siempre | Descarta los cambios. | — |
| ACT-005-01 | SCR-005 | Guardar Plan y Avanzar | Primaria | Todos los campos de análisis y plan completos | Registra el análisis de impacto y el plan de mitigación en el expediente. | SP01-T05 Notificar al Titular |
| ACT-005-02 | SCR-005 | Cancelar | Secundaria | Siempre | Descarta los cambios. | — |
| ACT-006-01 | SCR-006 | Confirmar Asignación | Primaria | areaCompetente y usuarioResponsable seleccionados | Asigna el caso, notifica al responsable, registra la fecha de asignación y agrega la asignación al Historial de Asignaciones (S3). | SP02-T04 o SP02-T05 |
| ACT-006-02 | SCR-006 | Cancelar | Destructiva | Siempre | Descarta los cambios. | — |
| ACT-006-03 | SCR-006 | Ver Respuesta | Enlace | Fila con ¿Respondida? = Sí | Abre popup con el análisis técnico del responsable y el link de descarga de soportes internos. | — (permanece en SP02-T03) |
| ACT-006-04 | SCR-006 | Guardar Borrador | Secundaria | Siempre | Guarda el progreso de la respuesta sin avanzar el flujo. | — |
| ACT-006-05 | SCR-006 | Enviar a Aprobación | Primaria | plantillaSeleccionada y respuestaFinal con mín 100 car. | Envía la respuesta final al Líder SAC para aprobación. | SP05-T05 Aprobación Líder SAC |
| ACT-007-01 | SCR-007 | Registrar y Avanzar | Primaria | analisisFondo, posicionZurich y respuestaDP no vacíos | Registra el análisis y la respuesta en el expediente. Habilita SP05. | SP05 Preparar Respuesta Final |
| ACT-007-02 | SCR-007 | Guardar Borrador | Secundaria | Siempre | Guarda el progreso sin avanzar el flujo. | — |
| ACT-007-03 | SCR-007 | Cancelar | Secundaria | Siempre | Descarta los cambios. | — |
| ACT-008-01 | SCR-008 | Registrar y Avanzar | Primaria | respuestaInfo no vacío | Registra la información en el expediente y avanza al SP05. | SP05 Preparar Respuesta Final |
| ACT-008-02 | SCR-008 | Guardar Borrador | Secundaria | Siempre | Guarda el progreso sin avanzar. | — |
| ACT-008-03 | SCR-008 | Cancelar | Secundaria | Siempre | Descarta los cambios. | — |
| ACT-008-04 | SCR-008 | Enviar Solicitud | Primaria | usuarioResponsable seleccionado | Envía la solicitud de información adicional al responsable y la agrega al Historial de Solicitudes (S3). | — (permanece en SP03-SP02) |
| ACT-008-05 | SCR-008 | Ver Respuesta | Enlace | Fila con ¿Respondida? = Sí | Abre popup con el análisis técnico, las acciones ejecutadas y el link de descarga de soportes internos. | — (permanece en SP03-SP02) |
| ACT-009-01 | SCR-009 | Confirmar Modificación | Primaria | Evidencia adjuntada cuando modificacion = Sí | Registra la evidencia y avanza al SP05 si viable. | SP05 Preparar Respuesta Final |
| ACT-009-02 | SCR-009 | Registrar No Viabilidad | Secundaria | modificacionViable = No y motivo ingresado | Registra el motivo de no viabilidad y avanza al SP05. | SP05 Preparar Respuesta Final |
| ACT-009-03 | SCR-009 | Cancelar | Destructiva | Siempre | Descarta los cambios. | — |
| ACT-009-04 | SCR-009 | Enviar Solicitud | Primaria | usuarioResponsable seleccionado | Envía la solicitud de información adicional al responsable y la agrega al Historial de Solicitudes (S4). | — (permanece en SP03-SP03) |
| ACT-009-05 | SCR-009 | Ver Respuesta | Enlace | Fila con ¿Respondida? = Sí | Abre popup con el análisis técnico, las acciones ejecutadas y el link de descarga de soportes internos. | — (permanece en SP03-SP03) |
| ACT-009-06 | SCR-009 | Guardar Borrador | Secundaria | Siempre | Guarda el progreso de la verificación sin avanzar el flujo. | — |
| ACT-010-01 | SCR-010 | Registrar y Determinar Comunicación | Primaria | Campos de análisis completados y requiereComunicacion seleccionado | Si Sí → SP05. Si No → cierre interno. | SP05 o Cierre interno |
| ACT-010-02 | SCR-010 | Cancelar | Secundaria | Siempre | Descarta los cambios. | — |
| ACT-012-01 | SCR-012 | Aprobar Respuesta | Primaria | Siempre | Aprueba la respuesta. El sistema genera el PDF final y avanza al SP06. | SP05-T07 → SP06 Cierre |
| ACT-012-02 | SCR-012 | Devolver con Observaciones | Secundaria | obsLiderSAC no vacío | Devuelve con observaciones al Gestor de Experiencia para ajuste. | SP05-T06 Ajuste Respuesta |
