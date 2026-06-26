// SP1-T06 — Revisión Error Técnico API
// Proceso: Gestión de Quejas Directas | ACZ-QD-001 | Rol: Analista Técnico
// Mockup: Anexo02_Mockups_TOBE_QuejaDirectas_v3_0.xlsx · pestaña SCR-004
//
// Pantalla a la que el BPM (SP1) escala el caso cuando la integración con la API
// intermediaria de SmartSupervision falla por un error técnico tras varios intentos.
// El analista revisa el log del error, documenta causa/corrección y autoriza el
// reenvío del payload (vuelve a SP1-T02) o escala el incidente al proveedor.
//
// data_name PM4 aún no entregados: se usan nombres descriptivos con prefijo `et_`
// (Error Técnico). Se actualizarán cuando negocio/TI entreguen el diccionario final.

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
  et_codigoHttp:          string; // FLD-050 · Código HTTP (401, 500, 503, Timeout…)
  et_tipoError:           string; // FLD-051 · Autenticación / Timeout / Estructura payload / Servidor
  et_mensajeTecnico:      string; // FLD-052 · Stack trace o mensaje técnico completo de la API
  et_endpoint:            string; // FLD-053 · URL del endpoint de la API intermediaria
  et_payloadEnviado:      string; // FLD-054 · JSON del payload del intento fallido
  et_numeroIntento:       string; // FLD-055 · Número de intento acumulado

  // ── S2 Registro de Corrección Técnica (editable por el Analista Técnico) ──
  et_causaRaiz:           string; // FLD-056 · Causa Raíz Identificada (obligatorio)
  et_correccionAplicada:  string; // FLD-057 · Corrección Aplicada (obligatorio)
  et_requiereAjustePayload: string; // FLD-058 · ¿Requiere ajuste en payload? (SI/NO)

  // ── Metadato de flujo (no visible) ──
  et_accion:              AccionErrorTecnico; // acción/decisión BPMN seleccionada
}

// Valores por defecto para campos controlados por el formulario.
export const DEFAULTS: Partial<RevisionErrorTecnicoApiFormData> = {
  et_requiereAjustePayload: 'NO',
  et_accion: 'AUTORIZAR_REENVIO',
};
