# Master Sheet: 05_Reglas

| ID Regla | SCR | Campo/Sección | Tipo Regla | Condición | Acción | Severidad | Bloquea Avance | Mensaje Asociado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RUL-003-01 | SCR-003 | analisisTecnico | Restricción | analisisTecnico vacío al confirmar | Bloquear. Mostrar MSG-003-01 | 🔴 BLOQUEA | Sí | MSG-003-01 | — |
| RUL-004-01 | SCR-004 | requiereReporteSIC | Restricción | PENDIENTE LEGAL. Solo enviar reporte SIC cuando área legal confirma criterios Ley 1581/2012 | Bloquear si no existe autorización del área legal | 🔴 BLOQUEA | Sí | MSG-004-01 | ⚠️ PENDIENTE LEGAL |
| RUL-004-02 | SCR-004 | S2 Reporte SIC | Control | requiereReporteSIC = No | Ocultar sección S2 y S3. Avanzar directo a análisis de impacto | info | No | — | — |
| RUL-005-01 | SCR-005 | medidaContencion | Restricción | medidaContencion vacía al guardar | Bloquear. Se requiere al menos una medida de contención bajo Ley 1581/2012 | 🔴 BLOQUEA | Sí | MSG-005-01 | — |
| RUL-005-02 | SCR-005 | medidaPreventiva | Restricción | medidaPreventiva vacía al guardar | Bloquear. Se requiere al menos una medida preventiva bajo Ley 1581/2012 | 🔴 BLOQUEA | Sí | MSG-005-02 | — |
| RUL-006-01 | SCR-006 | plantillaSeleccionada | Restricción | plantillaSeleccionada vacía al enviar a aprobación | Bloquear. No se permite texto libre sin plantilla corporativa. Mostrar MSG-006-01 | 🔴 BLOQUEA | Sí | MSG-006-01 | — |
| RUL-006-02 | SCR-006 | respuestaFinal | Control | respuestaFinal tiene menos de 100 caracteres | Bloquear. Mostrar MSG-006-02 | 🔴 BLOQUEA | Sí | MSG-006-02 | — |
| RUL-006-03 | SCR-006 | usuarioResponsable | Control | usuarioResponsable sin seleccionar al confirmar asignación | Bloquear confirmación. Mostrar MSG-006-03 | 🔴 BLOQUEA | Sí | MSG-006-03 | — |
| RUL-006-04 | SCR-006 | respuestaDP | Restricción | respuestaDP tiene menos de 100 caracteres | Bloquear. No se permite respuesta genérica al peticionario. Mostrar MSG-006-04 | 🔴 BLOQUEA | Sí | MSG-006-04 | — |
| RUL-007-01 | SCR-007 | respuestaDP | Restricción | respuestaDP tiene menos de 100 caracteres | Bloquear. No se permite respuesta genérica. Mostrar MSG-007-01 | 🔴 BLOQUEA | Sí | MSG-007-01 | — |
| RUL-008-01 | SCR-008 | usuarioResponsable | Control | usuarioResponsable sin seleccionar al enviar solicitud | Bloquear envío. Mostrar MSG-008-01 | 🔴 BLOQUEA | Sí | MSG-008-01 | — |
| RUL-009-01 | SCR-009 | motivoNoViabilidad | Control | modificacionViable = No y motivoNoViabilidad vacío | Bloquear. Mostrar MSG-009-01 | 🔴 BLOQUEA | Sí | MSG-009-01 | — |
| RUL-009-02 | SCR-009 | adjuntoEvidencia | Restricción | modificacionViable = Sí y adjuntoEvidencia vacío | Bloquear. Se requiere evidencia de la modificación. Mostrar MSG-009-02 | 🔴 BLOQUEA | Sí | MSG-009-02 | — |
| RUL-009-03 | SCR-009 | usuarioResponsable | Control | usuarioResponsable sin seleccionar al enviar solicitud | Bloquear envío. Mostrar MSG-009-03 | 🔴 BLOQUEA | Sí | MSG-009-03 | — |
| RUL-010-01 | SCR-010 | plantillaSeleccionada | Restricción | plantillaSeleccionada vacía al enviar a aprobación | Bloquear. No se permite texto libre sin plantilla corporativa. Mostrar MSG-010-01 | 🔴 BLOQUEA | Sí | MSG-010-01 | Solo aplica si requiereComunicacion = Sí. |
| RUL-010-02 | SCR-010 | respuestaFinal | Control | respuestaFinal tiene menos de 100 caracteres | Bloquear. Mostrar MSG-010-02 | 🔴 BLOQUEA | Sí | MSG-010-02 | Solo aplica si requiereComunicacion = Sí. |
| RUL-012-01 | SCR-012 | obsLiderSAC | Restricción | Acción = Devolver y obsLiderSAC vacío | Bloquear devolución. Mostrar MSG-012-01 | 🔴 BLOQUEA | Sí | MSG-012-01 | — |
| RUL-012-02 | SCR-012 | versionRevision | Regla de Negocio | Número de rechazos consecutivos = 2 | Escalar automáticamente al siguiente nivel jerárquico | 🔵 RN | No | — | — |
| RUL-SP06-01 | SP06 | Correo al cliente | Restricción | estadoCaso != 'Respuesta Aprobada' | Bloquear envío de correo al cliente | 🔴 BLOQUEA | Sí | MSG-SP06-01 | — |
| RUL-SP06-02 | SP06 | Segundo envío correo | Regla de Negocio | Caso reabierto y correo previo ya enviado | Solicitar confirmación explícita antes de segundo envío. Mostrar MSG-SP06-02 | 🔵 RN | No | MSG-SP06-02 | — |
