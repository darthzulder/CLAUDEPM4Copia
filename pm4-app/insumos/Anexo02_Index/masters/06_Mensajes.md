# Master Sheet: 06_Mensajes

| ID Mensaje | SCR | Tipo | Título | Texto del Mensaje | Se Muestra Cuando | Resultado BPMN |
| --- | --- | --- | --- | --- | --- | --- |
| MSG-001-01 | SCR-001 | Error | Correo inválido | El correo electrónico no tiene formato válido. Formato esperado: usuario@dominio.com | Al validar o al ejecutar acción en SCR-001 | Bloquea |
| MSG-001-02 | SCR-001 | Error | ID inválido | El número de identificación debe contener solo dígitos, entre 6 y 15 caracteres. | Al validar o al ejecutar acción en SCR-001 | Bloquea |
| MSG-001-03 | SCR-001 | Error | Caracteres no permitidos | El campo contiene caracteres no permitidos por SmartSupervision. Corrija antes de continuar. | Al validar o al ejecutar acción en SCR-001 | Bloquea |
| MSG-001-04 | SCR-001 | Éxito | Caso creado | Queja creada exitosamente. Número de caso: [ID]. Iniciando radicación ante SmartSupervision. | Al validar o al ejecutar acción en SCR-001 | Continúa |
| MSG-002-01 | SCR-002 | Advertencia | Errores pendientes | Tiene [N] campos con error. Corrija todos los campos resaltados para continuar. | Al validar o al ejecutar acción en SCR-002 | Informa |
| MSG-002-02 | SCR-002 | Éxito | Sin errores | Todos los campos son válidos. Puede continuar con la radicación ante SmartSupervision. | Al validar o al ejecutar acción en SCR-002 | Continúa |
| MSG-003-01 | SCR-003 | Error | Sin corrección | Debe modificar el campo señalado antes de reenviar a SmartSupervision. | Al validar o al ejecutar acción en SCR-003 | Bloquea |
| MSG-003-02 | SCR-003 | Advertencia | Múltiples intentos | Ha intentado [N] veces. Si el problema persiste, considere escalar a soporte técnico. | Al validar o al ejecutar acción en SCR-003 | Informa |
| MSG-003-03 | SCR-003 | Éxito | Reenvío iniciado | Corrección registrada. Reenviando payload a SmartSupervision (Intento [N+1]). | Al validar o al ejecutar acción en SCR-003 | Continúa |
| MSG-004-01 | SCR-004 | Error | Campos vacíos | Debe registrar la causa raíz y la corrección aplicada antes de autorizar el reenvío. | Al validar o al ejecutar acción en SCR-004 | Bloquea |
| MSG-004-02 | SCR-004 | Éxito | Reenvío autorizado | Corrección técnica registrada. Reenvío autorizado. Ejecutando payload (Intento [N+1]). | Al validar o al ejecutar acción en SCR-004 | Continúa |
| MSG-005-01 | SCR-005 | Advertencia | SLA crítico | ⚠ El caso tiene [N] día(s) hábil(es) restante(s). Asigne inmediatamente para cumplir el plazo regulatorio. | Al validar o al ejecutar acción en SCR-005 | Informa |
| MSG-005-02 | SCR-005 | Éxito | Asignación confirmada | Caso asignado a [Usuario]. Notificación enviada al responsable. | Al validar o al ejecutar acción en SCR-005 | Continúa |
| MSG-006-01 | SCR-006 | Error | Campos vacíos | El motivo y las observaciones son obligatorios para registrar la reasignación. | Al validar o al ejecutar acción en SCR-006 | Bloquea |
| MSG-006-02 | SCR-006 | Error | Usuario no autorizado | El usuario seleccionado no tiene el rol autorizado para gestionar quejas directas. | Al validar o al ejecutar acción en SCR-006 | Bloquea |
| MSG-006-03 | SCR-006 | Éxito | Reasignación exitosa | Caso reasignado a [Nuevo Responsable] ([Área]). Historial actualizado. Notificación enviada. | Al validar o al ejecutar acción en SCR-006 | Continúa |
| MSG-007-01 | SCR-007 | Error | Campos obligatorios vacíos | Los campos Causa Raíz, Posición Zurich y Respuesta al Cliente son obligatorios para enviar a revisión SAC. | Al validar o al ejecutar acción en SCR-007 | Bloquea |
| MSG-007-02 | SCR-007 | Advertencia | SLA crítico | ⚠ El caso tiene [N] día(s) hábil(es). Priorice el análisis para cumplir el plazo regulatorio. | Al validar o al ejecutar acción en SCR-007 | Informa |
| MSG-007-03 | SCR-007 | Éxito | Enviado a SAC | Borrador de respuesta enviado al Analista SAC para revisión (Versión [N]). | Al validar o al ejecutar acción en SCR-007 | Continúa |
| MSG-008-01 | SCR-008 | Error | Observaciones vacías | Debe documentar las observaciones para devolver la respuesta al área responsable. | Al validar o al ejecutar acción en SCR-008 | Bloquea |
| MSG-008-02 | SCR-008 | Advertencia | SLA crítico | ⚠ El caso tiene [N] día(s) hábil(es). Priorice la revisión. | Al validar o al ejecutar acción en SCR-008 | Informa |
| MSG-008-03 | SCR-008 | Éxito | Respuesta aprobada | Respuesta aprobada. El sistema generará el PDF de respuesta final automáticamente. | Al validar o al ejecutar acción en SCR-008 | Continúa |
| MSG-008-04 | SCR-008 | Información | Respuesta devuelta | Respuesta devuelta al área responsable con observaciones. Versión [N+1] pendiente. | Al validar o al ejecutar acción en SCR-008 | Informa |
| MSG-009-01 | SCR-009 | Advertencia | Campos fraude obligatorios | La queja está relacionada con fraude. Complete los campos requeridos por CE 019/2024: Tipo, Modalidad, Montos. | Al validar o al ejecutar acción en SCR-009 | Informa |
| MSG-009-02 | SCR-009 | Error | Campos SFC incompletos | Existen campos obligatorios de SmartSupervision sin completar. Complete todos antes de guardar. | Al validar o al ejecutar acción en SCR-009 | Bloquea |
| MSG-009-03 | SCR-009 | Éxito | Formulario guardado | Formulario regulatorio guardado. Subproceso SP3 de cierre habilitado. | Al validar o al ejecutar acción en SCR-009 | Continúa |
| MSG-009-04 | SCR-009 | Advertencia | LGBTIQ+ pendiente | ⚠ El catálogo LGBTIQ+ está pendiente de confirmación con TI. Verifique antes de transmitir a SmartSupervision. | Al validar o al ejecutar acción en SCR-009 | Informa |
| MSG-010-01 | SCR-010 | Error | Fechas no coinciden | ⚠ CRÍTICO: La Fecha de Actualización y la Fecha de Cierre deben ser exactamente iguales para enviar a SmartSupervision. | Al validar o al ejecutar acción en SCR-010 | Bloquea |
| MSG-010-02 | SCR-010 | Error | Nomenclatura PDF inválida | El archivo PDF no cumple la nomenclatura requerida: NombreCliente_NumeroIdentificacion_RESP_FINAL_SFC_N | Al validar o al ejecutar acción en SCR-010 | Bloquea |
| MSG-010-03 | SCR-010 | Éxito | Cierre aceptado HTTP 200 | ✓ SmartSupervision aceptó el cierre (HTTP 200). Habilitando envío de respuesta al cliente (P01-T08). | Al validar o al ejecutar acción en SCR-010 | Continúa |
| MSG-010-04 | SCR-010 | Error | Cierre rechazado HTTP 400 | SmartSupervision rechazó el cierre. Campo: [campo]. Error: [mensaje SFC]. Corrija y reenvíe. | Al validar o al ejecutar acción en SCR-010 | Bloquea |
| MSG-010-05 | SCR-010 | Advertencia | Múltiples intentos M3 | Ha realizado [N] intentos de cierre M3. Si el problema persiste, escale a soporte técnico. | Al validar o al ejecutar acción en SCR-010 | Informa |
| MSG-011-01 | SCR-011 | Error | Campos vacíos | Debe registrar la causa raíz y la corrección aplicada antes de autorizar el reenvío de la prórroga. | Al validar o al ejecutar acción en SCR-011 | Bloquea |
| MSG-011-02 | SCR-011 | Éxito | Reenvío prórroga autorizado | Corrección técnica registrada. Reenviando solicitud de prórroga (Intento [N+1]). | Al validar o al ejecutar acción en SCR-011 | Continúa |
| MSG-012-01 | SCR-012 | Error | Fecha inválida | La nueva fecha límite debe ser posterior a la fecha actual. | Al validar o al ejecutar acción en SCR-012 | Bloquea |
| MSG-012-02 | SCR-012 | Éxito | Prórroga reenviada | Solicitud de prórroga corregida y reenviada a SmartSupervision (Intento [N+1]). | Al validar o al ejecutar acción en SCR-012 | Continúa |
| MSG-000-01 | SCR-000 | Error | Teléfono inválido | El número de celular debe contener exactamente 10 dígitos, sin espacios ni caracteres especiales. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
| MSG-000-02 | SCR-000 | Error | Correo inválido | El correo electrónico no tiene formato válido. Formato esperado: usuario@dominio.com | Al validar o al ejecutar acción en SCR-000 | Bloquea |
| MSG-000-03 | SCR-000 | Error | Detalle insuficiente | El detalle de la queja debe tener mínimo 50 y máximo 2000 caracteres. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
| MSG-000-04 | SCR-000 | Advertencia | Autorización requerida | Debe aceptar el tratamiento de datos personales para poder radicar su solicitud. | Al validar o al ejecutar acción en SCR-000 | Informa |
| MSG-000-05 | SCR-000 | Error | Captcha pendiente | Debe completar la validación de seguridad (captcha) antes de enviar. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
| MSG-000-06 | SCR-000 | Error | Archivo no permitido | Solo se permiten archivos pdf, jpg, png o docx, de máximo 5 MB cada uno. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
| MSG-000-07 | SCR-000 | Error | Identificación inválida | El número de identificación no cumple el formato requerido para el tipo de documento seleccionado. | Al validar o al ejecutar acción en SCR-000 | Bloquea |
| MSG-000-08 | SCR-000 | Éxito | PQRS radicada | Su solicitud fue radicada exitosamente. Número de caso: [ID]. Recibirá la respuesta en el correo registrado. | Al validar o al ejecutar acción en SCR-000 | Continúa |
