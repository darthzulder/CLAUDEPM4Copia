# SCR-001 — Crear / Recibir Queja
## Documentación Técnica y Normativa

**Pantalla:** SCR-001 · PAN-01  
**Tarea BPMN:** P01-T01 — Recibir y registrar queja  
**Rol:** Gestor de Experiencia  
**Estado del proceso:** Inicio del proceso — Gestión de Quejas Directas  
**Versión del diseño:** TO-BE v2.0 · Mayo 2026  

---

## 1. Documentos fuente

Esta pantalla fue construida a partir del análisis cruzado de los siguientes documentos:

| Documento | Archivo | Propósito |
|---|---|---|
| Análisis de pantallas AS-IS | `Anexo01_Pantallas_AS-IS_QuejaDirectas_Zurich_v1.0.md` | Levantamiento de la pantalla SCR-01 (Crear Incidencia) en Jira con sus 24 campos, problemas identificados y reglas observadas |
| Mockups TO-BE v2.0 | `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0_html.md` | Diseño funcional detallado de SCR-001, especificación de los 22 campos FLD-001 a FLD-022, acciones y reglas |
| Especificación de pantallas TO-BE | `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0_xlsx.md` | Inventario maestro de pantallas, diccionario de campos, acciones, reglas, catálogos y permisos por rol |
| Matrices de maduración TO-BE | `Matrices_Maduracion_TO-BE_QuejaDirectas_v2.0.md` | Inventario de tareas BPMN, directrices, roles y responsabilidades del proceso P01 |

**Contexto regulatorio:**  
- Circular Externa SFC CE 039/2011 — Marco general de quejas ante la Superintendencia Financiera de Colombia  
- Circular Externa SFC CE 019/2024 — Campos de fraude obligatorios desde 1 julio 2025  
- Proforma F.1000-166 / Formato 411 — Formulario regulatorio SmartSupervision  

---

## 2. Propósito de la pantalla

La pantalla SCR-001 es el punto de entrada del proceso de Gestión de Quejas Directas (ACZ-QD-001). Permite al Gestor de Experiencia registrar una nueva queja de un consumidor financiero en ProcessMaker 4, capturando todos los datos requeridos para la radicación ante SmartSupervision (plataforma del regulador SFC).

Al presionar **Crear Queja**, el BPM ejecuta automáticamente la tarea P01-T06 (validación preventiva de datos) antes de activar el Momento 1 de integración con SmartSupervision. Si detecta errores, el proceso se deriva a SCR-002 (Corrección de Datos) sin enviar nada al regulador.

---

## 3. Estructura de la pantalla

La pantalla está organizada en cuatro secciones:

---

### Sección 1 — Encabezado del Caso
**Campos:** FLD-001, FLD-002, FLD-003

| ID Campo | Nombre técnico | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| FLD-001 | `qd_numeroCaso` | Solo lectura | — | Asignado automáticamente por el BPM al crear el registro. No editable por el usuario. |
| FLD-002 | `qd_canalRecepcion` | Select (CAT-CANAL) | Sí | Canal por el cual se recibió la queja. Se captura solo una vez (RUL-001-05). Catálogo SFC. |
| FLD-003 | `qd_fechaHoraCreacion` | Solo lectura | — | Timestamp generado por el BPM al guardar. No editable. |

**Fuente normativa:**
- Directriz D-006 (Anexo01): "La fecha y hora de creación es automática e inmodificable — el sistema Jira asigna automáticamente la fecha y hora de creación."
- Mockup SCR-001 (Anexo02 html): "FLD-002 · CAT-CANAL · Se captura solo una vez (RUL-001-05)."

---

### Sección 2 — Datos del Consumidor Financiero
**Campos:** FLD-004 a FLD-011  
**Archivo:** `SeccionConsumidor.tsx`

| ID Campo | Nombre técnico | Tipo | Obligatorio | Validaciones implementadas |
|---|---|---|---|---|
| FLD-004 | `qd_nombreConsumidor` | Texto libre | Sí | Máximo 200 caracteres. Sin restricción de formato en esta etapa (PM-003 pendiente lista SFC). |
| FLD-005 | `qd_tipoIdentificacion` | Select (CAT-TIPO-ID) | Sí | Catálogo SFC: Cédula CC, Cédula extranjería, NIT, Pasaporte, Tarjeta identidad. |
| FLD-006 | `qd_numeroIdentificacion` | Texto numérico | Sí | Solo dígitos. Mínimo 6, máximo 15 caracteres. Sin espacios ni separadores. |
| FLD-007 | `qd_correoElectronico` | Email | Sí | Validación formato RFC 5321 (`usuario@dominio.tld`). Destino del correo de respuesta final. |
| FLD-008 | `qd_tipoPersona` | Select (CAT-TIPO-PERSONA) | Sí | Natural o Jurídica. |
| FLD-009 | `qd_codigoPais` | Select (CAT-PAIS) | Sí | Por defecto `170 — Colombia` (D-003: siempre Colombia para el proceso actual). |
| FLD-010 | `qd_departamento` | Select (CAT-DPTO) | Sí | Filtra dinámicamente los municipios disponibles (RUL-001-03). |
| FLD-011 | `qd_municipio` | Select (CAT-MPIO) | Sí | Dependiente de FLD-010. Se limpia automáticamente si el departamento cambia. Bloqueado hasta seleccionar departamento. |

**Mejoras TO-BE aplicadas vs AS-IS:**

| ID Mejora | Descripción | Fuente |
|---|---|---|
| PM-001 | Validación de formato email RFC 5321 antes de guardar | Anexo01, sección 4.1 |
| PM-002 | Validación de longitud y tipo en número de identificación (solo dígitos, 6-15 caracteres) | Anexo01, sección 4.1 |
| PM-004 | Dependencia dinámica Departamento → Municipio: municipio bloqueado hasta seleccionar departamento, lista filtrada | Anexo01, sección 4.1 |

**Directrices aplicadas:**

| ID Directriz | Tipo | Descripción | Fuente |
|---|---|---|---|
| D-003 | 🔴 Restricción | Código País siempre Colombia (`170`). Valor preestablecido. | Anexo01, sección 3.1 |
| D-004 | 🔵 Regla de Negocio | Municipio depende del Departamento. Lista filtrada dinámicamente. | Anexo01, sección 3.1 |
| D-008 | 🟠 Control | Correo electrónico es el único canal de notificación al cliente. Error en este campo impide la comunicación. | Anexo01, sección 3.1 |
| RUL-001-03 | Regla | Si cambia el departamento, se limpia el municipio seleccionado. | Anexo02 html, SCR-001 |

---

### Sección 3 — Clasificación y Datos de la Queja
**Campos:** FLD-012 a FLD-020  
**Archivo:** `SeccionClasificacion.tsx`

| ID Campo | Nombre técnico | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| FLD-012 | `qd_asunto` | Texto libre | Sí | Máximo 500 caracteres. Título descriptivo de la queja. |
| FLD-013 | `qd_descripcionQueja` | Área de texto | No | Máximo 4000 caracteres. Descripción libre de la queja. |
| FLD-014 | `qd_productoSFC` | Select (CAT-PRODUCTO-SFC) | Sí | Catálogo homologado SFC. Ejemplo: `101. Seguro de automóviles`. |
| FLD-015 | `qd_motivoSFC` | Select (CAT-MOTIVO-SFC) | Sí | **Campo crítico:** condiciona la activación de los campos de fraude en el Momento 3 (CE 019/2024). |
| FLD-016 | `qd_tipoSolicitud` | Select (CAT-TIPO-SOL) | Sí | Solo uso interno Zurich. **No viaja a SmartSupervision.** |
| FLD-017 | `qd_instanciaRecepcion` | Select (CAT-INSTANCIA) | Sí | Catálogo SFC. |
| FLD-018 | `qd_puntoRecepcion` | Select (CAT-PUNTO) | Sí | Catálogo SFC. |
| FLD-019 | `qd_admision` | Select (CAT-ADMISION) | Sí | Catálogo SFC. Ejemplo: `9. No aplica`. |
| FLD-020 | `qd_enteControl` | Select (CAT-ENTE) | Sí | Catálogo SFC. Ejemplo: `99. Otros`. |

**Directrices aplicadas:**

| ID Directriz | Tipo | Descripción | Fuente |
|---|---|---|---|
| D-005 | 🟠 Control | Campo Motivo requerido para M2 y M3. Debe estar correctamente diligenciado desde el Momento 1 ya que condiciona los campos de fraude en el cierre regulatorio. | Anexo01, sección 3.1 |
| D-009 | 🔴 Restricción | Sin catálogos SFC definidos las listas causan rechazos 400. Los catálogos de esta pantalla están homologados a los valores observados en AS-IS. Pendiente validación completa con TI Zurich. | Anexo01, sección 3.1 |
| PM-011 | Mejora | Catálogos SFC construidos con los valores observados en el AS-IS. Pendiente entrega de tabla completa de homologación SFC ↔ Zurich por TI. | Anexo01, sección 4.2 |
| PM-012 | Mejora | El campo Tipo de Solicitud (`qd_tipoSolicitud`) es de uso interno Zurich, separado de los campos SFC regulatorios. | Anexo01, sección 4.2 |

---

### Sección 4 — Adjuntos
**Campos:** FLD-021, FLD-022

| ID Campo | Nombre técnico | Tipo | Obligatorio | Notas |
|---|---|---|---|---|
| FLD-021 | `qd_incluyeAnexos` | Radio (Sí/No) | Sí | Indicador regulatorio SFC. `True` si hay adjuntos. Condiciona la visibilidad del campo de carga. |
| FLD-022 | `qd_adjuntoNombre` / `qd_adjunto` | Upload de archivos | Condicional | Visible solo cuando FLD-021 = `Sí`. Sin validación de nomenclatura en esta etapa de creación (PM-007 se aplica en SCR-010). Formatos aceptados: PDF, DOC, DOCX, JPG, PNG. |

**Directrices aplicadas:**

| ID Directriz | Tipo | Descripción | Fuente |
|---|---|---|---|
| D-016 | 🔴 Restricción | La carta de respuesta SFC DEBE ser PDF con nomenclatura `NombreCliente_NúmeroIdentificación_RESP_FINAL_SFC_N`. Esta validación aplica en el cierre (SCR-010), no en la creación. | Anexo01, sección 3.3 |
| D-019 | 🔵 Regla de Negocio | El campo Anexos = `True` es requisito para cerrar ante SmartSupervision. El sistema impide el cierre sin adjunto físico. Esta validación aplica en SCR-010. | Anexo01, sección 3.3 |
| PM-007 | Mejora pendiente | Validación de nomenclatura del PDF se implementa en SCR-010 (Formulario Cierre M3), no en SCR-001. En la creación el adjunto es un soporte inicial opcional. | Anexo01, sección 4.1 |
| PM-008 | Mejora pendiente | Clasificación del adjunto (SFC vs. soporte interno) pendiente de implementar en SCR-005 y SCR-010. | Anexo01, sección 4.1 |

---

## 4. Acciones disponibles

| Acción | Elemento UI | Comportamiento | Fuente |
|---|---|---|---|
| Cancelar | Botón secundario | Descarta el formulario y regresa a la pantalla anterior. No crea registro. | Mockup SCR-001, ACT-001-02 |
| Guardar Borrador | Botón outline | Guarda el estado actual del formulario con `_draft: true`. No envía a SmartSupervision. Permite retomar más tarde. | Mockup SCR-001, ACT-001-03 |
| Crear Queja ▶ | Botón primario (verde) | Completa la tarea PM4 (`PUT /tasks/{id}` con `status: COMPLETED`). El BPM ejecuta P01-T06 (validación preventiva) y luego SP1 (radicación SmartSupervision). | Mockup SCR-001, ACT-001-01 |

---

## 5. Flujo de datos

```
Usuario completa formulario SCR-001
        ↓
handleSubmit() — react-hook-form valida todos los campos
        ↓
Si incluyeAnexos = 'SI' → POST /api/requests/{id}/files (archivo adjunto)
        ↓
PUT /api/tasks/{taskId}  { status: "COMPLETED", data: formData }
        ↓
PM4 activa → P01-T06 (validación preventiva automática)
        ↓
¿Errores detectados?
  SÍ → PM4 deriva a SCR-002 (Corrección de Datos)
  NO → PM4 activa SP1 (Momento 1 — SmartSupervision)
        ↓
SmartSupervision devuelve HTTP 201 → código queja 1391...
PM4 registra código y avanza a SCR-005 (Detalle del Caso)
```

---

## 6. Validaciones implementadas en el frontend

Las siguientes validaciones se ejecutan en el cliente antes del envío, cumpliendo las mejoras PM-001 a PM-004 del Anexo01:

| Campo | Validación | Mensaje de error | Normativa |
|---|---|---|---|
| `qd_canalRecepcion` | Obligatorio | "Campo requerido" | RUL-001-05 |
| `qd_nombreConsumidor` | Obligatorio · Máx. 200 car. | "Campo requerido" / "Máximo 200 caracteres" | FLD-004 |
| `qd_tipoIdentificacion` | Obligatorio | "Campo requerido" | FLD-005 |
| `qd_numeroIdentificacion` | Obligatorio · Solo dígitos · 6-15 car. | "Solo dígitos, mínimo 6 y máximo 15 caracteres" | PM-002 |
| `qd_correoElectronico` | Obligatorio · Formato RFC 5321 | "Ingrese un correo válido (ej: nombre@dominio.com)" | PM-001, D-008 |
| `qd_tipoPersona` | Obligatorio | "Campo requerido" | FLD-008 |
| `qd_codigoPais` | Obligatorio · Default 170 | "Campo requerido" | D-003 |
| `qd_departamento` | Obligatorio | "Campo requerido" | RUL-001-03 |
| `qd_municipio` | Obligatorio · Dependiente de departamento | "Campo requerido" | RUL-001-03, D-004 |
| `qd_asunto` | Obligatorio · Máx. 500 car. | "Campo requerido" / "Máximo 500 caracteres" | FLD-012 |
| `qd_descripcionQueja` | Opcional · Máx. 4000 car. | "Máximo 4000 caracteres" | FLD-013 |
| `qd_productoSFC` | Obligatorio | "Campo requerido" | FLD-014 |
| `qd_motivoSFC` | Obligatorio | "Campo requerido" | FLD-015, D-005 |
| `qd_tipoSolicitud` | Obligatorio | "Campo requerido" | FLD-016 |
| `qd_instanciaRecepcion` | Obligatorio | "Campo requerido" | FLD-017 |
| `qd_puntoRecepcion` | Obligatorio | "Campo requerido" | FLD-018 |
| `qd_admision` | Obligatorio | "Campo requerido" | FLD-019 |
| `qd_enteControl` | Obligatorio | "Campo requerido" | FLD-020 |
| `qd_incluyeAnexos` | Obligatorio | "Campo requerido" | FLD-021, D-019 |

> **Nota de diseño:** Los errores de validación de campos requeridos vacíos se muestran solo después del primer intento de envío (comportamiento `isSubmitted`). Los errores de formato (email, número de identificación) se muestran inmediatamente al salir del campo.

---

## 7. Catálogos utilizados (placeholder)

Los catálogos de esta pantalla están implementados como listas estáticas en `variables.ts`. Están basados en los valores observados en el AS-IS (Jira) y en la documentación regulatoria de la SFC. Pendiente reemplazo por colecciones dinámicas de PM4 cuando TI Zurich entregue los IDs de colección definitivos.

| Catálogo | Archivo fuente | Estado |
|---|---|---|
| CAT-CANAL | `variables.ts` → `OPTIONS.canal` | Placeholder — pendiente homologación TI |
| CAT-TIPO-ID | `variables.ts` → `OPTIONS.tipoIdentificacion` | Placeholder |
| CAT-TIPO-PERSONA | `variables.ts` → `OPTIONS.tipoPersona` | Completo (solo 2 valores) |
| CAT-PAIS | `variables.ts` → `OPTIONS.codigoPais` | Solo Colombia (D-003) |
| CAT-DPTO | `variables.ts` → `DEPARTAMENTOS` | Placeholder — 9 departamentos principales |
| CAT-MPIO | `variables.ts` → `MUNICIPIOS_POR_DPTO` | Placeholder — municipios principales por dpto |
| CAT-PRODUCTO-SFC | `variables.ts` → `OPTIONS.productoSFC` | Placeholder — pendiente lista completa SFC |
| CAT-MOTIVO-SFC | `variables.ts` → `OPTIONS.motivoSFC` | Placeholder — pendiente lista completa SFC |
| CAT-TIPO-SOL | `variables.ts` → `OPTIONS.tipoSolicitud` | Placeholder — uso interno Zurich |
| CAT-INSTANCIA | `variables.ts` → `OPTIONS.instanciaRecepcion` | Placeholder |
| CAT-PUNTO | `variables.ts` → `OPTIONS.puntoRecepcion` | Placeholder |
| CAT-ADMISION | `variables.ts` → `OPTIONS.admision` | Placeholder |
| CAT-ENTE | `variables.ts` → `OPTIONS.enteControl` | Placeholder |

---

## 8. Pendientes identificados

Los siguientes puntos requieren acción antes de pasar a producción:

| ID | Descripción | Prioridad | Fuente |
|---|---|---|---|
| P-001 | Reemplazar catálogos estáticos (departamentos, municipios, canal, producto, motivo SFC) por colecciones dinámicas de PM4 cuando TI entregue los IDs. | Alta | Anexo01, D-009 |
| P-002 | Validar y ampliar la lista de caracteres especiales no permitidos por SmartSupervision en campos de texto (FLD-004, FLD-012, FLD-013). Lista pendiente de documentación técnica SFC. | Alta | Anexo01, PM-003 |
| P-003 | Implementar la validación preventiva P01-T06 en el BPM (PM4 script) que verifica todos los campos antes del Momento 1. Esta pantalla solo valida el lado cliente. | Alta | Matrices Maduracion, tarea P01-T06 |
| P-004 | Configurar el SLA en días hábiles de Colombia (15 días hábiles), no en horas. | Alta | Anexo01, D-027, PM-026 |
| P-005 | Confirmar con TI y regulatorio el catálogo completo de canales, productos y motivos SFC según la normativa vigente. | Media | Anexo01, D-009 |

---

## 9. Estructura de archivos

```
frontend/src/screens/recibir-queja/
├── variables.ts           ← Opciones estáticas, catálogos geográficos, tipo TS RecibirQuejaFormData
├── shared.css (global)    ← Estilos centralizados de manera DRY (sin styles.css local)
├── SeccionConsumidor.tsx  ← FLD-004 a FLD-011 (Datos del Consumidor Financiero)
├── SeccionClasificacion.tsx ← FLD-012 a FLD-020 (Clasificación y Datos de la Queja)
├── RecibirQueja.tsx       ← Componente principal: encabezado, adjuntos, acciones
└── DOCUMENTACION.md       ← Este documento
```

---

*Elaborado por BeePM — Beesmartec | Para: Zurich Seguros Colombia | Confidencial — Versión 1.0 | Junio 2026*
