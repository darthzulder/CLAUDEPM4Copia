# DOCUMENTACION — COL_QD-corregir-datos-formulario

## 1. Encabezado

| Atributo | Valor |
|---|---|
| **Pantalla** | SCR-002 · PAN-02 |
| **Tarea BPMN** | P01-T07 — Corregir datos del formulario |
| **Proceso** | P01 — Gestión de Quejas Directas |
| **Subproceso** | — (tarea del proceso principal P01) |
| **Rol responsable** | Gestor de Experiencia |
| **Versión insumo** | Anexo02_Mockups_TOBE_QuejaDirectas_v2_0 |
| **Archivos de implementación** | `CorregirDatosFormulario.tsx`, `SeccionErroresValidacion.tsx`, `variables.ts` |
| **Slug en App.tsx** | `COL_QD-corregir-datos-formulario` |

---

## 2. Resumen

Pantalla de corrección preventiva activada cuando la tarea **P01-T06** (Validación Preventiva) detecta uno o más campos del formulario de queja con errores de formato o de consistencia. El Gestor de Experiencia ve únicamente los campos en error, los corrige, y el sistema re-ejecuta automáticamente P01-T06. El botón de envío se habilita solo cuando el contador de errores llega a cero (RUL-002-01).

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja / Sección | Descripción de uso |
|---|---|---|
| `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0.html` | `#screen-scr002` (SCR-002) | Estructura de pantalla, secciones, campos, acciones, alertas y reglas de validación |

> **Nota:** Los archivos `.xlsx` del Anexo02 no estaban disponibles en formato legible para este entregable; se usó la versión `.html` del mismo anexo como fuente de trazabilidad. El análisis de los `.xlsx` queda pendiente para completar la cobertura de las hojas `02_Secciones`, `04_Acciones`, `05_Reglas`, `06_Mensajes`, `07_Catalogs`, `08_Permisos` y `10_Trazabilidad_BPMN`.

---

## 4. Campos Implementados

### Sección: Datos del Caso (solo lectura)

| Campo (UI) | Variable BPM | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| Número de Caso | `qd_numeroCaso` | `ZdsInput` readOnly | — | Anexo02 HTML > SCR-002 > FLD-030 |
| Canal de Recepción | `qd_canalRecepcion` | `ZdsInput` readOnly | — | Anexo02 HTML > SCR-002 > FLD-031 |
| SLA Restante | `qd_slaRestante` | `ZdsInput` readOnly | — | Anexo02 HTML > SCR-002 > FLD-032 |

### Sección: Campos con Error (dinámica — renderiza solo los campos indicados por el BPM)

| Campo (UI) | Variable BPM | Tipo | Obligatorio | Reglas de validación | Fuente |
|---|---|---|---|---|---|
| Correo Electrónico | `qd_correoElectronico` | `ZdsInput` email | Sí | RFC 5321: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | Anexo02 HTML > SCR-002 > FLD-007 |
| Número de Identificación | `qd_numeroIdentificacion` | `ZdsInput` | Sí | Solo dígitos `/^\d+$/`; mín 6, máx 15 | Anexo02 HTML > SCR-002 > FLD-006 |
| Departamento | `qd_departamento` | `ZdsSelect` | Sí (cuando municipio está en error) | Catálogo estático Colombia | Anexo02 HTML > SCR-002 > FLD-010 (relacionado con FLD-011) |
| Municipio | `qd_municipio` | `ZdsSelect` cascading | Sí | Lista filtrada por departamento | Anexo02 HTML > SCR-002 > FLD-011 |
| Campo genérico | `{campo}` | `ZdsInput` | Sí | `required` | Fallback para errores no tipados en el frontend |

### Metadata inyectada por el BPM

| Variable BPM | Tipo | Descripción | Fuente |
|---|---|---|---|
| `qd_errores_json` | `string` (JSON) | Array de `CampoConError[]` con los campos rechazados por P01-T06 | Inferido — no encontrado explícitamente en insumos disponibles |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Correo electrónico — formato RFC 5321 | Pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; mensaje: "Formato inválido. Ingrese: nombre@dominio.com" | Anexo02 HTML > SCR-002 (error 1 del mockup) |
| Número de identificación — solo dígitos | Pattern `/^\d+$/`; minLength 6, maxLength 15; sin espacios | Anexo02 HTML > SCR-002 (error 2 del mockup) |
| Municipio — pertenencia al departamento | Options de `ZdsSelect` filtradas dinámicamente por `qd_departamento`; al cambiar depto, se limpia el municipio | Anexo02 HTML > SCR-002 (error 3 del mockup) |
| RUL-002-01 — botón habilitado solo con 0 errores | `canSubmit = triggered && pendingErrors === 0`; button `disabled={!canSubmit}` | Anexo02 HTML > SCR-002 (alerta principal y botón deshabilitado) |
| Modo onChange | `useForm({ mode: 'onChange' })` — errores se actualizan en tiempo real al escribir | Convención del proyecto (CLAUDE.md) |
| Trigger inicial | `trigger(fieldsToTrigger)` después de `reset()` para mostrar errores desde el primer render | Inferido — comportamiento esperado en pantalla de corrección |

---

## 6. Mensajes de Error

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| "N error(es) de validación detectado(s). Corrija cada campo resaltado..." | `!canSubmit` en el alert principal | `ZrAlert config="negative"` con texto dinámico | Anexo02 HTML > SCR-002 (alert principal) |
| "Todos los errores han sido corregidos. Presione 'Guardar Correcciones'..." | `canSubmit === true` | `ZrAlert config="success"` | Inferido — UX de confirmación |
| "Formato inválido. Ingrese: nombre@dominio.com" | Correo no cumple patrón RFC 5321 | Error inline de `ZdsInput` | Anexo02 HTML > SCR-002 (error 1) |
| "Solo dígitos, sin espacios ni separadores" | Identificación contiene caracteres no numéricos | Error inline de `ZdsInput` | Anexo02 HTML > SCR-002 (error 2) |
| "Seleccione un municipio válido para el departamento" | Municipio vacío o no pertenece al departamento | Error inline de `ZdsSelect` | Anexo02 HTML > SCR-002 (error 3) |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-002-01: Botón "Guardar Correcciones" habilitado solo cuando contador = 0 | `disabled={!canSubmit}` donde `canSubmit = triggered && pendingErrors === 0 && !submitting` | Anexo02 HTML > SCR-002 |
| Municipio debe pertenecer al departamento seleccionado | `useEffect` en `SeccionErroresValidacion` limpia `qd_municipio` al cambiar `qd_departamento` | Anexo02 HTML > SCR-002 (error 3) |
| Re-ejecución automática de P01-T06 al guardar | Documentado en alerta de aviso; el BPM implementa la re-ejecución en el backend | Anexo02 HTML > SCR-002 (alerta warning) |
| Solo lectura de campos FLD-030..032 | `readOnly` en `ZdsInput`; ninguna regla de validación sobre ellos | Anexo02 HTML > SCR-002 (nota "No editable en corrección") |
| Canal de Recepción no editable en corrección | FLD-031 renderizado como `readOnly` | Anexo02 HTML > SCR-002 > FLD-031 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Contador de errores en `InfoBar` ("N de M") | `pendingErrors` calculado en tiempo real desde `formState.errors` | Anexo02 HTML > SCR-002 (ctx-bar "Errores pendientes") |
| Etiqueta del botón muestra cuenta de errores | `"Guardar Correcciones (N error(es) pendiente(s))"` cuando `!canSubmit` | Anexo02 HTML > SCR-002 (botón disabled) |
| Alert por campo con `valorRechazado` y `mensajeError` | `ZrAlert config="negative"` antes de cada campo editable; incluye `<code>` para el valor rechazado | Anexo02 HTML > SCR-002 (alertas por error) |
| Separador visual entre bloques de error | Clase `.error-field-block--sep` (`border-top` + padding) en `shared.css` | Inferido — UX de separación visual del mockup |
| Validación en tiempo real (onChange) | `useForm({ mode: 'onChange' })` | Convención del proyecto |
| Trigger de validación al montar | `trigger(fieldsToTrigger)` con 80ms de delay para esperar montaje de campos | Inferido |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_departamento` | `qd_municipio` | Al cambiar departamento, opciones de municipio se filtran; si el valor actual de municipio no está en la nueva lista, se limpia automáticamente | Anexo02 HTML > SCR-002 (error 3 — cascada depto/municipio) |
| `qd_errores_json` | Campos renderizados en `SeccionErroresValidacion` | El JSON determina qué campos se muestran para corrección | Inferido — diseño dinámico de la pantalla |

---

## 10. Suposiciones Realizadas

| Suposición | Motivo |
|---|---|
| El BPM inyecta los errores como `qd_errores_json` (JSON string de `CampoConError[]`) | No hay nombre canónico de variable en los insumos disponibles; el diseño JSON es una suposición del equipo frontend para hacer la lista de errores dinámica |
| `CampoConError` incluye `fldId`, `etiqueta`, `valorRechazado`, `mensajeError` | Estructura mínima para que el frontend pueda mostrar el contexto del error sin hardcodear etiquetas |
| Catálogos de departamentos y municipios son estáticos (placeholder) | El `07_Catalogs` no fue analizado del Excel; se reutilizaron los mismos datos de `recibir-queja/variables.ts` |
| `ERRORES_EJEMPLO` como fallback de desarrollo | Para renderizar la pantalla sin `task_id`, se usan los 3 errores del mockup como ejemplo |
| Trigger de validación inicial con 80ms de delay | Evita race condition entre el `reset()` y el montaje de los campos controlados (`Controller`) |
| Botón "Cancelar Corrección" navega a `window.history.back()` | El mockup usa `showScreen('index')` (navegación interna del HTML); en la app real el historial del navegador es el equivalente |
| Los campos de la sección "Datos del Caso" son siempre 3 (FLD-030..032) | Así aparecen en el mockup; no se encontró evidencia en los insumos de que puedan variar |
| El caso genérico (campo desconocido) usa `ZdsInput` sin validación específica | Los errores de campos no listados en `CAMPOS_CONOCIDOS` pueden aparecer si el BPM amplía los campos en error; se degradan graciosamente a input de texto con `required` |

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura estimada | Observaciones |
|---|---|---|
| Campos del mockup | 80% | FLD-030, 031, 032, 006, 007, 010, 011 implementados; resto de campos corregibles (nombre, producto, motivo, etc.) solo como fallback genérico |
| Reglas de validación (mockup) | 90% | RUL-002-01 implementada; validaciones de email e ID implementadas; municipio/depto implementada |
| Mensajes de error | 85% | Mensajes de los 3 errores del mockup implementados; mensajes del resto de campos pendientes |
| Acciones | 100% | "Cancelar Corrección" y "Guardar Correcciones" implementadas |
| Reglas de negocio Excel | 10% | No se analizaron las hojas `05_Reglas` ni `06_Mensajes` del Anexo02.xlsx — **pendiente** |
| Catálogos (07_Catalogs) | 0% | No analizado — **pendiente** |
| Permisos (08_Permisos) | 0% | No analizado — **pendiente** |
| Trazabilidad BPMN (10_Trazabilidad_BPMN) | 0% | No analizado — **pendiente** |

### Elementos inferidos (no respaldados explícitamente en insumos)

- Nombre de variable `qd_errores_json` y estructura `CampoConError`
- Mecanismo de trigger de validación inicial con delay
- Fallback `ERRORES_EJEMPLO` para desarrollo
- Clases CSS `.error-field-block` y `.error-field-block--sep`
