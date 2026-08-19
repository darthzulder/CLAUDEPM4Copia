# Documentación Funcional — Revisión Error Técnico API

> **Port a Angular 21 (Fase 5, pantalla 2 de 12).** La trazabilidad funcional de las §1–§11 es la
> misma que la de la versión React y se conserva **textual**: los FLD/RUL/MSG/ACT son contrato con el
> Anexo02, no con el framework, y reescribirlos al portar sería la forma más fácil de perder la
> auditoría del lado del negocio. Lo que sí cambió —los archivos, el mapeo a Reactive Forms y las
> tres trampas que el port destapó— está en la **§12**, al final.
>
> Documento de origen:
> `frontend/src/screens/atencion-cliente/quejas-directas/COL_QD_SCR-004_Revision_Error_Tecnico_API/DOCUMENTACION_COL_QD_SCR-004_Revision_Error_Tecnico_API.md`.

## 1. Encabezado

| Atributo | Valor |
|---|---|
| Pantalla | **SCR-004** / **PAN-04** — Revisión Error Técnico API |
| Tarea BPMN | **SP1-T06** — *Revisar y corregir error técnico API* (tipo **Usuario**) |
| Proceso | Gestión de Quejas Directas · `ACZ-QD-001` |
| Subproceso | **SP1** — Validar y Radicar ante SmartSupervision |
| Rol responsable | **Analista Técnico** (RESPONSABLE) |
| Versión insumos | Anexo02 v3.0 · Matrices v3.0 · Anexo03 v2.0 |
| Slug / carpeta | `COL_QD_SCR-004_Revision_Error_Tecnico_API` |
| Archivos de implementación | `revision-error-tecnico-api.ts` (374 líneas), `revision-error-tecnico-api.html` (216), `revision-error-tecnico-api.spec.ts` (14 casos) · registro en `app/pantallas.ts` **y** `app/pantallas.spec.ts` (config centralizada en `screens/.../fields/`) |

---

## 2. Resumen

Pantalla de **análisis técnico** a la que el BPM escala un caso cuando la integración con la
API intermediaria de **SmartSupervision** falla por un **error técnico** (autenticación, timeout,
servidor/red, estructura de payload) tras **múltiples intentos** (`> 3`, marcado por SP1-T04).

El Analista Técnico:
1. **Revisa** el log del error (código HTTP, tipo, mensaje técnico, endpoint, payload, intento) — **solo lectura**.
2. **Registra** la causa raíz y la corrección aplicada, e indica si requiere ajuste de payload.
3. **Autoriza el reenvío** → reejecuta **SP1-T02** (`momento='M2'`, intento `N+1`) con el payload corregido.

Encaja en el flujo: `SP1-T04 (clasifica error como técnico) → SP1-T06 (esta pantalla) → SP1-T02 (reenvío)`,
con la compuerta convergente *¿Error técnico resuelto?*.
Fuente: `Anexo02 > 10_Trazabilidad_BPMN > SCR-004 (fila 9)`.

---

## 3. Archivos de Insumo Analizados

| Archivo | Hoja | Descripción de uso |
|---|---|---|
| Anexo02_Mockups_TOBE_QuejaDirectas_v3_2.xlsx | `SCR-004` | Historia de usuario, campos (FLD-050…058), acciones (ACT-004-01/02/03), regla crítica RUL-004-01. **Fuente principal del layout.** |
| Anexo02 | `01_Pantallas` | Inventario maestro PAN-04: tarea SP1-T06, rol, historia y criterio de aceptación (fila 9). |
| Anexo02 | `02_Secciones` | SEC-011 (S1 Detalle del Error Técnico) y SEC-012 (S2 Registro de Corrección Técnica), ambas siempre visibles. |
| Anexo02 | `03_Campos` | Diccionario maestro FLD-050…058: nombre de variable lógica, tipo de dato, obligatoriedad, control UI, fuente (filas 43-51). |
| Anexo02 | `04_Acciones` | ACT-004-01 (Autorizar Reenvío), ACT-004-02 (Escalar a Proveedor), ACT-004-03 (Ver Log Completo). |
| Anexo02 | `05_Reglas` | RUL-004-01 — restricción de bloqueo de autorización. |
| Anexo02 | `06_Mensajes` | MSG-004-01 (error campos vacíos) y MSG-004-02 (éxito reenvío autorizado). |
| Anexo02 | `07_Catalogs` | Revisado — **SCR-004 no referencia catálogos CAT-***. |
| Anexo02 | `08_Permisos` | PER de SCR-004: solo Analista Técnico VER+EDITAR; demás roles INFORMADO (fila 9). |
| Anexo02 | `10_Trazabilidad_BPMN` | Mapeo SCR-004 → SP1-T06, evento de apertura, cierre (Autorizar→SP1-T02), datos in/out (fila 9). |
| Matrices_Maduracion_TO-BE_QuejaDirectas_v3.0.xlsx | `1. Tareas` | SP1-T06 (Usuario) y SP1-T02 (Servicio): descripción + RACI (filas 22, 26). |
| Matrices | `2. Directrices` | 🔵 Regla de negocio HTTP 401 (renovar credenciales) y 🟢 lineamiento de catálogos (filas 34-35). |
| Matrices | `5. Documentos` | Payload M1/M2 como documento de salida de SP1-T02 (fila 6). |
| Anexo03_EspecTecnica_TareasAutomatizadas_TOBE_v2_0.xlsx | `01_Inventario` | SP1-T02 serviceTask que invoca la API y registra el log (fila 18). |
| Anexo03 | `05_Variables_Entrada` | Variables de entrada de SP1-T02 / SP1-T04 (endpointAPI, numeroIntento, payloadEnviado…). |
| Anexo03 | `06_Variables_Salida` | Variables de salida que alimentan esta pantalla: `codigoHTTP_M1M2`, `mensajeErrorAPI`, `tipoError_M1M2`, `numeroIntento`. |
| Anexo03 | `08_CA_Errores` | Clasificación de error de SP1-T02: HTTP 401→técnico→PAN-04; 5xx/timeout→técnico→PAN-04; 3+ intentos→escalar (fila 17). |

---

## 4. Campos Implementados

### S1 — Detalle del Error Técnico *(solo lectura — `SEC-011`, siempre visible)*

| Campo (UI) | Variable (implementada) | Variable lógica insumo | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|---|
| Código HTTP | `qd_strHttpCode` | `codigoHTTP` | Texto / readOnly | No | `Anexo02 > SCR-004 > FLD-050 (03_Campos fila 43)` · alim. `Anexo03 > 06_Variables_Salida > codigoHTTP_M1M2 (fila 48)` |
| Tipo de Error | `qd_strErrorType` | `tipoError` | Texto / readOnly | No | `Anexo02 > SCR-004 > FLD-051 (fila 44)` · alim. `Anexo03 > 06_Variables_Salida > tipoError_M1M2 (fila 53/59)` |
| Número de Intento Acumulado | `qd_strAttemptNum` | `numeroIntento` | Texto (Número) / readOnly | No | `Anexo02 > SCR-004 > FLD-055 (fila 48)` · alim. `Anexo03 > numeroIntento (06 fila 54)` |
| Endpoint Invocado | `qd_strEndpointCalled` | `endpointInvocado` | Texto / readOnly | No | `Anexo02 > SCR-004 > FLD-053 (fila 46)` · alim. `Anexo03 > endpointAPI (05 fila 84)` |
| Mensaje Técnico de la API | `qd_strApiTechMessage` | `mensajeTecnicoAPI` | Área de texto / readOnly | No | `Anexo02 > SCR-004 > FLD-052 (fila 45)` · alim. `Anexo03 > mensajeErrorAPI (06 fila 51)` · **mismo valor que `qd_SSHTTPSP3_message`** |
| Log Completo *(solo en el modal ACT-004-03)* | `qd_strCompleteLogAPI` | — | Área de texto / readOnly | No | **Añadido** — lo emite el script de Momento 3 (`.claude/solo momento 3`); ver §10.9 |
| Payload Enviado (JSON) | `qd_strPayloadSent` | `payloadEnviado` | Área de texto (editable si requiere ajuste) | No | `Anexo02 > SCR-004 > FLD-054 (fila 47)` · alim. `Anexo03 > payloadEnviado (05 fila 95)` |

### S2 — Registro de Corrección Técnica *(editable — `SEC-012`, siempre visible)*

| Campo (UI) | Variable (implementada) | Variable lógica insumo | Tipo | Obligatorio | Fuente |
|---|---|---|---|---|---|
| Causa Raíz Identificada | `qd_strRootCause` | `causaRaiz` | Área de texto | **Sí** | `Anexo02 > SCR-004 > FLD-056 (03_Campos fila 49)` |
| Corrección Aplicada | `qd_strCorrectionApplied` | `correccionAplicada` | Área de texto | **Sí** | `Anexo02 > SCR-004 > FLD-057 (fila 50)` |
| ¿Requiere ajuste en payload? | `qd_strPayloadAdjustNeeded` | `requiereAjustePayload` | Radio Sí/No | **Sí** | `Anexo02 > SCR-004 > FLD-058 (fila 51)` |

### Metadato de flujo (no visible)

| Campo | Variable | Uso | Fuente |
|---|---|---|---|
| Acción seleccionada | `qd_strAction` (`AUTORIZAR_REENVIO`) | Única acción de cierre de la pantalla; ACT-004-02 se retiró (ver §10.10). | `Anexo02 > SCR-004 > 04_Acciones` (inferido — ver §10) |

> **Nota de nomenclatura:** los `data_name` definitivos de PM4 aún no se entregan (CLAUDE.md). Se usan
> nombres con prefijo `qd_` (unificado con las pantallas QD hermanas; antes `et_`, Error Técnico). El mapeo a la **variable lógica** del
> diccionario (`03_Campos`) queda documentado arriba para la homologación posterior.

---

## 5. Validaciones Implementadas

| Validación | Comportamiento implementado | Fuente |
|---|---|---|
| Causa Raíz obligatoria y no vacía | `Validators.required` en la definición del `FormGroup` + se exige (`trim()`) para habilitar "Autorizar Reenvío". | `Anexo02 > SCR-004 > FLD-056 (Validación "Campo no vacío")` + `RUL-004-01` |
| Corrección Aplicada obligatoria y no vacía | `Validators.required` + `trim()` para habilitar la autorización. | `Anexo02 > SCR-004 > FLD-057` + `RUL-004-01` |
| ¿Requiere ajuste en payload? obligatorio | `Validators.required`; valor por defecto `NO`. | `Anexo02 > SCR-004 > FLD-058` |
| Longitud máxima causa/corrección | `Validators.maxLength(2000)` con mensaje propio **más** `[maxLength]="2000"` en el `zds-textarea`, que es el contador visual del DS (`9/2000`). Son dos mecanismos distintos: el validador decide la validez del control, el input solo pinta el contador — ver el comentario de `zds-textarea.ts`. | **Suposición** (ver §10) — no especificada en insumos |
| Campos de S1 solo lectura | `[readOnly]="true"` en todos los FLD-050…055. | `Anexo02 > SCR-004 > 03_Campos` (columna Control UI = Label/Solo lectura) |
| Payload editado debe ser JSON de objeto válido | Con FLD-058 = `SI`, `blnPayloadJsonOk()` hace `JSON.parse` del textarea: si falla, o si el resultado **no es un objeto** (`null`, array, escalar), se bloquea "Autorizar Reenvío" y se muestra alerta negativa. | **Derivada de la implementación** — el script de M3 descarta un JSON inválido y reconstruye el body, así que la pantalla evita la edición silenciosamente perdida (ver §10.3) |
| Payload vacío ⇒ se envía el generado | Si `qd_strPayloadSent` está vacío (caso nuevo, o limpiado tras un cierre 2xx), no hay nada que comparar y viaja el body reconstruido. | Implementación del script |

---

## 6. Mensajes de Error / Sistema

| Mensaje | Condición | Implementación | Fuente |
|---|---|---|---|
| MSG-004-01 (Error) — *"Debe registrar la causa raíz y la corrección aplicada antes de autorizar el reenvío."* | `causaRaiz` o `correccionAplicada` vacíos | `za-alert config="info"` permanente bajo S2 + botón "Autorizar Reenvío" **deshabilitado**. | `Anexo02 > 06_Mensajes > MSG-004-01` · `05_Reglas > RUL-004-01` |
| MSG-004-02 (Éxito) — *"Corrección técnica registrada. Reenvío autorizado. Ejecutando payload (Intento [N+1])."* | Al autorizar correctamente | **No implementado en esta pantalla** — el mensaje de éxito y el avance lo gestiona el BPM tras `completarTarea` (la pantalla se cierra/deriva). | `Anexo02 > 06_Mensajes > MSG-004-02` |

---

## 7. Reglas de Negocio

| Regla | Implementación | Fuente |
|---|---|---|
| **RUL-004-01** (🔴 BLOQUEA) — causaRaiz/correccionAplicada vacíos ⇒ bloquear autorización (no ejecuta SP1-T02) | `[disabled]` del botón por `blnPuedeAutorizar()`, **y** el corte real dentro de `autorizar()`. Las dos cosas son necesarias: un botón deshabilitado del DS igual dispara su handler (ver §12.3). | `Anexo02 > 05_Reglas > RUL-004-01` |
| HTTP 401 ⇒ renovar credenciales antes del reenvío (🔵 Regla de Negocio) | **Parcial / no automatizado:** el tipo de error y el código HTTP se muestran en S1 para que el analista actúe; la renovación de credenciales es backend. | `Matrices > 2. Directrices fila 34` |
| Usar catálogos/valores estandarizados para minimizar errores de formato (🟢 Lineamiento) | Informativo — sin campo de catálogo en esta pantalla. | `Matrices > 2. Directrices fila 35` |
| Cada intento se registra en el log (caso, intento, HTTP, mensaje, campos) (🟠 Control de SP1-T02) | Fuera de alcance UI — lo registra el servicio SP1-T02/SP1-T04; la pantalla solo lo consume. | `Matrices > 2. Directrices fila 29` · `Anexo03 > 01_Inventario fila 18` |
| Escalamiento a Analista Técnico tras 3+ intentos | Esta pantalla **es** el destino del escalamiento (`escalarATecnico=true`). | `Anexo03 > 08_CA_Errores fila 17` |
| **Reintento por paso en Momento 3** — el M3 hace anexo + cierre; el reenvío no debe repetir un paso ya exitoso | El script escribe `qd_blnM3AttachDone` y `qd_strM3FailedStep` en el caso: si el anexo ya subió, el reintento va **directo al cierre** y el detalle técnico que llena esta pantalla corresponde al paso que falló (anexo o cierre). Tras un cierre 2xx el script limpia ambas y pone `qd_strPayloadAdjustNeeded = 'NO'`. | Implementación del script de Momento 3 (`.claude/solo momento 3`) |

---

## 8. Comportamientos de UI

| Comportamiento | Implementación | Fuente |
|---|---|---|
| Sección S1 con identidad de "error" | `app-form-section color="var(--z-red)"` + `za-alert config="negative"` con nº de intento. | Inferido del tono de error (ver §10) |
| Payload editable solo si "Requiere ajuste = Sí" | **El bloqueo vive en el CONTROL, no en la vista:** `sincronizarEdicionPayload()` hace `enable()`/`disable()` según FLD-058 (ver §12.2). **El script compara `qd_strPayloadSent` con el body que genera desde los campos del caso: si difiere, firma y envía el de la variable** (`sfcPayloadEditado` + `sfcMismoJson`), y toma de él el `codigo_queja` del path para que cuerpo y ruta coincidan. El flag ya no es requisito para que se use — solo habilita la edición. | Deriva de FLD-058 + criterio "reenvío del **payload corregido**" (`Anexo02 > SCR-004 > Criterio de Aceptación`) |
| JSON inválido bloquea la autorización | Alerta negativa + botón deshabilitado mientras `blnPayloadJsonOk()` sea falso. | Implementación (ver §5) |
| "Ver Log Completo" (ACT-004-03, Link) | `lib-button-z [type]="'link'"` en el slot `[action]` del header de S1 abre un `lib-modal-z tamanio="l"` con **un único campo**: "Log Completo" (`qd_strCompleteLogAPI`, solo lectura). | `Anexo02 > SCR-004 > 04_Acciones > ACT-004-03` |
| "Autorizar Reenvío" (ACT-004-01, Primaria) | `lib-button-z [type]="'positive'"`, deshabilitado por RUL-004-01 y por JSON inválido; `completarTarea` con `qd_strAction='AUTORIZAR_REENVIO'`. **Única acción de la pantalla.** | `Anexo02 > SCR-004 > ACT-004-01` |
| ~~"Escalar a Proveedor" (ACT-004-02)~~ | **Retirado** por decisión funcional (§10.10). La pantalla ya no ofrece esa ruta y `qd_strAction` solo puede valer `AUTORIZAR_REENVIO`. | `Anexo02 > SCR-004 > ACT-004-02` (no implementado) |
| Aviso permanente cuando faltan datos | `za-alert config="info"` con el texto de MSG-004-01. | `Anexo02 > 06_Mensajes > MSG-004-01` |
| Prepoblación desde PM4 | `TaskService` → `precargar()` → `form.patchValue({...DEFAULTS, ...dicParche})`. | CLAUDE.md (flujo de datos PM4) |
| S2 no nace en rojo | `mensajeDeError()` devuelve `''` mientras `blnIntentoEnvio()` sea falso: los obligatorios vacíos no se pintan hasta el primer intento de envío. | Criterio de UX del proyecto |

---

## 9. Dependencias Entre Campos

| Campo Origen | Campo Dependiente | Comportamiento | Fuente |
|---|---|---|---|
| `qd_strPayloadAdjustNeeded` = `SI` | `qd_strPayloadSent` | El control pasa de `disabled` a `enabled`, se muestra alerta y el reenvío usa ese JSON. **En ambas direcciones** — volver a `NO` lo deshabilita de nuevo. | FLD-058 + Criterio de Aceptación (`Anexo02 > SCR-004`) |
| `qd_strPayloadSent` (JSON válido) | Botón "Autorizar Reenvío" | Con ajuste marcado, un JSON que no sea **objeto** deshabilita la acción. | Implementación (§5) |
| `qd_strRootCause` + `qd_strCorrectionApplied` (no vacíos) | Botón "Autorizar Reenvío" | Habilita/deshabilita la acción primaria. | `Anexo02 > 05_Reglas > RUL-004-01` |
| `qd_strAttemptNum` | Texto del `za-alert` de S1 | Sufija " — Intento acumulado #N." si hay valor. | Inferido de FLD-055 (ver §10) |

---

## 10. Suposiciones Realizadas

1. **Nombres de variable (`qd_*`).** Los `data_name` de PM4 no se han entregado; se usan nombres
   con prefijo `qd_` (unificado con las pantallas QD hermanas; antes `et_`), mapeados 1:1 a la
   variable lógica de `03_Campos`. Se actualizarán cuando TI entregue el diccionario. *(CLAUDE.md)*
2. **`qd_strAction` (metadato).** El mockup define dos botones de cierre (ACT-004-01/02) pero no un campo
   que distinga la decisión en `task.data`. Se infiere un campo `qd_strAction` para que el BPM sepa qué
   ruta tomar. *(deriva de `04_Acciones`)*
3. **Payload editable con FLD-058 = Sí.** El criterio de aceptación exige "reenvío del **payload
   corregido**"; se interpreta que marcar "¿Requiere ajuste en payload? = Sí" habilita la edición del
   JSON. No está descrito como interacción explícita en el mockup. **Implementado de punta a punta:**
   `qd_strPayloadSent` es la variable del body de cierre; en cada ejecución el script genera el body
   desde los campos y lo compara con la variable — si el **contenido** difiere (la indentación no
   cuenta), envía el de la variable. Si el JSON no es un objeto válido lo descarta y reconstruye
   (fallback defensivo), y la pantalla bloquea la autorización en ese caso para que la edición nunca se
   pierda en silencio. La salida del script informa cuál se usó en `payload_origen`.
   **La variable solo se sobrescribe cuando el paso que falla es el CIERRE:** si falla el anexo, su
   payload es el descriptor del archivo y escribirlo ahí haría que luego se enviara como body de cierre.
4. **`maxLength = 2000`** en causa raíz y corrección: límite razonable no especificado en insumos.
5. **Identidad visual de error** (sección roja + alerta negativa): decisión de UX no dictada por el
   mockup, alineada con la pantalla análoga SCR-003 (`corregir-error-funcional-ss`).
6. **"Ver Log Completo" → modal.** El mockup lo define como acción tipo *Link* sin destino; se
   implementa como modal ancho con un solo campo de solo lectura, `qd_strCompleteLogAPI`, que trae el
   log ya ensamblado por el script (sin inventar un backend de log adicional).
7. **MSG-004-02 (éxito)** no se renderiza en esta pantalla: tras `completarTarea` el control vuelve al
   BPM, que ejecuta SP1-T02 y notifica el avance.
8. ~~**"Escalar a Proveedor" omite la validación de S2**~~ — sin efecto: el botón se retiró (§10.10).
9. **`qd_strCompleteLogAPI` (campo añadido, sin FLD).** El insumo solo prevé `mensajeTecnicoAPI`, pero el
   script de Momento 3 produce dos niveles de detalle: el **mensaje** que devolvió la API (idéntico a
   `qd_SSHTTPSP3_message`, en `qd_strApiTechMessage`) y el **log completo** —paso, endpoint, HTTP, tipo
   clasificado, error de cURL, excepción PM4 y cuerpo crudo truncado a 8 KB— que se guarda aparte para
   alimentar ACT-004-03 sin saturar el textarea de S1.
10. **ACT-004-02 "Escalar a Proveedor" retirado** (decisión del negocio, 30-jul-2026). La pantalla queda
    con una sola salida: autorizar el reenvío. El escalamiento al proveedor, si se necesita, se gestiona
    fuera de esta pantalla. `AccionErrorTecnico` quedó reducido a `'AUTORIZAR_REENVIO'`; SCR-011
    (prórroga) **sí conserva** su botón de escalar con su propio tipo `AccionErrorTecnicoProrroga`.

---

## 11. Cobertura de Trazabilidad

| Categoría | Cobertura estimada | Notas |
|---|---|---|
| Campos (FLD-050…058) | **100 %** (9/9) | Todos implementados con su control y obligatoriedad. |
| Secciones (SEC-011, SEC-012) | **100 %** (2/2) | Ambas siempre visibles. |
| Acciones (ACT-004-01/02/03) | **67 %** (2/3) | Autorizar y Ver Log. ACT-004-02 (Escalar) retirado por decisión funcional — §10.10. |
| Reglas (RUL-004-01) | **100 %** (1/1) | Bloqueo de autorización implementado **y aseverado por mutación** (§12.4). |
| Mensajes (MSG-004-01/02) | **50 %** (1/2) | MSG-004-01 implementado; MSG-004-02 lo gestiona el BPM. |
| Catálogos | **N/A** | SCR-004 no referencia catálogos. |
| Permisos | Respetado a nivel funcional | Pantalla de uso exclusivo del Analista Técnico (`08_Permisos`). |

**Elementos inferidos** (sin respaldo literal en insumos): `qd_strAction`, `qd_strCompleteLogAPI`, edición condicional del payload,
límites `maxLength`, identidad visual de error, modal de "Ver Log Completo", indicador de intento en la
alerta. Todos detallados en §10.

**Variables de control del script de Momento 3** (no se muestran en la pantalla, las escribe el script):

| Variable | Valores | Uso |
|---|---|---|
| `qd_blnM3AttachDone` | `true` / `false` | `true` ⇒ el anexo ya subió: el reintento salta el `POST /api/storage/` y va directo al cierre. Se limpia a `false` tras un cierre 2xx. |
| `qd_strM3FailedStep` | `ATTACHMENTS` / `CIERRE` / `''` | Paso donde se detuvo el flujo; para la compuerta del BPM. Vacío en éxito. |

**Pendientes / dependencias externas:**
- `data_name` definitivos de PM4 (homologar `qd_*` ↔ variable lógica).
- Renovación automática de credenciales ante HTTP 401 (backend, `Matrices > 2. Directrices fila 34`).
- Si alguna vez hay que **reemplazar** el PDF de respuesta final antes de reintentar el cierre, el BPM debe
  poner `qd_blnM3AttachDone = false` para que el script vuelva a subir el anexo (hoy, con el flag en `true`,
  siempre lo salta).

---

## 12. El port a Angular 21 — qué cambió y qué destapó

Esta sección **no** tiene equivalente en el documento React: existe porque el port encontró tres
contratos que en React no existían o eran implícitos, y los tres tienen un modo de falla silencioso.
Nada de acá cambia el comportamiento funcional descrito arriba.

### 12.1 Mapeo react-hook-form → Reactive Forms

| React (`RevisionErrorTecnicoApi.tsx`) | Angular (`revision-error-tecnico-api.ts`) |
|---|---|
| `useForm<DatosErrorTecnico>()` | `FormGroup` tipado vía `FormBuilder` |
| `Controller` + `ZdsTextarea` | `formControlName` sobre el wrapper CVA de la fachada |
| `watch(...)` para `puedeAutorizar` | `computed()` sobre una `signal` alimentada por `form.valueChanges` |
| `reset({...DEFAULTS, ...task.data})` | `precargar()` → `patchValue({...DEFAULTS, ...dicParche})` |
| `readOnly={!blnAdjustPayload}` | `enable()`/`disable()` del **control** (ver 12.2) |
| `handleSubmit(onOk, onErr)` | `autorizar()` con guarda explícita + `scrollToFirstError(this.form)` |

`precargar()` copia **solo las claves que el form declara**, no todo `task.data`: un `patchValue` con
claves ajenas es un no-op silencioso en Angular, pero copiarlas igual haría que un campo agregado al
caso por otro nodo del BPM viajara de vuelta en el PUT sin que nadie lo hubiera pedido.

### 12.2 El bloqueo del payload vive en el control, y `getRawValue()` no es opcional

React usaba `readOnly` (una prop de la vista). Angular usa `disable()` sobre el `FormControl`, porque
un `readonly` del `za-textarea` **no se refleja bajo jsdom** y entonces la regla no sería aseverable.

La consecuencia es la trampa: **`form.value` omite los controles deshabilitados.** Con FLD-058 en `NO`
el payload está `disabled`, así que `enviar()` **tiene que** usar `form.getRawValue()`. Con `value`, el
payload llega a PM4 como `undefined` — no como un error de validación, sino como pérdida silenciosa de
un dato que el analista veía en pantalla. Es exactamente el modo de falla que el script de M3
compensaría reconstruyendo el body, o sea que nadie lo notaría hasta auditar un caso.

### 12.3 `[disabled]` del DS es afordancia, no guarda

Un `lib-button-z` deshabilitado **igual dispara su `(eventClick)`** bajo jsdom (trampa 1 de
`docs/guides/testing-conventions.md`). Por eso RUL-004-01 está implementada **dos veces**: el
`[disabled]` para que el analista vea que no puede, y el `if (!this.blnPuedeAutorizar()) return` dentro
de `autorizar()` para que efectivamente no pueda. Quitar el segundo deja la pantalla funcionalmente
abierta con el botón gris.

Contratos adicionales del port, todos con falla silenciosa, documentados en el `.html`:
- **`formControlName` **y** `name`, los dos, en cada campo.** El primero ata el control al `FormGroup`;
  el segundo genera el `id="field-<name>"` que `scrollToFirstError` necesita. Con solo `name` el campo
  **pinta y nunca llega al form**.
- **Los slots de `lib-modal-z`:** contenido en `<ng-template libZTemplate id="content">`, con `id`
  **estático**, y el `ng-template` **nunca** dentro de un `@if` (el `@if` va adentro del slot).
- **`[hide-close]="true"`** como binding en `za-alert`; el atributo pelado vale `''` y Angular lo rechaza.

### 12.4 Mutaciones verificadas (gate 5 del plan)

Cada una sobre la **implementación**, no sobre el spec. Baseline: **734 tests / 55 archivos** verdes.

| # | Línea mutada | Rojos | Mensaje |
|---|---|---|---|
| 1 | `blnPuedeAutorizar`: sin `.trim()` | 1 | `expected true to be false` |
| 2 | `enviar()`: `getRawValue()` → `value` | 1 | `expected undefined to be '{"caseId":"13950001"…'` |
| 3 | `autorizar()`: guarda → `if (false)` | **4** | `expected {…(10)} to be null` ×4 |
| 4a | `blnPayloadJsonOk`: sin `!Array.isArray(...)` | 1 | `payload [1,2]: expected true to be false` |
| 4b | `blnPayloadJsonOk`: sin `!!genParseado` | 1 | `payload null: expected true to be false` |
| 4c | `blnPayloadJsonOk`: sin `typeof === 'object'` | 1 | `payload "solo texto": expected true to be false` |
| 5 | `sincronizarEdicionPayload()`: `enable()` incondicional | 2 | `expected false to be true` ×2 |
| 6 | `precargar()`: `patchValue` sin `dicParche` | 2 | `expected '' to be '500'` · `expected '' to be '{"caseId"…'` |

Dos resultados que valen más que el rojo en sí:

- **La mutación 3 puso 4 casos en rojo a la vez**, lo que confirma que la guarda de RUL-004-01 vive en
  `autorizar()` y no en el `[disabled]`. La regla queda vigilada por tests, no por un comentario.
- **4a/4b/4c prueban que las tres condiciones de `blnPayloadJsonOk` son necesarias**, cada una con un
  input que la nombra. Esto sale de escribir el mensaje por iteración
  (`expect(..., \`payload ${strPayload}\`)`): sin él las tres saldrían como el mismo
  `expected true to be false` y serían indistinguibles en la salida.

### 12.5 Cobertura de los 14 casos del spec

Un caso por RUL/ACT, no un smoke: (1) monta y precarga desde `task.data` · (2) S2 no nace en rojo ·
(3) RUL-004-01 bloquea + MSG-004-01 + sin PUT + `touched` · (4) RUL-004-01 con un solo campo ·
(5) RUL-004-01 con solo espacios (asevera que el control es **válido** y aun así no se puede autorizar
— que es el punto) · (6) FLD-058 deshabilita/habilita en ambas direcciones · (7) JSON malformado
bloquea · (8) JSON válido pero no-objeto bloquea, recorriendo `['null', '[1,2]', '"solo texto"', '42']`
· (9) sin validación de JSON cuando el ajuste es `NO` · (10) ACT-004-01 envía
`qd_strAction: 'AUTORIZAR_REENVIO'` · (11) ACT-004-01 con el payload deshabilitado (`getRawValue`) ·
(12) ACT-004-01 con payload editado · (13) ACT-004-03 abre/cierra/reabre el modal · (14) error 404 de
carga reemplaza el formulario.

**Ausencia deliberada, y es en sí misma una aserción:** el spec **no** tiene `drenarPeticiones()`.
SCR-004 no consume colecciones, así que la única petición del montaje es el GET de la tarea, y el
`objMock.verify()` del `afterEach` es lo que mantiene eso verdadero — agregar un provider de
`CollectionService` o un `app-request-file-list` dejaría un GET pendiente y **todos** los casos en rojo.

---

**Registro de la pantalla (dos archivos, los dos obligatorios):** entrada en `DIC_PANTALLAS`
(`app/pantallas.ts`) **y** slug en `CLL_SLUGS_CON_SPEC` (`app/pantallas.spec.ts`). Si falta el segundo,
la guarda de inventario pone la suite roja nombrando el slug.
