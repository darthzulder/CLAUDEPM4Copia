# Documentación Funcional — Formulario Superintendencia

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-009** / PAN-09 — Formulario Superintendencia (F.1000-166 / Formato 411) |
| Tipo | Formulario regulatorio SFC |
| Tarea BPMN | **SP2-T07** — Diligenciar formulario Superintendencia |
| Proceso | SP2 — Gestionar Respuesta Interna y Revisión SAC |
| Rol responsable | Analista SAC (VER+EDITAR) · Líder SAC (VER) · Control SLA (INFORMADO) |
| Evento de apertura | Respuesta aprobada + PDF generado (SP2-T06) |
| Acción de cierre | Guardar Formulario → habilita SP3 (PAN-10) |
| Slug / `?screen=` | `COL_QD_SCR-009_Formulario_Superintendencia` |
| Archivos de implementación | `FormularioSuperintendencia.tsx`, `SeccionFraudeAnexos.tsx`, `variables.ts` |
| Versión | 1.0 — 2026-06-30 |

---

## 2. Resumen

Formulario regulatorio que diligencia el Analista SAC tras aprobarse la respuesta y generarse el
PDF. Precarga (solo lectura) los datos de clasificación del Momento 1 y captura los campos SFC
obligatorios de condición del consumidor y de la queja (12 selects de catálogo), los datos de
fraude CE-019/2024 (condicionales si la queja está relacionada con fraude) y los indicadores de
anexos. Al guardarlo completo habilita el subproceso SP3 de cierre regulatorio.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02 (índice .md) | `screens/SCR-009.md` | Campos (FLD-140..166), acciones (ACT-009-*), reglas (RUL-009-*), mensajes (MSG-009-*), permisos, trazabilidad |
| Anexo02 (índice .md) | `masters/02_Secciones.md` | Secciones SEC-028..032 (incl. S4 condicional) |
| Anexo02 (índice .md) | `masters/06_Mensajes.md` | Textos MSG-009-01..04 |
| Anexo02 (índice .md) | `masters/07_Catalogs.md` | CAT-SEXO, LGBTIQ, COND-ESP, PROD-DIGITAL, ESTADO-QUEJA, FAVORAB, ACEPTACION, RECTIF, DESIST, TUTELA, MARCACION, EXPRES, TIPO-FRAUDE, MOD-FRAUDE (estado/ejemplos) |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` / `2. Directrices` | Definición y RACI de SP2-T07 |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `05/06 Variables` | SP2-T07 es tarea de Usuario → sin variables canónicas |

---

## 4. Campos Implementados

### S1 — Datos Precargados M1 (SEC-028, solo lectura — RUL-009-02)

| Campo (UI) | Variable | Tipo | Fuente |
|---|---|---|---|
| Código SFC | `qd_codigoSFC` | `ZdsInput` readOnly | FLD-140 |
| Canal (precargado M1) | `qd_canal` | `ZdsInput` readOnly | FLD-141 |
| Producto (precargado M1) | `qd_productoSFC` | `ZdsInput` readOnly | FLD-142 |
| Motivo (precargado M1) | `qd_motivoSFC` | `ZdsInput` readOnly | FLD-143 |
| Admisión (precargado M1) | `qd_admision` | `ZdsInput` readOnly | FLD-144 |
| Ente de Control (precargado M1) | `qd_enteControl` | `ZdsInput` readOnly | FLD-145 |

### S2 — Datos del Consumidor — Campos SFC (SEC-029, obligatorios)

| Campo (UI) | Variable | Catálogo | Fuente |
|---|---|---|---|
| Sexo | `qd_sexo` | CAT-SEXO | FLD-146 |
| LGBTIQ+ | `qd_lgbtiq` | CAT-LGBTIQ ⚠ | FLD-147 |
| Condición Especial | `qd_condicionEspecial` | CAT-COND-ESP | FLD-148 |
| Producto Digital | `qd_productoDigital` | CAT-PROD-DIGITAL | FLD-149 |

### S3 — Condición de la Queja (SEC-030, obligatorios)

| Campo (UI) | Variable | Catálogo | Fuente |
|---|---|---|---|
| Estado de la Queja o Reclamo | `qd_estadoQueja` | CAT-ESTADO-QUEJA | FLD-150 |
| Favorabilidad | `qd_favorabilidad` | CAT-FAVORAB | FLD-151 |
| Aceptación | `qd_aceptacion` | CAT-ACEPTACION | FLD-152 |
| Rectificación | `qd_rectificacion` | CAT-RECTIF | FLD-153 |
| Desistimiento | `qd_desistimiento` | CAT-DESIST | FLD-154 |
| Tutela | `qd_tutela` | CAT-TUTELA | FLD-155 |
| Marcación | `qd_marcacion` | CAT-MARCACION | FLD-156 |
| Queja Exprés | `qd_quejaExpres` | CAT-EXPRES | FLD-157 |

> Todos los anteriores: `ZdsSelect` con `rules.required`.

### S4 — Datos de Fraude CE-019-2024 (SEC-031, condicional) — `SeccionFraudeAnexos.tsx`

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| ¿Relacionada con Fraude? | `qd_relacionadaFraude` | `ZdsRadio` inline (SI/NO) | **Sí** | FLD-158 |
| Tipo de Fraude | `qd_tipoFraude` | `ZdsSelect` (CAT-TIPO-FRAUDE) | Cond. (si fraude) | FLD-159 |
| Modalidad de Fraude | `qd_modalidadFraude` | `ZdsSelect` (CAT-MOD-FRAUDE) | Cond. | FLD-160 |
| Monto Reclamado (COP) | `qd_montoReclamado` | `ZdsInput` (dígitos) | Cond. | FLD-161 |
| Monto Reconocido (COP) | `qd_montoReconocido` | `ZdsInput` (dígitos) | Cond. | FLD-162 |

### S5 — Anexos del Formulario (SEC-032)

| Campo (UI) | Variable | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|
| ¿Incluye Anexos a la Queja? | `qd_incluyeAnexosQueja` | `ZdsRadio` inline | **Sí** | FLD-163 |
| ¿Incluye Adjunto Respuesta Final? | `qd_incluyeAdjuntoRespuesta` | `ZdsRadio` inline | **Sí** | FLD-164 |
| PDF Respuesta Final (generado) | `qd_pdfRespuestaFinal` | `ZdsInput` readOnly + `ZrButton` descarga | No | FLD-165 |
| Prórroga (días, si aplica) | `qd_diasProrroga` | `ZdsInput` (dígitos) | No | FLD-166 |

### Metadato de flujo (no visible)

| Campo | Variable | Fuente |
|---|---|---|
| Acción/decisión BPMN | `qd_accion` (`GUARDAR` \| `GUARDAR_BORRADOR`) | Inferido de ACT-009-01/02 (§10) |

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Todos los campos SFC obligatorios completos | `sfcCompletos` (12 selects) + `anexosCompletos`; botón "Guardar Formulario" deshabilitado si falta alguno; alerta MSG-009-02 | RUL-009-03 · FLD-146..157, 163/164 |
| Campos de fraude obligatorios si aplica | `fraudeCompleto`; `rules.required` condicional en tipo/modalidad/montos cuando `relacionadaFraude='SI'` | RUL-009-01 · MSG-009-01 |
| Montos y prórroga solo dígitos | `pattern: /^\d+$/` en montos y días | FLD-161/162/166 (tipo Número/Moneda) |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-009-01 Campos fraude obligatorios | `relacionadaFraude='SI'` | `ZrAlert config="alert"` en S4 | 06_Mensajes > MSG-009-01 |
| MSG-009-02 Campos SFC incompletos | Falta algún obligatorio | `ZrAlert config="info"` + "Guardar" disabled | 06_Mensajes > MSG-009-02 |
| MSG-009-03 Formulario guardado | Tras guardar | **No en UI** — lo emite el BPM tras `completeTask` | 06_Mensajes > MSG-009-03 |
| MSG-009-04 LGBTIQ+ pendiente | Siempre (advertencia) | `ZrAlert config="info"` en S2 | 06_Mensajes > MSG-009-04 |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| RUL-009-01 (🔴) — fraude visible/obligatorio si `relacionadaFraude=Sí` | `esFraude` muestra campos + `reqFraude` los hace requeridos | SCR-009 > RUL-009-01 |
| RUL-009-02 (info) — precargar M1 no editable | S1 con `readOnly` | SCR-009 > RUL-009-02 |
| RUL-009-03 (🔴) — bloquear guardar si falta obligatorio SFC | `puedeGuardar` deshabilita el botón + alerta MSG-009-02 | SCR-009 > RUL-009-03 |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Precarga M1 solo lectura | `ZdsInput readOnly` en S1 | SEC-028 · RUL-009-02 |
| 12 selects de catálogo SFC | `ZdsSelect` en grids `cols-2`/`cols-3` | SEC-029/030 |
| Sección de fraude condicional | render por `esFraude` | SEC-031 · RUL-009-01 |
| Descarga del PDF generado | `ZrButton icon="download:line"` (abre `qd_pdfRespuestaFinal`) | FLD-165 |
| Aviso LGBTIQ+ pendiente | `ZrAlert config="info"` permanente | MSG-009-04 |
| Estados loading/error/submitting | `ZrLoader`, `ZrAlert`, botones `loading/disabled` | CLAUDE.md |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_relacionadaFraude` | tipo/modalidad/montos de fraude | Muestra y hace obligatorios los campos de fraude si = Sí | RUL-009-01 |
| 12 campos SFC + anexos | Botón "Guardar Formulario" | Habilita guardar solo si todos están completos | RUL-009-03 |
| `qd_pdfRespuestaFinal` | Botón "Descargar PDF" | Se habilita solo si hay PDF generado | FLD-165 |

---

## 10. Suposiciones Realizadas

- **Slug normalizado** a `COL_QD_SCR-009_Formulario_Superintendencia` (con código SCR).
- **Catálogos SFC como OPTIONS estáticas placeholder.** Todos los `CAT-*` de esta pantalla están
  "Pendiente TI" en 07_Catalogs. Se implementaron con los valores de ejemplo del insumo; los que no
  tenían ejemplos (CAT-ACEPTACION, CAT-RECTIF, CAT-DESIST, CAT-MARCACION) usan placeholder Sí/No.
  Deben reemplazarse por los catálogos oficiales / `useCollection` cuando se entreguen.
- **CAT-LGBTIQ ("PENDIENTE CRÍTICO")**: placeholder Sí/No/No informa + advertencia permanente
  MSG-009-04. No transmitir a SFC sin confirmar con TI.
- **Montos y prórroga como `ZdsInput` de texto con `pattern` de dígitos**: la fachada no expone
  `inputType="number"` (solo text/email/tel). Se validan como enteros.
- **PDF (FLD-165)**: se muestra el nombre en `ZdsInput readOnly` + botón que abre la URL/blob del
  PDF. El endpoint real de descarga se conectará cuando SP2-T06 entregue la referencia.
- **`qd_accion`** (metadato): no es un FLD; se deriva del botón presionado (ACT-009-01/02).
- **MSG-009-03** (éxito) lo emite el BPM tras `completeTask`; no se renderiza en la pantalla.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura | Observación |
|---|---|---|
| Campos (FLD-140..166) | 27/27 (100%) | Todos implementados |
| Secciones (SEC-028..032) | 5/5 (100%) | S1-S5 (S4 condicional) |
| Acciones (ACT-009-01/02) | 2/2 (100%) | Guardar Formulario, Guardar Borrador |
| Reglas (RUL-009-01/02/03) | 3/3 (100%) | Fraude condicional, precarga M1, bloqueo SFC |
| Mensajes (MSG-009-01..04) | 3/4 en UI | MSG-009-03 lo emite el BPM |
| Catálogos SFC (14) | 14/14 como placeholder | Todos "Pendiente TI" / LGBTIQ crítico |

**Elementos inferidos:** prefijo `qd_*`, metadato `qd_accion`, catálogos estáticos placeholder
(incl. los sin ejemplos), montos como texto con `pattern`, descarga de PDF por URL, orden interno
de S4/S5 en un archivo de sección separado.
