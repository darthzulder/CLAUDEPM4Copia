// SP2 — Flujo Combinado: Detalle / Reasignación / Respuesta (SCR-0051 / PAN-05.1)
// Proceso: SP2 Gestionar Respuesta Interna y Revisión SAC
// Tareas: SP2-T01 (Asignar) / SP2-T03 (Reasignar) / SP2-T02 (Analizar y elaborar respuesta) / SP2-T05
// Rol: Analista SAC / Área Responsable
// Mockup: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx · pestaña SCR-0051
//
// Vista integrada que fusiona PAN-05 (detalle + asignación), PAN-06 (reasignación /
// solicitud de ayuda a otras áreas, hasta 4 ayudantes) y PAN-07 (elaboración de la
// respuesta al cliente). Reduce la navegación entre pantallas y centraliza la
// trazabilidad de la asignación y de la respuesta.
//
// data_name PM4 aún no entregados: se usan nombres descriptivos con prefijo `qd_`.
// Catálogos (CAT-*) ya activos en PM4 (CAT-AREA, CAT-USUARIOS-ROLE, CAT-MOTIVO-REASIG) →
// se consumen vía COLLECTION_DEFS + useCollection. Solo CAT-FAVOR sigue "Pendiente TI"
// (sin colección PM4 asignada aún, ver OPTIONS.favor).

import { GLOBAL_COLLECTIONS } from '../../../../core/collections';

export const MAX_AYUDANTES = 4;       // RUL-0051-08
export const MAX_SOPORTES = 10;       // FLD-113
export const SLA_UMBRAL_PRORROGA = 2; // RUL-0051-03 (slaRestante <= 2)

// Acción/decisión BPMN según el botón presionado.
export type AccionFlujoCombinado =
  | 'CONFIRMAR_ASIGNACION'   // ACT-0051-01 → SP2-T01, estado 'En análisis'
  | 'AYUDA'                  // ACT-0051-03 → solicitar ayuda a otra área (S6)
  | 'SOLICITAR_PRORROGA'     // ACT-0051-04 → SP4-T01
  | 'GUARDAR_BORRADOR'       // ACT-0051-07
  | 'ENVIAR';                // ACT-0051-08 → SP2-T04, estado 'En revisión SAC'

// ---------------------------------------------------------------------------
// Catálogos PM4 (CAT-*) — S5/S6
// ---------------------------------------------------------------------------
export const COLLECTION_DEFS = {
  // CAT-AREA. FLD-082 / FLD-091.
  area: GLOBAL_COLLECTIONS.qd_area,
  // CAT-USUARIOS-ROLE, dependiente de CAT-AREA. FLD-083 / FLD-092.
  usuariosRole: GLOBAL_COLLECTIONS.qd_usuariosRole,
  // CAT-MOTIVO-REASIG. FLD-093.
  motivoReasignacion: GLOBAL_COLLECTIONS.qd_motivoReasignacion,
};

// ---------------------------------------------------------------------------
// OPTIONS estáticas — solo catálogos aún sin colección PM4 confirmada
// ---------------------------------------------------------------------------
export const OPTIONS = {
  // CAT-FAVOR (Pendiente TI). FLD-350.
  favor: [
    { value: 'CLIENTE', label: 'Cliente' },
    { value: 'COMPANIA', label: 'Compañía' },
  ],
  // Toggle de UI para RUL-0051-07 (no es un FLD del insumo; ver DOCUMENTACION §10).
  sino: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
} as const;

// FLD-095 — una fila del historial de asignaciones (solo lectura).
// Los campos respondio/comentario/adjunto los completa SCR-0052 cuando el ayudante
// responde su subproceso (matcheado por qd_numeroAyuda ↔ índice de la fila).
export interface AsignacionHistorial {
  fecha: string;
  de: string;
  para: string;
  motivo: string;
  observaciones: string;
  respondio?: string;
  comentario?: string;
  adjunto?: string;
}

// Claves de adjuntos internos de soporte (FLD-113, S9). Máx. MAX_SOPORTES.
export const ADJUNTO_KEYS = [
  'qd_soporte_01', 'qd_soporte_02', 'qd_soporte_03', 'qd_soporte_04', 'qd_soporte_05',
  'qd_soporte_06', 'qd_soporte_07', 'qd_soporte_08', 'qd_soporte_09', 'qd_soporte_10',
] as const;

// ---------------------------------------------------------------------------
// Tipo del formulario — SCR-0051
// ---------------------------------------------------------------------------
export interface DetalleReasignacionRespuestaFormData {
  // ── Cabecera del caso (solo lectura, no es un FLD propio de SCR-0051) ──
  qd_idCasoBPM: string; // Número de caso BPM. FLD-300 en SCR-000 (unificado con SCR-002).
  qd_codigoSFC: string; // Código/radicado SFC devuelto al validar y radicar (SP1). FLD-120/140/173 en SCR-008/009/010.

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

  // ── S4 Estado SmartSupervision (solo lectura) ──
  qd_estadoSS:        string; // FLD-079 (badge)
  qd_intentosM1M2:    string; // FLD-080
  qd_fechaRadicacion: string; // FLD-081
  qd_slaRestante:     string; // (sistema) días hábiles restantes — RUL-0051-03

  // ── S5 Asignación de Responsable (condicional, RUL-0051-01) ──
  qd_tieneResponsable:     boolean; // flag: caso ya asignado (oculta S5)
  qd_areaResponsable:      string;  // FLD-082 (req.)
  qd_usuarioResponsable:   string;  // FLD-083 (req.)
  qd_observacionesAsignacion: string; // FLD-084

  // ── S6 Reasignación de Caso (condicional, RUL-0051-07) ──
  qd_necesitaOtrasAreas:      string; // toggle SI/NO (UI)
  qd_responsableActual:       string; // FLD-090 (solo lectura)
  qd_areaDestino:             string; // FLD-091 (req.)
  qd_nuevoResponsable:        string; // FLD-092 (auto, solo lectura)
  qd_motivoReasignacion:      string; // FLD-093 (req.)
  qd_observacionesReasignacion: string; // FLD-094 (req.)

  // ── S7 Historial de Asignaciones (solo lectura) ──
  qd_historialAsignaciones: AsignacionHistorial[]; // FLD-095
  // Número de la ayuda solicitada (1-based) = posición de la fila en el historial.
  // Viaja con el subproceso de ayuda para que SCR-0052 sepa a qué ayuda responder.
  qd_numeroAyuda: number;

  // ── S8 Elaboración de Respuesta Técnica ──
  qd_respuestaCliente: string;  // FLD-110 (req.)
  qd_accionesTomadas:  string;  // FLD-111 (visible si favor = Cliente)
  qd_reconocimiento:   string;  // FLD-112 (back, solo lectura)
  qd_observacionesSAC: string;  // FLD-131 en SCR-008 (solo lectura, visible si el SAC devolvió con observaciones)

  // ── S9 Soportes Internos (multi archivo, máx 10) ──
  qd_soporte_01: string; qd_soporte_02: string; qd_soporte_03: string; qd_soporte_04: string; qd_soporte_05: string;
  qd_soporte_06: string; qd_soporte_07: string; qd_soporte_08: string; qd_soporte_09: string; qd_soporte_10: string;

  // ── S10 Configuración de Respuesta ──
  qd_respuestaFavorDe: string; // FLD-350 (req.)

  // ── Metadato de flujo (no visible) ──
  qd_accion: AccionFlujoCombinado;
}

export const DEFAULTS: Partial<DetalleReasignacionRespuestaFormData> = {
  qd_tieneResponsable: false,
  qd_necesitaOtrasAreas: 'NO',
  qd_areaResponsable: '',
  qd_usuarioResponsable: '',
  qd_observacionesAsignacion: '',
  qd_areaDestino: '',
  qd_nuevoResponsable: '',
  qd_motivoReasignacion: '',
  qd_observacionesReasignacion: '',
  qd_historialAsignaciones: [],
  qd_numeroAyuda: 0,
  qd_respuestaCliente: '',
  qd_accionesTomadas: '',
  qd_respuestaFavorDe: '',
  qd_accion: 'ENVIAR',
};
