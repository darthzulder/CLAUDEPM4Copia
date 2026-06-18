



El presente anexo complementa la Narrativa AS-IS del proceso de Gestión de Quejas Directas (ACZ-QD-001) de Zurich Seguros Colombia. Su propósito es documentar con precisión las pantallas de la solución actual en Jira, identificadas a través del análisis del manual de usuario del proceso, las capturas de pantalla disponibles y la matriz de pasos del proceso.
El documento está organizado en cuatro grandes secciones: (1) Descripción detallada de las pantallas AS-IS con sus campos y comportamientos observados, (2) Diccionario de datos consolidado del proceso, (3) Directrices identificadas —lineamientos, controles, restricciones y reglas de negocio— y (4) Puntos de mejora a considerar para el diseño de pantallas y el modelado de datos en el proceso TO-BE en ProcessMaker 4.

## Inventario de Pantallas Identificadas
Se identificaron 9 pantallas/modales distintos en el proceso AS-IS de Quejas Directas en Jira:




## SCR-01 — Crear Incidencia

Modal que se despliega al seleccionar el botón 'Crear' en la barra de navegación de Jira. Permite al usuario Switch diligenciar todos los datos necesarios para registrar una nueva queja directa con integración a SmartSupervision. El formulario ocupa toda la pantalla en scroll vertical y se divide en tres secciones observables en las capturas: datos de identificación del proceso, datos del consumidor y datos regulatorios. Al confirmar con 'Crear' se dispara automáticamente el Momento 1 de integración.

### Campos del Formulario SCR-01

### Acciones Disponibles en SCR-01



## SCR-02 — Pop-up Confirmación de Creación

Notificación toast que aparece en la esquina superior derecha de Jira inmediatamente después de crear la incidencia. Confirma la creación exitosa y muestra el número de clave asignado por Jira (formato ACZ-XXXXXX). Es una pantalla de solo lectura, no permite interacción de entrada de datos.



## SCR-03 — Respuesta API SmartSupervision (Código 201 / Éxito)

Vista automática en la sección 'Comentarios' de la incidencia Jira. Generada por la integración API sin intervención del usuario. Confirma que SmartSupervision recibió correctamente la información.


## SCR-04 — Respuesta API SmartSupervision (Código 400 / Rechazo)

Vista automática en sección 'Comentarios'. Aparece cuando SmartSupervision rechaza la información enviada. El mensaje muestra el código HTTP 400 y la URL del endpoint intentado, pero NO identifica el campo específico que causó el error.




## SCR-05 — Vista Principal de la Incidencia (Detalle del Caso)

Pantalla principal del caso en Jira. Se divide en múltiples secciones: encabezado con acciones (botones), cuerpo con detalles estructurados en tabs (Información usuario / Detalles queja / Envío Email Cliente), panel lateral derecho con Timers, Personas y Fechas, y sección inferior de Actividad/Comentarios. Es la pantalla central desde donde el usuario gestiona todo el ciclo de vida de la queja.

### Encabezado — Botones de Acción

### Sección: Detalles (Panel Izquierdo Superior)

### Sección: Tab Información Usuario

### Sección: Tab Detalles Queja

### Panel Lateral Derecho — Timers

### Panel Lateral Derecho — Personas

### Panel Lateral Derecho — Fechas

### Sección: Adjuntos

### Sección: Tab Envío Email Cliente (visible en estado Done)



## SCR-06 — Update Momento 2 (Modal de Corrección)

Modal que se despliega al seleccionar el botón 'Update Momento 2' en la incidencia. Permite corregir los datos de la queja y reenviar a SmartSupervision. Contiene los mismos campos del formulario de creación, con algunas restricciones de edición. Al confirmar, dispara nuevamente el Momento 1 (o Momento 2) de integración.


### Acciones Disponibles en SCR-06



## SCR-07 — Reasignación (Modal)

Modal simple que permite cambiar el responsable del caso. Se observa en las capturas que despliega la lista completa de todos los usuarios Zurich con licencia activa en Jira, sin ningún filtro por área, rol o competencia.


### Acciones Disponibles en SCR-07



## SCR-08 — Respuesta Final: Pestaña de Campo (Tab 1)

Primera pestaña del modal 'Respuesta Final'. Contiene campos informativo-operativos y el comentario que se enviará al cliente como cuerpo del correo de respuesta. Esta pestaña NO envía datos a SmartSupervision; su función es registrar información operativa y el texto de la comunicación al consumidor financiero.



## SCR-09 — Respuesta Final: Pestaña Respuesta Final (Tab 2 — Momento 3)

Segunda pestaña del modal 'Respuesta Final'. Contiene los campos regulatorios requeridos por SmartSupervision para el Momento 3 (cierre de la queja). Todos los campos marcados con * son obligatorios y viajan al regulador. Al confirmar con el botón 'Respuesta Final', se disparan simultáneamente: (a) el envío al correo del cliente con los datos de SCR-08, y (b) el envío a SmartSupervision con los datos de esta pestaña.


### Acciones Disponibles en SCR-09




El siguiente diccionario consolida todos los campos identificados en las pantallas AS-IS del proceso de Gestión de Quejas Directas en Jira. Incluye metadatos funcionales, técnicos y regulatorios necesarios para el diseño del modelo de datos en ProcessMaker 4.




Las siguientes directrices fueron identificadas a partir del análisis del manual de usuario, las pantallas y la matriz del proceso AS-IS. Se clasifican según la metodología BeePM en cuatro tipos: 🟢 Lineamiento (orientación general), 🟠 Control (verificación o monitoreo), 🔴 Restricción (prohibición o bloqueo) y 🔵 Regla de Negocio (decisión lógica condicionada).

## 3.1  Directrices de Creación y Radicación (Momento 1)

## 3.2  Directrices de Gestión y Asignación

## 3.3  Directrices de Adjuntos y Nomenclatura de Documentos

## 3.4  Directrices del Formulario de Respuesta Final (Momento 3)

## 3.5  Directrices de SLA y Control de Plazos



Los siguientes puntos de mejora deben ser considerados obligatoriamente en el diseño de pantallas, formularios y modelo de datos del proceso TO-BE en ProcessMaker 4. Están organizados por temáticas de diseño y desarrollo.

## 4.1  Diseño de Formularios y Validaciones

## 4.2  Modelo de Datos y Catálogos

## 4.3  Arquitectura de Pantallas y UX

## 4.4  Controles Regulatorios y de Cumplimiento



El análisis detallado de las 31 capturas de pantalla del manual de usuario de Jira confirma y amplía los hallazgos documentados en la Narrativa AS-IS. Los puntos críticos se resumen a continuación:




Documento elaborado por BeePM | Beesmartec | Para: Zurich Seguros Colombia | Confidencial — Versión 1.0 | Mayo 2025

| ZURICH SEGUROS COLOMBIA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ANEXO A LA NARRATIVA AS-IS ANÁLISIS DE PANTALLAS, DICCIONARIO DE DATOS, DIRECTRICES Y PUNTOS DE MEJORA TO-BE Gestión de Quejas Directas — Integración SmartSupervision (Jira AS-IS) |
| --- |


| Proceso | Gestión de Quejas Directas — SmartSupervision |
| --- | --- |
| Código | ACZ-QD-001 — Anexo 01 |
| Versión | 1.0 — AS-IS |
| Fecha | Mayo 2025 |
| Elaborado por | BeePM — Arquitecto de Procesos Beesmartec |
| Fuente del análisis | Manual de usuario Jira ACZ — Quejas Directas SmartSupervision (31 pantallas capturadas) |
| Plataforma analizada | Jira — Atención Cliente Zurich (ACZ) / ACZ Quejas Directas |


| INTRODUCCIÓN |
| --- |


| ID | Nombre de Pantalla | Actividad que Soporta | Estado Jira | Tipo |
| --- | --- | --- | --- | --- |
| SCR-01 | Crear Incidencia | Crear incidencia (Paso 1) | N/A — Modal de creación | Modal Jira — Formulario de alta |
| SCR-02 | Pop-up Confirmación Creación | Generación número de solicitud (Paso 2) | 1. Pendiente | Notificación toast — Solo lectura |
| SCR-03 | Comentario API — Código 201 | Radicación exitosa SmartSupervision (Paso 4) | 1. Pendiente | Sección comentarios — Solo lectura |
| SCR-04 | Comentario API — Código 400 | Rechazo radicación SmartSupervision (Paso 5) | 1. Pendiente | Sección comentarios — Solo lectura |
| SCR-05 | Detalle de Incidencia — Vista Principal | Visualización / Gestión caso (Paso 6) | 1. Pendiente / 2. En Progreso | Pantalla completa — Vista / Edición |
| SCR-06 | Update Momento 2 (Modal) | Corrección y reenvío a SmartSupervision (Paso 5.1) | 1. Pendiente / 2. En Progreso | Modal Jira — Formulario edición |
| SCR-07 | Reasignación (Modal) | Reasignación a responsable (Paso 7) | 1. Pendiente / 2. En Progreso | Modal Jira — Selector de usuario |
| SCR-08 | Respuesta Final — Pestaña de Campo | Inicio formulario respuesta final (Paso 10) | 2. En Progreso | Modal Jira — Tab 1 de 2 |
| SCR-09 | Respuesta Final — Pestaña Respuesta Final | Cierre regulatorio SmartSupervision (Paso 10-M3) | 2. En Progreso | Modal Jira — Tab 2 de 2 |


| SECCIÓN 1 — DESCRIPCIÓN DETALLADA DE PANTALLAS AS-IS |
| --- |


| ID Pantalla | SCR-01 | Estado Jira | N/A — Modal de creación |
| --- | --- | --- | --- |
| Nombre | Crear Incidencia | Actividad | T01: Crear incidencia en Jira (Paso 1) |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F001 | Proyecto | proyecto | Lista (fija) | Sí | No | ACZ (Atención Cliente Zurich) | Valor fijo. No editable por el usuario. Siempre 'Atención Cliente Zurich (ACZ)'. |
| F002 | Tipo de Incidencia | tipoIncidencia | Lista desplegable | Sí | No | Quejas Directas - SmartSupervision | Valor fijo para este flujo. No permite cambiar. Determina el flujo de trabajo completo. |
| F003 | Resumen | resumen | Texto abierto | Sí | Sí | — | Título libre de la incidencia. Sin validación de formato ni longitud. Campo de texto sin restricción. |
| F004 | Código de la queja | codigoQueja | Solo lectura | N/A | No | API SmartSupervision | Campo vacío en creación. Se llena automáticamente tras respuesta 201 de SmartSupervision. Inicia con '1391'. |
| F005 | Código País | codigoPais | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Valor visible: '170.Colombia'. Pendiente validación lista completa con TI. |
| F006 | Departamentos - Municipios | departamento / municipio | Doble lista desplegable | Sí | Sí | Catálogo SFC geográfico (pendiente IT) | Dos listas enlazadas. El municipio depende del departamento. Relación no validada técnicamente en AS-IS. |
| F007 | Canal | canal | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Ejemplo observado: '5. Centro de atención telefónica'. Pendiente lista completa con TI. |
| F008 | Tipo de solicitud | tipoSolicitud | Lista desplegable | Sí | Sí | Catálogo interno Zurich (pendiente IT) | Campo auxiliar para tickets recibidos por correo. Ejemplo: 'BBVA deudor'. Lista pendiente validación. |
| F009 | Producto | producto | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Ejemplo observado: '101. Seguro de automóviles'. Lista pendiente con TI. |
| F010 | Motivo | motivo | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Campo crítico: se usa en Momentos 2 y 3. Ejemplo: '104. Error en la facturación'. Condiciona campos de fraude en M3. |
| F011 | Fecha y hora de creación | fechaCreacion | Fecha/Hora automática | N/A | No | Sistema Jira | Automático al crear. No editable. Ejemplo observado: '16-oct-25 10:35 AM'. |
| F012 | Fecha límite respuesta | fechaLimiteRespuesta | Fecha automática | N/A | No | Sistema Jira (SLA configurado) | Automático. Configuración SLA pendiente de revisión. Ejemplo observado: '21/oct/25' (5 días calendario desde creación — pendiente validar si son hábiles). |
| F013 | Nombre o razón social del consumidor | nombreConsumidor | Texto abierto | Sí | Sí | — | Sin validación de formato. Permite caracteres especiales. Riesgo de rechazo en SmartSupervision. |
| F014 | Tipo de identificación | tipoIdentificacion | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Ejemplo observado: '1. Cédula de ciudadanía'. Lista pendiente con TI. |
| F015 | Número de identificación | numeroIdentificacion | Numérico abierto | Sí | Sí | — | Sin validación de longitud ni formato. Riesgo de rechazo en SmartSupervision. |
| F016 | Correo electrónico | correoElectronico | Texto abierto | Sí | Sí | — | Sin validación de formato de email en AS-IS. Crítico: es el destino del correo de respuesta. |
| F017 | Tipo de persona | tipoPersona | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Ejemplo observado: '1. Natural'. Lista pendiente con TI. |
| F018 | Instancia de recepción | instanciaRecepcion | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Ejemplo observado: '2. Entidad vigilada'. Lista pendiente con TI. |
| F019 | Punto de recepción | puntoRecepcion | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Ejemplo observado: '5. Call Center'. Lista pendiente con TI. |
| F020 | Admisión | admision | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Ejemplo observado: '9. No Aplica'. Lista pendiente con TI. |
| F021 | Texto de la queja | textoQueja | Área de texto abierta | No | Sí | — | Sin límite de caracteres ni validación mínima. Sin restricción de caracteres especiales. Riesgo de rechazo. |
| F022 | Anexos a la queja | anexosQueja | Booleano (True/False) | Cond. | Sí | — | True si hay adjuntos, False si no. Sin validación de tipo ni nomenclatura de archivo en este campo. |
| F023 | Adjunto | adjunto | Upload de archivos | Cond. | Sí | — | Permite adjuntar cualquier tipo de archivo. Sin restricción de tipo, tamaño ni nomenclatura. |
| F024 | Ente de control | enteControl | Lista desplegable | Sí | Sí | Catálogo SFC (pendiente IT) | Ejemplo observado: '99. Otros'. Lista pendiente con TI. |


| Acción | Elemento UI | Comportamiento |
| --- | --- | --- |
| Crear | Botón primario | Confirma la creación. Dispara automáticamente el Momento 1 (envío a SmartSupervision). Muestra pop-up SCR-02. |
| Cancelar | Botón secundario/link | Descarta el formulario sin crear la incidencia. No genera número de solicitud. |
| Crear otra | Checkbox + Crear | Al marcar esta opción y hacer clic en Crear, el formulario se resetea para crear otra incidencia sin cerrar el modal. |


| 🔴 Problemas Críticos Identificados en SCR-01 1. Ausencia total de validaciones preventivas de formato, tipo y longitud en campos abiertos (F013, F015, F016, F021). 2. Sin validación de caracteres no permitidos por SmartSupervision antes del envío. 3. Dependencia entre Departamento y Municipio (F006) sin validación técnica en AS-IS. 4. Listas desplegables con catálogos pendientes de definición y homologación SFC. 5. El campo 'Tipo de solicitud' tiene nota interna 'Campo auxiliar para tickets recibidos correo' — no es campo SFC pero puede generar confusión. |
| --- |


| ID Pantalla | SCR-02 | Estado Jira | 1. Pendiente |
| --- | --- | --- | --- |
| Nombre | Confirmación de Creación de Incidencia | Actividad | T02: Generar número de solicitud (Paso 2) |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F025 | Mensaje de confirmación | mensajeConfirmacion | Texto — Solo lectura | N/A | No | Sistema Jira | Texto automático: 'Incidencia ACZ-XXXXXX - [Resumen] se ha creado con éxito.' |
| F026 | Número de incidencia Jira | claveJira | Link — Solo lectura | N/A | No | Sistema Jira | Formato: ACZ-XXXXXX. Es el identificador interno de Jira. Diferente al código SFC (1391...). |


| ⚠️ Observación SCR-02 El pop-up aparece simultáneamente con el intento de radicación en SmartSupervision (Momento 1). El usuario puede ver 'Incidencia creada con éxito' antes de saber si SmartSupervision aceptó la radicación. No existe diferenciación visual entre 'creada en Jira' vs 'radicada ante el regulador'. Para el usuario puede parecer que el proceso está completo cuando en realidad la radicación regulatoria puede estar fallando en paralelo. |
| --- |


| ID Pantalla | SCR-03 | Estado Jira | 1. Pendiente |
| --- | --- | --- | --- |
| Nombre | Comentario API — Radicación Exitosa | Actividad | T03/T04: Radicación SmartSupervision M1 (Paso 3-4) |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F027 | Autor comentario | autorComentario | Texto — Solo lectura | N/A | No | Sistema Jira / API | Siempre 'Jira Zurich'. Identifica que es un mensaje automático del sistema. |
| F028 | Mensaje respuesta exitosa | mensajeRespuesta | Texto — Solo lectura | N/A | No | API SmartSupervision | Texto exacto observado: 'Queja radicada en SmartSupervision con código respuesta: 201' |
| F029 | Código de queja SFC | codigoSFC | Texto — Solo lectura | N/A | No | SmartSupervision (devuelto por API) | Código numérico que inicia con '1391'. Ejemplo: '1391652025100916501820​78'. Se registra también en 'Detalles queja' del caso. |


| ID Pantalla | SCR-04 | Estado Jira | 1. Pendiente |
| --- | --- | --- | --- |
| Nombre | Comentario API — Rechazo de Radicación | Actividad | T05: Rechazo SmartSupervision M1 (Paso 5) |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F030 | Autor comentario | autorComentario | Texto — Solo lectura | N/A | No | Sistema Jira / API | Siempre 'Jira Zurich'. |
| F031 | Mensaje error 400 | mensajeError400 | Texto — Solo lectura | N/A | No | API SmartSupervision | Texto observado: 'Error envío SFC: java.io.IOException: Server returned HTTP response code: 400 for URL: https://smart.superfinanciera.gov.co/api/queja/' |
| F032 | Mensaje error M3 400 | mensajeError400M3 | Texto — Solo lectura | N/A | No | API SmartSupervision | Texto observado en cierre: 'Queja no actualizada en SmartSupervision, código respuesta: 400' |


| 🔴 Problema Crítico — SCR-04 El mensaje de error no identifica el campo específico que causó el rechazo. El usuario recibe solo 'código 400' y debe investigar manualmente cuál dato es inválido. No hay diferenciación entre errores funcionales (dato incorrecto) y técnicos (falla de comunicación). Esto incrementa significativamente el tiempo de corrección y el riesgo de errores repetidos. |
| --- |


| ID Pantalla | SCR-05 | Estado Jira | 1. Pendiente / 2. En Progreso / 3. Done |
| --- | --- | --- | --- |
| Nombre | Detalle de la Incidencia — Vista Principal | Actividad | T06: Visualizar y gestionar caso (Paso 6, 8, 9) |


| Botón | Disponible en Estado | Abre | Comportamiento |
| --- | --- | --- | --- |
| Editar | Todos | — | Edición directa de campos del caso. Disponible siempre pero algunos campos no son modificables tras la radicación inicial. |
| Comentar | Todos | — | Agrega comentario manual al hilo de actividad del caso. |
| Reasignación | Pendiente / En Progreso | SCR-07 | Abre modal de reasignación. Permite cambiar el responsable del caso. |
| Update Momento 2 | Pendiente / En Progreso | SCR-06 | Abre modal de corrección para reenviar a SmartSupervision. Disponible para corregir rechazos código 400. |
| Respuesta Final | En Progreso | SCR-08/09 | Abre modal de respuesta final (Momento 3). Dispara envío a SmartSupervision y correo al cliente simultáneamente. |
| Gestionar | Pendiente | — | Transición de estado '1. Pendiente' → '2. En Progreso'. Botón manual sin criterio de validación. |
| Flujo de Trabajo > Reabrir | 3. Done | — | Menú desplegable en estado Done. 'Reabrir' regresa el caso a '2. En Progreso' para corregir rechazos del Momento 3. |
| Flujo de Trabajo > Enviar correo | 3. Done | — | Opción adicional en el menú de flujo de trabajo cuando el caso está en Done. Permite reenviar correo al cliente. |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F033 | Tipo | tipo | Solo lectura | N/A | No | Sistema | Siempre 'Quejas Directas - SmartSupervision'. |
| F034 | Prioridad | prioridad | Solo lectura | N/A | No | Sistema | Siempre 'High'. |
| F035 | Etiquetas | etiquetas | Solo lectura | N/A | No | — | Siempre 'Ninguno' en AS-IS. |
| F036 | Estado | estado | Solo lectura + Link flujo | N/A | No | Motor de workflow Jira | Estados: PENDIENTE / EN PROGRESO / DONE. Con link 'Ver Flujo de Trabajo'. |
| F037 | Resolución | resolucion | Solo lectura | N/A | No | Sistema | 'Sin resolver' hasta cierre. 'Listo' en estado Done con HTTP 200. |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F038 | Nombre o razón social del consumidor | nombreConsumidor | Solo lectura | N/A | No | SCR-01 F013 | Valor ingresado en creación. No editable desde esta vista (sí desde Update M2). |
| F039 | Tipo identificación del consumidor | tipoIdentificacion | Solo lectura | N/A | No | SCR-01 F014 | Valor ingresado en creación. |
| F040 | Número de identificación del consumidor | numeroIdentificacion | Solo lectura | N/A | No | SCR-01 F015 | Valor ingresado en creación. |
| F041 | Tipo de persona | tipoPersona | Solo lectura | N/A | No | SCR-01 F017 | Valor ingresado en creación. |
| F042 | Correo electrónico | correoElectronico | Solo lectura | N/A | No | SCR-01 F016 | Valor ingresado en creación. Destino del correo de respuesta final. |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F043 | Código de la queja | codigoQueja | Solo lectura | N/A | No | SmartSupervision (API) | Código SFC asignado tras HTTP 201. Inicia con '1391'. Ejemplo: '139165202510091650182078'. |
| F044 | Código País | codigoPais | Solo lectura | N/A | No | SCR-01 F005 | Ejemplo: '170.Colombia'. |
| F045 | Departamentos - Municipios | dpto_mpio | Solo lectura | N/A | No | SCR-01 F006 | Ejemplo: 'MAGDALENA - SANTA MARTA'. |
| F046 | Canal | canal | Solo lectura | N/A | No | SCR-01 F007 | Ejemplo: '5. Centro de atención telefónica (Call center/Contac center)'. |
| F047 | Tipo de solicitud | tipoSolicitud | Solo lectura | N/A | No | SCR-01 F008 | Ejemplo: 'BBVA deudor'. |
| F048 | Producto | producto | Solo lectura | N/A | No | SCR-01 F009 | Ejemplo: '101. Seguro de automóviles'. |
| F049 | Motivo | motivo | Solo lectura | N/A | No | SCR-01 F010 | Ejemplo: '115. Demora en atención del siniestro'. |
| F050 | Instancia de recepción | instanciaRecepcion | Solo lectura | N/A | No | SCR-01 F018 | Ejemplo: '2. Entidad vigilada'. |
| F051 | Punto de recepción | puntoRecepcion | Solo lectura | N/A | No | SCR-01 F019 | Ejemplo: '5. Call Center'. |
| F052 | Admisión | admision | Solo lectura | N/A | No | SCR-01 F020 | Ejemplo: '9. No Aplica'. |
| F053 | Texto de la queja | textoQueja | Solo lectura | N/A | No | SCR-01 F021 | Texto libre del consumidor. Solo lectura en vista principal. |
| F054 | Ente de control | enteControl | Solo lectura | N/A | No | SCR-01 F024 | Ejemplo: '99. Otros'. |
| F055 | Histórico reasignaciones | historicoReasignaciones | Solo lectura | N/A | No | Sistema Jira | Registro de reasignaciones. Ejemplo: 'ANDRES FELIPE LEDESMA BANGUERO | 14/10/25'. |
| F056 | Anexos a la queja | anexosQueja | Solo lectura | N/A | No | SCR-01 F022 | Valor 'true' o 'false'. |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F057 | Timer SLA | timerSLA | Cronómetro — Solo lectura | N/A | No | Sistema Jira | Configurado en 64h. Ejemplo observado: '30:05:23' — horas:minutos:segundos transcurridos. Formato H:M:S no es días hábiles. Configuración pendiente de revisión. |
| F058 | Check SLA completado | checkSLA | Ícono — Solo lectura | N/A | No | Sistema Jira | Aparece check verde (✓) cuando el SLA se cumplió dentro del tiempo. En la imagen 28 se observa '✓ Quejas Directas - SmartSupervision, 42:40:45 of 64h'. |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F059 | Responsable | responsable | Solo lectura + Link | N/A | No | Sistema Jira / Reasignación | Usuario actualmente asignado. Incluye opción 'Asignarme a mí'. |
| F060 | Informador | informador | Solo lectura | N/A | No | Sistema Jira | Usuario que creó originalmente el caso. |
| F061 | Interesados | interesados | Solo lectura | N/A | No | Sistema Jira | Usuarios con acceso de visualización al caso. |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F062 | Creada | fechaCreada | Fecha — Solo lectura | N/A | No | Sistema Jira | Fecha relativa ('Hace X días') o absoluta. Corresponde a F011. |
| F063 | Actualizada | fechaActualizada | Fecha — Solo lectura | N/A | No | Sistema Jira | Fecha del último movimiento/cambio en el caso. |
| F064 | Fecha y hora de creación | fechaHoraCreacion | Fecha/Hora — Solo lectura | N/A | No | Sistema Jira | Fecha absoluta de creación. Corresponde a F011. |
| F065 | Fecha Límite Respuesta | fechaLimiteRespuesta | Fecha — Solo lectura | N/A | No | Sistema Jira (SLA) | Fecha máxima de respuesta. Ejemplo: '22/oct/25'. Configuración SLA pendiente revisión. |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F066 | Zona de adjuntos | adjuntos | Upload drag&drop | Cond. | Sí | — | Zona de arrastre + explorador. Permite adjuntar cualquier tipo de archivo. NO valida nomenclatura ni tipo. La carta de respuesta final SFC DEBE estar adjunta antes de ejecutar Respuesta Final. |
| F067 | Nombre del archivo adjunto | nombreAdjunto | Solo lectura (lista adjuntos) | N/A | No | — | Nombre del archivo tal como fue guardado por el usuario. Ejemplo correcto observado: 'Sandra_Maribel_43599189_RESP_FINAL_SFC_1.pdf'. Sin validación automática del nombre. |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F068 | Tab Envío Email Cliente | tabEnvioEmail | Tab — Solo lectura | N/A | No | Sistema Jira | Pestaña adicional que aparece en estado Done. Muestra el contenido del correo enviado al cliente. |


| ⚠️ Observaciones Críticas SCR-05 1. El Timer muestra 64 horas como límite, pero el SLA regulatorio es 15 días HÁBILES. La configuración de 64h no corresponde a días hábiles de Colombia — pendiente revisión urgente. 2. No hay visualización del tiempo restante en días hábiles hacia el vencimiento del SLA. 3. El campo 'Adjunto' no valida nomenclatura del PDF, lo que obliga a confiar 100% en el criterio del usuario. 4. El botón 'Respuesta Final' está siempre visible en estado 'En Progreso' sin verificar si existe el PDF adjunto con nomenclatura correcta. |
| --- |


| ID Pantalla | SCR-06 | Estado Jira | 1. Pendiente / 2. En Progreso |
| --- | --- | --- | --- |
| Nombre | Update Momento 2 | Actividad | T05.1: Corregir y reenviar a SmartSupervision (Paso 5.1) |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F069 | Tipo de Incidencia | tipoIncidencia | Solo lectura | N/A | No | — | No modificable. Siempre 'Quejas Directas - SmartSupervision'. Nota visible: 'Este tipo de incidencia sólo puede cambiarse moviendo la incidencia'. |
| F070 | Resumen | resumen | Texto abierto | Sí | Sí | — | Editable. Ejemplo: 'QUEJA DIRECTA CALL CENTER CS - SANDRA MARIBEL GIL OSPINA'. |
| F071 | Código de la queja | codigoQueja | Solo lectura | N/A | No | SmartSupervision | No modificable. Muestra el código SFC ya asignado (si existe). |
| F072 | Código País | codigoPais | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo: '170.Colombia'. |
| F073 | Departamentos - Municipios | dpto_mpio | Doble lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo observado: 'BOGOTÁ, D.C. / BOGOTÁ, D.C.'. |
| F074 | Canal | canal | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo: '5. Centro de atención telefónica'. |
| F075 | Tipo de solicitud | tipoSolicitud | Lista desplegable | Sí | Sí | Catálogo interno | Editable. Nota: 'Campo auxiliar para los tickets recibidos correo'. Ejemplo: 'BBVA libres'. |
| F076 | Producto | producto | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo: '101. Seguro de automóviles'. |
| F077 | Motivo | motivo | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Nota: 'Campo para momento 2 y momento 3'. Ejemplo: '104. Error en la facturación o cobro no pactado'. |
| F078 | Fecha y hora de creación | fechaCreacion | Fecha/Hora — Solo lectura | N/A | No | — | No modificable. Ejemplo: '08-oct-25 4:33 PM'. |
| F079 | Fecha Limite Respuesta | fechaLimiteRespuesta | Fecha — Solo lectura | N/A | No | — | No modificable. Ejemplo: '21/oct/25'. |
| F080 | Tipo identificación consumidor | tipoIdentificacion | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo: '1. Cédula de ciudadanía'. |
| F081 | Número de identificación consumidor | numeroIdentificacion | Texto abierto | Sí | Sí | — | Editable. Ejemplo: '43599189'. Sin validación de formato. |
| F082 | Correo electrónico | correoElectronico | Texto abierto | Sí | Sí | — | Editable. Ejemplo: 'maribel@loveable.com'. Sin validación de formato. |
| F083 | Tipo de persona | tipoPersona | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo: '1. Natural'. |
| F084 | Instancia de recepción | instanciaRecepcion | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo: '2. Entidad vigilada'. |
| F085 | Punto de recepción | puntoRecepcion | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo: '5. Call Center'. |
| F086 | Admisión | admision | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo: '9. No Aplica'. |
| F087 | Texto de la queja | textoQueja | Área de texto | No | Sí | — | Editable. Sin validación. Ejemplo real observado en pantalla. |
| F088 | Anexos a la queja | anexosQueja | Booleano (True/False) | Cond. | Sí | — | Editable. Valor 'false' o 'true'. Ejemplo observado: 'false'. |
| F089 | Adjunto | adjunto | Upload de archivos | Cond. | Sí | — | Permite adjuntar/reemplazar documentos. Sin restricción de tipo ni nomenclatura. |
| F090 | Ente de control | enteControl | Lista desplegable | Sí | Sí | Catálogo SFC | Editable. Ejemplo: '99. Otros'. |


| Acción | Elemento UI | Comportamiento |
| --- | --- | --- |
| Update Momento 2 | Botón primario | Reenvía la información corregida a SmartSupervision (M1 o M2). Muestra resultado en comentarios (201 éxito / 400 rechazo). |
| Cancelar | Link | Cierra el modal sin reenviar. El caso queda en el estado actual. |


| ⚠️ Observaciones SCR-06 1. Los mismos problemas de validación de SCR-01 aplican aquí: no hay validaciones preventivas de caracteres, longitud ni formato. 2. No hay indicación visual de cuál campo causó el rechazo anterior para orientar al usuario en la corrección. 3. Sin control de número de intentos de reenvío. |
| --- |


| ID Pantalla | SCR-07 | Estado Jira | 1. Pendiente / 2. En Progreso |
| --- | --- | --- | --- |
| Nombre | Reasignación | Actividad | T07: Reasignar caso a responsable (Paso 7) |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F091 | Responsable | responsable | Selector de usuario (tipo-ahead) | Sí | Sí | Todos los usuarios Jira Zurich | Lista sin filtro. Muestra TODOS los usuarios activos de Zurich en Jira. Ejemplo observado: usuarios de diferentes áreas (Manuel Alejandro Guevara Lopez, Amanda Longo, Andres Poveda Lozano, Carlos Olaya Lopez, etc.). Sin filtro por área, rol o competencia. |
| F092 | Comentario | comentarioReasignacion | Área de texto enriquecido | No | Sí | — | Editor de texto con formato (negrita, cursiva, listas). Campo opcional para registrar motivo de la reasignación. No obligatorio en AS-IS. |
| F093 | Visibilidad del comentario | visibilidadComentario | Toggle | N/A | Sí | — | Valor predeterminado: 'Visible por todos los usuarios'. |


| Acción | Elemento UI | Comportamiento |
| --- | --- | --- |
| Reasignación | Botón primario | Confirma el cambio de responsable. El historial queda en el campo 'Histórico Reasignaciones' del caso. |
| Cancelar | Link | Cierra el modal sin cambiar el responsable. |


| 🔴 Problema Identificado — SCR-07 La lista de usuarios no tiene filtro por área ni por rol. Cualquier usuario Zurich con licencia activa en Jira puede ser seleccionado como responsable, incluyendo personas de áreas completamente ajenas al proceso de quejas. No existe mecanismo de devolución formal a SAC una vez que Línea 2 completa su gestión. |
| --- |


| ID Pantalla | SCR-08 | Estado Jira | 2. En Progreso |
| --- | --- | --- | --- |
| Nombre | Respuesta Final — Pestaña de Campo | Actividad | T10/T11: Respuesta final Momento 3 (Paso 10) |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F094 | Nombre Cliente | nombreCliente | Texto abierto | No | Sí | — | Campo informativo. No viaja a SmartSupervision. Ejemplo observado: 'Sandra Gil'. Para el cuerpo del correo. |
| F095 | Atendido por | atendidoPor | Selector de usuario (tipo-ahead) | No | Sí | Usuarios Jira | Campo de búsqueda por nombre. Ejemplo observado: 'loren.espitia'. No obligatorio. |
| F096 | Comentario | comentarioRespuesta | Área de texto enriquecido | No | Sí | — | Editor visual con formato (negrita, cursiva, listas, links, emojis). Este texto se convierte en el CUERPO DEL CORREO enviado al cliente. También queda registrado en comentarios del caso. Campo crítico para la comunicación con el cliente. |
| F097 | Visibilidad comentario | visibilidadComentario | Toggle | N/A | Sí | — | 'Visible por todos los usuarios'. No modificable en esta pestaña. |


| ⚠️ Observación SCR-08 El comentario ingresado en esta pestaña se envía DIRECTAMENTE al cliente como cuerpo del correo. No existe un paso de previsualización ni aprobación del texto antes del envío. El correo se dispara al hacer clic en 'Respuesta Final' independientemente del resultado de SmartSupervision. |
| --- |


| ID Pantalla | SCR-09 | Estado Jira | 2. En Progreso |
| --- | --- | --- | --- |
| Nombre | Respuesta Final — Tab Respuesta Final (Momento 3) | Actividad | T10/T12: Cierre regulatorio SmartSupervision M3 (Paso 10, 12) |


| ID | Campo (Label) | Nombre Técnico | Tipo Control | Oblig. | Editable | Catálogo/Fuente | Notas AS-IS / Problemas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F098 | Código de la queja* | codigoQueja | Solo lectura | N/A | No | SmartSupervision (código 1391...) | Código SFC ya asignado. No modificable. Se usa como identificador para el cierre en SmartSupervision. |
| F099 | Sexo* | sexo | Lista desplegable | Sí | Sí | Catálogo SFC | Requerido por SmartSupervision. |
| F100 | LGBTIQ+* | lgbtiq | Lista desplegable | Sí | Sí | Catálogo SFC | Campo observado en pantalla — no estaba en la narrativa borrador. Requerido por SmartSupervision. |
| F101 | Condición Especial* | condicionEspecial | Lista desplegable | Sí | Sí | Catálogo SFC | Requerido por SmartSupervision. |
| F102 | Canal* | canal | Lista desplegable | Sí | Sí | Catálogo SFC | Pre-cargado del Momento 1 (F007). Editable en esta pantalla. |
| F103 | Producto* | producto | Lista desplegable | Sí | Sí | Catálogo SFC | Pre-cargado del Momento 1 (F009). Editable. Ejemplo: '101. Seguro de automóviles'. |
| F104 | Motivo* | motivo | Lista desplegable | Sí | Sí | Catálogo SFC | Pre-cargado del Momento 1 (F010). Nota: 'Campo para momento 2 y momento 3'. Ejemplo: '104. Error en la facturación'. Condiciona campos de fraude. |
| F105 | Tipo de fraude* | tipoFraude | Lista desplegable | Cond. | Sí | Catálogo SFC (CE 019/2024) | Condicional al campo Motivo. Aplica desde 1 jul 2025. Implementación técnica pendiente. Ejemplo observado: 'Ninguno'. |
| F106 | Modalidad de Fraude* | modalidadFraude | Lista desplegable | Cond. | Sí | Catálogo SFC (CE 019/2024) | Condicional al campo Motivo. Aplica desde 1 jul 2025. Ejemplo observado: 'Ninguno'. |
| F107 | Monto Reclamado* | montoReclamado | Numérico | Cond. | Sí | — | Condicional al campo Motivo. Aplica desde 1 jul 2025. Sin validación de formato numérico. |
| F108 | Monto Reconocido* | montoReconocido | Numérico | Cond. | Sí | — | Condicional al campo Motivo. Aplica desde 1 jul 2025. Sin validación de formato numérico. |
| F109 | Estado de la queja o reclamo* | estadoQueja | Lista desplegable | Sí | Sí | Catálogo SFC | Requerido para el cierre regulatorio. |
| F110 | Fecha de actualización* | fechaActualizacion | Fecha/Hora con selector | Sí | Sí | — | CRÍTICO: Debe coincidir EXACTAMENTE con Fecha Cierre (F113). Sin validación automática en AS-IS. Error más frecuente de rechazo. Ejemplo: '16-oct-25 11:21 AM'. |
| F111 | Producto Digital* | productoDigital | Lista desplegable | Sí | Sí | Catálogo SFC | Requerido por SmartSupervision. Ejemplo: '2. No'. |
| F112 | Favorabilidad* | favorabilidad | Lista desplegable | Sí | Sí | Catálogo SFC | Ejemplo: '1. Consumidor'. |
| F113 | Aceptación* | aceptacion | Lista desplegable | Sí | Sí | Catálogo SFC | Ejemplo: '2. Respuesta final a favor del consumidor financiero no aceptadas por la entidad'. |
| F114 | Rectificación* | rectificacion | Lista desplegable | Sí | Sí | Catálogo SFC | Ejemplo: '1. Queja o reclamo rectificada por la entidad vigilada antes de la decisión del DCF'. |
| F115 | Desistimiento* | desistimiento | Lista desplegable | Sí | Sí | Catálogo SFC | Ejemplo: '1. Queja o reclamo desistida por el CF'. |
| F116 | Prórroga* | prorroga | Numérico | Cond. | Sí | — | Contador de veces que se prorrogó la queja. Ejemplo observado: '0'. |
| F117 | Fecha Cierre* | fechaCierre | Fecha/Hora con selector | Sí | Sí | — | CRÍTICO: Debe coincidir EXACTAMENTE con Fecha de Actualización (F110). Sin validación en AS-IS. Ejemplo: '16-oct-25 11:21 AM'. |
| F118 | Admisión* | admision | Lista desplegable | Sí | Sí | Catálogo SFC | Pre-cargado del Momento 1 (F020). Ejemplo: '9. No Aplica'. |
| F119 | Anexos a la queja* | anexosQueja | Booleano (True/False) | Sí | Sí | — | Siempre True para poder cerrar la queja. Sin documentos adjuntos SmartSupervision rechaza. |
| F120 | Adjunto a la respuesta final* | adjuntoRespuestaFinal | Booleano (True/False) | Sí | Sí | — | Siempre True. Instrucción visible: 'Seleccione true si adjunta documentación final, sino seleccione false'. El adjunto real se gestiona desde el front del caso. |
| F121 | Adjunto* | adjunto | Upload de archivos | Sí | Sí | — | Zona de upload disponible también en esta ventana. El archivo principal debe estar ya adjunto al caso (SCR-05 F066/F067). |
| F122 | Tutela* | tutela | Lista desplegable | Sí | Sí | Catálogo SFC | Requerido por SmartSupervision. Ejemplo: '2. No'. |
| F123 | Ente de control* | enteControl | Lista desplegable | Sí | Sí | Catálogo SFC | Pre-cargado del Momento 1 (F024). Ejemplo: '99. Otros'. |
| F124 | Marcación* | marcacion | Lista desplegable | Sí | Sí | Catálogo SFC | Ejemplo observado: '3. Si el caso fue cerrado por la entidad vigilada por no ser una queja o reclamo sino otro tipo...'. |
| F125 | Queja Exprés* | quejaExpres | Lista desplegable | Sí | Sí | Catálogo SFC | Ejemplo: '2. No'. |
| F126 | Comentario (Respuesta Final) | comentarioSFC | Área de texto enriquecido | No | Sí | — | Comentario adicional para SmartSupervision. También se usa como texto del correo al cliente. Es el mismo campo de SCR-08 F096. |


| Acción | Elemento UI | Comportamiento |
| --- | --- | --- |
| Respuesta Final | Botón primario | ACCIÓN CRÍTICA: Simultáneamente (1) envía payload a SmartSupervision vía API, (2) envía correo al cliente, (3) cambia estado a 3. Done. NO espera confirmación del regulador antes de notificar al cliente. |
| Cancelar | Link | Cierra el modal sin enviar. El caso permanece en estado En Progreso. |


| 🔴 Problemas Críticos — SCR-09 1. Fecha de actualización y Fecha de Cierre son campos independientes sin validación cruzada. El sistema permite valores distintos y solo falla al enviarse a SmartSupervision. 2. El botón 'Respuesta Final' es irreversible: al hacer clic, el correo al cliente se envía ANTES de conocer la respuesta del regulador. 3. Campo LGBTIQ+ (F100) identificado en pantalla pero no documentado en la narrativa borrador — requiere confirmación con TI/regulatorio. 4. Los campos de fraude (F105-F108) muestran 'Ninguno' pero su lógica condicional no está implementada técnicamente. 5. Sin indicador del número de intento de cierre. |
| --- |


| SECCIÓN 2 — DICCIONARIO DE DATOS CONSOLIDADO |
| --- |


| ID | Campo (Label) | Nombre Técnico | Tipo | Oblig. | Fuente | SFC | Persistente | Pantalla(s) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F001 | Proyecto | proyecto | Lista fija | Sí | Sistema | No | Sí | SCR-01 |
| F002 | Tipo de Incidencia | tipoIncidencia | Lista fija | Sí | Sistema | No | Sí | SCR-01, SCR-06 |
| F003 | Resumen (Título) | resumen | Texto | Sí | Usuario | No | Sí | SCR-01, SCR-06 |
| F004/F043 | Código de la queja SFC | codigoQueja | Texto (auto) | — | SmartSupervision | Sí | Sí | SCR-01, SCR-05, SCR-06, SCR-09 |
| F005/F044 | Código País | codigoPais | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F006/F045 | Departamento | departamento | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F006/F045 | Municipio | municipio | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F007/F046/F102 | Canal | canal | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06, SCR-09 |
| F008/F047 | Tipo de solicitud | tipoSolicitud | Lista | Sí | Usuario | No (interno) | Sí | SCR-01, SCR-05, SCR-06 |
| F009/F048/F103 | Producto | producto | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06, SCR-09 |
| F010/F049/F104 | Motivo | motivo | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06, SCR-09 |
| F018/F050 | Instancia de recepción | instanciaRecepcion | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F019/F051 | Punto de recepción | puntoRecepcion | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F020/F052/F118 | Admisión | admision | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06, SCR-09 |
| F024/F054/F123 | Ente de control | enteControl | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06, SCR-09 |
| F013/F038 | Nombre o razón social | nombreConsumidor | Texto | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F014/F039 | Tipo de identificación | tipoIdentificacion | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F015/F040 | Número de identificación | numeroIdentificacion | Numérico | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F016/F042 | Correo electrónico | correoElectronico | Email | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F017/F041 | Tipo de persona | tipoPersona | Lista | Sí | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F021/F053 | Texto de la queja | textoQueja | Texto largo | No | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06 |
| F022/F056 | Anexos a la queja | anexosQueja | Booleano | Cond. | Usuario | Sí | Sí | SCR-01, SCR-05, SCR-06, SCR-09 |
| F023/F066 | Adjunto (documento) | adjunto | Archivo | Cond. | Usuario | Sí (SFC: carta respuesta) | Sí | SCR-01, SCR-05, SCR-06 |
| F011/F064 | Fecha y hora de creación | fechaCreacion | Fecha/Hora (auto) | — | Sistema | No | Sí | SCR-01, SCR-05, SCR-06 |
| F012/F065 | Fecha límite respuesta | fechaLimiteRespuesta | Fecha (auto) | — | Sistema (SLA) | No | Sí | SCR-01, SCR-05, SCR-06 |
| F033 | Tipo (incidencia) | tipoIncidencia2 | Solo lectura | — | Sistema | No | Sí | SCR-05 |
| F034 | Prioridad | prioridad | Solo lectura | — | Sistema | No | Sí | SCR-05 |
| F036 | Estado | estado | Estado workflow | — | Sistema | No | Sí | SCR-05 |
| F037 | Resolución | resolucion | Solo lectura | — | Sistema | No | Sí | SCR-05 |
| F059 | Responsable | responsable | Usuario Jira | — | Sistema / Reasignación | No | Sí | SCR-05, SCR-07 |
| F060 | Informador | informador | Usuario Jira | — | Sistema | No | Sí | SCR-05 |
| F055 | Histórico reasignaciones | historicoReasignaciones | Texto (auto) | — | Sistema | No | Sí | SCR-05 |
| F057 | Timer SLA (horas) | timerSLA | Cronómetro (auto) | — | Sistema | No | No (runtime) | SCR-05 |
| F094 | Nombre Cliente (respuesta) | nombreClienteRespuesta | Texto | No | Usuario | No | No | SCR-08 |
| F095 | Atendido por | atendidoPor | Usuario Jira | No | Usuario | No | Sí | SCR-08 |
| F096/F126 | Comentario / Texto correo | comentarioRespuesta | Texto enriquecido | No | Usuario | No | Sí | SCR-08, SCR-09 |
| F099 | Sexo | sexo | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F100 | LGBTIQ+ | lgbtiq | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F101 | Condición Especial | condicionEspecial | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F105 | Tipo de Fraude | tipoFraude | Lista | Cond. | Usuario | Sí (SFC M3 CE019/2024) | Sí | SCR-09 |
| F106 | Modalidad de Fraude | modalidadFraude | Lista | Cond. | Usuario | Sí (SFC M3 CE019/2024) | Sí | SCR-09 |
| F107 | Monto Reclamado | montoReclamado | Numérico | Cond. | Usuario | Sí (SFC M3 CE019/2024) | Sí | SCR-09 |
| F108 | Monto Reconocido | montoReconocido | Numérico | Cond. | Usuario | Sí (SFC M3 CE019/2024) | Sí | SCR-09 |
| F109 | Estado de la queja o reclamo | estadoQueja | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F110 | Fecha de actualización | fechaActualizacion | Fecha/Hora | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F111 | Producto Digital | productoDigital | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F112 | Favorabilidad | favorabilidad | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F113 | Aceptación | aceptacion | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F114 | Rectificación | rectificacion | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F115 | Desistimiento | desistimiento | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F116 | Prórroga | prorroga | Numérico | Cond. | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F117 | Fecha Cierre | fechaCierre | Fecha/Hora | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F119 | Anexos a la queja (M3) | anexosQuejaM3 | Booleano | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F120 | Adjunto a la respuesta final | adjuntoRespuestaFinal | Booleano | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F122 | Tutela | tutela | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F124 | Marcación | marcacion | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F125 | Queja Exprés | quejaExpres | Lista | Sí | Usuario | Sí (SFC M3) | Sí | SCR-09 |
| F091 | Responsable (reasignación) | responsableReasignacion | Selector usuario | Sí | Usuario | No | No (acción) | SCR-07 |
| F092 | Comentario reasignación | comentarioReasignacion | Texto enriquecido | No | Usuario | No | Sí | SCR-07 |


| SECCIÓN 3 — DIRECTRICES IDENTIFICADAS EN EL PROCESO AS-IS |
| --- |


| ID | Tipo | Nombre | Descripción | Pantalla(s) | Hallazgo | Nivel |
| --- | --- | --- | --- | --- | --- | --- |
| D-001 | 🟢 Lineamiento | Solo Usuarios Switch pueden crear quejas directas | Únicamente los usuarios con perfil Switch y licencia activa en Jira están habilitados para crear incidencias de tipo 'Quejas Directas - SmartSupervision'. | SCR-01 | — | Operativo |
| D-002 | 🔴 Restricción | Tipo de Incidencia no modificable post-creación | Una vez creada la incidencia como 'Quejas Directas - SmartSupervision', el tipo de incidencia no puede cambiarse. Solo puede cambiarse 'moviendo la incidencia'. | SCR-01, SCR-06 | H-001 | Técnico |
| D-003 | 🔴 Restricción | Código País siempre Colombia | El campo Código País debe ser '170.Colombia'. No aplica otro valor para el proceso actual. | SCR-01, SCR-06 | H-002 | Regulatorio |
| D-004 | 🔵 Regla de Negocio | Municipio depende del Departamento | El municipio seleccionado debe corresponder al departamento seleccionado. La lista de municipios debe filtrarse según el departamento elegido. | SCR-01, SCR-06 | H-002 | Regulatorio |
| D-005 | 🟠 Control | Campo Motivo requerido para M2 y M3 | El campo Motivo es crítico: se utiliza como dato de entrada para los Momentos 2 y 3 y condiciona la activación de los campos de fraude. Debe estar correctamente diligenciado desde el Momento 1. | SCR-01, SCR-06, SCR-09 | H-011 | Regulatorio |
| D-006 | 🟢 Lineamiento | Fecha y hora de creación es automática e inmodificable | El sistema Jira asigna automáticamente la fecha y hora de creación. El usuario no puede modificar este campo. | SCR-01, SCR-06 | — | Técnico |
| D-007 | 🟢 Lineamiento | Fecha límite de respuesta es automática | El sistema calcula automáticamente la fecha límite según el SLA configurado (actualmente 64h — pendiente revisión para configurar en días hábiles). | SCR-01, SCR-05 | H-006 | Regulatorio |
| D-008 | 🟠 Control | Correo electrónico es el canal de notificación al cliente | El campo correo electrónico es el único destino para la respuesta final. Un error en este campo impide la comunicación con el consumidor financiero. | SCR-01, SCR-06 | H-002 | Operativo |
| D-009 | 🔴 Restricción | Sin catálogos SFC definidos, las listas son 'Ninguno' | En el AS-IS, múltiples campos de lista desplegable están pendientes de definición con TI. Hasta que se resuelvan, el valor por defecto es 'Ninguno', lo que causa rechazos 400. | SCR-01, SCR-06 | H-002 | Técnico |


| ID | Tipo | Nombre | Descripción | Pantalla(s) | Hallazgo | Nivel |
| --- | --- | --- | --- | --- | --- | --- |
| D-010 | 🟢 Lineamiento | El caso se asigna automáticamente al usuario responsable al crear | Jira asigna automáticamente el caso al responsable configurado y envía correo de notificación. | SCR-05 | — | Técnico |
| D-011 | 🔴 Restricción | El código de la queja SFC no es modificable | Una vez asignado por SmartSupervision (código iniciando con '1391'), el campo no puede editarse en ninguna pantalla. | SCR-05, SCR-06 | — | Regulatorio |
| D-012 | 🟠 Control | La transición a 'En Progreso' requiere seleccionar manualmente 'Gestionar' | No existe automatismo para cambiar el estado de Pendiente a En Progreso. El responsable debe hacer clic manualmente en 'Gestionar'. Riesgo de olvido o demora. | SCR-05 | H-006 | Operativo |
| D-013 | 🔴 Restricción | Reasignación visible para todos los usuarios activos de Jira | En AS-IS, la lista de destinatarios de reasignación incluye a TODOS los usuarios Zurich con licencia Jira activa, sin filtro por área, rol o competencia. | SCR-07 | H-007 | Operativo |
| D-014 | 🟢 Lineamiento | El historial de reasignaciones queda registrado en el caso | Cada reasignación se registra en el campo 'Histórico Reasignaciones' con nombre del usuario y fecha. | SCR-05 | — | Auditoria |
| D-015 | 🟠 Control | El comentario de reasignación es opcional pero recomendado | No existe obligatoriedad de justificar la reasignación. En AS-IS el campo 'Comentario' de la reasignación no es obligatorio. | SCR-07 | H-007 | Operativo |


| ID | Tipo | Nombre | Descripción | Pantalla(s) | Hallazgo | Nivel |
| --- | --- | --- | --- | --- | --- | --- |
| D-016 | 🔴 Restricción | La carta de respuesta SFC DEBE ser PDF con nomenclatura específica | El archivo de respuesta final debe llamarse: NombreCliente_NúmeroIdentificación_RESP_FINAL_SFC_N (donde N es el número secuencial 1, 2, 3...). Sin validación automática en AS-IS. | SCR-05 (Adjuntos) | H-004 | Regulatorio |
| D-017 | 🔵 Regla de Negocio | Un archivo con nomenclatura correcta = cierre posible; incorrecto = rechazo | SmartSupervision rechaza el cierre si el nombre del PDF adjunto no cumple el patrón establecido. Esta regla no está validada en el sistema actual — depende del criterio del usuario. | SCR-05, SCR-09 | H-004 | Regulatorio |
| D-018 | 🟠 Control | Los documentos de soporte internos NO viajan a SmartSupervision | Los adjuntos que no siguen la nomenclatura RESP_FINAL_SFC son considerados soporte interno y no se envían al regulador ni al cliente. | SCR-05 (Adjuntos) | — | Operativo |
| D-019 | 🔵 Regla de Negocio | El campo 'Anexos a la queja' = True es requisito para cerrar | SmartSupervision requiere que el campo 'Anexos a la queja' sea True y que exista un adjunto físico para aceptar el cierre. Un cierre sin adjunto siempre será rechazado. | SCR-09 | H-004 | Regulatorio |


| ID | Tipo | Nombre | Descripción | Pantalla(s) | Hallazgo | Nivel |
| --- | --- | --- | --- | --- | --- | --- |
| D-020 | 🔴 Restricción | Fecha de Actualización DEBE coincidir con Fecha de Cierre | SmartSupervision rechaza el cierre si estos dos campos no tienen el mismo valor. Sin validación automática en AS-IS. Es la causa más frecuente de rechazo en M3. | SCR-09 | H-005 | Regulatorio |
| D-021 | 🔵 Regla de Negocio | Campos de fraude se activan condicionalmente según el Motivo | Tipo de Fraude, Modalidad de Fraude, Monto Reclamado y Monto Reconocido se convierten en obligatorios cuando el Motivo corresponde a fraude. Lógica condicionada pendiente de implementación técnica. Vigente desde 1 jul 2025 (CE 019/2024). | SCR-09 | H-011 | Regulatorio |
| D-022 | 🟠 Control | El campo Comentario de Respuesta Final = cuerpo del correo al cliente | Lo que el usuario escribe en el campo Comentario (SCR-08/SCR-09) es literalmente el cuerpo del correo que recibirá el cliente. Sin previsualización ni aprobación previa. | SCR-08, SCR-09 | H-003 | Operativo |
| D-023 | 🔴 Restricción | El botón 'Respuesta Final' dispara correo al cliente y envío a SFC simultáneamente | Al hacer clic en 'Respuesta Final', se generan dos eventos en paralelo: envío del correo al cliente Y transmisión a SmartSupervision. No es posible cancelar el correo si SmartSupervision rechaza. Esto es una restricción de diseño del AS-IS. | SCR-09 | H-003 | Diseño crítico |
| D-024 | 🔵 Regla de Negocio | Código HTTP 200 = caso cerrado regulatoriamente | Solo la respuesta HTTP 200 de SmartSupervision confirma el cierre regulatorio. Hasta recibir este código, la queja NO está cerrada ante la SFC, aunque Jira muestre estado '3. Done'. | SCR-03, SCR-04, SCR-09 | H-010 | Regulatorio |
| D-025 | 🟠 Control | Código HTTP 400 en M3 requiere reabrir el caso | Ante un rechazo 400 en el Momento 3, el usuario debe seleccionar 'Flujo de Trabajo > Reabrir' para volver a estado 'En Progreso' y repetir el proceso. El cliente ya recibió el correo. | SCR-04, SCR-05 | H-003, H-008 | Operativo |
| D-026 | 🟢 Lineamiento | El campo LGBTIQ+ es requerido por SmartSupervision en el Momento 3 | Campo identificado en las capturas de pantalla del AS-IS (SCR-09). No documentado en la narrativa borrador. Debe validarse con TI y regulatorio su obligatoriedad exacta. | SCR-09 | H-002 | Regulatorio — Pendiente confirmación |


| ID | Tipo | Nombre | Descripción | Pantalla(s) | Hallazgo | Nivel |
| --- | --- | --- | --- | --- | --- | --- |
| D-027 | 🟠 Control | El SLA configurado en Jira es de 64 horas — NO de 15 días hábiles | El timer visible en SCR-05 muestra '64h' como límite. El SLA regulatorio es 15 días hábiles. 64 horas = 8 días calendario = no equivalente a 15 días hábiles. Configuración pendiente de revisión urgente. | SCR-05 | H-006 | Regulatorio |
| D-028 | 🔴 Restricción | No existe escalamiento automático por vencimiento de SLA | En AS-IS no hay alertas ni escalamientos automáticos cuando el plazo se aproxima o vence. El control es 100% manual. | SCR-05 | H-006 | Regulatorio |
| D-029 | 🟢 Lineamiento | El historial de comentarios en Jira registra todos los intentos de integración | Cada intento de envío a SmartSupervision queda registrado como comentario automático de 'Jira Zurich' en el hilo de actividad del caso. Es la única fuente de trazabilidad de intentos en AS-IS. | SCR-03, SCR-04, SCR-05 | H-008 | Auditoria |


| SECCIÓN 4 — PUNTOS DE MEJORA PARA EL DISEÑO TO-BE |
| --- |


| ID | Nombre | Descripción | Campo(s) Afectado(s) |
| --- | --- | --- | --- |
| PM-001 | Validación de formato email antes de guardar | El campo correoElectronico debe validar formato RFC 5321 (usuario@dominio.tld) antes de permitir guardar/continuar. Mensaje de error: 'Ingrese un correo electrónico válido (ej: nombre@dominio.com)'. | F016 / correoElectronico |
| PM-002 | Validación de longitud y tipo en número de identificación | El campo numeroIdentificacion debe validar: solo dígitos, longitud mínima 6 y máxima 15 caracteres, sin espacios ni caracteres especiales. Mensaje específico por error. | F015 / numeroIdentificacion |
| PM-003 | Restricción de caracteres especiales en campos de texto | Todos los campos de texto libre (resumen, nombreConsumidor, textoQueja) deben validar y rechazar los caracteres especiales no permitidos por SmartSupervision ANTES del envío. Lista de caracteres a validar: pendiente documentación técnica SFC. | F003, F013, F021 |
| PM-004 | Dependencia dinámica Departamento → Municipio | El selector de municipio debe cargarse dinámicamente según el departamento seleccionado. Sin departamento seleccionado, el campo municipio debe estar bloqueado. | F006 / departamento + municipio |
| PM-005 | Validación cruzada Fecha Actualización = Fecha Cierre | En el formulario de Respuesta Final, implementar validación en tiempo real que compare F110 y F117. El botón 'Enviar cierre' debe estar deshabilitado y mostrar error si las fechas no coinciden. Mensaje: 'La Fecha de Actualización y la Fecha de Cierre deben ser iguales para enviar a SmartSupervision.' | F110 fechaActualizacion / F117 fechaCierre |
| PM-006 | Precarga automática de campos del M1 en el formulario de M3 | Los campos Canal, Producto, Motivo, Admisión, Ente de Control deben cargarse automáticamente desde los datos del Momento 1, evitando que el usuario los duplique manualmente. Solo deben ser editables si hay una razón justificada. | F102, F103, F104, F118, F123 |
| PM-007 | Validación automática de nomenclatura del PDF | Antes de permitir adjuntar un documento como 'Carta de Respuesta Final SFC', el sistema debe validar: (a) que el nombre cumpla el patrón [NombreCliente]_[NumeroId]_RESP_FINAL_SFC_[N], (b) que la extensión sea .pdf, (c) que el tamaño sea aceptable. Bloquear el adjunto si no cumple. | F066/F067 adjunto |
| PM-008 | Indicador del tipo de adjunto: SFC vs. Soporte Interno | Implementar un selector o tipo de adjunto que permita al usuario clasificar si el documento es 'Carta Respuesta Final SFC' o 'Soporte Interno'. Solo los documentos marcados como 'Carta Respuesta Final SFC' deben validarse con la nomenclatura y enviarse al regulador. | F066/F067 adjunto |
| PM-009 | Campos de fraude con lógica condicional visible | Los campos F105-F108 deben estar ocultos hasta que el campo Motivo (F104) tenga un valor que implique fraude según el catálogo SFC. Al activarse, deben marcarse como obligatorios y mostrar ayuda contextual. | F105, F106, F107, F108 |
| PM-010 | Previsualización del correo antes de enviar al cliente | Antes de ejecutar el Momento 3, el sistema debe mostrar una previsualización del correo que se enviará al cliente (asunto, cuerpo, adjunto) y requerir confirmación explícita del usuario. | F096 comentarioRespuesta |


| ID | Nombre | Descripción | Campo(s) Afectado(s) |
| --- | --- | --- | --- |
| PM-011 | Construir tabla de catálogos SFC con homologación Zurich | Crear y documentar la tabla de equivalencias entre valores internos de Zurich y los catálogos SFC para: Canal, Producto, Motivo, Tipo de Solicitud, Instancia de Recepción, Punto de Recepción, Admisión, Ente de Control, Tipo de Identificación, Tipo de Persona, Sexo, LGBTIQ+, Condición Especial, Producto Digital, Favorabilidad, Aceptación, Rectificación, Desistimiento, Tutela, Marcación, Queja Exprés, Estado Queja, Tipo/Modalidad de Fraude. | F007-F010, F014, F017-F020, F024, F099-F116, F122-F125 |
| PM-012 | Crear campos internos Zurich separados de campos SFC | Implementar campos 'Producto Zurich' y 'Motivo Zurich' adicionales a los campos SFC, para tipificación interna y reportería gerencial. El sistema debe enviar a SmartSupervision los valores SFC homologados, no los internos. | F009 (Producto), F010 (Motivo) |
| PM-013 | Definir campos persistentes vs. solo regulatorios | Documentar cuáles campos deben almacenarse en la base de datos de ProcessMaker para analítica y auditoría, y cuáles solo viajan a SmartSupervision sin persistencia. | Todos los campos F001-F126 |
| PM-014 | Log estructurado de intentos de transmisión | Crear tabla/entidad de log que registre cada intento de envío a SmartSupervision con: ID caso, número de intento, momento (M1/M2/M3), fecha/hora, usuario, código HTTP respuesta, mensaje de error (si aplica), campos en error (si identificables), estado final. | Sistema — Nuevo campo F_LOG |
| PM-015 | Modelo de datos del correo al cliente | Definir y almacenar el contenido exacto de cada correo enviado al cliente (asunto, cuerpo, adjuntos, fecha/hora envío) como parte del expediente del caso, para auditoría y resolución de disputas. | F094-F096 Respuesta Final |
| PM-016 | Campo LGBTIQ+ documentar y validar regulatoriamente | El campo LGBTIQ+ (F100) identificado en la pantalla SCR-09 debe validarse con la documentación técnica oficial de SmartSupervision. Si es un campo regulatorio, debe agregarse al diccionario de datos con sus catálogos completos. | F100 lgbtiq |


| ID | Nombre | Descripción | Pantalla(s) Afectada(s) |
| --- | --- | --- | --- |
| PM-017 | Separar el flujo de cierre regulatorio del envío al cliente | En el TO-BE, el formulario de Respuesta Final debe tener dos etapas: (1) Enviar cierre a SmartSupervision → esperar respuesta; (2) Solo si HTTP 200 → notificar al cliente. Nunca enviar simultáneamente. | SCR-08, SCR-09 → TO-BE: Dos pasos separados |
| PM-018 | Dashboard de gestión de casos activos | Implementar una vista de bandeja de trabajo que muestre: estado del caso, días hábiles restantes para SLA, responsable actual, estado de SmartSupervision, número de intentos de transmisión. | SCR-05 → TO-BE: Nueva pantalla Dashboard |
| PM-019 | Indicador visual del estado de SmartSupervision en el caso | En la pantalla de detalle del caso, mostrar de forma prominente el estado de la última transmisión a SmartSupervision: 'Pendiente de radicación', 'Radicado (código 201)', 'Rechazado (código 400)', 'Cerrado (código 200)'. No solo en comentarios. | SCR-05 → TO-BE: Nuevo componente de estado |
| PM-020 | Botón 'Gestionar' debe ser transición automática o guiada | La transición de '1. Pendiente' a '2. En Progreso' debe ocurrir automáticamente cuando se confirme la radicación exitosa en SmartSupervision (HTTP 201), o presentar una guía clara al usuario sobre cuándo debe activarla. | SCR-05 botón Gestionar |
| PM-021 | Filtro de usuarios en Reasignación por rol/área | El selector de responsable en la reasignación debe filtrar exclusivamente a los usuarios autorizados para recibir casos de Quejas Directas (roles SAC, Línea 2 - Siniestros, Línea 2 - Pagos, etc.). Eliminar usuarios ajenos al proceso. | SCR-07 |
| PM-022 | Sección de error claro cuando SmartSupervision rechaza | Cuando la API devuelve código 400, mostrar al usuario una pantalla/sección específica que indique: el campo exacto que causó el error (si la API lo retorna), la acción correctiva recomendada y el número de intento actual. | SCR-04 → TO-BE: Nuevo panel de error |
| PM-023 | Counter de intentos de transmisión visible en el caso | Mostrar en la vista principal del caso el número de intentos de transmisión realizados para M1, M2 y M3 por separado, y activar alerta visual cuando se supere el umbral definido (ej: 3 intentos fallidos = escalar a TI). | SCR-05 → TO-BE: Nuevo campo contador |
| PM-024 | SLA visible en días hábiles con alerta de vencimiento | El timer del caso debe mostrar el tiempo restante en días hábiles (no horas) y cambiar de color según proximidad al vencimiento: verde (> 5 días), amarillo (3-5 días), rojo (< 3 días), rojo intenso (vencido). | SCR-05 Timers |


| ID | Nombre | Descripción | Directriz Relacionada |
| --- | --- | --- | --- |
| PM-025 | Bloqueo técnico de cierre sin HTTP 200 | Implementar en ProcessMaker una restricción técnica que impida que el caso alcance el estado 'Cerrado' sin que exista en el log de transmisiones un registro de HTTP 200 de SmartSupervision para el Momento 3. | D-024, D-023 → Requisito de arquitectura |
| PM-026 | Configurar SLA en días hábiles Colombia | Configurar el motor de SLA de ProcessMaker con el calendario de días hábiles de Colombia (festivos nacionales excluidos). El plazo de 15 días hábiles debe calcularse desde la fecha de creación del caso. | D-027 → Regulatorio crítico |
| PM-027 | Escalamiento automático por proximidad de SLA | Configurar alertas automáticas: (1) A los 10 días hábiles: alerta al responsable. (2) A los 13 días hábiles: alerta al responsable y supervisor. (3) Al vencimiento: notificación al jefe de área y registro en log de incumplimiento. | D-028 → H-006 |
| PM-028 | Implementar campos CE 019/2024 antes del 1 julio 2025 | Los campos de fraude (F105-F108) deben estar completamente implementados, con lógica condicional según Motivo, validaciones de tipo y rango, y transmisión correcta a SmartSupervision antes del 1 de julio de 2025. | D-021 → H-011 → Fecha crítica |
| PM-029 | Auditoría de correos enviados al cliente | Cada correo enviado al cliente debe quedar registrado en el expediente del caso con: destinatario, fecha/hora, asunto, cuerpo, adjuntos y resultado del envío. Máximo 1 correo de respuesta final por caso (salvo reprocesos controlados). | D-022, D-023 → H-003 |


| CONCLUSIONES DEL ANÁLISIS DE PANTALLAS AS-IS |
| --- |


| Dimensión | Conclusión |
| --- | --- |
| Formularios | Se identificaron 126 campos distribuidos en 9 pantallas. El 60% de los campos de texto libre no tienen validaciones preventivas. Los catálogos de listas desplegables están pendientes de definición en TI. Esto explica structuralmente la alta tasa de rechazos 400 en SmartSupervision. |
| Datos | Se identificó el campo LGBTIQ+ (F100) en SCR-09 que no estaba documentado en la narrativa borrador. Los campos de fraude (F105-F108) están presentes en pantalla pero sin lógica condicional implementada. El diccionario de datos del TO-BE debe incluir un mínimo de 80 campos persistentes y 40 campos regulatorios. |
| Directrices | Se documentaron 29 directrices clasificadas en 4 tipos: 8 Lineamientos (operativos y técnicos), 9 Controles (verificaciones y monitoreos), 7 Restricciones (prohibiciones técnicas y regulatorias) y 5 Reglas de Negocio (lógica condicional). Las restricciones D-020 y D-023 son los problemas de diseño más críticos a resolver. |
| Mejoras TO-BE | Se identificaron 29 puntos de mejora distribuidos en 4 dimensiones. Los más críticos son: PM-005 (validación cruzada de fechas), PM-007 (validación nomenclatura PDF), PM-017 (separar cierre regulatorio de notificación al cliente), PM-025 (bloqueo técnico de cierre sin HTTP 200) y PM-028 (campos CE 019/2024 antes del 1 jul 2025). |


| 📌 HALLAZGO ADICIONAL CRÍTICO — Campo LGBTIQ+ Las capturas de pantalla del manual de usuario revelan que el formulario de Respuesta Final (SCR-09) incluye el campo 'LGBTIQ+*' como campo obligatorio de lista desplegable. Este campo NO aparece documentado en la narrativa borrador del proceso ni en la matriz detallada de pasos. Debe validarse urgentemente con TI y el área regulatoria: (1) ¿Es un campo regulatorio de SmartSupervision vigente? (2) ¿Está incluido en la proforma F.1000-166/Formato 411? (3) ¿Cuál es el catálogo de valores válidos? Esto representa una brecha de documentación que debe cerrarse antes del diseño del TO-BE. |
| --- |


| 📌 PRÓXIMOS PASOS DERIVADOS DE ESTE ANÁLISIS 1. Entregar este anexo al equipo de TI de Zurich para validar los catálogos pendientes (B-02, B-03) y confirmar el campo LGBTIQ+. 2. Construir la Matriz de Catálogos y Homologaciones SFC ↔ Zurich. 3. Diseñar los mockups TO-BE de las 9 pantallas identificadas con las mejoras PM-001 a PM-029. 4. Definir el modelo de datos consolidado de ProcessMaker 4 con los 126+ campos identificados. 5. Elaborar el diccionario de directrices para el motor de reglas de ProcessMaker. |
| --- |
