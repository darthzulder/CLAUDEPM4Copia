// SP2-T01 — Revisar queja radicada y asignar responsable
// Proceso: SP2-T01 | Rol: Supervisor / Coordinador de Quejas

export const OPTIONS = {
  areaResponsable: [
    { value: 'EXPERIENCIA_CLIENTE', label: 'Experiencia al Cliente' },
    { value: 'SINIESTROS',          label: 'Siniestros' },
    { value: 'CUMPLIMIENTO',        label: 'Cumplimiento Regulatorio' },
    { value: 'JURIDICA',            label: 'Dirección Jurídica' },
    { value: 'TECNICA',             label: 'Área Técnica' },
    { value: 'DEFENSOR',            label: 'Defensor del Consumidor' },
    { value: 'OTRA',                label: 'Otra área' },
  ],
  prioridad: [
    { value: 'NORMAL',   label: 'Normal — plazo estándar 15 días hábiles' },
    { value: 'ALTA',     label: 'Alta — requiere atención prioritaria' },
    { value: 'CRITICA',  label: 'Crítica — riesgo regulatorio o reputacional' },
  ],
  decision: [
    { value: 'ASIGNAR',   label: 'Asignar y continuar gestión' },
    { value: 'DEVOLVER',  label: 'Devolver para corrección de datos' },
    { value: 'ESCALAR',   label: 'Escalar a supervisor senior' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Tipo del formulario — SP2-T01
// ---------------------------------------------------------------------------
export interface RevisarQuejaAsignarFormData {
  // Queja radicada — solo lectura (FLD-001 a FLD-010)
  qd_numeroCaso:           string;
  qd_codigoSS:             string;  // código SmartSupervision
  qd_fechaHoraCreacion:    string;
  qd_fechaLimiteRespuesta: string;
  qd_nombreConsumidor:     string;
  qd_tipoIdentificacion:   string;
  qd_numeroIdentificacion: string;
  qd_correoElectronico:    string;
  qd_productoSFC:          string;
  qd_motivoSFC:            string;
  qd_tipoSolicitud:        string;
  qd_canalRecepcion:       string;
  qd_asunto:               string;
  qd_descripcionQueja:     string;
  // Asignación (FLD-011 a FLD-015)
  ra_responsableAsignado:  string;
  ra_areaResponsable:      string;
  ra_prioridad:            string;
  ra_instrucciones:        string;
  // Revisión (FLD-016 a FLD-017)
  ra_observacionesRevision: string;
  ra_decision:              string;
}
