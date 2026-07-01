// SP4-T05 — Revisión Error Técnico Prórroga (SCR-011 / PAN-11)
// Proceso: SP4 Gestionar Prórroga Regulatoria | Rol: Analista Técnico
// Mockup: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx · pestaña SCR-011
//
// Pantalla a la que SP4 escala el caso cuando el envío del payload de PRÓRROGA a
// SmartSupervision falla por un error técnico. El Analista Técnico revisa el log del
// error, documenta causa raíz y corrección, y autoriza el reenvío (vuelve a SP4-T01) o
// escala el incidente al proveedor. Es el análogo de SCR-004 para el flujo de prórroga.
//
// data_name PM4 aún no entregados: se usan nombres descriptivos con prefijo `qd_`.

// Acción/decisión BPMN según el botón presionado.
// AUTORIZAR_REENVIO → ACT-011-01 (ejecuta SP4-T01) · ESCALAR_PROVEEDOR → ACT-011-02.
export type AccionErrorTecnicoProrroga = 'AUTORIZAR_REENVIO' | 'ESCALAR_PROVEEDOR';

// ---------------------------------------------------------------------------
// Tipo del formulario — SCR-011
// ---------------------------------------------------------------------------
export interface RevisionErrorTecnicoProrrogaFormData {
  // ── S1 Detalle del Error Técnico — Prórroga (solo lectura) ──
  qd_codigoHTTPProrroga:   string; // FLD-190
  qd_tipoErrorProrroga:    string; // FLD-191
  qd_mensajeTecnicoProrroga: string; // FLD-192
  qd_payloadProrroga:      string; // FLD-193 (JSON del payload enviado)
  qd_intentoProrroga:      string; // FLD-194

  // ── S2 Registro de Corrección — Prórroga (editable) ──
  qd_causaRaizProrroga:    string; // FLD-195 (obligatorio)
  qd_correccionProrroga:   string; // FLD-196 (obligatorio)

  // ── Metadato de flujo (no visible) ──
  qd_accion: AccionErrorTecnicoProrroga;
}

export const DEFAULTS: Partial<RevisionErrorTecnicoProrrogaFormData> = {
  qd_causaRaizProrroga: '',
  qd_correccionProrroga: '',
  qd_accion: 'AUTORIZAR_REENVIO',
};
