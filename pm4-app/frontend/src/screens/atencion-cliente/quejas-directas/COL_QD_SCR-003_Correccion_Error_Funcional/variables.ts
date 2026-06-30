// SP1-T05 — Corrección Error Funcional M1/M2 (SCR-003 / PAN-03)
// Proceso: SP1 Validar y Radicar ante SmartSupervision | Rol: Gestor de Experiencia
// Mockup: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx · pestaña SCR-003
//
// Panel al que el BPM (SP1) deriva el caso cuando SmartSupervision rechaza la
// radicación con un error 400 FUNCIONAL (datos inválidos, caracteres no permitidos,
// valor fuera de catálogo). El Gestor de Experiencia ve el detalle del error con el
// campo afectado y el valor rechazado, corrige SOLO ese campo y reenvía a
// SmartSupervision (vuelve a SP1-T02), o escala el caso a soporte técnico.
//
// data_name PM4 aún no entregados: se usan nombres descriptivos con prefijo `ef_`
// (Error Funcional). Se actualizarán cuando negocio/TI entreguen el diccionario final.

// Acción/decisión BPMN tomada según el botón presionado al enviar.
// CORREGIR_REENVIAR → ACT-003-01 (ejecuta SP1-T02, reenvío M2)
// ESCALAR_SOPORTE   → ACT-003-02 (deriva a Analista Técnico)
export type AccionErrorFuncional = 'CORREGIR_REENVIAR' | 'ESCALAR_SOPORTE';

// FLD-048 — Una fila del historial de intentos anteriores (solo lectura).
export interface IntentoHistorial {
  intento: number | string; // N.° de intento
  fecha: string;            // Fecha/hora del intento
  campoAfectado: string;    // Campo señalado en ese intento
  codigoError: string;      // Código de error devuelto por SmartSupervision
}

// Umbral de intentos a partir del cual se sugiere escalamiento técnico (RUL-003-02).
export const UMBRAL_INTENTOS = 3;

// ---------------------------------------------------------------------------
// Tipo del formulario — SP1-T05 (SCR-003)
// ---------------------------------------------------------------------------
export interface CorreccionErrorFuncionalFormData {
  // ── S1 Panel de Error SmartSupervision (solo lectura, inyectado por la API/BPM) ──
  ef_codigoErrorSFC:        string; // FLD-040 · Código HTTP + código funcional devuelto por SFC
  ef_campoAfectado:         string; // FLD-041 · Nombre exacto del campo rechazado
  ef_valorRechazado:        string; // FLD-042 · Valor enviado y rechazado
  ef_mensajeErrorSFC:       string; // FLD-043 · Mensaje literal devuelto por SmartSupervision
  ef_numeroIntento:         string; // FLD-044 · Intento N.° actual (M1/M2)
  ef_fechaRechazo:          string; // FLD-045 · Fecha/hora del rechazo (timestamp del log)

  // ── S2 Campo a Corregir (editable por el Gestor de Experiencia) ──
  ef_campoCorreccion:       string; // FLD-046 · Corrección del campo señalado (obligatorio)
  ef_justificacionCorreccion: string; // FLD-047 · Justificación de la corrección (opcional)

  // ── S3 Historial de Intentos (solo lectura) ──
  ef_historialIntentos:     IntentoHistorial[]; // FLD-048 · Tabla de intentos anteriores

  // ── Metadato de flujo (no visible) ──
  ef_accion:                AccionErrorFuncional; // acción/decisión BPMN seleccionada
}

// Valores por defecto para campos controlados por el formulario.
export const DEFAULTS: Partial<CorreccionErrorFuncionalFormData> = {
  ef_campoCorreccion: '',
  ef_justificacionCorreccion: '',
  ef_historialIntentos: [],
  ef_accion: 'CORREGIR_REENVIAR',
};
