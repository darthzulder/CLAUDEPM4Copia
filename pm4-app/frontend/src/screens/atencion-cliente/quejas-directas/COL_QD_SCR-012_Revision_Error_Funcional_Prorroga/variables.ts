// SP4-T06 — Corrección Error Funcional Prórroga (SCR-012 / PAN-12)
// Proceso: SP4 Gestionar Prórroga Regulatoria | Rol: Analista SAC / Área Responsable
// Mockup: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx · pestaña SCR-012
//
// Panel al que SP4 deriva el caso cuando SmartSupervision rechaza la solicitud de
// PRÓRROGA con un error 400 funcional. El Analista SAC / Área Responsable corrige los
// campos de la prórroga (motivo, nueva fecha límite, contador, justificación) y reenvía
// (vuelve a SP4-T01) o cancela la prórroga. Es el análogo de SCR-003 para prórroga.
//
// data_name PM4 aún no entregados: se usan nombres descriptivos con prefijo `qd_`.
// CAT-MOTIVO-PRORR está "Pendiente TI" en 07_Catalogs → OPTIONS placeholder (ver DOCUMENTACION §10).

// Acción/decisión BPMN según el botón presionado.
// REENVIAR → ACT-012-01 (ejecuta SP4-T01) · CANCELAR → ACT-012-02.
export type AccionErrorFuncionalProrroga = 'REENVIAR' | 'CANCELAR';

// ---------------------------------------------------------------------------
// OPTIONS estáticas (placeholder de catálogo — pendiente de parametrización SFC)
// ---------------------------------------------------------------------------
export const OPTIONS = {
  // CAT-MOTIVO-PRORR (Pendiente TI, sin valores de ejemplo en el insumo → placeholder).
  motivoProrroga: [
    { value: 'COMPLEJIDAD', label: 'Complejidad del caso' },
    { value: 'INFO_ADICIONAL', label: 'Requiere información adicional del cliente' },
    { value: 'AREA_EXTERNA', label: 'Dependencia de área/tercero externo' },
    { value: 'VOLUMEN', label: 'Alto volumen de casos' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Tipo del formulario — SCR-012
// ---------------------------------------------------------------------------
export interface ErrorFuncionalProrrogaFormData {
  // ── S1 Panel de Error — Prórroga (solo lectura) ──
  qd_codigoErrorProrroga:  string; // FLD-200
  qd_campoAfectadoProrroga: string; // FLD-201
  qd_mensajeErrorProrroga: string; // FLD-202
  qd_intentoActualProrroga: string; // FLD-203

  // ── S2 Campos de Prórroga a Corregir (editable) ──
  qd_motivoProrroga:        string; // FLD-204 (CAT-MOTIVO-PRORR, obligatorio)
  qd_nuevaFechaLimite:      string; // FLD-205 (fecha ISO, > hoy, obligatorio)
  qd_contadorProrroga:      string; // FLD-206 (número, obligatorio)
  qd_justificacionProrroga: string; // FLD-207 (obligatorio)

  // ── Metadato de flujo (no visible) ──
  qd_accion: AccionErrorFuncionalProrroga;
}

export const DEFAULTS: Partial<ErrorFuncionalProrrogaFormData> = {
  qd_motivoProrroga: '',
  qd_nuevaFechaLimite: '',
  qd_contadorProrroga: '',
  qd_justificacionProrroga: '',
  qd_accion: 'REENVIAR',
};
