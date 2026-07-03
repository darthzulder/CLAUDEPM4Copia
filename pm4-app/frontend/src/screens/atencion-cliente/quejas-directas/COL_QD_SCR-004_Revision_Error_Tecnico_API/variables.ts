// SP1-T06 — Revisión Error Técnico API
// Proceso: Gestión de Quejas Directas | ACZ-QD-001 | Rol: Analista Técnico
// Mockup: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx · pestaña SCR-004
//
// Pantalla a la que el BPM (SP1) escala el caso cuando la integración con la API
// intermediaria de SmartSupervision falla por un error técnico tras varios intentos.
// El analista revisa el log del error, documenta causa/corrección y autoriza el
// reenvío del payload (vuelve a SP1-T02) o escala el incidente al proveedor.
//
// data_name PM4 alineados a `qd_` + Nombre Técnico del Anexo02 (columna 03_Campos).
// Se actualizarán en el Anexo02 cuando negocio/TI entreguen el diccionario final.

export const OPTIONS = {
  // FLD-058 — ¿Requiere ajuste en payload? (Radio Sí/No)
  sino: [
    { value: 'SI', label: 'Sí' },
    { value: 'NO', label: 'No' },
  ],
} as const;

// Acción tomada por el analista (se setea según el botón presionado al enviar).
// AUTORIZAR_REENVIO → ACT-004-01 (ejecuta SP1-T02) · ESCALAR_PROVEEDOR → ACT-004-02.
export type AccionErrorTecnico = 'AUTORIZAR_REENVIO' | 'ESCALAR_PROVEEDOR';

// ---------------------------------------------------------------------------
// Tipo del formulario — SP1-T06 (SCR-004)
// ---------------------------------------------------------------------------
export interface RevisionErrorTecnicoApiFormData {
  // ── S1 Detalle del Error Técnico (solo lectura, inyectado por el BPM/API) ──
  qd_codigoHTTP:          string; // FLD-050 · Código HTTP (401, 500, 503, Timeout…)
  qd_tipoError:           string; // FLD-051 · Autenticación / Timeout / Estructura payload / Servidor
  qd_mensajeTecnicoAPI:      string; // FLD-052 · Stack trace o mensaje técnico completo de la API
  qd_endpointInvocado:            string; // FLD-053 · URL del endpoint de la API intermediaria
  qd_payloadEnviado:      string; // FLD-054 · JSON del payload del intento fallido
  qd_numeroIntento:       string; // FLD-055 · Número de intento acumulado

  // ── S2 Registro de Corrección Técnica (editable por el Analista Técnico) ──
  qd_causaRaiz:           string; // FLD-056 · Causa Raíz Identificada (obligatorio)
  qd_correccionAplicada:  string; // FLD-057 · Corrección Aplicada (obligatorio)
  qd_requiereAjustePayload: string; // FLD-058 · ¿Requiere ajuste en payload? (SI/NO)

  // ── Metadato de flujo (no visible) ──
  qd_accion:              AccionErrorTecnico; // acción/decisión BPMN seleccionada
}

// Valores por defecto para campos controlados por el formulario.
export const DEFAULTS: Partial<RevisionErrorTecnicoApiFormData> = {
  qd_requiereAjustePayload: 'NO',
  qd_accion: 'AUTORIZAR_REENVIO',
};
