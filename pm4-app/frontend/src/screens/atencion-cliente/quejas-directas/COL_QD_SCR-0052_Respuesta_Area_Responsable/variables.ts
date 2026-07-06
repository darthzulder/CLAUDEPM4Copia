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

import type { AsignacionHistorial } from '../COL_QD_SCR-0051_Detalle_Reasignacion_Respuesta/variables';
import { GLOBAL_COLLECTIONS } from '../../../../core/collections';

export const MAX_ADJUNTO_MB = 10; // FLD-355 (máx 10 MB)
export const ADJUNTO_KEY = 'qd_adjuntoArea' as const; // FLD-355

// Catálogos para resolver código → descripción en los campos de solo lectura (S2/S3).
export const COLLECTION_DEFS = {
  canal: GLOBAL_COLLECTIONS.qd_canal,       // Canal de Recepción
  producto: GLOBAL_COLLECTIONS.qd_seguro,   // Producto SFC
  motivo: GLOBAL_COLLECTIONS.qd_motivo,     // Motivo SFC / Asunto de la Queja
  admision: GLOBAL_COLLECTIONS.qd_admision, // Admisión
};

// Acción/decisión BPMN según el botón presionado.
export type AccionRespuestaArea = 'ENVIAR' | 'GUARDAR_BORRADOR';

// Respuesta de un ayudante, guardada en un array diferenciado por su número de ayuda.
// El índice del array = qd_numeroAyuda - 1 (mismo índice que la fila del historial en SCR-0051).
export interface RespuestaAyuda {
  numero: number;      // qd_numeroAyuda (1-based)
  fecha: string;       // ISO YYYY-MM-DD
  respondio: string;   // usuario/área que respondió
  comentario: string;  // qd_comentarioArea
  adjunto: string;     // nombre del archivo adjunto (qd_adjuntoArea), '' si no hay
  adjuntoFileId?: number; // file_id devuelto por PM4 al subir (para descarga exacta)
}

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

  // ── Trazabilidad de la ayuda (viaja con el subproceso desde SCR-0051) ──
  qd_numeroAyuda:           number;                // ayuda a la que responde (1-based)
  qd_historialAsignaciones: AsignacionHistorial[]; // FLD-095, se actualiza la fila correspondiente
  qd_respuestasAyuda:       RespuestaAyuda[];       // array diferenciado por número de ayuda

  // ── Metadato de flujo (no visible) ──
  qd_accion: AccionRespuestaArea;
}

export const DEFAULTS: Partial<RespuestaAreaResponsableFormData> = {
  qd_comentarioArea: '',
  qd_adjuntoArea: '',
  qd_numeroAyuda: 0,
  qd_historialAsignaciones: [],
  qd_respuestasAyuda: [],
  qd_accion: 'ENVIAR',
};
