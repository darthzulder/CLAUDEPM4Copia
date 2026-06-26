# Documentación — COL_QD_cierre-m3

## 1. Encabezado

| Atributo            | Valor                                                              |
|---------------------|--------------------------------------------------------------------|
| Código pantalla     | SCR-010                                                            |
| Tarea BPMN          | SP3-T01 / SP3-T04 / SP3-T08                                        |
| Proceso             | Gestión de Quejas Directas — Subproceso 3: Cierre Regulatorio M3   |
| Rol responsable     | Gestor de Experiencia / Backoffice SFC                             |
| Versión insumos     | Anexo02 v2.0 / Matrices v2.0 / Anexo03 v1.0                       |
| Archivos de impl.   | `variables.ts`, `CierreM3.tsx`, `SeccionEstadoCierre.tsx`          |
| Estilos             | `frontend/src/shared.css` — sección `COL_QD_cierre-m3` (línea ~1769) |

---

## 2. Resumen

Pantalla de cierre regulatorio Momento 3. Permite al Gestor de Experiencia / Backoffice registrar los datos de cierre ante la SFC (Superfinanciera), adjuntar el PDF de respuesta final con nomenclatura regulatoria, e informar si la queja está relacionada con fraude. Muestra el estado del envío previo a SmartSupervision (SFC), incluyendo intentos y último error. El botón de envío se habilita solo cuando fechas coinciden, la nomenclatura del PDF es válida y todos los campos obligatorios están completos.

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
| Estado del envío a SFC         | `estadoCierreM3`     | display/badge | No (solo lectura) | Anexo02 > SCR-010 > FLD-010-01  |
| Intentos de envío              | `intentosCierreM3`   | display       | No (solo lectura) | Anexo02 > SCR-010 > FLD-010-02  |
| Último error registrado        | `ultimoError`        | display       | No (condicional) | Anexo02 > SCR-010 > FLD-010-03 |

> Los campos de la Sección 1 son solo lectura; se pre-populan desde `task.data` en PM4. El estado usa badge de color con configuración: Pendiente=azul, Enviando=amarillo, Rechazado(400)=rojo, Aceptado(200)=verde.

### Sección 2 — Datos de Cierre Regulatorio (SEC-032)

| Campo UI                    | Variable             | Tipo     | Obligatorio | Fuente                               |
|-----------------------------|----------------------|----------|-------------|--------------------------------------|
| Código SFC / Radicado       | `codigoSFC`          | text     | Sí          | Anexo02 > SCR-010 > FLD-010-04       |
| Estado de la Queja          | `estadoQueja`        | select   | Sí          | Anexo02 > SCR-010 > FLD-010-05       |
| Fecha de Actualización      | `fechaActualizacion` | date     | Sí          | Anexo02 > SCR-010 > FLD-010-06       |
| Fecha de Cierre             | `fechaCierre`        | date     | Sí          | Anexo02 > SCR-010 > FLD-010-07       |
| Favorabilidad               | `favorabilidad`      | select   | Sí          | Anexo02 > SCR-010 > FLD-010-08       |
| Aceptación                  | `aceptacion`         | select   | Sí          | Anexo02 > SCR-010 > FLD-010-09       |
| Marcación                   | `marcacion`          | select   | Sí          | Anexo02 > SCR-010 > FLD-010-10       |
| Queja Exprés                | `quejaExpres`        | select   | Sí          | Anexo02 > SCR-010 > FLD-010-11       |

### Sección 3 — Adjunto Respuesta Final (SEC-033)

| Campo UI                          | Variable                | Tipo     | Obligatorio | Fuente                          |
|-----------------------------------|-------------------------|----------|-------------|---------------------------------|
| ¿Se adjunta PDF?                  | `adjuntoRespuestaFinal` | radio    | Sí          | Anexo02 > SCR-010 > FLD-010-12  |
| PDF Respuesta Final               | `pdfRespuestaFinal`     | file     | Condicional | Anexo02 > SCR-010 > FLD-010-13  |

### Sección 4 — Datos de Fraude (SEC-034, condicional)

| Campo UI                    | Variable          | Tipo   | Obligatorio | Fuente                          |
|-----------------------------|-------------------|--------|-------------|---------------------------------|
| ¿Relacionada con fraude?    | `relacionadaFraude` | radio  | No          | Anexo02 > SCR-010 > FLD-010-14  |
| Tipo de Fraude              | `tipoFraude`      | text   | Condicional | Anexo02 > SCR-010 > FLD-010-15  |
| Monto Reclamado (COP)       | `montoReclamado`  | text   | Condicional | Anexo02 > SCR-010 > FLD-010-16  |
| Monto Reconocido (COP)      | `montoReconocido` | text   | No          | Anexo02 > SCR-010 > FLD-010-17  |

---

## 5. Validaciones Implementadas

| Validación                             | Comportamiento implementado                                                                 | Fuente                         |
|----------------------------------------|---------------------------------------------------------------------------------------------|--------------------------------|
| RUL-010-01: fechas coinciden           | `fechaActualizacion === fechaCierre`; si no, muestra `ZrAlert` negativo y bloquea envío    | Anexo02 > SCR-010 > RUL-010-01 |
| RUL-010-02: nomenclatura PDF           | Regex `/^[^_]+_[^_]+_RESP_FINAL_SFC_\d+\.pdf$/i`; helper verde/rojo bajo el input         | Anexo02 > SCR-010 > RUL-010-02 |
| RUL-010-03: envío habilitado           | `puedeEnviar = fechasCoinciden && pdfValido && todosCompletos`; botón `disabled` si false  | Anexo02 > SCR-010 > RUL-010-03 |
| Campos obligatorios Sec. 2             | `rules={{ required: 'Campo requerido' }}` en todos los campos de SEC-032                   | Anexo02 > SCR-010 > 03_Campos  |
| Adjunto PDF obligatorio si `SI`        | `adjuntoRespuestaFinal === 'SI'` muestra el file input; `pdfRespuestaFinal` incluido en `puedeEnviar` | Inferido de RUL-010-02 |
| Datos fraude obligatorios si `SI`      | `tipoFraude` y `montoReclamado` con `required` cuando `relacionadaFraude === 'SI'`         | Anexo02 > SCR-010 > FLD-010-15/16 |
| Máximo `codigoSFC`                     | `maxLength: 100`                                                                            | Suposición (no en insumo)      |
| Formato montos                         | `pattern: /^\d+(\.\d{1,2})?$/` — solo números con decimales opcionales                    | Suposición                     |

---

## 6. Mensajes de Error

| Mensaje                                                                               | Condición                                   | Implementación          | Fuente                         |
|---------------------------------------------------------------------------------------|---------------------------------------------|-------------------------|--------------------------------|
| "La Fecha de Actualización debe coincidir con la Fecha de Cierre (RUL-010-01)"       | `fechaActualizacion !== fechaCierre`         | `ZrAlert config="negative"` | Anexo02 > SCR-010 > MSG-010-01 |
| "✗ Nomenclatura inválida. Formato esperado: ENTIDAD_NRO_RESP_FINAL_SFC_NNNNN.pdf"   | PDF adjunto con nombre inválido             | `.cierre-m3--validacion-error` helper | Anexo02 > SCR-010 > MSG-010-02 |
| "✓ Nomenclatura correcta: {nombre.pdf}"                                               | PDF adjunto con nombre válido               | `.cierre-m3--validacion-ok` helper | Inferido               |
| "Envío rechazado por SFC. Revise el error indicado…"                                  | `estadoCierreM3 === 'Rechazado (400)'`      | `ZrAlert config="negative"` | Anexo02 > SCR-010 > MSG-010-03 |
| "Campo requerido"                                                                     | Campos obligatorios vacíos al submit        | `ZdsField error={err(...)}` | react-hook-form              |

---

## 7. Reglas de Negocio

| Regla     | Implementación                                                                                                      | Fuente                         |
|-----------|---------------------------------------------------------------------------------------------------------------------|--------------------------------|
| RUL-010-01 | `const fechasCoinciden = !w.fechaActualizacion \|\| !w.fechaCierre \|\| w.fechaActualizacion === w.fechaCierre`   | Anexo02 > SCR-010 > 05_Reglas  |
| RUL-010-02 | `const pdfValido = !w.pdfRespuestaFinal \|\| REGEX_NOMENCLATURA_PDF.test(w.pdfRespuestaFinal)`                    | Anexo02 > SCR-010 > 05_Reglas  |
| RUL-010-03 | `const puedeEnviar = fechasCoinciden && pdfValido && todosCompletos`; botón `disabled={!puedeEnviar}`             | Anexo02 > SCR-010 > 05_Reglas  |

---

## 8. Comportamientos de UI

| Comportamiento                                    | Implementación                                                              | Fuente                       |
|---------------------------------------------------|-----------------------------------------------------------------------------|------------------------------|
| Sección 1 solo lectura                            | `SeccionEstadoCierre` muestra badges y texto, sin inputs editables          | Anexo02 > SCR-010 > SEC-031  |
| Estado del envío con badge de color               | `STATUS_CONFIG` en `SeccionEstadoCierre.tsx` con inline style               | Anexo02 > SCR-010 > FLD-010-01 |
| Error SFC visible en panel rojo                   | `.ultimo-error-panel` / `.ultimo-error-texto`; solo renderiza si `ultimoError` | Anexo02 > SCR-010 > FLD-010-03 |
| Botón cambia etiqueta si rechazado                | `esRechazado ? 'Reenviar Cierre (corrección) ▶' : 'Enviar a SmartSupervision ▶'` | Anexo02 > SCR-010 > ACT-010-01 |
| File input aparece solo si `adjuntoRespuestaFinal === 'SI'` | render condicional en JSX                                   | Anexo02 > SCR-010 > SEC-033  |
| Sección fraude aparece siempre, campos condicionales | `relacionadaFraude === 'SI'` muestra `tipoFraude`, `montoReclamado`, `montoReconocido` | Anexo02 > SCR-010 > SEC-034 |
| Upload de archivo antes de `completeTask`         | `fileRegistry` + `pm4.post(/requests/{id}/files)` en `onSubmit`             | CLAUDE.md — patrón subida     |
| Pre-población desde PM4                           | `reset(task.data as Partial<CierreM3FormData>)` en `useEffect`              | CLAUDE.md — flujo datos       |

---

## 9. Dependencias Entre Campos

| Campo Origen          | Campo Dependiente              | Comportamiento                                               | Fuente                          |
|-----------------------|--------------------------------|--------------------------------------------------------------|---------------------------------|
| `fechaActualizacion`  | `fechaCierre`                  | Deben ser iguales (RUL-010-01); alerta si difieren           | Anexo02 > SCR-010 > 05_Reglas  |
| `adjuntoRespuestaFinal` | `pdfRespuestaFinal` (file)   | File input visible solo si valor = `'SI'`                    | Anexo02 > SCR-010 > SEC-033    |
| `relacionadaFraude`   | `tipoFraude`, `montoReclamado`, `montoReconocido` | Campos visibles y `tipoFraude`/`montoReclamado` requeridos si = `'SI'` | Anexo02 > SCR-010 > SEC-034 |
| `estadoCierreM3`      | Botón de envío (label)         | Label cambia a "Reenviar…" cuando = `'Rechazado (400)'`      | Anexo02 > SCR-010 > ACT-010-01 |
| `estadoCierreM3`      | Alerta estado rechazado        | `ZrAlert` negativo visible cuando = `'Rechazado (400)'`      | Anexo02 > SCR-010 > MSG-010-03 |

---

## 10. Suposiciones Realizadas

1. **Regex nomenclatura PDF**: `/^[^_]+_[^_]+_RESP_FINAL_SFC_\d+\.pdf$/i` derivada del patrón textual de los insumos (`ENTIDAD_NRO_RESP_FINAL_SFC_NNNNN.pdf`). No se proporcionó regex exacta en los insumos.
2. **Catálogos de `estadoQueja`**: `CERRADA_CF`, `CERRADA_ENTIDAD`, `DESISTIDA`, `RECTIFICADA` tomados de los valores encontrados en `07_Catalogs` de Anexo02. Marcados como *Pendiente TI* — se deben confirmar con el equipo de TI Zurich.
3. **Catálogos de `favorabilidad`, `aceptacion`, `marcacion`, `quejaExpres`**: implementados como listas estáticas numeradas según los valores vistos en el Anexo02. Deben confirmarse como catálogos fijos o dinámicos.
4. **`maxLength: 100` para `codigoSFC`**: no especificado en insumos; suposición conservadora.
5. **Validación de montos**: regex `^\d+(\.\d{1,2})?$` — formato numérico básico, no definido en insumos.
6. **Sección 4 siempre visible**: los insumos indican que los campos de fraude son opcionales; se optó por mostrar la sección siempre y activar campos solo si `relacionadaFraude === 'SI'`.
7. **`adjuntoRespuestaFinal` requerido en `puedeEnviar`**: si el usuario elige `'NO'`, se considera informado y válido. El envío puede continuar sin PDF adjunto.
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
- `maxLength` de `codigoSFC`
- Validación de formato de montos
- Texto del helper de validación OK ("✓ Nomenclatura correcta…")
