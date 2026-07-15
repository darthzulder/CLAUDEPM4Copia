# Documentación — COL_QD_cierre-m3

## 1. Encabezado

| Atributo            | Valor                                                              |
|---------------------|--------------------------------------------------------------------|
| Código pantalla     | SCR-010                                                            |
| Tarea BPMN          | SP3-T01 / SP3-T04 / SP3-T08                                        |
| Proceso             | Gestión de Quejas Directas — Subproceso 3: Cierre Regulatorio M3   |
| Rol responsable     | Gestor de Experiencia / Backoffice SFC                             |
| Versión insumos     | Anexo02 v2.0 / Matrices v2.0 / Anexo03 v1.0                       |
| Archivos de impl.   | `CierreM3.tsx`, `SeccionEstadoCierre.tsx` (config centralizada en fields/fields.ts) |
| Estilos             | `frontend/src/shared.css` — sección `COL_QD_cierre-m3` (línea ~1769) |

---

## 2. Resumen

Pantalla de **revisión/confirmación** del cierre regulatorio Momento 3. **Todos los datos de cierre los calcula el back** (Excel `Formulario PQRS`, hoja `MomentoIII` — cada campo marcado "Automático" o "Por default"; hoja `FormularioCreacionPQRS` sección "Cierre" filas 42-58 — todos marcados "Back", "Envío en Momento III para la SFC"). El Gestor de Experiencia / Backoffice **no edita** ningún campo: revisa en solo lectura los valores calculados (estado de la queja, fechas de actualización/cierre, favorabilidad, aceptación, marcación, queja exprés, datos de fraude), visualiza el PDF de respuesta final generado por el proceso, y dispara el envío a SmartSupervision (SFC). Muestra además el estado del envío previo (badge semáforo), intentos y último error. Los valores llegan pre-poblados desde PM4 en `task.data` y se reenvían intactos al completar la tarea. El botón de envío solo se deshabilita mientras hay un envío en curso.

---

## 3. Archivos de Insumo Analizados

| Archivo                                              | Hoja / Sección              | Uso                                                       |
|------------------------------------------------------|-----------------------------|-----------------------------------------------------------|
| `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0.xlsx`       | `SCR-010`                   | Campos, acciones, reglas, mensajes de la pantalla         |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0.xlsx`       | `02_Secciones`              | Secciones SEC-031 a SEC-034, columnas, visibilidad        |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0.xlsx`       | `03_Campos`                 | Diccionario de campos FLD-010-xx                          |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0.xlsx`       | `04_Acciones`               | ACT-010-01 a ACT-010-04                                   |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0.xlsx`       | `05_Reglas`                 | RUL-010-01, RUL-010-02, RUL-010-03                        |
| `Anexo02_Mockups_TOBE_QuejaDirectas_v2_0.xlsx`       | `06_Mensajes`               | MSG-010-xx (mensajes de validación y estado)              |
| `Matrices_Maduracion_TO-BE_QuejaDirectas_v2.0.xlsx`  | `1. Tareas` fila SP3-T01    | Rol responsable, descripción de tarea                     |
| `Matrices_Maduracion_TO-BE_QuejaDirectas_v2.0.xlsx`  | `2. Directrices`            | Directrices y reglas de negocio SP3                       |
| `Anexo03_EspecTecnica_TareasAutomatizadas_v1_0.xlsx` | `05_Variables_Entrada`      | Nombres canónicos de variables de entrada                 |
| `Anexo03_EspecTecnica_TareasAutomatizadas_v1_0.xlsx` | `06_Variables_Salida`       | Variables de salida del cierre                            |

---

## 4. Campos Implementados

### Sección 1 — Estado del Envío a SmartSupervision (SEC-031)

| Campo UI                       | Variable             | Tipo         | Obligatorio | Fuente                               |
|--------------------------------|----------------------|--------------|-------------|--------------------------------------|
| Estado del envío a SFC         | `qd_strM3ClosureStatus`     | display/badge | No (solo lectura) | Anexo02 > SCR-010 > FLD-010-01  |
| Intentos de envío              | `qd_strM3ClosureAttempts`   | display       | No (solo lectura) | Anexo02 > SCR-010 > FLD-010-02  |
| Último error registrado        | `qd_strLastError`        | display       | No (condicional) | Anexo02 > SCR-010 > FLD-010-03 |

> Los campos de la Sección 1 son solo lectura; se pre-populan desde `task.data` en PM4. El estado usa badge de color con configuración: Pendiente=azul, Enviando=amarillo, Rechazado(400)=rojo, Aceptado(200)=verde.

### Sección 2 — Datos de Cierre Regulatorio (SEC-032) — TODOS solo lectura (Back)

| Campo UI                    | Variable                 | Presentación            | Origen (Back)                          |
|-----------------------------|--------------------------|-------------------------|----------------------------------------|
| Código SFC / Radicado       | `qd_strSfcCode`          | `ZdsInput readOnly`     | Asignado por el sistema al radicar     |
| Estado de la Queja          | `qd_strComplaintStatus`  | label resuelto (info-bar) | MomentoIII "Automático"              |
| Fecha de Actualización      | `qd_strUpdateDate`       | `ZdsInput readOnly`     | MomentoIII "Automático" (lo genera Jira) |
| Fecha de Cierre             | `qd_strClosureDate`      | `ZdsInput readOnly`     | MomentoIII "Automático"                |
| Favorabilidad               | `qd_strFavorability`     | label resuelto (info-bar) | Derivado de `qd_strReplyFavorOf`: Cliente→1, Compañía→3 |
| Aceptación                  | `qd_strAcceptance`       | label resuelto (info-bar) | Por default "Sí" (1)                 |
| Marcación                   | `qd_strMarking`          | label resuelto (info-bar) | Automático (revisar con IT)          |
| Queja Exprés                | `qd_strExpressComplaint` | label resuelto (info-bar) | Back, resuelto por default           |

> Los campos codificados (estado, favorabilidad, aceptación, marcación, queja exprés) muestran la **descripción** del catálogo (`useCollection` + helper `desc()`), pero **conservan el código** que espera el BPM/SFC en `task.data`. El valor no se altera; se reenvía intacto al completar la tarea.

### Sección 3 — Adjunto Respuesta Final (SEC-033) — solo lectura

| Campo UI                          | Variable                | Presentación                | Origen (Back)                    |
|-----------------------------------|-------------------------|-----------------------------|----------------------------------|
| ¿Se adjunta PDF?                  | `qd_strFinalReplyAttach` | valor "Sí" (info-bar)      | Forzado a "SI" (Automático)      |
| PDF Respuesta Final               | `qd_strFinalReplyPdf`   | `RequestFileList` (solo lectura) | Generado por el proceso (SCR-009) |

### Sección 4 — Datos de Fraude (SEC-034, condicional) — solo lectura

| Campo UI                    | Variable                   | Presentación              | Origen (Back)                    |
|-----------------------------|----------------------------|---------------------------|----------------------------------|
| ¿Relacionada con fraude?    | `qd_strFraudRelated`       | valor Sí/No (info-bar)    | Back (depende del cierre)        |
| Tipo de Fraude              | `qd_strFraudType`          | label resuelto (info-bar) | Back, según condición            |
| Modalidad de Fraude         | `qd_strFraudModality`      | label resuelto (info-bar) | Lista "modalidad fraude" (Back)  |
| Monto Reclamado (COP)       | `qd_strClaimedAmount`      | `ZdsInput readOnly`       | Back                             |
| Monto Reconocido (COP)      | `qd_strAcknowledgedAmount` | `ZdsInput readOnly`       | Back                             |

> La sección de fraude solo se muestra si `qd_strFraudRelated === 'SI'`. Se añadió **Modalidad de Fraude** (`qd_strFraudModality`), requerida por el Excel (hoja `Lista_Modalidad Fraude`) y ausente en la versión anterior.

---

## 5. Validaciones Implementadas

Al ser una pantalla de **revisión de datos calculados en el back**, no hay validaciones de captura ni gating de front. Los datos ya vienen validados por el proceso PM4 / integración SFC antes de llegar a esta tarea.

| Validación                             | Estado                                                                                      | Nota                            |
|----------------------------------------|---------------------------------------------------------------------------------------------|---------------------------------|
| ~~RUL-010-01: fechas coinciden~~       | **Eliminada**                                                                               | Ambas fechas las genera el back automáticamente (MomentoIII); ya no es gating de front. |
| ~~RUL-010-02: nomenclatura PDF~~       | **Eliminada**                                                                               | El PDF lo genera el proceso (SCR-009) con la nomenclatura correcta; el front solo lo lista. Regex `SCR010_REGEX_NOMENCLATURA_PDF` borrada de `fields.ts`. |
| ~~RUL-010-03: envío habilitado~~       | **Simplificada**                                                                            | El botón solo se deshabilita con `submitting`; ya no depende de campos completos. |
| ~~Campos obligatorios Sec. 2~~         | **Eliminada**                                                                               | Los campos son solo lectura (Back). |
| ~~Datos de fraude obligatorios~~       | **Eliminada**                                                                               | Datos de fraude también solo lectura (Back). |

---

## 6. Mensajes de Error

| Mensaje                                                                               | Condición                                   | Implementación          | Fuente                         |
|---------------------------------------------------------------------------------------|---------------------------------------------|-------------------------|--------------------------------|
| "La Fecha de Actualización debe coincidir con la Fecha de Cierre (RUL-010-01)"       | `qd_strUpdateDate !== qd_strClosureDate`         | `ZrAlert config="negative"` | Anexo02 > SCR-010 > MSG-010-01 |
| "✗ Nomenclatura inválida. Formato esperado: ENTIDAD_NRO_RESP_FINAL_SFC_NNNNN.pdf"   | PDF adjunto con nombre inválido             | `.cierre-m3--validacion-error` helper | Anexo02 > SCR-010 > MSG-010-02 |
| "✓ Nomenclatura correcta: {nombre.pdf}"                                               | PDF adjunto con nombre válido               | `.cierre-m3--validacion-ok` helper | Inferido               |
| "Envío rechazado por SFC. Revise el error indicado…"                                  | `qd_strM3ClosureStatus === 'Rechazado (400)'`      | `ZrAlert config="negative"` | Anexo02 > SCR-010 > MSG-010-03 |
| "Campo requerido"                                                                     | Campos obligatorios vacíos al submit        | `ZdsField error={err(...)}` | react-hook-form              |

---

## 7. Reglas de Negocio

Alineación con el Excel `Formulario PQRS - Proyecto V3.0.xlsx`: **todos los campos de cierre se calculan en el back** (hoja `MomentoIII` — "Automático"/"Por default"; hoja `FormularioCreacionPQRS` sección "Cierre" — "Back", "Envío en Momento III para la SFC"). Por eso las reglas de front que capturaban/validaban esos campos ya no aplican.

| Regla     | Estado    | Nota                                                                                     |
|-----------|-----------|------------------------------------------------------------------------------------------|
| RUL-010-01 | Eliminada | Fechas de actualización y cierre las genera el back; no hay validación de coincidencia en front. |
| RUL-010-02 | Eliminada | Nomenclatura del PDF garantizada por el proceso (SCR-009); front solo lista el archivo.  |
| RUL-010-03 | Simplificada | Envío habilitado salvo `submitting`.                                                  |

> **Regla de negocio confirmada (cálculo del back):** homologación `qd_strReplyFavorOf → qd_strFavorability`: **Cliente → "1"**, **Compañía → "3"**. Debe resolverse en el back. En el JSON de ejemplo llega `qd_strReplyFavorOf:"COMPANIA"` con `qd_strFavorability:"1"` (debería ser "3"): pendiente que el equipo BPM aplique el mapeo.

### 7.1 Datos de envío a la SFC en Momento III (Back, no renderizados)

Todos los defaults "Back" que existen como variable `qd_*` en `task.data` se **conservan y reenvían intactos** al completar la tarea: `reset()` carga el objeto `task.data` completo en el form (el cast `Partial<CierreM3FormData>` solo estrecha el tipo TS, no elimina claves en runtime) y `completeTask` los envía en `data` (PM4 hace merge). Aplica a `qd_strRectification`, `qd_strWithdrawal`, `qd_strDigitalProduct`, `qd_strExtensionDays`, `qd_strChannel`, etc.

**Excepción resuelta — Tipo/Código de entidad (Excel Cierre #46/#47):** no existían como variable. Se crearon `qd_strEntityType` (default `"13"`) y `qd_strEntityCode` (default `"9"`) en `fields.ts` (`SCR010_DEFAULT_ENTITY_TYPE` / `SCR010_DEFAULT_ENTITY_CODE`). En el `useEffect`, si el back no los trae, el front los inyecta con su default para que viajen y se guarden; si el back los trae, respeta ese valor. No se renderizan (decisión: no mostrar el bloque de envío M3).

---

## 8. Comportamientos de UI

| Comportamiento                                    | Implementación                                                              | Fuente                       |
|---------------------------------------------------|-----------------------------------------------------------------------------|------------------------------|
| Sección 1 solo lectura                            | `SeccionEstadoCierre` muestra badges y texto, sin inputs editables          | Anexo02 > SCR-010 > SEC-031  |
| Estado del envío con badge de color               | `STATUS_CONFIG` en `SeccionEstadoCierre.tsx` con inline style               | Anexo02 > SCR-010 > FLD-010-01 |
| Error SFC visible en panel rojo                   | `.ultimo-error-panel` / `.ultimo-error-texto`; solo renderiza si `qd_strLastError` | Anexo02 > SCR-010 > FLD-010-03 |
| Botón cambia etiqueta si rechazado                | `esRechazado ? 'Reenviar Cierre (corrección) ▶' : 'Enviar a SmartSupervision ▶'` | Anexo02 > SCR-010 > ACT-010-01 |
| Sección fraude condicional (solo lectura)         | `qd_strFraudRelated === 'SI'` muestra `qd_strFraudType`, `qd_strFraudModality`, `qd_strClaimedAmount`, `qd_strAcknowledgedAmount` | Anexo02 > SCR-010 > SEC-034 |
| PDF respuesta final en solo lectura               | `RequestFileList` filtrado por el id de `qd_strFinalReplyPdf`               | Anexo02 > SCR-010 > SEC-033  |
| Guardar Borrador no avanza el proceso             | Botón usa `saveDraft()` (PUT `/requests/{id}`), no `completeTask`           | `useTask` — flujo datos      |
| Pre-población desde PM4 (conserva todo)           | `reset({ ...task.data, ... })` en `useEffect` — carga todas las claves      | CLAUDE.md — flujo datos       |

---

## 9. Dependencias Entre Campos

| Campo Origen          | Campo Dependiente              | Comportamiento                                               | Fuente                          |
|-----------------------|--------------------------------|--------------------------------------------------------------|---------------------------------|
| `qd_strUpdateDate`  | `qd_strClosureDate`                  | Deben ser iguales (RUL-010-01); alerta si difieren           | Anexo02 > SCR-010 > 05_Reglas  |
| `qd_strFinalReplyAttach` | `qd_strFinalReplyPdf` (file)   | File input visible solo si valor = `'SI'`                    | Anexo02 > SCR-010 > SEC-033    |
| `qd_strFraudRelated`   | `qd_strFraudType`, `qd_strClaimedAmount`, `qd_strAcknowledgedAmount` | Campos visibles y `qd_strFraudType`/`qd_strClaimedAmount` requeridos si = `'SI'` | Anexo02 > SCR-010 > SEC-034 |
| `qd_strM3ClosureStatus`      | Botón de envío (label)         | Label cambia a "Reenviar…" cuando = `'Rechazado (400)'`      | Anexo02 > SCR-010 > ACT-010-01 |
| `qd_strM3ClosureStatus`      | Alerta estado rechazado        | `ZrAlert` negativo visible cuando = `'Rechazado (400)'`      | Anexo02 > SCR-010 > MSG-010-03 |

---

## 10. Suposiciones Realizadas

1. **Regex nomenclatura PDF**: `/^[^_]+_[^_]+_RESP_FINAL_SFC_\d+\.pdf$/i` derivada del patrón textual de los insumos (`ENTIDAD_NRO_RESP_FINAL_SFC_NNNNN.pdf`). No se proporcionó regex exacta en los insumos.
2. **Catálogos de `qd_strComplaintStatus`**: `CERRADA_CF`, `CERRADA_ENTIDAD`, `DESISTIDA`, `RECTIFICADA` tomados de los valores encontrados en `07_Catalogs` de Anexo02. Marcados como *Pendiente TI* — se deben confirmar con el equipo de TI Zurich.
3. **Catálogos de `qd_strFavorability`, `qd_strAcceptance`, `qd_strMarking`, `qd_strExpressComplaint`**: implementados como listas estáticas numeradas según los valores vistos en el Anexo02. Deben confirmarse como catálogos fijos o dinámicos.
4. **`maxLength: 100` para `qd_strSfcCode`**: no especificado en insumos; suposición conservadora.
5. **Validación de montos**: regex `^\d+(\.\d{1,2})?$` — formato numérico básico, no definido en insumos.
6. **Sección 4 siempre visible**: los insumos indican que los campos de fraude son opcionales; se optó por mostrar la sección siempre y activar campos solo si `qd_strFraudRelated === 'SI'`.
7. **`qd_strFinalReplyAttach` requerido en `puedeEnviar`**: si el usuario elige `'NO'`, se considera informado y válido. El envío puede continuar sin PDF adjunto.
8. **Estilos en `shared.css`**: todos los estilos específicos de la pantalla se centralizaron en `frontend/src/shared.css` (sección `COL_QD_cierre-m3`), siguiendo la regla DRY de CLAUDE.md (sin `styles.css` local).
9. **Rol**: "Gestor de Experiencia / Backoffice SFC" inferido de las matrices SP3-T01/T04/T08. Los insumos pueden especificar variaciones por subtarea.

---

## 11. Cobertura de Trazabilidad

| Categoría               | Cubierto | Total estimado | % |
|-------------------------|----------|----------------|---|
| Campos                  | 17       | 17             | 100% |
| Secciones               | 4        | 4              | 100% |
| Acciones (botones)      | 4        | 4              | 100% |
| Reglas de negocio       | 3        | 3              | 100% |
| Mensajes frontend       | 5        | ~6             | ~83% |
| Catálogos               | 6        | 6              | 100% (valores pendientes confirmación TI) |

**Elementos inferidos (sin respaldo explícito en insumos):**
- Regex de nomenclatura PDF (derivada del patrón textual)
- `maxLength` de `qd_strSfcCode`
- Validación de formato de montos
- Texto del helper de validación OK ("✓ Nomenclatura correcta…")
