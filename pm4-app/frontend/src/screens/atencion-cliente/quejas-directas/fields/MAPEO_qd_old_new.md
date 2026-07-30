# Mapeo `qd_*` old → new — Quejas Directas (P01)

Entregable para coordinar la migración de PM4 (variables de proceso, gateways, scripts,
integración SFC/SmartSupervision) en **lockstep** con este frontend. El frontend con los
nombres NEW **no pre-pobla ni guarda** contra un PM4 que siga emitiendo/esperando OLD.

Fuente de verdad de los nombres NEW: [`fields/fields.ts`](./fields.ts) (registro `QD`).
No editar esta tabla sin editar `fields.ts` en el mismo commit.

## Alcance de esta migración

Se migran los **143 campos `qd_*` que son variables de proceso PM4** (claves de
`task.data`, `name=` de react-hook-form). Las claves internas de `GLOBAL_COLLECTIONS`
(`core/collections.ts`) que solo actúan como nombre de propiedad de un objeto de
configuración (p. ej. `qd_tipoSolicitud: {...}`, `qd_ciudad: {...}`, `qd_area: {...}`)
**nunca viajan a PM4** — no cuentan hacia los 143, son análogas a las claves de
`OPTIONS`/`COLLECTION_DEFS` que el refactor de nomenclatura anterior también dejó
intactas. Sin embargo, **posteriormente se renombraron igual** (a `requestType`,
`city`, `area`, etc., alineadas con `QD_COLLECTIONS` en `fields.ts`) por consistencia,
y los tokens internos de `dependsOn`/`pmqlTemplate` que no son campos PM4 reales
también se tradujeron a inglés (`qd_area` → `qd_strAreaCode`, `qd_seguro` →
`qd_strLegacyInsurance`, `qd_productoSFC` → `qd_strProductFilter`). Ver la sección
**Informe de impacto** para el detalle completo (qué SÍ es un campo real vs. qué es
un token/propiedad interna, y su estado actual).

## Tabla old → new

| Screen(s) | OLD | NEW | Tipo |
|---|---|---|---|
| SCR-000 | qd_tipoSolicitud | qd_strRequestType | string |
| SCR-000 | qd_rolRadicador | qd_strFilerRole | string |
| SCR-000, 002, 0051, 0052 | qd_canal | qd_strChannel | string |
| SCR-000, 0051, 0052 | qd_puntoRecepcion | qd_strReceptionPoint | string |
| SCR-000, 002, 0051, 0052 | qd_instanciaRecepcion | qd_strReceptionInstance | string |
| SCR-000 | qd_alianza | qd_strAlliance | string |
| SCR-000, 002, 0051, 0052 | qd_tipoIdentificacion | qd_strIdType | string |
| SCR-000, 002, 0051, 0052 | qd_numeroIdentificacion | qd_strIdNumber | string |
| SCR-000, 0051, 0052 | qd_nombres | qd_strFirstName | string |
| SCR-000, 0051, 0052 | qd_apellidos | qd_strLastName | string |
| SCR-000, 0051, 0052 | qd_razonSocial | qd_strCompanyName | string |
| SCR-000 | qd_nombresContacto | qd_strContactFirstName | string |
| SCR-000 | qd_apellidosContacto | qd_strContactLastName | string |
| SCR-000 | qd_telefono | qd_strPhone | string |
| SCR-000, 002, 0051, 0052 | qd_correoElectronico | qd_strEmail | string |
| SCR-000, 002, 0051, 0052 | qd_tipoPersona | qd_strPersonType | string |
| SCR-000, 002 | qd_codigoPais | qd_strCountryCode | string |
| SCR-000, 002 | qd_departamento | qd_strDepartment | string |
| SCR-000, 002 | qd_municipio | qd_strCity | string |
| SCR-000 | qd_direccion | qd_strAddress | string |
| SCR-000, 009 | qd_sexo | qd_strSex | string |
| SCR-000, 009 | qd_lgbtiq | qd_strLgbtiq | string |
| SCR-000, 009 | qd_condicionEspecial | qd_strSpecialCondition | string |
| SCR-000, 002, 0051, 0052 | qd_productoSFC | qd_strSfcProduct | string |
| SCR-000 | qd_detalleProducto | qd_strProductDetail | string |
| SCR-000 | qd_replica | qd_strReply | string |
| SCR-000 | qd_argumentoReplica | qd_strReplyArgument | string |
| SCR-000 | qd_escalamientoDefensor | qd_strOmbudsmanEscalation | string |
| SCR-000, 002, 0051, 0052 | qd_motivoSFC | qd_strSfcReason | string |
| SCR-000, 002, 0051, 0052 | qd_textoQueja | qd_strComplaintText | string |
| SCR-000 | qd_adjunto_01 | qd_strAttach01 | string |
| SCR-000 | qd_adjunto_02 | qd_strAttach02 | string |
| SCR-000 | qd_adjunto_03 | qd_strAttach03 | string |
| SCR-000 | qd_adjunto_04 | qd_strAttach04 | string |
| SCR-000 | qd_adjunto_05 | qd_strAttach05 | string |
| SCR-000, 002, 009, 0051, 0052 | qd_admision | qd_strAdmission | string |
| SCR-000, 002, 009, 0051, 0052 | qd_enteControl | qd_strControlEntity | string |
| SCR-000, 009 | qd_tutela | qd_strTutela | string |
| SCR-000, 009 | qd_quejaExpres | qd_strExpressComplaint | string |
| SCR-000 | qd_autorizacionDatos | qd_blnDataAuth | boolean |
| SCR-000 | qd_captcha | qd_blnCaptcha | boolean |
| SCR-000 | qd_correoCopia | qd_strCcEmail | string |
| SCR-000 | qd_estadoSmartSupervision | qd_strSmartSupStatus | string |
| SCR-000 | qd_fechaRadicacionSFC | qd_strSfcFilingDate | string |
| SCR-000 | qd_rolResponsable | qd_strAssigneeRole | string |
| SCR-000 | qd_responsable | qd_strAssignee | string |
| SCR-002, 0051 | qd_idCasoBPM | qd_strBpmCaseId | string |
| SCR-002, 008, 0051 | qd_slaRestante | qd_strSlaAssigned | string ⚠ corrección semántica: el campo es el SLA asignado, no el restante |
| SCR-002 | qd_errores_json | qd_strErrorsJson | string ⚠ ver informe |
| SCR-003 | qd_codigoErrorSFC | qd_strSfcErrorCode | string |
| SCR-003 | qd_campoAfectado | qd_strAffectedField | string |
| SCR-003 | qd_valorRechazado | qd_strRejectedValue | string |
| SCR-003 | qd_mensajeErrorSFC | qd_strSfcErrorMessage | string |
| SCR-003 | qd_numeroIntentoM1M2 | qd_strM1M2AttemptNum | string |
| SCR-003 | qd_fechaRechazo | qd_strRejectionDate | string |
| SCR-003 | qd_campoCorreccion | qd_strFieldCorrection | string |
| SCR-003 | qd_justificacionCorreccion | qd_strCorrectionJustif | string |
| SCR-003 | qd_historialIntentos | qd_lstAttemptHistory | array |
| SCR-003, 004, 008, 009, 011, 012, 0051, 0052 | qd_accion | qd_strAction | string (unión por screen) |
| SCR-004 | qd_codigoHTTP | qd_strHttpCode | string |
| SCR-004 | qd_tipoError | qd_strErrorType | string |
| SCR-004 | qd_mensajeTecnicoAPI | qd_strApiTechMessage | string |
| SCR-004 | qd_endpointInvocado | qd_strEndpointCalled | string |
| SCR-004 | qd_payloadEnviado | qd_strPayloadSent | string |
| SCR-004 | qd_numeroIntento | qd_strAttemptNum | string |
| SCR-004 | qd_causaRaiz | qd_strRootCause | string |
| SCR-004 | qd_correccionAplicada | qd_strCorrectionApplied | string |
| SCR-004 | qd_requiereAjustePayload | qd_strPayloadAdjustNeeded | string |
| SCR-008, 009, 010, 0051 | qd_codigoSFC | qd_strSfcCode | string |
| SCR-008 | qd_versionRevision | qd_strRevisionVersion | string |
| SCR-008, 0051, 0052 | qd_areaResponsable | qd_strAssigneeArea | string |
| SCR-008 | qd_fechaElaboracion | qd_strDraftDate | string |
| SCR-008, 0051 | qd_respuestaCliente | qd_strClientResponse | string |
| SCR-008, 0051 | qd_accionesTomadas | qd_strActionsTaken | string |
| SCR-008, 0051 | qd_reconocimiento | qd_strAcknowledgment | string |
| SCR-008 | qd_adjuntosSoporte | qd_lstSupportAttach | array |
| SCR-008, 0051 | qd_observacionesSAC | qd_strSacRemarks | string |
| SCR-009 | qd_productoDigital | qd_strDigitalProduct | string |
| SCR-009, 010 | qd_estadoQueja | qd_strComplaintStatus | string |
| SCR-009, 010, 0051 | qd_favorabilidad (SCR-0051: antes qd_respuestaFavorDe) | qd_strFavorability | string |
| SCR-009, 010 | qd_aceptacion | qd_strAcceptance | string |
| SCR-009 | qd_rectificacion | qd_strRectification | string |
| SCR-009 | qd_desistimiento | qd_strWithdrawal | string |
| SCR-009, 010 | qd_marcacion | qd_strMarking | string |
| SCR-009, 010 | qd_relacionadaFraude | qd_strFraudRelated | string |
| SCR-009, 010 | qd_tipoFraude | qd_strFraudType | string |
| SCR-009 | qd_modalidadFraude | qd_strFraudModality | string |
| SCR-009, 010 | qd_montoReclamado | qd_strClaimedAmount | string |
| SCR-009, 010 | qd_montoReconocido | qd_strAcknowledgedAmount | string |
| SCR-009 | qd_incluyeAnexosQueja | qd_strIncludesComplaintAnnex | string |
| SCR-009 | qd_incluyeAdjuntoRespuesta | qd_strIncludesReplyAttach | string |
| SCR-009, 010 | qd_pdfRespuestaFinal | qd_strFinalReplyPdf | string |
| SCR-009 | qd_diasProrroga | qd_strSlaDaysProlognated | string |
| SCR-010 | qd_estadoCierreM3 | qd_strM3ClosureStatus | string |
| SCR-010 | qd_intentosCierreM3 | qd_strM3ClosureAttempts | string |
| SCR-010 | qd_ultimoError | qd_strLastError | string |
| SCR-010 | qd_fechaActualizacion | qd_strUpdateDate | string |
| SCR-010 | qd_fechaCierre | qd_strClosureDate | string |
| SCR-010 | qd_validacionNomenclatura | qd_strNamingValidation | string |
| SCR-010 | qd_adjuntoRespuestaFinal | qd_strFinalReplyAttach | string |
| SCR-011 | qd_codigoHTTPProrroga | qd_strExtHttpCode | string |
| SCR-011 | qd_tipoErrorProrroga | qd_strExtErrorType | string |
| SCR-011 | qd_mensajeTecnicoProrroga | qd_strExtTechMessage | string |
| SCR-011 | qd_payloadProrroga | qd_strExtPayload | string |
| SCR-011 | qd_intentoProrroga | qd_strExtAttempt | string |
| SCR-011 | qd_causaRaizProrroga | qd_strExtRootCause | string |
| SCR-011 | qd_correccionProrroga | qd_strExtCorrection | string |
| SCR-012 | qd_codigoErrorProrroga | qd_strExtErrorCode | string |
| SCR-012 | qd_campoAfectadoProrroga | qd_strExtAffectedField | string |
| SCR-012 | qd_mensajeErrorProrroga | qd_strExtErrorMessage | string |
| SCR-012 | qd_intentoActualProrroga | qd_strExtCurrentAttempt | string |
| SCR-012, 0051 | qd_motivoProrroga | qd_strExtensionReason | string |
| SCR-012 | qd_nuevaFechaLimite | qd_strNewDeadline | string |
| SCR-012 | qd_contadorProrroga | qd_strExtensionCounter | string |
| SCR-012 | qd_justificacionProrroga | qd_strExtensionJustif | string |
| SCR-0051 | qd_estadoSS | qd_strSsStatus | string |
| SCR-0051 | qd_intentosM1M2 | qd_strM1M2Attempts | string |
| SCR-0051 | qd_fechaRadicacion | qd_strFilingDate | string |
| SCR-0051 | qd_tieneResponsable | qd_blnHasAssignee | boolean |
| SCR-0051, 0052 | qd_usuarioResponsable | qd_strAssigneeUser | string |
| SCR-0051, 0052 | qd_observacionesAsignacion | qd_strAssignmentRemarks | string |
| SCR-0051 | qd_necesitaOtrasAreas | qd_strNeedsOtherAreas | string |
| SCR-0051 | qd_responsableActual | qd_strCurrentAssignee | string |
| SCR-0051 | qd_areaDestino | qd_strTargetArea | string |
| SCR-0051 | qd_nuevoResponsable | qd_strNewAssignee | string |
| SCR-0051 | qd_motivoReasignacion | qd_strReassignReason | string |
| SCR-0051 | qd_observacionesReasignacion | qd_strReassignRemarks | string |
| SCR-0051, 0052 | qd_historialAsignaciones | qd_lstAssignHistory | array |
| SCR-0051, 0052 | qd_numeroAyuda | qd_intHelpNumber | number |
| SCR-0051 | qd_soporte_01 | qd_strSupport01 | string |
| SCR-0051 | qd_soporte_02 | qd_strSupport02 | string |
| SCR-0051 | qd_soporte_03 | qd_strSupport03 | string |
| SCR-0051 | qd_soporte_04 | qd_strSupport04 | string |
| SCR-0051 | qd_soporte_05 | qd_strSupport05 | string |
| SCR-0051 | qd_soporte_06 | qd_strSupport06 | string |
| SCR-0051 | qd_soporte_07 | qd_strSupport07 | string |
| SCR-0051 | qd_soporte_08 | qd_strSupport08 | string |
| SCR-0051 | qd_soporte_09 | qd_strSupport09 | string |
| SCR-0051 | qd_soporte_10 | qd_strSupport10 | string |
| SCR-0052 | qd_comentarioArea | qd_strAreaComment | string |
| SCR-0052 | qd_adjuntoArea | qd_strAreaAttach | string |
| SCR-0052 | qd_respuestasAyuda | qd_lstHelpResponses | array |

**Total: 143 campos** (renombrados). (El inventario previo de 154 incluía ~11 claves de
`GLOBAL_COLLECTIONS` sin campo PM4 propio — ver "Fuera de alcance" abajo.)

## Campos NUEVOS (sin equivalente OLD) — SCR-000

Agregados tras el refactor de nomenclatura, alineando SCR-000 con la pestaña
`FormularioCreaciónPQRS` del Anexo02 v3.0. **No son renombres**: son variables de
proceso PM4 nuevas que el proceso P01 debe crear/emitir.

| Screen | NEW | Tipo | Origen |
|---|---|---|---|
| SCR-000 | qd_strPlate | string | #25 — placa del vehículo (solo producto = "Autos") |
| SCR-000 | qd_strInteraction | string | #30 — momento/interacción (`cat_matriz_motivos.interaccion`) |
| SCR-000 | qd_strServiceProvided | string | #31 — servicio (`cat_matriz_motivos.servicioPrestado`, solo si momento = "Asistencias") |

**Colección nueva `cat_matriz_motivos` (id 45)** en `core/collections.ts`
(`qd_matrizMotivos`): matriz de cascada tipo solicitud → producto → momento →
servicio → motivo. Se carga completa y la cascada se filtra **en cliente**
(`SeccionDetalleQueja`) por *label* normalizado (las columnas `tipoSolicitud`/
`productoZurich` guardan texto, y los datos traen espacios sobrantes). Columnas
(camelCase, bajo `data.*`): `tipoSolicitud`, `productoZurich`, `interaccion`,
`servicioPrestado`, `codigoMotivoSFC`, `motivoSFC`. Reapunta el motivo
(`qd_strSfcReason`) de la colección legacy id 17 a esta matriz **solo en SCR-000**
(SCR-002/0051/0052 siguen con id 17 en modo display). `qd_strSfcReason` guarda el
código `codigoMotivoSFC` (se preserva el código, igual que con id 17); `qd_strInteraction`
y `qd_strServiceProvided` guardan el texto de `interaccion`/`servicioPrestado`.

## Casos especiales de traducción

- **`Tutela`** se conserva sin traducir (figura jurídica constitucional colombiana,
  sin equivalente seguro en inglés) → `qd_strTutela`.
- **`Prorroga` → `Extension`**, con prefijo `Ext` en los campos de detalle de error
  para evitar nombres >20 chars (`qd_strExtHttpCode`, no `qd_strExtensionHttpCode`).
- **Numerados** (`_01".."05`/`_10`) conservan el índice como sufijo: `qd_strAttach01`,
  `qd_strSupport01`.
- **`qd_accion`**: el campo físico es el mismo en las 8 pantallas que lo usan, pero
  cada una lo tipa con su propia unión de literales (`AccionErrorFuncional`,
  `AccionRevisionSAC`, etc.). En `QdFields` está tipado como `string` (superset); cada
  pantalla estrecha el tipo — ver patrón en `fields.ts`.
- **Unificación de nombre** (mismo campo lógico reutilizado en varias pantallas, ya
  documentado como tal en los comentarios FLD-xxx originales): `qd_codigoSFC` (SCR-008/
  009/010/0051), `qd_estadoQueja`/`qd_favorabilidad`/`qd_aceptacion`/`qd_marcacion`
  (SCR-009/010), `qd_areaResponsable`/`qd_usuarioResponsable` (SCR-0051/0052),
  `qd_motivoProrroga`→`qd_strExtensionReason` (SCR-012/0051).

## Fuera de alcance del rename de campos PM4 (no cuentan hacia los 143)

- **Claves de `GLOBAL_COLLECTIONS`** (`core/collections.ts`): no son un campo PM4
  propio, sino el nombre de propiedad del objeto de configuración de una colección
  (`requestType`, `filerRole`, `countryCode`, `city`, `sfcReason`, `controlEntity`,
  `digitalProduct`, `area`, `areaUsers`, `sfcProduct`, etc. — ver el objeto completo
  en `collections.ts`). Igual tratamiento que `OPTIONS`/`COLLECTION_DEFS` en el
  refactor de nomenclatura previo — **sí se renombraron** por consistencia (ya no
  llevan prefijo `qd_`), pero esa fue una limpieza cosmética aparte, no parte del
  contrato con PM4.

## Informe de impacto — PMQL / colecciones dependientes (`core/collections.ts`)

Antes de tocar `collections.ts`, este es el análisis completo de sus 3 definiciones
con `dependsOn`/`pmqlTemplate` en el dominio Quejas Directas:

> **Actualización posterior:** las claves de `GLOBAL_COLLECTIONS` del bloque Quejas
> Directas (antes prefijadas `qd_*`, ej. `qd_ciudad`, `qd_usuariosRole`,
> `qd_detalleProducto`) se renombraron a nombres semánticos sin prefijo (`city`,
> `areaUsers`, `productDetail`, alineados 1:1 con `QD_COLLECTIONS` en `fields.ts`),
> igual que el resto de propiedades de configuración (`OPTIONS`/`COLLECTION_DEFS`).
> El análisis de `dependsOn`/`pmqlTemplate` de abajo (qué SÍ/NO cambia como valor
> de campo real) sigue vigente sin cambios — solo cambió el nombre de la propiedad
> contenedora, no el valor de sus strings `dependsOn`/`pmqlTemplate`.

### 1. `GLOBAL_COLLECTIONS.city` (antes `qd_ciudad`, municipios) — SÍ cambia

```
dependsOn: 'qd_departamento'                              → 'qd_strDepartment'
pmqlTemplate: 'data.codigo_departamento = "{{qd_departamento}}"' → '...{{qd_strDepartment}}"'
```
**Por qué:** en `SCR-000/SeccionConsumidor.tsx` se llama
`useCollection(COLLECTION_DEFS.ciudad, objWatch as unknown as Record<string, unknown>)`
— pasa el **objeto real de watch del formulario**. El `dependsOn` lee
`objWatch['qd_departamento']` directamente, así que DEBE coincidir con el nombre
real del campo tras el rename. Impacta 2 call sites (deben actualizarse en el mismo
commit): `SCR-000/SeccionConsumidor.tsx` (`objWatch.qd_departamento` → `.qd_strDepartment`)
y `SCR-002/SeccionErroresValidacion.tsx` (`watch('qd_departamento')` → `watch(QD.strDepartment)`,
y su shim `{ qd_departamento: strDepartment }` → `{ qd_strDepartment: strDepartment }` para
seguir coincidiendo con el `dependsOn` renombrado).

**LEFT-side de PMQL sin cambios:** `data.codigo_departamento` es una columna de la
colección PM4 (id 15), no un campo del formulario — no se toca.

### 2. `GLOBAL_COLLECTIONS.areaUsers` (antes `qd_usuariosRole`) — el shim se tradujo a inglés

```
dependsOn: 'qd_area'  → 'qd_strAreaCode'
pmqlTemplate: 'data.codigo_area = "{{qd_area}}"' → '...{{qd_strAreaCode}}"'
```
**Por qué se tradujo (sin cambiar el comportamiento):** en `SCR-0051/SeccionAsignacion.tsx`
se llama con un objeto **sintético** construido ad-hoc: `useCollection(QD_COLLECTIONS.areaUsers,
{ qd_strAreaCode: objWatch[QD.strAssigneeArea] })` y `{ qd_strAreaCode: objWatch[QD.strTargetArea] })`.
La clave `qd_strAreaCode` (antes `qd_area`) es una **convención interna** entre el
`dependsOn` y el objeto que arma el propio `SeccionAsignacion.tsx` — nunca es un campo
real de `task.data`, así que no forma parte del contrato con PM4. Como el usuario pidió
que también los tokens internos respeten la nomenclatura en inglés, se tradujo
`qd_area` → `qd_strAreaCode` en AMBOS lados a la vez (dependsOn/pmqlTemplate y los 2
call sites), preservando el comportamiento exacto porque ambos lados coincidían antes
y siguen coincidiendo después.

### 3. `GLOBAL_COLLECTIONS.productDetail` (antes `qd_detalleProducto`) — tokens huérfanos traducidos por separado (bug preexistente, se preserva)

```
dependsOn: 'qd_seguro'  → 'qd_strLegacyInsurance'
pmqlTemplate: 'data.codigo_producto_sfc = "{{qd_seguro}}"' → '...{{qd_strLegacyInsurance}}"'
```
**Hallazgo (sigue vigente):** en `SCR-000/SeccionDetalleQueja.tsx` se llama con
`useCollection(QD_COLLECTIONS.productDetail, { qd_strProductFilter: objWatch[QD.strSfcProduct] })`
— la clave del objeto sintético (antes `qd_productoSFC`, ahora `qd_strProductFilter`)
**no coincide** con `dependsOn: 'qd_strLegacyInsurance'` (antes `qd_seguro`). Esto
significa que `genDependsOnValue` sigue resolviendo a `undefined` y **esta colección
sigue sin recargarse dinámicamente** (bug preexistente, anterior a este refactor).
Por regla de "cero cambios de lógica", los DOS tokens huérfanos se tradujeron a
inglés **de forma independiente** (sin hacerlos coincidir): `qd_seguro` → `qd_strLegacyInsurance`
en `collections.ts`, y `qd_productoSFC` → `qd_strProductFilter` en el call site —
deliberadamente distintos, para no alterar el comportamiento actual ni de casualidad
hacerlo funcionar. **Se notifica al usuario para que decida si corregir este bug por
separado** (fuera del alcance de este refactor de nomenclatura).

## Hallazgo adicional — `qd_errores_json` transporta nombres de campo en runtime

`SCR-002` recibe de PM4 (script BPM de validación preventiva) un JSON en
`qd_strErrorsJson` (antes `qd_errores_json`) con la forma `CampoConError[]`, donde
`campo: string` es **el nombre del campo RHF como dato en runtime**, no un tipo
estático — p. ej. `{ campo: 'qd_correoElectronico', ... }`. `SeccionErroresValidacion.tsx`
compara este string contra literales (`CAMPOS_CONOCIDOS`, `esCampoCorregido`).

**Esto es contrato con PM4 más allá de PMQL:** el script BPM que genera este JSON
también debe emitir los nombres NUEVOS (`'qd_strEmail'`, `'qd_strIdNumber'`,
`'qd_strCity'`, `'qd_strDepartment'`) tras la migración, o las comparaciones fallarán
en silencio (no lo detecta `tsc`, es una comparación de string contra dato dinámico).
Se incluye este script en el alcance de la migración PM4 recomendada, junto con
gateways/scripts/SFC ya mencionados en el plan.

## Convención `_desc` — código + descripción para campos de colección

Todo campo respaldado por una colección PM4 sigue esta regla: el campo base guarda el
**CÓDIGO** (numérico) y viaja una variable **compañera** `<campo>_desc` con la
**descripción legible** del catálogo. Ejemplo: `qd_strChannel = "13"` +
`qd_strChannel_desc = "Internet"`. Se descartó un objeto anidado (`{value, id}`) porque
rompe `resolvePmql` (`String(obj)` → `"[object Object]"`) y los bindings/reportes nativos
de PM4, que esperan escalares.

**Implementación (frontend):** `core/useCollection.ts` expone `descOf(options, code)`
(resuelve la descripción) y el hook `useSyncDesc(form, field, options)`, que mantiene
`form[\`${field}_desc\`]` sincronizado con la descripción del código actual. Como todo
payload a PM4 se arma con `{ ...formData }` (`completeTask`/`saveDraft`/`sendToPm4`), el
`_desc` viaja solo, sin tocar ningún submit. **Estas variables `_desc` son datos NUEVOS**
para PM4: se guardan sin romper nada aunque nadie las lea, pero si el proceso, los
correos o los reportes deben **usarlas**, hay que crearlas/mapearlas del lado PM4.

**Flip de campos que antes guardaban la ETIQUETA:** varios campos "back" (resueltos por
regla/derivados, no elegidos directamente en un `<select>`) guardaban el texto del
catálogo en vez del código, porque sus catálogos PM4 usaban códigos de texto. Al migrar
esos catálogos a código numérico, estos campos se **flipearon** para guardar `.value`
(código) en vez de `.label`, y ahora dependen de `_desc` para su descripción:
`qd_strSex`, `qd_strLgbtiq`, `qd_strSpecialCondition`, `qd_strAdmission` (default
"No aplica" → código `9`), `qd_strControlEntity`, `qd_strTutela`,
`qd_strExpressComplaint`, `qd_strPersonType`, `qd_strProductDetail`,
`qd_strReceptionInstance`. Los inputs read-only que mostraban estos campos (en SCR-000,
SCR-0051 `SeccionDetalleCaso.tsx`, SCR-0052 `RespuestaAreaResponsable.tsx`) ahora
muestran su `_desc` correspondiente, no el campo base.

**Diferido — matriz `cat_matriz_motivos` (id 45):** `qd_strInteraction` y
`qd_strServiceProvided` siguen guardando **texto** (value == label; la matriz no expone
un código numérico propio para esas columnas). Quedan fuera de esta convención hasta
definir de dónde saldría su código.

**Dependencia externa:** el flip depende de que los catálogos PM4 (ids 12, 22, 23, 24,
30, 32, 40, 41, y 19 para `receptionInstance`) ya usen código numérico — confirmado por
el equipo PM4. Datos de casos viejos radicados con el catálogo anterior (que guardaban
texto) quedan fuera de alcance de este cambio.

## Checklist para la migración PM4 (fuera de este repo)

- [ ] Renombrar las 143 variables de proceso del subproceso P01 (Quejas Directas) según la tabla.
- [ ] Crear las 3 variables de proceso NUEVAS de SCR-000 (`qd_strPlate`, `qd_strInteraction`, `qd_strServiceProvided`).
- [ ] Crear la colección `cat_matriz_motivos` (id 45) con columnas `tipoSolicitud`, `productoZurich`, `interaccion`, `servicioPrestado`, `codigoMotivoSFC`, `motivoSFC` (el front la filtra en cliente por texto normalizado, así que tolera espacios/mayúsculas).
- [ ] Actualizar expresiones de gateway BPMN que referencien estos nombres.
- [ ] Actualizar scripts/watchers (incl. el validador que genera `qd_errores_json.campo`).
- [ ] Actualizar la integración SFC/SmartSupervision (las "variables de back": `qd_strSmartSupStatus`, `qd_strSfcFilingDate`, `qd_strAssigneeRole`, `qd_strAssignee`, etc.).
- [ ] Validar que ninguna otra pantalla/tarea de PM4 (fuera de este repo) referencie los nombres OLD.
