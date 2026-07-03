// SP2-T02 — Respuesta del Área Responsable (SCR-0052 / PAN-05.2)
// Proceso: SP2 Gestionar Respuesta Interna y Revisión SAC | Rol: Área Responsable
// Mockup: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx · pestaña SCR-0052
//
// Vista del caso asignado al Área Responsable: muestra el expediente (consumidor,
// clasificación regulatoria M1, descripción y datos de la asignación, todo solo lectura)
// y permite registrar un comentario obligatorio con un adjunto de soporte, que quedan en
// el historial del caso.
//
// data_name PM4 aún no entregados: se usan nombres descriptivos con prefijo `qd_`.

export const MAX_ADJUNTO_MB = 10; // FLD-355 (máx 10 MB)
export const ADJUNTO_KEY = 'qd_adjuntoArea' as const; // FLD-355

// Acción/decisión BPMN según el botón presionado.
export type AccionRespuestaArea = 'ENVIAR' | 'GUARDAR_BORRADOR';

// ---------------------------------------------------------------------------
// Tipo del formulario — SCR-0052
// ---------------------------------------------------------------------------
export interface RespuestaAreaResponsableFormData {
  // ── S1 Datos del Consumidor (solo lectura, granulares desde SCR-000) ──
  qd_nombres:              string; // FLD-308 (persona natural)
  qd_apellidos:            string; // FLD-309 (persona natural)
  qd_razonSocial:          string; // FLD-310 (persona jurídica)
  qd_tipoIdentificacion:   string; // FLD-306
  qd_numeroIdentificacion: string; // FLD-307
  qd_correoElectronico:    string; // FLD-068
  qd_tipoPersona:          string; // FLD-069

  // ── S2 Clasificación Regulatoria (precargada M1, solo lectura) ──
  qd_canal:          string; // FLD-070
  qd_productoSFC:    string; // FLD-071
  qd_motivoSFC:      string; // FLD-072
  qd_instanciaRecepcion: string; // FLD-305
  qd_puntoRecepcion:     string; // FLD-304
  qd_admision:       string; // FLD-074
  qd_enteControl:    string; // FLD-075

  // ── S3 Descripción de la Queja (solo lectura) ──
  qd_textoQueja: string; // FLD-077 (el "Asunto de la Queja" se muestra con qd_motivoSFC)

  // ── S4 Datos de la Asignación (solo lectura) ──
  qd_areaResponsable:         string; // FLD-351 (= FLD-082 en SCR-0051)
  qd_usuarioResponsable:      string; // FLD-352 (= FLD-083 en SCR-0051)
  qd_observacionesAsignacion: string; // FLD-353

  // ── S5 Comentario y Adjunto (editable) ──
  qd_comentarioArea: string; // FLD-354 (obligatorio)
  qd_adjuntoArea:    string; // FLD-355 (nombre del archivo; binario en fileRegistry)

  // ── Metadato de flujo (no visible) ──
  qd_accion: AccionRespuestaArea;
}

export const DEFAULTS: Partial<RespuestaAreaResponsableFormData> = {
  qd_comentarioArea: '',
  qd_adjuntoArea: '',
  qd_accion: 'ENVIAR',
};
