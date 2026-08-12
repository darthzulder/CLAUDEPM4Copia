# Master Sheet: 07_Catalogs

| ID Catálogo | Nombre Catálogo | Valor / Código | Etiqueta | Orden | Activo | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| CAT-CANAL | Canal de Recepción | chat_luci | Chat Luci | 1 | Sí | — |
| CAT-CANAL | Canal de Recepción | correo | Correo electrónico | 2 | Sí | — |
| CAT-CANAL | Canal de Recepción | telefono | Llamada Telefónica | 3 | Sí | — |
| CAT-CANAL | Canal de Recepción | presencial | Atención Presencial | 4 | Sí | — |
| CAT-CANAL | Canal de Recepción | whatsapp | WhatsApp | 5 | Sí | — |
| CAT-CANAL | Canal de Recepción | fisico | Documento Físico | 6 | Sí | — |
| CAT-TIPOLOGIA | Tipología de Solicitud | VD | Vulneración de Datos | 1 | Sí | Prioridad Alta — Requiere SP01 |
| CAT-TIPOLOGIA | Tipología de Solicitud | DP | Derecho de Petición | 2 | Sí | Prioridad Alta — Requiere SP02. Ley 1755/2015 |
| CAT-TIPOLOGIA | Tipología de Solicitud | REQ | Requerimiento de Información | 3 | Sí | Prioridad Media — Requiere SP03 |
| CAT-TIPOLOGIA | Tipología de Solicitud | SUG | Sugerencia | 4 | Sí | Prioridad Baja — Requiere SP04 |
| CAT-TIPOLOGIA | Tipología de Solicitud | FEL | Felicitación | 5 | Sí | Prioridad Baja — Requiere SP04 |
| CAT-SUBTIPO | Subtipificación REQ | cancelacion | Cancelación | 1 | Sí | Requiere SP03-SP01 |
| CAT-SUBTIPO | Subtipificación REQ | informacion | Solicitud de Información | 2 | Sí | Requiere SP03-SP02 |
| CAT-SUBTIPO | Subtipificación REQ | modificacion | Modificación | 3 | Sí | Requiere SP03-SP03 |
| CAT-SUBTIPO | Subtipificación REQ | otro | Otro | 4 | Sí | Requiere SP03-SP04 |
| CAT-TIPO-ID | Tipo de Identificación | CC | Cédula de Ciudadanía | 1 | Sí | — |
| CAT-TIPO-ID | Tipo de Identificación | CE | Cédula de Extranjería | 2 | Sí | — |
| CAT-TIPO-ID | Tipo de Identificación | NIT | NIT | 3 | Sí | — |
| CAT-TIPO-ID | Tipo de Identificación | PA | Pasaporte | 4 | Sí | — |
| CAT-TIPO-ID | Tipo de Identificación | TI | Tarjeta de Identidad | 5 | Sí | — |
| CAT-RIESGO-VD | Riesgo Vulneración Datos | bajo | Bajo | 1 | Sí | Bajo impacto para el titular |
| CAT-RIESGO-VD | Riesgo Vulneración Datos | medio | Medio | 2 | Sí | Impacto moderado para el titular |
| CAT-RIESGO-VD | Riesgo Vulneración Datos | alto | Alto | 3 | Sí | Alto impacto. Requiere acciones inmediatas. |
| CAT-TIPO-SUG-FEL | Tipo Sugerencia/Felicitación | sugerencia | Sugerencia | 1 | Sí | — |
| CAT-TIPO-SUG-FEL | Tipo Sugerencia/Felicitación | felicitacion | Felicitación | 2 | Sí | — |
| CAT-AREA | Área Responsable | SAC | SAC — Servicio al Cliente | 1 | Sí | — |
| CAT-AREA | Área Responsable | siniestros | Siniestros | 2 | Sí | — |
| CAT-AREA | Área Responsable | pagos | Pagos | 3 | Sí | — |
| CAT-AREA | Área Responsable | producto | Producto | 4 | Sí | — |
| CAT-AREA | Área Responsable | juridica | Jurídica | 5 | Sí | — |
| CAT-AREA | Área Responsable | proteccion_datos | Área de Protección de Datos | 6 | Sí | Solo para Vulneración de Datos |
| CAT-PLANTILLAS | Plantillas de Respuesta | TPL-VD | Plantilla Vulneración de Datos | 1 | Sí | ⚠️ Pendiente parametrización |
| CAT-PLANTILLAS | Plantillas de Respuesta | TPL-DP | Plantilla Derecho de Petición | 2 | Sí | ⚠️ Pendiente parametrización |
| CAT-PLANTILLAS | Plantillas de Respuesta | TPL-REQ | Plantilla Requerimiento | 3 | Sí | ⚠️ Pendiente parametrización |
| CAT-PLANTILLAS | Plantillas de Respuesta | TPL-SUG | Plantilla Sugerencia | 4 | Sí | ⚠️ Pendiente parametrización |
| CAT-PLANTILLAS | Plantillas de Respuesta | TPL-FEL | Plantilla Felicitación | 5 | Sí | ⚠️ Pendiente parametrización |
| CAT-RAMO | Ramo de Seguros | VIDA | Vida | 1 | Sí | ⚠️ Pendiente catálogo oficial Zurich |
| CAT-RAMO | Ramo de Seguros | AUTOS | Autos | 2 | Sí | ⚠️ Pendiente catálogo oficial Zurich |
| CAT-RAMO | Ramo de Seguros | HOGAR | Hogar | 3 | Sí | ⚠️ Pendiente catálogo oficial Zurich |
| CAT-RAMO | Ramo de Seguros | EMPRESARIAL | Empresarial | 4 | Sí | ⚠️ Pendiente catálogo oficial Zurich |
| CAT-RAMO | Ramo de Seguros | SALUD | Salud | 5 | Sí | ⚠️ Pendiente catálogo oficial Zurich |
| CAT-TIPO-DATOS | Tipo de Datos Personales Afectados | datos_generales | Datos personales generales | 1 | Sí | ⚠️ DUMMY — pendiente validación del área legal / Protección de Datos |
| CAT-TIPO-DATOS | Tipo de Datos Personales Afectados | datos_sensibles | Datos sensibles (Ley 1581/2012, art. 5) | 2 | Sí | ⚠️ DUMMY — pendiente validación del área legal / Protección de Datos |
| CAT-TIPO-DATOS | Tipo de Datos Personales Afectados | datos_financieros | Datos financieros o crediticios | 3 | Sí | ⚠️ DUMMY — pendiente validación del área legal / Protección de Datos |
| CAT-TIPO-DATOS | Tipo de Datos Personales Afectados | datos_salud | Datos de salud | 4 | Sí | ⚠️ DUMMY — pendiente validación del área legal / Protección de Datos |
| CAT-TIPO-DATOS | Tipo de Datos Personales Afectados | datos_biometricos | Datos biométricos | 5 | Sí | ⚠️ DUMMY — pendiente validación del área legal / Protección de Datos |
| CAT-TIPO-DATOS | Tipo de Datos Personales Afectados | datos_menores | Datos de niños, niñas y adolescentes | 6 | Sí | ⚠️ DUMMY — pendiente validación del área legal / Protección de Datos |
| CAT-CANAL-SIC | Canal de Reporte a la SIC | sic_web | Formulario web SIC | 1 | Sí | ⚠️ DUMMY — pendiente confirmación del canal oficial con la SIC |
| CAT-CANAL-SIC | Canal de Reporte a la SIC | sic_correo | Correo electrónico certificado | 2 | Sí | ⚠️ DUMMY — pendiente confirmación del canal oficial con la SIC |
| CAT-CANAL-SIC | Canal de Reporte a la SIC | sic_presencial | Radicación presencial | 3 | Sí | ⚠️ DUMMY — pendiente confirmación del canal oficial con la SIC |
| CAT-CANAL-SIC | Canal de Reporte a la SIC | sic_api | Integración API SIC | 4 | Sí | ⚠️ DUMMY — pendiente confirmación del canal oficial con la SIC |
| CAT-USUARIOS-ROLE | Usuarios por Área y Rol | usr_sac_analista | Analista SAC — Servicio al Cliente | 1 | Sí | ⚠️ DUMMY — catálogo dinámico: BPM lo resuelve filtrado por área y rol autorizado |
| CAT-USUARIOS-ROLE | Usuarios por Área y Rol | usr_sac_lider | Líder SAC — Servicio al Cliente | 2 | Sí | ⚠️ DUMMY — catálogo dinámico: BPM lo resuelve filtrado por área y rol autorizado |
| CAT-USUARIOS-ROLE | Usuarios por Área y Rol | usr_siniestros_resp | Responsable Siniestros | 3 | Sí | ⚠️ DUMMY — catálogo dinámico: BPM lo resuelve filtrado por área y rol autorizado |
| CAT-USUARIOS-ROLE | Usuarios por Área y Rol | usr_juridica_resp | Responsable Jurídica | 4 | Sí | ⚠️ DUMMY — catálogo dinámico: BPM lo resuelve filtrado por área y rol autorizado |
| CAT-USUARIOS-ROLE | Usuarios por Área y Rol | usr_protdatos_resp | Responsable Protección de Datos | 5 | Sí | ⚠️ DUMMY — catálogo dinámico: BPM lo resuelve filtrado por área y rol autorizado |
