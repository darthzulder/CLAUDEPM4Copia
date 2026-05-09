export interface OpcionesCotizacionData {
  frm_titulo: string;
  frm_caso: string;
  frm_gen_num_cotizacion: string;

  // Archivo del slip generado por PM4 (puede ser id numérico, objeto {id}, o array)
  output_slipCotizacionCo: unknown;

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

export const DECISION_OPTIONS = [
  { value: 'APROBADA',                   label: 'Cotización Aprobada' },
  { value: 'RECHAZADA',                  label: 'Cotización Rechazada' },
  { value: 'NUEVA',                      label: 'Generar nueva versión' },
  { value: 'PERSONALIZACION_EXCEPCION',  label: 'Requiere personalización/excepción' },
] as const;

export type DecisionValue = typeof DECISION_OPTIONS[number]['value'];
