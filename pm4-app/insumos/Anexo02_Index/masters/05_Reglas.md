# Master Sheet: 05_Reglas

| ID Regla | SCR | Campo / Acción | Tipo Regla | Momento de Ejecución | Condición | Acción del Sistema | Severidad | Bloquea Avance | Mensaje Asociado | Impacto BPMN |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RUL-001-01 | SCR-001 | FLD-007 | Restricción | Al guardar | correoElectronico no tiene formato RFC 5321 | Bloquear. Mostrar MSG-001-01 | Error | Sí | MSG-001-01 | Bloquea compuerta ¿Datos válidos? |
| RUL-001-02 | SCR-001 | FLD-006 | Restricción | Al guardar | numeroIdentificacion contiene letras o longitud <6 o >15 | Bloquear. Mostrar MSG-001-02 | Error | Sí | MSG-001-02 | Bloquea compuerta ¿Datos válidos? |
| RUL-001-03 | SCR-001 | FLD-011 | Control | Al cambiar FLD-010 | departamento está vacío o cambia | Deshabilitar y limpiar campo municipio | Control | No | — | No afecta flujo directo |
| RUL-001-04 | SCR-001 | FLD-012/004 | Restricción | Al guardar | resumen o nombreConsumidor contienen caracteres no permitidos SFC | Bloquear. Mostrar MSG-001-03 | Error | Sí | MSG-001-03 | Bloquea compuerta ¿Datos válidos? |
| RUL-001-05 | SCR-001 | FLD-002 | Restricción | Al cargar | Canal ya capturado en canal de entrada | Precargar canal. No solicitar nuevamente | Lineamiento | No | — | No aplica |
| RUL-002-01 | SCR-002 | ACT-002-01 | Restricción | Al cargar y al cambiar | contadorErrores > 0 | Deshabilitar botón 'Guardar Correcciones' | Error | Sí | MSG-002-01 | Bloquea avance a SP1 |
| RUL-002-02 | SCR-002 | — | Lineamiento | Al guardar | Siempre | Re-ejecutar P01-T06 automáticamente al guardar | Info | No | — | Vuelve a compuerta ¿Datos válidos? |
| RUL-002-03 | SCR-002 | — | Lineamiento | Al cargar | Siempre | Mostrar SOLO los campos que fallaron. No todo el formulario | Info | No | — | No aplica |
| RUL-003-01 | SCR-003 | ACT-003-01 | Restricción | Al reenviar | campoCorrección no fue modificado | Bloquear reenvío. Mostrar MSG-003-01 | Error | Sí | MSG-003-01 | No reenvía a SmartSupervision |
| RUL-003-02 | SCR-003 | FLD-044 | Control | Al cargar | numerIntentoM1M2 >= 3 | Mostrar advertencia y sugerir escalamiento técnico | Advertencia | No | MSG-003-02 | No bloquea, sugiere escalar |
| RUL-004-01 | SCR-004 | ACT-004-01 | Restricción | Al autorizar | causaRaiz o correccionAplicada vacíos | Bloquear autorización. Mostrar MSG-004-01 | Error | Sí | MSG-004-01 | No ejecuta SP1-T02 |
| RUL-005-01 | SCR-005 | FLD-083 | Restricción | Al cambiar área | Siempre | Cargar solo usuarios autorizados del área seleccionada | Control | No | — | Filtro de catálogo |
| RUL-005-02 | SCR-005 | — | Control | Al cargar | slaRestante <= 3 | Mostrar banner rojo de SLA crítico. MSG-005-01 | Advertencia | No | MSG-005-01 | No bloquea |
| RUL-006-01 | SCR-006 | FLD-092 | Restricción | Al cambiar área | Siempre | Solo usuarios con rol habilitado para quejas | Control | No | — | Filtro de catálogo |
| RUL-006-02 | SCR-006 | ACT-006-01 | Restricción | Al confirmar | motivoReasignacion o observaciones vacíos | Bloquear. Mostrar MSG-006-01 | Error | Sí | MSG-006-01 | No reasigna |
| RUL-006-03 | SCR-006 | FLD-092 | Restricción | Al confirmar | Asignación a usuario fuera del proceso | Bloquear | Error | Sí | MSG-006-02 | No reasigna |
| RUL-007-01 | SCR-007 | ACT-007-01 | Restricción | Al enviar a SAC | causaRaiz, posicionZurich o respuestaCliente vacíos | Bloquear envío. Mostrar MSG-007-01 | Error | Sí | MSG-007-01 | No avanza a SP2-T04 |
| RUL-007-02 | SCR-007 | FLD-107 | Lineamiento | Al enviar | Siempre | Incrementar versionRevision automáticamente | Info | No | — | No afecta flujo |
| RUL-007-03 | SCR-007 | — | Control | Al cargar | slaRestante <= 3 | Mostrar banner de alerta rojo | Advertencia | No | MSG-007-02 | No bloquea |
| RUL-008-01 | SCR-008 | ACT-008-02 | Restricción | Al devolver | observacionesSAC vacío y acción = devolver | Bloquear. Mostrar MSG-008-01 | Error | Sí | MSG-008-01 | No devuelve sin observaciones |
| RUL-008-02 | SCR-008 | — | Control | Al cargar | slaRestante <= 3 | Mostrar banner rojo SLA crítico | Advertencia | No | MSG-008-02 | No bloquea |
| RUL-009-01 | SCR-009 | FLD-159 a FLD-162 | Regla de Negocio | Al cambiar FLD-158 | relacionadaFraude = Sí | Mostrar y hacer obligatorios: tipoFraude, modalidadFraude, montoReclamado, montoReconocido | Control | Sí | MSG-009-01 | Campos de fraude obligatorios |
| RUL-009-02 | SCR-009 | FLD-141 a FLD-145 | Lineamiento | Al cargar | Siempre | Precargar canal, producto, motivo, admisión, enteControl desde M1. No editables | Info | No | — | No afecta flujo |
| RUL-009-03 | SCR-009 | ACT-009-01 | Restricción | Al guardar | Algún campo obligatorio SFC vacío | Bloquear. Mostrar MSG-009-02 | Error | Sí | MSG-009-02 | No habilita SP3 |
| RUL-010-01 | SCR-010 | FLD-175/FLD-176 | Restricción | Al cambiar cualquier fecha | fechaActualizacion ≠ fechaCierre | Alerta roja. Deshabilitar botón envío. MSG-010-01 | Error | Sí | MSG-010-01 | CRÍTICO: Bloquea envío M3 |
| RUL-010-02 | SCR-010 | FLD-181 | Restricción | Al adjuntar archivo | Nombre no cumple NombreCliente_NumId_RESP_FINAL_SFC_N | Bloquear. Mostrar MSG-010-02 | Error | Sí | MSG-010-02 | CRÍTICO: Bloquea envío M3 |
| RUL-010-03 | SCR-010 | ACT-010-01 | Restricción | Al cargar y al cambiar | Cualquier validación pendiente (RUL-10-01 o RUL-10-02 o campos vacíos) | Mantener botón deshabilitado hasta que TODAS las validaciones pasen | Error | Sí | — | CRÍTICO |
| RUL-010-04 | SCR-010 | P01-T08 | Restricción | Después de envío M3 | HTTP 200 no recibido | BLOQUEAR P01-T08. No enviar correo al cliente | Error | Sí | MSG-010-03 | CRÍTICO ARQUITECTURA: Notificación cliente solo tras HTTP 200 |
| RUL-010-05 | SCR-010 | FLD-171 | Lineamiento | Al reenviar | Siempre | Incrementar intentosCierreM3 y registrar en log | Info | No | — | Trazabilidad auditoria |
| RUL-011-01 | SCR-011 | ACT-011-01 | Restricción | Al autorizar | causaRaizProrroga o correccionProrroga vacíos | Bloquear. Mostrar MSG-011-01 | Error | Sí | MSG-011-01 | No ejecuta SP4-T01 |
| RUL-012-01 | SCR-012 | FLD-205 | Restricción | Al seleccionar fecha | nuevaFechaLimite <= fecha actual | Bloquear. Mostrar MSG-012-01 | Error | Sí | MSG-012-01 | No reenvía prórroga |
| RUL-000-01 | SCR-000 | FLD-303 | Control | Al cambiar rol | rol = "Defensor del Consumidor" | Habilitar Admisión (FLD-331) y asignar Instancia = "Defensor del consumidor". Si no, Admisión = "No aplica" e Instancia = "Entidad vigilada". | Control | No | — | Define instancia/punto de recepción |
| RUL-000-02 | SCR-000 | FLD-306 | Control | Al seleccionar tipo de identificación | tipoIdentificacion = NIT (Persona Jurídica) | Mostrar Razón Social y persona de contacto; ocultar Nombres/Apellidos. Asignar tipoPersona = Jurídica. | Control | No | — | Lista #3 define tipo de persona |
| RUL-000-03 | SCR-000 | FLD-306 | Control | Al seleccionar tipo de identificación | tipoIdentificacion ≠ NIT (Persona Natural) | Mostrar Nombres/Apellidos; ocultar campos de Persona Jurídica. Asignar tipoPersona = Natural. | Control | No | — | Lista #3 define tipo de persona |
| RUL-000-04 | SCR-000 | FLD-313 | Restricción | Al guardar | telefono no tiene exactamente 10 dígitos numéricos | Bloquear. Mostrar MSG-000-01 | Error | Sí | MSG-000-01 | Bloquea radicación |
| RUL-000-05 | SCR-000 | FLD-314 | Restricción | Al guardar | correoElectronico no tiene formato válido | Bloquear. Mostrar MSG-000-02 | Error | Sí | MSG-000-02 | Bloquea radicación |
| RUL-000-06 | SCR-000 | FLD-329 | Restricción | Al guardar | textoQueja tiene menos de 50 o más de 2000 caracteres | Bloquear. Mostrar MSG-000-03 | Error | Sí | MSG-000-03 | Bloquea radicación |
| RUL-000-07 | SCR-000 | FLD-335 | Restricción | Al enviar | autorizacionDatos no aceptada | Deshabilitar botón 'Enviar PQRS'. Mostrar MSG-000-04 | Error | Sí | MSG-000-04 | Bloquea radicación |
| RUL-000-08 | SCR-000 | FLD-336 | Restricción | Al enviar | captcha no validado | Bloquear envío. Mostrar MSG-000-05 | Error | Sí | MSG-000-05 | Bloquea radicación |
| RUL-000-09 | SCR-000 | FLD-318 | Control | Al cambiar departamento | departamento está vacío o cambia | Deshabilitar y limpiar el campo Ciudad (municipio). | Control | No | — | No afecta flujo directo |
| RUL-000-10 | SCR-000 | FLD-316 | Lineamiento | Al cargar | Siempre | Precargar País = "170 — Colombia" por defecto. | Info | No | — | No aplica |
| RUL-000-11 | SCR-000 | FLD-330 | Restricción | Al adjuntar archivo | Archivo no es pdf/jpg/png/docx o supera 5 MB | Bloquear adjunto. Mostrar MSG-000-06 | Error | Sí | MSG-000-06 | Bloquea radicación |
| RUL-000-12 | SCR-000 | FLD-325 | Control | Al cambiar Réplica | replica = "Sí" | Mostrar el campo Argumento de la réplica (FLD-326). | Control | No | — | No aplica |
| RUL-000-13 | SCR-000 | FLD-307 | Restricción | Al guardar | numeroIdentificacion no cumple el formato según el tipo de documento | Bloquear. Mostrar MSG-000-07 | Error | Sí | MSG-000-07 | Bloquea radicación |
