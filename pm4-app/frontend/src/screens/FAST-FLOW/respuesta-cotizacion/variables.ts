// Tipos para la pantalla de Respuesta de Cotización (COL - FF - Form - Respuesta de Cotización)
export interface RespuestaCotizacionData {
  frm_titulo: string;
  frm_gen_num_cotizacion: string;
  frm_caso: string;

  // Determinan qué bloque se muestra
  frm_respuesta_cotizacion: string;
  frm_control_desde_optalitix_loss_ratio_calculado_flag: string;
  frm_conoceValorSumaRC: string;
  frm_valorRC_lossRatio_calculado: number | string;
}

// Valores posibles de frm_respuesta_cotizacion
export const RESPUESTA_VALUES = {
  REQUIERE_CASEUW:  'cotizacion_finalizada_requiere_caseuw',
  INTERMEDIARIO:    'cotizacion_finalizada_intermediario',
  ON_HOLD:          'cotizacion_on_hold',
} as const;
