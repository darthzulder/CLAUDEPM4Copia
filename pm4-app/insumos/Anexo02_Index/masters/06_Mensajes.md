# Master Sheet: 06_Mensajes

| ID Mensaje | SCR | Tipo | Título | Texto del Mensaje | Se Muestra Cuando | Resultado BPMN |
| --- | --- | --- | --- | --- | --- | --- |
| MSG-003-01 | SCR-003 | Error | Sin corrección | Debe modificar el campo señalado antes de reenviar a SmartSupervision. | Al validar o al ejecutar acción en SCR-003 | Bloquea |
| MSG-003-02 | SCR-003 | Advertencia | Múltiples intentos | Ha intentado [N] veces. Si el problema persiste, considere escalar a soporte técnico. | Al validar o al ejecutar acción en SCR-003 | Informa |
| MSG-003-03 | SCR-003 | Éxito | Reenvío iniciado | Corrección registrada. Reenviando payload a SmartSupervision (Intento [N+1]). | Al validar o al ejecutar acción en SCR-003 | Continúa |
| MSG-004-01 | SCR-004 | Error | Campos vacíos | Debe registrar la causa raíz y la corrección aplicada antes de autorizar el reenvío. | Al validar o al ejecutar acción en SCR-004 | Bloquea |
| MSG-004-02 | SCR-004 | Éxito | Reenvío autorizado | Corrección técnica registrada. Reenvío autorizado. Ejecutando payload (Intento [N+1]). | Al validar o al ejecutar acción en SCR-004 | Continúa |
| MSG-008-01 | SCR-008 | Error | Observaciones vacías | Debe documentar las observaciones para devolver la respuesta al área responsable. | Al validar o al ejecutar acción en SCR-008 | Bloquea |
| MSG-008-02 | SCR-008 | Advertencia | SLA crítico | ⚠ El caso tiene [N] día(s) hábil(es). Priorice la revisión. | Al validar o al ejecutar acción en SCR-008 | Informa |
| MSG-008-03 | SCR-008 | Éxito | Respuesta aprobada | Respuesta aprobada. El sistema generará el PDF de respuesta final automáticamente. | Al validar o al ejecutar acción en SCR-008 | Continúa |
| MSG-008-04 | SCR-008 | Información | Respuesta devuelta | Respuesta devuelta al área responsable con observaciones. Versión [N+1] pendiente. | Al validar o al ejecutar acción en SCR-008 | Informa |
| MSG-009-01 | SCR-009 | Advertencia | Campos fraude obligatorios | La queja está relacionada con fraude. Complete los campos requeridos por CE 019/2024: Tipo, Modalidad, Montos. | Al validar o al ejecutar acción en SCR-009 | Informa |
| MSG-009-02 | SCR-009 | Error | Campos SFC incompletos | Existen campos obligatorios de SmartSupervision sin completar. Complete todos antes de guardar. | Al validar o al ejecutar acción en SCR-009 | Bloquea |
| MSG-009-03 | SCR-009 | Éxito | Formulario guardado | Formulario regulatorio guardado. Subproceso SP3 de cierre habilitado. | Al validar o al ejecutar acción en SCR-009 | Continúa |
| MSG-009-04 | SCR-009 | Advertencia | LGBTIQ+ pendiente (obsoleto) | (Obsoleto/eliminado) LGBTIQ+ ya no está pendiente: se resuelve contra CAT-LGBTIQ (colección 41). Mensaje retirado de la pantalla. | Al validar o al ejecutar acción en SCR-009 | Informa |
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
| MSG-0051-01 | SCR-0051 | Advertencia | SLA crítico | ⚠ El caso tiene [N] día(s) hábil(es) restante(s). Priorice la gestión; puede solicitar prórroga regulatoria. | Al validar o al ejecutar acción en SCR-0051 | Informa |
| MSG-0051-02 | SCR-0051 | Error | Campo obligatorio vacío | El campo Respuesta al Cliente es obligatorio para enviar. | Al validar o al ejecutar acción en SCR-0051 | Bloquea |
| MSG-0051-03 | SCR-0051 | Error | Reasignación incompleta | El área destino, el motivo y las observaciones son obligatorios para registrar la reasignación. | Al validar o al ejecutar acción en SCR-0051 | Bloquea |
| MSG-0051-04 | SCR-0051 | Éxito | Asignación registrada | Caso asignado a [Usuario] ([Área]). Notificación enviada al responsable. | Al validar o al ejecutar acción en SCR-0051 | Continúa |
| MSG-0051-05 | SCR-0051 | Éxito | Enviado a SAC | Borrador de respuesta enviado al Analista SAC para revisión. Estado: En revisión SAC. | Al validar o al ejecutar acción en SCR-0051 | Continúa |
| MSG-0052-01 | SCR-0052 | Error | Comentario obligatorio | Debe escribir un comentario antes de enviarlo. | Al validar o al ejecutar acción en SCR-0052 | Bloquea |
| MSG-0052-02 | SCR-0052 | Éxito | Comentario enviado | Comentario y adjunto registrados en el historial del caso. | Al validar o al ejecutar acción en SCR-0052 | Continúa |
| MSG-0051-06 | SCR-0051 | Advertencia | Límite de ayudantes alcanzado | Ha alcanzado el máximo de 4 ayudantes para este caso. No puede añadir más. | Al validar o al ejecutar acción en SCR-0051 | Informa |
| MSG-013-01 | SCR-013 | Información | Vista en tiempo real | Vista consolidada de casos en tiempo real. Los KPIs y la tabla se actualizan al recargar. | Siempre visible (banner) | Informa |
| MSG-013-02 | SCR-013 | Error | No se pudieron cargar los casos | No se pudieron cargar los casos desde PM4. Mostrando datos de ejemplo. | Al fallar la carga desde la API | Informa |
| MSG-013-03 | SCR-013 | Información | Sin resultados | No hay casos que coincidan con los filtros seleccionados. | Tabla filtrada vacía | Informa |
