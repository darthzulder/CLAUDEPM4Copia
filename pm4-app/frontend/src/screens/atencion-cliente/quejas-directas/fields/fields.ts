// Registro central de variables PM4 y configuración de las 11 pantallas del
// proceso P01 — Gestión de Quejas Directas. ÚNICA fuente de verdad: reemplaza
// los `variables.ts` por pantalla (eliminados) — nombres físicos `qd_*`, tipos
// de formulario, catálogos, opciones estáticas y valores por defecto viven
// TODOS aquí. Ver fields/MAPEO_qd_old_new.md para el mapeo completo old→new y
// el informe de impacto de PMQL/colecciones.
//
// Nomenclatura Zurich RPA: `qd_` (marca de proyecto) + prefijo de tipo
// (str/int/bln/lst) + NombreEnInglés. Uso: `name={QD.strComplaintStatus}` en
// JSX, `objWatch[QD.strComplaintStatus]` en lógica. NUNCA escribir el string
// 'qd_str...' a mano fuera de este archivo.
//
// ⚠️ Estos nombres son CONTRATO con PM4 (variables de proceso, gateways,
// scripts, integración SFC/SmartSupervision). No desplegar este frontend hasta
// que el proceso PM4 emita/espere estos mismos nombres.

import { GLOBAL_COLLECTIONS } from '../../../../core/collections';
import type {
  IntentoHistorial, SoporteAdjunto, AsignacionHistorial, RespuestaAyuda, CampoConError,
  FiltrosDashboard,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRO — nombres físicos qd_*
// ═══════════════════════════════════════════════════════════════════════════

export const QD = {
  // ── SCR-000 · S1 Tipo de Solicitud y Rol ──────────────────────────────────
  strRequestType: 'qd_strRequestType',                 // FLD-302 · antes qd_tipoSolicitud
  strFilerRole: 'qd_strFilerRole',                     // FLD-303 · antes qd_rolRadicador
  strChannel: 'qd_strChannel',                         // antes qd_canal
  strReceptionPoint: 'qd_strReceptionPoint',           // FLD-304 · antes qd_puntoRecepcion
  strReceptionInstance: 'qd_strReceptionInstance',     // FLD-305 · antes qd_instanciaRecepcion
  strAlliance: 'qd_strAlliance',                       // antes qd_alianza

  // ── SCR-000 · S2 Datos del Consumidor Financiero ──────────────────────────
  strIdType: 'qd_strIdType',                           // FLD-306 · antes qd_tipoIdentificacion
  strIdNumber: 'qd_strIdNumber',                       // FLD-307 · antes qd_numeroIdentificacion
  strFirstName: 'qd_strFirstName',                     // FLD-308 · antes qd_nombres
  strLastName: 'qd_strLastName',                       // FLD-309 · antes qd_apellidos
  strCompanyName: 'qd_strCompanyName',                 // FLD-310 · antes qd_razonSocial
  strContactFirstName: 'qd_strContactFirstName',       // FLD-311 · antes qd_nombresContacto
  strContactLastName: 'qd_strContactLastName',         // FLD-312 · antes qd_apellidosContacto
  strPhone: 'qd_strPhone',                             // FLD-313 · antes qd_telefono
  strEmail: 'qd_strEmail',                             // FLD-314 · antes qd_correoElectronico
  strPersonType: 'qd_strPersonType',                   // FLD-315 · antes qd_tipoPersona
  strCountryCode: 'qd_strCountryCode',                 // FLD-316 · antes qd_codigoPais
  strDepartment: 'qd_strDepartment',                   // FLD-317 · antes qd_departamento
  strCity: 'qd_strCity',                               // FLD-318 · antes qd_municipio
  strAddress: 'qd_strAddress',                         // FLD-319 · antes qd_direccion (back)
  strSex: 'qd_strSex',                                 // FLD-320 · antes qd_sexo (back, oculto en SCR-000; seleccionable en SCR-009)
  strLgbtiq: 'qd_strLgbtiq',                           // FLD-321 · antes qd_lgbtiq (back, oculto en SCR-000; seleccionable en SCR-009)
  strSpecialCondition: 'qd_strSpecialCondition',       // FLD-322 · antes qd_condicionEspecial (back, oculto)

  // ── SCR-000 · S3 Detalle de la Queja ──────────────────────────────────────
  strSfcProduct: 'qd_strSfcProduct',                   // FLD-323 · antes qd_productoSFC
  strPlate: 'qd_strPlate',                             // Anexo02 #25 (nuevo) · placa del vehículo (solo producto = Autos)
  strProductDetail: 'qd_strProductDetail',             // FLD-324 · antes qd_detalleProducto (back)
  strReply: 'qd_strReply',                             // FLD-325 · antes qd_replica
  strReplyArgument: 'qd_strReplyArgument',             // FLD-326 · antes qd_argumentoReplica
  strOmbudsmanEscalation: 'qd_strOmbudsmanEscalation', // FLD-327 · antes qd_escalamientoDefensor · extraído de cat_matriz_motivos.escalamientoAdministrador
  strResponsableRole: 'qd_strResponsableRole',         // Anexo02 (nuevo) · rol responsable sugerido, extraído de cat_matriz_motivos.rolResponsable
  strCompensation: 'qd_strCompensation',               // Anexo02 (nuevo) · resarcimiento administrador, extraído de cat_matriz_motivos.resarcimientoAdministrador
  strInteraction: 'qd_strInteraction',                 // Anexo02 #30 (nuevo) · momento/interacción (cat_matriz_motivos.interaccion)
  strServiceProvided: 'qd_strServiceProvided',         // Anexo02 #31 (nuevo) · servicio (cat_matriz_motivos.servicioPrestado; solo si momento = Asistencias)
  strSfcReason: 'qd_strSfcReason',                     // FLD-328 · antes qd_motivoSFC
  strComplaintText: 'qd_strComplaintText',             // FLD-329 · antes qd_textoQueja
  strAttach01: 'qd_strAttach01',                       // FLD-330 · antes qd_adjunto_01
  strAttach02: 'qd_strAttach02',                       // antes qd_adjunto_02
  strAttach03: 'qd_strAttach03',                       // antes qd_adjunto_03
  strAttach04: 'qd_strAttach04',                       // antes qd_adjunto_04
  strAttach05: 'qd_strAttach05',                       // antes qd_adjunto_05
  strAdmission: 'qd_strAdmission',                     // FLD-331 · antes qd_admision (back)
  strControlEntity: 'qd_strControlEntity',             // FLD-332 · antes qd_enteControl (back)
  strTutela: 'qd_strTutela',                           // FLD-333 · antes qd_tutela (back) — término legal CO, no se traduce
  strExpressComplaint: 'qd_strExpressComplaint',       // FLD-334 · antes qd_quejaExpres (back)

  // ── SCR-000 · S4 Autorización y Envío ─────────────────────────────────────
  blnDataAuth: 'qd_blnDataAuth',                       // FLD-335 · antes qd_autorizacionDatos
  blnCaptcha: 'qd_blnCaptcha',                         // FLD-336 · antes qd_captcha
  strCcEmail: 'qd_strCcEmail',                         // FLD-337 · antes qd_correoCopia

  // ── SCR-000 · S5/S6 Estado ante SFC / Responsable (post-radicación, back) ─
  strSmartSupStatus: 'qd_strSmartSupStatus',           // FLD-338 · antes qd_estadoSmartSupervision
  strSfcFilingDate: 'qd_strSfcFilingDate',             // FLD-339 · antes qd_fechaRadicacionSFC
  strAssigneeRole: 'qd_strAssigneeRole',               // FLD-340 · antes qd_rolResponsable
  strAssignee: 'qd_strAssignee',                       // FLD-341 · antes qd_responsable

  // ── SCR-000 · Chequeo de casos similares (watcher script 70, pre-envío) ────
  // Salida del script PM4 (id 70): busca casos ACTIVOS del proceso con el mismo
  // motivo + producto + identificación. Se ejecuta al enviar (antes del captcha);
  // si hay coincidencias se pide confirmación y, al continuar, sus variables se
  // fusionan en el payload antes de radicar (patrón watcher).
  strSimilarCheckStatus: 'similar_check_status',        // SUCCESS | ERROR (diagnóstico del script)
  arridSimilarCases: 'qd_arridSimilarCases',            // IDs de casos similares encontrados
  intCountSimilarCases: 'qd_intCountSimilarCases',      // cantidad de casos similares
  arrSimilarCases: 'qd_arrSimilarCases',                // detalle (data) de los casos similares
  // Derivada al radicar (VALOR BOOLEANO true/false, pese al prefijo str del nombre físico
  // que es CONTRATO con PM4): true solo si el radicador marcó "Sí" en la pregunta de réplica
  // (qd_strReply === 'SI') Y el chequeo de casos similares NO disparó la advertencia
  // (qd_intCountSimilarCases === 0). Es decir, el cliente declara una reconsideración pero el
  // detector automático de casos abiertos no encontró coincidencia → SAC debe escalarla a mano.
  strReconsiderationSacEscalation: 'qd_strReconsiderationSACEscalation',

  // ── SCR-002 · Corrección de Datos (encabezado + metadata) ─────────────────
  strBpmCaseId: 'qd_strBpmCaseId',                     // antes qd_idCasoBPM
  strSlaAssigned: 'qd_strSlaAssigned',               // antes qd_slaRestante (corregido: el campo es el SLA asignado, no el restante)
  strErrorsJson: 'qd_strErrorsJson',                   // antes qd_errores_json — ⚠ ver informe (script BPM debe emitir nombres nuevos)

  // ── SCR-003 · Corrección Error Funcional M1/M2 ────────────────────────────
  strSfcErrorCode: 'qd_strSfcErrorCode',               // FLD-040 · antes qd_codigoErrorSFC
  strAffectedField: 'qd_strAffectedField',             // FLD-041 · antes qd_campoAfectado
  strRejectedValue: 'qd_strRejectedValue',             // FLD-042 · antes qd_valorRechazado
  strSfcErrorMessage: 'qd_strSfcErrorMessage',         // FLD-043 · antes qd_mensajeErrorSFC
  strM1M2AttemptNum: 'qd_strM1M2AttemptNum',           // FLD-044 · antes qd_numeroIntentoM1M2
  strRejectionDate: 'qd_strRejectionDate',             // FLD-045 · antes qd_fechaRechazo
  strFieldCorrection: 'qd_strFieldCorrection',         // FLD-046 · antes qd_campoCorreccion
  strCorrectionJustif: 'qd_strCorrectionJustif',       // FLD-047 · antes qd_justificacionCorreccion
  lstAttemptHistory: 'qd_lstAttemptHistory',           // FLD-048 · antes qd_historialIntentos

  // ── Metadato de flujo (compartido por varias pantallas, unión por screen) ─
  strAction: 'qd_strAction',                           // antes qd_accion

  // ── SCR-004 · Revisión Error Técnico API ──────────────────────────────────
  strHttpCode: 'qd_strHttpCode',                       // FLD-050 · antes qd_codigoHTTP
  strErrorType: 'qd_strErrorType',                     // FLD-051 · antes qd_tipoError
  strApiTechMessage: 'qd_strApiTechMessage',           // FLD-052 · antes qd_mensajeTecnicoAPI
  strEndpointCalled: 'qd_strEndpointCalled',           // FLD-053 · antes qd_endpointInvocado
  strPayloadSent: 'qd_strPayloadSent',                 // FLD-054 · antes qd_payloadEnviado
  strAttemptNum: 'qd_strAttemptNum',                   // FLD-055 · antes qd_numeroIntento
  strRootCause: 'qd_strRootCause',                     // FLD-056 · antes qd_causaRaiz
  strCorrectionApplied: 'qd_strCorrectionApplied',     // FLD-057 · antes qd_correccionAplicada
  strPayloadAdjustNeeded: 'qd_strPayloadAdjustNeeded', // FLD-058 · antes qd_requiereAjustePayload

  // ── SCR-008 · Revisión Respuesta SAC ──────────────────────────────────────
  strSfcCode: 'qd_strSfcCode',                         // FLD-120 · antes qd_codigoSFC (unificado SCR-008/009/010/0051)
  strRevisionVersion: 'qd_strRevisionVersion',         // FLD-122 · antes qd_versionRevision
  strAssigneeArea: 'qd_strAssigneeArea',               // FLD-123 · antes qd_areaResponsable (unificado SCR-0051/0052)
  strDraftDate: 'qd_strDraftDate',                     // FLD-124 · antes qd_fechaElaboracion
  strClientResponse: 'qd_strClientResponse',           // FLD-127/110 · antes qd_respuestaCliente
  strActionsTaken: 'qd_strActionsTaken',               // FLD-128/111 · antes qd_accionesTomadas
  strAcknowledgment: 'qd_strAcknowledgment',           // FLD-129/112 · antes qd_reconocimiento (back)
  lstSupportAttach: 'qd_lstSupportAttach',             // FLD-130 · antes qd_adjuntosSoporte
  strSacRemarks: 'qd_strSacRemarks',                   // FLD-131 · antes qd_observacionesSAC
  blnSacApproved: 'qd_blnSACApproved',                 // Decisión SAC booleana: Aprobar ⇒ true, Devolver ⇒ false

  // ── SCR-009 · Formulario Superintendencia ─────────────────────────────────
  strDigitalProduct: 'qd_strDigitalProduct',           // FLD-149 · antes qd_productoDigital
  strComplaintStatus: 'qd_strComplaintStatus',         // FLD-150/174 · antes qd_estadoQueja (unificado SCR-009/010)
  strFavorability: 'qd_strFavorability',               // FLD-151/177/350 · antes qd_favorabilidad (unificado SCR-009/010/0051, antes qd_respuestaFavorDe en SCR-0051)
  strAcceptance: 'qd_strAcceptance',                   // FLD-152/178 · antes qd_aceptacion
  strRectification: 'qd_strRectification',             // FLD-153 · antes qd_rectificacion
  strWithdrawal: 'qd_strWithdrawal',                   // FLD-154 · antes qd_desistimiento
  strMarking: 'qd_strMarking',                         // FLD-156/179 · antes qd_marcacion
  strFraudRelated: 'qd_strFraudRelated',               // FLD-158 · antes qd_relacionadaFraude
  strFraudType: 'qd_strFraudType',                     // FLD-159/185 · antes qd_tipoFraude (unificado SCR-009/010)
  strFraudModality: 'qd_strFraudModality',             // FLD-160 · antes qd_modalidadFraude
  strClaimedAmount: 'qd_strClaimedAmount',             // FLD-161/186 · antes qd_montoReclamado
  strAcknowledgedAmount: 'qd_strAcknowledgedAmount',   // FLD-162/187 · antes qd_montoReconocido
  strIncludesComplaintAnnex: 'qd_strIncludesComplaintAnnex', // FLD-163 · antes qd_incluyeAnexosQueja
  strIncludesReplyAttach: 'qd_strIncludesReplyAttach', // FLD-164 · antes qd_incluyeAdjuntoRespuesta
  strFinalReplyPdf: 'qd_strFinalReplyPdf',             // FLD-165/181 · antes qd_pdfRespuestaFinal
  strExtensionDays: 'qd_strExtensionDays',             // FLD-166 · antes qd_diasProrroga

  // ── SCR-010 · Cierre Regulatorio Momento 3 ────────────────────────────────
  strM3ClosureStatus: 'qd_strM3ClosureStatus',         // FLD-170 · antes qd_estadoCierreM3
  strM3ClosureAttempts: 'qd_strM3ClosureAttempts',     // FLD-171 · antes qd_intentosCierreM3
  strLastError: 'qd_strLastError',                     // FLD-172 · antes qd_ultimoError
  strUpdateDate: 'qd_strUpdateDate',                   // FLD-175 · antes qd_fechaActualizacion
  strClosureDate: 'qd_strClosureDate',                 // FLD-176 · antes qd_fechaCierre
  strNamingValidation: 'qd_strNamingValidation',       // FLD-182 · antes qd_validacionNomenclatura
  strFinalReplyAttach: 'qd_strFinalReplyAttach',       // FLD-183 · antes qd_adjuntoRespuestaFinal
  strEntityType: 'qd_strEntityType',                   // Excel Cierre #46 · tipo entidad (default "13", envío M3 SFC)
  strEntityCode: 'qd_strEntityCode',                   // Excel Cierre #47 · código entidad (default "9", envío M3 SFC)

  // ── SCR-011 · Revisión Error Técnico Prórroga ─────────────────────────────
  strExtHttpCode: 'qd_strExtHttpCode',                 // FLD-190 · antes qd_codigoHTTPProrroga
  strExtErrorType: 'qd_strExtErrorType',               // FLD-191 · antes qd_tipoErrorProrroga
  strExtTechMessage: 'qd_strExtTechMessage',           // FLD-192 · antes qd_mensajeTecnicoProrroga
  strExtPayload: 'qd_strExtPayload',                   // FLD-193 · antes qd_payloadProrroga
  strExtAttempt: 'qd_strExtAttempt',                   // FLD-194 · antes qd_intentoProrroga
  strExtRootCause: 'qd_strExtRootCause',               // FLD-195 · antes qd_causaRaizProrroga
  strExtCorrection: 'qd_strExtCorrection',             // FLD-196 · antes qd_correccionProrroga

  // ── SCR-012 · Corrección Error Funcional Prórroga ─────────────────────────
  strExtErrorCode: 'qd_strExtErrorCode',               // FLD-200 · antes qd_codigoErrorProrroga
  strExtAffectedField: 'qd_strExtAffectedField',       // FLD-201 · antes qd_campoAfectadoProrroga
  strExtErrorMessage: 'qd_strExtErrorMessage',         // FLD-202 · antes qd_mensajeErrorProrroga
  strExtCurrentAttempt: 'qd_strExtCurrentAttempt',     // FLD-203 · antes qd_intentoActualProrroga
  strExtensionReason: 'qd_strExtensionReason',         // FLD-204/CAT-MOTIVO-PRORR · antes qd_motivoProrroga (unificado SCR-012/0051)
  strNewDeadline: 'qd_strNewDeadline',                 // FLD-205 · antes qd_nuevaFechaLimite
  strExtensionCounter: 'qd_strExtensionCounter',       // FLD-206 · antes qd_contadorProrroga
  strExtensionJustif: 'qd_strExtensionJustif',         // FLD-207 · antes qd_justificacionProrroga

  // ── SCR-0051 · Detalle / Reasignación / Respuesta ─────────────────────────
  strSsStatus: 'qd_strSsStatus',                       // FLD-079 · antes qd_estadoSS
  strM1M2Attempts: 'qd_strM1M2Attempts',               // FLD-080 · antes qd_intentosM1M2
  strFilingDate: 'qd_strFilingDate',                   // FLD-081 · antes qd_fechaRadicacion
  blnHasAssignee: 'qd_blnHasAssignee',                 // antes qd_tieneResponsable
  strAssigneeUser: 'qd_strAssigneeUser',               // FLD-083/352 · antes qd_usuarioResponsable (unificado SCR-0051/0052)
  strAssignmentRemarks: 'qd_strAssignmentRemarks',     // FLD-084/353 · antes qd_observacionesAsignacion
  strNeedsOtherAreas: 'qd_strNeedsOtherAreas',         // antes qd_necesitaOtrasAreas (toggle UI)
  strCurrentAssignee: 'qd_strCurrentAssignee',         // FLD-090 · antes qd_responsableActual
  strTargetArea: 'qd_strTargetArea',                   // FLD-091 · antes qd_areaDestino
  strNewAssignee: 'qd_strNewAssignee',                 // FLD-092 · antes qd_nuevoResponsable
  strReassignReason: 'qd_strReassignReason',           // FLD-093 · antes qd_motivoReasignacion
  strReassignRemarks: 'qd_strReassignRemarks',         // FLD-094 · antes qd_observacionesReasignacion
  lstAssignHistory: 'qd_lstAssignHistory',             // FLD-095 · antes qd_historialAsignaciones
  intHelpNumber: 'qd_intHelpNumber',                   // antes qd_numeroAyuda
  strSupport01: 'qd_strSupport01',                     // FLD-113 · antes qd_soporte_01
  strSupport02: 'qd_strSupport02',                     // antes qd_soporte_02
  strSupport03: 'qd_strSupport03',                     // antes qd_soporte_03
  strSupport04: 'qd_strSupport04',                     // antes qd_soporte_04
  strSupport05: 'qd_strSupport05',                     // antes qd_soporte_05
  strSupport06: 'qd_strSupport06',                     // antes qd_soporte_06
  strSupport07: 'qd_strSupport07',                     // antes qd_soporte_07
  strSupport08: 'qd_strSupport08',                     // antes qd_soporte_08
  strSupport09: 'qd_strSupport09',                     // antes qd_soporte_09
  strSupport10: 'qd_strSupport10',                     // antes qd_soporte_10

  // ── SCR-0052 · Respuesta del Área Responsable ─────────────────────────────
  strAreaComment: 'qd_strAreaComment',                 // FLD-354 · antes qd_comentarioArea
  strAreaAttach: 'qd_strAreaAttach',                   // FLD-355 · antes qd_adjuntoArea
  lstHelpResponses: 'qd_lstHelpResponses',             // antes qd_respuestasAyuda
} as const;

// Tipo del valor físico de un campo (para tipar `dependsOn`/parámetros contra el registro).
export type QdFieldName = (typeof QD)[keyof typeof QD];

// ═══════════════════════════════════════════════════════════════════════════
// INTERFAZ MAESTRA — fuente de verdad de TIPOS
// ═══════════════════════════════════════════════════════════════════════════
// Cada pantalla deriva su tipo de formulario con `Pick<QdFields, ...>` (ver
// secciones por pantalla abajo). Los campos con acción/decisión BPMN
// (`qd_strAction`) se tipan aquí como `string` (superset seguro); cada
// pantalla estrecha el tipo con `Omit<Pick<...>, typeof QD.strAction> &
// { [QD.strAction]: AccionXxx }`.

export interface QdFields {
  // SCR-000
  qd_strRequestType: string;
  qd_strFilerRole: string;
  qd_strChannel: string;
  qd_strReceptionPoint: string;
  qd_strReceptionInstance: string;
  qd_strAlliance: string;
  qd_strIdType: string;
  qd_strIdNumber: string;
  qd_strFirstName: string;
  qd_strLastName: string;
  qd_strCompanyName: string;
  qd_strContactFirstName: string;
  qd_strContactLastName: string;
  qd_strPhone: string;
  qd_strEmail: string;
  qd_strPersonType: string;
  qd_strCountryCode: string;
  qd_strDepartment: string;
  qd_strCity: string;
  qd_strAddress: string;
  qd_strSex: string;
  qd_strLgbtiq: string;
  qd_strSpecialCondition: string;
  qd_strSfcProduct: string;
  qd_strPlate: string;
  qd_strProductDetail: string;
  qd_strReply: string;
  qd_strReplyArgument: string;
  qd_strOmbudsmanEscalation: string;
  qd_strResponsableRole: string;
  qd_strCompensation: string;
  qd_strInteraction: string;
  qd_strServiceProvided: string;
  qd_strSfcReason: string;
  qd_strComplaintText: string;
  qd_strAttach01: string;
  qd_strAttach02: string;
  qd_strAttach03: string;
  qd_strAttach04: string;
  qd_strAttach05: string;
  qd_strAdmission: string;
  qd_strControlEntity: string;
  qd_strTutela: string;
  qd_strExpressComplaint: string;
  qd_blnDataAuth: boolean;
  qd_blnCaptcha: boolean;
  qd_strCcEmail: string;
  qd_strSmartSupStatus: string;
  qd_strSfcFilingDate: string;
  qd_strAssigneeRole: string;
  qd_strAssignee: string;
  // Chequeo de casos similares (salida del script 70)
  similar_check_status: string;
  qd_arridSimilarCases: number[];
  qd_intCountSimilarCases: number;
  qd_arrSimilarCases: Record<string, unknown>[];
  qd_strReconsiderationSACEscalation: boolean; // derivada al radicar (ver QD.strReconsiderationSacEscalation)

  // SCR-002
  qd_strBpmCaseId: string;
  qd_strSlaAssigned: string;
  qd_strErrorsJson: string;

  // SCR-003
  qd_strSfcErrorCode: string;
  qd_strAffectedField: string;
  qd_strRejectedValue: string;
  qd_strSfcErrorMessage: string;
  qd_strM1M2AttemptNum: string;
  qd_strRejectionDate: string;
  qd_strFieldCorrection: string;
  qd_strCorrectionJustif: string;
  qd_lstAttemptHistory: IntentoHistorial[];

  // Metadato de flujo compartido
  qd_strAction: string;

  // SCR-004
  qd_strHttpCode: string;
  qd_strErrorType: string;
  qd_strApiTechMessage: string;
  qd_strEndpointCalled: string;
  qd_strPayloadSent: string;
  qd_strAttemptNum: string;
  qd_strRootCause: string;
  qd_strCorrectionApplied: string;
  qd_strPayloadAdjustNeeded: string;

  // SCR-008
  qd_strSfcCode: string;
  qd_strRevisionVersion: string;
  qd_strAssigneeArea: string;
  qd_strDraftDate: string;
  qd_strClientResponse: string;
  qd_strActionsTaken: string;
  qd_strAcknowledgment: string;
  qd_lstSupportAttach: SoporteAdjunto[];
  qd_strSacRemarks: string;
  qd_blnSACApproved: boolean;

  // SCR-009
  qd_strDigitalProduct: string;
  qd_strComplaintStatus: string;
  qd_strFavorability: string;
  qd_strAcceptance: string;
  qd_strRectification: string;
  qd_strWithdrawal: string;
  qd_strMarking: string;
  qd_strFraudRelated: string;
  qd_strFraudType: string;
  qd_strFraudModality: string;
  qd_strClaimedAmount: string;
  qd_strAcknowledgedAmount: string;
  qd_strIncludesComplaintAnnex: string;
  qd_strIncludesReplyAttach: string;
  qd_strFinalReplyPdf: string; // id de archivo PM4 (ver resolveFileId), no el nombre del PDF
  qd_strExtensionDays: string;

  // SCR-010
  qd_strM3ClosureStatus: string;
  qd_strM3ClosureAttempts: string;
  qd_strLastError: string;
  qd_strUpdateDate: string;
  qd_strClosureDate: string;
  qd_strNamingValidation: string;
  qd_strFinalReplyAttach: string;
  qd_strEntityType: string;
  qd_strEntityCode: string;

  // SCR-011
  qd_strExtHttpCode: string;
  qd_strExtErrorType: string;
  qd_strExtTechMessage: string;
  qd_strExtPayload: string;
  qd_strExtAttempt: string;
  qd_strExtRootCause: string;
  qd_strExtCorrection: string;

  // SCR-012
  qd_strExtErrorCode: string;
  qd_strExtAffectedField: string;
  qd_strExtErrorMessage: string;
  qd_strExtCurrentAttempt: string;
  qd_strExtensionReason: string;
  qd_strNewDeadline: string;
  qd_strExtensionCounter: string;
  qd_strExtensionJustif: string;

  // SCR-0051
  qd_strSsStatus: string;
  qd_strM1M2Attempts: string;
  qd_strFilingDate: string;
  qd_blnHasAssignee: boolean;
  qd_strAssigneeUser: string;
  qd_strAssignmentRemarks: string;
  qd_strNeedsOtherAreas: string;
  qd_strCurrentAssignee: string;
  qd_strTargetArea: string;
  qd_strNewAssignee: string;
  qd_strReassignReason: string;
  qd_strReassignRemarks: string;
  qd_lstAssignHistory: AsignacionHistorial[];
  qd_intHelpNumber: number;
  qd_strSupport01: string;
  qd_strSupport02: string;
  qd_strSupport03: string;
  qd_strSupport04: string;
  qd_strSupport05: string;
  qd_strSupport06: string;
  qd_strSupport07: string;
  qd_strSupport08: string;
  qd_strSupport09: string;
  qd_strSupport10: string;

  // SCR-0052
  qd_strAreaComment: string;
  qd_strAreaAttach: string;
  qd_lstHelpResponses: RespuestaAyuda[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN COMPARTIDA (env-derivada, no es un campo de formulario)
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_COUNTRY_CODE = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '170';
export const LOCK_COUNTRY = import.meta.env.VITE_LOCK_COUNTRY !== 'false';

// ═══════════════════════════════════════════════════════════════════════════
// CATÁLOGOS PM4 — deduplicados. Antes cada pantalla tenía su propio
// `COLLECTION_DEFS` re-aliasando un subconjunto de GLOBAL_COLLECTIONS; ahora
// TODAS las pantallas usan directamente estas mismas claves.
// ═══════════════════════════════════════════════════════════════════════════

export const QD_COLLECTIONS = {
  requestType: GLOBAL_COLLECTIONS.requestType,
  filerRole: GLOBAL_COLLECTIONS.filerRole,
  idType: GLOBAL_COLLECTIONS.idType,
  countryCode: GLOBAL_COLLECTIONS.countryCode,
  department: GLOBAL_COLLECTIONS.department,
  city: GLOBAL_COLLECTIONS.city,
  specialCondition: GLOBAL_COLLECTIONS.specialCondition,
  lgbtiq: GLOBAL_COLLECTIONS.lgbtiq,
  sfcProduct: GLOBAL_COLLECTIONS.sfcProduct,
  productDetail: GLOBAL_COLLECTIONS.productDetail,
  sfcReason: GLOBAL_COLLECTIONS.sfcReason, // Legacy (id 17) — usado por SCR-002/0051/0052 en modo display.
  // cat_matriz_motivos (id 45): matriz completa; SCR-000 deriva en cliente momento →
  // servicio → motivo (ver SeccionDetalleQueja).
  matrixMotivos: GLOBAL_COLLECTIONS.matrixMotivos,
  admission: GLOBAL_COLLECTIONS.admission,
  sex: GLOBAL_COLLECTIONS.sex,
  controlEntity: GLOBAL_COLLECTIONS.controlEntity,
  tutela: GLOBAL_COLLECTIONS.tutela,
  expressComplaint: GLOBAL_COLLECTIONS.expressComplaint,
  receptionInstance: GLOBAL_COLLECTIONS.receptionInstance,
  receptionPoint: GLOBAL_COLLECTIONS.receptionPoint,
  personType: GLOBAL_COLLECTIONS.personType,
  channel: GLOBAL_COLLECTIONS.channel,
  alliance: GLOBAL_COLLECTIONS.alliance,
  digitalProduct: GLOBAL_COLLECTIONS.digitalProduct,
  complaintStatus: GLOBAL_COLLECTIONS.complaintStatus,
  favorability: GLOBAL_COLLECTIONS.favorability,
  acceptance: GLOBAL_COLLECTIONS.acceptance,
  rectification: GLOBAL_COLLECTIONS.rectification,
  withdrawal: GLOBAL_COLLECTIONS.withdrawal,
  marking: GLOBAL_COLLECTIONS.marking,
  fraudType: GLOBAL_COLLECTIONS.fraudType,
  fraudModality: GLOBAL_COLLECTIONS.fraudModality,
  area: GLOBAL_COLLECTIONS.area,
  areaUsers: GLOBAL_COLLECTIONS.areaUsers,
  reassignReason: GLOBAL_COLLECTIONS.reassignReason,
  extensionReason: GLOBAL_COLLECTIONS.extensionReason,
  emailTemplates: GLOBAL_COLLECTIONS.emailTemplates, // id 46 — plantillas HTML de correos BPM (SCR-0051 Vista Previa)
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// OPCIONES ESTÁTICAS COMPARTIDAS
// ═══════════════════════════════════════════════════════════════════════════

// Sí/No genérico — usado por SCR-000 (réplica), SCR-004, SCR-009, SCR-010, SCR-0051.
export const OPTIONS_SI_NO = [
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// VALORES POR DEFECTO GLOBALES — solo los idénticos en todas las pantallas
// donde aparecen (placeholders "de back", vacíos hasta que la integración
// SFC/watcher los resuelve).
// ═══════════════════════════════════════════════════════════════════════════

export const QD_GLOBAL_DEFAULTS: Partial<QdFields> = {
  [QD.strAddress]: '',            // FLD-319 — Back, default vacío (pendiente API SFC)
  [QD.strSex]: '',                // FLD-320 — Back, oculto en SCR-000, resuelto desde CAT-SEXO ("No Aplica")
  [QD.strLgbtiq]: '',             // FLD-321 — Back, oculto en SCR-000, resuelto desde CAT-LGBTIQ ("No")
  [QD.strSpecialCondition]: '',   // FLD-322 — Back, oculto, resuelto desde CAT-COND-ESP ("No aplica")
  [QD.strAdmission]: '',          // FLD-331 — Back, resuelto desde CAT-ADMISION si rol ≠ Defensor
  [QD.strControlEntity]: '',      // FLD-332 — Back, resuelto desde CAT-ENTE ("Otros")
  [QD.strTutela]: '',             // FLD-333 — Back, resuelto desde CAT-TUTELA ("No")
  [QD.strExpressComplaint]: '',   // FLD-334 — Back, resuelto desde CAT-EXPRES ("No")
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-000 — Formulario de Radicación PQRS (Autoservicio)
// ═══════════════════════════════════════════════════════════════════════════

export const SCR000_WEB_ENTRY_PROCESS_ID = Number(import.meta.env.WEB_ENTRY_PROCESS_ID || 31);
export const SCR000_WEB_ENTRY_EVENT_ID = import.meta.env.WEB_ENTRY_EVENT_ID || 'node_661';

// Script PM4 que detecta casos similares/duplicados (motivo + producto + identificación).
// Se ejecuta al enviar el formulario (post-captcha, pre-radicación) como watcher.
// https://cozurich.dev.cloud.processmaker.net/designer/scripts/70/builder
export const SCR000_SIMILAR_CASES_SCRIPT_ID = Number(import.meta.env.VITE_SIMILAR_CASES_SCRIPT_ID || 70);

export const SCR000_ADJUNTO_KEYS = [
  QD.strAttach01, QD.strAttach02, QD.strAttach03, QD.strAttach04, QD.strAttach05,
] as const;

export type CrearRecibirQuejaFormData = Pick<QdFields,
  | typeof QD.strRequestType | typeof QD.strFilerRole | typeof QD.strChannel
  | typeof QD.strReceptionPoint | typeof QD.strReceptionInstance | typeof QD.strAlliance
  | typeof QD.strIdType | typeof QD.strIdNumber | typeof QD.strFirstName | typeof QD.strLastName
  | typeof QD.strCompanyName | typeof QD.strContactFirstName | typeof QD.strContactLastName
  | typeof QD.strPhone | typeof QD.strEmail | typeof QD.strPersonType | typeof QD.strCountryCode
  | typeof QD.strDepartment | typeof QD.strCity | typeof QD.strAddress | typeof QD.strSex
  | typeof QD.strLgbtiq | typeof QD.strSpecialCondition | typeof QD.strSfcProduct | typeof QD.strPlate
  | typeof QD.strProductDetail | typeof QD.strReply | typeof QD.strReplyArgument
  | typeof QD.strOmbudsmanEscalation | typeof QD.strResponsableRole | typeof QD.strCompensation | typeof QD.strSlaAssigned
  | typeof QD.strInteraction | typeof QD.strServiceProvided | typeof QD.strFraudRelated
  | typeof QD.strSfcReason | typeof QD.strComplaintText
  | typeof QD.strAttach01 | typeof QD.strAttach02 | typeof QD.strAttach03 | typeof QD.strAttach04 | typeof QD.strAttach05
  | typeof QD.strAdmission | typeof QD.strControlEntity | typeof QD.strTutela | typeof QD.strExpressComplaint
  | typeof QD.blnDataAuth | typeof QD.blnCaptcha | typeof QD.strCcEmail
  | typeof QD.strSmartSupStatus | typeof QD.strSfcFilingDate | typeof QD.strAssigneeRole | typeof QD.strAssignee
> & Partial<Pick<QdFields,
  // Salida del watcher de casos similares (script 70), fusionada en el envío.
  | typeof QD.strSimilarCheckStatus | typeof QD.arridSimilarCases
  | typeof QD.intCountSimilarCases | typeof QD.arrSimilarCases
  // Derivada al radicar (réplica "Sí" + sin advertencia de casos similares).
  | typeof QD.strReconsiderationSacEscalation
>>;

export const SCR000_DEFAULTS = {
  ...QD_GLOBAL_DEFAULTS,
  // S1 — Tipo de Solicitud y Rol
  [QD.strRequestType]: '',
  [QD.strFilerRole]: '',
  [QD.strChannel]: '',
  [QD.strReceptionPoint]: '',
  [QD.strReceptionInstance]: '',
  [QD.strAlliance]: '',        // Solo visible/enviado si rol = Empleado Zurich (blnIsZurichEmp)
  // S2 — Datos del Consumidor Financiero
  [QD.strIdType]: '',
  [QD.strIdNumber]: '',
  [QD.strFirstName]: '',       // Solo visible si persona natural
  [QD.strLastName]: '',        // Solo visible si persona natural
  [QD.strCompanyName]: '',     // Solo visible si persona jurídica
  [QD.strContactFirstName]: '', // Solo visible si persona jurídica
  [QD.strContactLastName]: '', // Solo visible si persona jurídica
  [QD.strPhone]: '',
  [QD.strEmail]: '',
  [QD.strPersonType]: '',
  [QD.strCountryCode]: DEFAULT_COUNTRY_CODE, // RUL-000-10
  [QD.strDepartment]: '',
  [QD.strCity]: '',
  // S3 — Detalle de la Queja
  [QD.strSfcProduct]: '',
  [QD.strProductDetail]: '',
  [QD.strReply]: 'NO',
  [QD.strReplyArgument]: '',   // Solo visible si strReply = 'SI'
  [QD.strOmbudsmanEscalation]: '', // Extraído de cat_matriz_motivos.escalamientoAdministrador
  [QD.strPlate]: '',          // Anexo02 #25 — solo se llena si producto = Autos
  [QD.strInteraction]: '',    // Anexo02 #30 — cascada cat_matriz_motivos
  [QD.strServiceProvided]: '', // Anexo02 #31 — cascada cat_matriz_motivos (Asistencias)
  [QD.strResponsableRole]: '', // Extraído de cat_matriz_motivos.rolResponsable al completar momento/servicio/motivo
  [QD.strCompensation]: '',    // Extraído de cat_matriz_motivos.resarcimientoAdministrador
  [QD.strSlaAssigned]: '',     // Extraído de cat_matriz_motivos.sla
  [QD.strFraudRelated]: 'NO',  // Derivado de cat_matriz_motivos.relacionFraude (SI/NO) según el motivo
  [QD.strSfcReason]: '',
  [QD.strComplaintText]: '',
  [QD.strAttach01]: '',
  [QD.strAttach02]: '',        // Solo se registra al agregar el 2do documento (DocSupportUploader)
  [QD.strAttach03]: '',        // Solo se registra al agregar el 3er documento
  [QD.strAttach04]: '',        // Solo se registra al agregar el 4to documento
  [QD.strAttach05]: '',        // Solo se registra al agregar el 5to documento
  // S4 — Autorización y Envío
  [QD.blnDataAuth]: false,
  [QD.blnCaptcha]: false,
  [QD.strCcEmail]: '',
  // S5/S6 — Estado ante SFC / Responsable (post-radicación, back; solo visibles si aplica)
  [QD.strSmartSupStatus]: '',
  [QD.strSfcFilingDate]: '',
  [QD.strAssigneeRole]: '',
  [QD.strAssignee]: '',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SCR-002 — Corrección de Datos del Formulario
// ═══════════════════════════════════════════════════════════════════════════

export type CorregirDatosFormData = Pick<QdFields,
  | typeof QD.strBpmCaseId | typeof QD.strChannel | typeof QD.strSlaAssigned
  | typeof QD.strFirstName | typeof QD.strLastName | typeof QD.strCompanyName
  | typeof QD.strIdType | typeof QD.strIdNumber | typeof QD.strEmail | typeof QD.strPersonType
  | typeof QD.strCountryCode | typeof QD.strDepartment | typeof QD.strCity
  | typeof QD.strSfcProduct | typeof QD.strSfcReason | typeof QD.strRequestType
  | typeof QD.strReceptionInstance | typeof QD.strReceptionPoint | typeof QD.strAdmission
  | typeof QD.strControlEntity | typeof QD.strComplaintText | typeof QD.strErrorsJson
>;

// Sin este objeto, react-hook-form no registra ningún campo hasta que
// SeccionErroresValidacion monta su Controller (solo ocurre si el campo aparece en
// qd_strErrorsJson) — cualquier campo no listado como erróneo quedaría ausente del
// payload de completeTask/saveDraft en vez de viajar con su valor precargado.
export const SCR002_DEFAULTS: Partial<CorregirDatosFormData> = {
  [QD.strBpmCaseId]: '',
  [QD.strChannel]: '',
  [QD.strSlaAssigned]: '',
  [QD.strFirstName]: '',
  [QD.strLastName]: '',
  [QD.strCompanyName]: '',
  [QD.strIdType]: '',
  [QD.strIdNumber]: '',
  [QD.strEmail]: '',
  [QD.strPersonType]: '',
  [QD.strCountryCode]: '',
  [QD.strDepartment]: '',
  [QD.strCity]: '',
  [QD.strSfcProduct]: '',
  [QD.strSfcReason]: '',
  [QD.strRequestType]: '',
  [QD.strReceptionInstance]: '',
  [QD.strReceptionPoint]: '',
  [QD.strAdmission]: '',
  [QD.strControlEntity]: '',
  [QD.strComplaintText]: '',
  [QD.strErrorsJson]: '',
};

// Fallback de desarrollo (se usa cuando task.data no tiene qd_strErrorsJson)
export const SCR002_ERRORES_EJEMPLO: CampoConError[] = [
  {
    campo: QD.strEmail,
    fldId: 'FLD-007',
    etiqueta: 'Correo Electrónico',
    valorRechazado: 'juan.perez@',
    mensajeError: 'El correo no tiene formato válido (RFC 5321). Formato esperado: usuario@dominio.com',
  },
  {
    campo: QD.strIdNumber,
    fldId: 'FLD-006',
    etiqueta: 'Número de Identificación',
    valorRechazado: '12 34 56',
    mensajeError: 'Contiene espacios. Solo se aceptan dígitos sin separadores. Mín. 6, máx. 15 caracteres.',
  },
  {
    campo: QD.strCity,
    fldId: 'FLD-011',
    etiqueta: 'Municipio',
    valorRechazado: '',
    mensajeError: 'El municipio seleccionado no pertenece al departamento configurado. Seleccione un municipio de la lista habilitada.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SCR-003 — Corrección Error Funcional M1/M2
// ═══════════════════════════════════════════════════════════════════════════

export const SCR003_UMBRAL_INTENTOS = 3; // RUL-003-02

// CORREGIR_REENVIAR → ACT-003-01 (ejecuta SP1-T02, reenvío M2)
// ESCALAR_SOPORTE   → ACT-003-02 (deriva a Analista Técnico)
export type AccionErrorFuncional = 'CORREGIR_REENVIAR' | 'ESCALAR_SOPORTE';

export type CorreccionErrorFuncionalFormData = Omit<Pick<QdFields,
  | typeof QD.strSfcErrorCode | typeof QD.strAffectedField | typeof QD.strRejectedValue
  | typeof QD.strSfcErrorMessage | typeof QD.strM1M2AttemptNum | typeof QD.strRejectionDate
  | typeof QD.strFieldCorrection | typeof QD.strCorrectionJustif | typeof QD.lstAttemptHistory
  | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionErrorFuncional };

export const SCR003_DEFAULTS: Partial<CorreccionErrorFuncionalFormData> = {
  [QD.strSfcErrorCode]: '',
  [QD.strAffectedField]: '',
  [QD.strRejectedValue]: '',
  [QD.strSfcErrorMessage]: '',
  [QD.strM1M2AttemptNum]: '',
  [QD.strRejectionDate]: '',
  [QD.strFieldCorrection]: '',
  [QD.strCorrectionJustif]: '',
  [QD.lstAttemptHistory]: [],
  [QD.strAction]: 'CORREGIR_REENVIAR',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-004 — Revisión Error Técnico API
// ═══════════════════════════════════════════════════════════════════════════

// AUTORIZAR_REENVIO → ACT-004-01 (ejecuta SP1-T02) · ESCALAR_PROVEEDOR → ACT-004-02.
export type AccionErrorTecnico = 'AUTORIZAR_REENVIO' | 'ESCALAR_PROVEEDOR';

export type RevisionErrorTecnicoApiFormData = Omit<Pick<QdFields,
  | typeof QD.strHttpCode | typeof QD.strErrorType | typeof QD.strApiTechMessage
  | typeof QD.strEndpointCalled | typeof QD.strPayloadSent | typeof QD.strAttemptNum
  | typeof QD.strRootCause | typeof QD.strCorrectionApplied | typeof QD.strPayloadAdjustNeeded
  | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionErrorTecnico };

export const SCR004_DEFAULTS: Partial<RevisionErrorTecnicoApiFormData> = {
  [QD.strHttpCode]: '',
  [QD.strErrorType]: '',
  [QD.strApiTechMessage]: '',
  [QD.strEndpointCalled]: '',
  [QD.strPayloadSent]: '',
  [QD.strAttemptNum]: '',
  [QD.strRootCause]: '',
  [QD.strCorrectionApplied]: '',
  [QD.strPayloadAdjustNeeded]: 'NO',
  [QD.strAction]: 'AUTORIZAR_REENVIO',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-008 — Revisión Respuesta SAC
// ═══════════════════════════════════════════════════════════════════════════

export const SCR008_SLA_UMBRAL_CRITICO = 3; // RUL-008-02 (slaRestante <= 3)

export type AccionRevisionSAC = 'APROBAR' | 'DEVOLVER' | 'REASIGNAR';

export type RevisionRespuestaSacFormData = Omit<Pick<QdFields,
  | typeof QD.strSfcCode | typeof QD.strSlaAssigned | typeof QD.strRevisionVersion
  | typeof QD.strAssigneeArea | typeof QD.strDraftDate
  // Clasificación Regulatoria + Descripción de la Queja (solo lectura, referencia
  // heredada de M1; mismo bloque que muestra SCR-0051).
  | typeof QD.strChannel | typeof QD.strReceptionInstance | typeof QD.strAdmission | typeof QD.strControlEntity
  | typeof QD.strSfcProduct | typeof QD.strInteraction | typeof QD.strSfcReason | typeof QD.strComplaintText
  // Datos del cliente / caso necesarios para la Vista Previa de la carta de respuesta
  // final (misma plantilla de correo 09/10 que SCR-0051).
  | typeof QD.strBpmCaseId | typeof QD.strRequestType | typeof QD.strEmail | typeof QD.strFavorability
  | typeof QD.strFirstName | typeof QD.strLastName | typeof QD.strCompanyName
  | typeof QD.strClientResponse | typeof QD.strActionsTaken | typeof QD.strAcknowledgment | typeof QD.lstSupportAttach
  | typeof QD.strSacRemarks | typeof QD.blnSacApproved | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionRevisionSAC };

export const SCR008_DEFAULTS: Partial<RevisionRespuestaSacFormData> = {
  [QD.strSfcCode]: '',
  [QD.strSlaAssigned]: '',
  [QD.strRevisionVersion]: '',
  [QD.strAssigneeArea]: '',
  [QD.strDraftDate]: '',
  // Clasificación Regulatoria + Descripción de la Queja (solo lectura).
  [QD.strChannel]: '',
  [QD.strReceptionInstance]: '',
  [QD.strAdmission]: '',
  [QD.strControlEntity]: '',
  [QD.strSfcProduct]: '',
  [QD.strInteraction]: '',
  [QD.strSfcReason]: '',
  [QD.strComplaintText]: '',
  // Datos del cliente / caso para la Vista Previa de la carta de respuesta final.
  [QD.strBpmCaseId]: '',
  [QD.strRequestType]: '',
  [QD.strEmail]: '',
  [QD.strFavorability]: '',
  [QD.strFirstName]: '',
  [QD.strLastName]: '',
  [QD.strCompanyName]: '',
  [QD.strClientResponse]: '',
  [QD.strActionsTaken]: '',
  [QD.strAcknowledgment]: '',
  [QD.lstSupportAttach]: [],
  [QD.strSacRemarks]: '',
  [QD.blnSacApproved]: false,
  [QD.strAction]: 'APROBAR',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-009 — Formulario Superintendencia
// ═══════════════════════════════════════════════════════════════════════════

// ENVIAR_SFC (ACT-009-03, fusionado desde la ex SCR-010) dispara el envío del
// cierre regulatorio M3 a SmartSupervision; también sirve de reenvío tras un
// rechazo (400). GUARDAR/GUARDAR_BORRADOR mantienen su semántica original.
export type AccionFormularioSFC = 'GUARDAR' | 'GUARDAR_BORRADOR' | 'ENVIAR_SFC';

// Nota: SCR-009 muestra Sexo y LGBTIQ+ como seleccionables (un ZdsSelect por
// campo: muestra la descripción, guarda el código; su _desc compañera viaja
// sola vía useSyncDesc, sin campo propio) precargados con el valor que llega
// del caso (default "No Aplica"/"No" fijado en SCR-000); no bloquean el
// guardado. Producto
// Digital y el resto de Condición de la Queja siguen siendo "Back"/"Automático"
// y se muestran en solo lectura. Los campos que sí condicionan el guardado
// son: Condición Especial (Front), los indicadores de anexos y, si
// strFraudRelated='SI', Tipo/Modalidad/Montos de fraude (editables por el
// Analista SAC, RUL-009-01) — ver SeccionFraudeAnexos.tsx.

export type FormularioSuperintendenciaFormData = Omit<Pick<QdFields,
  | typeof QD.strSfcCode | typeof QD.strChannel | typeof QD.strSfcProduct | typeof QD.strSfcReason
  | typeof QD.strAdmission | typeof QD.strControlEntity
  | typeof QD.strSex | typeof QD.strLgbtiq | typeof QD.strSpecialCondition | typeof QD.strDigitalProduct
  | typeof QD.strComplaintStatus | typeof QD.strFavorability | typeof QD.strAcceptance
  | typeof QD.strRectification | typeof QD.strWithdrawal | typeof QD.strTutela
  | typeof QD.strMarking | typeof QD.strExpressComplaint
  | typeof QD.strFraudRelated | typeof QD.strFraudType | typeof QD.strFraudModality
  | typeof QD.strClaimedAmount | typeof QD.strAcknowledgedAmount
  | typeof QD.strIncludesComplaintAnnex | typeof QD.strIncludesReplyAttach
  | typeof QD.strFinalReplyPdf | typeof QD.strExtensionDays
  // Cierre Regulatorio M3 (fusionado desde la ex SCR-010): estado del envío a la
  // SFC, fechas de cierre y datos de entidad — todos "Back", solo se reenvían.
  | typeof QD.strM3ClosureStatus | typeof QD.strM3ClosureAttempts | typeof QD.strLastError
  | typeof QD.strUpdateDate | typeof QD.strClosureDate | typeof QD.strFinalReplyAttach
  | typeof QD.strEntityType | typeof QD.strEntityCode
  | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionFormularioSFC };

// Defaults "Back" que el front GARANTIZA al llegar a SCR-009: si el proceso no
// los trae (o los manda vacíos), se rellenan con estos valores para que la
// variable exista y viaje al guardar. Valores por default del Excel PQRS V3.0.
// ⚠ Sexo ("No aplica"), LGBTIQ+ ("No aplica"), Tutela ("No") y Ente de Control
// ("Otros") NO se incluyen: su código de catálogo está pendiente de confirmación
// con TI (Homologación SFC = "No existe"); los llena el back para no arriesgar un
// código inválido en el envío a la SFC.
export const SCR009_BACK_DEFAULTS = {
  [QD.strComplaintStatus]: '4',  // default "Cerrada" = código '4' de la colección 42 (1=Recibida, 2=Abierta, 4=Cerrada)
  [QD.strAcceptance]: '1',       // Excel #51 · Lista_Aceptación (por default "1")
  [QD.strRectification]: '1',    // Excel #52 · Lista_Rectificación (queda por default)
  [QD.strWithdrawal]: '2',       // Excel #53 · Lista_Desistimiento (queda por default)
  [QD.strDigitalProduct]: '2',   // Excel #54 · default "No" = código '2' de la colección 25 (1=Sí, 2=No)
} as const;

// Constantes de entidad para el envío a la SFC en Momento III (Excel Cierre
// #46/#47), fusionadas desde la ex SCR-010. Son "Back": si el proceso no las
// trae en task.data, el front las inyecta con estos valores por default para
// que viajen y se guarden en la data del request.
export const SCR009_DEFAULT_ENTITY_TYPE = '13'; // Excel Cierre #46 · tipo entidad
export const SCR009_DEFAULT_ENTITY_CODE = '9';  // Excel Cierre #47 · código entidad

export const SCR009_DEFAULTS: Partial<FormularioSuperintendenciaFormData> = {
  [QD.strSfcCode]: '', [QD.strChannel]: '', [QD.strSfcProduct]: '', [QD.strSfcReason]: '',
  [QD.strAdmission]: '', [QD.strControlEntity]: '',
  [QD.strSex]: '', [QD.strLgbtiq]: '', [QD.strSpecialCondition]: '',
  [QD.strFavorability]: '',
  ...SCR009_BACK_DEFAULTS,  // incluye complaintStatus='4', digitalProduct='2', aceptación/rectificación/desistimiento
  [QD.strTutela]: '', [QD.strMarking]: '', [QD.strExpressComplaint]: '',
  [QD.strFraudRelated]: 'NO',
  [QD.strFraudType]: '', [QD.strFraudModality]: '', [QD.strClaimedAmount]: '', [QD.strAcknowledgedAmount]: '',
  [QD.strIncludesComplaintAnnex]: 'SI', [QD.strIncludesReplyAttach]: 'SI', [QD.strExtensionDays]: '0',
  [QD.strFinalReplyPdf]: '',
  // Cierre Regulatorio M3 (fusionado desde la ex SCR-010) — todos "Back".
  [QD.strM3ClosureStatus]: '', [QD.strM3ClosureAttempts]: '0', [QD.strLastError]: '',
  [QD.strUpdateDate]: '', [QD.strClosureDate]: '', [QD.strFinalReplyAttach]: 'SI',
  [QD.strEntityType]: SCR009_DEFAULT_ENTITY_TYPE, [QD.strEntityCode]: SCR009_DEFAULT_ENTITY_CODE,
  [QD.strAction]: 'GUARDAR',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-010 — Cierre Regulatorio Momento 3  (FUSIONADA en SCR-009)
// ═══════════════════════════════════════════════════════════════════════════
// La pantalla de cierre M3 se consolidó dentro de la SCR-009 (Formulario
// Superintendencia): sus campos, la sección de estado del envío a SFC y la
// acción de envío ahora viven en FormularioSuperintendenciaFormData /
// SCR009_DEFAULTS / AccionFormularioSFC ('ENVIAR_SFC'). Ver la carpeta
// COL_QD_SCR-009_Formulario_Superintendencia.

// ═══════════════════════════════════════════════════════════════════════════
// SCR-011 — Revisión Error Técnico Prórroga
// ═══════════════════════════════════════════════════════════════════════════

// AUTORIZAR_REENVIO → ACT-011-01 (ejecuta SP4-T01) · ESCALAR_PROVEEDOR → ACT-011-02.
export type AccionErrorTecnicoProrroga = 'AUTORIZAR_REENVIO' | 'ESCALAR_PROVEEDOR';

export type RevisionErrorTecnicoProrrogaFormData = Omit<Pick<QdFields,
  | typeof QD.strExtHttpCode | typeof QD.strExtErrorType | typeof QD.strExtTechMessage
  | typeof QD.strExtPayload | typeof QD.strExtAttempt | typeof QD.strExtRootCause | typeof QD.strExtCorrection
  | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionErrorTecnicoProrroga };

export const SCR011_DEFAULTS: Partial<RevisionErrorTecnicoProrrogaFormData> = {
  [QD.strExtHttpCode]: '',
  [QD.strExtErrorType]: '',
  [QD.strExtTechMessage]: '',
  [QD.strExtPayload]: '',
  [QD.strExtAttempt]: '',
  [QD.strExtRootCause]: '',
  [QD.strExtCorrection]: '',
  [QD.strAction]: 'AUTORIZAR_REENVIO',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-012 — Corrección Error Funcional Prórroga
// ═══════════════════════════════════════════════════════════════════════════

// REENVIAR → ACT-012-01 (ejecuta SP4-T01) · CANCELAR → ACT-012-02.
export type AccionErrorFuncionalProrroga = 'REENVIAR' | 'CANCELAR';

export type ErrorFuncionalProrrogaFormData = Omit<Pick<QdFields,
  | typeof QD.strExtErrorCode | typeof QD.strExtAffectedField | typeof QD.strExtErrorMessage
  | typeof QD.strExtCurrentAttempt | typeof QD.strExtensionReason | typeof QD.strNewDeadline
  | typeof QD.strExtensionCounter | typeof QD.strExtensionJustif | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionErrorFuncionalProrroga };

export const SCR012_DEFAULTS: Partial<ErrorFuncionalProrrogaFormData> = {
  [QD.strExtErrorCode]: '',
  [QD.strExtAffectedField]: '',
  [QD.strExtErrorMessage]: '',
  [QD.strExtCurrentAttempt]: '',
  [QD.strExtensionReason]: '',
  [QD.strNewDeadline]: '',
  [QD.strExtensionCounter]: '',
  [QD.strExtensionJustif]: '',
  [QD.strAction]: 'REENVIAR',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-0051 — Detalle / Reasignación / Respuesta
// ═══════════════════════════════════════════════════════════════════════════

export const SCR0051_MAX_AYUDANTES = 4;       // RUL-0051-08
export const SCR0051_MAX_SOPORTES = 10;       // FLD-113
export const SCR0051_SLA_UMBRAL_PRORROGA = 2; // RUL-0051-03 (slaRestante <= 2)

export type AccionFlujoCombinado =
  | 'CONFIRMAR_ASIGNACION'   // ACT-0051-01 → SP2-T01, estado 'En análisis'
  | 'AYUDA'                  // ACT-0051-03 → solicitar ayuda a otra área (S6)
  | 'SOLICITAR_PRORROGA'     // ACT-0051-04 → SP4-T01
  | 'GUARDAR_BORRADOR'       // ACT-0051-07
  | 'ENVIAR';                // ACT-0051-08 → SP2-T04, estado 'En revisión SAC'

// CAT-FAVOR (Pendiente TI). Alimenta qd_strFavorability (FLD-151/177/350, unificado
// SCR-0051/009/010) — códigos 1/3 según CAT-FAVORAB, para que SCR-009/010 resuelvan
// el mismo valor con su catálogo dinámico (QD_COLLECTIONS.favorability).
export const SCR0051_OPTIONS_FAVOR = [
  { value: '1', label: 'Cliente' },
  { value: '3', label: 'Compañía' },
] as const;

export const SCR0051_ADJUNTO_KEYS = [
  QD.strSupport01, QD.strSupport02, QD.strSupport03, QD.strSupport04, QD.strSupport05,
  QD.strSupport06, QD.strSupport07, QD.strSupport08, QD.strSupport09, QD.strSupport10,
] as const;

export type DetalleReasignacionRespuestaFormData = Omit<Pick<QdFields,
  | typeof QD.strBpmCaseId | typeof QD.strSfcCode
  | typeof QD.strFirstName | typeof QD.strLastName | typeof QD.strCompanyName
  | typeof QD.strIdType | typeof QD.strIdNumber | typeof QD.strEmail | typeof QD.strPersonType
  | typeof QD.strRequestType | typeof QD.strInteraction | typeof QD.strServiceProvided | typeof QD.strPlate
  | typeof QD.strChannel | typeof QD.strSfcProduct | typeof QD.strSfcReason
  // Regulatorios derivados de cat_matriz_motivos al re-editar la clasificación en M3 (SCR-0051).
  // SLA y rol responsable NO se recalculan aquí (decisión de negocio) aunque viajen en el form.
  | typeof QD.strOmbudsmanEscalation | typeof QD.strCompensation | typeof QD.strFraudRelated
  // Marcación: si la clasificación regulatoria cambia respecto a la original, se fuerza a '2'
  // para que SCR-009 la traiga preelegida (sin campo visible en SCR-0051, viaja en el payload).
  | typeof QD.strMarking
  | typeof QD.strReceptionInstance | typeof QD.strReceptionPoint | typeof QD.strAdmission | typeof QD.strControlEntity
  | typeof QD.strComplaintText
  | typeof QD.strSsStatus | typeof QD.strM1M2Attempts | typeof QD.strFilingDate | typeof QD.strSlaAssigned
  | typeof QD.blnHasAssignee | typeof QD.strAssigneeArea | typeof QD.strAssigneeUser | typeof QD.strAssignmentRemarks
  | typeof QD.strNeedsOtherAreas | typeof QD.strCurrentAssignee | typeof QD.strTargetArea | typeof QD.strNewAssignee
  | typeof QD.strReassignReason | typeof QD.strReassignRemarks
  | typeof QD.lstAssignHistory | typeof QD.intHelpNumber
  | typeof QD.strClientResponse | typeof QD.strActionsTaken | typeof QD.strAcknowledgment | typeof QD.strSacRemarks
  | typeof QD.strSupport01 | typeof QD.strSupport02 | typeof QD.strSupport03 | typeof QD.strSupport04 | typeof QD.strSupport05
  | typeof QD.strSupport06 | typeof QD.strSupport07 | typeof QD.strSupport08 | typeof QD.strSupport09 | typeof QD.strSupport10
  | typeof QD.strFavorability | typeof QD.strExtensionReason
  | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionFlujoCombinado };

export const SCR0051_DEFAULTS: Partial<DetalleReasignacionRespuestaFormData> = {
  [QD.strBpmCaseId]: '',
  [QD.strSfcCode]: '',
  [QD.strFirstName]: '',
  [QD.strLastName]: '',
  [QD.strCompanyName]: '',
  [QD.strIdType]: '',
  [QD.strIdNumber]: '',
  [QD.strEmail]: '',
  [QD.strPersonType]: '',
  [QD.strRequestType]: '',
  [QD.strInteraction]: '',
  [QD.strServiceProvided]: '',
  [QD.strPlate]: '',
  [QD.strChannel]: '',
  [QD.strSfcProduct]: '',
  [QD.strSfcReason]: '',
  [QD.strOmbudsmanEscalation]: '', // Recalculado desde cat_matriz_motivos.escalamientoAdministrador al re-editar el motivo
  [QD.strCompensation]: '',        // Recalculado desde cat_matriz_motivos.resarcimientoAdministrador
  [QD.strFraudRelated]: 'NO',      // Recalculado desde cat_matriz_motivos.relacionFraude (SI/NO)
  [QD.strMarking]: '',             // '2' si la clasificación regulatoria cambia vs. la original (para SCR-009)
  [QD.strReceptionInstance]: '',
  [QD.strReceptionPoint]: '',
  [QD.strAdmission]: '',
  [QD.strControlEntity]: '',
  [QD.strComplaintText]: '',
  [QD.strSsStatus]: '',
  [QD.strM1M2Attempts]: '',
  [QD.strFilingDate]: '',
  [QD.strSlaAssigned]: '',
  [QD.blnHasAssignee]: false,
  [QD.strNeedsOtherAreas]: 'NO',
  [QD.strAssigneeArea]: '',
  [QD.strAssigneeUser]: '',
  [QD.strAssignmentRemarks]: '',
  [QD.strCurrentAssignee]: '',
  [QD.strTargetArea]: '',
  [QD.strNewAssignee]: '',
  [QD.strReassignReason]: '',
  [QD.strReassignRemarks]: '',
  [QD.lstAssignHistory]: [],
  [QD.intHelpNumber]: 0,
  [QD.strClientResponse]: '',
  [QD.strActionsTaken]: '',
  [QD.strAcknowledgment]: '',
  [QD.strSacRemarks]: '',
  [QD.strSupport01]: '',
  [QD.strSupport02]: '',       // Solo se registra al agregar el 2do soporte (DocSupportUploader)
  [QD.strSupport03]: '',
  [QD.strSupport04]: '',
  [QD.strSupport05]: '',
  [QD.strSupport06]: '',
  [QD.strSupport07]: '',
  [QD.strSupport08]: '',
  [QD.strSupport09]: '',
  [QD.strSupport10]: '',
  [QD.strFavorability]: '',
  [QD.strExtensionReason]: '',
  [QD.strAction]: 'ENVIAR',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-0052 — Respuesta del Área Responsable
// ═══════════════════════════════════════════════════════════════════════════

export const SCR0052_MAX_ADJUNTO_MB = 10; // FLD-355 (máx 10 MB)

export type AccionRespuestaArea = 'ENVIAR' | 'GUARDAR_BORRADOR';

export type RespuestaAreaResponsableFormData = Omit<Pick<QdFields,
  | typeof QD.strFirstName | typeof QD.strLastName | typeof QD.strCompanyName
  | typeof QD.strIdType | typeof QD.strIdNumber | typeof QD.strEmail | typeof QD.strPersonType
  | typeof QD.strChannel | typeof QD.strSfcProduct | typeof QD.strSfcReason
  | typeof QD.strReceptionInstance | typeof QD.strReceptionPoint | typeof QD.strAdmission | typeof QD.strControlEntity
  | typeof QD.strComplaintText
  | typeof QD.strAssigneeArea | typeof QD.strAssigneeUser | typeof QD.strAssignmentRemarks
  | typeof QD.strAreaComment | typeof QD.strAreaAttach
  | typeof QD.intHelpNumber | typeof QD.lstAssignHistory | typeof QD.lstHelpResponses
  | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionRespuestaArea };

export const SCR0052_DEFAULTS: Partial<RespuestaAreaResponsableFormData> = {
  [QD.strFirstName]: '',
  [QD.strLastName]: '',
  [QD.strCompanyName]: '',
  [QD.strIdType]: '',
  [QD.strIdNumber]: '',
  [QD.strEmail]: '',
  [QD.strPersonType]: '',
  [QD.strChannel]: '',
  [QD.strSfcProduct]: '',
  [QD.strSfcReason]: '',
  [QD.strReceptionInstance]: '',
  [QD.strReceptionPoint]: '',
  [QD.strAdmission]: '',
  [QD.strControlEntity]: '',
  [QD.strComplaintText]: '',
  [QD.strAssigneeArea]: '',
  [QD.strAssigneeUser]: '',
  [QD.strAssignmentRemarks]: '',
  [QD.strAreaComment]: '',
  [QD.strAreaAttach]: '',
  [QD.intHelpNumber]: 0,
  [QD.lstAssignHistory]: [],
  [QD.lstHelpResponses]: [],
  [QD.strAction]: 'ENVIAR',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-013 — Dashboard — Gestión de Casos
// ═══════════════════════════════════════════════════════════════════════════

// Umbral de días hábiles para clasificar un caso abierto como "Próximo a vencer" (KPI warn).
export const SCR013_SLA_UMBRAL_PROXIMO = 3;

// Tamaño de página de la tabla de casos (mockup muestra 8 filas por página).
export const SCR013_PAGE_SIZE = 8;

// Proceso PM4 de Gestión de Quejas Directas (mismo default que el Web Entry de SCR-000).
export const SCR013_PROCESS_ID = SCR000_WEB_ENTRY_PROCESS_ID;

// Opciones estáticas del filtro Estado. Estado es un valor OPERATIVO derivado de
// request.status + SLA (no un catálogo); por eso no viene de una colección. Tipo y
// Área sí usan colecciones (QD_COLLECTIONS.requestType / QD_COLLECTIONS.area).
export const SCR013_OPTIONS_ESTADO = [
  { value: '', label: 'Todos' },
  { value: 'Abierta', label: 'Abierta' },
  { value: 'Cerrada', label: 'Cerrada' },
  { value: 'Vencida', label: 'Vencida' },
  { value: 'Cancelada', label: 'Cancelada' },
] as const;

export const SCR013_FILTROS_DEFAULT: FiltrosDashboard = {
  filtroTipo: '',
  filtroEstado: '',
  filtroArea: '',
  filtroBuscar: '',
};
