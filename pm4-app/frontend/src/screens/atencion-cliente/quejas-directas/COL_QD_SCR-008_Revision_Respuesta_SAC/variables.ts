// SP2-T04 — Revisión Respuesta SAC (SCR-008 / PAN-08)
// Proceso: SP2 Gestionar Respuesta Interna y Revisión SAC | Rol: Analista SAC
// Mockup: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx · pestaña SCR-008
//
// Pantalla de revisión y aprobación: el Analista SAC revisa el borrador de respuesta
// elaborado por el Área Responsable (solo lectura) y lo APRUEBA (→ SP2-T06 genera PDF) o
// lo DEVUELVE con observaciones (→ SP2-T05 / PAN-07, "Ajuste en progreso"). También puede
// reasignar el caso o ver la vista previa de la carta final.
//
// data_name PM4 aún no entregados: se usan nombres descriptivos con prefijo `qd_`.

export const SLA_UMBRAL_CRITICO = 3; // RUL-008-02 (slaRestante <= 3)

// Acción/decisión BPMN según el botón presionado.
export type AccionRevisionSAC = 'APROBAR' | 'DEVOLVER' | 'REASIGNAR';

// FLD-130 — un soporte interno adjunto (solo visualización).
export interface SoporteAdjunto {
  nombre: string;
}

// ---------------------------------------------------------------------------
// Tipo del formulario — SCR-008
// ---------------------------------------------------------------------------
export interface RevisionRespuestaSacFormData {
  // ── S1 Contexto del Caso (solo lectura) ──
  qd_idCasoSFC:       string; // FLD-120
  qd_slaRestante:     string; // FLD-121 (días hábiles restantes)
  qd_versionRevision: string; // FLD-122
  qd_areaResponsable: string; // FLD-123
  qd_fechaElaboracion: string; // FLD-124

  // ── S2 Respuesta del Área (solo lectura, elaborada en PAN-05.1) ──
  qd_respuestaCliente: string;          // FLD-127
  qd_accionesTomadas:  string;          // FLD-128
  qd_reconocimiento:   string;          // FLD-129
  qd_adjuntosSoporte:  SoporteAdjunto[]; // FLD-130 (lista de adjuntos)

  // ── S3 Decisión del Analista SAC ──
  qd_observacionesSAC: string; // FLD-131 (obligatorio al devolver)

  // ── Metadato de flujo (no visible) ──
  qd_accion: AccionRevisionSAC;
}

export const DEFAULTS: Partial<RevisionRespuestaSacFormData> = {
  qd_adjuntosSoporte: [],
  qd_observacionesSAC: '',
  qd_accion: 'APROBAR',
};
