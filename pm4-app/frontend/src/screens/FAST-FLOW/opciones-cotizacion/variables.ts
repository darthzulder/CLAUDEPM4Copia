export interface OpcionesCotizacionData {
  frm_titulo: string;
  frm_caso: string;
  frm_gen_num_cotizacion: string;

  // Productos activos
  frm_gen_prod_dyo?: unknown;
  frm_gen_prod_cc?: unknown;
  frm_gen_prod_pdysi?: unknown;
  frm_gen_prod_pi?: unknown;

  // Slips generados por el script PHP (un ID de archivo por línea activa)
  output_slipCotizacion_dyo?: unknown;
  output_slipCotizacion_cc?: unknown;
  output_slipCotizacion_pdysi?: unknown;
  output_slipCotizacion_pi?: unknown;

  // Legacy (campo único anterior)
  output_slipCotizacionCo?: unknown;

  // Decisión del usuario
  frm_respCot_decision: string;
  frm_respCot_comentarios: string;
  frm_respCot_motizoRechazo: string;
  frm_respCot_personalizacion_excepcion: string;

  // Computed / informativos
  frm_cot_seleccion_procede: string;
  frm_metodo_pago_cop: string;
  frm_gen_enlace_clausulado_rc: string;
}

export const LINEAS_CONFIG = [
  { key: 'dyo',   label: 'D&O',                     prodField: 'frm_gen_prod_dyo'   as const, slipField: 'output_slipCotizacion_dyo'   as const },
  { key: 'cc',    label: 'Crimen Comercial',          prodField: 'frm_gen_prod_cc'    as const, slipField: 'output_slipCotizacion_cc'    as const },
  { key: 'pdysi', label: 'Protección de Datos y SI',  prodField: 'frm_gen_prod_pdysi' as const, slipField: 'output_slipCotizacion_pdysi' as const },
  { key: 'pi',    label: 'Seg. Profesional',          prodField: 'frm_gen_prod_pi'    as const, slipField: 'output_slipCotizacion_pi'    as const },
] as const;

export const DECISION_OPTIONS = [
  { value: 'APROBADA',                   label: 'Cotización Aprobada' },
  { value: 'RECHAZADA',                  label: 'Cotización Rechazada' },
  { value: 'NUEVA',                      label: 'Generar nueva versión' },
  { value: 'PERSONALIZACION_EXCEPCION',  label: 'Requiere personalización/excepción' },
] as const;

export type DecisionValue = typeof DECISION_OPTIONS[number]['value'];
