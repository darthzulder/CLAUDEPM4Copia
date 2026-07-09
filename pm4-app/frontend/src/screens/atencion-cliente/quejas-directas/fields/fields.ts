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
  strSex: 'qd_strSex',                                 // FLD-320 · antes qd_sexo (back)
  strLgbtiq: 'qd_strLgbtiq',                           // FLD-321 · antes qd_lgbtiq (back, oculto)
  strSpecialCondition: 'qd_strSpecialCondition',       // FLD-322 · antes qd_condicionEspecial (back, oculto)

  // ── SCR-000 · S3 Detalle de la Queja ──────────────────────────────────────
  strSfcProduct: 'qd_strSfcProduct',                   // FLD-323 · antes qd_productoSFC
  strPlate: 'qd_strPlate',                             // Anexo02 #25 (nuevo) · placa del vehículo (solo producto = Autos)
  strProductDetail: 'qd_strProductDetail',             // FLD-324 · antes qd_detalleProducto (back)
  strReply: 'qd_strReply',                             // FLD-325 · antes qd_replica
  strReplyArgument: 'qd_strReplyArgument',             // FLD-326 · antes qd_argumentoReplica
  strOmbudsmanEscalation: 'qd_strOmbudsmanEscalation', // FLD-327 · antes qd_escalamientoDefensor
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

  // ── SCR-009 · Formulario Superintendencia ─────────────────────────────────
  strDigitalProduct: 'qd_strDigitalProduct',           // FLD-149 · antes qd_productoDigital
  strComplaintStatus: 'qd_strComplaintStatus',         // FLD-150/174 · antes qd_estadoQueja (unificado SCR-009/010)
  strFavorability: 'qd_strFavorability',               // FLD-151/177 · antes qd_favorabilidad
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
  strReplyFavorOf: 'qd_strReplyFavorOf',               // FLD-350 · antes qd_respuestaFavorDe

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
  qd_strFinalReplyPdf: string;
  qd_strExtensionDays: string;

  // SCR-010
  qd_strM3ClosureStatus: string;
  qd_strM3ClosureAttempts: string;
  qd_strLastError: string;
  qd_strUpdateDate: string;
  qd_strClosureDate: string;
  qd_strNamingValidation: string;
  qd_strFinalReplyAttach: string;

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
  qd_strReplyFavorOf: string;

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
  requestType: GLOBAL_COLLECTIONS.qd_tipoSolicitud,
  filerRole: GLOBAL_COLLECTIONS.qd_rol,
  idType: GLOBAL_COLLECTIONS.qd_tipoIdentificacion,
  countryCode: GLOBAL_COLLECTIONS.qd_pais,
  department: GLOBAL_COLLECTIONS.qd_departamento,
  city: GLOBAL_COLLECTIONS.qd_ciudad,
  specialCondition: GLOBAL_COLLECTIONS.qd_condicionEspecial,
  lgbtiq: GLOBAL_COLLECTIONS.qd_lgbtiq,
  sfcProduct: GLOBAL_COLLECTIONS.qd_seguro,
  productDetail: GLOBAL_COLLECTIONS.qd_detalleProducto,
  sfcReason: GLOBAL_COLLECTIONS.qd_motivo, // Legacy (id 17) — usado por SCR-002/0051/0052 en modo display.
  // cat_matriz_motivos (id 45): matriz completa; SCR-000 deriva en cliente momento →
  // servicio → motivo (ver SeccionDetalleQueja).
  matrixMotivos: GLOBAL_COLLECTIONS.qd_matrizMotivos,
  admission: GLOBAL_COLLECTIONS.qd_admision,
  sex: GLOBAL_COLLECTIONS.qd_sexo,
  controlEntity: GLOBAL_COLLECTIONS.qd_ente,
  tutela: GLOBAL_COLLECTIONS.qd_tutela,
  expressComplaint: GLOBAL_COLLECTIONS.qd_quejaExpres,
  receptionInstance: GLOBAL_COLLECTIONS.qd_instancia,
  receptionPoint: GLOBAL_COLLECTIONS.qd_puntoRecepcion,
  personType: GLOBAL_COLLECTIONS.qd_tipoPersona,
  channel: GLOBAL_COLLECTIONS.qd_canal,
  alliance: GLOBAL_COLLECTIONS.qd_alianza,
  digitalProduct: GLOBAL_COLLECTIONS.qd_prodDigital,
  complaintStatus: GLOBAL_COLLECTIONS.qd_estadoQueja,
  favorability: GLOBAL_COLLECTIONS.qd_favorabilidad,
  acceptance: GLOBAL_COLLECTIONS.qd_aceptacion,
  rectification: GLOBAL_COLLECTIONS.qd_rectificacion,
  withdrawal: GLOBAL_COLLECTIONS.qd_desistimiento,
  marking: GLOBAL_COLLECTIONS.qd_marcacion,
  fraudType: GLOBAL_COLLECTIONS.qd_tipoFraude,
  fraudModality: GLOBAL_COLLECTIONS.qd_modFraude,
  area: GLOBAL_COLLECTIONS.qd_area,
  areaUsers: GLOBAL_COLLECTIONS.qd_usuariosRole,
  reassignReason: GLOBAL_COLLECTIONS.qd_motivoReasignacion,
  extensionReason: GLOBAL_COLLECTIONS.qd_motivoProrroga,
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
  [QD.strSex]: '',                // FLD-320 — Back, resuelto desde CAT-SEXO ("No informa")
  [QD.strLgbtiq]: '',             // FLD-321 — Back, oculto, resuelto desde CAT-LGBTIQ ("No informa")
  [QD.strSpecialCondition]: '',   // FLD-322 — Back, oculto, resuelto desde CAT-COND-ESP ("NINGUNA")
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
  | typeof QD.strOmbudsmanEscalation | typeof QD.strInteraction | typeof QD.strServiceProvided
  | typeof QD.strSfcReason | typeof QD.strComplaintText
  | typeof QD.strAttach01 | typeof QD.strAttach02 | typeof QD.strAttach03 | typeof QD.strAttach04 | typeof QD.strAttach05
  | typeof QD.strAdmission | typeof QD.strControlEntity | typeof QD.strTutela | typeof QD.strExpressComplaint
  | typeof QD.blnDataAuth | typeof QD.blnCaptcha | typeof QD.strCcEmail
  | typeof QD.strSmartSupStatus | typeof QD.strSfcFilingDate | typeof QD.strAssigneeRole | typeof QD.strAssignee
>;

export const SCR000_DEFAULTS = {
  ...QD_GLOBAL_DEFAULTS,
  [QD.strCountryCode]: DEFAULT_COUNTRY_CODE, // RUL-000-10
  [QD.strReply]: 'NO',
  [QD.strPlate]: '',          // Anexo02 #25 — solo se llena si producto = Autos
  [QD.strInteraction]: '',    // Anexo02 #30 — cascada cat_matriz_motivos
  [QD.strServiceProvided]: '', // Anexo02 #31 — cascada cat_matriz_motivos (Asistencias)
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
  | typeof QD.strClientResponse | typeof QD.strActionsTaken | typeof QD.strAcknowledgment | typeof QD.lstSupportAttach
  | typeof QD.strSacRemarks | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionRevisionSAC };

export const SCR008_DEFAULTS: Partial<RevisionRespuestaSacFormData> = {
  [QD.lstSupportAttach]: [],
  [QD.strSacRemarks]: '',
  [QD.strAction]: 'APROBAR',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-009 — Formulario Superintendencia
// ═══════════════════════════════════════════════════════════════════════════

export type AccionFormularioSFC = 'GUARDAR' | 'GUARDAR_BORRADOR';

// CAT-LGBTIQ ⚠ PENDIENTE CRÍTICO — catálogo no confirmado con TI (placeholder).
export const SCR009_OPTIONS_LGBTIQ = [
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
  { value: 'NI', label: 'No informa' },
] as const;

// Selects obligatorios de SmartSupervision (S2 + S3) — validados por RUL-009-03.
export const SCR009_CAMPOS_SFC_OBLIGATORIOS = [
  QD.strSex, QD.strLgbtiq, QD.strSpecialCondition, QD.strDigitalProduct,
  QD.strComplaintStatus, QD.strFavorability, QD.strAcceptance, QD.strRectification,
  QD.strWithdrawal, QD.strTutela, QD.strMarking, QD.strExpressComplaint,
] as const;

// Campos de fraude obligatorios cuando relacionadaFraude = Sí (RUL-009-01).
export const SCR009_CAMPOS_FRAUDE = [
  QD.strFraudType, QD.strFraudModality, QD.strClaimedAmount, QD.strAcknowledgedAmount,
] as const;

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
  | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionFormularioSFC };

export const SCR009_DEFAULTS: Partial<FormularioSuperintendenciaFormData> = {
  [QD.strSex]: '', [QD.strLgbtiq]: '', [QD.strSpecialCondition]: '', [QD.strDigitalProduct]: '',
  [QD.strComplaintStatus]: '', [QD.strFavorability]: '', [QD.strAcceptance]: '',
  // Defaults de negocio (CATALOGOS v2): rectificación código 1, desistimiento código 2.
  [QD.strRectification]: '1',
  [QD.strWithdrawal]: '2',
  [QD.strTutela]: '', [QD.strMarking]: '', [QD.strExpressComplaint]: '',
  [QD.strFraudRelated]: 'NO',
  [QD.strFraudType]: '', [QD.strFraudModality]: '', [QD.strClaimedAmount]: '', [QD.strAcknowledgedAmount]: '',
  [QD.strIncludesComplaintAnnex]: '', [QD.strIncludesReplyAttach]: 'SI', [QD.strExtensionDays]: '0',
  [QD.strAction]: 'GUARDAR',
};

// ═══════════════════════════════════════════════════════════════════════════
// SCR-010 — Cierre Regulatorio Momento 3
// ═══════════════════════════════════════════════════════════════════════════

export const SCR010_REGEX_NOMENCLATURA_PDF = /^[^_]+_[^_]+_RESP_FINAL_SFC_\d+\.pdf$/i;

export type CierreM3FormData = Pick<QdFields,
  | typeof QD.strM3ClosureStatus | typeof QD.strM3ClosureAttempts | typeof QD.strLastError
  | typeof QD.strSfcCode | typeof QD.strComplaintStatus | typeof QD.strUpdateDate | typeof QD.strClosureDate
  | typeof QD.strFavorability | typeof QD.strAcceptance | typeof QD.strMarking | typeof QD.strExpressComplaint
  | typeof QD.strFinalReplyPdf | typeof QD.strNamingValidation | typeof QD.strFinalReplyAttach
  | typeof QD.strFraudRelated | typeof QD.strFraudType | typeof QD.strClaimedAmount | typeof QD.strAcknowledgedAmount
>;

export const SCR010_CAMPOS_OBLIGATORIOS = [
  QD.strSfcCode, QD.strComplaintStatus, QD.strUpdateDate, QD.strClosureDate,
  QD.strFavorability, QD.strAcceptance, QD.strMarking, QD.strExpressComplaint, QD.strFinalReplyAttach,
] as const;

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

// CAT-FAVOR (Pendiente TI). FLD-350.
export const SCR0051_OPTIONS_FAVOR = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'COMPANIA', label: 'Compañía' },
] as const;

export const SCR0051_ADJUNTO_KEYS = [
  QD.strSupport01, QD.strSupport02, QD.strSupport03, QD.strSupport04, QD.strSupport05,
  QD.strSupport06, QD.strSupport07, QD.strSupport08, QD.strSupport09, QD.strSupport10,
] as const;

export type DetalleReasignacionRespuestaFormData = Omit<Pick<QdFields,
  | typeof QD.strBpmCaseId | typeof QD.strSfcCode
  | typeof QD.strFirstName | typeof QD.strLastName | typeof QD.strCompanyName
  | typeof QD.strIdType | typeof QD.strIdNumber | typeof QD.strEmail | typeof QD.strPersonType
  | typeof QD.strChannel | typeof QD.strSfcProduct | typeof QD.strSfcReason
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
  | typeof QD.strReplyFavorOf | typeof QD.strExtensionReason
  | typeof QD.strAction
>, typeof QD.strAction> & { [QD.strAction]: AccionFlujoCombinado };

export const SCR0051_DEFAULTS: Partial<DetalleReasignacionRespuestaFormData> = {
  [QD.blnHasAssignee]: false,
  [QD.strNeedsOtherAreas]: 'NO',
  [QD.strAssigneeArea]: '',
  [QD.strAssigneeUser]: '',
  [QD.strAssignmentRemarks]: '',
  [QD.strTargetArea]: '',
  [QD.strNewAssignee]: '',
  [QD.strReassignReason]: '',
  [QD.strReassignRemarks]: '',
  [QD.lstAssignHistory]: [],
  [QD.intHelpNumber]: 0,
  [QD.strClientResponse]: '',
  [QD.strActionsTaken]: '',
  [QD.strReplyFavorOf]: '',
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
